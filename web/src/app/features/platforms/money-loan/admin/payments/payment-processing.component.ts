import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';

interface Loan {
  id: number;
  loanNumber: string;
  customerId: number;
  customerName: string;
  principalAmount: number;
  interestRate: number;
  term: number;
  monthlyPayment: number;
  outstandingBalance: number;
  totalPaid: number;
  status: string;
  disbursementDate: string;
  maturityDate: string;
}

interface PaymentSchedule {
  id: number;
  paymentNumber: number;
  dueDate: string;
  principalDue: number;
  interestDue: number;
  totalDue: number;
  principalPaid: number;
  interestPaid: number;
  totalPaid: number;
  balance: number;
  status: 'pending' | 'partial' | 'paid' | 'overdue';
}

interface AmortizationEntry {
  month: number;
  payment: number;
  principal: number;
  interest: number;
  balance: number;
}

interface PaymentAllocation {
  amount: number;
  principal: number;
  interest: number;
  fees: number;
  penalties: number;
}

@Component({
  selector: 'app-payment-processing',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>💳</span>
            Payment Processing
          </h1>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Record payments with detailed allocation and schedule tracking
          </p>
        </div>
        <button
          (click)="goBack()"
          class="px-3 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition flex items-center gap-1.5"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back
        </button>
      </div>

      @if (loading()) {
        <div class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-3">Loading loan details...</p>
        </div>
      }

      @if (!loading() && loan()) {
        <!-- Loan Summary Card -->
        <div class="rounded border border-blue-200 dark:border-blue-800 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 p-4">
          <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Loan Number</p>
              <p class="text-sm font-bold text-gray-900 dark:text-white">{{ loan()!.loanNumber }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Customer</p>
              <p class="text-sm font-bold text-gray-900 dark:text-white">{{ loan()!.customerName }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Outstanding Balance</p>
              <p class="text-lg font-bold text-blue-600 dark:text-blue-400">₱{{ formatNumber(loan()!.outstandingBalance) }}</p>
            </div>
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Monthly Payment</p>
              <p class="text-sm font-bold text-gray-900 dark:text-white">₱{{ formatNumber(loan()!.monthlyPayment) }}</p>
            </div>
          </div>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
          <!-- Left Column: Payment Form -->
          <div class="lg:col-span-1 space-y-4">
            <!-- Payment Form -->
            <div class="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Record Payment</h3>

              <form (ngSubmit)="processPayment()" class="space-y-3">
                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Amount (₱)</label>
                  <input
                    type="number"
                    [(ngModel)]="paymentAmount"
                    name="paymentAmount"
                    required
                    step="0.01"
                    min="0"
                    (input)="calculateAllocation()"
                    class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                    placeholder="Enter amount"
                  />
                </div>

                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Date</label>
                  <input
                    type="date"
                    [(ngModel)]="paymentDate"
                    name="paymentDate"
                    required
                    class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                  />
                </div>

                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Method</label>
                  <select
                    [(ngModel)]="paymentMethod"
                    name="paymentMethod"
                    required
                    class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="cash">Cash</option>
                    <option value="check">Check</option>
                    <option value="bank_transfer">Bank Transfer</option>
                    <option value="online">Online Payment</option>
                  </select>
                </div>

                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Reference Number</label>
                  <input
                    type="text"
                    [(ngModel)]="referenceNumber"
                    name="referenceNumber"
                    class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                    placeholder="Optional"
                  />
                </div>

                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
                  <textarea
                    [(ngModel)]="paymentNotes"
                    name="paymentNotes"
                    rows="2"
                    class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                    placeholder="Optional notes"
                  ></textarea>
                </div>

                <button
                  type="submit"
                  [disabled]="processing() || !paymentAmount || paymentAmount <= 0"
                  class="w-full px-3 py-2 text-xs font-medium rounded shadow-sm bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {{ processing() ? 'Processing...' : 'Process Payment' }}
                </button>
              </form>
            </div>

            <!-- Payment Allocation Preview -->
            @if (paymentAmount && paymentAmount > 0) {
              <div class="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Payment Allocation</h3>

                <div class="space-y-2">
                  <div class="flex justify-between text-xs">
                    <span class="text-gray-600 dark:text-gray-400">Penalties</span>
                    <span class="font-medium text-gray-900 dark:text-white">₱{{ formatNumber(allocation().penalties) }}</span>
                  </div>
                  <div class="flex justify-between text-xs">
                    <span class="text-gray-600 dark:text-gray-400">Fees</span>
                    <span class="font-medium text-gray-900 dark:text-white">₱{{ formatNumber(allocation().fees) }}</span>
                  </div>
                  <div class="flex justify-between text-xs">
                    <span class="text-gray-600 dark:text-gray-400">Interest</span>
                    <span class="font-medium text-gray-900 dark:text-white">₱{{ formatNumber(allocation().interest) }}</span>
                  </div>
                  <div class="flex justify-between text-xs">
                    <span class="text-gray-600 dark:text-gray-400">Principal</span>
                    <span class="font-medium text-gray-900 dark:text-white">₱{{ formatNumber(allocation().principal) }}</span>
                  </div>
                  <div class="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2">
                    <div class="flex justify-between text-xs font-bold">
                      <span class="text-gray-900 dark:text-white">Total</span>
                      <span class="text-green-600 dark:text-green-400">₱{{ formatNumber(allocation().amount) }}</span>
                    </div>
                  </div>

                  <div class="mt-3 p-2 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <p class="text-xs text-blue-900 dark:text-blue-200">
                      <strong>New Balance:</strong> ₱{{ formatNumber(newBalance()) }}
                    </p>
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- Right Column: Payment Schedule & Amortization -->
          <div class="lg:col-span-2 space-y-4">
            <!-- Payment Schedule -->
            <div class="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
              <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Payment Schedule</h3>
              </div>

              <div class="overflow-x-auto">
                <table class="w-full">
                  <thead class="bg-gray-50 dark:bg-gray-900">
                    <tr>
                      <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">#</th>
                      <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Due Date</th>
                      <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Principal</th>
                      <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Interest</th>
                      <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Total Due</th>
                      <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Paid</th>
                      <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                    @for (schedule of paymentSchedule(); track schedule.id) {
                      <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors" [class.bg-yellow-50]="schedule.status === 'overdue'" [class.dark:bg-yellow-900/10]="schedule.status === 'overdue'">
                        <td class="px-3 py-2 text-xs text-gray-900 dark:text-white">{{ schedule.paymentNumber }}</td>
                        <td class="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">{{ schedule.dueDate }}</td>
                        <td class="px-3 py-2 text-xs text-right text-gray-900 dark:text-white">₱{{ formatNumber(schedule.principalDue) }}</td>
                        <td class="px-3 py-2 text-xs text-right text-gray-900 dark:text-white">₱{{ formatNumber(schedule.interestDue) }}</td>
                        <td class="px-3 py-2 text-xs text-right font-medium text-gray-900 dark:text-white">₱{{ formatNumber(schedule.totalDue) }}</td>
                        <td class="px-3 py-2 text-xs text-right text-green-600 dark:text-green-400">₱{{ formatNumber(schedule.totalPaid) }}</td>
                        <td class="px-3 py-2 text-center">
                          <span [class]="getStatusBadgeClass(schedule.status)">
                            {{ schedule.status | titlecase }}
                          </span>
                        </td>
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>

            <!-- Amortization Table -->
            <div class="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
              <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Amortization Schedule</h3>
                <button
                  (click)="toggleAmortization()"
                  class="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                >
                  {{ showAmortization() ? 'Hide' : 'Show' }}
                </button>
              </div>

              @if (showAmortization()) {
                <div class="overflow-x-auto max-h-96 overflow-y-auto">
                  <table class="w-full">
                    <thead class="bg-gray-50 dark:bg-gray-900 sticky top-0">
                      <tr>
                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Month</th>
                        <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Payment</th>
                        <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Principal</th>
                        <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Interest</th>
                        <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Balance</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                      @for (entry of amortizationSchedule(); track entry.month) {
                        <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                          <td class="px-3 py-2 text-xs text-gray-900 dark:text-white">{{ entry.month }}</td>
                          <td class="px-3 py-2 text-xs text-right text-gray-900 dark:text-white">₱{{ formatNumber(entry.payment) }}</td>
                          <td class="px-3 py-2 text-xs text-right text-blue-600 dark:text-blue-400">₱{{ formatNumber(entry.principal) }}</td>
                          <td class="px-3 py-2 text-xs text-right text-purple-600 dark:text-purple-400">₱{{ formatNumber(entry.interest) }}</td>
                          <td class="px-3 py-2 text-xs text-right font-medium text-gray-900 dark:text-white">₱{{ formatNumber(entry.balance) }}</td>
                        </tr>
                      }
                    </tbody>
                  </table>
                </div>
              }
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: []
})
export class PaymentProcessingComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private router = inject(Router);

  loading = signal(false);
  processing = signal(false);
  showAmortization = signal(false);
  loan = signal<Loan | null>(null);
  paymentSchedule = signal<PaymentSchedule[]>([]);
  amortizationSchedule = signal<AmortizationEntry[]>([]);

  // Form fields
  paymentAmount = 0;
  paymentDate = new Date().toISOString().split('T')[0];
  paymentMethod = 'cash';
  referenceNumber = '';
  paymentNotes = '';

  // Computed values
  allocation = computed(() => this.calculatePaymentAllocation());
  newBalance = computed(() => {
    const currentBalance = this.loan()?.outstandingBalance || 0;
    const principal = this.allocation().principal;
    return Math.max(0, currentBalance - principal);
  });

  ngOnInit() {
    const loanId = this.route.snapshot.paramMap.get('id');
    if (loanId) {
      this.loadLoanDetails(loanId);
    }
  }

  loadLoanDetails(loanId: string) {
    this.loading.set(true);

    // TODO: Replace with actual API call
    setTimeout(() => {
      // Mock loan data
      this.loan.set({
        id: 1,
        loanNumber: 'ML-2025-001',
        customerId: 1,
        customerName: 'Juan Dela Cruz',
        principalAmount: 100000,
        interestRate: 12,
        term: 12,
        monthlyPayment: 8884.88,
        outstandingBalance: 75000,
        totalPaid: 25000,
        status: 'active',
        disbursementDate: '2025-01-15',
        maturityDate: '2026-01-15'
      });

      // Mock payment schedule
      this.paymentSchedule.set([
        {
          id: 1,
          paymentNumber: 1,
          dueDate: '2025-02-15',
          principalDue: 7884.88,
          interestDue: 1000,
          totalDue: 8884.88,
          principalPaid: 7884.88,
          interestPaid: 1000,
          totalPaid: 8884.88,
          balance: 92115.12,
          status: 'paid'
        },
        {
          id: 2,
          paymentNumber: 2,
          dueDate: '2025-03-15',
          principalDue: 7963.77,
          interestDue: 921.11,
          totalDue: 8884.88,
          principalPaid: 7963.77,
          interestPaid: 921.11,
          totalPaid: 8884.88,
          balance: 84151.35,
          status: 'paid'
        },
        {
          id: 3,
          paymentNumber: 3,
          dueDate: '2025-04-15',
          principalDue: 8043.45,
          interestDue: 841.43,
          totalDue: 8884.88,
          principalPaid: 4000,
          interestPaid: 500,
          totalPaid: 4500,
          balance: 80151.35,
          status: 'partial'
        },
        {
          id: 4,
          paymentNumber: 4,
          dueDate: '2025-05-15',
          principalDue: 8123.88,
          interestDue: 761,
          totalDue: 8884.88,
          principalPaid: 0,
          interestPaid: 0,
          totalPaid: 0,
          balance: 75000,
          status: 'pending'
        },
        {
          id: 5,
          paymentNumber: 5,
          dueDate: '2025-06-15',
          principalDue: 8205.12,
          interestDue: 679.76,
          totalDue: 8884.88,
          principalPaid: 0,
          interestPaid: 0,
          totalPaid: 0,
          balance: 66794.88,
          status: 'pending'
        }
      ]);

      // Generate amortization schedule
      this.generateAmortizationSchedule();

      this.loading.set(false);
    }, 500);
  }

  generateAmortizationSchedule() {
    const loanData = this.loan();
    if (!loanData) return;

    const principal = loanData.principalAmount;
    const monthlyRate = loanData.interestRate / 100 / 12;
    const term = loanData.term;
    const payment = loanData.monthlyPayment;

    let balance = principal;
    const schedule: AmortizationEntry[] = [];

    for (let month = 1; month <= term; month++) {
      const interestPayment = balance * monthlyRate;
      const principalPayment = payment - interestPayment;
      balance -= principalPayment;

      schedule.push({
        month,
        payment,
        principal: principalPayment,
        interest: interestPayment,
        balance: Math.max(0, balance)
      });
    }

    this.amortizationSchedule.set(schedule);
  }

  calculateAllocation() {
    // Recalculate on amount change
  }

  calculatePaymentAllocation(): PaymentAllocation {
    const amount = this.paymentAmount || 0;

    // Mock allocation logic
    const penalties = 0; // Calculate from overdue payments
    const fees = 0; // Any outstanding fees
    const remainingAfterPenaltiesAndFees = amount - penalties - fees;

    // Get next unpaid schedule
    const nextSchedule = this.paymentSchedule().find(s => s.status !== 'paid');
    if (!nextSchedule) {
      return { amount, principal: amount, interest: 0, fees: 0, penalties: 0 };
    }

    const interestDue = nextSchedule.interestDue - nextSchedule.interestPaid;
    const interest = Math.min(interestDue, remainingAfterPenaltiesAndFees);
    const principal = Math.max(0, remainingAfterPenaltiesAndFees - interest);

    return {
      amount,
      principal,
      interest,
      fees,
      penalties
    };
  }

  processPayment() {
    if (!this.paymentAmount || this.paymentAmount <= 0) return;

    this.processing.set(true);

    // TODO: Replace with actual API call
    setTimeout(() => {
      alert('Payment processed successfully!');
      this.processing.set(false);
      this.router.navigate(['/platforms/money-loan/overview']);
    }, 1000);
  }

  toggleAmortization() {
    this.showAmortization.set(!this.showAmortization());
  }

  getStatusBadgeClass(status: string): string {
    const baseClasses = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium';
    const colorMap: Record<string, string> = {
      paid: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      partial: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
      pending: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
      overdue: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
    };
    return `${baseClasses} ${colorMap[status] || colorMap['pending']}`;
  }

  formatNumber(value: number): string {
    return value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  goBack() {
    this.router.navigate(['/platforms/money-loan/overview']);
  }
}
