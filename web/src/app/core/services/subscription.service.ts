import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface SubscriptionPlan {
  id: number;
  name: string;
  description: string;
  price: number;
  billing_cycle: 'monthly' | 'yearly' | 'lifetime';
  features: string[];
  max_users: number | null;
  max_storage_gb: number | null;
  status: 'active' | 'inactive' | 'archived';
  created_at: string;
  updated_at: string;
}

export interface SubscriptionPlansResponse {
  success: boolean;
  data: SubscriptionPlan[];
  message?: string;
}

@Injectable({
  providedIn: 'root'
})
export class SubscriptionService {
  private apiUrl = '/api/subscriptions';

  constructor(private http: HttpClient) {}

  /**
   * Get all available subscription plans
   */
  getPlans(): Observable<SubscriptionPlansResponse> {
    return this.http.get<SubscriptionPlansResponse>(`${this.apiUrl}/plans`);
  }

  /**
   * Get a specific plan by ID
   */
  getPlan(id: number): Observable<{ success: boolean; data: SubscriptionPlan }> {
    return this.http.get<{ success: boolean; data: SubscriptionPlan }>(`${this.apiUrl}/plans/${id}`);
  }

  /**
   * Get plan by name (useful for selecting default plans)
   */
  getPlanByName(name: string): Observable<{ success: boolean; data: SubscriptionPlan }> {
    return this.http.get<{ success: boolean; data: SubscriptionPlan }>(`${this.apiUrl}/plans/by-name/${name}`);
  }
}
