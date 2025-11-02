import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { LoanService } from '../shared/services/loan.service';
import { Loan } from '../shared/models/loan.models';

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4 space-y-3">
      <!-- Quick Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-2">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400">Active Loans</p>
              <p class="text-xl font-bold text-gray-900 dark:text-white">{{ activeLoansCount() }}</p>
            </div>
            <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400">Total Balance</p>
              <p class="text-xl font-bold text-orange-600 dark:text-orange-400">₱{{ formatCurrency(totalBalance()) }}</p>
            </div>
            <div class="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400">Next Payment</p>
              <p class="text-xl font-bold text-green-600 dark:text-green-400">₱{{ formatCurrency(nextPaymentAmount()) }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ nextPaymentDate() }}</p>
            </div>
            <div class="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400">Credit Score</p>
              <p class="text-xl font-bold text-blue-600 dark:text-blue-400">{{ creditScore() }}</p>
            </div>
            <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-2">
        <button
          (click)="navigateToApplyLoan()"
          class="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-500 transition-colors text-left group">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-sm text-gray-900 dark:text-white mb-0.5">Apply for Loan</h3>
              <p class="text-xs text-gray-600 dark:text-gray-400">Get instant approval</p>
            </div>
          </div>
        </button>

        <button
          (click)="navigateToMakePayment()"
          class="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 hover:border-green-500 dark:hover:border-green-500 transition-colors text-left group">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-sm text-gray-900 dark:text-white mb-0.5">Make Payment</h3>
              <p class="text-xs text-gray-600 dark:text-gray-400">Pay your loan now</p>
            </div>
          </div>
        </button>

        <button
          (click)="navigateToMyLoans()"
          class="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-500 transition-colors text-left group">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
            </div>
            <div>
              <h3 class="font-semibold text-sm text-gray-900 dark:text-white mb-0.5">View My Loans</h3>
              <p class="text-xs text-gray-600 dark:text-gray-400">Track your loans</p>
            </div>
          </div>
        </button>
      </div>

      <!-- Active Loans -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="p-4 border-b border-gray-200 dark:border-gray-700">
          <h2 class="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Active Loans
          </h2>
        </div>
        <div class="p-4">
          @if (loading()) {
            <div class="text-center py-8">
              <svg class="animate-spin h-8 w-8 mx-auto text-blue-600" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            </div>
          } @else if (activeLoans().length === 0) {
            <div class="text-center py-8">
              <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              <p class="text-gray-600 dark:text-gray-400">No active loans</p>
              <button
                (click)="navigateToApplyLoan()"
                class="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                Apply for a Loan
              </button>
            </div>
          } @else {
            <div class="space-y-2">
              @for (loan of activeLoans(); track loan.id) {
                <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:border-blue-500 dark:hover:border-blue-500 transition-colors cursor-pointer"
                     (click)="viewLoanDetails(loan.id)">
                  <div class="flex items-center justify-between mb-2">
                    <div>
                      <p class="font-semibold text-gray-900 dark:text-white">{{ loan.loanNumber }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">{{ formatDate(loan.disbursementDate || '') }}</p>
                    </div>
                    <span [class]="getStatusClass(loan.status)">
                      {{ loan.status }}
                    </span>
                  </div>
                  <div class="grid grid-cols-3 gap-2">
                    <div>
                      <p class="text-xs text-gray-600 dark:text-gray-400">Original Amount</p>
                      <p class="text-sm font-semibold text-gray-900 dark:text-white">₱{{ formatCurrency(loan.principalAmount) }}</p>
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
                  <div class="mt-2">
                    <div class="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-0.5">
                      <span>Progress</span>
                      <span>{{ calculateProgress(loan) }}%</span>
                    </div>
                    <div class="h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                      <div
                        class="h-full bg-gradient-to-r from-blue-500 to-green-500 transition-all duration-300"
                        [style.width.%]="calculateProgress(loan)">
                      </div>
                    </div>
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
export class CustomerDashboardComponent implements OnInit {
  private loanService = inject(LoanService);
  private router = inject(Router);

  loans = signal<Loan[]>([]);
  loading = signal(false);

  customerName = signal('Customer');
  creditScore = signal(650);

  activeLoans = computed(() =>
    this.loans().filter(loan => loan.status === 'active' || loan.status === 'disbursed' || loan.status === 'overdue')
  );

  activeLoansCount = computed(() => this.activeLoans().length);

  totalBalance = computed(() =>
    this.activeLoans().reduce((sum, loan) => sum + (loan.outstandingBalance ?? 0), 0)
  );

  nextPaymentAmount = computed(() => {
    const loans = this.activeLoans();
    return loans.length > 0 ? loans[0].monthlyPayment : 0;
  });

  nextPaymentDate = computed(() => {
    // This would come from the next schedule item
    return 'Nov 30, 2025';
  });

  ngOnInit() {
    this.loadCustomerLoans();
  }

  loadCustomerLoans() {
    this.loading.set(true);

    const customerData = localStorage.getItem('customerData');
    if (!customerData) {
      console.warn('Customer data not found in localStorage. Unable to load loans.');
      this.loading.set(false);
      return;
    }

    try {
      const customer = JSON.parse(customerData);
      const tenantId = customer.tenantId || customer.tenant_id;
      const customerId = customer.id;

      if (!tenantId || !customerId) {
        console.warn('Missing tenantId or customerId in stored customer data.', customer);
        this.loading.set(false);
        return;
      }

      this.loanService.listCustomerLoans(String(tenantId), Number(customerId), { page: 1, limit: 10 }).subscribe({
        next: (response: { success: boolean; message: string; data: Loan[]; pagination: any }) => {
          this.loans.set(response.data || []);
          this.loading.set(false);
        },
        error: (error: any) => {
          console.error('Error loading loans:', error);
          this.loading.set(false);
        }
      });
    } catch (error) {
      console.error('Failed to parse customer data from localStorage.', error);
      this.loading.set(false);
    }
  }

  calculateProgress(loan: Loan): number {
    const paid = loan.totalAmount - loan.outstandingBalance;
    return Math.round((paid / loan.totalAmount) * 100);
  }

  formatCurrency(amount: number | null | undefined): string {
    const value = amount ?? 0;
    return value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getStatusClass(status: string): string {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full';
    switch (status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400`;
      case 'overdue':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400`;
    }
  }

  navigateToApplyLoan() {
    this.router.navigate(['/platforms/money-loan/customer/apply']);
  }

  navigateToMakePayment() {
    this.router.navigate(['/platforms/money-loan/customer/payment']);
  }

  navigateToMyLoans() {
    this.router.navigate(['/platforms/money-loan/customer/loans']);
  }

  viewLoanDetails(loanId: number) {
    this.router.navigate(['/platforms/money-loan/customer/loans', loanId]);
  }
}
