# BNPL Platform - Buy Now Pay Later

## Overview
Buy Now Pay Later (BNPL) platform for installment-based purchases with merchant integrations.

## Folder Structure

```
bnpl/
├── admin/
│   ├── configuration/      # BNPL configuration settings
│   ├── applications/       # Purchase applications
│   ├── payments/          # Payment management
│   └── reports/           # Analytics and reports
├── customer/              # Customer-facing components
├── dashboard/             # BNPL dashboard
├── shared/
│   ├── services/          # API services
│   └── models/            # TypeScript interfaces
└── modules/               # Routing modules
```

## Planned Features

### Admin Features
- **Configuration Management**
  - Installment plans (0%, 3%, 6%, 12 months)
  - Merchant settings
  - Credit scoring rules
  - Fee structures

- **Purchase Management**
  - Purchase applications
  - Credit approval workflow
  - Merchant integrations
  - Purchase orders

- **Payment Processing**
  - Installment payments
  - Auto-debit setup
  - Payment reminders
  - Late penalties

- **Reports & Analytics**
  - Purchase volume
  - Merchant performance
  - Payment collection rates
  - Default analysis

### Customer Features
- Browse available merchants
- Apply for purchase
- View installment schedule
- Make payments
- Transaction history

## API Integration
Base URL: `/api/tenants/:tenantId/platforms/bnpl`

## Status
🚧 **Structure Only** - Implementation pending
