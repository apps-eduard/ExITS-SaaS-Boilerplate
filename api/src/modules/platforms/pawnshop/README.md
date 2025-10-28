# Pawnshop Platform Module

**Status**: Folder structure initialized, awaiting implementation

## Folder Structure

```
pawnshop/
├── controllers/    - HTTP request handlers
├── services/       - Business logic layer
├── routes/         - Express route definitions
└── utils/          - Helpers and validators
```

## Planned Features

- Collateral management (jewelry, electronics, vehicles)
- Item appraisal and valuation
- Pawn ticket generation
- Redemption processing
- Item auction/sale management
- Storage and inventory tracking

## Implementation Notes

Follow the same pattern as Money Loan:
- Platform-specific naming (pawnshop* prefix)
- Service-Controller-Routes architecture
- Full KNEX database integration
- Comprehensive validation
- Multi-tenant isolation
