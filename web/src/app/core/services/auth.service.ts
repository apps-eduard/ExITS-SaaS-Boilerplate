import { Injectable, signal, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { tap, catchError, of } from 'rxjs';
import { UserService } from './user.service';
import { RoleService } from './role.service';

export interface User {
  id: string | number;
  email: string;
  firstName: string;
  lastName: string;
  tenantId: string | number | null;
  roleId?: string;
  role?: {
    name: string;
    permissions: string[];
  };
  permissions?: string[]; // Permissions array from login response
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

  // Store permissions from login response
  private userPermissions = signal<string[]>([]);

  constructor(
    private http: HttpClient,
    private router: Router,
    private userService: UserService,
    private roleService: RoleService
  ) {
    this.loadUserFromStorage();
  }

  login(email: string, password: string) {
    return this.http.post<any>(`${this.apiUrl}/auth/login`, { email, password }).pipe(
      tap(response => {
        console.log('✅ AuthService.login() received response:', response);
        if (response && response.data) {
          console.log('📝 Saving tokens to localStorage...');
          this.setTokens(response.data.tokens.accessToken, response.data.tokens.refreshToken);
          console.log('✅ Tokens saved. Accessing token:', this.getAccessToken()?.substring(0, 20) + '...');

          // Store permissions from login response
          const permissions = response.data.permissions || [];
          // console.log('🔑 Permissions from login:', permissions);
          this.userPermissions.set(permissions);
          localStorage.setItem('permissions', JSON.stringify(permissions));

          // Transform API response (camelCase) to frontend format (camelCase)
          const apiUser = response.data.user;
          const user: User = {
            id: apiUser.id,
            email: apiUser.email,
            firstName: apiUser.firstName || '',
            lastName: apiUser.lastName || '',
            tenantId: apiUser.tenantId,
            roleId: apiUser.roleId || apiUser.role_id,
            role: apiUser.role
          };

          this.currentUser.set(user);
          this.isAuthenticated.set(true);
          localStorage.setItem('user', JSON.stringify(user));
          console.log('✅ AuthService.login() - signals updated:', {
            isAuthenticated: this.isAuthenticated(),
            currentUser: this.currentUser(),
            permissions: this.userPermissions()
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
    // Clear localStorage
    localStorage.removeItem('access_token');
    localStorage.removeItem('refresh_token');
    localStorage.removeItem('user');
    localStorage.removeItem('permissions');
    
    // Clear auth state
    this.currentUser.set(null);
    this.isAuthenticated.set(false);
    this.userPermissions.set([]);
    
    // Clear service caches to prevent data leakage between sessions
    this.userService.clearCache();
    this.roleService.clearCache();
    
    console.log('🗑️ Session cleared - all caches reset');
    
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
    const permissionsStr = localStorage.getItem('permissions');

    if (token && userStr) {
      try {
        const user = JSON.parse(userStr);
        let permissions = permissionsStr ? JSON.parse(permissionsStr) : [];

        // Ensure permissions is always an array
        if (!Array.isArray(permissions)) {
          console.warn('⚠️ Permissions from storage is not an array, converting:', typeof permissions);
          permissions = [];
        }

        this.currentUser.set(user);
        this.isAuthenticated.set(true);
        this.userPermissions.set(permissions);
        console.log('🔄 Loaded from storage:', { user, permissions });
      } catch (e) {
        this.clearSession();
      }
    }
  }

  hasPermission(permission: string): boolean {
    const permissions = this.userPermissions();

    // Handle if permissions is not an array (defensive check)
    if (!Array.isArray(permissions)) {
      console.error('❌ Permissions is not an array:', typeof permissions, permissions);
      return false;
    }

    const hasIt = permissions.includes(permission);
    console.log(`🔍 Checking permission "${permission}":`, hasIt, '| Available:', permissions);
    return hasIt;
  }

  isSystemAdmin(): boolean {
    const user = this.currentUser();
    return user?.tenantId === null || user?.tenantId === undefined;
  }

  isTenantUser(): boolean {
    const user = this.currentUser();
    return user?.tenantId !== null && user?.tenantId !== undefined;
  }

  getTenantId(): string | number | null {
    return this.currentUser()?.tenantId ?? null;
  }
}
