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
    return {
      id: dbUser.id,
      email: dbUser.email,
      firstName: dbUser.first_name,
      lastName: dbUser.last_name,
      fullName: `${dbUser.first_name || ''} ${dbUser.last_name || ''}`.trim(),
      tenantId: dbUser.tenant_id,
      status: dbUser.status,
      emailVerified: dbUser.email_verified,
      mfaEnabled: dbUser.mfa_enabled,
      lastLoginAt: dbUser.last_login_at,
      createdAt: dbUser.created_at,
      updatedAt: dbUser.updated_at,
    };
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
      const userResult = await pool.query(
        `SELECT id, email, first_name, last_name, tenant_id, status, email_verified, mfa_enabled, last_login_at, created_at, updated_at
         FROM users
         WHERE id = $1 AND (tenant_id = $2 OR tenant_id IS NULL)`,
        [userId, tenantId]
      );

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

      // Get user permissions
      const permissionsResult = await pool.query(
        `SELECT DISTINCT m.menu_key, rp.action_key
         FROM user_roles ur
         JOIN roles r ON ur.role_id = r.id
         JOIN role_permissions rp ON r.id = rp.role_id
         JOIN modules m ON rp.module_id = m.id
         WHERE ur.user_id = $1 AND rp.status = 'active'`,
        [userId]
      );

      const permissions = permissionsResult.rows.reduce((acc, row) => {
        if (!acc[row.menu_key]) acc[row.menu_key] = [];
        acc[row.menu_key].push(row.action_key);
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
   * List users with pagination
   */
  static async listUsers(tenantId, page = 1, limit = 20, search = '') {
    try {
      const offset = (page - 1) * limit;

      // Search condition
      const searchCondition = search
        ? "AND (u.email ILIKE $4 OR u.first_name ILIKE $4 OR u.last_name ILIKE $4)"
        : '';

      const baseQuery = `
        SELECT u.id, u.email, u.first_name, u.last_name, u.tenant_id, u.status, u.email_verified, u.last_login_at, u.created_at
        FROM users u
        WHERE (u.tenant_id = $1 OR (u.tenant_id IS NULL AND $1 IS NULL))
        ${searchCondition}
      `;

      const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery}) as t`;
      const dataQuery = `${baseQuery} ORDER BY u.created_at DESC LIMIT $2 OFFSET $3`;

      const countParams = search ? [tenantId, search] : [tenantId];
      const dataParams = search ? [tenantId, limit, offset, `%${search}%`] : [tenantId, limit, offset];

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

      if (updateData.mfa_enabled !== undefined) {
        fieldsToUpdate.push(`mfa_enabled = $${paramCount++}`);
        values.push(updateData.mfa_enabled);
      }

      values.push(userId);
      values.push(tenantId);

      const query = `
        UPDATE users
        SET ${fieldsToUpdate.join(', ')}, updated_at = NOW()
        WHERE id = $${paramCount} AND (tenant_id = $${paramCount + 1} OR tenant_id IS NULL)
        RETURNING id, email, first_name, last_name, tenant_id, status, email_verified, mfa_enabled, last_login_at, created_at, updated_at
      `;

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
  static async auditLog(userId, tenantId, action, entityType, entityId, changes) {
    try {
      await pool.query(
        `INSERT INTO audit_logs (user_id, tenant_id, action, entity_type, entity_id, changes, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [userId, tenantId, action, entityType, entityId, JSON.stringify(changes), 'success']
      );
    } catch (err) {
      logger.error(`Audit log error: ${err.message}`);
    }
  }
}

module.exports = UserService;
