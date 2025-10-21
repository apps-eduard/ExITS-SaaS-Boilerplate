import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';

export interface Permission {
  id: string;
  menu_key: string;
  display_name: string;
  action_key: string;
  constraints?: Record<string, any>;
  status: 'active' | 'inactive';
}

export interface Role {
  id: string;
  name: string;
  description?: string;
  space: 'system' | 'tenant';
  parent_role_id?: string;
  created_at: string;
  updated_at?: string;
  permissions?: Permission[];
}

export interface CreateRoleDto {
  name: string;
  description?: string;
  space?: 'system' | 'tenant';
  parent_role_id?: string;
}

export interface UpdateRoleDto {
  name?: string;
  description?: string;
  space?: 'system' | 'tenant';
  parent_role_id?: string;
}

export interface PaginationMeta {
  page: number;
  limit: number;
  total: number;
  totalPages: number;
}

export interface ApiResponse<T> {
  message: string;
  data: T;
  pagination?: PaginationMeta;
}

@Injectable({
  providedIn: 'root'
})
export class RoleService {
  private apiUrl = 'http://localhost:3000/api/roles';
  private rolesSubject = new BehaviorSubject<Role[]>([]);
  public roles$ = this.rolesSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadRoles();
  }

  // Read operations
  loadRoles(page: number = 1, limit: number = 20): void {
    this.getRoles(page, limit).subscribe(roles => {
      this.rolesSubject.next(roles);
    });
  }

  getRoles(page: number = 1, limit: number = 20, space?: string): Observable<Role[]> {
    let url = `${this.apiUrl}?page=${page}&limit=${limit}`;
    if (space) {
      url += `&space=${space}`;
    }
    return this.http.get<ApiResponse<Role[]>>(url).pipe(
      map(response => response.data)
    );
  }

  getRoleById(id: string): Observable<Role> {
    return this.http.get<ApiResponse<Role>>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }

  // Create operation
  createRole(data: CreateRoleDto): Observable<Role> {
    return this.http.post<ApiResponse<Role>>(this.apiUrl, data).pipe(
      map(response => response.data),
      tap(role => {
        const currentRoles = this.rolesSubject.value;
        this.rolesSubject.next([...currentRoles, role]);
      })
    );
  }

  // Update operation
  updateRole(id: string, data: UpdateRoleDto): Observable<Role> {
    return this.http.put<ApiResponse<Role>>(`${this.apiUrl}/${id}`, data).pipe(
      map(response => response.data),
      tap(updatedRole => {
        const currentRoles = this.rolesSubject.value;
        const index = currentRoles.findIndex(r => r.id === id);
        if (index !== -1) {
          currentRoles[index] = updatedRole;
          this.rolesSubject.next([...currentRoles]);
        }
      })
    );
  }

  // Delete operation
  deleteRole(id: string): Observable<Role> {
    return this.http.delete<ApiResponse<Role>>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data),
      tap(() => {
        const currentRoles = this.rolesSubject.value.filter(r => r.id !== id);
        this.rolesSubject.next(currentRoles);
      })
    );
  }

  // Permission management
  assignPermission(roleId: string, permissionId: string): Observable<Role> {
    return this.http.post<ApiResponse<Role>>(`${this.apiUrl}/${roleId}/permissions/${permissionId}`, {}).pipe(
      map(response => response.data)
    );
  }

  removePermission(roleId: string, permissionId: string): Observable<Role> {
    return this.http.delete<ApiResponse<Role>>(`${this.apiUrl}/${roleId}/permissions/${permissionId}`).pipe(
      map(response => response.data)
    );
  }

  // Get role permissions
  getRolePermissions(roleId: string): Observable<Permission[]> {
    return this.http.get<ApiResponse<Permission[]>>(`${this.apiUrl}/${roleId}/permissions`).pipe(
      map(response => response.data)
    );
  }
}
