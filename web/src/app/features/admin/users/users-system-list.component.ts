import { Component, OnInit, signal, computed, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService, User } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';
import { RBACService } from '../../../core/services/rbac.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { ResetPasswordModalComponent } from '../../../shared/components/reset-password-modal/reset-password-modal.component';

@Component({
  selector: 'app-users-system-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, ResetPasswordModalComponent],
  template: `
    <div class="p-3">
      <!-- Header -->
      <div class="flex items-center justify-between mb-3">
        <div>
          <h1 class="text-xl font-bold text-slate-800 dark:text-white">All System Users</h1>
          <p class="text-xs text-slate-500 mt-0.5">System administrators and platform users</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            (click)="loadData()"
            class="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 dark:text-slate-300
                   dark:hover:text-white bg-white dark:bg-slate-800 rounded-lg border border-slate-200
                   dark:border-slate-700 hover:border-slate-300 dark:hover:border-slate-600
                   transition-all duration-200 flex items-center gap-1.5"
            [class.opacity-50]="loading()"
            [disabled]="loading()"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Refresh
          </button>
          <button
            [routerLink]="['/admin/users/new']"
            [queryParams]="{type: 'system'}"
            class="px-3 py-1.5 text-xs font-medium text-white bg-gradient-to-r from-purple-600 to-blue-600
                   hover:from-purple-700 hover:to-blue-700 rounded-lg shadow-sm hover:shadow-md
                   transition-all duration-200 flex items-center gap-1.5"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Create System User
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
        <div class="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-950/30 dark:to-purple-900/30
                    rounded-xl p-3 border border-purple-200 dark:border-purple-800">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-purple-600 dark:text-purple-400 mb-1">Total System Users</p>
              <p class="text-2xl font-bold text-purple-700 dark:text-purple-300">{{ totalCount() }}</p>
            </div>
            <div class="w-10 h-10 bg-purple-500/20 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-950/30 dark:to-blue-900/30
                    rounded-xl p-3 border border-blue-200 dark:border-blue-800">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-blue-600 dark:text-blue-400 mb-1">Active Users</p>
              <p class="text-2xl font-bold text-blue-700 dark:text-blue-300">{{ activeCount() }}</p>
            </div>
            <div class="w-10 h-10 bg-blue-500/20 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-gradient-to-br from-amber-50 to-amber-100 dark:from-amber-950/30 dark:to-amber-900/30
                    rounded-xl p-3 border border-amber-200 dark:border-amber-800">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-amber-600 dark:text-amber-400 mb-1">Inactive Users</p>
              <p class="text-2xl font-bold text-amber-700 dark:text-amber-300">{{ inactiveCount() }}</p>
            </div>
            <div class="w-10 h-10 bg-amber-500/20 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-amber-600 dark:text-amber-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Filters -->
      <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700 p-3 mb-3">
        <div class="flex flex-wrap items-center gap-2">
          <!-- Search -->
          <div class="flex-1 min-w-[200px]">
            <div class="relative">
              <svg class="absolute left-2.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400"
                   fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2"
                      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (ngModelChange)="applyFilters()"
                placeholder="Search users..."
                class="w-full pl-9 pr-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200
                       dark:border-slate-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500
                       focus:border-transparent text-slate-900 dark:text-white placeholder-slate-400"
              />
            </div>
          </div>

          <!-- Status Filter -->
          <select
            [(ngModel)]="statusFilter"
            (ngModelChange)="applyFilters()"
            class="px-3 py-1.5 text-xs bg-slate-50 dark:bg-slate-900 border border-slate-200 dark:border-slate-700
                   rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent
                   text-slate-900 dark:text-white min-w-[120px]"
          >
            <option value="">All Status</option>
            <option value="active">Active</option>
            <option value="inactive">Inactive</option>
            <option value="suspended">Suspended</option>
          </select>

          <!-- Clear Filters -->
          <button
            *ngIf="searchQuery || statusFilter"
            (click)="clearFilters()"
            class="px-3 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-800 dark:text-slate-300
                   dark:hover:text-white bg-slate-100 dark:bg-slate-700 hover:bg-slate-200
                   dark:hover:bg-slate-600 rounded-lg transition-all duration-200"
          >
            Clear Filters
          </button>
        </div>
      </div>

      <!-- Users Table -->
      <div class="bg-white dark:bg-slate-800 rounded-xl border border-slate-200 dark:border-slate-700
                  shadow-sm overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-slate-50 dark:bg-slate-900 border-b border-slate-200 dark:border-slate-700">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300">
                  User
                </th>
                <th class="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Roles
                </th>
                <th class="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Status
                </th>
                <th class="px-4 py-2 text-left text-xs font-semibold text-slate-600 dark:text-slate-300">
                  Last Login
                </th>
                <th class="px-4 py-2 text-center text-xs font-semibold text-slate-600 dark:text-slate-300">
                  <span class="inline-flex items-center gap-1">
                    <span class="w-3.5 h-3.5">⚙️</span>
                    Actions
                  </span>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-slate-100 dark:divide-slate-700">
              <tr *ngIf="loading()" class="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td colspan="5" class="px-4 py-8 text-center">
                  <div class="flex items-center justify-center gap-2 text-slate-500 dark:text-slate-400">
                    <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor"
                            d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z">
                      </path>
                    </svg>
                    <span class="text-sm">Loading users...</span>
                  </div>
                </td>
              </tr>
              <tr *ngIf="!loading() && filteredUsers().length === 0" class="hover:bg-slate-50 dark:hover:bg-slate-700/50">
                <td colspan="5" class="px-4 py-8 text-center text-sm text-slate-500 dark:text-slate-400">
                  No system users found
                </td>
              </tr>
              <tr *ngFor="let user of filteredUsers()"
                  class="hover:bg-slate-50 dark:hover:bg-slate-700/50 transition-colors">
                <!-- User -->
                <td class="px-4 py-2">
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-lg bg-gradient-to-br from-purple-500 to-blue-500
                                flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                      {{ getInitials(user) }}
                    </div>
                    <div class="min-w-0">
                      <div class="font-medium text-sm text-slate-900 dark:text-white truncate">
                        {{ user.firstName }} {{ user.lastName }}
                      </div>
                      <div class="text-xs text-slate-500 dark:text-slate-400 truncate">
                        {{ user.email }}
                      </div>
                    </div>
                  </div>
                </td>

                <!-- Roles -->
                <td class="px-4 py-2">
                  <div class="flex flex-wrap gap-1">
                    <span *ngFor="let role of user.roles?.slice(0, 2)"
                          class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium
                                 bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                      {{ role.name }}
                    </span>
                    <span *ngIf="(user.roles?.length || 0) > 2"
                          class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium
                                 bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                      +{{ (user.roles?.length || 0) - 2 }}
                    </span>
                  </div>
                </td>

                <!-- Status -->
                <td class="px-4 py-2">
                  <span [ngClass]="{
                    'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300': user.status === 'active',
                    'bg-slate-100 text-slate-600 dark:bg-slate-700 dark:text-slate-300': user.status === 'inactive',
                    'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300': user.status === 'suspended'
                  }" class="inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium">
                    {{ user.status || 'active' }}
                  </span>
                </td>

                <!-- Last Login -->
                <td class="px-4 py-2 text-xs text-slate-600 dark:text-slate-300">
                  {{ user.lastLoginAt ? (user.lastLoginAt | date: 'short') : 'Never' }}
                </td>

                <!-- Actions -->
                <td class="px-4 py-2">
                  <div class="flex items-center justify-center gap-1">
                    <button
                      [routerLink]="['/admin/users', user.id]"
                      class="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded shadow-sm hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
                      title="Edit User"
                    >
                      <span class="w-3.5 h-3.5">✏️</span>
                    </button>
                    <button
                      (click)="resetPassword(user)"
                      class="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded shadow-sm hover:bg-purple-100 dark:hover:bg-purple-900/30 transition"
                      title="Reset Password"
                    >
                      <span class="w-3.5 h-3.5">🔑</span>
                    </button>
                    <button
                      (click)="deleteUser(user)"
                      class="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded shadow-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                      title="Delete User"
                    >
                      <span class="w-3.5 h-3.5">🗑️</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>

    <!-- Reset Password Modal -->
    <app-reset-password-modal #resetPasswordModal></app-reset-password-modal>
  `,
  styles: []
})
export class UsersSystemListComponent implements OnInit {
  @ViewChild('resetPasswordModal') resetPasswordModal!: ResetPasswordModalComponent;

