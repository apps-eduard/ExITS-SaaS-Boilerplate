import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RoleService, Role } from '../../../core/services/role.service';
import { RBACService } from '../../../core/services/rbac.service';

@Component({
  selector: 'app-permissions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4 space-y-4">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Permissions</h1>
        <p class="text-xs text-gray-500 dark:text-gray-400">View role permission matrix</p>
      </div>

      <!-- Loading State -->
      <div *ngIf="roleService.loadingSignal()" class="text-center py-6">
        <p class="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
      </div>

      <!-- Role Selector -->
      <div *ngIf="!roleService.loadingSignal()" class="rounded border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900">
        <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Select Role</label>
        <select
          (change)="selectRole($event)"
          class="w-full rounded border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
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
      <div *ngIf="selectedRole() && !roleService.loadingSignal()" class="rounded border border-gray-200 bg-white overflow-hidden dark:border-gray-700 dark:bg-gray-900">
        <!-- Role Header -->
        <div class="border-b border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800">
          <h2 class="text-base font-semibold text-gray-900 dark:text-white">{{ selectedRole()?.name }}</h2>
          <p class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{{ selectedRole()?.description }}</p>
          <div class="mt-2 flex gap-3 text-xs">
            <div>
              <p class="text-gray-600 dark:text-gray-400">SPACE</p>
              <p class="font-medium text-gray-900 dark:text-white">{{ selectedRole()?.space | uppercase }}</p>
            </div>
            <div>
              <p class="text-gray-600 dark:text-gray-400">PERMISSIONS</p>
              <p class="font-medium text-gray-900 dark:text-white">{{ selectedRole()?.permissions?.length || 0 }}</p>
            </div>
          </div>
        </div>

        <!-- Permission Matrix Table - Compact -->
        <div class="overflow-x-auto">
          <table class="w-full text-xs">
            <thead class="border-b border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
              <tr>
                <th class="px-2 py-2 text-left font-semibold text-gray-900 dark:text-white">Module</th>
                <th *ngFor="let action of ['view', 'create', 'edit', 'delete']" class="px-2 py-2 text-center font-semibold text-gray-900 dark:text-white">
                  {{ action[0] | uppercase }}
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr *ngFor="let module of getModulesList()" class="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td class="px-2 py-2 font-medium text-gray-900 dark:text-white">
                  {{ module.displayName }}
                </td>
                <td *ngFor="let action of ['view', 'create', 'edit', 'delete']" class="px-2 py-2 text-center">
                  <span *ngIf="hasPermission(module.menuKey, action)" class="inline-block text-green-600 dark:text-green-400">✓</span>
                  <span *ngIf="!hasPermission(module.menuKey, action)" class="inline-block text-gray-400 dark:text-gray-600">—</span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Summary -->
        <div class="border-t border-gray-200 bg-gray-50 p-3 dark:border-gray-700 dark:bg-gray-800 text-xs">
          <div class="grid grid-cols-3 gap-2">
            <div>
              <p class="font-medium text-gray-600 dark:text-gray-400">TOTAL</p>
              <p class="text-lg font-bold text-gray-900 dark:text-white">
                {{ selectedRole()?.permissions?.length || 0 }}
              </p>
            </div>
            <div>
              <p class="font-medium text-gray-600 dark:text-gray-400">MODULES</p>
              <p class="text-lg font-bold text-gray-900 dark:text-white">
                {{ getModulesWithAccess(selectedRole()).length }}
              </p>
            </div>
            <div>
              <p class="font-medium text-gray-600 dark:text-gray-400">ACTIONS</p>
              <p class="text-xs font-medium text-gray-900 dark:text-white">
                <span *ngFor="let action of getActionsForRole(selectedRole())" class="inline-block mr-1 px-1.5 py-0.5 rounded bg-blue-100 text-blue-700 dark:bg-blue-900 dark:text-blue-300">
                  {{ action }}
                </span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!selectedRole() && !roleService.loadingSignal()" class="text-center py-8">
        <p class="text-sm text-gray-500 dark:text-gray-400">Select a role to view permissions</p>
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
    // Get unique resources from the selected role's permissions
    const role = this.selectedRole();
    if (!role || !role.permissions) return [];
    
    const resourceMap = new Map<string, { resource: string; displayName: string; actions: Set<string> }>();
    
    role.permissions.forEach(perm => {
      if (!resourceMap.has(perm.resource)) {
        resourceMap.set(perm.resource, {
          resource: perm.resource,
          displayName: perm.resource.split('-').map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(' '),
          actions: new Set()
        });
      }
      resourceMap.get(perm.resource)!.actions.add(perm.action);
    });
    
    return Array.from(resourceMap.values()).map(r => ({
      menuKey: r.resource,
      displayName: r.displayName,
      actionKeys: Array.from(r.actions)
    }));
  }

  hasPermission(resource: string, action: string): boolean {
    const role = this.selectedRole();
    if (!role || !role.permissions) return false;
    return role.permissions.some(p => p.resource === resource && p.action === action);
  }

  getModulesWithAccess(role: Role | null): string[] {
    if (!role || !role.permissions) return [];
    const resources = new Set(role.permissions.map(p => p.resource));
    return Array.from(resources);
  }

  getActionsForRole(role: Role | null): string[] {
    if (!role || !role.permissions) return [];
    const actions = new Set(role.permissions.map(p => p.action));
    return Array.from(actions).sort();
  }
}
