# Pawnshop Platform

## Overview
Pawnshop management system for collateral-based lending with appraisal, redemption, and auction features.

## Folder Structure

```
pawnshop/
├── admin/
│   ├── configuration/     # Pawnshop settings
│   ├── collateral/        # Collateral management
│   ├── appraisal/         # Item appraisal
│   ├── tickets/           # Pawn tickets
│   ├── redemption/        # Redemption tracking
│   ├── auctions/          # Auction management
│   └── reports/           # Analytics
├── customer/              # Customer portal
├── dashboard/             # Main dashboard
├── shared/
│   ├── services/          # API services
│   └── models/            # TypeScript interfaces
└── modules/               # Routing modules
```

## Planned Features

### Admin Features
- **Configuration Management**
  - Interest rates for pawn loans
  - Appraisal rules by item category
  - Loan-to-value ratios
  - Grace periods and penalties

- **Collateral Management**
  - Item registration
  - Photo documentation
  - Storage location tracking
  - Item categorization (jewelry, electronics, etc.)

- **Appraisal System**
  - Appraisal workflow
  - Market value pricing
  - Condition assessment
  - Authentication checks

- **Pawn Tickets**
  - Ticket generation
  - Loan terms
  - Payment schedule
  - Renewal tracking

- **Redemption Management**
  - Redemption payments
  - Partial redemptions
  - Grace period tracking
  - Item release

- **Auction System**
  - Unclaimed items
  - Auction scheduling
  - Bidding management
  - Sale reconciliation

- **Reports & Analytics**
  - Inventory valuation
  - Redemption rates
  - Auction performance
  - Revenue analysis

### Customer Features
- View active pawn tickets
- Make payments
- Check redemption status
- Request renewal
- Browse auction items

## API Integration
Base URL: `/api/tenants/:tenantId/platforms/pawnshop`

## Status
🚧 **Structure Only** - Implementation pending