  private userService = inject(UserService);
  private toastService = inject(ToastService);
  private rbacService = inject(RBACService);
  private confirmationService = inject(ConfirmationService);
  private router = inject(Router);

  // State
  loading = signal(false);
  users = signal<User[]>([]);
  filteredUsers = signal<User[]>([]);

  // Filters
  searchQuery = '';
  statusFilter = '';

  // Computed stats
  totalCount = computed(() => this.filteredUsers().length);

  activeCount = computed(() => {
    return this.filteredUsers().filter(u => u.status === 'active').length;
  });

  inactiveCount = computed(() => {
    return this.filteredUsers().filter(u => u.status === 'inactive' || u.status === 'suspended').length;
  });

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.loading.set(true);
    try {
      // Load users - only system users (tenantId === null)
      await this.userService.loadUsers(1, 1000, '');
      const allUsers = this.userService.usersSignal();
      const systemUsers = allUsers.filter(u => u.tenantId === null);
      this.users.set(systemUsers);
      this.filteredUsers.set(systemUsers);
    } catch (error) {
      console.error('Error loading data:', error);
      this.toastService.show('error', 'Failed to load system users');
    } finally {
      this.loading.set(false);
    }
  }

  applyFilters() {
    let filtered = [...this.users()];

    // Search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        u.firstName?.toLowerCase().includes(query) ||
        u.lastName?.toLowerCase().includes(query) ||
        u.email?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (this.statusFilter) {
      filtered = filtered.filter(u => u.status === this.statusFilter);
    }

    this.filteredUsers.set(filtered);
  }

  clearFilters() {
    this.searchQuery = '';
    this.statusFilter = '';
    this.applyFilters();
  }

  getInitials(user: User): string {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.email?.[0]?.toUpperCase() || '?';
  }

  resetPassword(user: User) {
    if (!user.id) {
      this.toastService.show('error', 'Invalid user ID');
      return;
    }

    this.resetPasswordModal.open({
      userId: user.id,
      userName: `${user.firstName} ${user.lastName}`,
      userEmail: user.email || ''
    });
  }

  async deleteUser(user: User) {
    const confirmed = await this.confirmationService.confirm({
      title: 'Delete User',
      message: `Are you sure you want to delete ${user.firstName} ${user.lastName}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (confirmed && user.id) {
      try {
        await this.userService.deleteUser(user.id);
        this.toastService.show('success', 'User deleted successfully');
        this.loadData();
      } catch (error) {
        console.error('Error deleting user:', error);
        this.toastService.show('error', 'Failed to delete user');
      }
    }
  }
}
