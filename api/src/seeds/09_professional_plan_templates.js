/**
 * Seed: Professional Subscription Plan Templates
 * Populates subscription_plans with production-ready tiers
 * Includes Trial, Starter, Professional, Enterprise + Product Add-ons
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  console.log('💎 Seeding professional subscription plan templates...\n');

  // Check if professional plans already exist
  const existingPlans = await knex('subscription_plans')
    .whereIn('name', [
      'Trial', 'Starter', 'Professional', 'Enterprise',
      'Money Loan - Basic', 'Money Loan - Professional', 'Money Loan - Enterprise'
    ])
    .select('name');

  if (existingPlans.length > 0) {
    console.log(`✓ Professional plans already exist (${existingPlans.length} plans found)`);
    console.log('  Skipping seed to preserve existing data.\n');
    return;
  }

  console.log('✅ No existing professional plans found, proceeding with seed...\n');

  // ========================================================================
  // PLATFORM SUBSCRIPTION PLANS
  // ========================================================================
  console.log('1️⃣  Creating platform subscription plans...');

  const platformPlans = await knex('subscription_plans')
    .insert([
      // TRIAL PLAN
      {
        name: 'Trial',
        description: '14-day free trial - Experience all core features with limited usage',
        price: 0.00,
        billing_cycle: 'monthly',
        features: JSON.stringify([
          '📊 Basic Dashboard',
          '👥 5 Team Members',
          '💾 10GB Storage',
          '📧 Email Support (48h)',
          '📱 Mobile Access',
          '🔒 SSL Security'
        ]),
        max_users: 5,
        max_storage_gb: 10,
        trial_days: 14,
        is_featured: false,
        custom_pricing: false,
        sort_order: 1,
        platform_type: 'platform',
        status: 'active'
      },

      // STARTER PLAN
      {
        name: 'Starter',
        description: 'Perfect for small teams getting started',
        price: 49.99,
        billing_cycle: 'monthly',
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
        max_users: 25,
        max_storage_gb: 50,
        trial_days: 0,
        is_featured: false,
        custom_pricing: false,
        sort_order: 2,
        platform_type: 'platform',
        status: 'active'
      },

      // PROFESSIONAL PLAN (FEATURED)
      {
        name: 'Professional',
        description: 'Advanced features for growing businesses - Most Popular! 🌟',
        price: 149.99,
        billing_cycle: 'monthly',
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
        max_users: 100,
        max_storage_gb: 200,
        trial_days: 0,
        is_featured: true,  // ⭐ FEATURED
        custom_pricing: false,
        sort_order: 3,
        platform_type: 'platform',
        status: 'active'
      },

      // ENTERPRISE PLAN (CUSTOM PRICING)
      {
        name: 'Enterprise',
        description: 'Custom solutions for large organizations',
        price: 999.99,
        billing_cycle: 'monthly',
        features: JSON.stringify([
          '✨ Everything in Professional',
          '👥 Unlimited Users',
          '💾 1TB Storage',
          '📧 24/7 Dedicated Support (4h SLA)',
          '🎯 Dedicated Account Manager',
          '💬 Priority Chat & Phone',
          '📱 Mobile Access',
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
        max_users: null,  // Unlimited
        max_storage_gb: 1000,
        trial_days: 0,
        is_featured: false,
        custom_pricing: true,  // 💼 Contact Sales
        sort_order: 4,
        platform_type: 'platform',
        status: 'active'
      }
    ])
    .returning(['id', 'name', 'price', 'is_featured', 'custom_pricing']);

  console.log(`✅ Created ${platformPlans.length} platform plans`);
  platformPlans.forEach(plan => {
    const badges = [];
    if (plan.is_featured) badges.push('⭐ FEATURED');
    if (plan.custom_pricing) badges.push('💼 CUSTOM');
    const badgeStr = badges.length > 0 ? ` ${badges.join(' ')}` : '';
    console.log(`   • ${plan.name}: $${plan.price}/month${badgeStr}`);
  });

  // ========================================================================
  // MONEY LOAN ADD-ON PLANS
  // ========================================================================
  console.log('\n2️⃣  Creating Money Loan add-on plans...');

  const moneyLoanPlans = await knex('subscription_plans')
    .insert([
      {
        name: 'Money Loan - Basic',
        description: 'Core loan management features for small lending operations',
        price: 79.99,
        billing_cycle: 'monthly',
        features: JSON.stringify([
          '💰 Loan Applications',
          '📝 Basic Underwriting',
          '💳 Payment Processing',
          '📊 Basic Reports',
          '📧 Email Notifications',
          '👥 Up to 100 active loans'
        ]),
        max_users: null,
        max_storage_gb: null,
        trial_days: 0,
        is_featured: false,
        custom_pricing: false,
        sort_order: 10,
        platform_type: 'money_loan',
        status: 'active'
      },
      {
        name: 'Money Loan - Professional',
        description: 'Advanced loan management with automation - Recommended 🌟',
        price: 149.99,
        billing_cycle: 'monthly',
        features: JSON.stringify([
          '💰 Loan Applications',
          '📝 Advanced Underwriting + Credit Scoring',
          '💳 Payment Processing + Auto-debit',
          '📊 Advanced Reports + Analytics',
          '📧 Email + SMS Notifications',
          '🤖 Automated Workflows',
          '📈 Risk Analysis',
          '🔄 Collections Management',
          '👥 Up to 500 active loans',
          '🔌 API Access'
        ]),
        max_users: null,
        max_storage_gb: null,
        trial_days: 0,
        is_featured: true,  // ⭐ FEATURED
        custom_pricing: false,
        sort_order: 11,
        platform_type: 'money_loan',
        status: 'active'
      },
      {
        name: 'Money Loan - Enterprise',
        description: 'Complete lending platform with custom features',
        price: 299.99,
        billing_cycle: 'monthly',
        features: JSON.stringify([
          '✨ Everything in Professional',
          '💰 Unlimited Loans',
          '📝 Custom Underwriting Rules',
          '💳 Multi-currency Support',
          '📊 Custom Reports + Dashboards',
          '🤖 Advanced Automation',
          '📈 Predictive Analytics + ML',
          '🔄 Advanced Collections + Recovery',
          '🔌 Full API Access + Webhooks',
          '🎨 White-label Options',
          '👥 Dedicated Support'
        ]),
        max_users: null,
        max_storage_gb: null,
        trial_days: 0,
        is_featured: false,
        custom_pricing: true,  // 💼 Contact Sales
        sort_order: 12,
        platform_type: 'money_loan',
        status: 'active'
      }
    ])
    .returning(['id', 'name', 'price']);

  console.log(`✅ Created ${moneyLoanPlans.length} Money Loan plans`);
  moneyLoanPlans.forEach(plan => {
    console.log(`   • ${plan.name}: $${plan.price}/month`);
  });

  // ========================================================================
  // PLAN FEATURES (Fine-grained control)
  // ========================================================================
  console.log('\n3️⃣  Creating plan features for feature gating...');

  const allPlans = [...platformPlans, ...moneyLoanPlans];
  const planFeatures = [];

  // Trial Plan Features
  const trialPlan = allPlans.find(p => p.name === 'Trial');
  if (trialPlan) {
    planFeatures.push(
      { plan_id: trialPlan.id, feature_key: 'dashboard_basic', feature_name: 'Basic Dashboard', feature_value: 'true', enabled: true },
      { plan_id: trialPlan.id, feature_key: 'users_max', feature_name: 'Maximum Users', feature_value: '5', enabled: true },
      { plan_id: trialPlan.id, feature_key: 'storage_max_gb', feature_name: 'Maximum Storage GB', feature_value: '10', enabled: true },
      { plan_id: trialPlan.id, feature_key: 'support_email', feature_name: 'Email Support', feature_value: '48h', enabled: true },
      { plan_id: trialPlan.id, feature_key: 'mobile_access', feature_name: 'Mobile Access', feature_value: 'true', enabled: true }
    );
  }

  // Starter Plan Features
  const starterPlan = allPlans.find(p => p.name === 'Starter');
  if (starterPlan) {
    planFeatures.push(
      { plan_id: starterPlan.id, feature_key: 'dashboard_full', feature_name: 'Full Dashboard', feature_value: 'true', enabled: true },
      { plan_id: starterPlan.id, feature_key: 'users_max', feature_name: 'Maximum Users', feature_value: '25', enabled: true },
      { plan_id: starterPlan.id, feature_key: 'storage_max_gb', feature_name: 'Maximum Storage GB', feature_value: '50', enabled: true },
      { plan_id: starterPlan.id, feature_key: 'support_email', feature_name: 'Email Support', feature_value: '24h', enabled: true },
      { plan_id: starterPlan.id, feature_key: 'support_chat', feature_name: 'Live Chat', feature_value: 'true', enabled: true },
      { plan_id: starterPlan.id, feature_key: 'analytics_basic', feature_name: 'Basic Analytics', feature_value: 'true', enabled: true }
    );
  }

  // Professional Plan Features
  const professionalPlan = allPlans.find(p => p.name === 'Professional');
  if (professionalPlan) {
    planFeatures.push(
      { plan_id: professionalPlan.id, feature_key: 'dashboard_advanced', feature_name: 'Advanced Dashboard', feature_value: 'true', enabled: true },
      { plan_id: professionalPlan.id, feature_key: 'users_max', feature_name: 'Maximum Users', feature_value: '100', enabled: true },
      { plan_id: professionalPlan.id, feature_key: 'storage_max_gb', feature_name: 'Maximum Storage GB', feature_value: '200', enabled: true },
      { plan_id: professionalPlan.id, feature_key: 'support_email', feature_name: 'Email Support', feature_value: '12h', enabled: true },
      { plan_id: professionalPlan.id, feature_key: 'support_chat', feature_name: 'Live Chat', feature_value: 'true', enabled: true },
      { plan_id: professionalPlan.id, feature_key: 'support_phone', feature_name: 'Phone Support', feature_value: 'true', enabled: true },
      { plan_id: professionalPlan.id, feature_key: 'analytics_advanced', feature_name: 'Advanced Analytics', feature_value: 'true', enabled: true },
      { plan_id: professionalPlan.id, feature_key: 'api_access', feature_name: 'API Access', feature_value: 'true', enabled: true },
      { plan_id: professionalPlan.id, feature_key: 'custom_branding', feature_name: 'Custom Branding', feature_value: 'true', enabled: true },
      { plan_id: professionalPlan.id, feature_key: 'custom_reports', feature_name: 'Custom Reports', feature_value: 'true', enabled: true }
    );
  }

  // Enterprise Plan Features
  const enterprisePlan = allPlans.find(p => p.name === 'Enterprise');
  if (enterprisePlan) {
    planFeatures.push(
      { plan_id: enterprisePlan.id, feature_key: 'dashboard_advanced', feature_name: 'Advanced Dashboard', feature_value: 'true', enabled: true },
      { plan_id: enterprisePlan.id, feature_key: 'users_max', feature_name: 'Maximum Users', feature_value: 'unlimited', enabled: true },
      { plan_id: enterprisePlan.id, feature_key: 'storage_max_gb', feature_name: 'Maximum Storage GB', feature_value: '1000', enabled: true },
      { plan_id: enterprisePlan.id, feature_key: 'support_24x7', feature_name: '24/7 Support', feature_value: '4h', enabled: true },
      { plan_id: enterprisePlan.id, feature_key: 'dedicated_manager', feature_name: 'Dedicated Account Manager', feature_value: 'true', enabled: true },
      { plan_id: enterprisePlan.id, feature_key: 'api_access', feature_name: 'API Access', feature_value: 'unlimited', enabled: true },
      { plan_id: enterprisePlan.id, feature_key: 'custom_branding', feature_name: 'White-label', feature_value: 'true', enabled: true },
      { plan_id: enterprisePlan.id, feature_key: 'sso_enabled', feature_name: 'SSO', feature_value: 'true', enabled: true },
      { plan_id: enterprisePlan.id, feature_key: 'custom_integrations', feature_name: 'Custom Integrations', feature_value: 'true', enabled: true }
    );
  }

  if (planFeatures.length > 0) {
    await knex('plan_features').insert(planFeatures);
    console.log(`✅ Created ${planFeatures.length} plan features for feature gating`);
  }

  // ========================================================================
  // SUMMARY
  // ========================================================================
  console.log('\n✨ Professional plan templates seeded successfully!\n');
  console.log('📋 Summary:');
  console.log(`   • ${platformPlans.length} Platform Plans`);
  console.log(`   • ${moneyLoanPlans.length} Money Loan Add-ons`);
  console.log(`   • ${planFeatures.length} Feature Gates`);
  
  console.log('\n🎯 Featured Plans:');
  allPlans.filter(p => p.is_featured).forEach(plan => {
    console.log(`   ⭐ ${plan.name}: $${plan.price}/month`);
  });

  console.log('\n💼 Custom Pricing Plans:');
  allPlans.filter(p => p.custom_pricing).forEach(plan => {
    console.log(`   💼 ${plan.name}: Contact Sales`);
  });

  console.log('\n🎁 Trial Offers:');
  const trialPlans = await knex('subscription_plans')
    .where('trial_days', '>', 0)
    .select('name', 'trial_days');
  trialPlans.forEach(plan => {
    console.log(`   🎁 ${plan.name}: ${plan.trial_days}-day free trial`);
  });

  console.log('\n✅ Ready for production!');
};

