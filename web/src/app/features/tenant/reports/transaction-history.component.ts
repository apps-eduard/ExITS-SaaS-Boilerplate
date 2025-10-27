import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TenantService } from '../../../core/services/tenant.service';

interface Transaction {
  id: number;
  date: Date | string;
  description: string;
  type: 'subscription' | 'upgrade' | 'downgrade' | 'refund' | 'payment';
  transactionType?: string;
  amount: number;
  status: 'success' | 'pending' | 'failed' | 'refunded';
  paymentMethod: string;
  planName?: string;
  invoiceId?: string;
}

@Component({
  selector: 'app-transaction-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-4 p-6">
      <!-- Page Header with Export Button -->
      <div class="flex items-center justify-between">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-6 h-6">🧾</span>
            <h2 class="text-lg font-bold text-gray-900 dark:text-white">Transaction History</h2>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">View all your subscription payments and transactions</p>
        </div>
        <button
          (click)="exportTransactions()"
          type="button"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded shadow-sm hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
        >
          <span class="w-3.5 h-3.5">📥</span>
          Export CSV
        </button>
      </div>

      <!-- Summary Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <!-- Total Card -->
        <div class="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition">
          <div class="flex items-center gap-2">
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <span class="text-base">📊</span>
            </div>
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400">Total</p>
              <p class="text-lg font-bold text-gray-900 dark:text-white">{{ filteredTransactions().length }}</p>
            </div>
          </div>
        </div>

        <!-- Completed Card -->
        <div class="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition">
          <div class="flex items-center gap-2">
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <span class="text-base">✅</span>
            </div>
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400">Completed</p>
              <p class="text-lg font-bold text-green-600 dark:text-green-400">{{ countByStatus('success') }}</p>
            </div>
          </div>
        </div>

        <!-- Pending Card -->
        <div class="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition">
          <div class="flex items-center gap-2">
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
              <span class="text-base">⏳</span>
            </div>
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400">Pending</p>
              <p class="text-lg font-bold text-yellow-600 dark:text-yellow-400">{{ countByStatus('pending') }}</p>
            </div>
          </div>
        </div>

        <!-- Failed Card -->
        <div class="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition">
          <div class="flex items-center gap-2">
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <span class="text-base">❌</span>
            </div>
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400">Failed</p>
              <p class="text-lg font-bold text-red-600 dark:text-red-400">{{ countByStatus('failed') }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <!-- Status Filter -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              [(ngModel)]="statusFilter"
              (change)="filterTransactions()"
              class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="success">Completed</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
            </select>
          </div>

          <!-- Type Filter -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type
            </label>
            <select
              [(ngModel)]="typeFilter"
              (change)="filterTransactions()"
              class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Types</option>
              <option value="subscription">Subscription</option>
              <option value="upgrade">Upgrade</option>
              <option value="payment">Payment</option>
            </select>
          </div>

          <!-- Date Range -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date Range
            </label>
            <select
              [(ngModel)]="dateRange"
              (change)="filterTransactions()"
              class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="all">All Time</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
            </select>
          </div>

          <!-- Clear Filters Button -->
          <div class="flex items-end">
            <button
              (click)="clearFilters()"
              type="button"
              class="w-full inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition"
            >
              <span class="w-3.5 h-3.5">🔄</span>
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <div class="flex items-center gap-1">
                    <span class="w-3.5 h-3.5">📝</span>
                    Description
                  </div>
                </th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <div class="flex items-center gap-1">
                    <span class="w-3.5 h-3.5">🔖</span>
                    Invoice
                  </div>
                </th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <div class="flex items-center gap-1">
                    <span class="w-3.5 h-3.5">🏷️</span>
                    Type
                  </div>
                </th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <div class="flex items-center gap-1">
                    <span class="w-3.5 h-3.5">💳</span>
                    Payment
                  </div>
                </th>
                <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <div class="flex items-center justify-end gap-1">
                    <span class="w-3.5 h-3.5">💰</span>
                    Amount
                  </div>
                </th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <div class="flex items-center gap-1">
                    <span class="w-3.5 h-3.5">🔘</span>
                    Status
                  </div>
                </th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <div class="flex items-center gap-1">
                    <span class="w-3.5 h-3.5">📅</span>
                    Date
                  </div>
                </th>
                <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <div class="flex items-center justify-center gap-1">
                    <span class="w-3.5 h-3.5">⚙️</span>
                    Action
                  </div>
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <tr *ngIf="isLoading()" class="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                <td colspan="8" class="px-3 py-8 text-center text-xs text-gray-500 dark:text-gray-400">
                  Loading transactions...
                </td>
              </tr>
              <tr *ngIf="!isLoading() && paginatedTransactions().length === 0" class="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                <td colspan="8" class="px-3 py-4 text-center">
                  <div class="flex flex-col items-center gap-2 py-8">
                    <span class="text-4xl mb-2">🧾</span>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">No transactions found</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Try adjusting your filters or date range</p>
                  </div>
                </td>
              </tr>
              <tr *ngFor="let transaction of paginatedTransactions()" class="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                <td class="px-3 py-2 text-xs text-gray-900 dark:text-white">
                  {{ transaction.description }}
                </td>
                <td class="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 font-mono">
                  {{ transaction.invoiceId || '-' }}
                </td>
                <td class="px-3 py-2">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                    {{ capitalizeFirst(transaction.type) }}
                  </span>
                </td>
                <td class="px-3 py-2">
                  <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                    {{ transaction.paymentMethod }}
                  </span>
                </td>
                <td class="px-3 py-2 text-right text-xs font-semibold text-gray-900 dark:text-white">
                  {{ formatPrice(transaction.amount) }}
                </td>
                <td class="px-3 py-2">
                  <span [class]="getStatusClass(transaction.status)" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium">
                    {{ capitalizeFirst(transaction.status) }}
                  </span>
                </td>
                <td class="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                  {{ formatDate(transaction.date) }}
                </td>
                <td class="px-3 py-2 text-center">
                  <button
                    (click)="viewTransaction(transaction)"
                    type="button"
                    class="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded shadow-sm hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
                    title="View Details"
                  >
                    <span class="w-3.5 h-3.5">👁️</span>
                  </button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Controls -->
        <div class="px-3 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex items-center justify-between">
          <!-- Left side: Page size selector and info -->
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2">
              <label class="text-xs text-gray-600 dark:text-gray-400">Show:</label>
              <select
                [ngModel]="pageSize()"
                (ngModelChange)="changePageSize($event)"
                class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option *ngFor="let size of pageSizeOptions" [value]="size">{{ size }}</option>
              </select>
            </div>
            <div class="text-xs text-gray-600 dark:text-gray-400">
              Showing {{ (currentPage() - 1) * pageSize() + 1 }} to {{ Math.min(currentPage() * pageSize(), filteredTransactions().length) }} of {{ filteredTransactions().length }}
            </div>
          </div>

          <!-- Right side: Page navigation -->
          <div class="flex items-center gap-2">
            <button
              (click)="previousPage()"
              [disabled]="currentPage() === 1"
              class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <span class="w-3.5 h-3.5">←</span>
              Previous
            </button>

            <span class="text-xs text-gray-600 dark:text-gray-400">
              Page {{ currentPage() }} of {{ totalPages() || 1 }}
            </span>

            <button
              (click)="nextPage()"
              [disabled]="currentPage() === totalPages() || totalPages() === 0"
              class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next
              <span class="w-3.5 h-3.5">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class TransactionHistoryComponent implements OnInit {
  private tenantService = inject(TenantService);

  // Make Math available in template
  Math = Math;

  dateRange = 'all';
  typeFilter = 'all';
  statusFilter = 'all';
  searchQuery = '';
  isLoading = signal<boolean>(false);

  allTransactions = signal<Transaction[]>([]);

  // Pagination
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);
  pageSizeOptions = [10, 25, 50, 100];

  filteredTransactions = computed(() => {
    let filtered = this.allTransactions();

    // Filter by type
    if (this.typeFilter !== 'all') {
      filtered = filtered.filter(t => t.type === this.typeFilter);
    }

    // Filter by status
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(t => t.status === this.statusFilter);
    }

    // Filter by date range
    if (this.dateRange !== 'all') {
      const now = new Date();
      let daysAgo = 0;

      switch (this.dateRange) {
        case '7days': daysAgo = 7; break;
        case '30days': daysAgo = 30; break;
        case '90days': daysAgo = 90; break;
        case '1year': daysAgo = 365; break;
      }

      if (daysAgo > 0) {
        const cutoffDate = new Date(now.getTime() - (daysAgo * 24 * 60 * 60 * 1000));
        filtered = filtered.filter(t => new Date(t.date) >= cutoffDate);
      }
    }

    // Filter by search query
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(query) ||
        t.planName?.toLowerCase().includes(query) ||
        t.invoiceId?.toLowerCase().includes(query)
      );
    }

    return filtered;
  });

  // Paginated transactions
  paginatedTransactions = computed(() => {
    const transactions = this.filteredTransactions();
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return transactions.slice(start, end);
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredTransactions().length / this.pageSize());
  });

  ngOnInit(): void {
    this.loadTransactions();
  }

  loadTransactions(): void {
    this.isLoading.set(true);

    this.tenantService.getPaymentHistory({
      dateRange: this.dateRange,
      transactionType: this.typeFilter,
      status: this.statusFilter
    }).subscribe({
      next: (response: any) => {
        const transactions = response.data.transactions.map((t: any) => ({
          id: t.id,
          date: new Date(t.date),
          description: t.description || `${t.transactionType} - ${t.planName}`,
          type: t.transactionType || 'payment',
          transactionType: t.transactionType,
          amount: parseFloat(t.amount),
          status: t.status,
          paymentMethod: t.paymentMethod || 'Credit Card',
          planName: t.planName,
          invoiceId: t.invoiceId
        }));
        this.allTransactions.set(transactions);
        this.isLoading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading payment history:', error);
        this.isLoading.set(false);
        // Fallback to empty array on error
        this.allTransactions.set([]);
      }
    });
  }

  filterTransactions(): void {
    // Reload with new filters
    this.loadTransactions();
  }

  calculateTotal(filter: 'all' | 'success' | 'failed'): number {
    let transactions = this.filteredTransactions();

    if (filter !== 'all') {
      transactions = transactions.filter(t => t.status === filter);
    }

    return transactions
      .filter(t => t.status === 'success')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  countByStatus(status: string): number {
    return this.filteredTransactions().filter(t => t.status === status).length;
  }

  clearFilters(): void {
    this.statusFilter = 'all';
    this.typeFilter = 'all';
    this.dateRange = 'all';
    this.searchQuery = '';
    this.currentPage.set(1);
    this.filterTransactions();
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

  capitalizeFirst(text: string): string {
    if (!text) return '';
    return text.charAt(0).toUpperCase() + text.slice(1).toLowerCase();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }

  viewTransaction(transaction: Transaction): void {
    console.log('View transaction:', transaction);
    alert(`Viewing transaction: ${transaction.invoiceId || transaction.id}`);
  }

  formatPrice(amount: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(amount);
  }

  formatDate(date: Date | string): string {
    return new Date(date).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  viewInvoice(transaction: Transaction): void {
    console.log('View invoice:', transaction.invoiceId);
    // TODO: Navigate to invoice view or open PDF
    alert(`Viewing invoice: ${transaction.invoiceId}`);
  }

  exportTransactions(): void {
    console.log('Exporting transactions to CSV');
    // TODO: Implement CSV export
    alert('Export functionality coming soon!');
  }
}
