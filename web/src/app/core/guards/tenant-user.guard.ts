import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const tenantUserGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🔐 tenantUserGuard: Checking access...');
  console.log('  - isAuthenticated:', authService.isAuthenticated());
  console.log('  - currentUser:', authService.currentUser());

  if (!authService.isAuthenticated()) {
    console.log('  ❌ Not authenticated, redirecting to login');
    router.navigate(['/login']);
    return false;
  }

  if (authService.isTenantUser()) {
    console.log('  ✅ Tenant user access granted');
    return true;
  }

  // System admin trying to access tenant route, redirect to system dashboard
  console.log('  ❌ Access denied: System admin cannot access tenant routes');
  router.navigate(['/dashboard']);
  return false;
};
