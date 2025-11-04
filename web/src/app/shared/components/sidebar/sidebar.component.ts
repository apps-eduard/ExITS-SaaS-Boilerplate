import { Component, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RBACService } from '../../../core/services/rbac.service';

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
  permission?: string; // Standard RBAC: "resource:action" format
  anyPermission?: string[]; // Show if user has ANY of these permissions
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <!-- Mobile Overlay (Mobile only) -->
    @if (isOpen() && !isDesktop()) {
      <div
        (click)="isOpen.set(false)"
        class="fixed inset-0 bg-black/20 dark:bg-black/40 z-30 lg:hidden"></div>
    }

    <!-- Sidebar -->
    <aside
      class="fixed lg:relative top-0 left-0 h-screen bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 ease-in-out z-50 lg:z-auto overflow-hidden"
      [class.-translate-x-full]="!isOpen()"
      [class.translate-x-0]="isOpen()"
      [class.w-64]="isOpen()"
      [class.w-0]="!isOpen()"
      [class.lg:border-r-0]="!isOpen()">

      <!-- Logo -->
      <div class="h-14 flex items-center justify-between px-3 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-2">
          <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center shadow-lg">
            <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <div>
            <h1 class="text-sm font-bold text-gray-900 dark:text-white">ExITS</h1>
            <p class="text-xs text-gray-500 dark:text-gray-400">Admin</p>
          </div>
        </div>
        <!-- Close Button (Mobile) -->
        <button
          (click)="isOpen.set(false)"
          class="lg:hidden p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-700">
          <svg class="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto p-2 space-y-0.5">
        @if (!rbacService.permissionsLoaded()) {
          <!-- Loading State -->
          <div class="flex flex-col items-center justify-center py-8 px-4">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-3"></div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Loading menu...</p>
          </div>
        } @else {
          @for (item of staticMenuItems(); track item.label) {
            @if (checkMenuAccess(item)) {
              @if (!item.children) {
                <!-- Simple Link -->
                <a
                  [routerLink]="item.route"
                  routerLinkActive="bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
                  [routerLinkActiveOptions]="{exact: false}"
                  class="flex items-center gap-2 px-2 py-1.5 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm">
                  <span class="text-lg flex-shrink-0">{{ item.icon }}</span>
                  <span class="font-medium truncate">{{ item.label }}</span>
                </a>
              } @else {
                <!-- Expandable Group -->
                <div>
                  <button
                    (click)="toggleGroup(item.label)"
                    class="w-full flex items-center justify-between gap-2 px-2 py-1.5 rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors text-sm">
                    <div class="flex items-center gap-2 min-w-0">
                      <span class="text-lg flex-shrink-0">{{ item.icon }}</span>
                      <span class="font-medium truncate">{{ item.label }}</span>
                    </div>
                    <svg
                      class="w-3.5 h-3.5 transition-transform flex-shrink-0"
                      [class.rotate-180]="expandedGroups().has(item.label)"
                      fill="currentColor"
                      viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
                    </svg>
                  </button>

                  @if (expandedGroups().has(item.label)) {
                    <div class="mt-0.5 ml-2 pl-4 border-l-2 border-gray-200 dark:border-gray-700 space-y-0.5">
                      @for (child of item.children; track child.label) {
                        @if (checkMenuAccess(child)) {
                          <a
                            [routerLink]="child.route"
                            routerLinkActive="text-primary-600 dark:text-primary-400 font-semibold"
                            class="flex items-center gap-2 px-2 py-1 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 rounded hover:bg-gray-100 dark:hover:bg-gray-700 truncate">
                            <span class="text-base flex-shrink-0">{{ child.icon }}</span>
                            {{ child.label }}
                          </a>
                        }
                      }
                    </div>
                  }
                </div>
              }
            }
          }
        }
      </nav>

      <!-- Footer -->
      <div class="p-3 border-t border-gray-200 dark:border-gray-700">
        <div class="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-lg p-3">
          <p class="text-xs font-semibold text-gray-900 dark:text-white mb-2">Need Help?</p>
          <button class="w-full px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium rounded-md">
            Contact Support
          </button>
        </div>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  authService = inject(AuthService);
  rbacService = inject(RBACService);

  isOpen = signal(true);
  isDesktop = signal(window.innerWidth >= 1024);
  expandedGroups = signal(new Set<string>(['Dashboard']));

  staticMenuItems = signal<MenuItem[]>([
    { label: 'Dashboard', icon: '📊', route: '/dashboard', permission: 'dashboard:view' },
    {
      label: 'Tenants',
      icon: '🏢',
      anyPermission: ['tenants:read', 'tenants:create', 'tenants:update'],
      children: [
        { label: 'All Tenants', icon: '🆕', route: '/admin/tenants', permission: 'tenants:read' },
        { label: 'New Tenant', icon: '➕', route: '/admin/tenants/new', permission: 'tenants:create' },
        { label: 'Tenant Settings', icon: '⚙️', route: '/admin/tenants/settings', permission: 'tenants:update' },
      ]
    },
    {
      label: 'User Management',
      icon: '🧑‍🤝‍🧑',
      anyPermission: ['users:read', 'users:create', 'users:update', 'tenant-users:read'],
      children: [
        { label: 'Tenant Users', icon: '👥', route: '/admin/users/tenants', anyPermission: ['users:read', 'tenant-users:read'] },
        { label: 'All System Users', icon: '👨‍💼', route: '/admin/users/system', permission: 'users:read' },
        { label: 'Admin Users', icon: '🔑', route: '/admin/users/admins', permission: 'users:read' },
        { label: 'Invite User', icon: '✉️', route: '/admin/users/invite', anyPermission: ['users:create', 'tenant-users:invite'] },
        { label: 'Roles & Permissions', icon: '🔐', route: '/admin/roles', permission: 'roles:read' },
      ]
    },
    {
      label: 'Platforms',
      icon: '📦',
      anyPermission: ['platforms:read', 'platforms:create', 'platforms:update'],
      children: [
        { label: 'Add Platform', icon: '➕', route: '/admin/platforms/new', permission: 'platforms:create' },
        { label: 'Platform Catalog', icon: '📦', route: '/admin/platforms', permission: 'platforms:read' },
        { label: 'Platform Mapping', icon: '🌐', route: '/admin/platforms/mapping', permission: 'platforms:update' },
        { label: 'Platform Settings', icon: '⚙️', route: '/admin/platforms/settings', permission: 'platforms:update' },
      ]
    },
    {
      label: 'Money Loan',
      icon: '💰',
      anyPermission: ['money-loan:read', 'money-loan:overview:view', 'money-loan:customers:read', 'money-loan:loans:read'],
      children: [
        { label: 'Overview', icon: '📊', route: '/admin/money-loan/overview', permission: 'money-loan:overview:view' },
        { label: 'Customers', icon: '👥', route: '/admin/money-loan/customers', permission: 'money-loan:customers:read' },
        { label: 'All Loans', icon: '📝', route: '/admin/money-loan/loans', permission: 'money-loan:loans:read' },
        { label: 'Record Payment', icon: '💳', route: '/admin/money-loan/payments/record', permission: 'money-loan:payments:create' },
        { label: 'Collections', icon: '🔔', route: '/admin/money-loan/collections', permission: 'money-loan:collections:read' },
        { label: 'Reports', icon: '📈', route: '/admin/money-loan/reports', permission: 'money-loan:reports:read' },
      ]
    },
    {
      label: 'Subscriptions',
      icon: '💳',
      anyPermission: ['subscriptions:read', 'subscriptions:create', 'tenant-billing:read'],
      children: [
        { label: 'All Subscriptions', icon: '🧾', route: '/admin/subscriptions', permission: 'subscriptions:read' },
        { label: 'New Subscription', icon: '➕', route: '/admin/subscriptions/new', permission: 'subscriptions:create' },
        { label: 'Plan Templates', icon: '📋', route: '/admin/subscriptions/plans', permission: 'subscriptions:manage-plans' },
        { label: 'Billing Overview', icon: '💰', route: '/admin/subscriptions/billing', permission: 'tenant-billing:read' },
        { label: 'Invoices', icon: '💳', route: '/admin/subscriptions/invoices', permission: 'tenant-billing:view-invoices' },
        { label: 'Renewal Settings', icon: '⚙️', route: '/admin/subscriptions/renewal-settings', permission: 'tenant-billing:manage-renewals' },
      ]
    },
    {
      label: 'System',
      icon: '🖥️',
      anyPermission: ['settings:read', 'settings:update', 'backup:view', 'audit:read', 'activity-dashboard:view'],
      children: [
        { label: 'Dashboard', icon: '📊', route: '/admin/system', permission: 'settings:read' },
        { label: 'Health Monitor', icon: '💚', route: '/admin/system/health', permission: 'settings:read' },
        { label: 'Performance', icon: '⚡', route: '/admin/system/performance', permission: 'settings:read' },
        { label: 'System Logs', icon: '📝', route: '/admin/system/logs', permission: 'activity-dashboard:view' },
        { label: 'Backup', icon: '💾', route: '/admin/system/backup', permission: 'backup:view' },
      ]
    },
    {
      label: 'Reports',
      icon: '📊',
      anyPermission: ['reports:view', 'reports:export', 'analytics:view', 'activity-dashboard:view'],
      children: [
        { label: 'Tenant Usage', icon: '📈', route: '/admin/reports/tenant-usage', permission: 'reports:view' },
        { label: 'Revenue Reports', icon: '💰', route: '/admin/reports/revenue', permission: 'reports:view' },
        { label: 'Subscription History', icon: '📜', route: '/admin/reports/subscription-history', permission: 'reports:view' },
        { label: 'Platform Adoption', icon: '🧩', route: '/admin/platform-adoption', permission: 'reports:view' },
      ]
    },
    {
      label: 'Settings',
      icon: '⚙️',
      anyPermission: ['settings:read', 'settings:update'],
      children: [
        { label: 'General', icon: '🔧', route: '/admin/settings/general', permission: 'settings:update' },
        { label: 'Security & Policies', icon: '🔒', route: '/admin/settings/security-policies', permission: 'settings:update' },
        { label: 'Email', icon: '📧', route: '/admin/settings/email', permission: 'settings:update' },
        { label: 'Storage', icon: '💾', route: '/admin/settings/storage', permission: 'settings:update' },
        { label: 'Performance', icon: '⚡', route: '/admin/settings/performance', permission: 'settings:update' },
        { label: 'Notification Rules', icon: '🔔', route: '/admin/settings/notifications', permission: 'settings:update' },
      ]
    },
    {
      label: 'Recycle Bin',
      icon: '♻️',
      route: '/admin/recycle-bin',
      anyPermission: ['recycle-bin:view', 'recycle-bin:restore']
    },
  ]);

  constructor() {
    // Track desktop status
    const handleResize = () => {
      this.isDesktop.set(window.innerWidth >= 1024);
      if (window.innerWidth >= 1024) {
        this.isOpen.set(false);
      }
    };

    window.addEventListener('resize', handleResize);
    // console.log('🧭 SidebarComponent initialized - Standard RBAC active');
  }

  /**
   * Check if user has access to a menu item (Standard RBAC)
   */
  checkMenuAccess(item: MenuItem): boolean {
    if (!this.authService.isAuthenticated()) {
      // console.log('❌ User not authenticated');
      return false;
    }

    const permissions = this.rbacService.userPermissions();
    // console.log('🔍 Checking menu access for:', item.label, {
    //   permission: item.permission,
    //   anyPermission: item.anyPermission,
    //   totalPermissions: permissions.size,
    //   allPermissions: Array.from(permissions)
    // });

    // Check specific permission
    if (item.permission) {
      const hasAccess = this.rbacService.can(item.permission);
      // console.log(`  → ${item.permission}: ${hasAccess}`);
      return hasAccess;
    }

    // Check if user has ANY of the required permissions
    if (item.anyPermission && item.anyPermission.length > 0) {
      const hasAccess = this.rbacService.canAny(item.anyPermission);
      // console.log(`  → Any of [${item.anyPermission.join(', ')}]: ${hasAccess}`);
      return hasAccess;
    }

    // If no permission specified, show by default
    console.log('  → No permission required, showing by default');
    return true;
  }

  /**
   * LEGACY: Check if user has access to a menu - Kept for backward compatibility
   * @deprecated Use checkMenuAccess() instead
   */
  hasMenuAccessMethod(menuKey?: string): boolean {
    if (!menuKey) return false;
    return this.rbacService.hasMenuAccess(menuKey);
  }

  /**
   * LEGACY: Check if user has action on menu
   * @deprecated Use rbacService.can() directly
   */
  hasActionMethod(menuKey?: string, actionKey?: string): boolean {
    if (!menuKey || !actionKey) return false;
    return this.rbacService.hasAction(menuKey, actionKey);
  }

  toggleGroup(label: string) {
    const groups = this.expandedGroups();
    const newGroups = new Set(groups);
    if (newGroups.has(label)) {
      newGroups.delete(label);
    } else {
      newGroups.add(label);
    }
    this.expandedGroups.set(newGroups);
  }

  closeMenu() {
    // Only close sidebar on mobile (width < 1024px)
    if (!this.isDesktop()) {
      this.isOpen.set(false);
    }
  }
}
