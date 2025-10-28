/**
 * Comprehensive Seed Script
 * IMPORTANT: Run this AFTER the initial seed.sql (npm run seed)
 * This extends the initial seed with:
 * - 2 Real Companies (Tenants) - not the default ExITS Platform
 * - Each company: 1 Tenant Admin + 2 Employees + 2 Customers
 * - Employees have full access to Money Loan module
 * - Money Loan modules
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

async function comprehensiveSeed() {
  const client = await pool.connect();
  try {
    console.log('🌱 Starting comprehensive seed (extending initial seed)...\n');

    // ==================== STEP 1: ADD MONEY LOAN MODULES ====================
    console.log('1️⃣  Adding Money Loan modules...');
    const moneyLoanModules = [
      { key: 'moneyloan-dashboard', name: 'Money Loan Dashboard', space: 'platform', actions: ['view'], icon: 'chart', order: 1 },
      { key: 'moneyloan-customers', name: 'Customers', space: 'platform', actions: ['view', 'create', 'edit', 'delete'], icon: 'people', order: 2 },
      { key: 'moneyloan-loans', name: 'Loans', space: 'platform', actions: ['view', 'create', 'edit', 'delete', 'approve'], icon: 'money', order: 3 },
      { key: 'moneyloan-payments', name: 'Payments', space: 'platform', actions: ['view', 'create', 'edit', 'delete'], icon: 'payment', order: 4 },
      { key: 'moneyloan-reports', name: 'Reports', space: 'platform', actions: ['view', 'export'], icon: 'document', order: 5 },
      { key: 'moneyloan-settings', name: 'Money Loan Settings', space: 'platform', actions: ['view', 'edit'], icon: 'cog', order: 6 },
    ];

    const moduleIds = {};
    
    // Also get existing module IDs for tenant modules
    const existingModules = await client.query(`SELECT id, menu_key FROM modules WHERE menu_key IN ('dashboard', 'users', 'roles')`);
    existingModules.rows.forEach(row => {
      moduleIds[row.menu_key] = row.id;
    });

    for (const module of moneyLoanModules) {
      const result = await client.query(`
        INSERT INTO modules (menu_key, display_name, space, status, action_keys, icon, menu_order)
        VALUES ($1, $2, $3, 'active', $4, $5, $6)
        ON CONFLICT (menu_key) DO UPDATE SET
          action_keys = EXCLUDED.action_keys,
          space = EXCLUDED.space
        RETURNING id
      `, [module.key, module.name, module.space, JSON.stringify(module.actions), module.icon, module.order]);
      
      moduleIds[module.key] = result.rows[0].id;
      console.log(`   ✅ ${module.name}`);
    }

    // ==================== STEP 2: CREATE COMPANIES (TENANTS) ====================
    console.log('\n2️⃣  Creating companies...');
    
    const companies = [
      { name: 'ACME Corporation', subdomain: 'acme', plan: 'enterprise' },
      { name: 'TechStart Solutions', subdomain: 'techstart', plan: 'pro' }
    ];

    const companyData = {};
    for (const company of companies) {
      const result = await client.query(`
        INSERT INTO tenants (name, subdomain, plan, status, max_users, primary_color, secondary_color)
        VALUES ($1, $2, $3, 'active', 100, '#6366f1', '#8b5cf6')
        ON CONFLICT (subdomain) DO UPDATE SET
          name = EXCLUDED.name,
          plan = EXCLUDED.plan
        RETURNING id
      `, [company.name, company.subdomain, company.plan]);
      
      const tenantId = result.rows[0].id;
      console.log(`   ✅ ${company.name} (Tenant ID: ${tenantId})`);

      // ==================== STEP 3: CREATE ROLES FOR THIS TENANT ====================
      console.log(`   📋 Creating roles for ${company.name}...`);
      
      // Tenant Admin Role
      const adminRole = await client.query(`
        INSERT INTO roles (tenant_id, name, description, space, status)
        VALUES ($1, 'Tenant Admin', 'Full access within tenant', 'tenant', 'active')
        RETURNING id
      `, [tenantId]);
      const tenantAdminRoleId = adminRole.rows[0].id;
      console.log(`      ✅ Tenant Admin role (ID: ${tenantAdminRoleId})`);

      // Employee Role
      const employeeRole = await client.query(`
        INSERT INTO roles (tenant_id, name, description, space, status)
        VALUES ($1, 'Employee', 'Employee with platform access', 'tenant', 'active')
        RETURNING id
      `, [tenantId]);
      const employeeRoleId = employeeRole.rows[0].id;
      console.log(`      ✅ Employee role (ID: ${employeeRoleId})`);

      // ==================== STEP 4: ASSIGN PERMISSIONS ====================
      console.log(`   🔑 Assigning permissions for ${company.name}...`);
      
      // Tenant Admin gets all tenant modules
      const tenantModules = await client.query(`
        SELECT id, menu_key, action_keys FROM modules WHERE space = 'tenant'
      `);
      
      for (const mod of tenantModules.rows) {
        const actions = JSON.parse(mod.action_keys || '["view"]');
        for (const action of actions) {
          await client.query(`
            INSERT INTO role_permissions (role_id, module_id, menu_key, action_key, status)
            VALUES ($1, $2, $3, $4, 'active')
            ON CONFLICT (role_id, COALESCE(menu_key, ''), action_key) DO NOTHING
          `, [tenantAdminRoleId, mod.id, mod.menu_key, action]);
        }
      }
      console.log(`      ✅ Tenant Admin permissions assigned`);

      // Employee gets tenant dashboard view + full Money Loan access
      await client.query(`
        INSERT INTO role_permissions (role_id, module_id, menu_key, action_key, status)
        VALUES ($1, $2, 'dashboard', 'view', 'active')
        ON CONFLICT (role_id, COALESCE(menu_key, ''), action_key) DO NOTHING
      `, [employeeRoleId, moduleIds['dashboard']]);
      
      for (const module of moneyLoanModules) {
        for (const action of module.actions) {
          await client.query(`
            INSERT INTO role_permissions (role_id, module_id, menu_key, action_key, status)
            VALUES ($1, $2, $3, $4, 'active')
            ON CONFLICT (role_id, COALESCE(menu_key, ''), action_key) DO NOTHING
          `, [employeeRoleId, moduleIds[module.key], module.key, action]);
        }
      }
      console.log(`      ✅ Employee permissions assigned (Money Loan access)`);

      companyData[company.subdomain] = {
        tenantId,
        tenantAdminRoleId,
        employeeRoleId
      };
    }

    // ==================== STEP 5: CREATE USERS ====================
    console.log('\n3️⃣  Creating users for each company...\n');
    
    const defaultPassword = await bcrypt.hash('Password@123', 10);
    
    for (const company of companies) {
      const { tenantId, tenantAdminRoleId, employeeRoleId } = companyData[company.subdomain];
      console.log(`   🏢 ${company.name}:`);
      
      // 1 Tenant Admin
      const adminEmail = `admin@${company.subdomain}.com`;
      const admin = await client.query(`
        INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, status, email_verified)
        VALUES ($1, $2, $3, 'Tenant', 'Admin', 'active', true)
        ON CONFLICT (tenant_id, email) DO UPDATE SET password_hash = EXCLUDED.password_hash
        RETURNING id
      `, [tenantId, adminEmail, defaultPassword]);
      
      await client.query(`
        INSERT INTO user_roles (user_id, role_id)
        VALUES ($1, $2)
        ON CONFLICT DO NOTHING
      `, [admin.rows[0].id, tenantAdminRoleId]);
      
      console.log(`      ✅ ${adminEmail} - Tenant Admin`);

      // 2 Employees with Money Loan access
      for (let i = 1; i <= 2; i++) {
        const empEmail = `employee${i}@${company.subdomain}.com`;
        const emp = await client.query(`
          INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, status, email_verified)
          VALUES ($1, $2, $3, $4, $5, 'active', true)
          ON CONFLICT (tenant_id, email) DO UPDATE SET password_hash = EXCLUDED.password_hash
          RETURNING id
        `, [tenantId, empEmail, defaultPassword, `Employee${i}`, company.name.split(' ')[0]]);
        
        await client.query(`
          INSERT INTO user_roles (user_id, role_id)
          VALUES ($1, $2)
          ON CONFLICT DO NOTHING
        `, [emp.rows[0].id, employeeRoleId]);
        
        console.log(`      ✅ ${empEmail} - Employee (Money Loan)`);
      }

      // 2 Money Loan Customers
      for (let i = 1; i <= 2; i++) {
        await client.query(`
          INSERT INTO loan_customers (
            tenant_id, customer_code, first_name, last_name, full_name, 
            phone, email, date_of_birth, gender,
            address, city, state, zip_code, country,
            monthly_income, credit_score, risk_level, status, kyc_status
          )
          VALUES (
            $1, $2, $3, $4, $5,
            $6, $7, $8, $9,
            $10, $11, $12, $13, $14,
            $15, $16, $17, 'active', 'verified'
          )
          ON CONFLICT DO NOTHING
        `, [
          tenantId,
          `CUST-${company.subdomain.toUpperCase()}-${String(i).padStart(4, '0')}`,
          `Customer${i}`,
          company.name.split(' ')[0],
          `Customer${i} ${company.name.split(' ')[0]}`,
          `+63 917 ${String(tenantId * 100000 + i).padStart(7, '0')}`,
          `customer${i}@${company.subdomain}.com`,
          i === 1 ? '1985-05-15' : '1990-08-22',
          i === 1 ? 'male' : 'female',
          `${100 + i} Main Street, Barangay ${i}`,
          i === 1 ? 'Manila' : 'Quezon City',
          'Metro Manila',
          '1000',
          'Philippines',
          50000 + (i * 10000),
          700 + (i * 50),
          'low',
        ]);
        
        console.log(`      ✅ customer${i}@${company.subdomain}.com - Money Loan Customer`);
      }
    }

    // ==================== SUMMARY ====================
    console.log('\n✅ Comprehensive seed completed successfully!\n');
    console.log('═══════════════════════════════════════════════════════');
    console.log('📝 LOGIN CREDENTIALS FOR QUICK ACCESS');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log('🔷 SYSTEM SPACE (Super Admin):');
    console.log('   Email: admin@exitsaas.com');
    console.log('   Password: Admin@123');
    console.log('   Access: Full system administration');
    console.log('   Space: SYSTEM\n');
    
    console.log('🔷 ACME CORPORATION (Tenant):');
    console.log('   👤 Tenant Admin:');
    console.log('      Email: admin@acme.com');
    console.log('      Password: Password@123');
    console.log('      Role: Tenant Admin');
    console.log('      Space: TENANT\n');
    console.log('   👥 Employees (Money Loan Full Access):');
    console.log('      Email: employee1@acme.com | Password: Password@123');
    console.log('      Email: employee2@acme.com | Password: Password@123');
    console.log('      Role: Employee');
    console.log('      Access: Money Loan Dashboard, Customers, Loans, Payments, Reports, Settings\n');
    console.log('   🧑 Customers (Money Loan):');
    console.log('      customer1@acme.com (Male, Credit: 750)');
    console.log('      customer2@acme.com (Female, Credit: 800)\n');
    
    console.log('🔷 TECHSTART SOLUTIONS (Tenant):');
    console.log('   👤 Tenant Admin:');
    console.log('      Email: admin@techstart.com');
    console.log('      Password: Password@123');
    console.log('      Role: Tenant Admin');
    console.log('      Space: TENANT\n');
    console.log('   👥 Employees (Money Loan Full Access):');
    console.log('      Email: employee1@techstart.com | Password: Password@123');
    console.log('      Email: employee2@techstart.com | Password: Password@123');
    console.log('      Role: Employee');
    console.log('      Access: Money Loan Dashboard, Customers, Loans, Payments, Reports, Settings\n');
    console.log('   🧑 Customers (Money Loan):');
    console.log('      customer1@techstart.com (Male, Credit: 750)');
    console.log('      customer2@techstart.com (Female, Credit: 800)\n');
    
    console.log('═══════════════════════════════════════════════════════');
    console.log('📊 STRUCTURE SUMMARY:');
    console.log('   ✅ 1 System Admin (admin@exitsaas.com)');
    console.log('   ✅ 2 Companies (ACME, TechStart)');
    console.log('   ✅ Each company has:');
    console.log('      - 1 Tenant Admin (full tenant access)');
    console.log('      - 2 Employees (Money Loan full access)');
    console.log('      - 2 Money Loan Customers');
    console.log('   ✅ Total: 1 System Admin + 6 Tenant Users + 4 Customers');
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    console.error(err.stack);
    process.exit(1);
  } finally {
    await client.release();
    await pool.end();
  }
}

comprehensiveSeed();
