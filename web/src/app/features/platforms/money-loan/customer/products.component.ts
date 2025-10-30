import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-customer-products',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 md:p-6 max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">💼 Available Loan Products</h1>
        <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Browse and compare our competitive loan options</p>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="flex items-center justify-center py-12">
          <div class="text-center">
            <div class="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p class="mt-4 text-gray-600 dark:text-gray-400">Loading products...</p>
          </div>
        </div>
      } @else if (products().length === 0) {
        <!-- Empty State - Compact -->
        <div class="bg-gray-50 dark:bg-gray-800/50 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
          <div class="text-4xl mb-3">📦</div>
          <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-1">No Products Available</h3>
          <p class="text-sm text-gray-600 dark:text-gray-400">There are currently no loan products available.</p>
        </div>
      } @else {
        <!-- Products Grid -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (product of products(); track product.id) {
            <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg transition-all duration-200">
              <!-- Product Header -->
              <div class="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-t-lg">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="px-2 py-0.5 text-xs font-mono font-semibold bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded">
                        {{ product.productCode }}
                      </span>
                      @if (product.isActive) {
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                          <span class="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                          Active
                        </span>
                      }
                    </div>
                    <h3 class="text-base font-bold text-gray-900 dark:text-white">{{ product.name }}</h3>
                    <p class="text-xs text-gray-600 dark:text-gray-400 mt-1 line-clamp-2">
                      {{ product.description || 'Flexible loan solution tailored for your needs' }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Product Details -->
              <div class="p-4 space-y-3">
                <!-- Loan Amount Range -->
                <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
                  <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">💰 Loan Amount</p>
                  <p class="text-lg font-bold text-gray-900 dark:text-white">
                    {{ formatCurrency(product.minAmount) }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    up to {{ formatCurrency(product.maxAmount) }}
                  </p>
                </div>

                <!-- Interest Rate -->
                <div class="flex items-center justify-between text-xs py-2 border-b border-gray-100 dark:border-gray-700">
                  <span class="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <span>📊</span> Interest Rate
                  </span>
                  <span class="font-bold text-green-600 dark:text-green-400">
                    {{ product.interestRate }}%
                    <span class="text-gray-500 capitalize ml-1">({{ product.interestType }})</span>
                  </span>
                </div>

                <!-- Loan Term -->
                <div class="flex items-center justify-between text-xs py-2 border-b border-gray-100 dark:border-gray-700">
                  <span class="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <span>📅</span> Loan Term
                  </span>
                  <span class="font-semibold text-gray-900 dark:text-white">
                    @if (product.loanTermType === 'fixed') {
                      <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                        🔒 {{ (product.fixedTermDays || 90) / 30 }}mo
                      </span>
                    } @else {
                      {{ product.minTermDays / 30 }}-{{ product.maxTermDays / 30 }} months
                    }
                  </span>
                </div>

                <!-- Payment Frequency -->
                <div class="flex items-center justify-between text-xs py-2 border-b border-gray-100 dark:border-gray-700">
                  <span class="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <span>🔄</span> Payment Frequency
                  </span>
                  <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300 text-xs font-medium">
                    @if (product.paymentFrequency === 'daily') { 📅 }
                    @if (product.paymentFrequency === 'weekly') { 📆 }
                    @if (product.paymentFrequency === 'monthly') { 🗓️ }
                    <span class="capitalize">{{ product.paymentFrequency || 'weekly' }}</span>
                  </span>
                </div>

                <!-- Processing Fee -->
                @if (product.processingFeePercent > 0) {
                  <div class="flex items-center justify-between text-xs py-2 border-b border-gray-100 dark:border-gray-700">
                    <span class="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                      <span>💳</span> Processing Fee
                    </span>
                    <span class="font-semibold text-gray-900 dark:text-white">{{ product.processingFeePercent }}%</span>
                  </div>
                }

                <!-- Late Penalty -->
                <div class="flex items-center justify-between text-xs py-2">
                  <span class="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <span>⚠️</span> Late Penalty
                  </span>
                  <div class="text-right">
                    <p class="font-semibold text-amber-600 dark:text-amber-400">
                      {{ product.latePaymentPenaltyPercent }}%/day
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ product.gracePeriodDays }} day grace period</p>
                  </div>
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="p-4 pt-0 space-y-2">
                <button
                  (click)="openCalculator(product)"
                  class="w-full px-4 py-2.5 text-sm font-semibold text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg transition-all border border-blue-200 dark:border-blue-700">
                  🧮 Loan Calculator
                </button>
                <button
                  (click)="applyForLoan(product)"
                  class="w-full px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-all shadow-sm hover:shadow-md">
                  Apply for this Loan →
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Loan Calculator Modal -->
      @if (showCalculator()) {
        <div class="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4" (click)="closeCalculator()">
          <div class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl max-w-md w-full max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
            <!-- Modal Header - Compact -->
            <div class="sticky top-0 bg-gradient-to-r from-blue-600 to-purple-600 text-white px-4 py-3 rounded-t-xl">
              <div class="flex items-center justify-between">
                <div>
                  <h2 class="text-lg font-bold">🧮 Loan Calculator</h2>
                  <p class="text-xs text-blue-100">{{ selectedProduct()?.name }}</p>
                </div>
                <button (click)="closeCalculator()" class="text-white hover:bg-white/20 rounded-lg p-1.5 transition-colors">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                  </svg>
                </button>
              </div>
            </div>

            <!-- Modal Body - Compact -->
            <div class="p-4 space-y-3">
              <!-- Input: Loan Amount -->
              <div>
                <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  💰 Loan Amount
                </label>
                <div class="relative">
                  <span class="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500 text-sm">₱</span>
                  <input
                    type="number"
                    [(ngModel)]="calcAmount"
                    (input)="calculateLoan()"
                    [min]="selectedProduct()?.minAmount"
                    [max]="selectedProduct()?.maxAmount"
                    class="w-full pl-7 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter amount">
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                  {{ formatCurrency(selectedProduct()?.minAmount || 0) }} - {{ formatCurrency(selectedProduct()?.maxAmount || 0) }}
                </p>
              </div>

              <!-- Input: Loan Term (if flexible) -->
              @if (selectedProduct()?.loanTermType === 'flexible') {
                <div>
                  <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                    📅 Loan Term (Months)
                  </label>
                  <input
                    type="number"
                    [(ngModel)]="calcTermMonths"
                    (input)="calculateLoan()"
                    [min]="(selectedProduct()?.minTermDays || 30) / 30"
                    [max]="(selectedProduct()?.maxTermDays || 360) / 30"
                    class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Enter term">
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {{ (selectedProduct()?.minTermDays || 30) / 30 }} - {{ (selectedProduct()?.maxTermDays || 360) / 30 }} months
                  </p>
                </div>
              } @else {
                <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2.5 border border-purple-200 dark:border-purple-700">
                  <p class="text-xs font-semibold text-purple-900 dark:text-purple-100">
                    🔒 Fixed Term: {{ (selectedProduct()?.fixedTermDays || 90) / 30 }} months
                  </p>
                </div>
              }

              <!-- Calculation Results - Compact -->
              @if (calcAmount > 0) {
                <div class="bg-gradient-to-br from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-700 space-y-2">
                  <h3 class="text-sm font-bold text-gray-900 dark:text-white mb-2">📊 Payment Summary</h3>

                  <!-- Compact Results Grid -->
                  <div class="space-y-1.5">
                    <!-- Principal -->
                    <div class="flex justify-between items-center text-xs">
                      <span class="text-gray-600 dark:text-gray-400">Principal</span>
                      <span class="font-semibold text-gray-900 dark:text-white">{{ formatCurrency(calcAmount) }}</span>
                    </div>

                    <!-- Interest Rate -->
                    <div class="flex justify-between items-center text-xs">
                      <span class="text-gray-600 dark:text-gray-400">Interest Rate</span>
                      <span class="font-semibold text-green-600 dark:text-green-400">
                        {{ selectedProduct()?.interestRate }}% ({{ selectedProduct()?.interestType }})
                      </span>
                    </div>

                    <!-- Processing Fee - Always show -->
                    <div class="flex justify-between items-center text-xs">
                      <span class="text-gray-600 dark:text-gray-400">Processing Fee ({{ selectedProduct()?.processingFeePercent || 0 }}%)</span>
                      <span class="font-semibold text-amber-600 dark:text-amber-400">{{ formatCurrency(calcProcessingFee()) }}</span>
                    </div>

                    <!-- Platform Fee - Fixed amount -->
                    <div class="flex justify-between items-center text-xs">
                      <span class="text-gray-600 dark:text-gray-400">Platform Fee</span>
                      <span class="font-semibold text-amber-600 dark:text-amber-400">{{ formatCurrency(calcPlatformFee()) }}</span>
                    </div>

                    <!-- Total Interest -->
                    <div class="flex justify-between items-center text-xs">
                      <span class="text-gray-600 dark:text-gray-400">Total Interest</span>
                      <span class="font-semibold text-blue-600 dark:text-blue-400">{{ formatCurrency(calcTotalInterest()) }}</span>
                    </div>

                    <div class="border-t border-gray-200 dark:border-gray-600 my-1"></div>

                    <!-- Total Repayment -->
                    <div class="flex justify-between items-center bg-blue-100 dark:bg-blue-900/30 rounded-lg px-2.5 py-2">
                      <span class="text-xs font-bold text-gray-900 dark:text-white">Total Repayment</span>
                      <span class="text-sm font-bold text-blue-600 dark:text-blue-400">{{ formatCurrency(calcTotalRepayment()) }}</span>
                    </div>

                    <!-- Payment per Period -->
                    <div class="flex justify-between items-center bg-purple-100 dark:bg-purple-900/30 rounded-lg px-2.5 py-2">
                      <span class="text-xs font-bold text-gray-900 dark:text-white">
                        {{ capitalizeFirst(selectedProduct()?.paymentFrequency || 'weekly') }} Payment
                      </span>
                      <span class="text-sm font-bold text-purple-600 dark:text-purple-400">{{ formatCurrency(calcPaymentAmount()) }}</span>
                    </div>

                    <!-- Number of Payments -->
                    <div class="text-center pt-1">
                      <p class="text-xs text-gray-600 dark:text-gray-400">
                        <span class="font-semibold text-gray-900 dark:text-white">{{ calcNumberOfPayments() }} payments</span>
                        over {{ calcTermMonths }} months
                      </p>
                    </div>
                  </div>
                </div>
              }

              <!-- Warning - Compact -->
              <div class="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-700 rounded-lg p-2.5">
                <div class="flex gap-2">
                  <span class="text-base">ℹ️</span>
                  <p class="text-xs text-amber-700 dark:text-amber-300">
                    This is an estimate. Actual terms may vary. Late payments incur {{ selectedProduct()?.latePaymentPenaltyPercent }}%/day penalty after {{ selectedProduct()?.gracePeriodDays }}-day grace.
                  </p>
                </div>
              </div>

              <!-- Action Buttons - Compact -->
              <div class="flex gap-2 pt-1">
                <button
                  (click)="closeCalculator()"
                  class="flex-1 px-3 py-2 text-xs font-semibold text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
                  Close
                </button>
                <button
                  (click)="applyForLoan(selectedProduct())"
                  class="flex-1 px-3 py-2 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-all shadow-sm hover:shadow-md">
                  Apply Now →
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class CustomerProductsComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private authService = inject(AuthService);

  loading = signal(true);
  products = signal<any[]>([]);

  // Calculator state
  showCalculator = signal(false);
  selectedProduct = signal<any>(null);
  calcAmount = 0;
  calcTermMonths = 3;

  ngOnInit() {
    this.loadProducts();
  }

  loadProducts() {
    this.loading.set(true);

    // Get tenant ID from customer data
    const customerData = localStorage.getItem('customerData');
    let tenantId = '1'; // Default

    if (customerData) {
      try {
        const customer = JSON.parse(customerData);
        tenantId = customer.tenantId || '1';
      } catch (e) {
        console.error('Error parsing customer data:', e);
      }
    }

    this.http.get<any>(`/api/tenants/${tenantId}/platforms/moneyloan/loans/products`).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Only show active products to customers
          const activeProducts = response.data.filter((p: any) => p.isActive);
          this.products.set(activeProducts);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.loading.set(false);
      }
    });
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  applyForLoan(product: any) {
    // TODO: Navigate to loan application with pre-selected product
    console.log('Applying for loan:', product);
    this.router.navigate(['/platforms/money-loan/customer/apply'], {
      queryParams: { productId: product.id }
    });
  }

  openCalculator(product: any) {
    this.selectedProduct.set(product);
    this.calcAmount = product.minAmount || 10000;

    // Set default term based on product type
    if (product.loanTermType === 'fixed') {
      this.calcTermMonths = (product.fixedTermDays || 90) / 30;
    } else {
      this.calcTermMonths = Math.ceil((product.minTermDays || 90) / 30);
    }

    this.showCalculator.set(true);
  }

  closeCalculator() {
    this.showCalculator.set(false);
    this.selectedProduct.set(null);
  }

  calculateLoan() {
    // This is called on input change to reactively update the calculations
    // The actual calculations are done in the computed methods below
  }

  calcProcessingFee(): number {
    const product = this.selectedProduct();
    if (!product || !this.calcAmount) return 0;
    return (this.calcAmount * (product.processingFeePercent || 0)) / 100;
  }

  calcPlatformFee(): number {
    const product = this.selectedProduct();
    if (!product) return 0;
    // Platform fee is a fixed amount, default to 50 if not specified
    return product.platformFee || 50;
  }

  calcTotalInterest(): number {
    const product = this.selectedProduct();
    if (!product || !this.calcAmount || !this.calcTermMonths) return 0;

    const principal = this.calcAmount;
    const rate = product.interestRate / 100;

    if (product.interestType === 'flat') {
      // Flat rate: Interest = Principal × Rate × Term
      return principal * rate * this.calcTermMonths;
    } else {
      // Diminishing (reducing balance): Use simple approximation
      // More accurate calculation would require amortization schedule
      const monthlyRate = rate / 12;
      const numPayments = this.calcNumberOfPayments();
      const monthlyPayment = (principal * monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
                             (Math.pow(1 + monthlyRate, numPayments) - 1);
      return (monthlyPayment * numPayments) - principal;
    }
  }

  calcTotalRepayment(): number {
    return this.calcAmount + this.calcTotalInterest() + this.calcProcessingFee() + this.calcPlatformFee();
  }

  calcNumberOfPayments(): number {
    const product = this.selectedProduct();
    if (!product || !this.calcTermMonths) return 0;

    const frequency = product.paymentFrequency || 'weekly';
    const termDays = this.calcTermMonths * 30;

    switch (frequency) {
      case 'daily':
        return termDays;
      case 'weekly':
        return Math.ceil(termDays / 7);
      case 'biweekly':
        return Math.ceil(termDays / 14);
      case 'monthly':
        return this.calcTermMonths;
      default:
        return Math.ceil(termDays / 7); // Default to weekly
    }
  }

  calcPaymentAmount(): number {
    const numPayments = this.calcNumberOfPayments();
    if (numPayments === 0) return 0;
    return this.calcTotalRepayment() / numPayments;
  }

  capitalizeFirst(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
