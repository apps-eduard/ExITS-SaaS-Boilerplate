/**
 * Platform Users Seeding Script
 * Creates test users for Money Loan platform with proper permissions and product access
 */

const knexConfig = require('./knexfile');
const db = require('knex')(knexConfig.development);
const bcrypt = require('bcryptjs');

async function seedPlatformUsers() {
  try {
    console.log('\n🌱 Starting Platform Users Seeding...\n');

    // Get Tenant 2 ID
    const tenant = await db('tenants')
      .where({ name: 'ACME Corporation' })
      .first();
    
    if (!tenant) {
      throw new Error('ACME Corporation tenant not found. Please run main seeding first.');
    }

    const tenantId = tenant.id;
    console.log(`✓ Using Tenant ID: ${tenantId} (${tenant.name})\n`);

    // Get Tenant Admin role ID
    const tenantAdminRole = await db('roles')
      .where({ name: 'Tenant Admin', space: 'tenant' })
      .first();
    
    if (!tenantAdminRole) {
      throw new Error('Tenant Admin role not found');
    }

    // Get or create Employee role
    let employeeRole = await db('roles')
      .where({ name: 'Employee', space: 'tenant' })
      .first();
    
    if (!employeeRole) {
      console.log('📝 Creating Employee role...');
      const [newRole] = await db('roles').insert({
        tenant_id: tenantId,
        name: 'Employee',
        description: 'Platform employee with limited permissions',
        space: 'tenant',
        status: 'active'
      }).returning('id');
      employeeRole = { id: typeof newRole === 'object' ? newRole.id : newRole };
      console.log(`✓ Created Employee role with ID: ${employeeRole.id}\n`);
    }

    // Hash password
    const passwordHash = await bcrypt.hash('Employee@123', 10);

    // 1. Create Employee 1 - Money Loan Only (View Access)
    console.log('👤 Creating Employee 1 (Money Loan View)...');
    
    let employee1 = await db('users')
      .where({ tenant_id: tenantId, email: 'employee1@tenant1.com' })
      .first();
    
    if (!employee1) {
      const [newUser] = await db('users').insert({
        tenant_id: tenantId,
        email: 'employee1@tenant1.com',
        password_hash: passwordHash,
        first_name: 'John',
        last_name: 'Employee',
        status: 'active',
        email_verified: true
      }).returning('id');
      employee1 = { id: typeof newUser === 'object' ? newUser.id : newUser };

      // Assign Employee role
      await db('user_roles').insert({
        user_id: employee1.id,
        role_id: employeeRole.id
      });

      // Create employee profile
      const [newProfile] = await db('employee_profiles').insert({
        tenant_id: tenantId,
        user_id: employee1.id,
        employee_code: 'EMP-001',
        hire_date: new Date(),
        employment_status: 'active',
        department: 'Operations',
        position: 'Loan Officer'
      }).returning('id');
      const emp1ProfileId = typeof newProfile === 'object' ? newProfile.id : newProfile;

      // Assign Money Loan access (View only)
      await db('employee_product_access').insert({
        tenant_id: tenantId,
        employee_id: emp1ProfileId,
        user_id: employee1.id,
        product_type: 'money_loan',
        access_level: 'view',
        is_primary: true,
        can_approve_loans: false,
        can_disburse_funds: false,
        can_view_reports: false,
        status: 'active'
      });

      console.log(`✓ Created Employee 1: employee1@tenant1.com\n`);
    } else {
      console.log(`⚠️  Employee 1 already exists, skipping...\n`);
    }

    // 2. Create Employee 2 - Multi-Platform
    console.log('👤 Creating Employee 2 (Multi-Platform)...');
    
    let employee2 = await db('users')
      .where({ tenant_id: tenantId, email: 'employee2@tenant1.com' })
      .first();
    
    if (!employee2) {
      const [newUser] = await db('users').insert({
        tenant_id: tenantId,
        email: 'employee2@tenant1.com',
        password_hash: passwordHash,
        first_name: 'Jane',
        last_name: 'Manager',
        status: 'active',
        email_verified: true
      }).returning('id');
      employee2 = { id: typeof newUser === 'object' ? newUser.id : newUser };

      await db('user_roles').insert({
        user_id: employee2.id,
        role_id: employeeRole.id
      });

      const [newProfile] = await db('employee_profiles').insert({
        tenant_id: tenantId,
        user_id: employee2.id,
        employee_code: 'EMP-002',
        hire_date: new Date(),
        employment_status: 'active',
        department: 'Operations',
        position: 'Platform Manager'
      }).returning('id');
      const emp2ProfileId = typeof newProfile === 'object' ? newProfile.id : newProfile;

      // Money Loan - Manage with permissions
      await db('employee_product_access').insert({
        tenant_id: tenantId,
        employee_id: emp2ProfileId,
        user_id: employee2.id,
        product_type: 'money_loan',
        access_level: 'manage',
        is_primary: true,
        can_approve_loans: true,
        max_approval_amount: 50000.00,
        can_disburse_funds: true,
        can_view_reports: true,
        status: 'active'
      });

      // BNPL - View access
      await db('employee_product_access').insert({
        tenant_id: tenantId,
        employee_id: emp2ProfileId,
        user_id: employee2.id,
        product_type: 'bnpl',
        access_level: 'view',
        is_primary: false,
        can_approve_loans: false,
        can_disburse_funds: false,
        can_view_reports: false,
        status: 'active'
      });

      console.log(`✓ Created Employee 2: employee2@tenant1.com\n`);
    } else {
      console.log(`⚠️  Employee 2 already exists, skipping...\n`);
    }

    // 3. Create Customer 1 - Money Loan Customer (in customers table, NOT users table)
    console.log('👤 Creating Customer 1 (Money Loan)...');
    
    let customer1 = await db('customers')
      .where({ tenant_id: tenantId, email: 'customer1@test.com' })
      .first();
    
    if (!customer1) {
      const [customerId] = await db('customers').insert({
        tenant_id: tenantId,
        customer_code: 'CUST-001',
        customer_type: 'individual',
        first_name: 'Maria',
        last_name: 'Santos',
        email: 'customer1@test.com',
        phone: '+63-912-345-6789',
        date_of_birth: '1990-05-15',
        gender: 'female',
        civil_status: 'single',
        employment_status: 'employed',
        employer_name: 'ABC Company',
        occupation: 'Office Worker',
        monthly_income: 25000.00,
        credit_score: 720,
        risk_level: 'low',
        kyc_status: 'verified',
        kyc_verified_at: new Date(),
        status: 'active',
        money_loan_approved: true,
        bnpl_approved: false,
        pawnshop_approved: false
      }).returning('id');

      console.log(`✓ Created Customer 1: customer1@test.com (CUST-001)\n`);
    } else {
      console.log(`⚠️  Customer 1 already exists, skipping...\n`);
    }

    // 4. Create Customer 2 - BNPL Customer (in customers table, NOT users table)
    console.log('👤 Creating Customer 2 (BNPL)...');
    
    let customer2 = await db('customers')
      .where({ tenant_id: tenantId, email: 'customer2@test.com' })
      .first();
    
    if (!customer2) {
      const [customerId] = await db('customers').insert({
        tenant_id: tenantId,
        customer_code: 'CUST-002',
        customer_type: 'individual',
        first_name: 'Pedro',
        last_name: 'Gonzales',
        email: 'customer2@test.com',
        phone: '+63-917-654-3210',
        date_of_birth: '1985-08-22',
        gender: 'male',
        civil_status: 'married',
        employment_status: 'self-employed',
        employer_name: 'Own Business',
        occupation: 'Business Owner',
        monthly_income: 40000.00,
        credit_score: 680,
        risk_level: 'medium',
        kyc_status: 'verified',
        kyc_verified_at: new Date(),
        status: 'active',
        money_loan_approved: false,
        bnpl_approved: true,
        pawnshop_approved: false
      }).returning('id');

      console.log(`✓ Created Customer 2: customer2@test.com (CUST-002)\n`);
    } else {
      console.log(`⚠️  Customer 2 already exists, skipping...\n`);
    }

      console.log('\n✅ Platform Users Seeding Complete!\n');
      console.log('═══════════════════════════════════════════════════');
      console.log('📋 Test Accounts Summary:');
      console.log('═══════════════════════════════════════════════════');
      console.log('\n🔹 Tenant Admin (Full Access):');
      console.log('   Email: admin-2@example.com');
      console.log('   Password: Admin@123');
      console.log('   Access: All platforms & admin features');
      console.log('\n🔹 Employee 1 (View Only):');
      console.log('   Email: employee1@tenant1.com');
      console.log('   Password: Employee@123');
      console.log('   Access: Money Loan (View only)');
      console.log('\n🔹 Employee 2 (Multi-Platform):');
      console.log('   Email: employee2@tenant1.com');
      console.log('   Password: Employee@123');
      console.log('   Access: Money Loan (Manage + Approve up to $50k) + BNPL (View)');
      console.log('\n🔹 Customer 1:');
      console.log('   Customer Code: CUST-001');
      console.log('   Email: customer1@test.com');
      console.log('   Name: Maria Santos');
      console.log('   Access: Money Loan (Approved)');
      console.log('\n🔹 Customer 2:');
      console.log('   Customer Code: CUST-002');
      console.log('   Email: customer2@test.com');
      console.log('   Name: Pedro Gonzales');
      console.log('   Access: BNPL (Approved)');
      console.log('\n═══════════════════════════════════════════════════\n');
      console.log('📝 Note: Customers are stored in the "customers" table,');
      console.log('         NOT in the "users" table. They don\'t have portal login yet.');
      console.log('═══════════════════════════════════════════════════\n');

  } catch (err) {
    console.error('❌ Seeding failed:', err.message);
    console.error(err);
    throw err;
  } finally {
    await db.destroy();
  }
}

// Run seeding
seedPlatformUsers()
  .then(() => {
    console.log('✅ Done!');
    process.exit(0);
  })
  .catch(err => {
    console.error('💥 Fatal error:', err);
    process.exit(1);
  });
