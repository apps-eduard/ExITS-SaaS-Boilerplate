import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService, User } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';
import { UsersSidebarComponent } from '../../../shared/components/users-sidebar/users-sidebar.component';

@Component({
  selector: 'app-users-admins',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, UsersSidebarComponent],
  template: `
    <div class="flex">
      <!-- Sidebar -->
      <app-users-sidebar></app-users-sidebar>

      <!-- Main Content -->
      <div class="flex-1 p-4 space-y-4">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Admin Users</h1>
            <p class="text-xs text-gray-500 dark:text-gray-400">System administrators and privileged users</p>
          </div>
          <button
            *ngIf="canCreateUsers()"
            routerLink="/admin/users/new"
            class="inline-flex items-center gap-1.5 rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 shadow-sm transition"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Create Admin User
          </button>
        </div>

        <!-- Stats -->
        <div class="grid grid-cols-3 gap-3">
          <div class="rounded border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
            <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Total Admins</p>
            <p class="text-lg font-bold text-gray-900 dark:text-white">
              {{ adminUsers().length }}
            </p>
          </div>
          <div class="rounded border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
            <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Active</p>
            <p class="text-lg font-bold text-green-600 dark:text-green-400">
              {{ activeAdminsCount() }}
            </p>
          </div>
          <div class="rounded border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
            <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Suspended</p>
            <p class="text-lg font-bold text-red-600 dark:text-red-400">
              {{ suspendedAdminsCount() }}
            </p>
          </div>
        </div>

        <!-- Search -->
        <div class="flex gap-2">
          <input
            [(ngModel)]="searchQuery"
            (keyup.enter)="search()"
            placeholder="Search admin users..."
            class="flex-1 rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
          />
          <button
            (click)="search()"
            class="inline-flex items-center gap-1.5 rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            Search
          </button>
          <button
            (click)="clearSearch()"
            class="inline-flex items-center gap-1.5 rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear
          </button>
        </div>

        <!-- Admin Users Table -->
        <div *ngIf="filteredAdminUsers().length > 0" class="rounded border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">User</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Email</th>
                  <th class="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th class="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Created</th>
                  <th class="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr *ngFor="let user of filteredAdminUsers()" class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      <div class="w-8 h-8 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                        <span class="text-sm font-medium text-purple-600 dark:text-purple-400">
                          {{ getInitials(user) }}
                        </span>
                      </div>
                      <div class="font-medium text-gray-900 dark:text-white">
                        {{ user.firstName }} {{ user.lastName }}
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-gray-900 dark:text-white">{{ user.email }}</td>
                  <td class="px-4 py-3 text-center">
                    <span [class]="'inline-flex px-2.5 py-1 rounded-full text-xs font-medium ' + getStatusClass(user.status)">
                      {{ user.status | titlecase }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-center text-gray-600 dark:text-gray-400 text-xs">
                    {{ formatDate(user.createdAt) }}
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center justify-end gap-2">
                      <button
                        [routerLink]="'/admin/users/' + user.id + '/profile'"
                        class="inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium text-purple-700 bg-purple-50 hover:bg-purple-100 dark:text-purple-300 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 transition"
                      >
                        👁️ View
                      </button>
                      <button
                        *ngIf="canUpdateUsers()"
                        [routerLink]="'/admin/users/' + user.id"
                        class="inline-flex items-center gap-1.5 rounded px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 transition"
                      >
                        ✏️ Edit
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Empty State -->
        <div *ngIf="filteredAdminUsers().length === 0" class="text-center py-12 rounded border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
          <svg class="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <p class="mb-2 text-sm font-medium text-gray-900 dark:text-white">No admin users found</p>
          <p class="mb-4 text-xs text-gray-500 dark:text-gray-400">{{ searchQuery ? 'Try a different search' : 'No system administrators yet' }}</p>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class UsersAdminsComponent implements OnInit {
  userService = inject(UserService);
  private authService = inject(AuthService);
  searchQuery = '';

  adminUsers = signal<User[]>([]);
  filteredAdminUsers = signal<User[]>([]);
  activeAdminsCount = computed(() => this.adminUsers().filter(u => u.status === 'active').length);
  suspendedAdminsCount = computed(() => this.adminUsers().filter(u => u.status === 'suspended').length);

  // Permission checks
  canCreateUsers = computed(() => this.authService.hasPermission('users:create'));
  canUpdateUsers = computed(() => this.authService.hasPermission('users:update'));
  canDeleteUsers = computed(() => this.authService.hasPermission('users:delete'));

  constructor() {}

  ngOnInit(): void {
    this.userService.loadUsers();
    // Filter to show only system admin users (tenant_id is null)
    this.updateAdminUsers();
  }

  updateAdminUsers(): void {
    const allUsers = this.userService.usersSignal();
    const admins = allUsers.filter(u => !u.tenantId);
    this.adminUsers.set(admins);
    this.filteredAdminUsers.set(admins);
  }

  search(): void {
    const query = this.searchQuery.toLowerCase();
    const filtered = this.adminUsers().filter(u =>
      u.email.toLowerCase().includes(query) ||
      u.firstName?.toLowerCase().includes(query) ||
      u.lastName?.toLowerCase().includes(query)
    );
    this.filteredAdminUsers.set(filtered);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.filteredAdminUsers.set(this.adminUsers());
  }

  getInitials(user: User): string {
    if (user.firstName && user.lastName) {
      return (user.firstName[0] + user.lastName[0]).toUpperCase();
    }
    return user.email.substring(0, 2).toUpperCase();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'suspended':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300';
    }
  }

  formatDate(date: any): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }
}
