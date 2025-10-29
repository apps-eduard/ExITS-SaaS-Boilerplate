/**
 * Role Service - Standard RBAC Implementation
 * Uses resource:action permission format
 * NOTE: Fully converted to Knex with automatic camelCase/snake_case conversion
 */

const knex = require('../config/knex');
const logger = require('../utils/logger');

class RoleService {
  /**
   * Transform database role object to camelCase
   * NOTE: This method is now deprecated - Knex handles conversion automatically
   * Kept for backwards compatibility during migration
   */
  static transformRole(dbRole) {
    if (!dbRole) return null;
    return {
      id: dbRole.id,
      tenantId: dbRole.tenantId || dbRole.tenant_id,
      name: dbRole.name,
      description: dbRole.description,
      space: dbRole.space,
      status: dbRole.status,
      createdAt: dbRole.createdAt || dbRole.created_at,
      updatedAt: dbRole.updatedAt || dbRole.updated_at,
      permissions: dbRole.permissions || [],
    };
  }

  /**
   * Transform permission object to camelCase
   * NOTE: This method is now deprecated - Knex handles conversion automatically
   * Kept for backwards compatibility during migration
   */
  static transformPermission(dbPerm) {
    if (!dbPerm) return null;
    return {
      id: dbPerm.id,
      permissionKey: dbPerm.permissionKey || dbPerm.permission_key || dbPerm.permissionkey,
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
      const [role] = await knex('roles')
        .insert({
          tenantId: roleData.space === 'system' ? null : tenantId,
          name: roleData.name,
          description: roleData.description || null,
          space: roleData.space || 'tenant',
        })
        .returning(['id', 'tenantId', 'name', 'description', 'space', 'status', 'createdAt', 'updatedAt']);

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

      let query = knex('roles as r')
        .select(
          'r.id',
          'r.tenantId',
          'r.name',
          'r.description',
          'r.space',
          'r.status',
          'r.createdAt',
          'r.updatedAt',
          knex.raw(`json_agg(
            json_build_object(
              'id', p.id,
              'permissionKey', p.permission_key,
              'resource', p.resource,
              'action', p.action,
              'description', p.description,
              'space', p.space
            )
          ) FILTER (WHERE p.id IS NOT NULL) as permissions`)
        )
        .leftJoin('rolePermissions as rps', 'r.id', 'rps.roleId')
        .leftJoin('permissions as p', 'rps.permissionId', 'p.id')
        .where('r.id', roleId)
        .groupBy('r.id');

      if (!isSuperAdmin) {
        query = query.andWhere(function() {
          this.where('r.tenantId', tenantId).orWhereNull('r.tenantId');
        });
      }

      const role = await query.first();

      if (!role) {
        throw new Error('Role not found');
      }
      
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

      // Build query
      let query = knex('roles as r')
        .select(
          'r.id',
          'r.tenantId',
          'r.name',
          'r.description',
          'r.space',
          'r.status',
          'r.createdAt',
          'r.updatedAt',
          knex.raw('COUNT(rps.permission_id) as permission_count')
        )
        .leftJoin('rolePermissions as rps', 'r.id', 'rps.roleId')
        .groupBy('r.id')
        .orderBy('r.createdAt', 'desc')
        .limit(limit)
        .offset(offset);

      // Apply tenant filter (Super Admin sees all)
      if (!isSuperAdmin) {
        query = query.where(function() {
          this.where('r.tenantId', tenantId).orWhereNull('r.tenantId');
        });
      }

      // Apply space filter if provided
      if (space) {
        query = query.andWhere('r.space', space);
      }

      // Count query
      let countQuery = knex('roles as r').count('* as total');
      if (!isSuperAdmin) {
        countQuery = countQuery.where(function() {
          this.where('r.tenantId', tenantId).orWhereNull('r.tenantId');
        });
      }
      if (space) {
        countQuery = countQuery.andWhere('r.space', space);
      }

      const [{ total }, roles] = await Promise.all([
        countQuery.first(),
        query,
      ]);

      const transformedRoles = roles.map(row => ({
        ...row,
        permissionCount: parseInt(row.permissionCount) || 0,
      }));

      return {
        roles: transformedRoles,
        pagination: {
          page,
          limit,
          total: parseInt(total),
          pages: Math.ceil(parseInt(total) / limit),
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
      const existingRole = await knex('roles')
        .select('id', 'tenantId', 'space', 'name')
        .where({ id: roleId })
        .first();

      if (!existingRole) {
        throw new Error('Role not found');
      }

      const isSuperAdmin = tenantId === null;

      // SECURITY CHECK: Super Admin cannot modify tenant roles
      if (isSuperAdmin && existingRole.space === 'tenant') {
        throw new Error(
          '🚫 PERMISSION DENIED: System administrators cannot modify tenant-space roles. ' +
          `Role "${existingRole.name}" belongs to a tenant and must be managed by that tenant's administrators.`,
        );
      }

      // SECURITY CHECK: Tenant users cannot modify system roles
      if (!isSuperAdmin && existingRole.space === 'system') {
        throw new Error(
          '🚫 PERMISSION DENIED: Tenant users cannot modify system-space roles. ' +
          `Role "${existingRole.name}" is a system role and can only be managed by system administrators.`,
        );
      }

      // SECURITY CHECK: Tenant users can only modify roles in their own tenant
      if (!isSuperAdmin && existingRole.tenantId !== tenantId) {
        throw new Error(
          '🚫 PERMISSION DENIED: You can only modify roles within your own tenant.',
        );
      }

      const updateFields = {};

      if (updateData.name !== undefined) {
        updateFields.name = updateData.name;
      }

      if (updateData.description !== undefined) {
        updateFields.description = updateData.description;
      }

      if (Object.keys(updateFields).length === 0) {
        throw new Error('No fields to update');
      }

      updateFields.updatedAt = knex.fn.now();

      const [role] = await knex('roles')
        .update(updateFields)
        .where({ id: roleId })
        .returning(['id', 'tenantId', 'name', 'description', 'space', 'status', 'createdAt', 'updatedAt']);

      if (!role) {
        throw new Error('Role not found or update failed');
      }

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
      const existingRole = await knex('roles')
        .select('id', 'tenantId', 'space', 'name')
        .where({ id: roleId })
        .first();

      if (!existingRole) {
        throw new Error('Role not found');
      }

      const isSuperAdmin = tenantId === null;

      // SECURITY CHECK: Super Admin cannot delete tenant roles
      if (isSuperAdmin && existingRole.space === 'tenant') {
        throw new Error(
          '🚫 PERMISSION DENIED: System administrators cannot delete tenant-space roles. ' +
          `Role "${existingRole.name}" belongs to a tenant and must be managed by that tenant's administrators.`,
        );
      }

      // SECURITY CHECK: Tenant users cannot delete system roles
      if (!isSuperAdmin && existingRole.space === 'system') {
        throw new Error(
          '🚫 PERMISSION DENIED: Tenant users cannot delete system-space roles. ' +
          `Role "${existingRole.name}" is a system role and can only be managed by system administrators.`,
        );
      }

      // SECURITY CHECK: Tenant users can only delete roles in their own tenant
      if (!isSuperAdmin && existingRole.tenantId !== tenantId) {
        throw new Error(
          '🚫 PERMISSION DENIED: You can only delete roles within your own tenant.',
        );
      }

      const [role] = await knex('roles')
        .where({ id: roleId })
        .del()
        .returning(['id', 'name']);

      if (!role) {
        throw new Error('Role not found or delete failed');
      }

      await this.auditLog(requestingUserId, tenantId, 'delete', 'role', roleId, { name: role.name });

      logger.info(`Role deleted: ${role.name} (ID: ${roleId})`);
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
    try {
      return await knex.transaction(async (trx) => {
        logger.info(`🔄 Bulk assigning permissions to role ${roleId}...`);

        // CRITICAL: Get role space to validate permission assignments
        const role = await trx('roles')
          .select('id', 'space', 'tenantId', 'name')
          .where({ id: roleId })
          .first();

        if (!role) {
          throw new Error(`Role not found: ${roleId}`);
        }

        const { space: roleSpace, tenantId: roleTenantId, name: roleName } = role;
        const isSuperAdmin = tenantId === null;

        // SECURITY CHECK: Super Admin cannot assign permissions to tenant roles
        if (isSuperAdmin && roleSpace === 'tenant') {
          throw new Error(
            '🚫 PERMISSION DENIED: System administrators cannot modify permissions for tenant-space roles. ' +
            `Role "${roleName}" belongs to a tenant and must be managed by that tenant's administrators.`,
          );
        }

        // SECURITY CHECK: Tenant users cannot assign permissions to system roles
        if (!isSuperAdmin && roleSpace === 'system') {
          throw new Error(
            '🚫 PERMISSION DENIED: Tenant users cannot modify permissions for system-space roles. ' +
            `Role "${roleName}" is a system role and can only be managed by system administrators.`,
          );
        }

        // SECURITY CHECK: Tenant users can only assign permissions to roles in their own tenant
        if (!isSuperAdmin && roleTenantId !== tenantId) {
          throw new Error(
            '🚫 PERMISSION DENIED: You can only modify permissions for roles within your own tenant.',
          );
        }

        // Delete all existing permissions for this role
        await trx('rolePermissions')
          .where({ roleId })
          .del();

        let insertedCount = 0;
        let notFoundCount = 0;
        const notFoundPermissions = [];
        
        for (const perm of permissions) {
          const { permissionKey } = perm;
          
          if (!permissionKey) {
            logger.warn(`⚠️ Skipping invalid permission (missing permissionKey): ${JSON.stringify(perm)}`);
            continue;
          }

          // Get the permission ID and space from permissions table
          const permission = await trx('permissions')
            .select('id', 'space')
            .where({ permissionKey })
            .first();

          if (!permission) {
            logger.warn(`⚠️ Permission not found in database: ${permissionKey}`);
            notFoundPermissions.push(permissionKey);
            notFoundCount++;
            continue;
          }

          const { id: permissionId, space: permissionSpace } = permission;

          // CRITICAL SECURITY CHECK: Validate permission space matches role space
          if (roleSpace !== permissionSpace) {
            const errorMsg = 
              `🚫 SECURITY VIOLATION: Cannot assign ${permissionSpace}-space permission "${permissionKey}" to ${roleSpace}-space role "${roleName}". ` +
              `For security reasons, ${roleSpace === 'system' ? 'system roles can only have system permissions' : 'tenant roles can only have tenant permissions'}.`;
            logger.error(errorMsg);
            throw new Error(errorMsg);
          }

          // Insert the role-permission mapping
          await trx('rolePermissions')
            .insert({ roleId, permissionId })
            .onConflict(['roleId', 'permissionId'])
            .ignore();

          insertedCount++;
        }

        await this.auditLog(requestingUserId, tenantId, 'bulk_assign_permissions', 'role', roleId, {
          permissionsCount: insertedCount,
          notFoundCount,
          notFoundPermissions,
        });

        logger.info(`✅ Bulk assigned ${insertedCount} permissions to role ${roleId}`);

        return {
          count: insertedCount,
          notFoundCount,
          notFoundPermissions,
          message: `${insertedCount} permissions assigned successfully${notFoundCount > 0 ? `, ${notFoundCount} not found` : ''}`,
        };
      });
    } catch (err) {
      logger.error(`❌ Bulk assign permissions error: ${err.message}`);
      logger.error(err.stack);
      throw err;
    }
  }

  /**
   * Grant single permission to role
   * SECURITY: Super Admin can only grant permissions to system roles
   */
  static async grantPermission(roleId, permissionKey, requestingUserId, tenantId) {
    try {
      // CRITICAL: Get role space to validate permission assignment
      const role = await knex('roles')
        .select('id', 'space', 'tenantId', 'name')
        .where({ id: roleId })
        .first();

      if (!role) {
        throw new Error(`Role not found: ${roleId}`);
      }

      const { space: roleSpace, tenantId: roleTenantId, name: roleName } = role;
      const isSuperAdmin = tenantId === null;

      // SECURITY CHECK: Super Admin cannot grant permissions to tenant roles
      if (isSuperAdmin && roleSpace === 'tenant') {
        throw new Error(
          '🚫 PERMISSION DENIED: System administrators cannot modify permissions for tenant-space roles. ' +
          `Role "${roleName}" belongs to a tenant and must be managed by that tenant's administrators.`,
        );
      }

      // SECURITY CHECK: Tenant users cannot grant permissions to system roles
      if (!isSuperAdmin && roleSpace === 'system') {
        throw new Error(
          '🚫 PERMISSION DENIED: Tenant users cannot modify permissions for system-space roles. ' +
          `Role "${roleName}" is a system role and can only be managed by system administrators.`,
        );
      }

      // SECURITY CHECK: Tenant users can only grant permissions to roles in their own tenant
      if (!isSuperAdmin && roleTenantId !== tenantId) {
        throw new Error(
          '🚫 PERMISSION DENIED: You can only modify permissions for roles within your own tenant.',
        );
      }

      // Get permission ID and space
      const permission = await knex('permissions')
        .select('id', 'space')
        .where({ permissionKey })
        .first();

      if (!permission) {
        throw new Error(`Permission not found: ${permissionKey}`);
      }

      const { id: permissionId, space: permissionSpace } = permission;

      // CRITICAL SECURITY CHECK: Validate permission space matches role space
      if (roleSpace !== permissionSpace) {
        const errorMsg = 
          `🚫 SECURITY VIOLATION: Cannot assign ${permissionSpace}-space permission "${permissionKey}" to ${roleSpace}-space role "${roleName}". ` +
          `For security reasons, ${roleSpace === 'system' ? 'system roles can only have system permissions' : 'tenant roles can only have tenant permissions'}.`;
        logger.error(errorMsg);
        throw new Error(errorMsg);
      }

      // Insert role-permission mapping
      await knex('rolePermissions')
        .insert({ roleId, permissionId })
        .onConflict(['roleId', 'permissionId'])
        .ignore();

      await this.auditLog(requestingUserId, tenantId, 'grant_permission', 'role', roleId, {
        permissionKey,
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
      const role = await knex('roles')
        .select('id', 'space', 'tenantId', 'name')
        .where({ id: roleId })
        .first();

      if (!role) {
        throw new Error(`Role not found: ${roleId}`);
      }

      const { space: roleSpace, tenantId: roleTenantId, name: roleName } = role;
      const isSuperAdmin = tenantId === null;

      // SECURITY CHECK: Super Admin cannot revoke permissions from tenant roles
      if (isSuperAdmin && roleSpace === 'tenant') {
        throw new Error(
          '🚫 PERMISSION DENIED: System administrators cannot modify permissions for tenant-space roles. ' +
          `Role "${roleName}" belongs to a tenant and must be managed by that tenant's administrators.`,
        );
      }

      // SECURITY CHECK: Tenant users cannot revoke permissions from system roles
      if (!isSuperAdmin && roleSpace === 'system') {
        throw new Error(
          '🚫 PERMISSION DENIED: Tenant users cannot modify permissions for system-space roles. ' +
          `Role "${roleName}" is a system role and can only be managed by system administrators.`,
        );
      }

      // SECURITY CHECK: Tenant users can only revoke permissions from roles in their own tenant
      if (!isSuperAdmin && roleTenantId !== tenantId) {
        throw new Error(
          '🚫 PERMISSION DENIED: You can only modify permissions for roles within your own tenant.',
        );
      }

      // Get permission ID
      const permission = await knex('permissions')
        .select('id')
        .where({ permissionKey })
        .first();

      if (!permission) {
        throw new Error(`Permission not found: ${permissionKey}`);
      }

      // Delete role-permission mapping
      await knex('rolePermissions')
        .where({ roleId, permissionId: permission.id })
        .del();

      await this.auditLog(requestingUserId, tenantId, 'revoke_permission', 'role', roleId, {
        permissionKey,
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
      let query = knex('permissions')
        .select('*')
        .orderBy(['resource', 'action']);
      
      if (space) {
        query = query.where(function() {
          this.where('space', space).orWhere('space', 'both');
        });
      }
      
      const permissions = await query;
      
      return permissions;
    } catch (err) {
      logger.error(`Get all permissions error: ${err.message}`);
      throw err;
    }
  }

  /**
   * Audit logging helper
   */
  static async auditLog(userId, tenantId, action, resourceType, resourceId, details) {
    try {
      await knex('auditLogs').insert({
        userId,
        tenantId,
        action,
        resourceType,
        resourceId,
        newValues: JSON.stringify(details),
        status: 'success',
      });
    } catch (err) {
      logger.error(`Audit log error: ${err.message}`);
    }
  }
}

module.exports = RoleService;
