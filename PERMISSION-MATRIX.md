# Permission Matrix - Complete Reference

## 📋 Overview

This document provides a complete reference of all permissions in the system, organized by resource and scope (System vs Tenant).

**Last Updated:** October 24, 2025  
**Total Permissions:** 127+

---

## 🔐 Permission Structure

Each permission follows the format: `{resource}:{action}`

**Example:** `money-loan:loans:approve` → Resource: `money-loan-loans`, Action: `approve`

---

## 📊 System-Level Permissions (Super Admin)

### **Tenants Management (5)**
| Permission Key | Resource | Action | Description |
|----------------|----------|--------|-------------|
| `tenants:create` | tenants | create | Create new tenants |
| `tenants:read` | tenants | read | View tenant information |
| `tenants:update` | tenants | update | Edit tenant details |
| `tenants:delete` | tenants | delete | Delete tenants |
| `tenants:manage-subscriptions` | tenants | manage-subscriptions | Manage tenant subscriptions |

### **Modules Management (4)**
| Permission Key | Resource | Action | Description |
|----------------|----------|--------|-------------|
| `modules:create` | modules | create | Create system modules |
| `modules:read` | modules | read | View modules |
| `modules:update` | modules | update | Edit modules |
| `modules:delete` | modules | delete | Delete modules |

### **Permissions Management (4)**
| Permission Key | Resource | Action | Description |
|----------------|----------|--------|-------------|
| `permissions:create` | permissions | create | Create permissions |
| `permissions:read` | permissions | read | View permissions |
| `permissions:update` | permissions | update | Edit permissions |
| `permissions:delete` | permissions | delete | Delete permissions |

### **Products Management (5)**
| Permission Key | Resource | Action | Description |
|----------------|----------|--------|-------------|
| `products:create` | products | create | Create new products |
| `products:read` | products | read | View product catalog |
| `products:update` | products | update | Edit product details |
| `products:delete` | products | delete | Delete products |
| `products:manage-catalog` | products | manage-catalog | Manage product catalog |

### **Subscriptions Management (5)**
| Permission Key | Resource | Action | Description |
|----------------|----------|--------|-------------|
| `subscriptions:create` | subscriptions | create | Create subscriptions |
| `subscriptions:read` | subscriptions | read | View subscriptions |
| `subscriptions:update` | subscriptions | update | Edit subscriptions |
| `subscriptions:delete` | subscriptions | delete | Delete subscriptions |
| `subscriptions:manage-plans` | subscriptions | manage-plans | Manage subscription plans |

### **System Reports & Analytics (5)**
| Permission Key | Resource | Action | Description |
|----------------|----------|--------|-------------|
| `reports:view` | reports | view | View system reports |
| `reports:export` | reports | export | Export reports |
| `reports:tenant-usage` | reports | tenant-usage | View tenant usage reports |
| `reports:revenue` | reports | revenue | View revenue reports |
| `analytics:view` | analytics | view | View analytics dashboard |

### **System Recycle Bin (3)**
| Permission Key | Resource | Action | Description |
|----------------|----------|--------|-------------|
| `recycle-bin:view` | recycle-bin | view | View recycle bin |
| `recycle-bin:restore` | recycle-bin | restore | Restore deleted items |
| `recycle-bin:permanent-delete` | recycle-bin | permanent-delete | Permanently delete items |

### **System-Level Loans (6)**
| Permission Key | Resource | Action | Description |
|----------------|----------|--------|-------------|
| `loans:read` | loans | read | View loan information |
| `loans:create` | loans | create | Create new loans |
| `loans:update` | loans | update | Update loan details |
| `loans:delete` | loans | delete | Delete loans |
| `loans:approve` | loans | approve | Approve/reject loans |
| `loans:disburse` | loans | disburse | Disburse loan amounts |

### **System-Level Payments (4)**
| Permission Key | Resource | Action | Description |
|----------------|----------|--------|-------------|
| `payments:create` | payments | create | Process payments |
| `payments:read` | payments | read | View payment information |
| `payments:update` | payments | update | Update payment details |
| `payments:delete` | payments | delete | Delete payments |

