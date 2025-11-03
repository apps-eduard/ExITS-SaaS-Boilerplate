import { Injectable } from '@nestjs/common';
import { KnexService } from '../database/knex.service';

@Injectable()
export class PermissionsService {
  constructor(private knexService: KnexService) {}

  async hasPermission(
    userId: number,
    resource: string,
    action: string,
  ): Promise<boolean> {
    try {
      const knex = this.knexService.instance;
      const permissionKey = `${resource}:${action}`;

      const result = await knex('user_roles as ur')
        .join('roles as r', 'ur.role_id', 'r.id')
        .join('role_permissions as rps', 'r.id', 'rps.role_id')
        .join('permissions as p', 'rps.permission_id', 'p.id')
        .where('ur.user_id', userId)
        .where('p.permission_key', permissionKey)
        .where('r.status', 'active')
        .countDistinct('rps.role_id as count')
        .first();

      return Number(result.count) > 0;
    } catch (err) {
      console.error(`Permission check error: ${err.message}`);
      return false;
    }
  }

  async getUserPermissions(userId: number) {
    try {
      const knex = this.knexService.instance;

      const permissions = await knex('user_roles')
        .select('permissions.permission_key')
        .join('roles', 'user_roles.role_id', 'roles.id')
        .join('role_permissions', 'roles.id', 'role_permissions.role_id')
        .join('permissions', 'role_permissions.permission_id', 'permissions.id')
        .where({ 'user_roles.user_id': userId, 'roles.status': 'active' })
        .distinct()
        .pluck('permission_key');

      return permissions;
    } catch (err) {
      console.error(`Get user permissions error: ${err.message}`);
      throw err;
    }
  }

  async getRoles(tenantId?: number) {
    const knex = this.knexService.instance;

    const permissionCounts = knex('role_permissions')
      .select('role_id')
      .countDistinct({ permission_count: 'permission_id' })
      .groupBy('role_id')
      .as('rpc');

    const query = knex('roles as r')
      .leftJoin('tenants as t', 'r.tenant_id', 't.id')
      .leftJoin(permissionCounts, 'r.id', 'rpc.role_id')
      .select(
        'r.id',
        'r.name',
        'r.description',
        'r.space',
        'r.status',
        'r.tenant_id',
        'r.created_at',
        'r.updated_at',
        knex.raw('COALESCE(rpc.permission_count, 0) as permission_count'),
        knex.raw('t.name as tenant_name'),
      )
      .where('r.status', 'active');

    if (tenantId) {
      query.where('r.tenant_id', tenantId);
    }

    return await query.orderBy('r.name', 'asc');
  }

  async getRoleWithPermissions(roleId: number) {
    const knex = this.knexService.instance;

    const role = await knex('roles as r')
      .leftJoin('tenants as t', 'r.tenant_id', 't.id')
      .select(
        'r.id',
        'r.name',
        'r.description',
        'r.space',
        'r.status',
        'r.tenant_id',
        'r.created_at',
        'r.updated_at',
        knex.raw('t.name as tenant_name'),
      )
      .where('r.id', roleId)
      .first();

    if (!role) {
      return null;
    }

    const permissions = await knex('role_permissions as rp')
      .join('permissions as p', 'rp.permission_id', 'p.id')
      .select(
        'p.id',
        'p.permission_key',
        'p.resource',
        'p.action',
        'p.description',
        'p.space',
      )
      .where('rp.role_id', roleId)
      .orderBy('p.permission_key', 'asc');

    return {
      ...role,
      permissions,
    };
  }

  async getPermissions() {
    const knex = this.knexService.instance;
    return await knex('permissions').select('*').where('status', 'active');
  }

  async getRolePermissions(roleId: number) {
    const knex = this.knexService.instance;

    return await knex('role_permissions')
      .select('permissions.*')
      .join('permissions', 'role_permissions.permission_id', 'permissions.id')
      .where('role_permissions.role_id', roleId);
  }

