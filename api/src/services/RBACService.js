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
      
      // Format permissions by menu key with action keys
      const permissions = {};
      result.rows.forEach(row => {
        if (!permissions[row.menu_key]) {
          permissions[row.menu_key] = {
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
      
      // Get permissions for this role
      const permQuery = `
        SELECT 
          m.id as module_id,
          m.menu_key,
          m.display_name,
          rp.action_key
        FROM role_permissions rp
        JOIN modules m ON rp.module_id = m.id
        WHERE rp.role_id = $1 AND rp.status = 'active'
        ORDER BY m.display_name, rp.action_key
      `;
      
      const permResult = await db.query(permQuery, [roleId]);
      
      // Group permissions by module
      const permissions = {};
      permResult.rows.forEach(row => {
        if (!permissions[row.menu_key]) {
          permissions[row.menu_key] = {
            moduleId: row.module_id,
            displayName: row.display_name,
            actions: []
          };
        }
        permissions[row.menu_key].actions.push(row.action_key);
      });
      
      role.permissions = permissions;
      return role;
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
      // Get module ID
      const moduleQuery = `SELECT id FROM modules WHERE menu_key = $1`;
      const moduleResult = await db.query(moduleQuery, [menuKey]);
      if (moduleResult.rows.length === 0) {
        throw new Error('Module not found');
      }
      
      const moduleId = moduleResult.rows[0].id;
      
      // Create permission
      const permQuery = `
        INSERT INTO role_permissions (role_id, module_id, action_key, status)
        VALUES ($1, $2, $3, $4)
        ON CONFLICT (role_id, module_id, action_key) DO UPDATE
        SET status = EXCLUDED.status
        RETURNING id
      `;
      
      const result = await db.query(permQuery, [roleId, moduleId, actionKey, 'active']);
      logger.info(`✅ Permission assigned: Role ${roleId}, Module ${menuKey}, Action ${actionKey}`);
      return result.rows[0];
    } catch (error) {
      logger.error('❌ Error assigning permission:', error.message);
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
    try {
      let query = `
        SELECT id, name, description, space, status, tenant_id
        FROM roles
        WHERE status = 'active'
      `;
      
      const params = [];
      if (tenantId === null) {
        query += ` AND space = 'system'`;
      } else {
        query += ` AND (space = 'system' OR tenant_id = $1)`;
        params.push(tenantId);
      }
      
      query += ` ORDER BY name`;
      
      const result = await db.query(query, params);
      return result.rows;
    } catch (error) {
      logger.error('❌ Error fetching all roles:', error.message);
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
