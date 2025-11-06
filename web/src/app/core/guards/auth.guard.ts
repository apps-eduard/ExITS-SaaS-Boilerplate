import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const authGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  // Check if user is authenticated by checking the signal value
  const isAuth = authService.isAuthenticated();

  console.log('Auth guard check:', {
    isAuthenticated: isAuth,
    currentUser: authService.currentUser(),
    token: authService.getAccessToken()
  });

  if (isAuth) {
    // console.log('Auth guard: User authenticated, allowing access');
    return true;
  }

  // Not authenticated, redirect to login
  // console.log('Auth guard: User not authenticated, redirecting to login');
  router.navigate(['/login']);
  return false;
};
