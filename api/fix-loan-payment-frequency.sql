-- Fix existing loans to have correct payment_frequency from their products
-- This updates all loans that have NULL payment_frequency

UPDATE money_loan_loans 
SET payment_frequency = (
  SELECT mlp.payment_frequency 
  FROM money_loan_products mlp 
  WHERE mlp.id = money_loan_loans.loan_product_id
)
WHERE money_loan_loans.payment_frequency IS NULL;

-- Verify the update
SELECT 
  mll.id,
  mll.loan_number,
  mlp.name as product_name,
  mlp.payment_frequency as product_freq,
  mll.payment_frequency as loan_freq,
  mll.status
FROM money_loan_loans mll
LEFT JOIN money_loan_products mlp ON mll.loan_product_id = mlp.id
ORDER BY mll.id DESC
LIMIT 10;
