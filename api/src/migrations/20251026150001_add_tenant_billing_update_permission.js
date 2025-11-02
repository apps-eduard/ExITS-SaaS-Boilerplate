/**
 * Migration: Add tenant-billing:update permission
 * This permission allows tenants to update their billing information and payment methods
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  console.log('Adding tenant-billing:update permission...');
  
  // Check if permission already exists
  const exists = await knex('permissions')
    .where('permission_key', 'tenant-billing:update')
    .first();
  
  if (!exists) {
    // Insert the permission
    await knex('permissions').insert({
      permission_key: 'tenant-billing:update',
      resource: 'tenant-billing',
      action: 'update',
      description: 'Update tenant billing information and payment methods',
      space: 'tenant',
    });
    
    console.log('✅ Added tenant-billing:update permission');
    
    // Assign to Tenant Admin role
    const tenantAdminRole = await knex('roles')
      .where('name', 'Tenant Admin')
      .where('space', 'tenant')
      .first();
    
    if (tenantAdminRole) {
      const permission = await knex('permissions')
        .where('permission_key', 'tenant-billing:update')
        .first();
      
      // Check if role-permission mapping already exists
      const mappingExists = await knex('role_permissions')
        .where('role_id', tenantAdminRole.id)
        .where('permission_id', permission.id)
        .first();
      
      if (!mappingExists) {
        await knex('role_permissions').insert({
          role_id: tenantAdminRole.id,
          permission_id: permission.id,
        });
        
        console.log('✅ Assigned tenant-billing:update to Tenant Admin role');
      } else {
        console.log('⏭️  Permission already assigned to Tenant Admin');
      }
    } else {
      console.log('⚠️  Tenant Admin role not found');
    }
  } else {
    console.log('⏭️  tenant-billing:update permission already exists');
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  console.log('Removing tenant-billing:update permission...');
  
  // Get permission ID
  const permission = await knex('permissions')
    .where('permission_key', 'tenant-billing:update')
    .first();
  
  if (permission) {
    // Remove role-permission mappings
    await knex('role_permissions')
      .where('permission_id', permission.id)
      .delete();
    
    // Remove permission
    await knex('permissions')
      .where('permission_key', 'tenant-billing:update')
      .delete();
    
    console.log('✅ Removed tenant-billing:update permission');
  }
};
