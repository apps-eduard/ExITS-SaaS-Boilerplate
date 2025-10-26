import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { TenantService, Tenant } from '../../../core/services/tenant.service';

@Component({
  selector: 'app-tenant-platform-settings',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="p-6 space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <div class="flex items-center gap-3">
            <button
              routerLink="/tenant/products"
              class="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <svg class="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">⚙️ Product Information</h1>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                View your enabled products and features
              </p>
              <p class="text-xs text-amber-600 dark:text-amber-400 mt-1 flex items-center gap-1">
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                <span>Product activation is managed by system administrators</span>
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading() && !tenant()" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-4">Loading settings...</p>
      </div>

      <!-- Products Settings -->
      <div *ngIf="!loading() || tenant()" class="space-y-4">
        <!-- No Products Enabled Message -->
        <div *ngIf="visibleProductSettings().length === 0 && !loading()" class="text-center py-12">
          <div class="inline-flex h-24 w-24 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30 mb-4">
            <span class="text-5xl">📦</span>
          </div>
          <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-2">
            No Products Activated
          </h3>
          <p class="text-sm text-gray-600 dark:text-gray-400 max-w-md mx-auto">
            Your organization does not have any products activated yet. Contact your system administrator to activate products for your organization.
          </p>
        </div>

        <div
          *ngFor="let product of visibleProductSettings()"
          class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900"
        >
          <!-- Product Header with Status Badge (Read-Only) -->
          <div class="flex items-center justify-between mb-4">
            <div class="flex items-center gap-4">
              <div class="text-3xl">{{ product.icon }}</div>
              <div>
                <h3 class="text-lg font-bold text-gray-900 dark:text-white">
                  {{ product.name }}
                </h3>
                <p class="text-sm text-gray-600 dark:text-gray-400">
                  {{ product.description }}
                </p>
              </div>
            </div>
            
            <!-- Status Badge (Read-Only) -->
            <div class="flex items-center gap-2">
              <span 
                *ngIf="product.enabled"
                class="inline-flex items-center gap-1.5 rounded-full bg-green-100 px-3 py-1.5 text-sm font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400"
              >
                <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <span>Active</span>
              </span>
              <span 
                *ngIf="!product.enabled"
                class="inline-flex items-center gap-1.5 rounded-full bg-gray-100 px-3 py-1.5 text-sm font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-300"
              >
                <svg class="h-4 w-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                </svg>
                <span>Inactive</span>
              </span>
            </div>
          </div>

          <!-- Feature List (Read-Only) -->
          <div *ngIf="product.enabled" class="ml-14 mt-4 space-y-2 border-t border-gray-200 dark:border-gray-700 pt-4">
            <p class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">
              Available Features:
            </p>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div
                *ngFor="let feature of product.features"
                class="flex items-start gap-3 p-3 rounded-lg bg-gray-50 dark:bg-gray-800"
              >
                <svg class="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ feature.name }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                    {{ feature.description }}
                  </p>
                </div>
              </div>
            </div>
          </div>

          <!-- Inactive Message -->
          <div *ngIf="!product.enabled" class="ml-14 mt-4 border-t border-gray-200 dark:border-gray-700 pt-4">
            <div class="rounded-lg bg-amber-50 border border-amber-200 p-4 dark:bg-amber-900/20 dark:border-amber-900">
              <div class="flex items-start gap-3">
                <svg class="h-5 w-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p class="text-sm font-medium text-amber-800 dark:text-amber-400">
                    Product not activated
                  </p>
                  <p class="text-xs text-amber-700 dark:text-amber-500 mt-1">
                    Contact your system administrator to activate this product for your organization.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class TenantPlatformSettingsComponent implements OnInit {
  private tenantService = inject(TenantService);

  loading = signal(false);
  tenant = signal<Tenant | null>(null);

  // Computed property to filter only enabled products
  visibleProductSettings = computed(() => {
    return this.productSettings().filter(product => product.enabled);
  });

  productSettings = signal([
    {
      id: 'money-loan',
      name: 'Money Loan',
      icon: '💸',
      description: 'Lending management system',
      enabled: false,
      dbField: 'moneyLoanEnabled' as const,
      features: [
        { id: 'loan-application', name: 'Loan Application', description: 'Online loan application forms' },
        { id: 'credit-scoring', name: 'Credit Scoring', description: 'Automated credit evaluation' },
        { id: 'disbursement', name: 'Disbursement', description: 'Loan disbursement tracking' },
        { id: 'collections', name: 'Collections', description: 'Payment collection management' }
      ]
    },
    {
      id: 'pawnshop',
      name: 'Pawnshop',
      icon: '💍',
      description: 'Pawnshop operations management',
      enabled: false,
      dbField: 'pawnshopEnabled' as const,
      features: [
        { id: 'appraisal', name: 'Item Appraisal', description: 'Item valuation system' },
        { id: 'tickets', name: 'Pawn Tickets', description: 'Ticket generation and tracking' },
        { id: 'inventory', name: 'Inventory', description: 'Item inventory management' },
        { id: 'auction', name: 'Auction', description: 'Auction management system' }
      ]
    },
    {
      id: 'bnpl',
      name: 'Buy Now Pay Later',
      icon: '🛒',
      description: 'BNPL payment solution',
      enabled: false,
      dbField: 'bnplEnabled' as const,
      features: [
        { id: 'installments', name: 'Installment Plans', description: 'Flexible payment plans' },
        { id: 'ecommerce', name: 'E-commerce Integration', description: 'Online store integration' },
        { id: 'payments', name: 'Payment Gateway', description: 'Payment processing' },
        { id: 'limits', name: 'Credit Limits', description: 'Customer credit management' }
      ]
    }
  ]);

  ngOnInit(): void {
    console.log('⚙️ TenantPlatformSettingsComponent initialized');
    this.loadTenantSettings();
  }

  loadTenantSettings(): void {
    this.loading.set(true);
    this.tenantService.getMyTenant().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.tenant.set(response.data);
          
          // Update Platform Settings with real data
          this.productSettings.update(products => 
            products.map(product => ({
              ...product,
              enabled: response.data[product.dbField] || false
            }))
          );

          console.log('✅ Loaded tenant Platform Settings:', {
            moneyLoan: response.data.moneyLoanEnabled,
            pawnshop: response.data.pawnshopEnabled,
            bnpl: response.data.bnplEnabled
          });
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('❌ Failed to load tenant settings:', error);
        this.loading.set(false);
      }
    });
  }
}
