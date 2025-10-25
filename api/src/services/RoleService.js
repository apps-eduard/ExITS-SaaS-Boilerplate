/**
 * Role Service - Standard RBAC Implementation
 * Uses resource:action permission format
 */

const pool = require('../config/database');
const logger = require('../utils/logger');

class RoleService {
  /**
   * Transform database role object to camelCase
   */
  static transformRole(dbRole) {
    if (!dbRole) return null;
    return {
      id: dbRole.id,
      tenantId: dbRole.tenant_id,
      name: dbRole.name,
      description: dbRole.description,
      space: dbRole.space,
      status: dbRole.status,
      createdAt: dbRole.created_at,
      updatedAt: dbRole.updated_at,
      permissions: dbRole.permissions || [],
    };
  }

  /**
   * Transform permission object to camelCase
   */
  static transformPermission(dbPerm) {
    if (!dbPerm) return null;
    return {
      id: dbPerm.id,
      permissionKey: dbPerm.permission_key || dbPerm.permissionkey,
      resource: dbPerm.resource,
      action: dbPerm.action,
      description: dbPerm.description,
      space: dbPerm.space,
    };
  }

  /**
   * Create a new role
   */
  static async createRole(roleData, requestingUserId, tenantId) {
    try {
      const result = await pool.query(
        `INSERT INTO roles (tenant_id, name, description, space)
         VALUES ($1, $2, $3, $4)
         RETURNING id, tenant_id, name, description, space, status, created_at, updated_at`,
        [
          roleData.space === 'system' ? null : tenantId,
          roleData.name,
          roleData.description || null,
          roleData.space,
        ]
      );

      const role = this.transformRole(result.rows[0]);

      // Audit log
      await this.auditLog(requestingUserId, tenantId, 'create', 'role', role.id, { name: role.name });

      logger.info(`Role created: ${role.name} (ID: ${role.id})`);
      return role;
    } catch (err) {
      logger.error(`Role service create error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Get role by ID with permissions (standard RBAC)
   * Super Admin can view ANY role (read-only)
   * Tenant users can only view their own tenant roles + system roles
   */
  static async getRoleById(roleId, tenantId) {
    try {
      const isSuperAdmin = tenantId === null;

      const roleResult = await pool.query(
        `SELECT r.id, r.tenant_id, r.name, r.description, r.space, r.status,
                r.created_at, r.updated_at,
                json_agg(
                  json_build_object(
                    'id', p.id,
                    'permissionKey', p.permission_key,
                    'resource', p.resource,
                    'action', p.action,
                    'description', p.description,
                    'space', p.space
                  )
                ) FILTER (WHERE p.id IS NOT NULL) as permissions
         FROM roles r
         LEFT JOIN role_permissions rps ON r.id = rps.role_id
         LEFT JOIN permissions p ON rps.permission_id = p.id
         WHERE r.id = $1 
         ${isSuperAdmin ? '' : 'AND (r.tenant_id = $2 OR r.tenant_id IS NULL)'}
         GROUP BY r.id`,
        isSuperAdmin ? [roleId] : [roleId, tenantId]
      );

      if (roleResult.rows.length === 0) {
        throw new Error('Role not found');
      }

      const role = this.transformRole(roleResult.rows[0]);
      
      logger.info(`📋 Role ${roleId} loaded with ${role.permissions?.length || 0} permissions`);
      
      return role;
    } catch (err) {
      logger.error(`Role service get by ID error: ${err.message}`);
      throw err;
    }
  }

  /**
   * List roles with pagination
   * Super Admin (tenantId = null) can view ALL roles (read-only)
   * Tenant users can only view their own tenant roles + system roles
   */
  static async listRoles(tenantId, page = 1, limit = 20, space = null) {
    try {
      const offset = (page - 1) * limit;
      
      // Super Admin (tenantId === null) sees ALL roles across all tenants
      const isSuperAdmin = tenantId === null;

      let query = `
        SELECT r.id, r.tenant_id, r.name, r.description, r.space, r.status,
               r.created_at, r.updated_at,
               COUNT(rps.permission_id) as permission_count
        FROM roles r
        LEFT JOIN role_permissions rps ON r.id = rps.role_id
        ${isSuperAdmin ? 'WHERE 1=1' : 'WHERE (r.tenant_id = $1 OR r.tenant_id IS NULL)'}
      `;
      
      const params = isSuperAdmin ? [] : [tenantId];
      let paramIndex = isSuperAdmin ? 1 : 2;
      
      if (space) {
        query += ` AND r.space = $${paramIndex}`;
        params.push(space);
        paramIndex++;
      }
      
      query += ` GROUP BY r.id ORDER BY r.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const countQuery = `
        SELECT COUNT(*) as total FROM roles r
        ${isSuperAdmin ? 'WHERE 1=1' : 'WHERE (r.tenant_id = $1 OR r.tenant_id IS NULL)'}
        ${space ? `AND r.space = $${isSuperAdmin ? 1 : 2}` : ''}
      `;
      const countParams = isSuperAdmin 
        ? (space ? [space] : [])
        : (space ? [tenantId, space] : [tenantId]);

      const [countResult, dataResult] = await Promise.all([
        pool.query(countQuery, countParams),
        pool.query(query, params),
      ]);

      const transformedRoles = dataResult.rows.map(row => ({
        ...this.transformRole(row),
        permissionCount: parseInt(row.permission_count) || 0
      }));

      return {
        roles: transformedRoles,
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
   * SECURITY: Super Admin can only update system roles, not tenant roles
   */
  static async updateRole(roleId, updateData, requestingUserId, tenantId) {
    try {
      // Get the role to check ownership and space
      const roleCheck = await pool.query(
        'SELECT id, tenant_id, space, name FROM roles WHERE id = $1',
        [roleId]
      );

      if (roleCheck.rows.length === 0) {
        throw new Error('Role not found');
      }

      const existingRole = roleCheck.rows[0];
      const isSuperAdmin = tenantId === null;

      // SECURITY CHECK: Super Admin cannot modify tenant roles
      if (isSuperAdmin && existingRole.space === 'tenant') {
        throw new Error(
          `🚫 PERMISSION DENIED: System administrators cannot modify tenant-space roles. ` +
          `Role "${existingRole.name}" belongs to a tenant and must be managed by that tenant's administrators.`
        );
      }

      // SECURITY CHECK: Tenant users cannot modify system roles
      if (!isSuperAdmin && existingRole.space === 'system') {
        throw new Error(
          `🚫 PERMISSION DENIED: Tenant users cannot modify system-space roles. ` +
          `Role "${existingRole.name}" is a system role and can only be managed by system administrators.`
        );
      }

      // SECURITY CHECK: Tenant users can only modify roles in their own tenant
      if (!isSuperAdmin && existingRole.tenant_id !== tenantId) {
        throw new Error(
          `🚫 PERMISSION DENIED: You can only modify roles within your own tenant.`
        );
      }

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

      if (fieldsToUpdate.length === 0) {
        throw new Error('No fields to update');
      }

      fieldsToUpdate.push(`updated_at = NOW()`);
      values.push(roleId);

      const result = await pool.query(
        `UPDATE roles
         SET ${fieldsToUpdate.join(', ')}
         WHERE id = $${paramCount}
         RETURNING id, tenant_id, name, description, space, status, created_at, updated_at`,
        values
      );

      if (result.rows.length === 0) {
        throw new Error('Role not found or update failed');
      }

      const role = this.transformRole(result.rows[0]);

      await this.auditLog(requestingUserId, tenantId, 'update', 'role', roleId, updateData);

      logger.info(`Role updated: ${role.name} (ID: ${role.id})`);
      return role;
    } catch (err) {
      logger.error(`Role service update error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Delete role
   * SECURITY: Super Admin can only delete system roles, not tenant roles
   */
  static async deleteRole(roleId, requestingUserId, tenantId) {
    try {
      // Get the role to check ownership and space
      const roleCheck = await pool.query(
        'SELECT id, tenant_id, space, name FROM roles WHERE id = $1',
        [roleId]
      );

      if (roleCheck.rows.length === 0) {
        throw new Error('Role not found');
      }

      const existingRole = roleCheck.rows[0];
      const isSuperAdmin = tenantId === null;

      // SECURITY CHECK: Super Admin cannot delete tenant roles
      if (isSuperAdmin && existingRole.space === 'tenant') {
        throw new Error(
          `🚫 PERMISSION DENIED: System administrators cannot delete tenant-space roles. ` +
          `Role "${existingRole.name}" belongs to a tenant and must be managed by that tenant's administrators.`
        );
      }

      // SECURITY CHECK: Tenant users cannot delete system roles
      if (!isSuperAdmin && existingRole.space === 'system') {
        throw new Error(
          `🚫 PERMISSION DENIED: Tenant users cannot delete system-space roles. ` +
          `Role "${existingRole.name}" is a system role and can only be managed by system administrators.`
        );
      }

      // SECURITY CHECK: Tenant users can only delete roles in their own tenant
      if (!isSuperAdmin && existingRole.tenant_id !== tenantId) {
        throw new Error(
          `🚫 PERMISSION DENIED: You can only delete roles within your own tenant.`
        );
      }

      const result = await pool.query(
        `DELETE FROM roles WHERE id = $1 RETURNING id, name`,
        [roleId]
      );

      if (result.rows.length === 0) {
        throw new Error('Role not found or delete failed');
      }

      await this.auditLog(requestingUserId, tenantId, 'delete', 'role', roleId, { name: result.rows[0].name });

      logger.info(`Role deleted: ${result.rows[0].name} (ID: ${roleId})`);
      return { success: true, message: 'Role deleted successfully' };
    } catch (err) {
      logger.error(`Role service delete error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Bulk assign permissions to role (standard RBAC)
   * Replaces all existing permissions
   * SECURITY: Super Admin can only assign permissions to system roles
   */
  static async bulkAssignPermissions(roleId, permissions, requestingUserId, tenantId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      logger.info(`🔄 Bulk assigning permissions to role ${roleId}...`);
      console.log(`🔍 [DEBUG] Role ID: ${roleId}`);
      console.log(`🔍 [DEBUG] Requesting User ID: ${requestingUserId}`);
      console.log(`🔍 [DEBUG] Tenant ID: ${tenantId}`);
      console.log(`🔍 [DEBUG] Received ${permissions.length} permissions:`, JSON.stringify(permissions, null, 2));

      // CRITICAL: Get role space to validate permission assignments
      const roleResult = await client.query(
        'SELECT id, space, tenant_id, name FROM roles WHERE id = $1',
        [roleId]
      );

      if (roleResult.rows.length === 0) {
        throw new Error(`Role not found: ${roleId}`);
      }

      const roleSpace = roleResult.rows[0].space;
      const roleTenantId = roleResult.rows[0].tenant_id;
      const roleName = roleResult.rows[0].name;
      const isSuperAdmin = tenantId === null;

      console.log(`🔍 [DEBUG] Role space: ${roleSpace}, Role tenant_id: ${roleTenantId}, Role name: ${roleName}`);

      // SECURITY CHECK: Super Admin cannot assign permissions to tenant roles
      if (isSuperAdmin && roleSpace === 'tenant') {
        throw new Error(
          `🚫 PERMISSION DENIED: System administrators cannot modify permissions for tenant-space roles. ` +
          `Role "${roleName}" belongs to a tenant and must be managed by that tenant's administrators.`
        );
      }

      // SECURITY CHECK: Tenant users cannot assign permissions to system roles
      if (!isSuperAdmin && roleSpace === 'system') {
        throw new Error(
          `🚫 PERMISSION DENIED: Tenant users cannot modify permissions for system-space roles. ` +
          `Role "${roleName}" is a system role and can only be managed by system administrators.`
        );
      }

      // SECURITY CHECK: Tenant users can only assign permissions to roles in their own tenant
      if (!isSuperAdmin && roleTenantId !== tenantId) {
        throw new Error(
          `🚫 PERMISSION DENIED: You can only modify permissions for roles within your own tenant.`
        );
      }

      // Delete all existing permissions for this role
      const deleteResult = await client.query(
        'DELETE FROM role_permissions WHERE role_id = $1',
        [roleId]
      );
      console.log(`🔍 [DEBUG] Deleted ${deleteResult.rowCount} existing permissions`);

      let insertedCount = 0;
      let notFoundCount = 0;
      const notFoundPermissions = [];
      
      for (const perm of permissions) {
        const { permissionKey } = perm;
        
        if (!permissionKey) {
          logger.warn(`⚠️ Skipping invalid permission (missing permissionKey): ${JSON.stringify(perm)}`);
          continue;
        }

        console.log(`🔍 [DEBUG] Processing permission: ${permissionKey}`);

        // Get the permission ID and space from permissions table
        const permResult = await client.query(
          'SELECT id, space FROM permissions WHERE permission_key = $1',
          [permissionKey]
        );

        if (permResult.rows.length === 0) {
          logger.warn(`⚠️ Permission not found in database: ${permissionKey}`);
          notFoundPermissions.push(permissionKey);
          notFoundCount++;
          continue;
        }

        const permissionId = permResult.rows[0].id;
        const permissionSpace = permResult.rows[0].space;
        console.log(`✅ [DEBUG] Found permission ${permissionKey} with ID: ${permissionId}, Space: ${permissionSpace}`);

        // CRITICAL SECURITY CHECK: Validate permission space matches role space
        if (roleSpace !== permissionSpace) {
          const errorMsg = 
            `🚫 SECURITY VIOLATION: Cannot assign ${permissionSpace}-space permission "${permissionKey}" to ${roleSpace}-space role "${roleName}". ` +
            `For security reasons, ${roleSpace === 'system' ? 'system roles can only have system permissions' : 'tenant roles can only have tenant permissions'}.`;
          logger.error(errorMsg);
          throw new Error(errorMsg);
        }

        // Insert the role-permission mapping
        const insertResult = await client.query(
          `INSERT INTO role_permissions (role_id, permission_id)
           VALUES ($1, $2)
           ON CONFLICT (role_id, permission_id) DO NOTHING`,
          [roleId, permissionId]
        );

        console.log(`✅ [DEBUG] Inserted permission ${permissionKey} for role ${roleId}, rows affected: ${insertResult.rowCount}`);
        insertedCount++;
      }

      await client.query('COMMIT');

      console.log(`🔍 [DEBUG] Final summary:`);
      console.log(`🔍 [DEBUG] - Permissions requested: ${permissions.length}`);
      console.log(`🔍 [DEBUG] - Permissions inserted: ${insertedCount}`);
      console.log(`🔍 [DEBUG] - Permissions not found: ${notFoundCount}`);
      if (notFoundPermissions.length > 0) {
        console.log(`🔍 [DEBUG] - Not found list:`, notFoundPermissions);
      }

      await this.auditLog(requestingUserId, tenantId, 'bulk_assign_permissions', 'role', roleId, {
        permissionsCount: insertedCount,
        notFoundCount: notFoundCount,
        notFoundPermissions: notFoundPermissions
      });

      logger.info(`✅ Bulk assigned ${insertedCount} permissions to role ${roleId}`);

      return {
        count: insertedCount,
        notFoundCount: notFoundCount,
        notFoundPermissions: notFoundPermissions,
        message: `${insertedCount} permissions assigned successfully${notFoundCount > 0 ? `, ${notFoundCount} not found` : ''}`,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error(`❌ Bulk assign permissions error: ${err.message}`);
      logger.error(err.stack);
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Grant single permission to role
   * SECURITY: Super Admin can only grant permissions to system roles
   */
  static async grantPermission(roleId, permissionKey, requestingUserId, tenantId) {
    try {
      // CRITICAL: Get role space to validate permission assignment
      const roleResult = await pool.query(
        'SELECT id, space, tenant_id, name FROM roles WHERE id = $1',
        [roleId]
      );

      if (roleResult.rows.length === 0) {
        throw new Error(`Role not found: ${roleId}`);
      }

      const roleSpace = roleResult.rows[0].space;
      const roleTenantId = roleResult.rows[0].tenant_id;
      const roleName = roleResult.rows[0].name;
      const isSuperAdmin = tenantId === null;

      // SECURITY CHECK: Super Admin cannot grant permissions to tenant roles
      if (isSuperAdmin && roleSpace === 'tenant') {
        throw new Error(
          `🚫 PERMISSION DENIED: System administrators cannot modify permissions for tenant-space roles. ` +
          `Role "${roleName}" belongs to a tenant and must be managed by that tenant's administrators.`
        );
      }

      // SECURITY CHECK: Tenant users cannot grant permissions to system roles
      if (!isSuperAdmin && roleSpace === 'system') {
        throw new Error(
          `🚫 PERMISSION DENIED: Tenant users cannot modify permissions for system-space roles. ` +
          `Role "${roleName}" is a system role and can only be managed by system administrators.`
        );
      }

      // SECURITY CHECK: Tenant users can only grant permissions to roles in their own tenant
      if (!isSuperAdmin && roleTenantId !== tenantId) {
        throw new Error(
          `🚫 PERMISSION DENIED: You can only modify permissions for roles within your own tenant.`
        );
      }

      // Get permission ID and space
      const permResult = await pool.query(
        'SELECT id, space FROM permissions WHERE permission_key = $1',
        [permissionKey]
      );

      if (permResult.rows.length === 0) {
        throw new Error(`Permission not found: ${permissionKey}`);
      }

      const permissionId = permResult.rows[0].id;
      const permissionSpace = permResult.rows[0].space;

      // CRITICAL SECURITY CHECK: Validate permission space matches role space
      if (roleSpace !== permissionSpace) {
        const errorMsg = 
          `🚫 SECURITY VIOLATION: Cannot assign ${permissionSpace}-space permission "${permissionKey}" to ${roleSpace}-space role "${roleName}". ` +
          `For security reasons, ${roleSpace === 'system' ? 'system roles can only have system permissions' : 'tenant roles can only have tenant permissions'}.`;
        logger.error(errorMsg);
        throw new Error(errorMsg);
      }

      // Insert role-permission mapping
      const result = await pool.query(
        `INSERT INTO role_permissions (role_id, permission_id)
         VALUES ($1, $2)
         ON CONFLICT (role_id, permission_id) DO NOTHING
         RETURNING *`,
        [roleId, permissionId]
      );

      await this.auditLog(requestingUserId, tenantId, 'grant_permission', 'role', roleId, {
        permissionKey: permissionKey,
      });

      logger.info(`Permission granted: ${permissionKey} to role ${roleId}`);
      return { success: true, permission: permissionKey };
    } catch (err) {
      logger.error(`Grant permission error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Revoke permission from role
   * SECURITY: Super Admin can only revoke permissions from system roles
   */
  static async revokePermission(roleId, permissionKey, requestingUserId, tenantId) {
    try {
      // Get the role to check ownership and space
      const roleResult = await pool.query(
        'SELECT id, space, tenant_id, name FROM roles WHERE id = $1',
        [roleId]
      );

      if (roleResult.rows.length === 0) {
        throw new Error(`Role not found: ${roleId}`);
      }

      const roleSpace = roleResult.rows[0].space;
      const roleTenantId = roleResult.rows[0].tenant_id;
      const roleName = roleResult.rows[0].name;
      const isSuperAdmin = tenantId === null;

      // SECURITY CHECK: Super Admin cannot revoke permissions from tenant roles
      if (isSuperAdmin && roleSpace === 'tenant') {
        throw new Error(
          `🚫 PERMISSION DENIED: System administrators cannot modify permissions for tenant-space roles. ` +
          `Role "${roleName}" belongs to a tenant and must be managed by that tenant's administrators.`
        );
      }

      // SECURITY CHECK: Tenant users cannot revoke permissions from system roles
      if (!isSuperAdmin && roleSpace === 'system') {
        throw new Error(
          `🚫 PERMISSION DENIED: Tenant users cannot modify permissions for system-space roles. ` +
          `Role "${roleName}" is a system role and can only be managed by system administrators.`
        );
      }

      // SECURITY CHECK: Tenant users can only revoke permissions from roles in their own tenant
      if (!isSuperAdmin && roleTenantId !== tenantId) {
        throw new Error(
          `🚫 PERMISSION DENIED: You can only modify permissions for roles within your own tenant.`
        );
      }

      // Get permission ID
      const permResult = await pool.query(
        'SELECT id FROM permissions WHERE permission_key = $1',
        [permissionKey]
      );

      if (permResult.rows.length === 0) {
        throw new Error(`Permission not found: ${permissionKey}`);
      }

      const permissionId = permResult.rows[0].id;

      // Delete role-permission mapping
      const result = await pool.query(
        `DELETE FROM role_permissions
         WHERE role_id = $1 AND permission_id = $2
         RETURNING *`,
        [roleId, permissionId]
      );

      await this.auditLog(requestingUserId, tenantId, 'revoke_permission', 'role', roleId, {
        permissionKey: permissionKey,
      });

      logger.info(`Permission revoked: ${permissionKey} from role ${roleId}`);
      return { success: true, permission: permissionKey };
    } catch (err) {
      logger.error(`Revoke permission error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Get all available permissions
   */
  static async getAllPermissions(space = null) {
    try {
      let query = 'SELECT * FROM permissions';
      const params = [];
      
      if (space) {
        query += ' WHERE space = $1 OR space = $2';
        params.push(space, 'both');
      }
      
      query += ' ORDER BY resource, action';
      
      const result = await pool.query(query, params);
      
      return result.rows.map(p => this.transformPermission(p));
    } catch (err) {
      logger.error(`Get all permissions error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Audit logging helper
   */
  static async auditLog(userId, tenantId, action, entityType, entityId, details) {
    try {
      await pool.query(
        `INSERT INTO audit_logs (user_id, tenant_id, action, entity_type, entity_id, changes, status)
         VALUES ($1, $2, $3, $4, $5, $6, 'success')`,
        [userId, tenantId, action, entityType, entityId, JSON.stringify(details)]
      );
    } catch (err) {
      logger.error(`Audit log error: ${err.message}`);
    }
  }
}

module.exports = RoleService;
