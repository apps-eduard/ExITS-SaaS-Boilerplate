-- Check user ID 17
SELECT id, email, tenant_id FROM users WHERE id = 17;

-- Check if there are any loans for customer_id = 17
SELECT id, customer_id, loan_number, principal_amount, status 
FROM money_loan_loans 
WHERE customer_id = 17;

-- Check all loans to see what customer_ids exist
SELECT customer_id, COUNT(*) as loan_count 
FROM money_loan_loans 
GROUP BY customer_id;

-- If no loans exist for customer_id 17, update existing loans
-- UPDATE money_loan_loans SET customer_id = 17 WHERE id IN (SELECT id FROM money_loan_loans LIMIT 3);
