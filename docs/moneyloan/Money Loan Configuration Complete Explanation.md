# 💡 **Money Loan Configuration - Complete Explanation**

Let me break down the Money Loan system architecture and configuration in simple terms.

---

## **🎯 What is Money Loan?**

Money Loan is a **platform/module** within your SaaS system that allows tenants to offer lending services to their customers. Think of it like this:

```
ExITS SaaS Platform
├── System Admin Space (manages everything)
├── Tenant Space (ACME Corp, TechStart, etc.)
│   ├── User Management
│   ├── Billing & Subscriptions
│   └── **Platforms** (modules they can enable)
│       ├── Money Loan 💰 (lending/loans)
│       ├── BNPL 🛒 (buy now pay later)
│       └── Pawnshop 💎 (collateral loans)
│
└── Customer Space (end users who get loans)
```

---

## **📊 How Money Loan Works - The Flow**

### **Step 1: Tenant Subscribes to Money Loan Platform**

When ACME Corporation signs up for your SaaS:

```javascript
// In database: tenants table
{
  id: 2,
  name: 'ACME Corporation',
  subdomain: 'acme',
  status: 'active'
}

// They subscribe to Money Loan platform
// In: product_subscriptions table
{
  tenantId: 2,
  productType: 'money-loan',
  status: 'active',
  subscriptionPlanId: 5  // The plan they chose
}
```

### **Step 2: Tenant Configures Money Loan Settings**

ACME needs to configure HOW they want to offer loans:

```javascript
// In: money_loan_config table
{
  tenantId: 2,
  
  // Loan Terms
  minLoanAmount: 5000,      // Minimum ₱5,000
  maxLoanAmount: 500000,    // Maximum ₱500,000
  
  // Interest Rates
  interestRateType: 'flat', // or 'reducing', 'compound'
  defaultInterestRate: 5.5, // 5.5% per month
  
  // Loan Duration
  minLoanTermMonths: 3,     // Minimum 3 months
  maxLoanTermMonths: 24,    // Maximum 24 months
  
  // Payment Schedule
  allowedPaymentFrequencies: ['monthly', 'bi-weekly'],
  gracePeriodDays: 7,       // 7 days grace period
  
  // Penalties
  latePenaltyRate: 2.5,     // 2.5% late fee
  penaltyType: 'percentage', // or 'fixed'
  
  // Requirements
  requireCollateral: true,
  collateralTypes: ['land-title', 'vehicle', 'property'],
  requireCoMaker: true,
  minCoMakers: 1,
  maxCoMakers: 2,
  
  // Approval Process
  autoApprovalLimit: 50000, // Auto-approve loans under ₱50k
  requireManagerApproval: true,
  approvalLevels: [
    { maxAmount: 100000, role: 'loan-officer' },
    { maxAmount: 500000, role: 'branch-manager' }
  ],
  
  // Documents Required
  requiredDocuments: ['valid-id', 'proof-of-income', 'proof-of-billing'],
  
  // Other Settings
  allowEarlyPayment: true,
  earlyPaymentPenalty: 0,   // No penalty for early payment
  creditCheckRequired: true,
  minCreditScore: 650
}
```

---

## **🔍 Real-World Example**

Let's say **Maria Santos** wants to borrow money from ACME Corporation:

### **Maria's Loan Application:**

```javascript
// In: money_loan_applications table
{
  id: 1,
  tenantId: 2,              // ACME Corporation
  customerId: 1,            // Maria Santos
  
  // Loan Details (based on ACME's config)
  requestedAmount: 100000,  // ₱100,000
  loanPurpose: 'business-capital',
  loanTerm: 12,            // 12 months
  
  // Interest Calculation (from config)
  interestRate: 5.5,       // 5.5% flat rate
  monthlyPayment: 9625,    // Auto-calculated
  totalInterest: 15500,    // ₱15,500 total interest
  totalRepayment: 115500,  // ₱115,500 total
  
  // Collateral (required by config)
  collateralType: 'land-title',
  collateralValue: 300000,
  collateralDescription: 'Land Title #12345',
  
  // Co-Makers (required by config)
  coMakers: [
    { name: 'Juan Dela Cruz', relationship: 'brother', contactNumber: '09171234567' }
  ],
  
  // Documents Submitted
  uploadedDocuments: ['valid-id.pdf', 'income-cert.pdf', 'billing-proof.pdf'],
  
  // Status
  status: 'pending',       // pending → approved → active → completed
  applicationDate: '2025-10-29'
}
```

