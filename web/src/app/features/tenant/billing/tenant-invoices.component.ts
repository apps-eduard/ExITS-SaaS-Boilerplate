import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RBACService } from '../../../core/services/rbac.service';
import { ToastService } from '../../../core/services/toast.service';

interface Invoice {
  id: string;
  invoiceNumber: string;
  date: string;
  dueDate: string;
  amount: number;
  status: 'paid' | 'pending' | 'overdue' | 'cancelled';
  description: string;
  pdfUrl?: string;
}

@Component({
  selector: 'app-tenant-invoices',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="p-6 space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">📄 Invoices</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            View and download your billing invoices
          </p>
        </div>
        <a
          routerLink="/tenant/billing"
          class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition"
        >
          <span>💰</span>
          <span>Back to Billing</span>
        </a>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <span class="text-xl">📊</span>
            </div>
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400">Total Invoices</p>
              <p class="text-xl font-bold text-gray-900 dark:text-white">{{ getTotalCount() }}</p>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
              <span class="text-xl">✅</span>
            </div>
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400">Paid</p>
              <p class="text-xl font-bold text-green-600 dark:text-green-400">{{ getStatusCount('paid') }}</p>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-yellow-100 dark:bg-yellow-900/30">
              <span class="text-xl">⏳</span>
            </div>
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400">Pending</p>
              <p class="text-xl font-bold text-yellow-600 dark:text-yellow-400">{{ getStatusCount('pending') }}</p>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <div class="flex items-center gap-3">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
              <span class="text-xl">⚠️</span>
            </div>
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400">Overdue</p>
              <p class="text-xl font-bold text-red-600 dark:text-red-400">{{ getStatusCount('overdue') }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <div class="flex flex-wrap items-center gap-4">
          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Status:</span>
            <select
              [(ngModel)]="selectedStatus"
              (ngModelChange)="applyFilters()"
              class="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">All Statuses</option>
              <option value="paid">Paid</option>
              <option value="pending">Pending</option>
              <option value="overdue">Overdue</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div class="flex items-center gap-2">
            <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Year:</span>
            <select
              [(ngModel)]="selectedYear"
              (ngModelChange)="applyFilters()"
              class="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="all">All Years</option>
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
              (ngModelChange)="applyFilters()"
              placeholder="Search invoices..."
              class="rounded-lg border border-gray-300 bg-white pl-10 pr-4 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white w-64"
            />
            <svg class="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>
      </div>

      <!-- Invoices Table -->
      <div class="rounded-lg border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-800">
              <tr>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Invoice
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Description
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Date
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Due Date
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Amount
                </th>
                <th scope="col" class="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Status
                </th>
                <th scope="col" class="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-gray-400">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody class="bg-white divide-y divide-gray-200 dark:bg-gray-900 dark:divide-gray-800">
              <tr *ngFor="let invoice of filteredInvoices()" class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                <td class="px-6 py-4 whitespace-nowrap">
                  <div class="flex items-center gap-2">
                    <span class="text-xl">📄</span>
                    <div>
                      <p class="text-sm font-medium text-gray-900 dark:text-white">
                        {{ invoice.invoiceNumber }}
                      </p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">
                        ID: {{ invoice.id }}
                      </p>
                    </div>
                  </div>
                </td>
                <td class="px-6 py-4">
                  <p class="text-sm text-gray-900 dark:text-white max-w-xs truncate">
                    {{ invoice.description }}
                  </p>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                  {{ formatDate(invoice.date) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-sm text-gray-600 dark:text-gray-400">
                  {{ formatDate(invoice.dueDate) }}
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <p class="text-sm font-semibold text-gray-900 dark:text-white">
                    {{ formatCurrency(invoice.amount) }}
                  </p>
                </td>
                <td class="px-6 py-4 whitespace-nowrap">
                  <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium" [class]="getStatusBadgeClass(invoice.status)">
                    {{ invoice.status | uppercase }}
                  </span>
                </td>
                <td class="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                  <div class="flex items-center justify-end gap-2">
                    <button
                      (click)="viewInvoice(invoice)"
                      class="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition"
                      title="View Invoice"
                    >
                      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                      </svg>
                    </button>
                    <button
                      (click)="downloadInvoice(invoice)"
                      class="text-green-600 hover:text-green-700 dark:text-green-400 dark:hover:text-green-300 transition"
                      title="Download PDF"
                    >
                      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </button>
                    <button
                      *ngIf="invoice.status === 'pending' || invoice.status === 'overdue'"
                      (click)="payInvoice(invoice)"
                      class="text-purple-600 hover:text-purple-700 dark:text-purple-400 dark:hover:text-purple-300 transition"
                      title="Pay Now"
                    >
                      <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Empty State -->
        <div *ngIf="filteredInvoices().length === 0" class="text-center py-12">
          <div class="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
            <span class="text-3xl">📄</span>
          </div>
          <p class="text-gray-600 dark:text-gray-400 mb-2">No invoices found</p>
          <p class="text-sm text-gray-500 dark:text-gray-500">
            {{ searchTerm || selectedStatus !== 'all' || selectedYear !== 'all' 
              ? 'Try adjusting your filters' 
              : 'Your invoices will appear here' }}
          </p>
        </div>
      </div>

      <!-- Pagination -->
      <div *ngIf="filteredInvoices().length > 0" class="flex items-center justify-between">
        <p class="text-sm text-gray-600 dark:text-gray-400">
          Showing <span class="font-medium">{{ filteredInvoices().length }}</span> of <span class="font-medium">{{ allInvoices().length }}</span> invoices
        </p>
        <div class="flex gap-2">
          <button
            class="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled
          >
            Previous
          </button>
          <button
            class="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            disabled
          >
            Next
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

  searchTerm = '';
  selectedStatus = 'all';
  selectedYear = 'all';

  allInvoices = signal<Invoice[]>([
    {
      id: 'inv_001',
      invoiceNumber: 'INV-2024-001',
      date: '2024-01-05',
      dueDate: '2024-01-15',
      amount: 249900,
      status: 'paid',
      description: 'Monthly Subscription - Professional Plan (January 2024)',
      pdfUrl: '/invoices/inv_001.pdf'
    },
    {
      id: 'inv_002',
      invoiceNumber: 'INV-2024-002',
      date: '2024-02-05',
      dueDate: '2024-02-15',
      amount: 249900,
      status: 'paid',
      description: 'Monthly Subscription - Professional Plan (February 2024)',
      pdfUrl: '/invoices/inv_002.pdf'
    },
    {
      id: 'inv_003',
      invoiceNumber: 'INV-2024-003',
      date: '2024-03-05',
      dueDate: '2024-03-15',
      amount: 249900,
      status: 'pending',
      description: 'Monthly Subscription - Professional Plan (March 2024)',
      pdfUrl: '/invoices/inv_003.pdf'
    },
    {
      id: 'inv_004',
      invoiceNumber: 'INV-2024-004',
      date: '2024-04-05',
      dueDate: '2024-04-15',
      amount: 249900,
      status: 'overdue',
      description: 'Monthly Subscription - Professional Plan (April 2024)',
      pdfUrl: '/invoices/inv_004.pdf'
    }
  ]);

  filteredInvoices = signal<Invoice[]>([]);

  canViewBilling = computed(() =>
    this.rbacService.can('tenant-billing:read')
  );

  ngOnInit(): void {
    console.log('📄 TenantInvoicesComponent initialized');
    this.applyFilters();
  }

  applyFilters(): void {
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
    return this.allInvoices().length;
  }

  getStatusCount(status: string): number {
    return this.allInvoices().filter(inv => inv.status === status).length;
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
