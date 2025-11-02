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
        
        if (error.status === 401) {
          console.log('🔄 Unauthorized - logging out');
          authService.logout();
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
