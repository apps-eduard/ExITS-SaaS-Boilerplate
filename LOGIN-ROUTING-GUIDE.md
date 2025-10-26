# Login System Routing Guide

## Overview
The system has **3 separate login pages** designed for different user types with intelligent routing based on roles and platform access.

---

## 🔐 Login Pages

### 1. System Login (`/login`)
**Purpose:** Admin dashboard access for System Admins and Tenant Admins

**Allowed Users:**
- ✅ **System Admins** (no tenant_id)
- ✅ **Tenant Admins** (has tenant_id + Tenant Admin role)
- ❌ Employees → Redirected to Platform Login
- ❌ Customers → Redirected to Platform Login

**Routing Logic:**
```typescript
if (isSystemAdmin) {
  → /dashboard (System Dashboard)
}
else if (isTenantAdmin) {
  → /tenant/dashboard (Tenant Management Dashboard)
}
else {
  → Error: "Use Platform Login"
}
```

**Quick Login Buttons:**
- System Admin (admin@exitsaas.com)
- Tenant Admin (admin-2@example.com)

---

### 2. Platform Login (`/platform/login`)
**Purpose:** Platform access for Tenant Admins, Employees, and Customers

**Allowed Users:**
- ✅ **Tenant Admins** (can access platforms OR tenant dashboard)
- ✅ **Employees** (MUST have platform access)
- ✅ **Customers** (for customer portals)
- ❌ System Admins → Redirected to System Login

**Routing Logic:**

#### For Tenant Admins:
```typescript
if (platforms.length === 0) {
  → /tenant/dashboard (No platform access, go to admin dashboard)
}
else if (platforms.length === 1) {
  → /products/{platform}/dashboard (Auto-route to single platform)
}
else {
  → Show Platform Selector Modal (Choose from multiple platforms)
}
```

#### For Employees:
```typescript
if (platforms.length === 0) {
  → Error: "No platform access found"
}
else if (platforms.length === 1) {
  → /products/{platform}/dashboard (Auto-route to single platform)
}
else {
  → Show Platform Selector Modal (Choose from multiple platforms)
}
```

**Quick Login Buttons:**
- Tenant Admin (admin-2@example.com)
- Employee 1 - Money Loan (employee1@tenant1.com)
- Employee 2 - Multi-Platform (employee2@tenant1.com)
- Customer 1 (customer1@test.com)

---

### 3. Customer Login (`/customer/login`)
**Purpose:** Direct customer portal access

**Allowed Users:**
- ✅ **Customers** (customer role)

**Routing Logic:**
```typescript
→ /platforms/{platform}/customer (Customer portal)
```

**Quick Login Buttons:**
- Customer 1 (customer1@test.com)
- Customer 2 (customer2@test.com)

---

## 📊 User Type Comparison

| User Type | System Login | Platform Login | Customer Login | Dashboard Access |
|-----------|--------------|----------------|----------------|------------------|
| **System Admin** | ✅ Primary | ❌ Blocked | ❌ N/A | System Dashboard |
| **Tenant Admin** | ✅ Allowed | ✅ Allowed | ❌ N/A | Tenant Dashboard OR Platforms |
| **Employee** | ❌ Blocked | ✅ Primary | ❌ N/A | Platform Dashboards |
| **Customer** | ❌ Blocked | ⚠️ Limited | ✅ Primary | Customer Portal |

---

## 🎯 Tenant Admin Flexibility

Tenant Admins are **special** because they can use **BOTH** login pages:

### Option 1: System Login → Tenant Dashboard
```
/login → Enter credentials → /tenant/dashboard
```
**Use when:** Need to manage users, roles, settings, subscriptions

### Option 2: Platform Login → Platform Dashboards
```
/platform/login → Enter credentials → Platform selector or auto-route
```
**Use when:** Need to work on Money Loan, BNPL, or Pawnshop platforms

**Navigation:** Once logged in, Tenant Admins can navigate between tenant management and platforms via the sidebar menu.

---

## 🔄 Multi-Platform Handling

