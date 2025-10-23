-- Billing Module Schema
-- Creates tables for subscription plans, tenant subscriptions, invoices, payments, and webhooks
-- Improvements: ENUMs for status, timestamptz, webhook events, plan features table, audit triggers

-- Create ENUMs safely (idempotent)
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'invoice_status') THEN
    CREATE TYPE invoice_status AS ENUM ('pending','paid','overdue','cancelled');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'payment_status') THEN
    CREATE TYPE payment_status AS ENUM ('pending','completed','failed','refunded');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'subscription_status') THEN
    CREATE TYPE subscription_status AS ENUM ('active','cancelled','expired','trial','suspended');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'plan_status') THEN
    CREATE TYPE plan_status AS ENUM ('active','inactive','archived');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'billing_cycle_type') THEN
    CREATE TYPE billing_cycle_type AS ENUM ('monthly','yearly','lifetime');
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'webhook_status') THEN
    CREATE TYPE webhook_status AS ENUM ('pending','processed','failed','ignored');
  END IF;
END$$;

-- Subscription Plans
-- Use BIGSERIAL for explicit sequence-backed PKs (nextval)
CREATE TABLE IF NOT EXISTS subscription_plans (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) NOT NULL,
  description TEXT,
  price NUMERIC(10, 2) NOT NULL,
  billing_cycle billing_cycle_type NOT NULL DEFAULT 'monthly',
  features JSONB DEFAULT '[]', -- Array of feature strings for quick display
  max_users INTEGER,
  max_storage_gb INTEGER,
  status plan_status DEFAULT 'active',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Plan Features (optional normalized table for fine-grained control)
CREATE TABLE IF NOT EXISTS plan_features (
  id BIGSERIAL PRIMARY KEY,
  plan_id BIGINT NOT NULL REFERENCES subscription_plans(id) ON DELETE CASCADE,
  feature_key VARCHAR(100) NOT NULL, -- e.g., 'api_access', 'advanced_analytics'
  feature_name VARCHAR(255) NOT NULL,
  feature_value TEXT, -- e.g., '1000 requests/month', 'true', '500GB'
  enabled BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE (plan_id, feature_key)
);

CREATE INDEX IF NOT EXISTS idx_plan_features_plan ON plan_features(plan_id);
CREATE INDEX IF NOT EXISTS idx_plan_features_key ON plan_features(feature_key);

