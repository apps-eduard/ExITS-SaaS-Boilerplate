import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { LoanService } from '../shared/services/loan.service';
import { Loan, RepaymentSchedule, LoanPayment } from '../shared/models/loan.models';

@Component({
  selector: 'app-loan-details',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div class="max-w-7xl mx-auto space-y-3">
        <!-- Header -->
        <div class="flex items-center justify-between">
          <div>
            <button
              (click)="goBack()"
              class="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
              Back to My Loans
            </button>
            <div class="flex items-center gap-2">
              <h1 class="text-xl font-bold text-gray-900 dark:text-white">Loan Details</h1>
              @if (loan()) {
                <span [class]="getStatusClass(loan()!.status)">
                  {{ getStatusLabel(loan()!.status) }}
                </span>
              }
            </div>
            @if (loan()) {
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Loan #{{ loan()!.loanNumber }}
              </p>
            }
          </div>
          @if (loan() && (loan()!.status === 'active' || loan()!.status === 'overdue')) {
            <button
              (click)="makePayment()"
              class="inline-flex items-center gap-2 px-3 py-1.5 bg-green-600 hover:bg-green-700 text-white text-sm rounded-lg transition-colors shadow-sm">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
              Make Payment
            </button>
          }
        </div>

        @if (loading()) {
          <div class="text-center py-12">
            <svg class="animate-spin h-12 w-12 mx-auto text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            <p class="mt-4 text-gray-600 dark:text-gray-400">Loading loan details...</p>
          </div>
        } @else if (loan()) {
          <!-- Loan Summary Cards -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
            <div class="bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
              <p class="text-xs text-gray-600 dark:text-gray-400 mb-0.5">Principal Amount</p>
              <p class="text-xl font-bold text-gray-900 dark:text-white">₱{{ formatCurrency(loan()!.principalAmount) }}</p>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
              <p class="text-xs text-gray-600 dark:text-gray-400 mb-0.5">Outstanding Balance</p>
              <p class="text-xl font-bold text-orange-600 dark:text-orange-400">₱{{ formatCurrency(loan()!.outstandingBalance) }}</p>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
              <p class="text-xs text-gray-600 dark:text-gray-400 mb-0.5">Amount Paid</p>
              <p class="text-xl font-bold text-green-600 dark:text-green-400">₱{{ formatCurrency(loan()!.amountPaid) }}</p>
            </div>
            <div class="bg-white dark:bg-gray-800 rounded-lg p-2 border border-gray-200 dark:border-gray-700">
              <p class="text-xs text-gray-600 dark:text-gray-400 mb-0.5">Monthly Payment</p>
              <p class="text-xl font-bold text-blue-600 dark:text-blue-400">₱{{ formatCurrency(loan()!.monthlyPayment || 0) }}</p>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
            <div class="flex items-center justify-between mb-1.5">
              <h2 class="text-base font-semibold text-gray-900 dark:text-white">Repayment Progress</h2>
              <span class="text-sm font-medium text-gray-900 dark:text-white">{{ calculateProgress() }}%</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2 mb-1.5">
              <div
                class="bg-gradient-to-r from-blue-500 to-green-500 h-2 rounded-full transition-all duration-300"
                [style.width.%]="calculateProgress()">
              </div>
            </div>
            <div class="flex justify-between text-xs text-gray-600 dark:text-gray-400">
              <span>Paid: ₱{{ formatCurrency(loan()!.amountPaid) }}</span>
              <span>Remaining: ₱{{ formatCurrency(loan()!.outstandingBalance) }}</span>
            </div>
          </div>

          <!-- Loan Information -->
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div class="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 class="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
                Loan Information
              </h2>
            </div>
            <div class="p-4">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Product</p>
                  <p class="text-base font-medium text-gray-900 dark:text-white">{{ loan()!.productName || 'N/A' }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Loan Number</p>
                  <p class="text-base font-medium font-mono text-gray-900 dark:text-white">{{ loan()!.loanNumber }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Interest Rate</p>
                  <p class="text-base font-medium text-gray-900 dark:text-white">{{ loan()!.interestRate }}% {{ getInterestTypeLabel(loan()!.interestType) }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Loan Term</p>
                  <p class="text-base font-medium text-gray-900 dark:text-white">{{ loan()!.termDays }} days</p>
                </div>
                <div>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Disbursement Date</p>
                  <p class="text-base font-medium text-gray-900 dark:text-white">{{ formatDate(loan()!.disbursementDate) }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Maturity Date</p>
                  <p class="text-base font-medium text-gray-900 dark:text-white">{{ formatDate(loan()!.maturityDate) }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Processing Fee</p>
                  <p class="text-base font-medium text-gray-900 dark:text-white">₱{{ formatCurrency(loan()!.processingFee) }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Interest</p>
                  <p class="text-base font-medium text-gray-900 dark:text-white">₱{{ formatCurrency(loan()!.totalInterest) }}</p>
                </div>
                <div>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Total Amount</p>
                  <p class="text-base font-medium text-gray-900 dark:text-white">₱{{ formatCurrency(loan()!.totalAmount) }}</p>
                </div>
                @if (loan()!.daysOverdue > 0) {
                  <div>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Days Overdue</p>
                    <p class="text-base font-medium text-red-600 dark:text-red-400">{{ loan()!.daysOverdue }} days</p>
                  </div>
                }
                @if (loan()!.penaltyAmount > 0) {
                  <div>
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">Penalty Amount</p>
                    <p class="text-base font-medium text-red-600 dark:text-red-400">₱{{ formatCurrency(loan()!.penaltyAmount) }}</p>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Tabs -->
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
            <div class="border-b border-gray-200 dark:border-gray-700">
              <nav class="flex -mb-px">
                <button
                  (click)="activeTab.set('schedule')"
                  [class]="activeTab() === 'schedule'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'"
                  class="px-4 py-2 border-b-2 font-medium text-xs transition-colors">
                  Repayment Schedule
                </button>
                <button
                  (click)="activeTab.set('payments')"
                  [class]="activeTab() === 'payments'
                    ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300 dark:text-gray-400 dark:hover:text-gray-300'"
                  class="px-4 py-2 border-b-2 font-medium text-xs transition-colors">
                  Payment History
                </button>
              </nav>
            </div>

            <!-- Tab Content -->
            <div class="p-4">
              @if (activeTab() === 'schedule') {
                <!-- Repayment Schedule -->
                @if (loadingSchedule()) {
                  <div class="text-center py-8">
                    <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading schedule...</p>
                  </div>
                } @else if (schedule().length === 0) {
                  <div class="text-center py-8">
                    <p class="text-gray-600 dark:text-gray-400">No repayment schedule available</p>
                  </div>
                } @else {
                  <div class="overflow-x-auto">
                    <table class="w-full">
                      <thead>
                        <tr class="border-b border-gray-200 dark:border-gray-700">
                          <th class="text-left py-2 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">Installment</th>
                          <th class="text-left py-2 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">Due Date</th>
                          <th class="text-right py-2 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">Principal</th>
                          <th class="text-right py-2 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">Interest</th>
                          <th class="text-right py-2 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">Total Due</th>
                          <th class="text-right py-2 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">Paid</th>
                          <th class="text-right py-2 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">Balance</th>
                          <th class="text-center py-2 px-3 text-xs font-semibold text-gray-600 dark:text-gray-400">Status</th>
                        </tr>
                      </thead>
                      <tbody>
                        @for (item of schedule(); track item.id) {
                          <tr class="border-b border-gray-100 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700/50">
                            <td class="py-2 px-3 text-xs text-gray-900 dark:text-white">#{{ item.installmentNumber }}</td>
                            <td class="py-2 px-3 text-xs text-gray-900 dark:text-white">{{ formatDate(item.dueDate) }}</td>
                            <td class="py-2 px-3 text-xs text-right text-gray-900 dark:text-white">₱{{ formatCurrency(item.principalAmount) }}</td>
                            <td class="py-2 px-3 text-xs text-right text-gray-900 dark:text-white">₱{{ formatCurrency(item.interestAmount) }}</td>
                            <td class="py-2 px-3 text-xs text-right font-medium text-gray-900 dark:text-white">₱{{ formatCurrency(item.totalAmount) }}</td>
                            <td class="py-2 px-3 text-xs text-right text-green-600 dark:text-green-400">₱{{ formatCurrency(item.amountPaid) }}</td>
                            <td class="py-2 px-3 text-xs text-right text-orange-600 dark:text-orange-400">₱{{ formatCurrency(item.outstandingAmount) }}</td>
                            <td class="py-2 px-3 text-center">
                              <span [class]="getScheduleStatusClass(item.status)">
                                {{ getScheduleStatusLabel(item.status) }}
                              </span>
                            </td>
                          </tr>
                        }
                      </tbody>
                    </table>
                  </div>
                }
              } @else {
                <!-- Payment History -->
                @if (loadingPayments()) {
                  <div class="text-center py-8">
                    <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                    <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading payments...</p>
                  </div>
                } @else if (payments().length === 0) {
                  <div class="text-center py-8">
                    <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
                    </svg>
                    <p class="text-gray-600 dark:text-gray-400">No payment history available</p>
                  </div>
                } @else {
                  <div class="space-y-2">
                    @for (payment of payments(); track payment.id) {
                      <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:border-blue-500 dark:hover:border-blue-500 transition-colors">
                        <div class="flex items-start justify-between mb-2">
                          <div>
                            <p class="font-semibold text-gray-900 dark:text-white">₱{{ formatCurrency(payment.amount) }}</p>
                            <p class="text-xs text-gray-500 dark:text-gray-400">{{ formatDate(payment.paymentDate) }}</p>
                          </div>
                          <span [class]="getPaymentStatusClass(payment.status)">
                            {{ getPaymentStatusLabel(payment.status) }}
                          </span>
                        </div>
                        <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
                          <div>
                            <p class="text-xs text-gray-600 dark:text-gray-400">Reference</p>
                            <p class="font-mono text-gray-900 dark:text-white">{{ payment.paymentReference }}</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-600 dark:text-gray-400">Method</p>
                            <p class="text-gray-900 dark:text-white capitalize">{{ payment.paymentMethod }}</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-600 dark:text-gray-400">Principal</p>
                            <p class="text-gray-900 dark:text-white">₱{{ formatCurrency(payment.principalAmount) }}</p>
                          </div>
                          <div>
                            <p class="text-xs text-gray-600 dark:text-gray-400">Interest</p>
                            <p class="text-gray-900 dark:text-white">₱{{ formatCurrency(payment.interestAmount) }}</p>
                          </div>
                        </div>
                        @if (payment.notes) {
                          <div class="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700">
                            <p class="text-xs text-gray-600 dark:text-gray-400">Notes</p>
                            <p class="text-xs text-gray-900 dark:text-white mt-1">{{ payment.notes }}</p>
                          </div>
                        }
                      </div>
                    }
                  </div>
                }
              }
            </div>
          </div>
        } @else {
          <div class="text-center py-12">
            <svg class="w-16 h-16 mx-auto text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <p class="text-gray-600 dark:text-gray-400">Loan not found</p>
            <button
              (click)="goBack()"
              class="mt-4 inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              Back to My Loans
            </button>
          </div>
        }
      </div>
    </div>
  `
})
export class LoanDetailsComponent implements OnInit {
  private loanService = inject(LoanService);
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  loan = signal<Loan | null>(null);
  schedule = signal<RepaymentSchedule[]>([]);
  payments = signal<LoanPayment[]>([]);
  loading = signal(false);
  loadingSchedule = signal(false);
  loadingPayments = signal(false);
  activeTab = signal<'schedule' | 'payments'>('schedule');

  loanId = signal<number>(0);

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    console.log('🔍 Loan Details - Route param ID:', id);
    if (id) {
      const loanId = parseInt(id, 10);
      console.log('🔍 Loan Details - Parsed loan ID:', loanId);
      this.loanId.set(loanId);
      this.loadLoanDetails(loanId);
      this.loadRepaymentSchedule(loanId);
      this.loadPaymentHistory(loanId);
    } else {
      console.error('❌ No loan ID in route params');
    }
  }

  loadLoanDetails(loanId: number) {
    console.log('📡 Loading loan details for ID:', loanId);
    this.loading.set(true);
    this.loanService.getLoanById(loanId).subscribe({
      next: (response) => {
        console.log('✅ Loan details loaded:', response);
        this.loan.set(response.data);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('❌ Error loading loan details:', error);
        console.error('Error details:', {
          message: error.message,
          status: error.status,
          statusText: error.statusText,
          error: error.error
        });
        this.loading.set(false);
      }
    });
  }

  loadRepaymentSchedule(loanId: number) {
    console.log('📡 Loading repayment schedule for loan ID:', loanId);
    this.loadingSchedule.set(true);
    this.loanService.getRepaymentSchedule(loanId).subscribe({
      next: (response) => {
        console.log('✅ Repayment schedule loaded:', response);
        this.schedule.set(response.data);
        this.loadingSchedule.set(false);
      },
      error: (error) => {
        console.error('❌ Error loading repayment schedule:', error);
        this.loadingSchedule.set(false);
      }
    });
  }

  loadPaymentHistory(loanId: number) {
    console.log('📡 Loading payment history for loan ID:', loanId);
    this.loadingPayments.set(true);
    this.loanService.getPaymentHistory(loanId).subscribe({
      next: (response) => {
        console.log('✅ Payment history loaded:', response);
        this.payments.set(response.data);
        this.loadingPayments.set(false);
      },
      error: (error) => {
        console.error('❌ Error loading payment history:', error);
        this.loadingPayments.set(false);
      }
    });
  }

  calculateProgress(): number {
    const loanData = this.loan();
    if (!loanData) return 0;
    const paid = loanData.totalAmount - loanData.outstandingBalance;
    return Math.round((paid / loanData.totalAmount) * 100);
  }

  formatCurrency(amount: number | null | undefined): string {
    const value = amount ?? 0;
    return value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDate(date: string | undefined | null): string {
    if (!date) return 'N/A';
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
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400`;
    }
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'active': 'ACTIVE',
      'overdue': 'OVERDUE',
      'paid_off': 'PAID OFF',
      'pending': 'PENDING',
      'disbursed': 'DISBURSED',
      'cancelled': 'CANCELLED'
    };
    return labels[status] || status.toUpperCase();
  }

  getInterestTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      'flat': '(Flat)',
      'reducing': '(Reducing Balance)',
      'compound': '(Compound)'
    };
    return labels[type] || '';
  }

  getScheduleStatusClass(status: string): string {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full';
    switch (status) {
      case 'paid':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400`;
      case 'partially_paid':
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400`;
      case 'overdue':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400`;
    }
  }

  getScheduleStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'paid': 'Paid',
      'partially_paid': 'Partial',
      'overdue': 'Overdue',
      'pending': 'Pending'
    };
    return labels[status] || status;
  }

  getPaymentStatusClass(status: string): string {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full';
    switch (status) {
      case 'completed':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400`;
      case 'pending':
        return `${baseClasses} bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400`;
      case 'failed':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400`;
      case 'refunded':
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400`;
    }
  }

  getPaymentStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'completed': 'Completed',
      'pending': 'Pending',
      'failed': 'Failed',
      'refunded': 'Refunded'
    };
    return labels[status] || status;
  }

  makePayment() {
    this.router.navigate(['/platforms/money-loan/customer/payment'], {
      queryParams: { loanId: this.loanId() }
    });
  }

  goBack() {
    this.router.navigate(['/platforms/money-loan/customer/loans']);
  }
}
