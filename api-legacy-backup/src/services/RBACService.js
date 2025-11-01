/**
 * RBAC Service
 * Handles role-based access control logic including permission checking,
 * module/menu access, and dynamic permission fetching
 */

const knex = require('../config/knex');
const logger = require('../utils/logger');

class RBACService {
  /**
   * Get all permissions for a user
   * Returns menuKey + actionKey combinations
   */
  static async getUserPermissions(userId) {
    try {
      logger.info(`🔍 Fetching permissions for user: ${userId}`);
      
      const result = await knex('users as u')
        .join('userRoles as ur', function() {
          this.on('u.id', '=', 'ur.userId')
            .andOn(knex.raw('(ur.expiresAt IS NULL OR ur.expiresAt > CURRENT_TIMESTAMP)'));
        })
        .join('roles as r', function() {
          this.on('ur.roleId', '=', 'r.id')
            .andOnVal('r.status', '=', 'active');
        })
        .join('rolePermissions as rp', function() {
          this.on('r.id', '=', 'rp.roleId')
            .andOnVal('rp.status', '=', 'active');
        })
        .join('modules as m', function() {
          this.on('rp.moduleId', '=', 'm.id')
            .andOnVal('m.status', '=', 'active');
        })
        .where({ 'u.id': userId, 'u.status': 'active' })
        .select(
          'm.menuKey',
          'm.displayName',
          'm.icon',
          'm.routePath',
          'm.componentName',
          'm.space',
          'rp.actionKey',
          'm.actionKeys'
        )
        .distinct()
        .orderBy(['m.menuKey', 'rp.actionKey']);
      
      logger.info(`✅ Found ${result.length} permission entries for user ${userId}`);
      if (result.length > 0) {
        logger.info('📋 First 3 permissions:', result.slice(0, 3));
      }
      
      // Format permissions by menu key with action keys
      const permissions = {};
      result.forEach(row => {
        if (!permissions[row.menuKey]) {
          permissions[row.menuKey] = {
            menuKey: row.menuKey,
            displayName: row.displayName,
            icon: row.icon,
            routePath: row.routePath,
            componentName: row.componentName,
            space: row.space,
            actionKeys: [],
            availableActions: row.actionKeys || ['view'],
          };
        }
        permissions[row.menuKey].actionKeys.push(row.actionKey);
      });
      
      logger.info(`📊 Formatted permissions for ${Object.keys(permissions).length} modules`);
      logger.info(`🔑 Menu keys with access: ${Object.keys(permissions).join(', ')}`);
      
      return permissions;
    } catch (error) {
      logger.error('❌ Error getting user permissions:', error.message);
      throw error;
    }
  }

  /**
   * Check if user has access to a menu/module
   */
  static async hasMenuAccess(userId, menuKey) {
    try {
      const result = await knex('users as u')
        .join('userRoles as ur', function() {
          this.on('u.id', '=', 'ur.userId')
            .andOn(knex.raw('(ur.expiresAt IS NULL OR ur.expiresAt > CURRENT_TIMESTAMP)'));
        })
        .join('roles as r', function() {
          this.on('ur.roleId', '=', 'r.id')
            .andOnVal('r.status', '=', 'active');
        })
        .join('rolePermissions as rp', function() {
          this.on('r.id', '=', 'rp.roleId')
            .andOnVal('rp.status', '=', 'active');
        })
        .join('modules as m', function() {
          this.on('rp.moduleId', '=', 'm.id')
            .andOnVal('m.status', '=', 'active');
        })
        .where({ 'u.id': userId, 'u.status': 'active', 'm.menuKey': menuKey })
        .select(1)
        .limit(1)
        .first();
      
      return !!result;
    } catch (error) {
      logger.error('❌ Error checking menu access:', error.message);
      return false;
    }
  }

