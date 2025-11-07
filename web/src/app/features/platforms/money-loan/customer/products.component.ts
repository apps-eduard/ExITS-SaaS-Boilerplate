import { Component, inject, signal, computed, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CurrencyMaskDirective } from '../../../../shared/directives/currency-mask.directive';
import { LoanService } from '../shared/services/loan.service';
import {
  LoanCalculationPreview,
  LoanCalculationRequest,
  LoanCalculationResult,
  PaymentFrequency,
  LoanInterestType,
} from '../shared/models/loan-calculation.model';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-customer-products',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyMaskDirective],
  template: `
    <div class="p-4 max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-4">
        <h1 class="text-xl font-bold text-gray-900 dark:text-white">💼 Available Loan Products</h1>
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
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          @for (product of products(); track product.id) {
            <div
              class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-lg transition-all duration-200"
              [class.opacity-60]="isProductDisabled(product)"
              [class.pointer-events-none]="isProductDisabled(product)"
              [attr.aria-disabled]="isProductDisabled(product) ? true : null">
              <!-- Product Header -->
              <div class="p-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-t-lg">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1 flex-wrap">
                      <span class="px-2 py-0.5 text-xs font-mono font-semibold bg-white dark:bg-gray-800 text-blue-600 dark:text-blue-400 rounded">
                        {{ product.productCode }}
                      </span>
                      @if (product.isActive) {
                        @if (getProductStatusTag(product).color === 'green') {
                          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                            <span class="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                            {{ getProductStatusTag(product).text }}
                          </span>
                        } @else if (getProductStatusTag(product).color === 'amber') {
                          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300">
                            <span class="w-1.5 h-1.5 rounded-full bg-amber-600 animate-pulse"></span>
                            {{ getProductStatusTag(product).text }}
                          </span>
                        } @else if (getProductStatusTag(product).color === 'blue') {
                          <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                            <span class="w-1.5 h-1.5 rounded-full bg-blue-600"></span>
                            {{ getProductStatusTag(product).text }}
                          </span>
                        }
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
              <div class="p-3 space-y-2">
                <!-- Loan Amount Range -->
                <div class="space-y-1.5">
                  <p class="text-xs text-gray-600 dark:text-gray-400 font-semibold">💰 Loan Amount</p>
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-2">
                    <!-- Min Amount -->
                    <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg px-3 py-2">
                      <p class="text-xs text-gray-600 dark:text-gray-400 mb-0.5">Min</p>
                      <p class="text-sm font-bold text-blue-600 dark:text-blue-400">
                        {{ formatCurrency(product.minAmount) }}
                      </p>
                    </div>

                    <!-- Max Amount -->
                    <div class="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded-lg px-3 py-2">
                      <p class="text-xs text-gray-600 dark:text-gray-400 mb-0.5">Max</p>
                      <p class="text-sm font-bold text-purple-600 dark:text-purple-400">
                        {{ formatCurrency(product.maxAmount) }}
                      </p>
                    </div>
                  </div>
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
                        🔒 {{ Math.round((product.fixedTermDays || 90) / 30) }}mo
                      </span>
                    } @else {
                      {{ Math.round(product.minTermDays / 30) }}-{{ Math.round(product.maxTermDays / 30) }} months
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

                <!-- Platform Fee -->
                <div class="flex items-center justify-between text-xs py-2 border-b border-gray-100 dark:border-gray-700">
                  <span class="text-gray-600 dark:text-gray-400 flex items-center gap-1">
                    <span>🏢</span> Platform Fee
                  </span>
                  <div class="text-right">
                    <p class="font-semibold text-gray-900 dark:text-white">{{ formatCurrency(product.platformFee || 50) }}/mo</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Only while loan is active</p>
                  </div>
                </div>

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
                @if (isProductDisabled(product)) {
                  <!-- Disabled State -->
                  <div class="bg-gray-100 dark:bg-gray-700 rounded-lg p-3 border-2 border-gray-300 dark:border-gray-600">
                    <p class="text-sm font-semibold text-gray-600 dark:text-gray-400 text-center mb-1">
                      🔒 Not Available
                    </p>
                    <p class="text-xs text-gray-500 dark:text-gray-500 text-center">
                      {{ getProductDisabledReason(product) }}
                    </p>
                  </div>
                } @else {
                  <!-- Active State -->
                  <button
                    (click)="openCalculator(product)"
                    class="w-full px-4 py-2.5 text-sm font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-all shadow-sm hover:shadow-md">
                    📝 Apply for this Loan →
                  </button>
                  <p class="text-xs text-center text-gray-500 dark:text-gray-400">
                    Enter loan details and submit for approval
                  </p>
                }
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
                  <h2 class="text-lg font-bold">📝 Loan Application</h2>
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
              <!-- Info Banner -->
              <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded-lg p-2.5">
                <div class="flex gap-2">
                  <span class="text-base">💡</span>
                  <p class="text-xs text-blue-700 dark:text-blue-300">
                    Enter your desired loan amount and term. Review the payment details below before submitting your application.
                  </p>
                </div>
              </div>

              <!-- Input: Loan Amount -->
              <div>
                <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1.5">
                  💰 Loan Amount
                </label>
                <input
                  type="text"
                  appCurrencyMask
                  [(ngModel)]="calcAmount"
                  (ngModelChange)="validateLoanAmount()"
                  class="w-full px-3 py-2 text-sm border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  [class.border-red-500]="amountError()"
                  [class.border-gray-300]="!amountError()"
                  placeholder="Enter amount">
                @if (amountError()) {
                  <p class="text-xs text-red-600 dark:text-red-400 mt-1">{{ amountError() }}</p>
                } @else {
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                    {{ formatCurrency(selectedProduct()?.minAmount || 0) }} - {{ formatCurrency(selectedProduct()?.maxAmount || 0) }}
                  </p>
                }
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
                    (input)="validateLoanTerm()"
                    (blur)="validateLoanTerm()"
                    [min]="Math.round((selectedProduct()?.minTermDays || 30) / 30)"
                    [max]="Math.round((selectedProduct()?.maxTermDays || 360) / 30)"
                    step="1"
                    class="w-full px-3 py-2 text-sm border dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    [class.border-red-500]="termError()"
                    [class.border-gray-300]="!termError()"
                    placeholder="Enter term">
                  @if (termError()) {
                    <p class="text-xs text-red-600 dark:text-red-400 mt-1">{{ termError() }}</p>
                  } @else {
                    <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                      {{ Math.round((selectedProduct()?.minTermDays || 30) / 30) }} - {{ Math.round((selectedProduct()?.maxTermDays || 360) / 30) }} months
                    </p>
                  }
                </div>
              } @else {
                <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-2.5 border border-purple-200 dark:border-purple-700">
                  <p class="text-xs font-semibold text-purple-900 dark:text-purple-100">
                    🔒 Fixed Term: {{ Math.round((selectedProduct()?.fixedTermDays || 90) / 30) }} months
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
                      <span class="text-gray-600 dark:text-gray-400">Loan Amount</span>
                      <span class="font-semibold text-gray-900 dark:text-white">{{ formatCurrency(calcAmount) }}</span>
                    </div>

                    <!-- Processing Fee - Always show -->
                    <div class="flex justify-between items-center text-xs">
                      <span class="text-gray-600 dark:text-gray-400">Processing Fee ({{ selectedProduct()?.processingFeePercent || 0 }}%)</span>
                      <span class="font-semibold text-red-600 dark:text-red-400">-{{ formatCurrency(calcProcessingFee()) }}</span>
                    </div>

                    <!-- Platform Fee - Fixed amount -->
                    <div class="flex justify-between items-center text-xs">
                      <span class="text-gray-600 dark:text-gray-400">Platform Fee</span>
                      <span class="font-semibold text-red-600 dark:text-red-400">-{{ formatCurrency(calcPlatformFee()) }}</span>
                    </div>

                    <!-- Net Amount Received - Highlighted -->
                    <div class="flex justify-between items-center bg-green-100 dark:bg-green-900/30 rounded-lg px-2.5 py-2 border-2 border-green-300 dark:border-green-700">
                      <span class="text-xs font-bold text-gray-900 dark:text-white">💵 Net Received</span>
                      <span class="text-sm font-bold text-green-600 dark:text-green-400">{{ formatCurrency(calcNetReceived()) }}</span>
                    </div>

                    <div class="border-t border-gray-200 dark:border-gray-600 my-1"></div>

                    <!-- Interest Rate -->
                    <div class="flex justify-between items-center text-xs">
                      <span class="text-gray-600 dark:text-gray-400">Interest Rate</span>
                      <span class="font-semibold text-blue-600 dark:text-blue-400">
                        {{ selectedProduct()?.interestRate }}% ({{ selectedProduct()?.interestType }})
                      </span>
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
                  Cancel
                </button>
                <button
                  (click)="submitApplication()"
                  [disabled]="!isFormValid()"
                  class="flex-1 px-3 py-2 text-xs font-semibold text-white bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 rounded-lg transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:from-gray-400 disabled:to-gray-400">
                  📝 Submit for Approval
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class CustomerProductsComponent implements OnInit, OnDestroy {
  private http = inject(HttpClient);
  private router = inject(Router);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private loanService = inject(LoanService);
  private previewSubscription?: Subscription;
  private previewTimer?: ReturnType<typeof setTimeout>;

  // Expose Math to template
  Math = Math;

  loading = signal(true);
  products = signal<any[]>([]);
  customerLoans = signal<any[]>([]); // Track customer's loans
  hasBlockingLoans = computed(() =>
    this.customerLoans().some((app: any) => this.blockingStatuses.has(app.status))
  );
  private readonly blockingStatuses = new Set([
    'submitted',
    'under_review',
    'approved',
    'pending',
    'in_review',
    'processing',
    'awaiting_review',
    'application_submitted'
  ]);

  // Calculator state
  showCalculator = signal(false);
  selectedProduct = signal<any>(null);
  calcAmount = 0;
  calcTermMonths = 3;

  private calculationCache: { key: string; result: LoanCalculationPreview } | null = null;
  previewLoading = signal(false);
  previewError = signal<string | null>(null);

  // Validation errors
  amountError = signal<string>('');
  termError = signal<string>('');

  ngOnInit() {
    this.loadProducts();
    this.loadCustomerLoans();
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

  loadCustomerLoans() {
    // Get customer ID from customer data
    const customerData = localStorage.getItem('customerData');
    if (!customerData) return;

    try {
      const customer = JSON.parse(customerData);
      const customerId = customer.id;
      const tenantId = customer.tenantId || '1';

      console.log('🔄 Loading customer loans for customer:', customerId, 'tenant:', tenantId);

      // Fetch customer's loan applications (pending, submitted, under_review, approved)
      this.http.get<any>(`/api/tenants/${tenantId}/platforms/moneyloan/loans/applications`, {
        params: { customerId: String(customerId) }
      }).subscribe({
        next: (response) => {
          console.log('📥 Raw applications response:', response);
          if (response.success && Array.isArray(response.data)) {
            const normalizedApplications = response.data
              .map((app: any) => this.normalizeLoanApplication(app))
              .filter((app: any) => app && this.blockingStatuses.has(app.status));

            console.log('✅ Normalized and filtered applications:', normalizedApplications);
            this.customerLoans.set(normalizedApplications);
          }
        },
        error: (error) => {
          console.error('Error loading customer applications:', error);
        }
      });
    } catch (e) {
      console.error('Error parsing customer data:', e);
    }
  }

  private normalizeLoanApplication(application: any): any {
    if (!application) {
      return null;
    }

    const loanProductId = this.normalizeProductId(
      application.loan_product_id ?? application.loanProductId ?? application.product_id ?? application.productId ?? null
    );
    const productCode = this.normalizeProductCode(
      application.product_code ?? application.productCode ?? application.product?.productCode ?? application.product?.product_code ?? null
    );
    const productKey = this.buildProductKey(loanProductId, productCode);

    console.log('🔧 Normalizing application:', {
      raw: {
        loan_product_id: application.loan_product_id,
        loanProductId: application.loanProductId,
        product_code: application.product_code,
        productCode: application.productCode,
        status: application.status
      },
      normalized: {
        loanProductId,
        productCode,
        productKey
      }
    });

    if (!productKey) {
      console.warn('⚠️ Application has no product key, skipping:', application);
      return null;
    }

    const status = this.normalizeStatus(
      application.status ?? application.applicationStatus ?? application.loan_status ?? 'submitted'
    );

    return {
      ...application,
      loan_product_id: loanProductId,
      product_code: productCode ?? application.product_code ?? application.productCode,
      status,
      __productKey: productKey
    };
  }

  private upsertCustomerLoan(application: any) {
    const normalized = this.normalizeLoanApplication(application);
    if (!normalized || !this.blockingStatuses.has(normalized.status)) {
      return;
    }

    const normalizedId = normalized.id ?? normalized.loan_application_id ?? normalized.application_id ?? null;
    const normalizedProductKey = this.getProductKeyFromApplication(normalized);
    if (!normalizedProductKey) {
      return;
    }

    this.customerLoans.update((loans) => {
      const next = [...loans];
      const index = next.findIndex((existing: any) => {
        const existingId = existing.id ?? existing.loan_application_id ?? existing.application_id ?? null;
        if (existingId && normalizedId) {
          return existingId === normalizedId;
        }
        return this.getProductKeyFromApplication(existing) === normalizedProductKey;
      });

      if (index >= 0) {
        next[index] = { ...next[index], ...normalized };
        return next;
      }

      next.push(normalized);
      return next;
    });
  }

  isProductDisabled(product: any): boolean {
    // Check if customer has pending or approved application with this product
    const applications = this.customerLoans();
    const productKey = this.getProductKeyFromProduct(product);

    const appDetails = applications.map((app: any) => {
      const appKey = this.getProductKeyFromApplication(app);
      const hasBlockingStatus = this.blockingStatuses.has(app.status);
      const keysMatch = appKey === productKey;
      return {
        id: app.id,
        loan_product_id: app.loan_product_id,
        product_code: app.product_code,
        status: app.status,
        appKey,
        hasBlockingStatus,
        keysMatch,
        shouldBlock: keysMatch && hasBlockingStatus
      };
    });

    console.log('🔍 Product Check - ID:', product?.id, 'Code:', product?.productCode, 'Key:', productKey);
    console.log('📋 Blocking Statuses:', Array.from(this.blockingStatuses));
    console.log('📦 Applications:', JSON.stringify(appDetails, null, 2));

    if (!productKey) {
      return false;
    }

    const isDisabled = applications.some((app: any) => {
      const appKey = this.getProductKeyFromApplication(app);
      const match = appKey === productKey && this.blockingStatuses.has(app.status);
      if (match) {
        console.log('✅ Found matching blocking application:', app);
      }
      return match;
    });

    console.log('🔒 Product disabled result:', isDisabled);
    return isDisabled;
  }

  getProductDisabledReason(product: any): string {
    const applications = this.customerLoans();
    const productKey = this.getProductKeyFromProduct(product);
    if (!productKey) {
      return '';
    }

    const existingApp = applications.find((app: any) =>
      this.getProductKeyFromApplication(app) === productKey &&
      this.blockingStatuses.has(app.status)
    );

    if (!existingApp) return '';

    if (existingApp.status === 'submitted' || existingApp.status === 'under_review' || existingApp.status === 'pending' || existingApp.status === 'processing' || existingApp.status === 'awaiting_review') {
      return 'Pending Approval';
    }
    if (existingApp.status === 'approved') {
      return 'Loan Approved - Awaiting Disbursement';
    }
    return 'Application In Progress';
  }

  getProductStatusTag(product: any): { text: string; color: string } {
    const applications = this.customerLoans();
    const productKey = this.getProductKeyFromProduct(product);
    if (!productKey) {
      return { text: 'Active', color: 'green' };
    }

    const existingApp = applications.find((app: any) =>
      this.getProductKeyFromApplication(app) === productKey &&
      this.blockingStatuses.has(app.status)
    );

    if (!existingApp) {
      return { text: 'Active', color: 'green' };
    }

    if (existingApp.status === 'submitted' || existingApp.status === 'under_review' || existingApp.status === 'pending' || existingApp.status === 'processing' || existingApp.status === 'awaiting_review') {
      return { text: 'Pending Approval', color: 'amber' };
    } else if (existingApp.status === 'approved') {
      return { text: 'Approved - Awaiting Disbursement', color: 'blue' };
    }
    return { text: 'Active', color: 'green' };
  }

  private normalizeProductId(value: any): string | null {
    if (value === null || value === undefined) {
      return null;
    }

    if (typeof value === 'number' || typeof value === 'bigint') {
      return String(value);
    }

    if (typeof value === 'string' && value.trim() !== '') {
      return value.trim();
    }

    return null;
  }

  private normalizeStatus(status: any): string {
    if (status === null || status === undefined) {
      return 'submitted';
    }

    return String(status).toLowerCase();
  }

  private normalizeProductCode(value: any): string | null {
    if (!value || (typeof value === 'string' && value.trim() === '')) {
      return null;
    }

    if (typeof value === 'string') {
      return value.trim().toLowerCase();
    }

    return String(value).trim().toLowerCase();
  }

  private buildProductKey(id: string | null, code: string | null): string | null {
    if (id) {
      return `id:${id}`;
    }
    if (code) {
      return `code:${code}`;
    }
    return null;
  }

  private getProductKeyFromApplication(application: any): string | null {
    if (!application) {
      return null;
    }

    if (application.__productKey) {
      return application.__productKey;
    }

    const id = this.normalizeProductId(
      application.loan_product_id ?? application.loanProductId ?? application.product_id ?? application.productId ?? null
    );
    const code = this.normalizeProductCode(
      application.product_code ?? application.productCode ?? application.product?.productCode ?? application.product?.product_code ?? null
    );
    return this.buildProductKey(id, code);
  }

  private getProductKeyFromProduct(product: any): string | null {
    if (!product) {
      return null;
    }

    const id = this.normalizeProductId(product.id ?? product.loanProductId ?? product.productId ?? null);
    const code = this.normalizeProductCode(product.productCode ?? product.code ?? product.product_code ?? null);
    return this.buildProductKey(id, code);
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
    if (!product) return;

    if (this.isProductDisabled(product)) {
      this.toastService.info('You already have an active application for this product.');
      return;
    }

    // Get customer data
    const customerData = localStorage.getItem('customerData');
    if (!customerData) {
      this.toastService.error('Customer data not found. Please log in again.');
      return;
    }

    try {
      const customer = JSON.parse(customerData);
      const customerId = customer.id;

      // Create loan application
      const applicationData = {
        customerId: customerId,
        loanProductId: product.id,
        requestedAmount: product.minAmount, // Default to minimum amount
        requestedTermDays: product.loanTermType === 'fixed'
          ? product.fixedTermDays
          : product.minTermDays,
        purpose: 'Quick apply from product card'
      };

      console.log('🚀 Submitting application:', applicationData);

      this.http.post<any>(`/api/money-loan/applications`, applicationData).subscribe({
        next: (response) => {
          console.log('📦 Application response:', response);
          if (response.success) {
            this.toastService.success('✅ Loan application submitted successfully! Your application is pending approval.');

            // Add the new pending loan to customerLoans to update UI immediately
            if (response.data) {
              console.log('💾 Upserting application data:', response.data);
              this.upsertCustomerLoan(response.data);
              console.log('📊 Current customer loans after upsert:', this.customerLoans());
            }

            this.loadCustomerLoans();
            // Close calculator if open
            this.closeCalculator();
          } else {
            this.toastService.error('Failed to submit application. Please try again.');
          }
        },
        error: (error) => {
          console.error('Error submitting loan application:', error);
          this.toastService.error(error.error?.message || 'Failed to submit application. Please try again.');
        }
      });
    } catch (e) {
      console.error('Error parsing customer data:', e);
      this.toastService.error('Error processing request. Please try again.');
    }
  }

  openCalculator(product: any) {
    if (this.isProductDisabled(product)) {
      this.toastService.info('You already have an active application for this product.');
      return;
    }

  this.resetPreviewState();
    this.selectedProduct.set(product);
    this.calcAmount = product.minAmount || 10000;

    // Set default term based on product type (always whole numbers)
    if (product.loanTermType === 'fixed') {
      this.calcTermMonths = Math.round((product.fixedTermDays || 90) / 30);
    } else {
      this.calcTermMonths = Math.ceil((product.minTermDays || 90) / 30);
    }

    // Clear validation errors
    this.amountError.set('');
    this.termError.set('');

    this.showCalculator.set(true);

    // Trigger initial validation and calculation
  this.validateLoanAmount();
  this.validateLoanTerm();
  }

  closeCalculator() {
    this.showCalculator.set(false);
    this.selectedProduct.set(null);
    // Clear validation errors when closing
    this.amountError.set('');
    this.termError.set('');
    this.resetPreviewState();
  }

  submitApplication() {
    const product = this.selectedProduct();
    if (!product) return;

    if (this.isProductDisabled(product)) {
      this.toastService.info('You already have an active application for this product.');
      this.closeCalculator();
      return;
    }

    // Validate calculator inputs
    if (!this.calcAmount || this.calcAmount < product.minAmount || this.calcAmount > product.maxAmount) {
      this.toastService.error('Please enter a valid loan amount within the allowed range.');
      return;
    }

    // Get customer data
    const customerData = localStorage.getItem('customerData');
    if (!customerData) {
      this.toastService.error('Customer data not found. Please log in again.');
      return;
    }

    try {
  const customer = JSON.parse(customerData);
  const customerId = customer.id;

      // Calculate term in days from months
      const termDays = Math.round(this.calcTermMonths * 30);

      // Create loan application with calculator values
      const applicationData = {
        customerId: customerId,
        loanProductId: product.id,
        requestedAmount: this.calcAmount,
        requestedTermDays: termDays,
        purpose: 'Customer loan application'
      };

  this.http.post<any>(`/api/money-loan/applications`, applicationData).subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success(`✅ Loan application submitted successfully! Amount: ${this.formatCurrency(this.calcAmount)}, Term: ${this.calcTermMonths} months. Your application is pending approval.`);

            // Add the new application to customerLoans to update UI immediately
            // Use the response data which has the correct database field names
            if (response.data) {
              this.upsertCustomerLoan(response.data);
            }

            this.loadCustomerLoans();
            // Close calculator
            this.closeCalculator();
          } else {
            this.toastService.error('Failed to submit application. Please try again.');
          }
        },
        error: (error) => {
          console.error('Error submitting loan application:', error);
          this.toastService.error(error.error?.message || 'Failed to submit application. Please try again.');
        }
      });
    } catch (e) {
      console.error('Error parsing customer data:', e);
      this.toastService.error('Error processing request. Please try again.');
    }
  }

  calculateLoan() {
    const product = this.selectedProduct();
    if (!product) {
      this.resetPreviewState();
      return;
    }

    const amount = Number(this.calcAmount) || 0;
    const rawTerm = Number(this.calcTermMonths) || 0;
    const termMonths = Math.max(1, Math.round(rawTerm));

    if (!Number.isFinite(amount) || amount <= 0 || !Number.isFinite(termMonths) || termMonths <= 0) {
      this.resetPreviewState();
      return;
    }

    const frequency = this.normalizeFrequency(product.paymentFrequency);
    const interestType = this.normalizeInterestType(product.interestType);

    const keyParts = [
      product.id ?? 'unknown',
      amount,
      termMonths,
      frequency,
      interestType,
      Number(product.interestRate) || 0,
      Number(product.processingFeePercent) || 0,
      Number(product.platformFee) || 0,
      Number(product.latePaymentPenaltyPercent) || 0,
    ];
    const cacheKey = keyParts.join('|');

    if (this.calculationCache && this.calculationCache.key === cacheKey) {
      return;
    }

    const request: LoanCalculationRequest = {
      loanAmount: amount,
      termMonths,
      paymentFrequency: frequency,
      interestRate: Number(product.interestRate) || 0,
      interestType,
      processingFeePercentage: Number(product.processingFeePercent) || 0,
      platformFee: Number(product.platformFee) || 0,
      latePenaltyPercentage: Number(product.latePaymentPenaltyPercent) || 0,
    };

    this.cancelPreviewRequest();
    this.previewLoading.set(true);
    this.previewError.set(null);
    this.calculationCache = null;

    this.previewTimer = setTimeout(() => {
      this.previewSubscription = this.loanService.calculateLoanPreview(request).subscribe({
        next: (preview) => {
          this.previewLoading.set(false);
          this.calculationCache = { key: cacheKey, result: preview };
        },
        error: (error) => {
          console.error('Error fetching loan preview:', error);
          this.previewLoading.set(false);
          const message = error?.error?.message || 'Unable to calculate loan preview at the moment';
          this.previewError.set(message);
        },
      });
    }, 250);
  }

  validateLoanTerm() {
    const product = this.selectedProduct();
    if (!product) return;

    // Ensure it's a valid number first
    if (isNaN(this.calcTermMonths) || this.calcTermMonths === null || this.calcTermMonths === undefined) {
      this.calcTermMonths = Math.ceil((product.minTermDays || 30) / 30);
      this.termError.set('');
      return;
    }

    // Round to whole number first
    this.calcTermMonths = Math.round(Number(this.calcTermMonths));

    // Calculate min and max
    const minTermMonths = Math.round((product.minTermDays || 30) / 30);
    const maxTermMonths = Math.round((product.maxTermDays || 360) / 30);

    // Validate and set error messages
    if (this.calcTermMonths < minTermMonths) {
      this.termError.set(`Minimum term is ${minTermMonths} month${minTermMonths > 1 ? 's' : ''}`);
      this.calcTermMonths = minTermMonths;
    } else if (this.calcTermMonths > maxTermMonths) {
      this.termError.set(`Maximum term is ${maxTermMonths} month${maxTermMonths > 1 ? 's' : ''}`);
      this.calcTermMonths = maxTermMonths;
    } else {
      this.termError.set('');
    }

    // Trigger calculation update
    this.calculateLoan();
  }

  validateLoanAmount() {
    const product = this.selectedProduct();
    if (!product) return;

    // Convert to number if it's a string (from currency directive)
    const amount = Number(this.calcAmount) || 0;
    this.calcAmount = amount;

    // Validate and set error messages
    if (amount === 0) {
      this.amountError.set(`Please enter an amount`);
    } else if (amount < product.minAmount) {
      this.amountError.set(`Minimum amount is ${this.formatCurrency(product.minAmount)}`);
    } else if (amount > product.maxAmount) {
      this.amountError.set(`Maximum amount is ${this.formatCurrency(product.maxAmount)}`);
    } else {
      this.amountError.set('');
    }

    // Trigger calculation update
    this.calculateLoan();
  }

  isFormValid(): boolean {
    const product = this.selectedProduct();
    if (!product) return false;

    // Check if there are any validation errors
    if (this.amountError() || this.termError()) return false;

    // Check amount is within range
    if (!this.calcAmount || this.calcAmount < product.minAmount || this.calcAmount > product.maxAmount) {
      return false;
    }

    // Check term is within range (for flexible terms)
    if (product.loanTermType === 'flexible') {
      const minTermMonths = Math.round((product.minTermDays || 30) / 30);
      const maxTermMonths = Math.round((product.maxTermDays || 360) / 30);
      if (!this.calcTermMonths || this.calcTermMonths < minTermMonths || this.calcTermMonths > maxTermMonths) {
        return false;
      }
    }

    return true;
  }

  calcProcessingFee(): number {
    const calc = this.getLoanCalculation();
    if (calc) return calc.processingFeeAmount;

    const product = this.selectedProduct();
    if (!product || !this.calcAmount) return 0;
    const feePercent = Number(product.processingFeePercent) || 0;
    return (this.calcAmount * feePercent) / 100;
  }

  calcPlatformFee(): number {
    const calc = this.getLoanCalculation();
    if (calc) return calc.platformFee;

    const product = this.selectedProduct();
    if (!product) return 0;
    const term = Math.max(1, Math.round(Number(this.calcTermMonths) || 0));
    const monthlyFee = Number(product.platformFee) || 50;
    return monthlyFee * term;
  }

  calcNetReceived(): number {
    const calc = this.getLoanCalculation();
    if (calc) return calc.netProceeds;

    const product = this.selectedProduct();
    if (!product) return 0;

    const amount = Number(this.calcAmount) || 0;
    const feePercent = Number(product.processingFeePercent) || 0;
    const processingFee = (amount * feePercent) / 100;
    const term = Math.max(1, Math.round(Number(this.calcTermMonths) || 0));
    const platformFee = (Number(product.platformFee) || 50) * term;
    const net = amount - processingFee - platformFee;
    return isNaN(net) ? 0 : net;
  }

  calcTotalInterest(): number {
    const calc = this.getLoanCalculation();
    return calc ? calc.interestAmount : 0;
  }

  calcTotalRepayment(): number {
    const calc = this.getLoanCalculation();
    return calc ? calc.totalRepayable : 0;
  }

  calcNumberOfPayments(): number {
    const calc = this.getLoanCalculation();
    return calc ? calc.numPayments : 0;
  }

  calcPaymentAmount(): number {
    const calc = this.getLoanCalculation();
    return calc ? calc.installmentAmount : 0;
  }

  capitalizeFirst(str: string): string {
    if (!str) return '';
    return str.charAt(0).toUpperCase() + str.slice(1);
  }

  private invalidateCalculationCache(): void {
    this.resetPreviewState(false);
  }

  private getLoanCalculation(): LoanCalculationResult | null {
    return this.calculationCache?.result?.calculation ?? null;
  }

  private normalizeFrequency(frequency: string | undefined): PaymentFrequency {
    const value = (frequency || 'weekly').toLowerCase() as PaymentFrequency;
    const allowed: PaymentFrequency[] = ['daily', 'weekly', 'biweekly', 'monthly'];
    return allowed.includes(value) ? value : 'weekly';
  }

  private normalizeInterestType(type: string | undefined): LoanInterestType {
    const value = (type || 'flat').toLowerCase() as LoanInterestType;
    const allowed: LoanInterestType[] = ['flat', 'reducing', 'compound'];
    return allowed.includes(value) ? value : 'flat';
  }

  private cancelPreviewRequest(): void {
    if (this.previewTimer) {
      clearTimeout(this.previewTimer);
      this.previewTimer = undefined;
    }
    if (this.previewSubscription) {
      this.previewSubscription.unsubscribe();
      this.previewSubscription = undefined;
    }
  }

  private resetPreviewState(clearError = true): void {
    this.cancelPreviewRequest();
    this.previewLoading.set(false);
    if (clearError) {
      this.previewError.set(null);
    }
    this.calculationCache = null;
  }

  ngOnDestroy(): void {
    this.cancelPreviewRequest();
  }
}