  async assignPermissionToRole(roleId: number, permissionId: number) {
    const knex = this.knexService.instance;

    const existing = await knex('role_permissions')
      .where({ role_id: roleId, permission_id: permissionId })
      .first();

    if (existing) {
      return { message: 'Permission already assigned' };
    }

    await knex('role_permissions').insert({
      role_id: roleId,
      permission_id: permissionId,
    });

    return { message: 'Permission assigned successfully' };
  }

  async removePermissionFromRole(roleId: number, permissionId: number) {
    const knex = this.knexService.instance;

    await knex('role_permissions')
      .where({ role_id: roleId, permission_id: permissionId })
      .delete();

    return { message: 'Permission removed successfully' };
  }

  async getModules(space?: string) {
    const knex = this.knexService.instance;

    let query = knex('modules')
      .select('*')
      .where('status', 'active')
      .orderBy('menu_order', 'asc');

    if (space) {
      query = query.where('space', space);
    }

    const modules = await query;
    return modules;
  }

  async createRole(data: { name: string; description?: string | null; space: string; tenantId?: number | null }) {
    const knex = this.knexService.instance;

    const [role] = await knex('roles')
      .insert({
        name: data.name,
        description: data.description,
        space: data.space,
        tenant_id: data.tenantId,
        status: 'active',
        created_at: knex.fn.now(),
        updated_at: knex.fn.now(),
      })
      .returning('*');

    return role;
  }

  async updateRole(roleId: number, data: { name?: string; description?: string }) {
    const knex = this.knexService.instance;

    const updateData: any = {
      updated_at: knex.fn.now(),
    };

    if (data.name !== undefined) {
      updateData.name = data.name;
    }
    if (data.description !== undefined) {
      updateData.description = data.description;
    }

    const [updatedRole] = await knex('roles')
      .where('id', roleId)
      .update(updateData)
      .returning('*');

    return updatedRole;
  }

  async deleteRole(roleId: number) {
    const knex = this.knexService.instance;

    // Soft delete by setting status to 'deleted'
    await knex('roles')
      .where('id', roleId)
      .update({
        status: 'deleted',
        updated_at: knex.fn.now(),
      });

    // Optionally, also remove role permissions
    await knex('role_permissions')
      .where('role_id', roleId)
      .delete();

    return { message: 'Role deleted successfully' };
  }

  /**
   * Bulk assign permissions to a role
   * Replaces all existing permissions with the new list
   */
  async bulkAssignPermissions(
    roleId: number,
    permissions: Array<{ permissionKey: string }>,
  ): Promise<{ count: number; message: string }> {
    const knex = this.knexService.instance;

    // Extract permission keys
    const permissionKeys = permissions.map(p => p.permissionKey);

    if (permissionKeys.length === 0) {
      // If empty array, just clear all permissions
      await knex('role_permissions')
        .where('role_id', roleId)
        .delete();

      return {
        count: 0,
        message: 'All permissions removed from role',
      };
    }

    // Get permission IDs from keys
    const permissionRecords = await knex('permissions')
      .whereIn('permission_key', permissionKeys)
      .select('id', 'permission_key');

    const permissionMap = new Map(
      permissionRecords.map(p => [p.permissionKey, p.id])
    );

    // Validate all permission keys exist
    const missingKeys = permissionKeys.filter(key => !permissionMap.has(key));
    if (missingKeys.length > 0) {
      throw new Error(`Invalid permission keys: ${missingKeys.join(', ')}`);
    }

    // Use transaction to ensure atomicity
    await knex.transaction(async (trx) => {
      // Remove all existing permissions
      await trx('role_permissions')
        .where('role_id', roleId)
        .delete();

      // Insert new permissions
      const rolePermissions = permissionKeys.map(key => ({
        role_id: roleId,
        permission_id: permissionMap.get(key),
        created_at: new Date(),
      }));

      await trx('role_permissions').insert(rolePermissions);
    });

    return {
      count: permissionKeys.length,
      message: `Successfully assigned ${permissionKeys.length} permissions to role`,
    };
  }
}
