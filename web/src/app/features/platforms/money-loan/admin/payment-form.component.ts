import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { LoanService } from '../shared/services/loan.service';
import { Loan } from '../shared/models/loan.models';

@Component({
  selector: 'app-payment-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 md:p-6 space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Record Payment</h1>
          <p class="text-sm text-gray-600 dark:text-gray-400">Process loan payment and update balance</p>
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

      @if (loan()) {
        <!-- Loan Summary -->
        <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <p class="text-xs text-blue-100 mb-1">Loan Number</p>
              <p class="text-lg font-bold">{{ loan()?.loanNumber }}</p>
            </div>
            <div>
              <p class="text-xs text-blue-100 mb-1">Customer</p>
              <p class="text-lg font-bold">{{ loan()?.customer?.firstName }} {{ loan()?.customer?.lastName }}</p>
            </div>
            <div>
              <p class="text-xs text-blue-100 mb-1">Outstanding Balance</p>
              <p class="text-2xl font-bold">₱{{ formatCurrency(loan()!.outstandingBalance) }}</p>
            </div>
            <div>
              <p class="text-xs text-blue-100 mb-1">Monthly Payment</p>
              <p class="text-lg font-bold">₱{{ formatCurrency(loan()!.monthlyPayment) }}</p>
            </div>
          </div>
        </div>

        <!-- Payment Form -->
        <form (ngSubmit)="onSubmit()" class="space-y-6">
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
              Payment Information
            </h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Payment Amount <span class="text-red-500">*</span>
                </label>
                <div class="relative">
                  <span class="absolute left-3 top-2.5 text-gray-500 dark:text-gray-400">₱</span>
                  <input
                    type="number"
                    [(ngModel)]="formData.amount"
                    name="amount"
                    required
                    step="0.01"
                    min="0"
                    [max]="loan()?.outstandingBalance || null"
                    class="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                </div>
                <div class="mt-2 flex flex-wrap gap-2">
                  <button
                    type="button"
                    (click)="setAmount(loan()!.monthlyPayment)"
                    class="px-3 py-1 text-xs bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 rounded hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-colors">
                    Monthly (₱{{ formatCurrency(loan()!.monthlyPayment) }})
                  </button>
                  <button
                    type="button"
                    (click)="setAmount(loan()!.outstandingBalance)"
                    class="px-3 py-1 text-xs bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded hover:bg-green-200 dark:hover:bg-green-900/50 transition-colors">
                    Full Balance (₱{{ formatCurrency(loan()!.outstandingBalance) }})
                  </button>
                </div>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Payment Date <span class="text-red-500">*</span>
                </label>
                <input
                  type="date"
                  [(ngModel)]="formData.paymentDate"
                  name="paymentDate"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Payment Method <span class="text-red-500">*</span>
                </label>
                <select
                  [(ngModel)]="formData.paymentMethod"
                  name="paymentMethod"
                  required
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Select Method</option>
                  <option value="cash">Cash</option>
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="check">Check</option>
                  <option value="gcash">GCash</option>
                  <option value="paymaya">PayMaya</option>
                  <option value="credit_card">Credit Card</option>
                  <option value="debit_card">Debit Card</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Transaction Reference
                </label>
                <input
                  type="text"
                  [(ngModel)]="formData.transactionReference"
                  name="transactionReference"
                  placeholder="Optional reference number"
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>

              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Notes / Comments
                </label>
                <textarea
                  [(ngModel)]="formData.notes"
                  name="notes"
                  rows="3"
                  placeholder="Add any additional notes about this payment..."
                  class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
              </div>
            </div>
          </div>

          <!-- Payment Summary -->
          @if (formData.amount > 0) {
            <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6">
              <h3 class="text-sm font-semibold text-blue-900 dark:text-blue-300 mb-3">Payment Summary</h3>
              <div class="space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-blue-700 dark:text-blue-400">Payment Amount</span>
                  <span class="font-semibold text-blue-900 dark:text-blue-300">₱{{ formatCurrency(formData.amount) }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-blue-700 dark:text-blue-400">Current Balance</span>
                  <span class="font-semibold text-blue-900 dark:text-blue-300">₱{{ formatCurrency(loan()!.outstandingBalance) }}</span>
                </div>
                <div class="border-t border-blue-200 dark:border-blue-800 pt-2 flex justify-between">
                  <span class="text-sm font-semibold text-blue-900 dark:text-blue-300">New Balance</span>
                  <span class="text-lg font-bold text-blue-900 dark:text-blue-300">
                    ₱{{ formatCurrency(loan()!.outstandingBalance - formData.amount) }}
                  </span>
                </div>
                @if (formData.amount >= loan()!.outstandingBalance) {
                  <div class="mt-3 p-3 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded">
                    <p class="text-sm font-medium text-green-800 dark:text-green-400 flex items-center gap-2">
                      <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                      </svg>
                      This payment will mark the loan as PAID OFF
                    </p>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Form Actions -->
          <div class="flex items-center justify-end gap-3">
            <button
              type="button"
              (click)="goBack()"
              class="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cancel
            </button>
            <button
              type="submit"
              [disabled]="saving() || !formData.amount || formData.amount <= 0"
              class="inline-flex items-center gap-2 px-6 py-2.5 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              @if (saving()) {
                <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              }
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              Record Payment
            </button>
          </div>
        </form>
      }
    </div>
  `
})
export class PaymentFormComponent implements OnInit {
  private loanService = inject(LoanService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  loan = signal<Loan | null>(null);
  saving = signal(false);

  formData: any = {
    loanId: null,
    amount: 0,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMethod: '',
    transactionReference: '',
    notes: ''
  };

  ngOnInit() {
    const loanId = this.route.snapshot.queryParamMap.get('loanId');
    if (loanId) {
      this.formData.loanId = parseInt(loanId);
      this.loadLoan(parseInt(loanId));
    }
  }

  loadLoan(loanId: number) {
    this.loanService.getLoanById(loanId).subscribe({
      next: (response: { success: boolean; data: Loan }) => {
        this.loan.set(response.data);
        // Default to monthly payment amount
        this.formData.amount = response.data.monthlyPayment;
      },
      error: (error: any) => {
        console.error('Error loading loan:', error);
      }
    });
  }

  setAmount(amount: number) {
    this.formData.amount = amount;
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  onSubmit() {
    this.saving.set(true);
    
    this.loanService.recordPayment(this.formData).subscribe({
      next: () => {
        this.saving.set(false);
  this.router.navigate(['/platforms/money-loan/dashboard/loans', this.formData.loanId]);
      },
      error: (error: any) => {
        console.error('Error recording payment:', error);
        this.saving.set(false);
      }
    });
  }

  goBack() {
    if (this.formData.loanId) {
  this.router.navigate(['/platforms/money-loan/dashboard/loans', this.formData.loanId]);
    } else {
  this.router.navigate(['/platforms/money-loan/dashboard/loans']);
    }
  }
}
