import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoleService, Role } from '../../../core/services/role.service';
import { RBACService } from '../../../core/services/rbac.service';

@Component({
  selector: 'app-permissions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-3xl font-bold text-gray-900 dark:text-white">Permissions Management</h1>
        <p class="mt-1 text-gray-600 dark:text-gray-400">View and manage role permissions across the system</p>
      </div>

      <!-- Loading State -->
      <div *ngIf="roleService.loadingSignal()" class="text-center py-8">
        <p class="text-gray-500 dark:text-gray-400">Loading permissions...</p>
      </div>

      <!-- Role Selector -->
      <div *ngIf="!roleService.loadingSignal()" class="mb-6 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Select Role</h2>
        
        <select
          (change)="selectRole($event)"
          class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="">-- Choose a role --</option>
          <optgroup label="System Roles">
            <option *ngFor="let role of roleService.systemRolesComputed()" [value]="role.id">
              {{ role.name }}
            </option>
          </optgroup>
          <optgroup label="Tenant Roles">
            <option *ngFor="let role of roleService.tenantRolesComputed()" [value]="role.id">
              {{ role.name }}
            </option>
          </optgroup>
        </select>
      </div>

      <!-- Permission Matrix for Selected Role -->
      <div *ngIf="selectedRole() && !roleService.loadingSignal()" class="rounded-lg border border-gray-200 bg-white overflow-hidden dark:border-gray-700 dark:bg-gray-900">
        <!-- Role Header -->
        <div class="border-b border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800">
          <h2 class="text-xl font-semibold text-gray-900 dark:text-white">{{ selectedRole()?.name }}</h2>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">{{ selectedRole()?.description }}</p>
          <div class="mt-4 flex gap-4">
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400">SPACE</p>
              <p class="font-medium text-gray-900 dark:text-white">{{ selectedRole()?.space | uppercase }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400">PERMISSIONS</p>
              <p class="font-medium text-gray-900 dark:text-white">{{ selectedRole()?.permissions?.length || 0 }}</p>
            </div>
          </div>
        </div>

        <!-- Permission Matrix Table -->
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
              <tr>
                <th class="px-6 py-3 text-left text-sm font-semibold text-gray-900 dark:text-white">Module</th>
                <th *ngFor="let action of ['view', 'create', 'edit', 'delete']" class="px-6 py-3 text-center text-sm font-semibold text-gray-900 dark:text-white">
                  {{ action | uppercase }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr *ngFor="let module of getModulesList()" class="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td class="px-6 py-4 font-medium text-gray-900 dark:text-white">
                  {{ module.displayName }}
                </td>
                <td *ngFor="let action of ['view', 'create', 'edit', 'delete']" class="px-6 py-4 text-center">
                  <div class="flex justify-center">
                    <div *ngIf="hasPermission(module.menuKey, action)" class="inline-block rounded-full bg-green-100 p-1 dark:bg-green-900">
                      <span class="text-green-700 dark:text-green-300">✓</span>
                    </div>
                    <div *ngIf="!hasPermission(module.menuKey, action)" class="inline-block rounded-full bg-gray-100 p-1 dark:bg-gray-800">
                      <span class="text-gray-400 dark:text-gray-600">—</span>
                    </div>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Permission Summary -->
        <div class="border-t border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800">
          <div class="grid grid-cols-1 gap-4 md:grid-cols-3">
            <div>
              <p class="text-xs font-medium text-gray-600 dark:text-gray-400">TOTAL PERMISSIONS</p>
              <p class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {{ selectedRole()?.permissions?.length || 0 }}
              </p>
            </div>
            <div>
              <p class="text-xs font-medium text-gray-600 dark:text-gray-400">MODULES WITH ACCESS</p>
              <p class="mt-1 text-2xl font-bold text-gray-900 dark:text-white">
                {{ getModulesWithAccess(selectedRole()).length }}
              </p>
            </div>
            <div>
              <p class="text-xs font-medium text-gray-600 dark:text-gray-400">AVAILABLE ACTIONS</p>
              <p class="mt-1 flex gap-1">
                <span *ngFor="let action of getActionsForRole(selectedRole())" class="inline-block rounded-full bg-blue-100 px-2 py-1 text-xs font-medium text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  {{ action }}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!selectedRole() && !roleService.loadingSignal()" class="text-center py-12">
        <p class="text-gray-500 dark:text-gray-400">Select a role to view permissions</p>
      </div>
    </div>
  `,
  styles: []
})
export class PermissionsComponent implements OnInit {
  selectedRole = signal<Role | null>(null);

  constructor(
    public roleService: RoleService,
    private rbacService: RBACService
  ) {}

  ngOnInit(): void {
    console.log('📊 PermissionsComponent initialized');
    this.roleService.loadRoles();
  }

  selectRole(event: Event): void {
    const select = event.target as HTMLSelectElement;
    const roleId = select.value;
    if (roleId) {
      this.roleService.getRole(roleId).then(role => {
        this.selectedRole.set(role);
      });
    } else {
      this.selectedRole.set(null);
    }
  }

  getModulesList() {
    const modules = this.rbacService.allModules();
    if (!modules) return [];
    return Object.entries(modules).map(([key, module]: any) => ({
      menuKey: key,
      displayName: module.displayName || key,
      actionKeys: module.actionKeys || ['view']
    }));
  }

  hasPermission(moduleKey: string, actionKey: string): boolean {
    const role = this.selectedRole();
    if (!role || !role.permissions) return false;
    return role.permissions.some(p => p.menuKey === moduleKey && p.actionKey === actionKey);
  }

  getModulesWithAccess(role: Role | null): string[] {
    if (!role || !role.permissions) return [];
    const modules = new Set(role.permissions.map(p => p.menuKey));
    return Array.from(modules);
  }

  getActionsForRole(role: Role | null): string[] {
    if (!role || !role.permissions) return [];
    const actions = new Set(role.permissions.map(p => p.actionKey));
    return Array.from(actions).sort();
  }
}
