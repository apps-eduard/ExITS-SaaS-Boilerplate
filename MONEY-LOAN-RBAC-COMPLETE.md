# Money Loan RBAC Implementation - Complete Guide

## 📋 Overview

This document outlines the complete **Role-Based Access Control (RBAC)** implementation for the Money Loan Dashboard, covering **61 granular permissions** across **10 major feature categories**.

---

## 🔐 Security Architecture

### **3-Layer Security Model**

```
┌─────────────────────────────────────────────────────────────┐
│  Layer 1: AUTHENTICATION                                    │
│  ✓ User must be logged in (JWT token)                       │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Layer 2: PRODUCT ACCESS (employee_product_access)          │
│  ✓ Tenant has product enabled                               │
│  ✓ Employee has active profile                              │
│  ✓ Employee assigned to product                             │
│  ✓ Access level check (view/create/edit/approve/manage)     │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Layer 3: RBAC PERMISSIONS (role_permissions)      │
│  ✓ User has specific permission (money-loan:loans:approve)  │
│  ✓ Role assigned to user                                    │
│  ✓ Permission assigned to role                              │
└─────────────────────────────────────────────────────────────┘
                            ↓
┌─────────────────────────────────────────────────────────────┐
│  Layer 4: BUSINESS RULES                                    │
│  ✓ Amount limits (max_approval_amount)                      │
│  ✓ Daily transaction limits                                 │
│  ✓ Monthly transaction limits                               │
│  ✓ Transaction count limits                                 │
└─────────────────────────────────────────────────────────────┘
```

---

## 📊 Permission Categories (61 Total)

### **1. Overview Dashboard (6 permissions)**
```javascript
money-loan:overview:view                    // View dashboard
money-loan:overview:total-loans             // View total loans metric
money-loan:overview:collection-rate         // View collection rate
money-loan:overview:overdue-percentage      // View overdue %
money-loan:overview:outstanding-amount      // View outstanding amount
money-loan:overview:default-rate            // View default rate
```

### **2. Customers (5 permissions)**
```javascript
money-loan:customers:read                   // View all customers
money-loan:customers:create                 // Create new customers
money-loan:customers:update                 // Update customer info
money-loan:customers:delete                 // Delete/deactivate customers
money-loan:customers:view-high-risk         // View high-risk customers
```

### **3. Loans (9 permissions)**
```javascript
money-loan:loans:read                       // View all loans
money-loan:loans:create                     // Create loan applications
money-loan:loans:update                     // Update loan details
money-loan:loans:delete                     // Delete/cancel loans
money-loan:loans:approve                    // Approve/reject loans ⚠️
money-loan:loans:disburse                   // Disburse approved loans 💰
money-loan:loans:view-overdue               // View overdue loans
money-loan:loans:close                      // Close paid-off loans
money-loan:loans:use-calculator             // Use loan calculator
```

### **4. Payments (7 permissions)**
```javascript
money-loan:payments:read                    // View payment history
money-loan:payments:create                  // Record new payments
money-loan:payments:view-today              // View today's collections
money-loan:payments:bulk-import             // Import payments via CSV
money-loan:payments:refund                  // Process refunds/waivers
money-loan:payments:view-failed             // View failed transactions
money-loan:payments:configure-gateway       // Configure payment gateway
```

### **5. Interest & Rules (5 permissions)**
```javascript
money-loan:interest:read                    // View interest rates
money-loan:interest:update                  // Update interest rates
money-loan:interest:manage-auto-rules       // Manage auto rate rules
money-loan:interest:manual-override         // Manual rate overrides ⚠️
money-loan:interest:use-calculator          // Use interest calculator
```

### **6. Collections (5 permissions)**
```javascript
money-loan:collections:read                 // View collections
money-loan:collections:manage-workflow      // Manage overdue workflow
money-loan:collections:manage-strategies    // Manage collection strategies
money-loan:collections:legal-actions        // Manage legal actions ⚖️
money-loan:collections:view-recovery        // View recovery dashboard
```

