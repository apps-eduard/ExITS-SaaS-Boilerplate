import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { AuthService } from './auth.service';

export interface Permission {
  menuKey: string;
  displayName: string;
  icon: string;
  routePath: string;
  componentName: string;
  space: string;
  actionKeys: string[];
  availableActions: string[];
}

export interface Module {
  id: number;
  menuKey: string;
  displayName: string;
  icon: string;
  routePath: string;
  componentName: string;
  space: string;
  actionKeys: string[];
}

export interface Role {
  id: number;
  name: string;
  description: string;
  space: string;
  status: string;
  tenant_id: number | null;
  permissions?: Record<string, any>;
}

@Injectable({
  providedIn: 'root'
})
export class RBACService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = 'http://localhost:3000/api/rbac';

  // Signals
  userPermissions = signal<Record<string, Permission>>({});
  allModules = signal<Module[]>([]);
  allRoles = signal<Role[]>([]);
  
  // Computed
  menuKeys = computed(() => Object.keys(this.userPermissions()));
  
  constructor() {
    // Auto-fetch permissions when user logs in
    effect(() => {
      if (this.authService.currentUser()) {
        this.loadUserPermissions();
        this.loadModules();
      } else {
        // Default permissions for unauthenticated or demo purposes
        this.setDefaultPermissions();
      }
    });
  }

  /**
   * Set default/mock permissions for demo
   */
  private setDefaultPermissions() {
    const defaultPermissions: Record<string, Permission> = {
      'dashboard': { menuKey: 'dashboard', displayName: 'Dashboard', icon: '📊', routePath: '/dashboard', componentName: 'DashboardComponent', space: 'system', actionKeys: ['view'], availableActions: ['view'] },
      'tenants': { menuKey: 'tenants', displayName: 'Tenants', icon: '🏢', routePath: '/tenants', componentName: 'TenantsComponent', space: 'system', actionKeys: ['view', 'create', 'edit', 'delete'], availableActions: ['view', 'create', 'edit', 'delete'] },
      'users': { menuKey: 'users', displayName: 'Users', icon: '👥', routePath: '/users', componentName: 'UsersComponent', space: 'system', actionKeys: ['view', 'create', 'edit', 'delete'], availableActions: ['view', 'create', 'edit', 'delete'] },
      'roles': { menuKey: 'roles', displayName: 'Roles & Permissions', icon: '🔐', routePath: '/roles', componentName: 'RolesComponent', space: 'system', actionKeys: ['view', 'create', 'edit', 'delete'], availableActions: ['view', 'create', 'edit', 'delete'] },
      'system': { menuKey: 'system', displayName: 'System', icon: '⚙️', routePath: '/system', componentName: 'SystemComponent', space: 'system', actionKeys: ['view'], availableActions: ['view'] },
      'monitoring': { menuKey: 'monitoring', displayName: 'Monitoring', icon: '📈', routePath: '/monitoring', componentName: 'MonitoringComponent', space: 'system', actionKeys: ['view'], availableActions: ['view'] },
      'config': { menuKey: 'config', displayName: 'Configuration', icon: '🛠️', routePath: '/config', componentName: 'ConfigComponent', space: 'system', actionKeys: ['view', 'edit', 'create'], availableActions: ['view', 'edit', 'create'] },
      'billing': { menuKey: 'billing', displayName: 'Billing', icon: '💰', routePath: '/billing', componentName: 'BillingComponent', space: 'system', actionKeys: ['view', 'edit'], availableActions: ['view', 'edit'] },
    };
    this.userPermissions.set(defaultPermissions);
    console.log('🧭 Default permissions loaded (demo mode)');
  }

  /**
   * Load all permissions for current user
   */
  loadUserPermissions() {
    if (!this.authService.isAuthenticated()) {
      console.log('🧭 User not authenticated, using default permissions');
      this.setDefaultPermissions();
      return;
    }
    
    this.http.get<any>(`${this.apiUrl}/my-permissions`).subscribe({
      next: (response) => {
        console.log('🔐 Permissions loaded from API:', response.data);
        if (response.data && response.data.permissions && Object.keys(response.data.permissions).length > 0) {
          this.userPermissions.set(response.data.permissions);
          console.log('✅ User permissions set:', Object.keys(response.data.permissions));
        } else {
          console.warn('⚠️ Empty permissions from API, falling back to defaults');
          this.setDefaultPermissions();
        }
      },
      error: (error) => {
        console.error('❌ Failed to load permissions from API:', error);
        console.log('🔄 Falling back to default permissions');
        this.setDefaultPermissions();
      }
    });
  }

  /**
   * Load all available modules
   */
  loadModules(space?: string) {
    const params = space ? `?space=${space}` : '';
    this.http.get<any>(`${this.apiUrl}/modules${params}`).subscribe({
      next: (response) => {
        console.log('📦 Modules loaded:', response.data);
        this.allModules.set(response.data);
      },
      error: (error) => {
        console.error('❌ Failed to load modules:', error);
      }
    });
  }

  /**
   * Check if user has access to a menu
   */
  hasMenuAccess(menuKey: string): boolean {
    return menuKey in this.userPermissions();
  }

  /**
   * Check if user has a specific action
   */
  hasAction(menuKey: string, actionKey: string): boolean {
    const permission = this.userPermissions()[menuKey];
    return permission ? permission.actionKeys.includes(actionKey) : false;
  }

  /**
   * Check if user has all required actions
   */
  hasAllActions(menuKey: string, actions: string[]): boolean {
    const permission = this.userPermissions()[menuKey];
    if (!permission) return false;
    return actions.every(action => permission.actionKeys.includes(action));
  }

  /**
   * Check if user has any of the required actions
   */
  hasAnyAction(menuKey: string, actions: string[]): boolean {
    const permission = this.userPermissions()[menuKey];
    if (!permission) return false;
    return actions.some(action => permission.actionKeys.includes(action));
  }

  /**
   * Get permission details for a menu
   */
  getPermission(menuKey: string): Permission | undefined {
    return this.userPermissions()[menuKey];
  }

  /**
   * Get all menus the user can access
   */
  getAccessibleMenus(): Module[] {
    const permissions = this.userPermissions();
    const modules = this.allModules();
    return modules.filter(m => m.menuKey in permissions);
  }

  /**
   * Get all action keys for a menu
   */
  getActionKeys(menuKey: string): string[] {
    const permission = this.userPermissions()[menuKey];
    return permission ? permission.actionKeys : [];
  }

  // ==================== ADMIN APIs ====================

  /**
   * Get all roles
   */
  getAllRoles() {
    return this.http.get<any>(`${this.apiUrl}/roles`);
  }

  /**
   * Get role with permissions
   */
  getRole(roleId: number) {
    return this.http.get<any>(`${this.apiUrl}/roles/${roleId}`);
  }

  /**
   * Create new role
   */
  createRole(name: string, description: string, space: string) {
    return this.http.post<any>(`${this.apiUrl}/roles`, {
      name,
      description,
      space
    });
  }

  /**
   * Update role
   */
  updateRole(roleId: number, name: string, description: string) {
    return this.http.put<any>(`${this.apiUrl}/roles/${roleId}`, {
      name,
      description
    });
  }

  /**
   * Assign permission to role
   */
  assignPermissionToRole(roleId: number, menuKey: string, actionKey: string) {
    return this.http.post<any>(`${this.apiUrl}/roles/${roleId}/permissions`, {
      menuKey,
      actionKey
    });
  }

  /**
   * Revoke permission from role
   */
  revokePermissionFromRole(roleId: number, menuKey: string, actionKey: string) {
    return this.http.delete<any>(`${this.apiUrl}/roles/${roleId}/permissions`, {
      body: { menuKey, actionKey }
    });
  }

  /**
   * Get user roles
   */
  getUserRoles(userId: number) {
    return this.http.get<any>(`${this.apiUrl}/users/${userId}/roles`);
  }

  /**
   * Assign role to user
   */
  assignRoleToUser(userId: number, roleId: number) {
    return this.http.post<any>(`${this.apiUrl}/users/${userId}/roles`, {
      roleId
    });
  }

  /**
   * Remove role from user
   */
  removeRoleFromUser(userId: number, roleId: number) {
    return this.http.delete<any>(`${this.apiUrl}/users/${userId}/roles`, {
      body: { roleId }
    });
  }

  /**
   * Create new module
   */
  createModule(menuKey: string, displayName: string, space: string, actionKeys: string[] = ['view']) {
    return this.http.post<any>(`${this.apiUrl}/modules`, {
      menuKey,
      displayName,
      space,
      actionKeys
    });
  }
}
