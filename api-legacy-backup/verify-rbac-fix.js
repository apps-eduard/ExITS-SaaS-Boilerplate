/**
 * Verify RBAC Fix
 * Checks that the admin user now has proper permissions
 */

const { Pool } = require('pg');
const config = require('./src/config/env');
const PermissionService = require('./src/services/PermissionService');

const pool = new Pool({
  host: config.database.host,
  port: config.database.port,
  database: config.database.database,
  user: config.database.user,
  password: config.database.password,
});

async function verifyRBAC() {
  try {
    console.log('🔍 Verifying RBAC Fix...\n');

    // Get admin user
    const userResult = await pool.query(
      `SELECT id, email FROM users WHERE email = 'admin@exitsaas.com'`
    );

    if (userResult.rows.length === 0) {
      console.log('❌ Admin user not found');
      return;
    }

    const adminUser = userResult.rows[0];
    console.log(`✓ Found user: ${adminUser.email} (ID: ${adminUser.id})\n`);

    // Check role assignment
    const roleResult = await pool.query(
      `SELECT r.name, r.space 
       FROM user_roles ur
       JOIN roles r ON ur.role_id = r.id
       WHERE ur.user_id = $1`,
      [adminUser.id]
    );

    console.log('User Roles:');
    roleResult.rows.forEach(row => {
      console.log(`  ✓ ${row.name} (${row.space})`);
    });
    console.log('');

    // Check permissions from database
    const permResult = await pool.query(
      `SELECT DISTINCT rp.menu_key, rp.action_key, rp.module_id
       FROM user_roles ur
       JOIN roles r ON ur.role_id = r.id
       JOIN role_permissions rp ON r.id = rp.role_id
       WHERE ur.user_id = $1 AND rp.menu_key = 'users'
       ORDER BY rp.menu_key, rp.action_key`,
      [adminUser.id]
    );

    console.log('User Permissions for "users" module:');
    permResult.rows.forEach(row => {
      console.log(`  ${row.menu_key} → ${row.action_key} (module_id: ${row.module_id || 'NULL ✓'})`);
    });
    console.log('');

    // Test PermissionService
    console.log('Testing PermissionService.hasPermission():');
    
    const testCases = [
      { module: 'users', action: 'view' },
      { module: 'users', action: 'create' },
      { module: 'users', action: 'edit' },
      { module: 'users', action: 'delete' },
      { module: 'roles', action: 'view' },
      { module: 'dashboard', action: 'view' },
    ];

    for (const test of testCases) {
      const hasPermission = await PermissionService.hasPermission(
        adminUser.id,
        test.module,
        test.action
      );
      const status = hasPermission ? '✓' : '❌';
      console.log(`  ${status} ${test.module} → ${test.action}: ${hasPermission}`);
    }

    console.log('\n✅ Verification Complete!\n');

    // Get all user permissions
    const allPerms = await PermissionService.getUserPermissions(adminUser.id);
    console.log('All User Permissions:');
    Object.entries(allPerms).forEach(([module, actions]) => {
      console.log(`  ${module}: ${actions.join(', ')}`);
    });

  } catch (error) {
    console.error('❌ Error:', error.message);
  } finally {
    await pool.end();
  }
}

verifyRBAC().catch(console.error);
