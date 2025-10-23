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
      const userId = req.userId || req.user?.id;
      
      if (!userId) {
        logger.error('❌ No userId found in request');
        return res.status(401).json({ 
          success: false,
          error: 'User not authenticated' 
        });
      }
      
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
      const { name, description, space, tenant_id } = req.body;
      
      logger.info('📥 Request body:', req.body);
      logger.info('🔍 Extracted tenant_id from body:', tenant_id, 'type:', typeof tenant_id);
      
      // Determine tenant_id based on space and user context
      let finalTenantId = null;
      
      if (space === 'tenant') {
        // For tenant roles, use tenant_id from request body (if provided by system admin)
        // or from the authenticated user's tenant
        // Convert string to number if needed
        const bodyTenantId = tenant_id ? parseInt(tenant_id, 10) : null;
        finalTenantId = bodyTenantId || req.user?.tenant_id || req.tenantId;
        
        logger.info('🔍 Final tenant_id resolved:', finalTenantId, 'type:', typeof finalTenantId);
        
        if (!finalTenantId) {
          logger.warn('⚠️  Tenant role creation requires tenant_id');
          return res.status(400).json({ 
            error: 'Tenant ID required', 
            message: 'Tenant roles must be associated with a tenant. Please specify tenant_id or use a tenant user account.',
          });
        }
      }
      
      logger.info(`📝 Creating role: ${name}, space: ${space}, tenant: ${finalTenantId}`);
      
      if (!name || !space) {
        return res.status(400).json({ error: 'Name and space are required' });
      }

      // Validate space value
      if (!['system', 'tenant'].includes(space)) {
        return res.status(400).json({ error: 'Space must be either "system" or "tenant"' });
      }

      // Check if database is available
      if (!req.app.locals.db) {
        logger.error('❌ Database connection not available in req.app.locals.db');
        return res.status(500).json({ error: 'Database connection not available' });
      }

      const query = `
        INSERT INTO roles (name, description, space, status, tenant_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id, name, description, space, status, tenant_id
      `;

      const result = await req.app.locals.db.query(query, [name, description, space, 'active', finalTenantId]);
      logger.info(`✅ Role created: ${name} with ID: ${result.rows[0].id}`);
      
      res.status(201).json({
        success: true,
        data: result.rows[0],
      });
    } catch (error) {
      // Handle duplicate role name
      if (error.code === '23505') {
        logger.warn(`⚠️  Duplicate role name: ${req.body.name}`);
        return res.status(409).json({ 
          error: 'Role already exists', 
          message: `A role named "${req.body.name}" already exists in this ${req.body.space} space.`,
        });
      }

      // Handle constraint violations
      if (error.code === '23514') {
        logger.warn(`⚠️  Constraint violation: ${error.message}`);
        return res.status(400).json({ 
          error: 'Invalid role configuration', 
          message: 'System roles must not have a tenant_id, and tenant roles must have a tenant_id.',
        });
      }

      logger.error('❌ Error creating role:', error.message);
      logger.error('❌ Error stack:', error.stack);
      res.status(500).json({ error: 'Failed to create role', details: error.message });
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
   * Toggle role status (enable/disable)
   */
  static async toggleRoleStatus(req, res) {
    try {
      const { roleId } = req.params;
      
      // Get current status
      const getQuery = `SELECT status FROM roles WHERE id = $1`;
      const currentRole = await req.app.locals.db.query(getQuery, [roleId]);
      
      if (currentRole.rows.length === 0) {
        return res.status(404).json({ error: 'Role not found' });
      }

      const currentStatus = currentRole.rows[0].status;
      const newStatus = currentStatus === 'active' ? 'inactive' : 'active';
      
      const updateQuery = `
        UPDATE roles
        SET status = $1, updated_at = CURRENT_TIMESTAMP
        WHERE id = $2
        RETURNING id, name, description, space, status
      `;

      const result = await req.app.locals.db.query(updateQuery, [newStatus, roleId]);
      
      logger.info(`✅ Role status toggled: ${roleId} (${currentStatus} → ${newStatus})`);
      res.json({
        success: true,
        data: result.rows[0]
      });
    } catch (error) {
      logger.error('❌ Error toggling role status:', error.message);
      res.status(500).json({ error: 'Failed to toggle role status' });
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
   * Bulk assign permissions to role (Standard RBAC)
   */
  static async bulkAssignPermissions(req, res) {
    try {
      const { roleId } = req.params;
      const { permissions } = req.body;
      
      if (!permissions || !Array.isArray(permissions)) {
        return res.status(400).json({ error: 'permissions array is required' });
      }

      logger.info(`🔄 Bulk assigning ${permissions.length} permissions to role ${roleId}...`);
      logger.info(`📋 Received permissions:`, JSON.stringify(permissions, null, 2));

      // First, remove all existing permissions for this role (standard RBAC)
      const deleteQuery = `DELETE FROM role_permissions_standard WHERE role_id = $1`;
      await req.app.locals.db.query(deleteQuery, [roleId]);
      logger.info(`🗑️  Cleared existing permissions for role ${roleId}`);

      // Then insert all new permissions using permission_key
      let insertedCount = 0;
      let notFoundCount = 0;
      
      for (const perm of permissions) {
        const { permissionKey } = perm;
        
        if (!permissionKey) {
          logger.warn(`⚠️  Skipping invalid permission (missing permissionKey):`, perm);
          continue;
        }

        logger.info(`🔍 Looking up permission: ${permissionKey}`);

        // Get permission ID from permissions table
        const permResult = await req.app.locals.db.query(
          'SELECT id FROM permissions WHERE permission_key = $1',
          [permissionKey]
        );

        if (permResult.rows.length === 0) {
          logger.warn(`⚠️  Permission not found in database: ${permissionKey}`);
          notFoundCount++;
          continue;
        }

        const permissionId = permResult.rows[0].id;
        logger.info(`✅ Found permission ${permissionKey} with ID: ${permissionId}`);

        // Insert into role_permissions_standard
        await req.app.locals.db.query(
          `INSERT INTO role_permissions_standard (role_id, permission_id)
           VALUES ($1, $2)
           ON CONFLICT (role_id, permission_id) DO NOTHING`,
          [roleId, permissionId]
        );

        logger.info(`✅ Inserted permission ${permissionKey} for role ${roleId}`);
        insertedCount++;
      }

      logger.info(`✅ Bulk assigned ${insertedCount} permissions to role ${roleId} (${notFoundCount} not found)`);
      
      res.status(201).json({
        success: true,
        message: `${insertedCount} permissions assigned successfully`,
        count: insertedCount,
        notFound: notFoundCount,
        data: { roleId }
      });
    } catch (error) {
      logger.error('❌ Error bulk assigning permissions:', error.message);
      logger.error(error.stack);
      res.status(500).json({ error: 'Failed to bulk assign permissions' });
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
