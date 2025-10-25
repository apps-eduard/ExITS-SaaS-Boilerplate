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
    <div class="p-4 space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>🧾</span>
            <span>Transaction History</span>
          </h1>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            View all your subscription payments and transactions
          </p>
        </div>
        <button
          (click)="exportTransactions()"
          class="inline-flex items-center gap-1.5 rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition shadow-sm"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Export CSV</span>
        </button>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <!-- Date Range Filter -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date Range
            </label>
            <select
              [(ngModel)]="dateRange"
              (change)="filterTransactions()"
              class="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-xs text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Time</option>
              <option value="7days">Last 7 Days</option>
              <option value="30days">Last 30 Days</option>
              <option value="90days">Last 90 Days</option>
              <option value="1year">Last Year</option>
            </select>
          </div>

          <!-- Type Filter -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Transaction Type
            </label>
            <select
              [(ngModel)]="typeFilter"
              (change)="filterTransactions()"
              class="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-xs text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Types</option>
              <option value="subscription">Subscription</option>
              <option value="upgrade">Upgrade</option>
              <option value="downgrade">Downgrade</option>
              <option value="refund">Refund</option>
              <option value="payment">Payment</option>
            </select>
          </div>

          <!-- Status Filter -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              [(ngModel)]="statusFilter"
              (change)="filterTransactions()"
              class="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-xs text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="refunded">Refunded</option>
            </select>
          </div>

          <!-- Search -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (input)="filterTransactions()"
              placeholder="Invoice ID, Plan..."
              class="w-full rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 px-2 py-1.5 text-xs text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:outline-none"
            />
          </div>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400">Total Transactions</p>
              <p class="text-xl font-bold text-gray-900 dark:text-white mt-1">
                {{ filteredTransactions().length }}
              </p>
            </div>
            <div class="flex h-8 w-8 items-center justify-center rounded bg-blue-100 dark:bg-blue-900/20 text-lg">
              🧾
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400">Total Spent</p>
              <p class="text-xl font-bold text-gray-900 dark:text-white mt-1">
                {{ formatPrice(calculateTotal('all')) }}
              </p>
            </div>
            <div class="flex h-8 w-8 items-center justify-center rounded bg-green-100 dark:bg-green-900/20 text-lg">
              💰
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400">Successful</p>
              <p class="text-xl font-bold text-green-600 dark:text-green-400 mt-1">
                {{ countByStatus('success') }}
              </p>
            </div>
            <div class="flex h-8 w-8 items-center justify-center rounded bg-green-100 dark:bg-green-900/20 text-lg">
              ✅
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 p-3">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400">Failed</p>
              <p class="text-xl font-bold text-red-600 dark:text-red-400 mt-1">
                {{ countByStatus('failed') }}
              </p>
            </div>
            <div class="flex h-8 w-8 items-center justify-center rounded bg-red-100 dark:bg-red-900/20 text-lg">
              ❌
            </div>
          </div>
        </div>
      </div>

      <!-- Transactions Table -->
      <div class="bg-white dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                  Date
                </th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                  Description
                </th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                  Type
                </th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                  Payment Method
                </th>
                <th class="px-3 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">
                  Amount
                </th>
                <th class="px-3 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300">
                  Status
                </th>
                <th class="px-3 py-2 text-center text-xs font-medium text-gray-700 dark:text-gray-300">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                *ngFor="let transaction of filteredTransactions()"
                class="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition"
              >
                <td class="px-3 py-2 text-xs text-gray-900 dark:text-white whitespace-nowrap">
                  {{ formatDate(transaction.date) }}
                </td>
                <td class="px-3 py-2">
                  <div class="text-xs font-medium text-gray-900 dark:text-white">
                    {{ transaction.description }}
                  </div>
                  <div *ngIf="transaction.planName" class="text-xs text-gray-500 dark:text-gray-400">
                    {{ transaction.planName }}
                  </div>
                  <div *ngIf="transaction.invoiceId" class="text-xs text-gray-500 dark:text-gray-400">
                    Invoice: {{ transaction.invoiceId }}
                  </div>
                </td>
                <td class="px-3 py-2 whitespace-nowrap">
                  <span
                    class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded"
                    [ngClass]="{
                      'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300': transaction.type === 'subscription',
                      'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300': transaction.type === 'upgrade',
                      'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300': transaction.type === 'downgrade',
                      'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300': transaction.type === 'refund',
                      'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300': transaction.type === 'payment'
                    }"
                  >
                    {{ transaction.type | titlecase }}
                  </span>
                </td>
                <td class="px-3 py-2 text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  {{ transaction.paymentMethod }}
                </td>
                <td class="px-3 py-2 text-xs font-medium text-right whitespace-nowrap"
                    [ngClass]="{
                      'text-gray-900 dark:text-white': transaction.type !== 'refund',
                      'text-red-600 dark:text-red-400': transaction.type === 'refund'
                    }"
                >
                  {{ transaction.type === 'refund' ? '-' : '' }}{{ formatPrice(transaction.amount) }}
                </td>
                <td class="px-3 py-2 text-center whitespace-nowrap">
                  <span
                    class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full"
                    [ngClass]="{
                      'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400': transaction.status === 'success',
                      'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400': transaction.status === 'pending',
                      'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400': transaction.status === 'failed',
                      'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400': transaction.status === 'refunded'
                    }"
                  >
                    <span *ngIf="transaction.status === 'success'">✓</span>
                    <span *ngIf="transaction.status === 'pending'">⏳</span>
                    <span *ngIf="transaction.status === 'failed'">✗</span>
                    <span *ngIf="transaction.status === 'refunded'">↩</span>
                    {{ transaction.status | titlecase }}
                  </span>
                </td>
                <td class="px-3 py-2 text-center whitespace-nowrap">
                  <button
                    *ngIf="transaction.invoiceId"
                    (click)="viewInvoice(transaction)"
                    class="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs font-medium transition"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                    </svg>
                    View
                  </button>
                </td>
              </tr>

              <!-- Empty State -->
              <tr *ngIf="filteredTransactions().length === 0">
                <td colspan="7" class="px-3 py-8 text-center">
                  <div class="flex flex-col items-center justify-center">
                    <svg class="w-12 h-12 text-gray-400 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 class="text-xs font-medium text-gray-900 dark:text-white mb-1">No transactions found</h3>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      Try adjusting your filters or date range
                    </p>
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
export class TransactionHistoryComponent implements OnInit {
  private tenantService = inject(TenantService);
  
  dateRange = 'all';
  typeFilter = 'all';
  statusFilter = 'all';
  searchQuery = '';
  isLoading = signal<boolean>(false);

  allTransactions = signal<Transaction[]>([]);

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
