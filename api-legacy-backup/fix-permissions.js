const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

async function fixPermissions() {
  const client = await pool.connect();
  try {
    console.log('🔧 Fixing System Administrator Permissions\n');
    
    // Get role ID
    const roleResult = await client.query(`
      SELECT id FROM roles WHERE name = 'System Administrator' AND space = 'system'
    `);
    const roleId = roleResult.rows[0].id;
    console.log(`Role ID: ${roleId}`);
    
    // Delete ALL role_permissions for this role to start fresh
    await client.query(`DELETE FROM role_permissions WHERE role_id = $1`, [roleId]);
    console.log('✅ Cleared all existing permissions\n');
    
    // Get all modules
    const modulesResult = await client.query(`
      SELECT id, menu_key FROM modules WHERE space = 'system' ORDER BY menu_order
    `);
    
    // Define all permissions for System Administrator
    const permissions = [
      { moduleId: null, menuKey: 'dashboard', action: 'view' },
      { moduleId: null, menuKey: 'users', action: 'view' },
      { moduleId: null, menuKey: 'users', action: 'create' },
      { moduleId: null, menuKey: 'users', action: 'edit' },
      { moduleId: null, menuKey: 'users', action: 'delete' },
      { moduleId: null, menuKey: 'roles', action: 'view' },
      { moduleId: null, menuKey: 'roles', action: 'create' },
      { moduleId: null, menuKey: 'roles', action: 'edit' },
      { moduleId: null, menuKey: 'roles', action: 'delete' },
      { moduleId: null, menuKey: 'permissions', action: 'view' },
      { moduleId: null, menuKey: 'permissions', action: 'create' },
      { moduleId: null, menuKey: 'permissions', action: 'edit' },
      { moduleId: null, menuKey: 'permissions', action: 'delete' },
      { moduleId: null, menuKey: 'tenants', action: 'view' },
      { moduleId: null, menuKey: 'tenants', action: 'create' },
      { moduleId: null, menuKey: 'tenants', action: 'edit' },
      { moduleId: null, menuKey: 'tenants', action: 'delete' },
      { moduleId: null, menuKey: 'modules', action: 'view' },
      { moduleId: null, menuKey: 'modules', action: 'create' },
      { moduleId: null, menuKey: 'modules', action: 'edit' },
      { moduleId: null, menuKey: 'modules', action: 'delete' },
      { moduleId: null, menuKey: 'audit', action: 'view' },
      { moduleId: null, menuKey: 'settings', action: 'view' },
      { moduleId: null, menuKey: 'settings', action: 'edit' },
    ];
    
    // Get module IDs
    const moduleMap = {};
    modulesResult.rows.forEach(m => {
      moduleMap[m.menu_key] = m.id;
    });
    
    // Insert permissions using menu_key (not module_id) to match unique constraint
    console.log('Creating permissions:');
    for (const perm of permissions) {
      const moduleId = moduleMap[perm.menuKey];
      await client.query(`
        INSERT INTO role_permissions (role_id, module_id, menu_key, action_key, status)
        VALUES ($1, $2, $3, $4, 'active')
      `, [roleId, moduleId, perm.menuKey, perm.action]);
      console.log(`✅ ${perm.menuKey} - ${perm.action}`);
    }
    
    console.log(`\n✅ Created ${permissions.length} permissions successfully!`);
    
    await client.release();
    await pool.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    await client.release();
    await pool.end();
    process.exit(1);
  }
}

fixPermissions();
