const pool = require('./src/config/database');

async function verifyRolePermissions() {
  try {
    console.log('Checking Tenant Admin role permissions...');
    
    const result = await pool.query(`
      SELECT p.permission_key, p.resource, p.action, p.description
      FROM role_permissions rps
      JOIN permissions p ON rps.permission_id = p.id
      WHERE rps.role_id = 3
      ORDER BY p.permission_key
    `);
    
    console.log(`Total permissions for Tenant Admin: ${result.rows.length}`);
    
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
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

verifyRolePermissions();
