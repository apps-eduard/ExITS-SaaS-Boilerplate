/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  console.log('🏪 Seeding subscription plans and products...\n');

  // Clean up existing data
  await knex('product_subscriptions').del();
  await knex('tenant_subscriptions').del();
  await knex('plan_features').del();
  await knex('subscription_plans').del();

  // 1. Create subscription plans
  console.log('1. Creating subscription plans...');
  const subscriptionPlans = await knex('subscription_plans').insert([
    {
      name: 'Trial',
      description: 'Free 14-day trial to test all features',
      price: 0.00,
      billing_cycle: 'one_time',
      max_users: 3,
      max_storage_gb: 5,
      product_type: null, // Platform-level plan
      features: JSON.stringify({
        basic_support: true,
        api_access: true,
        advanced_reporting: true,
        custom_branding: false,
        trial_duration_days: 14
      }),
      status: 'active',
      is_popular: false,
      setup_fee: 0.00,
      terms_and_conditions: 'Free 14-day trial. No credit card required. Trial expires after 14 days.'
    },
    {
      name: 'Starter',
      description: 'Perfect for small businesses getting started',
      price: 29.99,
      billing_cycle: 'monthly',
      max_users: 5,
      max_storage_gb: 10,
      product_type: null, // Platform-level plan
      features: JSON.stringify({
        basic_support: true,
        api_access: false,
        advanced_reporting: false,
        custom_branding: false
      }),
      status: 'active',
      is_popular: false,
      setup_fee: 0.00,
      terms_and_conditions: 'Standard terms apply for Starter plan.'
    },
    {
      name: 'Pro',
      description: 'Best for growing businesses with advanced needs',
      price: 79.99,
      billing_cycle: 'monthly',
      max_users: 25,
      max_storage_gb: 50,
      product_type: null, // Platform-level plan
      features: JSON.stringify({
        basic_support: true,
        priority_support: true,
        api_access: true,
        advanced_reporting: true,
        custom_branding: false,
        integrations: true
      }),
      status: 'active',
      is_popular: true,
      setup_fee: 0.00,
      terms_and_conditions: 'Standard terms apply for Professional plan.'
    },
    {
      name: 'Enterprise',
      description: 'For large organizations with enterprise requirements',
      price: 199.99,
      billing_cycle: 'monthly',
      max_users: 100,
      max_storage_gb: 200,
      product_type: null, // Platform-level plan
      features: JSON.stringify({
        basic_support: true,
        priority_support: true,
        dedicated_support: true,
        api_access: true,
        advanced_reporting: true,
        custom_branding: true,
        integrations: true,
        sso: true,
        advanced_security: true
      }),
      status: 'active',
      is_popular: false,
      setup_fee: 99.99,
      terms_and_conditions: 'Enterprise terms and SLA apply.'
    },
    // Product-specific plans
    {
      name: 'Money Loan - Starter',
      description: 'Basic money lending features for small operations',
      price: 29.99,
      billing_cycle: 'monthly',
      max_users: 0,
      max_storage_gb: 0,
      product_type: 'money_loan',
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
      product_type: 'money_loan',
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
      product_type: 'money_loan',
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
      product_type: 'bnpl',
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
      product_type: 'bnpl',
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
      product_type: 'pawnshop',
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
      product_type: 'pawnshop',
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
  ]).returning(['id', 'name', 'price', 'product_type']);
  
  console.log(`✅ ${subscriptionPlans.length} subscription plans created`);

  // 2. Create detailed plan features
  console.log('2. Creating plan features...');
  const planFeatures = [];

  // Starter plan features
  const starterPlan = subscriptionPlans.find(p => p.name === 'Starter');
  planFeatures.push(
    { plan_id: starterPlan.id, feature_key: 'users', feature_name: 'Maximum Users', description: 'Number of users allowed', feature_value: '5', limit_value: 5 },
    { plan_id: starterPlan.id, feature_key: 'storage', feature_name: 'Storage (GB)', description: 'Storage space in GB', feature_value: '10', limit_value: 10 },
    { plan_id: starterPlan.id, feature_key: 'support', feature_name: 'Email Support', description: 'Basic email support', feature_value: 'true' },
    { plan_id: starterPlan.id, feature_key: 'reports', feature_name: 'Basic Reports', description: 'Standard reporting features', feature_value: 'true' }
  );

  // Pro plan features
  const proPlan = subscriptionPlans.find(p => p.name === 'Pro');
  planFeatures.push(
    { plan_id: proPlan.id, feature_key: 'users', feature_name: 'Maximum Users', description: 'Number of users allowed', feature_value: '25', limit_value: 25 },
    { plan_id: proPlan.id, feature_key: 'storage', feature_name: 'Storage (GB)', description: 'Storage space in GB', feature_value: '50', limit_value: 50 },
    { plan_id: proPlan.id, feature_key: 'support', feature_name: 'Priority Support', description: 'Priority email and chat support', feature_value: 'true' },
    { plan_id: proPlan.id, feature_key: 'reports', feature_name: 'Advanced Reports', description: 'Advanced reporting and analytics', feature_value: 'true' },
    { plan_id: proPlan.id, feature_key: 'api', feature_name: 'API Access', description: 'REST API access', feature_value: 'true' },
    { plan_id: proPlan.id, feature_key: 'integrations', feature_name: 'Third-party Integrations', description: 'Connect with external systems', feature_value: 'true' }
  );

  // Enterprise plan features
  const enterprisePlan = subscriptionPlans.find(p => p.name === 'Enterprise');
  planFeatures.push(
    { plan_id: enterprisePlan.id, feature_key: 'users', feature_name: 'Maximum Users', description: 'Number of users allowed', feature_value: 'unlimited', limit_value: 999999 },
    { plan_id: enterprisePlan.id, feature_key: 'storage', feature_name: 'Storage (GB)', description: 'Storage space in GB', feature_value: 'unlimited', limit_value: 999999 },
    { plan_id: enterprisePlan.id, feature_key: 'support', feature_name: 'Dedicated Support', description: 'Dedicated account manager and support', feature_value: 'true' },
    { plan_id: enterprisePlan.id, feature_key: 'reports', feature_name: 'Custom Reports', description: 'Custom reporting and dashboards', feature_value: 'true' },
    { plan_id: enterprisePlan.id, feature_key: 'api', feature_name: 'Full API Access', description: 'Complete REST API access', feature_value: 'true' },
    { plan_id: enterprisePlan.id, feature_key: 'integrations', feature_name: 'All Integrations', description: 'All available integrations', feature_value: 'true' },
    { plan_id: enterprisePlan.id, feature_key: 'sso', feature_name: 'Single Sign-On', description: 'SAML/OIDC SSO integration', feature_value: 'true' },
    { plan_id: enterprisePlan.id, feature_key: 'branding', feature_name: 'Custom Branding', description: 'White-label customization', feature_value: 'true' },
    { plan_id: enterprisePlan.id, feature_key: 'security', feature_name: 'Advanced Security', description: 'Enhanced security features', feature_value: 'true' }
  );

  await knex('plan_features').insert(planFeatures);
  console.log(`✅ ${planFeatures.length} plan features created`);

  // 3. Create product subscriptions for existing tenants
  console.log('3. Creating product subscriptions for tenants...');
  const tenants = await knex('tenants').select('id', 'name', 'money_loan_enabled', 'bnpl_enabled', 'pawnshop_enabled');
  
  let productSubscriptionCount = 0;
  for (const tenant of tenants) {
    // Subscribe to Money Loan if enabled
    if (tenant.money_loan_enabled) {
      const plan = tenant.name === 'ExITS Platform' 
        ? subscriptionPlans.find(p => p.name === 'Money Loan - Enterprise')
        : subscriptionPlans.find(p => p.name === 'Money Loan - Pro');
      
      await knex('product_subscriptions').insert({
        tenant_id: tenant.id,
        product_type: 'money_loan',
        subscription_plan_id: plan.id,
        status: 'active',
        price: plan.price,
        billing_cycle: 'monthly'
      });
      productSubscriptionCount++;
    }

    // Subscribe to BNPL if enabled
    if (tenant.bnpl_enabled) {
      const plan = tenant.name === 'ExITS Platform'
        ? subscriptionPlans.find(p => p.name === 'BNPL - Pro')
        : subscriptionPlans.find(p => p.name === 'BNPL - Starter');
      
      await knex('product_subscriptions').insert({
        tenant_id: tenant.id,
        product_type: 'bnpl',
        subscription_plan_id: plan.id,
        status: 'active',
        price: plan.price,
        billing_cycle: 'monthly'
      });
      productSubscriptionCount++;
    }

    // Subscribe to Pawnshop if enabled
    if (tenant.pawnshop_enabled) {
      const plan = tenant.name === 'ExITS Platform'
        ? subscriptionPlans.find(p => p.name === 'Pawnshop - Pro')
        : subscriptionPlans.find(p => p.name === 'Pawnshop - Starter');
      
      await knex('product_subscriptions').insert({
        tenant_id: tenant.id,
        product_type: 'pawnshop',
        subscription_plan_id: plan.id,
        status: 'active',
        price: plan.price,
        billing_cycle: 'monthly'
      });
      productSubscriptionCount++;
    }
  }
  
  console.log(`✅ ${productSubscriptionCount} product subscriptions created`);

  // 4. Create tenant subscriptions (main platform subscriptions)
  console.log('4. Creating tenant subscriptions...');
  let tenantSubscriptionCount = 0;
  for (const tenant of tenants) {
    let planName = 'Pro'; // Default
    if (tenant.name === 'ExITS Platform') {
      planName = 'Enterprise';
    } else if (tenant.name === 'ACME Corporation') {
      planName = 'Pro';
    }
    
    const plan = subscriptionPlans.find(p => p.name === planName);
    await knex('tenant_subscriptions').insert({
      tenant_id: tenant.id,
      plan_id: plan.id,
      status: 'active',
      monthly_price: plan.price,
      started_at: knex.fn.now(),
      expires_at: knex.raw("NOW() + INTERVAL '1 year'"),
      next_billing_date: knex.raw("NOW() + INTERVAL '1 month'")
    });
    tenantSubscriptionCount++;
  }
  
  console.log(`✅ ${tenantSubscriptionCount} tenant subscriptions created`);

  console.log('\n✨ Products and subscriptions seed completed successfully!');
  console.log('\n📋 Summary:');
  console.log(`   • ${subscriptionPlans.length} subscription plans`);
  console.log(`   • ${planFeatures.length} plan features`);
  console.log(`   • ${productSubscriptionCount} product subscriptions`);
  console.log(`   • ${tenantSubscriptionCount} tenant subscriptions`);
  
  console.log('\n💰 Subscription Plans:');
  subscriptionPlans.forEach(plan => {
    if (plan.name === 'Trial') {
      console.log(`   • ${plan.name}: $${plan.price} (14-day trial)`);
    } else {
      console.log(`   • ${plan.name}: $${plan.price}/month`);
    }
  });
};
