import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { Loan, LoanOverview, RepaymentSchedule, LoanPayment } from '../models/loan.models';
import { LoanCalculationPreview, LoanCalculationRequest } from '../models/loan-calculation.model';

@Injectable({
  providedIn: 'root'
})
export class LoanService {
  private http = inject(HttpClient);
  private baseUrl = '/api/money-loan'; // NestJS route with /api prefix

  // ==================== LOAN PRODUCTS ====================

  getLoanProducts(tenantId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/products`);
  }

  createLoanProduct(tenantId: string, productData: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/products`, productData);
  }

  updateLoanProduct(tenantId: string, productId: number, productData: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/products/${productId}`, productData);
  }

  deleteLoanProduct(tenantId: string, productId: number): Observable<any> {
    return this.http.delete(`${this.baseUrl}/products/${productId}`);
  }

  // ==================== LOANS ====================

  createLoan(loanData: any): Observable<{ success: boolean; message: string; data: Loan }> {
    return this.http.post<{ success: boolean; message: string; data: Loan }>(
      `${this.baseUrl}/loans`,
      loanData
    );
  }

  // Admin endpoint - requires tenantId
  listLoans(tenantId: string, filters?: {
    page?: number;
    limit?: number;
    status?: string;
    customerId?: number;
    search?: string;
  }): Observable<{ success: boolean; message: string; data: Loan[]; pagination: any }> {
    return this.http.get<{ success: boolean; message: string; data: Loan[]; pagination: any }>(
      `${this.baseUrl}/loans`,
      { params: filters as any }
    );
  }

  // Customer endpoint - get loans for specific customer
  listCustomerLoans(tenantId: string, customerId: number, filters?: {
    page?: number;
    limit?: number;
    status?: string;
  }): Observable<{ success: boolean; message: string; data: Loan[]; pagination: any }> {
    return this.http.get<{ success: boolean; message: string; data: Loan[]; pagination: any }>(
      `${this.baseUrl}/customers/${customerId}/loans`,
      { params: filters as any }
    );
  }

  getLoanById(loanId: number): Observable<{ success: boolean; data: Loan }> {
    return this.http.get<{ success: boolean; data: Loan }>(
      `${this.baseUrl}/loans/${loanId}`
    );
  }

  getLoanOverview(): Observable<{ success: boolean; data: LoanOverview }> {
    return this.http.get<{ success: boolean; data: LoanOverview }>(
      `${this.baseUrl}/loans/overview`
    );
  }

  updateLoanStatus(loanId: number, status: string): Observable<{ success: boolean; message: string; data: Loan }> {
    return this.http.put<{ success: boolean; message: string; data: Loan }>(
      `${this.baseUrl}/loans/${loanId}/status`,
      { status }
    );
  }

  // ==================== REPAYMENT SCHEDULE ====================

  getRepaymentSchedule(loanId: number): Observable<{ success: boolean; data: RepaymentSchedule[] }> {
    return this.http.get<{ success: boolean; data: RepaymentSchedule[] }>(
      `${this.baseUrl}/loans/${loanId}/schedule`
    );
  }

  getPaymentHistory(loanId: number): Observable<{ success: boolean; data: LoanPayment[] }> {
    return this.http.get<{ success: boolean; data: LoanPayment[] }>(
      `${this.baseUrl}/loans/${loanId}/payments`
    );
  }

  // ==================== PAYMENTS ====================

  recordPayment(paymentData: {
    loanId: number;
    amount: number;
    paymentMethod: string;
    paymentDate?: string;
    transactionId?: string;
    notes?: string;
  }): Observable<{ success: boolean; message: string; data: LoanPayment }> {
    const { loanId, transactionId, paymentDate, ...rest } = paymentData;
    const payload = {
      loanId, // Include loanId in payload for DTO validation
      ...rest,
      reference: transactionId, // Map transactionId to reference
    };
    return this.http.post<{ success: boolean; message: string; data: LoanPayment }>(
      `${this.baseUrl}/loans/${loanId}/payments`,
      payload
    );
  }

  getTodayCollections(): Observable<{ success: boolean; data: any }> {
    return this.http.get<{ success: boolean; data: any }>(
      `${this.baseUrl}/payments/today`
    );
  }

  // ==================== LOAN PREVIEW ====================

  calculateLoanPreview(payload: LoanCalculationRequest): Observable<LoanCalculationPreview> {
    return this.http
      .post<{ success: boolean; data: LoanCalculationPreview }>(
        `${this.baseUrl}/calculate`,
        payload
      )
      .pipe(map(response => response.data));
  }

  calculateCustomerLoanPreview(payload: LoanCalculationRequest): Observable<LoanCalculationPreview> {
    return this.http
      .post<{ success: boolean; data: LoanCalculationPreview }>(
        `/api/customers/auth/loan-preview`,
        payload
      )
      .pipe(map(response => response.data));
  }
}
