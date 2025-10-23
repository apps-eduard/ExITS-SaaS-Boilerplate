-- Insert Trial plan
INSERT INTO subscription_plans (name, description, price, billing_cycle, features, max_users, max_storage_gb, status) 
VALUES (
  'Trial', 
  '14-day free trial with full features', 
  0, 
  'monthly', 
  '["Full Dashboard", "10 Users", "25GB Storage", "Email Support", "14-Day Trial"]'::jsonb, 
  10, 
  25, 
  'active'
);
