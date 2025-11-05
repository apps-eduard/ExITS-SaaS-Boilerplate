# Permission Matrix - Complete Reference

## 📋 Overview

This document provides a complete reference of all permissions in the system, organized by resource and scope (System vs Tenant).

**Last Updated:** November 5, 2025  
**Total Permissions:** 179+

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

### **Collector: Assigned Customers (4)**
| Permission Key | Resource | Action | Description |
|----------------|----------|--------|-------------|
| `money-loan:assigned-customers:read` | money-loan-assigned-customers | read | View assigned customers only |
| `money-loan:assigned-customers:view-details` | money-loan-assigned-customers | view-details | View detailed customer information |
| `money-loan:assigned-customers:view-loan-history` | money-loan-assigned-customers | view-loan-history | View customer loan history |
| `money-loan:assigned-customers:view-payment-history` | money-loan-assigned-customers | view-payment-history | View customer payment history |

### **Collector: Application Approval (5)**
| Permission Key | Resource | Action | Description |
|----------------|----------|--------|-------------|
| `money-loan:assigned-applications:read` | money-loan-assigned-applications | read | View loan applications from assigned customers |
| `money-loan:assigned-applications:approve` | money-loan-assigned-applications | approve | Approve applications within assigned limit |
| `money-loan:assigned-applications:reject` | money-loan-assigned-applications | reject | Reject loan applications |
| `money-loan:assigned-applications:request-review` | money-loan-assigned-applications | request-review | Request manager review for applications above limit |
| `money-loan:assigned-applications:view-limits` | money-loan-assigned-applications | view-limits | View own approval limits |

### **Collector: Loan Disbursement (5)**
| Permission Key | Resource | Action | Description |
|----------------|----------|--------|-------------|
| `money-loan:assigned-loans:read` | money-loan-assigned-loans | read | View loans of assigned customers |
| `money-loan:assigned-loans:disburse` | money-loan-assigned-loans | disburse | Disburse approved loans within limit |
| `money-loan:assigned-loans:view-pending-disbursement` | money-loan-assigned-loans | view-pending-disbursement | View loans pending disbursement |
| `money-loan:assigned-loans:view-disbursement-limits` | money-loan-assigned-loans | view-disbursement-limits | View own disbursement limits |
| `money-loan:assigned-loans:request-disbursement-approval` | money-loan-assigned-loans | request-disbursement-approval | Request approval for disbursements above limit |

### **Collector: Payment Collection (6)**
| Permission Key | Resource | Action | Description |
|----------------|----------|--------|-------------|
| `money-loan:assigned-payments:collect` | money-loan-assigned-payments | collect | Collect payments from assigned customers |
| `money-loan:assigned-payments:collect-cash` | money-loan-assigned-payments | collect-cash | Collect cash payments |
| `money-loan:assigned-payments:collect-bank-transfer` | money-loan-assigned-payments | collect-bank-transfer | Record bank transfer payments |
| `money-loan:assigned-payments:view-schedule` | money-loan-assigned-payments | view-schedule | View payment schedules |
| `money-loan:assigned-payments:view-overdue` | money-loan-assigned-payments | view-overdue | View overdue payments |
| `money-loan:assigned-payments:view-collection-summary` | money-loan-assigned-payments | view-collection-summary | View collection summary |

### **Collector: Penalty Waiver (6)**
| Permission Key | Resource | Action | Description |
|----------------|----------|--------|-------------|
| `money-loan:penalties:view` | money-loan-penalties | view | View penalty charges |
| `money-loan:penalties:waive-partial` | money-loan-penalties | waive-partial | Waive penalties within assigned limit |
| `money-loan:penalties:waive-request` | money-loan-penalties | waive-request | Request penalty waiver above limit |
| `money-loan:penalties:view-waiver-history` | money-loan-penalties | view-waiver-history | View penalty waiver history |
| `money-loan:penalties:view-waiver-limits` | money-loan-penalties | view-waiver-limits | View penalty waiver limits |
| `money-loan:penalties:approve-waiver` | money-loan-penalties | approve-waiver | Approve penalty waiver requests (Manager) |

### **Collector: Customer Visits & Route (7)**
| Permission Key | Resource | Action | Description |
|----------------|----------|--------|-------------|
| `money-loan:route:view` | money-loan-route | view | View daily collection route |
| `money-loan:route:check-in` | money-loan-route | check-in | GPS check-in at customer location |
| `money-loan:route:record-visit` | money-loan-route | record-visit | Record customer visit details |
| `money-loan:route:upload-photo` | money-loan-route | upload-photo | Upload visit photos |
| `money-loan:route:capture-signature` | money-loan-route | capture-signature | Capture customer signature |
| `money-loan:route:view-visit-history` | money-loan-route | view-visit-history | View past customer visits |
| `money-loan:route:optimize` | money-loan-route | optimize | Optimize collection route |

