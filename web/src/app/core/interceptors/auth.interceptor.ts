import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  const authService = inject(AuthService);
  
  // Public routes that don't need authentication
  const publicRoutes = [
    '/api/auth/login',
    '/api/auth/refresh',
    '/api/auth/forgot-password',
    '/api/auth/check-email',
    '/api/tenants/create', // Public tenant registration
    '/api/tenants/by-subdomain', // Public subdomain lookup
    '/api/subscriptions/plans' // Public subscription plans for signup
  ];

  const isPublicRoute = publicRoutes.some(route => req.url.includes(route));

  // Only add token for non-public routes
  if (!isPublicRoute) {
    const token = authService.getAccessToken();

    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('✅ Authorization header added for:', req.url);
    } else {
      console.log('⚠️ No token available for protected route:', req.url);
    }
  } else {
    console.log('🔓 Public route, skipping auth:', req.url);
  }

  return next(req).pipe(
    catchError(error => {
      console.error('❌ API Error:', {
        status: error.status,
        url: req.url,
        message: error.message
      });
      
      // Only attempt logout if we're authenticated and got 401
      if (error.status === 401 && authService.isAuthenticated()) {
        console.log('⚠️ 401 Unauthorized - logging out');
        authService.logout().subscribe({
          error: (logoutError) => {
            console.error('Logout failed:', logoutError);
            // Clear local state even if logout API fails
            localStorage.clear();
          }
        });
      }
      return throwError(() => error);
    })
  );
};
