// API Service - Generic HTTP client for all API calls
import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

interface QueryParams {
  [key: string]: string | number | boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  /**
   * Generic GET request
   */
  get<T>(endpoint: string, params?: QueryParams): Observable<T> {
    const httpParams = this.buildParams(params);
    return this.http.get<T>(`${this.apiUrl}/${endpoint}`, { params: httpParams });
  }

  /**
   * Generic POST request
   */
  post<T>(endpoint: string, body: any): Observable<T> {
    return this.http.post<T>(`${this.apiUrl}/${endpoint}`, body);
  }

  /**
   * Generic PUT request
   */
  put<T>(endpoint: string, body: any): Observable<T> {
    return this.http.put<T>(`${this.apiUrl}/${endpoint}`, body);
  }

  /**
   * Generic PATCH request
   */
  patch<T>(endpoint: string, body: any): Observable<T> {
    return this.http.patch<T>(`${this.apiUrl}/${endpoint}`, body);
  }

  /**
   * Generic DELETE request
   */
  delete<T>(endpoint: string): Observable<T> {
    return this.http.delete<T>(`${this.apiUrl}/${endpoint}`);
  }

  /**
   * Build HTTP params from object
   */
  private buildParams(params?: QueryParams): HttpParams {
    let httpParams = new HttpParams();
    if (params) {
      Object.keys(params).forEach((key) => {
        httpParams = httpParams.set(key, String(params[key]));
      });
    }
    return httpParams;
  }

  /**
   * Loan-specific API calls
   */
  getCustomerLoans(): Observable<any> {
    console.log(`🔵 API Call: GET ${this.apiUrl}/customers/auth/loans`);
    return this.get<any>('customers/auth/loans');
  }

  getLoanById(loanId: number | string): Observable<any> {
    return this.get<any>(`loans/${loanId}`);
  }

  makePayment(paymentData: any): Observable<any> {
    return this.post<any>('payments', paymentData);
  }

  /**
   * Collector-specific API calls
   */
  getCollectorRoute(collectorId: number | string): Observable<any[]> {
    return this.get<any[]>(`collectors/${collectorId}/route`);
  }

  recordVisit(visitData: any): Observable<any> {
    return this.post<any>('collectors/visits', visitData);
  }

  recordCollection(collectionData: any): Observable<any> {
    return this.post<any>('collectors/collections', collectionData);
  }

  /**
   * Customer API calls
   */
  getCustomerDashboard(): Observable<any> {
    return this.get<any>('customers/auth/dashboard');
  }

  getLoanDetails(loanId: number | string): Observable<any> {
    return this.get<any>(`customers/auth/loans/${loanId}`);
  }

  getPaymentHistory(loanId?: number | string): Observable<any> {
    const params = loanId ? `?loanId=${loanId}` : '';
    return this.get<any>(`customers/auth/payments${params}`);
  }

  getLoanProducts(tenantId?: string): Observable<any[]> {
    if (tenantId) {
      return this.get<any[]>(`loan-products/tenant/${tenantId}`);
    }
    return this.get<any[]>('loan-products');
  }

  applyForLoan(applicationData: any): Observable<any> {
    return this.post<any>('loan-applications', applicationData);
  }
}
