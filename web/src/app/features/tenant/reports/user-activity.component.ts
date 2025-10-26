import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface UserMetric {
  name: string;
  icon: string;
  value: number;
  change: number;
  trend: 'up' | 'down';
}

@Component({
  selector: 'app-user-activity',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            <span>User Activity Report</span>
          </h1>
          <p class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
            Track user engagement and activity patterns
          </p>
        </div>
        <div class="flex gap-2">
          <button
            (click)="exportReport()"
            class="inline-flex items-center gap-1.5 rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition shadow-sm"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            <span>Export</span>
          </button>
          <button
            (click)="refreshData()"
            class="inline-flex items-center gap-1.5 rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition shadow-sm"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="rounded border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900 shadow-sm">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Date Range</label>
            <select
              [(ngModel)]="dateRange"
              (change)="applyFilters()"
              class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="today">Today</option>
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">User Role</label>
            <select
              [(ngModel)]="selectedRole"
              (change)="applyFilters()"
              class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Roles</option>
              <option value="admin">Admin</option>
              <option value="manager">Manager</option>
              <option value="user">User</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Activity Type</label>
            <select
              [(ngModel)]="activityType"
              (change)="applyFilters()"
              class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Activities</option>
              <option value="login">Logins</option>
              <option value="transactions">Transactions</option>
              <option value="modifications">Modifications</option>
            </select>
          </div>
          <div class="flex items-end">
            <button
              (click)="resetFilters()"
              class="w-full inline-flex items-center justify-center gap-1.5 rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition shadow-sm"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              <span>Reset</span>
            </button>
          </div>
        </div>
      </div>

      <!-- User Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div *ngFor="let metric of userMetrics()"
             class="rounded border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-xl">{{ metric.icon }}</span>
                <p class="text-xs font-medium text-gray-600 dark:text-gray-400">{{ metric.name }}</p>
              </div>
              <p class="text-xl font-bold text-gray-900 dark:text-white">{{ formatNumber(metric.value) }}</p>
              <div class="flex items-center gap-1 mt-1.5">
                <svg *ngIf="metric.trend === 'up'" class="w-3 h-3 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clip-rule="evenodd" />
                </svg>
                <svg *ngIf="metric.trend === 'down'" class="w-3 h-3 text-red-600" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M12 13a1 1 0 100 2h5a1 1 0 001-1V9a1 1 0 10-2 0v2.586l-4.293-4.293a1 1 0 00-1.414 0L8 9.586 3.707 5.293a1 1 0 00-1.414 1.414l5 5a1 1 0 001.414 0L11 9.414 14.586 13H12z" clip-rule="evenodd" />
                </svg>
                <span class="text-xs font-medium" [class.text-green-600]="metric.trend === 'up'" [class.text-red-600]="metric.trend === 'down'">
                  {{ metric.change > 0 ? '+' : '' }}{{ metric.change }}%
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Activity Charts -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <!-- Activity Trends -->
        <div class="rounded border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900 shadow-sm">
          <h3 class="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
            </svg>
            Activity Trends
          </h3>
          <div class="h-48 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded border-2 border-dashed border-gray-300 dark:border-gray-600">
            <p class="text-xs text-gray-500 dark:text-gray-400">Line chart would go here</p>
          </div>
        </div>

        <!-- Active Hours -->
        <div class="rounded border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900 shadow-sm">
          <h3 class="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <svg class="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Peak Activity Hours
          </h3>
          <div class="h-48 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded border-2 border-dashed border-gray-300 dark:border-gray-600">
            <p class="text-xs text-gray-500 dark:text-gray-400">Bar chart would go here</p>
          </div>
        </div>
      </div>

      <!-- Top Active Users -->
      <div class="rounded border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900 shadow-sm">
        <h3 class="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <svg class="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
            <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
          </svg>
          Most Active Users
        </h3>
        <div class="space-y-2">
          <div *ngFor="let user of topUsers()" class="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
            <div class="flex items-center gap-3">
              <div class="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-purple-600 text-white text-xs font-bold">
                {{ user.initials }}
              </div>
              <div>
                <p class="text-xs font-medium text-gray-900 dark:text-white">{{ user.name }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ user.role }}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="text-xs font-bold text-gray-900 dark:text-white">{{ user.activities }} actions</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Last: {{ user.lastActive }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent User Activities Table -->
      <div class="rounded border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 shadow-sm overflow-hidden">
        <div class="p-3 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Recent User Activities
          </h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-xs">
            <thead class="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th class="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">User</th>
                <th class="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Action</th>
                <th class="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Module</th>
                <th class="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">IP Address</th>
                <th class="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Time</th>
                <th class="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr *ngFor="let activity of recentActivities()" class="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td class="px-3 py-2">
                  <div class="flex items-center gap-2">
                    <div class="flex h-6 w-6 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs font-bold">
                      {{ activity.userInitials }}
                    </div>
                    <span class="font-medium text-gray-900 dark:text-white">{{ activity.user }}</span>
                  </div>
                </td>
                <td class="px-3 py-2 text-gray-600 dark:text-gray-400">{{ activity.action }}</td>
                <td class="px-3 py-2">
                  <span class="inline-flex items-center gap-1 text-xs">
                    <span>{{ activity.moduleIcon }}</span>
                    <span class="text-gray-600 dark:text-gray-400">{{ activity.module }}</span>
                  </span>
                </td>
                <td class="px-3 py-2 text-gray-600 dark:text-gray-400 font-mono">{{ activity.ip }}</td>
                <td class="px-3 py-2 text-gray-600 dark:text-gray-400">{{ activity.time }}</td>
                <td class="px-3 py-2">
                  <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                        [class.bg-green-100]="activity.status === 'success'"
                        [class.text-green-700]="activity.status === 'success'"
                        [class.dark:bg-green-900/30]="activity.status === 'success'"
                        [class.dark:text-green-400]="activity.status === 'success'"
                        [class.bg-red-100]="activity.status === 'failed'"
                        [class.text-red-700]="activity.status === 'failed'"
                        [class.dark:bg-red-900/30]="activity.status === 'failed'"
                        [class.dark:text-red-400]="activity.status === 'failed'">
                    {{ activity.status }}
                  </span>
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
export class UserActivityComponent implements OnInit {
  dateRange = signal('7');
  selectedRole = signal('all');
  activityType = signal('all');

  userMetrics = signal<UserMetric[]>([
    { name: 'Total Users', icon: '👥', value: 1543, change: 8.2, trend: 'up' },
    { name: 'Active Today', icon: '🟢', value: 892, change: 5.4, trend: 'up' },
    { name: 'New Users', icon: '✨', value: 47, change: 12.1, trend: 'up' },
    { name: 'Avg Session', icon: '⏱️', value: 24.5, change: -3.2, trend: 'down' }
  ]);

  topUsers = signal([
    { initials: 'JD', name: 'John Doe', role: 'Admin', activities: 342, lastActive: '5 mins ago' },
    { initials: 'JS', name: 'Jane Smith', role: 'Manager', activities: 287, lastActive: '12 mins ago' },
    { initials: 'MJ', name: 'Mike Johnson', role: 'User', activities: 195, lastActive: '1 hour ago' },
    { initials: 'SW', name: 'Sarah Williams', role: 'Manager', activities: 168, lastActive: '2 hours ago' }
  ]);

  recentActivities = signal([
    { userInitials: 'JD', user: 'John Doe', action: 'Created loan', module: 'Money Loan', moduleIcon: '💰', ip: '192.168.1.1', time: '2 mins ago', status: 'success' },
    { userInitials: 'JS', user: 'Jane Smith', action: 'Updated settings', module: 'Settings', moduleIcon: '⚙️', ip: '192.168.1.2', time: '5 mins ago', status: 'success' },
    { userInitials: 'MJ', user: 'Mike Johnson', action: 'Login attempt', module: 'Auth', moduleIcon: '🔐', ip: '192.168.1.3', time: '8 mins ago', status: 'failed' },
    { userInitials: 'SW', user: 'Sarah Williams', action: 'Exported report', module: 'Reports', moduleIcon: '📊', ip: '192.168.1.4', time: '12 mins ago', status: 'success' }
  ]);

  ngOnInit(): void {
    console.log('👥 User Activity Report initialized');
  }

  applyFilters(): void {
    console.log('Applying filters:', {
      dateRange: this.dateRange(),
      role: this.selectedRole(),
      activityType: this.activityType()
    });
  }

  resetFilters(): void {
    this.dateRange.set('7');
    this.selectedRole.set('all');
    this.activityType.set('all');
    this.applyFilters();
  }

  refreshData(): void {
    console.log('Refreshing data...');
  }

  exportReport(): void {
    console.log('Exporting report...');
  }

  formatNumber(value: number): string {
    if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toFixed(1);
  }
}

