# Money Loan Platform - API Testing Guide

## Overview
Complete API reference for Money Loan platform with 47 endpoints organized into 4 modules.

**Base URL**: `/api/tenants/:tenantId/platforms/moneyloan`

---

## 1. Configuration Module (14 endpoints)

### Interest Rate Configuration

#### Create Interest Rate Config
```http
POST /api/tenants/:tenantId/platforms/moneyloan/config/interest-rates/:loanProductId
Content-Type: application/json

{
  "rate_type": "fixed",
  "base_rate": 12.5,
  "min_rate": 10.0,
  "max_rate": 15.0,
  "rate_adjustment_frequency": "monthly",
  "effective_date": "2024-01-01"
}
```

#### Get Interest Rate Configs
```http
GET /api/tenants/:tenantId/platforms/moneyloan/config/interest-rates/:loanProductId
```

#### Update Interest Rate Config
```http
PUT /api/tenants/:tenantId/platforms/moneyloan/config/interest-rates/:loanProductId/:configId
Content-Type: application/json

{
  "base_rate": 13.0,
  "max_rate": 16.0
}
```

#### Delete Interest Rate Config
```http
DELETE /api/tenants/:tenantId/platforms/moneyloan/config/interest-rates/:loanProductId/:configId
```

### Payment Schedule Configuration

#### Create Payment Schedule Config
```http
POST /api/tenants/:tenantId/platforms/moneyloan/config/payment-schedules/:loanProductId
Content-Type: application/json

{
  "schedule_type": "fixed",
  "payment_frequency": "monthly",
  "day_of_payment": 1,
  "grace_period_days": 5,
  "late_payment_penalty_type": "percentage",
  "late_payment_penalty_value": 2.0
}
```

#### Get Payment Schedule Configs
```http
GET /api/tenants/:tenantId/platforms/moneyloan/config/payment-schedules/:loanProductId
```

#### Update Payment Schedule Config
```http
PUT /api/tenants/:tenantId/platforms/moneyloan/config/payment-schedules/:loanProductId/:configId
Content-Type: application/json

{
  "grace_period_days": 7,
  "late_payment_penalty_value": 2.5
}
```

### Fee Structure Configuration

#### Create Fee Structure
```http
POST /api/tenants/:tenantId/platforms/moneyloan/config/fees/:loanProductId
Content-Type: application/json

{
  "fee_type": "processing_fee",
  "fee_amount_type": "percentage",
  "fee_value": 1.5,
  "min_fee_amount": 100,
  "max_fee_amount": 5000,
  "charge_timing": "upfront"
}
```

#### Get Fee Structures
```http
GET /api/tenants/:tenantId/platforms/moneyloan/config/fees/:loanProductId
```

#### Update Fee Structure
```http
PUT /api/tenants/:tenantId/platforms/moneyloan/config/fees/:loanProductId/:configId
Content-Type: application/json

{
  "fee_value": 2.0,
  "max_fee_amount": 7500
}
```

### Approval Rules Configuration

#### Create Approval Rule
```http
POST /api/tenants/:tenantId/platforms/moneyloan/config/approval-rules/:loanProductId
Content-Type: application/json

{
  "rule_name": "Standard Approval",
  "min_credit_score": 650,
  "max_debt_to_income_ratio": 40,
  "min_employment_months": 6,
  "approval_level": "manager",
  "auto_approve_threshold": 10000
}
```

#### Get Approval Rules
```http
GET /api/tenants/:tenantId/platforms/moneyloan/config/approval-rules/:loanProductId
```

#### Update Approval Rule
```http
PUT /api/tenants/:tenantId/platforms/moneyloan/config/approval-rules/:loanProductId/:configId
Content-Type: application/json

{
  "min_credit_score": 680,
  "auto_approve_threshold": 15000
}
```

### Loan Modifications Configuration

#### Create Modification Config
```http
POST /api/tenants/:tenantId/platforms/moneyloan/config/modifications/:loanProductId
Content-Type: application/json

{
  "modification_type": "term_extension",
  "max_modifications_allowed": 2,
  "cooling_period_days": 90,
  "fee_percentage": 1.0,
  "approval_required": true
}
```

#### Get Modification Configs
```http
GET /api/tenants/:tenantId/platforms/moneyloan/config/modifications/:loanProductId
```

#### Update Modification Config
```http
PUT /api/tenants/:tenantId/platforms/moneyloan/config/modifications/:loanProductId/:configId
Content-Type: application/json

{
  "max_modifications_allowed": 3,
  "fee_percentage": 1.5
}
```

#### Delete Modification Config
```http
DELETE /api/tenants/:tenantId/platforms/moneyloan/config/modifications/:loanProductId/:configId
```

#### Get Active Modification Config
```http
GET /api/tenants/:tenantId/platforms/moneyloan/config/modifications/:loanProductId/active
```

---

## 2. Loan Management Module (14 endpoints)

### Loan Applications

