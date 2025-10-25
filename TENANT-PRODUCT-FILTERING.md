# Tenant Product-Based Subscription Filtering

## Overview
Modified the subscription display to show only relevant plans based on tenant's enabled products. Product subscriptions now display on top, and available plans are filtered to match tenant's product access.

## Implementation Date
October 25, 2025

## Changes Made

### 1. Backend API Enhancement (`api/src/services/TenantService.js`)

**Modified Method**: `getActiveSubscriptions(tenantId)`

**Changes**:
- Now returns `{ subscriptions, enabledProducts }` instead of just subscriptions array
- Queries tenant's enabled product flags: `money_loan_enabled`, `bnpl_enabled`, `pawnshop_enabled`
- Returns array of enabled product types: `['money_loan', 'bnpl', 'pawnshop']`

**Code Example**:
```javascript
// Get tenant enabled products
const tenantResult = await pool.query(
  `SELECT money_loan_enabled, bnpl_enabled, pawnshop_enabled FROM tenants WHERE id = $1`,
  [tenantId]
);

const enabledProducts = [];
if (tenantResult.rows.length > 0) {
  const tenant = tenantResult.rows[0];
  if (tenant.money_loan_enabled) enabledProducts.push('money_loan');
  if (tenant.bnpl_enabled) enabledProducts.push('bnpl');
  if (tenant.pawnshop_enabled) enabledProducts.push('pawnshop');
}

return {
  subscriptions,
  enabledProducts
};
```

### 2. Frontend Service Update (`web/src/app/core/services/tenant.service.ts`)

**Added Interface**:
```typescript
export interface ActiveSubscriptionsResponse {
  subscriptions: SubscriptionPlan[];
  enabledProducts: string[]; // ['money_loan', 'bnpl', 'pawnshop']
}
```

**Updated Method Signature**:
```typescript
getMyActiveSubscriptions(): Observable<{ 
  success: boolean; 
  data: ActiveSubscriptionsResponse 
}>
```

### 3. Component Logic (`tenant-subscriptions.component.ts`)

**Added Signal**:
```typescript
enabledProducts = signal<string[]>([]); // Track tenant's enabled products
```

**Modified `availablePlans` Computed**:
- Filters plans to show:
  - ✅ All platform plans (Trial, Starter, Pro, Enterprise)
  - ✅ Only product plans for enabled products
  - ❌ Hides product plans for disabled products

```typescript
availablePlans = computed(() => {
  const enabled = this.enabledProducts();
  
  return this.allPlans()
    .filter(apiPlan => {
      // Always show platform plans
      if (apiPlan.productType === 'platform') return true;
      
      // Show product plans only if the product is enabled
      return enabled.includes(apiPlan.productType || '');
    })
    .map(apiPlan => ({ ...transform logic... }));
});
```

**Modified `loadSubscriptionData()`**:
- Destructures `{ subscriptions, enabledProducts }` from API response
- **Sorts subscriptions**: Product subscriptions first, then platform
- Sets `enabledProducts` signal for filtering

```typescript
const { subscriptions, enabledProducts } = activeSubscriptions.data;

// Sort: Product subscriptions first, then platform
const sortedSubscriptions = [...subscriptions].sort((a, b) => {
  const aIsPlatform = a.productType === 'platform';
  const bIsPlatform = b.productType === 'platform';
  
  // Platform goes to the end
  if (aIsPlatform && !bIsPlatform) return 1;
  if (!aIsPlatform && bIsPlatform) return -1;
  return 0;
});

this.currentSubscriptions.set(transformedSubscriptions);
this.enabledProducts.set(enabledProducts);
```

## User Experience

### Before
- Tenant with only Money Loan enabled saw ALL plans:
  - ❌ Pawnshop plans (not relevant)
  - ❌ BNPL plans (not relevant)
  - ✅ Money Loan plans
  - ✅ Platform plans
- Platform subscription displayed first
- Confusing to see unrelated product plans

### After
- Tenant with only Money Loan enabled sees:
  - ✅ Money Loan plans ONLY
  - ✅ Platform plans
  - ❌ Pawnshop plans (hidden)
  - ❌ BNPL plans (hidden)
