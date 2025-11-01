# Money Loan Table Name Mapping

## Actual Database Tables (from migrations - snake_case)
Based on migration: `20251025000000_create_money_loan_tables.js`

| Database Table | Purpose | Key Columns |
|----------------|---------|-------------|
| `loan_products` | Loan configuration/types (e.g., "Standard Money Loan", "Fast Cash Loan") | `id`, `tenant_id`, `product_code`, `min_amount`, `max_amount`, `interest_rate`, `interest_type` |
| `loan_applications` | Customer loan applications | `id`, `tenant_id`, `customer_id`, `loan_product_id`, `requested_amount`, `requested_term_days`, `status` |
| `loans` | Active/disbursed loans | `id`, `tenant_id`, `customer_id`, `loan_number`, `principal_amount`, `outstanding_balance`, `amount_paid`, `status` |
| `repayment_schedules` | Payment schedules/installments | `id`, `tenant_id`, `loan_id`, `installment_number`, `due_date`, `total_amount`, `outstanding_amount`, `status` |
| `loan_payments` | Payment transactions | `id`, `tenant_id`, `loan_id`, `customer_id`, `payment_reference`, `amount`, `payment_date`, `payment_method` |
| `loan_documents` | Loan-related documents | `id`, `tenant_id`, `customer_id`, `loan_id`, `document_type`, `file_path` |
| `collection_activities` | Collection follow-ups | `id`, `tenant_id`, `loan_id`, `activity_type`, `activity_date` |

**Note**: `loan_products` is confusing terminology - it's actually loan CONFIGURATION/SETTINGS, not products to sell.

## WRONG Names (DO NOT USE - These don't exist!)

❌ `moneyLoanConfigs` → ✅ Use `loan_products`
❌ `moneyLoanApplications` → ✅ Use `loan_applications`
❌ `moneyLoans` → ✅ Use `loans`
❌ `loanPaymentSchedules` → ✅ Use `repayment_schedules`

## Critical Column Name Differences

### loan_applications
- ✅ `requested_amount` (not `loanAmount`)
- ✅ `requested_term_days` (not `loanTermMonths` or `loan_term_months`)
- ✅ `loan_product_id` (not `loan_config_id`)
- ✅ `application_data` (JSONB field for collateral, employment, etc.)
- ✅ `status`: ['draft', 'submitted', 'under_review', 'approved', 'rejected', 'cancelled']

### loans
- ✅ `principal_amount` (not `loanAmount` or `loan_amount`)
- ✅ `term_days` (not `loan_term_months`)
- ✅ `outstanding_balance` (not `remainingBalance` or `remaining_balance`)
- ✅ `amount_paid` (not `paidAmount` or `paid_amount`)
- ✅ `interest_type` (not `interest_rate_type`)
- ✅ `status`: ['pending', 'disbursed', 'active', 'overdue', 'defaulted', 'paid_off', 'cancelled']

### repayment_schedules
- ✅ `installment_number` (not `schedule_number`)
- ✅ `total_amount` (total due for this installment)
- ✅ `outstanding_amount` (remaining to be paid)
- ✅ `amount_paid` (amount already paid)
- ✅ `status`: ['pending', 'partially_paid', 'paid', 'overdue']

### loan_payments
- ✅ `payment_reference` (unique reference number)
- ✅ `amount` (total payment amount)
- ✅ `principal_amount`, `interest_amount`, `penalty_amount` (breakdown)
- ✅ `payment_date` (date of payment)
- ✅ `payment_method`: ['cash', 'bank_transfer', 'check', 'online', 'mobile_money', 'other']
- ✅ `received_by` (not `processed_by`)
- ✅ `status`: ['pending', 'completed', 'failed', 'refunded']

## Key Term Conversions (Days vs Months)

⚠️ **CRITICAL**: Database uses DAYS, not MONTHS!
- `requested_term_days` = requested months × 30
- `approved_term_days` = approved months × 30
- `term_days` = loan term in DAYS
- `min_term_days`, `max_term_days` in `loan_products`

Example: 12 month loan = 360 days

