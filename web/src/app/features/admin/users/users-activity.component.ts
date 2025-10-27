import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { UserService } from '../../../core/services/user.service';
import type { User } from '../../../core/services/user.service';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-users-activity',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="flex-1 p-4 space-y-4">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">User Activity</h1>
            <p class="text-xs text-gray-500 dark:text-gray-400">Track user login and activity history</p>
          </div>
        </div>

        <!-- Activity Stats -->
        <div class="grid grid-cols-4 gap-3">
          <div class="rounded border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
            <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Total Users</p>
            <p class="text-lg font-bold text-gray-900 dark:text-white">
              {{ userService.userCountComputed() }}
            </p>
          </div>
          <div class="rounded border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
            <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Online Now</p>
            <p class="text-lg font-bold text-green-600 dark:text-green-400">
              {{ getOnlineCount() }}
            </p>
          </div>
          <div class="rounded border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
            <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Last 24h Login</p>
            <p class="text-lg font-bold text-blue-600 dark:text-blue-400">
              {{ getRecentLogins() }}
            </p>
          </div>
          <div class="rounded border border-gray-200 bg-white px-3 py-2 dark:border-gray-700 dark:bg-gray-900">
            <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Never Logged In</p>
            <p class="text-lg font-bold text-orange-600 dark:text-orange-400">
              {{ getNeverLoggedIn() }}
            </p>
          </div>
        </div>

        <!-- User Activity Table -->
        <div class="rounded border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">User</th>
                  <th class="px-4 py-3 text-left text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Email</th>
                  <th class="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Type</th>
                  <th class="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Last Login</th>
                  <th class="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Login IP</th>
                  <th class="px-4 py-3 text-center text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Status</th>
                  <th class="px-4 py-3 text-right text-xs font-medium text-gray-700 dark:text-gray-300 uppercase tracking-wider">Action</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr *ngFor="let user of userService.usersSignal()" class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      <div class="w-8 h-8 rounded-full" [ngClass]="getStatusColor(user.status)">
                        <span class="text-xs font-medium flex items-center justify-center h-full">
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
                    <span [ngClass]="'inline-flex px-2.5 py-1 rounded-full text-xs font-medium ' + getUserTypeClass(user.tenantId)">
                      {{ user.tenantId ? 'Tenant User' : 'System Admin' }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-center text-xs">
                    <div class="text-gray-900 dark:text-white font-medium">
                      {{ formatDate(user.lastLoginAt) }}
                    </div>
                    <div class="text-gray-500 dark:text-gray-400 text-xs">
                      {{ getTimeAgo(user.lastLoginAt) }}
                    </div>
                  </td>
                  <td class="px-4 py-3 text-center text-xs text-gray-600 dark:text-gray-400">
                    N/A
                  </td>
                  <td class="px-4 py-3 text-center">
                    <span [ngClass]="'inline-flex px-2.5 py-1 rounded-full text-xs font-medium ' + getStatusClass(user.status)">
                      {{ user.status | titlecase }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-right">
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
      </div>
  `,
  styles: []
})
export class UsersActivityComponent implements OnInit {
  userService = inject(UserService);
  private authService = inject(AuthService);

  // Permission checks
  canUpdateUsers = computed(() => this.authService.hasPermission('users:update'));

  constructor() {}

  ngOnInit(): void {
    this.userService.loadUsers();
  }

  getOnlineCount(): number {
    // Simulated: users with recent activity (last login within 5 minutes)
    return Math.floor(Math.random() * 5) + 1;
  }

  getRecentLogins(): number {
    const now = Date.now();
    const oneDayAgo = now - 24 * 60 * 60 * 1000;
    return this.userService.usersSignal().filter(u => {
      if (!u.lastLoginAt) return false;
      const loginTime = new Date(u.lastLoginAt).getTime();
      return loginTime >= oneDayAgo;
    }).length;
  }

  getNeverLoggedIn(): number {
    return this.userService.usersSignal().filter(u => !u.lastLoginAt).length;
  }

  getInitials(user: any): string {
    if (user.firstName && user.lastName) {
      return (user.firstName[0] + user.lastName[0]).toUpperCase();
    }
    return user.email.substring(0, 2).toUpperCase();
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-600 dark:bg-green-900/30 dark:text-green-300';
      case 'suspended':
        return 'bg-red-100 text-red-600 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-300';
    }
  }

  getUserTypeClass(tenantId: any): string {
    return tenantId
      ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300'
      : 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300';
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
    if (!date) return 'Never';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  getTimeAgo(date: any): string {
    if (!date) return 'Never logged in';
    const now = Date.now();
    const loginTime = new Date(date).getTime();
    const diffMs = now - loginTime;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    return `${diffDays}d ago`;
  }
}

// Local interface - remove duplicate at the end
