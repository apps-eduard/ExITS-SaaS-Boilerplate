import { Component, computed, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { UserService, User } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';

interface Tenant {
  id: number;
  name: string;
  slug?: string;
  subdomain?: string;
  plan?: string;
  status: string;
  deletedAt?: string | null;
  created_at?: string;
}

@Component({
  selector: 'app-recycle-bin',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6 space-y-6">
      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span class="text-2xl">🗑️</span>
            Recycle Bin
          </h1>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Restore or permanently delete items
          </p>
        </div>
      </div>

      <!-- Tabs -->
      <div class="border-b border-gray-200 dark:border-gray-700">
        <nav class="-mb-px flex gap-6 overflow-x-auto">
          <button
            (click)="activeTab.set('users')"
            [class.border-primary-600]="activeTab() === 'users'"
            [class.text-primary-600]="activeTab() === 'users'"
            [class.dark:border-primary-500]="activeTab() === 'users'"
            [class.dark:text-primary-500]="activeTab() === 'users'"
            [class.border-transparent]="activeTab() !== 'users'"
            [class.text-gray-500]="activeTab() !== 'users'"
            [class.dark:text-gray-400]="activeTab() !== 'users'"
            class="flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors hover:text-gray-700 dark:hover:text-gray-300 whitespace-nowrap">
            <span class="text-lg">👤</span>
            Deleted Users
            @if (deletedUsers().length > 0) {
              <span class="ml-2 rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                {{ deletedUsers().length }}
              </span>
            }
          </button>
          <button
            (click)="activeTab.set('tenants')"
            [class.border-primary-600]="activeTab() === 'tenants'"
            [class.text-primary-600]="activeTab() === 'tenants'"
            [class.dark:border-primary-500]="activeTab() === 'tenants'"
            [class.dark:text-primary-500]="activeTab() === 'tenants'"
            [class.border-transparent]="activeTab() !== 'tenants'"
            [class.text-gray-500]="activeTab() !== 'tenants'"
            [class.dark:text-gray-400]="activeTab() !== 'tenants'"
            class="flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors hover:text-gray-700 dark:hover:text-gray-300 whitespace-nowrap">
            <span class="text-lg">🏢</span>
            Deleted Tenants
            @if (deletedTenants().length > 0) {
              <span class="ml-2 rounded-full bg-gray-100 dark:bg-gray-700 px-2 py-0.5 text-xs font-medium text-gray-600 dark:text-gray-400">
                {{ deletedTenants().length }}
              </span>
            }
          </button>
          <button
            (click)="activeTab.set('roles')"
            [class.border-primary-600]="activeTab() === 'roles'"
            [class.text-primary-600]="activeTab() === 'roles'"
            [class.dark:border-primary-500]="activeTab() === 'roles'"
            [class.dark:text-primary-500]="activeTab() === 'roles'"
            [class.border-transparent]="activeTab() !== 'roles'"
            [class.text-gray-500]="activeTab() !== 'roles'"
            [class.dark:text-gray-400]="activeTab() !== 'roles'"
            class="flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors hover:text-gray-700 dark:hover:text-gray-300 whitespace-nowrap">
            <span class="text-lg">🧩</span>
            Deleted Roles
          </button>
          <button
            (click)="activeTab.set('subscriptions')"
            [class.border-primary-600]="activeTab() === 'subscriptions'"
            [class.text-primary-600]="activeTab() === 'subscriptions'"
            [class.dark:border-primary-500]="activeTab() === 'subscriptions'"
            [class.dark:text-primary-500]="activeTab() === 'subscriptions'"
            [class.border-transparent]="activeTab() !== 'subscriptions'"
            [class.text-gray-500]="activeTab() !== 'subscriptions'"
            [class.dark:text-gray-400]="activeTab() !== 'subscriptions'"
            class="flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors hover:text-gray-700 dark:hover:text-gray-300 whitespace-nowrap">
            <span class="text-lg">💳</span>
            Deleted Subscriptions
          </button>
          <button
            (click)="activeTab.set('products')"
            [class.border-primary-600]="activeTab() === 'products'"
            [class.text-primary-600]="activeTab() === 'products'"
            [class.dark:border-primary-500]="activeTab() === 'products'"
            [class.dark:text-primary-500]="activeTab() === 'products'"
            [class.border-transparent]="activeTab() !== 'products'"
            [class.text-gray-500]="activeTab() !== 'products'"
            [class.dark:text-gray-400]="activeTab() !== 'products'"
            class="flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors hover:text-gray-700 dark:hover:text-gray-300 whitespace-nowrap">
            <span class="text-lg">🧱</span>
            Deleted Products
          </button>
          <button
            (click)="activeTab.set('history')"
            [class.border-primary-600]="activeTab() === 'history'"
            [class.text-primary-600]="activeTab() === 'history'"
            [class.dark:border-primary-500]="activeTab() === 'history'"
            [class.dark:text-primary-500]="activeTab() === 'history'"
            [class.border-transparent]="activeTab() !== 'history'"
            [class.text-gray-500]="activeTab() !== 'history'"
            [class.dark:text-gray-400]="activeTab() !== 'history'"
            class="flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors hover:text-gray-700 dark:hover:text-gray-300 whitespace-nowrap">
            <span class="text-lg">🧾</span>
            Recovery History
          </button>
        </nav>
      </div>

      <!-- Users Tab -->
      @if (activeTab() === 'users') {
        <div class="space-y-4">
          @if (userService.loadingSignal()) {
            <!-- Loading State -->
            <div class="flex flex-col items-center justify-center py-12 rounded border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-3"></div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Loading deleted users...</p>
            </div>
          } @else if (deletedUsers().length === 0) {
            <!-- Empty State -->
            <div class="text-center py-12 rounded border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <p class="text-gray-500 dark:text-gray-400 font-medium">No deleted users</p>
              <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">Users that are soft-deleted will appear here</p>
            </div>
          } @else {
            <!-- Users Table -->
            <div class="rounded border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 overflow-hidden">
              <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th class="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">User</th>
                    <th class="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Email</th>
                    <th class="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Roles</th>
                    <th class="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Deleted At</th>
                    <th class="px-4 py-2.5 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                  @for (user of deletedUsers(); track user.id) {
                    <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                      <td class="px-4 py-3 text-sm">
                        <div class="font-medium text-gray-900 dark:text-white">{{ user.firstName }} {{ user.lastName }}</div>
                      </td>
                      <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {{ user.email }}
                      </td>
                      <td class="px-4 py-3 text-sm">
                        <div class="flex flex-wrap gap-1">
                          @for (role of user.roles; track role.id) {
                            <span class="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                              {{ role.name }}
                            </span>
                          }
                        </div>
                      </td>
                      <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {{ formatDate(user.deletedAt) }}
                      </td>
                      <td class="px-4 py-3 text-sm text-right">
                        <div class="flex items-center justify-end gap-2">
                          <button
                            *ngIf="canRestoreUsers()"
                            (click)="restoreUser(user)"
                            class="inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 transition"
                            title="Restore User">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Restore
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }

      <!-- Tenants Tab -->
      @if (activeTab() === 'tenants') {
        <div class="space-y-4">
          @if (loadingTenants()) {
            <!-- Loading State -->
            <div class="flex flex-col items-center justify-center py-12 rounded border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
              <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600 mb-3"></div>
              <p class="text-sm text-gray-500 dark:text-gray-400">Loading deleted tenants...</p>
            </div>
          } @else if (deletedTenants().length === 0) {
            <!-- Empty State -->
            <div class="text-center py-12 rounded border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
              <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </div>
              <p class="text-gray-500 dark:text-gray-400 font-medium">No deleted tenants</p>
              <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">Tenants that are soft-deleted will appear here</p>
            </div>
          } @else {
            <!-- Tenants Table -->
            <div class="rounded border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 overflow-hidden">
              <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead class="bg-gray-50 dark:bg-gray-800">
                  <tr>
                    <th class="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Tenant</th>
                    <th class="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Slug</th>
                    <th class="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Plan</th>
                    <th class="px-4 py-2.5 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Deleted At</th>
                    <th class="px-4 py-2.5 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                  @for (tenant of deletedTenants(); track tenant.id) {
                    <tr class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                      <td class="px-4 py-3 text-sm">
                        <div class="font-medium text-gray-900 dark:text-white">{{ tenant.name }}</div>
                      </td>
                      <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {{ tenant.slug }}
                      </td>
                      <td class="px-4 py-3 text-sm">
                        <span class="inline-flex items-center rounded px-2 py-0.5 text-xs font-medium bg-purple-50 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                          {{ tenant.plan || 'Free' }}
                        </span>
                      </td>
                      <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400">
                        {{ formatDate(tenant.deletedAt) }}
                      </td>
                      <td class="px-4 py-3 text-sm text-right">
                        <div class="flex items-center justify-end gap-2">
                          <button
                            *ngIf="canRestoreTenants()"
                            (click)="restoreTenant(tenant)"
                            class="inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 transition"
                            title="Restore Tenant">
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                            </svg>
                            Restore
                          </button>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          }
        </div>
      }

      <!-- Roles Tab -->
      @if (activeTab() === 'roles') {
        <div class="space-y-4">
          <div class="text-center py-12 rounded border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
              <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
              </svg>
            </div>
            <p class="text-gray-500 dark:text-gray-400 font-medium">Deleted Roles</p>
            <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">Coming soon - Role restoration feature</p>
          </div>
        </div>
      }

      <!-- Subscriptions Tab -->
      @if (activeTab() === 'subscriptions') {
        <div class="space-y-4">
          <div class="text-center py-12 rounded border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
              <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z"/>
              </svg>
            </div>
            <p class="text-gray-500 dark:text-gray-400 font-medium">Deleted Subscriptions</p>
            <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">Coming soon - Subscription restoration feature</p>
          </div>
        </div>
      }

      <!-- Products Tab -->
      @if (activeTab() === 'products') {
        <div class="space-y-4">
          <div class="text-center py-12 rounded border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
              <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
              </svg>
            </div>
            <p class="text-gray-500 dark:text-gray-400 font-medium">Deleted Products</p>
            <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">Coming soon - Product restoration feature</p>
          </div>
        </div>
      }

      <!-- Recovery History Tab -->
      @if (activeTab() === 'history') {
        <div class="space-y-4">
          <div class="text-center py-12 rounded border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
            <div class="inline-flex items-center justify-center w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
              <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <p class="text-gray-500 dark:text-gray-400 font-medium">Recovery History</p>
            <p class="text-sm text-gray-400 dark:text-gray-500 mt-1">Coming soon - View all restoration activities and audit logs</p>
          </div>
        </div>
      }
    </div>
  `,
  styles: []
})
export class RecycleBinComponent {
  private http = inject(HttpClient);
  userService = inject(UserService);
  authService = inject(AuthService);
  confirmationService = inject(ConfirmationService);

  activeTab = signal<'users' | 'tenants' | 'roles' | 'subscriptions' | 'products' | 'history'>('users');
  tenants = signal<Tenant[]>([]);
  loadingTenants = signal(false);

  // Computed signals for deleted items
  deletedUsers = computed(() =>
    this.userService.usersSignal().filter(u => u.status === 'deleted')
  );

  deletedTenants = computed(() =>
    this.tenants().filter(t => t.status === 'deleted')
  );

  constructor() {
    // Load all users and tenants on init
    this.userService.loadUsers(1, 100);
    this.loadTenants();
  }

  // Load tenants
  async loadTenants(): Promise<void> {
    this.loadingTenants.set(true);
    try {
      const response: any = await firstValueFrom(
        this.http.get('http://localhost:3000/api/tenants')
      );
      this.tenants.set(response.tenants || []);
    } catch (error) {
      console.error('❌ Error loading tenants:', error);
      this.tenants.set([]);
    } finally {
      this.loadingTenants.set(false);
    }
  }

  // Permission checks
  canRestoreUsers(): boolean {
    return this.authService.hasPermission('users:update');
  }

  canRestoreTenants(): boolean {
    return this.authService.hasPermission('tenants:update');
  }

  // Format date helper
  formatDate(date: string | Date | null | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  // Restore user
  async restoreUser(user: User): Promise<void> {
    const confirmed = await this.confirmationService.confirm({
      title: 'Restore User',
      message: `Are you sure you want to restore ${user.email}? This will reactivate their account.`,
      confirmText: 'Restore',
      cancelText: 'Cancel',
      type: 'info',
      icon: 'info'
    });

    if (!confirmed) return;

    try {
      await this.userService.restoreUser(user.id);
      console.log(`✅ User restored: ${user.email}`);

      // Show success message
      await this.confirmationService.confirm({
        title: 'Success',
        message: `User ${user.email} has been restored successfully.`,
        confirmText: 'OK',
        type: 'success',
        icon: 'success'
      });

      // Reload users
      this.userService.loadUsers(1, 50);
    } catch (error) {
      console.error('❌ Error restoring user:', error);
      await this.confirmationService.confirm({
        title: 'Error',
        message: 'Failed to restore user. Please try again.',
        confirmText: 'OK',
        type: 'danger',
        icon: 'error'
      });
    }
  }

  // Restore tenant
  async restoreTenant(tenant: Tenant): Promise<void> {
    const confirmed = await this.confirmationService.confirm({
      title: 'Restore Tenant',
      message: `Are you sure you want to restore ${tenant.name}? This will reactivate the tenant.`,
      confirmText: 'Restore',
      cancelText: 'Cancel',
      type: 'info',
      icon: 'info'
    });

    if (!confirmed) return;

    try {
      await firstValueFrom(
        this.http.put(`http://localhost:3000/api/tenants/${tenant.id}/restore`, {})
      );
      console.log(`✅ Tenant restored: ${tenant.name}`);

      // Show success message
      await this.confirmationService.confirm({
        title: 'Success',
        message: `Tenant ${tenant.name} has been restored successfully.`,
        confirmText: 'OK',
        type: 'success',
        icon: 'success'
      });

      // Reload tenants
      await this.loadTenants();
    } catch (error) {
      console.error('❌ Error restoring tenant:', error);
      await this.confirmationService.confirm({
        title: 'Error',
        message: 'Failed to restore tenant. Please try again.',
        confirmText: 'OK',
        type: 'danger',
        icon: 'error'
      });
    }
  }
}
