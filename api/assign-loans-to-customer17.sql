-- First, let's see what loans exist
SELECT id, customer_id, loan_number, principal_amount, status, tenant_id 
FROM money_loan_loans 
ORDER BY id 
LIMIT 10;

-- Update the first 3 loans to belong to customer_id 17 (Maria Santos)
UPDATE money_loan_loans 
SET customer_id = 17 
WHERE id IN (
  SELECT id 
  FROM money_loan_loans 
  WHERE tenant_id = 1 
  ORDER BY id 
  LIMIT 3
);

-- Verify the update
SELECT id, customer_id, loan_number, principal_amount, status 
FROM money_loan_loans 
WHERE customer_id = 17;
