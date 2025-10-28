# Database Design Review & Impact Analysis

## 📊 Proposed Structure Analysis

### ✅ Naming Convention Recommendations

#### **Pattern: `{scope}_{platform}_{entity}`**

```
tenant_id column      → References which company/organization
platform identifier   → moneyloan | bnpl | pawnshop
entity name          → singular, snake_case
```

### 🎯 Recommended Table Names

#### **1. Core Shared Tables (Tenant-Scoped)**
All have `tenant_id` - shared across platforms within a tenant

```sql
-- Customer Management
customers                    -- Main customer profile (shared)
customer_addresses          -- Better than just 'addresses' (clearer scope)
customer_documents          -- KYC, IDs, proofs
customer_contacts           -- Guarantors, emergency contacts
customer_notes             -- CRM notes, follow-ups

-- System Core
tenants                     -- Company/branch using SaaS
users                       -- System users (admins, employees)
roles                       -- System/Tenant roles
permissions                 -- Granular permissions
```

#### **2. Money Loan Platform Tables**
Tenant-scoped, specific to Money Loan

```sql
moneyloan_loans            -- Main loan records
moneyloan_schedules        -- Payment schedules
moneyloan_payments         -- Payment transactions
moneyloan_penalties        -- Late fees, charges
moneyloan_products         -- Loan products/packages
moneyloan_applications     -- Loan applications
moneyloan_collaterals      -- Optional collateral tracking
```

#### **3. BNPL Platform Tables**
Tenant-scoped, specific to BNPL

```sql
bnpl_loans                 -- BNPL purchase agreements
bnpl_merchants             -- Merchant partners (could be tenant-shared)
bnpl_installments          -- Installment schedules
bnpl_payments              -- Payment records
bnpl_products              -- BNPL product catalog
```

#### **4. Pawnshop Platform Tables**
Tenant-scoped, specific to Pawnshop

```sql
pawnshop_loans             -- Pawn tickets
pawnshop_collaterals       -- Pledged items (gold, gadgets)
pawnshop_renewals          -- Extensions
pawnshop_redemptions       -- Item retrievals
pawnshop_auctions          -- Unclaimed item sales
pawnshop_appraisals        -- Item valuation records
```

#### **5. Cross-Platform Support Tables**

```sql
-- Universal Payment Tracking
payments                   -- Master payment log (all platforms)
payment_methods            -- Cash, GCash, bank transfer, etc.

-- Communications
notifications              -- SMS/email/push notifications
notification_templates     -- Message templates

-- File Management
attachments               -- Files (polymorphic: attachable_type, attachable_id)

-- Audit & Logging
audit_logs                -- System-wide action tracking
transaction_logs          -- Financial movement logs
activity_logs             -- User activity tracking
```

---

## 🔍 Impact Analysis

### **SYSTEM SPACE Impact**

#### ✅ **Tables Visible/Managed in System Space:**

```javascript
// System Admin can see/manage:
- tenants                  // All companies
- users (tenant_id IS NULL) // System admins only
- roles (space = 'system')  // System-level roles
- permissions (space = 'system') // System permissions
- modules                  // Platform modules config
- audit_logs               // All tenant activities
- subscription_plans       // Tenant pricing plans
- payment_transactions     // Tenant subscription payments

// READ-ONLY visibility to tenant data for support:
- customers (all tenants)  // Customer support
- {platform}_loans         // Platform monitoring
- payments                 // Payment monitoring
```

#### 📋 **System Space Features:**

1. **Tenant Management**
   - Create/edit tenants
   - Enable/disable platforms per tenant
   - Set platform limits (max customers, loans, etc.)
   - Monitor tenant usage

2. **Global Configuration**
   - Define available platforms
   - Set system-wide permissions
   - Configure notification templates
   - Manage system modules

3. **Monitoring & Support**
   - View all audit logs
   - Monitor platform health
   - Customer support access (read-only)
   - Financial oversight

---

### **TENANT SPACE Impact**

#### ✅ **Tables Visible/Managed in Tenant Space:**

```javascript
// Tenant Admin/Users can see/manage (WHERE tenant_id = THEIR_TENANT):
- customers                // Their customers only
- customer_addresses       // Their customer addresses
- customer_documents       // Their customer documents
- customer_contacts        // Their customer contacts
- customer_notes           // Their CRM notes

- users (tenant_id = X)    // Their staff only
- roles (tenant_id = X)    // Their custom roles
- permissions (space = 'tenant') // Tenant permissions

// Money Loan (if enabled)
- moneyloan_loans
- moneyloan_schedules
- moneyloan_payments
- moneyloan_penalties
- moneyloan_products       // Their loan products

// BNPL (if enabled)
- bnpl_loans
- bnpl_installments
- bnpl_payments
- bnpl_merchants           // Shared or tenant-specific

// Pawnshop (if enabled)
- pawnshop_loans
- pawnshop_collaterals
- pawnshop_renewals
- pawnshop_redemptions

// Cross-platform
- payments                 // Their payments only
- notifications            // Their notifications
- attachments              // Their files
- audit_logs (tenant_id = X) // Their audit trail
```

