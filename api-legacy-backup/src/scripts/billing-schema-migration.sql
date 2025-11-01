-- Migration script to add new columns to existing billing tables
-- Run this AFTER billing-schema.sql to update existing tables

-- Add new columns to tenant_subscriptions
DO $$ 
BEGIN
  -- Add stripe_subscription_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tenant_subscriptions' AND column_name = 'stripe_subscription_id'
  ) THEN
    ALTER TABLE tenant_subscriptions ADD COLUMN stripe_subscription_id VARCHAR(255);
  END IF;

  -- Add paypal_subscription_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tenant_subscriptions' AND column_name = 'paypal_subscription_id'
  ) THEN
    ALTER TABLE tenant_subscriptions ADD COLUMN paypal_subscription_id VARCHAR(255);
  END IF;

  -- Add metadata if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'tenant_subscriptions' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE tenant_subscriptions ADD COLUMN metadata JSONB DEFAULT '{}';
  END IF;
END $$;

-- Create index on stripe_subscription_id
CREATE INDEX IF NOT EXISTS idx_tenant_subscriptions_stripe 
  ON tenant_subscriptions(stripe_subscription_id) 
  WHERE stripe_subscription_id IS NOT NULL;

-- Add new columns to invoices
DO $$ 
BEGIN
  -- Add stripe_invoice_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'stripe_invoice_id'
  ) THEN
    ALTER TABLE invoices ADD COLUMN stripe_invoice_id VARCHAR(255);
  END IF;

  -- Add paypal_invoice_id if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'paypal_invoice_id'
  ) THEN
    ALTER TABLE invoices ADD COLUMN paypal_invoice_id VARCHAR(255);
  END IF;

  -- Add metadata if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'invoices' AND column_name = 'metadata'
  ) THEN
    ALTER TABLE invoices ADD COLUMN metadata JSONB DEFAULT '{}';
  END IF;
END $$;

-- Create index on stripe_invoice_id
CREATE INDEX IF NOT EXISTS idx_invoices_stripe 
  ON invoices(stripe_invoice_id) 
  WHERE stripe_invoice_id IS NOT NULL;

-- Add new columns to payment_history
DO $$ 
BEGIN
  -- Add gateway_response if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payment_history' AND column_name = 'gateway_response'
  ) THEN
    ALTER TABLE payment_history ADD COLUMN gateway_response JSONB;
  END IF;
END $$;

-- Add new columns to payment_methods
DO $$ 
BEGIN
  -- Add display_name if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payment_methods' AND column_name = 'display_name'
  ) THEN
    ALTER TABLE payment_methods ADD COLUMN display_name VARCHAR(255) NOT NULL DEFAULT '';
  END IF;

  -- Add is_active if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payment_methods' AND column_name = 'is_active'
  ) THEN
    ALTER TABLE payment_methods ADD COLUMN is_active BOOLEAN DEFAULT true;
  END IF;

  -- Add created_at if not exists
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns 
    WHERE table_name = 'payment_methods' AND column_name = 'created_at'
  ) THEN
    ALTER TABLE payment_methods ADD COLUMN created_at TIMESTAMPTZ DEFAULT now();
  END IF;
END $$;

-- Update existing payment_methods with display names
UPDATE payment_methods SET display_name = 'Stripe' WHERE name = 'stripe' AND (display_name = '' OR display_name IS NULL);
UPDATE payment_methods SET display_name = 'PayPal' WHERE name = 'paypal' AND (display_name = '' OR display_name IS NULL);
UPDATE payment_methods SET display_name = 'Bank Transfer' WHERE name = 'bank_transfer' AND (display_name = '' OR display_name IS NULL);
UPDATE payment_methods SET display_name = 'Manual Payment' WHERE name = 'manual' AND (display_name = '' OR display_name IS NULL);

-- Convert existing status columns to ENUMs (if they're still VARCHAR)
-- This is complex and may require data migration, so we'll leave existing data as-is
-- Future inserts will use the ENUM types

-- Summary
SELECT 'Migration completed successfully' AS status;
