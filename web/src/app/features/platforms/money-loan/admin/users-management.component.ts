/**
 * Users Management Component - Money Loan Platform
 *
 * PROFESSIONAL IMPLEMENTATION with Table State Service Integration
 *
 * This component demonstrates how to:
 * 1. Use TableStateService for professional table state management
 * 2. Integrate API-driven data with debouncing and pagination
 * 3. Maintain separate selection state (not part of table state)
 * 4. Combine with existing UserService for actions
 * 5. Handle permissions and RBAC
 *
 * Key Pattern: TableStateService manages data/loading/pagination/filters,
 *              Component manages UI-specific state like selection
 */
import { Component, OnInit, OnDestroy, signal, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { inject } from '@angular/core';

// Core Services
import { UserService, User } from '../../../../core/services/user.service';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';

// Table State Management
import { TableStateService } from '../../../../shared/services/table-state.service';

@Component({
  selector: 'app-users-management',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 space-y-3">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span class="text-lg">🧑‍💻</span>
            User Management
          </h1>
          <p class="text-xs text-gray-500 dark:text-gray-400">Manage Money Loan platform users and permissions</p>
        </div>
        <button
          *ngIf="canCreateUsers()"
          (click)="createUser()"
          class="inline-flex items-center gap-1.5 rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 shadow-sm transition"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Create User
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-4 gap-2">
        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400">Total Users</p>
              <p class="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
                {{ tableManager.pagination().total || 0 }}
              </p>
            </div>
            <div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <span class="text-lg">👥</span>
            </div>
          </div>
        </div>
        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400">Active</p>
              <p class="text-xl font-bold text-green-600 dark:text-green-400 mt-0.5">
                {{ activeUsersCount() }}
              </p>
            </div>
            <div class="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <span class="text-lg">✅</span>
            </div>
          </div>
        </div>
        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400">Inactive</p>
              <p class="text-xl font-bold text-gray-600 dark:text-gray-400 mt-0.5">
                {{ inactiveUsersCount() }}
              </p>
            </div>
            <div class="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <span class="text-lg">⏸️</span>
            </div>
          </div>
        </div>
        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400">Suspended</p>
              <p class="text-xl font-bold text-red-600 dark:text-red-400 mt-0.5">
                {{ suspendedUsersCount() }}
              </p>
            </div>
            <div class="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <span class="text-lg">🚫</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters & Actions -->
      <div class="space-y-2">
        <!-- Search Bar -->
        <div class="flex items-center gap-2">
          <div class="flex-1 relative">
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (ngModelChange)="onSearchChange($event)"
              placeholder="Search users by name or email..."
              class="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
            />
            <svg class="absolute left-2.5 top-2 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <button
            (click)="clearAllFilters()"
            class="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Clear Filters
          </button>
        </div>

        <!-- Filter Pills & Bulk Actions -->
        <div class="flex items-center justify-between gap-2">
          <div class="flex flex-wrap items-center gap-2">
            <!-- Status Filter -->
            <select
              [(ngModel)]="statusFilter"
              (ngModelChange)="onStatusFilterChange($event)"
              class="text-xs px-2.5 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>

            <!-- Active Filters Display -->
            <div class="flex items-center gap-1.5">
              <span *ngIf="statusFilter"
                    class="inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                Status: {{ statusFilter }}
                <button (click)="clearStatusFilter()" class="hover:text-blue-900 dark:hover:text-blue-200">×</button>
              </span>
            </div>
          </div>

          <!-- Bulk Actions -->
          <div *ngIf="selectedUsers().size > 0 && canBulkManageUsers()" class="flex items-center gap-2">
            <span class="text-xs text-gray-600 dark:text-gray-400">
              {{ selectedUsers().size }} selected
            </span>
            <button
              (click)="bulkActivate()"
              class="px-2.5 py-1 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded hover:bg-green-100 dark:hover:bg-green-900/30 transition"
            >
              Activate
            </button>
            <button
              (click)="bulkSuspend()"
              class="px-2.5 py-1 text-xs font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition"
            >
              Suspend
            </button>
            <button
              (click)="clearSelection()"
              class="px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Clear
            </button>
          </div>
        </div>
      </div>

      <!-- Users Table -->
      <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <!-- Loading State -->
        <div *ngIf="tableManager.loading()" class="p-8 text-center">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading users...</p>
        </div>

        <!-- Error State -->
        <div *ngIf="tableManager.error()" class="p-8 text-center">
          <div class="text-red-600 dark:text-red-400">
            <svg class="mx-auto h-12 w-12" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p class="mt-2 text-sm font-medium">Failed to load users</p>
            <p class="mt-1 text-xs text-gray-600 dark:text-gray-400">{{ tableManager.error() }}</p>
            <button
              (click)="tableManager.refresh()"
              class="mt-4 px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded hover:bg-blue-700"
            >
              Retry
            </button>
          </div>
        </div>

        <!-- Table Content -->
        <div *ngIf="!tableManager.loading() && !tableManager.error()">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-900/50">
              <tr>
                <th class="w-10 px-3 py-2">
                  <input
                    type="checkbox"
                    [checked]="isAllSelected()"
                    [indeterminate]="isSomeSelected()"
                    (change)="toggleSelectAll()"
                    class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                </th>
                <th (click)="toggleSort('firstName')"
                    class="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                  <div class="flex items-center gap-1">
                    Name
                    <span *ngIf="tableManager.state().sortColumn === 'firstName'">
                      {{ tableManager.state().sortDirection === 'asc' ? '↑' : '↓' }}
                    </span>
                  </div>
                </th>
                <th (click)="toggleSort('email')"
                    class="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                  <div class="flex items-center gap-1">
                    Email
                    <span *ngIf="tableManager.state().sortColumn === 'email'">
                      {{ tableManager.state().sortDirection === 'asc' ? '↑' : '↓' }}
                    </span>
                  </div>
                </th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Roles</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th (click)="toggleSort('lastLoginAt')"
                    class="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800">
                  <div class="flex items-center gap-1">
                    Last Login
                    <span *ngIf="tableManager.state().sortColumn === 'lastLoginAt'">
                      {{ tableManager.state().sortDirection === 'asc' ? '↑' : '↓' }}
                    </span>
                  </div>
                </th>
                <th class="px-3 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr *ngFor="let user of tableManager.data()"
                  [class.bg-blue-50]="selectedUsers().has(user.id)"
                  [class.dark:bg-blue-900/10]="selectedUsers().has(user.id)"
                  class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                <td class="px-3 py-2">
                  <input
                    type="checkbox"
                    [checked]="selectedUsers().has(user.id)"
                    (change)="toggleUserSelection(user.id)"
                    class="rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-blue-500"
                  />
                </td>
                <td class="px-3 py-2">
                  <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center text-white text-xs font-medium">
                      {{ getInitials(user) }}
                    </div>
                    <div>
                      <div class="text-sm font-medium text-gray-900 dark:text-white">{{ getDisplayName(user) }}</div>
                      <div class="text-xs text-gray-500 dark:text-gray-400">ID: {{ user.id }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-3 py-2 text-sm text-gray-900 dark:text-white">{{ user.email }}</td>
                <td class="px-3 py-2">
                  <div class="flex flex-wrap gap-1">
                    <span *ngFor="let role of user.roles"
                          class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                          [class.bg-purple-100]="role.name === 'Admin'"
                          [class.dark:bg-purple-900/30]="role.name === 'Admin'"
                          [class.text-purple-800]="role.name === 'Admin'"
                          [class.dark:text-purple-300]="role.name === 'Admin'"
                          [class.bg-blue-100]="role.name === 'Manager'"
                          [class.dark:bg-blue-900/30]="role.name === 'Manager'"
                          [class.text-blue-800]="role.name === 'Manager'"
                          [class.dark:text-blue-300]="role.name === 'Manager'"
                          [class.bg-gray-100]="role.name !== 'Admin' && role.name !== 'Manager'"
                          [class.dark:bg-gray-700]="role.name !== 'Admin' && role.name !== 'Manager'"
                          [class.text-gray-800]="role.name !== 'Admin' && role.name !== 'Manager'"
                          [class.dark:text-gray-300]="role.name !== 'Admin' && role.name !== 'Manager'">
                      {{ role.name }}
                    </span>
                    <span *ngIf="!user.roles || user.roles.length === 0"
                          class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300">
                      No roles
                    </span>
                  </div>
                </td>
                <td class="px-3 py-2">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                        [class.bg-green-100]="user.status === 'active'"
                        [class.dark:bg-green-900/30]="user.status === 'active'"
                        [class.text-green-800]="user.status === 'active'"
                        [class.dark:text-green-300]="user.status === 'active'"
                        [class.bg-gray-100]="user.status === 'inactive'"
                        [class.dark:bg-gray-700]="user.status === 'inactive'"
                        [class.text-gray-800]="user.status === 'inactive'"
                        [class.dark:text-gray-300]="user.status === 'inactive'"
                        [class.bg-red-100]="user.status === 'suspended'"
                        [class.dark:bg-red-900/30]="user.status === 'suspended'"
                        [class.text-red-800]="user.status === 'suspended'"
                        [class.dark:text-red-300]="user.status === 'suspended'">
                    {{ user.status }}
                  </span>
                </td>
                <td class="px-3 py-2 text-sm text-gray-600 dark:text-gray-400">
                  {{ user.lastLoginAt ? (user.lastLoginAt | date: 'short') : 'Never' }}
                </td>
                <td class="px-3 py-2">
                  <div class="flex items-center justify-end gap-1">
                    <button
                      *ngIf="canEditUser(user)"
                      (click)="editUser(user)"
                      class="p-1.5 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition"
                      title="Edit User"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      *ngIf="canToggleStatus(user)"
                      (click)="toggleUserStatus(user)"
                      class="p-1.5 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition"
                      [class.text-green-600]="user.status !== 'active'"
                      [class.dark:text-green-400]="user.status !== 'active'"
                      [class.text-red-600]="user.status === 'active'"
                      [class.dark:text-red-400]="user.status === 'active'"
                      [title]="user.status === 'active' ? 'Suspend User' : 'Activate User'"
                    >
                      <svg *ngIf="user.status === 'active'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                      </svg>
                      <svg *ngIf="user.status !== 'active'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
              <tr *ngIf="tableManager.data().length === 0">
                <td colspan="7" class="px-3 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
                  No users found
                </td>
              </tr>
            </tbody>
          </table>

          <!-- Pagination -->
          <div class="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <span class="text-xs text-gray-700 dark:text-gray-300">Rows per page:</span>
                <select
                  [ngModel]="tableManager.state().pageSize"
                  (ngModelChange)="tableManager.setPageSize($event)"
                  class="text-xs px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:outline-none focus:ring-1 focus:ring-blue-500"
                >
                  <option [value]="10">10</option>
                  <option [value]="25">25</option>
                  <option [value]="50">50</option>
                  <option [value]="100">100</option>
                </select>
              </div>

              <div class="flex items-center gap-2">
                <span class="text-xs text-gray-700 dark:text-gray-300">
                  {{ getPaginationInfo() }}
                </span>
                <div class="flex gap-1">
                  <button
                    (click)="tableManager.setPage(1)"
                    [disabled]="tableManager.pagination()!.page === 1"
                    class="p-1 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    (click)="tableManager.setPage(tableManager.pagination()!.page - 1)"
                    [disabled]="tableManager.pagination()!.page === 1"
                    class="p-1 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                    </svg>
                  </button>
                  <button
                    (click)="tableManager.setPage(tableManager.pagination()!.page + 1)"
                    [disabled]="tableManager.pagination()!.page >= tableManager.pagination()!.totalPages"
                    class="p-1 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                  <button
                    (click)="tableManager.setPage(tableManager.pagination()!.totalPages)"
                    [disabled]="tableManager.pagination()!.page >= tableManager.pagination()!.totalPages"
                    class="p-1 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 5l7 7-7 7M5 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class UsersManagementComponent implements OnInit, OnDestroy {
  // ===== Dependency Injection =====
  private tableStateService = inject(TableStateService);
  private userService = inject(UserService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  // ===== Permission Configuration =====
  private readonly createUserPermissionKeys = ['users:create', 'tenant-users:create'];
  private readonly updateUserPermissionKeys = ['users:update', 'tenant-users:update'];
  private readonly enableCreateAction = false;
  private readonly enableUpdateActions = false;

  // ===== Table State Manager =====
  // This manages: data, loading, error, pagination, sorting, filtering
  // Mode: 'api' = server-side pagination/filtering
  // Data source: /api/users endpoint (will be implemented)
  tableManager = this.tableStateService.createTableManager<User>(
    {
      mode: 'api',
      defaultPageSize: 25,
      defaultSort: { column: 'createdAt', direction: 'desc' },
      debounceSearch: 300 // Debounce search input by 300ms
    },
    '/api/users' // TODO: Ensure this endpoint exists and returns TableResponse<User>
  );

  // ===== Local UI State =====
  // Selection is NOT part of table state - it's component-specific UI state
  selectedUsers = signal<Set<string>>(new Set());

  // Filter binding values (two-way binding for UI)
  searchQuery = '';
  statusFilter = '';

  // ===== Computed Values =====
  // Stats from current page data
  activeUsersCount = computed(() =>
    this.tableManager.data().filter(u => u.status === 'active').length
  );

  inactiveUsersCount = computed(() =>
    this.tableManager.data().filter(u => u.status === 'inactive').length
  );

  suspendedUsersCount = computed(() =>
    this.tableManager.data().filter(u => u.status === 'suspended').length
  );

  // ===== Error Handling =====
  constructor() {
    // Show toast notification when there's an error
    effect(() => {
      const error = this.tableManager.error();
      if (error) {
        this.toastService.error(`Failed to load users: ${error}`);
      }
    });
  }

  // ===== Lifecycle Hooks =====
  ngOnInit() {
    // Table manager automatically loads data on init
    // No manual loading needed!
  }

  ngOnDestroy() {
    // Clean up table manager (cancels pending requests, etc.)
    this.tableManager.destroy();
  }

  // ===== Search & Filter Handlers =====
  onSearchChange(query: string) {
    // TableStateService automatically debounces this
    this.tableManager.setSearch(query);
  }

  onStatusFilterChange(status: string) {
    if (status) {
      this.tableManager.setFilter('status', status);
    } else {
      this.tableManager.setFilter('status', null);
    }
  }

  clearStatusFilter() {
    this.statusFilter = '';
    this.onStatusFilterChange('');
  }

  clearAllFilters() {
    this.searchQuery = '';
    this.statusFilter = '';
    this.tableManager.clearFilters();
  }

  // ===== Sorting =====
  toggleSort(column: string) {
    const currentState = this.tableManager.state();
    const newDirection = currentState.sortColumn === column && currentState.sortDirection === 'asc' ? 'desc' : 'asc';
    this.tableManager.setSort(column, newDirection);
  }

  // ===== Selection Management =====
  toggleUserSelection(userId: string) {
    const newSelection = new Set(this.selectedUsers());
    if (newSelection.has(userId)) {
      newSelection.delete(userId);
    } else {
      newSelection.add(userId);
    }
    this.selectedUsers.set(newSelection);
  }

  toggleSelectAll() {
    const users = this.tableManager.data();
    if (this.isAllSelected()) {
      this.selectedUsers.set(new Set());
    } else {
      this.selectedUsers.set(new Set(users.map(u => u.id)));
    }
  }

  isAllSelected(): boolean {
    const users = this.tableManager.data();
    return users.length > 0 && this.selectedUsers().size === users.length;
  }

  isSomeSelected(): boolean {
    const selectedCount = this.selectedUsers().size;
    return selectedCount > 0 && selectedCount < this.tableManager.data().length;
  }

  clearSelection() {
    this.selectedUsers.set(new Set());
  }

  // ===== Bulk Actions =====
  async bulkActivate() {
    const userIds = Array.from(this.selectedUsers());
    if (userIds.length === 0) {
      this.toastService.warning('Please select users to activate');
      return;
    }

    console.log('Bulk activate:', userIds);

    try {
      // TODO: Implement bulk activate API call
      // Example: await this.userService.bulkUpdateStatus(userIds, 'active');

      this.toastService.success(`${userIds.length} user(s) activated successfully`);
      this.clearSelection();
      this.tableManager.refresh();
    } catch (error) {
      console.error('Bulk activate error:', error);
      this.toastService.error('Failed to activate users');
    }
  }

  async bulkSuspend() {
    const userIds = Array.from(this.selectedUsers());
    if (userIds.length === 0) {
      this.toastService.warning('Please select users to suspend');
      return;
    }

    console.log('Bulk suspend:', userIds);

    try {
      // TODO: Implement bulk suspend API call
      // Example: await this.userService.bulkUpdateStatus(userIds, 'suspended');

      this.toastService.success(`${userIds.length} user(s) suspended successfully`);
      this.clearSelection();
      this.tableManager.refresh();
    } catch (error) {
      console.error('Bulk suspend error:', error);
      this.toastService.error('Failed to suspend users');
    }
  }

  // ===== User Actions =====
  createUser() {
    console.log('Create user');
    // TODO: Navigate to create user page or open modal
  }

  editUser(user: User) {
    console.log('Edit user:', user);
    // TODO: Navigate to edit user page or open modal
  }

  async toggleUserStatus(user: User) {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    const displayName = this.getDisplayName(user);

    if (confirm(`${newStatus === 'active' ? 'Activate' : 'Suspend'} ${displayName}?`)) {
      try {
        await this.userService.updateUser(user.id, { status: newStatus });
        this.tableManager.refresh(); // Refresh table data after update
        this.toastService.success(`User ${newStatus === 'active' ? 'activated' : 'suspended'} successfully`);
      } catch (error) {
        console.error('Error updating user status:', error);
        this.toastService.error(`Failed to ${newStatus === 'active' ? 'activate' : 'suspend'} user`);
      }
    }
  }

  // ===== Permission Checks =====
  canCreateUsers(): boolean {
    if (!this.enableCreateAction) {
      return false;
    }
    return this.hasAnyPermission(this.createUserPermissionKeys);
  }

  canEditUser(user: User): boolean {
    if (!this.enableUpdateActions) {
      return false;
    }
    return this.hasAnyPermission(this.updateUserPermissionKeys);
  }

  canToggleStatus(user: User): boolean {
    if (!this.enableUpdateActions) {
      return false;
    }
    return this.hasAnyPermission(this.updateUserPermissionKeys);
  }

  canBulkManageUsers(): boolean {
    if (!this.enableUpdateActions) {
      return false;
    }
    return this.hasAnyPermission(this.updateUserPermissionKeys);
  }

  private hasAnyPermission(permissionKeys: string[]): boolean {
    return permissionKeys.some(permission => this.authService.hasPermission(permission));
  }

  // ===== Display Helpers =====
  getDisplayName(user: User): string {
    if (user.fullName) return user.fullName;
    if (user.firstName && user.lastName) {
      return `${user.firstName} ${user.lastName}`;
    }
    if (user.firstName) return user.firstName;
    if (user.lastName) return user.lastName;
    return user.email;
  }

  getInitials(user: User): string {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    const name = this.getDisplayName(user);
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  }

  getPaginationInfo(): string {
    const pagination = this.tableManager.pagination();
    if (!pagination) return '';

    const start = (pagination.page - 1) * pagination.pageSize + 1;
    const end = Math.min(pagination.page * pagination.pageSize, pagination.total);
    return `${start}-${end} of ${pagination.total}`;
  }
}
