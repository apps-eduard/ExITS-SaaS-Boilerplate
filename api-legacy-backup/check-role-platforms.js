const pool = require('./src/config/database');

async function checkRolePermissions() {
  try {
    // Find Super Admin role
    const role = await pool.query(
      "SELECT id, name FROM roles WHERE name = 'Super Admin' LIMIT 1"
    );
    
    if (role.rows.length === 0) {
      console.log('❌ Super Admin role not found');
      process.exit(1);
    }
    
    const roleId = role.rows[0].id;
    console.log(`✅ Found Super Admin role (ID: ${roleId})`);
    
    // Check platforms permissions for Super Admin
    const perms = await pool.query(
      `SELECT p.permission_key 
       FROM role_permissions rp
       JOIN permissions p ON p.id = rp.permission_id
       WHERE rp.role_id = $1 AND p.permission_key LIKE 'platforms:%'
       ORDER BY p.permission_key`,
      [roleId]
    );
    
    console.log(`\n📦 Super Admin has ${perms.rows.length} platforms permissions:`);
    perms.rows.forEach(p => console.log(`   ✓ ${p.permission_key}`));
    
    // Check if any products permissions still assigned
    const oldPerms = await pool.query(
      `SELECT p.permission_key 
       FROM role_permissions rp
       JOIN permissions p ON p.id = rp.permission_id
       WHERE rp.role_id = $1 AND p.permission_key LIKE 'products:%'
       ORDER BY p.permission_key`,
      [roleId]
    );
    
    if (oldPerms.rows.length > 0) {
      console.log(`\n🗑️  Super Admin still has ${oldPerms.rows.length} OLD products permissions:`);
      oldPerms.rows.forEach(p => console.log(`   ✗ ${p.permission_key}`));
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkRolePermissions();
