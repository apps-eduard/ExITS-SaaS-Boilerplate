/**
 * Permission Service
 * Handles permission checks and permission delegation
 */

const knex = require('../config/knex');
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
      
      const result = await knex('userRoles as ur')
        .join('roles as r', 'ur.roleId', 'r.id')
        .join('rolePermissions as rps', 'r.id', 'rps.roleId')
        .join('permissions as p', 'rps.permissionId', 'p.id')
        .where('ur.userId', userId)
        .where('p.permissionKey', permissionKey)
        .where('r.status', 'active')
        .countDistinct('rps.roleId as count')
        .first();

      const hasAccess = result.count > 0;
      
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
      const permissions = await knex('userRoles as ur')
        .join('roles as r', 'ur.roleId', 'r.id')
        .join('rolePermissions as rp', 'r.id', 'rp.roleId')
        .select('rp.menuKey', 'rp.actionKey')
        .where('ur.userId', userId)
        .where('rp.status', 'active')
        .distinct();

      return permissions.reduce((acc, row) => {
        if (!acc[row.menuKey]) acc[row.menuKey] = [];
        acc[row.menuKey].push(row.actionKey);
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
      const [delegation] = await knex('permissionsDelegation')
        .insert({
          tenantId,
          delegatedBy: delegatedByUserId,
          delegatedTo: delegatedToUserId,
          roleId,
          expiresAt,
          reason,
          status: 'active',
        })
        .returning(['id', 'delegatedTo', 'roleId', 'expiresAt', 'reason']);

      await knex('auditLogs').insert({
        userId: delegatedByUserId,
        tenantId,
        action: 'delegate_permission',
        resourceType: 'permission_delegation',
        resourceId: delegation.id,
        newValues: JSON.stringify({ delegated_to: delegatedToUserId, role_id: roleId }),
        status: 'success',
      });

      logger.info(`Permission delegated from ${delegatedByUserId} to ${delegatedToUserId}`);
      return delegation;
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
      const [delegation] = await knex('permissionsDelegation')
        .where({ id: delegationId })
        .update({ status: 'revoked' })
        .returning(['id', 'delegatedTo', 'roleId']);

      if (!delegation) {
        throw new Error('Delegation not found');
      }

      await knex('auditLogs').insert({
        userId: requestingUserId,
        tenantId,
        action: 'revoke_delegation',
        resourceType: 'permission_delegation',
        resourceId: delegationId,
        newValues: JSON.stringify({}),
        status: 'success',
      });

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
      const delegations = await knex('permissionsDelegation as pd')
        .join('roles as r', 'pd.roleId', 'r.id')
        .select(
          'pd.id',
          'pd.delegatedBy',
          'pd.roleId',
          'pd.expiresAt',
          'pd.reason',
          'r.name as roleName'
        )
        .where('pd.delegatedTo', userId)
        .where('pd.tenantId', tenantId)
        .where('pd.status', 'active')
        .where('pd.expiresAt', '>', knex.fn.now());

      return delegations;
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
      const permission = await knex('userRoles as ur')
        .join('roles as r', 'ur.roleId', 'r.id')
        .join('rolePermissions as rp', 'r.id', 'rp.roleId')
        .select('rp.constraints')
        .where('ur.userId', userId)
        .where('rp.menuKey', moduleKey)
        .where('rp.actionKey', actionKey)
        .where('rp.status', 'active')
        .first();

      if (!permission) {
        return { allowed: false, reason: 'Permission not found' };
      }

      const constraints = permission.constraints;

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
  static async getRolePermissionMatrix(roleId, _tenantId) {
    try {
      const modules = await knex('modules')
        .select('id', 'menuKey', 'displayName')
        .whereIn('space', ['both', 'tenant'])
        .orderBy('menuKey');

      const permissions = await knex('rolePermissions as rp')
        .select('rp.id', 'rp.moduleId', 'rp.actionKey', 'rp.status')
        .where('rp.roleId', roleId);

      const matrix = modules.map(module => {
        const actions = ['view', 'create', 'edit', 'delete', 'approve', 'export'];
        const modulePerms = {};

        actions.forEach(action => {
          const perm = permissions.find(p => p.moduleId === module.id && p.actionKey === action);
          modulePerms[action] = perm ? perm.status === 'active' : false;
        });

        return {
          module: module.menuKey,
          displayName: module.displayName,
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
