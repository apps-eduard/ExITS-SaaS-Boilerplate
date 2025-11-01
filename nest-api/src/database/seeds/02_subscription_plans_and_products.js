/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  console.log('🏪 Seeding subscription plans and platforms...\n');

  // Clean up existing data
  await knex('platform_subscriptions').del();
  await knex('tenant_subscriptions').del();
  await knex('plan_features').del();
  await knex('subscription_plans').del();

  // 1. Create subscription plans
  console.log('1. Creating subscription plans...');
  const subscriptionPlans = await knex('subscription_plans').insert([
    // Platform-specific plans
    {
      name: 'Money Loan - Starter',
      description: 'Basic money lending features for small operations',
      price: 29.99,
      billing_cycle: 'monthly',
      max_users: 0,
      max_storage_gb: 0,
      platform_type: 'money_loan',
      features: JSON.stringify({
        max_active_loans: 50,
        loan_origination: true,
        payment_tracking: true,
        interest_calculation: true,
        borrower_management: true,
        basic_reporting: true,
        sms_notifications: false,
        advanced_analytics: false
      }),
      status: 'active',
      is_popular: false,
      setup_fee: 0.00,
      terms_and_conditions: 'Money Loan Starter plan terms apply.'
    },
    {
      name: 'Money Loan - Pro',
      description: 'Advanced money lending with analytics and automation',
      price: 79.99,
      billing_cycle: 'monthly',
      max_users: 0,
      max_storage_gb: 0,
      platform_type: 'money_loan',
      features: JSON.stringify({
        max_active_loans: 500,
        loan_origination: true,
        payment_tracking: true,
        interest_calculation: true,
        borrower_management: true,
        advanced_reporting: true,
        sms_notifications: true,
        email_notifications: true,
        advanced_analytics: true,
        automated_reminders: true,
        credit_scoring: true
      }),
      status: 'active',
      is_popular: true,
      setup_fee: 0.00,
      terms_and_conditions: 'Money Loan Pro plan terms apply.'
    },
    {
      name: 'Money Loan - Enterprise',
      description: 'Enterprise-grade lending platform with unlimited loans',
      price: 199.99,
      billing_cycle: 'monthly',
      max_users: 0,
      max_storage_gb: 0,
      platform_type: 'money_loan',
      features: JSON.stringify({
        max_active_loans: -1, // Unlimited
        loan_origination: true,
        payment_tracking: true,
        interest_calculation: true,
        borrower_management: true,
        advanced_reporting: true,
        sms_notifications: true,
        email_notifications: true,
        advanced_analytics: true,
        automated_reminders: true,
        credit_scoring: true,
        custom_workflows: true,
        api_access: true,
        white_label: true
      }),
      status: 'active',
      is_popular: false,
      setup_fee: 50.00,
      terms_and_conditions: 'Money Loan Enterprise plan terms apply.'
    },
    {
      name: 'BNPL - Starter',
      description: 'Basic Buy Now Pay Later features',
      price: 24.99,
      billing_cycle: 'monthly',
      max_users: 0,
      max_storage_gb: 0,
      platform_type: 'bnpl',
      features: JSON.stringify({
        max_transactions_per_month: 100,
        payment_splitting: true,
        installment_plans: true,
        merchant_integration: true,
        customer_portal: true,
        basic_reporting: true
      }),
      status: 'active',
      is_popular: false,
      setup_fee: 0.00,
      terms_and_conditions: 'BNPL Starter plan terms apply.'
    },
    {
      name: 'BNPL - Pro',
      description: 'Advanced BNPL with risk assessment',
      price: 69.99,
      billing_cycle: 'monthly',
      max_users: 0,
      max_storage_gb: 0,
      platform_type: 'bnpl',
      features: JSON.stringify({
        max_transactions_per_month: 1000,
        payment_splitting: true,
        installment_plans: true,
        merchant_integration: true,
        customer_portal: true,
        risk_assessment: true,
        fraud_detection: true,
        advanced_reporting: true,
        custom_payment_terms: true
      }),
      status: 'active',
      is_popular: true,
      setup_fee: 0.00,
      terms_and_conditions: 'BNPL Pro plan terms apply.'
    },
    {
      name: 'Pawnshop - Starter',
      description: 'Basic pawnshop management features',
      price: 34.99,
      billing_cycle: 'monthly',
      max_users: 0,
      max_storage_gb: 0,
      platform_type: 'pawnshop',
      features: JSON.stringify({
        max_active_items: 200,
        item_valuation: true,
        collateral_tracking: true,
        redemption_management: true,
        basic_inventory: true,
        basic_reporting: true
      }),
      status: 'active',
      is_popular: false,
      setup_fee: 0.00,
      terms_and_conditions: 'Pawnshop Starter plan terms apply.'
    },
    {
      name: 'Pawnshop - Pro',
      description: 'Advanced pawnshop with auction system',
      price: 89.99,
      billing_cycle: 'monthly',
      max_users: 0,
      max_storage_gb: 0,
      platform_type: 'pawnshop',
      features: JSON.stringify({
        max_active_items: 2000,
        item_valuation: true,
        collateral_tracking: true,
        redemption_management: true,
        auction_system: true,
        advanced_inventory: true,
        photo_management: true,
        advanced_reporting: true,
        barcode_scanning: true,
        sms_notifications: true
      }),
      status: 'active',
      is_popular: true,
      setup_fee: 0.00,
      terms_and_conditions: 'Pawnshop Pro plan terms apply.'
    }
  ]).returning(['id', 'name', 'price', 'platform_type']);
  
  console.log(`✅ ${subscriptionPlans.length} subscription plans created`);

  // 2. Plan features are now defined in the features JSON field of each plan
  console.log('2. Plan features embedded in subscription plans');

  // 3. Create platform subscriptions for existing tenants
  // NOTE: Changed: do NOT create any platform_subscriptions by default during seed.
  // Leaving tenants and plans in place but intentionally skipping insertion of
  // platform_subscriptions so new environments start with no subscriptions.
  console.log('3. Skipping creation of platform subscriptions by default (seed adjusted to leave subscriptions empty).');
  const platformSubscriptionCount = 0;

  // 4. Create tenant subscriptions (main platform subscriptions)
  // NOTE: Changed: do NOT create tenant_subscriptions by default during seed.
  console.log('4. Skipping creation of tenant subscriptions by default (seed adjusted).');
  const tenantSubscriptionCount = 0;

  console.log('\n✨ Platforms and subscriptions seed completed successfully!');
  console.log('\n📋 Summary:');
  console.log(`   • ${subscriptionPlans.length} subscription plans`);
  console.log(`   • Plan features embedded in each plan`);
  console.log(`   • ${platformSubscriptionCount} platform subscriptions`);
  console.log(`   • ${tenantSubscriptionCount} tenant subscriptions`);
  
  console.log('\n💰 Subscription Plans:');
  subscriptionPlans.forEach(plan => {
    console.log(`   • ${plan.name} (${plan.platform_type}): $${plan.price}/${plan.billing_cycle}`);
  });
};

