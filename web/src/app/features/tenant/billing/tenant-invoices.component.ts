import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClientModule } from '@angular/common/http';
import { RBACService } from '../../../core/services/rbac.service';
import { ToastService } from '../../../core/services/toast.service';
import { InvoiceService, Invoice } from '../../../core/services/invoice.service';

@Component({
  selector: 'app-tenant-invoices',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule, HttpClientModule],
  template: `
    <div class="p-6 space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <div class="flex items-center gap-2">
            <span class="w-6 h-6">💳</span>
            <h1 class="text-lg font-bold text-gray-900 dark:text-white">Invoices</h1>
          </div>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            View and download your billing invoices
          </p>
        </div>
        <a
          routerLink="/tenant/billing"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition"
        >
          <span class="w-3.5 h-3.5">💰</span>
          <span>Back to Billing</span>
        </a>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div class="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition">
          <div class="flex items-center gap-2">
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <span class="text-base">📄</span>
            </div>
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400">Total Invoices</p>
              <p class="text-lg font-bold text-gray-900 dark:text-white">{{ getTotalCount() }}</p>
            </div>
          </div>
        </div>

        <div class="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition">
          <div class="flex items-center gap-2">
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <span class="text-base">✅</span>
            </div>
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400">Paid</p>
              <p class="text-lg font-bold text-green-600 dark:text-green-400">{{ getStatusCount('paid') }}</p>
            </div>
          </div>
        </div>

        <div class="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition">
          <div class="flex items-center gap-2">
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30">
              <span class="text-base">⏳</span>
            </div>
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400">Pending</p>
              <p class="text-lg font-bold text-yellow-600 dark:text-yellow-400">{{ getStatusCount('pending') }}</p>
            </div>
          </div>
        </div>

        <div class="bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition">
          <div class="flex items-center gap-2">
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <span class="text-base">⚠️</span>
            </div>
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400">Overdue</p>
              <p class="text-lg font-bold text-red-600 dark:text-red-400">{{ getStatusCount('overdue') }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div class="flex flex-wrap items-center gap-3">
          <div class="flex items-center gap-2">
            <span class="text-xs font-medium text-gray-700 dark:text-gray-300">Status:</span>
            <select
              [(ngModel)]="selectedStatus"
              (ngModelChange)="onFilterChange()"
              class="rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-xs font-medium text-gray-700 dark:text-gray-300">Year:</span>
            <select
              [(ngModel)]="selectedYear"
              (ngModelChange)="onFilterChange()"
              class="rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white"
            >
              <option value="all">All Years</option>
              <option value="2025">2025</option>
              <option value="2024">2024</option>
              <option value="2023">2023</option>
              <option value="2022">2022</option>
            </select>
          </div>

          <div class="flex-1"></div>

          <div class="relative">
            <input
              type="text"
              [(ngModel)]="searchTerm"
              (ngModelChange)="onSearchChange()"
              placeholder="Search invoices..."
              class="rounded border border-gray-300 bg-white pl-8 pr-3 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700 dark:text-white w-56"
            />
            <span class="absolute left-2 top-1/2 -translate-y-1/2 w-3.5 h-3.5">🔍</span>
          </div>
        </div>
      </div>

      <!-- Invoices Table -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
      <!-- Invoices Table -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <div class="flex items-center gap-1">
                    <span class="w-3.5 h-3.5">🔖</span>
                    Invoice
                  </div>
                </th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <div class="flex items-center gap-1">
                    <span class="w-3.5 h-3.5">📝</span>
                    Description
                  </div>
                </th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <div class="flex items-center gap-1">
                    <span class="w-3.5 h-3.5">📅</span>
                    Date
                  </div>
                </th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                  <div class="flex items-center gap-1">
                    <span class="w-3.5 h-3.5">⏰</span>
                    Due Date
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
              <tr *ngFor="let invoice of filteredInvoices()" class="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                <td class="px-3 py-2 whitespace-nowrap">
                  <div class="flex flex-col">
                    <span class="font-mono text-xs font-medium text-gray-900 dark:text-white">
                      {{ invoice.invoiceNumber }}
                    </span>
                    <span class="text-xs text-gray-500 dark:text-gray-400">
                      ID: {{ invoice.id }}
                    </span>
                  </div>
                </td>
                <td class="px-3 py-2">
                  <span class="text-xs text-gray-900 dark:text-white max-w-xs truncate block">
                    {{ invoice.description }}
                  </span>
                </td>
                <td class="px-3 py-2 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400">
                  {{ formatDate(invoice.date) }}
                </td>
                <td class="px-3 py-2 whitespace-nowrap text-xs text-gray-600 dark:text-gray-400">
                  {{ formatDate(invoice.dueDate) }}
                </td>
                <td class="px-3 py-2 whitespace-nowrap">
                  <span class="text-xs font-semibold text-gray-900 dark:text-white">
                    {{ formatCurrency(invoice.amount) }}
                  </span>
                </td>
                <td class="px-3 py-2 whitespace-nowrap">
                  <span class="px-2 inline-flex text-xs leading-5 font-semibold rounded-full" [class]="getStatusBadgeClass(invoice.status)">
                    {{ invoice.status | uppercase }}
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
                      class="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded shadow-sm hover:bg-green-100 dark:hover:bg-green-900/30 transition"
                      title="Download PDF"
                    >
                      <span class="w-3.5 h-3.5">📥</span>
                    </button>
                    <button
                      *ngIf="invoice.status === 'pending' || invoice.status === 'overdue'"
                      (click)="payInvoice(invoice)"
                      class="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded shadow-sm hover:bg-purple-100 dark:hover:bg-purple-900/30 transition"
                      title="Pay Now"
                    >
                      <span class="w-3.5 h-3.5">💳</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div *ngIf="filteredInvoices().length === 0" class="text-center py-12">
          <span class="text-4xl mb-3 block">💳</span>
          <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-1">No invoices found</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ searchTerm || selectedStatus !== 'all' || selectedYear !== 'all'
              ? 'Try adjusting your filters'
              : 'Your invoices will appear here' }}
          </p>
        </div>
      </div>

      <!-- Pagination -->
      <div *ngIf="filteredInvoices().length > 0" class="flex items-center justify-between">
        <p class="text-xs text-gray-600 dark:text-gray-400">
          Showing <span class="font-medium">{{ filteredInvoices().length }}</span> of <span class="font-medium">{{ allInvoices().length }}</span> invoices
        </p>
        <div class="flex gap-2">
          <button
            class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled
          >
            <span class="w-3.5 h-3.5">←</span>
            Previous
          </button>
          <button
            class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded shadow-sm hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled
          >
            Next
            <span class="w-3.5 h-3.5">→</span>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class TenantInvoicesComponent implements OnInit {
  private rbacService = inject(RBACService);
  private toastService = inject(ToastService);
  private invoiceService = inject(InvoiceService);

  searchTerm = '';
  selectedStatus = 'all';
  selectedYear = 'all';

  private searchDebounceTimer: any = null;
  isLoading = signal(false);
  totalStats = signal({ total: 0, paid: 0, pending: 0, overdue: 0 });

  allInvoices = signal<Invoice[]>([]);
  filteredInvoices = signal<Invoice[]>([]);

  canViewBilling = computed(() =>
    this.rbacService.can('tenant-billing:read')
  );

  ngOnInit(): void {
    console.log('📄 TenantInvoicesComponent initialized');
    this.loadInvoices();
    this.loadStats();
  }

  loadInvoices(): void {
    this.isLoading.set(true);

    const filters = {
      status: this.selectedStatus !== 'all' ? this.selectedStatus : undefined,
      year: this.selectedYear !== 'all' ? this.selectedYear : undefined,
      limit: 100
    };

    this.invoiceService.getInvoices(filters).subscribe({
      next: (response) => {
        this.allInvoices.set(response.invoices);
        this.applyFilters();
        this.isLoading.set(false);
        console.log(`✅ Loaded ${response.invoices.length} invoices`);
      },
      error: (error) => {
        console.error('❌ Error loading invoices:', error);
        this.toastService.error('Failed to load invoices');
        this.isLoading.set(false);
        this.allInvoices.set([]);
        this.filteredInvoices.set([]);
      }
    });
  }

  loadStats(): void {
    this.invoiceService.getInvoiceStats().subscribe({
      next: (stats) => {
        this.totalStats.set(stats);
        console.log('📊 Invoice stats loaded:', stats);
      },
      error: (error) => {
        console.error('❌ Error loading stats:', error);
      }
    });
  }

  onSearchChange(): void {
    // Clear existing timer
    if (this.searchDebounceTimer) {
      clearTimeout(this.searchDebounceTimer);
    }

    // Set new timer - apply filters after 300ms of no typing
    this.searchDebounceTimer = setTimeout(() => {
      this.loadInvoices(); // Reload from server with search
    }, 300);
  }

  onFilterChange(): void {
    this.loadInvoices(); // Reload from server with new filters
  }  applyFilters(): void {
    let filtered = this.allInvoices();

    // Filter by status
    if (this.selectedStatus !== 'all') {
      filtered = filtered.filter(inv => inv.status === this.selectedStatus);
    }

    // Filter by year
    if (this.selectedYear !== 'all') {
      filtered = filtered.filter(inv => inv.date.startsWith(this.selectedYear));
    }

    // Filter by search term
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      filtered = filtered.filter(inv =>
        inv.invoiceNumber.toLowerCase().includes(term) ||
        inv.description.toLowerCase().includes(term) ||
        inv.id.toLowerCase().includes(term)
      );
    }

    this.filteredInvoices.set(filtered);
  }

  getTotalCount(): number {
    return this.totalStats().total;
  }

  getStatusCount(status: string): number {
    const stats = this.totalStats();
    if (status === 'total' || status === 'paid' || status === 'pending' || status === 'overdue') {
      return stats[status] || 0;
    }
    return 0;
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      'paid': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'pending': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      'overdue': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      'cancelled': 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
    };
    return classes[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
  }

  viewInvoice(invoice: Invoice): void {
    console.log('👁️ View invoice:', invoice.invoiceNumber);
    this.toastService.info(`Viewing ${invoice.invoiceNumber}`);
    // TODO: Open invoice viewer modal or navigate to detail page
  }

  downloadInvoice(invoice: Invoice): void {
    console.log('⬇️ Download invoice:', invoice.invoiceNumber);
    this.toastService.success(`Downloading ${invoice.invoiceNumber}`);
    // TODO: Implement PDF download
  }

  payInvoice(invoice: Invoice): void {
    console.log('💳 Pay invoice:', invoice.invoiceNumber);
    this.toastService.info('Payment processing will be available soon!');
    // TODO: Open payment modal
  }
}
