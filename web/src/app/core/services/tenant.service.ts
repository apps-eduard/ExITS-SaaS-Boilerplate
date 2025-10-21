import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  plan: 'basic' | 'pro' | 'enterprise';
  status: 'active' | 'inactive' | 'suspended';
  max_users: number;
  logo_url?: string;
  colors?: Record<string, string>;
  created_at: string;
  updated_at?: string;
}

export interface CreateTenantDto {
  name: string;
  subdomain: string;
  plan?: 'basic' | 'pro' | 'enterprise';
  max_users?: number;
  logo_url?: string;
  colors?: Record<string, string>;
}

export interface UpdateTenantDto {
  name?: string;
  subdomain?: string;
  plan?: 'basic' | 'pro' | 'enterprise';
  status?: 'active' | 'inactive' | 'suspended';
  max_users?: number;
  logo_url?: string;
  colors?: Record<string, string>;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  message: string;
  data: T;
  pagination?: PaginationMeta;
}

@Injectable({
  providedIn: 'root'
})
export class TenantService {
  private apiUrl = 'http://localhost:3000/api/tenants';
  private tenantsSubject = new BehaviorSubject<Tenant[]>([]);
  public tenants$ = this.tenantsSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadTenants();
  }

  loadTenants(page: number = 1, limit: number = 20): void {
    this.getTenants(page, limit).subscribe(tenants => {
      this.tenantsSubject.next(tenants);
    });
  }

  getTenants(page: number = 1, limit: number = 20): Observable<Tenant[]> {
    return this.http.get<ApiResponse<Tenant[]>>(`${this.apiUrl}?page=${page}&limit=${limit}`).pipe(
      map(response => response.data)
    );
  }

  getTenantById(id: string): Observable<Tenant> {
    return this.http.get<ApiResponse<Tenant>>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }

  createTenant(data: CreateTenantDto): Observable<Tenant> {
    return this.http.post<ApiResponse<Tenant>>(this.apiUrl, data).pipe(
      map(response => response.data),
      tap(tenant => {
        const currentTenants = this.tenantsSubject.value;
        this.tenantsSubject.next([...currentTenants, tenant]);
      })
    );
  }

  updateTenant(id: string, data: UpdateTenantDto): Observable<Tenant> {
    return this.http.put<ApiResponse<Tenant>>(`${this.apiUrl}/${id}`, data).pipe(
      map(response => response.data),
      tap(updatedTenant => {
        const currentTenants = this.tenantsSubject.value;
        const index = currentTenants.findIndex(t => t.id === id);
        if (index !== -1) {
          currentTenants[index] = updatedTenant;
          this.tenantsSubject.next([...currentTenants]);
        }
      })
    );
  }

  deleteTenant(id: string): Observable<Tenant> {
    return this.http.delete<ApiResponse<Tenant>>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data),
      tap(() => {
        const currentTenants = this.tenantsSubject.value.filter(t => t.id !== id);
        this.tenantsSubject.next(currentTenants);
      })
    );
  }

  // Get tenant statistics
  getTenantStats(id: string): Observable<any> {
    return this.http.get<ApiResponse<any>>(`${this.apiUrl}/${id}/stats`).pipe(
      map(response => response.data)
    );
  }

  // Get tenant users
  getTenantUsers(id: string): Observable<any[]> {
    return this.http.get<ApiResponse<any[]>>(`${this.apiUrl}/${id}/users`).pipe(
      map(response => response.data)
    );
  }
}
