/**
 * Menu Service
 * Manages application menu items with role-based filtering and permission checking
 */

import { Injectable } from '@angular/core';
import { Observable, BehaviorSubject } from 'rxjs';
import { map } from 'rxjs/operators';
import { UserService } from './user.service';

export interface MenuItem {
  id: string;
  label: string;
  route: string;
  icon: string;
  badge?: string;
  visible: boolean;
  requiredPermissions?: string[];
  children?: MenuItem[];
}

@Injectable({
  providedIn: 'root'
})
export class MenuService {
  private menuItems$ = new BehaviorSubject<MenuItem[]>([]);

  // Full menu configuration
  private readonly allMenuItems: MenuItem[] = [
    {
      id: 'dashboard',
      label: 'Dashboard',
      route: '/dashboard',
      icon: 'dashboard',
      visible: true,
      children: []
    },
    {
      id: 'users',
      label: 'Users',
      route: '/users',
      icon: 'people',
      visible: true,
      requiredPermissions: ['users.view']
    },
    {
      id: 'roles',
      label: 'Roles',
      route: '/roles',
      icon: 'security',
      visible: true,
      requiredPermissions: ['roles.view']
    },
    {
      id: 'tenants',
      label: 'Tenants',
      route: '/tenants',
      icon: 'business',
      visible: true,
      requiredPermissions: ['tenants.view']
    },
    {
      id: 'audit-logs',
      label: 'Audit Logs',
      route: '/audit-logs',
      icon: 'history',
      visible: true,
      requiredPermissions: ['audit.view']
    },
    {
      id: 'settings',
      label: 'Settings',
      route: '/settings',
      icon: 'tune',
      visible: true,
      children: [
        {
          id: 'general-settings',
          label: 'General',
          route: '/settings/general',
          icon: 'info',
          visible: true
        },
        {
          id: 'user-settings',
          label: 'Users',
          route: '/settings/users',
          icon: 'people',
          visible: true,
          requiredPermissions: ['settings.users.manage']
        },
        {
          id: 'role-settings',
          label: 'Roles & Permissions',
          route: '/settings/roles',
          icon: 'security',
          visible: true,
          requiredPermissions: ['settings.roles.manage']
        },
        {
          id: 'billing-settings',
          label: 'Billing',
          route: '/settings/billing',
          icon: 'payment',
          visible: true,
          requiredPermissions: ['settings.billing.view']
        },
        {
          id: 'integrations-settings',
          label: 'Integrations',
          route: '/settings/integrations',
          icon: 'extension',
          visible: true,
          requiredPermissions: ['settings.integrations.manage']
        },
        {
          id: 'security-settings',
          label: 'Security',
          route: '/settings/security',
          icon: 'lock',
          visible: true,
          requiredPermissions: ['settings.security.manage']
        }
      ]
    }
  ];

  constructor(private userService: UserService) {
    // Initialize menu items with user permissions
    this.initializeMenuItems();
  }

  private initializeMenuItems(): void {
    this.userService.getCurrentUser().pipe(
      map(user => {
        const userPermissions = this.extractPermissionsFromUser(user);
        return this.filterMenuItemsByPermissions(this.allMenuItems, userPermissions);
      })
    ).subscribe(filteredItems => {
      this.menuItems$.next(filteredItems);
    });
  }

  /**
   * Get menu items filtered by user permissions
   */
  getMenuItems(): Observable<MenuItem[]> {
    return this.menuItems$.asObservable();
  }

  /**
   * Refresh menu items (useful after permission changes)
   */
  refreshMenu(): void {
    this.initializeMenuItems();
  }

  /**
   * Extract user permissions from user object
   */
  private extractPermissionsFromUser(user: any): string[] {
    if (!user || !user.permissions) {
      return [];
    }

    const permissions: string[] = [];
    
    // Flatten permissions from modules
    Object.keys(user.permissions).forEach(module => {
      const modulePermissions = user.permissions[module];
      if (Array.isArray(modulePermissions)) {
        modulePermissions.forEach(permission => {
          permissions.push(`${module}.${permission}`);
        });
      }
    });

    return permissions;
  }

  /**
   * Filter menu items based on user permissions
   */
  private filterMenuItemsByPermissions(items: MenuItem[], permissions: string[]): MenuItem[] {
    return items
      .map(item => ({
        ...item,
        visible: this.hasRequiredPermissions(item, permissions),
        children: item.children
          ? this.filterMenuItemsByPermissions(item.children, permissions)
          : undefined
      }))
      .filter(item => item.visible || (item.children && item.children.some(child => child.visible)));
  }

  /**
   * Check if user has required permissions for a menu item
   */
  private hasRequiredPermissions(item: MenuItem, permissions: string[]): boolean {
    // If no permissions required, always show
    if (!item.requiredPermissions || item.requiredPermissions.length === 0) {
      return true;
    }

    // Check if user has all required permissions
    return item.requiredPermissions.every(permission =>
      permissions.includes(permission)
    );
  }

  /**
   * Check if user can access a specific route
   */
  canAccessRoute(route: string): Observable<boolean> {
    return this.menuItems$.pipe(
      map(items => this.findMenuItemByRoute(items, route) !== null)
    );
  }

  /**
   * Find a menu item by route
   */
  private findMenuItemByRoute(items: MenuItem[], route: string): MenuItem | null {
    for (const item of items) {
      if (item.route === route) {
        return item;
      }
      if (item.children) {
        const found = this.findMenuItemByRoute(item.children, route);
        if (found) {
          return found;
        }
      }
    }
    return null;
  }
}
