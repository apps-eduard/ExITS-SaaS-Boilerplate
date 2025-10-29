import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  billingCycle: string;  // camelCase from Knex
  features: string[];
  platformType?: 'platform' | 'money_loan' | 'bnpl' | 'pawnshop' | null;  // camelCase from Knex - changed from productType
}

export interface PlatformSubscription {  // Renamed from ProductSubscription
  id: number;
  tenantId: number;  // camelCase from Knex
  platformType: 'money_loan' | 'bnpl' | 'pawnshop';  // camelCase from Knex - changed from productType
  subscriptionPlanId: number;  // camelCase from Knex
  subscriptionPlan?: SubscriptionPlan;  // camelCase from Knex
  price: number;
  billingCycle: 'monthly' | 'yearly';  // camelCase from Knex
  status: 'active' | 'suspended' | 'cancelled' | 'expired';
  startsAt: string;  // camelCase from Knex
  expiresAt: string | null;  // camelCase from Knex
  createdAt: string;  // camelCase from Knex
}

export interface SubscribeToPlatformRequest {  // Renamed from SubscribeToProductRequest
  platformType: 'money_loan' | 'bnpl' | 'pawnshop';  // Changed to camelCase
  subscriptionPlanId: number;  // Changed to camelCase
  billingCycle: 'monthly' | 'yearly';  // Changed to camelCase
  startsAt?: string;  // Changed to camelCase
}

@Injectable({
  providedIn: 'root'
})
export class ProductSubscriptionService {
  private http = inject(HttpClient);
  private apiUrl = '/api/platform-subscriptions';

  /**
   * Get available subscription plans
   */
  getSubscriptionPlans(): Observable<{ success: boolean; data: SubscriptionPlan[] }> {
    return this.http.get<{ success: boolean; data: SubscriptionPlan[] }>('/api/subscriptions/plans');
  }

  /**
   * Get ALL subscription plans including product-specific plans
   * Used for admin panel when editing tenants
   */
  getAllSubscriptionPlans(): Observable<{ success: boolean; data: SubscriptionPlan[] }> {
    return this.http.get<{ success: boolean; data: SubscriptionPlan[] }>('/api/subscriptions/plans/all/including-products');
  }

  /**
   * Get all platform subscriptions for a tenant
   */
  getTenantProductSubscriptions(tenantId: number): Observable<{ success: boolean; data: PlatformSubscription[] }> {
    return this.http.get<{ success: boolean; data: PlatformSubscription[] }>(
      `${this.apiUrl}/tenant/${tenantId}`
    );
  }

  /**
   * Subscribe a tenant to a platform
   */
  subscribeToProduct(
    tenantId: number,
    data: SubscribeToPlatformRequest
  ): Observable<{ success: boolean; data: PlatformSubscription; message: string }> {
    return this.http.post<{ success: boolean; data: PlatformSubscription; message: string }>(
      `${this.apiUrl}/tenant/${tenantId}/subscribe`,
      data
    );
  }

  /**
   * Unsubscribe from a platform
   */
  unsubscribeFromProduct(
    tenantId: number,
    platformType: 'money_loan' | 'bnpl' | 'pawnshop'
  ): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/tenant/${tenantId}/unsubscribe/${platformType}`
    );
  }

  /**
   * Update a platform subscription
   */
  updateProductSubscription(
    tenantId: number,
    platformType: 'money_loan' | 'bnpl' | 'pawnshop',
    updateData: Partial<{
      subscriptionPlanId: number;  // Changed to camelCase
      billingCycle: 'monthly' | 'yearly';  // Changed to camelCase
      price: number;
      expiresAt: string;  // Changed to camelCase
    }>
  ): Observable<{ success: boolean; data: PlatformSubscription; message: string }> {
    return this.http.put<{ success: boolean; data: PlatformSubscription; message: string }>(
      `${this.apiUrl}/tenant/${tenantId}/product/${platformType}`,
      updateData
    );
  }

  /**
   * Get platform subscription details for a specific platform
   */
  getProductSubscription(
    tenantId: number,
    platformType: 'money_loan' | 'bnpl' | 'pawnshop'
  ): Observable<{ success: boolean; data: PlatformSubscription | null }> {
    return this.http.get<{ success: boolean; data: PlatformSubscription | null }>(
      `${this.apiUrl}/tenant/${tenantId}/product/${platformType}`
    );
  }
}