---

## 🏢 Tenant-Level Permissions

### **Dashboard (2)**
| Permission Key | Resource | Action | Description |
|----------------|----------|--------|-------------|
| `dashboard:view` | dashboard | view | View dashboard |
| `tenant-dashboard:view` | tenant-dashboard | view | View tenant dashboard |

### **User Management (11)**
| Permission Key | Resource | Action | Description |
|----------------|----------|--------|-------------|
| `users:create` | users | create | Create users |
| `users:read` | users | read | View users |
| `users:update` | users | update | Edit users |
| `users:delete` | users | delete | Delete users |
| `users:export` | users | export | Export user data |
| `tenant-users:create` | tenant-users | create | Create tenant users |
| `tenant-users:read` | tenant-users | read | View tenant users |
| `tenant-users:update` | tenant-users | update | Update tenant users |
| `tenant-users:delete` | tenant-users | delete | Delete tenant users |
| `tenant-users:invite` | tenant-users | invite | Invite new users to tenant |
| `tenant-users:assign-roles` | tenant-users | assign-roles | Assign roles to tenant users |

### **Role Management (8)**
| Permission Key | Resource | Action | Description |
|----------------|----------|--------|-------------|
| `roles:create` | roles | create | Create roles |
| `roles:read` | roles | read | View roles |
| `roles:update` | roles | update | Edit roles |
| `roles:delete` | roles | delete | Delete roles |
| `tenant-roles:create` | tenant-roles | create | Create tenant roles |
| `tenant-roles:read` | tenant-roles | read | View tenant roles |
| `tenant-roles:update` | tenant-roles | update | Update tenant roles |
| `tenant-roles:delete` | tenant-roles | delete | Delete tenant roles |

### **Settings (4)**
| Permission Key | Resource | Action | Description |
|----------------|----------|--------|-------------|
| `settings:read` | settings | read | View settings |
| `settings:update` | settings | update | Edit settings |
| `tenant-settings:read` | tenant-settings | read | View tenant settings |
| `tenant-settings:update` | tenant-settings | update | Update tenant settings |

### **Audit Logs (2)**
| Permission Key | Resource | Action | Description |
|----------------|----------|--------|-------------|
| `audit:read` | audit | read | View audit logs |
| `audit:export` | audit | export | Export audit logs |

### **Tenant Products (3)**
| Permission Key | Resource | Action | Description |
|----------------|----------|--------|-------------|
| `tenant-products:read` | tenant-products | read | View tenant product catalog |
| `tenant-products:configure` | tenant-products | configure | Configure tenant products |
| `tenant-products:manage-settings` | tenant-products | manage-settings | Manage product settings/features |

### **Tenant Billing (5)**
| Permission Key | Resource | Action | Description |
|----------------|----------|--------|-------------|
| `tenant-billing:read` | tenant-billing | read | View tenant billing information |
| `tenant-billing:view-subscriptions` | tenant-billing | view-subscriptions | View tenant subscriptions |
| `tenant-billing:view-invoices` | tenant-billing | view-invoices | View tenant invoices |
| `tenant-billing:manage-renewals` | tenant-billing | manage-renewals | Manage subscription renewals |
| `tenant-billing:view-overview` | tenant-billing | view-overview | View billing overview |

### **Tenant Reports (6)**
| Permission Key | Resource | Action | Description |
|----------------|----------|--------|-------------|
| `tenant-reports:view` | tenant-reports | view | View tenant reports |
| `tenant-reports:product-usage` | tenant-reports | product-usage | View product usage reports |
| `tenant-reports:user-activity` | tenant-reports | user-activity | View user activity reports |
| `tenant-reports:billing-summary` | tenant-reports | billing-summary | View billing/payment summary |
| `tenant-reports:transactions` | tenant-reports | transactions | View transaction history |
| `tenant-reports:export` | tenant-reports | export | Export tenant reports |

