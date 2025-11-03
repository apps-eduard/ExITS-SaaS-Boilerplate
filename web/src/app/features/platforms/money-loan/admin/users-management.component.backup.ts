import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService, User } from '../../../../core/services/user.service';
import { RoleService } from '../../../../core/services/role.service';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-users-management',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="p-4 space-y-3">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-base font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span class="text-lg">🧑‍💻</span>
            User Management
          </h1>
          <p class="text-xs text-gray-500 dark:text-gray-400">Manage Money Loan platform users and permissions</p>
        </div>
        <button
          *ngIf="canCreateUsers()"
          (click)="createUser()"
          class="inline-flex items-center gap-1.5 rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 shadow-sm transition"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Create User
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-4 gap-2">
        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400">Total Users</p>
              <p class="text-xl font-bold text-gray-900 dark:text-white mt-0.5">
                {{ userService.userCountComputed() }}
              </p>
            </div>
            <div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <span class="text-lg">👥</span>
            </div>
          </div>
        </div>
        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400">Active</p>
              <p class="text-xl font-bold text-green-600 dark:text-green-400 mt-0.5">
                {{ userService.activeUsersComputed().length }}
              </p>
            </div>
            <div class="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <span class="text-lg">✅</span>
            </div>
          </div>
        </div>
        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400">Inactive</p>
              <p class="text-xl font-bold text-gray-600 dark:text-gray-400 mt-0.5">
                {{ userService.inactiveUsersComputed().length }}
              </p>
            </div>
            <div class="w-8 h-8 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <span class="text-lg">⏸️</span>
            </div>
          </div>
        </div>
        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400">Selected</p>
              <p class="text-xl font-bold text-blue-600 dark:text-blue-400 mt-0.5">
                {{ selectedUsers().size }}
              </p>
            </div>
            <div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <span class="text-lg">☑️</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-2">
          <div class="md:col-span-2">
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (keyup.enter)="search()"
              placeholder="Search by email or name..."
              class="w-full px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              [(ngModel)]="filterStatus"
              (change)="applyFilters()"
              class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Role</label>
            <select
              [(ngModel)]="filterRole"
              (change)="applyFilters()"
              class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Roles</option>
              <option *ngFor="let role of uniqueRoles()" [value]="role.id">{{ role.name }}</option>
            </select>
          </div>
        </div>
        <div class="flex items-center justify-between mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
          <div class="flex items-center gap-2">
            <button
              (click)="clearFilters()"
              class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition"
            >
              <span class="text-sm">🔄</span>
              Clear
            </button>
          </div>
          <div class="text-xs text-gray-600 dark:text-gray-400">
            {{ filteredUsers().length }} users found
          </div>
        </div>
      </div>

      <!-- Bulk Actions -->
      <div *ngIf="selectedUsers().size > 0"
           class="flex items-center gap-2 p-2.5 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900">
        <span class="text-xs font-medium text-blue-900 dark:text-blue-300">
          {{ selectedUsers().size }} selected
        </span>
        <div class="flex-1"></div>
        <button
          (click)="bulkAction('activate')"
          class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-400 bg-white dark:bg-green-900/30 rounded shadow-sm hover:bg-green-50 dark:hover:bg-green-900/50 transition"
        >
          <span>▶️</span>
          Activate
        </button>
        <button
          (click)="bulkAction('suspend')"
          class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-orange-700 dark:text-orange-400 bg-white dark:bg-orange-900/30 rounded shadow-sm hover:bg-orange-50 dark:hover:bg-orange-900/50 transition"
        >
          <span>⏸️</span>
          Suspend
        </button>
      </div>

      <!-- Users Table -->
      <div *ngIf="!userService.loadingSignal() && filteredUsers().length > 0"
           class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-xs">
            <thead class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th class="px-2 py-2 text-center w-8">
                  <input
                    type="checkbox"
                    [checked]="selectAll()"
                    (change)="toggleSelectAll()"
                    class="w-3.5 h-3.5 text-blue-600 rounded focus:ring-blue-500"
                  />
                </th>
                <th class="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  User
                </th>
                <th class="px-2 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Email
                </th>
                <th class="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Roles
                </th>
                <th class="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Status
                </th>
                <th class="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Last Login
                </th>
                <th class="px-2 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr *ngFor="let user of filteredUsers()" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                <td class="px-2 py-2 text-center">
                  <input
                    type="checkbox"
                    [checked]="isUserSelected(user.id)"
                    (change)="toggleUserSelection(user.id)"
                    class="w-3.5 h-3.5 text-blue-600 rounded focus:ring-blue-500"
                  />
                </td>
                <td class="px-2 py-2">
                  <div class="flex items-center gap-2">
                    <div class="w-7 h-7 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                      <span class="text-xs font-medium text-blue-600 dark:text-blue-400">
                        {{ getInitials(user) }}
                      </span>
                    </div>
                    <div class="min-w-0">
                      <div class="font-medium text-gray-900 dark:text-white truncate">
                        {{ user.fullName || user.firstName || 'N/A' }}
                      </div>
                      <div class="text-xs text-gray-500 dark:text-gray-400">ID: {{ user.id }}</div>
                    </div>
                  </div>
                </td>
                <td class="px-2 py-2">
                  <div class="text-gray-900 dark:text-white truncate">{{ user.email }}</div>
                </td>
                <td class="px-2 py-2 text-center">
                  <div class="flex flex-wrap gap-1 justify-center">
                    <span *ngFor="let role of user.roles"
                          class="inline-flex px-1.5 py-0.5 rounded text-xs bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                      {{ role.name }}
                    </span>
                    <span *ngIf="!user.roles || user.roles.length === 0" class="text-xs text-gray-400">
                      No roles
                    </span>
                  </div>
                </td>
                <td class="px-2 py-2 text-center">
                  <span [class]="'inline-flex px-2 py-0.5 rounded-full text-xs font-medium ' + getStatusClass(user.status)">
                    {{ user.status | titlecase }}
                  </span>
                </td>
                <td class="px-2 py-2 text-center text-xs text-gray-600 dark:text-gray-400">
                  {{ user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never' }}
                </td>
                <td class="px-2 py-2">
                  <div class="flex items-center justify-center gap-1">
                    <button
                      (click)="viewUser(user)"
                      class="inline-flex items-center px-1.5 py-1 text-xs font-medium text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded hover:bg-purple-100 dark:hover:bg-purple-900/30 transition"
                      title="View"
                    >
                      <span class="text-sm">👁️</span>
                    </button>
                    <button
                      *ngIf="canUpdateUsers()"
                      (click)="editUser(user)"
                      class="inline-flex items-center px-1.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
                      title="Edit"
                    >
                      <span class="text-sm">✏️</span>
                    </button>
                    <button
                      *ngIf="canUpdateUsers() && user.status !== 'deleted'"
                      (click)="toggleUserStatus(user)"
                      [class]="user.status === 'active'
                        ? 'inline-flex items-center px-1.5 py-1 text-xs font-medium text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 rounded hover:bg-orange-100 dark:hover:bg-orange-900/30 transition'
                        : 'inline-flex items-center px-1.5 py-1 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded hover:bg-green-100 dark:hover:bg-green-900/30 transition'"
                      [title]="user.status === 'active' ? 'Suspend' : 'Activate'"
                    >
                      <span class="text-sm">{{ user.status === 'active' ? '⏸️' : '▶️' }}</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="flex items-center justify-between px-3 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div class="flex items-center gap-2">
            <label class="text-xs text-gray-600 dark:text-gray-400">Show:</label>
            <select
              [(ngModel)]="pageSize"
              (ngModelChange)="onPageSizeChange()"
              class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option [value]="10">10</option>
              <option [value]="25">25</option>
              <option [value]="50">50</option>
            </select>
            <span class="text-xs text-gray-600 dark:text-gray-400">
              {{ getPageInfo() }}
            </span>
          </div>

          <div class="flex items-center gap-2">
            <button
              (click)="previousPage()"
              [disabled]="currentPage() === 1"
              class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <span>←</span>
              Prev
            </button>
            <span class="text-xs text-gray-600 dark:text-gray-400">
              Page {{ currentPage() }} of {{ totalPages() }}
            </span>
            <button
              (click)="nextPage()"
              [disabled]="currentPage() >= totalPages()"
              class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next
              <span>→</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="userService.loadingSignal()" class="text-center py-8">
        <p class="text-sm text-gray-500 dark:text-gray-400">Loading users...</p>
      </div>

      <!-- Empty State -->
      <div *ngIf="!userService.loadingSignal() && filteredUsers().length === 0"
           class="text-center py-8 rounded-lg border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
        <div class="text-4xl mb-2">🔍</div>
        <p class="text-sm font-medium text-gray-900 dark:text-white mb-1">No users found</p>
        <p class="text-xs text-gray-500 dark:text-gray-400">
          {{ searchQuery ? 'Try a different search term' : 'Create your first user to get started' }}
        </p>
      </div>
    </div>
  `,
  styles: []
})
export class UsersManagementComponent implements OnInit {
  searchQuery = '';
  filterStatus = '';
  filterRole = '';
  pageSize = 10;

  selectedUsers = signal<Set<string>>(new Set());
  selectAll = signal(false);
  currentPage = signal(1);

  uniqueRoles = computed(() => {
    const roles = this.roleService.rolesSignal();
    const seenIds = new Set();
    return roles.filter(role => {
      if (seenIds.has(role.id)) return false;
      seenIds.add(role.id);
      return true;
    });
  });

  filteredUsers = computed(() => {
    let users = this.userService.usersSignal();
    
    // Filter by status
    if (this.filterStatus) {
      users = users.filter(u => u.status === this.filterStatus);
    }
    
    // Filter by role
    if (this.filterRole) {
      users = users.filter(u => u.roles?.some(r => String(r.id) === String(this.filterRole)));
    }
    
    return users;
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredUsers().length / this.pageSize) || 1;
  });

  canCreateUsers = computed(() => this.authService.hasPermission('users:create'));
  canUpdateUsers = computed(() => this.authService.hasPermission('users:update'));

  constructor(
    public userService: UserService,
    public roleService: RoleService,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    this.userService.loadUsers(1, this.pageSize);
    this.roleService.loadRoles();
  }

  search(): void {
    this.userService.loadUsers(1, this.pageSize, this.searchQuery);
  }

  applyFilters(): void {
    console.log('Filters applied:', { status: this.filterStatus, role: this.filterRole });
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.filterStatus = '';
    this.filterRole = '';
    this.userService.loadUsers();
  }

  toggleSelectAll(): void {
    const newValue = !this.selectAll();
    this.selectAll.set(newValue);
    if (newValue) {
      const allIds = new Set(this.filteredUsers().map(u => u.id));
      this.selectedUsers.set(allIds);
    } else {
      this.selectedUsers.set(new Set());
    }
  }

  toggleUserSelection(userId: string): void {
    const selected = new Set(this.selectedUsers());
    if (selected.has(userId)) {
      selected.delete(userId);
    } else {
      selected.add(userId);
    }
    this.selectedUsers.set(selected);
    this.selectAll.set(selected.size === this.filteredUsers().length);
  }

  isUserSelected(userId: string): boolean {
    return this.selectedUsers().has(userId);
  }

  bulkAction(action: string): void {
    const count = this.selectedUsers().size;
    if (count === 0) return;
    
    const confirmed = confirm(`${action === 'activate' ? 'Activate' : 'Suspend'} ${count} user(s)?`);
    if (confirmed) {
      console.log(`Bulk ${action}:`, Array.from(this.selectedUsers()));
      // Implement bulk action logic here
      this.selectedUsers.set(new Set());
      this.selectAll.set(false);
    }
  }

  createUser(): void {
    console.log('Create user clicked');
    // Navigate to user creation page or open modal
  }

  viewUser(user: User): void {
    console.log('View user:', user);
  }

  editUser(user: User): void {
    console.log('Edit user:', user);
  }

  async toggleUserStatus(user: User): Promise<void> {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    const confirmed = confirm(`${newStatus === 'active' ? 'Activate' : 'Suspend'} ${user.email}?`);
    
    if (confirmed) {
      try {
        await this.userService.updateUser(user.id, { status: newStatus });
        await this.userService.loadUsers();
      } catch (error) {
        console.error('Error updating user status:', error);
      }
    }
  }

  getInitials(user: User): string {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
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
    const diffMs = Date.now() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return d.toLocaleDateString();
  }

  getPageInfo(): string {
    const start = (this.currentPage() - 1) * this.pageSize + 1;
    const end = Math.min(this.currentPage() * this.pageSize, this.filteredUsers().length);
    return `Showing ${start}-${end} of ${this.filteredUsers().length}`;
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  onPageSizeChange(): void {
    this.currentPage.set(1);
    this.userService.loadUsers(1, this.pageSize, this.searchQuery);
  }
}
