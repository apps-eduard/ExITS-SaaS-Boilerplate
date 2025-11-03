# Product → Platform Terminology Migration

## ✅ Completed Changes

### 1. Database Migration
**File**: `api/src/migrations/20251026100000_rename_product_to_platform.js`
- ✅ Renamed table: `product_subscriptions` → `platform_subscriptions`
- ✅ Renamed enum: `product_type` → `platform_type`
- ✅ Renamed enum: `product_subscription_status` → `platform_subscription_status`
- ✅ Renamed column: `product_type` → `platform_type` in both tables
- ✅ Updated constraints and indexes

### 2. Backend Seeds
**File**: `api/src/seeds/02_subscription_plans_and_products.js`

- ✅ Updated all `product_type` references to `platform_type`
- ✅ Updated table name from `product_subscriptions` to `platform_subscriptions`
- ✅ Updated variable names and log messages
- ✅ Consolidated professional plan templates and feature toggles

**File**: `api/src/seeds/09_professional_plan_templates.js`

- ✅ Converted to deprecation stub (all logic migrated into `02_subscription_plans_and_products.js`)

## 🔄 Remaining Backend Changes Needed

### Seed Files

- [x] `api/src/seeds/09_professional_plan_templates.js` - Deprecated stub (no further updates required)

### Test/Utility Scripts

- [ ] `api/check-active-subs.js` - Update queries from `product_subscriptions` to `platform_subscriptions`
- [ ] `api/check-plan-data.js` - Update `product_type` references
- [ ] `api/test-combined-subscriptions.js` - Update table/column names
- [ ] `api/test-api-response.js` - Update `product_type` references

### Backend Controllers/Routes (if they exist)

- [ ] Search for any `productSubscriptions` or `product_subscriptions` in controllers
- [ ] Search for any `productType` or `product_type` in API responses
- [ ] Update route names from `/products` to `/platforms` (if applicable)

## 🎨 Frontend Changes Needed

### Component Renaming
**Directory**: `web/src/app/features/admin/products/` → `web/src/app/features/admin/platforms/`

Files to rename:

- [ ] `products-list.component.ts` → `platforms-list.component.ts`
- [ ] `product-new.component.ts` → `platform-new.component.ts`
- [ ] `product-mapping.component.ts` → `platform-mapping.component.ts`
- [ ] `product-settings.component.ts` → `platform-settings.component.ts`

**Directory**: `web/src/app/features/tenant/products/` → `web/src/app/features/tenant/platforms/`

Files to rename:

- [ ] `tenant-products.component.ts` → `tenant-platforms.component.ts`
- [ ] `tenant-product-settings.component.ts` → `tenant-platform-settings.component.ts`
- [ ] `tenant-product-config.component.ts` → `tenant-platform-config.component.ts`

### Routes Update
**File**: `web/src/app/app.routes.ts`

- [ ] Update route path: `/admin/products` → `/admin/platforms`
- [ ] Update import paths for renamed components
- [ ] Update lazy-loaded module references

### Sidebar Menu
**File**: `web/src/app/shared/components/sidebar/sidebar.component.ts`

- [ ] Update menu label: "Products" → "Platforms"
- [ ] Update icon (optional)
- [ ] Update permission names if needed
- [ ] Update route paths: `/admin/products` → `/admin/platforms`

### Component Content Updates
For each component:

- [ ] Update selector: `app-product-*` → `app-platform-*`
- [ ] Update template text: "Product" → "Platform"
- [ ] Update variable names: `product` → `platform`, `productList` → `platformList`, etc.
- [ ] Update interface names: `Product` → `Platform`
- [ ] Update API endpoint calls: `/api/products` → `/api/platforms`
- [ ] Update TypeScript types and properties

### Service Files

- [ ] Search for `ProductService` → rename to `PlatformService`
- [ ] Update API endpoints in services
- [ ] Update method names: `getProducts()` → `getPlatforms()`

## 📝 Database Schema Reference

### New Schema

```sql
-- Enum types
CREATE TYPE platform_type AS ENUM ('money_loan', 'bnpl', 'pawnshop', 'platform');
CREATE TYPE platform_subscription_status AS ENUM ('active', 'suspended', 'cancelled', 'expired');

-- Table
CREATE TABLE platform_subscriptions (
  id SERIAL PRIMARY KEY,
  tenant_id INTEGER REFERENCES tenants(id),
  platform_type platform_type NOT NULL,
  subscription_plan_id INTEGER REFERENCES subscription_plans(id),
  status platform_subscription_status DEFAULT 'active',
  started_at TIMESTAMP DEFAULT NOW(),
  expires_at TIMESTAMP,
  price DECIMAL(10,2) DEFAULT 0.00,
  billing_cycle billing_cycle_type DEFAULT 'monthly',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(tenant_id, platform_type)
);

CREATE TABLE subscription_plans (
  ...
  platform_type platform_type,
  ...
);
```

## 🔍 Search Patterns

Use these patterns to find remaining occurrences:

### Backend (API)

```bash
# In api directory
grep -r "product_type" --include="*.js"
grep -r "product_subscriptions" --include="*.js"
grep -r "productType" --include="*.js"
grep -r "productSubscriptions" --include="*.js"
```

### Frontend (Web)

```bash
# In web/src directory
grep -r "product" --include="*.ts" --include="*.html"
grep -r "Product" --include="*.ts" --include="*.html"
```

## ✅ Migration Checklist

### Phase 1: Database (COMPLETED)
- [x] Create migration file
- [x] Run migration
- [x] Verify table renamed
- [x] Verify enum renamed
- [x] Verify constraints updated

### Phase 2: Backend
- [x] Update main seed file (02_subscription_plans_and_products.js)
- [x] Update professional plans seed (09_professional_plan_templates.js)
- [ ] Update test/utility scripts
- [ ] Update controllers (if any exist)
- [ ] Update API routes
- [ ] Update API documentation

### Phase 3: Frontend
- [ ] Rename component directories
- [ ] Rename component files
- [ ] Update component selectors and classes
- [ ] Update routes
- [ ] Update sidebar menu
- [ ] Update services
- [ ] Update interfaces/types
- [ ] Update template text and labels

### Phase 4: Documentation
- [ ] Update README.md
- [ ] Update API documentation
- [ ] Update architecture diagrams
- [ ] Update user guides

## 🎯 Benefits of This Change

1. **Semantic Accuracy**: "Platform" better describes service modules vs physical products
2. **Industry Standard**: Aligns with SaaS terminology (e.g., Salesforce Platform, AWS Platform)
3. **Clear Communication**: Reduces confusion for developers and stakeholders
4. **Scalability**: Better foundation for adding more platform modules
5. **Professional**: More appropriate for B2B SaaS offerings

## ⚠️ Important Notes

- The migration is **reversible** - rollback capability included
- Existing data is preserved during rename operations
- Frontend changes can be done incrementally
- Update API documentation after completing backend changes
- Consider updating environment variables if any reference "product"

---

**Status**: Database migration complete ✅ | Backend in progress 🔄 | Frontend pending ⏳
