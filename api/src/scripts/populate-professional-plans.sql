-- ============================================================================
-- Professional Plan Templates with Trial Days and User Limits
-- Comprehensive SaaS pricing tiers with proper feature sets
-- ============================================================================

-- Add unique constraint to name column if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conname = 'subscription_plans_name_key'
  ) THEN
    ALTER TABLE subscription_plans ADD CONSTRAINT subscription_plans_name_key UNIQUE (name);
    RAISE NOTICE '✅ Added unique constraint to subscription_plans.name';
  END IF;
END $$;

-- ============================================================================
-- TIER 1: FREE TRIAL
-- ============================================================================
INSERT INTO subscription_plans (
  name, 
  description, 
  price, 
  billing_cycle, 
  features, 
  max_users, 
  max_storage_gb,
  trial_days,
  is_featured,
  custom_pricing,
  sort_order,
  status
) VALUES (
  'Trial',
  '14-day free trial - Experience all core features with limited usage',
  0.00,
  'monthly',
  '["📊 Basic Dashboard", "👥 5 Team Members", "💾 10GB Storage", "📧 Email Support (48h)", "📱 Mobile Access", "🔒 SSL Security"]'::jsonb,
  5,
  10,
  14, -- 14-day trial
  false,
  false,
  1,
  'active'
) ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  features = EXCLUDED.features,
  max_users = EXCLUDED.max_users,
  max_storage_gb = EXCLUDED.max_storage_gb,
  trial_days = EXCLUDED.trial_days,
  is_featured = EXCLUDED.is_featured,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

-- ============================================================================
-- TIER 2: STARTER (Entry Level)
-- ============================================================================
INSERT INTO subscription_plans (
  name, 
  description, 
  price, 
  billing_cycle, 
  features, 
  max_users, 
  max_storage_gb,
  trial_days,
  is_featured,
  custom_pricing,
  sort_order,
  status
) VALUES (
  'Starter',
  'Perfect for small teams getting started',
  49.99,
  'monthly',
  '["📊 Full Dashboard", "👥 25 Team Members", "💾 50GB Storage", "📧 Priority Email Support (24h)", "💬 Live Chat Support", "📱 Mobile Access", "🔒 SSL Security", "📈 Basic Analytics", "🔄 Daily Backups"]'::jsonb,
  25,
  50,
  0, -- No trial for paid plan
  false,
  false,
  2,
  'active'
) ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  features = EXCLUDED.features,
  max_users = EXCLUDED.max_users,
  max_storage_gb = EXCLUDED.max_storage_gb,
  trial_days = EXCLUDED.trial_days,
  is_featured = EXCLUDED.is_featured,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

-- ============================================================================
-- TIER 3: PROFESSIONAL (RECOMMENDED - Most Popular)
-- ============================================================================
INSERT INTO subscription_plans (
  name, 
  description, 
  price, 
  billing_cycle, 
  features, 
  max_users, 
  max_storage_gb,
  trial_days,
  is_featured,
  custom_pricing,
  sort_order,
  status
) VALUES (
  'Professional',
  'Advanced features for growing businesses - Most Popular! 🌟',
  149.99,
  'monthly',
  '["📊 Advanced Dashboard", "👥 100 Team Members", "💾 200GB Storage", "📧 Priority Support (12h)", "💬 Live Chat Support", "📞 Phone Support", "📱 Mobile Access", "🔒 SSL Security", "📈 Advanced Analytics", "🔄 Hourly Backups", "🔌 API Access", "🎨 Custom Branding", "📊 Custom Reports", "🔔 Advanced Notifications", "🌐 Multi-language Support"]'::jsonb,
  100,
  200,
  0,
  true, -- ⭐ FEATURED PLAN
  false,
  3,
  'active'
) ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  features = EXCLUDED.features,
  max_users = EXCLUDED.max_users,
  max_storage_gb = EXCLUDED.max_storage_gb,
  trial_days = EXCLUDED.trial_days,
  is_featured = EXCLUDED.is_featured,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

-- ============================================================================
-- TIER 4: ENTERPRISE (Custom Pricing)
-- ============================================================================
INSERT INTO subscription_plans (
  name, 
  description, 
  price, 
  billing_cycle, 
  features, 
  max_users, 
  max_storage_gb,
  trial_days,
  is_featured,
  custom_pricing,
  sort_order,
  status
) VALUES (
  'Enterprise',
  'Custom solutions for large organizations',
  999.99,
  'monthly',
  '["✨ Everything in Professional", "👥 Unlimited Users", "💾 1TB Storage", "📧 24/7 Dedicated Support (4h SLA)", "🎯 Dedicated Account Manager", "💬 Priority Chat & Phone", "📱 Mobile Access", "🔒 Advanced Security (SSO, 2FA)", "📈 Advanced Analytics + Custom Dashboards", "🔄 Real-time Backups", "🔌 API Access + Webhooks", "🎨 White-label Options", "📊 Custom Reports + Data Export", "🔔 Advanced Notifications", "🌐 Multi-language Support", "🛠️ Custom Integrations", "🎓 Priority Training & Onboarding", "📄 Custom SLA"]'::jsonb,
  NULL, -- Unlimited users
  1000,
  0,
  false,
  true, -- Contact sales for pricing
  4,
  'active'
) ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  features = EXCLUDED.features,
  max_users = EXCLUDED.max_users,
  max_storage_gb = EXCLUDED.max_storage_gb,
  trial_days = EXCLUDED.trial_days,
  is_featured = EXCLUDED.is_featured,
  custom_pricing = EXCLUDED.custom_pricing,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