#### Create Loan Application
```http
POST /api/tenants/:tenantId/platforms/moneyloan/loans/applications
Content-Type: application/json

{
  "customer_id": "cust_12345",
  "loan_product_id": "prod_67890",
  "requested_amount": 50000,
  "loan_purpose": "Business expansion",
  "requested_term_months": 24,
  "employment_status": "employed",
  "monthly_income": 75000,
  "existing_debts": 15000
}
```

#### Get Loan Application
```http
GET /api/tenants/:tenantId/platforms/moneyloan/loans/applications/:applicationId
```

#### Update Loan Application
```http
PUT /api/tenants/:tenantId/platforms/moneyloan/loans/applications/:applicationId
Content-Type: application/json

{
  "requested_amount": 55000,
  "requested_term_months": 36
}
```

#### Approve Loan Application
```http
POST /api/tenants/:tenantId/platforms/moneyloan/loans/applications/:applicationId/approve
Content-Type: application/json

{
  "approved_amount": 50000,
  "approved_term_months": 24,
  "interest_rate": 12.5,
  "approval_notes": "Approved based on credit score and income verification"
}
```

#### Reject Loan Application
```http
POST /api/tenants/:tenantId/platforms/moneyloan/loans/applications/:applicationId/reject
Content-Type: application/json

{
  "rejection_reason": "Insufficient credit score",
  "rejection_notes": "Credit score below minimum threshold"
}
```

### Loan Operations

#### Disburse Loan
```http
POST /api/tenants/:tenantId/platforms/moneyloan/loans/:loanId/disburse
Content-Type: application/json

{
  "disbursement_method": "bank_transfer",
  "disbursement_account": "1234567890",
  "disbursement_notes": "Disbursed to customer account"
}
```

#### Get Loan Details
```http
GET /api/tenants/:tenantId/platforms/moneyloan/loans/:loanId
```

#### Get Customer Loans
```http
GET /api/tenants/:tenantId/platforms/moneyloan/loans/customers/:customerId/loans
```

#### Get Product Loans
```http
GET /api/tenants/:tenantId/platforms/moneyloan/loans/products/:productId/loans
```

#### Get Loans with Filters
```http
GET /api/tenants/:tenantId/platforms/moneyloan/loans?status=active&product_id=prod_123&min_amount=10000&max_amount=100000&start_date=2024-01-01&end_date=2024-12-31&page=1&limit=20
```

#### Close Loan
```http
POST /api/tenants/:tenantId/platforms/moneyloan/loans/:loanId/close
Content-Type: application/json

{
  "closure_reason": "fully_paid",
  "closure_notes": "All payments completed successfully"
}
```

#### Suspend Loan
```http
POST /api/tenants/:tenantId/platforms/moneyloan/loans/:loanId/suspend
Content-Type: application/json

{
  "suspension_reason": "customer_request",
  "suspension_notes": "Customer requested temporary suspension due to medical emergency"
}
```

#### Resume Loan
```http
POST /api/tenants/:tenantId/platforms/moneyloan/loans/:loanId/resume
Content-Type: application/json

{
  "resume_notes": "Customer situation resolved, resuming normal payments"
}
```

#### Get Loans Dashboard
```http
GET /api/tenants/:tenantId/platforms/moneyloan/loans/dashboard
```

---

## 3. Payment Processing Module (10 endpoints)

### Payment Operations

#### Process Payment
```http
POST /api/tenants/:tenantId/platforms/moneyloan/loans/:loanId/payments
Content-Type: application/json

{
  "payment_amount": 5000,
  "payment_method": "bank_transfer",
  "payment_reference": "PAY123456",
  "payment_notes": "Regular monthly payment"
}
```

#### Get Payment History
```http
GET /api/tenants/:tenantId/platforms/moneyloan/loans/:loanId/payments?page=1&limit=20
```

#### Get Loan Balance
```http
GET /api/tenants/:tenantId/platforms/moneyloan/loans/:loanId/balance
```

#### Apply Late Penalty
```http
POST /api/tenants/:tenantId/platforms/moneyloan/loans/:loanId/penalties
Content-Type: application/json

{
  "penalty_amount": 250,
  "penalty_reason": "Late payment - 5 days overdue",
  "penalty_date": "2024-06-05"
}
```

### Payment Schedule Operations

#### Get Payment Schedule
```http
GET /api/tenants/:tenantId/platforms/moneyloan/loans/:loanId/schedule
```

#### Generate Payment Schedule
```http
POST /api/tenants/:tenantId/platforms/moneyloan/loans/:loanId/schedule/generate
Content-Type: application/json

{
  "schedule_type": "fixed",
  "payment_frequency": "monthly",
  "first_payment_date": "2024-02-01"
}
```

#### Recalculate Payment Schedule
```http
POST /api/tenants/:tenantId/platforms/moneyloan/loans/:loanId/schedule/recalculate
Content-Type: application/json

{
  "effective_date": "2024-06-01",
  "reason": "Interest rate adjustment"
}
```

#### Get Next Payment Due
```http
GET /api/tenants/:tenantId/platforms/moneyloan/loans/:loanId/schedule/next-due
```

#### Get Amortization Table
```http
GET /api/tenants/:tenantId/platforms/moneyloan/loans/:loanId/amortization
```

### Payment Reversals