### **Tenant Recycle Bin (3)**
| Permission Key | Resource | Action | Description |
|----------------|----------|--------|-------------|
| `tenant-recycle-bin:view` | tenant-recycle-bin | view | View tenant recycle bin |
| `tenant-recycle-bin:restore` | tenant-recycle-bin | restore | Restore deleted tenant items |
| `tenant-recycle-bin:view-history` | tenant-recycle-bin | view-history | View recovery history |

---

## 💰 Money Loan Product Permissions (61)

### **Overview Dashboard (6)**
| Permission Key | Resource | Action | Description |
|----------------|----------|--------|-------------|
| `money-loan:overview:view` | money-loan-overview | view | View overview dashboard with metrics |
| `money-loan:overview:total-loans` | money-loan-overview | view-total-loans | View total loans disbursed metric |
| `money-loan:overview:collection-rate` | money-loan-overview | view-collection-rate | View collection rate metric |
| `money-loan:overview:overdue-percentage` | money-loan-overview | view-overdue-percentage | View overdue percentage metric |
| `money-loan:overview:outstanding-amount` | money-loan-overview | view-outstanding-amount | View outstanding amount metric |
| `money-loan:overview:default-rate` | money-loan-overview | view-default-rate | View default rate metric |

### **Customers (5)**
| Permission Key | Resource | Action | Description |
|----------------|----------|--------|-------------|
| `money-loan:customers:read` | money-loan-customers | read | View all customers |
| `money-loan:customers:create` | money-loan-customers | create | Create new customers |
| `money-loan:customers:update` | money-loan-customers | update | Update customer information |
| `money-loan:customers:delete` | money-loan-customers | delete | Delete or deactivate customers |
| `money-loan:customers:view-high-risk` | money-loan-customers | view-high-risk | View high-risk flagged customers |

### **Loans (9)**
| Permission Key | Resource | Action | Description |
|----------------|----------|--------|-------------|
| `money-loan:loans:read` | money-loan-loans | read | View all loans |
| `money-loan:loans:create` | money-loan-loans | create | Create new loan applications |
| `money-loan:loans:update` | money-loan-loans | update | Update loan details |
| `money-loan:loans:delete` | money-loan-loans | delete | Delete or cancel loans |
| `money-loan:loans:approve` | money-loan-loans | approve | Approve or reject loan applications |
| `money-loan:loans:disburse` | money-loan-loans | disburse | Disburse approved loans |
| `money-loan:loans:view-overdue` | money-loan-loans | view-overdue | View overdue loans |
| `money-loan:loans:close` | money-loan-loans | close | Close or mark loans as paid off |
| `money-loan:loans:use-calculator` | money-loan-loans | use-calculator | Use loan calculator tool |

### **Payments (7)**
| Permission Key | Resource | Action | Description |
|----------------|----------|--------|-------------|
| `money-loan:payments:read` | money-loan-payments | read | View payment history |
| `money-loan:payments:create` | money-loan-payments | create | Record new payments |
| `money-loan:payments:view-today` | money-loan-payments | view-today-collections | View today's collections |
| `money-loan:payments:bulk-import` | money-loan-payments | bulk-import | Import payments in bulk via CSV |
| `money-loan:payments:refund` | money-loan-payments | refund | Process refunds and waivers |
| `money-loan:payments:view-failed` | money-loan-payments | view-failed | View failed payment transactions |
| `money-loan:payments:configure-gateway` | money-loan-payments | configure-gateway | Configure payment gateway settings |

### **Interest & Rules (5)**
| Permission Key | Resource | Action | Description |
|----------------|----------|--------|-------------|
| `money-loan:interest:read` | money-loan-interest | read | View interest rates |
| `money-loan:interest:update` | money-loan-interest | update | Update interest rates |
| `money-loan:interest:manage-auto-rules` | money-loan-interest | manage-auto-rules | Manage automated interest rate rules |
| `money-loan:interest:manual-override` | money-loan-interest | manual-override | Manually override interest rates |
| `money-loan:interest:use-calculator` | money-loan-interest | use-calculator | Use interest calculator |

