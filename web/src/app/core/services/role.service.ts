import { Injectable, signal, computed } from '@angular/core';
import { HttpClient, HttpResponse } from '@angular/common/http';
import { Router } from '@angular/router';
import { firstValueFrom } from 'rxjs';

export interface Permission {
  id?: string;
  menuKey: string;
  actionKey: string;
  constraints?: Record<string, any>;
  status?: string;
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  space: 'system' | 'tenant';
  status?: 'active' | 'inactive';
  parentRoleId?: string;
  createdAt?: string;
  updatedAt?: string;
  permissions?: Permission[];
}

export interface RoleCreatePayload {
  name: string;
  description?: string;
  space: 'system' | 'tenant';
  parentRoleId?: string;
}

export interface RoleUpdatePayload {
  name?: string;
  description?: string;
  parentRoleId?: string;
}

export interface PermissionMatrix {
  [moduleKey: string]: {
    [actionKey: string]: boolean;
  };
}

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private apiUrl = 'http://localhost:3000/api/rbac';

  // Signals
  rolesSignal = signal<Role[]>([]);
  currentRoleSignal = signal<Role | null>(null);
  loadingSignal = signal<boolean>(false);
  errorSignal = signal<string | null>(null);
  permissionMatrixSignal = signal<PermissionMatrix>({});

  // Computed signals
  roleCountComputed = computed(() => this.rolesSignal().length);
  systemRolesComputed = computed(() =>
    this.rolesSignal().filter(r => r.space === 'system')
  );
  tenantRolesComputed = computed(() =>
    this.rolesSignal().filter(r => r.space === 'tenant')
  );

  constructor(
    private http: HttpClient,
    private router: Router
  ) {
    console.log('✅ RoleService initialized');
  }

  /**
   * Load all roles
   */
  async loadRoles(space?: 'system' | 'tenant'): Promise<void> {
    try {
      this.loadingSignal.set(true);
      this.errorSignal.set(null);

      const options: any = {};
      if (space) {
        options['params'] = { space };
      }

      const response: any = await firstValueFrom(
        this.http.get<any>(
          `${this.apiUrl}/roles`,
          { ...options, responseType: 'json' }
        )
      );

      if (response && response.success) {
        this.rolesSignal.set(response.data || []);
        console.log(`📋 Loaded ${response.data?.length || 0} roles`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load roles';
      this.errorSignal.set(message);
      console.error('❌ Error loading roles:', message);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Get single role with permissions
   */
  async getRole(roleId: string): Promise<Role | null> {
    try {
      this.loadingSignal.set(true);
      this.errorSignal.set(null);

      const response: any = await firstValueFrom(
        this.http.get<any>(
          `${this.apiUrl}/roles/${roleId}`,
          { responseType: 'json' }
        )
      );

      if (response && response.success) {
        this.currentRoleSignal.set(response.data);
        console.log(`✅ Loaded role: ${response.data.name}`);
        return response.data;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get role';
      this.errorSignal.set(message);
      console.error('❌ Error getting role:', message);
    } finally {
      this.loadingSignal.set(false);
    }

    return null;
  }

  /**
   * Create new role
   */
  async createRole(payload: RoleCreatePayload): Promise<Role | null> {
    try {
      this.loadingSignal.set(true);
      this.errorSignal.set(null);

      const response: any = await firstValueFrom(
        this.http.post<any>(
          `${this.apiUrl}/roles`,
          payload,
          { responseType: 'json' }
        )
      );

      if (response && response.success) {
        const newRole = response.data;
        this.rolesSignal.set([...this.rolesSignal(), newRole]);
        console.log(`✅ Role created: ${newRole.name}`);
        return newRole;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create role';
      this.errorSignal.set(message);
      console.error('❌ Error creating role:', message);
    } finally {
      this.loadingSignal.set(false);
    }

    return null;
  }

  /**
   * Update role
   */
  async updateRole(roleId: string, payload: RoleUpdatePayload): Promise<Role | null> {
    try {
      this.loadingSignal.set(true);
      this.errorSignal.set(null);

      const response: any = await firstValueFrom(
        this.http.put<any>(
          `${this.apiUrl}/roles/${roleId}`,
          payload,
          { responseType: 'json' }
        )
      );

      if (response && response.success) {
        const updated = response.data;
        // Update in signal
        this.rolesSignal.set(
          this.rolesSignal().map(r => r.id === roleId ? updated : r)
        );
        this.currentRoleSignal.set(updated);
        console.log(`✅ Role updated: ${updated.name}`);
        return updated;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update role';
      this.errorSignal.set(message);
      console.error('❌ Error updating role:', message);
    } finally {
      this.loadingSignal.set(false);
    }

    return null;
  }

  /**
   * Delete role
   */
  async deleteRole(roleId: string): Promise<boolean> {
    try {
      this.loadingSignal.set(true);
      this.errorSignal.set(null);

      const response: any = await firstValueFrom(
        this.http.delete<any>(
          `${this.apiUrl}/roles/${roleId}`,
          { responseType: 'json' }
        )
      );

      if (response && response.success) {
        // Remove from signal
        this.rolesSignal.set(
          this.rolesSignal().filter(r => r.id !== roleId)
        );
        if (this.currentRoleSignal()?.id === roleId) {
          this.currentRoleSignal.set(null);
        }
        console.log(`✅ Role deleted: ${roleId}`);
        return true;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete role';
      this.errorSignal.set(message);
      console.error('❌ Error deleting role:', message);
    } finally {
      this.loadingSignal.set(false);
    }

    return false;
  }

  /**
   * Toggle role status (enable/disable)
   */
  async toggleRoleStatus(roleId: string): Promise<boolean> {
    try {
      this.loadingSignal.set(true);
      this.errorSignal.set(null);

      const response: any = await firstValueFrom(
        this.http.patch<any>(
          `${this.apiUrl}/roles/${roleId}/toggle-status`,
          {},
          { responseType: 'json' }
        )
      );

      if (response && response.success) {
        const updated = response.data;
        // Update in signal
        this.rolesSignal.set(
          this.rolesSignal().map(r => r.id === roleId ? { ...r, status: updated.status } : r)
        );
        console.log(`✅ Role status toggled: ${roleId} → ${updated.status}`);
        return true;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to toggle role status';
      this.errorSignal.set(message);
      console.error('❌ Error toggling role status:', message);
    } finally {
      this.loadingSignal.set(false);
    }

    return false;
  }

  /**
   * Assign permission to role
   */
  async assignPermission(roleId: string, menuKey: string, actionKey: string): Promise<boolean> {
    try {
      this.errorSignal.set(null);

      const response: any = await firstValueFrom(
        this.http.post<any>(
          `${this.apiUrl}/roles/${roleId}/permissions`,
          { menuKey, actionKey },
          { responseType: 'json' }
        )
      );

      if (response && response.success) {
        console.log(`✅ Permission assigned: ${menuKey}.${actionKey}`);
        // Reload current role to update permissions
        await this.getRole(roleId);
        return true;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to assign permission';
      this.errorSignal.set(message);
      console.error('❌ Error assigning permission:', message);
    }

    return false;
  }

  /**
   * Revoke permission from role
   */
  async revokePermission(roleId: string, menuKey: string, actionKey: string): Promise<boolean> {
    try {
      this.errorSignal.set(null);

      const response: any = await firstValueFrom(
        this.http.delete<any>(
          `${this.apiUrl}/roles/${roleId}/permissions`,
          { body: { menuKey, actionKey }, responseType: 'json' }
        )
      );

      if (response && response.success) {
        console.log(`✅ Permission revoked: ${menuKey}.${actionKey}`);
        // Reload current role to update permissions
        await this.getRole(roleId);
        return true;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to revoke permission';
      this.errorSignal.set(message);
      console.error('❌ Error revoking permission:', message);
    }

    return false;
  }

  /**
   * Bulk assign permissions
   */
  async bulkAssignPermissions(roleId: string, permissions: Permission[]): Promise<boolean> {
    try {
      this.loadingSignal.set(true);
      this.errorSignal.set(null);

      const response: any = await firstValueFrom(
        this.http.post<any>(
          `${this.apiUrl}/roles/${roleId}/permissions/bulk`,
          { permissions },
          { responseType: 'json' }
        )
      );

      if (response && response.success) {
        console.log(`✅ ${response.count} permissions assigned`);
        // Reload current role
        await this.getRole(roleId);
        return true;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to bulk assign permissions';
      this.errorSignal.set(message);
      console.error('❌ Error bulk assigning permissions:', message);
    } finally {
      this.loadingSignal.set(false);
    }

    return false;
  }

  /**
   * Build permission matrix from role
   */
  buildPermissionMatrix(role: Role | null): PermissionMatrix {
    if (!role || !role.permissions) {
      return {};
    }

    const matrix: PermissionMatrix = {};
    for (const perm of role.permissions) {
      if (!matrix[perm.menuKey]) {
        matrix[perm.menuKey] = {};
      }
      matrix[perm.menuKey][perm.actionKey] = true;
    }

    this.permissionMatrixSignal.set(matrix);
    return matrix;
  }

  /**
   * Check if role has permission
   */
  hasPermission(role: Role | null, menuKey: string, actionKey: string): boolean {
    if (!role || !role.permissions) return false;
    return role.permissions.some(p => p.menuKey === menuKey && p.actionKey === actionKey);
  }

  /**
   * Get role status summary
   */
  getRoleSummary(role: Role): {
    totalPermissions: number;
    systemModules: number;
    moduleCount: number;
    actions: string[];
    viewCount: number;
    createCount: number;
    editCount: number;
    deleteCount: number;
  } {
    if (!role || !role.permissions) {
      return {
        totalPermissions: 0,
        systemModules: 0,
        moduleCount: 0,
        actions: [],
        viewCount: 0,
        createCount: 0,
        editCount: 0,
        deleteCount: 0
      };
    }

    const actions = new Set<string>();
    const modules = new Set<string>();
    let viewCount = 0;
    let createCount = 0;
    let editCount = 0;
    let deleteCount = 0;

    for (const perm of role.permissions) {
      modules.add(perm.menuKey);
      actions.add(perm.actionKey);

      if (perm.actionKey === 'view') viewCount++;
      else if (perm.actionKey === 'create') createCount++;
      else if (perm.actionKey === 'edit') editCount++;
      else if (perm.actionKey === 'delete') deleteCount++;
    }

    return {
      totalPermissions: role.permissions.length,
      systemModules: modules.size,
      moduleCount: modules.size,
      actions: Array.from(actions),
      viewCount,
      createCount,
      editCount,
      deleteCount
    };
  }

  /**
   * Clear state
   */
  clearState(): void {
    this.rolesSignal.set([]);
    this.currentRoleSignal.set(null);
    this.permissionMatrixSignal.set({});
    this.errorSignal.set(null);
    console.log('🧹 RoleService state cleared');
  }
}
