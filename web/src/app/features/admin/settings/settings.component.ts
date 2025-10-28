import { Component, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { HeaderComponent } from '../../../shared/components/header/header.component';
import { SidebarComponent } from '../../../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-settings',
  standalone: true,
  imports: [CommonModule, RouterLink, HeaderComponent, SidebarComponent],
  template: `
    <div class="flex h-screen bg-gray-50 dark:bg-gray-900">
      <app-sidebar #sidebar/>

      <div class="flex-1 flex flex-col overflow-hidden">
        <app-header (menuToggle)="toggleSidebar()"/>

        <main class="flex-1 overflow-y-auto p-4 lg:p-6">
          <div class="space-y-4 max-w-6xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">Settings</h1>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Manage system configuration and preferences</p>
        </div>
        <button
          (click)="goBack()"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      </div>

      <!-- Access Denied for non-admins -->
      <div *ngIf="!canAccessSettings()" class="rounded-lg border border-yellow-200 dark:border-yellow-900 bg-yellow-50 dark:bg-yellow-900/20 p-4">
        <div class="flex items-start gap-3">
          <svg class="w-6 h-6 text-yellow-600 dark:text-yellow-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <h3 class="text-sm font-semibold text-yellow-800 dark:text-yellow-300">Access Restricted</h3>
            <p class="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
              You don't have permission to access system settings. Please contact your administrator.
            </p>
          </div>
        </div>
      </div>

      <!-- Settings Grid (only shown if user has access) -->
      <div *ngIf="canAccessSettings()" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        <!-- System Settings -->
        <div *ngIf="authService.hasPermission('system:view')"
             routerLink="/admin/system"
             class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 hover:shadow-md transition-shadow cursor-pointer">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white">System</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">View system information and configuration</p>
            </div>
          </div>
        </div>

        <!-- User Management -->
        <div *ngIf="authService.hasPermission('users:view')"
             routerLink="/admin/users"
             class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 hover:shadow-md transition-shadow cursor-pointer">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
              <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Users</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Manage user accounts and permissions</p>
            </div>
          </div>
        </div>

        <!-- Role Management -->
        <div *ngIf="authService.hasPermission('roles:view')"
             routerLink="/admin/roles"
             class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 hover:shadow-md transition-shadow cursor-pointer">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
              <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Roles & Permissions</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Configure access control and roles</p>
            </div>
          </div>
        </div>

        <!-- Tenant Management -->
        <div *ngIf="authService.hasPermission('tenants:view')"
             routerLink="/admin/tenants"
             class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 hover:shadow-md transition-shadow cursor-pointer">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
              <svg class="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Tenants</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Manage tenant organizations</p>
            </div>
          </div>
        </div>

        <!-- Audit Logs -->
        <div *ngIf="authService.hasPermission('audit:view')"
             routerLink="/admin/audit-logs"
             class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 hover:shadow-md transition-shadow cursor-pointer">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
              <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Audit Logs</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">View system activity and logs</p>
            </div>
          </div>
        </div>

        <!-- Modules -->
        <div *ngIf="authService.hasPermission('modules:view')"
             routerLink="/admin/modules"
             class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 hover:shadow-md transition-shadow cursor-pointer">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center flex-shrink-0">
              <svg class="w-6 h-6 text-indigo-600 dark:text-indigo-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Modules</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Manage system modules and features</p>
            </div>
          </div>
        </div>

        <!-- Billing -->
        <div *ngIf="authService.hasPermission('billing:read')"
             routerLink="/admin/billing"
             class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 hover:shadow-md transition-shadow cursor-pointer">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
              <svg class="w-6 h-6 text-emerald-600 dark:text-emerald-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Billing</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Manage plans, subscriptions, and invoices</p>
            </div>
          </div>
        </div>

        <!-- System Backup -->
        <div *ngIf="authService.hasPermission('backup:view')"
             routerLink="/admin/system/backup"
             class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 hover:shadow-md transition-shadow cursor-pointer">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center flex-shrink-0">
              <svg class="w-6 h-6 text-cyan-600 dark:text-cyan-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4" />
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white">System Backup</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Manage database backups and schedules</p>
            </div>
          </div>
        </div>

        <!-- Security Policy -->
        <div *ngIf="authService.hasPermission('security-policy:view')"
             routerLink="/admin/system/security-policy"
             class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 hover:shadow-md transition-shadow cursor-pointer">
          <div class="flex items-start gap-3">
            <div class="w-10 h-10 rounded-lg bg-rose-100 dark:bg-rose-900/30 flex items-center justify-center flex-shrink-0">
              <svg class="w-6 h-6 text-rose-600 dark:text-rose-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Security Policy</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Configure security settings and policies</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Stats (if user has access) -->
      <div *ngIf="canAccessSettings()" class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Quick Information</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div class="text-center">
            <p class="text-xs text-gray-500 dark:text-gray-400">Your Role</p>
            <p class="text-sm font-semibold text-gray-900 dark:text-white mt-1">
              {{ authService.isSystemAdmin() ? 'System Admin' : 'Tenant User' }}
            </p>
          </div>
          <div class="text-center">
            <p class="text-xs text-gray-500 dark:text-gray-400">User Type</p>
            <p class="text-sm font-semibold text-gray-900 dark:text-white mt-1">
              {{ authService.currentUser()?.tenantId ? 'Tenant' : 'System' }}
            </p>
          </div>
          <div class="text-center">
            <p class="text-xs text-gray-500 dark:text-gray-400">Access Level</p>
            <p class="text-sm font-semibold text-gray-900 dark:text-white mt-1">Full</p>
          </div>
          <div class="text-center">
            <p class="text-xs text-gray-500 dark:text-gray-400">Status</p>
            <p class="text-sm font-semibold text-green-600 dark:text-green-400 mt-1">Active</p>
          </div>
        </div>
      </div>
    </div>
        </main>
      </div>
    </div>
  `
})
export class SettingsComponent {
  @ViewChild('sidebar') sidebar!: SidebarComponent;
  authService = inject(AuthService);
  router = inject(Router);

  canAccessSettings(): boolean {
    return this.authService.isSystemAdmin() ||
           this.authService.hasPermission('system:view') ||
           this.authService.hasPermission('settings:view');
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  toggleSidebar() {
    if (this.sidebar) {
      this.sidebar.isOpen.update(v => !v);
    }
  }
}