### **Collections (5)**
| Permission Key | Resource | Action | Description |
|----------------|----------|--------|-------------|
| `money-loan:collections:read` | money-loan-collections | read | View collection workflows |
| `money-loan:collections:manage-workflow` | money-loan-collections | manage-workflow | Manage overdue collection workflows |
| `money-loan:collections:manage-strategies` | money-loan-collections | manage-strategies | Manage collection strategies |
| `money-loan:collections:legal-actions` | money-loan-collections | manage-legal-actions | Manage legal actions |
| `money-loan:collections:view-recovery` | money-loan-collections | view-recovery | View recovery dashboard and status |

### **KYC Verification (6)**
| Permission Key | Resource | Action | Description |
|----------------|----------|--------|-------------|
| `money-loan:kyc:read` | money-loan-kyc | read | View KYC verification status |
| `money-loan:kyc:review` | money-loan-kyc | review | Review pending KYC submissions |
| `money-loan:kyc:approve` | money-loan-kyc | approve | Approve or reject KYC verifications |
| `money-loan:kyc:view-audit-logs` | money-loan-kyc | view-audit-logs | View KYC audit logs |
| `money-loan:kyc:view-webhook-logs` | money-loan-kyc | view-webhook-logs | View third-party KYC webhook logs |
| `money-loan:kyc:configure` | money-loan-kyc | configure | Configure KYC verification settings |

### **Reports (5)**
| Permission Key | Resource | Action | Description |
|----------------|----------|--------|-------------|
| `money-loan:reports:read` | money-loan-reports | read | View reports |
| `money-loan:reports:generate-periodic` | money-loan-reports | generate-periodic | Generate daily/weekly/monthly reports |
| `money-loan:reports:tax-summary` | money-loan-reports | generate-tax-summary | Generate tax summary reports |
| `money-loan:reports:export` | money-loan-reports | export | Export reports to CSV/PDF |
| `money-loan:reports:custom-queries` | money-loan-reports | run-custom-queries | Run custom queries and reports |

### **Settings (7)**
| Permission Key | Resource | Action | Description |
|----------------|----------|--------|-------------|
| `money-loan:settings:read` | money-loan-settings | read | View settings |
| `money-loan:settings:manage-roles` | money-loan-settings | manage-roles-permissions | Manage roles and permissions |
| `money-loan:settings:manage-loan-products` | money-loan-settings | manage-loan-products | Manage loan product settings |
| `money-loan:settings:manage-templates` | money-loan-settings | manage-templates | Manage SMS/Email templates |
| `money-loan:settings:manage-branding` | money-loan-settings | manage-branding | Manage company branding |
| `money-loan:settings:manage-api-keys` | money-loan-settings | manage-api-keys | Manage API keys for integrations |
| `money-loan:settings:view-audit-log` | money-loan-settings | view-audit-log | View system audit log |

### **Audit Log (3)**
| Permission Key | Resource | Action | Description |
|----------------|----------|--------|-------------|
| `money-loan:audit:read` | money-loan-audit | read | View system activity logs |
| `money-loan:audit:view-data-changes` | money-loan-audit | view-data-changes | Track changes to sensitive data |
| `money-loan:audit:export` | money-loan-audit | export | Export audit logs |

### **Additional Features (3)**
| Permission Key | Resource | Action | Description |
|----------------|----------|--------|-------------|
| `money-loan:notifications:read` | money-loan-notifications | read | View notifications and alerts |
| `money-loan:user-management:manage` | money-loan-user-management | manage | Manage staff accounts and access |
| `money-loan:integrations:configure` | money-loan-integrations | configure | Configure external integrations |

### **Legacy Money Loan Permissions (5)** *(Deprecated - use granular permissions above)*
| Permission Key | Resource | Action | Description |
|----------------|----------|--------|-------------|
| `money-loan:read` | money-loan | read | View loan information *(Use specific permissions instead)* |
| `money-loan:create` | money-loan | create | Create new loans *(Use money-loan:loans:create)* |
| `money-loan:update` | money-loan | update | Update loan details *(Use money-loan:loans:update)* |
| `money-loan:approve` | money-loan | approve | Approve/reject loans *(Use money-loan:loans:approve)* |
| `money-loan:payments` | money-loan | payments | Manage loan payments *(Use money-loan:payments:create)* |

