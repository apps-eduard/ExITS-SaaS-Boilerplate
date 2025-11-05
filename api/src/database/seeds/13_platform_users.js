const bcrypt = require('bcryptjs');

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  console.log('🌱 Seeding platform users (employees & customers)...\n');

  // Get Tenant 2 (ACME Corporation)
  const tenant = await knex('tenants')
    .where({ name: 'ACME Corporation' })
    .first();
  
  if (!tenant) {
    console.log('⚠️  ACME Corporation tenant not found, skipping platform users seed');
    return;
  }

  const tenantId = tenant.id;
  console.log(`✓ Using Tenant ID: ${tenantId} (${tenant.name})\n`);

  // Get or create Employee role
  let employeeRole = await knex('roles')
    .where({ name: 'Employee', space: 'tenant', tenant_id: tenantId })
    .first();
  
  if (!employeeRole) {
    console.log('📝 Creating Employee role...');
    const [newRole] = await knex('roles').insert({
      tenant_id: tenantId,
      name: 'Employee',
      description: 'Platform employee with limited permissions',
      space: 'tenant',
      status: 'active'
    }).returning('*');
    employeeRole = newRole;
    console.log(`✓ Created Employee role with ID: ${employeeRole.id}\n`);
  } else {
    console.log(`✓ Employee role already exists (ID: ${employeeRole.id})\n`);
  }

  // Hash password for employees
  const passwordHash = await bcrypt.hash('Admin@123', 10);

  // ========================================
  // 1. Create Employee 1 - Money Loan View
  // ========================================
  console.log('👤 Creating Employee 1 (Money Loan View)...');
  
  let employee1 = await knex('users')
    .where({ tenant_id: tenantId, email: 'employee1@tenant1.com' })
    .first();
  
  if (!employee1) {
    const [newUser] = await knex('users').insert({
      tenant_id: tenantId,
      email: 'employee1@tenant1.com',
      password_hash: passwordHash,
      first_name: 'John',
      last_name: 'Employee',
      status: 'active',
      email_verified: true
    }).returning('*');
    employee1 = newUser;

    // Assign Employee role
    await knex('user_roles').insert({
      user_id: employee1.id,
      role_id: employeeRole.id
    });

    // Create employee profile
    const [empProfile] = await knex('employee_profiles').insert({
      tenant_id: tenantId,
      user_id: employee1.id,
      employee_code: 'EMP-001',
      hire_date: new Date(),
      employment_status: 'active',
      department: 'Operations',
      position: 'Loan Officer'
    }).returning('*');

    // Assign Money Loan access (View only)
    await knex('employee_product_access').insert({
      tenant_id: tenantId,
      employee_id: empProfile.id,
      user_id: employee1.id,
      platform_type: 'money_loan',
      access_level: 'view',
      is_primary: true,
      can_approve_loans: false,
      can_disburse_funds: false,
      can_view_reports: false,
      status: 'active'
    });

    console.log(`   ✓ Created Employee 1: employee1@tenant1.com`);
  } else {
    console.log(`   ⚠️  Employee 1 already exists, skipping...`);
  }

  // ================================================
  // 2. Create Employee 2 - Multi-Platform Manager
  // ================================================
  console.log('👤 Creating Employee 2 (Multi-Platform)...');
  
  let employee2 = await knex('users')
    .where({ tenant_id: tenantId, email: 'employee2@tenant1.com' })
    .first();
  
  if (!employee2) {
    const [newUser] = await knex('users').insert({
      tenant_id: tenantId,
      email: 'employee2@tenant1.com',
      password_hash: passwordHash,
      first_name: 'Jane',
      last_name: 'Manager',
      status: 'active',
      email_verified: true
    }).returning('*');
    employee2 = newUser;

    // Assign Employee role
    await knex('user_roles').insert({
      user_id: employee2.id,
      role_id: employeeRole.id
    });

    // Create employee profile
    const [empProfile] = await knex('employee_profiles').insert({
      tenant_id: tenantId,
      user_id: employee2.id,
      employee_code: 'EMP-002',
      hire_date: new Date(),
      employment_status: 'active',
      department: 'Operations',
      position: 'Platform Manager'
    }).returning('*');

    // Money Loan - Manage with permissions
    await knex('employee_product_access').insert({
      tenant_id: tenantId,
      employee_id: empProfile.id,
      user_id: employee2.id,
      platform_type: 'money_loan',
      access_level: 'manage',
      is_primary: true,
      can_approve_loans: true,
      max_approval_amount: 50000.00,
      can_disburse_funds: true,
      can_view_reports: true,
      status: 'active'
    });

    // BNPL - View access
    await knex('employee_product_access').insert({
      tenant_id: tenantId,
      employee_id: empProfile.id,
      user_id: employee2.id,
      platform_type: 'bnpl',
      access_level: 'view',
      is_primary: false,
      can_approve_loans: false,
      can_disburse_funds: false,
      can_view_reports: false,
      status: 'active'
    });

    console.log(`   ✓ Created Employee 2: employee2@tenant1.com`);
  } else {
    console.log(`   ⚠️  Employee 2 already exists, skipping...`);
  }

  console.log('\n✅ Platform Users Seeding Complete!\n');
  console.log('═══════════════════════════════════════════════════');
  console.log('📋 Test Accounts Summary:');
  console.log('═══════════════════════════════════════════════════');
  console.log('\n🔹 Employees (Password: Admin@123):');
  console.log('   • employee1@tenant1.com - Money Loan (View only)');
  console.log('   • employee2@tenant1.com - Money Loan (Manage) + BNPL (View)');
  console.log('\n🔹 Customers (created in 01_initial_data.js):');
  console.log('   • CUST-2025-001: Juan Dela Cruz (juan.delacruz@test.com)');
  console.log('   • CUST-2025-002: Maria Santos (maria.santos@test.com)');
  console.log('   • CUST-2025-003: Pedro Gonzales (pedro.gonzales@test.com)');
  console.log('\n═══════════════════════════════════════════════════');
};
