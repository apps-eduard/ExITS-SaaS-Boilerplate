const bcrypt = require('bcryptjs');

/**
 * Comprehensive Test Data Seed
 * Creates complete test data structure:
 * - System Admin already exists from 01_initial_data.js
 * - 2 Companies (ACME, TechStart) 
 * - Each company: 1 Tenant Admin + 2 Employees + 2 Money Loan Customers
 * - Employees have full access to Money Loan module
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  console.log('\n🌱 Starting comprehensive test data seed...\n');

  try {
    // ==================== STEP 1: ADD MONEY LOAN MODULES ====================
    console.log('1️⃣  Adding Money Loan modules...');
    
    const moneyLoanModules = [
      { menu_key: 'moneyloan-dashboard', display_name: 'Money Loan Dashboard', space: 'tenant', icon: 'chart-bar', menu_order: 1, status: 'active' },
      { menu_key: 'moneyloan-customers', display_name: 'Customers', space: 'tenant', icon: 'users', menu_order: 2, status: 'active' },
      { menu_key: 'moneyloan-loans', display_name: 'Loans', space: 'tenant', icon: 'cash', menu_order: 3, status: 'active' },
      { menu_key: 'moneyloan-payments', display_name: 'Payments', space: 'tenant', icon: 'credit-card', menu_order: 4, status: 'active' },
      { menu_key: 'moneyloan-reports', display_name: 'Reports', space: 'tenant', icon: 'document-report', menu_order: 5, status: 'active' },
      { menu_key: 'moneyloan-settings', display_name: 'Money Loan Settings', space: 'tenant', icon: 'cog', menu_order: 6, status: 'active' },
    ];

    const insertedModules = [];
    for (const module of moneyLoanModules) {
      const existing = await knex('modules').where('menu_key', module.menu_key).first();
      if (!existing) {
        const [inserted] = await knex('modules').insert(module).returning('*');
        insertedModules.push(inserted);
        console.log(`   ✅ ${module.display_name}`);
      } else {
        insertedModules.push(existing);
        console.log(`   ℹ️  ${module.display_name} (already exists)`);
      }
    }

    // ==================== STEP 2: GET OR CREATE COMPANIES ====================
    console.log('\n2️⃣  Setting up companies...');
    
    const companies = [
      { name: 'ACME Corporation', subdomain: 'acme', plan: 'enterprise' },
      { name: 'TechStart Solutions', subdomain: 'techstart', plan: 'pro' }
    ];

    const companyData = {};
    
    for (const company of companies) {
      // Check if tenant exists
      let tenant = await knex('tenants').where('subdomain', company.subdomain).first();
      
      if (!tenant) {
        [tenant] = await knex('tenants').insert({
          name: company.name,
          subdomain: company.subdomain,
          plan: company.plan,
          status: 'active',
          max_users: 100,
          primary_color: '#6366f1',
          secondary_color: '#8b5cf6',
          contact_person: 'Admin',
          contact_email: `admin@${company.subdomain}.com`,
          contact_phone: '+63-917-123-4567',
          money_loan_enabled: true,
          bnpl_enabled: false,
          pawnshop_enabled: false
        }).returning('*');
        console.log(`   ✅ ${company.name} created (ID: ${tenant.id})`);
      } else {
        console.log(`   ℹ️  ${company.name} exists (ID: ${tenant.id})`);
      }

      // ==================== STEP 3: CREATE ROLES ====================
      console.log(`   📋 Creating roles for ${company.name}...`);
      
      // Tenant Admin Role
      let tenantAdminRole = await knex('roles')
        .where({ tenant_id: tenant.id, name: 'Tenant Admin', space: 'tenant' })
        .first();
      
      if (!tenantAdminRole) {
        [tenantAdminRole] = await knex('roles').insert({
          tenant_id: tenant.id,
          name: 'Tenant Admin',
          description: 'Full access within tenant',
          space: 'tenant',
          status: 'active'
        }).returning('*');
        console.log(`      ✅ Tenant Admin role (ID: ${tenantAdminRole.id})`);
      } else {
        console.log(`      ℹ️  Tenant Admin role exists (ID: ${tenantAdminRole.id})`);
      }

      // Employee Role
      let employeeRole = await knex('roles')
        .where({ tenant_id: tenant.id, name: 'Employee', space: 'tenant' })
        .first();
      
      if (!employeeRole) {
        [employeeRole] = await knex('roles').insert({
          tenant_id: tenant.id,
          name: 'Employee',
          description: 'Employee with platform access',
          space: 'tenant',
          status: 'active'
        }).returning('*');
        console.log(`      ✅ Employee role (ID: ${employeeRole.id})`);
      } else {
        console.log(`      ℹ️  Employee role exists (ID: ${employeeRole.id})`);
      }

      // ==================== STEP 4: ASSIGN PERMISSIONS ====================
      console.log(`   🔑 Assigning permissions for ${company.name}...`);
      
      // Get all tenant permissions
      const tenantPermissions = await knex('permissions').where('space', 'tenant');
      
      // Tenant Admin gets all tenant permissions
      await knex('role_permissions').where('role_id', tenantAdminRole.id).del();
      
      const tenantAdminPerms = tenantPermissions.map(perm => ({
        role_id: tenantAdminRole.id,
        permission_id: perm.id
      }));
      
      if (tenantAdminPerms.length > 0) {
        await knex('role_permissions').insert(tenantAdminPerms);
      }
      console.log(`      ✅ Tenant Admin permissions (${tenantAdminPerms.length} permissions)`);

      // Employee gets tenant dashboard view + Money Loan permissions + Customer view
      await knex('role_permissions').where('role_id', employeeRole.id).del();
      
      // Get dashboard view permission
      const dashboardPerm = await knex('permissions')
        .where({ resource: 'dashboard', action: 'view', space: 'tenant' })
        .first();
      
      const employeePerms = [];
      if (dashboardPerm) {
        employeePerms.push({
          role_id: employeeRole.id,
          permission_id: dashboardPerm.id
        });
      }
      
      // Get tenant-customers permissions (employees need to view customers for loan processing)
      const customerPerms = await knex('permissions')
        .where('resource', 'tenant-customers');
      
      for (const perm of customerPerms) {
        employeePerms.push({
          role_id: employeeRole.id,
          permission_id: perm.id
        });
      }
      
      // Get all Money Loan permissions
      const moneyLoanPerms = await knex('permissions')
        .where('permission_key', 'like', 'money-loan:%')
        .orWhere('permission_key', 'like', 'moneyloan%');
      
      for (const perm of moneyLoanPerms) {
        employeePerms.push({
          role_id: employeeRole.id,
          permission_id: perm.id
        });
      }
      
      if (employeePerms.length > 0) {
        await knex('role_permissions').insert(employeePerms);
      }
      console.log(`      ✅ Employee permissions (${employeePerms.length} permissions - Money Loan + Customer access)`);

      companyData[company.subdomain] = {
        tenantId: tenant.id,
        tenantAdminRoleId: tenantAdminRole.id,
        employeeRoleId: employeeRole.id
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
      let admin = await knex('users').where({ tenant_id: tenantId, email: adminEmail }).first();
      
      if (!admin) {
        [admin] = await knex('users').insert({
          tenant_id: tenantId,
          email: adminEmail,
          password_hash: defaultPassword,
          first_name: 'Tenant',
          last_name: 'Admin',
          status: 'active',
          email_verified: true
        }).returning('*');
      } else {
        await knex('users').where('id', admin.id).update({ password_hash: defaultPassword });
      }
      
      // Assign role
      const existingAdminRole = await knex('user_roles').where({ user_id: admin.id, role_id: tenantAdminRoleId }).first();
      if (!existingAdminRole) {
        await knex('user_roles').insert({ user_id: admin.id, role_id: tenantAdminRoleId });
      }
      console.log(`      ✅ ${adminEmail} - Tenant Admin`);

      // 2 Employees
      for (let i = 1; i <= 2; i++) {
        const empEmail = `employee${i}@${company.subdomain}.com`;
        let employee = await knex('users').where({ tenant_id: tenantId, email: empEmail }).first();
        
        if (!employee) {
          [employee] = await knex('users').insert({
            tenant_id: tenantId,
            email: empEmail,
            password_hash: defaultPassword,
            first_name: `Employee${i}`,
            last_name: company.name.split(' ')[0],
            status: 'active',
            email_verified: true
          }).returning('*');
        } else {
          await knex('users').where('id', employee.id).update({ password_hash: defaultPassword });
        }
        
        // Assign role
        const existingEmpRole = await knex('user_roles').where({ user_id: employee.id, role_id: employeeRoleId }).first();
        if (!existingEmpRole) {
          await knex('user_roles').insert({ user_id: employee.id, role_id: employeeRoleId });
        }

        // Create employee profile if it doesn't exist
        const existingProfile = await knex('employee_profiles').where({ user_id: employee.id, tenant_id: tenantId }).first();
        if (!existingProfile) {
          const [profile] = await knex('employee_profiles').insert({
            tenant_id: tenantId,
            user_id: employee.id,
            employee_code: `EMP-${company.subdomain.toUpperCase()}-${String(i).padStart(3, '0')}`,
            position: i === 1 ? 'Loan Officer' : 'Collections Specialist',
            department: 'Operations',
            employment_type: 'full-time',
            employment_status: 'active',
            hire_date: i === 1 ? '2024-01-15' : '2024-02-01',
            basic_salary: 30000 + (i * 5000),
            status: 'active'
          }).returning('id');

          // Assign Money Loan platform access
          await knex('employee_product_access').insert({
            tenant_id: tenantId,
            user_id: employee.id,
            employee_id: profile.id,
            product_type: 'money_loan',
            access_level: 'full',
            is_primary: true,
            can_approve_loans: i === 1,
            max_approval_amount: i === 1 ? 100000 : 50000,
            can_disburse_funds: true,
            can_view_reports: true,
            can_modify_interest: false,
            can_waive_penalties: i === 1,
            status: 'active',
            assigned_date: new Date()
          });
        }

        console.log(`      ✅ ${empEmail} - Employee (Money Loan)`);
      }

      // 2 Money Loan Customers (using unified customers table)
      for (let i = 1; i <= 2; i++) {
        const customerEmail = `customer${i}@${company.subdomain}.com`;
        const existing = await knex('customers').where({ tenant_id: tenantId, email: customerEmail }).first();
        
        if (!existing) {
          const [customer] = await knex('customers').insert({
            tenant_id: tenantId,
            customer_code: `CUST-${company.subdomain.toUpperCase()}-${String(i).padStart(4, '0')}`,
            customer_type: 'individual',
            first_name: `Customer${i}`,
            last_name: company.name.split(' ')[0],
            email: customerEmail,
            phone: `+63 917 ${String(tenantId * 100000 + i).padStart(7, '0')}`,
            date_of_birth: i === 1 ? '1985-05-15' : '1990-08-22',
            gender: i === 1 ? 'male' : 'female',
            nationality: 'Filipino',
            civil_status: i === 1 ? 'single' : 'married',
            employment_status: 'employed',
            employer_name: i === 1 ? 'ABC Company' : 'XYZ Corporation',
            occupation: i === 1 ? 'Software Engineer' : 'Sales Manager',
            monthly_income: 50000 + (i * 10000),
            credit_score: 700 + (i * 50),
            risk_level: 'low',
            status: 'active',
            kyc_status: 'verified',
            money_loan_approved: true,
            bnpl_approved: false,
            pawnshop_approved: false,
            preferred_language: 'en',
            preferred_contact_method: 'sms',
            platform_tags: JSON.stringify(['moneyloan'])
          }).returning('*');

          // Create Money Loan customer profile
          await knex('moneyloan_customer_profiles').insert({
            customer_id: customer.id,
            tenant_id: tenantId,
            max_loan_amount: 100000,
            current_loan_limit: 100000,
            outstanding_balance: 0,
            on_time_payment_rate: 100,
            auto_debit_enabled: false,
            preferred_payment_day: 15,
            status: 'active'
          });
        }
        console.log(`      ✅ ${customerEmail} - Unified Customer (Money Loan approved)`);
      }
    }

    // ==================== SUMMARY ====================
    console.log('\n✅ Comprehensive test data seed completed!\n');
    console.log('═══════════════════════════════════════════════════════');
    console.log('📝 LOGIN CREDENTIALS FOR QUICK ACCESS');
    console.log('═══════════════════════════════════════════════════════\n');
    
    console.log('🔷 SYSTEM SPACE (Super Admin):');
    console.log('   Email: admin@exitsaas.com');
    console.log('   Password: Admin@123');
    console.log('   Space: SYSTEM\n');
    
    console.log('🔷 ACME CORPORATION:');
    console.log('   👤 Tenant Admin:');
    console.log('      Email: admin@acme.com');
    console.log('      Password: Password@123');
    console.log('      Space: TENANT\n');
    console.log('   👥 Employees (Money Loan):');
    console.log('      employee1@acme.com | Password@123');
    console.log('      employee2@acme.com | Password@123\n');
    console.log('   🧑 Customers:');
    console.log('      customer1@acme.com');
    console.log('      customer2@acme.com\n');
    
    console.log('🔷 TECHSTART SOLUTIONS:');
    console.log('   👤 Tenant Admin:');
    console.log('      Email: admin@techstart.com');
    console.log('      Password: Password@123');
    console.log('      Space: TENANT\n');
    console.log('   👥 Employees (Money Loan):');
    console.log('      employee1@techstart.com | Password@123');
    console.log('      employee2@techstart.com | Password@123\n');
    console.log('   🧑 Customers:');
    console.log('      customer1@techstart.com');
    console.log('      customer2@techstart.com\n');
    
    console.log('═══════════════════════════════════════════════════════\n');

  } catch (error) {
    console.error('❌ Seed failed:', error.message);
    throw error;
  }
};