-- Tenant Subscriptions
CREATE TABLE IF NOT EXISTS tenant_subscriptions (
  id BIGSERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  plan_id BIGINT NOT NULL REFERENCES subscription_plans(id),
  status subscription_status DEFAULT 'trial',
  start_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  end_date TIMESTAMPTZ,
  trial_ends_at TIMESTAMPTZ,
  auto_renew BOOLEAN DEFAULT true,
  stripe_subscription_id VARCHAR(255), -- External gateway subscription ID
  paypal_subscription_id VARCHAR(255),
  metadata JSONB DEFAULT '{}', -- Additional gateway data
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_tenant ON tenant_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_status ON tenant_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_plan ON tenant_subscriptions(plan_id);
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_stripe ON tenant_subscriptions(stripe_subscription_id) WHERE stripe_subscription_id IS NOT NULL;

-- Payment Methods (normalized)
CREATE TABLE IF NOT EXISTS payment_methods (
  id BIGSERIAL PRIMARY KEY,
  name VARCHAR(100) UNIQUE NOT NULL, -- e.g., 'stripe', 'paypal', 'bank_transfer'
  display_name VARCHAR(255) NOT NULL,
  description TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Insert default payment methods
INSERT INTO payment_methods (name, display_name, description) VALUES
  ('stripe', 'Stripe', 'Credit/Debit Card via Stripe'),
  ('paypal', 'PayPal', 'PayPal Account'),
  ('bank_transfer', 'Bank Transfer', 'Direct Bank Transfer'),
  ('manual', 'Manual Payment', 'Offline/Manual Payment Entry')
ON CONFLICT (name) DO NOTHING;

-- Invoices
CREATE TABLE IF NOT EXISTS invoices (
  id BIGSERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  subscription_id BIGINT REFERENCES tenant_subscriptions(id) ON DELETE SET NULL,
  invoice_number VARCHAR(100) UNIQUE NOT NULL,
  amount NUMERIC(10, 2) NOT NULL,
  tax NUMERIC(10, 2) DEFAULT 0,
  total NUMERIC(12, 2) NOT NULL,
  status invoice_status DEFAULT 'pending',
  issue_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  due_date TIMESTAMPTZ NOT NULL,
  paid_date TIMESTAMPTZ,
  payment_method_id BIGINT REFERENCES payment_methods(id) ON DELETE SET NULL,
  stripe_invoice_id VARCHAR(255), -- External invoice ID
  paypal_invoice_id VARCHAR(255),
  notes TEXT,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_invoices_tenant ON invoices(tenant_id);
CREATE INDEX IF NOT EXISTS idx_invoices_subscription ON invoices(subscription_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_number ON invoices(invoice_number);
CREATE INDEX IF NOT EXISTS idx_invoices_stripe ON invoices(stripe_invoice_id) WHERE stripe_invoice_id IS NOT NULL;

-- Payment History
CREATE TABLE IF NOT EXISTS payment_history (
  id BIGSERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  invoice_id BIGINT REFERENCES invoices(id) ON DELETE CASCADE,
  amount NUMERIC(10, 2) NOT NULL,
  payment_method_id BIGINT REFERENCES payment_methods(id) ON DELETE SET NULL,
  transaction_id VARCHAR(255) UNIQUE, -- External gateway transaction ID (unique to prevent duplicates)
  status payment_status DEFAULT 'completed',
  payment_date TIMESTAMPTZ NOT NULL DEFAULT now(),
  gateway_response JSONB, -- Store full gateway response for debugging
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now(),
  
  -- Ensure transaction_id is unique when present
  CONSTRAINT unique_transaction_id UNIQUE NULLS NOT DISTINCT (transaction_id)
);

CREATE INDEX IF NOT EXISTS idx_payment_history_tenant ON payment_history(tenant_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_invoice ON payment_history(invoice_id);
CREATE INDEX IF NOT EXISTS idx_payment_history_status ON payment_history(status);
CREATE INDEX IF NOT EXISTS idx_payment_history_transaction ON payment_history(transaction_id) WHERE transaction_id IS NOT NULL;

-- Webhook Events (for Stripe/PayPal/other gateway webhooks)
CREATE TABLE IF NOT EXISTS webhook_events (
  id BIGSERIAL PRIMARY KEY,
  provider VARCHAR(50) NOT NULL, -- 'stripe', 'paypal', etc.
  event_type VARCHAR(100) NOT NULL, -- 'invoice.paid', 'subscription.cancelled', etc.
  event_id VARCHAR(255) UNIQUE NOT NULL, -- External event ID from gateway
  payload JSONB NOT NULL, -- Full webhook payload
  status webhook_status DEFAULT 'pending',
  tenant_id INTEGER REFERENCES tenants(id) ON DELETE SET NULL, -- Linked tenant if identifiable
  subscription_id BIGINT REFERENCES tenant_subscriptions(id) ON DELETE SET NULL,
  invoice_id BIGINT REFERENCES invoices(id) ON DELETE SET NULL,
  processed_at TIMESTAMPTZ,
  error_message TEXT,
  retry_count INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX IF NOT EXISTS idx_webhook_events_provider ON webhook_events(provider);
CREATE INDEX IF NOT EXISTS idx_webhook_events_type ON webhook_events(event_type);
CREATE INDEX IF NOT EXISTS idx_webhook_events_status ON webhook_events(status);
CREATE INDEX IF NOT EXISTS idx_webhook_events_event_id ON webhook_events(event_id);
CREATE INDEX IF NOT EXISTS idx_webhook_events_tenant ON webhook_events(tenant_id) WHERE tenant_id IS NOT NULL;
CREATE INDEX IF NOT EXISTS idx_webhook_events_created ON webhook_events(created_at DESC);

-- Audit Trigger Function for Subscription Changes
-- This logs subscription status changes to audit_logs table (assuming it exists)
CREATE OR REPLACE FUNCTION audit_subscription_changes()
RETURNS TRIGGER AS $$
BEGIN
  IF TG_OP = 'UPDATE' AND OLD.status IS DISTINCT FROM NEW.status THEN
    -- Log to audit_logs if the table exists
    IF EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'audit_logs') THEN
      INSERT INTO audit_logs (
        action,
        table_name,
        record_id,
        tenant_id,
        user_id,
        changes,
        ip_address,
        user_agent,
        status,
        created_at
      ) VALUES (
        'subscription_status_change',
        'tenant_subscriptions',
        NEW.id::TEXT,
        NEW.tenant_id,
        NULL, -- System change (can be updated if user context is available)
        jsonb_build_object(
          'old_status', OLD.status,
          'new_status', NEW.status,
          'plan_id', NEW.plan_id,
          'start_date', NEW.start_date,
          'end_date', NEW.end_date
        ),
        NULL,
        'system',
        'success',
        now()
      );
    END IF;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply audit trigger to tenant_subscriptions
DROP TRIGGER IF EXISTS audit_subscription_status_trigger ON tenant_subscriptions;
CREATE TRIGGER audit_subscription_status_trigger
  AFTER UPDATE ON tenant_subscriptions
  FOR EACH ROW
  EXECUTE FUNCTION audit_subscription_changes();

-- Insert default plans (lowercase to match tenant_plan ENUM)
INSERT INTO subscription_plans (name, description, price, billing_cycle, features, max_users, max_storage_gb)
VALUES 
  ('trial', '14-day trial period', 0.00, 'monthly', '["Basic Dashboard", "10 Users", "25GB Storage", "Email Support"]', 10, 25),
  ('starter', 'Perfect for growing businesses', 29.99, 'monthly', '["Full Dashboard", "25 Users", "50GB Storage", "Priority Support", "API Access"]', 25, 50),
  ('pro', 'Advanced features for professionals', 79.99, 'monthly', '["Full Dashboard", "100 Users", "200GB Storage", "24/7 Support", "API Access", "Advanced Analytics"]', 100, 200),
  ('enterprise', 'Custom solutions for large organizations', 299.99, 'monthly', '["Everything in Professional", "Unlimited Users", "1TB Storage", "Dedicated Support", "Custom Integration"]', NULL, 1000)
ON CONFLICT DO NOTHING;
