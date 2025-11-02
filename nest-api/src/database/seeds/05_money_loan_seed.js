/**
 * Seed data for Money Loan Product
 * Creates initial loan products for ACME and TechStart tenants
 */

exports.seed = async function(knex) {
  console.log('\n💰 Seeding Money Loan Products...\n');

  // Get both tenants
  const tenants = await knex('tenants').whereIn('subdomain', ['acme', 'techstart']);
  
  if (tenants.length === 0) {
    console.log('⏭️ No tenants found, skipping money loan seed');
    return;
  }

  // Create loan products for each tenant
  for (const tenant of tenants) {
    const tenantId = tenant.id;
    const subdomain = tenant.subdomain;
    
    console.log(`\n📦 Creating loan products for ${tenant.name} (${subdomain})...`);

    // Clear existing Money Loan data (in reverse order of dependencies)
    await knex('money_loan_collection_activities').where('tenant_id', tenantId).del();
    await knex('money_loan_documents').where('tenant_id', tenantId).del();
    await knex('money_loan_payments').where('tenant_id', tenantId).del();
    await knex('money_loan_repayment_schedules').where('tenant_id', tenantId).del();
    await knex('money_loan_loans').where('tenant_id', tenantId).del();
    await knex('money_loan_applications').where('tenant_id', tenantId).del();
    // Don't delete customers - they're created in initial seed
    await knex('money_loan_products').where('tenant_id', tenantId).del();

    // Insert Loan Products
    const loanProducts = await knex('money_loan_products').insert([
      {
        tenant_id: tenantId,
        product_code: `${subdomain.toUpperCase()}-PERSONAL-001`,
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
        product_code: `${subdomain.toUpperCase()}-BUSINESS-001`,
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
        product_code: `${subdomain.toUpperCase()}-QUICK-001`,
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

    console.log(`   ✅ Created ${loanProducts.length} loan products for ${subdomain.toUpperCase()}`);
  }

  console.log('\n✅ Money Loan seed data completed successfully!');
};
