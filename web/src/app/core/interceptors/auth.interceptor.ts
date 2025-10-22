import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getAccessToken();

  // Debug: Check localStorage directly
  const storedToken = localStorage.getItem('access_token');

  console.log('🔐 Auth Interceptor - Full Debug:', {
    url: req.url,
    hasToken: !!token,
    tokenLength: token?.length || 0,
    storedToken: !!storedToken,
    storedTokenLength: storedToken?.length || 0,
    isAuthenticated: authService.isAuthenticated(),
    currentUser: authService.currentUser()?.email
  });

  if (token) {
    req = req.clone({
      setHeaders: {
        Authorization: `Bearer ${token}`
      }
    });
    console.log('✅ Authorization header added');
  } else {
    console.warn('❌ No token found! Stored token in localStorage:', !!storedToken);
  }

  return next(req).pipe(
    catchError(error => {
      console.error('❌ API Error:', {
        status: error.status,
        url: req.url,
        message: error.message
      });
      if (error.status === 401) {
        console.log('⚠️ 401 Unauthorized - logging out');
        authService.logout().subscribe();
      }
      return throwError(() => error);
    })
  );
};
