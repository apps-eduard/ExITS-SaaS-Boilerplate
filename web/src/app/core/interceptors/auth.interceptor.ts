import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
  console.log('🔵 AUTH INTERCEPTOR CALLED for:', req.url, req.method);
  const authService = inject(AuthService);
  let tokenAttached = false;

  // Public routes that don't need authentication
  // Use exact matching or specific patterns to avoid false positives
  const isPublicRoute = (
    (req.url.includes('/api/auth/login') && req.method === 'POST') ||
    (req.url.includes('/api/auth/refresh') && req.method === 'POST') ||
    (req.url.includes('/api/auth/forgot-password')) ||
    (req.url.includes('/api/auth/check-email')) ||
    (req.url.includes('/api/customers/auth/login') && req.method === 'POST') ||
    (req.url.includes('/api/customers/auth/refresh') && req.method === 'POST') ||
    (req.url.includes('/api/tenants/create') && req.method === 'POST') ||
    (req.url.includes('/api/tenants/by-subdomain') && req.method === 'GET') ||
    (req.url.match(/\/api\/subscription-plans$/) && req.method === 'GET') || // New endpoint - only GET is public
    (req.url.match(/\/api\/subscription-plans\/[^/]+$/) && req.method === 'GET') // New endpoint - only GET is public
  );

  // Only add token for non-public routes
  if (!isPublicRoute) {
    const customerToken = localStorage.getItem('customerToken');
    const adminToken = authService.getAccessToken();

    const isCustomerApi = req.url.includes('/api/customers/');

    // Prefer the token that matches the target API surface to avoid cross-contamination
    const token = isCustomerApi
      ? customerToken || adminToken
      : adminToken || customerToken;

    if (token) {
      req = req.clone({
        setHeaders: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log('✅ Authorization header added for:', req.url);
      tokenAttached = true;
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
      if (error.status === 401) {
        const hasToken = tokenAttached || !!authService.getAccessToken() || !!localStorage.getItem('customerToken');
        if (!hasToken) {
          console.log('⚠️ 401 received but no token present, skipping automatic logout');
          return throwError(() => error);
        }

        if (!authService.isAuthenticated()) {
          console.log('⚠️ 401 received with token but auth state already reset; skipping logout call');
          return throwError(() => error);
        }

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
