/**
 * RBAC Service
 * Handles role-based access control logic including permission checking,
 * module/menu access, and dynamic permission fetching
 */

const db = require('../config/database');
const logger = require('../utils/logger');

class RBACService {
  /**
   * Get all permissions for a user
   * Returns menuKey + actionKey combinations
   */
  static async getUserPermissions(userId) {
    try {
      logger.info(`🔍 Fetching permissions for user: ${userId}`);
      
      const query = `
        SELECT DISTINCT
          m.menu_key,
          m.display_name,
          m.icon,
          m.route_path,
          m.component_name,
          m.space,
          rp.action_key,
          m.action_keys
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id 
          AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
        JOIN roles r ON ur.role_id = r.id AND r.status = 'active'
        JOIN role_permissions rp ON r.id = rp.role_id AND rp.status = 'active'
        JOIN modules m ON rp.module_id = m.id AND m.status = 'active'
        WHERE u.id = $1 AND u.status = 'active'
        ORDER BY m.menu_key, rp.action_key
      `;
      
      const result = await db.query(query, [userId]);
      
      logger.info(`✅ Found ${result.rows.length} permission entries for user ${userId}`);
      if (result.rows.length > 0) {
        logger.info(`📋 First 3 permissions:`, result.rows.slice(0, 3));
      }
      
      // Format permissions by menu key with action keys
      const permissions = {};
      result.rows.forEach(row => {
        if (!permissions[row.menu_key]) {
          permissions[row.menu_key] = {
            menuKey: row.menu_key,
            displayName: row.display_name,
            icon: row.icon,
            routePath: row.route_path,
            componentName: row.component_name,
            space: row.space,
            actionKeys: [],
            availableActions: row.action_keys || ['view']
          };
        }
        permissions[row.menu_key].actionKeys.push(row.action_key);
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
      const query = `
        SELECT 1
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id 
          AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
        JOIN roles r ON ur.role_id = r.id AND r.status = 'active'
        JOIN role_permissions rp ON r.id = rp.role_id AND rp.status = 'active'
        JOIN modules m ON rp.module_id = m.id AND m.status = 'active'
        WHERE u.id = $1 AND u.status = 'active' AND m.menu_key = $2
        LIMIT 1
      `;
      
      const result = await db.query(query, [userId, menuKey]);
      return result.rows.length > 0;
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
      const query = `
        SELECT 1
        FROM users u
        JOIN user_roles ur ON u.id = ur.user_id 
          AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
        JOIN roles r ON ur.role_id = r.id AND r.status = 'active'
        JOIN role_permissions rp ON r.id = rp.role_id AND rp.status = 'active'
        JOIN modules m ON rp.module_id = m.id AND m.status = 'active'
        WHERE u.id = $1 AND u.status = 'active' 
          AND m.menu_key = $2 AND rp.action_key = $3
        LIMIT 1
      `;
      
      const result = await db.query(query, [userId, menuKey, actionKey]);
      return result.rows.length > 0;
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
      let query = `
        SELECT 
          id,
          menu_key,
          display_name,
          description,
          icon,
          route_path,
          component_name,
          space,
          action_keys,
          menu_order
        FROM modules
        WHERE status = 'active'
      `;
      
      const params = [];
      if (space) {
        query += ` AND space = $1`;
        params.push(space);
      }
      
      query += ` ORDER BY menu_order, display_name`;
      
      const result = await db.query(query, params);
      return result.rows;
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
      const roleQuery = `
        SELECT id, name, description, space, status, tenant_id
        FROM roles
        WHERE id = $1
      `;
      
      const roleResult = await db.query(roleQuery, [roleId]);
      if (roleResult.rows.length === 0) {
        throw new Error('Role not found');
      }
      
      const role = roleResult.rows[0];
      
      // Get permissions for this role (Standard RBAC)
      const permQuery = `
        SELECT 
          p.id,
          p.permission_key,
          p.resource,
          p.action,
          p.description
        FROM role_permissions_standard rps
        JOIN permissions p ON rps.permission_id = p.id
        WHERE rps.role_id = $1
        ORDER BY p.resource, p.action
      `;
      
      const permResult = await db.query(permQuery, [roleId]);
      
      // Transform permissions to camelCase array format
      const permissions = permResult.rows.map(row => ({
        id: row.id,
        permissionKey: row.permission_key,
        resource: row.resource,
        action: row.action,
        description: row.description,
      }));
      
      // Transform role to camelCase
      const transformedRole = {
        id: role.id,
        name: role.name,
        description: role.description,
        space: role.space,
        status: role.status,
        tenantId: role.tenant_id,
        permissions: permissions,
      };
      
      logger.info(`📋 Role ${roleId} loaded with ${permissions.length} permissions`);
      return transformedRole;
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
      const moduleQuery = `SELECT id FROM modules WHERE menu_key = $1`;
      const moduleResult = await db.query(moduleQuery, [menuKey]);
      
      const moduleId = moduleResult.rows.length > 0 ? moduleResult.rows[0].id : null;
      
      // Create permission with menu_key (works even if module doesn't exist)
      // Use the columns that match the unique index
      const permQuery = `
        INSERT INTO role_permissions (role_id, module_id, menu_key, action_key, status)
        VALUES ($1, $2, $3, $4, $5)
        ON CONFLICT (role_id, COALESCE(menu_key, ''), action_key) 
        DO UPDATE SET 
          status = EXCLUDED.status, 
          module_id = EXCLUDED.module_id,
          updated_at = CURRENT_TIMESTAMP
        RETURNING id
      `;
      
      const result = await db.query(permQuery, [roleId, moduleId, menuKey, actionKey, 'active']);
      logger.info(`✅ Permission assigned: Role ${roleId}, Menu ${menuKey}, Action ${actionKey}`);
      return result.rows[0];
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
      const moduleQuery = `SELECT id FROM modules WHERE menu_key = $1`;
      const moduleResult = await db.query(moduleQuery, [menuKey]);
      if (moduleResult.rows.length === 0) {
        throw new Error('Module not found');
      }
      
      const moduleId = moduleResult.rows[0].id;
      
      // Delete permission
      const permQuery = `
        DELETE FROM role_permissions
        WHERE role_id = $1 AND module_id = $2 AND action_key = $3
      `;
      
      await db.query(permQuery, [roleId, moduleId, actionKey]);
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
      const query = `
        SELECT 
          r.id,
          r.name,
          r.description,
          r.space,
          r.status,
          r.tenant_id,
          ur.assigned_at
        FROM user_roles ur
        JOIN roles r ON ur.role_id = r.id
        WHERE ur.user_id = $1 
          AND (ur.expires_at IS NULL OR ur.expires_at > CURRENT_TIMESTAMP)
        ORDER BY r.name
      `;
      
      const result = await db.query(query, [userId]);
      return result.rows;
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
      const query = `
        INSERT INTO user_roles (user_id, role_id, assigned_by)
        VALUES ($1, $2, CURRENT_USER)
        ON CONFLICT (user_id, role_id) DO NOTHING
        RETURNING user_id, role_id
      `;
      
      const result = await db.query(query, [userId, roleId]);
      logger.info(`✅ Role ${roleId} assigned to user ${userId}`);
      return result.rows[0];
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
      const query = `
        DELETE FROM user_roles
        WHERE user_id = $1 AND role_id = $2
      `;
      
      await db.query(query, [userId, roleId]);
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
    let query = '';
    try {
      query = `
        SELECT 
          r.id, 
          r.name, 
          r.description, 
          r.space, 
          r.status, 
          r.tenant_id,
          t.name as tenant_name,
          COUNT(DISTINCT rps.permission_id) as permission_count,
          json_agg(
            DISTINCT jsonb_build_object(
              'permissionKey', p.permission_key,
              'resource', p.resource,
              'action', p.action
            )
          ) FILTER (WHERE rps.permission_id IS NOT NULL) as permissions
        FROM roles r
        LEFT JOIN role_permissions_standard rps ON r.id = rps.role_id
        LEFT JOIN permissions p ON rps.permission_id = p.id
        LEFT JOIN tenants t ON r.tenant_id = t.id
      `;
      
      const params = [];
      const whereClauses = [];
      
      // System admins (tenantId === null) can see all roles
      // Tenant users can only see their tenant roles + system roles
      if (tenantId !== null) {
        whereClauses.push(`(r.space = 'system' OR r.tenant_id = $1)`);
        params.push(tenantId);
      }
      
      if (whereClauses.length > 0) {
        query += ` WHERE ${whereClauses.join(' AND ')}`;
      }
      
      query += ` GROUP BY r.id, r.name, r.description, r.space, r.status, r.tenant_id, t.name`;
      query += ` ORDER BY r.status DESC, r.space DESC, r.name`;  // Active first, then system roles, then alphabetically
      
      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('❌ Error fetching all roles:', error.message);
      logger.error('❌ Stack trace:', error.stack);
      logger.error('❌ SQL query:', query);
      throw error;
    }
  }

  /**
   * Create new module/menu item
   */
  static async createModule(menuKey, displayName, space, actionKeys = ['view'], data = {}) {
    try {
      const query = `
        INSERT INTO modules (
          menu_key, display_name, space, status, 
          action_keys, icon, route_path, component_name, description
        )
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
        RETURNING id, menu_key, display_name
      `;
      
      const result = await db.query(query, [
        menuKey,
        displayName,
        space,
        'active',
        JSON.stringify(actionKeys),
        data.icon || null,
        data.routePath || null,
        data.componentName || null,
        data.description || null
      ]);
      
      logger.info(`✅ Module created: ${menuKey}`);
      return result.rows[0];
    } catch (error) {
      logger.error('❌ Error creating module:', error.message);
      throw error;
    }
  }
}

module.exports = RBACService;
