import type { Knex } from "knex";

/**
 * Migration: Add missing tenant permissions
 * - tenant-billing:update: Update tenant billing information
 * - tenant-reports:platform-usage: View platform usage reports
 */
export async function up(knex: Knex): Promise<void> {
  console.log('Adding missing tenant permissions...');
  
  // Define the permissions to add
  const permissions = [
    {
      permission_key: 'tenant-billing:update',
      resource: 'tenant-billing',
      action: 'update',
      description: 'Update tenant billing information and payment methods',
      space: 'tenant',
    },
    {
      permission_key: 'tenant-reports:platform-usage',
      resource: 'tenant-reports',
      action: 'platform-usage',
      description: 'View platform usage reports',
      space: 'tenant',
    }
  ];

  // Insert permissions (ignore if already exist)
  for (const perm of permissions) {
    const exists = await knex('permissions')
      .where('permission_key', perm.permission_key)
      .first();
    
    if (!exists) {
      await knex('permissions').insert(perm);
      console.log(`✅ Added permission: ${perm.permission_key}`);
    } else {
      console.log(`⏭️  Permission already exists: ${perm.permission_key}`);
    }
  }

  // Note: These are tenant-level permissions, so they can only be assigned to tenant-level roles
  // System roles (like Super Admin) cannot have tenant permissions due to space constraints
  
  // Assign to all Tenant Admin roles
  const tenantAdminRoles = await knex('roles')
    .where('name', 'Tenant Admin')
    .where('space', 'tenant');

  if (tenantAdminRoles.length > 0) {
    const newPermissions = await knex('permissions')
      .whereIn('permission_key', permissions.map(p => p.permission_key));

    for (const role of tenantAdminRoles) {
      for (const perm of newPermissions) {
        const mappingExists = await knex('role_permissions')
          .where('role_id', role.id)
          .where('permission_id', perm.id)
          .first();

        if (!mappingExists) {
          await knex('role_permissions').insert({
            role_id: role.id,
            permission_id: perm.id,
          });
        }
      }
    }
    console.log(`✅ Assigned permissions to ${tenantAdminRoles.length} Tenant Admin role(s)`);
  }
}

export async function down(knex: Knex): Promise<void> {
  console.log('Removing added tenant permissions...');
  
  const permissionKeys = [
    'tenant-billing:update',
    'tenant-reports:platform-usage'
  ];

  // Get permission IDs
  const permissions = await knex('permissions')
    .whereIn('permission_key', permissionKeys);

  const permissionIds = permissions.map(p => p.id);

  if (permissionIds.length > 0) {
    // Remove role-permission mappings
    await knex('role_permissions')
      .whereIn('permission_id', permissionIds)
      .delete();

    // Remove permissions
    await knex('permissions')
      .whereIn('permission_key', permissionKeys)
      .delete();

    console.log('✅ Removed permissions and mappings');
  }
}

