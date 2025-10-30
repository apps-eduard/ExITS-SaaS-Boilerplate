import { Component, inject, signal, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-customer-products',
  standalone: true,
  imports: [CommonModule],
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

              <!-- Action Button -->
              <div class="p-4 pt-0">
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
    </div>
  `
})
export class CustomerProductsComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private authService = inject(AuthService);

  loading = signal(true);
  products = signal<any[]>([]);

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
}
