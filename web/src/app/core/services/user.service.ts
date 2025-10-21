import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { tap, map } from 'rxjs/operators';

export interface User {
  id: string;
  email: string;
  first_name: string;
  last_name: string;
  status: 'active' | 'inactive' | 'suspended';
  email_verified: boolean;
  mfa_enabled?: boolean;
  last_login_at?: string;
  created_at: string;
  updated_at?: string;
  roles?: Array<{ id: string; name: string; space: string }>;
  permissions?: Record<string, string[]>;
}

export interface CreateUserDto {
  email: string;
  first_name: string;
  last_name: string;
  password: string;
  role_id?: string;
}

export interface UpdateUserDto {
  first_name?: string;
  last_name?: string;
  role_id?: string;
  status?: string;
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
export class UserService {
  private apiUrl = 'http://localhost:3000/api/users';
  private usersSubject = new BehaviorSubject<User[]>([]);
  public users$ = this.usersSubject.asObservable();

  constructor(private http: HttpClient) {
    this.loadUsers();
  }

  // Read operations
  loadUsers(page: number = 1, limit: number = 20): void {
    this.getUsers(page, limit).subscribe(users => {
      this.usersSubject.next(users);
    });
  }

  getUsers(page: number = 1, limit: number = 20): Observable<User[]> {
    return this.http.get<ApiResponse<User[]>>(`${this.apiUrl}?page=${page}&limit=${limit}`).pipe(
      map(response => response.data)
    );
  }

  getUserById(id: string): Observable<User> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data)
    );
  }

  // Create operation
  createUser(data: CreateUserDto): Observable<User> {
    return this.http.post<ApiResponse<User>>(this.apiUrl, data).pipe(
      map(response => response.data),
      tap(user => {
        const currentUsers = this.usersSubject.value;
        this.usersSubject.next([...currentUsers, user]);
      })
    );
  }

  // Update operation
  updateUser(id: string, data: UpdateUserDto): Observable<User> {
    return this.http.put<ApiResponse<User>>(`${this.apiUrl}/${id}`, data).pipe(
      map(response => response.data),
      tap(updatedUser => {
        const currentUsers = this.usersSubject.value;
        const index = currentUsers.findIndex(u => u.id === id);
        if (index !== -1) {
          currentUsers[index] = updatedUser;
          this.usersSubject.next([...currentUsers]);
        }
      })
    );
  }

  // Delete operation
  deleteUser(id: string): Observable<User> {
    return this.http.delete<ApiResponse<User>>(`${this.apiUrl}/${id}`).pipe(
      map(response => response.data),
      tap(() => {
        const currentUsers = this.usersSubject.value.filter(u => u.id !== id);
        this.usersSubject.next(currentUsers);
      })
    );
  }

  // Role assignment
  assignRole(userId: string, roleId: string): Observable<User> {
    return this.http.post<ApiResponse<User>>(`${this.apiUrl}/${userId}/roles/${roleId}`, {}).pipe(
      map(response => response.data)
    );
  }

  // Role removal
  removeRole(userId: string, roleId: string): Observable<User> {
    return this.http.delete<ApiResponse<User>>(`${this.apiUrl}/${userId}/roles/${roleId}`).pipe(
      map(response => response.data)
    );
  }

  // Get user permissions
  getUserPermissions(userId: string): Observable<Record<string, string[]>> {
    return this.http.get<ApiResponse<Record<string, string[]>>>(`${this.apiUrl}/${userId}/permissions`).pipe(
      map(response => response.data)
    );
  }

  // Get current user
  getCurrentUser(): Observable<User> {
    return this.http.get<ApiResponse<User>>(`${this.apiUrl}/me`).pipe(
      map(response => response.data)
    );
  }

  // Search
  searchUsers(query: string): Observable<User[]> {
    return this.http.get<ApiResponse<User[]>>(`${this.apiUrl}?search=${query}`).pipe(
      map(response => response.data)
    );
  }
}

