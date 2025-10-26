import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../core/services/toast.service';

interface SubscriptionHistory {
  id: number;
  tenant_id: number;
  tenant_name: string;
  invoice_id: string;
  invoice: string;
  type: string;
  amount: string;
  payment_method: string;
  status: string;
  payment_date: string | null;
  created_at: string;
  updated_at: string;
  plan_name: string | null;
  product_type: string | null;
  description: string;
}

@Component({
  selector: 'app-subscription-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <!-- Page Header -->
      <div class="mb-4 flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Tenant Transaction History</h2>
          <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">View all payment transactions and invoice history</p>
        </div>
        <button
          (click)="exportToCSV()"
          type="button"
          class="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded shadow-sm transition text-white bg-blue-600 hover:bg-blue-700"
        >
          <svg class="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          Export to CSV
        </button>
      </div>

      <!-- Summary Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-4">
        <!-- Total Card -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Total</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">{{ stats().total }}</p>
            </div>
            <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Completed Card -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Completed</p>
              <p class="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{{ stats().completed }}</p>
            </div>
            <div class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Pending Card -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Pending</p>
              <p class="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{{ stats().pending }}</p>
            </div>
            <div class="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
        </div>

        <!-- Failed Card -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Failed</p>
              <p class="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{{ stats().failed }}</p>
            </div>
            <div class="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 14l2-2m0 0l2-2m-2 2l-2-2m2 2l2 2m7-2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <!-- Status Filter -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              [(ngModel)]="statusFilter"
              class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="completed">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <!-- Tenant Filter -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tenant
            </label>
            <select
              [(ngModel)]="tenantIdFilter"
              class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Tenants</option>
              <option *ngFor="let tenant of uniqueTenants()" [value]="tenant.id">
                {{ tenant.name }}
              </option>
            </select>
          </div>

          <!-- Date Range -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date Range
            </label>
            <select
              [(ngModel)]="dateRangeFilter"
              class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Time</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="365">Last Year</option>
            </select>
          </div>

          <!-- Clear Filters Button -->
          <div class="flex items-end">
            <button
              (click)="clearFilters()"
              type="button"
              class="w-full px-3 py-1.5 text-xs font-medium rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              <svg class="w-3.5 h-3.5 inline-block mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Tenant</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Description</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Invoice</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Type</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Payment Method</th>
                <th class="px-3 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">Amount</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Status</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Date</th>
                <th class="px-3 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr *ngIf="loading()" class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td colspan="9" class="px-3 py-4 text-center text-xs text-gray-500 dark:text-gray-400">
                  Loading transactions...
                </td>
              </tr>
              <tr *ngIf="!loading() && filteredSubscriptions().length === 0" class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td colspan="9" class="px-3 py-4 text-center">
                  <div class="flex flex-col items-center gap-2 py-8">
                    <svg class="w-12 h-12 text-gray-400 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                    </svg>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">No transaction history found</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Transactions will appear here once tenants make payments</p>
                  </div>
                </td>
              </tr>
              <tr *ngFor="let sub of paginatedSubscriptions()" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                <td class="px-3 py-2 text-xs text-gray-900 dark:text-white">
                  {{ sub.tenant_name }}
                </td>
                <td class="px-3 py-2 text-xs text-gray-900 dark:text-white">
                  {{ sub.description }}
                </td>
                <td class="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 font-mono">
                  {{ sub.invoice }}
                </td>
                <td class="px-3 py-2">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                    {{ sub.type }}
                  </span>
                </td>
                <td class="px-3 py-2">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                    {{ getPaymentMethodLabel(sub.payment_method) }}
                  </span>
                </td>
                <td class="px-3 py-2 text-right text-xs font-semibold text-gray-900 dark:text-white">
                  ₱{{ sub.amount }}
                </td>
                <td class="px-3 py-2">
                  <span [class]="getStatusClass(sub.status)" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium">
                    {{ capitalizeStatus(sub.status) }}
                  </span>
                </td>
                <td class="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                  {{ sub.payment_date ? formatDate(sub.payment_date) : formatDate(sub.created_at) }}
                </td>
                <td class="px-3 py-2 text-center">
                  <button
                    (click)="viewTransaction(sub)"
                    type="button"
                    class="inline-flex items-center justify-center w-7 h-7 rounded hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-600 dark:text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 transition"
                    title="View Details"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                    </svg>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Controls -->
        <div class="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <!-- Left side: Page size selector and info -->
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-2">
              <label class="text-xs text-gray-600 dark:text-gray-400">Show:</label>
              <select
                [ngModel]="pageSize()"
                (ngModelChange)="changePageSize($event)"
                class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option *ngFor="let size of pageSizeOptions" [value]="size">{{ size }}</option>
              </select>
              <span class="text-xs text-gray-600 dark:text-gray-400">per page</span>
            </div>
            <div class="text-xs text-gray-600 dark:text-gray-400">
              Showing {{ (currentPage() - 1) * pageSize() + 1 }} to {{ Math.min(currentPage() * pageSize(), filteredSubscriptions().length) }} of {{ filteredSubscriptions().length }} transactions
            </div>
          </div>

          <!-- Right side: Page navigation -->
          <div class="flex items-center gap-2">
            <button
              (click)="previousPage()"
              [disabled]="currentPage() === 1"
              class="px-3 py-1 text-xs font-medium rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
              </svg>
            </button>

            <div class="flex items-center gap-1">
              <span class="text-xs text-gray-600 dark:text-gray-400">Page</span>
              <span class="px-2 py-1 text-xs font-medium text-gray-900 dark:text-white">{{ currentPage() }}</span>
              <span class="text-xs text-gray-600 dark:text-gray-400">of {{ totalPages() || 1 }}</span>
            </div>

            <button
              (click)="nextPage()"
              [disabled]="currentPage() === totalPages() || totalPages() === 0"
              class="px-3 py-1 text-xs font-medium rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class SubscriptionHistoryComponent implements OnInit {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);

  // Make Math available in template
  Math = Math;

  subscriptions = signal<SubscriptionHistory[]>([]);
  loading = signal<boolean>(true);

  // Filters as signals so computed() can track changes
  statusFilter = signal<string>('');
  tenantIdFilter = signal<string>('');
  planIdFilter = signal<string>('');
  dateRangeFilter = signal<string>('');

  // Pagination
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);
  pageSizeOptions = [10, 25, 50, 100];

  ngOnInit(): void {
    this.loadSubscriptions();
  }

  loadSubscriptions(): void {
    this.loading.set(true);
    this.http.get<{ success: boolean; data: SubscriptionHistory[] }>('/api/reports/subscription-history')
      .subscribe({
        next: (response: any) => {
          console.log('Loaded transactions:', response.data);
          this.subscriptions.set(response.data || []);
          this.loading.set(false);
        },
        error: (err: any) => {
          console.error('Error loading transactions:', err);
          this.loading.set(false);

          // Show user-friendly error message
          const errorMessage = err.error?.message || err.message || 'Failed to load transaction history';
          this.toastService.error(errorMessage);
        }
      });
  }

  filteredSubscriptions = computed(() => {
    let subs = this.subscriptions();

    // Filter by status
    const status = this.statusFilter();
    if (status) {
      subs = subs.filter(s => s.status === status);
    }

    // Filter by tenant
    const tenantId = this.tenantIdFilter();
    if (tenantId) {
      subs = subs.filter(s => s.tenant_id === Number(tenantId));
    }

    // Filter by date range
    const dateRange = this.dateRangeFilter();
    if (dateRange) {
      const days = Number(dateRange);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      subs = subs.filter(s => new Date(s.created_at) >= cutoffDate);
    }

    return subs;
  });

  // Paginated subscriptions
  paginatedSubscriptions = computed(() => {
    const subs = this.filteredSubscriptions();
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return subs.slice(start, end);
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredSubscriptions().length / this.pageSize());
  });

  uniqueTenants = computed(() => {
    const tenantsMap = new Map();
    this.subscriptions().forEach(sub => {
      if (!tenantsMap.has(sub.tenant_id)) {
        tenantsMap.set(sub.tenant_id, { id: sub.tenant_id, name: sub.tenant_name });
      }
    });
    return Array.from(tenantsMap.values());
  });

  uniquePlans = computed(() => {
    return [];
  });

  stats = computed(() => {
    const subs = this.filteredSubscriptions();
    return {
      total: subs.length,
      completed: subs.filter(s => s.status === 'completed').length,
      pending: subs.filter(s => s.status === 'pending').length,
      failed: subs.filter(s => s.status === 'failed').length
    };
  });

  clearFilters(): void {
    this.statusFilter.set('');
    this.tenantIdFilter.set('');
    this.dateRangeFilter.set('');
    this.currentPage.set(1);
  }

  changePageSize(size: number): void {
    this.pageSize.set(size);
    this.currentPage.set(1); // Reset to first page
  }

  previousPage(): void {
    if (this.currentPage() > 1) {
      this.currentPage.set(this.currentPage() - 1);
    }
  }

  nextPage(): void {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.set(this.currentPage() + 1);
    }
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }

  getPaymentMethodLabel(method: string): string {
    const labels: Record<string, string> = {
      credit_card: 'Credit Card',
      debit_card: 'Debit Card',
      paypal: 'PayPal',
      bank_transfer: 'Bank Transfer',
      cash: 'Cash',
      gcash: 'GCash',
      paymaya: 'PayMaya',
    };
    return labels[method] || method;
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  capitalizeStatus(status: string): string {
    if (!status) return '';
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  }

  viewTransaction(transaction: SubscriptionHistory): void {
    // For now, just log the transaction. You can later open a modal or navigate to details page
    console.log('View transaction:', transaction);
    this.toastService.info(`Viewing transaction: ${transaction.invoice}`);
    // TODO: Implement modal or detail view
  }

  exportToCSV(): void {
    const subs = this.filteredSubscriptions();
    const headers = ['Tenant', 'Description', 'Invoice', 'Type', 'Payment Method', 'Amount', 'Status', 'Date'];
    const rows = subs.map(s => [
      s.tenant_name,
      s.description,
      s.invoice,
      s.type,
      this.getPaymentMethodLabel(s.payment_method),
      s.amount,
      s.status,
      s.payment_date ? this.formatDate(s.payment_date) : this.formatDate(s.created_at),
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `transaction-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
