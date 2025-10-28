import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class MoneyloanReportService {
  private http = inject(HttpClient);
  private getApiUrl(tenantId: string) {
    return `/api/tenants/${tenantId}/platforms/moneyloan/reports`;
  }

  // ==================== REPORTS ====================

  getPortfolioReport(tenantId: string, dateRange: any): Observable<any> {
    return this.http.get(`${this.getApiUrl(tenantId)}/portfolio`, { params: dateRange });
  }

  getPerformanceReport(tenantId: string, dateRange: any): Observable<any> {
    return this.http.get(`${this.getApiUrl(tenantId)}/performance`, { params: dateRange });
  }

  getCollectionsReport(tenantId: string, dateRange: any): Observable<any> {
    return this.http.get(`${this.getApiUrl(tenantId)}/collections`, { params: dateRange });
  }

  getArrearsReport(tenantId: string, agingBucket?: string): Observable<any> {
    const params: Record<string, string> = agingBucket ? { aging_bucket: agingBucket } : {};
    return this.http.get(`${this.getApiUrl(tenantId)}/arrears`, { params });
  }

  getWriteOffReport(tenantId: string, dateRange: any): Observable<any> {
    return this.http.get(`${this.getApiUrl(tenantId)}/write-offs`, { params: dateRange });
  }

  getProductPerformanceReport(tenantId: string, productId: string, dateRange: any): Observable<any> {
    return this.http.get(`${this.getApiUrl(tenantId)}/products`, {
      params: { ...dateRange, product_id: productId }
    });
  }

  getRevenueReport(tenantId: string, dateRange: any): Observable<any> {
    return this.http.get(`${this.getApiUrl(tenantId)}/revenue`, { params: dateRange });
  }

  getAgingAnalysis(tenantId: string): Observable<any> {
    return this.http.get(`${this.getApiUrl(tenantId)}/aging`);
  }

  exportReport(tenantId: string, data: any): Observable<any> {
    return this.http.post(`${this.getApiUrl(tenantId)}/export`, data);
  }
}
