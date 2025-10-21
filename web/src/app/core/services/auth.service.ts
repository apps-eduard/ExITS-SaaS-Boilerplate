import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, of } from 'rxjs';

export interface User {
  id: string | number;
  email: string;
  first_name: string;
  last_name: string;
  tenant_id: string | number | null;
  role_id?: string;
  role?: {
    name: string;
    permissions: string[];
  };
}

export interface AuthResponse {
  success?: boolean;
  message: string;
  data: {
    user: User;
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
    permissions?: Record<string, string[]>;
  };
}

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:3000/api';
  currentUser = signal<User | null>(null);
  isAuthenticated = signal<boolean>(false);

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.loadUserFromStorage();
  }

  login(email: string, password: string) {
    return this.http.post<AuthResponse>(`${this.apiUrl}/auth/login`, { email, password }).pipe(
      tap(response => {
        console.log('✅ AuthService.login() received response:', response);
        if (response && response.data) {
          this.setTokens(response.data.tokens.accessToken, response.data.tokens.refreshToken);
          this.currentUser.set(response.data.user);
          this.isAuthenticated.set(true);
          localStorage.setItem('user', JSON.stringify(response.data.user));
          console.log('✅ AuthService.login() - signals updated:', {
            isAuthenticated: this.isAuthenticated(),
            currentUser: this.currentUser()
          });
        }
      }),
      catchError(error => {
        console.error('❌ AuthService.login() error:', error);
        throw error;
      })
    );
  }

  logout() {
    return this.http.post(`${this.apiUrl}/auth/logout`, {}).pipe(
      tap(() => this.clearSession()),
      catchError(() => {
        this.clearSession();
        return of(null);
      })
    );
  }

  private clearSession() {
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.router.navigate(['/login']);
  }

  private setTokens(accessToken: string, refreshToken: string) {
    localStorage.setItem('access_token', accessToken);
    localStorage.setItem('refresh_token', refreshToken);
  }

  getAccessToken(): string | null {
    return localStorage.getItem('access_token');
  }

  private loadUserFromStorage() {
    const token = this.getAccessToken();
    const userStr = localStorage.getItem('user');
    
    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUser.set(user);
        this.isAuthenticated.set(true);
      } catch (e) {
        this.clearSession();
      }
    }
  }

  hasPermission(permission: string): boolean {
    const user = this.currentUser();
    return user?.role?.permissions?.includes(permission) ?? false;
  }

  isSystemAdmin(): boolean {
    return this.currentUser()?.role_id === '1';
  }

  isTenantAdmin(): boolean {
    return this.currentUser()?.role_id === '2';
  }
}