  /**
   * Check if user has specific action on a menu
   */
  static async hasAction(userId, menuKey, actionKey) {
    try {
      const result = await knex('users as u')
        .join('userRoles as ur', function() {
          this.on('u.id', '=', 'ur.userId')
            .andOn(knex.raw('(ur.expiresAt IS NULL OR ur.expiresAt > CURRENT_TIMESTAMP)'));
        })
        .join('roles as r', function() {
          this.on('ur.roleId', '=', 'r.id')
            .andOnVal('r.status', '=', 'active');
        })
        .join('rolePermissions as rp', function() {
          this.on('r.id', '=', 'rp.roleId')
            .andOnVal('rp.status', '=', 'active');
        })
        .join('modules as m', function() {
          this.on('rp.moduleId', '=', 'm.id')
            .andOnVal('m.status', '=', 'active');
        })
        .where({ 
          'u.id': userId, 
          'u.status': 'active',
          'm.menuKey': menuKey,
          'rp.actionKey': actionKey,
        })
        .select(1)
        .limit(1)
        .first();
      
      return !!result;
    } catch (error) {
      logger.error('❌ Error checking action permission:', error.message);
      return false;
    }
  }

  /**
   * Get all available modules (menu registry)
   */
  static async getAllModules(space = null) {
    try {
      const query = knex('modules')
        .where({ status: 'active' })
        .select('id', 'menuKey', 'displayName', 'description', 'icon', 'routePath', 'parentMenuKey', 'space', 'menuOrder');
      
      if (space) {
        query.where({ space });
      }
      
      const modules = await query.orderBy(['menuOrder', 'displayName']);
      return modules;
    } catch (error) {
      logger.error('❌ Error fetching modules:', error.message);
      throw error;
    }
  }

  /**
   * Get role with all permissions
   */
  static async getRoleWithPermissions(roleId) {
    try {
      const role = await knex('roles')
        .select('id', 'name', 'description', 'space', 'status', 'tenantId')
        .where({ id: roleId })
        .first();
      
      if (!role) {
        throw new Error('Role not found');
      }
      
      // Get permissions for this role (Standard RBAC)
      const permissions = await knex('rolePermissions as rps')
        .join('permissions as p', 'rps.permissionId', 'p.id')
        .where({ 'rps.roleId': roleId })
        .select('p.id', 'p.permissionKey', 'p.resource', 'p.action', 'p.description', 'p.space')
        .orderBy(['p.resource', 'p.action']);
      
      logger.info(`📋 Role ${roleId} loaded with ${permissions.length} permissions`);
      
      return {
        ...role,
        permissions,
      };
    } catch (error) {
      logger.error('❌ Error fetching role with permissions:', error.message);
      throw error;
    }
  }

  /**
   * Assign permission to role
   */
  static async assignPermissionToRole(roleId, menuKey, actionKey) {
    try {
      // Try to get module ID (module may not exist yet)
      const module = await knex('modules')
        .select('id')
        .where({ menuKey })
        .first();
      
      const moduleId = module ? module.id : null;
      
      // Create permission with menu_key (works even if module doesn't exist)
      // Use the columns that match the unique index
      const [permission] = await knex('rolePermissions')
        .insert({
          roleId,
          moduleId,
          menuKey,
          actionKey,
          status: 'active',
        })
        .onConflict(knex.raw('(role_id, COALESCE(menu_key, \'\'), action_key)'))
        .merge({
          status: 'active',
          moduleId,
          updatedAt: knex.fn.now(),
        })
        .returning('id');
      
      logger.info(`✅ Permission assigned: Role ${roleId}, Menu ${menuKey}, Action ${actionKey}`);
      return permission;
    } catch (error) {
      logger.error('❌ Error assigning permission:', error.message);
      logger.error('Stack:', error.stack);
      throw error;
    }
  }

  /**
   * Revoke permission from role
   */
  static async revokePermissionFromRole(roleId, menuKey, actionKey) {
    try {
      // Get module ID
      const module = await knex('modules')
        .select('id')
        .where({ menuKey })
        .first();
      
      if (!module) {
        throw new Error('Module not found');
      }
      
      // Delete permission
      await knex('rolePermissions')
        .where({ roleId, moduleId: module.id, actionKey })
        .del();
      
      logger.info(`✅ Permission revoked: Role ${roleId}, Module ${menuKey}, Action ${actionKey}`);
    } catch (error) {
      logger.error('❌ Error revoking permission:', error.message);
      throw error;
    }
  }

