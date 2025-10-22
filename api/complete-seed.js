/**
 * Complete Seed Script - Creates roles, modules, permissions, and assigns them
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

async function completeSeed() {
  const client = await pool.connect();
  try {
    console.log('🌱 Starting complete seed with RBAC setup...\n');

    // 1. Create System Admin Role
    console.log('1. Creating System Admin role...');
    const roleResult = await client.query(`
      INSERT INTO roles (tenant_id, name, description, space, status)
      VALUES (NULL, 'System Administrator', 'Full system access with all permissions', 'system', 'active')
      ON CONFLICT DO NOTHING
      RETURNING id
    `);
    
    let systemAdminRoleId;
    if (roleResult.rows.length > 0) {
      systemAdminRoleId = roleResult.rows[0].id;
      console.log(`✅ System Administrator role created (ID: ${systemAdminRoleId})`);
    } else {
      const existingRole = await client.query(`
        SELECT id FROM roles WHERE name = 'System Administrator' AND space = 'system' AND tenant_id IS NULL
      `);
      systemAdminRoleId = existingRole.rows[0].id;
      console.log(`✅ System Administrator role exists (ID: ${systemAdminRoleId})`);
    }

    // 2. Create Modules with all actions
    console.log('\n2. Creating modules...');
    const modules = [
      { key: 'dashboard', name: 'Dashboard', actions: ['view'], icon: 'dashboard', order: 1 },
      { key: 'users', name: 'User Management', actions: ['view', 'create', 'edit', 'delete'], icon: 'people', order: 2 },
      { key: 'roles', name: 'Role Management', actions: ['view', 'create', 'edit', 'delete'], icon: 'shield', order: 3 },
      { key: 'permissions', name: 'Permission Management', actions: ['view', 'create', 'edit', 'delete'], icon: 'key', order: 4 },
      { key: 'tenants', name: 'Tenant Management', actions: ['view', 'create', 'edit', 'delete'], icon: 'business', order: 5 },
      { key: 'modules', name: 'Module Management', actions: ['view', 'create', 'edit', 'delete'], icon: 'apps', order: 6 },
      { key: 'audit', name: 'Audit Logs', actions: ['view'], icon: 'history', order: 7 },
      { key: 'settings', name: 'System Settings', actions: ['view', 'edit'], icon: 'settings', order: 8 }
    ];

    const moduleIds = {};
    for (const module of modules) {
      const result = await client.query(`
        INSERT INTO modules (menu_key, display_name, space, status, action_keys, icon, menu_order)
        VALUES ($1, $2, 'system', 'active', $3, $4, $5)
        ON CONFLICT (menu_key) DO UPDATE SET
          action_keys = EXCLUDED.action_keys,
          icon = EXCLUDED.icon,
          menu_order = EXCLUDED.menu_order
        RETURNING id
      `, [module.key, module.name, JSON.stringify(module.actions), module.icon, module.order]);
      
      moduleIds[module.key] = result.rows[0].id;
      console.log(`✅ Module: ${module.name} (ID: ${moduleIds[module.key]})`);
    }

    // 3. Create Role Permissions (System Admin gets all permissions)
    console.log('\n3. Creating role permissions for System Administrator...');
    
    // First, completely clear existing permissions for this role
    const deleteResult = await client.query('DELETE FROM role_permissions WHERE role_id = $1', [systemAdminRoleId]);
    console.log(`   🗑️  Cleared ${deleteResult.rowCount} existing permissions`);
    
    let permCount = 0;
    for (const module of modules) {
      const moduleId = moduleIds[module.key];
      for (const action of module.actions) {
        try {
          await client.query(`
            INSERT INTO role_permissions (role_id, module_id, action_key, status)
            VALUES ($1, $2, $3, 'active')
          `, [systemAdminRoleId, moduleId, action]);
          console.log(`   ✅ ${module.key} - ${action}`);
          permCount++;
        } catch (insertErr) {
          console.log(`   ⚠️  ${module.key} - ${action} (skipped: ${insertErr.message})`);
        }
      }
    }
    console.log(`   📊 Total permissions created: ${permCount}`);

    // 4. Get or create system admin user
    console.log('\n4. Setting up system admin user...');
    const adminPassword = await bcrypt.hash('Admin@123', 10);
    const userResult = await client.query(`
      INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, status, email_verified)
      VALUES (NULL, 'admin@exitsaas.com', $1, 'System', 'Administrator', 'active', true)
      ON CONFLICT (tenant_id, email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash,
        status = 'active'
      RETURNING id
    `, [adminPassword]);
    
    const systemAdminUserId = userResult.rows[0].id;
    console.log(`✅ System admin user ready (ID: ${systemAdminUserId})`);

    // 5. Assign System Administrator role to admin user
    console.log('\n5. Assigning System Administrator role to admin user...');
    await client.query(`
      INSERT INTO user_roles (user_id, role_id)
      VALUES ($1, $2)
      ON CONFLICT (user_id, role_id) DO NOTHING
    `, [systemAdminUserId, systemAdminRoleId]);
    console.log(`✅ Role assigned successfully`);

    // 6. Verify permissions
    console.log('\n6. Verifying permissions...');
    const permissionsCheck = await client.query(`
      SELECT 
        m.menu_key,
        m.display_name,
        rp.action_key
      FROM user_roles ur
      JOIN roles r ON ur.role_id = r.id
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN modules m ON rp.module_id = m.id
      WHERE ur.user_id = $1
      ORDER BY m.menu_key, rp.action_key
    `, [systemAdminUserId]);

    console.log(`✅ Total permissions: ${permissionsCheck.rows.length}`);
    
    // Group by module
    const groupedPermissions = {};
    permissionsCheck.rows.forEach(p => {
      if (!groupedPermissions[p.menu_key]) {
        groupedPermissions[p.menu_key] = [];
      }
      groupedPermissions[p.menu_key].push(p.action_key);
    });

    Object.entries(groupedPermissions).forEach(([module, actions]) => {
      console.log(`   📦 ${module}: ${actions.join(', ')}`);
    });

    // 7. Create tenants (optional)
    console.log('\n7. Creating sample tenants...');
    await client.query(`
      INSERT INTO tenants (name, subdomain, plan, status, max_users)
      VALUES
      ('ACME Corporation', 'acme', 'pro', 'active', 100),
      ('TechStartup Inc', 'techstartup', 'basic', 'active', 50)
      ON CONFLICT (subdomain) DO NOTHING
    `);
    console.log('✅ Sample tenants created');

    console.log('\n✅ Complete seed finished successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('   Email: admin@exitsaas.com');
    console.log('   Password: Admin@123');
    console.log('\n🔐 Permissions Summary:');
    console.log('   - Full access to all modules');
    console.log('   - All CRUD operations enabled');
    console.log('   - System-level administrator\n');

    await client.release();
    await pool.end();
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    console.error(err.stack);
    await client.release();
    await pool.end();
    process.exit(1);
  }
}

completeSeed();
