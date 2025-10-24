const knex = require('knex')(require('./knexfile').development);

async function runMigrationLogic() {
  try {
    console.log('🔄 Running migration logic manually...');
    
    const missingPermissions = [
      // Tenant Dashboard
      { key: 'tenant-dashboard:view', resource: 'tenant-dashboard', action: 'view', description: 'View tenant dashboard', space: 'tenant' },
      
      // Tenant Users
      { key: 'tenant-users:read', resource: 'tenant-users', action: 'read', description: 'View tenant users', space: 'tenant' },
      { key: 'tenant-users:create', resource: 'tenant-users', action: 'create', description: 'Create tenant users', space: 'tenant' },
      { key: 'tenant-users:update', resource: 'tenant-users', action: 'update', description: 'Update tenant users', space: 'tenant' },
      { key: 'tenant-users:delete', resource: 'tenant-users', action: 'delete', description: 'Delete tenant users', space: 'tenant' },
      { key: 'tenant-users:invite', resource: 'tenant-users', action: 'invite', description: 'Invite new users to tenant', space: 'tenant' },
      { key: 'tenant-users:assign-roles', resource: 'tenant-users', action: 'assign-roles', description: 'Assign roles to tenant users', space: 'tenant' },
      
      // Tenant Roles
      { key: 'tenant-roles:read', resource: 'tenant-roles', action: 'read', description: 'View tenant roles', space: 'tenant' },
      { key: 'tenant-roles:create', resource: 'tenant-roles', action: 'create', description: 'Create tenant roles', space: 'tenant' },
      { key: 'tenant-roles:update', resource: 'tenant-roles', action: 'update', description: 'Update tenant roles', space: 'tenant' },
      { key: 'tenant-roles:delete', resource: 'tenant-roles', action: 'delete', description: 'Delete tenant roles', space: 'tenant' },
      
      // Tenant Settings
      { key: 'tenant-settings:read', resource: 'tenant-settings', action: 'read', description: 'View tenant settings', space: 'tenant' },
      { key: 'tenant-settings:update', resource: 'tenant-settings', action: 'update', description: 'Update tenant settings', space: 'tenant' },
      
      // Loans
      { key: 'loans:read', resource: 'loans', action: 'read', description: 'View loans', space: 'tenant' },
      { key: 'loans:create', resource: 'loans', action: 'create', description: 'Create new loans', space: 'tenant' },
      { key: 'loans:update', resource: 'loans', action: 'update', description: 'Update loan details', space: 'tenant' },
      { key: 'loans:delete', resource: 'loans', action: 'delete', description: 'Delete loans', space: 'tenant' },
      { key: 'loans:approve', resource: 'loans', action: 'approve', description: 'Approve/reject loans', space: 'tenant' },
      { key: 'loans:disburse', resource: 'loans', action: 'disburse', description: 'Disburse approved loans', space: 'tenant' },
      
      // Payments
      { key: 'payments:read', resource: 'payments', action: 'read', description: 'View payment information', space: 'tenant' },
      { key: 'payments:create', resource: 'payments', action: 'create', description: 'Process payments', space: 'tenant' },
      { key: 'payments:update', resource: 'payments', action: 'update', description: 'Update payment details', space: 'tenant' },
      { key: 'payments:delete', resource: 'payments', action: 'delete', description: 'Delete payments', space: 'tenant' }
    ];
    
    let addedCount = 0;
    
    for (const perm of missingPermissions) {
      // Check if permission already exists
      const existing = await knex('permissions')
        .where('permission_key', perm.key)
        .first();
      
      if (!existing) {
        try {
          const result = await knex('permissions').insert({
            permission_key: perm.key,
            resource: perm.resource,
            action: perm.action,
            description: perm.description,
            space: perm.space,
            created_at: knex.fn.now(),
            updated_at: knex.fn.now()
          });
          console.log('✅ Added permission:', perm.key);
          addedCount++;
        } catch (insertErr) {
          console.log('❌ Failed to add permission:', perm.key, '-', insertErr.message);
        }
      } else {
        console.log('⚠️  Permission already exists:', perm.key);
      }
    }
    
    console.log(`\n🎉 Added ${addedCount} permissions manually!`);
    
    // Now assign them to Tenant Admin roles
    console.log('\n🔄 Assigning permissions to Tenant Admin roles...');
    
    const tenantAdminRoles = await knex('roles').where('name', 'Tenant Admin');
    const tenantPermissions = await knex('permissions').where('space', 'tenant');
    
    let assignedCount = 0;
    
    for (const role of tenantAdminRoles) {
      for (const perm of tenantPermissions) {
        // Check if already assigned
        const existing = await knex('role_permissions_standard')
          .where({ role_id: role.id, permission_id: perm.id })
          .first();
        
        if (!existing) {
          await knex('role_permissions_standard').insert({
            role_id: role.id,
            permission_id: perm.id,
            created_at: knex.fn.now(),
            updated_at: knex.fn.now()
          });
          assignedCount++;
        }
      }
    }
    
    console.log(`✅ Assigned ${assignedCount} new permissions to Tenant Admin roles`);
    
    await knex.destroy();
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('Stack:', err.stack);
    await knex.destroy();
  }
}

runMigrationLogic();