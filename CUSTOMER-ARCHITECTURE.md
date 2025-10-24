# Customer Management Architecture

## Overview
This document explains the unified customer management system that supports multiple products (Money Loan, BNPL, Pawnshop) within the ExITS SaaS platform.

## Database Architecture

### Shared Tables

#### 1. **`customers`** - Unified Customer Table
**Purpose**: Single source of truth for all customer data across all products

**Key Features**:
- ✅ **Multi-tenant**: Each tenant has their own customers
- ✅ **Multi-product support**: Customers can use Money Loan, BNPL, and Pawnshop
- ✅ **Optional user account**: Can link to `users` table for customer portal access
- ✅ **Comprehensive KYC**: Full KYC verification workflow
- ✅ **Product-specific approval flags**:
  - `money_loan_approved` - Approved for Money Loan
  - `bnpl_approved` - Approved for BNPL
  - `pawnshop_approved` - Approved for Pawnshop

**Customer Types**:
- `individual` - Personal customers
- `business` - Business/corporate customers

**Key Fields**:
```javascript
{
  // Identification
  customer_code: "CUST-2025-0001",
  customer_type: "individual",
  
  // Personal Info
  first_name: "Juan",
  last_name: "Dela Cruz",
  date_of_birth: "1990-01-15",
  
  // Contact
  email: "juan@example.com",
  phone: "+639171234567",
  
  // Address
  address: "123 Main Street",
  barangay: "San Antonio",
  city: "Makati",
  province: "Metro Manila",
  
  // Employment
  employment_status: "employed",
  employer_name: "ABC Corporation",
  monthly_income: 35000.00,
  
  // Financial Profile
  credit_score: 720,
  risk_level: "low",
  
  // KYC Status
  kyc_status: "verified",
  kyc_verified_at: "2025-10-20",
  
  // Product Access
  money_loan_approved: true,
  bnpl_approved: true,
  pawnshop_approved: false,
  
  // Status
  status: "active"
}
```

### Product-Specific Tables

#### 2. **`loans`** (Money Loan Product)
References: `customers.id` via `customer_id`

#### 3. **`bnpl_transactions`** (BNPL Product - Future)
References: `customers.id` via `customer_id`

#### 4. **`pawn_tickets`** (Pawnshop Product - Future)
References: `customers.id` via `customer_id`

## Data Flow

### Scenario 1: New Customer Applies for Money Loan

```
1. Customer fills application form
   ↓
2. System creates record in `customers` table
   - customer_code: auto-generated (CUST-2025-0001)
   - kyc_status: "pending"
   - money_loan_approved: false
   ↓
3. KYC verification process
   - Upload documents
   - Verify identity
   - Check credit score
   ↓
4. Admin approves KYC
   - kyc_status: "verified"
   - money_loan_approved: true
   ↓
5. System creates loan application in `loan_applications`
   - Links via customer_id
   ↓
6. Loan disbursement
   - Creates record in `loans` table
```

### Scenario 2: Existing Money Loan Customer Wants BNPL

```
1. Customer already exists in `customers` table
   - Has money_loan_approved: true
   ↓
2. Customer applies for BNPL
   ↓
3. Admin reviews BNPL eligibility
   - Checks existing credit score
   - Checks payment history from loans
   ↓
4. Admin approves BNPL access
   - Updates: bnpl_approved: true
   ↓
5. Customer can now use BNPL
   - Creates BNPL transactions linked via customer_id
```

## Benefits of Unified Customer Table

### 1. **Single Customer Profile**
- No duplicate customer data
- One source of truth for customer information
- Easy to maintain and update

### 2. **Cross-Product Insights**
```sql
-- Get customer's full financial picture
SELECT 
  c.customer_code,
  c.first_name,
  c.last_name,
  c.credit_score,
  COUNT(DISTINCT l.id) as total_loans,
  COUNT(DISTINCT b.id) as total_bnpl,
  COUNT(DISTINCT p.id) as total_pawn
FROM customers c
LEFT JOIN loans l ON c.id = l.customer_id
LEFT JOIN bnpl_transactions b ON c.id = b.customer_id
LEFT JOIN pawn_tickets p ON c.id = p.customer_id
WHERE c.tenant_id = 1
GROUP BY c.id;
```

### 3. **Unified KYC Process**
- Customer completes KYC once
- Approved for multiple products
- Reduces onboarding friction

### 4. **Better Risk Management**
- Track total exposure across all products
- Unified credit scoring
- Cross-product default detection

### 5. **Customer Portal Integration**
- Link `customers.user_id` to `users` table
- Single login for all product access
- Unified dashboard showing all products

## Migration Timeline

### Phase 1: Money Loan ✅
- Customers table created
- Money Loan tables reference customers
- Customer management complete

### Phase 2: BNPL (Future)
- BNPL tables created
- Reference customers table
- BNPL approval workflow