### Scenario 1: Employee with 1 Platform
```
employee1@tenant1.com (Money Loan View only)
→ Auto-route to /products/money-loan/dashboard
```

### Scenario 2: Employee with Multiple Platforms
```
employee2@tenant1.com (Money Loan Manage + BNPL View)
→ Show Platform Selector Modal
→ User selects: Money Loan OR BNPL
→ Route to selected platform dashboard
```

### Scenario 3: Tenant Admin with Multiple Platforms
```
admin-2@example.com (Money Loan + BNPL + Pawnshop)
→ Via Platform Login: Show Platform Selector Modal
→ Via System Login: Go to /tenant/dashboard
→ Can switch platforms via sidebar menu
```

---

## 🧪 Test Accounts

### System Admins
```
Email: admin@exitsaas.com
Password: Admin@123
Access: Full system access, all tenants
```

### Tenant Admins
```
Email: admin-2@example.com
Password: Admin@123
Access: Tenant 2 (ACME Corporation) + All platforms
```

### Employees
```
Email: employee1@tenant1.com
Password: Employee@123
Access: Money Loan (View only)

Email: employee2@tenant1.com
Password: Employee@123
Access: Money Loan (Manage, Approve up to $50k) + BNPL (View)
```

### Customers
```
Email: customer1@test.com
Password: Customer@123
Access: Money Loan customer portal

Email: customer2@test.com
Password: Customer@123
Access: BNPL customer portal
```

---

## 🚀 Quick Login Feature

All login pages have **⚡ Quick Login** buttons:
- **Single Click** → Auto-fills credentials + Auto-submits form
- **Green Styling** → Easy visual identification
- **Lightning Icon** → Indicates instant action

**Purpose:** Speed up testing and development

---

## 🛠️ Implementation Details

### Role Detection
```typescript
const isSystemAdmin = user.tenant_id === null || user.tenant_id === undefined;
const isTenantAdmin = roles.some(r => 
  r.name === 'Tenant Admin' && r.space === 'tenant'
);
```

### Platform Access Check
```typescript
const platforms = response.data.platforms || [];
// platforms = [
//   { productType: 'money_loan', accessLevel: 'manage', ... },
//   { productType: 'bnpl', accessLevel: 'view', ... }
// ]
```

### Platform Routes
```typescript
const routes = {
  'money_loan': '/products/money-loan/dashboard',
  'bnpl': '/products/bnpl/dashboard',
  'pawnshop': '/products/pawnshop/dashboard'
};
```

---

## 📝 Key Rules

1. ✅ **System Admins** → Only System Login → System Dashboard
2. ✅ **Tenant Admins** → Both logins → Tenant Dashboard OR Platforms
3. ✅ **Employees** → Only Platform Login → Must have platform access
4. ✅ **Customers** → Platform/Customer Login → Customer portals
5. ✅ **Single Platform** → Auto-route immediately
6. ✅ **Multiple Platforms** → Show selector modal
7. ✅ **No Platform Access** → Error for Employees, Tenant Dashboard for Tenant Admins

---

## 🔍 Debugging Tips

**Check console logs:**
```
✅ Single platform detected: money_loan → /products/money-loan/dashboard
🎯 Multiple platforms detected (2), showing selector
✅ Tenant Admin with no platforms → /tenant/dashboard
```

**Check user object:**
```javascript
console.log('User:', user);
console.log('Roles:', roles);
console.log('Platforms:', platforms);
```

**Common Issues:**
- Employee with no platform access → Check `employee_product_access` table
- Wrong routing → Check `roles` array for Tenant Admin role
- Modal not showing → Check `platforms.length`

---

## 🎉 Summary

The login system intelligently routes users based on:
1. **User Type** (System Admin, Tenant Admin, Employee, Customer)
2. **Role** (from `user_roles` table)
3. **Platform Access** (from `employee_product_access` table)
4. **Number of Platforms** (0, 1, or multiple)

This provides flexibility for Tenant Admins while maintaining strict access control for Employees and Customers.
