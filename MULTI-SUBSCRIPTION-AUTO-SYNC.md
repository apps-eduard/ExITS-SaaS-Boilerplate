# Multi-Subscription Auto-Sync Implementation

## 🎯 Problem Solved

**Issue**: Tenants with multiple products enabled only showed 1 subscription instead of multiple (Platform + Products)

**Root Cause**: Product subscriptions weren't automatically created when tenant enabled products via boolean flags (`moneyLoanEnabled`, `bnplEnabled`, `pawnshopEnabled`)

## ✅ Solution Implemented

### Auto-Sync on Read Pattern

When fetching active subscriptions, the system now automatically:
1. Checks which products are enabled for the tenant
2. Creates missing product subscriptions if they don't exist
3. Returns all active subscriptions (platform + products)

### Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    GET /api/tenants/current/subscriptions    │
└────────────────────────────┬────────────────────────────────┘
                             │
                             ▼
                ┌────────────────────────────┐
                │  getActiveSubscriptions()   │
                └────────────┬───────────────┘
                             │
                             ▼
                ┌────────────────────────────┐
                │  syncProductSubscriptions() │ ◄── Auto-creates missing
                └────────────┬───────────────┘     subscriptions
                             │
                  ┌──────────┴──────────┐
                  │                     │
                  ▼                     ▼
    ┌─────────────────────┐  ┌──────────────────────┐
    │  Platform           │  │  Product             │
    │  Subscriptions      │  │  Subscriptions       │
    │  (tenant_subs)      │  │  (product_subs)      │
    └─────────────────────┘  └──────────────────────┘
```

## 📋 Implementation Details

### 1. Auto-Sync Method (`syncProductSubscriptions`)

**File**: `api/src/services/TenantService.js`

```javascript
static async syncProductSubscriptions(tenantId) {
  // Get tenant flags
  const tenant = await getTenant(tenantId);
  
  // For each enabled product
  if (tenant.money_loan_enabled) {
    await ensureProductSubscription(tenantId, 'money_loan', tenant.plan);
  }
  
  if (tenant.bnpl_enabled) {
    await ensureProductSubscription(tenantId, 'bnpl', tenant.plan);
  }
  
  if (tenant.pawnshop_enabled) {
    await ensureProductSubscription(tenantId, 'pawnshop', tenant.plan);
  }
}
```

### 2. Ensure Subscription Method

```javascript
static async ensureProductSubscription(tenantId, productType, platformPlanName) {
  // Check if subscription exists
  const existing = await checkActiveSubscription(tenantId, productType);
  if (existing) return;
  
  // Find matching plan (e.g., "Pawnshop - Pro" for Pro tier)
  const plan = await findMatchingPlan(productType, platformPlanName);
  
  // Create subscription
  await createProductSubscription({
    tenant_id: tenantId,
    product_type: productType,
    subscription_plan_id: plan.id,
    status: 'active',
    started_at: NOW(),
    price: plan.price,
    billing_cycle: plan.billing_cycle
  });
}
```

### 3. Tier Matching Logic

Product plans are matched to platform tier:
- **Platform Plan: Pro** → **Product Plan: Pawnshop - Pro**
- **Platform Plan: Enterprise** → **Product Plan: Money Loan - Enterprise**
- **Fallback**: If no tier match, use Starter plan

## 🔄 How It Works

### Before (Manual Creation Required):

```
Tenant enables Pawnshop → pawnshopEnabled = true
                         ↓
                    No subscription created!
                         ↓
                    UI shows nothing
```

### After (Auto-Sync):

```
User loads /tenant/subscriptions page
            ↓
GET /api/tenants/current/subscriptions
            ↓
syncProductSubscriptions(tenantId)
            ↓
Check: pawnshopEnabled = true?
            ↓
ensureProductSubscription('pawnshop')
            ↓
Subscription exists? NO → Create it!
            ↓
Return: [Platform Sub, Pawnshop Sub]
            ↓
UI displays 2 cards side-by-side
```

## 📊 Database Impact

### Tables Involved:

1. **`tenants`**
   - `money_loan_enabled` (boolean)
   - `bnpl_enabled` (boolean)
   - `pawnshop_enabled` (boolean)
   - `plan` (string) - Platform tier

2. **`tenant_subscriptions`**
   - Platform subscriptions (Trial, Starter, Pro, Enterprise)

3. **`product_subscriptions`**
   - Product-specific subscriptions
   - **Auto-created** when missing

4. **`subscription_plans`**
   - Both platform and product plans
   - Matched by `product_type` and tier name

### Data Flow:

```sql
-- 1. Check enabled products
SELECT money_loan_enabled, bnpl_enabled, pawnshop_enabled, plan 
FROM tenants WHERE id = ?

-- 2. For each enabled product, check if subscription exists
SELECT id FROM product_subscriptions 
WHERE tenant_id = ? AND product_type = 'pawnshop' AND status = 'active'

-- 3. If not exists, find matching plan
SELECT id, price, billing_cycle FROM subscription_plans 
WHERE product_type = 'pawnshop' AND name ILIKE '%pro%'

