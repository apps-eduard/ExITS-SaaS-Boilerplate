/**
 * Database Seed Script
 * Inserts test data for development and testing
 * Usage: node src/scripts/seed.js
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

async function seed() {
  const client = await pool.connect();
  try {
    console.log('Starting database seeding...');
    await client.query('BEGIN');

    // 1. Create test tenants
    const tenantRes = await client.query(
      `INSERT INTO tenants (name, subdomain, plan, status, max_users)
       VALUES
       ('ACME Corporation', 'acme', 'pro', 'active', 100),
       ('TechStartup Inc', 'techstartup', 'basic', 'active', 50),
       ('Enterprise Corp', 'enterprise', 'enterprise', 'active', 500)
       ON CONFLICT (subdomain) DO NOTHING
       RETURNING id, name`
    );
    console.log(`✅ Created ${tenantRes.rows.length} test tenants`);

    // Get all tenant IDs (including existing ones)
    const allTenantsRes = await client.query(
      `SELECT id FROM tenants WHERE subdomain IN ('acme', 'techstartup', 'enterprise') ORDER BY id`
    );
    const tenantIds = allTenantsRes.rows.map(r => r.id);
    console.log(`📋 Found ${tenantIds.length} total tenants`);

    // 2. Create system admin user
    const adminPassword = await bcrypt.hash('Admin@123456', 10);
    const adminRes = await client.query(
      `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, status, email_verified)
       VALUES ($1, $2, $3, $4, $5, $6, $7)
       ON CONFLICT (tenant_id, email) DO UPDATE SET
         password_hash = EXCLUDED.password_hash,
         first_name = EXCLUDED.first_name,
         last_name = EXCLUDED.last_name,
         status = EXCLUDED.status,
         email_verified = EXCLUDED.email_verified
       RETURNING id, email`,
      [
        null,
        'admin@exitsaas.com',
        adminPassword,
        'System',
        'Administrator',
        'active',
        true,
      ]
    );
    if (adminRes.rows[0]) {
      console.log(`✅ System admin user ready: ${adminRes.rows[0].email}`);
    }

    // 3. Create tenant admin users for each tenant
    const tenantAdminPassword = await bcrypt.hash('TenantAdmin@123456', 10);
    for (const tenantId of tenantIds) {
      const userRes = await client.query(
        `INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, status, email_verified)
         VALUES ($1, $2, $3, $4, $5, $6, $7)
         ON CONFLICT (tenant_id, email) DO UPDATE SET
           password_hash = EXCLUDED.password_hash,
           first_name = EXCLUDED.first_name,
           last_name = EXCLUDED.last_name,
           status = EXCLUDED.status,
           email_verified = EXCLUDED.email_verified
         RETURNING id, email`,
        [
          tenantId,
          `admin-${tenantId}@example.com`,
          tenantAdminPassword,
          'Tenant',
          'Administrator',
          'active',
          true,
        ]
      );
      if (userRes.rows[0]) {
        console.log(`✅ Tenant admin ready: ${userRes.rows[0].email}`);
      }
    }

    // 4. Create standard roles
    const roles = [
      {
        tenant_id: null,
        name: 'System Admin',
        description: 'Full system access',
        space: 'system',
      },
      {
        tenant_id: null,
        name: 'System User',
        description: 'System-level user role',
        space: 'system',
      },
    ];

    for (const role of roles) {
      try {
        await client.query(
          `INSERT INTO roles (tenant_id, name, description, space, status)
           VALUES ($1, $2, $3, $4, $5)`,
          [role.tenant_id, role.name, role.description, role.space, 'active']
        );
      } catch (err) {
        // Ignore duplicate key errors
        if (!err.message.includes('duplicate')) {
          throw err;
        }
      }
    }

    // Add tenant-specific roles
    for (const tenantId of tenantIds) {
      const tenantRoles = [
        { name: 'Tenant Admin', description: 'Tenant administrator' },
        { name: 'User Manager', description: 'Manage users' },
        { name: 'Analyst', description: 'Data analyst access' },
        { name: 'Viewer', description: 'Read-only access' },
      ];

      for (const role of tenantRoles) {
        try {
          await client.query(
            `INSERT INTO roles (tenant_id, name, description, space, status)
             VALUES ($1, $2, $3, $4, $5)`,
            [tenantId, role.name, role.description, 'tenant', 'active']
          );
        } catch (err) {
          // Ignore duplicate key errors
          if (!err.message.includes('duplicate')) {
            throw err;
          }
        }
      }
    }
    console.log('✅ Created roles for all tenants');

    // 5. Create modules (menu items)
    const modules = [
      {
        menu_key: 'dashboard',
        display_name: 'Dashboard',
        parent_menu_key: null,
        icon: 'dashboard',
        space: 'tenant',
        route_path: '/dashboard',
        component_name: 'DashboardComponent',
        action_keys: ['view'],
      },
      {
        menu_key: 'users',
        display_name: 'Users',
        parent_menu_key: null,
        icon: 'people',
        space: 'tenant',
        route_path: '/users',
        component_name: 'UsersComponent',
        action_keys: ['view', 'create', 'edit', 'delete'],
      },
      {
        menu_key: 'roles',
        display_name: 'Roles & Permissions',
        parent_menu_key: null,
        icon: 'security',
        space: 'tenant',
        route_path: '/roles',
        component_name: 'RolesComponent',
        action_keys: ['view', 'create', 'edit', 'delete'],
      },
      {
        menu_key: 'audit-logs',
        display_name: 'Audit Logs',
        parent_menu_key: null,
        icon: 'history',
        space: 'system',
        route_path: '/audit-logs',
        component_name: 'AuditLogsComponent',
        action_keys: ['view', 'export'],
      },
      {
        menu_key: 'tenants',
        display_name: 'Tenants',
        parent_menu_key: null,
        icon: 'business',
        space: 'system',
        route_path: '/tenants',
        component_name: 'TenantsComponent',
        action_keys: ['view', 'create', 'edit', 'delete'],
      },
      {
        menu_key: 'settings',
        display_name: 'Settings',
        parent_menu_key: null,
        icon: 'settings',
        space: 'tenant',
        route_path: '/settings',
        component_name: 'SettingsComponent',
        action_keys: ['view', 'edit'],
      },
    ];

    for (const module of modules) {
      try {
        await client.query(
          `INSERT INTO modules (menu_key, display_name, parent_menu_key, icon, space, route_path, component_name, action_keys, status)
           VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
          [
            module.menu_key,
            module.display_name,
            module.parent_menu_key,
            module.icon,
            module.space,
            module.route_path,
            module.component_name,
            JSON.stringify(module.action_keys),
            'active',
          ]
        );
      } catch (err) {
        // Ignore duplicate key errors
        if (!err.message.includes('duplicate')) {
          throw err;
        }
      }
    }
    console.log('✅ Created modules/menu items');

    // 6. Create role-permission assignments
    const rolePermsRes = await client.query(
      `SELECT r.id, r.name, r.space, m.id as module_id, m.menu_key
       FROM roles r
       CROSS JOIN modules m
       WHERE (r.space = 'system' AND m.space = 'system')
          OR (r.space = 'tenant' AND m.space = 'tenant')`
    );

    for (const row of rolePermsRes.rows) {
      const actions = ['view', 'create', 'edit', 'delete'];
      for (const action of actions) {
        try {
          await client.query(
            `INSERT INTO role_permissions (role_id, module_id, action_key, status)
             VALUES ($1, $2, $3, $4)`,
            [row.id, row.module_id, action, 'active']
          );
        } catch (err) {
          // Ignore duplicate key errors
          if (!err.message.includes('duplicate')) {
            throw err;
          }
        }
      }
    }
    console.log('✅ Created role-permission assignments');

    await client.query('COMMIT');
    console.log('\n✅ Database seeding completed successfully!');
    console.log('\n📝 Test Credentials:');
    console.log('   System Admin:');
    console.log('   - Email: admin@exitsaas.com');
    console.log('   - Password: Admin@123456');
    console.log('\n   Tenant Admins:');
    tenantIds.forEach((id, idx) => {
      console.log(`   - Email: admin-${id}@example.com (Tenant ${idx + 1})`);
      console.log('   - Password: TenantAdmin@123456');
    });
  } catch (err) {
    await client.query('ROLLBACK');
    console.error('❌ Seeding failed:', err.message);
    process.exit(1);
  } finally {
    await client.end();
    await pool.end();
  }
}

seed();
