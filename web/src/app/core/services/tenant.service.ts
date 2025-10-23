import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

export interface Tenant {
  id: number;
  name: string;
  subdomain: string;
  plan: string;
  status: string;
  logo_url?: string;
  primary_color?: string;
  secondary_color?: string;
  max_users?: number;
  created_at: string;
}

@Injectable({ providedIn: 'root' })
export class TenantService {
  private apiUrl = '/api/tenants'; // Adjust to your backend endpoint

  constructor(private http: HttpClient) {}

  createTenant(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/create`, payload);
  }

  getTenantById(id: number | string): Observable<{ success: boolean; data: Tenant }> {
    return this.http.get<{ success: boolean; data: Tenant }>(`${this.apiUrl}/${id}`);
  }
}
