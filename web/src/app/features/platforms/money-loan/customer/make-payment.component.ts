import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { LoanService } from '../shared/services/loan.service';
import { Loan } from '../shared/models/loan.models';

@Component({
  selector: 'app-customer-make-payment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 md:p-6 space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Make a Payment</h1>
          <p class="text-sm text-gray-600 dark:text-gray-400">Pay your loan quickly and securely</p>
        </div>
      </div>

      @if (!selectedLoan()) {
        <!-- Select Loan -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Select a Loan</h2>
          <div class="space-y-3">
            @for (loan of activeLoans(); track loan.id) {
              <button
                (click)="selectLoan(loan)"
                class="w-full text-left border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 dark:hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all">
                <div class="flex items-center justify-between">
                  <div>
                    <p class="font-semibold text-gray-900 dark:text-white">{{ loan.loanNumber }}</p>
                    <p class="text-sm text-gray-600 dark:text-gray-400">Outstanding: ₱{{ formatCurrency(loan.outstandingBalance) }}</p>
                  </div>
                  <svg class="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </div>
              </button>
            }
          </div>
        </div>
      } @else {
        <!-- Payment Form -->
        <div class="space-y-6">
          <!-- Loan Summary -->
          <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
            <div class="flex items-center justify-between mb-4">
              <div>
                <p class="text-sm text-blue-100">Paying for</p>
                <p class="text-xl font-bold">{{ selectedLoan()?.loanNumber }}</p>
              </div>
              <button
                (click)="selectedLoan.set(null)"
                class="text-white hover:bg-white/20 p-2 rounded transition-colors">
                Change Loan
              </button>
            </div>
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-xs text-blue-100">Outstanding Balance</p>
                <p class="text-2xl font-bold">₱{{ formatCurrency(selectedLoan()!.outstandingBalance) }}</p>
              </div>
              <div>
                <p class="text-xs text-blue-100">Monthly Payment</p>
                <p class="text-2xl font-bold">₱{{ formatCurrency(selectedLoan()!.monthlyPayment) }}</p>
              </div>
            </div>
          </div>

          <!-- Payment Amount -->
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Amount</h2>
            
            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Enter Amount
              </label>
              <div class="relative">
                <span class="absolute left-4 top-4 text-gray-500 dark:text-gray-400 text-lg">₱</span>
                <input
                  type="number"
                  [(ngModel)]="paymentAmount"
                  step="0.01"
                  min="0"
                  [max]="selectedLoan()?.outstandingBalance || null"
                  class="w-full pl-10 pr-4 py-3 text-lg border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
            </div>

            <!-- Quick Amount Buttons -->
            <div class="grid grid-cols-2 md:grid-cols-4 gap-2 mb-4">
              <button
                type="button"
                (click)="setPaymentAmount(selectedLoan()!.monthlyPayment)"
                class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Monthly
              </button>
              <button
                type="button"
                (click)="setPaymentAmount(selectedLoan()!.monthlyPayment * 2)"
                class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                2 Months
              </button>
              <button
                type="button"
                (click)="setPaymentAmount(selectedLoan()!.monthlyPayment * 3)"
                class="px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                3 Months
              </button>
              <button
                type="button"
                (click)="setPaymentAmount(selectedLoan()!.outstandingBalance)"
                class="px-4 py-2 border border-green-500 dark:border-green-500 text-green-600 dark:text-green-400 rounded-lg hover:bg-green-50 dark:hover:bg-green-900/20 transition-colors">
                Full Balance
              </button>
            </div>

            <!-- Payment Summary -->
            @if (paymentAmount > 0) {
              <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div class="space-y-2">
                  <div class="flex justify-between text-sm">
                    <span class="text-blue-700 dark:text-blue-400">Payment Amount</span>
                    <span class="font-semibold text-blue-900 dark:text-blue-300">₱{{ formatCurrency(paymentAmount) }}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-blue-700 dark:text-blue-400">Current Balance</span>
                    <span class="font-semibold text-blue-900 dark:text-blue-300">₱{{ formatCurrency(selectedLoan()!.outstandingBalance) }}</span>
                  </div>
                  <div class="border-t border-blue-200 dark:border-blue-800 pt-2 flex justify-between">
                    <span class="text-sm font-semibold text-blue-900 dark:text-blue-300">Remaining Balance</span>
                    <span class="text-lg font-bold text-blue-900 dark:text-blue-300">
                      ₱{{ formatCurrency(Math.max(0, selectedLoan()!.outstandingBalance - paymentAmount)) }}
                    </span>
                  </div>
                  @if (paymentAmount >= selectedLoan()!.outstandingBalance) {
                    <div class="mt-2 p-3 bg-green-100 dark:bg-green-900/30 border border-green-200 dark:border-green-800 rounded">
                      <p class="text-sm font-medium text-green-800 dark:text-green-400 flex items-center gap-2">
                        <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                        🎉 This will fully pay off your loan!
                      </p>
                    </div>
                  }
                </div>
              </div>
            }
          </div>

          <!-- Payment Method -->
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Payment Method</h2>
            
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              @for (method of paymentMethods; track method.value) {
                <label
                  [class]="paymentMethod === method.value ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700'"
                  class="border-2 rounded-lg p-4 cursor-pointer hover:border-blue-500 dark:hover:border-blue-500 transition-colors">
                  <input
                    type="radio"
                    name="paymentMethod"
                    [value]="method.value"
                    [(ngModel)]="paymentMethod"
                    class="sr-only">
                  <div class="flex items-center gap-3">
                    <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-bold">
                      {{ method.icon }}
                    </div>
                    <div>
                      <p class="font-medium text-gray-900 dark:text-white">{{ method.label }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">{{ method.description }}</p>
                    </div>
                  </div>
                </label>
              }
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center justify-end gap-3">
            <button
              (click)="cancel()"
              class="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              Cancel
            </button>
            <button
              (click)="processPayment()"
              [disabled]="!paymentAmount || paymentAmount <= 0 || !paymentMethod || processing()"
              class="inline-flex items-center gap-2 px-6 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              @if (processing()) {
                <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
              }
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              Process Payment
            </button>
          </div>
        </div>
      }
    </div>
  `
})
export class CustomerMakePaymentComponent implements OnInit {
  private loanService = inject(LoanService);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  activeLoans = signal<Loan[]>([]);
  selectedLoan = signal<Loan | null>(null);
  processing = signal(false);

  paymentAmount = 0;
  paymentMethod = '';

  paymentMethods = [
    { value: 'gcash', label: 'GCash', icon: 'GC', description: 'Pay via GCash' },
    { value: 'paymaya', label: 'PayMaya', icon: 'PM', description: 'Pay via PayMaya' },
    { value: 'bank_transfer', label: 'Bank Transfer', icon: 'BT', description: 'Online banking' },
    { value: 'credit_card', label: 'Credit Card', icon: 'CC', description: 'Visa, Mastercard' },
    { value: 'debit_card', label: 'Debit Card', icon: 'DC', description: 'Debit card payment' },
    { value: 'cash', label: 'Cash', icon: '💵', description: 'Pay at office' }
  ];

  Math = Math;

  ngOnInit() {
    const loanId = this.route.snapshot.queryParamMap.get('loanId');
    this.loadActiveLoans(loanId ? parseInt(loanId) : null);
  }

  loadActiveLoans(preselectedId: number | null) {
    const customerData = localStorage.getItem('customerData');
    if (!customerData) {
      console.warn('Customer data not found in localStorage. Unable to load active loans.');
      return;
    }

    try {
      const customer = JSON.parse(customerData);
      const tenantId = customer.tenantId || customer.tenant_id;
      const customerId = customer.id;

      if (!tenantId || !customerId) {
        console.warn('Missing tenantId or customerId in stored customer data.', customer);
        return;
      }

      this.loanService.listCustomerLoans(String(tenantId), Number(customerId), { page: 1, limit: 100 }).subscribe({
        next: (response: { success: boolean; message: string; data: Loan[]; pagination: any }) => {
          const active = (response.data || []).filter((l: Loan) => l.status === 'active' || l.status === 'overdue');
          this.activeLoans.set(active);

          if (preselectedId) {
            const loan = active.find((l: Loan) => l.id === preselectedId);
            if (loan) {
              this.selectLoan(loan);
            }
          }
        },
        error: (error: any) => {
          console.error('Error loading loans:', error);
        }
      });
    } catch (error) {
      console.error('Failed to parse customer data from localStorage.', error);
    }
  }

  selectLoan(loan: Loan) {
    this.selectedLoan.set(loan);
    this.paymentAmount = loan.monthlyPayment;
  }

  setPaymentAmount(amount: number) {
    const max = this.selectedLoan()?.outstandingBalance || 0;
    this.paymentAmount = Math.min(amount, max);
  }

  processPayment() {
    if (!this.selectedLoan() || !this.paymentAmount || !this.paymentMethod) return;

    this.processing.set(true);

    const paymentData = {
      loanId: this.selectedLoan()!.id,
      amount: this.paymentAmount,
      paymentMethod: this.paymentMethod,
      paymentDate: new Date().toISOString().split('T')[0],
      notes: `Customer payment via ${this.paymentMethod}`
    };

    this.loanService.recordPayment(paymentData).subscribe({
      next: () => {
        this.processing.set(false);
        // Show success message (you'd implement this)
        this.router.navigate(['/platforms/money-loan/customer/loans', this.selectedLoan()!.id]);
      },
      error: (error: any) => {
        console.error('Error processing payment:', error);
        this.processing.set(false);
        // Show error message
      }
    });
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  cancel() {
    this.router.navigate(['/platforms/money-loan/customer/dashboard']);
  }
}
