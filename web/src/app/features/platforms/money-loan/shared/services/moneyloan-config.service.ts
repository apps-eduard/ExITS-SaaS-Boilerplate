import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MoneyloanConfigService {
  private http = inject(HttpClient);
  private getApiUrl(tenantId: string) {
    return `/api/tenants/${tenantId}/platforms/moneyloan/config`;
  }

  // ==================== INTEREST RATES ====================

  getInterestRates(tenantId: string, loanProductId: string): Observable<any> {
    return this.http.get(`${this.getApiUrl(tenantId)}/interest-rates/${loanProductId}`);
  }

  createInterestRate(tenantId: string, loanProductId: string, data: any): Observable<any> {
    return this.http.post(`${this.getApiUrl(tenantId)}/interest-rates/${loanProductId}`, data);
  }

  updateInterestRate(tenantId: string, loanProductId: string, configId: number, data: any): Observable<any> {
    return this.http.put(`${this.getApiUrl(tenantId)}/interest-rates/${loanProductId}/${configId}`, data);
  }

  deleteInterestRate(tenantId: string, loanProductId: string, configId: number): Observable<any> {
    return this.http.delete(`${this.getApiUrl(tenantId)}/interest-rates/${loanProductId}/${configId}`);
  }

  // ==================== PAYMENT SCHEDULES ====================

  getPaymentSchedules(tenantId: string, loanProductId: string): Observable<any> {
    return this.http.get(`${this.getApiUrl(tenantId)}/payment-schedules/${loanProductId}`);
  }

  createPaymentSchedule(tenantId: string, loanProductId: string, data: any): Observable<any> {
    return this.http.post(`${this.getApiUrl(tenantId)}/payment-schedules/${loanProductId}`, data);
  }

  updatePaymentSchedule(tenantId: string, loanProductId: string, configId: number, data: any): Observable<any> {
    return this.http.put(`${this.getApiUrl(tenantId)}/payment-schedules/${loanProductId}/${configId}`, data);
  }

  // ==================== FEE STRUCTURES ====================

  getFeeStructures(tenantId: string, loanProductId: string): Observable<any> {
    return this.http.get(`${this.getApiUrl(tenantId)}/fees/${loanProductId}`);
  }

  createFeeStructure(tenantId: string, loanProductId: string, data: any): Observable<any> {
    return this.http.post(`${this.getApiUrl(tenantId)}/fees/${loanProductId}`, data);
  }

  updateFeeStructure(tenantId: string, loanProductId: string, configId: number, data: any): Observable<any> {
    return this.http.put(`${this.getApiUrl(tenantId)}/fees/${loanProductId}/${configId}`, data);
  }

  // ==================== APPROVAL RULES ====================

  getApprovalRules(tenantId: string, loanProductId: string): Observable<any> {
    return this.http.get(`${this.getApiUrl(tenantId)}/approval-rules/${loanProductId}`);
  }

  createApprovalRule(tenantId: string, loanProductId: string, data: any): Observable<any> {
    return this.http.post(`${this.getApiUrl(tenantId)}/approval-rules/${loanProductId}`, data);
  }

  updateApprovalRule(tenantId: string, loanProductId: string, configId: number, data: any): Observable<any> {
    return this.http.put(`${this.getApiUrl(tenantId)}/approval-rules/${loanProductId}/${configId}`, data);
  }

  // ==================== LOAN MODIFICATIONS ====================

  getLoanModifications(tenantId: string, loanProductId: string): Observable<any> {
    return this.http.get(`${this.getApiUrl(tenantId)}/modifications/${loanProductId}`);
  }

  createLoanModification(tenantId: string, loanProductId: string, data: any): Observable<any> {
    return this.http.post(`${this.getApiUrl(tenantId)}/modifications/${loanProductId}`, data);
  }

  updateLoanModification(tenantId: string, loanProductId: string, configId: number, data: any): Observable<any> {
    return this.http.put(`${this.getApiUrl(tenantId)}/modifications/${loanProductId}/${configId}`, data);
  }

  deleteLoanModification(tenantId: string, loanProductId: string, configId: number): Observable<any> {
    return this.http.delete(`${this.getApiUrl(tenantId)}/modifications/${loanProductId}/${configId}`);
  }

  getActiveLoanModification(tenantId: string, loanProductId: string): Observable<any> {
    return this.http.get(`${this.getApiUrl(tenantId)}/modifications/${loanProductId}/active`);
  }
}
