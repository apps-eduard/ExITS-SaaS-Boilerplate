# 📋 Professional Plan Templates Guide

**Last Updated:** 2025  
**Purpose:** Comprehensive guide to creating and managing professional SaaS subscription plans

---

## 📚 Table of Contents

1. [Overview](#overview)
2. [Current Implementation Status](#current-implementation-status)
3. [Professional Plan Strategy](#professional-plan-strategy)
4. [Recommended Plan Structure](#recommended-plan-structure)
5. [Pricing Best Practices](#pricing-best-practices)
6. [Feature Gating Implementation](#feature-gating-implementation)
7. [Database Schema](#database-schema)
8. [Technical Implementation](#technical-implementation)
9. [Integration Checklist](#integration-checklist)
10. [Next Steps](#next-steps)

---

## 🎯 Overview

Your subscription system has a **solid foundation** with the following architecture:

### Current Stack
- **Frontend:** `plan-templates.component.ts` (430 lines, full CRUD)
- **Backend:** `SubscriptionController.js` (comprehensive API endpoints)
- **Database:** PostgreSQL with proper schema and indexes
- **Features:** Plans, subscriptions, invoices, payments, webhooks

### Subscription Types
1. **Platform Subscriptions** - Base tenant plans (trial, starter, pro, enterprise)
2. **Product-Specific Subscriptions** - Add-on modules (Money Loan, BNPL, Pawnshop)

---

## ✅ Current Implementation Status

### What's Working
✅ **CRUD Operations** - Create, read, update, delete plans  
✅ **Billing Cycles** - Monthly, yearly, lifetime  
✅ **Feature Storage** - JSONB array for plan features  
✅ **Usage Limits** - max_users, max_storage_gb  
✅ **Status Management** - Active, inactive, archived  
✅ **Subscriber Tracking** - Count active subscribers per plan  
✅ **Soft Delete** - Prevent deletion of plans with active subscribers  
✅ **Product Types** - Support for product-specific plans  
✅ **Webhook Infrastructure** - For payment gateway integration  

### What Needs Enhancement
🔄 **Feature Normalization** - Add `plan_features` table for fine-grained control  
🔄 **Trial Management** - Trial period configuration per plan  
🔄 **Currency Support** - Multi-currency pricing  
🔄 **Discount/Coupon System** - Promotional pricing  
🔄 **Usage Tracking** - Enforce plan limits in real-time  
🔄 **Feature Flags** - Dynamic feature enablement based on plan  
🔄 **Upgrade/Downgrade Logic** - Smooth migration between plans  
🔄 **Proration** - Calculate prorated charges for mid-cycle changes  

---

## 🏗️ Professional Plan Strategy

### The 4-Tier Framework

#### **Tier 1: Free/Trial** 🎁
**Purpose:** Attract and qualify leads, demonstrate value  
**Duration:** 14-30 days  
**Pricing:** $0  

**Characteristics:**
- Limited but functional feature set
- Generous trial period (14-30 days)
- No credit card required (lower barrier)
- Automatic email sequences to drive conversion
- Limited support (email only, 48-hour response)

**Use Case:**
```
Target: Small businesses testing the platform
Limits: 5 users, 10GB storage, 100 transactions/month
Features: Basic dashboard, core modules only
Support: Email (48-hour SLA)
Trial: 14 days
```

---

#### **Tier 2: Starter/Small Business** 🚀
**Purpose:** Entry-level paid tier for small teams  
**Pricing:** $29-$99/month  

**Characteristics:**
- Core features unlocked
- Reasonable usage limits for small teams
- Standard support (email + chat)
- Perfect for 1-10 person teams
- Essential integrations

**Use Case:**
```
Target: Small businesses (1-10 users)
Limits: 25 users, 50GB storage, 1,000 transactions/month
Features: All core modules, basic reporting, email support
Support: Email + Chat (24-hour SLA)
Billing: Monthly or Yearly (-20%)
```

---

#### **Tier 3: Professional/Growth** 💼
**Purpose:** Mid-market businesses scaling operations  
**Pricing:** $99-$299/month  

**Characteristics:**
- Advanced features unlocked
- Higher usage limits
- Priority support (phone + email + chat)
- Advanced analytics and reporting
- API access
- Custom integrations

**Use Case:**
```
Target: Growing businesses (10-100 users)
Limits: 100 users, 200GB storage, 10,000 transactions/month
Features: All modules, advanced analytics, API access, custom reports
Support: Priority (12-hour SLA, phone support)
Billing: Monthly or Yearly (-25%)
Add-ons: Available (extra storage, users)
```

---

#### **Tier 4: Enterprise** 🏢
**Purpose:** Large organizations with custom needs  
**Pricing:** Custom (typically $500-$5,000+/month)  

**Characteristics:**
- Everything in Professional
- Unlimited or very high limits
- Dedicated account manager
- Custom SLA agreements
- On-premise deployment options
- Custom integrations and development
- White-label capabilities

**Use Case:**
```
Target: Large enterprises (100+ users)
Limits: Unlimited users, 1TB+ storage, unlimited transactions
Features: Everything + custom development, white-label, SSO, dedicated infrastructure
Support: 24/7 dedicated support team (4-hour SLA)
Billing: Annual contract, custom pricing
Add-ons: Custom development, training, onboarding
```

---

## 💰 Pricing Best Practices

### 1. Value-Based Pricing
**Don't compete on price alone** - focus on ROI and value delivered.

```
Bad:  "Our plan is cheaper than competitors"
Good: "Save 15 hours/week with automated workflows"
```

### 2. Anchor Pricing
Use the **Professional tier as your anchor** - most customers should choose this.

```
Starter:      $49/month  (20% of customers)
Professional: $149/month ← ANCHOR (60% of customers)
Enterprise:   $499/month (20% of customers)
```

### 3. Annual Discount Strategy
Offer **20-30% discount** for annual billing to improve cash flow.

```
Monthly:  $99/month  = $1,188/year
Yearly:   $79/month  = $948/year (Save $240 = 20% off)
```

### 4. Psychological Pricing
Use **charm pricing** (ending in 9) for perceived value.

```
Better: $49, $99, $149
Avoid:  $50, $100, $150
```

### 5. Transparent Pricing
**No hidden fees** - customers should know exact costs.

```
✅ Show all costs upfront
✅ Explain overage charges clearly
✅ Provide pricing calculator
✅ Transparent upgrade/downgrade policy
```

### 6. Usage-Based Components
Combine **base fee + usage** for scalability.

```
Base Plan:   $99/month (includes 100 users)
Extra Users: $2/user/month for 101-500
             $1/user/month for 501+
```

---

## 🎯 Recommended Plan Structure

### Base Platform Plans

```sql
-- Trial Plan (Free)
INSERT INTO subscription_plans (
  name, 
  description, 
  price, 
  billing_cycle, 
  features, 
  max_users, 
  max_storage_gb,
  status,
  trial_days
) VALUES (
  'Trial',
  '14-day free trial - Experience all core features with limited usage',
  0.00,
  'monthly',
  '["📊 Basic Dashboard", "👥 5 Team Members", "💾 10GB Storage", "📧 Email Support (48h)", "📱 Mobile Access", "🔒 SSL Security"]',
  5,
  10,
  'active',
  14
);

-- Starter Plan
INSERT INTO subscription_plans (
  name, 
  description, 
  price, 
  billing_cycle, 
  features, 
  max_users, 
  max_storage_gb,
  status
) VALUES (
  'Starter',
  'Perfect for small teams getting started',
  49.99,
  'monthly',
  '["📊 Full Dashboard", "👥 25 Team Members", "💾 50GB Storage", "📧 Priority Email Support (24h)", "💬 Live Chat Support", "📱 Mobile Access", "🔒 SSL Security", "📈 Basic Analytics", "🔄 Daily Backups"]',
  25,
  50,
  'active'
);

-- Professional Plan (RECOMMENDED - Anchor)
INSERT INTO subscription_plans (
  name, 
  description, 
  price, 
  billing_cycle, 
  features, 
  max_users, 
  max_storage_gb,
  status,
  is_featured
) VALUES (
  'Professional',
  'Advanced features for growing businesses - Most Popular! 🌟',
  149.99,
  'monthly',
  '["📊 Advanced Dashboard", "👥 100 Team Members", "💾 200GB Storage", "📧 Priority Support (12h)", "💬 Live Chat Support", "📞 Phone Support", "📱 Mobile Access", "🔒 SSL Security", "📈 Advanced Analytics", "🔄 Hourly Backups", "🔌 API Access", "🎨 Custom Branding", "📊 Custom Reports", "🔔 Advanced Notifications", "🌐 Multi-language Support"]',
  100,
  200,
  'active',
  true -- Mark as featured/recommended
);

-- Enterprise Plan
INSERT INTO subscription_plans (
  name, 
  description, 
  price, 
  billing_cycle, 
  features, 
  max_users, 
  max_storage_gb,
  status,
  custom_pricing
) VALUES (
  'Enterprise',
  'Custom solutions for large organizations',
  999.99,
  'monthly',
  '["✨ Everything in Professional", "👥 Unlimited Users", "💾 1TB Storage", "📧 24/7 Dedicated Support (4h SLA)", "🎯 Dedicated Account Manager", "💬 Priority Chat & Phone", "📱 Mobile Access", "🔒 Advanced Security (SSO, 2FA)", "📈 Advanced Analytics + Custom Dashboards", "🔄 Real-time Backups", "🔌 API Access + Webhooks", "🎨 White-label Options", "📊 Custom Reports + Data Export", "🔔 Advanced Notifications", "🌐 Multi-language Support", "🛠️ Custom Integrations", "🎓 Priority Training & Onboarding", "📄 Custom SLA"]',
  NULL, -- Unlimited
  1000,
  'active',
  true -- Contact sales for pricing
);
```

### Product Add-On Plans

```sql
-- Money Loan Module - Basic
INSERT INTO subscription_plans (
  name, 
  description, 
  price, 
  billing_cycle, 
  features, 
  product_type,
  status
) VALUES (
  'Money Loan - Basic',
  'Core loan management features for small lending operations',
  79.99,
  'monthly',
  '["💰 Loan Applications", "📝 Basic Underwriting", "💳 Payment Processing", "📊 Basic Reports", "📧 Email Notifications", "👥 Up to 100 active loans"]',
  'money_loan',
  'active'
);

-- Money Loan Module - Professional
INSERT INTO subscription_plans (
  name, 
  description, 
  price, 
  billing_cycle, 
  features, 
  product_type,
  status,
  is_featured
) VALUES (
  'Money Loan - Professional',
  'Advanced loan management with automation - Recommended 🌟',
  149.99,
  'monthly',
  '["💰 Loan Applications", "📝 Advanced Underwriting + Credit Scoring", "💳 Payment Processing + Auto-debit", "📊 Advanced Reports + Analytics", "📧 Email + SMS Notifications", "🤖 Automated Workflows", "📈 Risk Analysis", "🔄 Collections Management", "👥 Up to 500 active loans", "🔌 API Access"]',
  'money_loan',
  'active',
  true
);

-- Money Loan Module - Enterprise
INSERT INTO subscription_plans (
  name, 
  description, 
  price, 
  billing_cycle, 
  features, 
  product_type,
  status
) VALUES (
  'Money Loan - Enterprise',
  'Complete lending platform with custom features',
  299.99,
  'monthly',
  '["✨ Everything in Professional", "💰 Unlimited Loans", "📝 Custom Underwriting Rules", "💳 Multi-currency Support", "📊 Custom Reports + Dashboards", "🤖 Advanced Automation", "📈 Predictive Analytics + ML", "🔄 Advanced Collections + Recovery", "🔌 Full API Access + Webhooks", "🎨 White-label Options", "👥 Dedicated Support"]',
  'money_loan',
  'active'
);
```

---

## 🔒 Feature Gating Implementation

### Step 1: Define Feature Keys

Create a **standardized feature key system** in your database:

```sql
-- Add to plan_features table
INSERT INTO plan_features (plan_id, feature_key, feature_name, feature_value, enabled) VALUES
-- Trial Plan Features
(1, 'dashboard_basic', 'Basic Dashboard Access', 'true', true),
(1, 'users_max', 'Maximum Users', '5', true),
(1, 'storage_max_gb', 'Maximum Storage', '10', true),
(1, 'analytics_basic', 'Basic Analytics', 'true', true),
(1, 'support_email', 'Email Support', '48h', true),

-- Starter Plan Features
(2, 'dashboard_full', 'Full Dashboard Access', 'true', true),
(2, 'users_max', 'Maximum Users', '25', true),
(2, 'storage_max_gb', 'Maximum Storage', '50', true),
(2, 'analytics_basic', 'Basic Analytics', 'true', true),
(2, 'support_email', 'Email Support', '24h', true),
(2, 'support_chat', 'Live Chat Support', 'true', true),
(2, 'mobile_access', 'Mobile App Access', 'true', true),

-- Professional Plan Features (Recommended)
(3, 'dashboard_advanced', 'Advanced Dashboard', 'true', true),
(3, 'users_max', 'Maximum Users', '100', true),
(3, 'storage_max_gb', 'Maximum Storage', '200', true),
(3, 'analytics_advanced', 'Advanced Analytics', 'true', true),
(3, 'support_email', 'Email Support', '12h', true),
(3, 'support_chat', 'Live Chat Support', 'true', true),
(3, 'support_phone', 'Phone Support', 'true', true),
(3, 'api_access', 'API Access', 'true', true),
(3, 'custom_branding', 'Custom Branding', 'true', true),
(3, 'custom_reports', 'Custom Report Builder', 'true', true),
(3, 'mobile_access', 'Mobile App Access', 'true', true),

-- Enterprise Plan Features
(4, 'dashboard_advanced', 'Advanced Dashboard', 'true', true),
(4, 'users_max', 'Maximum Users', 'unlimited', true),
(4, 'storage_max_gb', 'Maximum Storage', '1000', true),
(4, 'analytics_advanced', 'Advanced Analytics', 'true', true),
(4, 'support_24x7', '24/7 Dedicated Support', '4h', true),
(4, 'api_access', 'Full API Access', 'unlimited', true),
(4, 'custom_branding', 'White-label Branding', 'true', true),
(4, 'custom_integrations', 'Custom Integrations', 'true', true),
(4, 'sso_enabled', 'Single Sign-On (SSO)', 'true', true),
(4, 'dedicated_manager', 'Account Manager', 'true', true),
(4, 'mobile_access', 'Mobile App Access', 'true', true);
```

### Step 2: Create Feature Check Service

```typescript
// web/src/app/core/services/feature-gate.service.ts
import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';

export interface PlanFeature {
  feature_key: string;
  feature_name: string;
  feature_value: string | boolean;
  enabled: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class FeatureGateService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  // Feature cache
  private tenantFeatures = signal<Map<string, PlanFeature>>(new Map());

  /**
   * Load tenant's plan features from subscription
   */
  async loadTenantFeatures(): Promise<void> {
    const tenantId = this.authService.currentUser()?.tenant_id;
    if (!tenantId) return;

    const response = await this.http
      .get<{ success: boolean; data: PlanFeature[] }>(
        `/api/tenants/${tenantId}/features`
      )
      .toPromise();

    if (response?.success && response.data) {
      const featureMap = new Map<string, PlanFeature>();
      response.data.forEach(feature => {
        featureMap.set(feature.feature_key, feature);
      });
      this.tenantFeatures.set(featureMap);
    }
  }

  /**
   * Check if a feature is enabled
   */
  hasFeature(featureKey: string): boolean {
    const feature = this.tenantFeatures().get(featureKey);
    return feature?.enabled === true;
  }

  /**
   * Get feature value (for usage limits, etc.)
   */
  getFeatureValue(featureKey: string): string | boolean | null {
    const feature = this.tenantFeatures().get(featureKey);
    return feature?.feature_value ?? null;
  }

  /**
   * Check if usage limit is exceeded
   */
  isWithinLimit(featureKey: string, currentUsage: number): boolean {
    const limit = this.getFeatureValue(featureKey);
    
    if (limit === 'unlimited') return true;
    if (typeof limit === 'string') {
      const numericLimit = parseInt(limit, 10);
      return !isNaN(numericLimit) && currentUsage <= numericLimit;
    }
    
    return false;
  }

  /**
   * Get usage percentage (for progress bars)
   */
  getUsagePercentage(featureKey: string, currentUsage: number): number {
    const limit = this.getFeatureValue(featureKey);
    
    if (limit === 'unlimited') return 0;
    if (typeof limit === 'string') {
      const numericLimit = parseInt(limit, 10);
      if (!isNaN(numericLimit) && numericLimit > 0) {
        return Math.min((currentUsage / numericLimit) * 100, 100);
      }
    }
    
    return 0;
  }

  /**
   * Computed signals for common checks
   */
  canAccessAPI = computed(() => this.hasFeature('api_access'));
  canCustomBrand = computed(() => this.hasFeature('custom_branding'));
  canAccessAdvancedAnalytics = computed(() => this.hasFeature('analytics_advanced'));
  canAccessMobileApp = computed(() => this.hasFeature('mobile_access'));

  maxUsers = computed(() => {
    const value = this.getFeatureValue('users_max');
    if (value === 'unlimited') return Infinity;
    if (typeof value === 'string') {
      const num = parseInt(value, 10);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  });

  maxStorageGB = computed(() => {
    const value = this.getFeatureValue('storage_max_gb');
    if (value === 'unlimited') return Infinity;
    if (typeof value === 'string') {
      const num = parseInt(value, 10);
      return isNaN(num) ? 0 : num;
    }
    return 0;
  });
}
```

### Step 3: Usage in Components

```typescript
// Example: Disable API access button if not in plan
import { Component, inject, computed } from '@angular/core';
import { FeatureGateService } from '@core/services/feature-gate.service';

@Component({
  selector: 'app-settings',
  template: `
    <div class="settings-section">
      <h3>API Access</h3>
      
      @if (featureGate.canAccessAPI()) {
        <button (click)="generateAPIKey()">
          Generate API Key
        </button>
        <p class="text-sm text-gray-600">
          You have full API access with your {{ currentPlan() }} plan.
        </p>
      } @else {
        <div class="upgrade-prompt">
          <p class="text-sm text-gray-500">
            ⚠️ API access is not available on your current plan.
          </p>
          <button (click)="openUpgradeModal()" class="btn-primary">
            Upgrade to Professional
          </button>
        </div>
      }
    </div>

    <!-- Usage Limits Display -->
    <div class="usage-section">
      <h3>Usage Limits</h3>
      
      <div class="usage-item">
        <span>Team Members</span>
        <div class="usage-bar">
          <div 
            class="usage-fill" 
            [style.width.%]="userUsagePercent()"
            [class.warning]="userUsagePercent() > 80"
          ></div>
        </div>
        <span class="usage-text">
          {{ currentUserCount() }} / {{ featureGate.maxUsers() }}
          @if (featureGate.maxUsers() === Infinity) {
            <span class="badge">Unlimited</span>
          }
        </span>
      </div>

      <div class="usage-item">
        <span>Storage</span>
        <div class="usage-bar">
          <div 
            class="usage-fill" 
            [style.width.%]="storageUsagePercent()"
            [class.warning]="storageUsagePercent() > 80"
          ></div>
        </div>
        <span class="usage-text">
          {{ currentStorageGB() }}GB / {{ featureGate.maxStorageGB() }}GB
        </span>
      </div>
    </div>
  `,
  standalone: true
})
export class SettingsComponent {
  featureGate = inject(FeatureGateService);

  currentUserCount = signal(15);
  currentStorageGB = signal(32);
  currentPlan = signal('Professional');

  userUsagePercent = computed(() => 
    this.featureGate.getUsagePercentage('users_max', this.currentUserCount())
  );

  storageUsagePercent = computed(() => 
    this.featureGate.getUsagePercentage('storage_max_gb', this.currentStorageGB())
  );

  Infinity = Infinity;
}
```

### Step 4: Backend Enforcement

```javascript
// api/src/middleware/featureGate.js
const pool = require('../config/database');
const logger = require('../utils/logger');

/**
 * Middleware to check if tenant's plan includes a feature
 */
const requireFeature = (featureKey) => {
  return async (req, res, next) => {
    try {
      const tenantId = req.user?.tenant_id;
      
      if (!tenantId) {
        return res.status(403).json({
          success: false,
          message: 'Tenant context required'
        });
      }

      // Get tenant's active subscription plan features
      const result = await pool.query(
        `SELECT pf.feature_key, pf.enabled, pf.feature_value
         FROM tenant_subscriptions ts
         JOIN subscription_plans sp ON ts.plan_id = sp.id
         JOIN plan_features pf ON sp.id = pf.plan_id
         WHERE ts.tenant_id = $1 
           AND ts.status = 'active'
           AND pf.feature_key = $2
           AND pf.enabled = true
         LIMIT 1`,
        [tenantId, featureKey]
      );

      if (result.rows.length === 0) {
        logger.warn(`Feature gate blocked: ${featureKey} for tenant ${tenantId}`);
        return res.status(403).json({
          success: false,
          message: `This feature requires a plan upgrade. Feature: ${featureKey}`,
          upgrade_required: true,
          feature: featureKey
        });
      }

      // Attach feature to request for further checks
      req.planFeature = result.rows[0];
      next();
    } catch (err) {
      logger.error(`Feature gate error: ${err.message}`);
      next(err);
    }
  };
};

/**
 * Check usage limits
 */
const checkUsageLimit = (featureKey, getCurrentUsage) => {
  return async (req, res, next) => {
    try {
      const tenantId = req.user?.tenant_id;
      
      // Get plan limit
      const result = await pool.query(
        `SELECT pf.feature_value
         FROM tenant_subscriptions ts
         JOIN subscription_plans sp ON ts.plan_id = sp.id
         JOIN plan_features pf ON sp.id = pf.plan_id
         WHERE ts.tenant_id = $1 
           AND ts.status = 'active'
           AND pf.feature_key = $2
         LIMIT 1`,
        [tenantId, featureKey]
      );

      if (result.rows.length === 0) {
        return res.status(403).json({
          success: false,
          message: 'No active subscription found'
        });
      }

      const limit = result.rows[0].feature_value;
      
      // Unlimited check
      if (limit === 'unlimited') {
        return next();
      }

      // Get current usage
      const currentUsage = await getCurrentUsage(tenantId);
      const numericLimit = parseInt(limit, 10);

      if (isNaN(numericLimit) || currentUsage >= numericLimit) {
        return res.status(429).json({
          success: false,
          message: `Usage limit exceeded. Limit: ${limit}, Current: ${currentUsage}`,
          limit_exceeded: true,
          feature: featureKey,
          current_usage: currentUsage,
          limit: numericLimit
        });
      }

      next();
    } catch (err) {
      logger.error(`Usage limit check error: ${err.message}`);
      next(err);
    }
  };
};

module.exports = {
  requireFeature,
  checkUsageLimit
};
```

### Step 5: Apply to Routes

```javascript
// api/src/routes/api.js
const { requireFeature, checkUsageLimit } = require('../middleware/featureGate');

// Example: Protect API key generation
router.post('/settings/api-keys', 
  requireFeature('api_access'),
  SettingsController.generateAPIKey
);

// Example: Check user limit before creating user
router.post('/users',
  checkUsageLimit('users_max', async (tenantId) => {
    const result = await pool.query(
      'SELECT COUNT(*) as count FROM users WHERE tenant_id = $1 AND status = $2',
      [tenantId, 'active']
    );
    return parseInt(result.rows[0].count);
  }),
  UserController.createUser
);

// Example: Protect custom branding
router.put('/settings/branding',
  requireFeature('custom_branding'),
  SettingsController.updateBranding
);
```

---

## 📊 Database Schema

### Current Tables (Already Implemented)

```sql
✅ subscription_plans         -- Plan definitions
✅ plan_features              -- Normalized feature tracking
✅ tenant_subscriptions       -- Active tenant subscriptions
✅ invoices                   -- Billing invoices
✅ payment_history            -- Payment tracking
✅ payment_methods            -- Payment gateway methods
✅ webhook_events             -- Payment webhook handling
✅ product_subscriptions      -- Product-specific add-ons
```

### Schema Enhancements Needed

```sql
-- Add trial days to subscription_plans
ALTER TABLE subscription_plans 
ADD COLUMN trial_days INTEGER DEFAULT 0,
ADD COLUMN is_featured BOOLEAN DEFAULT false,
ADD COLUMN custom_pricing BOOLEAN DEFAULT false,
ADD COLUMN sort_order INTEGER DEFAULT 0;

-- Add proration support
ALTER TABLE tenant_subscriptions
ADD COLUMN previous_plan_id BIGINT REFERENCES subscription_plans(id),
ADD COLUMN proration_credit NUMERIC(10, 2) DEFAULT 0,
ADD COLUMN upgrade_date TIMESTAMPTZ,
ADD COLUMN downgrade_date TIMESTAMPTZ;

-- Add usage tracking
CREATE TABLE IF NOT EXISTS usage_tracking (
  id BIGSERIAL PRIMARY KEY,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  feature_key VARCHAR(100) NOT NULL,
  usage_count INTEGER DEFAULT 0,
  usage_date DATE NOT NULL DEFAULT CURRENT_DATE,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(tenant_id, feature_key, usage_date)
);

CREATE INDEX idx_usage_tracking_tenant ON usage_tracking(tenant_id);
CREATE INDEX idx_usage_tracking_feature ON usage_tracking(feature_key);
CREATE INDEX idx_usage_tracking_date ON usage_tracking(usage_date DESC);

-- Add discount/coupon system
CREATE TABLE IF NOT EXISTS discount_coupons (
  id BIGSERIAL PRIMARY KEY,
  code VARCHAR(50) UNIQUE NOT NULL,
  description TEXT,
  discount_type VARCHAR(20) NOT NULL CHECK (discount_type IN ('percentage', 'fixed_amount')),
  discount_value NUMERIC(10, 2) NOT NULL,
  max_uses INTEGER,
  uses_count INTEGER DEFAULT 0,
  valid_from TIMESTAMPTZ NOT NULL DEFAULT now(),
  valid_until TIMESTAMPTZ,
  applicable_plans JSONB DEFAULT '[]', -- Array of plan IDs or 'all'
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'expired')),
  created_at TIMESTAMPTZ DEFAULT now(),
  updated_at TIMESTAMPTZ DEFAULT now()
);

CREATE INDEX idx_discount_coupons_code ON discount_coupons(code);
CREATE INDEX idx_discount_coupons_status ON discount_coupons(status);

-- Track coupon usage
CREATE TABLE IF NOT EXISTS coupon_usage (
  id BIGSERIAL PRIMARY KEY,
  coupon_id BIGINT NOT NULL REFERENCES discount_coupons(id) ON DELETE CASCADE,
  tenant_id INTEGER NOT NULL REFERENCES tenants(id) ON DELETE CASCADE,
  subscription_id BIGINT REFERENCES tenant_subscriptions(id) ON DELETE SET NULL,
  discount_applied NUMERIC(10, 2) NOT NULL,
  used_at TIMESTAMPTZ DEFAULT now(),
  UNIQUE(coupon_id, tenant_id)
);

CREATE INDEX idx_coupon_usage_coupon ON coupon_usage(coupon_id);
CREATE INDEX idx_coupon_usage_tenant ON coupon_usage(tenant_id);
```

---

## 🔧 Technical Implementation

### Backend API Endpoints Needed

```javascript
// Add to api/src/controllers/SubscriptionController.js

/**
 * GET /subscriptions/tenant/:tenantId/features
 * Get all features for tenant's active subscription
 */
static async getTenantFeatures(req, res, next) {
  try {
    const { tenantId } = req.params;

    const result = await pool.query(
      `SELECT pf.feature_key, pf.feature_name, pf.feature_value, pf.enabled
       FROM tenant_subscriptions ts
       JOIN subscription_plans sp ON ts.plan_id = sp.id
       JOIN plan_features pf ON sp.id = pf.plan_id
       WHERE ts.tenant_id = $1 AND ts.status = 'active'
       ORDER BY pf.feature_key`,
      [tenantId]
    );

    res.status(200).json({
      success: true,
      data: result.rows
    });
  } catch (err) {
    logger.error(`Get tenant features error: ${err.message}`);
    next(err);
  }
}

/**
 * POST /subscriptions/validate-coupon
 * Validate a discount coupon
 */
static async validateCoupon(req, res, next) {
  try {
    const { code, plan_id } = req.body;

    const result = await pool.query(
      `SELECT id, code, discount_type, discount_value, applicable_plans, 
              max_uses, uses_count, valid_from, valid_until, status
       FROM discount_coupons
       WHERE UPPER(code) = UPPER($1) 
         AND status = 'active'
         AND (valid_until IS NULL OR valid_until > now())
         AND (max_uses IS NULL OR uses_count < max_uses)`,
      [code]
    );

    if (result.rows.length === 0) {
      return res.status(404).json({
        success: false,
        message: 'Invalid or expired coupon code'
      });
    }

    const coupon = result.rows[0];

    // Check if coupon applies to the selected plan
    const applicablePlans = coupon.applicable_plans || [];
    if (applicablePlans.length > 0 && applicablePlans[0] !== 'all') {
      if (!applicablePlans.includes(plan_id)) {
        return res.status(400).json({
          success: false,
          message: 'This coupon is not valid for the selected plan'
        });
      }
    }

    res.status(200).json({
      success: true,
      data: {
        id: coupon.id,
        code: coupon.code,
        discount_type: coupon.discount_type,
        discount_value: parseFloat(coupon.discount_value)
      },
      message: 'Coupon is valid'
    });
  } catch (err) {
    logger.error(`Validate coupon error: ${err.message}`);
    next(err);
  }
}

/**
 * POST /subscriptions/tenant/:tenantId/upgrade
 * Upgrade/downgrade tenant subscription
 */
static async changePlan(req, res, next) {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');

    const { tenantId } = req.params;
    const { new_plan_id, prorate } = req.body;

    // Get current subscription
    const currentSub = await client.query(
      `SELECT id, plan_id, start_date, end_date, status
       FROM tenant_subscriptions
       WHERE tenant_id = $1 AND status = 'active'
       ORDER BY created_at DESC
       LIMIT 1`,
      [tenantId]
    );

    if (currentSub.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'No active subscription found'
      });
    }

    const current = currentSub.rows[0];

    // Get new plan details
    const newPlan = await client.query(
      'SELECT id, name, price FROM subscription_plans WHERE id = $1',
      [new_plan_id]
    );

    if (newPlan.rows.length === 0) {
      await client.query('ROLLBACK');
      return res.status(404).json({
        success: false,
        message: 'New plan not found'
      });
    }

    // Calculate proration if requested
    let proratedCredit = 0;
    if (prorate) {
      // Simplified proration logic
      const oldPlan = await client.query(
        'SELECT price FROM subscription_plans WHERE id = $1',
        [current.plan_id]
      );

      // Calculate remaining days and credit
      const now = new Date();
      const endDate = new Date(current.end_date);
      const totalDays = 30; // Assuming monthly billing
      const remainingDays = Math.max(0, Math.ceil((endDate - now) / (1000 * 60 * 60 * 24)));
      
      const oldPrice = parseFloat(oldPlan.rows[0].price);
      const dailyRate = oldPrice / totalDays;
      proratedCredit = dailyRate * remainingDays;
    }

    // Update current subscription
    await client.query(
      `UPDATE tenant_subscriptions
       SET status = 'cancelled',
           end_date = now(),
           updated_at = now()
       WHERE id = $1`,
      [current.id]
    );

    // Create new subscription
    const newSub = await client.query(
      `INSERT INTO tenant_subscriptions 
       (tenant_id, plan_id, status, start_date, end_date, previous_plan_id, proration_credit)
       VALUES ($1, $2, 'active', now(), now() + interval '1 month', $3, $4)
       RETURNING id, tenant_id, plan_id, status, start_date, end_date, proration_credit`,
      [tenantId, new_plan_id, current.plan_id, proratedCredit]
    );

    await client.query('COMMIT');

    logger.info(`Tenant ${tenantId} changed plan from ${current.plan_id} to ${new_plan_id}`);

    res.status(200).json({
      success: true,
      data: newSub.rows[0],
      message: 'Subscription plan changed successfully'
    });
  } catch (err) {
    await client.query('ROLLBACK');
    logger.error(`Change plan error: ${err.message}`);
    next(err);
  } finally {
    client.release();
  }
}
```

---

## ✅ Integration Checklist

### Phase 1: Database Setup
- [ ] Run schema enhancements (trial_days, is_featured, etc.)
- [ ] Create usage_tracking table
- [ ] Create discount_coupons table
- [ ] Populate plan_features table with all plan features
- [ ] Insert professional plan templates
- [ ] Create product-specific add-on plans

### Phase 2: Backend Implementation
- [ ] Add getTenantFeatures endpoint
- [ ] Add validateCoupon endpoint
- [ ] Add changePlan (upgrade/downgrade) endpoint
- [ ] Create feature gate middleware
- [ ] Create usage limit middleware
- [ ] Apply middleware to protected routes
- [ ] Add usage tracking service

### Phase 3: Frontend Implementation
- [ ] Create FeatureGateService
- [ ] Update plan-templates component with new fields
- [ ] Add trial days configuration
- [ ] Add featured plan badge
- [ ] Create upgrade prompt components
- [ ] Add usage tracking dashboard
- [ ] Implement coupon validation UI
- [ ] Add plan comparison page

### Phase 4: RBAC Integration
- [ ] Connect feature gates to permission system
- [ ] Hide menu items based on plan features
- [ ] Show upgrade prompts for locked features
- [ ] Display usage limits in user settings

### Phase 5: Billing Integration
- [ ] Connect to Stripe/PayPal webhooks
- [ ] Implement subscription creation flow
- [ ] Implement upgrade/downgrade flow
- [ ] Add proration calculations
- [ ] Create invoice generation
- [ ] Add payment confirmation emails

### Phase 6: Testing & Validation
- [ ] Test all plan tiers
- [ ] Test feature gating
- [ ] Test usage limits
- [ ] Test upgrade/downgrade flows
- [ ] Test coupon system
- [ ] Test webhook handling
- [ ] Load test subscription queries

### Phase 7: Documentation
- [ ] Customer-facing plan comparison page
- [ ] Admin documentation for managing plans
- [ ] API documentation for integrations
- [ ] Upgrade/downgrade policy documentation

---

## 🚀 Next Steps

### Immediate Actions (Week 1)

1. **Enhance Database Schema**
   ```bash
   psql -U your_user -d your_database -f api/src/scripts/plan-enhancements.sql
   ```

2. **Populate Plan Templates**
   - Run the SQL inserts from "Recommended Plan Structure" section
   - Configure trial days, featured badges, pricing

3. **Create Feature Gate Service**
   - Copy FeatureGateService code to `web/src/app/core/services/`
   - Add to app providers

4. **Test Basic Feature Gating**
   - Pick one feature (e.g., API access)
   - Implement frontend check
   - Implement backend middleware
   - Test with different plans

### Medium-Term Actions (Month 1)

5. **Implement Usage Tracking**
   - Create usage_tracking table
   - Add tracking service
   - Display usage in dashboard

6. **Build Upgrade Flow**
   - Create upgrade modal component
   - Implement changePlan endpoint
   - Add payment gateway integration

7. **Add Coupon System**
   - Create discount_coupons table
   - Implement validation endpoint
   - Add coupon input to checkout

### Long-Term Actions (Quarter 1)

8. **Advanced Analytics**
   - Track plan conversion rates
   - Monitor upgrade/downgrade patterns
   - Identify feature usage by plan

9. **Automated Billing**
   - Recurring payment processing
   - Dunning (failed payment recovery)
   - Automatic suspension for non-payment

10. **Enterprise Features**
    - Custom contract management
    - Volume discounts
    - Multi-year commitments

---

## 📈 Success Metrics

Track these KPIs to measure subscription system health:

### Revenue Metrics
- **MRR (Monthly Recurring Revenue)** - Total monthly subscription revenue
- **ARR (Annual Recurring Revenue)** - MRR × 12
- **ARPU (Average Revenue Per User)** - Total revenue / Active subscribers
- **LTV (Lifetime Value)** - ARPU × Average subscription length

### Growth Metrics
- **New Subscriptions** - Monthly new subscribers
- **Churn Rate** - (Cancellations / Total subscribers) × 100
- **Upgrade Rate** - (Upgrades / Total subscribers) × 100
- **Downgrade Rate** - (Downgrades / Total subscribers) × 100

### Conversion Metrics
- **Trial Conversion Rate** - (Trial → Paid) / Total trials
- **Upgrade Conversion Rate** - (Starter → Pro) / Total starters
- **Feature Adoption Rate** - % using premium features

### Health Metrics
- **Customer Acquisition Cost (CAC)** - Marketing spend / New customers
- **LTV:CAC Ratio** - Should be > 3:1
- **Net Revenue Retention (NRR)** - Revenue from existing customers (including upgrades)

---

## 🎓 Resources & References

### Pricing Strategy
- **Book:** "Don't Just Roll the Dice" by Neil Davidson
- **Tool:** Price Intelligently - SaaS pricing research
- **Framework:** Van Westendorp Price Sensitivity Meter

### SaaS Billing Best Practices
- **Stripe Billing Documentation** - https://stripe.com/docs/billing
- **ChartMogul Blog** - SaaS metrics and analytics
- **ProfitWell** - Subscription analytics platform

### Feature Gating Patterns
- **LaunchDarkly** - Feature flag service (inspiration)
- **Unleash** - Open-source feature toggle system

---

## 📞 Support

For questions about implementing this guide:

1. **Check existing implementation** in `plan-templates.component.ts`
2. **Review database schema** in `billing-schema.sql`
3. **Test with existing plans** before creating new ones
4. **Start small** - implement one feature gate at a time

---

**Created:** 2025  
**Last Updated:** 2025  
**Version:** 1.0.0  
**Status:** ✅ Ready for Implementation
