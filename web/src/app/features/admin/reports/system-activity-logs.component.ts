import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface ActivityLog {
  id: string;
  timestamp: Date;
  user: string;
  tenant: string;
  actionType: string;
  action: string;
  status: 'success' | 'failure' | 'pending';
  ipAddress: string;
  details: string;
}

@Component({
  selector: 'app-system-activity-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 sm:p-6 space-y-4">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">System Activity Logs</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Audit trail of system events and user actions for compliance and security
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button
            (click)="exportLogs('csv')"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Export CSV
          </button>
          <button
            (click)="exportLogs('pdf')"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-600 text-white rounded hover:bg-primary-700 transition shadow-sm"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
            </svg>
            Export PDF
          </button>
        </div>
      </div>

      <!-- Activity Overview Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-2xl">📝</span>
            <span class="text-xs font-medium px-2 py-0.5 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full">
              Today
            </span>
          </div>
          <p class="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Total Events</p>
          <p class="text-2xl font-bold text-blue-900 dark:text-blue-100">{{ totalEvents() }}</p>
          <p class="text-xs text-blue-600 dark:text-blue-400 mt-1">+234 vs yesterday</p>
        </div>

        <div class="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-2xl">✅</span>
            <span class="text-xs font-medium px-2 py-0.5 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded-full">
              Success
            </span>
          </div>
          <p class="text-xs font-medium text-green-700 dark:text-green-300 mb-1">Successful</p>
          <p class="text-2xl font-bold text-green-900 dark:text-green-100">{{ successfulEvents() }}</p>
          <p class="text-xs text-green-600 dark:text-green-400 mt-1">97.8% success rate</p>
        </div>

        <div class="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-2xl">❌</span>
            <span class="text-xs font-medium px-2 py-0.5 bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 rounded-full">
              Failed
            </span>
          </div>
          <p class="text-xs font-medium text-red-700 dark:text-red-300 mb-1">Failed Events</p>
          <p class="text-2xl font-bold text-red-900 dark:text-red-100">{{ failedEvents() }}</p>
          <p class="text-xs text-red-600 dark:text-red-400 mt-1">2.2% failure rate</p>
        </div>

        <div class="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-2xl">🔒</span>
            <span class="text-xs font-medium px-2 py-0.5 bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 rounded-full">
              Security
            </span>
          </div>
          <p class="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">Security Events</p>
          <p class="text-2xl font-bold text-purple-900 dark:text-purple-100">{{ securityEvents() }}</p>
          <p class="text-xs text-purple-600 dark:text-purple-400 mt-1">login & access events</p>
        </div>
      </div>

      <!-- Search & Filters -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div class="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <div class="lg:col-span-2">
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Search Logs</label>
            <div class="relative">
              <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                placeholder="Search by user, action, tenant, IP address..."
                class="w-full pl-10 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Date Range</label>
            <select
              [(ngModel)]="dateRange"
              class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="today">Today</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Event Type</label>
            <select
              [(ngModel)]="eventType"
              class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Events</option>
              <option value="login">Login</option>
              <option value="subscription">Subscription</option>
              <option value="billing">Billing</option>
              <option value="user">User Management</option>
              <option value="admin">Admin Actions</option>
              <option value="security">Security</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              [(ngModel)]="statusFilter"
              class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="failure">Failure</option>
              <option value="pending">Pending</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tenant</label>
            <select
              [(ngModel)]="tenantFilter"
              class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Tenants</option>
              <option value="1">Acme Corporation</option>
              <option value="2">TechStart Inc</option>
              <option value="3">Global Solutions</option>
              <option value="4">Innovation Labs</option>
            </select>
          </div>

          <div class="flex items-end">
            <button
              (click)="clearFilters()"
              class="w-full px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <!-- Activity Logs Table -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span>📋</span>
            Activity Log Entries
          </h3>
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-500 dark:text-gray-400">
              Showing {{ logs().length }} of {{ totalEvents() }} entries
            </span>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Timestamp</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">User</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Tenant</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Event Type</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Action</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Status</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">IP Address</th>
                <th class="px-4 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">Details</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              @for (log of logs(); track log.id) {
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  <td class="px-4 py-3">
                    <div class="flex flex-col">
                      <span class="text-xs font-medium text-gray-900 dark:text-white">
                        {{ formatDate(log.timestamp) }}
                      </span>
                      <span class="text-xs text-gray-500 dark:text-gray-400">
                        {{ formatTime(log.timestamp) }}
                      </span>
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <span class="text-xs text-gray-900 dark:text-white font-medium">{{ log.user }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="text-xs text-gray-600 dark:text-gray-400">{{ log.tenant }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="px-2 py-0.5 text-xs rounded" [class]="getEventTypeClass(log.actionType)">
                      {{ log.actionType }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-1.5">
                      <span [innerHTML]="getActionIcon(log.actionType)"></span>
                      <span class="text-xs text-gray-900 dark:text-white">{{ log.action }}</span>
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <span
                      class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full"
                      [class]="getStatusClass(log.status)"
                    >
                      {{ getStatusIcon(log.status) }} {{ log.status }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="text-xs font-mono text-gray-600 dark:text-gray-400">{{ log.ipAddress }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center justify-end">
                      <button
                        (click)="viewDetails(log)"
                        class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition"
                        title="View Details"
                      >
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                        </svg>
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div class="text-xs text-gray-600 dark:text-gray-400">
            Showing 1-{{ logs().length }} of {{ totalEvents() }} entries
          </div>
          <div class="flex items-center gap-2">
            <button
              class="px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition disabled:opacity-50 disabled:cursor-not-allowed"
              disabled
            >
              Previous
            </button>
            <button
              class="px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition"
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <!-- Monitoring Integration Info -->
      <div class="bg-gradient-to-r from-indigo-50 to-purple-50 dark:from-indigo-900/20 dark:to-purple-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
        <div class="flex items-start gap-3">
          <span class="text-2xl">🔔</span>
          <div class="flex-1">
            <h3 class="font-semibold text-gray-900 dark:text-white mb-2">Monitoring & Alerting Integration</h3>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">
              Configure real-time monitoring and alerting for critical system events.
            </p>
            <div class="flex flex-wrap gap-2">
              <button class="px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                🔗 Connect Monitoring Tool
              </button>
              <button class="px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                📧 Configure Alerts
              </button>
              <button class="px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                📊 View Analytics
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SystemActivityLogsComponent {
  searchQuery = '';
  dateRange = 'today';
  eventType = 'all';
  statusFilter = 'all';
  tenantFilter = 'all';

  logs = signal<ActivityLog[]>([
    {
      id: '1',
      timestamp: new Date('2024-10-23T14:32:15'),
      user: 'john.doe@acme.com',
      tenant: 'Acme Corporation',
      actionType: 'Login',
      action: 'User logged in',
      status: 'success',
      ipAddress: '192.168.1.100',
      details: 'Successful login from web application'
    },
    {
      id: '2',
      timestamp: new Date('2024-10-23T14:28:42'),
      user: 'admin@system.com',
      tenant: 'TechStart Inc',
      actionType: 'Subscription',
      action: 'Plan upgraded',
      status: 'success',
      ipAddress: '10.0.0.25',
      details: 'Upgraded from Starter to Professional plan'
    },
    {
      id: '3',
      timestamp: new Date('2024-10-23T14:15:33'),
      user: 'jane.smith@global.com',
      tenant: 'Global Solutions',
      actionType: 'Billing',
      action: 'Payment processed',
      status: 'success',
      ipAddress: '172.16.0.50',
      details: 'Monthly subscription payment of $299.00'
    },
    {
      id: '4',
      timestamp: new Date('2024-10-23T14:10:18'),
      user: 'user@innovation.com',
      tenant: 'Innovation Labs',
      actionType: 'Login',
      action: 'Failed login attempt',
      status: 'failure',
      ipAddress: '203.0.113.45',
      details: 'Invalid credentials - 3rd attempt'
    },
    {
      id: '5',
      timestamp: new Date('2024-10-23T14:05:22'),
      user: 'admin@acme.com',
      tenant: 'Acme Corporation',
      actionType: 'User Management',
      action: 'User created',
      status: 'success',
      ipAddress: '192.168.1.101',
      details: 'Created new user: sarah.jones@acme.com'
    },
    {
      id: '6',
      timestamp: new Date('2024-10-23T13:58:47'),
      user: 'admin@system.com',
      tenant: 'TechStart Inc',
      actionType: 'Admin',
      action: 'Permission changed',
      status: 'success',
      ipAddress: '10.0.0.25',
      details: 'Updated role permissions for Manager role'
    },
    {
      id: '7',
      timestamp: new Date('2024-10-23T13:45:11'),
      user: 'billing@global.com',
      tenant: 'Global Solutions',
      actionType: 'Billing',
      action: 'Invoice generated',
      status: 'pending',
      ipAddress: '172.16.0.52',
      details: 'Invoice #INV-2024-10-1234 for October billing cycle'
    },
    {
      id: '8',
      timestamp: new Date('2024-10-23T13:32:05'),
      user: 'security@innovation.com',
      tenant: 'Innovation Labs',
      actionType: 'Security',
      action: 'Password reset',
      status: 'success',
      ipAddress: '203.0.113.46',
      details: 'Password reset requested and completed'
    },
    {
      id: '9',
      timestamp: new Date('2024-10-23T13:20:33'),
      user: 'john.doe@acme.com',
      tenant: 'Acme Corporation',
      actionType: 'Subscription',
      action: 'Feature enabled',
      status: 'success',
      ipAddress: '192.168.1.100',
      details: 'Enabled Advanced Reporting feature'
    },
    {
      id: '10',
      timestamp: new Date('2024-10-23T13:10:58'),
      user: 'api@techstart.com',
      tenant: 'TechStart Inc',
      actionType: 'Admin',
      action: 'API key generated',
      status: 'success',
      ipAddress: '10.0.0.30',
      details: 'Generated new API key for integration'
    }
  ]);

  totalEvents = computed(() => this.logs().length);
  successfulEvents = computed(() => this.logs().filter(log => log.status === 'success').length);
  failedEvents = computed(() => this.logs().filter(log => log.status === 'failure').length);
  securityEvents = computed(() => this.logs().filter(log => log.actionType === 'Login' || log.actionType === 'Security').length);

  formatDate(date: Date): string {
    return new Intl.DateTimeFormat('en-US', { month: 'short', day: 'numeric', year: 'numeric' }).format(date);
  }

  formatTime(date: Date): string {
    return new Intl.DateTimeFormat('en-US', { hour: '2-digit', minute: '2-digit', second: '2-digit' }).format(date);
  }

  getEventTypeClass(type: string): string {
    const classes: Record<string, string> = {
      'Login': 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
      'Subscription': 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300',
      'Billing': 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
      'User Management': 'bg-indigo-50 dark:bg-indigo-900/20 text-indigo-700 dark:text-indigo-300',
      'Admin': 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300',
      'Security': 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300'
    };
    return classes[type] || 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300';
  }

  getActionIcon(type: string): string {
    const icons: Record<string, string> = {
      'Login': '🔑',
      'Subscription': '📋',
      'Billing': '💳',
      'User Management': '👤',
      'Admin': '⚙️',
      'Security': '🔒'
    };
    return icons[type] || '📄';
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'success': 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300',
      'failure': 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300',
      'pending': 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
    };
    return classes[status] || 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300';
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      'success': '✅',
      'failure': '❌',
      'pending': '⏳'
    };
    return icons[status] || '📄';
  }

  viewDetails(log: ActivityLog) {
    alert(`Log Details:\n\nID: ${log.id}\nTimestamp: ${log.timestamp}\nUser: ${log.user}\nTenant: ${log.tenant}\nAction: ${log.action}\nStatus: ${log.status}\nIP: ${log.ipAddress}\n\nDetails: ${log.details}`);
  }

  clearFilters() {
    this.searchQuery = '';
    this.dateRange = 'today';
    this.eventType = 'all';
    this.statusFilter = 'all';
    this.tenantFilter = 'all';
  }

  exportLogs(format: 'csv' | 'pdf') {
    alert(`Exporting activity logs as ${format.toUpperCase()}...`);
  }
}