- Product subscriptions display first (top of the list)
- Platform subscription displays after product subscriptions
- Clean, focused view showing only relevant options

## Examples

### Scenario 1: Tenant with Money Loan Only
**Enabled Products**: `['money_loan']`

**Active Subscriptions Displayed** (sorted):
1. 💰 Money Loan - Starter (FIRST)
2. 🌐 Platform - Pro (SECOND)

**Available Plans Shown**:
- Platform Plans: Trial, Starter, Pro, Enterprise
- Money Loan Plans: Starter, Pro, Enterprise
- ❌ No Pawnshop plans
- ❌ No BNPL plans

### Scenario 2: Tenant with Multiple Products
**Enabled Products**: `['money_loan', 'pawnshop']`

**Active Subscriptions Displayed** (sorted):
1. 💰 Money Loan - Pro (FIRST)
2. 💎 Pawnshop - Pro (SECOND)
3. 🌐 Platform - Pro (THIRD)

**Available Plans Shown**:
- Platform Plans: Trial, Starter, Pro, Enterprise
- Money Loan Plans: Starter, Pro, Enterprise
- Pawnshop Plans: Starter, Pro, Enterprise
- ❌ No BNPL plans

### Scenario 3: Tenant with Platform Only (No Products)
**Enabled Products**: `[]`

**Active Subscriptions Displayed**:
1. 🌐 Platform - Starter (ONLY)

**Available Plans Shown**:
- Platform Plans: Trial, Starter, Pro, Enterprise
- ❌ No product-specific plans

## Technical Benefits

1. **Better UX**: Tenants only see plans they can actually use
2. **Reduced Confusion**: No irrelevant product plans cluttering the interface
3. **Auto-Sync Compatible**: Works seamlessly with auto-creation hooks
4. **Sorting Logic**: Product subscriptions prominently displayed at top
5. **Dynamic Filtering**: Plans update automatically when products are enabled/disabled
6. **Scalable**: Easy to add new products (just add to enabled products array)

## Testing Scenarios

### Test 1: Enable/Disable Products
1. Login as tenant with only Platform subscription
2. Navigate to Subscriptions page
3. ✅ Should see only Platform plans
4. Enable Money Loan product
5. Refresh Subscriptions page
6. ✅ Should now see Money Loan plans + Platform plans
7. ✅ Money Loan subscription should appear on top

### Test 2: Multi-Product Filtering
1. Enable Money Loan + Pawnshop
2. ✅ Should see: Money Loan plans, Pawnshop plans, Platform plans
3. ❌ Should NOT see: BNPL plans
4. Disable Money Loan
5. ✅ Should see: Pawnshop plans, Platform plans
6. ❌ Should NOT see: Money Loan plans, BNPL plans

### Test 3: Subscription Display Order
1. Tenant with Money Loan + Pawnshop + Platform subscriptions
2. Active Subscriptions section should show:
   - Position 1: Money Loan (product)
   - Position 2: Pawnshop (product)
   - Position 3: Platform (last)

## Future Enhancements

1. **Product Recommendations**: Suggest related products based on current usage
2. **Plan Comparison**: Side-by-side comparison of product plans
3. **Bundle Discounts**: Show savings when multiple products enabled
4. **Usage Metrics**: Display product usage to help with plan decisions
5. **Upgrade Paths**: Suggest optimal upgrade paths based on products enabled

## Related Files

- `api/src/services/TenantService.js` - Backend subscription service
- `web/src/app/core/services/tenant.service.ts` - Frontend service interface
- `web/src/app/features/tenant/billing/tenant-subscriptions.component.ts` - Subscription display component
- `MULTI-SUBSCRIPTION-AUTO-SYNC.md` - Auto-sync architecture documentation

## Conclusion

This implementation creates a clean, product-focused subscription experience where tenants only see plans relevant to their enabled products. Product subscriptions are prominently displayed at the top, making it easy to identify active product-specific subscriptions before the platform subscription.
