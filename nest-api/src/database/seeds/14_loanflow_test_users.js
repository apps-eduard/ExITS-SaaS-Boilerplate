/**
 * Seed script for LoanFlow Mobile App Test Users
 * Creates 2 test customers and 2 test collectors for quick login
 * Password for all: Admin@123
 */

const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  console.log('\n🔧 Seeding LoanFlow Mobile App Test Users...\n');

  // Get ACME Corporation tenant
  const tenant = await knex('tenants').where('subdomain', 'acme').first();
  
  if (!tenant) {
    console.log('⏭️  No ACME Corporation tenant found, skipping');
    return;
  }

  const defaultPassword = 'Admin@123';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  // ==================== CREATE CUSTOMER ROLE (if not exists) ====================
  console.log('1️⃣  Ensuring Customer role exists...');
  
  let customerRole = await knex('roles')
    .where({ tenant_id: tenant.id, name: 'Customer', space: 'customer' })
    .first();

  if (!customerRole) {
    [customerRole] = await knex('roles').insert({
      tenant_id: tenant.id,
      name: 'Customer',
      description: 'Customer with access to personal loan information',
      space: 'customer',
      status: 'active'
    }).returning('*');
    console.log('   ✅ Customer role created');

    // Assign customer permissions
    const customerPermissions = await knex('permissions')
      .whereIn('permission_key', [
        'customer-profile:read',
        'customer-profile:update',
        'customer-loans:read',
        'customer-payments:create',
        'customer-payments:read'
      ]);

    if (customerPermissions.length > 0) {
      await knex('role_permissions').insert(
        customerPermissions.map(perm => ({
          role_id: customerRole.id,
          permission_id: perm.id
        }))
      );
      console.log(`   ✅ Assigned ${customerPermissions.length} permissions`);
    }
  } else {
    console.log('   ℹ️  Customer role already exists');
  }

  // ==================== CREATE COLLECTOR ROLE (if not exists) ====================
  console.log('\n2️⃣  Creating Collector role...');
  
  let collectorRole = await knex('roles')
    .where({ tenant_id: tenant.id, name: 'Collector', space: 'tenant' })
    .first();

  if (!collectorRole) {
    [collectorRole] = await knex('roles').insert({
      tenant_id: tenant.id,
      name: 'Collector',
      description: 'Field collector for loan payments and customer visits',
      space: 'tenant',
      status: 'active'
    }).returning('*');
    console.log('   ✅ Collector role created');

    // Assign collector permissions
    const collectorPermissions = await knex('permissions')
      .whereIn('permission_key', [
        'tenant-dashboard:view',
        'tenant-customers:read',
        'money-loan:read',
        'money-loan:collect-payment',
        'money-loan:record-visit'
      ]);

    if (collectorPermissions.length > 0) {
      await knex('role_permissions').insert(
        collectorPermissions.map(perm => ({
          role_id: collectorRole.id,
          permission_id: perm.id
        }))
      );
      console.log(`   ✅ Assigned ${collectorPermissions.length} permissions`);
    }
  } else {
    console.log('   ℹ️  Collector role already exists');
  }

  // ==================== CREATE TEST CUSTOMERS ====================
  console.log('\n3️⃣  Creating test customers...');

  const testCustomers = [
    {
      email: 'customer1@test.com',
      firstName: 'Maria',
      lastName: 'Santos',
      phone: '+63 917 123 4567',
      customerCode: 'CUST-001',
      dateOfBirth: '1990-05-15',
      gender: 'female',
      civilStatus: 'single',
      idType: 'National ID',
      idNumber: 'NID-123456789',
      occupation: 'Teacher',
      employer: 'ABC School',
      monthlyIncome: 35000,
      yearsEmployed: 5,
      creditScore: 720,
      riskLevel: 'low'
    },
    {
      email: 'customer2@test.com',
      firstName: 'Juan',
      lastName: 'Dela Cruz',
      phone: '+63 917 234 5678',
      customerCode: 'CUST-002',
      dateOfBirth: '1985-08-22',
      gender: 'male',
      civilStatus: 'married',
      idType: 'Driver License',
      idNumber: 'DL-987654321',
      occupation: 'Business Owner',
      employer: 'Self-Employed',
      monthlyIncome: 65000,
      yearsEmployed: 10,
      creditScore: 680,
      riskLevel: 'medium'
    }
  ];

  for (const custData of testCustomers) {
    // Check if user already exists
    const existingUser = await knex('users').where({ email: custData.email }).first();
    
    if (existingUser) {
      console.log(`   ℹ️  ${custData.email} already exists, skipping`);
      continue;
    }

    // Create user account
    const [user] = await knex('users').insert({
      tenant_id: tenant.id,
      email: custData.email,
      password_hash: passwordHash,
      first_name: custData.firstName,
      last_name: custData.lastName,
      status: 'active',
      email_verified: true
    }).returning('*');

    // Assign customer role
    await knex('user_roles').insert({
      user_id: user.id,
      role_id: customerRole.id
    });

    // Create customer record
    const [customer] = await knex('customers').insert({
      tenant_id: tenant.id,
      user_id: user.id,
      customer_code: custData.customerCode,
      customer_type: 'individual',
      first_name: custData.firstName,
      last_name: custData.lastName,
      date_of_birth: custData.dateOfBirth,
      gender: custData.gender,
      civil_status: custData.civilStatus,
      email: custData.email,
      phone: custData.phone,
      id_type: custData.idType,
      id_number: custData.idNumber,
      employment_status: 'employed',
      employer_name: custData.employer,
      occupation: custData.occupation,
      monthly_income: custData.monthlyIncome,
      source_of_income: 'Salary',
      years_employed: custData.yearsEmployed,
      status: 'active',
      emergency_contact_name: 'Emergency Contact',
      emergency_contact_relationship: 'Family',
      emergency_contact_phone: custData.phone.replace('9', '8')
    }).returning('*');

    // Create Money Loan profile
    await knex('money_loan_customer_profiles').insert({
      customer_id: customer.id,
      tenant_id: tenant.id,
      credit_score: custData.creditScore,
      risk_level: custData.riskLevel,
      kyc_status: 'verified',
      kyc_verified_at: new Date(),
      status: 'active'
    });

    console.log(`   ✅ Created customer: ${custData.email}`);
  }

  // ==================== CREATE TEST COLLECTORS ====================
  console.log('\n4️⃣  Creating test collectors...');

  const testCollectors = [
    {
      email: 'collector1@test.com',
      firstName: 'Pedro',
      lastName: 'Reyes',
      phone: '+63 917 345 6789',
      employeeCode: 'COL-001',
      position: 'Field Collector',
      department: 'Collections',
      basicSalary: 25000,
      hireDate: '2024-01-15'
    },
    {
      email: 'collector2@test.com',
      firstName: 'Ana',
      lastName: 'Garcia',
      phone: '+63 917 456 7890',
      employeeCode: 'COL-002',
      position: 'Senior Collector',
      department: 'Collections',
      basicSalary: 30000,
      hireDate: '2023-06-01'
    }
  ];

  for (const collData of testCollectors) {
    // Check if user already exists
    const existingUser = await knex('users').where({ email: collData.email }).first();
    
    if (existingUser) {
      console.log(`   ℹ️  ${collData.email} already exists, skipping`);
      continue;
    }

    // Create user account
    const [user] = await knex('users').insert({
      tenant_id: tenant.id,
      email: collData.email,
      password_hash: passwordHash,
      first_name: collData.firstName,
      last_name: collData.lastName,
      status: 'active',
      email_verified: true
    }).returning('*');

    // Assign collector role
    await knex('user_roles').insert({
      user_id: user.id,
      role_id: collectorRole.id
    });

    // Create employee profile
    await knex('employee_profiles').insert({
      tenant_id: tenant.id,
      user_id: user.id,
      employee_code: collData.employeeCode,
      position: collData.position,
      department: collData.department,
      employment_type: 'full-time',
      employment_status: 'active',
      hire_date: collData.hireDate,
      basic_salary: collData.basicSalary,
      status: 'active'
    });

    console.log(`   ✅ Created collector: ${collData.email}`);
  }

  // ==================== SUMMARY ====================
  console.log('\n✅ LoanFlow Mobile App Test Users Created!\n');
  console.log('═══════════════════════════════════════════════════════');
  console.log('📱 LOANFLOW QUICK LOGIN CREDENTIALS');
  console.log('═══════════════════════════════════════════════════════');
  console.log(`   Password (all users): ${defaultPassword}`);
  console.log('');
  console.log('👥 CUSTOMERS:');
  console.log('   1. customer1@test.com - Maria Santos');
  console.log('   2. customer2@test.com - Juan Dela Cruz');
  console.log('');
  console.log('📦 COLLECTORS:');
  console.log('   1. collector1@test.com - Pedro Reyes');
  console.log('   2. collector2@test.com - Ana Garcia');
  console.log('═══════════════════════════════════════════════════════\n');
};
