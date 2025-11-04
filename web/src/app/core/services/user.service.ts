import { Injectable, signal, computed } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';

export interface User {
  id: string;
  email: string;
  firstName?: string;
  lastName?: string;
  fullName?: string;
  status: 'active' | 'inactive' | 'suspended' | 'deleted';
  tenantId?: string | null;
  tenant?: {
    id: string;
    name: string;
  };
  roles?: Array<{
    id: string;
    name: string;
    space: string;
  }>;
  employeeProfile?: {
    id?: string;
    employeeCode?: string;
    department?: string;
    position?: string;
    employmentType?: string;
    employmentStatus?: string;
    hireDate?: string;
    status?: string;
    workPhone?: string;
    workEmail?: string;
    phoneExtension?: string;
    emergencyContactName?: string;
    emergencyContactPhone?: string;
    notes?: string;
    [key: string]: any;
  };
  productAccess?: any[];
  addresses?: any[];
  platforms?: string[];
  createdAt?: string;
  updatedAt?: string;
  deletedAt?: string | null;
  lastLoginAt?: string;
  emailVerified?: boolean;
}

export interface UserCreatePayload {
  email: string;
  password: string;
  firstName?: string;
  lastName?: string;
  tenantId?: number | null;
  roleId?: number | null;
  // Employee profile fields
  position?: string;
  department?: string;
  employmentType?: string;
  employmentStatus?: string;
  hireDate?: string;
  workPhone?: string;
  workEmail?: string;
  phoneExtension?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  notes?: string;
}

export interface UserUpdatePayload {
  firstName?: string;
  lastName?: string;
  email?: string;
  status?: 'active' | 'inactive' | 'suspended' | 'deleted';
  roleId?: number | null;
  // Employee profile fields
  position?: string;
  department?: string;
  employmentType?: string;
  employmentStatus?: string;
  hireDate?: string;
  workPhone?: string;
  workEmail?: string;
  phoneExtension?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  notes?: string;
}

export interface PaginatedUsers {
  users: User[];
  pagination: {
    page: number;
    limit: number;
    total: number;
    pages: number;
  };
}

@Injectable({
  providedIn: 'root'
})
export class UserService {
  private apiUrl = '/api/users';