#### 📋 **Tenant Space Features:**

1. **Customer Management**
   - Full CRUD on customers
   - Manage addresses, documents, contacts
   - Customer notes and history
   - Cross-platform customer view

2. **Platform Operations**
   - Access enabled platforms only
   - Platform-specific workflows
   - Product/package configuration
   - Transaction processing

3. **User & Access Control**
   - Manage tenant staff
   - Assign roles/permissions
   - Platform access control per user

4. **Reporting & Analytics**
   - Tenant-scoped reports
   - Platform performance
   - Customer analytics
   - Financial reports

---

## 🚨 Critical Considerations

### **1. Row-Level Security (RLS)**

Every query MUST filter by `tenant_id`:

```javascript
// ❌ WRONG - Security risk!
await knex('customers').select('*');

// ✅ CORRECT - Tenant isolated
await knex('customers')
  .where('tenant_id', currentTenantId)
  .select('*');
```

**Recommendation:** Create middleware to auto-inject `tenant_id` filter:

```javascript
// api/src/middleware/tenantScope.js
const tenantScopeMiddleware = (knex, tenantId) => {
  return knex.queryBuilder().where('tenant_id', tenantId);
};
```

### **2. Shared vs Isolated Tables**

| Table Type | tenant_id | Access Pattern |
|------------|-----------|----------------|
| **System Only** | NULL | System space only |
| **Tenant Scoped** | NOT NULL | Filtered by tenant_id |
| **Shared Reference** | NULL or NOT NULL | Depends on use case |

**Examples:**
```sql
-- System Only (no tenant_id)
modules, permissions (space='system'), subscription_plans

-- Tenant Scoped (required tenant_id)
customers, moneyloan_loans, users (where tenant_id IS NOT NULL)

-- Shared Reference (optional tenant_id)
bnpl_merchants (could be global or tenant-specific)
notification_templates (system or tenant custom)
```

### **3. Customer Unification Strategy**

**Current Issue:** You want ONE customer table shared across platforms.

✅ **Recommended Approach:**

```sql
-- Single source of truth
CREATE TABLE customers (
  id SERIAL PRIMARY KEY,
  tenant_id INT NOT NULL,
  customer_code VARCHAR(50) UNIQUE, -- CUST-ACME-0001
  first_name VARCHAR(100),
  last_name VARCHAR(100),
  email VARCHAR(255),
  phone VARCHAR(50),
  kyc_status VARCHAR(20),
  -- ... other shared fields
  created_at TIMESTAMP
);

-- Platform-specific extensions (optional)
CREATE TABLE moneyloan_customer_profiles (
  id SERIAL PRIMARY KEY,
  customer_id INT REFERENCES customers(id),
  credit_score INT,
  max_loan_amount DECIMAL,
  risk_level VARCHAR(20)
);

CREATE TABLE pawnshop_customer_profiles (
  id SERIAL PRIMARY KEY,
  customer_id INT REFERENCES customers(id),
  preferred_items VARCHAR(100),
  appraisal_history JSONB
);
```

**Benefits:**
- Single customer record across all platforms
- Platform-specific data in extension tables
- Easy cross-platform reporting
- Clean customer history

### **4. Migration from Current State**

You currently have `loan_customers` table. Migration path:

```javascript
// Migration: Unify to 'customers' table
exports.up = async function(knex) {
  // 1. Create new customers table
  await knex.schema.createTable('customers', (table) => {
    // ... customer fields
  });
  
  // 2. Migrate data from loan_customers
  await knex.raw(`
    INSERT INTO customers (tenant_id, customer_code, first_name, ...)
    SELECT tenant_id, customer_code, first_name, ...
    FROM loan_customers
  `);
  
  // 3. Create platform profile
  await knex.schema.createTable('moneyloan_customer_profiles', ...);
  
  // 4. Migrate platform-specific data
  await knex.raw(`
    INSERT INTO moneyloan_customer_profiles (customer_id, credit_score, ...)
    SELECT c.id, lc.credit_score, ...
    FROM loan_customers lc
    JOIN customers c ON c.customer_code = lc.customer_code
  `);
  
  // 5. Update foreign keys in moneyloan_loans
  await knex.raw(`
    UPDATE moneyloan_loans ml
    SET customer_id = c.id
    FROM loan_customers lc
    JOIN customers c ON c.customer_code = lc.customer_code
    WHERE ml.customer_id = lc.id
  `);
  
  // 6. Drop old table
  await knex.schema.dropTable('loan_customers');
};
```

