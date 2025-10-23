-- Fix plan names to match tenant_plan ENUM (all lowercase)
-- This ensures consistency between subscription_plans table and tenant_plan ENUM

UPDATE subscription_plans 
SET name = LOWER(name)
WHERE name IN ('Trial', 'Starter', 'Pro', 'Professional', 'Enterprise', 'Free');

-- Verify the update
SELECT id, name, price, billing_cycle, status FROM subscription_plans ORDER BY price;
