import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class TenantService {
  private apiUrl = '/api/tenants'; // Adjust to your backend endpoint

  constructor(private http: HttpClient) {}

  createTenant(payload: any): Observable<any> {
    return this.http.post<any>(`${this.apiUrl}/create`, payload);
  }
}
