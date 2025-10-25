-- ============================================================================
-- Subscription Plan Enhancements
-- Adds trial days, featured flags, custom pricing, and plan features table
-- ============================================================================

-- Step 1: Add new columns to subscription_plans table
ALTER TABLE subscription_plans 
ADD COLUMN IF NOT EXISTS trial_days INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS is_featured BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS custom_pricing BOOLEAN DEFAULT false,
ADD COLUMN IF NOT EXISTS sort_order INTEGER DEFAULT 0;

-- Add index for featured plans (faster queries)
CREATE INDEX IF NOT EXISTS idx_subscription_plans_featured ON subscription_plans(is_featured) WHERE is_featured = true;
CREATE INDEX IF NOT EXISTS idx_subscription_plans_sort ON subscription_plans(sort_order);

-- Step 2: Create plan_features table for fine-grained feature control
CREATE TABLE IF NOT EXISTS plan_features (
  id BIGSERIAL PRIMARY KEY,
  plan_id BIGINT NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  feature_key VARCHAR(100) NOT NULL, -- e.g., 'api_access', 'advanced_analytics'
  feature_name VARCHAR(255) NOT NULL,
  feature_value TEXT, -- e.g., '1000 requests/month', 'true', '500GB'
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (plan_id, feature_key)
);

-- Add indexes for plan_features
CREATE INDEX IF NOT EXISTS idx_plan_features_plan ON plan_features(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_features_key ON plan_features(feature_key);

-- Step 3: Update existing plans with default values
UPDATE subscription_plans 
SET 
  trial_days = CASE 
    WHEN LOWER(name) = 'trial' THEN 14
    ELSE 0
  END,
  is_featured = CASE 
    WHEN LOWER(name) IN ('professional', 'pro') THEN true
    ELSE false
  END,
  custom_pricing = CASE 
    WHEN LOWER(name) = 'enterprise' THEN true
    ELSE false
  END,
  sort_order = CASE 
    WHEN LOWER(name) = 'trial' THEN 1
    WHEN LOWER(name) = 'starter' THEN 2
    WHEN LOWER(name) IN ('professional', 'pro') THEN 3
    WHEN LOWER(name) = 'enterprise' THEN 4
    ELSE 99
  END
WHERE trial_days IS NULL OR is_featured IS NULL;

-- Step 4: Add comments for documentation
COMMENT ON COLUMN subscription_plans.trial_days IS 'Number of free trial days for this plan (0 = no trial)';
COMMENT ON COLUMN subscription_plans.is_featured IS 'Highlight this plan as recommended/most popular';
COMMENT ON COLUMN subscription_plans.custom_pricing IS 'Contact sales for pricing (typically Enterprise plans)';
COMMENT ON COLUMN subscription_plans.sort_order IS 'Display order (lower numbers appear first)';

COMMENT ON TABLE plan_features IS 'Fine-grained feature control for subscription plans';
COMMENT ON COLUMN plan_features.feature_key IS 'Unique identifier for the feature (e.g., api_access, users_max)';
COMMENT ON COLUMN plan_features.feature_value IS 'Feature configuration value (boolean, number, or string)';

-- Success message
DO $$
BEGIN
  RAISE NOTICE '✅ Subscription schema enhanced successfully!';
  RAISE NOTICE '   - Added trial_days, is_featured, custom_pricing, sort_order columns';
  RAISE NOTICE '   - Created plan_features table for feature gating';
  RAISE NOTICE '   - Added indexes for performance';
  RAISE NOTICE '   - Updated existing plans with defaults';
END $$;