### **7. KYC Verification (6 permissions)**
```javascript
money-loan:kyc:read                         // View KYC status
money-loan:kyc:review                       // Review pending KYC
money-loan:kyc:approve                      // Approve/reject KYC ✅
money-loan:kyc:view-audit-logs              // View KYC audit logs
money-loan:kyc:view-webhook-logs            // View webhook logs (Onfido)
money-loan:kyc:configure                    // Configure KYC settings
```

### **8. Reports (5 permissions)**
```javascript
money-loan:reports:read                     // View reports
money-loan:reports:generate-periodic        // Generate daily/weekly/monthly
money-loan:reports:tax-summary              // Generate tax summaries
money-loan:reports:export                   // Export to CSV/PDF
money-loan:reports:custom-queries           // Run custom queries
```

### **9. Settings (7 permissions)**
```javascript
money-loan:settings:read                    // View settings
money-loan:settings:manage-roles            // Manage roles/permissions
money-loan:settings:manage-loan-products    // Manage loan products
money-loan:settings:manage-templates        // Manage SMS/Email templates
money-loan:settings:manage-branding         // Manage branding
money-loan:settings:manage-api-keys         // Manage API keys
money-loan:settings:view-audit-log          // View audit log
```

### **10. Audit Log (3 permissions)**
```javascript
money-loan:audit:read                       // View system activity
money-loan:audit:view-data-changes          // Track data changes
money-loan:audit:export                     // Export audit logs
```

### **Additional Features (3 permissions)**
```javascript
money-loan:notifications:read               // View notifications
money-loan:user-management:manage           // Manage staff accounts
money-loan:integrations:configure           // Configure integrations
```

---

## 🎯 Product Access Levels

Defined in `employee_product_access.access_level`:

| Level | Description | Typical Use |
|-------|-------------|-------------|
| `view` | Read-only access | Auditors, Reporters |
| `create` | Can create records | Data Entry Staff |
| `edit` | Can modify records | Senior Staff |
| `approve` | Can approve actions | Loan Officers |
| `manage` | Full operational control | Branch Managers |
| `admin` | Complete system control | Product Managers |

---

## 💰 Business Rules & Limits

Defined in `employee_product_access` table:

```javascript
{
  can_approve_loans: true,              // Can approve loan applications
  max_approval_amount: 100000,          // Max ₱100k per loan
  can_disburse_funds: true,             // Can release funds
  can_view_reports: true,               // Access to reports
  can_modify_interest: false,           // Cannot change rates
  can_waive_penalties: false,           // Cannot waive fees
  daily_transaction_limit: 500000,      // Max ₱500k per day
  monthly_transaction_limit: 5000000,   // Max ₱5M per month
  max_daily_transactions: 50            // Max 50 transactions/day
}
```

---

## 🔧 Implementation Examples

### **Backend Route Protection**

```javascript
// Full protection example
router.post('/loans/:id/approve',
  authenticate,                                    // Layer 1: Authentication
  checkProductAccess('money_loan', 'approve', {    // Layer 2: Product Access
    checkAmount: true                              // Check amount limits
  }),
  checkPermission('money-loan:loans:approve'),     // Layer 3: RBAC
  async (req, res) => {
    // Your business logic here
    // req.productAccess contains limits
    // req.employee contains employee info
  }
);
```

### **Frontend Route Guards**

```typescript
// Angular route guard example
{
  path: 'loans/approve',
  component: LoanApprovalComponent,
  canActivate: [
    AuthGuard,                    // Check authentication
    ProductAccessGuard,           // Check product access
    PermissionGuard               // Check RBAC permission
  ],
  data: {
    product: 'money_loan',
    permission: 'money-loan:loans:approve'
  }
}
```

### **UI Permission Checks**

```typescript
// In component
export class LoanListComponent {
  canApproveLoan = computed(() => {
    const user = this.authService.user();
    const productAccess = user?.productAccess?.money_loan;
    const hasPermission = this.authService.hasPermission('money-loan:loans:approve');
    
    return productAccess?.can_approve_loans && hasPermission;
  });
  
  canDisburse = computed(() => {
    const user = this.authService.user();
    const productAccess = user?.productAccess?.money_loan;
    const hasPermission = this.authService.hasPermission('money-loan:loans:disburse');
    
    return productAccess?.can_disburse_funds && hasPermission;
  });
}
```

