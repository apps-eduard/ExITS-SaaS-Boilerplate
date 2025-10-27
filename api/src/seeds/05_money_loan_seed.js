/**
 * Seed data for Money Loan Product
 * Creates initial loan products and test customers
 */

exports.seed = async function(knex) {
  // Get ACME Corporation tenant ID dynamically
  const tenant = await knex('tenants').where('subdomain', 'acme').first();
  
  if (!tenant) {
    console.log('⏭️ No ACME Corporation tenant found, skipping money loan seed');
    return;
  }
  
  const tenantId = tenant.id;
  
  // Get Super Admin user ID for reviewed_by and other references
  const superAdmin = await knex('users').where('email', 'admin@exitsaas.com').first();
  
  if (!superAdmin) {
    console.log('⏭️ No Super Admin user found, skipping money loan seed');
    return;
  }
  
  const adminUserId = superAdmin.id;

  // Clear existing Money Loan data (in reverse order of dependencies)
  await knex('collection_activities').where('tenant_id', tenantId).del();
  await knex('loan_documents').where('tenant_id', tenantId).del();
  await knex('loan_payments').where('tenant_id', tenantId).del();
  await knex('repayment_schedules').where('tenant_id', tenantId).del();
  await knex('loans').where('tenant_id', tenantId).del();
  await knex('loan_applications').where('tenant_id', tenantId).del();
  // Don't delete customers - they're created in initial seed
  await knex('loan_products').where('tenant_id', tenantId).del();

  // 1. Insert Loan Products
  const loanProducts = await knex('loan_products').insert([
    {
      tenant_id: tenantId,
      product_code: 'PERSONAL-001',
      name: 'Personal Loan',
      description: 'Quick personal loan for salaried employees',
      min_amount: 5000,
      max_amount: 100000,
      interest_rate: 18.00,
      interest_type: 'reducing',
      min_term_days: 90,
      max_term_days: 365,
      processing_fee_percent: 2.00,
      late_payment_penalty_percent: 5.00,
      grace_period_days: 3,
      is_active: true,
      required_documents: JSON.stringify(['valid_id', 'proof_of_income', 'billing_statement']),
      eligibility_criteria: JSON.stringify({
        min_monthly_income: 15000,
        min_employment_months: 6,
        min_credit_score: 600
      })
    },
    {
      tenant_id: tenantId,
      product_code: 'BUSINESS-001',
      name: 'Business Loan',
      description: 'Loan for small business owners and entrepreneurs',
      min_amount: 50000,
      max_amount: 500000,
      interest_rate: 15.00,
      interest_type: 'reducing',
      min_term_days: 180,
      max_term_days: 730,
      processing_fee_percent: 3.00,
      late_payment_penalty_percent: 5.00,
      grace_period_days: 5,
      is_active: true,
      required_documents: JSON.stringify(['valid_id', 'business_permit', 'financial_statements', 'bir_registration']),
      eligibility_criteria: JSON.stringify({
        min_monthly_revenue: 50000,
        min_business_age_months: 12,
        min_credit_score: 650
      })
    },
    {
      tenant_id: tenantId,
      product_code: 'QUICK-001',
      name: 'Quick Cash Loan',
      description: 'Fast approval loan for emergencies',
      min_amount: 3000,
      max_amount: 30000,
      interest_rate: 24.00,
      interest_type: 'flat',
      min_term_days: 30,
      max_term_days: 90,
      processing_fee_percent: 5.00,
      late_payment_penalty_percent: 10.00,
      grace_period_days: 0,
      is_active: true,
      required_documents: JSON.stringify(['valid_id', 'proof_of_income']),
      eligibility_criteria: JSON.stringify({
        min_monthly_income: 10000,
        min_employment_months: 3,
        min_credit_score: 550
      })
    }
  ]).returning('*');

  console.log(`✅ Created ${loanProducts.length} loan products`);

  // 2. Get existing customers from initial seed (don't create new ones)
  const customers = await knex('customers')
    .where('tenant_id', tenantId)
    .where('customer_code', 'like', 'CUST-2025-%')
    .orderBy('customer_code', 'asc');
  
  if (customers.length === 0) {
    console.log('⚠️ No customers found - customers should be created in initial seed (01_initial_data.js)');
    return;
  }
  
  console.log(`✅ Using ${customers.length} existing customers from initial seed`);

  // 3. Create a sample loan application and active loan for first customer
  const loanApplication = await knex('loan_applications').insert({
    tenant_id: tenantId,
    application_number: 'APP-2025-0001',
    customer_id: customers[0].id,
    loan_product_id: loanProducts[0].id,
    requested_amount: 50000,
    requested_term_days: 365,
    purpose: 'Home Improvement',
    status: 'approved',
    approved_amount: 50000,
    approved_term_days: 365,
    approved_interest_rate: 18.00,
    reviewed_by: adminUserId,
    reviewed_at: new Date(),
    review_notes: 'Application approved - good credit history'
  }).returning('*');

  console.log(`✅ Created sample loan application`);

  // 4. Create active loan
  const activeLoan = await knex('loans').insert({
    tenant_id: tenantId,
    loan_number: 'LOAN-2025-0001',
    customer_id: customers[0].id,
    loan_product_id: loanProducts[0].id,
    application_id: loanApplication[0].id,
    principal_amount: 50000,
    interest_rate: 18.00,
    interest_type: 'reducing',
    term_days: 365,
    monthly_payment: 4591.67,
    total_interest: 5100.00,
    total_amount: 55100.00,
    outstanding_balance: 45000.00,
    amount_paid: 10000.00,
    processing_fee: 1000.00,
    disbursement_date: new Date('2025-09-01'),
    first_payment_date: new Date('2025-10-01'),
    maturity_date: new Date('2026-09-01'),
    status: 'active',
    approved_by: adminUserId,
    disbursed_by: adminUserId
  }).returning('*');

  console.log(`✅ Created active loan`);

  // 5. Create repayment schedule
  const scheduleItems = [];
  for (let i = 0; i < 12; i++) {
    const dueDate = new Date('2025-10-01');
    dueDate.setMonth(dueDate.getMonth() + i);
    
    const isPaid = i < 2; // First 2 months paid
    
    scheduleItems.push({
      tenant_id: tenantId,
      loan_id: activeLoan[0].id,
      installment_number: i + 1,
      due_date: dueDate,
      principal_amount: 4166.67,
      interest_amount: 425.00,
      total_amount: 4591.67,
      amount_paid: isPaid ? 4591.67 : 0,
      outstanding_amount: isPaid ? 0 : 4591.67,
      status: isPaid ? 'paid' : 'pending'
    });
  }

  await knex('repayment_schedules').insert(scheduleItems);
  console.log(`✅ Created ${scheduleItems.length} repayment schedule items`);

  // 6. Create payment records for paid installments
  await knex('loan_payments').insert([
    {
      tenant_id: tenantId,
      payment_reference: 'PAY-2025-0001',
      loan_id: activeLoan[0].id,
      customer_id: customers[0].id,
      amount: 4591.67,
      principal_amount: 4166.67,
      interest_amount: 425.00,
      penalty_amount: 0,
      payment_method: 'bank_transfer',
      transaction_id: 'BT-123456',
      payment_date: new Date('2025-10-01'),
      status: 'completed',
      received_by: adminUserId,
      notes: 'First payment - on time'
    },
    {
      tenant_id: tenantId,
      payment_reference: 'PAY-2025-0002',
      loan_id: activeLoan[0].id,
      customer_id: customers[0].id,
      amount: 4591.67,
      principal_amount: 4166.67,
      interest_amount: 425.00,
      penalty_amount: 0,
      payment_method: 'cash',
      payment_date: new Date('2025-11-01'),
      status: 'completed',
      received_by: adminUserId,
      notes: 'Second payment - on time'
    }
  ]);

  console.log(`✅ Created 2 payment records`);

  console.log('\n✅ Money Loan seed data completed successfully!');
  console.log(`📊 Summary:`);
  console.log(`   - Loan Products: ${loanProducts.length}`);
  console.log(`   - Customers: ${customers.length}`);
  console.log(`   - Active Loans: 1`);
  console.log(`   - Repayment Schedule Items: ${scheduleItems.length}`);
  console.log(`   - Payment Records: 2`);
};