-- ============================================================================
-- PRODUCT ADD-ONS: Money Loan Module
-- ============================================================================

-- Money Loan - Basic
INSERT INTO subscription_plans (
  name, 
  description, 
  price, 
  billing_cycle, 
  features, 
  max_users,
  max_storage_gb,
  trial_days,
  is_featured,
  custom_pricing,
  sort_order,
  product_type,
  status
) VALUES (
  'Money Loan - Basic',
  'Core loan management features for small lending operations',
  79.99,
  'monthly',
  '["💰 Loan Applications", "📝 Basic Underwriting", "💳 Payment Processing", "📊 Basic Reports", "📧 Email Notifications", "👥 Up to 100 active loans"]'::jsonb,
  NULL,
  NULL,
  0,
  false,
  false,
  10,
  'money_loan',
  'active'
) ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  features = EXCLUDED.features,
  trial_days = EXCLUDED.trial_days,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

-- Money Loan - Professional (Recommended)
INSERT INTO subscription_plans (
  name, 
  description, 
  price, 
  billing_cycle, 
  features, 
  max_users,
  max_storage_gb,
  trial_days,
  is_featured,
  custom_pricing,
  sort_order,
  product_type,
  status
) VALUES (
  'Money Loan - Professional',
  'Advanced loan management with automation - Recommended 🌟',
  149.99,
  'monthly',
  '["💰 Loan Applications", "📝 Advanced Underwriting + Credit Scoring", "💳 Payment Processing + Auto-debit", "📊 Advanced Reports + Analytics", "📧 Email + SMS Notifications", "🤖 Automated Workflows", "📈 Risk Analysis", "🔄 Collections Management", "👥 Up to 500 active loans", "🔌 API Access"]'::jsonb,
  NULL,
  NULL,
  0,
  true, -- Featured add-on
  false,
  11,
  'money_loan',
  'active'
) ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  features = EXCLUDED.features,
  trial_days = EXCLUDED.trial_days,
  is_featured = EXCLUDED.is_featured,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

-- Money Loan - Enterprise
INSERT INTO subscription_plans (
  name, 
  description, 
  price, 
  billing_cycle, 
  features, 
  max_users,
  max_storage_gb,
  trial_days,
  is_featured,
  custom_pricing,
  sort_order,
  product_type,
  status
) VALUES (
  'Money Loan - Enterprise',
  'Complete lending platform with custom features',
  299.99,
  'monthly',
  '["✨ Everything in Professional", "💰 Unlimited Loans", "📝 Custom Underwriting Rules", "💳 Multi-currency Support", "📊 Custom Reports + Dashboards", "🤖 Advanced Automation", "📈 Predictive Analytics + ML", "🔄 Advanced Collections + Recovery", "🔌 Full API Access + Webhooks", "🎨 White-label Options", "👥 Dedicated Support"]'::jsonb,
  NULL,
  NULL,
  0,
  false,
  true, -- Contact sales
  12,
  'money_loan',
  'active'
) ON CONFLICT (name) DO UPDATE SET
  description = EXCLUDED.description,
  price = EXCLUDED.price,
  features = EXCLUDED.features,
  trial_days = EXCLUDED.trial_days,
  custom_pricing = EXCLUDED.custom_pricing,
  sort_order = EXCLUDED.sort_order,
  updated_at = now();

-- ============================================================================
-- Verification Query
-- ============================================================================
DO $$
DECLARE
  plan_count INTEGER;
BEGIN
  SELECT COUNT(*) INTO plan_count FROM subscription_plans WHERE status = 'active';
  RAISE NOTICE '✅ Professional plan templates populated successfully!';
  RAISE NOTICE '   Total active plans: %', plan_count;
  RAISE NOTICE '';
  RAISE NOTICE '📋 Plan Summary:';
  RAISE NOTICE '   🎁 Trial: 5 users, 14-day trial, $0';
  RAISE NOTICE '   🚀 Starter: 25 users, $49.99/month';
  RAISE NOTICE '   ⭐ Professional: 100 users, $149.99/month (FEATURED)';
  RAISE NOTICE '   🏢 Enterprise: Unlimited users, Custom pricing';
  RAISE NOTICE '';
  RAISE NOTICE '💰 Money Loan Add-ons:';
  RAISE NOTICE '   Basic: $79.99/month';
  RAISE NOTICE '   Professional: $149.99/month (FEATURED)';
  RAISE NOTICE '   Enterprise: Custom pricing';
END $$;

-- Display all plans
SELECT 
  id,
  name,
  CASE 
    WHEN is_featured THEN '⭐ ' || description
    ELSE description
  END as description,
  price,
  max_users,
  trial_days,
  CASE WHEN is_featured THEN 'YES' ELSE 'NO' END as featured,
  CASE WHEN custom_pricing THEN 'YES' ELSE 'NO' END as custom_pricing,
  sort_order
FROM subscription_plans 
WHERE status = 'active'
ORDER BY sort_order;