---

## 📋 Recommended Implementation Order

### **Phase 1: Core Foundation** ✅ (Mostly Done)
- ✅ tenants
- ✅ users
- ✅ roles
- ✅ permissions
- ✅ modules
- ✅ audit_logs

### **Phase 2: Customer Unification** 🔄 (Current Focus)
1. Create unified `customers` table
2. Create `customer_addresses` table
3. Create `customer_documents` table
4. Create `customer_contacts` table
5. Migrate existing `loan_customers` data

### **Phase 3: Money Loan Platform** 🎯 (Active)
1. Rename/refactor to `moneyloan_*` prefix
2. Create `moneyloan_customer_profiles` (optional)
3. Update all routes/controllers to use unified customers
4. Update frontend to use unified customer API

### **Phase 4: Cross-Platform Support**
1. `payments` master table
2. `notifications` system
3. `attachments` management
4. `transaction_logs`

### **Phase 5: BNPL Platform** (Future)
1. `bnpl_loans`
2. `bnpl_merchants`
3. `bnpl_installments`
4. `bnpl_payments`

### **Phase 6: Pawnshop Platform** (Future)
1. `pawnshop_loans`
2. `pawnshop_collaterals`
3. `pawnshop_renewals`
4. `pawnshop_redemptions`

---

## 🔐 Security & Access Control Matrix

### **System Space Permissions**

```javascript
const SYSTEM_PERMISSIONS = {
  'tenants:view': 'View all tenants',
  'tenants:create': 'Create new tenants',
  'tenants:edit': 'Edit tenant details',
  'tenants:delete': 'Delete tenants',
  'tenants:enable-platforms': 'Enable/disable platforms for tenants',
  
  'system-users:manage': 'Manage system administrators',
  'system-roles:manage': 'Manage system roles',
  'system-permissions:manage': 'Manage system permissions',
  
  'audit:view-all': 'View all tenant audit logs',
  'support:customer-access': 'Read-only customer support access',
  'monitoring:platform-health': 'Monitor platform performance',
};
```

### **Tenant Space Permissions**

```javascript
const TENANT_PERMISSIONS = {
  // Customer Management
  'customers:view': 'View customers',
  'customers:create': 'Create customers',
  'customers:edit': 'Edit customers',
  'customers:delete': 'Delete customers',
  'customers:export': 'Export customer data',
  
  // User Management
  'users:view': 'View tenant users',
  'users:create': 'Create tenant users',
  'users:edit': 'Edit tenant users',
  'users:delete': 'Delete tenant users',
  
  // Role Management
  'roles:view': 'View roles',
  'roles:create': 'Create custom roles',
  'roles:edit': 'Edit roles',
  'roles:assign': 'Assign roles to users',
  
  // Platform Access
  'moneyloan:access': 'Access Money Loan platform',
  'bnpl:access': 'Access BNPL platform',
  'pawnshop:access': 'Access Pawnshop platform',
};
```

---

## 🎯 Immediate Action Items

### **For Seed File:**

1. **Keep using `loan_customers` for now** - Don't break existing code
2. **Plan customer unification** - After Money Loan is stable
3. **Focus on permissions** - Ensure proper tenant isolation

### **For System:**

1. **Add tenant isolation middleware** - Auto-filter by tenant_id
2. **Update role/permission structure** - Use new naming convention
3. **Document API access patterns** - System vs Tenant endpoints

### **For Frontend:**

1. **Update routes** - Match new table/permission naming
2. **Add platform toggles** - Show/hide based on tenant.{platform}_enabled
3. **Implement RLS checks** - Verify tenant_id on every request

---

## ✅ Conclusion

**Your design is solid!** Here's the summary:

✅ **Keep:**
- Shared customer table concept
- Platform-specific loan tables
- Tenant isolation pattern
- Cross-platform support tables

⚠️ **Adjust:**
- Use consistent `{platform}_` prefix
- Migrate `loan_customers` → `customers` (later)
- Implement middleware for tenant_id filtering
- Add platform enable/disable flags on tenants table

🎯 **Priority:**
1. Finish Money Loan with current structure
2. Add tenant isolation middleware
3. Plan customer unification migration
4. Document access patterns

This structure will scale well for multiple platforms while maintaining security and clarity!
