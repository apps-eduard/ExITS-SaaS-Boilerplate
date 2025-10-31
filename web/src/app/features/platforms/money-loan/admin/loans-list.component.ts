import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LoanService } from '../shared/services/loan.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Loan } from '../shared/models/loan.models';

@Component({
  selector: 'app-loans-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="p-6 space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>💳</span>
            Loans
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage all loans in the system
          </p>
        </div>
        <button
          routerLink="/money-loan/loans/new"
          class="inline-flex items-center gap-2 rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow-sm transition"
        >
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          New Loan
        </button>
      </div>

      <!-- Filters -->
      <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              [(ngModel)]="filters.status"
              (change)="loadLoans()"
              class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending</option>
              <option value="disbursed">Disbursed</option>
              <option value="active">Active</option>
              <option value="overdue">Overdue</option>
              <option value="paid_off">Paid Off</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div class="md:col-span-3">
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
            <input
              type="text"
              [(ngModel)]="filters.search"
              (input)="onSearch()"
              placeholder="Search by loan number, customer name..."
              class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-4">Loading loans...</p>
      </div>

      <!-- Loans Table -->
      <div *ngIf="!loading()" class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Loan #</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Customer</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Principal</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Outstanding</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Status</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Disbursed</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              @for (loan of loans(); track loan.id) {
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td class="px-4 py-3">
                    <code class="text-xs text-blue-600 dark:text-blue-400">{{ loan.loanNumber }}</code>
                  </td>
                  <td class="px-4 py-3">
                    <div>
                      <p class="text-sm font-medium text-gray-900 dark:text-white">{{ loan.customer?.fullName }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">{{ loan.customer?.customerCode }}</p>
                    </div>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <span class="text-sm font-medium text-gray-900 dark:text-white">₱{{ formatCurrency(loan.principalAmount) }}</span>
                  </td>
                  <td class="px-4 py-3 text-right">
                    <span class="text-sm font-semibold" [ngClass]="getOutstandingClass(loan.outstandingBalance)">
                      ₱{{ formatCurrency(loan.outstandingBalance) }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <span class="inline-flex items-center px-2 py-1 text-xs font-semibold rounded-full" [ngClass]="getStatusClass(loan.status)">
                      {{ loan.status.toUpperCase().replace('_', ' ') }}
                    </span>
                  </td>
                  <td class="px-4 py-3 text-center">
                    <span class="text-xs text-gray-600 dark:text-gray-400">{{ formatDate(loan.disbursementDate) }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center justify-center gap-2">
                      <a
                        [routerLink]="['/money-loan/loans', loan.id]"
                        class="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs font-medium"
                        title="View details"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </a>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="px-4 py-12 text-center">
                    <p class="text-sm text-gray-500 dark:text-gray-400">No loans found</p>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div *ngIf="pagination() && pagination().pages > 1" class="px-4 py-3 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div class="flex items-center justify-between">
            <p class="text-xs text-gray-600 dark:text-gray-400">
              Showing {{ (pagination().page - 1) * pagination().limit + 1 }} to 
              {{ Math.min(pagination().page * pagination().limit, pagination().total) }} of {{ pagination().total }} results
            </p>
            <div class="flex items-center gap-2">
              <button
                (click)="changePage(pagination().page - 1)"
                [disabled]="pagination().page === 1"
                class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span class="text-xs text-gray-600 dark:text-gray-400">
                Page {{ pagination().page }} of {{ pagination().pages }}
              </span>
              <button
                (click)="changePage(pagination().page + 1)"
                [disabled]="pagination().page === pagination().pages"
                class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class LoansListComponent implements OnInit {
  private loanService = inject(LoanService);
  private authService = inject(AuthService);

  loans = signal<Loan[]>([]);
  loading = signal(false);
  pagination = signal<any>({});

  filters = {
    page: 1,
    limit: 20,
    status: '',
    search: ''
  };

  Math = Math;

  ngOnInit(): void {
    this.loadLoans();
  }

  loadLoans(): void {
    this.loading.set(true);

    const tenantId = this.authService.getTenantId();
    if (!tenantId) {
      console.error('No tenant ID found');
      this.loading.set(false);
      return;
    }

    this.loanService.listLoans(tenantId.toString(), this.filters).subscribe({
      next: (response) => {
        this.loans.set(response.data);
        this.pagination.set(response.pagination);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading loans:', err);
        this.loading.set(false);
      }
    });
  }

  onSearch(): void {
    this.filters.page = 1;
    this.loadLoans();
  }

  changePage(page: number): void {
    this.filters.page = page;
    this.loadLoans();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'overdue':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      case 'paid_off':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      case 'disbursed':
        return 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  }

  getOutstandingClass(amount: number): string {
    if (amount === 0) return 'text-green-600 dark:text-green-400';
    if (amount > 50000) return 'text-red-600 dark:text-red-400';
    return 'text-orange-600 dark:text-orange-400';
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  formatDate(date: string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
