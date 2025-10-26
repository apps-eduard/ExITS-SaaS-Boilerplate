/**
 * User Service
 * Handles user management operations (CRUD, search, role assignment)
 */

const bcrypt = require('bcryptjs');
const pool = require('../config/database');
const logger = require('../utils/logger');

class UserService {
  /**
   * Transform database user object to camelCase
   */
  static transformUser(dbUser) {
    if (!dbUser) return null;
    
    const user = {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.first_name,
      lastName: dbUser.last_name,
      fullName: `${dbUser.first_name || ''} ${dbUser.last_name || ''}`.trim(),
      tenantId: dbUser.tenant_id,
      status: dbUser.status,
      emailVerified: dbUser.email_verified,
      mfaEnabled: dbUser.mfa_enabled || false,
      lastLogin: dbUser.last_login,
      createdAt: dbUser.created_at,
      updatedAt: dbUser.updated_at,
    };

    // Add tenant information if available (from JOIN query)
    if (dbUser.tenant_name !== undefined) {
      user.tenant = {
        id: dbUser.tenant_id,
        name: dbUser.tenant_name,
        subdomain: dbUser.tenant_subdomain
      };
    }

    return user;
  }

  /**
   * Create a new user
   */
  static async createUser(userData, requestingUserId, tenantId) {
    try {
      // Check if user already exists
      const existingUser = await pool.query(
        `SELECT id FROM users WHERE email = $1`,
        [userData.email]
      );

      if (existingUser.rows.length > 0) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(userData.password, 10);

      // Handle both camelCase and snake_case field names
      const firstName = userData.firstName || userData.first_name || '';
      const lastName = userData.lastName || userData.last_name || '';
      const userTenantId = userData.tenantId !== undefined ? userData.tenantId : (userData.tenant_id !== undefined ? userData.tenant_id : tenantId);

      const result = await pool.query(
        `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, status, email_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, email, first_name, last_name, tenant_id, status, email_verified, created_at, updated_at`,
        [userTenantId, userData.email, passwordHash, firstName, lastName, userData.status || 'active', false]
      );

      const dbUser = result.rows[0];
      const user = this.transformUser(dbUser);

      // Assign role if provided (handle both camelCase and snake_case)
      const roleId = userData.roleId || userData.role_id;
      if (roleId) {
        await pool.query(
          `INSERT INTO user_roles (user_id, role_id)
           VALUES ($1, $2)`,
          [user.id, roleId]
        );
      }

      // Audit log
      await this.auditLog(requestingUserId, userTenantId, 'create', 'user', user.id, userData);

      logger.info(`User created: ${user.email}`);
      return user;
    } catch (err) {
      logger.error(`User service create error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Get user by ID with roles and permissions
   */
  static async getUserById(userId, tenantId) {
    try {
      // System admins (tenantId = null) can view any user, tenant admins can only view their own tenant users
      const query = tenantId 
        ? `SELECT id, email, first_name, last_name, tenant_id, status, email_verified, mfa_enabled, last_login, created_at, updated_at
           FROM users
           WHERE id = $1 AND (tenant_id = $2 OR tenant_id IS NULL)`
        : `SELECT id, email, first_name, last_name, tenant_id, status, email_verified, mfa_enabled, last_login, created_at, updated_at
           FROM users
           WHERE id = $1`;

      const params = tenantId ? [userId, tenantId] : [userId];
      const userResult = await pool.query(query, params);

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = this.transformUser(userResult.rows[0]);

      // Get user roles
      const rolesResult = await pool.query(
        `SELECT r.id, r.name, r.space
         FROM user_roles ur
         JOIN roles r ON ur.role_id = r.id
         WHERE ur.user_id = $1`,
        [userId]
      );

      // Get user permissions using the new standard RBAC system
      const permissionsResult = await pool.query(
        `SELECT DISTINCT p.resource, p.action, p.permission_key
         FROM user_roles ur
         JOIN roles r ON ur.role_id = r.id
         JOIN role_permissions rps ON r.id = rps.role_id
         JOIN permissions p ON rps.permission_id = p.id
         WHERE ur.user_id = $1`,
        [userId]
      );

      const permissions = permissionsResult.rows.reduce((acc, row) => {
        if (!acc[row.resource]) acc[row.resource] = [];
        acc[row.resource].push(row.action);
        return acc;
      }, {});

      return {
        ...user,
        roles: rolesResult.rows,
        permissions,
      };
    } catch (err) {
      logger.error(`User service get by ID error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Check if an email exists. If tenantId is provided, return true if any user with that email exists
   * within the same tenant or as a system user. If tenantId is null, check globally.
   */
  static async emailExists(email, tenantId = null) {
    try {
      let query;
      let params;
      if (tenantId) {
        // For tenant-scoped check, allow system users and tenant users with same tenant
        query = `SELECT 1 FROM users WHERE LOWER(email) = LOWER($1) AND (tenant_id = $2 OR tenant_id IS NULL) LIMIT 1`;
        params = [email, tenantId];
      } else {
        query = `SELECT 1 FROM users WHERE LOWER(email) = LOWER($1) LIMIT 1`;
        params = [email];
      }

      const result = await pool.query(query, params);
      return result.rows.length > 0;
    } catch (err) {
      logger.error(`User service emailExists error: ${err.message}`);
      throw err;
    }
  }

  /**
   * List users with pagination
   */
  static async listUsers(tenantId, page = 1, limit = 20, search = '', includeAllTenants = false) {
    try {
      const offset = (page - 1) * limit;

      // Search condition
      const searchCondition = search
        ? "AND (u.email ILIKE $3 OR u.first_name ILIKE $3 OR u.last_name ILIKE $3)"
        : '';

      // Tenant filter - if includeAllTenants is true, don't filter by tenant
      const tenantFilter = includeAllTenants ? '' : 'WHERE (u.tenant_id = $1 OR (u.tenant_id IS NULL AND $1 IS NULL))';

      const baseQuery = `
        SELECT u.id, u.email, u.first_name, u.last_name, u.tenant_id, u.status, u.email_verified, u.last_login, u.created_at,
               t.name as tenant_name, t.subdomain as tenant_subdomain
        FROM users u
        LEFT JOIN tenants t ON u.tenant_id = t.id
        ${tenantFilter}
        ${searchCondition}
      `;

      const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery}) as t`;
      const dataQuery = `${baseQuery} ORDER BY u.created_at DESC LIMIT ${includeAllTenants ? '$1' : '$2'} OFFSET ${includeAllTenants ? '$2' : '$3'}`;

      const countParams = includeAllTenants 
        ? (search ? [`%${search}%`] : [])
        : (search ? [tenantId, `%${search}%`] : [tenantId]);
      
      const dataParams = includeAllTenants
        ? (search ? [limit, offset, `%${search}%`] : [limit, offset])
        : (search ? [tenantId, limit, offset, `%${search}%`] : [tenantId, limit, offset]);

      const [countResult, dataResult] = await Promise.all([
        pool.query(countQuery, countParams),
        pool.query(dataQuery, dataParams),
      ]);

      // Transform snake_case to camelCase and fetch roles for each user
      const users = await Promise.all(
        dataResult.rows.map(async (row) => {
          const user = this.transformUser(row);
          
          // Fetch roles for this user
          const rolesQuery = `
            SELECT r.id, r.name, r.description, r.space
            FROM roles r
            INNER JOIN user_roles ur ON ur.role_id = r.id
            WHERE ur.user_id = $1
          `;
          const rolesResult = await pool.query(rolesQuery, [row.id]);
          user.roles = rolesResult.rows;
          
          return user;
        })
      );

      return {
        users,
        pagination: {
          page,
          limit,
          total: parseInt(countResult.rows[0].total),
          pages: Math.ceil(parseInt(countResult.rows[0].total) / limit),
        },
      };
    } catch (err) {
      logger.error(`User service list error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Update user
   */
  static async updateUser(userId, updateData, requestingUserId, tenantId) {
    try {
      const fieldsToUpdate = [];
      const values = [];
      let paramCount = 1;

      // Handle both camelCase and snake_case
      const firstName = updateData.firstName || updateData.first_name;
      const lastName = updateData.lastName || updateData.last_name;
      const status = updateData.status;

      if (firstName !== undefined) {
        fieldsToUpdate.push(`first_name = $${paramCount++}`);
        values.push(firstName);
      }

      if (lastName !== undefined) {
        fieldsToUpdate.push(`last_name = $${paramCount++}`);
        values.push(lastName);
      }

      if (status !== undefined) {
        fieldsToUpdate.push(`status = $${paramCount++}`);
        values.push(status);
      }

      // Note: mfa_enabled column doesn't exist in database, removed

      // Check if there are fields to update
      if (fieldsToUpdate.length === 0) {
        throw new Error('No fields to update');
      }

      // Always update updated_at
      fieldsToUpdate.push('updated_at = NOW()');

      values.push(userId);

      // System admins (tenantId = null) can update any user, tenant admins can only update their own tenant users
      let query;
      if (tenantId) {
        values.push(tenantId);
        query = `
          UPDATE users
          SET ${fieldsToUpdate.join(', ')}
          WHERE id = $${paramCount} AND (tenant_id = $${paramCount + 1} OR tenant_id IS NULL)
          RETURNING id, email, first_name, last_name, tenant_id, status, email_verified, mfa_enabled, created_at, updated_at
        `;
      } else {
        query = `
          UPDATE users
          SET ${fieldsToUpdate.join(', ')}
          WHERE id = $${paramCount}
          RETURNING id, email, first_name, last_name, tenant_id, status, email_verified, mfa_enabled, created_at, updated_at
        `;
      }

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = this.transformUser(result.rows[0]);

      await this.auditLog(requestingUserId, tenantId, 'update', 'user', userId, updateData);

      logger.info(`User updated: ${userId}`);
      return user;
    } catch (err) {
      logger.error(`User service update error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Delete user (soft delete)
   */
  static async deleteUser(userId, requestingUserId, tenantId) {
    try {
      const result = await pool.query(
        `UPDATE users SET status = 'deleted', deleted_at = NOW() WHERE id = $1 RETURNING id`,
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error('User not found');
      }

      await this.auditLog(requestingUserId, tenantId, 'delete', 'user', userId, {});

      logger.info(`User deleted: ${userId}`);
      return { message: 'User deleted successfully' };
    } catch (err) {
      logger.error(`User service delete error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Restore user (from soft delete)
   */
  static async restoreUser(userId, requestingUserId, tenantId) {
    try {
      const result = await pool.query(
        `UPDATE users SET status = 'active', deleted_at = NULL WHERE id = $1 AND status = 'deleted' RETURNING id, email, first_name, last_name, tenant_id, status, email_verified, mfa_enabled, created_at, updated_at`,
        [userId]
      );

      if (result.rows.length === 0) {
        throw new Error('User not found or not deleted');
      }

      const user = this.transformUser(result.rows[0]);

      await this.auditLog(requestingUserId, tenantId, 'restore', 'user', userId, {});

      logger.info(`User restored: ${userId}`);
      return user;
    } catch (err) {
      logger.error(`User service restore error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Assign role to user
   */
  static async assignRole(userId, roleId, requestingUserId, tenantId) {
    try {
      const result = await pool.query(
        `INSERT INTO user_roles (user_id, role_id) VALUES ($1, $2)
         ON CONFLICT (user_id, role_id) DO NOTHING
         RETURNING user_id, role_id`,
        [userId, roleId]
      );

      await this.auditLog(requestingUserId, tenantId, 'assign_role', 'user', userId, { role_id: roleId });

      return result.rows[0] || { message: 'Role already assigned' };
    } catch (err) {
      logger.error(`User service assign role error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Remove role from user
   */
  static async removeRole(userId, roleId, requestingUserId, tenantId) {
    try {
      const result = await pool.query(
        `DELETE FROM user_roles WHERE user_id = $1 AND role_id = $2
         RETURNING user_id, role_id`,
        [userId, roleId]
      );

      if (result.rows.length === 0) {
        throw new Error('Role assignment not found');
      }

      await this.auditLog(requestingUserId, tenantId, 'remove_role', 'user', userId, { role_id: roleId });

      return { message: 'Role removed successfully' };
    } catch (err) {
      logger.error(`User service remove role error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Get user permissions
   */
  static async getUserPermissions(userId) {
    try {
      const result = await pool.query(
        `SELECT DISTINCT m.menu_key, rp.action_key
         FROM user_roles ur
         JOIN roles r ON ur.role_id = r.id
         JOIN role_permissions rp ON r.id = rp.role_id
         JOIN modules m ON rp.module_id = m.id
         WHERE ur.user_id = $1 AND rp.status = 'active'`,
        [userId]
      );

      return result.rows.reduce((acc, row) => {
        if (!acc[row.menu_key]) acc[row.menu_key] = [];
        acc[row.menu_key].push(row.action_key);
        return acc;
      }, {});
    } catch (err) {
      logger.error(`User service get permissions error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Audit log helper
   */
  static async auditLog(userId, tenantId, action, resourceType, resourceId, changes) {
    try {
      await pool.query(
        `INSERT INTO audit_logs (user_id, tenant_id, action, resource_type, resource_id, new_values, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, tenantId, action, resourceType, resourceId, JSON.stringify(changes), 'success']
      );
    } catch (err) {
      logger.error(`Audit log error: ${err.message}`);
    }
  }

  /**
   * Assign product access to a user
   */
  static async assignProductAccess(userId, products, requestingUserId, tenantId) {
    try {
      // First, get the user to get their tenant_id
      const userResult = await pool.query(
        `SELECT id, tenant_id FROM users WHERE id = $1`,
        [userId]
      );

      if (userResult.rows.length === 0) {
        throw new Error('User not found');
      }

      const user = userResult.rows[0];
      const userTenantId = user.tenant_id || tenantId;

      if (!userTenantId) {
        throw new Error('Cannot assign product access to system users');
      }

      // Get or create employee_profile for this user
      let employeeResult = await pool.query(
        `SELECT id FROM employee_profiles WHERE user_id = $1`,
        [userId]
      );

      let employeeId;
      if (employeeResult.rows.length === 0) {
        // Create employee profile
        const createEmployeeResult = await pool.query(
          `INSERT INTO employee_profiles (tenant_id, user_id, employee_code, hire_date, employment_status, department, position)
           VALUES ($1, $2, $3, $4, $5, $6, $7)
           RETURNING id`,
          [
            userTenantId,
            userId,
            `EMP-${userId}`,
            new Date(),
            'active',
            'General',
            'Employee'
          ]
        );
        employeeId = createEmployeeResult.rows[0].id;
        logger.info(`Created employee profile for user ${userId}`);
      } else {
        employeeId = employeeResult.rows[0].id;
      }

      // Delete existing product access for this employee
      await pool.query(
        `DELETE FROM employee_product_access WHERE employee_id = $1`,
        [employeeId]
      );

      // Insert new product access records
      const insertedProducts = [];
      for (const product of products) {
        const result = await pool.query(
          `INSERT INTO employee_product_access (
            tenant_id, employee_id, user_id, product_type, access_level, is_primary,
            can_approve_loans, max_approval_amount, can_disburse_funds, can_view_reports,
            assigned_by, status
          ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
          RETURNING id, product_type, access_level, is_primary`,
          [
            userTenantId,
            employeeId,
            userId,
            product.productType,
            product.accessLevel || 'view',
            product.isPrimary || false,
            product.canApproveLoans || false,
            product.maxApprovalAmount || null,
            product.canDisburseFunds || false,
            product.canViewReports || false,
            requestingUserId,
            'active'
          ]
        );
        insertedProducts.push(result.rows[0]);
      }

      await this.auditLog(requestingUserId, userTenantId, 'assign_product_access', 'user', userId, { products });

      logger.info(`Product access assigned to user ${userId}: ${insertedProducts.length} products`);
      return insertedProducts;
    } catch (err) {
      logger.error(`User service assign product access error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Get user product access
   */
  static async getUserProducts(userId, tenantId) {
    try {
      const result = await pool.query(
        `SELECT 
          epa.id,
          epa.product_type,
          epa.access_level,
          epa.is_primary,
          epa.can_approve_loans,
          epa.max_approval_amount,
          epa.can_disburse_funds,
          epa.can_view_reports,
          epa.can_modify_interest,
          epa.can_waive_penalties,
          epa.daily_transaction_limit,
          epa.monthly_transaction_limit,
          epa.max_daily_transactions,
          epa.status,
          epa.assigned_date,
          epa.created_at
         FROM employee_product_access epa
         JOIN employee_profiles ep ON epa.employee_id = ep.id
         WHERE epa.user_id = $1 AND epa.status = 'active'
         ${tenantId ? 'AND epa.tenant_id = $2' : ''}
         ORDER BY epa.is_primary DESC, epa.created_at ASC`,
        tenantId ? [userId, tenantId] : [userId]
      );

      return result.rows.map(row => ({
        id: row.id,
        productType: row.product_type,
        accessLevel: row.access_level,
        isPrimary: row.is_primary,
        canApproveLoans: row.can_approve_loans,
        maxApprovalAmount: row.max_approval_amount,
        canDisburseFunds: row.can_disburse_funds,
        canViewReports: row.can_view_reports,
        canModifyInterest: row.can_modify_interest,
        canWaivePenalties: row.can_waive_penalties,
        dailyTransactionLimit: row.daily_transaction_limit,
        monthlyTransactionLimit: row.monthly_transaction_limit,
        maxDailyTransactions: row.max_daily_transactions,
        status: row.status,
        assignedDate: row.assigned_date,
        createdAt: row.created_at
      }));
    } catch (err) {
      logger.error(`User service get products error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Reset user password
   * @param {number} userId - User ID
   * @param {string} newPassword - New password
   * @param {number} requestingUserId - ID of user requesting the reset
   * @param {number} tenantId - Tenant ID for isolation
   * @returns {Promise<boolean>} Success status
   */
  static async resetPassword(userId, newPassword, requestingUserId, tenantId) {
    try {
      // Verify user exists and belongs to tenant
      const user = await this.getUserById(userId, tenantId);
      if (!user) {
        throw new Error('User not found');
      }

      // Hash new password
      const passwordHash = await bcrypt.hash(newPassword, 10);

      // Update password
      await pool.query(
        'UPDATE users SET password_hash = $1, updated_at = NOW() WHERE id = $2 AND tenant_id = $3',
        [passwordHash, userId, tenantId]
      );

      // Audit log
      await this.auditLog(
        requestingUserId,
        tenantId,
        'password_reset',
        'user',
        userId,
        { action: 'Password reset by admin' }
      );

      logger.info(`Password reset for user ${userId} by user ${requestingUserId}`);
      return true;
    } catch (err) {
      logger.error(`User service reset password error: ${err.message}`);
      throw err;
    }
  }
}

module.exports = UserService;
