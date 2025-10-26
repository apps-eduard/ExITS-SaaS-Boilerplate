/**
 * Permission Service
 * Handles permission checks and permission delegation
 */

const pool = require('../config/database');
const logger = require('../utils/logger');

class PermissionService {
  /**
   * Check if user has permission to perform action on resource (Standard RBAC)
   * @param {number} userId - User ID
   * @param {string} resource - Resource name (e.g., 'users', 'roles')
   * @param {string} action - Action name (e.g., 'read', 'create', 'update', 'delete')
   * @returns {Promise<boolean>}
   */
  static async hasPermission(userId, resource, action) {
    try {
      const permissionKey = `${resource}:${action}`;
      
      const result = await pool.query(
        `SELECT COUNT(*) as count FROM (
          SELECT DISTINCT rps.role_id
          FROM user_roles ur
          JOIN roles r ON ur.role_id = r.id
          JOIN role_permissions rps ON r.id = rps.role_id
          JOIN permissions p ON rps.permission_id = p.id
          WHERE ur.user_id = $1 
            AND p.permission_key = $2
            AND r.status = 'active'
        ) AS perms`,
        [userId, permissionKey]
      );

      const hasAccess = result.rows[0].count > 0;
      
      // Don't log warning here - let RBAC middleware log if ALL checks fail
      // This prevents misleading logs when checking multiple permission variants

      return hasAccess;
    } catch (err) {
      logger.error(`Permission service check error: ${err.message}`);
      return false;
    }
  }

  /**
   * Get all user permissions grouped by module
   * Design: role → menu_key → action (no module_id needed)
   */
  static async getUserPermissions(userId) {
    try {
      const result = await pool.query(
        `SELECT DISTINCT rp.menu_key, rp.action_key
         FROM user_roles ur
         JOIN roles r ON ur.role_id = r.id
         JOIN role_permissions rp ON r.id = rp.role_id
         WHERE ur.user_id = $1 AND rp.status = 'active'`,
        [userId]
      );

      return result.rows.reduce((acc, row) => {
        if (!acc[row.menu_key]) acc[row.menu_key] = [];
        acc[row.menu_key].push(row.action_key);
        return acc;
      }, {});
    } catch (err) {
      logger.error(`Permission service get permissions error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Delegate temporary permission to another user
   */
  static async delegatePermission(delegatedByUserId, delegatedToUserId, roleId, tenantId, expiresAt, reason) {
    try {
      const result = await pool.query(
        `INSERT INTO permissions_delegation (tenant_id, delegated_by, delegated_to, role_id, expires_at, reason, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         RETURNING id, delegated_to, role_id, expires_at, reason`,
        [tenantId, delegatedByUserId, delegatedToUserId, roleId, expiresAt, reason, 'active']
      );

      await pool.query(
        `INSERT INTO audit_logs (user_id, tenant_id, action, resource_type, resource_id, new_values, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [
          delegatedByUserId,
          tenantId,
          'delegate_permission',
          'permission_delegation',
          result.rows[0].id,
          JSON.stringify({ delegated_to: delegatedToUserId, role_id: roleId }),
          'success',
        ]
      );

      logger.info(`Permission delegated from ${delegatedByUserId} to ${delegatedToUserId}`);
      return result.rows[0];
    } catch (err) {
      logger.error(`Permission service delegate error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Revoke delegated permission
   */
  static async revokeDelegation(delegationId, requestingUserId, tenantId) {
    try {
      const result = await pool.query(
        `UPDATE permissions_delegation SET status = 'revoked' WHERE id = $1
         RETURNING id, delegated_to, role_id`,
        [delegationId]
      );

      if (result.rows.length === 0) {
        throw new Error('Delegation not found');
      }

      await pool.query(
        `INSERT INTO audit_logs (user_id, tenant_id, action, resource_type, resource_id, new_values, status)
         VALUES ($1, $2, $3, $4, $5, $6, $7)`,
        [requestingUserId, tenantId, 'revoke_delegation', 'permission_delegation', delegationId, JSON.stringify({}), 'success']
      );

      return { message: 'Delegation revoked successfully' };
    } catch (err) {
      logger.error(`Permission service revoke delegation error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Get user's delegated permissions
   */
  static async getUserDelegatedPermissions(userId, tenantId) {
    try {
      const result = await pool.query(
        `SELECT pd.id, pd.delegated_by, pd.role_id, pd.expires_at, pd.reason, r.name as role_name
         FROM permissions_delegation pd
         JOIN roles r ON pd.role_id = r.id
         WHERE pd.delegated_to = $1 AND pd.tenant_id = $2 AND pd.status = 'active'
         AND pd.expires_at > NOW()`,
        [userId, tenantId]
      );

      return result.rows;
    } catch (err) {
      logger.error(`Permission service get delegated error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Check permission with constraints
   * Design: role → menu_key → action (no module_id needed)
   */
  static async checkPermissionWithConstraints(userId, moduleKey, actionKey, context = {}) {
    try {
      const result = await pool.query(
        `SELECT rp.constraints
         FROM user_roles ur
         JOIN roles r ON ur.role_id = r.id
         JOIN role_permissions rp ON r.id = rp.role_id
         WHERE ur.user_id = $1 AND rp.menu_key = $2 AND rp.action_key = $3 AND rp.status = 'active'
         LIMIT 1`,
        [userId, moduleKey, actionKey]
      );

      if (result.rows.length === 0) {
        return { allowed: false, reason: 'Permission not found' };
      }

      const constraints = result.rows[0].constraints;

      // Check constraints if any
      if (constraints) {
        const constraintObj = typeof constraints === 'string' ? JSON.parse(constraints) : constraints;

        // Example constraint checks
        if (constraintObj.allowed_ips && !constraintObj.allowed_ips.includes(context.ip)) {
          return { allowed: false, reason: 'IP not allowed' };
        }

        if (constraintObj.allowed_hours) {
          const hour = new Date().getHours();
          if (!constraintObj.allowed_hours.includes(hour)) {
            return { allowed: false, reason: 'Outside allowed hours' };
          }
        }

        if (constraintObj.max_records && context.record_count && context.record_count > constraintObj.max_records) {
          return { allowed: false, reason: 'Record limit exceeded' };
        }
      }

      return { allowed: true };
    } catch (err) {
      logger.error(`Permission service constraint check error: ${err.message}`);
      return { allowed: false, reason: 'Error checking constraints' };
    }
  }

  /**
   * Get permission matrix for role
   */
  static async getRolePermissionMatrix(roleId, tenantId) {
    try {
      const modulesResult = await pool.query(
        `SELECT id, menu_key, display_name FROM modules WHERE space IN ('both', 'tenant') ORDER BY menu_key`
      );

      const modules = modulesResult.rows;

      const permissionsResult = await pool.query(
        `SELECT rp.id, rp.module_id, rp.action_key, rp.status
         FROM role_permissions rp
         WHERE rp.role_id = $1`,
        [roleId]
      );

      const permissions = permissionsResult.rows;

      const matrix = modules.map(module => {
        const actions = ['view', 'create', 'edit', 'delete', 'approve', 'export'];
        const modulePerms = {};

        actions.forEach(action => {
          const perm = permissions.find(p => p.module_id === module.id && p.action_key === action);
          modulePerms[action] = perm ? perm.status === 'active' : false;
        });

        return {
          module: module.menu_key,
          displayName: module.display_name,
          ...modulePerms,
        };
      });

      return matrix;
    } catch (err) {
      logger.error(`Permission service get matrix error: ${err.message}`);
      throw err;
    }
  }
}

module.exports = PermissionService;
