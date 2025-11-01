/**
 * Fix RBAC Design - Remove module_id confusion
 * Our design: role → menu_key → action
 * This script:
 * 1. Clears existing broken permissions
 * 2. Recreates permissions using ONLY menu_key (no module_id)
 * 3. Assigns System Administrator role to admin user
 */

const { Pool } = require('pg');
const config = require('./src/config/env');

const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.database,
  user: config.database.user,
  password: config.database.password,
});

async function fixRBACDesign() {
  const client = await pool.connect();

  try {
    await client.query('BEGIN');

    console.log('🔧 Starting RBAC Design Fix...\n');

    // Step 1: Get System Administrator role
    const roleResult = await client.query(
      `SELECT id FROM roles WHERE name = 'System Administrator' AND space = 'system'`
    );

    if (roleResult.rows.length === 0) {
      // Create System Administrator role if doesn't exist
      const createRoleResult = await client.query(
        `INSERT INTO roles (name, description, space, status) 
         VALUES ($1, $2, $3, $4) 
         RETURNING id`,
        ['System Administrator', 'Full system access', 'system', 'active']
      );
      console.log('✓ Created System Administrator role');
      var systemAdminRoleId = createRoleResult.rows[0].id;
    } else {
      var systemAdminRoleId = roleResult.rows[0].id;
      console.log(`✓ Found System Administrator role (ID: ${systemAdminRoleId})`);
    }

    // Step 2: Clear existing broken permissions for this role
    const deleteResult = await client.query(
      `DELETE FROM role_permissions WHERE role_id = $1`,
      [systemAdminRoleId]
    );
    console.log(`✓ Cleared ${deleteResult.rowCount} old permissions\n`);

    // Step 3: Define permissions based on menu_key ONLY
    const permissions = [
      // Dashboard
      { menu_key: 'dashboard', action: 'view' },
      
      // Users Management
      { menu_key: 'users', action: 'view' },
      { menu_key: 'users', action: 'create' },
      { menu_key: 'users', action: 'edit' },
      { menu_key: 'users', action: 'delete' },
      { menu_key: 'users', action: 'export' },
      
      // Roles Management
      { menu_key: 'roles', action: 'view' },
      { menu_key: 'roles', action: 'create' },
      { menu_key: 'roles', action: 'edit' },
      { menu_key: 'roles', action: 'delete' },
      
      // Permissions Management
      { menu_key: 'permissions', action: 'view' },
      { menu_key: 'permissions', action: 'create' },
      { menu_key: 'permissions', action: 'edit' },
      { menu_key: 'permissions', action: 'delete' },
      
      // Tenants Management
      { menu_key: 'tenants', action: 'view' },
      { menu_key: 'tenants', action: 'create' },
      { menu_key: 'tenants', action: 'edit' },
      { menu_key: 'tenants', action: 'delete' },
      { menu_key: 'tenants', action: 'approve' },
      
      // Audit Logs
      { menu_key: 'audit', action: 'view' },
      { menu_key: 'audit', action: 'export' },
      
      // Settings
      { menu_key: 'settings', action: 'view' },
      { menu_key: 'settings', action: 'edit' },
    ];

    console.log('📝 Creating permissions (role → menu_key → action):\n');

    // Step 4: Insert permissions using ONLY menu_key (module_id will be NULL)
    let insertCount = 0;
    for (const perm of permissions) {
      const result = await client.query(
        `INSERT INTO role_permissions (role_id, menu_key, action_key, status)
         VALUES ($1, $2, $3, $4)
         ON CONFLICT (role_id, COALESCE(menu_key, ''), action_key) DO NOTHING
         RETURNING id`,
        [systemAdminRoleId, perm.menu_key, perm.action, 'active']
      );

      if (result.rows.length > 0) {
        console.log(`  ✓ ${perm.menu_key} → ${perm.action}`);
        insertCount++;
      }
    }

    console.log(`\n✓ Created ${insertCount} permissions\n`);

    // Step 5: Assign System Administrator role to admin user
    const adminResult = await client.query(
      `SELECT id FROM users WHERE email = 'admin@exitsaas.com'`
    );

    if (adminResult.rows.length > 0) {
      const adminUserId = adminResult.rows[0].id;

      await client.query(
        `INSERT INTO user_roles (user_id, role_id)
         VALUES ($1, $2)
         ON CONFLICT (user_id, role_id) DO NOTHING`,
        [adminUserId, systemAdminRoleId]
      );

      console.log(`✓ Assigned System Administrator role to admin user (ID: ${adminUserId})\n`);
    } else {
      console.log('⚠️  Warning: admin@exitsaas.com user not found\n');
    }

    await client.query('COMMIT');
    console.log('✅ RBAC Design Fix Complete!\n');

    // Verify the fix
    console.log('🔍 Verification:\n');

    const verifyPerms = await client.query(
      `SELECT menu_key, action_key, module_id 
       FROM role_permissions 
       WHERE role_id = $1 
       ORDER BY menu_key, action_key
       LIMIT 5`,
      [systemAdminRoleId]
    );

    console.log('Sample permissions:');
    verifyPerms.rows.forEach(row => {
      console.log(`  ${row.menu_key} → ${row.action_key} (module_id: ${row.module_id || 'NULL ✓'})`);
    });

    const verifyUserRole = await client.query(
      `SELECT ur.user_id, u.email, r.name 
       FROM user_roles ur
       JOIN users u ON ur.user_id = u.id
       JOIN roles r ON ur.role_id = r.id
       WHERE u.email = 'admin@exitsaas.com'`
    );

    console.log('\nUser role assignment:');
    if (verifyUserRole.rows.length > 0) {
      verifyUserRole.rows.forEach(row => {
        console.log(`  ${row.email} → ${row.name} ✓`);
      });
    }

  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixRBACDesign().catch(console.error);
