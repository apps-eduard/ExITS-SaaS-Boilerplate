import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

export interface PaymentMethod {
  id: string;
  type: 'card' | 'bank' | 'gcash' | 'bank_transfer';
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  bankName?: string;
  accountName?: string;
  phoneNumber?: string;
  isDefault: boolean;
}

export interface AvailablePaymentMethod {
  id: number;
  name: string;
  display_name: string;
  description: string;
  is_active: boolean;
}

export interface BillingOverview {
  currentBalance: number;
  nextBillingDate: string | null;
  nextBillingAmount: number;
  lastPaymentDate: string | null;
  lastPaymentAmount: number;
  paymentMethod: PaymentMethod | null;
  autoRenewal: boolean;
  subscriptionStatus?: string;
  planName?: string | null;
  billingCycle?: string;
  lastInvoiceNumber?: string | null;
}

export interface BillingInfo {
  companyName: string;
  taxId: string | null;
  email: string;
  address: string;
}

export interface Transaction {
  id: string;
  description: string;
  date: string;
  amount: number;
  status: string;
  invoiceNumber: string;
}

@Injectable({
  providedIn: 'root'
})
export class BillingService {
  private http = inject(HttpClient);
  private apiUrl = '/api/tenants';

  /**
   * Get billing overview for current tenant
   */
  getBillingOverview(): Observable<BillingOverview> {
    return this.http.get<BillingOverview>(`${this.apiUrl}/current/billing/overview`)
      .pipe(
        catchError(error => {
          console.error('Error fetching billing overview:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get billing information
   */
  getBillingInfo(): Observable<BillingInfo> {
    return this.http.get<BillingInfo>(`${this.apiUrl}/current/billing/info`)
      .pipe(
        catchError(error => {
          console.error('Error fetching billing info:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get recent transactions
   */
  getRecentTransactions(limit: number = 5): Observable<{transactions: Transaction[]}> {
    return this.http.get<{transactions: Transaction[]}>(`/api/payment-history/invoices`, {
      params: { limit: limit.toString() }
    })
      .pipe(
        catchError(error => {
          console.error('Error fetching recent transactions:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Update billing information
   */
  updateBillingInfo(data: Partial<BillingInfo>): Observable<{success: boolean; message: string}> {
    return this.http.put<{success: boolean; message: string}>(`${this.apiUrl}/current/billing/info`, data)
      .pipe(
        catchError(error => {
          console.error('Error updating billing info:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Update auto-renewal setting
   */
  updateAutoRenewal(enabled: boolean): Observable<{success: boolean; message: string}> {
    return this.http.put<{success: boolean; message: string}>(`${this.apiUrl}/current/billing/auto-renewal`, {
      enabled
    })
      .pipe(
        catchError(error => {
          console.error('Error updating auto-renewal:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get all available payment methods
   */
  getAvailablePaymentMethods(): Observable<{success: boolean; data: AvailablePaymentMethod[]}> {
    return this.http.get<{success: boolean; data: AvailablePaymentMethod[]}>('/api/billing/payment-methods')
      .pipe(
        catchError(error => {
          console.error('Error fetching available payment methods:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get tenant's current payment method
   */
  getTenantPaymentMethod(): Observable<{success: boolean; data: any}> {
    return this.http.get<{success: boolean; data: any}>('/api/billing/tenants/current/payment-method')
      .pipe(
        catchError(error => {
          console.error('Error fetching tenant payment method:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Update tenant's payment method
   */
  updatePaymentMethod(paymentMethodId: number, details: any): Observable<{success: boolean; message: string; data: any}> {
    return this.http.put<{success: boolean; message: string; data: any}>('/api/billing/tenants/current/payment-method', {
      paymentMethodId,
      details
    })
      .pipe(
        catchError(error => {
          console.error('Error updating payment method:', error);
          return throwError(() => error);
        })
      );
  }
}
