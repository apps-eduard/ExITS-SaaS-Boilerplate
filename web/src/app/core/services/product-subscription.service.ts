import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  billing_cycle: string;
  features: string[];
  productType?: 'platform' | 'money_loan' | 'bnpl' | 'pawnshop' | null;
}

export interface ProductSubscription {
  id: number;
  tenant_id: number;
  product_type: 'money_loan' | 'bnpl' | 'pawnshop';
  subscription_plan_id: number;
  subscription_plan?: SubscriptionPlan;
  price: number;
  billing_cycle: 'monthly' | 'yearly';
  status: 'active' | 'suspended' | 'cancelled' | 'expired';
  starts_at: string;
  expires_at: string | null;
  created_at: string;
}

export interface SubscribeToProductRequest {
  product_type: 'money_loan' | 'bnpl' | 'pawnshop';
  subscription_plan_id: number;
  billing_cycle: 'monthly' | 'yearly';
  starts_at?: string;
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
   * Get all product subscriptions for a tenant
   */
  getTenantProductSubscriptions(tenantId: number): Observable<{ success: boolean; data: ProductSubscription[] }> {
    return this.http.get<{ success: boolean; data: ProductSubscription[] }>(
      `${this.apiUrl}/tenant/${tenantId}`
    );
  }

  /**
   * Subscribe a tenant to a product
   */
  subscribeToProduct(
    tenantId: number,
    data: SubscribeToProductRequest
  ): Observable<{ success: boolean; data: ProductSubscription; message: string }> {
    return this.http.post<{ success: boolean; data: ProductSubscription; message: string }>(
      `${this.apiUrl}/tenant/${tenantId}/subscribe`,
      data
    );
  }

  /**
   * Unsubscribe from a product
   */
  unsubscribeFromProduct(
    tenantId: number,
    productType: 'money_loan' | 'bnpl' | 'pawnshop'
  ): Observable<{ success: boolean; message: string }> {
    return this.http.delete<{ success: boolean; message: string }>(
      `${this.apiUrl}/tenant/${tenantId}/unsubscribe/${productType}`
    );
  }

  /**
   * Update a product subscription
   */
  updateProductSubscription(
    tenantId: number,
    productType: 'money_loan' | 'bnpl' | 'pawnshop',
    updateData: Partial<{
      subscription_plan_id: number;
      billing_cycle: 'monthly' | 'yearly';
      price: number;
      expires_at: string;
    }>
  ): Observable<{ success: boolean; data: ProductSubscription; message: string }> {
    return this.http.put<{ success: boolean; data: ProductSubscription; message: string }>(
      `${this.apiUrl}/tenant/${tenantId}/product/${productType}`,
      updateData
    );
  }

  /**
   * Get product subscription details for a specific product
   */
  getProductSubscription(
    tenantId: number,
    productType: 'money_loan' | 'bnpl' | 'pawnshop'
  ): Observable<{ success: boolean; data: ProductSubscription | null }> {
    return this.http.get<{ success: boolean; data: ProductSubscription | null }>(
      `${this.apiUrl}/tenant/${tenantId}/product/${productType}`
    );
  }
}
