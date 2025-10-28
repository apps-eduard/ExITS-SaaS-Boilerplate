import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LoanService } from '../shared/services/loan.service';
import { Loan, RepaymentSchedule, LoanPayment } from '../shared/models/loan.models';

@Component({
  selector: 'app-loan-details',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4 md:p-6 space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Loan Details</h1>
          <p class="text-sm text-gray-600 dark:text-gray-400">View loan information, schedule, and payment history</p>
        </div>
        <button
          (click)="goBack()"
          class="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          Back
        </button>
      </div>

      @if (loading()) {
        <div class="flex items-center justify-center py-12">
          <svg class="animate-spin h-8 w-8 text-blue-600" fill="none" viewBox="0 0 24 24">
            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
          </svg>
        </div>
      } @else if (loan()) {
        <!-- Loan Overview Cards -->
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Loan Number</p>
            <p class="text-lg font-bold text-gray-900 dark:text-white">{{ loan()?.loanNumber }}</p>
            <span [class]="getStatusClass(loan()!.status)">
              {{ loan()?.status }}
            </span>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Principal Amount</p>
            <p class="text-lg font-bold text-gray-900 dark:text-white">₱{{ formatCurrency(loan()!.principalAmount) }}</p>
            <p class="text-xs text-gray-600 dark:text-gray-400">{{ loan()?.interestRate }}% interest</p>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Amount</p>
            <p class="text-lg font-bold text-blue-600 dark:text-blue-400">₱{{ formatCurrency(loan()!.totalAmount) }}</p>
            <p class="text-xs text-gray-600 dark:text-gray-400">{{ Math.ceil((loan()?.termDays || 0) / 30) }} months term</p>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Outstanding Balance</p>
            <p class="text-lg font-bold text-orange-600 dark:text-orange-400">₱{{ formatCurrency(loan()!.outstandingBalance) }}</p>
            <p class="text-xs text-gray-600 dark:text-gray-400">{{ calculateProgress() }}% paid</p>
          </div>
        </div>

        <!-- Customer Information -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            Customer Information
          </h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400">Name</p>
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                {{ loan()?.customer?.firstName }} {{ loan()?.customer?.lastName }}
              </p>
            </div>
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400">Email</p>
              <p class="text-sm text-gray-900 dark:text-white">{{ loan()?.customer?.email }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400">Phone</p>
              <p class="text-sm text-gray-900 dark:text-white">{{ loan()?.customer?.phone }}</p>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
          <div class="border-b border-gray-200 dark:border-gray-700">
            <nav class="flex -mb-px">
              <button
                (click)="activeTab.set('schedule')"
                [class]="activeTab() === 'schedule' ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'"
                class="px-6 py-3 border-b-2 font-medium text-sm transition-colors">
                Repayment Schedule
              </button>
              <button
                (click)="activeTab.set('payments')"
                [class]="activeTab() === 'payments' ? 'border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400' : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'"
                class="px-6 py-3 border-b-2 font-medium text-sm transition-colors">
                Payment History
              </button>
            </nav>
          </div>

          <!-- Schedule Tab -->
          @if (activeTab() === 'schedule') {
            <div class="p-6">
              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                    <tr>
                      <th class="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Due Date</th>
                      <th class="px-4 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Principal</th>
                      <th class="px-4 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Interest</th>
                      <th class="px-4 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Total Due</th>
                      <th class="px-4 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Paid</th>
                      <th class="px-4 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Balance</th>
                      <th class="px-4 py-3 text-center text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Status</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                    @for (schedule of repaymentSchedule(); track schedule.id) {
                      <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">
                          {{ formatDate(schedule.dueDate) }}
                        </td>
                        <td class="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                          ₱{{ formatCurrency(schedule.principalAmount) }}
                        </td>
                        <td class="px-4 py-3 text-sm text-right text-gray-900 dark:text-white">
                          ₱{{ formatCurrency(schedule.interestAmount) }}
                        </td>
                        <td class="px-4 py-3 text-sm text-right font-medium text-gray-900 dark:text-white">
                          ₱{{ formatCurrency(schedule.totalAmount) }}
                        </td>
                        <td class="px-4 py-3 text-sm text-right text-green-600 dark:text-green-400">
                          ₱{{ formatCurrency(schedule.amountPaid) }}
                        </td>
                        <td class="px-4 py-3 text-sm text-right text-orange-600 dark:text-orange-400">
                          ₱{{ formatCurrency(schedule.outstandingAmount) }}
                        </td>
                        <td class="px-4 py-3 text-center">
                          <span [class]="getScheduleStatusClass(schedule.status)">
                            {{ schedule.status }}
                          </span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }

          <!-- Payments Tab -->
          @if (activeTab() === 'payments') {
            <div class="p-6 space-y-4">
              <div class="flex justify-end">
                <button
                  (click)="navigateToPayment()"
                  class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                  </svg>
                  Record Payment
                </button>
              </div>

              @if (payments().length === 0) {
                <div class="text-center py-8 text-gray-500 dark:text-gray-400">
                  No payments recorded yet
                </div>
              } @else {
                <div class="space-y-3">
                  @for (payment of payments(); track payment.id) {
                    <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                      <div class="flex items-center justify-between">
                        <div class="flex-1">
                          <div class="flex items-center gap-3">
                            <div class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                              <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                              </svg>
                            </div>
                            <div class="flex-1">
                              <div class="flex items-center justify-between">
                                <div>
                                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                                    Payment #{{ payment.paymentReference }}
                                  </p>
                                  <p class="text-xs text-gray-500 dark:text-gray-400">
                                    {{ formatDate(payment.paymentDate) }}
                                  </p>
                                </div>
                                <div class="text-right">
                                  <p class="text-lg font-bold text-green-600 dark:text-green-400">
                                    ₱{{ formatCurrency(payment.amount) }}
                                  </p>
                                  <p class="text-xs text-gray-500 dark:text-gray-400">
                                    {{ payment.paymentMethod }}
                                  </p>
                                </div>
                              </div>
                              @if (payment.notes) {
                                <p class="text-xs text-gray-600 dark:text-gray-400 mt-2">{{ payment.notes }}</p>
                              }
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `
})
export class LoanDetailsComponent implements OnInit {
  private loanService = inject(LoanService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  // Expose Math for template
  Math = Math;

  loan = signal<Loan | null>(null);
  repaymentSchedule = signal<RepaymentSchedule[]>([]);
  payments = signal<LoanPayment[]>([]);
  loading = signal(false);
  activeTab = signal<'schedule' | 'payments'>('schedule');

  ngOnInit() {
    const loanId = this.route.snapshot.paramMap.get('id');
    if (loanId) {
      this.loadLoan(parseInt(loanId));
      this.loadRepaymentSchedule(parseInt(loanId));
      this.loadPayments(parseInt(loanId));
    }
  }

  loadLoan(loanId: number) {
    this.loading.set(true);
    this.loanService.getLoanById(loanId).subscribe({
      next: (response: { success: boolean; data: Loan }) => {
        this.loan.set(response.data);
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading loan:', error);
        this.loading.set(false);
      }
    });
  }

  loadRepaymentSchedule(loanId: number) {
    this.loanService.getRepaymentSchedule(loanId).subscribe({
      next: (response: { success: boolean; data: RepaymentSchedule[] }) => {
        this.repaymentSchedule.set(response.data);
      },
      error: (error: any) => {
        console.error('Error loading repayment schedule:', error);
      }
    });
  }

  loadPayments(loanId: number) {
    this.loanService.getPaymentHistory(loanId).subscribe({
      next: (response: { success: boolean; data: LoanPayment[] }) => {
        this.payments.set(response.data);
      },
      error: (error: any) => {
        console.error('Error loading payment history:', error);
      }
    });
  }

  calculateProgress(): number {
    const loan = this.loan();
    if (!loan) return 0;
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
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full inline-block mt-1';
    switch (status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400`;
      case 'overdue':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400`;
      case 'paid_off':
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400`;
      case 'defaulted':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400`;
    }
  }

  getScheduleStatusClass(status: string): string {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full';
    switch (status) {
      case 'paid':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400`;
      case 'partial':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400`;
      case 'pending':
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400`;
      case 'overdue':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400`;
    }
  }

  navigateToPayment() {
    const loanId = this.loan()?.id;
    if (loanId) {
  this.router.navigate(['/platforms/money-loan/dashboard/payments/new'], {
        queryParams: { loanId }
      });
    }
  }

  goBack() {
  this.router.navigate(['/platforms/money-loan/dashboard/loans']);
  }
}