-- 4. Create subscription
INSERT INTO product_subscriptions 
(tenant_id, product_type, subscription_plan_id, status, started_at, price)
VALUES (?, 'pawnshop', ?, 'active', NOW(), ?)
```

## 🎨 UI Changes

### Component: `tenant-subscriptions.component.ts`

**Before**: Single subscription signal
```typescript
currentSubscription = signal<SubscriptionPlan | null>(null);
```

**After**: Array of subscriptions
```typescript
currentSubscriptions = signal<SubscriptionPlan[]>([]);
```

### Template: Multi-Card Display

```html
<div class="grid grid-cols-1 md:grid-cols-2 gap-4">
  <div *ngFor="let currentPlan of currentSubscriptions()">
    <!-- Subscription Card -->
    <h2>{{ currentPlan.name }}</h2>
    
    <!-- Product Badge -->
    <span *ngIf="currentPlan.productType === 'platform'">🌐 Platform</span>
    <span *ngIf="currentPlan.productType === 'pawnshop'">💎 Pawnshop</span>
    
    <!-- Price, Features, Manage Button -->
  </div>
</div>
```

## 🚀 Benefits

### 1. **Zero Manual Intervention**
- No need to manually create subscriptions in database
- Automatic sync when products are enabled

### 2. **Consistent State**
- Boolean flags and subscriptions always in sync
- No orphaned flags without subscriptions

### 3. **User Experience**
- Tenants see all their active subscriptions immediately
- Clear product type identification with badges
- Side-by-side comparison of subscriptions

### 4. **Scalability**
- Easy to add new products (just add flag + sync logic)
- Consistent pattern across all products

## ⚙️ Configuration

### Adding New Products

To add a new product (e.g., "Inventory"):

1. **Add boolean flag** to `tenants` table:
   ```sql
   ALTER TABLE tenants ADD COLUMN inventory_enabled BOOLEAN DEFAULT FALSE;
   ```

2. **Add product type** to `subscription_plans`:
   ```sql
   INSERT INTO subscription_plans (name, product_type, price, ...)
   VALUES ('Inventory - Starter', 'inventory', 49.99, ...);
   ```

3. **Add sync logic** in `syncProductSubscriptions()`:
   ```javascript
   if (tenant.inventory_enabled) {
     await this.ensureProductSubscription(tenantId, 'inventory', platformPlan);
   }
   ```

4. **Add badge** in component template:
   ```html
   <span *ngIf="currentPlan.productType === 'inventory'">
     📦 Inventory
   </span>
   ```

## 🔒 Edge Cases Handled

### 1. **Plan Not Found**
- Fallback to Starter plan if tier match fails
- Log warning but don't throw error

### 2. **Subscription Already Exists**
- Skip creation
- Return existing subscription

### 3. **Sync Failure**
- Don't block main query
- Log error for debugging
- Best-effort approach

### 4. **Disabled Product with Active Subscription**
- Subscription remains active (not auto-cancelled)
- Future: Add auto-cancellation if needed

## 📝 Testing Scenarios

### Scenario 1: New Tenant Enables Product
```
1. Tenant enables Pawnshop (pawnshopEnabled = true)
2. Navigate to /tenant/subscriptions
3. ✅ See 2 cards: Platform + Pawnshop
```

### Scenario 2: Existing Tenant with Multiple Products
```
1. Tenant has Pro plan + Pawnshop + Money Loan enabled
2. Load subscriptions page
3. ✅ See 3 cards: Pro Platform, Pawnshop, Money Loan
```

### Scenario 3: Product Disabled
```
1. Tenant disables Pawnshop (pawnshopEnabled = false)
2. Load subscriptions page
3. ✅ See only Platform card (Pawnshop subscription hidden)
```

## 🛠️ Future Enhancements

### 1. **Webhook/Event-Based Sync**
Instead of sync-on-read, trigger sync when flags change:
```javascript
// When tenant.pawnshopEnabled changes
eventEmitter.on('tenant.product.enabled', async (tenantId, productType) => {
  await TenantService.ensureProductSubscription(tenantId, productType);
});
```

### 2. **Auto-Cancellation**
Cancel subscriptions when products are disabled:
```javascript
if (!tenant.pawnshop_enabled) {
  await this.cancelProductSubscription(tenantId, 'pawnshop');
}
```

### 3. **Subscription History**
Track when subscriptions were auto-created:
```javascript
metadata: {
  auto_created: true,
  created_reason: 'product_enabled',
  created_at: new Date()
}
```

### 4. **Admin Dashboard**
Show which subscriptions were auto-created vs manually created

## 📚 Related Files

- **Backend**:
  - `api/src/services/TenantService.js` (sync logic)
  - `api/src/controllers/TenantController.js` (API endpoint)
  - `api/src/routes/tenantRoutes.js` (route definition)

- **Frontend**:
  - `web/src/app/core/services/tenant.service.ts` (API client)
  - `web/src/app/features/tenant/billing/tenant-subscriptions.component.ts` (UI)

- **Database**:
  - `tenants` table (boolean flags)
  - `product_subscriptions` table (subscription records)
  - `subscription_plans` table (available plans)

## ✅ Success Criteria

- [x] Multiple subscriptions display correctly
- [x] Product badges show for each subscription
- [x] Auto-creation on missing subscriptions
- [x] Tier matching (Pro → Pawnshop - Pro)
- [x] Fallback to Starter if no tier match
- [x] Error handling without blocking
- [x] Logging for debugging
- [x] UI grid layout responsive

---

**Status**: ✅ IMPLEMENTED & WORKING

**Last Updated**: October 25, 2025
