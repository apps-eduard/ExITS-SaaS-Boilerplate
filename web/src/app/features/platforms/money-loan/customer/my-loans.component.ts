import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LoanService } from '../shared/services/loan.service';
import { Loan } from '../shared/models/loan.models';

@Component({
  selector: 'app-my-loans',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4 md:p-6 space-y-4">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">My Loans</h1>
          <p class="text-sm text-gray-600 dark:text-gray-400">View and manage all your loans</p>
        </div>
        <button
          (click)="navigateToApply()"
          class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Apply for New Loan
        </button>
      </div>

      <!-- Summary Cards -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Active Loans</p>
          <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ activeLoans().length }}</p>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Outstanding</p>
          <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">₱{{ formatCurrency(totalOutstanding()) }}</p>
        </div>
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Completed Loans</p>
          <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ completedLoans().length }}</p>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="border-b border-gray-200 dark:border-gray-700">
          <nav class="flex -mb-px">
            <button
              (click)="filterStatus.set('all')"
              [class]="filterStatus() === 'all' ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'"
              class="px-6 py-3 border-b-2 font-medium text-sm transition-colors">
              All Loans ({{ loans().length }})
            </button>
            <button
              (click)="filterStatus.set('active')"
              [class]="filterStatus() === 'active' ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'"
              class="px-6 py-3 border-b-2 font-medium text-sm transition-colors">
              Active ({{ activeLoans().length }})
            </button>
            <button
              (click)="filterStatus.set('paid_off')"
              [class]="filterStatus() === 'paid_off' ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'"
              class="px-6 py-3 border-b-2 font-medium text-sm transition-colors">
              Completed ({{ completedLoans().length }})
            </button>
          </nav>
        </div>

        <!-- Loans List -->
        <div class="p-6">
          @if (loading()) {
            <div class="text-center py-12">
              <svg class="animate-spin h-8 w-8 mx-auto text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          } @else if (filteredLoans().length === 0) {
            <div class="text-center py-12">
              <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <p class="text-gray-600 dark:text-gray-400 mb-4">No loans found</p>
              <button
                (click)="navigateToApply()"
                class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                Apply for Your First Loan
              </button>
            </div>
          } @else {
            <div class="space-y-4">
              @for (loan of filteredLoans(); track loan.id) {
                <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-6 hover:border-blue-500 dark:hover:border-blue-500 hover:shadow-md transition-all cursor-pointer"
                     (click)="viewLoanDetails(loan.id)">
                  <!-- Loan Header -->
                  <div class="flex items-center justify-between mb-4">
                    <div>
                      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">{{ loan.loanNumber }}</h3>
                      <p class="text-sm text-gray-500 dark:text-gray-400">
                        Disbursed on {{ formatDate(loan.disbursementDate || '') }}
                      </p>
                    </div>
                    <span [class]="getStatusClass(loan.status)">
                      {{ loan.status }}
                    </span>
                  </div>

                  <!-- Loan Details Grid -->
                  <div class="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                    <div>
                      <p class="text-xs text-gray-600 dark:text-gray-400">Principal</p>
                      <p class="text-sm font-semibold text-gray-900 dark:text-white">₱{{ formatCurrency(loan.principalAmount) }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-gray-600 dark:text-gray-400">Total Amount</p>
                      <p class="text-sm font-semibold text-blue-600 dark:text-blue-400">₱{{ formatCurrency(loan.totalAmount) }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-gray-600 dark:text-gray-400">Outstanding</p>
                      <p class="text-sm font-semibold text-orange-600 dark:text-orange-400">₱{{ formatCurrency(loan.outstandingBalance) }}</p>
                    </div>
                    <div>
                      <p class="text-xs text-gray-600 dark:text-gray-400">Monthly Payment</p>
                      <p class="text-sm font-semibold text-green-600 dark:text-green-400">₱{{ formatCurrency(loan.monthlyPayment) }}</p>
                    </div>
                  </div>

                  <!-- Progress Bar -->
                  <div class="mb-4">
                    <div class="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                      <span>Repayment Progress</span>
                      <span>{{ calculateProgress(loan) }}%</span>
                    </div>
                    <div class="h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        class="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300"
                        [style.width.%]="calculateProgress(loan)">
                      </div>
                    </div>
                  </div>

                  <!-- Loan Info -->
                  <div class="flex items-center justify-between pt-4 border-t border-gray-200 dark:border-gray-700">
                    <div class="flex items-center gap-4 text-sm text-gray-600 dark:text-gray-400">
                      <span>{{ loan.interestRate }}% interest</span>
                      <span>•</span>
                      <span>{{ Math.ceil(loan.termDays / 30) }} months</span>
                      <span>•</span>
                      <span>{{ loan.interestType }}</span>
                    </div>
                    @if (loan.status === 'active' || loan.status === 'overdue') {
                      <button
                        (click)="makePayment(loan.id, $event)"
                        class="inline-flex items-center gap-2 px-4 py-2 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors">
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                        </svg>
                        Make Payment
                      </button>
                    }
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `
})
export class MyLoansComponent implements OnInit {
  private loanService = inject(LoanService);
  private router = inject(Router);

  loans = signal<Loan[]>([]);
  loading = signal(false);
  filterStatus = signal<'all' | 'active' | 'paid_off'>('all');

  activeLoans = signal<Loan[]>([]);
  completedLoans = signal<Loan[]>([]);
  filteredLoans = signal<Loan[]>([]);

  // Expose Math for template
  Math = Math;

  ngOnInit() {
    this.loadLoans();
  }

  loadLoans() {
    this.loading.set(true);
    // In real implementation, filter by current customer ID
    this.loanService.listLoans({ page: 1, limit: 100 }).subscribe({
      next: (response: { success: boolean; message: string; data: Loan[]; pagination: any }) => {
        this.loans.set(response.data);
        this.updateFilteredLoans();
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading loans:', error);
        this.loading.set(false);
      }
    });
  }

  updateFilteredLoans() {
    const all = this.loans();
    this.activeLoans.set(all.filter(l => l.status === 'active' || l.status === 'overdue'));
    this.completedLoans.set(all.filter(l => l.status === 'paid_off'));

    switch (this.filterStatus()) {
      case 'active':
        this.filteredLoans.set(this.activeLoans());
        break;
      case 'paid_off':
        this.filteredLoans.set(this.completedLoans());
        break;
      default:
        this.filteredLoans.set(all);
    }
  }

  totalOutstanding(): number {
    return this.activeLoans().reduce((sum, loan) => sum + loan.outstandingBalance, 0);
  }

  calculateProgress(loan: Loan): number {
    const paid = loan.totalAmount - loan.outstandingBalance;
    return Math.round((paid / loan.totalAmount) * 100);
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getStatusClass(status: string): string {
    const baseClasses = 'px-3 py-1 text-xs font-medium rounded-full';
    switch (status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400`;
      case 'overdue':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400`;
      case 'paid_off':
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400`;
    }
  }

  viewLoanDetails(loanId: number) {
    this.router.navigate(['/platforms/money-loan/customer/loans', loanId]);
  }

  makePayment(loanId: number, event: Event) {
    event.stopPropagation();
    this.router.navigate(['/platforms/money-loan/customer/payment'], {
      queryParams: { loanId }
    });
  }

  navigateToApply() {
    this.router.navigate(['/platforms/money-loan/customer/apply']);
  }
}
