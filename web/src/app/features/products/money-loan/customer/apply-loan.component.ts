import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoanService } from '../shared/services/loan.service';

@Component({
  selector: 'app-apply-loan',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 md:p-6 space-y-6">
      <!-- Header -->
      <div class="bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg p-6 text-white">
        <h1 class="text-2xl font-bold mb-2">Apply for a Loan</h1>
        <p class="text-blue-100">Complete the form below to apply for a loan. Get instant approval!</p>
      </div>

      <form (ngSubmit)="submitApplication()" class="space-y-6">
        <!-- Loan Details -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            Loan Information
          </h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Loan Amount <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <span class="absolute left-3 top-3 text-gray-500 dark:text-gray-400">₱</span>
                <input
                  type="number"
                  [(ngModel)]="formData.principalAmount"
                  (ngModelChange)="calculateLoan()"
                  name="principalAmount"
                  required
                  min="5000"
                  max="500000"
                  step="1000"
                  class="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
              <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Min: ₱5,000 | Max: ₱500,000</p>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Loan Term <span class="text-red-500">*</span>
              </label>
              <select
                [(ngModel)]="formData.termMonths"
                (ngModelChange)="calculateLoan()"
                name="termMonths"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Term</option>
                <option value="6">6 Months</option>
                <option value="12">12 Months (1 Year)</option>
                <option value="18">18 Months</option>
                <option value="24">24 Months (2 Years)</option>
                <option value="36">36 Months (3 Years)</option>
                <option value="48">48 Months (4 Years)</option>
                <option value="60">60 Months (5 Years)</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Interest Type <span class="text-red-500">*</span>
              </label>
              <select
                [(ngModel)]="formData.interestType"
                (ngModelChange)="calculateLoan()"
                name="interestType"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Type</option>
                <option value="flat">Flat Rate (Simple)</option>
                <option value="reducing">Reducing Balance</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Purpose of Loan <span class="text-red-500">*</span>
              </label>
              <select
                [(ngModel)]="formData.purpose"
                name="purpose"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
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
          <div class="bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 border border-green-200 dark:border-green-800 rounded-lg p-6">
            <h3 class="text-lg font-semibold text-green-900 dark:text-green-300 mb-4 flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 7h6m0 10v-3m-3 3h.01M9 17h.01M9 14h.01M12 14h.01M15 11h.01M12 11h.01M9 11h.01M7 21h10a2 2 0 002-2V5a2 2 0 00-2-2H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
              </svg>
              Loan Calculation Preview
            </h3>
            
            <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div class="bg-white dark:bg-gray-800 rounded-lg p-4">
                <p class="text-xs text-gray-600 dark:text-gray-400">Principal Amount</p>
                <p class="text-xl font-bold text-gray-900 dark:text-white">₱{{ formatCurrency(loanPreview()!.principal) }}</p>
              </div>
              <div class="bg-white dark:bg-gray-800 rounded-lg p-4">
                <p class="text-xs text-gray-600 dark:text-gray-400">Interest Amount</p>
                <p class="text-xl font-bold text-orange-600 dark:text-orange-400">₱{{ formatCurrency(loanPreview()!.interest) }}</p>
              </div>
              <div class="bg-white dark:bg-gray-800 rounded-lg p-4">
                <p class="text-xs text-gray-600 dark:text-gray-400">Total Amount</p>
                <p class="text-xl font-bold text-blue-600 dark:text-blue-400">₱{{ formatCurrency(loanPreview()!.total) }}</p>
              </div>
              <div class="bg-white dark:bg-gray-800 rounded-lg p-4">
                <p class="text-xs text-gray-600 dark:text-gray-400">Monthly Payment</p>
                <p class="text-xl font-bold text-green-600 dark:text-green-400">₱{{ formatCurrency(loanPreview()!.monthly) }}</p>
              </div>
            </div>

            <div class="mt-4 p-3 bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800 rounded">
              <p class="text-sm text-blue-900 dark:text-blue-300">
                <strong>Interest Rate:</strong> {{ formData.interestType === 'flat' ? '12%' : '18%' }} per annum ({{ formData.interestType }})
              </p>
            </div>
          </div>
        }

        <!-- Employment Information -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
            </svg>
            Employment & Income
          </h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Employment Status <span class="text-red-500">*</span>
              </label>
              <select
                [(ngModel)]="formData.employmentStatus"
                name="employmentStatus"
                required
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select Status</option>
                <option value="employed">Employed</option>
                <option value="self-employed">Self-Employed</option>
                <option value="business_owner">Business Owner</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Monthly Income <span class="text-red-500">*</span>
              </label>
              <div class="relative">
                <span class="absolute left-3 top-3 text-gray-500 dark:text-gray-400">₱</span>
                <input
                  type="number"
                  [(ngModel)]="formData.monthlyIncome"
                  name="monthlyIncome"
                  required
                  min="10000"
                  class="w-full pl-8 pr-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              </div>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Employer/Business Name
              </label>
              <input
                type="text"
                [(ngModel)]="formData.employerName"
                name="employerName"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Years in Current Job
              </label>
              <input
                type="number"
                [(ngModel)]="formData.yearsEmployed"
                name="yearsEmployed"
                min="0"
                step="0.5"
                class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
            </div>
          </div>
        </div>

        <!-- Additional Information -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Additional Information</h2>
          
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
              Loan Purpose Details
            </label>
            <textarea
              [(ngModel)]="formData.notes"
              name="notes"
              rows="4"
              placeholder="Please provide more details about how you plan to use this loan..."
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500"></textarea>
          </div>

          <div class="mt-4">
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
        <div class="flex items-center justify-end gap-3">
          <button
            type="button"
            (click)="cancel()"
            class="px-6 py-3 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            Cancel
          </button>
          <button
            type="submit"
            [disabled]="submitting() || !formData.agreeToTerms"
            class="inline-flex items-center gap-2 px-6 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
            @if (submitting()) {
              <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            }
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
    termMonths: 12,
    interestType: 'reducing',
    purpose: '',
    employmentStatus: '',
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
    if (!this.formData.principalAmount || !this.formData.termMonths || !this.formData.interestType) {
      this.loanPreview.set(null);
      return;
    }

    const principal = this.formData.principalAmount;
    const months = this.formData.termMonths;
    const rate = this.formData.interestType === 'flat' ? 0.12 : 0.18; // Annual rate

    let interest: number;
    let monthly: number;

    if (this.formData.interestType === 'flat') {
      // Flat rate: I = P * R * T
      interest = principal * rate * (months / 12);
      monthly = (principal + interest) / months;
    } else {
      // Reducing balance
      const monthlyRate = rate / 12;
      monthly = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) / 
                (Math.pow(1 + monthlyRate, months) - 1);
      interest = (monthly * months) - principal;
    }

    this.loanPreview.set({
      principal,
      interest,
      total: principal + interest,
      monthly
    });
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
        this.router.navigate(['/products/money-loan/customer/loans']);
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

  cancel() {
    this.router.navigate(['/products/money-loan/customer/dashboard']);
  }
}

function inject(service: any): any {
  return null as any;
}
