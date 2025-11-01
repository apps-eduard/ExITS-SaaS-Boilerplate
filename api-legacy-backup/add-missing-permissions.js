const pool = require('./src/config/database');

async function addMissingPermissions() {
  try {
    console.log('Adding missing permissions...');
    
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
      const existing = await pool.query(
        'SELECT id FROM permissions WHERE permission_key = $1',
        [perm.key]
      );
      
      if (existing.rows.length === 0) {
        await pool.query(
          `INSERT INTO permissions (permission_key, resource, action, description, space, created_at, updated_at)
           VALUES ($1, $2, $3, $4, $5, NOW(), NOW())`,
          [perm.key, perm.resource, perm.action, perm.description, perm.space]
        );
        console.log('✅ Added permission:', perm.key);
        addedCount++;
      } else {
        console.log('⚠️  Permission already exists:', perm.key);
      }
    }
    
    console.log(`\n🎉 Added ${addedCount} new permissions!`);
    
    // Now let's add these permissions to the Tenant Admin role (role ID 3)
    console.log('\nAssigning new permissions to Tenant Admin role...');
    
    const tenantPermissions = missingPermissions.filter(p => p.space === 'tenant');
    let assignedCount = 0;
    
    for (const perm of tenantPermissions) {
      const permResult = await pool.query(
        'SELECT id FROM permissions WHERE permission_key = $1',
        [perm.key]
      );
      
      if (permResult.rows.length > 0) {
        const permissionId = permResult.rows[0].id;
        
        // Check if already assigned
        const existing = await pool.query(
          'SELECT id FROM role_permissions WHERE role_id = $1 AND permission_id = $2',
          [3, permissionId]
        );
        
        if (existing.rows.length === 0) {
          await pool.query(
            'INSERT INTO role_permissions (role_id, permission_id, created_at, updated_at) VALUES ($1, $2, NOW(), NOW())',
            [3, permissionId]
          );
          console.log('✅ Assigned to Tenant Admin:', perm.key);
          assignedCount++;
        }
      }
    }
    
    console.log(`\n🎉 Assigned ${assignedCount} permissions to Tenant Admin role!`);
    
    await pool.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('Stack:', err.stack);
  }
}

addMissingPermissions();
