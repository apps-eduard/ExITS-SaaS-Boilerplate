# BNPL Platform Module

**Status**: Folder structure initialized, awaiting implementation

## Folder Structure

```
bnpl/
├── controllers/    - HTTP request handlers
├── services/       - Business logic layer
├── routes/         - Express route definitions
└── utils/          - Helpers and validators
```

## Planned Features

- Installment plans management
- Merchant integrations
- Purchase order processing
- Payment collections
- Customer credit scoring
- BNPL product configuration

## Implementation Notes

Follow the same pattern as Money Loan:
- Platform-specific naming (bnpl* prefix)
- Service-Controller-Routes architecture
- Full KNEX database integration
- Comprehensive validation
- Multi-tenant isolation
