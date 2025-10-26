import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Observable, catchError, throwError } from 'rxjs';

export interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  amount: number;
  currency: string;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  description: string;
  platformType?: string;
  planName?: string;
  transactionType?: string;
  processedAt?: string;
  provider?: string;
  paidBy?: string;
  failureReason?: string;
}

export interface InvoiceStats {
  total: number;
  paid: number;
  pending: number;
  overdue: number;
  failed: number;
  totalPaidAmount: number;
  totalPendingAmount: number;
}

export interface InvoicesResponse {
  invoices: Invoice[];
  pagination: {
    total: number;
    limit: number;
    offset: number;
    hasMore: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class InvoiceService {
  private http = inject(HttpClient);
  private apiUrl = '/api/payment-history';

  /**
   * Get all invoices for current tenant
   */
  getInvoices(filters?: {
    status?: string;
    year?: string;
    limit?: number;
    offset?: number;
  }): Observable<InvoicesResponse> {
    let params = new HttpParams();

    if (filters?.status) {
      params = params.set('status', filters.status);
    }
    if (filters?.year) {
      params = params.set('year', filters.year);
    }
    if (filters?.limit) {
      params = params.set('limit', filters.limit.toString());
    }
    if (filters?.offset) {
      params = params.set('offset', filters.offset.toString());
    }

    return this.http.get<InvoicesResponse>(`${this.apiUrl}/invoices`, { params })
      .pipe(
        catchError(error => {
          console.error('Error fetching invoices:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get invoice statistics
   */
  getInvoiceStats(): Observable<InvoiceStats> {
    return this.http.get<InvoiceStats>(`${this.apiUrl}/invoices/stats`)
      .pipe(
        catchError(error => {
          console.error('Error fetching invoice stats:', error);
          return throwError(() => error);
        })
      );
  }

  /**
   * Get single invoice by ID
   */
  getInvoiceById(id: string): Observable<Invoice> {
    return this.http.get<Invoice>(`${this.apiUrl}/invoices/${id}`)
      .pipe(
        catchError(error => {
          console.error('Error fetching invoice:', error);
          return throwError(() => error);
        })
      );
  }
}
