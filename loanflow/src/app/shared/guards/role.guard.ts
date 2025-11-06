// Role Guard - Protects routes based on user role (customer/collector)
import { inject } from '@angular/core';
import { Router, CanActivateFn } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

export const roleGuard: (allowedRoles: ('customer' | 'collector')[]) => CanActivateFn = 
  (allowedRoles) => () => {
    const authService = inject<AuthService>(AuthService);
    const router = inject(Router);

    const userRole = authService.userRole() as 'customer' | 'collector' | null;

    if (!userRole) {
      router.navigate(['/login']);
      return false;
    }

    if (!allowedRoles.includes(userRole)) {
      // Redirect to appropriate home based on role
  const redirectPath = userRole === 'collector' ? '/collector/dashboard' : '/customer/dashboard';
      router.navigate([redirectPath]);
      return false;
    }

    return true;
  };

// Pre-configured guards for convenience
export const customerGuard: CanActivateFn = roleGuard(['customer']);
export const collectorGuard: CanActivateFn = roleGuard(['collector']);
