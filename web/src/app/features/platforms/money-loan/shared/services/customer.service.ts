import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { LoanCustomer, CustomerStats } from '../models/loan.models';

@Injectable({
  providedIn: 'root'
})
export class CustomerService {
  private http = inject(HttpClient);
  private apiUrl = '/api/money-loan/customers';

  createCustomer(customerData: any): Observable<{ success: boolean; message: string; data: LoanCustomer }> {
    return this.http.post<{ success: boolean; message: string; data: LoanCustomer }>(
      this.apiUrl,
      customerData
    );
  }

  listCustomers(filters?: {
    page?: number;
    limit?: number;
    status?: string;
    kycStatus?: string;
    riskLevel?: string;
    search?: string;
    employeeId?: string;
  }): Observable<{ success: boolean; message: string; data: LoanCustomer[]; pagination: any }> {
    return this.http.get<{ success: boolean; message: string; data: LoanCustomer[]; pagination: any }>(
      this.apiUrl,
      { params: filters as any }
    );
  }

  getCustomerById(customerId: number): Observable<{ success: boolean; data: LoanCustomer }> {
    return this.http.get<{ success: boolean; data: LoanCustomer }>(
      `${this.apiUrl}/${customerId}`
    );
  }

  updateCustomer(customerId: number, updateData: any): Observable<{ success: boolean; message: string; data: LoanCustomer }> {
    return this.http.put<{ success: boolean; message: string; data: LoanCustomer }>(
      `${this.apiUrl}/${customerId}`,
      updateData
    );
  }

  getCustomerStats(customerId: number): Observable<{ success: boolean; data: CustomerStats }> {
    return this.http.get<{ success: boolean; data: CustomerStats }>(
      `${this.apiUrl}/${customerId}/stats`
    );
  }
}
