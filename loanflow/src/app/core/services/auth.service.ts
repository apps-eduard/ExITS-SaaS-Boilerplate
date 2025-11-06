import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable, throwError } from 'rxjs';
import { tap, catchError, map } from 'rxjs/operators';
import { Preferences } from '@capacitor/preferences';
import { environment } from '../../../environments/environment';

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  role: string;
  tenant: {
    id: string;
    name: string;
  };
  permissions: string[];
  profileComplete?: boolean;
  avatar?: string;
}

export interface AuthResponse {
  accessToken: string;
  refreshToken: string;
  user: User;
  expiresIn: number;
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private customerApiUrl = `${environment.apiUrl}/customers/auth`;

  private currentUserSubject = new BehaviorSubject<User | null>(null);
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(false);
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    this.checkAuth();
  }

  login(email: string, password: string): Observable<AuthResponse> {
    // Try customer login first, then fallback to staff/collector login
    return this.loginAsCustomer(email, password).pipe(
      catchError(() => this.loginAsStaff(email, password))
    );
  }

  // Public method for explicit customer login
  loginAsCustomer(email: string, password: string): Observable<AuthResponse> {
    const body = { identifier: email, password };
    return this.http.post<any>(`${this.customerApiUrl}/login`, body).pipe(
      map((response) => {
        console.log('Customer login response:', response);
        if (response.data) {
          // Store the complete customer data separately
          if (response.data.customer) {
            localStorage.setItem('customer', JSON.stringify(response.data.customer));
          }
          
          // Use the user object from backend which includes tenant info
          const userData = response.data.user;
          const tokens = response.data.tokens;
          
          const mapped = {
            accessToken: tokens.accessToken || tokens.access_token,
            refreshToken: tokens.refreshToken || tokens.refresh_token,
            user: userData, // Use backend's user object with tenant info
            expiresIn: response.data.expiresIn || response.data.expires_in || 3600
          } as AuthResponse;
          console.log('Mapped customer response:', mapped);
          return mapped;
        }
        return response as AuthResponse;
      }),
      tap((response) => {
        // console.log('Setting customer tokens');
        this.setTokens(response);
        this.currentUserSubject.next(response.user);
        this.isAuthenticatedSubject.next(true);
      }),
      catchError((error) => {
        console.log('Customer login failed, will try staff login');
        return throwError(() => error);
      })
    );
  }

  // Public method for explicit staff/employee login
  loginAsStaff(email: string, password: string): Observable<AuthResponse> {
    const body = { email, password };
    return this.http.post<any>(`${this.apiUrl}/login`, body).pipe(
      map((response) => {
        console.log('Staff/Collector login response:', response);
        // Handle API response structure for staff
        if (response.data) {
          const userData = response.data.user;
          const tokens = response.data.tokens || response.data;
          
          const mapped = {
            accessToken: tokens.accessToken || tokens.access_token,
            refreshToken: tokens.refreshToken || tokens.refresh_token,
            user: userData,
            expiresIn: response.data.expiresIn || response.data.expires_in || 3600
          } as AuthResponse;
          // console.log('Mapped staff response:', mapped);
          return mapped;
        }
        return response as AuthResponse;
      }),
      tap((response) => {
        // console.log('Setting staff tokens');
        this.setTokens(response);
        this.currentUserSubject.next(response.user);
        this.isAuthenticatedSubject.next(true);
      }),
      catchError((error) => {
        console.error('Staff login failed:', error);
        return throwError(() => new Error(error.error?.message || 'Login failed'));
      })
    );
  }

  logout(): void {
    // Clear tokens and user data immediately
    this.clearTokens();
    this.currentUserSubject.next(null);
    this.isAuthenticatedSubject.next(false);

    // Try to notify server (fire and forget)
    this.http.post(`${this.apiUrl}/logout`, {}).subscribe({
      next: () => console.log('Logout successful on server'),
      error: (error) => console.warn('Logout server call failed:', error)
    });

    // Navigate to login page
    this.router.navigate(['/auth/login']);
  }

  register(email: string, password: string, firstName: string, lastName: string): Observable<AuthResponse> {
    const body = { email, password, firstName, lastName };
    return this.http.post<AuthResponse>(`${this.apiUrl}/register`, body).pipe(
      tap((response) => {
        this.setTokens(response);
        this.currentUserSubject.next(response.user);
        this.isAuthenticatedSubject.next(true);
      }),
      catchError((error) => {
        console.error('Registration error:', error);
        return throwError(() => new Error(error.error?.message || 'Registration failed'));
      })
    );
  }

  registerCustomer(data: {
    tenant?: string;
    email: string;
    password: string;
    fullName?: string;
    phone?: string;
    address?: string;
  }): Observable<any> {
    const body = {
      tenant: data.tenant || 'ACME', // Default to ACME if not provided
      email: data.email,
      password: data.password,
      ...(data.fullName && { fullName: data.fullName }),
      ...(data.phone && { phone: data.phone }),
      ...(data.address && { address: data.address })
    };
    
    return this.http.post<any>(`${this.customerApiUrl}/register`, body).pipe(
      map((response) => {
        console.log('Customer registration response:', response);
        return response;
      }),
      catchError((error) => {
        console.error('Customer registration error:', error);
        return throwError(() => error);
      })
    );
  }

  checkEmailExists(tenant: string, email: string): Observable<{ exists: boolean }> {
    return this.http.get<{ exists: boolean }>(`${this.customerApiUrl}/check-email`, {
      params: { tenant, email }
    }).pipe(
      catchError((error) => {
        console.error('Check email error:', error);
        return throwError(() => error);
      })
    );
  }

  refreshToken(): Observable<AuthResponse> {
    const refreshToken = this.getRefreshToken();
    if (!refreshToken) {
      return throwError(() => new Error('No refresh token available'));
    }

    return this.http
      .post<AuthResponse>(`${this.apiUrl}/refresh-token`, { refreshToken })
      .pipe(
        tap((response) => {
          this.setTokens(response);
          this.currentUserSubject.next(response.user);
        }),
        catchError((error) => {
          this.logout();
          return throwError(() => error);
        })
      );
  }

  changePassword(oldPassword: string, newPassword: string): Observable<any> {
    const body = { oldPassword, newPassword };
    return this.http.post(`${this.apiUrl}/change-password`, body).pipe(
      catchError((error) => {
        console.error('Password change error:', error);
        return throwError(() => new Error(error.error?.message || 'Password change failed'));
      })
    );
  }

  async checkAuth(): Promise<void> {
    const token = await this.getTokenAsync();
    if (token) {
      this.isAuthenticatedSubject.next(true);
      const user = await this.getCurrentUserAsync();
      if (user) {
        this.currentUserSubject.next(user);
      }
    } else {
      this.isAuthenticatedSubject.next(false);
    }
  }

  getToken(): string | null {
    return localStorage.getItem('accessToken');
  }

  async getTokenAsync(): Promise<string | null> {
    const result = await Preferences.get({ key: 'accessToken' });
    return result.value;
  }

  getRefreshToken(): string | null {
    return localStorage.getItem('refreshToken');
  }

  getCurrentUser(): User | null {
    return this.currentUserSubject.value;
  }

  async getCurrentUserAsync(): Promise<User | null> {
    const result = await Preferences.get({ key: 'currentUser' });
    return result.value ? JSON.parse(result.value) : null;
  }

  currentUser(): User | null {
    return this.currentUserSubject.value;
  }

  getCurrentUserId(): string | null {
    return this.currentUser()?.id ?? null;
  }

  userRole(): 'customer' | 'collector' | null {
    const role = this.currentUser()?.role?.toLowerCase() ?? null;
    
    // Map 'employee' to 'collector' for mobile app routing
    if (role === 'employee') {
      return 'collector';
    }
    
    return role === 'customer' || role === 'collector' ? role : null;
  }

  private setTokens(response: AuthResponse): void {
    localStorage.setItem('accessToken', response.accessToken);
    localStorage.setItem('refreshToken', response.refreshToken);
    localStorage.setItem('currentUser', JSON.stringify(response.user));

    Preferences.set({ key: 'accessToken', value: response.accessToken });
    Preferences.set({ key: 'refreshToken', value: response.refreshToken });
    Preferences.set({ key: 'currentUser', value: JSON.stringify(response.user) });
  }

  private clearTokens(): void {
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('currentUser');
    localStorage.removeItem('customer');

    Preferences.remove({ key: 'accessToken' });
    Preferences.remove({ key: 'refreshToken' });
    Preferences.remove({ key: 'currentUser' });
  }

  hasPermission(permission: string): boolean {
    const user = this.getCurrentUser();
    return user ? user.permissions.includes(permission) : false;
  }

  hasRole(role: string): boolean {
    const user = this.getCurrentUser();
    return user ? user.role === role : false;
  }

  // Method to update current user (called after profile update)
  updateCurrentUser(updates: Partial<User>): void {
    const currentUser = this.currentUserSubject.value;
    if (currentUser) {
      const updatedUser = { ...currentUser, ...updates };
      this.currentUserSubject.next(updatedUser);
      localStorage.setItem('currentUser', JSON.stringify(updatedUser));
      Preferences.set({ key: 'currentUser', value: JSON.stringify(updatedUser) });
    }
  }

  // Method to refresh current user from localStorage
  refreshCurrentUser(): void {
    const userStr = localStorage.getItem('currentUser');
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        this.currentUserSubject.next(user);
      } catch (e) {
        console.error('Failed to parse current user:', e);
      }
    }
  }
}
