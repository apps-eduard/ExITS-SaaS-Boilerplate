import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Loan, LoanOverview, RepaymentSchedule, LoanPayment } from '../models/loan.models';

@Injectable({
  providedIn: 'root'
})
export class LoanService {
  private http = inject(HttpClient);
  private apiUrl = '/api/money-loan';

  // ==================== LOAN PRODUCTS ====================

  getLoanProducts(tenantId: string): Observable<any> {
    return this.http.get(`/api/tenants/${tenantId}/platforms/moneyloan/loans/products`);
  }

  createLoanProduct(tenantId: string, productData: any): Observable<any> {
    return this.http.post(`/api/tenants/${tenantId}/platforms/moneyloan/loans/products`, productData);
  }

  updateLoanProduct(tenantId: string, productId: number, productData: any): Observable<any> {
    return this.http.put(`/api/tenants/${tenantId}/platforms/moneyloan/loans/products/${productId}`, productData);
  }

  deleteLoanProduct(tenantId: string, productId: number): Observable<any> {
    return this.http.delete(`/api/tenants/${tenantId}/platforms/moneyloan/loans/products/${productId}`);
  }

  // ==================== LOANS ====================

  createLoan(loanData: any): Observable<{ success: boolean; message: string; data: Loan }> {
    return this.http.post<{ success: boolean; message: string; data: Loan }>(
      `${this.apiUrl}/loans`,
      loanData
    );
  }

  listLoans(filters?: {
    page?: number;
    limit?: number;
    status?: string;
    customerId?: number;
    search?: string;
  }): Observable<{ success: boolean; message: string; data: Loan[]; pagination: any }> {
    return this.http.get<{ success: boolean; message: string; data: Loan[]; pagination: any }>(
      `${this.apiUrl}/loans`,
      { params: filters as any }
    );
  }

  getLoanById(loanId: number): Observable<{ success: boolean; data: Loan }> {
    return this.http.get<{ success: boolean; data: Loan }>(
      `${this.apiUrl}/loans/${loanId}`
    );
  }

  getLoanOverview(): Observable<{ success: boolean; data: LoanOverview }> {
    return this.http.get<{ success: boolean; data: LoanOverview }>(
      `${this.apiUrl}/loans/overview`
    );
  }

  updateLoanStatus(loanId: number, status: string): Observable<{ success: boolean; message: string; data: Loan }> {
    return this.http.put<{ success: boolean; message: string; data: Loan }>(
      `${this.apiUrl}/loans/${loanId}/status`,
      { status }
    );
  }

  // ==================== REPAYMENT SCHEDULE ====================

  getRepaymentSchedule(loanId: number): Observable<{ success: boolean; data: RepaymentSchedule[] }> {
    return this.http.get<{ success: boolean; data: RepaymentSchedule[] }>(
      `${this.apiUrl}/loans/${loanId}/schedule`
    );
  }

  getPaymentHistory(loanId: number): Observable<{ success: boolean; data: LoanPayment[] }> {
    return this.http.get<{ success: boolean; data: LoanPayment[] }>(
      `${this.apiUrl}/loans/${loanId}/payments`
    );
  }

  // ==================== PAYMENTS ====================

  recordPayment(paymentData: {
    loanId: number;
    amount: number;
    paymentMethod: string;
    paymentDate: string;
    transactionId?: string;
    notes?: string;
  }): Observable<{ success: boolean; message: string; data: LoanPayment }> {
    return this.http.post<{ success: boolean; message: string; data: LoanPayment }>(
      `${this.apiUrl}/payments`,
      paymentData
    );
  }

  getTodayCollections(): Observable<{ success: boolean; data: any }> {
    return this.http.get<{ success: boolean; data: any }>(
      `${this.apiUrl}/payments/today`
    );
  }
}
