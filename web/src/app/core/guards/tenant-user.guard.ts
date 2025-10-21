import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const tenantUserGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (!authService.isAuthenticated()) {
    router.navigate(['/login']);
    return false;
  }

  if (authService.isTenantUser()) {
    return true;
  }

  // System admin trying to access tenant route, redirect to system dashboard
  console.log('Access denied: System admin cannot access tenant routes');
  router.navigate(['/dashboard']);
  return false;
};