### **Collector: Reports (5)**
| Permission Key | Resource | Action | Description |
|----------------|----------|--------|-------------|
| `money-loan:collector-reports:view-daily` | money-loan-collector-reports | view-daily | View daily performance report |
| `money-loan:collector-reports:view-weekly` | money-loan-collector-reports | view-weekly | View weekly performance report |
| `money-loan:collector-reports:view-monthly` | money-loan-collector-reports | view-monthly | View monthly performance report |
| `money-loan:collector-reports:view-targets` | money-loan-collector-reports | view-targets | View collection targets |
| `money-loan:collector-reports:export` | money-loan-collector-reports | export | Export performance reports |

### **Collector: Collection Activities (4)**
| Permission Key | Resource | Action | Description |
|----------------|----------|--------|-------------|
| `money-loan:collection-activities:create` | money-loan-collection-activities | create | Create collection activity notes |
| `money-loan:collection-activities:view` | money-loan-collection-activities | view | View collection activity history |
| `money-loan:collection-activities:follow-up` | money-loan-collection-activities | follow-up | Schedule follow-up actions |
| `money-loan:collection-activities:escalate` | money-loan-collection-activities | escalate | Escalate cases to manager |

### **Collector: Management (Admin/Manager) (8)**
| Permission Key | Resource | Action | Description |
|----------------|----------|--------|-------------|
| `money-loan:collector-management:read` | money-loan-collector-management | read | View all collectors (Manager) |
| `money-loan:collector-management:assign-customers` | money-loan-collector-management | assign-customers | Assign customers to collectors (Manager) |
| `money-loan:collector-management:set-limits` | money-loan-collector-management | set-limits | Set collector limits (Manager) |
| `money-loan:collector-management:set-targets` | money-loan-collector-management | set-targets | Set collection targets (Manager) |
| `money-loan:collector-management:view-all-performance` | money-loan-collector-management | view-all-performance | View all collector performance (Manager) |
| `money-loan:collector-management:view-action-logs` | money-loan-collector-management | view-action-logs | View collector action audit logs (Manager) |
| `money-loan:collector-management:view-gps-tracking` | money-loan-collector-management | view-gps-tracking | View collector GPS tracking (Manager) |
| `money-loan:collector-management:manage` | money-loan-collector-management | manage | Full collector management access (Admin) |

### **Collector: Notifications (2)**
| Permission Key | Resource | Action | Description |
|----------------|----------|--------|-------------|
| `money-loan:collector-notifications:view` | money-loan-collector-notifications | view | View collector notifications |
| `money-loan:collector-notifications:send-reminder` | money-loan-collector-notifications | send-reminder | Send payment reminders to customers |

> **Removed Legacy Keys:** The broad tenant permissions `loans:*` and `payments:*` (including `money-loan:read/create/update/approve/payments`) were retired in November 2025. They are no longer present in the database and should not be assigned going forward.

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
| **Money Loan Product** | 113 permissions |
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
| • Collector: Assigned Customers | 4 |
| • Collector: Application Approval | 5 |
| • Collector: Loan Disbursement | 5 |
| • Collector: Payment Collection | 6 |
| • Collector: Penalty Waiver | 6 |
| • Collector: Customer Visits & Route | 7 |
| • Collector: Reports | 5 |
| • Collector: Collection Activities | 4 |
| • Collector: Management (Admin/Manager) | 8 |
| • Collector: Notifications | 2 |
| **BNPL Product** | 4 permissions |
| **Pawnshop Product** | 4 permissions |
| **TOTAL** | **174 permissions** *(active keys)* |

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

### **Money Loan Manager** (Tenant Space)
- All money loan core permissions (61)
- Collector management permissions (8)
- Approve high-value applications above collector limits
- Approve disbursements above collector limits
- Approve penalty waivers above collector limits
- View all collector performance and GPS tracking
- Assign customers to collectors

### **Money Loan Collector** (Tenant Space)
- Assigned customers permissions (4)
- Application approval within limits (5)
- Loan disbursement within limits (5)
- Payment collection (6)
- Penalty waiver within limits (6)
- Customer visits & GPS tracking (7)
- Performance reports (5)
- Collection activities (4)
- Notifications (2)
- **Total: 44 collector-specific permissions**

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

**Document Version:** 3.0  
**Database Status:** ✅ All permissions seeded (including 52 new collector permissions)  
**Total Count:** 174 active permissions
