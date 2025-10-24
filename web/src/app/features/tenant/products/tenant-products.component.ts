import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RBACService } from '../../../core/services/rbac.service';
import { AuthService } from '../../../core/services/auth.service';
import { TenantService, Tenant } from '../../../core/services/tenant.service';

interface Product {
  id: string;
  name: string;
  icon: string;
  description: string;
  enabled: boolean;
  status: 'active' | 'inactive';
  features: string[];
  lastUpdated?: string;
}

@Component({
  selector: 'app-tenant-products',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="p-6 space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">📦 My Product Catalog</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your enabled products and features
          </p>
        </div>
        <button
          *ngIf="canConfigureProducts()"
          routerLink="/tenant/products/settings"
          class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow-sm transition"
        >
          <span class="text-lg">⚙️</span>
          <span>Configure Products</span>
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-3 gap-4">
        <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total Products</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {{ products().length }}
              </p>
            </div>
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <span class="text-2xl">📦</span>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Active Products</p>
              <p class="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {{ activeProducts() }}
              </p>
            </div>
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <span class="text-2xl">✅</span>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Inactive</p>
              <p class="text-2xl font-bold text-gray-600 dark:text-gray-400 mt-1">
                {{ inactiveProducts() }}
              </p>
            </div>
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
              <span class="text-2xl">⏸️</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Products Grid -->
      <div *ngIf="loading()" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-4">Loading products...</p>
      </div>

      <div *ngIf="!loading()" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          *ngFor="let product of products()"
          class="group rounded-lg border border-gray-200 bg-white p-6 hover:shadow-lg transition-all dark:border-gray-700 dark:bg-gray-900"
          [class.opacity-60]="!product.enabled"
        >
          <!-- Product Header -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-2xl">
                {{ product.icon }}
              </div>
              <div>
                <h3 class="text-lg font-bold text-gray-900 dark:text-white">
                  {{ product.name }}
                </h3>
                <div class="flex items-center gap-2 mt-1">
                  <span
                    [class]="getStatusClass(product.status)"
                    class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                  >
                    <span class="h-1.5 w-1.5 rounded-full" [class]="getStatusDotClass(product.status)"></span>
                    {{ product.status | titlecase }}
                  </span>
                  <span
                    *ngIf="product.enabled"
                    class="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  >
                    <span class="h-1.5 w-1.5 rounded-full bg-green-600"></span>
                    Enabled
                  </span>
                </div>
              </div>
            </div>

            <button
              *ngIf="canConfigureProducts()"
              routerLink="/tenant/products/config"
              [queryParams]="{ product: product.id }"
              class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition"
              title="Configure"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>

          <!-- Product Description -->
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {{ product.description }}
          </p>

          <!-- Features List -->
          <div class="space-y-2">
            <p class="text-xs font-semibold text-gray-700 dark:text-gray-300">Features:</p>
            <ul class="space-y-1">
              <li
                *ngFor="let feature of product.features"
                class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400"
              >
                <svg class="h-4 w-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>{{ feature }}</span>
              </li>
            </ul>
          </div>

          <!-- Last Updated -->
          <div *ngIf="product.lastUpdated" class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Last updated: {{ formatDate(product.lastUpdated) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        *ngIf="products().length === 0"
        class="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700"
      >
        <div class="text-6xl mb-4">📦</div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          No Products Available
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
          Contact your system administrator to enable products for your tenant.
        </p>
      </div>
    </div>
  `,
  styles: []
})
export class TenantProductsComponent implements OnInit {
  private rbacService = inject(RBACService);
  private authService = inject(AuthService);
  private tenantService = inject(TenantService);

  loading = signal(false);
  tenant = signal<Tenant | null>(null);

  // Build products list based on tenant settings
  products = computed(() => {
    const tenantData = this.tenant();
    if (!tenantData) return [];

    const allProducts = [
      {
        id: 'money-loan',
        name: 'Money Loan',
        icon: '💸',
        description: 'Comprehensive lending management system with loan applications, approvals, disbursements, and collections.',
        enabled: tenantData.money_loan_enabled || false,
        status: (tenantData.money_loan_enabled ? 'active' : 'inactive') as 'active' | 'inactive',
        features: [
          'Loan application processing',
          'Credit scoring and approval workflow',
          'Loan disbursement tracking',
          'Payment schedules and reminders',
          'Collection management'
        ],
        lastUpdated: tenantData.created_at
      },
      {
        id: 'pawnshop',
        name: 'Pawnshop',
        icon: '💍',
        description: 'Complete pawnshop operations including item appraisal, pawning, redemption, and inventory management.',
        enabled: tenantData.pawnshop_enabled || false,
        status: (tenantData.pawnshop_enabled ? 'active' : 'inactive') as 'active' | 'inactive',
        features: [
          'Item appraisal and valuation',
          'Pawn ticket generation',
          'Redemption tracking',
          'Inventory management',
          'Auction management'
        ],
        lastUpdated: tenantData.created_at
      },
      {
        id: 'bnpl',
        name: 'Buy Now Pay Later',
        icon: '🛒',
        description: 'BNPL solution for e-commerce integration with installment plans and payment processing.',
        enabled: tenantData.bnpl_enabled || false,
        status: (tenantData.bnpl_enabled ? 'active' : 'inactive') as 'active' | 'inactive',
        features: [
          'Installment plan management',
          'E-commerce integration',
          'Payment gateway integration',
          'Customer credit limits',
          'Late payment handling'
        ],
        lastUpdated: tenantData.created_at
      }
    ];

    // Only return products that are enabled
    return allProducts.filter(product => product.enabled);
  });

  activeProducts = computed(() =>
    this.products().filter(p => p.enabled && p.status === 'active').length
  );

  inactiveProducts = computed(() =>
    this.products().filter(p => !p.enabled || p.status === 'inactive').length
  );

  canConfigureProducts = computed(() =>
    this.rbacService.can('tenant-products:configure')
  );

  ngOnInit(): void {
    console.log('📦 TenantProductsComponent initialized');
    this.loadTenantProducts();
  }

  loadTenantProducts(): void {
    this.loading.set(true);
    this.tenantService.getMyTenant().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.tenant.set(response.data);
          console.log('✅ Loaded tenant products:', {
            moneyLoan: response.data.money_loan_enabled,
            pawnshop: response.data.pawnshop_enabled,
            bnpl: response.data.bnpl_enabled
          });
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('❌ Failed to load tenant products:', error);
        this.loading.set(false);
      }
    });
  }

  getStatusClass(status: string): string {
    return status === 'active'
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  }

  getStatusDotClass(status: string): string {
    return status === 'active' ? 'bg-green-600' : 'bg-gray-600';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }
}