### Phase 3: Pawnshop (Future)
- Pawnshop tables created
- Reference customers table
- Pawnshop approval workflow

## API Structure

### Customer Endpoints
```
POST   /api/customers              - Create new customer
GET    /api/customers              - List all customers
GET    /api/customers/:id          - Get customer details
PUT    /api/customers/:id          - Update customer
GET    /api/customers/:id/loans    - Get customer's loans
GET    /api/customers/:id/bnpl     - Get customer's BNPL transactions
GET    /api/customers/:id/pawn     - Get customer's pawn tickets
```

### Money Loan Endpoints
```
POST   /api/money-loan/customers/:id/applications  - Apply for loan
GET    /api/money-loan/customers/:id/loans         - Customer's loans
POST   /api/money-loan/customers/:id/approve       - Approve for money loan
```

### Cross-Product Endpoints
```
GET    /api/customers/:id/summary  - Full customer financial summary
GET    /api/customers/:id/risk     - Risk assessment across all products
POST   /api/customers/:id/kyc      - Submit KYC documents
PUT    /api/customers/:id/kyc/verify - Verify KYC
```

## Customer Portal Features

### Dashboard View
```
┌─────────────────────────────────────────┐
│  Welcome, Juan Dela Cruz               │
│  Customer Code: CUST-2025-0001         │
├─────────────────────────────────────────┤
│  📊 Your Products                       │
│                                         │
│  ✅ Money Loan - Active                 │
│     Active Loans: 2                    │
│     Outstanding: ₱125,000              │
│                                         │
│  ✅ BNPL - Active                       │
│     Active Orders: 3                   │
│     Outstanding: ₱15,000               │
│                                         │
│  ❌ Pawnshop - Not Approved             │
│     [Apply for Access]                 │
└─────────────────────────────────────────┘
```

## Security & Privacy

### Data Access Rules
1. **Tenant Isolation**: Customers can only see their own tenant's data
2. **Role-Based Access**: Admin can see all customers, Staff limited access
3. **Customer Portal**: Customers only see their own data
4. **Audit Trail**: All customer changes are logged

### Sensitive Data
- Encrypt ID numbers
- Mask credit scores in lists
- Secure document storage
- PII compliance (GDPR/DPA)

## Code Examples

### Creating a Customer
```javascript
const customer = await CustomerService.createCustomer({
  tenantId: 1,
  firstName: 'Juan',
  lastName: 'Dela Cruz',
  email: 'juan@example.com',
  phone: '+639171234567',
  dateOfBirth: '1990-01-15',
  address: '123 Main Street',
  city: 'Makati',
  province: 'Metro Manila',
  employmentStatus: 'employed',
  monthlyIncome: 35000,
  moneyLoanApproved: false, // Pending KYC
  bnplApproved: false,
  pawnshopApproved: false
});
```

### Checking Product Eligibility
```javascript
const canApplyForLoan = await CustomerService.canApplyForProduct(
  customerId, 
  'money_loan'
);

// Returns:
{
  eligible: true,
  reasons: [
    'KYC verified',
    'Money Loan approved',
    'Credit score above minimum',
    'No active defaults'
  ]
}
```

## Next Steps

1. ✅ Create unified `customers` table
2. ✅ Update Money Loan migrations to use `customers`
3. ⏳ Update CustomerService to use new table
4. ⏳ Create customer portal with multi-product view
5. ⏳ Implement BNPL with customer reference
6. ⏳ Implement Pawnshop with customer reference

## Database Schema Diagram

```
┌──────────────┐
│   tenants    │
└──────┬───────┘
       │
       ├─────────────────────┬────────────────────┐
       │                     │                    │
┌──────▼───────┐      ┌──────▼─────┐      ┌──────▼────────┐
│    users     │      │  customers  │      │ loan_products │
└──────┬───────┘      └──────┬──────┘      └───────┬───────┘
       │                     │                     │
       │              ┌──────┴──────┬──────────────┘
       │              │             │
       │       ┌──────▼──────┐  ┌──▼───────────────┐
       │       │    loans    │  │ loan_applications│
       │       └──────┬──────┘  └──────────────────┘
       │              │
       │       ┌──────┴──────┬─────────────────┐
       │       │             │                 │
       │  ┌────▼────────┐ ┌──▼──────────┐  ┌──▼──────────┐
       │  │  repayment  │ │    loan     │  │ collection  │
       │  │  schedules  │ │  payments   │  │ activities  │
       │  └─────────────┘ └─────────────┘  └─────────────┘
       │
       └──────────────────────┐
                              │
                       ┌──────▼──────┐
                       │    kyc      │
                       │  documents  │
                       └─────────────┘
```

---

**Key Point**: The `customers` table is the foundation for all product modules. Each product (Money Loan, BNPL, Pawnshop) maintains its own transaction tables but all reference the same customer records.
