/**
 * Comprehensive Seed Script
 * Creates tenants, users, roles, modules, permissions, and assigns them
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

async function simpleSeed() {
  const client = await pool.connect();
  try {
    console.log('🌱 Starting comprehensive seed...\n');

    // CLEANUP: Remove admin@exitsaas.com users that were created by seed.sql
    console.log('0. Cleaning up duplicate users...');
    await client.query(`
      DELETE FROM user_roles WHERE user_id IN (
        SELECT id FROM users WHERE email = 'admin@exitsaas.com'
      )
    `);
    await client.query(`
      DELETE FROM users WHERE email = 'admin@exitsaas.com'
    `);
    console.log(`✅ Cleaned up duplicate admin users`);

    // Create tenants
    console.log('\n1. Creating tenants...');
    await client.query(`
      INSERT INTO tenants (name, subdomain, plan, status, max_users, contact_person, contact_email, contact_phone, money_loan_enabled, bnpl_enabled, pawnshop_enabled)
      VALUES
      ('ACME Corporation', 'acme', 'pro', 'active', 100, 'John Doe', 'john.doe@acme.com', '+63-917-123-4567', true, false, false),
      ('TechStartup Inc', 'techstartup', 'starter', 'active', 50, 'Jane Smith', 'jane.smith@techstartup.com', '+63-918-234-5678', true, false, false),
      ('Enterprise Corp', 'enterprise', 'enterprise', 'active', 500, 'Bob Johnson', 'bob.johnson@enterprise.com', '+63-919-345-6789', true, false, false)
      ON CONFLICT (subdomain) DO NOTHING
    `);
    
    const tenantsRes = await client.query(`
      SELECT id, name FROM tenants 
      WHERE subdomain IN ('acme', 'techstartup', 'enterprise') 
      ORDER BY id
    `);
    console.log(`✅ ${tenantsRes.rows.length} tenants ready`);
    tenantsRes.rows.forEach(t => console.log(`   - ${t.name} (ID: ${t.id})`));

    // Create system admin
    console.log('\n2. Creating system admin...');
    const adminPassword = await bcrypt.hash('Admin@123', 10);
    await client.query(`
      INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, status, email_verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (tenant_id, email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash
      RETURNING id, email
    `, [null, 'admin@exitsaas.com', adminPassword, 'System', 'Administrator', 'active', true]);
    console.log(`✅ System admin: admin@exitsaas.com`);

    // Create tenant admins
    console.log('\n3. Creating tenant admins...');
    const tenantPassword = await bcrypt.hash('Admin@123', 10);
    const tenantIds = tenantsRes.rows.map(t => t.id);
    
    for (let i = 0; i < tenantIds.length; i++) {
      const email = `admin-${i+1}@example.com`;
      await client.query(`
        INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, status, email_verified)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (tenant_id, email) DO UPDATE SET
          password_hash = EXCLUDED.password_hash
        RETURNING id, email
      `, [tenantIds[i], email, tenantPassword, 'Tenant', 'Admin', 'active', true]);
      console.log(`✅ Tenant admin: ${email} (Tenant ID: ${tenantIds[i]})`);
    }

    // Create Roles
    console.log('\n4. Creating roles...');
    
    // Delete existing roles first
    await client.query(`DELETE FROM role_permissions WHERE role_id IN (SELECT id FROM roles WHERE name IN ('System Administrator', 'Tenant Administrator'))`);
    await client.query(`DELETE FROM user_roles WHERE role_id IN (SELECT id FROM roles WHERE name IN ('System Administrator', 'Tenant Administrator'))`);
    await client.query(`DELETE FROM roles WHERE name IN ('System Administrator', 'Tenant Administrator')`);
    
    // System Administrator Role (space='system', tenant_id=NULL)
    const systemAdminRoleResult = await client.query(`
      INSERT INTO roles (name, description, space, status, tenant_id)
      VALUES ($1, $2, $3, $4, $5)
      RETURNING id
    `, ['System Administrator', 'Full system access', 'system', 'active', null]);
    const systemAdminRoleId = systemAdminRoleResult.rows[0].id;
    console.log(`✅ System Administrator role (ID: ${systemAdminRoleId})`);

    // Create Tenant Administrator Role for each tenant (space='tenant', tenant_id=required)
    const tenantAdminRoleIds = [];
    for (let i = 0; i < tenantIds.length; i++) {
      const tenantAdminRoleResult = await client.query(`
        INSERT INTO roles (name, description, space, status, tenant_id)
        VALUES ($1, $2, $3, $4, $5)
        RETURNING id
      `, ['Tenant Administrator', 'Full tenant access', 'tenant', 'active', tenantIds[i]]);
      tenantAdminRoleIds.push(tenantAdminRoleResult.rows[0].id);
      console.log(`✅ Tenant Administrator role for Tenant ${tenantIds[i]} (ID: ${tenantAdminRoleResult.rows[0].id})`);
    }

    // Create Modules
    console.log('\n5. Creating modules...');
    const modules = [
      { key: 'dashboard', name: 'Dashboard', icon: 'dashboard', space: 'tenant', order: 1 },
      { key: 'users', name: 'User Management', icon: 'people', space: 'tenant', order: 2 },
      { key: 'roles', name: 'Roles & Permissions', icon: 'shield', space: 'tenant', order: 3 },
      { key: 'permissions', name: 'Permissions', icon: 'lock', space: 'system', order: 4 },
      { key: 'tenants', name: 'Tenant Management', icon: 'business', space: 'system', order: 5 },
      { key: 'audit', name: 'Audit Logs', icon: 'history', space: 'tenant', order: 6 },
      { key: 'settings', name: 'Settings', icon: 'settings', space: 'tenant', order: 7 },
    ];

    for (const module of modules) {
      await client.query(`
        INSERT INTO modules (menu_key, display_name, icon, space, menu_order, status)
        VALUES ($1, $2, $3, $4, $5, $6)
        ON CONFLICT (menu_key) DO UPDATE SET
          display_name = EXCLUDED.display_name,
          icon = EXCLUDED.icon,
          space = EXCLUDED.space,
          menu_order = EXCLUDED.menu_order
      `, [module.key, module.name, module.icon, module.space, module.order, 'active']);
    }
    console.log(`✅ Created ${modules.length} modules`);

    // Create System Administrator Permissions (all modules, all actions)
    console.log('\n6. Creating System Administrator permissions...');
    const systemPermissions = [
      // Dashboard
      { menu_key: 'dashboard', action: 'view' },
      
      // Users
      { menu_key: 'users', action: 'view' },
      { menu_key: 'users', action: 'create' },
      { menu_key: 'users', action: 'edit' },
      { menu_key: 'users', action: 'delete' },
      { menu_key: 'users', action: 'export' },
      
      // Roles
      { menu_key: 'roles', action: 'view' },
      { menu_key: 'roles', action: 'create' },
      { menu_key: 'roles', action: 'edit' },
      { menu_key: 'roles', action: 'delete' },
      
      // Permissions
      { menu_key: 'permissions', action: 'view' },
      { menu_key: 'permissions', action: 'create' },
      { menu_key: 'permissions', action: 'edit' },
      { menu_key: 'permissions', action: 'delete' },
      
      // Tenants
      { menu_key: 'tenants', action: 'view' },
      { menu_key: 'tenants', action: 'create' },
      { menu_key: 'tenants', action: 'edit' },
      { menu_key: 'tenants', action: 'delete' },
      { menu_key: 'tenants', action: 'approve' },
      
      // Audit
      { menu_key: 'audit', action: 'view' },
      { menu_key: 'audit', action: 'export' },
      
      // Settings
      { menu_key: 'settings', action: 'view' },
      { menu_key: 'settings', action: 'edit' },
      
      // Modules
      { menu_key: 'modules', action: 'view' },
      { menu_key: 'modules', action: 'create' },
      { menu_key: 'modules', action: 'edit' },
      { menu_key: 'modules', action: 'delete' },
      
      // System
      { menu_key: 'system', action: 'view' },
      { menu_key: 'system', action: 'edit' },
      
      // Monitoring
      { menu_key: 'monitoring', action: 'view' },
      { menu_key: 'monitoring', action: 'export' },
      
      // Configuration
      { menu_key: 'config', action: 'view' },
      { menu_key: 'config', action: 'edit' },
      
      // Billing
      { menu_key: 'billing', action: 'view' },
      { menu_key: 'billing', action: 'edit' },
    ];

    // Clear existing permissions for System Administrator
    await client.query('DELETE FROM role_permissions WHERE role_id = $1', [systemAdminRoleId]);

    let systemPermCount = 0;
    for (const perm of systemPermissions) {
      await client.query(`
        INSERT INTO role_permissions (role_id, module_id, menu_key, action_key, status)
        SELECT $1, m.id, m.menu_key, $2, 'active'
        FROM modules m
        WHERE m.menu_key = $3 AND m.status = 'active'
        ON CONFLICT (role_id, COALESCE(menu_key, ''), action_key) DO NOTHING
      `, [systemAdminRoleId, perm.action, perm.menu_key]);
      systemPermCount++;
    }
    console.log(`✅ Created ${systemPermCount} permissions for System Administrator`);

    // Create Tenant Administrator Permissions (apply to ALL tenant admin roles)
    console.log('\n7. Creating Tenant Administrator permissions...');
    const tenantPermissions = [
      // Dashboard
      { menu_key: 'dashboard', action: 'view' },
      
      // Users (tenant scope)
      { menu_key: 'users', action: 'view' },
      { menu_key: 'users', action: 'create' },
      { menu_key: 'users', action: 'edit' },
      { menu_key: 'users', action: 'delete' },
      { menu_key: 'users', action: 'export' },
      
      // Roles (tenant scope)
      { menu_key: 'roles', action: 'view' },
      { menu_key: 'roles', action: 'create' },
      { menu_key: 'roles', action: 'edit' },
      { menu_key: 'roles', action: 'delete' },
      
      // Audit (tenant scope)
      { menu_key: 'audit', action: 'view' },
      { menu_key: 'audit', action: 'export' },
      
      // Settings (tenant scope)
      { menu_key: 'settings', action: 'view' },
      { menu_key: 'settings', action: 'edit' },
    ];

    // Clear and create permissions for ALL tenant admin roles
    let tenantPermCount = 0;
    for (const tenantRoleId of tenantAdminRoleIds) {
      await client.query('DELETE FROM role_permissions WHERE role_id = $1', [tenantRoleId]);

      for (const perm of tenantPermissions) {
        await client.query(`
          INSERT INTO role_permissions (role_id, module_id, menu_key, action_key, status)
          SELECT $1, m.id, m.menu_key, $2, 'active'
          FROM modules m
          WHERE m.menu_key = $3 AND m.status = 'active'
          ON CONFLICT (role_id, COALESCE(menu_key, ''), action_key) DO NOTHING
        `, [tenantRoleId, perm.action, perm.menu_key]);
        tenantPermCount++;
      }
    }
    console.log(`✅ Created ${tenantPermCount} permissions for ${tenantAdminRoleIds.length} Tenant Administrator roles`);

    // Assign System Administrator role to system admin user
    console.log('\n8. Assigning roles to users...');
    const systemAdminUser = await client.query(
      `SELECT id FROM users WHERE email = 'admin@exitsaas.com'`
    );
    
    if (systemAdminUser.rows.length > 0) {
      await client.query(`
        INSERT INTO user_roles (user_id, role_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, role_id) DO NOTHING
      `, [systemAdminUser.rows[0].id, systemAdminRoleId]);
      console.log(`✅ System Administrator role assigned to admin@exitsaas.com`);
    }

    // Assign Tenant Administrator role to each tenant admin user (match by tenant_id)
    const tenantAdminUsers = await client.query(
      `SELECT id, email, tenant_id FROM users WHERE email LIKE 'admin-%@example.com' ORDER BY tenant_id`
    );

    for (let i = 0; i < tenantAdminUsers.rows.length; i++) {
      const user = tenantAdminUsers.rows[i];
      const roleId = tenantAdminRoleIds[i]; // Match role to user by index
      
      await client.query(`
        INSERT INTO user_roles (user_id, role_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, role_id) DO NOTHING
      `, [user.id, roleId]);
      console.log(`✅ Tenant Administrator role assigned to ${user.email} (Tenant ${user.tenant_id})`);
    }

    // Verify users
    console.log('\n9. Verifying setup...');
    const usersRes = await client.query(`
      SELECT id, email, tenant_id, status FROM users ORDER BY id
    `);
    console.log(`✅ Total users in database: ${usersRes.rows.length}`);
    usersRes.rows.forEach(u => {
      console.log(`   - ${u.email} | Tenant: ${u.tenant_id || 'System'} | Status: ${u.status}`);
    });

    // Verify role assignments
    const roleAssignments = await client.query(`
      SELECT u.email, r.name as role_name, r.space
      FROM user_roles ur
      JOIN users u ON ur.user_id = u.id
      JOIN roles r ON ur.role_id = r.id
      ORDER BY u.email
    `);
    console.log(`\n✅ Role assignments: ${roleAssignments.rows.length}`);
    roleAssignments.rows.forEach(ra => {
      console.log(`   - ${ra.email} → ${ra.role_name} (${ra.space})`);
    });

    console.log('\n✅ Seed completed successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('   System Admin: admin@exitsaas.com / Admin@123');
    console.log('   Tenant Admin 1: admin-1@example.com / Admin@123');
    console.log('   Tenant Admin 2: admin-2@example.com / Admin@123');
    console.log('   Tenant Admin 3: admin-3@example.com / Admin@123');
    console.log('\n📊 Summary:');
    console.log(`   - ${tenantsRes.rows.length} tenants created`);
    console.log(`   - ${usersRes.rows.length} users created`);
    console.log(`   - ${modules.length} modules created`);
    console.log(`   - ${systemPermCount} system permissions created`);
    console.log(`   - ${tenantPermCount} tenant permissions created`);
    console.log(`   - ${roleAssignments.rows.length} role assignments\n`);

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

simpleSeed();