### **Approval Process:**

```javascript
// Based on ACME's approval configuration:
// ₱100,000 loan requires branch-manager approval

// In: loan_approvals table
{
  applicationId: 1,
  approverId: 7,           // employee1@acme.com (branch manager)
  approvalLevel: 'branch-manager',
  decision: 'approved',
  remarks: 'Good credit history, collateral verified',
  approvedDate: '2025-10-30'
}

// After approval, loan becomes active
// In: money_loans table
{
  id: 1,
  applicationId: 1,
  tenantId: 2,
  customerId: 1,
  loanNumber: 'ACME-ML-2025-001',
  
  principalAmount: 100000,
  interestAmount: 15500,
  totalAmount: 115500,
  
  monthlyPayment: 9625,
  paymentFrequency: 'monthly',
  startDate: '2025-11-01',
  maturityDate: '2026-11-01',
  
  status: 'active'
}
```

### **Payment Schedule:**

```javascript
// Auto-generated based on config
// In: loan_payment_schedules table

[
  { dueDate: '2025-12-01', amount: 9625, status: 'pending' },  // Month 1
  { dueDate: '2026-01-01', amount: 9625, status: 'pending' },  // Month 2
  { dueDate: '2026-02-01', amount: 9625, status: 'pending' },  // Month 3
  // ... 12 months total
  { dueDate: '2026-11-01', amount: 9625, status: 'pending' }   // Month 12
]
```

### **Maria Makes a Payment:**

```javascript
// In: loan_payments table
{
  loanId: 1,
  paymentDate: '2025-12-01',
  amountPaid: 9625,
  paymentMethod: 'bank-transfer',
  receiptNumber: 'OR-001',
  
  // If late payment (after 2025-12-08 = grace period)
  lateDays: 0,
  penaltyAmount: 0,
  
  principalPaid: 8333,     // Portion that reduces loan
  interestPaid: 1292,      // Portion for interest
  
  remainingBalance: 106167 // ₱115,500 - ₱9,625 + interest
}
```

---

## **🏗️ Database Schema Structure**

Here's how the tables connect:

```
tenants (ACME Corp)
  ↓
  ├── product_subscriptions (subscribed to Money Loan)
  │     ↓
  ├── money_loan_config (how ACME wants to run their lending)
  │     ↓
  ├── customers (Maria Santos)
  │     ↓
  ├── money_loan_applications (Maria's application)
  │     ↓
  ├── loan_approvals (manager approved)
  │     ↓
  ├── money_loans (active loan)
  │     ↓
  │     ├── loan_payment_schedules (12 monthly payments)
  │     └── loan_payments (actual payments made)
  │
  └── employees (loan officers who manage this)
        └── employee_product_access (who can approve loans)
```

---

## **⚙️ Configuration Types Explained**

### **1. Interest Rate Types:**

**Flat Rate:**
```
Loan: ₱100,000 @ 5% for 12 months
Interest = ₱100,000 × 5% × 12 = ₱60,000
Monthly = (₱100,000 + ₱60,000) / 12 = ₱13,333
```

**Reducing Balance:**
```
Month 1: Interest on ₱100,000 = ₱5,000
Month 2: Interest on ₱91,667 = ₱4,583 (lower!)
... interest decreases each month
```

**Compound:**
```
Interest is added to principal each month
Month 1: ₱100,000 × 1.05 = ₱105,000
Month 2: ₱105,000 × 1.05 = ₱110,250
... exponential growth
```

### **2. Payment Frequencies:**

- **Monthly:** Pay once per month
- **Bi-weekly:** Pay every 2 weeks (26 payments/year)
- **Weekly:** Pay every week
- **Daily:** Pay every day (for micro-loans)

### **3. Approval Levels:**

```javascript
approvalLevels: [
  { maxAmount: 50000, role: 'loan-officer' },      // Officer can approve up to ₱50k
  { maxAmount: 200000, role: 'branch-manager' },   // Manager up to ₱200k
  { maxAmount: 500000, role: 'regional-manager' }, // Regional up to ₱500k
  { maxAmount: 999999999, role: 'ceo' }            // CEO approves anything above
]
```

### **4. Collateral Types:**

