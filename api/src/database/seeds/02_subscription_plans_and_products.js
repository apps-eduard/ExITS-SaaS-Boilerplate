/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> } 
 */
exports.seed = async function(knex) {
  console.log('🏪 Seeding subscription plans and platforms...\n');

  // Clean up existing data so the seed is deterministic
  await knex('platform_subscriptions').del();
  await knex('tenant_subscriptions').del();
  await knex('plan_features').del();
  await knex('subscription_plans').del();

  console.log('1️⃣  Creating subscription plans...');

  const planDefinitions = [
    // Platform-wide plans (general SaaS tiers)
    {
      name: 'Trial',
      description: '14-day free trial - experience all core features with limited usage',
      price: 0.0,
      billing_cycle: 'monthly',
      max_users: 5,
      max_storage_gb: 10,
      platform_type: 'platform',
      features: JSON.stringify([
        '📊 Basic Dashboard',
        '👥 5 Team Members',
        '💾 10GB Storage',
        '📧 Email Support (48h)',
        '📱 Mobile Access',
        '🔒 SSL Security'
      ]),
      status: 'active',
      is_featured: false,
      custom_pricing: false,
      sort_order: 1,
      trial_days: 14,
      setup_fee: 0.0,
      terms_and_conditions: 'Trial plan terms apply.'
    },
    {
      name: 'Starter',
      description: 'Perfect for small teams getting started',
      price: 49.99,
      billing_cycle: 'monthly',
      max_users: 25,
      max_storage_gb: 50,
      platform_type: 'platform',
      features: JSON.stringify([
        '📊 Full Dashboard',
        '👥 25 Team Members',
        '💾 50GB Storage',
        '📧 Priority Email Support (24h)',
        '💬 Live Chat Support',
        '📱 Mobile Access',
        '🔒 SSL Security',
        '📈 Basic Analytics',
        '🔄 Daily Backups'
      ]),
      status: 'active',
      is_featured: false,
      custom_pricing: false,
      sort_order: 2,
      trial_days: 0,
      setup_fee: 0.0,
      terms_and_conditions: 'Starter plan terms apply.'
    },
    {
      name: 'Professional',
      description: 'Advanced features for growing businesses - most popular tier',
      price: 149.99,
      billing_cycle: 'monthly',
      max_users: 100,
      max_storage_gb: 200,
      platform_type: 'platform',
      features: JSON.stringify([
        '📊 Advanced Dashboard',
        '👥 100 Team Members',
        '💾 200GB Storage',
        '📧 Priority Support (12h)',
        '💬 Live Chat Support',
        '📞 Phone Support',
        '📱 Mobile Access',
        '🔒 SSL Security',
        '📈 Advanced Analytics',
        '🔄 Hourly Backups',
        '🔌 API Access',
        '🎨 Custom Branding',
        '📊 Custom Reports',
        '🔔 Advanced Notifications',
        '🌐 Multi-language Support'
      ]),
      status: 'active',
      is_featured: true,
      custom_pricing: false,
      sort_order: 3,
      trial_days: 0,
      setup_fee: 0.0,
      terms_and_conditions: 'Professional plan terms apply.'
    },
    {
      name: 'Enterprise',
      description: 'Custom solutions for large organisations with dedicated support',
      price: 999.99,
      billing_cycle: 'monthly',
      max_users: null,
      max_storage_gb: 1000,
      platform_type: 'platform',
      features: JSON.stringify([
        '✨ Everything in Professional',
        '👥 Unlimited Users',
        '💾 1TB Storage',
        '📧 24/7 Dedicated Support (4h SLA)',
        '🎯 Dedicated Account Manager',
        '💬 Priority Chat & Phone',
        '🔒 Advanced Security (SSO, 2FA)',
        '📈 Advanced Analytics + Custom Dashboards',
        '🔄 Real-time Backups',
        '🔌 API Access + Webhooks',
        '🎨 White-label Options',
        '📊 Custom Reports + Data Export',
        '🔔 Advanced Notifications',
        '🌐 Multi-language Support',
        '🛠️ Custom Integrations',
        '🎓 Priority Training & Onboarding',
        '📄 Custom SLA'
      ]),
      status: 'active',
      is_featured: false,
      custom_pricing: true,
      sort_order: 4,
      trial_days: 0,
      setup_fee: 0.0,
      terms_and_conditions: 'Enterprise plan terms apply.'
    },

    // Money Loan platform-specific plans
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
      setup_fee: 0.0,
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
      setup_fee: 0.0,
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
        max_active_loans: -1,
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
      setup_fee: 50.0,
      terms_and_conditions: 'Money Loan Enterprise plan terms apply.'
    },

    // BNPL plans
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
      setup_fee: 0.0,
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
      setup_fee: 0.0,
      terms_and_conditions: 'BNPL Pro plan terms apply.'
    },

    // Pawnshop plans
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
      setup_fee: 0.0,
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
      setup_fee: 0.0,
      terms_and_conditions: 'Pawnshop Pro plan terms apply.'
    }
  ];

  const insertedPlans = await knex('subscription_plans')
    .insert(planDefinitions)
    .returning(['id', 'name', 'price', 'billing_cycle', 'platform_type', 'is_featured', 'custom_pricing']);

  console.log(`   ✓ Created ${insertedPlans.length} subscription plans`);

  const planIdByName = Object.fromEntries(
    insertedPlans.map(plan => [plan.name, plan.id])
  );

  const hasEnabledColumn = await knex.schema.hasColumn('plan_features', 'enabled');

  // Plan feature gating (only for general SaaS tiers for now)
  console.log('2️⃣  Creating plan feature toggles...');
  const planFeatureDefinitions = [
    // Trial
    { planName: 'Trial', featureKey: 'dashboard_basic', featureName: 'Basic Dashboard', featureValue: 'true', enabled: true },
    { planName: 'Trial', featureKey: 'users_max', featureName: 'Maximum Users', featureValue: '5', enabled: true },
    { planName: 'Trial', featureKey: 'storage_max_gb', featureName: 'Maximum Storage GB', featureValue: '10', enabled: true },
    { planName: 'Trial', featureKey: 'support_email', featureName: 'Email Support', featureValue: '48h', enabled: true },
    { planName: 'Trial', featureKey: 'mobile_access', featureName: 'Mobile Access', featureValue: 'true', enabled: true },

    // Starter
    { planName: 'Starter', featureKey: 'dashboard_full', featureName: 'Full Dashboard', featureValue: 'true', enabled: true },
    { planName: 'Starter', featureKey: 'users_max', featureName: 'Maximum Users', featureValue: '25', enabled: true },
    { planName: 'Starter', featureKey: 'storage_max_gb', featureName: 'Maximum Storage GB', featureValue: '50', enabled: true },
    { planName: 'Starter', featureKey: 'support_email', featureName: 'Email Support', featureValue: '24h', enabled: true },
    { planName: 'Starter', featureKey: 'support_chat', featureName: 'Live Chat', featureValue: 'true', enabled: true },
    { planName: 'Starter', featureKey: 'analytics_basic', featureName: 'Basic Analytics', featureValue: 'true', enabled: true },

    // Professional
    { planName: 'Professional', featureKey: 'dashboard_advanced', featureName: 'Advanced Dashboard', featureValue: 'true', enabled: true },
    { planName: 'Professional', featureKey: 'users_max', featureName: 'Maximum Users', featureValue: '100', enabled: true },
    { planName: 'Professional', featureKey: 'storage_max_gb', featureName: 'Maximum Storage GB', featureValue: '200', enabled: true },
    { planName: 'Professional', featureKey: 'support_email', featureName: 'Email Support', featureValue: '12h', enabled: true },
    { planName: 'Professional', featureKey: 'support_chat', featureName: 'Live Chat', featureValue: 'true', enabled: true },
    { planName: 'Professional', featureKey: 'support_phone', featureName: 'Phone Support', featureValue: 'true', enabled: true },
    { planName: 'Professional', featureKey: 'analytics_advanced', featureName: 'Advanced Analytics', featureValue: 'true', enabled: true },
    { planName: 'Professional', featureKey: 'api_access', featureName: 'API Access', featureValue: 'true', enabled: true },
    { planName: 'Professional', featureKey: 'custom_branding', featureName: 'Custom Branding', featureValue: 'true', enabled: true },
    { planName: 'Professional', featureKey: 'custom_reports', featureName: 'Custom Reports', featureValue: 'true', enabled: true },

    // Enterprise
    { planName: 'Enterprise', featureKey: 'dashboard_advanced', featureName: 'Advanced Dashboard', featureValue: 'true', enabled: true },
    { planName: 'Enterprise', featureKey: 'users_max', featureName: 'Maximum Users', featureValue: 'unlimited', enabled: true },
    { planName: 'Enterprise', featureKey: 'storage_max_gb', featureName: 'Maximum Storage GB', featureValue: '1000', enabled: true },
    { planName: 'Enterprise', featureKey: 'support_24x7', featureName: '24/7 Support', featureValue: '4h', enabled: true },
    { planName: 'Enterprise', featureKey: 'dedicated_manager', featureName: 'Dedicated Account Manager', featureValue: 'true', enabled: true },
    { planName: 'Enterprise', featureKey: 'api_access', featureName: 'API Access', featureValue: 'unlimited', enabled: true },
    { planName: 'Enterprise', featureKey: 'custom_branding', featureName: 'White-label', featureValue: 'true', enabled: true },
    { planName: 'Enterprise', featureKey: 'sso_enabled', featureName: 'Single Sign-On', featureValue: 'true', enabled: true },
    { planName: 'Enterprise', featureKey: 'custom_integrations', featureName: 'Custom Integrations', featureValue: 'true', enabled: true }
  ];

  const planFeatures = planFeatureDefinitions
    .map(feature => {
      const planId = planIdByName[feature.planName];
      if (!planId) {
        console.warn(`   ⚠️  Skipping feature ${feature.featureKey} because plan ${feature.planName} was not created.`);
        return null;
      }
      const base = {
        plan_id: planId,
        feature_key: feature.featureKey,
        feature_name: feature.featureName,
        feature_value: feature.featureValue
      };

      if (hasEnabledColumn) {
        base.enabled = feature.enabled;
      }

      return base;
    })
    .filter(Boolean);

  if (planFeatures.length > 0) {
    await knex('plan_features').insert(planFeatures);
    const suffix = hasEnabledColumn ? '' : ' (without enabled flag)';
    console.log(`   ✓ Added ${planFeatures.length} plan feature toggles${suffix}`);
  } else {
    console.log('   ⚠️  No plan feature toggles inserted');
  }

  console.log('3️⃣  Skipping automatic platform and tenant subscription creation (intentional).');

  console.log('\n✨ Platforms and subscriptions seed completed successfully!');
  console.log('\n📋 Summary:');
  console.log(`   • ${insertedPlans.length} subscription plans`);
  console.log(`   • ${planFeatures.length} plan feature toggles`);
  console.log('   • 0 platform subscriptions (skipped)');
  console.log('   • 0 tenant subscriptions (skipped)');

  console.log('\n💰 Subscription Plans:');
  insertedPlans.forEach(plan => {
    const platformType = plan.platformType ?? plan.platform_type;
    const billingCycle = plan.billingCycle ?? plan.billing_cycle;
    console.log(`   • ${plan.name} (${platformType ?? 'n/a'}): $${plan.price}/${billingCycle ?? 'n/a'}`);
  });
};

