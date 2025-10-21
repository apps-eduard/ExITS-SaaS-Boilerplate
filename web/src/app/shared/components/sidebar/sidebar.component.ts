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
  menuKey?: string;
  requiredAction?: string;
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
        class="fixed inset-0 z-30 bg-black/50 lg:hidden">
      </div>
    }

    <!-- Sidebar: Fixed overlay on mobile, sticky on desktop -->
    <aside
      class="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 ease-in-out"
      [class.fixed]="!isDesktop()"
      [class.lg:sticky]="isDesktop()"
      [class.top-0]="!isDesktop()"
      [class.left-0]="!isDesktop()"
      [class.z-40]="!isDesktop()"
      [class.h-screen]="!isDesktop()"
      [class.-translate-x-full]="!isOpen() && !isDesktop()"
      [class.translate-x-0]="isOpen() || isDesktop()">
      
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
        @for (item of staticMenuItems(); track item.label) {
          @if (hasMenuAccessMethod(item.menuKey)) {
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
                      @if (hasMenuAccessMethod(child.menuKey)) {
                        <a
                          [routerLink]="child.route"
                          routerLinkActive="text-primary-600 dark:text-primary-400 font-semibold"
                          class="block px-2 py-1 text-xs text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 rounded hover:bg-gray-100 dark:hover:bg-gray-700 truncate">
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
  
  isOpen = signal(false);
  isDesktop = signal(window.innerWidth >= 1024);
  expandedGroups = signal(new Set<string>(['Dashboard']));
  
  staticMenuItems = signal<MenuItem[]>([
    { label: 'Dashboard', icon: '📊', route: '/dashboard', menuKey: 'dashboard' },
    {
      label: 'Tenants',
      icon: '🏢',
      menuKey: 'tenants',
      children: [
        { label: 'Overview', icon: '📋', route: '/tenants', menuKey: 'tenants' },
        { label: 'Create Tenant', icon: '➕', route: '/tenants/create', menuKey: 'tenants', requiredAction: 'create' },
        { label: 'Subscriptions', icon: '💳', route: '/tenants/subscriptions', menuKey: 'tenants' },
        { label: 'Usage Analytics', icon: '📊', route: '/tenants/usage', menuKey: 'tenants' },
      ]
    },
    {
      label: 'Users',
      icon: '👥',
      menuKey: 'users',
      children: [
        { label: 'All Users', icon: '👤', route: '/users', menuKey: 'users' },
        { label: 'Invite User', icon: '📧', route: '/users/invite', menuKey: 'users', requiredAction: 'create' },
        { label: 'Admin Users', icon: '👑', route: '/users/admins', menuKey: 'users' },
        { label: 'User Activity', icon: '👣', route: '/users/activity', menuKey: 'users' },
      ]
    },
    {
      label: 'Roles & Permissions',
      icon: '🔐',
      menuKey: 'roles',
      children: [
        { label: 'Roles Management', icon: '👔', route: '/admin/roles', menuKey: 'roles' }
      ]
    },
    {
      label: 'System',
      icon: '⚙️',
      menuKey: 'system',
      children: [
        { label: 'System Health', icon: '💚', route: '/system/health', menuKey: 'system' },
        { label: 'Performance', icon: '⚡', route: '/system/performance', menuKey: 'system' },
        { label: 'Database', icon: '🗄️', route: '/system/database', menuKey: 'system' },
        { label: 'API Status', icon: '🌐', route: '/system/api', menuKey: 'system' },
      ]
    },
    {
      label: 'Monitoring',
      icon: '📈',
      menuKey: 'monitoring',
      children: [
        { label: 'Error Logs', icon: '⚠️', route: '/monitoring/errors', menuKey: 'monitoring' },
        { label: 'Audit Logs', icon: '📋', route: '/monitoring/audit', menuKey: 'monitoring' },
        { label: 'Security Events', icon: '🔒', route: '/monitoring/security', menuKey: 'monitoring' },
        { label: 'System Logs', icon: '📄', route: '/monitoring/logs', menuKey: 'monitoring' },
      ]
    },
    {
      label: 'Configuration',
      icon: '🛠️',
      menuKey: 'config',
      children: [
        { label: 'Email', icon: '📧', route: '/config/email', menuKey: 'config' },
        { label: 'SMS', icon: '💬', route: '/config/sms', menuKey: 'config' },
        { label: 'Notifications', icon: '🔔', route: '/config/notifications', menuKey: 'config' },
        { label: 'API Keys', icon: '🔑', route: '/config/api-keys', menuKey: 'config', requiredAction: 'create' },
        { label: 'Webhooks', icon: '🪝', route: '/config/webhooks', menuKey: 'config' },
      ]
    },
    {
      label: 'Billing',
      icon: '💰',
      menuKey: 'billing',
      children: [
        { label: 'Plans', icon: '📋', route: '/billing/plans', menuKey: 'billing' },
        { label: 'Invoices', icon: '💳', route: '/billing/invoices', menuKey: 'billing' },
        { label: 'Payments', icon: '💸', route: '/billing/payments', menuKey: 'billing' },
        { label: 'Revenue', icon: '📊', route: '/billing/revenue', menuKey: 'billing' },
      ]
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
    console.log('🧭 SidebarComponent initialized - RBAC support active');

    // Add debug logging
    console.log('📊 Current user:', this.authService.currentUser());
    console.log('🔐 RBAC Service initialized');
    console.log('📋 User permissions available:', Object.keys(this.rbacService.userPermissions()));
  }

  /**
   * Check if user has access to a menu - Public method for template
   */
  hasMenuAccessMethod(menuKey?: string): boolean {
    if (!menuKey) return false;
    
    // Get current permissions
    const permissions = this.rbacService.userPermissions();
    const hasPermissions = Object.keys(permissions).length > 0;
    
    // If no permissions loaded yet, show all menus (demo mode)
    if (!hasPermissions) {
      console.log('⚠️ No permissions loaded, showing all menus (demo mode)');
      return true;
    }
    
    // Check if user has this menu
    const hasAccess = this.rbacService.hasMenuAccess(menuKey);
    console.log(`🔍 Menu "${menuKey}" access: ${hasAccess}`);
    return hasAccess;
  }

  /**
   * Check if user has action on menu - Public method for template
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
    this.isOpen.set(false);
  }
}
