import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
    return this.http.get<{ success: boolean; data: ActiveSubscriptionsResponse | SubscriptionPlan[] }>(`${this.apiUrl}/current/subscriptions`);
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
}
