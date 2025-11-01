import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MoneyloanApplicationService {
  private http = inject(HttpClient);
  private baseUrl = '/api/money-loan'; // NestJS route with /api prefix

  // ==================== LOAN APPLICATIONS ====================

  getApplications(tenantId: string, filters?: any): Observable<any> {
    return this.http.get(`${this.baseUrl}/applications`, { params: filters });
  }

  getApplication(tenantId: string, applicationId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/applications/${applicationId}`);
  }

  createApplication(tenantId: string, data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/applications`, data);
  }

  updateApplication(tenantId: string, applicationId: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/applications/${applicationId}`, data);
  }

  approveApplication(tenantId: string, applicationId: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/applications/${applicationId}/approve`, data);
  }

  rejectApplication(tenantId: string, applicationId: number, data: any): Observable<any> {
    return this.http.put(`${this.baseUrl}/applications/${applicationId}/reject`, data);
  }

  // ==================== LOAN OPERATIONS ====================

  disburseLoan(tenantId: string, loanId: number, data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/loans/${loanId}/disburse`, data);
  }

  getLoan(tenantId: string, loanId: number): Observable<any> {
    return this.http.get(`${this.baseUrl}/loans/${loanId}`);
  }

  getCustomerLoans(tenantId: string, customerId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/customers/${customerId}/loans`);
  }

  getProductLoans(tenantId: string, productId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/products/${productId}/loans`);
  }

  getLoansWithFilters(tenantId: string, filters?: any): Observable<any> {
    return this.http.get(`${this.baseUrl}/loans`, { params: filters });
  }

  closeLoan(tenantId: string, loanId: number, data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/loans/${loanId}/close`, data);
  }

  suspendLoan(tenantId: string, loanId: number, data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/loans/${loanId}/suspend`, data);
  }

  resumeLoan(tenantId: string, loanId: number, data: any): Observable<any> {
    return this.http.post(`${this.baseUrl}/loans/${loanId}/resume`, data);
  }

  getLoansDashboard(tenantId: string): Observable<any> {
    return this.http.get(`${this.baseUrl}/dashboard`);
  }
}
