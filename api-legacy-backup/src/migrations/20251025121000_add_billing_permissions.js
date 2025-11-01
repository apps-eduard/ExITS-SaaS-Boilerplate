/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  console.log('Adding billing permissions...');
  
  // Add billing permissions for subscription plan management
  const billingPermissions = [
    {
      permission_key: 'billing:create',
      resource: 'billing',
      action: 'create',
      description: 'Create billing records and subscription plans',
      space: 'system'
    },
    {
      permission_key: 'billing:read',
      resource: 'billing',
      action: 'read',
      description: 'View billing records and subscription plans',
      space: 'system'
    },
    {
      permission_key: 'billing:edit',
      resource: 'billing',
      action: 'edit',
      description: 'Edit billing records and subscription plans',
      space: 'system'
    },
    {
      permission_key: 'billing:delete',
      resource: 'billing',
      action: 'delete',
      description: 'Delete billing records and subscription plans',
      space: 'system'
    }
  ];

  // Insert permissions only if they don't exist
  for (const permission of billingPermissions) {
    const exists = await knex('permissions')
      .where('permission_key', permission.permission_key)
      .first();
    
    if (!exists) {
      await knex('permissions').insert(permission);
      console.log(`✅ Added permission: ${permission.permission_key}`);
    } else {
      console.log(`⏭️  Permission already exists: ${permission.permission_key}`);
    }
  }

  // Grant billing permissions to Super Admin role (role_id = 1)
  const superAdminRole = await knex('roles').where('name', 'Super Admin').first();
  
  if (superAdminRole) {
    const permissions = await knex('permissions')
      .whereIn('permission_key', billingPermissions.map(p => p.permission_key));
    
    for (const permission of permissions) {
      const exists = await knex('role_permissions')
        .where({
          role_id: superAdminRole.id,
          permission_id: permission.id
        })
        .first();
      
      if (!exists) {
        await knex('role_permissions').insert({
          role_id: superAdminRole.id,
          permission_id: permission.id
        });
        console.log(`✅ Granted ${permission.permission_key} to Super Admin`);
      }
    }
  }

  console.log('✅ Billing permissions migration completed');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  console.log('Removing billing permissions...');
  
  const billingPermissionKeys = [
    'billing:create',
    'billing:read',
    'billing:edit',
    'billing:delete'
  ];

  await knex('permissions')
    .whereIn('permission_key', billingPermissionKeys)
    .del();

  console.log('✅ Billing permissions removed');
};