```html
<!-- In template -->
<button *ngIf="canApproveLoan()" 
        (click)="approve(loan)">
  ✅ Approve
</button>

<button *ngIf="canDisburse()" 
        [disabled]="loan.amount > productAccess.max_approval_amount"
        (click)="disburse(loan)">
  💰 Disburse
</button>

<span *ngIf="loan.amount > productAccess.max_approval_amount">
  ⚠️ Exceeds your approval limit (₱{{productAccess.max_approval_amount}})
</span>
```

---

## 👥 Example Role Configurations

### **Loan Officer Role**
```javascript
{
  name: "Loan Officer",
  permissions: [
    'money-loan:overview:view',
    'money-loan:customers:read',
    'money-loan:customers:create',
    'money-loan:loans:read',
    'money-loan:loans:create',
    'money-loan:loans:approve',        // ✓ Can approve
    'money-loan:payments:read',
    'money-loan:payments:create',
    'money-loan:kyc:read',
    'money-loan:kyc:review'
  ],
  productAccess: {
    access_level: 'approve',
    can_approve_loans: true,
    max_approval_amount: 50000,        // ₱50k limit
    can_disburse_funds: false
  }
}
```

### **Branch Manager Role**
```javascript
{
  name: "Branch Manager",
  permissions: [
    // All Loan Officer permissions +
    'money-loan:loans:disburse',       // ✓ Can disburse
    'money-loan:loans:delete',
    'money-loan:interest:manual-override',
    'money-loan:collections:manage-workflow',
    'money-loan:kyc:approve',
    'money-loan:reports:read',
    'money-loan:reports:export'
  ],
  productAccess: {
    access_level: 'manage',
    can_approve_loans: true,
    max_approval_amount: 200000,       // ₱200k limit
    can_disburse_funds: true,
    can_modify_interest: true,
    daily_transaction_limit: 1000000   // ₱1M/day
  }
}
```

### **Collections Agent Role**
```javascript
{
  name: "Collections Agent",
  permissions: [
    'money-loan:overview:view',
    'money-loan:customers:read',
    'money-loan:loans:read',
    'money-loan:loans:view-overdue',
    'money-loan:payments:read',
    'money-loan:collections:read',
    'money-loan:collections:manage-workflow',
    'money-loan:collections:manage-strategies'
  ],
  productAccess: {
    access_level: 'edit',
    can_approve_loans: false,
    can_disburse_funds: false
  }
}
```

---

## 📁 Files Created

### **Database**
- ✅ `api/src/migrations/20251025000002_create_employee_profiles.js`
- ✅ `api/src/migrations/20251025000003_create_employee_product_access.js`
- ✅ `api/src/seeds/08_money_loan_permissions.js` (61 permissions)

### **Middleware**
- ✅ `api/src/middleware/checkProductAccess.js`

### **Routes (Sample)**
- ✅ `api/src/routes/moneyLoan.js`

---

## ✅ Status

| Component | Status | Count |
|-----------|--------|-------|
| Permissions Seeded | ✅ Complete | 61 |
| Database Tables | ✅ Migrated | 2 |
| Middleware | ✅ Ready | 1 |
| Sample Routes | ✅ Implemented | 8+ |
| Frontend Guards | ⏳ Pending | - |

---

## 🚀 Next Steps

1. **Create Frontend Route Guards**
   - `ProductAccessGuard` for Angular routes
   - Permission directive for UI elements

2. **Implement Remaining Routes**
   - Complete all 61 permission endpoints
   - Add validation and business logic

3. **Create Role Templates**
   - Seed predefined roles (Loan Officer, Manager, etc.)
   - Auto-assign permissions to roles

4. **Build Employee Management UI**
   - Tenant admin panel to assign products
   - Set approval limits per employee
   - Manage access levels

5. **Add Similar Permissions for BNPL & Pawnshop**
   - Replicate permission structure
   - Product-specific business rules

---

## 📞 Permission Enforcement

**Every Money Loan Dashboard route follows this pattern:**

```javascript
authenticate →                          // JWT validation
checkProductAccess('money_loan') →      // Product access check
checkPermission('money-loan:X:Y') →     // RBAC permission check
businessLogic()                         // Your code
```

This ensures **no unauthorized access** at any level! 🔒
