import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

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

@Injectable({ 
  providedIn: 'root' 
})
export class TenantService {
  private apiUrl = `${environment.apiUrl}/tenants`;

  constructor(private http: HttpClient) {}

  /**
   * Get all active tenants for registration selection
   */
  getAllTenants(): Observable<{ success: boolean; data: Tenant[] }> {
    return this.http.get<{ success: boolean; data: Tenant[] }>(`${this.apiUrl}`);
  }

  /**
   * Get active tenants (filtered by status = 'active')
   * Public endpoint - no authentication required
   */
  getActiveTenants(): Observable<{ success: boolean; data: Tenant[] }> {
    return this.http.get<{ success: boolean; data: Tenant[] }>(`${this.apiUrl}/public/active`);
  }

  /**
   * Get tenant by ID
   */
  getTenantById(id: number): Observable<{ success: boolean; data: Tenant }> {
    return this.http.get<{ success: boolean; data: Tenant }>(`${this.apiUrl}/${id}`);
  }

  /**
   * Get tenant by subdomain/name
   */
  getTenantByName(name: string): Observable<{ success: boolean; data: Tenant }> {
    return this.http.get<{ success: boolean; data: Tenant }>(`${this.apiUrl}/by-name/${name}`);
  }
}
