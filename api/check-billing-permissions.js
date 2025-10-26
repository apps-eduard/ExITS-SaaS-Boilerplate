const pool = require('./src/config/database');

async function checkPermissions() {
  try {
    // Check billing permissions
    const perms = await pool.query(`
      SELECT * FROM permissions 
      WHERE permission_key LIKE '%billing%' 
      ORDER BY permission_key
    `);
    
    console.log('📋 Billing Permissions:');
    perms.rows.forEach(p => {
      console.log(`  - ${p.permission_key}: ${p.description}`);
    });
    
    // Check if Tenant Admin role has tenant-billing:update
    const rolePerms = await pool.query(`
      SELECT r.name as role_name, p.permission_key, p.description
      FROM roles r
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON p.id = rp.permission_id
      WHERE r.name = 'Tenant Admin' AND p.permission_key LIKE '%billing%'
      ORDER BY p.permission_key
    `);
    
    console.log('\n👤 Tenant Admin Billing Permissions:');
    if (rolePerms.rows.length === 0) {
      console.log('  ❌ No billing permissions assigned!');
    } else {
      rolePerms.rows.forEach(p => {
        console.log(`  ✓ ${p.permission_key}: ${p.description}`);
      });
    }
    
    pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    pool.end();
  }
}

checkPermissions();
