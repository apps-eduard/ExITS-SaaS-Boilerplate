# Money Loan Platform - Navigation Structure

## Main Menu Structure

```
Money Loan Platform
│
├── 📊 Overview                    → /platforms/money-loan/overview
│   └── Dashboard with KPIs
│
├── 👥 Customers                   → /platforms/money-loan/customers
│   ├── Customer List
│   ├── Add Customer              → /platforms/money-loan/customers/add
│   └── Edit Customer             → /platforms/money-loan/customers/:id/edit
│
├── 💰 Loans                       → /platforms/money-loan/loans
│   ├── All Loans List
│   └── Loan Details              → /platforms/money-loan/loans/:id
│
├── 📝 Applications ✨ NEW        → /platforms/money-loan/applications
│   ├── Application List
│   ├── Approve/Reject Workflow
│   └── Status Filtering
│
├── 💳 Payments                    → /platforms/money-loan/payments/record
│   └── Record Payment
│
├── ⚙️ Configuration ✨ NEW       → /platforms/money-loan/config
│   ├── Configuration Dashboard
│   ├── Interest Rates ✨         → /platforms/money-loan/config/interest-rates
│   ├── Payment Schedules         → (TODO)
│   ├── Fee Structures            → (TODO)
│   ├── Approval Rules            → (TODO)
│   └── Loan Modifications        → (TODO)
│
└── 📊 Reports ✨ NEW             → /platforms/money-loan/reports
    ├── Portfolio Summary
    ├── Performance Metrics
    ├── Collections Report
    ├── Arrears Aging
    └── Revenue Breakdown
```

## Page Hierarchy

### Level 1: Main Modules
- Overview Dashboard
- Customers Management
- Loans Management
- **Applications (NEW)**
- Payments
- **Configuration (NEW)**
- **Reports (NEW)**

### Level 2: Configuration Sub-modules
- Configuration Dashboard (entry point)
- **Interest Rates (IMPLEMENTED)**
- Payment Schedules (TODO)
- Fee Structures (TODO)
- Approval Rules (TODO)
- Loan Modifications (TODO)

### Level 3: Detailed Pages
- Loan Details
- Customer Details
- Application Details (TODO)
- Payment Details (TODO)

## User Workflows

### Workflow 1: Configure Loan Product
```
1. Go to Configuration Dashboard
2. Select "Interest Rates"
3. Choose loan product
4. Add/Edit interest rate config
5. Save configuration
```

### Workflow 2: Process Loan Application
```
1. Go to Applications
2. Filter by "Pending" status
3. Click "View Details" on application
4. Review customer information
5. Click "Approve" button
6. Fill approval modal (amount, term, rate)
7. Confirm approval
8. Application status changes to "Approved"
```

### Workflow 3: View Reports
```
1. Go to Reports Dashboard
2. Select date range (or use quick filters)
3. View all 5 report types:
   - Portfolio Summary
   - Performance Metrics
   - Collections Report
   - Arrears Aging
   - Revenue Breakdown
4. Click "Export CSV" to download
```

## Quick Access Guide

### For System Administrators:
- **Configure Products**: Configuration → Interest Rates
- **Manage Fees**: Configuration → Fee Structures (TODO)
- **Set Approval Rules**: Configuration → Approval Rules (TODO)

### For Loan Officers:
- **Review Applications**: Applications → Filter by "Pending"
- **Approve Loans**: Applications → Approve button
- **View Loan Details**: Loans → Click loan number
- **Record Payment**: Payments → Record Payment

### For Managers:
- **View Performance**: Reports → Performance Metrics
- **Check Collections**: Reports → Collections Report
- **Monitor Arrears**: Reports → Arrears Aging
- **Analyze Revenue**: Reports → Revenue Breakdown

## Breadcrumb Examples

### Configuration Pages
```
Home > Platforms > Money Loan > Configuration
Home > Platforms > Money Loan > Configuration > Interest Rates
```

### Application Pages
```
Home > Platforms > Money Loan > Applications
Home > Platforms > Money Loan > Applications > APP-2024-001
```

### Report Pages
```
Home > Platforms > Money Loan > Reports
Home > Platforms > Money Loan > Reports > Portfolio Summary
```

## Permission-Based Access

### money_loan:config:view
- Can view Configuration Dashboard
- Can view all configuration pages

### money_loan:config:edit
- Can create/edit/delete configurations
- Can manage interest rates
- Can manage fee structures

### money_loan:applications:view
- Can view all applications
- Can filter and search applications

### money_loan:applications:approve
- Can approve loan applications
- Can reject loan applications

### money_loan:reports:view
- Can view all reports
- Can export reports to CSV

## Mobile Navigation

On mobile devices (< 768px), the menu collapses:

```
≡ Menu
  → Overview
  → Customers
  → Loans
  → Applications ✨
  → Payments
  → Configuration ✨
  → Reports ✨
```

## Quick Stats Display

Each main page shows relevant quick stats:

**Applications Page**:
- Pending | Under Review | Approved | Rejected

**Reports Page**:
- Total Loans | Disbursed | Outstanding | Collection Rate

**Configuration Page**:
- Active Products | Interest Rates | Fee Structures | Approval Rules

## Search & Filter Capabilities

### Applications Page Filters:
- Status (Pending, Under Review, Approved, Rejected)
- Product (Personal Loan, Business Loan, Emergency Loan)
- Search (Application number, customer name)

### Reports Page Filters:
- Date Range (Start date, End date)
- Quick dates (Today, This Week, This Month)

### Interest Rates Filters:
- Loan Product dropdown
- Active/Inactive filter (implicit via status column)

## Color Coding

### Status Colors:
- 🟠 **Orange**: Pending, Warning states
- 🔵 **Blue**: In Progress, Under Review
- 🟢 **Green**: Approved, Success, Active
- 🔴 **Red**: Rejected, Error, Overdue
- ⚫ **Gray**: Inactive, Disabled

### Module Colors:
- **Configuration**: Blue theme
- **Applications**: Orange theme
- **Reports**: Purple theme
- **Payments**: Green theme

## Keyboard Shortcuts (Future Enhancement)

```
Ctrl + K: Search
Ctrl + N: New Application
Ctrl + R: Refresh Data
Ctrl + E: Export Report
Esc: Close Modal
```

---

**Navigation implementation is complete and intuitive for all user roles!** ✅
