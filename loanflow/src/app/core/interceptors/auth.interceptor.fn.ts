import { HttpInterceptorFn, HttpErrorResponse } from '@angular/common/http';
import { inject } from '@angular/core';
import { catchError, throwError } from 'rxjs';
import { AuthService } from '../services/auth.service';

export const authInterceptorFn: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  const token = authService.getToken();

  console.log('🔵 HTTP Interceptor - Request:', req.method, req.url);
  console.log('🔑 Token exists:', !!token);
  
  if (token) {
    console.log('✅ Adding Authorization header');
    const clonedReq = req.clone({
      headers: req.headers.set('Authorization', `Bearer ${token}`)
    });
    
    return next(clonedReq).pipe(
      catchError((error: HttpErrorResponse) => {
        console.error('❌ HTTP Error:', error.status, error.message);
        console.error('❌ Error URL:', error.url);
        
        // Only auto-logout on 401 for auth-related endpoints
        // Let other endpoints handle 401 errors themselves
        if (error.status === 401 && (
          error.url?.includes('/auth/') ||
          error.url?.includes('/customers/auth/refresh') ||
          error.url?.includes('/token/refresh')
        )) {
          console.log('🔄 Unauthorized on auth endpoint - logging out');
          authService.logout();
        } else if (error.status === 401) {
          console.warn('⚠️ 401 Unauthorized but not logging out - endpoint:', error.url);
          // The component/service will handle this error
        }
        
        return throwError(() => error);
      })
    );
  }

  console.log('⚠️ No token - skipping Authorization header');
  return next(req).pipe(
    catchError((error: HttpErrorResponse) => {
      console.error('❌ HTTP Error (no auth):', error.status, error.message);
      return throwError(() => error);
    })
  );
};
