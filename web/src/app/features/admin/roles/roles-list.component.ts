import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RoleService, Role } from '../../../core/services/role.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';

@Component({
  selector: 'app-roles-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="p-4 space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Role Management</h1>
          <p class="text-xs text-gray-500 dark:text-gray-400">Define roles and control access permissions across your system</p>
        </div>
        <button
          routerLink="/admin/roles/new"
          class="inline-flex items-center gap-1.5 rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 shadow-sm transition"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          Create Role
        </button>
      </div>

      <!-- Stats & Filters -->
      <div class="grid grid-cols-1 lg:grid-cols-12 gap-3">
        <!-- Stats Cards -->
        <div class="lg:col-span-8 grid grid-cols-4 gap-2">
          <div class="rounded border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
            <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Total Roles</p>
            <p class="text-lg font-bold text-gray-900 dark:text-white">
              {{ roleService.roleCountComputed() }}
            </p>
          </div>
          <div class="rounded border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
            <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Active</p>
            <p class="text-lg font-bold text-green-600 dark:text-green-400">
              {{ getActiveRoles() }}
            </p>
          </div>
          <div class="rounded border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
            <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Disabled</p>
            <p class="text-lg font-bold text-gray-600 dark:text-gray-400">
              {{ getInactiveRoles() }}
            </p>
          </div>
          <div class="rounded border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
            <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Total Perms</p>
            <p class="text-lg font-bold text-blue-600 dark:text-blue-400">
              {{ getTotalPermissions() }}
            </p>
          </div>
        </div>

        <!-- Filters -->
        <div class="lg:col-span-4 grid grid-cols-3 gap-2">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Space</label>
            <select
              [(ngModel)]="filterSpace"
              class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="">All</option>
              <option value="system">System</option>
              <option value="tenant">Tenant</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tenant</label>
            <select
              [(ngModel)]="filterTenant"
              class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="">All</option>
              <option *ngFor="let tenant of availableTenants()" [value]="tenant">{{ tenant }}</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
            <input
              [(ngModel)]="searchQuery"
              placeholder="Role name..."
              class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="roleService.loadingSignal()" class="text-center py-6">
        <p class="text-sm text-gray-500 dark:text-gray-400">Loading roles...</p>
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
      <div *ngIf="!roleService.loadingSignal() && filteredRoles().length > 0" class="rounded border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Role Name</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Description</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Space</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Tenant</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Permissions</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr *ngFor="let role of filteredRoles()" class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                <td class="px-4 py-3">
                  <div class="font-medium text-gray-900 dark:text-white">{{ role.name }}</div>
                </td>
                <td class="px-4 py-3">
                  <div class="text-gray-600 dark:text-gray-400 max-w-xs truncate">{{ role.description || '—' }}</div>
                </td>
                <td class="px-4 py-3 text-center">
                  <span [class]="'inline-flex px-2.5 py-1 rounded-full text-xs font-medium ' + (role.space === 'system' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300')">
                    {{ role.space | uppercase }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <div class="text-sm text-gray-900 dark:text-white">
                    {{ role.tenantName || '—' }}
                  </div>
                  <div *ngIf="role.space === 'system'" class="text-xs text-gray-500 dark:text-gray-400">
                    All tenants
                  </div>
                </td>
                <td class="px-4 py-3 text-center">
                  <div class="flex items-center justify-center gap-1">
                    <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
                    </svg>
                    <span class="font-semibold text-gray-900 dark:text-white">{{ role.permissions?.length || 0 }}</span>
                  </div>
                </td>
                <td class="px-4 py-3 text-center">
                  <button
                    (click)="toggleRoleStatus(role)"
                    [class]="'inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium transition ' + (role.status === 'active' ? 'bg-green-100 text-green-700 hover:bg-green-200 dark:bg-green-900/30 dark:text-green-300 dark:hover:bg-green-900/50' : 'bg-gray-100 text-gray-700 hover:bg-gray-200 dark:bg-gray-700 dark:text-gray-300 dark:hover:bg-gray-600')"
                    [title]="role.status === 'active' ? 'Click to disable' : 'Click to enable'"
                  >
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path *ngIf="role.status === 'active'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      <path *ngIf="role.status !== 'active'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z" />
                    </svg>
                    {{ role.status === 'active' ? 'Active' : 'Disabled' }}
                  </button>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center justify-end gap-2">
                    <button
                      (click)="toggleRoleStatus(role)"
                      [class]="'inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium transition ' + (role.status === 'active' ? 'text-orange-700 bg-orange-50 hover:bg-orange-100 dark:text-orange-300 dark:bg-orange-900/30 dark:hover:bg-orange-900/50' : 'text-green-700 bg-green-50 hover:bg-green-100 dark:text-green-300 dark:bg-green-900/30 dark:hover:bg-green-900/50')"
                      [title]="role.status === 'active' ? 'Disable role' : 'Enable role'"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path *ngIf="role.status === 'active'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        <path *ngIf="role.status !== 'active'" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      {{ role.status === 'active' ? 'Disable' : 'Enable' }}
                    </button>
                    <button
                      [routerLink]="'/admin/roles/' + role.id"
                      class="inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 transition"
                      title="Edit Role"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      (click)="deleteRole(role)"
                      class="inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 dark:text-red-300 dark:bg-red-900/30 dark:hover:bg-red-900/50 transition"
                      title="Delete Role"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!roleService.loadingSignal() && filteredRoles().length === 0" class="text-center py-12 rounded border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
        <div class="max-w-sm mx-auto">
          <svg class="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <p class="mb-2 text-sm font-medium text-gray-900 dark:text-white">
            {{ roleService.rolesSignal().length === 0 ? 'No roles created yet' : 'No roles match your filters' }}
          </p>
          <p class="mb-4 text-xs text-gray-500 dark:text-gray-400">
            {{ roleService.rolesSignal().length === 0 ? 'Create your first role to start managing permissions' : 'Try adjusting your search or filter criteria' }}
          </p>
          <button
            *ngIf="roleService.rolesSignal().length === 0"
            routerLink="/admin/roles/new"
            class="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow-sm transition"
          >
            ➕ Create First Role
          </button>
          <button
            *ngIf="roleService.rolesSignal().length > 0"
            (click)="clearFilters()"
            class="rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 transition"
          >
            Clear Filters
          </button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class RolesListComponent implements OnInit {
  searchQuery = signal('');
  filterSpace = signal<'' | 'system' | 'tenant'>('');
  filterTenant = signal('');

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

    // Filter by space
    const space = this.filterSpace();
    if (space) {
      roles = roles.filter(r => r.space === space);
    }

    // Filter by tenant
    const tenant = this.filterTenant();
    if (tenant) {
      roles = roles.filter(r => r.tenantName === tenant);
    }

    // Filter by search query
    const query = this.searchQuery().toLowerCase();
    if (query) {
      roles = roles.filter(r =>
        r.name.toLowerCase().includes(query) ||
        (r.description && r.description.toLowerCase().includes(query))
      );
    }

    return roles;
  });

  constructor(
    public roleService: RoleService,
    private confirmationService: ConfirmationService
  ) {}

  ngOnInit(): void {
    console.log('📋 RolesListComponent initialized');
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
      return sum + (role.permissions?.length || 0);
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
}
