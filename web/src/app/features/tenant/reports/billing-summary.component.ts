import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface BillingMetric {
  name: string;
  icon: string;
  value: number | string;
  change: number;
  trend: 'up' | 'down';
  prefix?: string;
}

@Component({
  selector: 'app-billing-summary',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>Billing & Payment Summary</span>
          </h1>
          <p class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
            Track payments, invoices, and billing metrics
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
            class="inline-flex items-center gap-1.5 rounded bg-green-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-green-700 transition shadow-sm"
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
              class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-green-500 focus:outline-none"
            >
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="180">Last 6 Months</option>
              <option value="365">Last Year</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Payment Status</label>
            <select
              [(ngModel)]="paymentStatus"
              (change)="applyFilters()"
              class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-green-500 focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>
          <div>
            <label class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-1 block">Payment Method</label>
            <select
              [(ngModel)]="paymentMethod"
              (change)="applyFilters()"
              class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-green-500 focus:outline-none"
            >
              <option value="all">All Methods</option>
              <option value="credit_card">Credit Card</option>
              <option value="bank_transfer">Bank Transfer</option>
              <option value="paypal">PayPal</option>
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

      <!-- Billing Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <div *ngFor="let metric of billingMetrics()"
             class="rounded border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900 shadow-sm hover:shadow-md transition-shadow">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <div class="flex items-center gap-2 mb-2">
                <span class="text-xl">{{ metric.icon }}</span>
                <p class="text-xs font-medium text-gray-600 dark:text-gray-400">{{ metric.name }}</p>
              </div>
              <p class="text-xl font-bold text-gray-900 dark:text-white">
                <span *ngIf="metric.prefix">{{ metric.prefix }}</span>{{ metric.value }}
              </p>
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

      <!-- Revenue & Payment Charts -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <!-- Revenue Trends -->
        <div class="rounded border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900 shadow-sm">
          <h3 class="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <svg class="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
            </svg>
            Revenue Trends
          </h3>
          <div class="h-48 flex items-center justify-center bg-gray-50 dark:bg-gray-800 rounded border-2 border-dashed border-gray-300 dark:border-gray-600">
            <p class="text-xs text-gray-500 dark:text-gray-400">Area chart would go here</p>
          </div>
        </div>

        <!-- Payment Method Distribution -->
        <div class="rounded border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900 shadow-sm">
          <h3 class="text-sm font-bold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            Payment Methods
          </h3>
          <div class="space-y-2">
            <div *ngFor="let method of paymentMethods()" class="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-800">
              <div class="flex items-center gap-2">
                <span class="text-lg">{{ method.icon }}</span>
                <span class="text-xs font-medium text-gray-900 dark:text-white">{{ method.name }}</span>
              </div>
              <div class="text-right">
                <p class="text-xs font-bold text-gray-900 dark:text-white">{{ formatCurrency(method.amount) }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ method.percentage }}%</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Invoice Summary -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-3">
        <div *ngFor="let summary of invoiceSummary()"
             class="rounded border border-gray-200 bg-white p-3 dark:border-gray-700 dark:bg-gray-900 shadow-sm">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-full text-2xl"
                 [ngClass]="summary.bgClass">
              {{ summary.icon }}
            </div>
            <div class="flex-1">
              <p class="text-xs text-gray-600 dark:text-gray-400">{{ summary.label }}</p>
              <p class="text-lg font-bold text-gray-900 dark:text-white">{{ summary.count }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ formatCurrency(summary.total) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Transactions Table -->
      <div class="rounded border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 shadow-sm overflow-hidden">
        <div class="p-3 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <svg class="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
            </svg>
            Recent Transactions
          </h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-xs">
            <thead class="bg-gray-50 dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th class="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Invoice ID</th>
                <th class="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Description</th>
                <th class="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Amount</th>
                <th class="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Method</th>
                <th class="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Date</th>
                <th class="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Status</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr *ngFor="let transaction of recentTransactions()" class="hover:bg-gray-50 dark:hover:bg-gray-800">
                <td class="px-3 py-2 font-mono text-gray-900 dark:text-white font-medium">{{ transaction.invoiceId }}</td>
                <td class="px-3 py-2 text-gray-600 dark:text-gray-400">{{ transaction.description }}</td>
                <td class="px-3 py-2 font-bold text-gray-900 dark:text-white">{{ formatCurrency(transaction.amount) }}</td>
                <td class="px-3 py-2">
                  <span class="inline-flex items-center gap-1 text-xs">
                    <span>{{ transaction.methodIcon }}</span>
                    <span class="text-gray-600 dark:text-gray-400">{{ transaction.method }}</span>
                  </span>
                </td>
                <td class="px-3 py-2 text-gray-600 dark:text-gray-400">{{ transaction.date }}</td>
                <td class="px-3 py-2">
                  <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium"
                        [class.bg-green-100]="transaction.status === 'paid'"
                        [class.text-green-700]="transaction.status === 'paid'"
                        [class.dark:bg-green-900/30]="transaction.status === 'paid'"
                        [class.dark:text-green-400]="transaction.status === 'paid'"
                        [class.bg-yellow-100]="transaction.status === 'pending'"
                        [class.text-yellow-700]="transaction.status === 'pending'"
                        [class.dark:bg-yellow-900/30]="transaction.status === 'pending'"
                        [class.dark:text-yellow-400]="transaction.status === 'pending'"
                        [class.bg-red-100]="transaction.status === 'failed'"
                        [class.text-red-700]="transaction.status === 'failed'"
                        [class.dark:bg-red-900/30]="transaction.status === 'failed'"
                        [class.dark:text-red-400]="transaction.status === 'failed'">
                    {{ transaction.status }}
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
export class BillingSummaryComponent implements OnInit {
  dateRange = signal('30');
  paymentStatus = signal('all');
  paymentMethod = signal('all');

  billingMetrics = signal<BillingMetric[]>([
    { name: 'Total Revenue', icon: '💰', value: '84,250', prefix: '$', change: 12.5, trend: 'up' },
    { name: 'Paid Invoices', icon: '✅', value: '342', change: 8.3, trend: 'up' },
    { name: 'Pending Invoices', icon: '⏳', value: '28', change: -15.2, trend: 'down' },
    { name: 'Avg Payment Time', icon: '⏱️', value: '3.2 days', change: -5.8, trend: 'down' }
  ]);

  paymentMethods = signal([
    { icon: '💳', name: 'Credit Card', amount: 52480, percentage: 62.3 },
    { icon: '🏦', name: 'Bank Transfer', amount: 24150, percentage: 28.7 },
    { icon: '📱', name: 'PayPal', amount: 7620, percentage: 9.0 }
  ]);

  invoiceSummary = signal([
    { icon: '✅', label: 'Paid Invoices', count: 342, total: 84250, bgClass: 'bg-green-100 dark:bg-green-900/30' },
    { icon: '⏳', label: 'Pending Invoices', count: 28, total: 8940, bgClass: 'bg-yellow-100 dark:bg-yellow-900/30' },
    { icon: '❌', label: 'Failed Payments', count: 5, total: 1250, bgClass: 'bg-red-100 dark:bg-red-900/30' }
  ]);

  recentTransactions = signal([
    { invoiceId: 'INV-2024-001', description: 'Monthly Subscription', amount: 299, methodIcon: '💳', method: 'Credit Card', date: '2024-01-15', status: 'paid' },
    { invoiceId: 'INV-2024-002', description: 'Annual Plan Upgrade', amount: 2999, methodIcon: '🏦', method: 'Bank Transfer', date: '2024-01-14', status: 'paid' },
    { invoiceId: 'INV-2024-003', description: 'Additional User License', amount: 99, methodIcon: '📱', method: 'PayPal', date: '2024-01-13', status: 'pending' },
    { invoiceId: 'INV-2024-004', description: 'Monthly Subscription', amount: 299, methodIcon: '💳', method: 'Credit Card', date: '2024-01-12', status: 'failed' },
    { invoiceId: 'INV-2024-005', description: 'Storage Expansion', amount: 149, methodIcon: '💳', method: 'Credit Card', date: '2024-01-11', status: 'paid' }
  ]);

  ngOnInit(): void {
    console.log('💰 Billing & Payment Summary initialized');
  }

  applyFilters(): void {
    console.log('Applying filters:', {
      dateRange: this.dateRange(),
      paymentStatus: this.paymentStatus(),
      paymentMethod: this.paymentMethod()
    });
  }

  resetFilters(): void {
    this.dateRange.set('30');
    this.paymentStatus.set('all');
    this.paymentMethod.set('all');
    this.applyFilters();
  }

  refreshData(): void {
    console.log('Refreshing data...');
  }

  exportReport(): void {
    console.log('Exporting report...');
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0
    }).format(value);
  }
}

