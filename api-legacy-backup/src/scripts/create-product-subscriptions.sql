-- Create product subscriptions table to track tenant product subscriptions
-- This allows tenants to subscribe to multiple products (Money Loan, BNPL, Pawnshop)

-- Product types enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_type') THEN
    CREATE TYPE product_type AS ENUM ('money_loan', 'bnpl', 'pawnshop');
  END IF;
END$$;

-- Product subscription status enum
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_type WHERE typname = 'product_subscription_status') THEN
    CREATE TYPE product_subscription_status AS ENUM ('active', 'suspended', 'cancelled', 'expired');
  END IF;
END$$;

-- Product subscriptions table
CREATE TABLE IF NOT EXISTS product_subscriptions (
  id SERIAL PRIMARY KEY,
  tenant_id INT NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  product_type product_type NOT NULL,
  subscription_plan_id BIGINT REFERENCES subscription_plans(id),
  status product_subscription_status NOT NULL DEFAULT 'active',
  started_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  price NUMERIC(10,2) DEFAULT 0.00,
  billing_cycle billing_cycle_type DEFAULT 'monthly',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  
  CONSTRAINT unique_tenant_product UNIQUE(tenant_id, product_type)
);

CREATE INDEX IF NOT EXISTS idx_product_subscriptions_tenant ON product_subscriptions(tenant_id);
CREATE INDEX IF NOT EXISTS idx_product_subscriptions_status ON product_subscriptions(status);
CREATE INDEX IF NOT EXISTS idx_product_subscriptions_product ON product_subscriptions(product_type);

-- Migrate existing enabled products to product_subscriptions
INSERT INTO product_subscriptions (tenant_id, product_type, status, price, billing_cycle)
SELECT 
  id as tenant_id,
  'money_loan'::product_type,
  'active'::product_subscription_status,
  0.00,
  'monthly'::billing_cycle_type
FROM tenants 
WHERE money_loan_enabled = true
ON CONFLICT (tenant_id, product_type) DO NOTHING;

INSERT INTO product_subscriptions (tenant_id, product_type, status, price, billing_cycle)
SELECT 
  id as tenant_id,
  'bnpl'::product_type,
  'active'::product_subscription_status,
  0.00,
  'monthly'::billing_cycle_type
FROM tenants 
WHERE bnpl_enabled = true
ON CONFLICT (tenant_id, product_type) DO NOTHING;

INSERT INTO product_subscriptions (tenant_id, product_type, status, price, billing_cycle)
SELECT 
  id as tenant_id,
  'pawnshop'::product_type,
  'active'::product_subscription_status,
  0.00,
  'monthly'::billing_cycle_type
FROM tenants 
WHERE pawnshop_enabled = true
ON CONFLICT (tenant_id, product_type) DO NOTHING;

-- Verify migration
SELECT 
  t.name as tenant_name,
  ps.product_type,
  ps.status,
  ps.price,
  ps.billing_cycle
FROM product_subscriptions ps
JOIN tenants t ON ps.tenant_id = t.id
ORDER BY t.name, ps.product_type;