---

## 💳 BNPL Product Permissions (4)

| Permission Key | Resource | Action | Description |
|----------------|----------|--------|-------------|
| `bnpl:read` | bnpl | read | View BNPL information |
| `bnpl:create` | bnpl | create | Create BNPL plans |
| `bnpl:update` | bnpl | update | Update BNPL plans |
| `bnpl:manage` | bnpl | manage | Manage BNPL transactions |

---

## 🏪 Pawnshop Product Permissions (4)

| Permission Key | Resource | Action | Description |
|----------------|----------|--------|-------------|
| `pawnshop:read` | pawnshop | read | View pawnshop information |
| `pawnshop:create` | pawnshop | create | Create pawn tickets |
| `pawnshop:update` | pawnshop | update | Update pawn details |
| `pawnshop:manage` | pawnshop | manage | Manage pawnshop operations |

---

## 📈 Permission Count Summary

| Category | Permission Count |
|----------|-----------------|
| **System-Level** | 41 permissions |
| • Tenants | 5 |
| • Modules | 4 |
| • Permissions | 4 |
| • Products | 5 |
| • Subscriptions | 5 |
| • Reports & Analytics | 5 |
| • Recycle Bin | 3 |
| • Loans (System) | 6 |
| • Payments (System) | 4 |
| **Tenant-Level (Core)** | 44 permissions |
| • Dashboard | 2 |
| • User Management | 11 |
| • Role Management | 8 |
| • Settings | 4 |
| • Audit Logs | 2 |
| • Products | 3 |
| • Billing | 5 |
| • Reports | 6 |
| • Recycle Bin | 3 |
| **Money Loan Product** | 66 permissions |
| • Overview | 6 |
| • Customers | 5 |
| • Loans | 9 |
| • Payments | 7 |
| • Interest & Rules | 5 |
| • Collections | 5 |
| • KYC | 6 |
| • Reports | 5 |
| • Settings | 7 |
| • Audit | 3 |
| • Additional | 3 |
| • Legacy (Deprecated) | 5 |
| **BNPL Product** | 4 permissions |
| **Pawnshop Product** | 4 permissions |
| **TOTAL** | **127 permissions** |

---

## 🎯 Permission Usage by Role Type

### **Super Admin** (System Space)
- All system-level permissions (41)
- Can create and manage tenants
- Can configure global products and subscriptions
- Full system oversight

### **Tenant Admin** (Tenant Space)
- All tenant-level core permissions (44)
- All product permissions for enabled products (Money Loan, BNPL, Pawnshop)
- Can manage users and roles within tenant
- Cannot access other tenants' data

### **Product-Specific Roles** (Tenant Space)
- Assigned via `employee_product_access` table
- Granular permissions per product
- Access level controls (view, create, edit, approve, manage, admin)
- Business rule enforcement (amount limits, daily limits)

---

## 🔄 Migration Notes

### **Deprecated Permissions**
The following broad permissions are deprecated in favor of granular permissions:

- `money-loan:read` → Use specific `money-loan:loans:read`, `money-loan:customers:read`, etc.
- `money-loan:create` → Use `money-loan:loans:create`
- `money-loan:update` → Use `money-loan:loans:update`
- `money-loan:approve` → Use `money-loan:loans:approve`
- `money-loan:payments` → Use `money-loan:payments:create`

**Action Required:** Update role assignments to use new granular permissions for better security control.

---

## 📝 Notes

1. **Space:** Permissions can be `system` or `tenant` scoped
2. **Format:** All permission keys follow `{resource}:{action}` pattern
3. **Granularity:** Money Loan permissions are highly granular for precise access control
4. **Extensibility:** New products (BNPL, Pawnshop) will follow the same pattern
5. **Legacy Support:** Old permission keys maintained for backward compatibility but deprecated

---

**Document Version:** 2.0  
**Database Status:** ✅ All permissions seeded  
**Total Count:** 127 permissions
