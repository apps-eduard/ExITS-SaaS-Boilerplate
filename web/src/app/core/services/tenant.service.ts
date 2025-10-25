import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

export interface Tenant {
  id: number;
  name: string;
  subdomain: string;
  plan: string;
  status: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  max_users?: number;
  moneyLoanEnabled?: boolean;
  bnplEnabled?: boolean;
  pawnshopEnabled?: boolean;
  created_at: string;
}

export interface SubscriptionPlan {
  id: number;
  name: string;
  displayName: string;
  description: string;
  icon: string;
  price: number;
  billingCycle: string;
  productType?: string;
  maxUsers: number | null;
  maxStorageGb: number | null;
  features: string[];
  isActive: boolean;
  isRecommended: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ActiveSubscriptionsResponse {
  subscriptions: SubscriptionPlan[];
  enabledProducts: string[]; // ['money_loan', 'bnpl', 'pawnshop']
}

@Injectable({ providedIn: 'root' })
export class TenantService {
  private apiUrl = '/api/tenants'; // Adjust to your backend endpoint

  // Track active product subscriptions
  private activeProductSubscriptions = signal<Set<string>>(new Set());
  private enabledProducts = signal<Set<string>>(new Set());

  constructor(private http: HttpClient) {}

  createTenant(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/create`, payload);
  }

  getTenantById(id: number | string): Observable<{ success: boolean; data: Tenant }> {
    return this.http.get<{ success: boolean; data: Tenant }>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get current user's tenant (uses tenant_id from JWT token)
   * This works for tenant users who don't have system-level permissions
   */
  getMyTenant(): Observable<{ success: boolean; data: Tenant }> {
    return this.http.get<{ success: boolean; data: Tenant }>(`${this.apiUrl}/current`);
  }

  /**
   * Get active subscriptions for current tenant
   * Returns both platform and product subscriptions + enabled products list
   */
  getMyActiveSubscriptions(): Observable<{ success: boolean; data: ActiveSubscriptionsResponse | SubscriptionPlan[] }> {
    return this.http.get<{ success: boolean; data: ActiveSubscriptionsResponse | SubscriptionPlan[] }>(`${this.apiUrl}/current/subscriptions`)
      .pipe(
        tap(response => {
          // Update active subscriptions cache
          if (response.success && response.data) {
            let subscriptions: SubscriptionPlan[];
            let enabledProductsList: string[];
            
            if (Array.isArray(response.data)) {
              subscriptions = response.data;
              enabledProductsList = [];
            } else {
              subscriptions = response.data.subscriptions || [];
              enabledProductsList = response.data.enabledProducts || [];
            }
            
            // Extract product types with active subscriptions
            const activeProducts = subscriptions
              .filter(s => s.productType && s.productType !== 'platform')
              .map(s => s.productType!);
            
            this.activeProductSubscriptions.set(new Set(activeProducts));
            this.enabledProducts.set(new Set(enabledProductsList));
            
            console.log('✅ Active product subscriptions:', activeProducts);
            console.log('✅ Enabled products:', enabledProductsList);
          }
        })
      );
  }

  /**
   * Check if tenant has an active subscription for a product
   * @param productType - Product type (e.g., "money_loan", "bnpl", "pawnshop")
   */
  hasActiveSubscription(productType: string): boolean {
    return this.activeProductSubscriptions().has(productType);
  }

  /**
   * Check if a product is enabled for the tenant (by admin)
   * @param productType - Product type (e.g., "money_loan", "bnpl", "pawnshop")
   */
  isProductEnabled(productType: string): boolean {
    return this.enabledProducts().has(productType);
  }

  /**
   * Check if tenant can access a product (enabled AND subscribed)
   * @param productType - Product type (e.g., "money_loan", "bnpl", "pawnshop")
   */
  canAccessProduct(productType: string): boolean {
    return this.isProductEnabled(productType) && this.hasActiveSubscription(productType);
  }

  /**
   * Get all available subscription plans (Platform only)
   */
  getSubscriptionPlans(): Observable<{ success: boolean; data: SubscriptionPlan[]; count: number }> {
    return this.http.get<{ success: boolean; data: SubscriptionPlan[]; count: number }>(`/api/subscription-plans`);
  }

  /**
   * Get ALL subscription plans including product-specific plans (Money Loan, BNPL, Pawnshop)
   */
  getAllSubscriptionPlans(): Observable<{ success: boolean; data: SubscriptionPlan[]; count: number }> {
    return this.http.get<{ success: boolean; data: SubscriptionPlan[]; count: number }>(`/api/subscription-plans/all/including-products`);
  }

  /**
   * Create or update subscription for current tenant
   */
  createSubscription(planId: number, billingCycle: string, paymentMethod: string): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/current/subscribe`, {
      planId,
      billingCycle,
      paymentMethod
    });
  }

  /**
   * Get payment history for current tenant
   */
  getPaymentHistory(filters: {
    dateRange?: string;
    transactionType?: string;
    status?: string;
    page?: number;
    limit?: number;
  } = {}): Observable<any> {
    const params: any = {};
    
    if (filters.dateRange && filters.dateRange !== 'all') {
      params.dateRange = filters.dateRange;
    }
    if (filters.transactionType && filters.transactionType !== 'all') {
      params.transactionType = filters.transactionType;
    }
    if (filters.status && filters.status !== 'all') {
      params.status = filters.status;
    }
    if (filters.page) {
      params.page = filters.page;
    }
    if (filters.limit) {
      params.limit = filters.limit;
    }

    return this.http.get<any>(`${this.apiUrl}/current/payment-history`, { params });
  }
}
