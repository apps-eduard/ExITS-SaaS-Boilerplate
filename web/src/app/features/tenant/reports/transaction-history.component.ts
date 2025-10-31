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
  status: 'completed' | 'success' | 'pending' | 'failed' | 'refunded';
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
      <!-- Page Header -->
      <div class="flex items-center gap-2">
        <span class="text-3xl">🧾</span>
        <div>
          <h2 class="text-lg font-bold text-gray-900 dark:text-white">Transaction History</h2>
          <p class="text-xs text-gray-500 dark:text-gray-400">View all your subscription payments and transactions</p>
        </div>
      </div>

      <!-- Summary Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <!-- Total Card -->
        <div class="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400">Total</p>
              <p class="text-lg font-bold text-gray-900 dark:text-white">{{ filteredTransactions().length }}</p>
            </div>
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <span class="text-base">📊</span>
            </div>
          </div>
        </div>

        <!-- Completed Card -->
        <div class="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400">Completed</p>
              <p class="text-lg font-bold text-green-600 dark:text-green-400">{{ countByStatus('completed') }}</p>
            </div>
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <span class="text-base">✅</span>
            </div>
          </div>
        </div>

        <!-- Pending Card -->
        <div class="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400">Pending</p>
              <p class="text-lg font-bold text-yellow-600 dark:text-yellow-400">{{ countByStatus('pending') }}</p>
            </div>
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
              <span class="text-base">⏳</span>
            </div>
          </div>
        </div>

        <!-- Failed Card -->
        <div class="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400">Failed</p>
              <p class="text-lg font-bold text-red-600 dark:text-red-400">{{ countByStatus('failed') }}</p>
            </div>
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <span class="text-base">❌</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div class="flex flex-col sm:flex-row items-start sm:items-end gap-3">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 flex-1 w-full sm:w-auto">
            <!-- Search -->
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Search
              </label>
              <div class="relative">
                <span class="absolute left-2 top-1/2 -translate-y-1/2 text-sm">🔍</span>
                <input
                  type="text"
                  [ngModel]="searchQuery()"
                  (ngModelChange)="searchQuery.set($event)"
                  placeholder="Search transactions..."
                  class="w-full pl-7 pr-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>

            <!-- Status Filter -->
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                [ngModel]="statusFilter()"
                (ngModelChange)="statusFilter.set($event)"
                class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Status</option>
                <option value="completed">Completed</option>
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
                [ngModel]="typeFilter()"
                (ngModelChange)="typeFilter.set($event)"
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
                [ngModel]="dateRange()"
                (ngModelChange)="onDateRangeChange($event)"
                class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="all">All Time</option>
                <option value="7days">Last 7 Days</option>
                <option value="30days">Last 30 Days</option>
                <option value="90days">Last 90 Days</option>
                <option value="custom">Custom Range</option>
              </select>
            </div>

            <!-- Custom Date Range -->
            <div *ngIf="dateRange() === 'custom'" class="flex flex-col sm:flex-row gap-2">
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  From
                </label>
                <input
                  type="date"
                  [ngModel]="customDateFrom()"
                  (ngModelChange)="customDateFrom.set($event)"
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  To
                </label>
                <input
                  type="date"
                  [ngModel]="customDateTo()"
                  (ngModelChange)="customDateTo.set($event)"
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
            </div>
          </div>

          <!-- Controls Group (Clear, Page Size, Pagination) -->
          <div class="flex items-center gap-2 w-full sm:w-auto justify-end">
            <!-- Clear Filters Button -->
            <button
              (click)="clearFilters()"
              type="button"
              class="h-[30px] px-2.5 text-xs font-medium rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition flex items-center justify-center"
              title="Clear Filters"
            >
              <span class="text-sm">🔄</span>
            </button>

            <!-- Page Size Selector -->
            <select
              [ngModel]="pageSize()"
              (ngModelChange)="changePageSize($event)"
              class="h-[30px] px-2 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              title="Items per page"
            >
              <option *ngFor="let size of pageSizeOptions" [value]="size">{{ size }}</option>
            </select>

            <!-- Pagination Controls Group -->
            <div class="flex items-center gap-2">
              <!-- Previous Button -->
              <button
                (click)="previousPage()"
                [disabled]="currentPage() === 1"
                type="button"
                class="h-[30px] px-2.5 text-xs font-medium rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center"
                title="Previous Page"
              >
                <span class="text-sm">←</span>
              </button>

              <!-- Page Info -->
              <span class="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
                Page {{ currentPage() }} of {{ totalPages() || 1 }}
              </span>

              <!-- Next Button -->
              <button
                (click)="nextPage()"
                [disabled]="currentPage() === totalPages() || totalPages() === 0"
                type="button"
                class="h-[30px] px-2.5 text-xs font-medium rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center"
                title="Next Page"
              >
                <span class="text-sm">→</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <!-- Bulk Actions Bar (shown when items selected) -->
        <div *ngIf="selectedTransactions().size > 0" class="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-blue-200 dark:border-blue-800 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
          <span class="text-sm text-blue-700 dark:text-blue-300">
            {{ selectedTransactions().size }} item(s) selected
          </span>
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              class="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition"
              (click)="clearSelection()"
              title="Clear Selection"
            >
              <span class="w-3.5 h-3.5">✖️</span>
              <span class="hidden sm:inline">Clear</span>
            </button>
            <button
              (click)="exportTransactions('csv')"
              type="button"
              class="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition"
              title="Export CSV"
            >
              <span class="w-3.5 h-3.5">📊</span>
              <span class="hidden sm:inline">CSV</span>
            </button>
            <button
              (click)="exportTransactions('excel')"
              type="button"
              class="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition"
              title="Export Excel"
            >
              <span class="w-3.5 h-3.5">📗</span>
              <span class="hidden sm:inline">Excel</span>
            </button>
            <button
              (click)="exportTransactions('pdf')"
              type="button"
              class="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition"
              title="Export PDF"
            >
              <span class="w-3.5 h-3.5">📕</span>
              <span class="hidden sm:inline">PDF</span>
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <!-- Checkbox Column -->
                <th class="px-3 py-2 text-left w-10">
                  <input
                    type="checkbox"
                    [checked]="selectAll()"
                    (change)="toggleSelectAll()"
                    class="w-4 h-4 accent-green-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-white cursor-pointer transition-transform hover:scale-110"
                  />
                </th>
                <!-- Row Number Column -->
                <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-16">
                  <div class="flex items-center justify-center gap-1 group">
                    <span class="w-3.5 h-3.5 transition-transform group-hover:scale-110">#</span>
                  </div>
                </th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <button
                    (click)="sortBy('description')"
                    class="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-100 transition-all duration-200 hover:translate-x-0.5 group"
                    type="button"
                  >
                    <span class="w-3.5 h-3.5 transition-transform group-hover:scale-110">📝</span>
                    <span>Description</span>
                    <svg *ngIf="sortColumn() === 'description'" class="w-3 h-3 transition-transform duration-300" [class.rotate-180]="sortDirection() === 'desc'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                </th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <div class="flex items-center gap-1 group">
                    <span class="w-3.5 h-3.5 transition-transform group-hover:scale-110">🔖</span>
                    <span class="transition-colors">Invoice</span>
                  </div>
                </th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <button
                    (click)="sortBy('type')"
                    class="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-100 transition-all duration-200 hover:translate-x-0.5 group"
                    type="button"
                  >
                    <span class="w-3.5 h-3.5 transition-transform group-hover:scale-110">🏷️</span>
                    <span>Type</span>
                    <svg *ngIf="sortColumn() === 'type'" class="w-3 h-3 transition-transform duration-300" [class.rotate-180]="sortDirection() === 'desc'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                </th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <div class="flex items-center gap-1 group">
                    <span class="w-3.5 h-3.5 transition-transform group-hover:scale-110">💳</span>
                    <span class="transition-colors">Payment</span>
                  </div>
                </th>
                <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <button
                    (click)="sortBy('amount')"
                    class="flex items-center justify-end gap-1 hover:text-gray-700 dark:hover:text-gray-100 transition-all duration-200 hover:translate-x-0.5 w-full group"
                    type="button"
                  >
                    <span class="w-3.5 h-3.5 transition-transform group-hover:scale-110">💰</span>
                    <span>Amount</span>
                    <svg *ngIf="sortColumn() === 'amount'" class="w-3 h-3 transition-transform duration-300" [class.rotate-180]="sortDirection() === 'desc'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                </th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <button
                    (click)="sortBy('status')"
                    class="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-100 transition-all duration-200 hover:translate-x-0.5 group"
                    type="button"
                  >
                    <span class="w-3.5 h-3.5 transition-transform group-hover:scale-110">🔘</span>
                    <span>Status</span>
                    <svg *ngIf="sortColumn() === 'status'" class="w-3 h-3 transition-transform duration-300" [class.rotate-180]="sortDirection() === 'desc'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                </th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <button
                    (click)="sortBy('date')"
                    class="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-100 transition-all duration-200 hover:translate-x-0.5 group"
                    type="button"
                  >
                    <span class="w-3.5 h-3.5 transition-transform group-hover:scale-110">📅</span>
                    <span>Date</span>
                    <svg *ngIf="sortColumn() === 'date'" class="w-3 h-3 transition-transform duration-300" [class.rotate-180]="sortDirection() === 'desc'" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                </th>
                <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <div class="flex items-center justify-center gap-1 group">
                    <span class="w-3.5 h-3.5 transition-transform group-hover:scale-110">⚙️</span>
                    <span class="transition-colors">Action</span>
                  </div>
                </th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <!-- Loading Skeleton -->
              <ng-container *ngIf="isLoading()">
                <tr *ngFor="let i of [1,2,3,4,5]" class="animate-pulse">
                  <td class="px-3 py-3"><div class="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                  <td class="px-3 py-3"><div class="h-4 w-8 bg-gray-200 dark:bg-gray-700 rounded mx-auto"></div></td>
                  <td class="px-3 py-3"><div class="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                  <td class="px-3 py-3"><div class="h-4 w-24 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                  <td class="px-3 py-3"><div class="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                  <td class="px-3 py-3"><div class="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                  <td class="px-3 py-3"><div class="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                  <td class="px-3 py-3"><div class="h-4 w-20 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                  <td class="px-3 py-3"><div class="h-4 w-16 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                  <td class="px-3 py-3"><div class="h-4 w-12 bg-gray-200 dark:bg-gray-700 rounded"></div></td>
                </tr>
              </ng-container>

              <!-- Empty State -->
              <tr *ngIf="!isLoading() && paginatedTransactions().length === 0">
                <td colspan="10" class="px-3 py-12 text-center">
                  <div class="flex flex-col items-center gap-3">
                    <div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <span class="text-4xl">🔍</span>
                    </div>
                    <div>
                      <p class="text-sm font-medium text-gray-900 dark:text-white">No transactions found</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {{ searchQuery() || statusFilter() !== 'all' || typeFilter() !== 'all' || dateRange() !== 'all' 
                          ? 'Try adjusting your filters or search query' 
                          : 'No transactions available yet' }}
                      </p>
                    </div>
                    <button
                      *ngIf="searchQuery() || statusFilter() !== 'all' || typeFilter() !== 'all' || dateRange() !== 'all'"
                      (click)="clearFilters()"
                      type="button"
                      class="mt-2 px-4 py-2 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
                    >
                      Clear All Filters
                    </button>
                  </div>
                </td>
              </tr>

              <!-- Data Rows -->
              <tr 
                *ngFor="let transaction of paginatedTransactions(); let i = index" 
                [class]="isSelected(transaction.id) 
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500 dark:border-l-blue-400' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'"
                class="transition-all duration-200"
              >
                <!-- Checkbox -->
                <td class="px-3 py-2">
                  <input
                    type="checkbox"
                    [checked]="isSelected(transaction.id)"
                    (change)="toggleSelection(transaction.id)"
                    class="w-4 h-4 accent-green-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-white"
                  />
                </td>
                <!-- Row Number -->
                <td class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                  {{ (currentPage() - 1) * pageSize() + i + 1 }}
                </td>
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
                  <span [class]="getPaymentMethodClass(transaction.paymentMethod)" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium">
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
                  <div class="flex items-center justify-center gap-1">
                    <button
                      (click)="viewTransaction(transaction)"
                      type="button"
                      class="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded shadow-sm hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200 hover:scale-105 hover:shadow-md group"
                      title="View Details"
                    >
                      <span class="w-3.5 h-3.5 transition-transform group-hover:scale-110">👁️</span>
                    </button>
                    <button
                      (click)="deleteTransaction(transaction)"
                      type="button"
                      class="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded shadow-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200 hover:scale-105 hover:shadow-md group"
                      title="Delete Transaction"
                    >
                      <span class="w-3.5 h-3.5 transition-transform group-hover:scale-110">🗑️</span>
                    </button>
                  </div>
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

  dateRange = signal<string>('all');
  customDateFrom = signal<string>('');
  customDateTo = signal<string>('');
  typeFilter = signal<string>('all');
  statusFilter = signal<string>('all');
  searchQuery = signal<string>('');
  isLoading = signal<boolean>(false);

  // Sorting
  sortColumn = signal<'date' | 'status' | 'amount' | 'type' | 'description' | null>(null);
  sortDirection = signal<'asc' | 'desc'>('desc');

  // Bulk actions
  selectedTransactions = signal<Set<number>>(new Set());
  selectAll = signal<boolean>(false);

  allTransactions = signal<Transaction[]>([]);

  // Pagination
  currentPage = signal<number>(1);
  pageSize = signal<number>(10);
  pageSizeOptions = [10, 25, 50, 100];

  filteredTransactions = computed(() => {
    let filtered = this.allTransactions();

    // Filter by type
    if (this.typeFilter() !== 'all') {
      filtered = filtered.filter(t => t.type === this.typeFilter());
    }

    // Filter by status
    if (this.statusFilter() !== 'all') {
      filtered = filtered.filter(t => t.status === this.statusFilter());
    }

    // Filter by date range
    if (this.dateRange() !== 'all') {
      const now = new Date();
      
      if (this.dateRange() === 'custom') {
        // Custom date range filtering
        if (this.customDateFrom()) {
          const fromDate = new Date(this.customDateFrom());
          fromDate.setHours(0, 0, 0, 0);
          filtered = filtered.filter(t => new Date(t.date) >= fromDate);
        }
        
        if (this.customDateTo()) {
          const toDate = new Date(this.customDateTo());
          toDate.setHours(23, 59, 59, 999);
          filtered = filtered.filter(t => new Date(t.date) <= toDate);
        }
      } else {
        // Preset date range filtering
        let daysAgo = 0;

        switch (this.dateRange()) {
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
    }

    // Filter by search query
    if (this.searchQuery().trim()) {
      const query = this.searchQuery().toLowerCase();
      filtered = filtered.filter(t =>
        t.description.toLowerCase().includes(query) ||
        t.planName?.toLowerCase().includes(query) ||
        t.invoiceId?.toLowerCase().includes(query)
      );
    }

    // Apply sorting
    const sortCol = this.sortColumn();
    const sortDir = this.sortDirection();
    
    if (sortCol) {
      filtered = [...filtered].sort((a, b) => {
        let compareResult = 0;
        
        if (sortCol === 'date') {
          const dateA = new Date(a.date).getTime();
          const dateB = new Date(b.date).getTime();
          compareResult = dateA - dateB;
        } else if (sortCol === 'status') {
          compareResult = a.status.localeCompare(b.status);
        } else if (sortCol === 'amount') {
          compareResult = a.amount - b.amount;
        } else if (sortCol === 'type') {
          compareResult = a.type.localeCompare(b.type);
        } else if (sortCol === 'description') {
          compareResult = a.description.localeCompare(b.description);
        }
        
        return sortDir === 'asc' ? compareResult : -compareResult;
      });
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

    // Load all transactions - filtering will be done client-side
    this.tenantService.getPaymentHistory({}).subscribe({
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

  onDateRangeChange(value: string): void {
    this.dateRange.set(value);
    // Clear custom dates when switching to preset ranges
    if (value !== 'custom') {
      this.customDateFrom.set('');
      this.customDateTo.set('');
    }
    // Reset to first page when date range changes
    this.currentPage.set(1);
  }

  calculateTotal(filter: 'all' | 'completed' | 'success' | 'failed'): number {
    let transactions = this.filteredTransactions();

    if (filter !== 'all') {
      transactions = transactions.filter(t => t.status === filter);
    }

    return transactions
      .filter(t => t.status === 'completed' || t.status === 'success')
      .reduce((sum, t) => sum + t.amount, 0);
  }

  countByStatus(status: string): number {
    return this.filteredTransactions().filter(t => t.status === status).length;
  }

  clearFilters(): void {
    this.statusFilter.set('all');
    this.typeFilter.set('all');
    this.dateRange.set('all');
    this.customDateFrom.set('');
    this.customDateTo.set('');
    this.searchQuery.set('');
    this.currentPage.set(1);
  }

  // Bulk selection methods
  toggleSelectAll(): void {
    const newSelectAll = !this.selectAll();
    this.selectAll.set(newSelectAll);
    
    if (newSelectAll) {
      const allIds = new Set(this.paginatedTransactions().map(t => t.id));
      this.selectedTransactions.set(allIds);
    } else {
      this.selectedTransactions.set(new Set());
    }
  }

  toggleSelection(id: number): void {
    const selected = new Set(this.selectedTransactions());
    if (selected.has(id)) {
      selected.delete(id);
    } else {
      selected.add(id);
    }
    this.selectedTransactions.set(selected);
    this.selectAll.set(selected.size === this.paginatedTransactions().length && this.paginatedTransactions().length > 0);
  }

  isSelected(id: number): boolean {
    return this.selectedTransactions().has(id);
  }

  clearSelection(): void {
    this.selectedTransactions.set(new Set());
    this.selectAll.set(false);
  }

  // Record count helpers
  getRecordRangeStart(): number {
    if (this.filteredTransactions().length === 0) return 0;
    return (this.currentPage() - 1) * this.pageSize() + 1;
  }

  getRecordRangeEnd(): number {
    return Math.min(this.currentPage() * this.pageSize(), this.filteredTransactions().length);
  }

  sortBy(column: 'date' | 'status' | 'amount' | 'type' | 'description'): void {
    if (this.sortColumn() === column) {
      // Toggle direction if clicking the same column
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      // Set new column and default to descending
      this.sortColumn.set(column);
      this.sortDirection.set('desc');
    }
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
      case 'completed':
      case 'success':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
      case 'failed':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'refunded':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }

  getPaymentMethodClass(method: string): string {
    const lowerMethod = method.toLowerCase();
    
    if (lowerMethod.includes('credit') || lowerMethod.includes('card')) {
      return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
    } else if (lowerMethod.includes('paypal')) {
      return 'bg-indigo-100 text-indigo-800 dark:bg-indigo-900/30 dark:text-indigo-400';
    } else if (lowerMethod.includes('bank') || lowerMethod.includes('transfer')) {
      return 'bg-teal-100 text-teal-800 dark:bg-teal-900/30 dark:text-teal-400';
    } else if (lowerMethod.includes('gcash')) {
      return 'bg-sky-100 text-sky-800 dark:bg-sky-900/30 dark:text-sky-400';
    } else if (lowerMethod.includes('maya') || lowerMethod.includes('paymaya')) {
      return 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900/30 dark:text-emerald-400';
    } else {
      return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }

  viewTransaction(transaction: Transaction): void {
    console.log('View transaction:', transaction);
    alert(`Viewing transaction: ${transaction.invoiceId || transaction.id}`);
  }

  deleteTransaction(transaction: Transaction): void {
    if (confirm(`Are you sure you want to delete transaction ${transaction.invoiceId || transaction.id}?\n\nThis action cannot be undone.`)) {
      console.log('Deleting transaction:', transaction);
      
      // Remove from the transactions array
      this.allTransactions.update((txns: Transaction[]) => txns.filter((t: Transaction) => t.id !== transaction.id));
      
      // If the transaction was selected, remove it from selection
      if (this.isSelected(transaction.id)) {
        this.toggleSelection(transaction.id);
      }
      
      // Show success message
      alert(`Transaction ${transaction.invoiceId || transaction.id} has been deleted successfully.`);
      
      // TODO: Make API call to delete from backend
      // this.tenantService.deleteTransaction(transaction.id).subscribe({
      //   next: () => {
      //     console.log('Transaction deleted from server');
      //   },
      //   error: (error) => {
      //     console.error('Failed to delete transaction:', error);
      //   }
      // });
    }
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

  exportTransactions(format: 'csv' | 'excel' | 'pdf'): void {
    console.log(`Exporting transactions to ${format.toUpperCase()}`);
    // TODO: Implement export functionality
    alert(`Export to ${format.toUpperCase()} functionality coming soon!`);
  }
}
