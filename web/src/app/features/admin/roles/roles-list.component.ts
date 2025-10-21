import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RoleService, Role } from '../../../core/services/role.service';

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
          class="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 shadow-sm transition"
        >
          ➕ Create Role
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
            <p class="text-xs font-medium text-gray-600 dark:text-gray-400">System</p>
            <p class="text-lg font-bold text-purple-600 dark:text-purple-400">
              {{ roleService.systemRolesComputed().length }}
            </p>
          </div>
          <div class="rounded border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
            <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Tenant</p>
            <p class="text-lg font-bold text-blue-600 dark:text-blue-400">
              {{ roleService.tenantRolesComputed().length }}
            </p>
          </div>
          <div class="rounded border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
            <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Total Perms</p>
            <p class="text-lg font-bold text-green-600 dark:text-green-400">
              {{ getTotalPermissions() }}
            </p>
          </div>
        </div>

        <!-- Filters -->
        <div class="lg:col-span-4 grid grid-cols-2 gap-2">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Filter by Space</label>
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
              class="mt-2 rounded bg-yellow-600 px-3 py-1 text-xs font-medium text-white hover:bg-yellow-700 transition"
            >
              🔄 Retry
            </button>
          </div>
        </div>
      </div>

      <!-- Roles Grid -->
      <div *ngIf="!roleService.loadingSignal() && filteredRoles().length > 0" class="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <div *ngFor="let role of filteredRoles()" 
             class="rounded border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900 hover:shadow-md transition-shadow">
          
          <!-- Role Header -->
          <div class="flex items-start justify-between mb-2">
            <div class="flex-1">
              <div class="flex items-center gap-2">
                <h3 class="font-semibold text-gray-900 dark:text-white">{{ role.name }}</h3>
                <span [class]="'px-2 py-0.5 rounded text-xs font-medium ' + (role.space === 'system' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300')">
                  {{ role.space | uppercase }}
                </span>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ role.description || 'No description' }}</p>
            </div>
            <div class="flex gap-1">
              <button
                [routerLink]="'/admin/roles/' + role.id"
                class="rounded p-1.5 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 transition"
                title="Edit Role"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
              </button>
              <button
                (click)="deleteRole(role)"
                class="rounded p-1.5 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition"
                title="Delete Role"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>

          <!-- Permission Summary -->
          <div class="grid grid-cols-4 gap-2 mb-2">
            <div class="text-center p-2 rounded bg-gray-50 dark:bg-gray-800">
              <p class="text-lg font-bold text-gray-900 dark:text-white">{{ getRoleSummary(role).totalPermissions }}</p>
              <p class="text-xs text-gray-600 dark:text-gray-400">Total</p>
            </div>
            <div class="text-center p-2 rounded bg-blue-50 dark:bg-blue-900/20">
              <p class="text-lg font-bold text-blue-600 dark:text-blue-400">{{ getRoleSummary(role).viewCount }}</p>
              <p class="text-xs text-blue-600 dark:text-blue-400">View</p>
            </div>
            <div class="text-center p-2 rounded bg-green-50 dark:bg-green-900/20">
              <p class="text-lg font-bold text-green-600 dark:text-green-400">{{ getRoleSummary(role).createCount }}</p>
              <p class="text-xs text-green-600 dark:text-green-400">Create</p>
            </div>
            <div class="text-center p-2 rounded bg-orange-50 dark:bg-orange-900/20">
              <p class="text-lg font-bold text-orange-600 dark:text-orange-400">{{ getRoleSummary(role).editCount + getRoleSummary(role).deleteCount }}</p>
              <p class="text-xs text-orange-600 dark:text-orange-400">Modify</p>
            </div>
          </div>

          <!-- Module Coverage -->
          <div class="border-t border-gray-200 dark:border-gray-700 pt-2">
            <div class="flex items-center justify-between text-xs">
              <span class="text-gray-600 dark:text-gray-400">Module Access:</span>
              <span class="font-medium text-gray-900 dark:text-white">{{ getRoleSummary(role).moduleCount }} of 8</span>
            </div>
            <div class="mt-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div 
                class="h-full bg-blue-600 dark:bg-blue-400 transition-all"
                [style.width.%]="(getRoleSummary(role).moduleCount / 8) * 100"
              ></div>
            </div>
            <!-- Module Badges -->
            <div class="mt-2 flex flex-wrap gap-1">
              <span *ngFor="let module of getRoleSummary(role).modules" 
                    class="px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                {{ module }}
              </span>
            </div>
          </div>
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

  filteredRoles = computed(() => {
    let roles = this.roleService.rolesSignal();
    
    // Filter by space
    const space = this.filterSpace();
    if (space) {
      roles = roles.filter(r => r.space === space);
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

  constructor(public roleService: RoleService) {}

  ngOnInit(): void {
    console.log('📋 RolesListComponent initialized');
    this.roleService.loadRoles();
  }

  getRoleSummary(role: Role) {
    const summary = this.roleService.getRoleSummary(role);
    const modules = new Set<string>();
    
    if (role.permissions) {
      role.permissions.forEach(p => modules.add(p.menuKey));
    }

    return {
      ...summary,
      modules: Array.from(modules)
    };
  }

  getTotalPermissions(): number {
    return this.roleService.rolesSignal().reduce((sum, role) => {
      return sum + (role.permissions?.length || 0);
    }, 0);
  }

  clearFilters(): void {
    this.searchQuery.set('');
    this.filterSpace.set('');
  }

  async deleteRole(role: Role): Promise<void> {
    const confirmed = confirm(
      `⚠️ Delete Role: ${role.name}\n\n` +
      `This will remove the role and all its permissions.\n` +
      `Users assigned to this role will lose their access.\n\n` +
      `Are you sure you want to proceed?`
    );
    
    if (confirmed) {
      const success = await this.roleService.deleteRole(role.id);
      if (success) {
        console.log(`✅ Role deleted: ${role.name}`);
      }
    }
  }
}
