import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface TenantUsage {
  id: number;
  tenantName: string;
  activeUsers: number;
  totalUsers: number;
  loginFrequency: number;
  lastActive: string;
  topModules: { name: string; usage: number }[];
}

interface UsageMetric {
  date: string;
  logins: number;
  activeUsers: number;
  moduleAccess: number;
}

@Component({
  selector: 'app-tenant-usage',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-4">
      <!-- Export Buttons -->
      <div class="flex justify-end items-center gap-2">
        <button
          (click)="exportReport('csv')"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition shadow-sm"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          Export CSV
        </button>
        <button
          (click)="exportReport('pdf')"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-blue-600 text-white rounded hover:bg-blue-700 transition shadow-sm"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
          </svg>
          Export PDF
        </button>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Date Range</label>
            <select
              [(ngModel)]="dateRange"
              class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tenant</label>
            <select
              [(ngModel)]="selectedTenant"
              class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Tenants</option>
              @for (tenant of tenants(); track tenant.id) {
                <option [value]="tenant.id">{{ tenant.tenantName }}</option>
              }
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Module</label>
            <select
              [(ngModel)]="selectedModule"
              class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Modules</option>
              <option value="dashboard">Dashboard</option>
              <option value="users">Users</option>
              <option value="billing">Billing</option>
              <option value="reports">Reports</option>
              <option value="settings">Settings</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">View Type</label>
            <select
              [(ngModel)]="viewType"
              class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="daily">Daily</option>
              <option value="weekly">Weekly</option>
              <option value="monthly">Monthly</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Key Metrics -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-2xl">👥</span>
            <span class="text-xs font-medium px-2 py-0.5 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full">
              +8.2%
            </span>
          </div>
          <p class="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Total Active Users</p>
          <p class="text-2xl font-bold text-blue-900 dark:text-blue-100">2,847</p>
          <p class="text-xs text-blue-600 dark:text-blue-400 mt-1">across all tenants</p>
        </div>

        <div class="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-2xl">📊</span>
            <span class="text-xs font-medium px-2 py-0.5 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded-full">
              +12.5%
            </span>
          </div>
          <p class="text-xs font-medium text-green-700 dark:text-green-300 mb-1">Avg Login Frequency</p>
          <p class="text-2xl font-bold text-green-900 dark:text-green-100">4.2/day</p>
          <p class="text-xs text-green-600 dark:text-green-400 mt-1">per active user</p>
        </div>

        <div class="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-2xl">🔥</span>
            <span class="text-xs font-medium px-2 py-0.5 bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 rounded-full">
              Top 3
            </span>
          </div>
          <p class="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">Most Used Module</p>
          <p class="text-2xl font-bold text-purple-900 dark:text-purple-100">Dashboard</p>
          <p class="text-xs text-purple-600 dark:text-purple-400 mt-1">45% of all access</p>
        </div>

        <div class="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-2xl">🏢</span>
            <span class="text-xs font-medium px-2 py-0.5 bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 rounded-full">
              Active
            </span>
          </div>
          <p class="text-xs font-medium text-orange-700 dark:text-orange-300 mb-1">Active Tenants</p>
          <p class="text-2xl font-bold text-orange-900 dark:text-orange-100">24/28</p>
          <p class="text-xs text-orange-600 dark:text-orange-400 mt-1">85.7% engagement</p>
        </div>
      </div>

      <!-- Usage Trends Chart -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span>📈</span>
            Usage Trends
          </h3>
          <span class="text-xs text-gray-500 dark:text-gray-400">Last 30 days</span>
        </div>

        <div class="space-y-3">
          @for (metric of usageMetrics(); track metric.date) {
            <div class="space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="text-gray-600 dark:text-gray-400">{{ metric.date }}</span>
                <div class="flex items-center gap-4">
                  <span class="text-blue-600 dark:text-blue-400">{{ metric.logins }} logins</span>
                  <span class="text-green-600 dark:text-green-400">{{ metric.activeUsers }} users</span>
                  <span class="text-purple-600 dark:text-purple-400">{{ metric.moduleAccess }} modules</span>
                </div>
              </div>
              <div class="flex gap-1 h-8">
                <div class="flex-1 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                  <div
                    class="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-500"
                    [style.width.%]="(metric.logins / maxLogins()) * 100"
                    [title]="'Logins: ' + metric.logins"
                  ></div>
                </div>
                <div class="flex-1 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                  <div
                    class="bg-gradient-to-r from-green-500 to-green-600 h-full transition-all duration-500"
                    [style.width.%]="(metric.activeUsers / maxUsers()) * 100"
                    [title]="'Active Users: ' + metric.activeUsers"
                  ></div>
                </div>
                <div class="flex-1 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                  <div
                    class="bg-gradient-to-r from-purple-500 to-purple-600 h-full transition-all duration-500"
                    [style.width.%]="(metric.moduleAccess / maxModules()) * 100"
                    [title]="'Module Access: ' + metric.moduleAccess"
                  ></div>
                </div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Tenant Comparison -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Usage Heatmap -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 class="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span>🗺️</span>
            Usage Heatmap
          </h3>

          <div class="space-y-2">
            @for (tenant of tenants(); track tenant.id) {
              <div>
                <div class="flex items-center justify-between text-xs mb-1">
                  <span class="font-medium text-gray-900 dark:text-white">{{ tenant.tenantName }}</span>
                  <span class="text-gray-600 dark:text-gray-400">{{ tenant.activeUsers }}/{{ tenant.totalUsers }} users</span>
                </div>
                <div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    class="h-2 rounded-full transition-all duration-500"
                    [class]="getUsageHeatColor(tenant.activeUsers, tenant.totalUsers)"
                    [style.width.%]="(tenant.activeUsers / tenant.totalUsers) * 100"
                  ></div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Module Usage Distribution -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 class="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span>📦</span>
            Module Usage Distribution
          </h3>

          <div class="space-y-3">
            @for (module of moduleUsage(); track module.name) {
              <div>
                <div class="flex items-center justify-between text-xs mb-1">
                  <span class="font-medium text-gray-900 dark:text-white">{{ module.name }}</span>
                  <span class="text-gray-600 dark:text-gray-400">{{ module.percentage }}%</span>
                </div>
                <div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    class="h-2 rounded-full transition-all duration-500"
                    [class]="module.color"
                    [style.width.%]="module.percentage"
                  ></div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Tenant Details Table -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span>📊</span>
            Tenant Usage Details
          </h3>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Tenant</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Active Users</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Login Freq</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Top Modules</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Last Active</th>
                <th class="px-4 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              @for (tenant of tenants(); track tenant.id) {
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  <td class="px-4 py-3">
                    <span class="font-medium text-gray-900 dark:text-white text-xs">{{ tenant.tenantName }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-2">
                      <span class="font-semibold text-xs text-gray-900 dark:text-white">{{ tenant.activeUsers }}</span>
                      <span class="text-xs text-gray-500 dark:text-gray-400">/{{ tenant.totalUsers }}</span>
                      <span
                        class="px-1.5 py-0.5 text-xs rounded"
                        [class]="getEngagementClass(tenant.activeUsers, tenant.totalUsers)"
                      >
                        {{ getEngagementRate(tenant.activeUsers, tenant.totalUsers) }}%
                      </span>
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <span class="text-xs text-gray-900 dark:text-white">{{ tenant.loginFrequency }}/day</span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex flex-wrap gap-1">
                      @for (module of tenant.topModules.slice(0, 2); track module.name) {
                        <span class="px-1.5 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded">
                          {{ module.name }}
                        </span>
                      }
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <span class="text-xs text-gray-600 dark:text-gray-400">{{ tenant.lastActive }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center justify-end gap-1">
                      <button
                        class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition"
                        title="View Details"
                      >
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class TenantUsageComponent {
  dateRange = '30d';
  selectedTenant = 'all';
  selectedModule = 'all';
  viewType = 'daily';

  tenants = signal<TenantUsage[]>([
    {
      id: 1,
      tenantName: 'Acme Corporation',
      activeUsers: 145,
      totalUsers: 200,
      loginFrequency: 5.2,
      lastActive: '2 hours ago',
      topModules: [
        { name: 'Dashboard', usage: 89 },
        { name: 'Users', usage: 67 },
        { name: 'Billing', usage: 45 }
      ]
    },
    {
      id: 2,
      tenantName: 'TechStart Inc',
      activeUsers: 89,
      totalUsers: 150,
      loginFrequency: 4.8,
      lastActive: '5 hours ago',
      topModules: [
        { name: 'Reports', usage: 78 },
        { name: 'Dashboard', usage: 56 },
        { name: 'Settings', usage: 34 }
      ]
    },
    {
      id: 3,
      tenantName: 'Global Solutions',
      activeUsers: 234,
      totalUsers: 300,
      loginFrequency: 6.1,
      lastActive: '1 hour ago',
      topModules: [
        { name: 'Dashboard', usage: 95 },
        { name: 'Billing', usage: 89 },
        { name: 'Users', usage: 78 }
      ]
    },
    {
      id: 4,
      tenantName: 'Digital Ventures',
      activeUsers: 67,
      totalUsers: 100,
      loginFrequency: 3.9,
      lastActive: '3 hours ago',
      topModules: [
        { name: 'Users', usage: 56 },
        { name: 'Dashboard', usage: 45 },
        { name: 'Reports', usage: 23 }
      ]
    }
  ]);

  usageMetrics = signal<UsageMetric[]>([
    { date: 'Oct 20', logins: 1245, activeUsers: 456, moduleAccess: 2340 },
    { date: 'Oct 21', logins: 1389, activeUsers: 489, moduleAccess: 2567 },
    { date: 'Oct 22', logins: 1156, activeUsers: 423, moduleAccess: 2189 },
    { date: 'Oct 23', logins: 1467, activeUsers: 512, moduleAccess: 2789 }
  ]);

  moduleUsage = signal([
    { name: 'Dashboard', percentage: 45, color: 'bg-gradient-to-r from-blue-500 to-blue-600' },
    { name: 'Users', percentage: 28, color: 'bg-gradient-to-r from-green-500 to-green-600' },
    { name: 'Billing', percentage: 15, color: 'bg-gradient-to-r from-purple-500 to-purple-600' },
    { name: 'Reports', percentage: 8, color: 'bg-gradient-to-r from-orange-500 to-orange-600' },
    { name: 'Settings', percentage: 4, color: 'bg-gradient-to-r from-gray-500 to-gray-600' }
  ]);

  maxLogins = computed(() => Math.max(...this.usageMetrics().map(m => m.logins)));
  maxUsers = computed(() => Math.max(...this.usageMetrics().map(m => m.activeUsers)));
  maxModules = computed(() => Math.max(...this.usageMetrics().map(m => m.moduleAccess)));

  getUsageHeatColor(active: number, total: number): string {
    const percentage = (active / total) * 100;
    if (percentage >= 80) return 'bg-gradient-to-r from-green-500 to-green-600';
    if (percentage >= 60) return 'bg-gradient-to-r from-blue-500 to-blue-600';
    if (percentage >= 40) return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
    return 'bg-gradient-to-r from-red-500 to-red-600';
  }

  getEngagementRate(active: number, total: number): number {
    return Math.round((active / total) * 100);
  }

  getEngagementClass(active: number, total: number): string {
    const rate = this.getEngagementRate(active, total);
    if (rate >= 80) return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300';
    if (rate >= 60) return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300';
    if (rate >= 40) return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300';
    return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300';
  }

  exportReport(format: 'csv' | 'pdf') {
    alert(`Exporting tenant usage report as ${format.toUpperCase()}...`);
  }
}
