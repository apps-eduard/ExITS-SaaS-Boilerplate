const pool = require('./src/config/database');

async function checkRoles() {
  try {
    const roles = await pool.query('SELECT id, name, space FROM roles ORDER BY id');
    console.log('Roles in database:');
    roles.rows.forEach(r => console.log(`- ID ${r.id}: ${r.name} (${r.space})`));
    
    // Check tenant admin role permissions
    const rolePerms = await pool.query(`
      SELECT r.id, r.name, COUNT(rps.permission_id) as perm_count
      FROM roles r
      LEFT JOIN role_permissions rps ON r.id = rps.role_id
      WHERE r.name = 'Tenant Admin'
      GROUP BY r.id, r.name
    `);
    
    console.log('\nTenant Admin role permission counts:');
    rolePerms.rows.forEach(r => console.log(`- Role ${r.id} (${r.name}): ${r.perm_count} permissions`));
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkRoles();
