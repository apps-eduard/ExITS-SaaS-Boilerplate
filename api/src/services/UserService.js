/**
 * User Service
 * Handles user management operations (CRUD, search, role assignment)
 * NOTE: Fully converted to Knex with automatic camelCase/snake_case conversion
 */

const bcrypt = require('bcryptjs');
const knex = require('../config/knex');
const logger = require('../utils/logger');

class UserService {
  /**
   * Transform database user object to camelCase
   * NOTE: This method is now deprecated - Knex handles conversion automatically
   * Keeping for backwards compatibility during migration
   */
  static transformUser(dbUser) {
    if (!dbUser) return null;
    
    // With Knex, data is already in camelCase, so just return it
    // If data comes from old pool.query, it will still work
    const user = {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.firstName || dbUser.first_name,
      lastName: dbUser.lastName || dbUser.last_name,
      fullName: `${dbUser.firstName || dbUser.first_name || ''} ${dbUser.lastName || dbUser.last_name || ''}`.trim(),
      tenantId: dbUser.tenantId || dbUser.tenant_id,
      status: dbUser.status,
      emailVerified: dbUser.emailVerified || dbUser.email_verified,
      mfaEnabled: dbUser.mfaEnabled || dbUser.mfa_enabled || false,
      lastLogin: dbUser.lastLogin || dbUser.last_login,
      createdAt: dbUser.createdAt || dbUser.created_at,
      updatedAt: dbUser.updatedAt || dbUser.updated_at,
    };

    // Add tenant information if available (from JOIN query)
    if (dbUser.tenant_name !== undefined) {
      user.tenant = {
        id: dbUser.tenant_id,
        name: dbUser.tenant_name,
        subdomain: dbUser.tenant_subdomain
      };
    }

    // Add employee profile information if available (from JOIN query)
    if (dbUser.position !== undefined || dbUser.department !== undefined) {
      user.position = dbUser.position;
      user.department = dbUser.department;
      user.employment_type = dbUser.employment_type;
      user.employment_status = dbUser.employment_status;
      user.hire_date = dbUser.hire_date;
    }

    return user;
  }

