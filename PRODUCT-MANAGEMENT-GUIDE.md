# 🎯 Product Management Guide

## Overview
This guide explains how product selection and management works in the ExITS SaaS Boilerplate.

---

## 🚀 Product Selection During Registration

### Available Products
The system offers **3 products** that users can select during registration:

| Product | Icon | Description | Feature Flag |
|---------|------|-------------|--------------|
| **Money Loan** | 💵 | Quick cash loans with flexible terms | `money_loan_enabled` |
| **BNPL** | 💳 | Buy Now Pay Later installment plans | `bnpl_enabled` |
| **Pawnshop** | 💎 | Collateral-based loans and valuations | `pawnshop_enabled` |

### Registration Flow

#### Step 1: Admin Information
- User enters admin account details (name, email, password)

#### Step 2: Organization Details
- User enters tenant/organization information
- Contact person fields are auto-filled from admin data

#### Step 3: Feature Selection ⭐
- User sees 3 product cards (Money Loan, BNPL, Pawnshop)
- Click any card to toggle selection
- Selected products are highlighted
- Users can select multiple products

#### Step 4: Complete Registration
- System sends tenant creation payload with product flags:
  ```json
  {
    "money_loan_enabled": true,
    "bnpl_enabled": false,
    "pawnshop_enabled": true,
    ...
  }
  ```

### Code Location
- **Component**: `web/src/app/features/signup/signup.component.ts`
- **Feature Selection UI**: Step 3 in `signup.component.html`
- **Toggle Method**: `toggleFeature(featureId: string)`
- **API Payload**: `completeSignup()` method

---

## ⚙️ Product Management After Registration

### Tenant Settings → Product Config

After registration, administrators can manage products in **Tenant Settings**:

1. Navigate to: **Settings** → **Tenant Settings** → **Product Config** tab

2. **Active Products Section**
   - Shows 3 product cards (Money Loan, BNPL, Pawnshop)
   - Each card has an enable/disable toggle switch
   - Visual indicator: Enabled products have colored background
   - Real-time toggle functionality

3. **Product Configuration Rules Section**
   - Configure specific rules for each product
   - Only visible when product is enabled
   - Product-specific settings:

#### Money Loan Rules
- Interest Rate (%)
- Maximum Loan Amount
- Minimum Loan Amount
- Maximum Term (months)

#### BNPL Rules
- Maximum Installments
- Processing Fee (%)
- Late Payment Fee
- Grace Period (days)

#### Pawnshop Rules
- Valuation Formula
- Storage Fee (per month)
- Redemption Period (days)
- Interest Rate (%/month)

### Code Location
- **Component**: `web/src/app/features/admin/tenants/settings/tenant-settings.component.ts`
- **Product Settings Signal**: `productSettings()`
- **Toggle Method**: `toggleProduct(product: string)`
- **Tab ID**: `'products'` in sections array

---

## 🔄 Product Enablement Flow

### During Registration
```
User selects features → Features stored in selectedFeatures array → 
Signup payload includes flags → Backend creates tenant with enabled products
```

### Post-Registration
```
Admin opens Tenant Settings → Product Config tab → 
Toggle product switches → API updates tenant record → 
Products enabled/disabled in real-time
```

---

## 💡 Key Features

✅ **Multi-Product Support**: Select and manage 3 different products
✅ **Visual Selection**: Card-based UI with clear selection states
✅ **Toggle Controls**: Easy enable/disable with switch components
✅ **Product-Specific Config**: Each product has its own configuration rules
✅ **Real-time Updates**: Product settings update immediately
✅ **Persistence**: Product selections saved to tenant record

---

## 🎨 UI Components

### Product Card Design
- **Enabled State**: Primary color background (blue/green tint)
- **Disabled State**: Gray/neutral background
- **Toggle Switch**: Material Design style toggle
- **Visual Feedback**: Hover effects and smooth transitions

### Product Selection (Registration)
```html
<!-- 3-column grid of selectable product cards -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-6">
  <div *ngFor="let feature of features" 
       (click)="toggleFeature(feature.id)"
       [class.selected]="feature.selected">
    <!-- Product icon, title, description -->
  </div>
</div>
```

### Product Management (Settings)
```html
<!-- 3-column grid with toggle switches -->
<div class="grid grid-cols-1 md:grid-cols-3 gap-4">
  <div class="product-card">
    <label class="toggle-switch">
      <input type="checkbox" [checked]="productSettings().money_loan_enabled">
      <span>Enabled/Disabled</span>
    </label>
  </div>
</div>
```

---

## 🔧 Backend Integration

### API Endpoints

#### Create Tenant (Registration)
```
POST /api/tenants
Body: {
  name: "Organization Name",
  money_loan_enabled: true,
  bnpl_enabled: true,
  pawnshop_enabled: false,
  ...
}
```

#### Update Product Settings
```
PATCH /api/tenants/:tenantId/products
Body: {
  money_loan_enabled: true,
  bnpl_enabled: false,
  pawnshop_enabled: true
}
```

### Database Schema
```sql
CREATE TABLE tenants (
  id UUID PRIMARY KEY,
  name VARCHAR(255),
  money_loan_enabled BOOLEAN DEFAULT false,
  bnpl_enabled BOOLEAN DEFAULT false,
  pawnshop_enabled BOOLEAN DEFAULT false,
  ...
);
```

---

## 📋 Implementation Checklist

### ✅ Completed
- [x] Product selection UI in registration (Step 3)
- [x] 3 products available (Money Loan, BNPL, Pawnshop)
- [x] Toggle functionality for product selection
- [x] Product flags in signup payload (`money_loan_enabled`, `bnpl_enabled`, `pawnshop_enabled`)
- [x] Product Config tab in Tenant Settings
- [x] Enable/disable toggle switches for each product
- [x] Visual indicators for enabled/disabled state
- [x] Product-specific configuration rules

### 🔄 Pending (Backend)
- [ ] API endpoint to update product settings
- [ ] Database migration to add `pawnshop_enabled` column (if not exists)
- [ ] Validation logic for product-specific rules
- [ ] Product enablement audit logging

---

## 🎯 Usage Example

### For End Users (Registration)
1. Go to `/signup`
2. Fill in admin information (Step 1)
3. Fill in organization details (Step 2)
4. **Select products** you want to use (Step 3)
   - Click Money Loan card → Selected ✓
   - Click BNPL card → Selected ✓
   - Skip Pawnshop → Not selected
5. Complete registration (Step 4)

### For Administrators (Settings)
1. Login as admin
2. Navigate to **Settings** → **Tenant Settings**
3. Click **Product Config** tab
4. Toggle switches to enable/disable products:
   - Money Loan: ON ✓
   - BNPL: ON ✓
   - Pawnshop: OFF
5. Configure product-specific rules below
6. Click **Save Changes**

---

## 🚨 Important Notes

- **Default State**: Products selected during registration are enabled by default
- **Product Dependencies**: Disabling a product will hide related features in the app
- **Permissions**: Only Super Admin and Tenant Admin can manage products
- **Validation**: Backend should validate product enablement before allowing transactions
- **Audit Trail**: All product setting changes should be logged for compliance

---

## 📞 Support

If you have questions about product management:
1. Check this guide first
2. Review the code in `signup.component.ts` and `tenant-settings.component.ts`
3. Test the flow: Registration → Login → Settings → Product Config
4. Contact development team for backend API integration

---

**Last Updated**: 2024
**Version**: 1.0
