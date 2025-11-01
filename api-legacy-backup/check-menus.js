const db = require('./src/config/database');

async function checkMenus() {
  try {
    console.log('\n📋 MODULES/MENUS IN DATABASE:\n');
    const modulesResult = await db.query(`
      SELECT id, menu_key, display_name, space FROM modules ORDER BY space, menu_key
    `);
    console.log('Modules:', modulesResult.rows);

    console.log('\n\n👥 SYSTEM ADMIN PERMISSIONS:\n');
    const systemAdminResult = await db.query(`
      SELECT 
        u.email,
        r.name as role_name,
        m.menu_key,
        rp.action_key
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN modules m ON rp.module_id = m.id
      WHERE u.email = 'admin@exitsaas.com'
      ORDER BY m.menu_key, rp.action_key
    `);
    console.log(`System Admin (${systemAdminResult.rows.length} permissions):`, systemAdminResult.rows);

    console.log('\n\n👥 TENANT ADMIN (admin-1) PERMISSIONS:\n');
    const tenantAdminResult = await db.query(`
      SELECT 
        u.email,
        r.name as role_name,
        m.menu_key,
        rp.action_key
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN modules m ON rp.module_id = m.id
      WHERE u.email = 'admin-1@example.com'
      ORDER BY m.menu_key, rp.action_key
    `);
    console.log(`Tenant Admin (${tenantAdminResult.rows.length} permissions):`, tenantAdminResult.rows);

    console.log('\n\n🔐 ROLE PERMISSIONS WITHOUT MODULE_ID (potential issue):\n');
    const noModuleResult = await db.query(`
      SELECT 
        r.name,
        rp.menu_key,
        rp.action_key,
        rp.module_id,
        COUNT(*) as count
      FROM role_permissions rp
      LEFT JOIN roles r ON rp.role_id = r.id
      WHERE rp.module_id IS NULL
      GROUP BY r.name, rp.menu_key, rp.action_key, rp.module_id
    `);
    console.log(`Permissions without module_id (${noModuleResult.rows.length}):`, noModuleResult.rows);

    await db.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkMenus();
