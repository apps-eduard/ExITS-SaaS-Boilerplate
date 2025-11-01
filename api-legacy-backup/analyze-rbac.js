const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

async function analyzeRBAC() {
  console.log('🔍 Analyzing RBAC Setup\n');
  
  // 1. Check system admin user
  console.log('1. System Admin User:');
  const userResult = await pool.query(`
    SELECT id, email, tenant_id, status FROM users WHERE email = 'admin@exitsaas.com'
  `);
  console.log(JSON.stringify(userResult.rows, null, 2));
  
  if (userResult.rows.length === 0) {
    console.log('❌ System admin user not found!');
    await pool.end();
    return;
  }
  
  const adminUserId = userResult.rows[0].id;
  
  // 2. Check assigned roles
  console.log('\n2. Assigned Roles:');
  const rolesResult = await pool.query(`
    SELECT ur.user_id, ur.role_id, r.name, r.space, r.status
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    WHERE ur.user_id = $1
  `, [adminUserId]);
  console.log(JSON.stringify(rolesResult.rows, null, 2));
  
  if (rolesResult.rows.length === 0) {
    console.log('❌ No roles assigned to system admin!');
  }
  
  // 3. Check modules
  console.log('\n3. Available Modules:');
  const modulesResult = await pool.query(`
    SELECT id, menu_key, display_name, space, status FROM modules ORDER BY menu_order
  `);
  console.log(JSON.stringify(modulesResult.rows, null, 2));
  
  // 4. Check role permissions for admin's roles
  if (rolesResult.rows.length > 0) {
    for (const role of rolesResult.rows) {
      console.log(`\n4. Permissions for Role "${role.name}" (ID: ${role.role_id}):`);
      const permsResult = await pool.query(`
        SELECT rp.id, rp.role_id, rp.module_id, rp.menu_key, rp.action_key, rp.status,
               m.menu_key as module_menu_key, m.display_name
        FROM role_permissions rp
        LEFT JOIN modules m ON rp.module_id = m.id
        WHERE rp.role_id = $1
        ORDER BY rp.module_id, rp.action_key
      `, [role.role_id]);
      console.log(JSON.stringify(permsResult.rows, null, 2));
    }
  }
  
  // 5. Test permission check
  console.log('\n5. Testing Permission Check (users - view):');
  const permCheckResult = await pool.query(`
    SELECT COUNT(*) as count FROM (
      SELECT DISTINCT rp.id
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN modules m ON rp.module_id = m.id
      WHERE ur.user_id = $1 AND m.menu_key = $2 AND rp.action_key = $3 AND rp.status = 'active'
    ) AS perms
  `, [adminUserId, 'users', 'view']);
  console.log(`Has permission: ${permCheckResult.rows[0].count > 0}`);
  console.log(`Count: ${permCheckResult.rows[0].count}`);
  
  // 6. Get all user permissions
  console.log('\n6. All User Permissions:');
  const allPermsResult = await pool.query(`
    SELECT DISTINCT m.menu_key, rp.action_key
    FROM user_roles ur
    JOIN roles r ON ur.role_id = r.id
    JOIN role_permissions rp ON r.id = rp.role_id
    JOIN modules m ON rp.module_id = m.id
    WHERE ur.user_id = $1 AND rp.status = 'active'
    ORDER BY m.menu_key, rp.action_key
  `, [adminUserId]);
  
  const grouped = {};
  allPermsResult.rows.forEach(p => {
    if (!grouped[p.menu_key]) grouped[p.menu_key] = [];
    grouped[p.menu_key].push(p.action_key);
  });
  
  console.log('Permissions by module:');
  Object.entries(grouped).forEach(([module, actions]) => {
    console.log(`  ${module}: ${actions.join(', ')}`);
  });
  
  await pool.end();
}

analyzeRBAC().catch(console.error);