```javascript
collateralTypes: [
  'land-title',        // Property/land
  'vehicle',           // Car, motorcycle
  'jewelry',           // Gold, diamonds
  'property-deed',     // House documents
  'equipment',         // Business equipment
  'stocks-bonds'       // Securities
]
```

---

## **👥 User Roles in Money Loan**

### **1. Tenant Admin** (admin@acme.com)
- Configure Money Loan settings
- Set interest rates, loan limits
- Define approval workflows
- View all loans and reports

### **2. Loan Officer** (employee1@acme.com)
- Process loan applications
- Approve small loans (under limit)
- Collect payments
- Follow up on late payments

### **3. Branch Manager** (employee2@acme.com)
- Approve larger loans
- Manage loan officers
- View branch performance
- Handle escalations

### **4. Customer** (maria.santos@test.com)
- Apply for loans
- View loan status
- Make payments
- Download payment receipts
- Check payment history

---

## **📱 Frontend Pages**

### **Tenant Space** (`/tenant/platforms/config/money-loan`)

```
Money Loan Configuration Page
├── Loan Parameters
│   ├── Min/Max Loan Amount
│   ├── Interest Rate Settings
│   └── Loan Term Options
│
├── Requirements
│   ├── Collateral Settings
│   ├── Co-Maker Requirements
│   └── Required Documents
│
├── Approval Workflow
│   ├── Auto-Approval Limit
│   ├── Approval Levels
│   └── Notification Settings
│
└── Payment Settings
    ├── Payment Frequencies
    ├── Grace Period
    └── Penalty Configuration
```

### **Platform Space** (`/platform/money-loan/...`)

```
Money Loan Dashboard (for employees)
├── Dashboard
│   ├── Pending Applications
│   ├── Active Loans
│   ├── Collections Due
│   └── Performance Metrics
│
├── Applications
│   ├── New Applications
│   ├── Under Review
│   └── Approved/Rejected
│
├── Active Loans
│   ├── Loan List
│   ├── Payment Tracking
│   └── Overdue Loans
│
├── Customers
│   ├── Customer List
│   ├── Credit History
│   └── Loan History
│
└── Reports
    ├── Collection Reports
    ├── Aging Reports
    └── Performance Reports
```

### **Customer Space** (`/customer/loans/...`)

```
Customer Loan Portal
├── My Loans
│   ├── Active Loans
│   ├── Payment Schedule
│   └── Loan History
│
├── Apply for Loan
│   ├── Application Form
│   ├── Upload Documents
│   └── Submit Application
│
└── Payments
    ├── Make Payment
    ├── Payment History
    └── Download Receipts
```

---

## **🔐 Security & Permissions**

### **Permission System:**

```javascript
// In: role_permissions table

// Loan Officer can:
{
  roleId: 3, // Employee role
  menuKey: 'money-loan-applications',
  actionKey: 'view',     // ✅ Can view applications
  actionKey: 'create',   // ✅ Can create applications
  actionKey: 'approve',  // ✅ Can approve (up to limit)
}

// Customer can:
{
  roleId: 4, // Customer role
  menuKey: 'my-loans',
  actionKey: 'view',     // ✅ Can view own loans
  actionKey: 'create',   // ✅ Can apply for loans
  actionKey: 'approve',  // ❌ Cannot approve
}
```

### **Row-Level Security:**

```javascript
// Employees can only see their tenant's data
const loans = await knex('money_loans')
  .where({ tenantId: req.user.tenantId }) // ✅ Filtered by tenant
  
// Customers can only see their own loans
const myLoans = await knex('money_loans')
  .where({ 
    tenantId: req.user.tenantId,
    customerId: req.user.id  // ✅ Only their loans
  })
```

---

## **💡 Key Concepts Summary**

1. **Multi-Tenancy:** Each tenant (ACME, TechStart) has isolated data and configuration
2. **Configurable:** Each tenant sets their own rules (interest rates, limits, etc.)
3. **Workflow-Driven:** Applications go through approval process before becoming loans
4. **Role-Based Access:** Different users see/do different things
5. **Automated Calculations:** System calculates interest, payments, penalties automatically
6. **Audit Trail:** Every action is logged (who approved, when paid, etc.)

---

**Does this help clarify the Money Loan configuration?** 

Would you like me to explain:
1. How to add a new loan product type?
2. How the interest calculation works in detail?
3. How to customize the approval workflow?
4. Something else about the Money Loan system?