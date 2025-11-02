/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  console.log('🔄 Adding missing tenant permissions (new migration)...');
  
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
  let skippedCount = 0;
  
  // Use a transaction to ensure all inserts complete or rollback
  await knex.transaction(async (trx) => {
    for (const perm of missingPermissions) {
      // Check if permission already exists
      const existing = await trx('permissions')
        .where('permission_key', perm.key)
        .first();
      
      if (!existing) {
        try {
          await trx('permissions').insert({
            permission_key: perm.key,
            resource: perm.resource,
            action: perm.action,
            description: perm.description,
            space: perm.space,
            created_at: trx.fn.now(),
            updated_at: trx.fn.now()
          });
          console.log('✅ Added permission:', perm.key);
          addedCount++;
        } catch (insertError) {
          console.log('❌ Failed to add permission:', perm.key, '-', insertError.message);
          throw insertError; // Rollback transaction on any error
        }
      } else {
        console.log('⚠️  Permission already exists:', perm.key);
        skippedCount++;
      }
    }

    // Auto-assign new tenant permissions to existing Tenant Admin roles
    if (addedCount > 0) {
      console.log('🔄 Auto-assigning new permissions to Tenant Admin roles...');
      
      const tenantAdminRoles = await trx('roles').where('name', 'Tenant Admin');
      const newTenantPermissions = await trx('permissions')
        .whereIn('permission_key', missingPermissions.map(p => p.key))
        .where('space', 'tenant');
      
      let assignedCount = 0;
      
      for (const role of tenantAdminRoles) {
        for (const perm of newTenantPermissions) {
          // Check if already assigned
          const existing = await trx('role_permissions')
            .where({ role_id: role.id, permission_id: perm.id })
            .first();
          
          if (!existing) {
            await trx('role_permissions').insert({
              role_id: role.id,
              permission_id: perm.id,
              created_at: trx.fn.now(),
              updated_at: trx.fn.now()
            });
            assignedCount++;
          }
        }
      }
      
      console.log(`✅ Auto-assigned ${assignedCount} permissions to Tenant Admin roles`);
    }
  });

  console.log(`🎉 Migration completed: Added ${addedCount} new permissions, skipped ${skippedCount} existing`);
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  console.log('🔄 Removing added tenant permissions...');
  
  const permissionsToRemove = [
    'tenant-dashboard:view',
    'tenant-users:read', 'tenant-users:create', 'tenant-users:update', 'tenant-users:delete', 'tenant-users:invite', 'tenant-users:assign-roles',
    'tenant-roles:read', 'tenant-roles:create', 'tenant-roles:update', 'tenant-roles:delete',
    'tenant-settings:read', 'tenant-settings:update',
    'loans:read', 'loans:create', 'loans:update', 'loans:delete', 'loans:approve', 'loans:disburse',
    'payments:read', 'payments:create', 'payments:update', 'payments:delete'
  ];

  await knex.transaction(async (trx) => {
    // Remove role assignments first
    let removedAssignments = 0;
    for (const permKey of permissionsToRemove) {
      const permission = await trx('permissions')
        .where('permission_key', permKey)
        .first();
      
      if (permission) {
        const deletedRows = await trx('role_permissions')
          .where('permission_id', permission.id)
          .delete();
        removedAssignments += deletedRows;
      }
    }

    // Remove permissions
    const deletedCount = await trx('permissions')
      .whereIn('permission_key', permissionsToRemove)
      .delete();
    
    console.log(`🗑️ Removed ${deletedCount} permissions and ${removedAssignments} role assignments`);
  });

  console.log('🎉 Rollback completed: Removed added tenant permissions');
};