import { CanActivateFn, Router } from '@angular/router';
import { inject } from '@angular/core';
import { AuthService } from '../services/auth.service';

export const systemAdminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  console.log('🔐 systemAdminGuard: Checking access...');
  console.log('  - isAuthenticated:', authService.isAuthenticated());
  console.log('  - currentUser:', authService.currentUser());

  if (!authService.isAuthenticated()) {
    console.log('  ❌ Not authenticated, redirecting to login');
    router.navigate(['/login']);
    return false;
  }

  if (authService.isSystemAdmin()) {
    console.log('  ✅ System admin access granted');
    return true;
  }

  // Tenant user trying to access system admin route, redirect to tenant dashboard
  console.log('  ❌ Access denied: Tenant user cannot access system admin routes');
  router.navigate(['/tenant/dashboard']);
  return false;
};
