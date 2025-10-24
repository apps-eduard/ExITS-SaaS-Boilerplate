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
      name: 'Professional',
      description: 'Best for growing businesses with advanced needs',
      price: 79.99,
      billing_cycle: 'monthly',
      max_users: 25,
      max_storage_gb: 50,
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
    {
      name: 'Money Loan Add-on',
      description: 'Money lending and loan management features',
      price: 49.99,
      billing_cycle: 'monthly',
      max_users: 0,
      max_storage_gb: 0,
      features: JSON.stringify({
        loan_origination: true,
        payment_tracking: true,
        interest_calculation: true,
        borrower_management: true,
        reporting: true
      }),
      status: 'active',
      is_popular: false,
      setup_fee: 0.00,
      terms_and_conditions: 'Money Loan add-on terms apply.'
    },
    {
      name: 'BNPL Add-on',
      description: 'Buy Now Pay Later service features',
      price: 39.99,
      billing_cycle: 'monthly',
      max_users: 0,
      max_storage_gb: 0,
      features: JSON.stringify({
        payment_splitting: true,
        installment_plans: true,
        merchant_integration: true,
        customer_portal: true,
        risk_assessment: true
      }),
      status: 'active',
      is_popular: false,
      setup_fee: 0.00,
      terms_and_conditions: 'BNPL add-on terms apply.'
    },
    {
      name: 'Pawnshop Add-on',
      description: 'Pawnshop and collateral management features',
      price: 59.99,
      billing_cycle: 'monthly',
      max_users: 0,
      max_storage_gb: 0,
      features: JSON.stringify({
        item_valuation: true,
        collateral_tracking: true,
        redemption_management: true,
        auction_system: true,
        inventory_management: true
      }),
      status: 'active',
      is_popular: false,
      setup_fee: 0.00,
      terms_and_conditions: 'Pawnshop add-on terms apply.'
    }
  ]).returning(['id', 'name', 'price']);
  
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

  // Professional plan features
  const proPlan = subscriptionPlans.find(p => p.name === 'Professional');
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
  const tenants = await knex('tenants').select('id', 'name');
  
  let productSubscriptionCount = 0;
  for (const tenant of tenants) {
    // Subscribe ExITS Platform to all products
    if (tenant.name === 'ExITS Platform') {
      const products = ['money_loan', 'bnpl', 'pawnshop'];
      for (const product of products) {
        await knex('product_subscriptions').insert({
          tenant_id: tenant.id,
          product_type: product,
          subscription_plan_id: subscriptionPlans.find(p => p.name.toLowerCase().includes(product.replace('_', ' '))).id,
          status: 'active',
          price: subscriptionPlans.find(p => p.name.toLowerCase().includes(product.replace('_', ' '))).price,
          billing_cycle: 'monthly'
        });
        productSubscriptionCount++;
      }
    } else {
      // Subscribe other tenants to money_loan by default
      await knex('product_subscriptions').insert({
        tenant_id: tenant.id,
        product_type: 'money_loan',
        subscription_plan_id: subscriptionPlans.find(p => p.name === 'Money Loan Add-on').id,
        status: 'active',
        price: subscriptionPlans.find(p => p.name === 'Money Loan Add-on').price,
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
    let planName = 'Professional'; // Default
    if (tenant.name === 'ExITS Platform') {
      planName = 'Enterprise';
    } else if (tenant.name === 'ACME Corporation') {
      planName = 'Professional';
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
