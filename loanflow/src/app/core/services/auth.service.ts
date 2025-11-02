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
    const body = { email, password };
    return this.http.post<any>(`${this.apiUrl}/login`, body).pipe(
      map((response) => {
        console.log('Raw API response:', response);
        // Handle API response structure: { success, message, data: { accessToken, refreshToken, user } }
        if (response.data) {
          const mapped = {
            accessToken: response.data.accessToken || response.data.access_token,
            refreshToken: response.data.refreshToken || response.data.refresh_token,
            user: response.data.user,
            expiresIn: response.data.expiresIn || response.data.expires_in || 3600
          } as AuthResponse;
          console.log('Mapped to AuthResponse:', mapped);
          return mapped;
        }
        // Fallback for direct response structure
        return response as AuthResponse;
      }),
      tap((response) => {
        console.log('Setting tokens with response:', response);
        this.setTokens(response);
        this.currentUserSubject.next(response.user);
        this.isAuthenticatedSubject.next(true);
      }),
      catchError((error) => {
        console.error('Login error:', error);
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
}
