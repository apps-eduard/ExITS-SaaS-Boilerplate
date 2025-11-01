import { Component, OnInit, signal, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { RoleService, Role, Permission } from '../../../core/services/role.service';

interface ResourceGroup {
  resource: string;
  displayName: string;
  description: string;
  actions: string[];
  category: 'system' | 'tenant' | 'business';
}

@Component({
  selector: 'app-role-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="p-4 space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button routerLink="/admin/roles" class="rounded p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ isEditing() ? 'Edit Role' : 'Create New Role' }}
            </h1>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Select resources and assign permissions
            </p>
          </div>
        </div>

        <div *ngIf="getTotalSelectedPermissions() > 0" class="px-3 py-1 rounded bg-blue-50 dark:bg-blue-900/20">
          <span class="text-xs text-blue-600 dark:text-blue-400 font-medium">
            {{ getTotalSelectedPermissions() }} permissions on {{ getTotalSelectedResources() }} resources
          </span>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="roleService.loadingSignal()" class="flex items-center justify-center py-12">
        <div class="text-center">
          <div class="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>

      <!-- Error -->
      <div *ngIf="roleService.errorSignal()" class="rounded border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-900/20">
        <p class="text-sm text-red-700 dark:text-red-400">❌ {{ roleService.errorSignal() }}</p>
      </div>

      <!-- Form -->
      <div *ngIf="!roleService.loadingSignal()" class="grid grid-cols-1 lg:grid-cols-4 gap-4">

        <!-- Role Info (1 column) -->
        <div class="lg:col-span-1">
          <div class="rounded border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900 sticky top-4">
            <h2 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Role Details</h2>

            <div class="space-y-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name <span class="text-red-500">*</span>
                </label>
                <input
                  [(ngModel)]="roleName"
                  placeholder="e.g., Manager"
                  class="w-full rounded border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  [(ngModel)]="roleDescription"
                  placeholder="Role purpose..."
                  rows="3"
                  class="w-full rounded border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                ></textarea>
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Space <span class="text-red-500">*</span>
                </label>
                <select
                  [(ngModel)]="roleSpace"
                  [disabled]="isEditing()"
                  class="w-full rounded border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white disabled:opacity-50"
                >
                  <option value="system">System</option>
                  <option value="tenant">Tenant</option>
                </select>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
              <button
                (click)="selectAll()"
                class="w-full rounded bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 transition"
              >
                ✓ Select All Permissions
              </button>
              <button
                (click)="clearAll()"
                class="w-full rounded bg-gray-100 px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-200 dark:bg-gray-800 dark:text-gray-300 transition"
              >
                ✗ Clear All
              </button>
            </div>

            <!-- Validation -->
            <div *ngIf="!canSave()" class="mt-4 rounded border border-yellow-200 bg-yellow-50 p-2 dark:border-yellow-900 dark:bg-yellow-900/20">
              <p class="text-xs font-medium text-yellow-800 dark:text-yellow-300 mb-1">Required:</p>
              <ul class="text-xs text-yellow-700 dark:text-yellow-400 space-y-0.5">
                <li *ngIf="!roleName.trim()">• Role name</li>
                <li *ngIf="getTotalSelectedPermissions() === 0">• At least 1 permission</li>
              </ul>
            </div>

            <!-- Save Button -->
            <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                (click)="saveRole()"
                [disabled]="!canSave()"
                class="w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition"
              >
                {{ isEditing() ? '💾 Update' : '✅ Create' }}
              </button>
              <button
                routerLink="/admin/roles"
                class="w-full mt-2 rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        <!-- Permission Matrix (3 columns) -->
        <div class="lg:col-span-3">
          <div class="rounded border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">

            <!-- Header -->
            <div class="border-b border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
              <div class="flex items-center justify-between">
                <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Permissions Matrix</h2>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  Standard RBAC (resource:action format)
                </div>
              </div>
            </div>

            <!-- Permission Grid -->
            <div class="divide-y divide-gray-200 dark:divide-gray-700">

              <!-- Each Resource Group -->
              <div *ngFor="let group of resourceGroups" class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">

                <!-- Resource Header -->
                <div class="flex items-center px-4 py-3 bg-gray-50 dark:bg-gray-800/30">
                  <div class="flex-1">
                    <div class="flex items-center gap-2">
                      <span class="text-sm font-semibold text-gray-900 dark:text-white">{{ group.displayName }}</span>
                      <span class="text-xs px-2 py-0.5 rounded-full" 
                            [class]="group.category === 'system' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : group.category === 'tenant' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'">
                        {{ group.category }}
                      </span>
                    </div>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ group.description }}</p>
                  </div>

                  <!-- Action checkboxes -->
                  <div class="flex items-center gap-3">
                    <label *ngFor="let action of group.actions" class="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        [checked]="isPermissionSelected(group.resource, action)"
                        (change)="togglePermission(group.resource, action)"
                        class="w-3.5 h-3.5 rounded border-gray-300 text-blue-600"
                      />
                      <span class="text-xs font-medium" 
                            [class]="getActionColor(action)">
                        {{ action }}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <!-- Summary Footer -->
            <div class="border-t border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
              <div class="grid grid-cols-5 gap-2 text-center text-xs">
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">{{ getTotalSelectedResources() }}</p>
                  <p class="text-gray-600 dark:text-gray-400">Resources</p>
                </div>
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">{{ getTotalSelectedPermissions() }}</p>
                  <p class="text-gray-600 dark:text-gray-400">Total</p>
                </div>
                <div>
                  <p class="font-medium text-blue-600 dark:text-blue-400">{{ getActionCount('view') + getActionCount('read') }}</p>
                  <p class="text-gray-600 dark:text-gray-400">Read</p>
                </div>
                <div>
                  <p class="font-medium text-green-600 dark:text-green-400">{{ getActionCount('create') }}</p>
                  <p class="text-gray-600 dark:text-gray-400">Create</p>
                </div>
                <div>
                  <p class="font-medium text-red-600 dark:text-red-400">{{ getActionCount('delete') }}</p>
                  <p class="text-gray-600 dark:text-gray-400">Delete</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RoleEditorComponent implements OnInit {
  isEditing = signal(false);
  roleId: string | null = null;
  roleName = '';
  roleDescription = '';
  roleSpace: 'system' | 'tenant' | 'customer' = 'tenant';

  // Resource groups with available permissions
  resourceGroups: ResourceGroup[] = [
    // System level
    { resource: 'dashboard', displayName: 'Dashboard', description: 'System dashboard access', actions: ['view'], category: 'system' },
    { resource: 'tenants', displayName: 'Tenants', description: 'Manage tenant organizations', actions: ['view', 'create', 'update', 'delete'], category: 'system' },
    { resource: 'users', displayName: 'Users (System)', description: 'System-wide user management', actions: ['view', 'create', 'update', 'delete', 'invite', 'assign-roles'], category: 'system' },
    { resource: 'roles', displayName: 'Roles & Permissions', description: 'Role and permission management', actions: ['view', 'create', 'update', 'delete', 'assign-permissions'], category: 'system' },
    { resource: 'permissions', displayName: 'Permissions', description: 'Permission management', actions: ['view', 'assign'], category: 'system' },
    { resource: 'system', displayName: 'System Settings', description: 'System configuration', actions: ['view', 'manage-config'], category: 'system' },
    { resource: 'monitoring', displayName: 'Monitoring', description: 'System monitoring', actions: ['view', 'view-performance'], category: 'system' },
    { resource: 'billing', displayName: 'Billing', description: 'Billing and invoices', actions: ['view', 'manage-plans', 'view-invoices'], category: 'system' },
    
    // Tenant level
    { resource: 'tenant-dashboard', displayName: 'Tenant Dashboard', description: 'Tenant dashboard access', actions: ['view'], category: 'tenant' },
    { resource: 'tenant-users', displayName: 'Tenant Users', description: 'Manage users within tenant', actions: ['view', 'create', 'update', 'delete', 'invite', 'assign-roles'], category: 'tenant' },
    { resource: 'tenant-roles', displayName: 'Tenant Roles', description: 'Manage tenant roles', actions: ['view', 'create', 'update', 'delete'], category: 'tenant' },
    { resource: 'tenant-settings', displayName: 'Tenant Settings', description: 'Tenant configuration', actions: ['view', 'update'], category: 'tenant' },
    
    // Business modules
    { resource: 'loans', displayName: 'Loans', description: 'Loan management', actions: ['view', 'create', 'update', 'delete', 'approve', 'disburse'], category: 'business' },
    { resource: 'payments', displayName: 'Payments', description: 'Payment processing', actions: ['view', 'create', 'update', 'delete'], category: 'business' },
    { resource: 'reports', displayName: 'Reports', description: 'Reporting and analytics', actions: ['view', 'export', 'financial'], category: 'business' },
  ];

  // Selected permissions stored as Set<permissionKey> where permissionKey = 'resource:action'
  selectedPermissions = signal<Set<string>>(new Set());

  private parsePermissionKey(permKey: string): { resource: string; action: string } {
    if (!permKey) {
      return { resource: '', action: '' };
    }
    const segments = permKey.split(':');
    if (segments.length < 2) {
      return { resource: permKey, action: '' };
    }
    const action = segments.pop()!;
    return { resource: segments.join(':'), action };
  }

  constructor(
    public roleService: RoleService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    this.route.params.subscribe(params => {
      if (params['id'] && params['id'] !== 'new') {
        this.isEditing.set(true);
        this.roleId = params['id'];
        this.loadRole();
      }
    });
  }

  async loadRole(): Promise<void> {
    if (!this.roleId) return;
    const role = await this.roleService.getRole(this.roleId);
    if (role) {
      this.roleName = role.name;
      this.roleDescription = role.description || '';
      this.roleSpace = role.space;

      console.log('🔄 Loading role:', role);
      console.log('🔄 Role permissions:', role.permissions);

      // Load permissions into set
      const permSet = new Set<string>();
      if (role.permissions && Array.isArray(role.permissions)) {
        for (const perm of role.permissions) {
          const permKey = perm.permissionKey || `${perm.resource}:${perm.action}`;
          permSet.add(permKey);
        }
      }

      console.log('✅ Loaded permissions:', Array.from(permSet));
      this.selectedPermissions.set(permSet);
      this.cdr.detectChanges();
    }
  }

  isPermissionSelected(resource: string, action: string): boolean {
    const permKey = `${resource}:${action}`;
    return this.selectedPermissions().has(permKey);
  }

  togglePermission(resource: string, action: string): void {
    const permKey = `${resource}:${action}`;
    const perms = new Set(this.selectedPermissions());
    
    if (perms.has(permKey)) {
      perms.delete(permKey);
    } else {
      perms.add(permKey);
    }
    
    this.selectedPermissions.set(perms);
  }

  selectAll(): void {
    const perms = new Set<string>();
    this.resourceGroups.forEach(group => {
      // Filter by space
      if ((this.roleSpace === 'system' && group.category === 'system') ||
          (this.roleSpace === 'tenant' && (group.category === 'tenant' || group.category === 'business'))) {
        group.actions.forEach(action => {
          perms.add(`${group.resource}:${action}`);
        });
      }
    });
    this.selectedPermissions.set(perms);
  }

  clearAll(): void {
    this.selectedPermissions.set(new Set());
  }

  getTotalSelectedPermissions(): number {
    return this.selectedPermissions().size;
  }

  getTotalSelectedResources(): number {
    const resources = new Set<string>();
    this.selectedPermissions().forEach(permKey => {
      const { resource } = this.parsePermissionKey(permKey);
      if (resource) {
        resources.add(resource);
      }
    });
    return resources.size;
  }

  getActionCount(action: string): number {
    let count = 0;
    this.selectedPermissions().forEach(permKey => {
      const { action: permAction } = this.parsePermissionKey(permKey);
      if (permAction === action) count++;
    });
    return count;
  }

  getActionColor(action: string): string {
    const colors: Record<string, string> = {
      'view': 'text-blue-600 dark:text-blue-400',
      'read': 'text-blue-600 dark:text-blue-400',
      'create': 'text-green-600 dark:text-green-400',
      'update': 'text-orange-600 dark:text-orange-400',
      'edit': 'text-orange-600 dark:text-orange-400',
      'delete': 'text-red-600 dark:text-red-400',
      'manage': 'text-purple-600 dark:text-purple-400',
      'assign': 'text-indigo-600 dark:text-indigo-400',
      'approve': 'text-teal-600 dark:text-teal-400',
      'disburse': 'text-pink-600 dark:text-pink-400',
    };
    return colors[action] || 'text-gray-600 dark:text-gray-400';
  }

  canSave(): boolean {
    return this.roleName.trim().length > 0 && this.getTotalSelectedPermissions() > 0;
  }

  async saveRole(): Promise<void> {
    if (!this.canSave()) {
      alert('Please provide a role name and select at least one permission');
      return;
    }

    console.log('🔄 Starting role save...');

    try {
      // Convert permissions set to array of objects
      const permissionsArray = Array.from(this.selectedPermissions()).map(permKey => ({
        permissionKey: permKey
      }));

      console.log('📋 Permissions to save:', permissionsArray);

      if (this.isEditing() && this.roleId) {
        console.log('✏️ Updating existing role:', this.roleId);
        const updated = await this.roleService.updateRole(this.roleId, {
          name: this.roleName,
          description: this.roleDescription
        });
        if (updated) {
          console.log('✅ Role updated, now assigning permissions...');
          await this.roleService.bulkAssignPermissions(this.roleId, permissionsArray);
          console.log('✅ Permissions assigned, navigating...');
          this.router.navigate(['/admin/roles']);
        } else {
          const errorMsg = this.roleService.errorSignal() || 'Failed to update role';
          console.error('❌ Update failed:', errorMsg);
          alert(errorMsg);
        }
      } else {
        console.log('➕ Creating new role...');
        const payload = {
          name: this.roleName,
          description: this.roleDescription,
          space: this.roleSpace
        };
        console.log('📤 Payload:', payload);

        const created = await this.roleService.createRole(payload);
        console.log('📥 Create response:', created);

        if (created) {
          console.log('✅ Role created with ID:', created.id);
          console.log('🔄 Now assigning permissions...');
          const bulkResult = await this.roleService.bulkAssignPermissions(created.id, permissionsArray);
          console.log('📥 Bulk permissions result:', bulkResult);
          console.log('✅ All done, navigating...');
          this.router.navigate(['/admin/roles']);
        } else {
          const errorMsg = this.roleService.errorSignal() || 'Failed to create role';
          console.error('❌ Create failed:', errorMsg);
          alert(errorMsg);
        }
      }
    } catch (error) {
      console.error('❌ Exception in saveRole:', error);
      alert('Error saving role: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }
}
