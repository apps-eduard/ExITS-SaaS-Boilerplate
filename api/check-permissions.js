const pool = require('./src/config/database');

async function checkPermissions() {
  try {
    console.log('\n=== Tenant Admin Role Permissions ===\n');
    
    const result = await pool.query(`
      SELECT p.permission_key 
      FROM permissions p 
      JOIN role_permissions_standard rps ON p.id = rps.permission_id 
      JOIN roles r ON rps.role_id = r.id 
      WHERE r.name = 'Tenant Admin' 
      ORDER BY p.permission_key
    `);
    
    console.log('Permissions assigned to Tenant Admin:');
    result.rows.forEach(row => {
      console.log('  -', row.permission_key);
    });
    
    console.log('\nTotal:', result.rows.length, 'permissions\n');
    
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    await pool.end();
  }
}

checkPermissions();
