/**
 * Authentication Service
 * Handles user authentication and authorization
 */

import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap, map, catchError } from 'rxjs/operators';
import { of } from 'rxjs';

interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  tenant_id: string;
}

interface AuthResponse {
  data: {
    user: User;
    tokens: {
      accessToken: string;
      refreshToken: string;
    };
    permissions: Record<string, string[]>;
  };
}

@Injectable({
  providedIn: 'root',
})
export class AuthService {
  private readonly API_URL = '/api/auth';
  private readonly TOKEN_KEY = 'access_token';
  private readonly REFRESH_TOKEN_KEY = 'refresh_token';
  private readonly USER_KEY = 'current_user';

  private currentUserSubject = new BehaviorSubject<User | null>(this.getUserFromStorage());
  public currentUser$ = this.currentUserSubject.asObservable();

  private isAuthenticatedSubject = new BehaviorSubject<boolean>(this.hasToken());
  public isAuthenticated$ = this.isAuthenticatedSubject.asObservable();

  constructor(private http: HttpClient, private router: Router) {}

  login(email: string, password: string): Observable<AuthResponse> {
    return this.http
      .post<AuthResponse>(`${this.API_URL}/login`, { email, password })
      .pipe(
        tap((response) => {
          this.setTokens(response.data.tokens.accessToken, response.data.tokens.refreshToken);
          this.setCurrentUser(response.data.user);
          this.isAuthenticatedSubject.next(true);
        }),
      );
  }

  logout(): Observable<void> {
    return this.http.post<void>(`${this.API_URL}/logout`, {}).pipe(
      tap(() => {
        this.clearTokens();
        this.currentUserSubject.next(null);
        this.isAuthenticatedSubject.next(false);
      }),
      catchError(() => {
        // Clear tokens even if logout fails
        this.clearTokens();
        this.currentUserSubject.next(null);
        this.isAuthenticatedSubject.next(false);
        return of(void 0);
      }),
    );
  }

  refreshToken(): Observable<{ accessToken: string }> {
    const refreshToken = this.getRefreshToken();

    if (!refreshToken) {
      return of({} as { accessToken: string });
    }

    return this.http.post<{ data: { accessToken: string } }>(`${this.API_URL}/refresh`, { refreshToken }).pipe(
      tap((response) => {
        this.setToken(response.data.accessToken);
      }),
      map((response) => ({ accessToken: response.data.accessToken })),
    );
  }

  changePassword(oldPassword: string, newPassword: string): Observable<{ message: string }> {
    return this.http.post<{ message: string }>(`${this.API_URL}/change-password`, {
      oldPassword,
      newPassword,
    });
  }

  checkAuth(): void {
    const token = this.getToken();
    if (token) {
      this.validateToken();
    } else {
      this.isAuthenticatedSubject.next(false);
    }
  }

  private validateToken(): void {
    this.http.post<{ data: { user: User } }>(`${this.API_URL}/validate-token`, {}).subscribe(
      (response) => {
        this.setCurrentUser(response.data.user);
        this.isAuthenticatedSubject.next(true);
      },
      () => {
        this.clearTokens();
        this.currentUserSubject.next(null);
        this.isAuthenticatedSubject.next(false);
      },
    );
  }

  getToken(): string | null {
    return localStorage.getItem(this.TOKEN_KEY);
  }

  getRefreshToken(): string | null {
    return localStorage.getItem(this.REFRESH_TOKEN_KEY);
  }

  private setToken(token: string): void {
    localStorage.setItem(this.TOKEN_KEY, token);
  }

  private setTokens(accessToken: string, refreshToken: string): void {
    localStorage.setItem(this.TOKEN_KEY, accessToken);
    localStorage.setItem(this.REFRESH_TOKEN_KEY, refreshToken);
  }

  private clearTokens(): void {
    localStorage.removeItem(this.TOKEN_KEY);
    localStorage.removeItem(this.REFRESH_TOKEN_KEY);
    localStorage.removeItem(this.USER_KEY);
  }

  private setCurrentUser(user: User): void {
    localStorage.setItem(this.USER_KEY, JSON.stringify(user));
    this.currentUserSubject.next(user);
  }

  private getUserFromStorage(): User | null {
    const user = localStorage.getItem(this.USER_KEY);
    return user ? JSON.parse(user) : null;
  }

  private hasToken(): boolean {
    return !!localStorage.getItem(this.TOKEN_KEY);
  }
}
