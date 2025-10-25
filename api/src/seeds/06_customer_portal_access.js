/**
 * Seed script to create 3 test customers with portal access
 * Creates user accounts and links them to customers
 */

const bcrypt = require('bcryptjs');

exports.seed = async function(knex) {
  // Get ACME Corporation tenant ID dynamically
  const tenant = await knex('tenants').where('subdomain', 'acme').first();
  
  if (!tenant) {
    console.log('⏭️ No ACME Corporation tenant found, skipping customer portal access seed');
    return;
  }
  
  const tenantId = tenant.id;
  const defaultPassword = 'Customer@123';
  const passwordHash = await bcrypt.hash(defaultPassword, 10);

  const testCustomers = [
    {
      email: 'juan.delacruz@test.com',
      firstName: 'Juan',
      middleName: 'Santos',
      lastName: 'Dela Cruz',
      customerCode: 'CUST-2025-TEST-001',
      phone: '+639171234567',
      dateOfBirth: '1990-05-15',
      gender: 'male',
      civilStatus: 'married',
      // Address information (will be stored in addresses table)
      address: {
        houseNumber: '123',
        streetName: 'Rizal Street',
        barangay: 'San Antonio',
        cityMunicipality: 'Makati',
        province: 'Metro Manila',
        region: 'NCR',
        zipCode: '1203',
        addressType: 'home'
      },
      idType: 'national_id',
      idNumber: 'NID-TEST-001',
      employer: 'ABC Corporation',
      occupation: 'Software Engineer',
      monthlyIncome: 45000,
      yearsEmployed: 3,
      creditScore: 720,
      riskLevel: 'low'
    },
    {
      email: 'maria.santos@test.com',
      firstName: 'Maria',
      middleName: 'Garcia',
      lastName: 'Santos',
      customerCode: 'CUST-2025-TEST-002',
      phone: '+639181234567',
      dateOfBirth: '1985-08-22',
      gender: 'female',
      civilStatus: 'single',
      // Address information (will be stored in addresses table)
      address: {
        houseNumber: '789',
        streetName: 'Luna Street',
        barangay: 'Poblacion',
        cityMunicipality: 'Pasig',
        province: 'Metro Manila',
        region: 'NCR',
        zipCode: '1600',
        addressType: 'home'
      },
      idType: 'drivers_license',
      idNumber: 'DL-TEST-002',
      employer: 'Maria\'s Catering Services',
      occupation: 'Business Owner',
      monthlyIncome: 35000,
      yearsEmployed: 2,
      creditScore: 680,
      riskLevel: 'medium'
    },
    {
      email: 'pedro.gonzales@test.com',
      firstName: 'Pedro',
      middleName: 'Reyes',
      lastName: 'Gonzales',
      customerCode: 'CUST-2025-TEST-003',
      phone: '+639191234567',
      dateOfBirth: '1995-03-10',
      gender: 'male',
      civilStatus: 'single',
      // Address information (will be stored in addresses table)
      address: {
        houseNumber: '321',
        streetName: 'Mabini Avenue',
        barangay: 'Masagana',
        cityMunicipality: 'Quezon City',
        province: 'Metro Manila',
        region: 'NCR',
        zipCode: '1100',
        addressType: 'home'
      },
      idType: 'umid',
      idNumber: 'UMID-TEST-003',
      employer: 'XYZ Manufacturing Inc.',
      occupation: 'Factory Supervisor',
      monthlyIncome: 28000,
      yearsEmployed: 1,
      creditScore: 620,
      riskLevel: 'medium'
    }
  ];

  console.log('🔄 Setting up test customer accounts...\n');

  for (const testCustomer of testCustomers) {
    // 1. Create or update user account
    let user = await knex('users')
      .where('email', testCustomer.email)
      .first();

    if (!user) {
      [user] = await knex('users').insert({
        tenant_id: tenantId,
        email: testCustomer.email,
        password_hash: passwordHash,
        first_name: testCustomer.firstName,
        last_name: testCustomer.lastName,
        status: 'active',
        email_verified: true
      }).returning('*');
      console.log(`✅ Created user: ${testCustomer.email}`);
    } else {
      // Update password to ensure it's reset
      await knex('users')
        .where('id', user.id)
        .update({
          password_hash: passwordHash,
          status: 'active'
        });
      console.log(`🔄 Reset password for: ${testCustomer.email}`);
    }

    // 2. Create or update customer
    let customer = await knex('customers')
      .where('email', testCustomer.email)
      .where('tenant_id', tenantId)
      .first();

    if (!customer) {
      [customer] = await knex('customers').insert({
        tenant_id: tenantId,
        user_id: user.id,
        customer_code: testCustomer.customerCode,
        customer_type: 'individual',
        first_name: testCustomer.firstName,
        middle_name: testCustomer.middleName,
        last_name: testCustomer.lastName,
        date_of_birth: testCustomer.dateOfBirth,
        gender: testCustomer.gender,
        civil_status: testCustomer.civilStatus,
        email: testCustomer.email,
        phone: testCustomer.phone,
        // NOTE: Address fields removed, now using addresses table
        id_type: testCustomer.idType,
        id_number: testCustomer.idNumber,
        employment_status: 'employed',
        employer_name: testCustomer.employer,
        occupation: testCustomer.occupation,
        monthly_income: testCustomer.monthlyIncome,
        source_of_income: 'Salary',
        years_employed: testCustomer.yearsEmployed,
        credit_score: testCustomer.creditScore,
        risk_level: testCustomer.riskLevel,
        kyc_status: 'verified',
        kyc_verified_at: new Date(),
        status: 'active',
        money_loan_approved: true,
        bnpl_approved: false,
        pawnshop_approved: false,
        emergency_contact_name: 'Emergency Contact',
        emergency_contact_relationship: 'Family',
        emergency_contact_phone: testCustomer.phone.replace('9', '8')
      }).returning('*');
      console.log(`✅ Created customer: ${testCustomer.customerCode}`);
    } else {
      // Update existing customer
      await knex('customers')
        .where('id', customer.id)
        .update({
          user_id: user.id,
          money_loan_approved: true,
          status: 'active'
        });
      console.log(`🔄 Updated customer: ${testCustomer.customerCode}`);
    }

    // 3. Create or update address in unified addresses table
    const addressData = testCustomer.address;
    let address = await knex('addresses')
      .where('addressable_type', 'customer')
      .where('addressable_id', customer.id)
      .where('address_type', addressData.addressType)
      .first();

    if (!address) {
      await knex('addresses').insert({
        tenant_id: tenantId,
        addressable_type: 'customer',
        addressable_id: customer.id,
        address_type: addressData.addressType,
        house_number: addressData.houseNumber,
        street_name: addressData.streetName,
        barangay: addressData.barangay,
        city_municipality: addressData.cityMunicipality,
        province: addressData.province,
        region: addressData.region,
        zip_code: addressData.zipCode,
        country: 'Philippines',
        is_primary: true,
        is_verified: true,
        verified_at: new Date(),
        status: 'active'
      });
      console.log(`✅ Created address for: ${testCustomer.customerCode}`);
    } else {
      // Update existing address
      await knex('addresses')
        .where('id', address.id)
        .update({
          house_number: addressData.houseNumber,
          street_name: addressData.streetName,
          barangay: addressData.barangay,
          city_municipality: addressData.cityMunicipality,
          province: addressData.province,
          region: addressData.region,
          zip_code: addressData.zipCode,
          is_primary: true,
          is_verified: true,
          status: 'active'
        });
      console.log(`🔄 Updated address for: ${testCustomer.customerCode}`);
    }
  }

  console.log('\n✅ Test customer accounts setup complete!');
  console.log('\n📝 Test Login Credentials (All use same password):');
  console.log(`   Password: ${defaultPassword}`);
  console.log(`   Login URL: http://localhost:4200/customer/login\n`);
  console.log('Test Accounts:');
  testCustomers.forEach((customer, index) => {
    console.log(`   ${index + 1}. ${customer.email} - ${customer.firstName} ${customer.lastName}`);
  });
  console.log('');
};
