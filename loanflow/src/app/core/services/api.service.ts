// API Service - Generic HTTP client for all API calls
import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable } from 'rxjs';
import { map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';
import { AuthService } from './auth.service';
import { LoanCalculationPreview, LoanCalculationRequest } from '../models/loan-calculation.model';

interface QueryParams {
  [key: string]: string | number | boolean;
}

@Injectable({
  providedIn: 'root',
})
export class ApiService {
  private apiUrl = environment.apiUrl;
  private authService = inject(AuthService);

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

  getCustomerApplications(): Observable<any> {
    console.log(`🔵 API Call: GET ${this.apiUrl}/customers/auth/applications`);
    return this.get<any>('customers/auth/applications');
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
    // Use different endpoints based on user role
    const userRole = this.authService.userRole();
    
    if (userRole === 'customer') {
      return this.get<any>(`customers/auth/loans/${loanId}`);
    } else {
      // For collectors/employees, use the money-loan endpoint
      return this.get<any>(`money-loan/loans/${loanId}`);
    }
  }

  getLoanSchedule(loanId: number | string): Observable<any> {
    return this.get<any>(`money-loan/loans/${loanId}/schedule`);
  }

  recordPayment(loanId: number | string, paymentData: any): Observable<any> {
    return this.post<any>(`money-loan/loans/${loanId}/payments`, paymentData);
  }

  getApplicationDetails(applicationId: number | string): Observable<any> {
    return this.get<any>(`customers/auth/applications/${applicationId}`);
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

  calculateLoanPreview(payload: LoanCalculationRequest): Observable<LoanCalculationPreview> {
    const userRole = this.authService.userRole();
    const endpoint = userRole === 'customer'
      ? 'customers/auth/loan-preview'
      : 'money-loan/calculate';

    return this.post<any>(endpoint, payload).pipe(
      map((response: any) => response?.data || response)
    );
  }

  getPendingApplications(tenantId: string, customerId: number): Observable<any> {
    // Fetch ALL applications and loans for this customer
    // The frontend will filter which ones should block new applications
    // We need to get: submitted, approved, active, disbursed (exclude only completed, rejected)
    return this.get<any>(`tenants/${tenantId}/platforms/moneyloan/loans`, {
      customerId,
      status: 'submitted,approved,pending,active,disbursed', // Include active and disbursed loans
      limit: 100
    });
  }

  checkHasPendingApplication(tenantId: string, customerId: number): Observable<boolean> {
    return new Observable(observer => {
      this.getPendingApplications(tenantId, customerId).subscribe({
        next: (response) => {
          const hasPending = response?.data && response.data.length > 0;
          observer.next(hasPending);
          observer.complete();
        },
        error: (err) => {
          observer.error(err);
        }
      });
    });
  }

  getPendingProductIds(tenantId: string, customerId: number): Observable<number[]> {
    return new Observable(observer => {
      this.getPendingApplications(tenantId, customerId).subscribe({
        next: (response) => {
          console.log('🔍 Raw pending applications response:', response);
          console.log('🔍 Applications data:', response?.data);
          
          if (response?.data && response.data.length > 0) {
            console.log('🔍 First application structure:', response.data[0]);
            console.log('🔍 Available keys:', Object.keys(response.data[0]));
          }
          
          // Database uses loan_product_id (snake_case)
          const pendingProductIds = response?.data?.map((app: any) => {
            const productId = app.loan_product_id || app.loanProductId;
            console.log('🔍 Extracted productId:', productId, 'from application:', app.id);
            return productId;
          }).filter((id: any) => id !== undefined && id !== null) || [];
          
          console.log('✅ Final pending product IDs:', pendingProductIds);
          observer.next(pendingProductIds);
          observer.complete();
        },
        error: (err) => {
          console.error('❌ Error getting pending applications:', err);
          observer.error(err);
        }
      });
    });
  }

  // Get application details by product ID
  getApplicationByProductId(tenantId: string, customerId: number, productId: number): Observable<any> {
    return new Observable(observer => {
      this.getPendingApplications(tenantId, customerId).subscribe({
        next: (response) => {
          const application = response?.data?.find((app: any) => 
            (app.loan_product_id || app.loanProductId) === productId
          );
          observer.next(application || null);
          observer.complete();
        },
        error: (err) => {
          observer.error(err);
        }
      });
    });
  }
}
