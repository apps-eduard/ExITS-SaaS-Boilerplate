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
  await knex('money_loan_collection_activities').where('tenant_id', tenantId).del();
  await knex('money_loan_documents').where('tenant_id', tenantId).del();
  await knex('money_loan_payments').where('tenant_id', tenantId).del();
  await knex('money_loan_repayment_schedules').where('tenant_id', tenantId).del();
  await knex('money_loan_loans').where('tenant_id', tenantId).del();
  await knex('money_loan_applications').where('tenant_id', tenantId).del();
  // Don't delete customers - they're created in initial seed
  await knex('money_loan_products').where('tenant_id', tenantId).del();

  // 1. Insert Loan Products
  const loanProducts = await knex('money_loan_products').insert([
    {
      tenant_id: tenantId,
      product_code: 'PERSONAL-001',
      name: 'Personal Loan',
      description: 'Quick personal loan for salaried employees',
      min_amount: 5000,
      max_amount: 100000,
      interest_rate: 1.00,
      interest_type: 'flat',
      min_term_days: 90,
      max_term_days: 365,
      processing_fee_percent: 2.00,
      late_payment_penalty_percent: 5.00,
      grace_period_days: 3,
      payment_frequency: 'monthly',
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
      min_amount: 1000,
      max_amount: 5000,
      interest_rate: 15.00,
      interest_type: 'reducing',
      min_term_days: 180,
      max_term_days: 730,
      processing_fee_percent: 1.00,
      late_payment_penalty_percent: 5.00,
      grace_period_days: 5,
      payment_frequency: 'weekly',
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
      min_amount: 1000,
      max_amount: 3000,
      interest_rate: 5.00,
      interest_type: 'flat',
      min_term_days: 30,
      max_term_days: 30,
      processing_fee_percent: 1.00,
      late_payment_penalty_percent: 10.00,
      grace_period_days: 4,
      payment_frequency: 'daily',
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

  console.log('\n✅ Money Loan seed data completed successfully!');
  console.log(`📊 Summary:`);
  console.log(`   - Loan Products: ${loanProducts.length}`);
  console.log(`   - Customers: ${customers.length}`);
  console.log('   - Active Loans: 0 (sample loan intentionally omitted)');
};
