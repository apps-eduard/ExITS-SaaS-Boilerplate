import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoanService } from '../shared/services/loan.service';

@Component({
  selector: 'app-apply-loan',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 space-y-3">
      <form (ngSubmit)="submitApplication()" class="space-y-3">
        <!-- Loan Details -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h2 class="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            Loan Information
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <!-- Row 1 -->
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Loan Amount <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <span class="absolute left-3 top-2.5 text-gray-500 dark:text-gray-400 text-sm">₱</span>
                <input
                  type="number"
                  [(ngModel)]="formData.principalAmount"
                  (ngModelChange)="calculateLoan()"
                  name="principalAmount"
                  required
                  min="5000"
                  max="500000"
                  step="1000"
                  autofocus
                  class="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Min: ₱5,000 | Max: ₱500,000</p>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Payment Frequency <span class="text-red-500">*</span>
              </label>
              <select
                [(ngModel)]="formData.paymentFrequency"
                (ngModelChange)="calculateLoan()"
                name="paymentFrequency"
                required
                class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Payment Frequency</option>
                <option value="daily">Daily</option>
                <option value="weekly">Weekly</option>
                <option value="monthly">Monthly</option>
                <option value="quarterly">Quarterly</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Loan Term <span class="text-red-500">*</span>
              </label>
              <div class="grid grid-cols-2 gap-2">
                <input
                  type="number"
                  [(ngModel)]="formData.termValue"
                  (ngModelChange)="calculateLoan()"
                  name="termValue"
                  required
                  min="1"
                  class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="Number">
                <select
                  [(ngModel)]="formData.termUnit"
                  (ngModelChange)="calculateLoan()"
                  name="termUnit"
                  required
                  class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <option value="">Unit</option>
                  <option value="days">Days</option>
                  <option value="weeks">Weeks</option>
                  <option value="months">Months</option>
                  <option value="quarters">Quarters</option>
                  <option value="years">Years</option>
                </select>
              </div>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                @if (formData.termValue && formData.termUnit) {
                  <span>{{ formData.termValue }} {{ formData.termUnit }} ({{ getTermInMonths() }} months)</span>
                } @else {
                  <span>e.g., 1 month, 2 weeks, 6 months</span>
                }
              </p>
            </div>

            <!-- Row 2 -->
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Interest Type <span class="text-red-500">*</span>
              </label>
              <select
                [(ngModel)]="formData.interestType"
                (ngModelChange)="calculateLoan()"
                name="interestType"
                required
                class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Type</option>
                <option value="flat">Flat Rate (Simple)</option>
                <option value="reducing">Reducing Balance</option>
              </select>
            </div>

            <div class="md:col-span-2">
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Purpose of Loan <span class="text-red-500">*</span>
              </label>
              <select
                [(ngModel)]="formData.purpose"
                name="purpose"
                required
                class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Purpose</option>
                <option value="business">Business</option>
                <option value="education">Education</option>
                <option value="medical">Medical</option>
                <option value="personal">Personal</option>
                <option value="home_improvement">Home Improvement</option>
                <option value="debt_consolidation">Debt Consolidation</option>
                <option value="other">Other</option>
              </select>
            </div>
          </div>
        </div>

        <!-- Loan Preview -->
        @if (loanPreview()) {
          <div class="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
            <h3 class="text-base font-semibold text-green-900 dark:text-green-300 mb-3 flex items-center gap-2">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
              </svg>
              Loan Calculation Preview
            </h3>

            <div class="grid grid-cols-1 md:grid-cols-4 gap-2">
              <div class="bg-white dark:bg-gray-800 rounded-lg p-2">
                <p class="text-xs text-gray-600 dark:text-gray-400">Principal Amount</p>
                <p class="text-lg font-bold text-gray-900 dark:text-white">₱{{ formatCurrency(loanPreview()!.principal) }}</p>
              </div>
              <div class="bg-white dark:bg-gray-800 rounded-lg p-2">
                <p class="text-xs text-gray-600 dark:text-gray-400">Interest Amount</p>
                <p class="text-lg font-bold text-orange-600 dark:text-orange-400">₱{{ formatCurrency(loanPreview()!.interest) }}</p>
              </div>
              <div class="bg-white dark:bg-gray-800 rounded-lg p-2">
                <p class="text-xs text-gray-600 dark:text-gray-400">Total Amount</p>
                <p class="text-lg font-bold text-blue-600 dark:text-blue-400">₱{{ formatCurrency(loanPreview()!.total) }}</p>
              </div>
              <div class="bg-white dark:bg-gray-800 rounded-lg p-2">
                <p class="text-xs text-gray-600 dark:text-gray-400">{{ getPaymentLabel() }}</p>
                <p class="text-lg font-bold text-green-600 dark:text-green-400">₱{{ formatCurrency(loanPreview()!.paymentAmount) }}</p>
              </div>
            </div>

            <div class="mt-3 p-2 bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded">
              <p class="text-sm text-blue-900 dark:text-blue-300">
                <strong>Interest Rate:</strong> {{ formData.interestType === 'flat' ? '12%' : '18%' }} per annum ({{ formData.interestType }}) •
                <strong>Term:</strong> {{ loanPreview()!.termDisplay }} •
                <strong>Total Payments:</strong> {{ loanPreview()!.totalPeriods }}
              </p>
            </div>
          </div>
        }

        <!-- Employment Information -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h2 class="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
            Employment & Income
          </h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Employment Status <span class="text-red-500">*</span>
              </label>
              <select
                [(ngModel)]="formData.employmentStatus"
                name="employmentStatus"
                required
                class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Status</option>
                <option value="employed">Employed</option>
                <option value="self-employed">Self-Employed</option>
                <option value="business_owner">Business Owner</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Monthly Income <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <span class="absolute left-3 top-2.5 text-gray-500 dark:text-gray-400 text-sm">₱</span>
                <input
                  type="number"
                  [(ngModel)]="formData.monthlyIncome"
                  name="monthlyIncome"
                  required
                  min="10000"
                  class="w-full pl-8 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Employer/Business Name
              </label>
              <input
                type="text"
                [(ngModel)]="formData.employerName"
                name="employerName"
                class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Years in Current Job
              </label>
              <input
                type="number"
                [(ngModel)]="formData.yearsEmployed"
                name="yearsEmployed"
                min="0"
                step="0.5"
                class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
          </div>
        </div>

        <!-- Additional Information -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h2 class="text-base font-semibold text-gray-900 dark:text-white mb-3">Additional Information</h2>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Loan Purpose Details
            </label>
            <textarea
              [(ngModel)]="formData.notes"
              name="notes"
              rows="3"
              placeholder="Please provide more details about how you plan to use this loan..."
              class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
          </div>

          <div class="mt-3">
            <label class="flex items-start gap-2">
              <input
                type="checkbox"
                [(ngModel)]="formData.agreeToTerms"
                name="agreeToTerms"
                required
                class="mt-1">
              <span class="text-sm text-gray-600 dark:text-gray-400">
                I agree to the <a href="#" class="text-blue-600 hover:underline">terms and conditions</a> and understand that this loan application will be subject to approval based on my credit score and financial status.
              </span>
            </label>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex items-center justify-end gap-2">
          <button
            type="button"
            (click)="cancel()"
            class="px-4 py-2 text-sm border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Cancel
          </button>
          <button
            type="submit"
            [disabled]="submitting() || !formData.agreeToTerms"
            class="inline-flex items-center gap-2 px-4 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            @if (submitting()) {
              <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            }
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            Submit Application
          </button>
        </div>
      </form>
    </div>
  `
})
export class ApplyLoanComponent implements OnInit {
  private loanService = inject(LoanService);
  private router = inject(Router);

  submitting = signal(false);
  loanPreview = signal<any>(null);

  formData: any = {
    principalAmount: 50000,
    paymentFrequency: 'monthly',
    termValue: 1,
    termUnit: 'months',
    interestType: 'reducing',
    purpose: 'personal',
    employmentStatus: 'employed',
    monthlyIncome: null,
    employerName: '',
    yearsEmployed: 0,
    notes: '',
    agreeToTerms: false
  };

  ngOnInit() {
    this.calculateLoan();
  }

  calculateLoan() {
    if (!this.formData.principalAmount || !this.formData.termValue || !this.formData.termUnit ||
        !this.formData.interestType || !this.formData.paymentFrequency) {
      this.loanPreview.set(null);
      return;
    }

    const principal = this.formData.principalAmount;

    // Convert term to months for calculation
    let termInMonths = this.convertToMonths(this.formData.termValue, this.formData.termUnit);

    // Get payment periods per year based on frequency
    const periodsPerYear = this.getPeriodsPerYear(this.formData.paymentFrequency);
    const totalPeriods = this.getTotalPeriods(this.formData.termValue, this.formData.termUnit, this.formData.paymentFrequency);

    const rate = this.formData.interestType === 'flat' ? 0.12 : 0.18; // Annual rate

    let interest: number;
    let paymentAmount: number;

    if (this.formData.interestType === 'flat') {
      // Flat rate: I = P * R * T
      interest = principal * rate * (termInMonths / 12);
      paymentAmount = (principal + interest) / totalPeriods;
    } else {
      // Reducing balance
      const periodRate = rate / periodsPerYear;
      paymentAmount = principal * (periodRate * Math.pow(1 + periodRate, totalPeriods)) /
                      (Math.pow(1 + periodRate, totalPeriods) - 1);
      interest = (paymentAmount * totalPeriods) - principal;
    }

    this.loanPreview.set({
      principal,
      interest,
      total: principal + interest,
      paymentAmount,
      paymentFrequency: this.formData.paymentFrequency,
      totalPeriods,
      termDisplay: `${this.formData.termValue} ${this.formData.termUnit}`
    });
  }

  convertToMonths(value: number, unit: string): number {
    switch(unit) {
      case 'days': return value / 30;
      case 'weeks': return value / 4.33;
      case 'months': return value;
      case 'quarters': return value * 3;
      case 'years': return value * 12;
      default: return value;
    }
  }

  getPeriodsPerYear(frequency: string): number {
    switch(frequency) {
      case 'daily': return 365;
      case 'weekly': return 52;
      case 'monthly': return 12;
      case 'quarterly': return 4;
      default: return 12;
    }
  }

  getTotalPeriods(termValue: number, termUnit: string, frequency: string): number {
    const monthsInTerm = this.convertToMonths(termValue, termUnit);
    const periodsPerYear = this.getPeriodsPerYear(frequency);
    return Math.ceil((monthsInTerm / 12) * periodsPerYear);
  }

  submitApplication() {
    this.submitting.set(true);

    const applicationData = {
      ...this.formData,
      customerId: 1, // This would come from auth
      status: 'pending',
      requestedAmount: this.formData.principalAmount,
      interestRate: this.formData.interestType === 'flat' ? 12 : 18
    };

    // In a real app, this would call a loan application API endpoint
    this.loanService.createLoan(applicationData).subscribe({
      next: () => {
        this.submitting.set(false);
        // Show success message
        this.router.navigate(['/platforms/money-loan/customer/loans']);
      },
      error: (error: any) => {
        console.error('Error submitting application:', error);
        this.submitting.set(false);
        // Show error message
      }
    });
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  getPaymentLabel(): string {
    const frequency = this.formData.paymentFrequency;
    switch(frequency) {
      case 'daily': return 'Daily Payment';
      case 'weekly': return 'Weekly Payment';
      case 'monthly': return 'Monthly Payment';
      case 'quarterly': return 'Quarterly Payment';
      default: return 'Payment Amount';
    }
  }

  getTermInMonths(): string {
    if (!this.formData.termValue || !this.formData.termUnit) {
      return '0';
    }
    const months = this.convertToMonths(this.formData.termValue, this.formData.termUnit);
    return months.toFixed(1);
  }

  cancel() {
    this.router.navigate(['/platforms/money-loan/customer/dashboard']);
  }
}
