/**
 * Role Service
 * Handles role management, permissions assignment, and role hierarchy
 */

const pool = require('../config/database');
const logger = require('../utils/logger');

class RoleService {
  /**
   * Create a new role
   */
  static async createRole(roleData, requestingUserId, tenantId) {
    try {
      const result = await pool.query(
        `INSERT INTO roles (tenant_id, name, description, space, parent_role_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, tenant_id, name, description, space, parent_role_id, created_at`,
        [
          tenantId,
          roleData.name,
          roleData.description || null,
          roleData.space || 'tenant',
          roleData.parent_role_id || null,
        ]
      );

      const role = result.rows[0];

      await this.auditLog(requestingUserId, tenantId, 'create', 'role', role.id, roleData);

      logger.info(`Role created: ${role.name} (${role.id})`);
      return role;
    } catch (err) {
      logger.error(`Role service create error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Get role by ID with permissions
   */
  static async getRoleById(roleId, tenantId) {
    try {
      const roleResult = await pool.query(
        `SELECT id, tenant_id, name, description, space, parent_role_id, created_at, updated_at
         FROM roles
         WHERE id = $1 AND (tenant_id = $2 OR tenant_id IS NULL)`,
        [roleId, tenantId]
      );

      if (roleResult.rows.length === 0) {
        throw new Error('Role not found');
      }

      const role = roleResult.rows[0];

      // Get permissions
      const permissionsResult = await pool.query(
        `SELECT rp.id, m.menu_key, m.display_name, rp.action_key, rp.constraints, rp.status
         FROM role_permissions rp
         JOIN modules m ON rp.module_id = m.id
         WHERE rp.role_id = $1`,
        [roleId]
      );

      return {
        ...role,
        permissions: permissionsResult.rows,
      };
    } catch (err) {
      logger.error(`Role service get by ID error: ${err.message}`);
      throw err;
    }
  }

  /**
   * List roles with pagination
   */
  static async listRoles(tenantId, page = 1, limit = 20, space = null) {
    try {
      const offset = (page - 1) * limit;

      const spaceCondition = space ? `AND space = $3` : '';
      const baseQuery = `
        SELECT id, name, description, space, parent_role_id, created_at
        FROM roles
        WHERE tenant_id = $1 OR (tenant_id IS NULL AND $1::uuid IS NULL)
        ${spaceCondition}
      `;

      const countQuery = `SELECT COUNT(*) as total FROM (${baseQuery}) as t`;
      const dataQuery = `${baseQuery} ORDER BY created_at DESC LIMIT $${space ? 4 : 3} OFFSET $${space ? 5 : 4}`;

      const countParams = space ? [tenantId, space] : [tenantId];
      const dataParams = space ? [tenantId, space, limit, offset] : [tenantId, limit, offset];

      const [countResult, dataResult] = await Promise.all([
        pool.query(countQuery, countParams),
        pool.query(dataQuery, dataParams),
      ]);

      return {
        roles: dataResult.rows,
        pagination: {
          page,
          limit,
          total: parseInt(countResult.rows[0].total),
          pages: Math.ceil(parseInt(countResult.rows[0].total) / limit),
        },
      };
    } catch (err) {
      logger.error(`Role service list error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Update role
   */
  static async updateRole(roleId, updateData, requestingUserId, tenantId) {
    try {
      const fieldsToUpdate = [];
      const values = [];
      let paramCount = 1;

      if (updateData.name !== undefined) {
        fieldsToUpdate.push(`name = $${paramCount++}`);
        values.push(updateData.name);
      }

      if (updateData.description !== undefined) {
        fieldsToUpdate.push(`description = $${paramCount++}`);
        values.push(updateData.description);
      }

      if (updateData.parent_role_id !== undefined) {
        fieldsToUpdate.push(`parent_role_id = $${paramCount++}`);
        values.push(updateData.parent_role_id);
      }

      values.push(roleId);
      values.push(tenantId);

      const query = `
        UPDATE roles
        SET ${fieldsToUpdate.join(', ')}, updated_at = NOW()
        WHERE id = $${paramCount} AND (tenant_id = $${paramCount + 1} OR tenant_id IS NULL)
        RETURNING id, name, description, space
      `;

      const result = await pool.query(query, values);

      if (result.rows.length === 0) {
        throw new Error('Role not found');
      }

      await this.auditLog(requestingUserId, tenantId, 'update', 'role', roleId, updateData);

      logger.info(`Role updated: ${roleId}`);
      return result.rows[0];
    } catch (err) {
      logger.error(`Role service update error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Delete role
   */
  static async deleteRole(roleId, requestingUserId, tenantId) {
    try {
      // Check if role has users assigned
      const usersResult = await pool.query(
        `SELECT COUNT(*) as count FROM user_roles WHERE role_id = $1`,
        [roleId]
      );

      if (usersResult.rows[0].count > 0) {
        throw new Error('Cannot delete role with assigned users');
      }

      const result = await pool.query(
        `DELETE FROM roles WHERE id = $1 AND (tenant_id = $2 OR tenant_id IS NULL)
         RETURNING id`,
        [roleId, tenantId]
      );

      if (result.rows.length === 0) {
        throw new Error('Role not found');
      }

      await this.auditLog(requestingUserId, tenantId, 'delete', 'role', roleId, {});

      logger.info(`Role deleted: ${roleId}`);
      return { message: 'Role deleted successfully' };
    } catch (err) {
      logger.error(`Role service delete error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Grant permission to role
   */
  static async grantPermission(roleId, moduleId, actionKey, constraints = null, requestingUserId, tenantId) {
    try {
      const result = await pool.query(
        `INSERT INTO role_permissions (role_id, module_id, action_key, constraints, status)
         VALUES ($1, $2, $3, $4, $5)
         ON CONFLICT (role_id, module_id, action_key) DO UPDATE SET status = 'active'
         RETURNING id, role_id, module_id, action_key, status`,
        [roleId, moduleId, actionKey, constraints ? JSON.stringify(constraints) : null, 'active']
      );

      await this.auditLog(requestingUserId, tenantId, 'grant_permission', 'role', roleId, {
        module_id: moduleId,
        action_key: actionKey,
      });

      return result.rows[0];
    } catch (err) {
      logger.error(`Role service grant permission error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Revoke permission from role
   */
  static async revokePermission(roleId, moduleId, actionKey, requestingUserId, tenantId) {
    try {
      const result = await pool.query(
        `DELETE FROM role_permissions
         WHERE role_id = $1 AND module_id = $2 AND action_key = $3
         RETURNING id`,
        [roleId, moduleId, actionKey]
      );

      if (result.rows.length === 0) {
        throw new Error('Permission not found');
      }

      await this.auditLog(requestingUserId, tenantId, 'revoke_permission', 'role', roleId, {
        module_id: moduleId,
        action_key: actionKey,
      });

      return { message: 'Permission revoked successfully' };
    } catch (err) {
      logger.error(`Role service revoke permission error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Get all permissions for a role (including inherited from parent)
   */
  static async getRolePermissionsWithInheritance(roleId) {
    try {
      const result = await pool.query(
        `WITH RECURSIVE role_hierarchy AS (
          SELECT id, parent_role_id FROM roles WHERE id = $1
          UNION ALL
          SELECT r.id, r.parent_role_id FROM roles r
          JOIN role_hierarchy rh ON r.id = rh.parent_role_id
        )
        SELECT DISTINCT m.menu_key, rp.action_key, rp.constraints
        FROM role_hierarchy rh
        JOIN role_permissions rp ON rh.id = rp.role_id
        JOIN modules m ON rp.module_id = m.id
        WHERE rp.status = 'active'`,
        [roleId]
      );

      return result.rows.reduce((acc, row) => {
        if (!acc[row.menu_key]) acc[row.menu_key] = [];
        acc[row.menu_key].push({ action: row.action_key, constraints: row.constraints });
        return acc;
      }, {});
    } catch (err) {
      logger.error(`Role service get permissions error: ${err.message}`);
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
        [userId, tenantId, action, entityType, entityId, JSON.stringify(changes), 'active']
      );
    } catch (err) {
      logger.error(`Audit log error: ${err.message}`);
    }
  }
}

module.exports = RoleService;
