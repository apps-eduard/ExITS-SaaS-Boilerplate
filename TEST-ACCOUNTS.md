# Test Accounts Reference

All test accounts use the password: `Admin@123`

## System Level

### System Administrator
- **Email:** `admin@exitsaas.com`
- **Role:** Super Admin (Full system access)
- **Login:** System/Tenant Login (web)

---

## ACME Corporation (Tenant)

### Tenant Administrator
- **Email:** `admin@acme.com`
- **Role:** Tenant Admin
- **Login:** System/Tenant Login (web)

### Employees
- **Email:** `employee1@acme.com` - Loan Officer
- **Email:** `employee2@acme.com` - Collections Specialist
- **Login:** Mobile (loanflow)

### Customers
- **Email:** `customer1@acme.com`
- **Name:** Maria Santos
- **Customer Code:** CUST-ACME-0001
- **Login:** Customer Portal (web) or Mobile (loanflow)

---

## TechStart Solutions (Tenant)

### Tenant Administrator
- **Email:** `admin@techstart.com`
- **Role:** Tenant Admin
- **Login:** System/Tenant Login (web)

### Employees
- **Email:** `employee1@techstart.com` - Loan Officer
- **Email:** `employee2@techstart.com` - Collections Specialist
- **Login:** Mobile (loanflow)

### Customers
- **Email:** `customer1@techstart.com`
- **Name:** Juan Dela Cruz
- **Customer Code:** CUST-TECHSTART-0001
- **Login:** Customer Portal (web) or Mobile (loanflow)

---

## Quick Login Summary

### Web App
- **System/Tenant Login:** `/login`
  - `admin@exitsaas.com` (System)
  - `admin@acme.com` (ACME Tenant)
  - `admin@techstart.com` (TechStart Tenant)

- **Customer Portal:** `/customer/login`
  - `customer1@acme.com` (Maria Santos - ACME)
  - `customer1@techstart.com` (Juan Dela Cruz - TechStart)

### Mobile App (Loanflow)
- `customer1@acme.com` (Maria Santos - Customer)
- `customer1@techstart.com` (Juan Dela Cruz - Customer)
- `employee1@acme.com` (Employee - ACME)
- `employee1@techstart.com` (Employee - TechStart)

---

## Login URLs

- **System Admin / Tenant Admin:** http://localhost:4200/login
- **Customer Portal (Web):** http://localhost:4200/customer/login
- **Customer/Employee Mobile:** http://localhost:8100/login

---

## Important Notes
- All passwords are `Admin@123`
- Run `setup.ps1` to seed these accounts into the database
- Customer accounts have Money Loan profiles pre-configured
- Employees have Money Loan platform access with appropriate permissions
- Each tenant (ACME and TechStart) has exactly 1 customer account
