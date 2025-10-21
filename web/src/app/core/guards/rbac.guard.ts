import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { RBACService } from '../services/rbac.service';
import { AuthService } from '../services/auth.service';

/**
 * RBAC Route Guard
 * Checks if user has access to a specific menu
 */
export const rbacGuard: CanActivateFn = (route, state) => {
  const rbacService = inject(RBACService);
  const authService = inject(AuthService);
  const router = inject(Router);

  // Must be authenticated
  if (!authService.isAuthenticated()) {
    router.navigate(['/auth/login']);
    return false;
  }

  // Check if route requires specific menu access
  const requiredMenu = route.data['requiredMenu'] as string;
  if (requiredMenu && !rbacService.hasMenuAccess(requiredMenu)) {
    console.warn(`❌ Access denied to menu: ${requiredMenu}`);
    router.navigate(['/dashboard']);
    return false;
  }

  // Check if route requires specific action
  const requiredAction = route.data['requiredAction'] as string;
  if (requiredAction && requiredMenu && !rbacService.hasAction(requiredMenu, requiredAction)) {
    console.warn(`❌ Action not allowed: ${requiredMenu}:${requiredAction}`);
    router.navigate(['/dashboard']);
    return false;
  }

  return true;
};

/**
 * Simple menu access guard
 */
export const canAccessMenu = (menuKey: string): boolean => {
  const rbacService = inject(RBACService);
  return rbacService.hasMenuAccess(menuKey);
};

/**
 * Simple action access guard
 */
export const canPerformAction = (menuKey: string, actionKey: string): boolean => {
  const rbacService = inject(RBACService);
  return rbacService.hasAction(menuKey, actionKey);
};
