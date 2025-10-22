import { Component, OnInit, signal, effect, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { RoleService, Role } from '../../../core/services/role.service';
import { RBACService } from '../../../core/services/rbac.service';

interface MenuItem {
  key: string;
  label: string;
  icon: string;
  children?: MenuItem[];
}

interface MenuPermission {
  menuKey: string;
  view: boolean;
  create: boolean;
  edit: boolean;
  delete: boolean;
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
              Select menu items and their permissions
            </p>
          </div>
        </div>

        <div *ngIf="getTotalSelectedMenus() > 0" class="px-3 py-1 rounded bg-blue-50 dark:bg-blue-900/20">
          <span class="text-xs text-blue-600 dark:text-blue-400 font-medium">
            {{ getTotalPermissions() }} permissions on {{ getTotalSelectedMenus() }} menus
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
                  Level <span class="text-red-500">*</span>
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
                (click)="selectAllMenus()"
                class="w-full rounded bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 transition"
              >
                ✓ Select All Menus
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
                <li *ngIf="getTotalSelectedMenus() === 0">• Select at least 1 menu</li>
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
                <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Menu & Permissions</h2>
                <div class="text-xs text-gray-500 dark:text-gray-400">
                  Select menus from sidebar and assign permissions
                </div>
              </div>
            </div>

            <!-- Permission Grid -->
            <div class="divide-y divide-gray-200 dark:divide-gray-700">

              <!-- Each Menu Item -->
              <div *ngFor="let menu of menuItems" class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">

                <!-- Parent Menu Row -->
                <div class="flex items-center px-4 py-3">

                  <!-- Menu Selection (Left) -->
                  <div class="flex-1 flex items-center gap-3">
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        [checked]="isMenuSelected(menu.key)"
                        (change)="toggleMenu(menu.key)"
                        class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-2 focus:ring-blue-500"
                      />
                      <span class="text-lg">{{ menu.icon }}</span>
                      <span class="text-sm font-medium text-gray-900 dark:text-white">{{ menu.label }}</span>
                    </label>

                    <!-- Expand/Collapse for parents with children -->
                    <button
                      *ngIf="menu.children && menu.children.length > 0"
                      (click)="toggleExpanded(menu.key)"
                      class="ml-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                    >
                      <svg class="w-4 h-4 transition-transform" [class.rotate-90]="isExpanded(menu.key)" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                      </svg>
                    </button>
                  </div>

                  <!-- Permissions (Right) -->
                  <div *ngIf="isMenuSelected(menu.key)" class="flex items-center gap-4">
                    <label class="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        [checked]="getPermission(menu.key, 'view')"
                        (change)="togglePermission(menu.key, 'view')"
                        class="w-3.5 h-3.5 rounded border-gray-300 text-blue-600"
                      />
                      <span class="text-xs text-blue-600 dark:text-blue-400">👁️ View</span>
                    </label>
                    <label class="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        [checked]="getPermission(menu.key, 'create')"
                        (change)="togglePermission(menu.key, 'create')"
                        class="w-3.5 h-3.5 rounded border-gray-300 text-green-600"
                      />
                      <span class="text-xs text-green-600 dark:text-green-400">➕ Create</span>
                    </label>
                    <label class="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        [checked]="getPermission(menu.key, 'edit')"
                        (change)="togglePermission(menu.key, 'edit')"
                        class="w-3.5 h-3.5 rounded border-gray-300 text-orange-600"
                      />
                      <span class="text-xs text-orange-600 dark:text-orange-400">✏️ Edit</span>
                    </label>
                    <label class="flex items-center gap-1.5 cursor-pointer">
                      <input
                        type="checkbox"
                        [checked]="getPermission(menu.key, 'delete')"
                        (change)="togglePermission(menu.key, 'delete')"
                        class="w-3.5 h-3.5 rounded border-gray-300 text-red-600"
                      />
                      <span class="text-xs text-red-600 dark:text-red-400">🗑️ Delete</span>
                    </label>
                  </div>
                  <div *ngIf="!isMenuSelected(menu.key)" class="text-xs text-gray-400 dark:text-gray-600">
                    Select menu to assign permissions
                  </div>
                </div>

                <!-- Child Menu Rows (Indented) -->
                <div *ngIf="menu.children && isExpanded(menu.key)" class="bg-gray-50 dark:bg-gray-800/30">
                  <div *ngFor="let child of menu.children" class="flex items-center px-4 py-2 pl-12 border-t border-gray-200 dark:border-gray-700">

                    <!-- Child Menu Selection -->
                    <div class="flex-1 flex items-center gap-2">
                      <label class="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          [checked]="isMenuSelected(child.key)"
                          (change)="toggleMenu(child.key)"
                          class="w-4 h-4 rounded border-gray-300 text-blue-600"
                        />
                        <span class="text-base">{{ child.icon }}</span>
                        <span class="text-sm text-gray-700 dark:text-gray-300">{{ child.label }}</span>
                      </label>
                    </div>

                    <!-- Child Permissions -->
                    <div *ngIf="isMenuSelected(child.key)" class="flex items-center gap-4">
                      <label class="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          [checked]="getPermission(child.key, 'view')"
                          (change)="togglePermission(child.key, 'view')"
                          class="w-3.5 h-3.5 rounded border-gray-300 text-blue-600"
                        />
                        <span class="text-xs text-blue-600 dark:text-blue-400">👁️</span>
                      </label>
                      <label class="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          [checked]="getPermission(child.key, 'create')"
                          (change)="togglePermission(child.key, 'create')"
                          class="w-3.5 h-3.5 rounded border-gray-300 text-green-600"
                        />
                        <span class="text-xs text-green-600 dark:text-green-400">➕</span>
                      </label>
                      <label class="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          [checked]="getPermission(child.key, 'edit')"
                          (change)="togglePermission(child.key, 'edit')"
                          class="w-3.5 h-3.5 rounded border-gray-300 text-orange-600"
                        />
                        <span class="text-xs text-orange-600 dark:text-orange-400">✏️</span>
                      </label>
                      <label class="flex items-center gap-1.5 cursor-pointer">
                        <input
                          type="checkbox"
                          [checked]="getPermission(child.key, 'delete')"
                          (change)="togglePermission(child.key, 'delete')"
                          class="w-3.5 h-3.5 rounded border-gray-300 text-red-600"
                        />
                        <span class="text-xs text-red-600 dark:text-red-400">🗑️</span>
                      </label>
                    </div>
                    <div *ngIf="!isMenuSelected(child.key)" class="text-xs text-gray-400 dark:text-gray-600">
                      Not selected
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <!-- Summary Footer -->
            <div class="border-t border-gray-200 bg-gray-50 px-4 py-3 dark:border-gray-700 dark:bg-gray-800">
              <div class="grid grid-cols-5 gap-2 text-center text-xs">
                <div>
                  <p class="font-medium text-gray-900 dark:text-white">{{ getTotalSelectedMenus() }}</p>
                  <p class="text-gray-600 dark:text-gray-400">Menus</p>
                </div>
                <div>
                  <p class="font-medium text-blue-600 dark:text-blue-400">{{ getActionCount('view') }}</p>
                  <p class="text-gray-600 dark:text-gray-400">View</p>
                </div>
                <div>
                  <p class="font-medium text-green-600 dark:text-green-400">{{ getActionCount('create') }}</p>
                  <p class="text-gray-600 dark:text-gray-400">Create</p>
                </div>
                <div>
                  <p class="font-medium text-orange-600 dark:text-orange-400">{{ getActionCount('edit') }}</p>
                  <p class="text-gray-600 dark:text-gray-400">Edit</p>
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
  `,
  styles: [`
    .rotate-90 {
      transform: rotate(90deg);
    }
  `]
})
export class RoleEditorComponent implements OnInit {
  isEditing = signal(false);
  roleId: string | null = null;
  roleName = '';
  roleDescription = '';
  roleSpace: 'system' | 'tenant' = 'tenant';

  // Menu structure matching both system and tenant sidebars
  menuItems: MenuItem[] = [
    // System-level menus
    { key: 'dashboard', label: '📊 System Dashboard', icon: '📊' },
    {
      key: 'tenants',
      label: '🏢 Tenants Management',
      icon: '🏢',
      children: [
        { key: 'tenants-overview', label: 'Overview', icon: '📋' },
        { key: 'tenants-subscriptions', label: 'Subscriptions', icon: '💳' },
        { key: 'tenants-usage', label: 'Usage Analytics', icon: '📊' }
      ]
    },
    {
      key: 'users',
      label: '👥 System Users',
      icon: '👥',
      children: [
        { key: 'users-list', label: 'All Users', icon: '👤' },
        { key: 'users-roles', label: 'User Roles', icon: '🎭' },
        { key: 'users-invites', label: 'Invitations', icon: '✉️' }
      ]
    },
    {
      key: 'roles',
      label: '🔐 Roles & Permissions',
      icon: '🔐',
      children: [
        { key: 'roles-list', label: 'Roles', icon: '🎭' },
        { key: 'permissions', label: 'Permissions', icon: '🔑' }
      ]
    },
    { key: 'system', label: '⚙️ System Settings', icon: '⚙️' },
    { key: 'monitoring', label: '📈 Monitoring', icon: '📈' },
    { key: 'config', label: '🔧 Configuration', icon: '🔧' },
    { key: 'billing', label: '💰 Billing', icon: '💰' },

    // Tenant-level menus
    { key: 'tenant-dashboard', label: '📊 Tenant Dashboard', icon: '📊' },
    {
      key: 'tenant-overview',
      label: '📈 Tenant Overview',
      icon: '📈',
      children: [
        { key: 'tenant-overview-reports', label: 'Reports', icon: '📊' }
      ]
    },
    {
      key: 'tenant-users',
      label: '👥 Tenant Users',
      icon: '👥',
      children: [
        { key: 'tenant-users-list', label: 'List Users', icon: '👤' },
        { key: 'tenant-users-create', label: 'Create User', icon: '➕' },
        { key: 'tenant-users-assign', label: 'Assign Roles', icon: '🔐' }
      ]
    },
    {
      key: 'tenant-roles',
      label: '🔐 Tenant Roles',
      icon: '🔐',
      children: [
        { key: 'tenant-roles-manage', label: 'Role Management', icon: '👔' },
        { key: 'tenant-roles-permissions', label: 'Assign Permissions', icon: '🔑' }
      ]
    },
    {
      key: 'tenant-modules',
      label: '🧩 Business Modules',
      icon: '🧩',
      children: [
        { key: 'module-money-loan', label: 'Money Loan', icon: '💰' },
        { key: 'module-bnpl', label: 'BNPL', icon: '💳' },
        { key: 'module-pawnshop', label: 'Pawnshop', icon: '💎' }
      ]
    },
    {
      key: 'tenant-transactions',
      label: '💸 Transactions',
      icon: '💸',
      children: [
        { key: 'tenant-transactions-loans', label: 'Loans', icon: '💰' },
        { key: 'tenant-transactions-payments', label: 'Payments', icon: '💳' },
        { key: 'tenant-transactions-receipts', label: 'Receipts', icon: '🧾' }
      ]
    },
    {
      key: 'tenant-reports',
      label: '📊 Reports',
      icon: '📊',
      children: [
        { key: 'tenant-reports-financial', label: 'Financial Reports', icon: '💵' },
        { key: 'tenant-reports-users', label: 'User Reports', icon: '👥' },
        { key: 'tenant-reports-modules', label: 'Module Reports', icon: '🧩' }
      ]
    },
    {
      key: 'tenant-settings',
      label: '⚙️ Tenant Settings',
      icon: '⚙️',
      children: [
        { key: 'tenant-settings-info', label: 'Tenant Info', icon: '🏢' },
        { key: 'tenant-settings-branches', label: 'Branches', icon: '🏪' },
        { key: 'tenant-settings-modules', label: 'Module Config', icon: '🛠️' }
      ]
    }
  ];

  // Store permissions: Map<menuKey, {view, create, edit, delete}>
  permissions = signal<Map<string, MenuPermission>>(new Map());
  expandedMenus = signal<Set<string>>(new Set());

  constructor(
    public roleService: RoleService,
    private rbacService: RBACService,
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
      console.log('🔄 Role permissions (raw):', role.permissions);
      console.log('🔄 First permission example:', role.permissions?.[0]);

      // Load permissions into map
      const permMap = new Map<string, MenuPermission>();
      if (role.permissions && Array.isArray(role.permissions)) {
        for (const perm of role.permissions) {
          // Handle both camelCase and snake_case from API
          const menuKey = (perm as any).menuKey || (perm as any).menu_key;
          const actionKey = (perm as any).actionKey || (perm as any).action_key;

          console.log('🔍 Processing permission:', { perm, menuKey, actionKey });

          if (!menuKey || !actionKey) {
            console.warn('⚠️ Invalid permission format:', perm);
            continue;
          }

          if (!permMap.has(menuKey)) {
            permMap.set(menuKey, { menuKey: menuKey, view: false, create: false, edit: false, delete: false });
          }
          const menuPerm = permMap.get(menuKey)!;
          if (actionKey === 'view') menuPerm.view = true;
          if (actionKey === 'create') menuPerm.create = true;
          if (actionKey === 'edit') menuPerm.edit = true;
          if (actionKey === 'delete') menuPerm.delete = true;
        }
      }

      console.log('✅ Loaded permissions map:', permMap);
      console.log('✅ Permissions map size:', permMap.size);
      console.log('✅ Permission menu keys:', Array.from(permMap.keys()));
      console.log('📋 Available menu items:', this.menuItems.map(m => ({ key: m.key, label: m.label })));

      this.permissions.set(permMap);

      // Trigger change detection to update the UI
      this.cdr.detectChanges();
      console.log('🔄 Change detection triggered for role editor');
    }
  }

  isMenuSelected(menuKey: string): boolean {
    return this.permissions().has(menuKey);
  }

  toggleMenu(menuKey: string): void {
    const perms = new Map(this.permissions());
    if (perms.has(menuKey)) {
      // Unchecking - remove this menu and all its children
      perms.delete(menuKey);

      // Find and remove all children of this menu
      const menu = this.menuItems.find(m => m.key === menuKey);
      if (menu && menu.children) {
        menu.children.forEach(child => {
          perms.delete(child.key);
        });
      }
    } else {
      // Checking - add with default view permission
      perms.set(menuKey, { menuKey, view: true, create: false, edit: false, delete: false });
    }
    this.permissions.set(perms);
  }

  getPermission(menuKey: string, action: 'view' | 'create' | 'edit' | 'delete'): boolean {
    const perm = this.permissions().get(menuKey);
    return perm ? perm[action] : false;
  }

  togglePermission(menuKey: string, action: 'view' | 'create' | 'edit' | 'delete'): void {
    const perms = new Map(this.permissions());
    const perm = perms.get(menuKey);
    if (perm) {
      perm[action] = !perm[action];
      perms.set(menuKey, perm);
      this.permissions.set(perms);
    }
  }

  isExpanded(menuKey: string): boolean {
    return this.expandedMenus().has(menuKey);
  }

  toggleExpanded(menuKey: string): void {
    const expanded = new Set(this.expandedMenus());
    if (expanded.has(menuKey)) {
      expanded.delete(menuKey);
    } else {
      expanded.add(menuKey);
    }
    this.expandedMenus.set(expanded);
  }

  selectAllMenus(): void {
    const perms = new Map<string, MenuPermission>();
    const addMenu = (menu: MenuItem) => {
      perms.set(menu.key, { menuKey: menu.key, view: true, create: true, edit: true, delete: true });
      if (menu.children) {
        menu.children.forEach(child => addMenu(child));
      }
    };
    this.menuItems.forEach(menu => addMenu(menu));
    this.permissions.set(perms);

    // Expand all parents
    const expanded = new Set<string>();
    this.menuItems.forEach(menu => {
      if (menu.children) expanded.add(menu.key);
    });
    this.expandedMenus.set(expanded);
  }

  clearAll(): void {
    this.permissions.set(new Map());
    this.expandedMenus.set(new Set());
  }

  getTotalSelectedMenus(): number {
    return this.permissions().size;
  }

  getTotalPermissions(): number {
    let count = 0;
    this.permissions().forEach(perm => {
      if (perm.view) count++;
      if (perm.create) count++;
      if (perm.edit) count++;
      if (perm.delete) count++;
    });
    return count;
  }

  getActionCount(action: 'view' | 'create' | 'edit' | 'delete'): number {
    let count = 0;
    this.permissions().forEach(perm => {
      if (perm[action]) count++;
    });
    return count;
  }

  canSave(): boolean {
    return this.roleName.trim().length > 0 && this.getTotalSelectedMenus() > 0;
  }

  async saveRole(): Promise<void> {
    if (!this.canSave()) {
      console.log('❌ Cannot save - validation failed');
      alert('Please provide a role name and select at least one menu');
      return;
    }

    console.log('🔄 Starting role save...');
    console.log('Role Name:', this.roleName);
    console.log('Role Description:', this.roleDescription);
    console.log('Role Space:', this.roleSpace);
    console.log('Permissions Map:', this.permissions());

    try {
      // Convert permissions map to array
      const permissionsArray: any[] = [];
      this.permissions().forEach(perm => {
        if (perm.view) permissionsArray.push({ menuKey: perm.menuKey, actionKey: 'view' });
        if (perm.create) permissionsArray.push({ menuKey: perm.menuKey, actionKey: 'create' });
        if (perm.edit) permissionsArray.push({ menuKey: perm.menuKey, actionKey: 'edit' });
        if (perm.delete) permissionsArray.push({ menuKey: perm.menuKey, actionKey: 'delete' });
      });

      console.log('📋 Permissions Array:', permissionsArray);

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
