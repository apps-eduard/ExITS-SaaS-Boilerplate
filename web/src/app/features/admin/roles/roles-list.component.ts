import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RoleService, Role } from '../../../core/services/role.service';

@Component({
  selector: 'app-roles-list',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-4 space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Roles</h1>
          <p class="text-xs text-gray-500 dark:text-gray-400">Manage system and tenant roles</p>
        </div>
        <button 
          routerLink="/admin/roles/new"
          class="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 transition"
        >
          ➕ New Role
        </button>
      </div>

      <!-- Stats - Compact -->
      <div class="grid grid-cols-3 gap-2 md:gap-3">
        <div class="rounded border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
          <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Total</p>
          <p class="text-lg font-bold text-gray-900 dark:text-white">
            {{ roleService.roleCountComputed() }}
          </p>
        </div>
        <div class="rounded border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
          <p class="text-xs font-medium text-gray-600 dark:text-gray-400">System</p>
          <p class="text-lg font-bold text-gray-900 dark:text-white">
            {{ roleService.systemRolesComputed().length }}
          </p>
        </div>
        <div class="rounded border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
          <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Tenant</p>
          <p class="text-lg font-bold text-gray-900 dark:text-white">
            {{ roleService.tenantRolesComputed().length }}
          </p>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="roleService.loadingSignal()" class="text-center py-6">
        <p class="text-sm text-gray-500 dark:text-gray-400">Loading roles...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="roleService.errorSignal()" class="rounded border border-red-200 bg-red-50 px-3 py-2 dark:border-red-900 dark:bg-red-900/20">
        <p class="text-sm text-red-700 dark:text-red-400">❌ {{ roleService.errorSignal() }}</p>
      </div>

      <!-- Roles Table - Compact -->
      <div *ngIf="!roleService.loadingSignal() && roleService.rolesSignal().length > 0" class="rounded border border-gray-200 bg-white overflow-hidden dark:border-gray-700 dark:bg-gray-900">
        <table class="w-full text-sm">
          <thead class="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
            <tr>
              <th class="px-3 py-2 text-left font-semibold text-gray-900 dark:text-white">Name</th>
              <th class="px-3 py-2 text-left font-semibold text-gray-900 dark:text-white">Space</th>
              <th class="px-3 py-2 text-left font-semibold text-gray-900 dark:text-white">Perms</th>
              <th class="px-3 py-2 text-right font-semibold text-gray-900 dark:text-white">Actions</th>
            </tr>
          </thead>
          <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
            <tr *ngFor="let role of roleService.rolesSignal()" class="hover:bg-gray-50 dark:hover:bg-gray-800 transition">
              <td class="px-3 py-2">
                <div class="font-medium text-gray-900 dark:text-white">{{ role.name }}</div>
                <div class="text-xs text-gray-500 dark:text-gray-400">{{ role.description || '—' }}</div>
              </td>
              <td class="px-3 py-2">
                <span [class]="'px-2 py-0.5 rounded text-xs font-medium ' + (role.space === 'system' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300')">
                  {{ role.space === 'system' ? 'SYS' : 'TNT' }}
                </span>
              </td>
              <td class="px-3 py-2">
                <span class="font-medium text-gray-900 dark:text-white">
                  {{ getRoleSummary(role).totalPermissions }}
                </span>
              </td>
              <td class="px-3 py-2 text-right">
                <div class="flex justify-end gap-1">
                  <button
                    [routerLink]="'/admin/roles/' + role.id"
                    class="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition text-xs font-medium"
                    title="Edit"
                  >
                    ✏️
                  </button>
                  <button
                    (click)="deleteRole(role)"
                    class="text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 transition text-xs font-medium"
                    title="Delete"
                  >
                    🗑️
                  </button>
                </div>
              </td>
            </tr>
          </tbody>
        </table>
      </div>

      <!-- Empty State -->
      <div *ngIf="!roleService.loadingSignal() && roleService.rolesSignal().length === 0" class="text-center py-8">
        <p class="mb-3 text-sm text-gray-500 dark:text-gray-400">No roles created yet</p>
        <button 
          routerLink="/admin/roles/new"
          class="rounded bg-blue-600 px-3 py-1.5 text-sm text-white hover:bg-blue-700 transition"
        >
          ➕ Create First Role
        </button>
      </div>
    </div>
  `,
  styles: []
})
export class RolesListComponent implements OnInit {
  deleteConfirm = signal<string | null>(null);

  constructor(public roleService: RoleService) {}

  ngOnInit(): void {
    console.log('📋 RolesListComponent initialized');
    this.roleService.loadRoles();
  }

  getRoleSummary(role: Role) {
    return this.roleService.getRoleSummary(role);
  }

  async deleteRole(role: Role): Promise<void> {
    if (confirm(`Are you sure you want to delete the role "${role.name}"?`)) {
      const success = await this.roleService.deleteRole(role.id);
      if (success) {
        console.log(`✅ Role deleted: ${role.name}`);
      }
    }
  }
}
