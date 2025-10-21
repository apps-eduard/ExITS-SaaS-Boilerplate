import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const noAuthGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is authenticated
  const isAuth = authService.isAuthenticated();
  
  console.log('No-auth guard check:', {
    isAuthenticated: isAuth,
    currentUser: authService.currentUser(),
    token: authService.getAccessToken()
  });
  
  if (isAuth) {
    // User is authenticated, redirect based on user type
    const isSystemAdmin = authService.isSystemAdmin();
    const targetRoute = isSystemAdmin ? '/dashboard' : '/tenant/dashboard';
    console.log('No-auth guard: User authenticated, redirecting to', targetRoute);
    router.navigate([targetRoute]);
    return false;
  }

  // Not authenticated, allow access to login
  console.log('No-auth guard: User not authenticated, allowing access to login');
  return true;
};
