import { Injectable, inject, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';

export interface PlanFeature {
  featureKey: string;
  featureName: string;
  featureValue: string | boolean;
  enabled: boolean;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  billingCycle: string;
  features: string[];
  maxUsers: number | null;
  maxStorageGb: number | null;
  trialDays: number;
  isFeatured: boolean;
  customPricing: boolean;
  status: string;
}

export interface UsageInfo {
  currentCount: number;
  maxCount: number | null;
  remaining: number;
  percentage: number;
  unlimited: boolean;
}

/**
 * Feature Gate Service
 * Manages subscription plan features and usage limits
 * Maintains camelCase convention throughout
 */
@Injectable({
  providedIn: 'root'
})
export class FeatureGateService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);

  // Tenant's current subscription plan
  currentPlan = signal<SubscriptionPlan | null>(null);

  // Feature cache (camelCase keys)
  private tenantFeatures = signal<Map<string, PlanFeature>>(new Map());

  // Loading state
  isLoading = signal(false);

  /**
   * Load tenant's subscription plan and features
   */
  async loadTenantPlan(): Promise<void> {
    const tenantId = this.authService.currentUser()?.tenantId;
    if (!tenantId) {
      console.warn('⚠️ No tenant ID found, skipping plan load');
      return;
    }

    this.isLoading.set(true);

    try {
      // Load active subscription
      const response = await this.http
        .get<{ success: boolean; data: any }>(
          `/api/tenants/${tenantId}/subscription`
        )
        .toPromise();

      if (response?.success && response.data) {
        // Transform to camelCase
        const plan: SubscriptionPlan = {
          id: response.data.id,
          name: response.data.name,
          description: response.data.description,
          price: parseFloat(response.data.price),
          billingCycle: response.data.billing_cycle,
          features: response.data.features || [],
          maxUsers: response.data.max_users,
          maxStorageGb: response.data.max_storage_gb,
          trialDays: response.data.trial_days || 0,
          isFeatured: response.data.is_featured || false,
          customPricing: response.data.custom_pricing || false,
          status: response.data.status
        };

        this.currentPlan.set(plan);
        console.log('✅ Subscription plan loaded:', plan.name);
      }
    } catch (error) {
      console.error('❌ Failed to load subscription plan:', error);
    } finally {
      this.isLoading.set(false);
    }
  }

  /**
   * Load plan features from plan_features table (fine-grained control)
   */
  async loadPlanFeatures(): Promise<void> {
    const plan = this.currentPlan();
    if (!plan) {
      console.warn('⚠️ No plan loaded, cannot load features');
      return;
    }

    try {
      const response = await this.http
        .get<{ success: boolean; data: any[] }>(
          `/api/subscriptions/plans/${plan.id}/features`
        )
        .toPromise();

      if (response?.success && response.data) {
        const featureMap = new Map<string, PlanFeature>();
        
        response.data.forEach((feature: any) => {
          featureMap.set(feature.feature_key, {
            featureKey: feature.feature_key,
            featureName: feature.feature_name,
            featureValue: feature.feature_value,
            enabled: feature.enabled
          });
        });

        this.tenantFeatures.set(featureMap);
        console.log(`✅ Loaded ${featureMap.size} plan features`);
      }
    } catch (error) {
      console.error('❌ Failed to load plan features:', error);
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
   * Get feature value (for usage limits, config values)
   */
  getFeatureValue(featureKey: string): string | boolean | null {
    const feature = this.tenantFeatures().get(featureKey);
    return feature?.featureValue ?? null;
  }

  /**
   * Get current user count for tenant
   */
  async getCurrentUserCount(): Promise<number> {
    const tenantId = this.authService.currentUser()?.tenantId;
    if (!tenantId) return 0;

    try {
      const response = await this.http
        .get<{ success: boolean; data: { count: number } }>(
          `/api/tenants/${tenantId}/users/count`
        )
        .toPromise();

      return response?.data?.count || 0;
    } catch (error) {
      console.error('Failed to get user count:', error);
      return 0;
    }
  }

  /**
   * Get usage information for user limit
   */
  async getUserUsageInfo(): Promise<UsageInfo> {
    const plan = this.currentPlan();
    const currentCount = await this.getCurrentUserCount();
    
    if (!plan || plan.maxUsers === null) {
      return {
        currentCount,
        maxCount: null,
        remaining: 0,
        percentage: 0,
        unlimited: true
      };
    }

    const remaining = Math.max(0, plan.maxUsers - currentCount);
    const percentage = plan.maxUsers > 0 
      ? Math.min((currentCount / plan.maxUsers) * 100, 100)
      : 0;

    return {
      currentCount,
      maxCount: plan.maxUsers,
      remaining,
      percentage,
      unlimited: false
    };
  }

  /**
   * Check if user limit is reached
   */
  async isUserLimitReached(): Promise<boolean> {
    const usage = await this.getUserUsageInfo();
    return !usage.unlimited && usage.remaining <= 0;
  }

  /**
   * Check if approaching user limit (>80%)
   */
  async isApproachingUserLimit(): Promise<boolean> {
    const usage = await this.getUserUsageInfo();
    return !usage.unlimited && usage.percentage >= 80;
  }

  /**
   * Get formatted user limit display
   */
  async getUserLimitDisplay(): Promise<string> {
    const usage = await this.getUserUsageInfo();
    
    if (usage.unlimited) {
      return `${usage.currentCount} users (Unlimited)`;
    }
    
    return `${usage.currentCount} / ${usage.maxCount} users (${usage.remaining} remaining)`;
  }

  // ============================================================================
  // COMPUTED SIGNALS FOR COMMON FEATURES
  // ============================================================================

  /**
   * Check if API access is enabled
   */
  canAccessAPI = computed(() => {
    const plan = this.currentPlan();
    return plan?.name === 'Professional' || plan?.name === 'Enterprise';
  });

  /**
   * Check if custom branding is enabled
   */
  canCustomBrand = computed(() => {
    const plan = this.currentPlan();
    return plan?.name === 'Professional' || plan?.name === 'Enterprise';
  });

  /**
   * Check if advanced analytics is enabled
   */
  canAccessAdvancedAnalytics = computed(() => {
    const plan = this.currentPlan();
    return plan?.name === 'Professional' || plan?.name === 'Enterprise';
  });

  /**
   * Check if phone support is available
   */
  hasPhoneSupport = computed(() => {
    const plan = this.currentPlan();
    return plan?.name === 'Professional' || plan?.name === 'Enterprise';
  });

  /**
   * Check if currently on trial
   */
  isOnTrial = computed(() => {
    const plan = this.currentPlan();
    return plan?.name === 'Trial' && (plan?.trialDays || 0) > 0;
  });

  /**
   * Check if plan has custom pricing
   */
  hasCustomPricing = computed(() => {
    const plan = this.currentPlan();
    return plan?.customPricing === true;
  });

  /**
   * Get max users allowed
   */
  maxUsers = computed(() => {
    const plan = this.currentPlan();
    return plan?.maxUsers ?? 0;
  });

  /**
   * Get max storage in GB
   */
  maxStorageGB = computed(() => {
    const plan = this.currentPlan();
    return plan?.maxStorageGb ?? 0;
  });

  /**
   * Get trial days remaining (simplified - would need subscription start date)
   */
  trialDays = computed(() => {
    const plan = this.currentPlan();
    return plan?.trialDays ?? 0;
  });

  /**
   * Check if plan is featured/recommended
   */
  isFeaturedPlan = computed(() => {
    const plan = this.currentPlan();
    return plan?.isFeatured === true;
  });

  /**
   * Get plan display name with badge
   */
  planDisplayName = computed(() => {
    const plan = this.currentPlan();
    if (!plan) return 'No Plan';
    
    if (plan.isFeatured) {
      return `⭐ ${plan.name}`;
    }
    
    if (plan.name === 'Trial') {
      return `🎁 ${plan.name}`;
    }
    
    return plan.name;
  });

  /**
   * Get billing cycle display
   */
  billingCycleDisplay = computed(() => {
    const plan = this.currentPlan();
    if (!plan) return '';
    
    const cycleMap: Record<string, string> = {
      'monthly': 'per month',
      'yearly': 'per year',
      'quarterly': 'per quarter',
      'lifetime': 'one-time'
    };
    
    return cycleMap[plan.billingCycle] || plan.billingCycle;
  });

  /**
   * Get price display with currency
   */
  priceDisplay = computed(() => {
    const plan = this.currentPlan();
    if (!plan) return '$0.00';
    
    if (plan.customPricing) {
      return 'Contact Sales';
    }
    
    if (plan.price === 0) {
      return 'Free';
    }
    
    return `$${plan.price.toFixed(2)}`;
  });

  /**
   * Get full price display with billing cycle
   */
  fullPriceDisplay = computed(() => {
    const price = this.priceDisplay();
    const cycle = this.billingCycleDisplay();
    
    if (price === 'Free' || price === 'Contact Sales') {
      return price;
    }
    
    return `${price} ${cycle}`;
  });
}
