import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface RevenueData {
  month: string;
  totalRevenue: number;
  recurringRevenue: number;
  refunds: number;
  discounts: number;
}

interface TenantRevenue {
  tenantName: string;
  plan: string;
  revenue: number;
  trend: number;
}

@Component({
  selector: 'app-revenue-reports',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 sm:p-6 space-y-4">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Revenue Reports</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track revenue from subscriptions and payments
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button
            (click)="exportReport('csv')"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Export CSV
          </button>
          <button
            (click)="exportReport('pdf')"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-600 text-white rounded hover:bg-primary-700 transition shadow-sm"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
            </svg>
            Export PDF
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Period</label>
            <select
              [(ngModel)]="period"
              class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="month">This Month</option>
              <option value="quarter">This Quarter</option>
              <option value="year">This Year</option>
              <option value="custom">Custom Range</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Group By</label>
            <select
              [(ngModel)]="groupBy"
              class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="tenant">Tenant</option>
              <option value="plan">Plan</option>
              <option value="product">Product</option>
              <option value="region">Region</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Currency</label>
            <select
              [(ngModel)]="currency"
              class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="USD">USD</option>
              <option value="EUR">EUR</option>
              <option value="GBP">GBP</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">View</label>
            <select
              [(ngModel)]="viewType"
              class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="summary">Summary</option>
              <option value="detailed">Detailed</option>
              <option value="comparison">Comparison</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Key Revenue Metrics -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-2xl">💰</span>
            <span class="text-xs font-medium px-2 py-0.5 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded-full">
              +15.3%
            </span>
          </div>
          <p class="text-xs font-medium text-green-700 dark:text-green-300 mb-1">Total Revenue</p>
          <p class="text-2xl font-bold text-green-900 dark:text-green-100">$245,890</p>
          <p class="text-xs text-green-600 dark:text-green-400 mt-1">vs. last month</p>
        </div>

        <div class="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-2xl">🔄</span>
            <span class="text-xs font-medium px-2 py-0.5 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full">
              +8.7%
            </span>
          </div>
          <p class="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Recurring Revenue (MRR)</p>
          <p class="text-2xl font-bold text-blue-900 dark:text-blue-100">$189,450</p>
          <p class="text-xs text-blue-600 dark:text-blue-400 mt-1">monthly average</p>
        </div>

        <div class="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 border border-red-200 dark:border-red-800 rounded-lg p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-2xl">↩️</span>
            <span class="text-xs font-medium px-2 py-0.5 bg-red-200 dark:bg-red-800 text-red-800 dark:text-red-200 rounded-full">
              -2.1%
            </span>
          </div>
          <p class="text-xs font-medium text-red-700 dark:text-red-300 mb-1">Refunds</p>
          <p class="text-2xl font-bold text-red-900 dark:text-red-100">$3,240</p>
          <p class="text-xs text-red-600 dark:text-red-400 mt-1">1.3% of revenue</p>
        </div>

        <div class="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-2xl">🎁</span>
            <span class="text-xs font-medium px-2 py-0.5 bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 rounded-full">
              Active
            </span>
          </div>
          <p class="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">Discounts Applied</p>
          <p class="text-2xl font-bold text-purple-900 dark:text-purple-100">$12,450</p>
          <p class="text-xs text-purple-600 dark:text-purple-400 mt-1">5.1% of revenue</p>
        </div>
      </div>

      <!-- Revenue Trends Chart -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span>📊</span>
            Revenue Trends
          </h3>
          <span class="text-xs text-gray-500 dark:text-gray-400">Last 6 months</span>
        </div>

        <div class="space-y-3">
          @for (data of revenueData(); track data.month) {
            <div class="space-y-2">
              <div class="flex items-center justify-between text-xs">
                <span class="font-medium text-gray-900 dark:text-white">{{ data.month }}</span>
                <div class="flex items-center gap-4">
                  <span class="text-green-600 dark:text-green-400">Total: {{ data.totalRevenue.toLocaleString() }}</span>
                  <span class="text-blue-600 dark:text-blue-400">MRR: {{ data.recurringRevenue.toLocaleString() }}</span>
                </div>
              </div>
              <div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-8 overflow-hidden">
                <div class="h-full flex">
                  <div
                    class="bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                    [style.width.%]="(data.totalRevenue / maxRevenue()) * 100"
                    [title]="'Total: $' + data.totalRevenue.toLocaleString()"
                  ></div>
                </div>
              </div>
              @if (data.refunds > 0 || data.discounts > 0) {
                <div class="flex items-center gap-2 text-xs">
                  @if (data.refunds > 0) {
                    <span class="text-red-600 dark:text-red-400">Refunds: {{ data.refunds.toLocaleString() }}</span>
                  }
                  @if (data.discounts > 0) {
                    <span class="text-purple-600 dark:text-purple-400">Discounts: {{ data.discounts.toLocaleString() }}</span>
                  }
                </div>
              }
            </div>
          }
        </div>
      </div>

      <!-- Revenue Distribution -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- By Plan -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 class="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span>📦</span>
            Revenue by Plan
          </h3>

          <div class="space-y-3">
            @for (plan of planRevenue(); track plan.name) {
              <div>
                <div class="flex items-center justify-between text-xs mb-1">
                  <span class="font-medium text-gray-900 dark:text-white">{{ plan.name }}</span>
                  <div class="flex items-center gap-2">
                    <span class="text-gray-600 dark:text-gray-400">{{ plan.revenue.toLocaleString() }}</span>
                    <span class="font-semibold text-gray-900 dark:text-white">{{ plan.percentage }}%</span>
                  </div>
                </div>
                <div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    class="h-2 rounded-full transition-all duration-500"
                    [class]="plan.color"
                    [style.width.%]="plan.percentage"
                  ></div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- By Region -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 class="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <span>🌍</span>
            Revenue by Region
          </h3>

          <div class="space-y-3">
            @for (region of regionRevenue(); track region.name) {
              <div>
                <div class="flex items-center justify-between text-xs mb-1">
                  <span class="font-medium text-gray-900 dark:text-white">{{ region.name }}</span>
                  <div class="flex items-center gap-2">
                    <span class="text-gray-600 dark:text-gray-400">{{ region.revenue.toLocaleString() }}</span>
                    <span class="font-semibold text-gray-900 dark:text-white">{{ region.percentage }}%</span>
                  </div>
                </div>
                <div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    class="h-2 rounded-full transition-all duration-500"
                    [class]="region.color"
                    [style.width.%]="region.percentage"
                  ></div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Top Revenue Tenants -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
          <h3 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span>🏆</span>
            Top Revenue Tenants
          </h3>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Rank</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Tenant</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Plan</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Revenue</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Trend</th>
                <th class="px-4 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              @for (tenant of topTenants(); track $index; let i = $index) {
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  <td class="px-4 py-3">
                    <span
                      class="inline-flex items-center justify-center w-6 h-6 rounded-full text-xs font-bold"
                      [class]="i === 0 ? 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300' : i === 1 ? 'bg-gray-200 dark:bg-gray-700 text-gray-700 dark:text-gray-300' : i === 2 ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300' : 'bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400'"
                    >
                      {{ i + 1 }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="font-medium text-gray-900 dark:text-white text-xs">{{ tenant.tenantName }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs rounded">
                      {{ tenant.plan }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="font-semibold text-gray-900 dark:text-white text-xs">{{ currency }} {{ tenant.revenue.toLocaleString() }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-1">
                      @if (tenant.trend > 0) {
                        <svg class="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
                        </svg>
                        <span class="text-xs text-green-600 dark:text-green-400">+{{ tenant.trend }}%</span>
                      } @else {
                        <svg class="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
                        </svg>
                        <span class="text-xs text-red-600 dark:text-red-400">{{ tenant.trend }}%</span>
                      }
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center justify-end gap-1">
                      <button
                        class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition"
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
export class RevenueReportsComponent {
  period = 'month';
  groupBy = 'tenant';
  currency = 'USD';
  viewType = 'summary';

  revenueData = signal<RevenueData[]>([
    { month: 'May 2024', totalRevenue: 198450, recurringRevenue: 165320, refunds: 2340, discounts: 8920 },
    { month: 'Jun 2024', totalRevenue: 215680, recurringRevenue: 178450, refunds: 2890, discounts: 9560 },
    { month: 'Jul 2024', totalRevenue: 223940, recurringRevenue: 183290, refunds: 3120, discounts: 10230 },
    { month: 'Aug 2024', totalRevenue: 229870, recurringRevenue: 186720, refunds: 2760, discounts: 11450 },
    { month: 'Sep 2024', totalRevenue: 238560, recurringRevenue: 189450, refunds: 3480, discounts: 12890 },
    { month: 'Oct 2024', totalRevenue: 245890, recurringRevenue: 189450, refunds: 3240, discounts: 12450 }
  ]);

  planRevenue = signal([
    { name: 'Enterprise', revenue: 125890, percentage: 51.2, color: 'bg-gradient-to-r from-green-500 to-green-600' },
    { name: 'Professional', revenue: 78450, percentage: 31.9, color: 'bg-gradient-to-r from-blue-500 to-blue-600' },
    { name: 'Starter', revenue: 41550, percentage: 16.9, color: 'bg-gradient-to-r from-purple-500 to-purple-600' }
  ]);

  regionRevenue = signal([
    { name: 'North America', revenue: 145230, percentage: 59.1, color: 'bg-gradient-to-r from-blue-500 to-blue-600' },
    { name: 'Europe', revenue: 68970, percentage: 28.1, color: 'bg-gradient-to-r from-green-500 to-green-600' },
    { name: 'Asia Pacific', revenue: 23450, percentage: 9.5, color: 'bg-gradient-to-r from-purple-500 to-purple-600' },
    { name: 'Other', revenue: 8240, percentage: 3.3, color: 'bg-gradient-to-r from-orange-500 to-orange-600' }
  ]);

  topTenants = signal<TenantRevenue[]>([
    { tenantName: 'Global Solutions', plan: 'Enterprise', revenue: 45890, trend: 12.5 },
    { tenantName: 'Acme Corporation', plan: 'Enterprise', revenue: 38450, trend: 8.3 },
    { tenantName: 'TechStart Inc', plan: 'Professional', revenue: 28970, trend: 15.7 },
    { tenantName: 'Digital Ventures', plan: 'Professional', revenue: 22340, trend: -3.2 },
    { tenantName: 'Innovation Labs', plan: 'Enterprise', revenue: 19560, trend: 6.8 }
  ]);

  maxRevenue = computed(() => Math.max(...this.revenueData().map(d => d.totalRevenue)));

  exportReport(format: 'csv' | 'pdf') {
    alert(`Exporting revenue report as ${format.toUpperCase()}...`);
  }
}
