import { Injectable, inject, signal, computed, effect } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
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

  // Signals - Standard RBAC format
  userPermissions = signal<Set<string>>(new Set()); // Set of permission keys like "users:create"
  permissionDetails = signal<Array<{key: string, resource: string, action: string, description: string}>>([]); 
  permissionsLoaded = signal<boolean>(false); // Track if permissions have been loaded
  
  // Legacy signals (keep for backward compatibility during migration)
  allModules = signal<Module[]>([]);
  allRoles = signal<Role[]>([]);

  // Computed
  permissionsList = computed(() => Array.from(this.userPermissions()));

  constructor() {
    // Auto-fetch permissions when user logs in
    effect(() => {
      if (this.authService.currentUser()) {
        this.loadUserPermissions();
        this.loadModules();
      } else {
        // Clear permissions for unauthenticated users
        this.userPermissions.set(new Set());
        this.permissionDetails.set([]);
        this.permissionsLoaded.set(false);
      }
    });
  }

  /**
   * Load all permissions for current user (Standard RBAC format)
   */
  loadUserPermissions() {
    if (!this.authService.isAuthenticated()) {
      console.log('🧭 User not authenticated, clearing permissions');
      this.userPermissions.set(new Set());
      this.permissionDetails.set([]);
      this.permissionsLoaded.set(false);
      return;
    }

    console.log('🔄 Loading permissions from API...');
    console.log('🔑 Auth token present:', !!this.authService.currentUser());
    console.log('🔑 Access token from AuthService:', this.authService.getAccessToken()?.substring(0, 30) + '...');
    console.log('🔑 Access token from localStorage:', localStorage.getItem('access_token')?.substring(0, 30) + '...');
    
    // Don't manually add headers - the interceptor handles this
    this.http.get<any>('http://localhost:3000/api/auth/me/permissions').subscribe({
      next: (response) => {
        // console.log('� RAW API Response:', response);
        // console.log('📦 Response.data:', response.data);
        // // console.log('📦 Response.data.permissions:', response.data?.permissions);
        // // console.log('📦 Type of permissions:', typeof response.data?.permissions);
        
        if (response.data && response.data.permissions) {
          // console.log('✅ Permissions array:', response.data.permissions);
          const permissionSet = new Set<string>(response.data.permissions as string[]);
          // console.log('✅ Permission Set created with size:', permissionSet.size);
          // console.log('✅ Permission Set contents:', Array.from(permissionSet));
          
          this.userPermissions.set(permissionSet);
          this.permissionDetails.set(response.data.details || []);
          this.permissionsLoaded.set(true);
          // console.log('✅ User permissions set:', Array.from(permissionSet));
          // console.log(`✅ Total permissions loaded: ${permissionSet.size}`);
        } else {
          console.warn('⚠️ No permissions granted to this user');
          console.warn('⚠️ Response structure:', JSON.stringify(response, null, 2));
          this.userPermissions.set(new Set<string>());
          this.permissionDetails.set([]);
          this.permissionsLoaded.set(true);
        }
      },
      error: (error) => {
        console.error('❌ Failed to load permissions from API:', error);
        this.userPermissions.set(new Set<string>());
        this.permissionDetails.set([]);
        this.permissionsLoaded.set(true);
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

  // ==================== Standard RBAC Methods ====================

  /**
   * Check if user has a specific permission (Standard RBAC)
   * @param permissionKey - Permission in format "resource:action" (e.g., "users:create")
   */
  can(permissionKey: string): boolean {
    return this.userPermissions().has(permissionKey);
  }

  /**
   * Check if user can perform action on resource
   * @param resource - Resource name (e.g., "users")
   * @param action - Action name (e.g., "create")
   */
  canDo(resource: string, action: string): boolean {
    return this.can(`${resource}:${action}`);
  }

  /**
   * Check if user has any of the specified permissions
   */
  canAny(permissionKeys: string[]): boolean {
    return permissionKeys.some(key => this.can(key));
  }

  /**
   * Check if user has all specified permissions
   */
  canAll(permissionKeys: string[]): boolean {
    return permissionKeys.every(key => this.can(key));
  }

  /**
   * Check if user can access a product feature
   * Combines permission check with product subscription status
   * @param productType - Product type (e.g., "money_loan", "bnpl", "pawnshop")
   * @param action - Optional action to check (e.g., "read", "create")
   */
  canAccessProduct(productType: string, action: string = 'read'): boolean {
    // Check if user has permission to access the product
    const hasPermission = this.can(`${productType}:${action}`);
    
    // TODO: Also check if tenant has active subscription for this product
    // This will be implemented when we integrate with subscription status
    // const hasActiveSubscription = this.tenantService.hasActiveSubscription(productType);
    
    // For now, just check permissions
    // Later: return hasPermission && hasActiveSubscription;
    return hasPermission;
  }

  // ==================== Legacy Methods (backward compatibility) ====================

  /**
   * Check if user has access to a menu (LEGACY)
   * @deprecated Use can() or canDo() instead
   */
  hasMenuAccess(menuKey: string): boolean {
    // Map old menu keys to new permissions
    // For now, check if user has any permission for this resource
    const permissions = Array.from(this.userPermissions());
    return permissions.some(p => p.startsWith(`${menuKey}:`) || p.startsWith(`tenant-${menuKey}:`));
  }

  /**
   * Check if user has a specific action (LEGACY)
   * @deprecated Use can('resource:action') instead
   */
  hasAction(menuKey: string, actionKey: string): boolean {
    // Try both system and tenant versions
    return this.can(`${menuKey}:${actionKey}`) || this.can(`tenant-${menuKey}:${actionKey}`);
  }

  /**
   * Check if user has all required actions (LEGACY)
   * @deprecated Use canAll() instead
   */
  hasAllActions(menuKey: string, actions: string[]): boolean {
    return actions.every(action => this.hasAction(menuKey, action));
  }

  /**
   * Check if user has any of the required actions (LEGACY)
   * @deprecated Use canAny() instead
   */
  hasAnyAction(menuKey: string, actions: string[]): boolean {
    return actions.some(action => this.hasAction(menuKey, action));
  }

  /**
   * Get permission details for a menu (LEGACY)
   * @deprecated Use permissionDetails signal instead
   */
  getPermission(menuKey: string): Permission | undefined {
    return undefined; // No longer supported in standard RBAC
  }

  /**
   * Get all menus the user can access (LEGACY)
   * @deprecated Use permissionsList computed instead
   */
  getAccessibleMenus(): Module[] {
    const permissions = this.userPermissions();
    const modules = this.allModules();
    return modules.filter(m => this.hasMenuAccess(m.menuKey));
  }

  /**
   * Get all action keys for a menu (LEGACY)
   * @deprecated Use permissionDetails signal instead
   */
  getActionKeys(menuKey: string): string[] {
    const permissions = Array.from(this.userPermissions());
    return permissions
      .filter(p => p.startsWith(`${menuKey}:`))
      .map(p => {
        const segments = p.split(':');
        return segments[segments.length - 1];
      });
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
