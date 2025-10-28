import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MoneyloanApplicationService {
  private http = inject(HttpClient);
  private getApiUrl(tenantId: string) {
    return `/api/tenants/${tenantId}/platforms/moneyloan/loans`;
  }

  // ==================== LOAN APPLICATIONS ====================

  getApplications(tenantId: string, filters?: any): Observable<any> {
    return this.http.get(`${this.getApiUrl(tenantId)}/applications`, { params: filters });
  }

  getApplication(tenantId: string, applicationId: number): Observable<any> {
    return this.http.get(`${this.getApiUrl(tenantId)}/applications/${applicationId}`);
  }

  createApplication(tenantId: string, data: any): Observable<any> {
    return this.http.post(`${this.getApiUrl(tenantId)}/applications`, data);
  }

  updateApplication(tenantId: string, applicationId: number, data: any): Observable<any> {
    return this.http.put(`${this.getApiUrl(tenantId)}/applications/${applicationId}`, data);
  }

  approveApplication(tenantId: string, applicationId: number, data: any): Observable<any> {
    return this.http.post(`${this.getApiUrl(tenantId)}/applications/${applicationId}/approve`, data);
  }

  rejectApplication(tenantId: string, applicationId: number, data: any): Observable<any> {
    return this.http.post(`${this.getApiUrl(tenantId)}/applications/${applicationId}/reject`, data);
  }

  // ==================== LOAN OPERATIONS ====================

  disburseLoan(tenantId: string, loanId: number, data: any): Observable<any> {
    return this.http.post(`${this.getApiUrl(tenantId)}/${loanId}/disburse`, data);
  }

  getLoan(tenantId: string, loanId: number): Observable<any> {
    return this.http.get(`${this.getApiUrl(tenantId)}/${loanId}`);
  }

  getCustomerLoans(tenantId: string, customerId: string): Observable<any> {
    return this.http.get(`${this.getApiUrl(tenantId)}/customers/${customerId}/loans`);
  }

  getProductLoans(tenantId: string, productId: string): Observable<any> {
    return this.http.get(`${this.getApiUrl(tenantId)}/products/${productId}/loans`);
  }

  getLoansWithFilters(tenantId: string, filters?: any): Observable<any> {
    return this.http.get(this.getApiUrl(tenantId), { params: filters });
  }

  closeLoan(tenantId: string, loanId: number, data: any): Observable<any> {
    return this.http.post(`${this.getApiUrl(tenantId)}/${loanId}/close`, data);
  }

  suspendLoan(tenantId: string, loanId: number, data: any): Observable<any> {
    return this.http.post(`${this.getApiUrl(tenantId)}/${loanId}/suspend`, data);
  }

  resumeLoan(tenantId: string, loanId: number, data: any): Observable<any> {
    return this.http.post(`${this.getApiUrl(tenantId)}/${loanId}/resume`, data);
  }

  getLoansDashboard(tenantId: string): Observable<any> {
    return this.http.get(`${this.getApiUrl(tenantId)}/dashboard`);
  }
}