  /**
   * Get user's roles
   */
  static async getUserRoles(userId) {
    try {
      const roles = await knex('userRoles as ur')
        .join('roles as r', 'ur.roleId', 'r.id')
        .where({ 'ur.userId': userId })
        .andWhere(function() {
          this.whereNull('ur.expiresAt')
            .orWhere('ur.expiresAt', '>', knex.fn.now());
        })
        .select('r.id', 'r.name', 'r.description', 'r.space', 'r.status', 'r.tenantId', 'ur.assignedAt')
        .orderBy('r.name');
      
      return roles;
    } catch (error) {
      logger.error('❌ Error fetching user roles:', error.message);
      throw error;
    }
  }

  /**
   * Assign role to user
   */
  static async assignRoleToUser(userId, roleId) {
    try {
      const [userRole] = await knex('userRoles')
        .insert({
          userId,
          roleId,
          assignedBy: knex.raw('CURRENT_USER'),
        })
        .onConflict(['userId', 'roleId'])
        .ignore()
        .returning(['userId', 'roleId']);
      
      logger.info(`✅ Role ${roleId} assigned to user ${userId}`);
      return userRole;
    } catch (error) {
      logger.error('❌ Error assigning role to user:', error.message);
      throw error;
    }
  }

  /**
   * Remove role from user
   */
  static async removeRoleFromUser(userId, roleId) {
    try {
      await knex('userRoles')
        .where({ userId, roleId })
        .del();
      
      logger.info(`✅ Role ${roleId} removed from user ${userId}`);
    } catch (error) {
      logger.error('❌ Error removing role from user:', error.message);
      throw error;
    }
  }

  /**
   * Get all roles for a tenant or system
   */
  static async getAllRoles(tenantId = null) {
    try {
      let query = knex('roles as r')
        .leftJoin('role_permissions as rps', 'r.id', 'rps.role_id')
        .leftJoin('permissions as p', 'rps.permission_id', 'p.id')
        .leftJoin('tenants as t', 'r.tenant_id', 't.id')
        .select(
          'r.id',
          'r.name',
          'r.description',
          'r.space',
          'r.status',
          'r.tenant_id',
          't.name as tenant_name',
          knex.raw('COUNT(DISTINCT rps.permission_id) as permission_count'),
          knex.raw(`
            json_agg(
              DISTINCT jsonb_build_object(
                'permissionKey', p.permission_key,
                'resource', p.resource,
                'action', p.action
              )
            ) FILTER (WHERE rps.permission_id IS NOT NULL) as permissions
          `),
        )
        .groupBy('r.id', 'r.name', 'r.description', 'r.space', 'r.status', 'r.tenant_id', 't.name')
        .orderBy([
          { column: 'r.status', order: 'desc' },
          { column: 'r.space', order: 'desc' },
          { column: 'r.name' },
        ]);
      
      // System admins (tenantId === null) can see all roles
      // Tenant users can only see their tenant roles + system roles
      if (tenantId !== null) {
        query.where(function() {
          this.where('r.space', 'system').orWhere('r.tenant_id', tenantId);
        });
      }
      
      const roles = await query;
      return roles;
    } catch (error) {
      logger.error('❌ Error fetching all roles:', error.message);
      logger.error('❌ Stack trace:', error.stack);
      throw error;
    }
  }

  /**
   * Create new module/menu item
   */
  static async createModule(menuKey, displayName, space, actionKeys = ['view'], data = {}) {
    try {
      const [module] = await knex('modules')
        .insert({
          menuKey,
          displayName,
          space,
          status: 'active',
          actionKeys: JSON.stringify(actionKeys),
          icon: data.icon || null,
          routePath: data.routePath || null,
          componentName: data.componentName || null,
          description: data.description || null,
        })
        .returning(['id', 'menuKey', 'displayName']);
      
      logger.info(`✅ Module created: ${menuKey}`);
      return module;
    } catch (error) {
      logger.error('❌ Error creating module:', error.message);
      throw error;
    }
  }
}

module.exports = RBACService;
