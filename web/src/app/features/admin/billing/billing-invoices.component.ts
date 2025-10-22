import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface Invoice {
  id: number;
  tenant_id: number;
  tenant_name: string;
  invoice_number: string;
  amount: number;
  tax: number;
  total: number;
  status: string;
  issue_date: string;
  due_date: string;
  paid_date: string | null;
}

@Component({
  selector: 'app-billing-invoices',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4 space-y-4 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">Invoices</h1>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Manage billing invoices and payments</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            (click)="goBack()"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <button
            (click)="refresh()"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400">Total Invoices</p>
              <p class="text-lg font-bold text-gray-900 dark:text-white">{{ invoices().length }}</p>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400">Paid</p>
              <p class="text-lg font-bold text-gray-900 dark:text-white">{{ countByStatus('paid') }}</p>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <svg class="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400">Pending</p>
              <p class="text-lg font-bold text-gray-900 dark:text-white">{{ countByStatus('pending') }}</p>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <svg class="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <p class="text-xs text-gray-500 dark:text-gray-400">Overdue</p>
              <p class="text-lg font-bold text-gray-900 dark:text-white">{{ countByStatus('overdue') }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }

      <!-- Table -->
      @if (!loading()) {
        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th class="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Invoice #</th>
                  <th class="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Tenant</th>
                  <th class="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Amount</th>
                  <th class="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Status</th>
                  <th class="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Issue Date</th>
                  <th class="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Due Date</th>
                  <th class="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                @for (invoice of invoices(); track invoice.id) {
                  <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td class="px-3 py-2 text-xs text-gray-900 dark:text-white font-medium">{{ invoice.invoice_number }}</td>
                    <td class="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">{{ invoice.tenant_name }}</td>
                    <td class="px-3 py-2 text-xs text-gray-900 dark:text-white font-medium">\${{ invoice.total.toFixed(2) }}</td>
                    <td class="px-3 py-2">
                      <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                            [ngClass]="{
                              'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300': invoice.status === 'paid',
                              'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300': invoice.status === 'pending',
                              'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300': invoice.status === 'overdue',
                              'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300': invoice.status === 'cancelled'
                            }">
                        {{ invoice.status }}
                      </span>
                    </td>
                    <td class="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">{{ formatDate(invoice.issue_date) }}</td>
                    <td class="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">{{ formatDate(invoice.due_date) }}</td>
                    <td class="px-3 py-2">
                      <div class="flex items-center justify-end gap-1">
                        <button
                          class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-700 dark:text-blue-300 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                        >
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                          View
                        </button>
                        @if (invoice.status === 'pending' || invoice.status === 'overdue') {
                          <button
                            (click)="markAsPaid(invoice.id)"
                            class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-700 dark:text-green-300 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition-colors"
                          >
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                            </svg>
                            Mark Paid
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Empty State -->
          @if (invoices().length === 0) {
            <div class="p-12 text-center">
              <svg class="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-2">No Invoices Found</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">No invoices have been generated yet.</p>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class BillingInvoicesComponent implements OnInit {
  http = inject(HttpClient);
  router = inject(Router);
  authService = inject(AuthService);

  invoices = signal<Invoice[]>([]);
  loading = signal(false);

  ngOnInit(): void {
    this.loadInvoices();
  }

  loadInvoices(): void {
    this.loading.set(true);

    this.http.get<any>('http://localhost:3000/api/billing/invoices').subscribe({
      next: (response) => {
        this.invoices.set(response.data || []);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load invoices', error);
        this.loading.set(false);
      }
    });
  }

  markAsPaid(id: number): void {
    if (!confirm('Mark this invoice as paid?')) return;

    this.http.post(`http://localhost:3000/api/billing/invoices/${id}/pay`, {
      payment_method: 'manual',
      amount: 0
    }).subscribe({
      next: () => {
        this.loadInvoices();
      },
      error: (error) => {
        alert(error.error?.message || 'Failed to mark invoice as paid');
      }
    });
  }

  countByStatus(status: string): number {
    return this.invoices().filter(inv => inv.status === status).length;
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  refresh(): void {
    this.loadInvoices();
  }

  goBack(): void {
    this.router.navigate(['/admin']);
  }
}