#### Reverse Payment
```http
POST /api/tenants/:tenantId/platforms/moneyloan/payments/:paymentId/reverse
Content-Type: application/json

{
  "reversal_reason": "duplicate_payment",
  "reversal_notes": "Customer made duplicate payment by mistake"
}
```

---

## 4. Reporting & Analytics Module (9 endpoints)

### Reports

#### Get Portfolio Summary
```http
GET /api/tenants/:tenantId/platforms/moneyloan/reports/portfolio?start_date=2024-01-01&end_date=2024-12-31
```

#### Get Performance Report
```http
GET /api/tenants/:tenantId/platforms/moneyloan/reports/performance?start_date=2024-01-01&end_date=2024-12-31&product_id=prod_123
```

#### Get Collections Report
```http
GET /api/tenants/:tenantId/platforms/moneyloan/reports/collections?start_date=2024-06-01&end_date=2024-06-30
```

#### Get Arrears Report
```http
GET /api/tenants/:tenantId/platforms/moneyloan/reports/arrears?aging_bucket=30-60
```

#### Get Write-Off Report
```http
GET /api/tenants/:tenantId/platforms/moneyloan/reports/write-offs?start_date=2024-01-01&end_date=2024-12-31
```

#### Get Product Performance Report
```http
GET /api/tenants/:tenantId/platforms/moneyloan/reports/products?product_id=prod_123&start_date=2024-01-01&end_date=2024-12-31
```

#### Get Revenue Report
```http
GET /api/tenants/:tenantId/platforms/moneyloan/reports/revenue?start_date=2024-06-01&end_date=2024-06-30&breakdown=monthly
```

#### Get Aging Analysis
```http
GET /api/tenants/:tenantId/platforms/moneyloan/reports/aging
```

### Export

#### Export Report to CSV
```http
POST /api/tenants/:tenantId/platforms/moneyloan/reports/export
Content-Type: application/json

{
  "report_type": "portfolio",
  "start_date": "2024-01-01",
  "end_date": "2024-12-31",
  "format": "csv"
}
```

---

## Testing Checklist

### Phase 1: Configuration Testing
- [ ] Create interest rate config
- [ ] Get interest rate configs
- [ ] Update interest rate config
- [ ] Delete interest rate config
- [ ] Create payment schedule config
- [ ] Create fee structure
- [ ] Create approval rule
- [ ] Create modification config
- [ ] Get all configs for a product

### Phase 2: Loan Application Testing
- [ ] Create loan application
- [ ] Get loan application
- [ ] Update loan application
- [ ] Approve loan application
- [ ] Reject loan application

### Phase 3: Loan Lifecycle Testing
- [ ] Disburse approved loan
- [ ] Get loan details
- [ ] Get customer loans
- [ ] Get product loans
- [ ] Filter loans by criteria
- [ ] Suspend loan
- [ ] Resume loan
- [ ] Close loan
- [ ] View loans dashboard

### Phase 4: Payment Testing
- [ ] Process payment
- [ ] Get payment history
- [ ] Get loan balance
- [ ] Apply late penalty
- [ ] Reverse payment
- [ ] Generate payment schedule
- [ ] Recalculate schedule
- [ ] Get next payment due
- [ ] Get amortization table

### Phase 5: Reporting Testing
- [ ] Get portfolio summary
- [ ] Get performance report
- [ ] Get collections report
- [ ] Get arrears report
- [ ] Get write-off report
- [ ] Get product performance
- [ ] Get revenue report
- [ ] Get aging analysis
- [ ] Export report to CSV

---

## Sample Test Data

### Test Tenant
```json
{
  "tenant_id": "tenant_test_001"
}
```

### Test Loan Product
```json
{
  "loan_product_id": "prod_moneyloan_001",
  "product_name": "Personal Loan",
  "min_amount": 10000,
  "max_amount": 500000,
  "min_term_months": 6,
  "max_term_months": 60
}
```

### Test Customer
```json
{
  "customer_id": "cust_test_001",
  "full_name": "John Doe",
  "email": "john.doe@test.com",
  "phone": "+1234567890",
  "credit_score": 720
}
```

---

## Error Handling

All endpoints return consistent error responses:

### Validation Error (400)
```json
{
  "success": false,
  "message": "Validation failed",
  "error": "Interest rate must be between 0 and 100"
}
```

### Not Found (404)
```json
{
  "success": false,
  "message": "Loan not found",
  "error": "No loan found with ID: loan_123"
}
```

### Server Error (500)
```json
{
  "success": false,
  "message": "Failed to process payment",
  "error": "Database connection error"
}
```

---

## Next Steps

1. **Add Authentication Middleware**
   - Integrate JWT authentication
   - Add tenant authorization checks

2. **Add Rate Limiting**
   - Implement per-tenant rate limits
   - Add API usage tracking

3. **Add Input Sanitization**
   - Sanitize all user inputs
   - Prevent SQL injection

4. **Add API Documentation**
   - Generate Swagger/OpenAPI docs
   - Add interactive API explorer

5. **Add Integration Tests**
   - Write automated test suites
   - Set up CI/CD testing pipeline