  /**
   * Create a new user
   */
  static async createUser(userData, requestingUserId, tenantId) {
    try {
      // Check if user already exists
      const existingUser = await knex('users')
        .where({ email: userData.email })
        .first();

      if (existingUser) {
        throw new Error('User with this email already exists');
      }

      // Hash password
      const passwordHash = await bcrypt.hash(userData.password, 10);

      // Handle both camelCase and snake_case field names (during migration)
      const firstName = userData.firstName || userData.first_name || '';
      const lastName = userData.lastName || userData.last_name || '';
      const userTenantId = userData.tenantId !== undefined ? userData.tenantId : (userData.tenant_id !== undefined ? userData.tenant_id : tenantId);

      // Insert user using Knex (automatic camelCase → snake_case conversion)
      const [user] = await knex('users')
        .insert({
          tenantId: userTenantId,
          email: userData.email,
          passwordHash,
          firstName,
          lastName,
          status: userData.status || 'active',
          emailVerified: false
        })
        .returning(['id', 'email', 'firstName', 'lastName', 'tenantId', 'status', 'emailVerified', 'createdAt', 'updatedAt']);

      // Assign role if provided (handle both camelCase and snake_case)
      const roleId = userData.roleId || userData.role_id;
      if (roleId) {
        await knex('userRoles').insert({
          userId: user.id,
          roleId
        });
      }

      // Audit log
      await this.auditLog(requestingUserId, userTenantId, 'create', 'user', user.id, userData);

      logger.info(`User created: ${user.email}`);
      return user;  // Already in camelCase from Knex
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
      let query = knex('users as u')
        .select(
          'u.id',
          'u.email',
          'u.firstName',
          'u.lastName',
          'u.tenantId',
          'u.status',
          'u.emailVerified',
          'u.mfaEnabled',
          'u.lastLogin',
          'u.createdAt',
          'u.updatedAt',
          't.name as tenantName',
          't.subdomain as tenantSubdomain'
        )
        .leftJoin('tenants as t', 'u.tenantId', 't.id')
        .where('u.id', userId);

      if (tenantId) {
        query = query.andWhere(function() {
          this.where('u.tenantId', tenantId).orWhereNull('u.tenantId');
        });
      }

      const user = await query.first();

      if (!user) {
        throw new Error('User not found');
      }

      // Get user roles using Knex
      const roles = await knex('userRoles as ur')
        .select('r.id', 'r.name', 'r.space')
        .join('roles as r', 'ur.roleId', 'r.id')
        .where('ur.userId', userId);

      // Get user permissions using the new standard RBAC system
      const permissionsData = await knex('userRoles as ur')
        .select('p.resource', 'p.action', 'p.permissionKey')
        .join('roles as r', 'ur.roleId', 'r.id')
        .join('rolePermissions as rps', 'r.id', 'rps.roleId')
        .join('permissions as p', 'rps.permissionId', 'p.id')
        .where('ur.userId', userId)
        .distinct();

      const permissions = permissionsData.reduce((acc, row) => {
        if (!acc[row.resource]) acc[row.resource] = [];
        acc[row.resource].push(row.action);
        return acc;
      }, {});

      return {
        ...user,
        roles,
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
      let query = knex('users')
        .where(knex.raw('LOWER(email) = LOWER(?)', [email]));

      if (tenantId) {
        // For tenant-scoped check, allow system users and tenant users with same tenant
        query = query.andWhere(function() {
          this.where('tenantId', tenantId).orWhereNull('tenantId');
        });
      }

      const result = await query.first();
      return !!result;
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

      // Build base query with Knex
      let query = knex('users as u')
        .select(
          'u.id',
          'u.email',
          'u.firstName',
          'u.lastName',
          'u.tenantId',
          'u.status',
          'u.emailVerified',
          'u.lastLogin',
          'u.createdAt',
          't.name as tenantName',
          't.subdomain as tenantSubdomain',
          'ep.position',
          'ep.department',
          'ep.employmentType',
          'ep.employmentStatus',
          'ep.hireDate'
        )
        .leftJoin('tenants as t', 'u.tenantId', 't.id')
        .leftJoin('employeeProfiles as ep', 'u.id', 'ep.userId');

      // Apply tenant filter
      if (!includeAllTenants) {
        query = query.where(function() {
          if (tenantId !== null && tenantId !== undefined) {
            // Specific tenant: show users of that tenant OR system users
            this.where('u.tenantId', tenantId).orWhereNull('u.tenantId');
          } else {
            // No tenant (system context): show only system users (tenantId is null)
            this.whereNull('u.tenantId');
          }
        });
      }

      // Apply search filter
      if (search) {
        const searchPattern = `%${search}%`;
        query = query.andWhere(function() {
          this.where('u.email', 'ilike', searchPattern)
            .orWhere('u.firstName', 'ilike', searchPattern)
            .orWhere('u.lastName', 'ilike', searchPattern);
        });
      }

      // Get total count
      const countQuery = query.clone().clearSelect().clearOrder().count('* as total');
      const [{ total }] = await countQuery;

      // Get paginated data
      const users = await query
        .orderBy('u.createdAt', 'desc')
        .limit(limit)
        .offset(offset);

      // Fetch roles and platforms for each user
      const usersWithDetails = await Promise.all(
        users.map(async (user) => {
          // Fetch roles for this user
          const roles = await knex('roles as r')
            .select('r.id', 'r.name', 'r.description', 'r.space')
            .innerJoin('userRoles as ur', 'ur.roleId', 'r.id')
            .where('ur.userId', user.id);
          
          // Fetch platform access for this user
          const platformsResult = await knex('employee_product_access')
            .select('product_type')
            .where({ user_id: user.id, status: 'active' });
          
          const platforms = platformsResult.map(p => p.product_type || p.productType);
          
          return {
            ...user,
            roles,
            platforms,
          };
        })
      );

      return {
        users: usersWithDetails,
        pagination: {
          page,
          limit,
          total: parseInt(total),
          pages: Math.ceil(parseInt(total) / limit),
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
      // Handle both camelCase and snake_case (during migration)
      const updateFields = {};

      if (updateData.firstName !== undefined || updateData.first_name !== undefined) {
        updateFields.firstName = updateData.firstName || updateData.first_name;
      }

      if (updateData.lastName !== undefined || updateData.last_name !== undefined) {
        updateFields.lastName = updateData.lastName || updateData.last_name;
      }

      if (updateData.status !== undefined) {
        updateFields.status = updateData.status;
      }

      // Check if there are fields to update
      if (Object.keys(updateFields).length === 0) {
        throw new Error('No fields to update');
      }

      // Always update updatedAt
      updateFields.updatedAt = knex.fn.now();

      // Build query with tenant restriction
      let query = knex('users')
        .update(updateFields)
        .where('id', userId);

      if (tenantId) {
        query = query.andWhere(function() {
          this.where('tenantId', tenantId).orWhereNull('tenantId');
        });
      }

      const [user] = await query.returning([
        'id',
        'email',
        'firstName',
        'lastName',
        'tenantId',
        'status',
        'emailVerified',
        'mfaEnabled',
        'createdAt',
        'updatedAt',
      ]);

      if (!user) {
        throw new Error('User not found');
      }

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
      const [user] = await knex('users')
        .update({
          status: 'deleted',
          deletedAt: knex.fn.now(),
        })
        .where('id', userId)
        .returning('id');

      if (!user) {
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
      const [user] = await knex('users')
        .update({
          status: 'active',
          deletedAt: null,
        })
        .where({ id: userId, status: 'deleted' })
        .returning([
          'id',
          'email',
          'firstName',
          'lastName',
          'tenantId',
          'status',
          'emailVerified',
          'mfaEnabled',
          'createdAt',
          'updatedAt',
        ]);

      if (!user) {
        throw new Error('User not found or not deleted');
      }

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
      await knex('userRoles')
        .insert({ userId, roleId })
        .onConflict(['userId', 'roleId'])
        .ignore();

      await this.auditLog(requestingUserId, tenantId, 'assign_role', 'user', userId, { roleId });

      return { message: 'Role assigned successfully' };
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
      const deleted = await knex('userRoles')
        .where({ userId, roleId })
        .del();

      if (!deleted) {
        throw new Error('Role assignment not found');
      }

      await this.auditLog(requestingUserId, tenantId, 'remove_role', 'user', userId, { roleId });

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
      const permissions = await knex('userRoles as ur')
        .select('m.menuKey', 'rp.actionKey')
        .join('roles as r', 'ur.roleId', 'r.id')
        .join('rolePermissions as rp', 'r.id', 'rp.roleId')
        .join('modules as m', 'rp.moduleId', 'm.id')
        .where({ 'ur.userId': userId, 'rp.status': 'active' })
        .distinct();

      return permissions.reduce((acc, row) => {
        if (!acc[row.menuKey]) acc[row.menuKey] = [];
        acc[row.menuKey].push(row.actionKey);
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
      await knex('auditLogs').insert({
        userId,
        tenantId,
        action,
        resourceType,
        resourceId,
        newValues: JSON.stringify(changes),
        status: 'success',
      });
    } catch (err) {
      logger.error(`Audit log error: ${err.message}`);
    }
  }

  /**
   * Assign product access to a user
   */
  static async assignProductAccess(userId, products, requestingUserId, tenantId) {
    try {
      // First, get the user to get their tenantId
      const user = await knex('users')
        .select('id', 'tenantId')
        .where({ id: userId })
        .first();

      if (!user) {
        throw new Error('User not found');
      }

      const userTenantId = user.tenantId || tenantId;

      if (!userTenantId) {
        throw new Error('Cannot assign product access to system users');
      }

      // Get or create employee_profile for this user
      const employee = await knex('employee_profiles')
        .select('id')
        .where({ user_id: userId })
        .first();

      let employeeId;
      if (!employee) {
        // Create employee profile
        const [newEmployee] = await knex('employee_profiles')
          .insert({
            tenant_id: userTenantId,
            user_id: userId,
            employee_code: `EMP-${userId}`,
            hire_date: new Date(),
            employment_status: 'active',
            department: 'General',
            position: 'Employee',
          })
          .returning('id');
        employeeId = newEmployee.id;
        logger.info(`Created employee profile for user ${userId}`);
      } else {
        employeeId = employee.id;
      }

      // Delete existing product access for this employee
      await knex('employee_product_access')
        .where({ employee_id: employeeId })
        .del();

      // Insert new product access records
      const insertedProducts = [];
      for (const product of products) {
        const [newAccess] = await knex('employee_product_access')
          .insert({
            tenant_id: userTenantId,
            employee_id: employeeId,
            user_id: userId,
            product_type: product.productType,
            access_level: product.accessLevel || 'view',
            is_primary: product.isPrimary || false,
            can_approve_loans: product.canApproveLoans || false,
            max_approval_amount: product.maxApprovalAmount || null,
            can_disburse_funds: product.canDisburseFunds || false,
            can_view_reports: product.canViewReports || false,
            assigned_by: requestingUserId,
            status: 'active',
          })
          .returning(['id', 'product_type', 'access_level', 'is_primary']);
        insertedProducts.push(newAccess);
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
      let query = knex('employee_product_access as epa')
        .select(
          'epa.id',
          'epa.product_type',
          'epa.access_level',
          'epa.is_primary',
          'epa.can_approve_loans',
          'epa.max_approval_amount',
          'epa.can_disburse_funds',
          'epa.can_view_reports',
          'epa.can_modify_interest',
          'epa.can_waive_penalties',
          'epa.daily_transaction_limit',
          'epa.monthly_transaction_limit',
          'epa.max_daily_transactions',
          'epa.status',
          'epa.assigned_date',
          'epa.created_at'
        )
        .join('employee_profiles as ep', 'epa.employee_id', 'ep.id')
        .where({ 'epa.user_id': userId, 'epa.status': 'active' });

      if (tenantId) {
        query = query.andWhere('epa.tenant_id', tenantId);
      }

      const products = await query.orderBy([
        { column: 'epa.is_primary', order: 'desc' },
        { column: 'epa.created_at', order: 'asc' },
      ]);

      return products;
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
      await knex('users')
        .update({
          passwordHash,
          updatedAt: knex.fn.now(),
        })
        .where({ id: userId, tenantId });

      // Audit log
      await this.auditLog(
        requestingUserId,
        tenantId,
        'password_reset',
        'user',
        userId,
        { action: 'Password reset by admin' },
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
