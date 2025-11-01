-- Add product enablement columns to tenants table
-- These columns track which products (Money Loan, BNPL, Pawnshop) are enabled for each tenant

ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS money_loan_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS bnpl_enabled BOOLEAN DEFAULT FALSE,
ADD COLUMN IF NOT EXISTS pawnshop_enabled BOOLEAN DEFAULT FALSE;

-- Verify the columns were added
SELECT column_name, data_type, column_default 
FROM information_schema.columns 
WHERE table_name = 'tenants' 
AND column_name IN ('money_loan_enabled', 'bnpl_enabled', 'pawnshop_enabled')
ORDER BY column_name;
