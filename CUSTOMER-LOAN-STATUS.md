# Customer Money Loan Implementation - Next Steps

## Current Status

### ✅ Completed
1. Created customer Money Loan controller (`api/src/modules/customer/controllers/LoanController.js`)
2. Created customer Money Loan routes (`api/src/modules/customer/routes/loanRoutes.js`)
3. Mounted routes in customer portal (`api/src/modules/customer/routes/index.js`)
4. Updated customerAuth middleware to use proper structure
5. Created TABLE_MAPPING.md documentation

### ❌ Issues Found
1. **CRITICAL**: LoanController uses WRONG table names!
   - Uses: `moneyLoanApplications`, `moneyLoans`, `loanPaymentSchedules`
   - Should use: `loan_applications`, `loans`, `repayment_schedules`

2. **CRITICAL**: LoanController uses WRONG column names!
   - Uses: `loanAmount`, `loanTermMonths`, `remainingBalance`
   - Should use: `requested_amount`, `requested_term_days`, `outstanding_balance`

3. **CRITICAL**: Term conversion issue
   - Database uses DAYS (not months)
   - 12 months = 360 days (30 days per month)

## What Needs to be Done

### Step 1: Fix LoanController Table & Column Names
The controller must be completely rewritten to match the actual database schema:

**Table Name Changes:**
```javascript
// WRONG:
knex('moneyLoanApplications')
knex('moneyLoans')
knex('loanPaymentSchedules')

// CORRECT:
knex('loan_applications')
knex('loans')
knex('repayment_schedules')
```

**Column Name Changes:**
```javascript
// loan_applications
requested_amount (not loanAmount)
requested_term_days (not loanTermMonths)
loan_product_id (not loan_config_id)
application_data (JSONB - for collateral, etc.)

// loans
principal_amount (not loanAmount)
term_days (not loan_term_months)
outstanding_balance (not remainingBalance)
amount_paid (not paidAmount)
interest_type (not interest_rate_type)

// repayment_schedules
installment_number (not schedule_number)
total_amount (installment total)
outstanding_amount (remaining for this installment)
amount_paid (paid for this installment)
```

### Step 2: Convert Months to Days
```javascript
// When customer submits application with months
const requestedMonths = 12;
const requested_term_days = requestedMonths * 30;

// When displaying to customer
const termInMonths = Math.floor(loan.term_days / 30);
```

### Step 3: Handle loan_products (Configuration)
```javascript
// Get loan configuration/settings
const loanProduct = await knex('loan_products')
  .where({ tenant_id: tenantId, is_active: true })
  .first();

// Validate against product limits
if (requestedAmount < loanProduct.minAmount || 
    requestedAmount > loanProduct.maxAmount) {
  return error;
}
```

### Step 4: Run Setup Script
```powershell
# This will:
# 1. Drop and recreate database
# 2. Run all migrations (create tables)
# 3. Run all seeds (populate data)
# 4. Create test customers

.\setup.ps1
```

### Step 5: Add Money Loan Test Data
After setup.ps1 completes, we need to seed:
1. A loan_product (Standard Money Loan configuration)
2. A loan_application for Maria Santos (approved)
3. A loan for Maria (active with payment schedule)
4. Some loan_payments (3 payments made)
5. A pending loan_application for another customer

## Decision Point

**Do you want me to:**

**Option A**: Fix the LoanController right now (rewrite with correct table/column names), then run setup.ps1

**Option B**: Run setup.ps1 first (get clean database), then I'll rewrite the controller correctly

**Option C**: Create a completely new, correct LoanController from scratch based on the actual migration schema

## Recommendation

I recommend **Option C**: 
1. Delete the current incorrect LoanController
2. Create a NEW one from scratch using the correct schema
3. Reference the existing employee-facing controllers in `api/src/modules/platforms/money-loan/` as examples (they use the correct tables)
4. Run setup.ps1 to get a clean environment
5. Add Money Loan test data seed
6. Test the customer APIs

What would you like me to do?
