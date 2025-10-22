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
      parentRoleId: dbRole.parent_role_id,
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
        `INSERT INTO roles (tenant_id, name, description, space, parent_role_id)
         VALUES ($1, $2, $3, $4, $5)
         RETURNING id, tenant_id, name, description, space, parent_role_id, status, created_at, updated_at`,
        [
          roleData.space === 'system' ? null : tenantId,
          roleData.name,
          roleData.description || null,
          roleData.space,
          roleData.parentRoleId || null,
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
   */
  static async getRoleById(roleId, tenantId) {
    try {
      const roleResult = await pool.query(
        `SELECT r.id, r.tenant_id, r.name, r.description, r.space, r.parent_role_id, r.status,
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
         LEFT JOIN role_permissions_standard rps ON r.id = rps.role_id
         LEFT JOIN permissions p ON rps.permission_id = p.id
         WHERE r.id = $1 AND (r.tenant_id = $2 OR r.tenant_id IS NULL)
         GROUP BY r.id`,
        [roleId, tenantId]
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
   */
  static async listRoles(tenantId, page = 1, limit = 20, space = null) {
    try {
      const offset = (page - 1) * limit;

      let query = `
        SELECT r.id, r.tenant_id, r.name, r.description, r.space, r.parent_role_id, r.status,
               r.created_at, r.updated_at,
               COUNT(rps.permission_id) as permission_count
        FROM roles r
        LEFT JOIN role_permissions_standard rps ON r.id = rps.role_id
        WHERE (r.tenant_id = $1 OR r.tenant_id IS NULL)
      `;
      
      const params = [tenantId];
      let paramIndex = 2;
      
      if (space) {
        query += ` AND r.space = $${paramIndex}`;
        params.push(space);
        paramIndex++;
      }
      
      query += ` GROUP BY r.id ORDER BY r.created_at DESC LIMIT $${paramIndex} OFFSET $${paramIndex + 1}`;
      params.push(limit, offset);

      const countQuery = `
        SELECT COUNT(*) as total FROM roles r
        WHERE (r.tenant_id = $1 OR r.tenant_id IS NULL)
        ${space ? `AND r.space = $2` : ''}
      `;
      const countParams = space ? [tenantId, space] : [tenantId];

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

      if (updateData.parentRoleId !== undefined) {
        fieldsToUpdate.push(`parent_role_id = $${paramCount++}`);
        values.push(updateData.parentRoleId);
      }

      if (fieldsToUpdate.length === 0) {
        throw new Error('No fields to update');
      }

      fieldsToUpdate.push(`updated_at = NOW()`);
      values.push(roleId, tenantId);

      const result = await pool.query(
        `UPDATE roles
         SET ${fieldsToUpdate.join(', ')}
         WHERE id = $${paramCount} AND (tenant_id = $${paramCount + 1} OR tenant_id IS NULL)
         RETURNING id, tenant_id, name, description, space, parent_role_id, status, created_at, updated_at`,
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
   */
  static async deleteRole(roleId, requestingUserId, tenantId) {
    try {
      const result = await pool.query(
        `DELETE FROM roles
         WHERE id = $1 AND (tenant_id = $2 OR (tenant_id IS NULL AND $2::uuid IS NULL))
         RETURNING id, name`,
        [roleId, tenantId]
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
   */
  static async bulkAssignPermissions(roleId, permissions, requestingUserId, tenantId) {
    const client = await pool.connect();
    
    try {
      await client.query('BEGIN');

      // Delete all existing permissions for this role
      await client.query(
        'DELETE FROM role_permissions_standard WHERE role_id = $1',
        [roleId]
      );

      let insertedCount = 0;
      
      for (const perm of permissions) {
        const { permissionKey } = perm;
        
        if (!permissionKey) {
          logger.warn(`Skipping invalid permission: ${JSON.stringify(perm)}`);
          continue;
        }

        // Get the permission ID from permissions table
        const permResult = await client.query(
          'SELECT id FROM permissions WHERE permission_key = $1',
          [permissionKey]
        );

        if (permResult.rows.length === 0) {
          logger.warn(`Permission not found: ${permissionKey}`);
          continue;
        }

        const permissionId = permResult.rows[0].id;

        // Insert the role-permission mapping
        await client.query(
          `INSERT INTO role_permissions_standard (role_id, permission_id, granted_by)
           VALUES ($1, $2, $3)
           ON CONFLICT (role_id, permission_id) DO NOTHING`,
          [roleId, permissionId, requestingUserId]
        );

        insertedCount++;
      }

      await client.query('COMMIT');

      await this.auditLog(requestingUserId, tenantId, 'bulk_assign_permissions', 'role', roleId, {
        permissions_count: insertedCount,
      });

      logger.info(`✅ Bulk assigned ${insertedCount} permissions to role ${roleId}`);

      return {
        count: insertedCount,
        message: `${insertedCount} permissions assigned successfully`,
      };
    } catch (err) {
      await client.query('ROLLBACK');
      logger.error(`Bulk assign permissions error: ${err.message}`);
      throw err;
    } finally {
      client.release();
    }
  }

  /**
   * Grant single permission to role
   */
  static async grantPermission(roleId, permissionKey, requestingUserId, tenantId) {
    try {
      // Get permission ID
      const permResult = await pool.query(
        'SELECT id FROM permissions WHERE permission_key = $1',
        [permissionKey]
      );

      if (permResult.rows.length === 0) {
        throw new Error(`Permission not found: ${permissionKey}`);
      }

      const permissionId = permResult.rows[0].id;

      // Insert role-permission mapping
      const result = await pool.query(
        `INSERT INTO role_permissions_standard (role_id, permission_id, granted_by)
         VALUES ($1, $2, $3)
         ON CONFLICT (role_id, permission_id) DO NOTHING
         RETURNING *`,
        [roleId, permissionId, requestingUserId]
      );

      await this.auditLog(requestingUserId, tenantId, 'grant_permission', 'role', roleId, {
        permission_key: permissionKey,
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
   */
  static async revokePermission(roleId, permissionKey, requestingUserId, tenantId) {
    try {
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
        `DELETE FROM role_permissions_standard
         WHERE role_id = $1 AND permission_id = $2
         RETURNING *`,
        [roleId, permissionId]
      );

      await this.auditLog(requestingUserId, tenantId, 'revoke_permission', 'role', roleId, {
        permission_key: permissionKey,
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
