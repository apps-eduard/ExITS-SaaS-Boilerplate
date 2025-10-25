import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Transaction {
  id: number;
  date: Date;
  description: string;
  type: 'subscription' | 'upgrade' | 'downgrade' | 'refund' | 'payment';
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
          class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Export CSV</span>
        </button>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <!-- Date Range Filter -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date Range
            </label>
            <select
              [(ngModel)]="dateRange"
              (change)="filterTransactions()"
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-sm text-gray-900 dark:text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
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
              class="w-full rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 px-3 py-1.5 text-sm text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400">Total Transactions</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {{ filteredTransactions().length }}
              </p>
            </div>
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/20 text-xl">
              🧾
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400">Total Spent</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {{ formatPrice(calculateTotal('all')) }}
              </p>
            </div>
            <div class="flex h-10 w-10 items-center justify-between rounded-lg bg-green-100 dark:bg-green-900/20 text-xl">
              💰
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400">Successful</p>
              <p class="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {{ countByStatus('success') }}
              </p>
            </div>
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/20 text-xl">
              ✅
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400">Failed</p>
              <p class="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">
                {{ countByStatus('failed') }}
              </p>
            </div>
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/20 text-xl">
              ❌
            </div>
          </div>
        </div>
      </div>

      <!-- Transactions Table -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Date
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Description
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Type
                </th>
                <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Payment Method
                </th>
                <th class="px-4 py-3 text-right text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Amount
                </th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Status
                </th>
                <th class="px-4 py-3 text-center text-xs font-semibold text-gray-700 dark:text-gray-300 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr
                *ngFor="let transaction of filteredTransactions()"
                class="hover:bg-gray-50 dark:hover:bg-gray-900/50 transition"
              >
                <td class="px-4 py-3 text-sm text-gray-900 dark:text-white whitespace-nowrap">
                  {{ formatDate(transaction.date) }}
                </td>
                <td class="px-4 py-3">
                  <div class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ transaction.description }}
                  </div>
                  <div *ngIf="transaction.planName" class="text-xs text-gray-500 dark:text-gray-400">
                    {{ transaction.planName }}
                  </div>
                  <div *ngIf="transaction.invoiceId" class="text-xs text-gray-500 dark:text-gray-400">
                    Invoice: {{ transaction.invoiceId }}
                  </div>
                </td>
                <td class="px-4 py-3 whitespace-nowrap">
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
                <td class="px-4 py-3 text-sm text-gray-600 dark:text-gray-400 whitespace-nowrap">
                  {{ transaction.paymentMethod }}
                </td>
                <td class="px-4 py-3 text-sm font-semibold text-right whitespace-nowrap"
                    [ngClass]="{
                      'text-gray-900 dark:text-white': transaction.type !== 'refund',
                      'text-red-600 dark:text-red-400': transaction.type === 'refund'
                    }"
                >
                  {{ transaction.type === 'refund' ? '-' : '' }}{{ formatPrice(transaction.amount) }}
                </td>
                <td class="px-4 py-3 text-center whitespace-nowrap">
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
                <td class="px-4 py-3 text-center whitespace-nowrap">
                  <button
                    *ngIf="transaction.invoiceId"
                    (click)="viewInvoice(transaction)"
                    class="text-blue-600 dark:text-blue-400 hover:text-blue-700 dark:hover:text-blue-300 text-xs font-medium"
                  >
                    View Invoice
                  </button>
                </td>
              </tr>

              <!-- Empty State -->
              <tr *ngIf="filteredTransactions().length === 0">
                <td colspan="7" class="px-4 py-12 text-center">
                  <div class="flex flex-col items-center justify-center">
                    <svg class="w-16 h-16 text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-1">No transactions found</h3>
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
  dateRange = 'all';
  typeFilter = 'all';
  statusFilter = 'all';
  searchQuery = '';

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
    // TODO: Replace with actual API call
    // For now, using mock data
    const mockTransactions: Transaction[] = [
      {
        id: 1,
        date: new Date('2025-10-25'),
        description: 'Subscription Payment - Pawnshop Pro',
        type: 'subscription',
        amount: 79.99,
        status: 'success',
        paymentMethod: 'Credit Card',
        planName: 'Pawnshop - Pro',
        invoiceId: 'INV-2025-001'
      },
      {
        id: 2,
        date: new Date('2025-10-20'),
        description: 'Subscription Payment - Money Loan Starter',
        type: 'subscription',
        amount: 29.99,
        status: 'success',
        paymentMethod: 'GCash',
        planName: 'Money Loan - Starter',
        invoiceId: 'INV-2025-002'
      },
      {
        id: 3,
        date: new Date('2025-10-15'),
        description: 'Upgrade to Pro Plan',
        type: 'upgrade',
        amount: 50.00,
        status: 'success',
        paymentMethod: 'Credit Card',
        planName: 'Platform - Pro',
        invoiceId: 'INV-2025-003'
      },
      {
        id: 4,
        date: new Date('2025-10-10'),
        description: 'Monthly Subscription Payment',
        type: 'payment',
        amount: 99.99,
        status: 'success',
        paymentMethod: 'Credit Card',
        planName: 'Enterprise Plan',
        invoiceId: 'INV-2025-004'
      },
      {
        id: 5,
        date: new Date('2025-10-05'),
        description: 'Failed Payment Attempt',
        type: 'payment',
        amount: 79.99,
        status: 'failed',
        paymentMethod: 'Credit Card',
        planName: 'Pro Plan'
      },
      {
        id: 6,
        date: new Date('2025-09-25'),
        description: 'Refund - Downgrade from Enterprise',
        type: 'refund',
        amount: 50.00,
        status: 'refunded',
        paymentMethod: 'Credit Card',
        planName: 'Enterprise Plan',
        invoiceId: 'INV-2025-005'
      }
    ];

    this.allTransactions.set(mockTransactions);
  }

  filterTransactions(): void {
    // Triggers computed recalculation
    // The actual filtering is done in the computed signal
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

  formatDate(date: Date): string {
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
