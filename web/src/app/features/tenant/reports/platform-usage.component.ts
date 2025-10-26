import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface PlatformMetric {
  name: string;
  icon: string;
  value: number;
  change: number;
  trend: 'up' | 'down';
  color: string;
}

@Component({
  selector: 'app-platform-usage',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            <span>Platform Usage Report</span>
          </h1>
          <p class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
            Monitor platform performance and usage metrics
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
              <option value="7">Last 7 Days</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="365">Last Year</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Platform</label>
            <select
              [(ngModel)]="selectedPlatform"
              (change)="applyFilters()"
              class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Platforms</option>
              <option value="money_loan">Money Loan</option>
              <option value="pawnshop">Pawnshop</option>
              <option value="bnpl">Buy Now Pay Later</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Metric Type</label>
            <select
              [(ngModel)]="metricType"
              (change)="applyFilters()"
              class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="transactions">Transactions</option>
              <option value="users">Active Users</option>
              <option value="revenue">Revenue</option>
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

      <!-- Key Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div *ngFor="let metric of metrics()"
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
                <span class="text-xs text-gray-500 dark:text-gray-400">vs last period</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Usage Chart -->
      <div class="rounded border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900 shadow-sm">
        <h3 class="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 12l3-3 3 3 4-4M8 21l4-4 4 4M3 4h18M4 4h16v12a1 1 0 01-1 1H5a1 1 0 01-1-1V4z" />
          </svg>
          Platform Usage Trends
        </h3>
        <div class="h-64 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded border-2 border-dashed border-gray-300 dark:border-gray-600">
          <p class="text-xs text-gray-500 dark:text-gray-400">Chart visualization would go here</p>
        </div>
      </div>

      <!-- Platform Breakdown -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <!-- Top Performing Platforms -->
        <div class="rounded border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900 shadow-sm">
          <h3 class="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <svg class="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
            </svg>
            Top Performing Platforms
          </h3>
          <div class="space-y-2">
            <div *ngFor="let item of topPlatforms()" class="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 transition">
              <div class="flex items-center gap-2">
                <span class="text-lg">{{ item.icon }}</span>
                <div>
                  <p class="text-xs font-medium text-gray-900 dark:text-white">{{ item.name }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ item.transactions }} transactions</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-xs font-bold text-gray-900 dark:text-white">{{ formatCurrency(item.revenue) }}</p>
                <span class="inline-flex items-center gap-0.5 text-xs text-green-600 dark:text-green-400">
                  <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clip-rule="evenodd" />
                  </svg>
                  {{ item.growth }}%
                </span>
              </div>
            </div>
          </div>
        </div>

        <!-- Platform Distribution -->
        <div class="rounded border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900 shadow-sm">
          <h3 class="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <svg class="w-4 h-4 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
              <path d="M2 10a8 8 0 018-8v8h8a8 8 0 11-16 0z" />
              <path d="M12 2.252A8.014 8.014 0 0117.748 8H12V2.252z" />
            </svg>
            Usage Distribution
          </h3>
          <div class="h-48 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded border-2 border-dashed border-gray-300 dark:border-gray-600">
            <p class="text-xs text-gray-500 dark:text-gray-400">Pie chart would go here</p>
          </div>
        </div>
      </div>

      <!-- Recent Activity Table -->
      <div class="rounded border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 shadow-sm overflow-hidden">
        <div class="p-3 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Recent Platform Activity
          </h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-xs">
            <thead class="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th class="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Platform</th>
                <th class="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Activity</th>
                <th class="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">User</th>
                <th class="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Time</th>
                <th class="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr *ngFor="let activity of recentActivities()" class="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td class="px-3 py-2">
                  <div class="flex items-center gap-2">
                    <span>{{ activity.platformIcon }}</span>
                    <span class="font-medium text-gray-900 dark:text-white">{{ activity.platform }}</span>
                  </div>
                </td>
                <td class="px-3 py-2 text-gray-600 dark:text-gray-400">{{ activity.activity }}</td>
                <td class="px-3 py-2 text-gray-600 dark:text-gray-400">{{ activity.user }}</td>
                <td class="px-3 py-2 text-gray-600 dark:text-gray-400">{{ activity.time }}</td>
                <td class="px-3 py-2">
                  <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                        [class.bg-green-100]="activity.status === 'completed'"
                        [class.text-green-700]="activity.status === 'completed'"
                        [class.dark:bg-green-900/30]="activity.status === 'completed'"
                        [class.dark:text-green-400]="activity.status === 'completed'"
                        [class.bg-yellow-100]="activity.status === 'pending'"
                        [class.text-yellow-700]="activity.status === 'pending'"
                        [class.dark:bg-yellow-900/30]="activity.status === 'pending'"
                        [class.dark:text-yellow-400]="activity.status === 'pending'">
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
export class PlatformUsageComponent implements OnInit {
  dateRange = signal('30');
  selectedPlatform = signal('all');
  metricType = signal('transactions');

  metrics = signal<PlatformMetric[]>([
    { name: 'Total Transactions', icon: '💰', value: 12543, change: 12.5, trend: 'up', color: 'blue' },
    { name: 'Active Users', icon: '👥', value: 8932, change: 8.2, trend: 'up', color: 'green' },
    { name: 'Revenue', icon: '💵', value: 2456789, change: 15.3, trend: 'up', color: 'purple' },
    { name: 'Avg Response Time', icon: '⚡', value: 1.2, change: -5.4, trend: 'down', color: 'orange' }
  ]);

  topPlatforms = signal([
    { icon: '💰', name: 'Money Loan', transactions: 5432, revenue: 1234567, growth: 15.2 },
    { icon: '💎', name: 'Pawnshop', transactions: 4321, revenue: 987654, growth: 12.8 },
    { icon: '🛍️', name: 'Buy Now Pay Later', transactions: 2790, revenue: 234568, growth: 8.5 }
  ]);

  recentActivities = signal([
    { platformIcon: '💰', platform: 'Money Loan', activity: 'Loan Application', user: 'John Doe', time: '2 mins ago', status: 'completed' },
    { platformIcon: '💎', platform: 'Pawnshop', activity: 'Item Appraisal', user: 'Jane Smith', time: '5 mins ago', status: 'pending' },
    { platformIcon: '🛍️', platform: 'BNPL', activity: 'Payment Processing', user: 'Mike Johnson', time: '8 mins ago', status: 'completed' },
    { platformIcon: '💰', platform: 'Money Loan', activity: 'Loan Disbursement', user: 'Sarah Williams', time: '12 mins ago', status: 'completed' }
  ]);

  ngOnInit(): void {
    console.log('📊 Platform Usage Report initialized');
  }

  applyFilters(): void {
    console.log('Applying filters:', {
      dateRange: this.dateRange(),
      platform: this.selectedPlatform(),
      metric: this.metricType()
    });
  }

  resetFilters(): void {
    this.dateRange.set('30');
    this.selectedPlatform.set('all');
    this.metricType.set('transactions');
    this.applyFilters();
  }

  refreshData(): void {
    console.log('Refreshing data...');
  }

  exportReport(): void {
    console.log('Exporting report...');
  }

  formatNumber(value: number): string {
    if (value >= 1000000) {
      return (value / 1000000).toFixed(1) + 'M';
    } else if (value >= 1000) {
      return (value / 1000).toFixed(1) + 'K';
    }
    return value.toFixed(1);
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }
}

