import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Invoice {
  id: number;
  invoiceNumber: string;
  customer: string;
  customerEmail: string;
  plan: string;
  issueDate: string;
  dueDate: string;
  amount: number;
  currency: string;
  status: 'paid' | 'unpaid' | 'overdue' | 'pending';
  items: InvoiceItem[];
  tax: number;
  discount: number;
}

interface InvoiceItem {
  description: string;
  quantity: number;
  unitPrice: number;
  total: number;
}

@Component({
  selector: 'app-invoices',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4">
      <!-- Header with Icon -->
      <div class="mb-4">
        <div class="flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xl">💳</span>
              <h1 class="text-lg font-bold text-gray-900 dark:text-white">
                Invoices
              </h1>
            </div>
            <p class="text-xs text-gray-600 dark:text-gray-400">
              View and manage all customer invoices
            </p>
          </div>
        </div>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-4 gap-3 mb-3">
        <div class="group rounded-lg border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-3 dark:border-gray-700 dark:from-gray-800 dark:to-gray-900 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Total Invoices</p>
              <p class="text-xl font-bold text-gray-900 dark:text-white mt-1">{{ invoices().length }}</p>
            </div>
            <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <span class="text-lg">📄</span>
            </div>
          </div>
        </div>
        <div class="group rounded-lg border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-3 dark:border-gray-700 dark:from-gray-800 dark:to-gray-900 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Paid</p>
              <p class="text-xl font-bold text-green-600 dark:text-green-400 mt-1">{{ getStatusCount('paid') }}</p>
            </div>
            <div class="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <span class="text-lg">✅</span>
            </div>
          </div>
        </div>
        <div class="group rounded-lg border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-3 dark:border-gray-700 dark:from-gray-800 dark:to-gray-900 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Unpaid</p>
              <p class="text-xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{{ getStatusCount('unpaid') }}</p>
            </div>
            <div class="w-10 h-10 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <span class="text-lg">⏳</span>
            </div>
          </div>
        </div>
        <div class="group rounded-lg border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-3 dark:border-gray-700 dark:from-gray-800 dark:to-gray-900 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Overdue</p>
              <p class="text-xl font-bold text-red-600 dark:text-red-400 mt-1">{{ getStatusCount('overdue') }}</p>
            </div>
            <div class="w-10 h-10 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <span class="text-lg">⚠️</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters Card -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 mb-3">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-2">
          <!-- Search -->
          <div class="md:col-span-2">
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <div class="relative">
              <span class="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                placeholder="Search by customer or invoice number..."
                class="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <!-- Status Filter -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              [(ngModel)]="statusFilter"
              class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Status</option>
              <option value="paid">✅ Paid</option>
              <option value="unpaid">⏳ Unpaid</option>
              <option value="overdue">⚠️ Overdue</option>
              <option value="pending">⏱️ Pending</option>
            </select>
          </div>

          <!-- Date Range Filter -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Period
            </label>
            <select
              [(ngModel)]="dateRange"
              class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="all">All Time</option>
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
            </select>
          </div>
        </div>

        <!-- Action Buttons Row -->
        <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div class="flex items-center gap-2">
            <button
              (click)="clearFilters()"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition"
            >
              <span class="w-3.5 h-3.5">🔄</span>
              Clear
            </button>

            @if (getSelectedCount() > 0) {
              <div class="flex items-center gap-2">
                <span class="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  {{ getSelectedCount() }} selected
                </span>
                <button
                  (click)="clearSelection()"
                  class="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Clear
                </button>
              </div>
            }

            <select
              [(ngModel)]="pageSize"
              (change)="onPageSizeChange()"
              class="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
            >
              <option [value]="10">10 per page</option>
              <option [value]="25">25 per page</option>
              <option [value]="50">50 per page</option>
              <option [value]="100">100 per page</option>
            </select>
          </div>

          <div class="flex items-center gap-2">
            @if (getSelectedCount() > 0) {
              <button
                (click)="exportSelected()"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded shadow-sm hover:bg-green-100 dark:hover:bg-green-900/30 transition"
              >
                <span class="w-3.5 h-3.5">📥</span>
                Export Selected
              </button>
            }

            <button
              (click)="exportAll()"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded shadow-sm hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
            >
              <span class="w-3.5 h-3.5">📊</span>
              Export All
            </button>

            <span class="text-xs text-gray-600 dark:text-gray-400">
              Showing {{ paginatedInvoices().length }} of {{ filteredInvoices().length }}
            </span>
          </div>
        </div>
      </div>

      <!-- Invoices Table -->
      @if (paginatedInvoices().length === 0) {
        <div class="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <span class="text-4xl mb-3 block">💳</span>
          <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-1">No invoices found</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
            @if (searchQuery || statusFilter !== 'all' || dateRange !== 'all') {
              Try adjusting your filters
            } @else {
              Invoices will appear here when subscriptions are created
            }
          </p>
          @if (searchQuery || statusFilter !== 'all' || dateRange !== 'all') {
            <button
              (click)="clearFilters()"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <span class="w-3.5 h-3.5">🔄</span>
              Clear Filters
            </button>
          }
        </div>
      } @else {
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th class="px-3 py-2 text-left">
                    <input
                      type="checkbox"
                      [checked]="selectAll"
                      (change)="toggleSelectAll()"
                      class="w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <div class="flex items-center gap-1">
                      <span class="w-3.5 h-3.5">🔖</span>
                      Invoice #
                    </div>
                  </th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <div class="flex items-center gap-1">
                      <span class="w-3.5 h-3.5">👤</span>
                      Customer
                    </div>
                  </th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <div class="flex items-center gap-1">
                      <span class="w-3.5 h-3.5">📦</span>
                      Plan
                    </div>
                  </th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <div class="flex items-center gap-1">
                      <span class="w-3.5 h-3.5">📅</span>
                      Dates
                    </div>
                  </th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <div class="flex items-center gap-1">
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
                      <span class="w-3.5 h-3.5">⚙️</span>
                      Actions
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                @for (invoice of paginatedInvoices(); track invoice.id) {
                  <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <td class="px-3 py-2 whitespace-nowrap">
                      <input
                        type="checkbox"
                        [checked]="isSelected(invoice.id)"
                        (change)="toggleInvoice(invoice.id)"
                        class="w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap">
                      <span class="font-mono text-xs font-medium text-gray-900 dark:text-white">{{ invoice.invoiceNumber }}</span>
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap">
                      <div class="flex flex-col">
                        <span class="font-medium text-xs text-gray-900 dark:text-white">{{ invoice.customer }}</span>
                        <span class="text-xs text-gray-500 dark:text-gray-400">{{ invoice.customerEmail }}</span>
                      </div>
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap">
                      <span class="text-xs text-gray-900 dark:text-white">{{ invoice.plan }}</span>
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap">
                      <div class="flex flex-col">
                        <span class="text-xs text-gray-500 dark:text-gray-400">Issue: {{ formatDate(invoice.issueDate) }}</span>
                        <span class="text-xs text-gray-500 dark:text-gray-400">Due: {{ formatDate(invoice.dueDate) }}</span>
                      </div>
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap">
                      <span class="font-semibold text-xs text-gray-900 dark:text-white">
                        {{ invoice.currency }} {{ invoice.amount.toFixed(2) }}
                      </span>
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap">
                      <span
                        class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full"
                        [class]="getStatusClass(invoice.status)"
                      >
                        {{ getStatusIcon(invoice.status) }} {{ invoice.status }}
                      </span>
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap">
                      <div class="flex items-center gap-1">
                        <button
                          (click)="viewInvoice(invoice)"
                          class="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded shadow-sm hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
                          title="View Details"
                        >
                          <span class="w-3.5 h-3.5">👁️</span>
                        </button>
                        <button
                          (click)="downloadInvoice(invoice)"
                          class="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 rounded shadow-sm hover:bg-gray-100 dark:hover:bg-gray-700 transition"
                          title="Download PDF"
                        >
                          <span class="w-3.5 h-3.5">📥</span>
                        </button>
                        @if (invoice.status === 'unpaid' || invoice.status === 'overdue') {
                          <button
                            (click)="sendReminder(invoice)"
                            class="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded shadow-sm hover:bg-purple-100 dark:hover:bg-purple-900/30 transition"
                            title="Send Reminder"
                          >
                            <span class="w-3.5 h-3.5">✉️</span>
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <div class="px-3 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex items-center justify-between">
              <!-- Left side: Page size selector and info -->
              <div class="flex items-center gap-3">
                <div class="flex items-center gap-2">
                  <label class="text-xs text-gray-600 dark:text-gray-400">Show:</label>
                  <select
                    [(ngModel)]="pageSize"
                    (ngModelChange)="onPageSizeChange()"
                    class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                  >
                    <option [value]="10">10</option>
                    <option [value]="25">25</option>
                    <option [value]="50">50</option>
                    <option [value]="100">100</option>
                  </select>
                </div>
                <div class="text-xs text-gray-600 dark:text-gray-400">
                  Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ currentPage * pageSize > filteredInvoices().length ? filteredInvoices().length : currentPage * pageSize }} of {{ filteredInvoices().length }}
                </div>
              </div>

              <!-- Right side: Page navigation -->
              <div class="flex items-center gap-2">
                <button
                  (click)="previousPage()"
                  [disabled]="currentPage === 1"
                  class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <span class="w-3.5 h-3.5">←</span>
                  Previous
                </button>

                <span class="text-xs text-gray-600 dark:text-gray-400">
                  Page {{ currentPage }} of {{ totalPages() }}
                </span>

                <button
                  (click)="nextPage()"
                  [disabled]="currentPage >= totalPages()"
                  class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next
                  <span class="w-3.5 h-3.5">→</span>
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Invoice Details Modal -->
      @if (selectedInvoice()) {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <!-- Modal Header -->
            <div class="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 class="text-lg font-bold text-gray-900 dark:text-white">Invoice Details</h2>
              <button
                (click)="selectedInvoice.set(null)"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Modal Body -->
            <div class="p-6 space-y-6">
              @if (selectedInvoice(); as inv) {
                <!-- Header Info -->
                <div class="flex items-start justify-between">
                  <div>
                    <h3 class="text-xl font-bold text-gray-900 dark:text-white">{{ inv.invoiceNumber }}</h3>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Issued: {{ formatDate(inv.issueDate) }} • Due: {{ formatDate(inv.dueDate) }}
                    </p>
                  </div>
                  <span
                    class="px-3 py-1 text-sm font-medium rounded-full"
                    [class]="getStatusClass(inv.status)"
                  >
                    {{ getStatusIcon(inv.status) }} {{ inv.status }}
                  </span>
                </div>

                <!-- Customer Info -->
                <div class="p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                  <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-2">BILL TO</p>
                  <p class="font-semibold text-gray-900 dark:text-white">{{ inv.customer }}</p>
                  <p class="text-sm text-gray-600 dark:text-gray-400">{{ inv.customerEmail }}</p>
                </div>

                <!-- Line Items -->
                <div>
                  <p class="text-xs font-semibold text-gray-500 dark:text-gray-400 mb-3">ITEMS</p>
                  <div class="border border-gray-200 dark:border-gray-700 rounded-lg overflow-hidden">
                    <table class="w-full text-sm">
                      <thead class="bg-gray-50 dark:bg-gray-900">
                        <tr>
                          <th class="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Description</th>
                          <th class="px-4 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">Qty</th>
                          <th class="px-4 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">Unit Price</th>
                          <th class="px-4 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">Total</th>
                        </tr>
                      </thead>
                      <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                        @for (item of inv.items; track $index) {
                          <tr>
                            <td class="px-4 py-3 text-gray-900 dark:text-white">{{ item.description }}</td>
                            <td class="px-4 py-3 text-right text-gray-900 dark:text-white">{{ item.quantity }}</td>
                            <td class="px-4 py-3 text-right text-gray-900 dark:text-white">{{ inv.currency }} {{ item.unitPrice.toFixed(2) }}</td>
                            <td class="px-4 py-3 text-right font-semibold text-gray-900 dark:text-white">{{ inv.currency }} {{ item.total.toFixed(2) }}</td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                </div>

                <!-- Totals -->
                <div class="flex justify-end">
                  <div class="w-64 space-y-2">
                    <div class="flex justify-between text-sm">
                      <span class="text-gray-600 dark:text-gray-400">Subtotal:</span>
                      <span class="font-medium text-gray-900 dark:text-white">{{ inv.currency }} {{ (inv.amount - inv.tax + inv.discount).toFixed(2) }}</span>
                    </div>
                    @if (inv.discount > 0) {
                      <div class="flex justify-between text-sm text-green-600 dark:text-green-400">
                        <span>Discount:</span>
                        <span>-{{ inv.currency }} {{ inv.discount.toFixed(2) }}</span>
                      </div>
                    }
                    @if (inv.tax > 0) {
                      <div class="flex justify-between text-sm">
                        <span class="text-gray-600 dark:text-gray-400">Tax:</span>
                        <span class="font-medium text-gray-900 dark:text-white">{{ inv.currency }} {{ inv.tax.toFixed(2) }}</span>
                      </div>
                    }
                    <div class="flex justify-between text-lg font-bold pt-2 border-t border-gray-200 dark:border-gray-700">
                      <span class="text-gray-900 dark:text-white">Total:</span>
                      <span class="text-primary-600 dark:text-primary-400">{{ inv.currency }} {{ inv.amount.toFixed(2) }}</span>
                    </div>
                  </div>
                </div>
              }
            </div>

            <!-- Modal Footer -->
            <div class="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-end gap-3">
              <button
                (click)="downloadInvoice(selectedInvoice()!)"
                class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                Download PDF
              </button>
              <button
                (click)="sendReminder(selectedInvoice()!)"
                class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded hover:bg-primary-700 transition shadow-sm"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                </svg>
                Send to Customer
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class InvoicesComponent {
  invoices = signal<Invoice[]>([
    {
      id: 1,
      invoiceNumber: 'INV-2024-001',
      customer: 'Acme Corporation',
      customerEmail: 'billing@acme.com',
      plan: 'Enterprise Plan',
      issueDate: '2024-10-01',
      dueDate: '2024-10-31',
      amount: 299.99,
      currency: 'USD',
      status: 'paid',
      items: [
        { description: 'Enterprise Plan - Monthly', quantity: 1, unitPrice: 299.99, total: 299.99 }
      ],
      tax: 0,
      discount: 0
    },
    {
      id: 2,
      invoiceNumber: 'INV-2024-002',
      customer: 'TechStart Inc',
      customerEmail: 'finance@techstart.com',
      plan: 'Professional Plan',
      issueDate: '2024-10-05',
      dueDate: '2024-11-05',
      amount: 149.99,
      currency: 'USD',
      status: 'unpaid',
      items: [
        { description: 'Professional Plan - Monthly', quantity: 1, unitPrice: 149.99, total: 149.99 }
      ],
      tax: 0,
      discount: 0
    },
    {
      id: 3,
      invoiceNumber: 'INV-2024-003',
      customer: 'Startup Hub',
      customerEmail: 'admin@startuphub.io',
      plan: 'Starter Plan',
      issueDate: '2024-09-15',
      dueDate: '2024-10-15',
      amount: 49.99,
      currency: 'USD',
      status: 'overdue',
      items: [
        { description: 'Starter Plan - Monthly', quantity: 1, unitPrice: 49.99, total: 49.99 }
      ],
      tax: 0,
      discount: 0
    }
  ]);

  selectedInvoice = signal<Invoice | null>(null);
  searchQuery = '';
  statusFilter = 'all';
  dateRange = 'all';
  currentPage = 1;
  pageSize = 25;
  totalPages = signal(1);
  paginatedInvoices = signal<Invoice[]>([]);

  // Selection state
  selectedInvoices = new Set<number>();
  selectAll = false;

  filteredInvoices = computed(() => {
    let filtered = this.invoices();

    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(i =>
        i.customer.toLowerCase().includes(query) ||
        i.customerEmail.toLowerCase().includes(query) ||
        i.invoiceNumber.toLowerCase().includes(query)
      );
    }

    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(i => i.status === this.statusFilter);
    }

    // Update pagination after filtering
    setTimeout(() => this.updatePagination(filtered), 0);

    return filtered;
  });

  getStatusCount(status: string): number {
    return this.invoices().filter(i => i.status === status).length;
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      paid: '✅',
      unpaid: '⏳',
      overdue: '⚠️',
      pending: '⏱️'
    };
    return icons[status] || '❓';
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      paid: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
      unpaid: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300',
      overdue: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300',
      pending: 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300'
    };
    return classes[status] || '';
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getStartIndex(): number {
    return (this.currentPage - 1) * this.pageSize;
  }

  getEndIndex(): number {
    const end = this.currentPage * this.pageSize;
    return Math.min(end, this.filteredInvoices().length);
  }

  updatePagination(invoices: Invoice[]) {
    const total = Math.ceil(invoices.length / this.pageSize);
    this.totalPages.set(total || 1);

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedInvoices.set(invoices.slice(startIndex, endIndex));
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.updatePagination(this.filteredInvoices());
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination(this.filteredInvoices());
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages()) {
      this.currentPage++;
      this.updatePagination(this.filteredInvoices());
    }
  }

  // Selection methods
  toggleSelectAll() {
    this.selectAll = !this.selectAll;
    if (this.selectAll) {
      this.paginatedInvoices().forEach(invoice => {
        this.selectedInvoices.add(invoice.id);
      });
    } else {
      this.selectedInvoices.clear();
    }
  }

  toggleInvoice(id: number) {
    if (this.selectedInvoices.has(id)) {
      this.selectedInvoices.delete(id);
      this.selectAll = false;
    } else {
      this.selectedInvoices.add(id);
      const allSelected = this.paginatedInvoices().every(i => this.selectedInvoices.has(i.id));
      this.selectAll = allSelected;
    }
  }

  isSelected(id: number): boolean {
    return this.selectedInvoices.has(id);
  }

  getSelectedCount(): number {
    return this.selectedInvoices.size;
  }

  clearSelection() {
    this.selectedInvoices.clear();
    this.selectAll = false;
  }

  clearFilters() {
    this.searchQuery = '';
    this.statusFilter = 'all';
    this.dateRange = 'all';
    this.currentPage = 1;
    this.updatePagination(this.filteredInvoices());
  }

  // Export methods
  exportSelected() {
    if (this.selectedInvoices.size === 0) {
      return;
    }

    const selectedData = this.invoices().filter(i => this.selectedInvoices.has(i.id));
    this.exportToCSV(selectedData, 'selected-invoices.csv');
  }

  exportAll() {
    const data = this.filteredInvoices();
    if (data.length === 0) {
      return;
    }
    this.exportToCSV(data, 'all-invoices.csv');
  }

  exportToCSV(data: Invoice[], filename: string) {
    const headers = ['Invoice #', 'Customer', 'Email', 'Plan', 'Issue Date', 'Due Date', 'Amount', 'Status'];

    const csvRows = [
      headers.join(','),
      ...data.map(invoice => [
        invoice.invoiceNumber,
        invoice.customer,
        invoice.customerEmail,
        invoice.plan,
        invoice.issueDate,
        invoice.dueDate,
        `${invoice.currency} ${invoice.amount.toFixed(2)}`,
        invoice.status
      ].map(field => `"${field}"`).join(','))
    ];

    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  viewInvoice(invoice: Invoice) {
    this.selectedInvoice.set(invoice);
  }

  downloadInvoice(invoice: Invoice) {
    alert(`Downloading PDF for ${invoice.invoiceNumber}...`);
  }

  sendReminder(invoice: Invoice) {
    alert(`Sending payment reminder to ${invoice.customerEmail}...`);
  }
}
