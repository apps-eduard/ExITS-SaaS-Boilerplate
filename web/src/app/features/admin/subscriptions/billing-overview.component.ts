import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface RevenueData {
  month: string;
  revenue: number;
  subscriptions: number;
}

@Component({
  selector: 'app-billing-overview',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 sm:p-6 space-y-6">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Billing Overview</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Monitor subscription revenue and billing metrics
          </p>
        </div>
        <div class="flex items-center gap-2">
          <select
            [(ngModel)]="selectedPeriod"
            class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
          >
            <option value="7d">Last 7 days</option>
            <option value="30d">Last 30 days</option>
            <option value="90d">Last 90 days</option>
            <option value="1y">Last year</option>
          </select>
          <button
            (click)="exportReport()"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Export
          </button>
        </div>
      </div>

      <!-- Key Metrics -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Total Revenue -->
        <div class="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-2xl">💰</span>
            <span class="text-xs font-medium px-2 py-0.5 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded-full">
              +12.5%
            </span>
          </div>
          <p class="text-xs font-medium text-green-700 dark:text-green-300 mb-1">Total Revenue</p>
          <p class="text-2xl font-bold text-green-900 dark:text-green-100">$45,289</p>
          <p class="text-xs text-green-600 dark:text-green-400 mt-1">vs. last period</p>
        </div>

        <!-- MRR -->
        <div class="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-2xl">📈</span>
            <span class="text-xs font-medium px-2 py-0.5 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full">
              +8.3%
            </span>
          </div>
          <p class="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Monthly Recurring Revenue</p>
          <p class="text-2xl font-bold text-blue-900 dark:text-blue-100">$12,450</p>
          <p class="text-xs text-blue-600 dark:text-blue-400 mt-1">vs. last month</p>
        </div>

        <!-- Active Subscriptions -->
        <div class="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-2xl">✅</span>
            <span class="text-xs font-medium px-2 py-0.5 bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 rounded-full">
              +5
            </span>
          </div>
          <p class="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">Active Subscriptions</p>
          <p class="text-2xl font-bold text-purple-900 dark:text-purple-100">142</p>
          <p class="text-xs text-purple-600 dark:text-purple-400 mt-1">this month</p>
        </div>

        <!-- Churn Rate -->
        <div class="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-2xl">📉</span>
            <span class="text-xs font-medium px-2 py-0.5 bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 rounded-full">
              -1.2%
            </span>
          </div>
          <p class="text-xs font-medium text-orange-700 dark:text-orange-300 mb-1">Churn Rate</p>
          <p class="text-2xl font-bold text-orange-900 dark:text-orange-100">3.5%</p>
          <p class="text-xs text-orange-600 dark:text-orange-400 mt-1">vs. last month</p>
        </div>
      </div>

      <!-- Charts Row -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Revenue Chart -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span>📊</span>
              Revenue Trend
            </h3>
            <span class="text-xs text-gray-500 dark:text-gray-400">Last 6 months</span>
          </div>

          <div class="space-y-3">
            @for (data of revenueData(); track data.month) {
              <div class="space-y-1">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-gray-600 dark:text-gray-400">{{ data.month }}</span>
                  <span class="font-semibold text-gray-900 dark:text-white">{{ data.revenue.toLocaleString() }}</span>
                </div>
                <div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    class="bg-gradient-to-r from-green-500 to-green-600 h-2 rounded-full transition-all duration-500"
                    [style.width.%]="(data.revenue / maxRevenue()) * 100"
                  ></div>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Subscription Growth -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center justify-between mb-4">
            <h3 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span>📈</span>
              Subscription Growth
            </h3>
            <span class="text-xs text-gray-500 dark:text-gray-400">Last 6 months</span>
          </div>

          <div class="space-y-3">
            @for (data of revenueData(); track data.month) {
              <div class="space-y-1">
                <div class="flex items-center justify-between text-xs">
                  <span class="text-gray-600 dark:text-gray-400">{{ data.month }}</span>
                  <span class="font-semibold text-gray-900 dark:text-white">{{ data.subscriptions }}</span>
                </div>
                <div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 overflow-hidden">
                  <div
                    class="bg-gradient-to-r from-blue-500 to-blue-600 h-2 rounded-full transition-all duration-500"
                    [style.width.%]="(data.subscriptions / maxSubscriptions()) * 100"
                  ></div>
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Upcoming Payments & Overdue Invoices -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Upcoming Payments -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div class="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span>📅</span>
              Upcoming Payments
            </h3>
          </div>
          <div class="divide-y divide-gray-200 dark:divide-gray-700">
            @for (payment of upcomingPayments(); track payment.id) {
              <div class="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                <div class="flex items-center justify-between mb-1">
                  <span class="font-medium text-sm text-gray-900 dark:text-white">{{ payment.customer }}</span>
                  <span class="font-semibold text-sm text-gray-900 dark:text-white">{{ payment.amount }}</span>
                </div>
                <div class="flex items-center justify-between">
                  <span class="text-xs text-gray-500 dark:text-gray-400">{{ payment.plan }}</span>
                  <span class="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded">
                    Due {{ payment.dueDate }}
                  </span>
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Overdue Invoices -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div class="p-4 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between">
              <h3 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span>⚠️</span>
                Overdue Invoices
              </h3>
              <span class="px-2 py-0.5 text-xs font-medium bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded-full">
                {{ overdueInvoices().length }}
              </span>
            </div>
          </div>
          @if (overdueInvoices().length === 0) {
            <div class="p-8 text-center">
              <span class="text-3xl mb-2 block">✅</span>
              <p class="text-sm text-gray-500 dark:text-gray-400">No overdue invoices</p>
            </div>
          } @else {
            <div class="divide-y divide-gray-200 dark:divide-gray-700">
              @for (invoice of overdueInvoices(); track invoice.id) {
                <div class="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  <div class="flex items-center justify-between mb-1">
                    <span class="font-medium text-sm text-gray-900 dark:text-white">{{ invoice.customer }}</span>
                    <span class="font-semibold text-sm text-red-600 dark:text-red-400">{{ invoice.amount }}</span>
                  </div>
                  <div class="flex items-center justify-between">
                    <span class="text-xs text-gray-500 dark:text-gray-400">Invoice #{{ invoice.invoiceNumber }}</span>
                    <span class="text-xs px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300 rounded">
                      {{ invoice.daysOverdue }} days overdue
                    </span>
                  </div>
                  <div class="mt-2 flex items-center gap-2">
                    <button class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                      </svg>
                      Send Reminder
                    </button>
                    <button class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition">
                      View Invoice
                    </button>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>

      <!-- Plan Distribution -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 class="font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span>🎯</span>
          Plan Distribution
        </h3>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          @for (plan of planDistribution(); track plan.name) {
            <div class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
              <div class="flex items-center justify-between mb-2">
                <h4 class="font-semibold text-gray-900 dark:text-white">{{ plan.name }}</h4>
                <span class="text-2xl font-bold text-primary-600 dark:text-primary-400">{{ plan.count }}</span>
              </div>
              <div class="w-full bg-gray-100 dark:bg-gray-700 rounded-full h-2 mb-2 overflow-hidden">
                <div
                  class="h-2 rounded-full transition-all duration-500"
                  [class]="plan.color"
                  [style.width.%]="plan.percentage"
                ></div>
              </div>
              <div class="flex items-center justify-between text-xs">
                <span class="text-gray-600 dark:text-gray-400">{{ plan.percentage }}% of total</span>
                <span class="font-semibold text-gray-900 dark:text-white">{{ plan.revenue }}</span>
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class BillingOverviewComponent {
  selectedPeriod = '30d';

  revenueData = signal<RevenueData[]>([
    { month: 'Jan 2024', revenue: 35000, subscriptions: 120 },
    { month: 'Feb 2024', revenue: 38500, subscriptions: 125 },
    { month: 'Mar 2024', revenue: 41200, subscriptions: 132 },
    { month: 'Apr 2024', revenue: 39800, subscriptions: 128 },
    { month: 'May 2024', revenue: 43500, subscriptions: 138 },
    { month: 'Jun 2024', revenue: 45289, subscriptions: 142 }
  ]);

  maxRevenue = computed(() =>
    Math.max(...this.revenueData().map(d => d.revenue))
  );

  maxSubscriptions = computed(() =>
    Math.max(...this.revenueData().map(d => d.subscriptions))
  );

  upcomingPayments = signal([
    { id: 1, customer: 'Acme Corporation', plan: 'Enterprise Plan', amount: '$299.99', dueDate: 'in 3 days' },
    { id: 2, customer: 'TechStart Inc', plan: 'Professional Plan', amount: '$149.99', dueDate: 'in 5 days' },
    { id: 3, customer: 'Digital Ventures', plan: 'Starter Plan', amount: '$49.99', dueDate: 'in 7 days' },
    { id: 4, customer: 'Global Solutions', plan: 'Business Plan', amount: '$199.99', dueDate: 'in 10 days' }
  ]);

  overdueInvoices = signal([
    { id: 1, customer: 'Startup Hub', invoiceNumber: 'INV-2024-001', amount: '$149.99', daysOverdue: 5 },
    { id: 2, customer: 'Quick Services', invoiceNumber: 'INV-2024-012', amount: '$49.99', daysOverdue: 12 }
  ]);

  planDistribution = signal([
    { name: 'Starter', count: 65, percentage: 45.8, revenue: '$3,249', color: 'bg-gradient-to-r from-blue-500 to-blue-600' },
    { name: 'Professional', count: 52, percentage: 36.6, revenue: '$7,799', color: 'bg-gradient-to-r from-purple-500 to-purple-600' },
    { name: 'Enterprise', count: 25, percentage: 17.6, revenue: '$7,499', color: 'bg-gradient-to-r from-green-500 to-green-600' }
  ]);

  exportReport() {
    // Mock export
    alert('Exporting report as CSV...');
    console.log('Export period:', this.selectedPeriod);
  }
}
