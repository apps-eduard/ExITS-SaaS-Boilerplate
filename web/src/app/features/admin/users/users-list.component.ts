import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService, User } from '../../../core/services/user.service';
import { RoleService } from '../../../core/services/role.service';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="p-4 space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">User Management</h1>
          <p class="text-xs text-gray-500 dark:text-gray-400">Manage system and tenant users</p>
        </div>
        <button 
          routerLink="/admin/users/new"
          class="rounded bg-blue-600 px-3 py-1.5 text-sm font-medium text-white hover:bg-blue-700 shadow-sm transition"
        >
          ➕ Create User
        </button>
      </div>

      <!-- Stats & Filters -->
      <div class="grid grid-cols-1 gap-3">
        <!-- Stats Cards -->
        <div class="grid grid-cols-4 gap-2">
          <div class="rounded border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
            <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Total Users</p>
            <p class="text-lg font-bold text-gray-900 dark:text-white">
              {{ userService.userCountComputed() }}
            </p>
          </div>
          <div class="rounded border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
            <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Active</p>
            <p class="text-lg font-bold text-green-600 dark:text-green-400">
              {{ userService.activeUsersComputed().length }}
            </p>
          </div>
          <div class="rounded border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
            <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Inactive</p>
            <p class="text-lg font-bold text-gray-600 dark:text-gray-400">
              {{ userService.inactiveUsersComputed().length }}
            </p>
          </div>
          <div class="rounded border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
            <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Selected</p>
            <p class="text-lg font-bold text-blue-600 dark:text-blue-400">
              {{ selectedUsers().size }}
            </p>
          </div>
        </div>

        <!-- Filters Row -->
        <div class="grid grid-cols-5 gap-2">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
            <input
              [(ngModel)]="searchQuery"
              (keyup.enter)="search()"
              placeholder="Email, name..."
              class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            />
          </div>
          
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              [(ngModel)]="filterStatus"
              class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="">All</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
            <select
              [(ngModel)]="filterType"
              class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="">All</option>
              <option value="system">System Admin</option>
              <option value="tenant">Tenant User</option>
            </select>
          </div>
          
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
            <select
              [(ngModel)]="filterRole"
              class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="">All Roles</option>
              <option *ngFor="let role of roleService.rolesSignal()" [value]="role.id">
                {{ role.name }}
              </option>
            </select>
          </div>
          
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">&nbsp;</label>
            <button
              (click)="clearFilters()"
              class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition"
            >
              Clear Filters
            </button>
          </div>
        </div>

        <!-- Bulk Actions -->
        <div *ngIf="selectedUsers().size > 0" class="flex items-center gap-2 p-3 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900">
          <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <span class="text-sm font-medium text-blue-900 dark:text-blue-300">
            {{ selectedUsers().size }} user(s) selected
          </span>
          <div class="flex-1"></div>
          <button
            (click)="exportSelected()"
            class="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium text-blue-700 bg-white hover:bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 transition"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            Export CSV
          </button>
          <button
            (click)="bulkDelete()"
            class="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium text-red-700 bg-white hover:bg-red-100 dark:text-red-300 dark:bg-red-900/30 dark:hover:bg-red-900/50 transition"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
            Delete Selected
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="userService.loadingSignal()" class="text-center py-6">
        <p class="text-sm text-gray-500 dark:text-gray-400">Loading users...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="userService.errorSignal()" class="rounded border border-yellow-200 bg-yellow-50 px-4 py-3 dark:border-yellow-900 dark:bg-yellow-900/20">
        <div class="flex items-start gap-3">
          <svg class="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p class="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">Unable to load users</p>
            <p class="text-xs text-yellow-700 dark:text-yellow-400">{{ userService.errorSignal() }}</p>
            <button 
              (click)="userService.loadUsers()"
              class="mt-2 rounded bg-yellow-600 px-3 py-1 text-xs font-medium text-white hover:bg-yellow-700 transition"
            >
              🔄 Retry
            </button>
          </div>
        </div>
      </div>

      <!-- Users Table -->
      <div *ngIf="!userService.loadingSignal() && filteredUsers.length > 0" class="rounded border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider w-12">
                  <input
                    type="checkbox"
                    [checked]="selectAll()"
                    (change)="toggleSelectAll()"
                    class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">User</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Email</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Tenant</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Roles</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Status</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Last Login</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr *ngFor="let user of filteredUsers" class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                <td class="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    [checked]="isUserSelected(user.id)"
                    (change)="toggleUserSelection(user.id)"
                    class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <span class="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {{ getInitials(user) }}
                      </span>
                    </div>
                    <div>
                      <div class="font-medium text-gray-900 dark:text-white">
                        {{ user.fullName || user.firstName || 'N/A' }}
                      </div>
                      <div class="text-xs text-gray-500 dark:text-gray-400">
                        ID: {{ user.id.substring(0, 8) }}...
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-4 py-3">
                  <div class="text-gray-900 dark:text-white">{{ user.email }}</div>
                </td>
                <td class="px-4 py-3 text-center">
                  <span *ngIf="!user.tenantId" class="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                    System Admin
                  </span>
                  <span *ngIf="user.tenantId" class="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    {{ user.tenant?.name || 'Tenant User' }}
                  </span>
                </td>
                <td class="px-4 py-3 text-center">
                  <div class="flex flex-wrap gap-1 justify-center">
                    <span *ngFor="let role of user.roles" 
                          class="inline-flex px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      {{ role.name }}
                    </span>
                    <span *ngIf="!user.roles || user.roles.length === 0" class="text-xs text-gray-400">
                      No roles
                    </span>
                  </div>
                </td>
                <td class="px-4 py-3 text-center">
                  <span [class]="'inline-flex px-2.5 py-1 rounded-full text-xs font-medium ' + getStatusClass(user.status)">
                    {{ user.status | titlecase }}
                  </span>
                </td>
                <td class="px-4 py-3 text-center">
                  <span class="text-xs text-gray-600 dark:text-gray-400">
                    {{ user.lastLogin ? formatDate(user.lastLogin) : 'Never' }}
                  </span>
                </td>
                <td class="px-4 py-3">
                  <div class="flex items-center justify-end gap-2">
                    <button
                      [routerLink]="'/admin/users/' + user.id + '/profile'"
                      class="inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 dark:text-purple-300 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 transition"
                      title="View Profile"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                      </svg>
                      Profile
                    </button>
                    <button
                      [routerLink]="'/admin/users/' + user.id"
                      class="inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 transition"
                      title="Edit User"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      (click)="deleteUser(user)"
                      class="inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 dark:text-red-300 dark:bg-red-900/30 dark:hover:bg-red-900/50 transition"
                      title="Delete User"
                    >
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                      Delete
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="border-t border-gray-200 dark:border-gray-700 px-4 py-3 flex items-center justify-between">
          <div class="text-xs text-gray-600 dark:text-gray-400">
            Showing {{ (userService.paginationSignal().page - 1) * userService.paginationSignal().limit + 1 }} 
            to {{ Math.min(userService.paginationSignal().page * userService.paginationSignal().limit, userService.paginationSignal().total) }} 
            of {{ userService.paginationSignal().total }} users
          </div>
          <div class="flex gap-2">
            <button
              (click)="previousPage()"
              [disabled]="userService.paginationSignal().page === 1"
              class="rounded px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition"
            >
              ← Previous
            </button>
            <button
              (click)="nextPage()"
              [disabled]="userService.paginationSignal().page >= userService.paginationSignal().pages"
              class="rounded px-3 py-1 text-xs font-medium text-gray-700 bg-white border border-gray-300 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition"
            >
              Next →
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!userService.loadingSignal() && filteredUsers.length === 0" class="text-center py-12 rounded border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
        <div class="max-w-sm mx-auto">
          <svg class="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <p class="mb-2 text-sm font-medium text-gray-900 dark:text-white">No users found</p>
          <p class="mb-4 text-xs text-gray-500 dark:text-gray-400">
            {{ searchQuery ? 'Try a different search term' : 'Create your first user to get started' }}
          </p>
          <button 
            *ngIf="!searchQuery"
            routerLink="/admin/users/new"
            class="rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow-sm transition"
          >
            ➕ Create User
          </button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class UsersListComponent implements OnInit {
  searchQuery = '';
  Math = Math;
  
  // Filters
  filterStatus = '';
  filterRole = '';
  filterType = ''; // 'system' or 'tenant'
  
  // Bulk operations
  selectedUsers = signal<Set<string>>(new Set());
  selectAll = signal(false);

  constructor(
    public userService: UserService,
    public roleService: RoleService
  ) {}

  ngOnInit(): void {
    console.log('📋 UsersListComponent initialized');
    this.userService.loadUsers();
    this.roleService.loadRoles(); // Load roles for user creation/editing
  }

  search(): void {
    this.userService.loadUsers(1, 20, this.searchQuery);
  }
  
  get filteredUsers() {
    let users = this.userService.usersSignal();
    
    // Filter by status
    if (this.filterStatus) {
      users = users.filter(u => u.status === this.filterStatus);
    }
    
    // Filter by type (system/tenant)
    if (this.filterType) {
      if (this.filterType === 'system') {
        users = users.filter(u => !u.tenantId);
      } else {
        users = users.filter(u => u.tenantId);
      }
    }
    
    // Filter by role
    if (this.filterRole) {
      users = users.filter(u => u.roles?.some(r => r.id === this.filterRole));
    }
    
    return users;
  }
  
  clearFilters(): void {
    this.searchQuery = '';
    this.filterStatus = '';
    this.filterRole = '';
    this.filterType = '';
    this.userService.loadUsers();
  }
  
  // Bulk selection methods
  toggleUserSelection(userId: string): void {
    const selected = new Set(this.selectedUsers());
    if (selected.has(userId)) {
      selected.delete(userId);
    } else {
      selected.add(userId);
    }
    this.selectedUsers.set(selected);
    this.selectAll.set(selected.size === this.filteredUsers.length);
  }
  
  toggleSelectAll(): void {
    const newValue = !this.selectAll();
    this.selectAll.set(newValue);
    
    if (newValue) {
      const allIds = new Set(this.filteredUsers.map(u => u.id));
      this.selectedUsers.set(allIds);
    } else {
      this.selectedUsers.set(new Set());
    }
  }
  
  isUserSelected(userId: string): boolean {
    return this.selectedUsers().has(userId);
  }
  
  async bulkDelete(): Promise<void> {
    const count = this.selectedUsers().size;
    if (count === 0) return;
    
    const confirmed = confirm(
      `⚠️ Delete ${count} User${count > 1 ? 's' : ''}?\n\n` +
      `This will permanently remove ${count} user account${count > 1 ? 's' : ''}.\n` +
      `Are you sure you want to proceed?`
    );
    
    if (confirmed) {
      for (const userId of this.selectedUsers()) {
        await this.userService.deleteUser(userId);
      }
      this.selectedUsers.set(new Set());
      this.selectAll.set(false);
      this.userService.loadUsers();
    }
  }
  
  exportSelected(): void {
    const users = this.filteredUsers.filter(u => this.selectedUsers().has(u.id));
    
    if (users.length === 0) {
      alert('No users selected for export');
      return;
    }
    
    // Convert to CSV
    const headers = ['ID', 'Email', 'First Name', 'Last Name', 'Status', 'Type', 'Roles', 'Created At'];
    const rows = users.map(u => [
      u.id,
      u.email,
      u.firstName || '',
      u.lastName || '',
      u.status,
      u.tenantId ? 'Tenant' : 'System',
      u.roles?.map(r => r.name).join(';') || '',
      u.createdAt || ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);
    
    console.log(`✅ Exported ${users.length} users`);
  }

  nextPage(): void {
    const nextPage = this.userService.paginationSignal().page + 1;
    if (nextPage <= this.userService.paginationSignal().pages) {
      this.userService.loadUsers(nextPage, 20, this.searchQuery);
    }
  }

  previousPage(): void {
    const prevPage = this.userService.paginationSignal().page - 1;
    if (prevPage >= 1) {
      this.userService.loadUsers(prevPage, 20, this.searchQuery);
    }
  }

  getInitials(user: User): string {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.fullName) {
      const parts = user.fullName.split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return parts[0][0].toUpperCase();
    }
    return user.email[0].toUpperCase();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'inactive':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
      case 'suspended':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  }

  formatDate(date: string): string {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return d.toLocaleDateString();
  }

  async deleteUser(user: User): Promise<void> {
    const confirmed = confirm(
      `⚠️ Delete User: ${user.email}\n\n` +
      `This will permanently remove the user account.\n` +
      `Are you sure you want to proceed?`
    );
    
    if (confirmed) {
      const success = await this.userService.deleteUser(user.id);
      if (success) {
        console.log(`✅ User deleted: ${user.email}`);
        // Reload the current page
        this.userService.loadUsers(
          this.userService.paginationSignal().page,
          20,
          this.searchQuery
        );
      }
    }
  }
}
