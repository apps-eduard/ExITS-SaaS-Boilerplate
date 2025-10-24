const pool = require('./src/config/database');

async function checkPermissions() {
  try {
    console.log('Current permissions in database:');
    const result = await pool.query(`
      SELECT permission_key, resource, action, description 
      FROM permissions 
      ORDER BY permission_key
    `);
    
    console.log('Total permissions:', result.rows.length);
    
    // Group by resource
    const grouped = {};
    result.rows.forEach(perm => {
      if (!grouped[perm.resource]) {
        grouped[perm.resource] = [];
      }
      grouped[perm.resource].push(perm.action);
    });
    
    console.log('\nPermissions by resource:');
    Object.keys(grouped).sort().forEach(resource => {
      console.log(`${resource}: ${grouped[resource].join(', ')}`);
    });
    
    console.log('\nMissing frontend permissions:');
    const frontendPerms = [
      'tenant-dashboard:view',
      'tenant-users:read',
      'tenant-users:create', 
      'tenant-users:update',
      'tenant-users:delete',
      'tenant-users:invite',
      'tenant-users:assign-roles',
      'tenant-roles:read',
      'tenant-roles:create',
      'tenant-roles:update',
      'tenant-roles:delete',
      'tenant-settings:read',
      'tenant-settings:update',
      'loans:read',
      'loans:create',
      'loans:update',
      'loans:delete',
      'loans:approve',
      'loans:disburse',
      'payments:read',
      'payments:create',
      'payments:update',
      'payments:delete'
    ];
    
    const existing = result.rows.map(r => r.permission_key);
    const missing = frontendPerms.filter(fp => !existing.includes(fp));
    
    console.log('Missing permissions:', missing);
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkPermissions();