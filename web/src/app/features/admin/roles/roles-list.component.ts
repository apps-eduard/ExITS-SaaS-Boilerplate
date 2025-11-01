import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RoleService, Role } from '../../../core/services/role.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { AuthService } from '../../../core/services/auth.service';
import { RBACService } from '../../../core/services/rbac.service';

@Component({
  selector: 'app-roles-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
  <div class="p-4 w-full">
      <!-- Header with Icon -->
      <div class="mb-4">
        <div class="flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xl">👥</span>
              <h1 class="text-lg font-bold text-gray-900 dark:text-white">
                Role Management
              </h1>
            </div>
            <p class="text-xs text-gray-600 dark:text-gray-400">
              {{ isTenantContext() ? 'Manage your tenant roles and permissions' : 'Define roles and control access permissions across your system' }}
            </p>
          </div>
          <button
            *ngIf="canCreateRoles()"
            [routerLink]="isTenantContext() ? '/tenant/roles/new' : '/admin/roles/new'"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm transition"
          >
            <span class="w-3.5 h-3.5">➕</span>
            Create Role
          </button>
        </div>
      </div>

      <!-- Summary Cards (kept as requested) -->
  <div class="grid grid-cols-4 gap-3 mb-3 w-full">
        <div class="group rounded-lg border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-3 dark:border-gray-700 dark:from-gray-800 dark:to-gray-900 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Total Roles</p>
              <p class="text-xl font-bold text-gray-900 dark:text-white mt-1">
                {{ roleService.roleCountComputed() }}
              </p>
            </div>
            <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <span class="text-lg">👥</span>
            </div>
          </div>
        </div>
        <div class="group rounded-lg border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-3 dark:border-gray-700 dark:from-gray-800 dark:to-gray-900 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Active</p>
              <p class="text-xl font-bold text-green-600 dark:text-green-400 mt-1">
                {{ getActiveRoles() }}
              </p>
            </div>
            <div class="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <span class="text-lg">✅</span>
            </div>
          </div>
        </div>
        <div class="group rounded-lg border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-3 dark:border-gray-700 dark:from-gray-800 dark:to-gray-900 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Disabled</p>
              <p class="text-xl font-bold text-gray-600 dark:text-gray-400 mt-1">
                {{ getInactiveRoles() }}
              </p>
            </div>
            <div class="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <span class="text-lg">⏸️</span>
            </div>
          </div>
        </div>
        <div class="group rounded-lg border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-3 dark:border-gray-700 dark:from-gray-800 dark:to-gray-900 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Total Perms</p>
              <p class="text-xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                {{ getTotalPermissions() }}
              </p>
            </div>
            <div class="w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <span class="text-lg">🔑</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters Card -->
  <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 mb-3 w-full">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-2">
          <!-- Search -->
          <div class="md:col-span-2">
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <div class="relative">
              <span class="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input
                type="text"
                [ngModel]="searchQuery()"
                (ngModelChange)="searchQuery.set($event)"
                placeholder="Search by role name or description..."
                class="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <!-- Space Filter (System Admin Only) -->
          <div *ngIf="!isTenantContext()">
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Space
            </label>
            <select
              [ngModel]="filterSpace()"
              (ngModelChange)="filterSpace.set($event)"
              class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Spaces</option>
              <option value="system">System</option>
              <option value="tenant">Tenant</option>
            </select>
          </div>

          <!-- Tenant Filter (System Admin Only) -->
          <div *ngIf="!isTenantContext()">
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tenant
            </label>
            <select
              [ngModel]="filterTenant()"
              (ngModelChange)="filterTenant.set($event)"
              class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Tenants</option>
              <option *ngFor="let tenant of availableTenants()" [value]="tenant">{{ tenant }}</option>
            </select>
          </div>
        </div>

        <!-- Action Buttons Row -->
        <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div class="flex items-center gap-2">
            <button
              (click)="clearFilters()"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition"
            >
              <span class="w-3.5 h-3.5">🔄</span>
              Clear
            </button>
            
            @if (getSelectedCount() > 0) {
              <div class="flex items-center gap-2">
                <span class="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  {{ getSelectedCount() }} selected
                </span>
                <button
                  (click)="clearSelection()"
                  class="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Clear
                </button>
              </div>
            }
            
            <select
              [(ngModel)]="pageSize"
              (change)="onPageSizeChange()"
              class="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
            >
              <option [value]="10">10 per page</option>
              <option [value]="25">25 per page</option>
              <option [value]="50">50 per page</option>
              <option [value]="100">100 per page</option>
            </select>
          </div>

          <div class="flex items-center gap-2">
            @if (getSelectedCount() > 0) {
              <button
                (click)="exportSelected()"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded shadow-sm hover:bg-green-100 dark:hover:bg-green-900/30 transition"
              >
                <span class="w-3.5 h-3.5">📥</span>
                Export Selected
              </button>
            }
            
            <button
              (click)="exportAll()"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded shadow-sm hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
            >
              <span class="w-3.5 h-3.5">📊</span>
              Export All
            </button>
            
            <span class="text-xs text-gray-600 dark:text-gray-400">
              Showing {{ paginatedRoles().length }} of {{ filteredRoles().length }}
            </span>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="roleService.loadingSignal()" class="flex items-center justify-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
        <div class="text-center">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
          <p class="text-xs text-gray-600 dark:text-gray-400">Loading roles...</p>
        </div>
      </div>

      <!-- Error State -->
      <div *ngIf="roleService.errorSignal()" class="rounded border border-yellow-200 bg-yellow-50 px-4 py-3 dark:border-yellow-900 dark:bg-yellow-900/20">
        <div class="flex items-start gap-3">
          <svg class="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p class="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">Unable to load roles</p>
            <p class="text-xs text-yellow-700 dark:text-yellow-400">{{ roleService.errorSignal() }}</p>
            <button
              (click)="roleService.loadRoles()"
              class="inline-flex items-center gap-1.5 mt-2 rounded bg-yellow-600 px-3 py-1 text-xs font-medium text-white hover:bg-yellow-700 transition"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Retry
            </button>
          </div>
        </div>
      </div>

      <!-- Roles Table -->
      @if (!roleService.loadingSignal() && paginatedRoles().length > 0) {
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th class="px-3 py-2 text-left">
                    <input
                      type="checkbox"
                      [checked]="selectAll"
                      (change)="toggleSelectAll()"
                      class="w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <div class="flex items-center gap-1">
                      <span class="w-3.5 h-3.5">👥</span>
                      Role Name
                    </div>
                  </th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <div class="flex items-center gap-1">
                      <span class="w-3.5 h-3.5">📝</span>
                      Description
                    </div>
                  </th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <div class="flex items-center gap-1">
                      <span class="w-3.5 h-3.5">🏢</span>
                      Space
                    </div>
                  </th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <div class="flex items-center gap-1">
                      <span class="w-3.5 h-3.5">🔑</span>
                      Permissions
                    </div>
                  </th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <div class="flex items-center gap-1">
                      <span class="w-3.5 h-3.5">🔘</span>
                      Status
                    </div>
                  </th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <div class="flex items-center gap-1">
                      <span class="w-3.5 h-3.5">⚙️</span>
                      Actions
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                @for (role of paginatedRoles(); track role.id) {
                  <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <td class="px-3 py-2 whitespace-nowrap">
                      <input
                        type="checkbox"
                        [checked]="isSelected(role.id)"
                        (change)="toggleRole(role.id)"
                        class="w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap">
                      <div class="text-xs font-medium text-gray-900 dark:text-white">{{ role.name }}</div>
                      @if (role.tenantName) {
                        <div class="text-xs text-gray-500 dark:text-gray-400">{{ role.tenantName }}</div>
                      }
                    </td>
                    <td class="px-3 py-2">
                      <div class="text-xs text-gray-600 dark:text-gray-400 max-w-xs truncate">
                        {{ role.description || '—' }}
                      </div>
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap">
                      <span [class]="'px-2 py-0.5 text-xs font-semibold rounded ' + (role.space === 'system' ? 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300' : 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300')">
                        {{ role.space | uppercase }}
                      </span>
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap">
                      <span class="px-2 py-0.5 text-xs font-semibold rounded bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300">
                        {{ role.permissions?.length ?? role.permissionCount ?? 0 }}
                      </span>
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap">
                      <span [class]="'px-2 inline-flex text-xs leading-5 font-semibold rounded-full ' + (role.status === 'active' ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300' : 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300')">
                        {{ role.status === 'active' ? 'Active' : 'Disabled' }}
                      </span>
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap">
                      <div class="flex items-center gap-1">
                        <button
                          [routerLink]="(isTenantContext() ? '/tenant/roles/' : '/admin/roles/') + role.id"
                          class="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded shadow-sm hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
                          title="Edit Role"
                        >
                          <span class="w-3.5 h-3.5">✏️</span>
                        </button>
                        <button
                          (click)="toggleRoleStatus(role)"
                          [class]="'inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium rounded shadow-sm transition ' + (role.status === 'active' ? 'text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 hover:bg-orange-100 dark:hover:bg-orange-900/30' : 'text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 hover:bg-green-100 dark:hover:bg-green-900/30')"
                          [title]="role.status === 'active' ? 'Disable role' : 'Enable role'"
                        >
                          <span class="w-3.5 h-3.5">{{ role.status === 'active' ? '⏸️' : '▶️' }}</span>
                        </button>
                        <button
                          (click)="deleteRole(role)"
                          class="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded shadow-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                          title="Delete Role"
                        >
                          <span class="w-3.5 h-3.5">🗑️</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <div class="px-3 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex items-center justify-between">
              <!-- Left side: Page size selector and info -->
              <div class="flex items-center gap-3">
                <div class="flex items-center gap-2">
                  <label class="text-xs text-gray-600 dark:text-gray-400">Show:</label>
                  <select
                    [(ngModel)]="pageSize"
                    (ngModelChange)="onPageSizeChange()"
                    class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option [value]="10">10</option>
                    <option [value]="25">25</option>
                    <option [value]="50">50</option>
                    <option [value]="100">100</option>
                  </select>
                </div>
                <div class="text-xs text-gray-600 dark:text-gray-400">
                  Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ currentPage * pageSize > filteredRoles().length ? filteredRoles().length : currentPage * pageSize }} of {{ filteredRoles().length }}
                </div>
              </div>

              <!-- Right side: Page navigation -->
              <div class="flex items-center gap-2">
                <button
                  (click)="previousPage()"
                  [disabled]="currentPage === 1"
                  class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <span class="w-3.5 h-3.5">←</span>
                  Previous
                </button>

                <span class="text-xs text-gray-600 dark:text-gray-400">
                  Page {{ currentPage }} of {{ totalPages() }}
                </span>

                <button
                  (click)="nextPage()"
                  [disabled]="currentPage >= totalPages()"
                  class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next
                  <span class="w-3.5 h-3.5">→</span>
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Empty State -->
      @if (!roleService.loadingSignal() && paginatedRoles().length === 0) {
        <div class="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <span class="text-4xl mb-3 block">👥</span>
          <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-1">No roles found</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
            {{ filteredRoles().length === 0 && roleService.rolesSignal().length > 0 ? 'Try adjusting your filters' : 'Get started by creating your first role' }}
          </p>
          @if (searchQuery() || filterSpace() || filterTenant()) {
            <button
              (click)="clearFilters()"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <span class="w-3.5 h-3.5">🔄</span>
              Clear Filters
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: []
})
export class RolesListComponent implements OnInit {
  searchQuery = signal('');
  filterSpace = signal<'' | 'system' | 'tenant'>('');
  filterTenant = signal('');

  // Pagination
  pageSize = 25;
  currentPage = 1;
  totalPages = signal(1);
  paginatedRoles = signal<Role[]>([]);
  
  // Selection state
  selectedRoles = new Set<string>();
  selectAll = false;

  // Context detection
  isTenantContext = signal(false);
  private router = inject(Router);
  private authService = inject(AuthService);
  private rbacService = inject(RBACService);

  // Permission checks - adapt based on context
  canCreateRoles = computed(() => {
    if (this.isTenantContext()) {
      return this.rbacService.can('tenant-roles:create');
    }
    return this.authService.hasPermission('roles:create');
  });

  canUpdateRoles = computed(() => {
    if (this.isTenantContext()) {
      return this.rbacService.can('tenant-roles:update');
    }
    return this.authService.hasPermission('roles:update');
  });

  canDeleteRoles = computed(() => {
    if (this.isTenantContext()) {
      return this.rbacService.can('tenant-roles:delete');
    }
    return this.authService.hasPermission('roles:delete');
  });

  // Get unique tenant names from roles
  availableTenants = computed(() => {
    const tenants = new Set<string>();
    this.roleService.rolesSignal().forEach(role => {
      if (role.tenantName) {
        tenants.add(role.tenantName);
      }
    });
    return Array.from(tenants).sort();
  });

  filteredRoles = computed(() => {
    let roles = this.roleService.rolesSignal();

    // In tenant context, show tenant and customer roles for the current tenant
    if (this.isTenantContext()) {
      const currentUser = this.authService.currentUser();
      roles = roles.filter(r => 
        (r.space === 'tenant' || r.space === 'customer') && 
        r.tenantId === currentUser?.tenantId
      );
    }

    // Filter by space (only in system admin context)
    if (!this.isTenantContext()) {
      const space = this.filterSpace();
      if (space) {
        roles = roles.filter(r => r.space === space);
      }

      // Filter by tenant (only in system admin context)
      const tenant = this.filterTenant();
      if (tenant) {
        roles = roles.filter(r => r.tenantName === tenant);
      }
    }

    // Filter by search query
    const query = this.searchQuery().toLowerCase();
    if (query) {
      roles = roles.filter(r =>
        r.name.toLowerCase().includes(query) ||
        (r.description && r.description.toLowerCase().includes(query))
      );
    }

    // Update pagination after filtering
    setTimeout(() => this.updatePagination(roles), 0);

    return roles;
  });

  constructor(
    public roleService: RoleService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    // Detect if we're in tenant context by checking the URL
    const url = this.router.url;
    this.isTenantContext.set(url.startsWith('/tenant/'));
    
    console.log('📋 RolesListComponent initialized - Tenant context:', this.isTenantContext());
    
    this.roleService.loadRoles();
  }

  getRoleSummary(role: Role) {
    const summary = this.roleService.getRoleSummary(role);
    const resources = new Set<string>();

    if (role.permissions) {
      role.permissions.forEach(p => resources.add(p.resource));
    }

    return {
      ...summary,
      resourceCount: resources.size, // Actual unique resources
      resources: Array.from(resources)
    };
  }

  getTotalPermissions(): number {
    return this.roleService.rolesSignal().reduce((sum, role) => {
      if (Array.isArray(role.permissions) && role.permissions.length) {
        return sum + role.permissions.length;
      }
      if (typeof role.permissionCount === 'number') {
        return sum + role.permissionCount;
      }
      return sum;
    }, 0);
  }

  getActiveRoles(): number {
    return this.roleService.rolesSignal().filter(r => r.status === 'active').length;
  }

  getInactiveRoles(): number {
    return this.roleService.rolesSignal().filter(r => r.status === 'inactive').length;
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.filterSpace.set('');
    this.filterTenant.set('');
  }

  async deleteRole(role: Role): Promise<void> {
    const confirmed = await this.confirmationService.confirm({
      title: 'Delete Role',
      message: `Are you sure you want to delete "${role.name}"? This will remove the role and all its permissions. Users assigned to this role will lose their access.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      icon: 'trash'
    });

    if (confirmed) {
      const success = await this.roleService.deleteRole(role.id);
      if (success) {
        console.log(`✅ Role deleted: ${role.name}`);
      }
    }
  }

  async toggleRoleStatus(role: Role): Promise<void> {
    const action = role.status === 'active' ? 'disable' : 'enable';

    const confirmed = await this.confirmationService.confirm({
      title: `${action === 'disable' ? 'Disable' : 'Enable'} Role`,
      message: `Are you sure you want to ${action} "${role.name}"? ${
        action === 'disable'
          ? 'Users with this role will lose access to its permissions.'
          : 'Users with this role will regain access to its permissions.'
      }`,
      confirmText: action === 'disable' ? 'Disable' : 'Enable',
      cancelText: 'Cancel',
      type: action === 'disable' ? 'warning' : 'success',
      icon: action === 'disable' ? 'disable' : 'enable'
    });

    if (confirmed) {
      const success = await this.roleService.toggleRoleStatus(role.id);
      if (success) {
        console.log(`✅ Role ${action}d: ${role.name}`);
      }
    }
  }

  // Pagination methods
  updatePagination(roles: Role[]) {
    const total = Math.ceil(roles.length / this.pageSize);
    this.totalPages.set(total || 1);

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedRoles.set(roles.slice(startIndex, endIndex));
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.updatePagination(this.filteredRoles());
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination(this.filteredRoles());
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages()) {
      this.currentPage++;
      this.updatePagination(this.filteredRoles());
    }
  }

  // Selection methods
  toggleSelectAll() {
    this.selectAll = !this.selectAll;
    if (this.selectAll) {
      this.paginatedRoles().forEach(role => {
        this.selectedRoles.add(role.id);
      });
    } else {
      this.selectedRoles.clear();
    }
  }

  toggleRole(id: string) {
    if (this.selectedRoles.has(id)) {
      this.selectedRoles.delete(id);
      this.selectAll = false;
    } else {
      this.selectedRoles.add(id);
      const allSelected = this.paginatedRoles().every(r => this.selectedRoles.has(r.id));
      this.selectAll = allSelected;
    }
  }

  isSelected(id: string): boolean {
    return this.selectedRoles.has(id);
  }

  getSelectedCount(): number {
    return this.selectedRoles.size;
  }

  clearSelection() {
    this.selectedRoles.clear();
    this.selectAll = false;
  }

  // Export methods
  exportSelected() {
    if (this.selectedRoles.size === 0) {
      return;
    }

    const selectedData = this.roleService.rolesSignal().filter(r => this.selectedRoles.has(r.id));
    this.exportToCSV(selectedData, 'selected-roles.csv');
  }

  exportAll() {
    const data = this.filteredRoles();
    if (data.length === 0) {
      return;
    }
    this.exportToCSV(data, 'all-roles.csv');
  }

  exportToCSV(data: Role[], filename: string) {
    const headers = ['Role Name', 'Description', 'Space', 'Tenant', 'Permissions Count', 'Status'];

    const csvRows = [
      headers.join(','),
      ...data.map(role => [
        role.name,
        role.description || '',
        role.space,
        role.tenantName || '',
        role.permissions?.length ?? role.permissionCount ?? 0,
        role.status
      ].map(field => `"${field}"`).join(','))
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
