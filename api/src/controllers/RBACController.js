/**
 * RBAC Controller
 * Handles API endpoints for permission management
 */

const RBACService = require('../services/RBACService');
const logger = require('../utils/logger');

class RBACController {
  /**
   * Get all permissions for logged-in user
   */
  static async getMyPermissions(req, res) {
    try {
      const userId = req.user.id;
      const permissions = await RBACService.getUserPermissions(userId);
      
      res.json({
        success: true,
        data: {
          userId,
          permissions
        }
      });
    } catch (error) {
      logger.error('❌ Error fetching user permissions:', error.message);
      res.status(500).json({ error: 'Failed to fetch permissions' });
    }
  }

  /**
   * Get all available modules (menu registry)
   */
  static async getModules(req, res) {
    try {
      const { space } = req.query;
      const modules = await RBACService.getAllModules(space);
      
      res.json({
        success: true,
        data: modules
      });
    } catch (error) {
      logger.error('❌ Error fetching modules:', error.message);
      res.status(500).json({ error: 'Failed to fetch modules' });
    }
  }

  /**
   * Get all roles for a tenant or system
   */
  static async getRoles(req, res) {
    try {
      const tenantId = req.user.tenant_id;
      const roles = await RBACService.getAllRoles(tenantId);
      
      res.json({
        success: true,
        data: roles
      });
    } catch (error) {
      logger.error('❌ Error fetching roles:', error.message);
      res.status(500).json({ error: 'Failed to fetch roles' });
    }
  }

  /**
   * Get role with all permissions
   */
  static async getRole(req, res) {
    try {
      const { roleId } = req.params;
      const role = await RBACService.getRoleWithPermissions(roleId);
      
      res.json({
        success: true,
        data: role
      });
    } catch (error) {
      logger.error('❌ Error fetching role:', error.message);
      res.status(500).json({ error: 'Failed to fetch role' });
    }
  }

  /**
   * Create new role
   */
  static async createRole(req, res) {
    try {
      const { name, description, space } = req.body;
      const tenantId = space === 'tenant' ? req.user.tenant_id : null;
      
      if (!name || !space) {
        return res.status(400).json({ error: 'Name and space are required' });
      }

      const query = `
        INSERT INTO roles (name, description, space, status, tenant_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, description, space, status
      `;

      const result = await req.app.locals.db.query(query, [name, description, space, 'active', tenantId]);
      logger.info(`✅ Role created: ${name}`);
      
      res.status(201).json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      logger.error('❌ Error creating role:', error.message);
      res.status(500).json({ error: 'Failed to create role' });
    }
  }

  /**
   * Update role
   */
  static async updateRole(req, res) {
    try {
      const { roleId } = req.params;
      const { name, description } = req.body;
      
      const query = `
        UPDATE roles
        SET name = $1, description = $2, updated_at = CURRENT_TIMESTAMP
        WHERE id = $3
        RETURNING id, name, description, space, status
      `;

      const result = await req.app.locals.db.query(query, [name, description, roleId]);
      if (result.rows.length === 0) {
        return res.status(404).json({ error: 'Role not found' });
      }

      logger.info(`✅ Role updated: ${roleId}`);
      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      logger.error('❌ Error updating role:', error.message);
      res.status(500).json({ error: 'Failed to update role' });
    }
  }

  /**
   * Assign permission to role
   */
  static async assignPermission(req, res) {
    try {
      const { roleId } = req.params;
      const { menuKey, actionKey } = req.body;
      
      if (!menuKey || !actionKey) {
        return res.status(400).json({ error: 'menuKey and actionKey are required' });
      }

      await RBACService.assignPermissionToRole(roleId, menuKey, actionKey);
      
      res.status(201).json({
        success: true,
        message: 'Permission assigned',
        data: { roleId, menuKey, actionKey }
      });
    } catch (error) {
      logger.error('❌ Error assigning permission:', error.message);
      res.status(500).json({ error: 'Failed to assign permission' });
    }
  }

  /**
   * Revoke permission from role
   */
  static async revokePermission(req, res) {
    try {
      const { roleId } = req.params;
      const { menuKey, actionKey } = req.body;
      
      if (!menuKey || !actionKey) {
        return res.status(400).json({ error: 'menuKey and actionKey are required' });
      }

      await RBACService.revokePermissionFromRole(roleId, menuKey, actionKey);
      
      res.json({
        success: true,
        message: 'Permission revoked'
      });
    } catch (error) {
      logger.error('❌ Error revoking permission:', error.message);
      res.status(500).json({ error: 'Failed to revoke permission' });
    }
  }

  /**
   * Assign role to user
   */
  static async assignRoleToUser(req, res) {
    try {
      const { userId } = req.params;
      const { roleId } = req.body;
      
      if (!roleId) {
        return res.status(400).json({ error: 'roleId is required' });
      }

      await RBACService.assignRoleToUser(userId, roleId);
      
      res.status(201).json({
        success: true,
        message: 'Role assigned to user',
        data: { userId, roleId }
      });
    } catch (error) {
      logger.error('❌ Error assigning role to user:', error.message);
      res.status(500).json({ error: 'Failed to assign role' });
    }
  }

  /**
   * Remove role from user
   */
  static async removeRoleFromUser(req, res) {
    try {
      const { userId } = req.params;
      const { roleId } = req.body;
      
      if (!roleId) {
        return res.status(400).json({ error: 'roleId is required' });
      }

      await RBACService.removeRoleFromUser(userId, roleId);
      
      res.json({
        success: true,
        message: 'Role removed from user'
      });
    } catch (error) {
      logger.error('❌ Error removing role from user:', error.message);
      res.status(500).json({ error: 'Failed to remove role' });
    }
  }

  /**
   * Get user roles
   */
  static async getUserRoles(req, res) {
    try {
      const { userId } = req.params;
      const roles = await RBACService.getUserRoles(userId);
      
      res.json({
        success: true,
        data: roles
      });
    } catch (error) {
      logger.error('❌ Error fetching user roles:', error.message);
      res.status(500).json({ error: 'Failed to fetch user roles' });
    }
  }

  /**
   * Create new module
   */
  static async createModule(req, res) {
    try {
      const { menuKey, displayName, space, actionKeys, icon, routePath, componentName, description } = req.body;
      
      if (!menuKey || !displayName || !space) {
        return res.status(400).json({ error: 'menuKey, displayName, and space are required' });
      }

      const module = await RBACService.createModule(
        menuKey,
        displayName,
        space,
        actionKeys || ['view'],
        { icon, routePath, componentName, description }
      );
      
      logger.info(`✅ Module created: ${menuKey}`);
      res.status(201).json({
        success: true,
        data: module
      });
    } catch (error) {
      logger.error('❌ Error creating module:', error.message);
      res.status(500).json({ error: 'Failed to create module' });
    }
  }
}

module.exports = RBACController;