  // Signals
  usersSignal = signal<User[]>([]);
  currentUserSignal = signal<User | null>(null);
  loadingSignal = signal<boolean>(false);
  errorSignal = signal<string | null>(null);
  paginationSignal = signal({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  // Computed signals
  userCountComputed = computed(() => this.paginationSignal().total);
  activeUsersComputed = computed(() =>
    this.usersSignal().filter(u => u.status === 'active')
  );
  inactiveUsersComputed = computed(() =>
    this.usersSignal().filter(u => u.status === 'inactive' || u.status === 'suspended')
  );

  constructor(private http: HttpClient) {
    // console.log('✅ UserService initialized');
  }

  /**
   * Clear all cached user data
   */
  clearCache(): void {
    this.usersSignal.set([]);
    this.currentUserSignal.set(null);
    this.loadingSignal.set(false);
    this.errorSignal.set(null);
    this.paginationSignal.set({
      page: 1,
      limit: 20,
      total: 0,
      pages: 0
    });
    console.log('🗑️ UserService cache cleared');
  }

  /**
   * Load all users with pagination
   */
  async loadUsers(page: number = 1, limit: number = 20, search: string = ''): Promise<void> {
    try {
      this.loadingSignal.set(true);
      this.errorSignal.set(null);

      const params: any = { page, limit };
      if (search) {
        params.search = search;
      }

      const response: any = await firstValueFrom(
        this.http.get<any>(this.apiUrl, { params })
      );

      if (response) {
        this.usersSignal.set(response.data || []);
        if (response.pagination) {
          this.paginationSignal.set(response.pagination);
        }
        console.log(`📋 Loaded ${response.data?.length || 0} users`);
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to load users';
      this.errorSignal.set(message);
      console.error('❌ Error loading users:', message);
    } finally {
      this.loadingSignal.set(false);
    }
  }

  /**
   * Get single user by ID
   */
  async getUser(userId: string): Promise<User | null> {
    try {
      this.loadingSignal.set(true);
      this.errorSignal.set(null);

      const response: any = await firstValueFrom(
        this.http.get<any>(`${this.apiUrl}/${userId}`)
      );

      if (response && response.data) {
        console.log('🔍 User data received:', response.data);
        console.log('🔍 Tenant info:', response.data.tenant);
        this.currentUserSignal.set(response.data);
        console.log(`✅ Loaded user: ${response.data.email}`);
        return response.data;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to get user';
      this.errorSignal.set(message);
      console.error('❌ Error getting user:', message);
    } finally {
      this.loadingSignal.set(false);
    }

    return null;
  }

  /**
   * Create new user
   */
  async createUser(payload: UserCreatePayload): Promise<User | null> {
    try {
      this.loadingSignal.set(true);
      this.errorSignal.set(null);

      const response: any = await firstValueFrom(
        this.http.post<any>(this.apiUrl, payload)
      );

      if (response && response.data) {
        const newUser = response.data;
        this.usersSignal.set([...this.usersSignal(), newUser]);
        console.log(`✅ User created: ${newUser.email}`);
        return newUser;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to create user';
      this.errorSignal.set(message);
      console.error('❌ Error creating user:', message);
    } finally {
      this.loadingSignal.set(false);
    }

    return null;
  }

  /**
   * Update user
   */
  async updateUser(userId: string, payload: UserUpdatePayload): Promise<User | null> {
    try {
      this.loadingSignal.set(true);
      this.errorSignal.set(null);

      const response: any = await firstValueFrom(
        this.http.put<any>(`${this.apiUrl}/${userId}`, payload)
      );

      if (response && response.data) {
        const updated = response.data;
        this.usersSignal.set(
          this.usersSignal().map(u => u.id === userId ? updated : u)
        );
        this.currentUserSignal.set(updated);
        console.log(`✅ User updated: ${updated.email}`);
        return updated;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to update user';
      this.errorSignal.set(message);
      console.error('❌ Error updating user:', message);
    } finally {
      this.loadingSignal.set(false);
    }

    return null;
  }

  /**
   * Delete user
   */
  async deleteUser(userId: string): Promise<boolean> {
    try {
      this.loadingSignal.set(true);
      this.errorSignal.set(null);

      const response: any = await firstValueFrom(
        this.http.delete<any>(`${this.apiUrl}/${userId}`)
      );

      if (response) {
        this.usersSignal.set(
          this.usersSignal().filter(u => u.id !== userId)
        );
        if (this.currentUserSignal()?.id === userId) {
          this.currentUserSignal.set(null);
        }
        console.log(`✅ User deleted: ${userId}`);
        return true;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to delete user';
      this.errorSignal.set(message);
      console.error('❌ Error deleting user:', message);
    } finally {
      this.loadingSignal.set(false);
    }

    return false;
  }

  /**
   * Restore user (from soft delete)
   */
  async restoreUser(userId: string): Promise<User | null> {
    try {
      this.loadingSignal.set(true);
      this.errorSignal.set(null);

      const response: any = await firstValueFrom(
        this.http.put<any>(`${this.apiUrl}/${userId}/restore`, {})
      );

      if (response && response.data) {
        const restoredUser = response.data;
        // Update the user in the list
        this.usersSignal.set(
          this.usersSignal().map(u => u.id === userId ? restoredUser : u)
        );
        console.log(`✅ User restored: ${userId}`);
        return restoredUser;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to restore user';
      this.errorSignal.set(message);
      console.error('❌ Error restoring user:', message);
      throw error;
    } finally {
      this.loadingSignal.set(false);
    }

    return null;
  }

  /**
   * Assign role to user
   */
  async assignRole(userId: string, roleId: string): Promise<boolean> {
    try {
      this.errorSignal.set(null);

      const response: any = await firstValueFrom(
        this.http.post<any>(`${this.apiUrl}/${userId}/roles/${roleId}`, {})
      );

      if (response) {
        console.log(`✅ Role ${roleId} assigned to user ${userId}`);
        // Reload user to get updated roles
        await this.getUser(userId);
        return true;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to assign role';
      this.errorSignal.set(message);
      console.error('❌ Error assigning role:', message);
    }

    return false;
  }

  /**
   * Remove role from user
   */
  async removeRole(userId: string, roleId: string): Promise<boolean> {
    try {
      this.errorSignal.set(null);

      const response: any = await firstValueFrom(
        this.http.delete<any>(`${this.apiUrl}/${userId}/roles/${roleId}`)
      );

      if (response) {
        console.log(`✅ Role ${roleId} removed from user ${userId}`);
        // Reload user to get updated roles
        await this.getUser(userId);
        return true;
      }
    } catch (error) {
      const message = error instanceof Error ? error.message : 'Failed to remove role';
      this.errorSignal.set(message);
      console.error('❌ Error removing role:', message);
    }

    return false;
  }

  /**
   * Check if email already exists
   */
  checkEmail(email: string, tenantId?: string) {
    const params: any = { email };
    if (tenantId) {
      params.tenantId = tenantId;
    }
    return this.http.get<{ exists: boolean; message?: string }>(`${this.apiUrl}/check-email`, { params });
  }
}
