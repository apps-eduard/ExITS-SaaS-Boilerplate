-- Billing Module Schema
-- Creates tables for subscription plans, tenant subscriptions, and invoices

-- Subscription Plans
CREATE TABLE IF NOT EXISTS subscription_plans (
  id SERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price DECIMAL(10, 2) NOT NULL,
  billing_cycle VARCHAR(20) NOT NULL DEFAULT 'monthly', -- monthly, yearly, lifetime
  features JSONB DEFAULT '[]',
  max_users INTEGER,
  max_storage_gb INTEGER,
  status VARCHAR(20) DEFAULT 'active', -- active, inactive, archived
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Tenant Subscriptions
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id INTEGER NOT NULL REFERENCES subscription_plans(id),
  status VARCHAR(20) DEFAULT 'active', -- active, cancelled, expired, trial
  start_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  end_date TIMESTAMP,
  trial_ends_at TIMESTAMP,
  auto_renew BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  subscription_id INTEGER REFERENCES tenant_subscriptions(id),
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  amount DECIMAL(10, 2) NOT NULL,
  tax DECIMAL(10, 2) DEFAULT 0,
  total DECIMAL(10, 2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending', -- pending, paid, overdue, cancelled
  issue_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  due_date TIMESTAMP NOT NULL,
  paid_date TIMESTAMP,
  payment_method VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Payment History
CREATE TABLE IF NOT EXISTS payment_history (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_id INTEGER REFERENCES invoices(id),
  amount DECIMAL(10, 2) NOT NULL,
  payment_method VARCHAR(50),
  transaction_id VARCHAR(100),
  status VARCHAR(20) DEFAULT 'completed', -- completed, failed, refunded
  payment_date TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant ON tenant_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_status ON tenant_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_payment_history_tenant ON payment_history(tenant_id);

-- Insert default plans
INSERT INTO subscription_plans (name, description, price, billing_cycle, features, max_users, max_storage_gb)
VALUES 
  ('Free', 'Basic features for small teams', 0.00, 'monthly', '["Basic Dashboard", "5 Users", "10GB Storage", "Email Support"]', 5, 10),
  ('Starter', 'Perfect for growing businesses', 29.99, 'monthly', '["Full Dashboard", "25 Users", "50GB Storage", "Priority Support", "API Access"]', 25, 50),
  ('Professional', 'Advanced features for professionals', 79.99, 'monthly', '["Full Dashboard", "100 Users", "200GB Storage", "24/7 Support", "API Access", "Advanced Analytics"]', 100, 200),
  ('Enterprise', 'Custom solutions for large organizations', 299.99, 'monthly', '["Everything in Professional", "Unlimited Users", "1TB Storage", "Dedicated Support", "Custom Integration"]', NULL, 1000)
ON CONFLICT DO NOTHING;
