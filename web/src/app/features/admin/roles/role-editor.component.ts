import { Component, OnInit, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { RoleService, Role, PermissionMatrix } from '../../../core/services/role.service';
import { RBACService } from '../../../core/services/rbac.service';

interface ModuleAction {
  moduleKey: string;
  displayName: string;
  actionKeys: string[];
}

@Component({
  selector: 'app-role-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="p-6">
      <!-- Header -->
      <div class="mb-6 flex items-center gap-4">
        <button routerLink="/admin/roles" class="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white">
          ← Back
        </button>
        <div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">
            {{ isEditing() ? 'Edit Role' : 'New Role' }}
          </h1>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="roleService.loadingSignal()" class="text-center py-8">
        <p class="text-gray-500 dark:text-gray-400">Loading...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="roleService.errorSignal()" class="mb-6 rounded-lg border border-red-200 bg-red-50 p-4 dark:border-red-900 dark:bg-red-900/20">
        <p class="text-red-700 dark:text-red-400">❌ {{ roleService.errorSignal() }}</p>
      </div>

      <!-- Form -->
      <div *ngIf="!roleService.loadingSignal()" class="max-w-4xl">
        <!-- Role Details Section -->
        <div class="mb-6 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <h2 class="mb-4 text-lg font-semibold text-gray-900 dark:text-white">Role Details</h2>
          
          <div class="space-y-4">
            <!-- Name -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Name *</label>
              <input
                [(ngModel)]="roleName"
                placeholder="e.g., Tenant Administrator"
                class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <!-- Description -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Description</label>
              <textarea
                [(ngModel)]="roleDescription"
                placeholder="Brief description of this role..."
                rows="3"
                class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              ></textarea>
            </div>

            <!-- Space -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300">Space</label>
              <select
                [(ngModel)]="roleSpace"
                [disabled]="isEditing()"
                class="mt-1 w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white disabled:opacity-50"
              >
                <option value="system">System</option>
                <option value="tenant">Tenant</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Permission Matrix Section -->
        <div class="mb-6 rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <div class="mb-4 flex items-center justify-between">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Permissions</h2>
            <div class="space-x-2">
              <button 
                (click)="selectAllPermissions()"
                class="rounded bg-blue-100 px-3 py-1 text-sm text-blue-700 hover:bg-blue-200 dark:bg-blue-900 dark:text-blue-300"
              >
                Select All
              </button>
              <button 
                (click)="clearAllPermissions()"
                class="rounded bg-gray-100 px-3 py-1 text-sm text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300"
              >
                Clear All
              </button>
            </div>
          </div>

          <!-- Permission Matrix -->
          <div class="overflow-x-auto">
            <table class="w-full border-collapse">
              <thead>
                <tr class="bg-gray-50 dark:bg-gray-800">
                  <th class="border border-gray-200 px-4 py-2 text-left text-sm font-semibold text-gray-900 dark:border-gray-700 dark:text-white">Module</th>
                  <th *ngFor="let action of availableActions" class="border border-gray-200 px-4 py-2 text-center text-sm font-semibold text-gray-900 dark:border-gray-700 dark:text-white">
                    {{ action }}
                  </th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let module of modules()" class="hover:bg-gray-50 dark:hover:bg-gray-800">
                  <td class="border border-gray-200 px-4 py-2 font-medium text-gray-900 dark:border-gray-700 dark:text-white">
                    {{ module.displayName }}
                  </td>
                  <td *ngFor="let action of module.actionKeys" class="border border-gray-200 px-4 py-2 text-center dark:border-gray-700">
                    <input 
                      type="checkbox"
                      [checked]="hasPermission(module.moduleKey, action)"
                      (change)="togglePermission(module.moduleKey, action)"
                      class="h-4 w-4 cursor-pointer rounded border-gray-300"
                    />
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-4">
          <button 
            (click)="saveRole()"
            [disabled]="!canSave()"
            class="rounded-lg bg-blue-600 px-6 py-2 text-white hover:bg-blue-700 disabled:opacity-50 transition"
          >
            {{ isEditing() ? '💾 Update Role' : '✅ Create Role' }}
          </button>
          <button 
            routerLink="/admin/roles"
            class="rounded-lg border border-gray-300 px-6 py-2 text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 transition"
          >
            Cancel
          </button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class RoleEditorComponent implements OnInit {
  isEditing = signal(false);
  roleId: string | null = null;

  roleName = '';
  roleDescription = '';
  roleSpace: 'system' | 'tenant' = 'tenant';
  selectedPermissions = signal<Set<string>>(new Set());
  modules = signal<ModuleAction[]>([]);
  availableActions = ['view', 'create', 'edit', 'delete'];

  constructor(
    public roleService: RoleService,
    private rbacService: RBACService,
    private route: ActivatedRoute,
    private router: Router
  ) {
    effect(() => {
      // Load modules when RBAC service updates
      const allModules = this.rbacService.allModules();
      if (allModules && Object.keys(allModules).length > 0) {
        this.loadModules();
      }
    });
  }

  ngOnInit(): void {
    // Get role ID from route if editing
    this.route.params.subscribe(params => {
      if (params['id'] && params['id'] !== 'new') {
        this.isEditing.set(true);
        this.roleId = params['id'];
        this.loadRole();
      }
    });

    // Load modules
    this.loadModules();
  }

  loadModules(): void {
    const allModules = this.rbacService.allModules();
    if (allModules && Object.keys(allModules).length > 0) {
      const modules: ModuleAction[] = Object.entries(allModules).map(([key, module]: any) => ({
        moduleKey: key,
        displayName: module.displayName || key,
        actionKeys: module.actionKeys || ['view']
      }));
      this.modules.set(modules);
    }
  }

  async loadRole(): Promise<void> {
    if (!this.roleId) return;

    const role = await this.roleService.getRole(this.roleId);
    if (role) {
      this.roleName = role.name;
      this.roleDescription = role.description || '';
      this.roleSpace = role.space;

      // Load permissions into matrix
      const selected = new Set<string>();
      if (role.permissions) {
        for (const perm of role.permissions) {
          selected.add(`${perm.menuKey}:${perm.actionKey}`);
        }
      }
      this.selectedPermissions.set(selected);
    }
  }

  hasPermission(moduleKey: string, actionKey: string): boolean {
    return this.selectedPermissions().has(`${moduleKey}:${actionKey}`);
  }

  togglePermission(moduleKey: string, actionKey: string): void {
    const key = `${moduleKey}:${actionKey}`;
    const current = new Set(this.selectedPermissions());
    if (current.has(key)) {
      current.delete(key);
    } else {
      current.add(key);
    }
    this.selectedPermissions.set(current);
  }

  selectAllPermissions(): void {
    const all = new Set<string>();
    for (const module of this.modules()) {
      for (const action of module.actionKeys) {
        all.add(`${module.moduleKey}:${action}`);
      }
    }
    this.selectedPermissions.set(all);
  }

  clearAllPermissions(): void {
    this.selectedPermissions.set(new Set());
  }

  canSave(): boolean {
    return this.roleName.trim().length > 0;
  }

  async saveRole(): Promise<void> {
    if (!this.canSave()) return;

    try {
      // Convert selected permissions to array
      const permissions = Array.from(this.selectedPermissions()).map(p => {
        const [menuKey, actionKey] = p.split(':');
        return { menuKey, actionKey };
      });

      if (this.isEditing() && this.roleId) {
        // Update existing role
        const updated = await this.roleService.updateRole(this.roleId, {
          name: this.roleName,
          description: this.roleDescription
        });

        if (updated) {
          // Update permissions
          await this.roleService.bulkAssignPermissions(this.roleId, permissions);
          this.router.navigate(['/admin/roles']);
        }
      } else {
        // Create new role
        const created = await this.roleService.createRole({
          name: this.roleName,
          description: this.roleDescription,
          space: this.roleSpace
        });

        if (created) {
          // Assign permissions
          await this.roleService.bulkAssignPermissions(created.id, permissions);
          this.router.navigate(['/admin/roles']);
        }
      }
    } catch (error) {
      console.error('Error saving role:', error);
    }
  }
}
