import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';

export interface AuditLog {
  id: string;
  userId: string;
  userName: string;
  action: string;
  resource: string;
  resourceId: string;
  details: Record<string, any>;
  ipAddress: string;
  userAgent: string;
  timestamp: Date;
  tenantId: string;
}

export interface AuditLogFilter {
  startDate?: Date;
  endDate?: Date;
  userId?: string;
  action?: string;
  resource?: string;
  page?: number;
  limit?: number;
}

@Injectable({
  providedIn: 'root'
})
export class AuditLogService {
  private apiUrl = 'http://localhost:3000/api/audit-logs';
  private logsSubject = new BehaviorSubject<AuditLog[]>([]);
  public logs$ = this.logsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadLogs();
  }

  loadLogs(): void {
    this.getLogs().subscribe(logs => {
      this.logsSubject.next(logs);
    });
  }

  getLogs(filter?: AuditLogFilter): Observable<AuditLog[]> {
    let url = this.apiUrl;
    if (filter) {
      const params = new URLSearchParams();
      if (filter.startDate) params.append('startDate', filter.startDate.toISOString());
      if (filter.endDate) params.append('endDate', filter.endDate.toISOString());
      if (filter.userId) params.append('userId', filter.userId);
      if (filter.action) params.append('action', filter.action);
      if (filter.resource) params.append('resource', filter.resource);
      if (filter.page) params.append('page', filter.page.toString());
      if (filter.limit) params.append('limit', filter.limit.toString());

      const queryString = params.toString();
      if (queryString) url += `?${queryString}`;
    }
    return this.http.get<AuditLog[]>(url);
  }

  getLogById(id: string): Observable<AuditLog> {
    return this.http.get<AuditLog>(`${this.apiUrl}/${id}`);
  }

  searchLogs(query: string): Observable<AuditLog[]> {
    return this.http.get<AuditLog[]>(`${this.apiUrl}/search?q=${query}`);
  }

  // Export logs
  exportLogs(format: 'csv' | 'json', filter?: AuditLogFilter): Observable<Blob> {
    let url = `${this.apiUrl}/export?format=${format}`;
    if (filter) {
      if (filter.startDate) url += `&startDate=${filter.startDate.toISOString()}`;
      if (filter.endDate) url += `&endDate=${filter.endDate.toISOString()}`;
    }
    return this.http.get(url, { responseType: 'blob' });
  }
}
