import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ProductSubscriptionService, PlatformSubscription } from '../../../core/services/product-subscription.service';

interface Tenant {
  id: number;
  name: string;
  subdomain: string;
  plan: string;
  status: string;
  maxUsers: number;
  logoUrl?: string;
  primaryColor?: string;
  secondaryColor?: string;
  colors?: {
    primary?: string;
    secondary?: string;
  };
  createdAt: string;
  updatedAt: string;
  userCount: number;
  roleCount: number;
  // Contact Person
  contactPerson?: string;
  contactEmail?: string;
  contactPhone?: string;
  // Product Enablement (camelCase from API)
  moneyLoanEnabled?: boolean;
  bnplEnabled?: boolean;
  pawnshopEnabled?: boolean;
  // Subscription Plan Details
  subscriptionPlan?: {
    id: number;
    name: string;
    description: string;
    price: number;
    billingCycle: string;
    features: string[];
    maxUsers: number | null;
    maxStorageGb: number;
  };
}

interface TenantStats {
  total_users: number;
  total_roles: number;
  total_assignments: number;
  total_audit_logs: number;
  active_sessions: number;
}

@Component({
  selector: 'app-tenant-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-6 space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">🏢 Tenant Details</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            View tenant information and statistics
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button
            [routerLink]="['/admin/tenants', tenant()?.id, 'edit']"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
          <button
            routerLink="/admin/tenants"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to List
          </button>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-4">Loading tenant details...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error()" class="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/10 p-4">
        <p class="text-sm text-red-800 dark:text-red-200">{{ error() }}</p>
      </div>

      <!-- Content -->
      <div *ngIf="!loading() && !error() && tenant()" class="space-y-6">
        <!-- Tenant Overview -->
        <div class="grid grid-cols-1 lg:grid-cols-12 gap-6">
          <!-- Main Info -->
          <div class="lg:col-span-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
            <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Tenant Information</h2>
            </div>
            <div class="p-6 space-y-4">
              <div class="flex items-start gap-4">
                <div *ngIf="tenant()?.logoUrl" class="w-16 h-16 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-gray-900 overflow-hidden">
                  <img [src]="tenant()?.logoUrl" [alt]="tenant()?.name" class="w-full h-full object-cover" />
                </div>
                <div *ngIf="!tenant()?.logoUrl" class="w-16 h-16 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                  <span class="text-2xl">🏢</span>
                </div>
                <div class="flex-1">
                  <h3 class="text-xl font-bold text-gray-900 dark:text-white">{{ tenant()?.name }}</h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Tenant ID: {{ tenant()?.id }}</p>
                  <div class="flex items-center gap-2 mt-2">
                    <span class="inline-flex items-center px-2 py-1 text-xs font-semibold rounded" [ngClass]="getStatusClass(tenant()?.status || '')">
                      {{ tenant()?.status?.toUpperCase() }}
                    </span>
                    <span class="inline-flex items-center px-2 py-1 text-xs font-semibold rounded" [ngClass]="getPlanClass(tenant()?.plan || '')">
                      {{ tenant()?.plan?.toUpperCase() }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Subdomain</p>
                  <code class="text-sm text-blue-600 dark:text-blue-400">{{ tenant()?.subdomain }}.yourapp.com</code>
                </div>
                <div>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">User Limit</p>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ tenant()?.userCount }} / {{ tenant()?.maxUsers }}
                    <span class="text-xs text-gray-500 dark:text-gray-400">
                      ({{ getUsagePercentage() }}%)
                    </span>
                  </p>
                </div>
                <div>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Created</p>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ formatDate(tenant()?.createdAt || '') }}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Last Updated</p>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ formatDate(tenant()?.updatedAt || '') }}</p>
                </div>
              </div>

              <!-- Contact Person Section -->
              <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <span>👤</span>
                  Contact Person
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Name</p>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ tenant()?.contactPerson || 'Not provided' }}
                    </p>
                  </div>
                  <div>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Email</p>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ tenant()?.contactEmail || 'Not provided' }}
                    </p>
                  </div>
                  <div>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Phone</p>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ tenant()?.contactPhone || 'Not provided' }}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Product Subscriptions (Right Column) -->
          <div class="lg:col-span-6 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
            <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <h2 class="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span>📦</span>
                Product Subscriptions
              </h2>
            </div>
            <div class="p-4">

                <!-- No products enabled -->
                <div *ngIf="!tenant()?.moneyLoanEnabled && !tenant()?.bnplEnabled && !tenant()?.pawnshopEnabled"
                     class="text-center py-6 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                  <p class="text-sm text-gray-500 dark:text-gray-400">No products enabled for this tenant</p>
                </div>

                <!-- Product subscription cards -->
                <div class="space-y-3">
                  <!-- Money Loan Product -->
                  <div *ngIf="tenant()?.moneyLoanEnabled" class="bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 rounded-lg p-4 border border-green-200 dark:border-green-800">
                    <div class="flex items-start justify-between mb-3">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center text-xl border border-green-200 dark:border-green-700">
                          💵
                        </div>
                        <div>
                          <h5 class="text-base font-bold text-gray-900 dark:text-white">Money Loan</h5>
                          <p class="text-xs text-gray-600 dark:text-gray-400">Quick cash loans</p>
                        </div>
                      </div>
                      <span *ngIf="getProductSubscription('money_loan')"
                            class="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full"
                            [ngClass]="getStatusBadgeClass(getProductSubscription('money_loan')?.status || '')">
                        {{ getProductSubscription('money_loan')?.status?.toUpperCase() }}
                      </span>
                    </div>

                    <div *ngIf="getProductSubscription('money_loan'); else noSubscription">
                      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        <div class="bg-white dark:bg-gray-800 rounded-lg p-2.5 border border-gray-200 dark:border-gray-700">
                          <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Plan</p>
                          <p class="text-sm font-bold text-gray-900 dark:text-white capitalize">
                            {{ getProductSubscription('money_loan')?.subscriptionPlan?.name }}
                          </p>
                        </div>
                        <div class="bg-white dark:bg-gray-800 rounded-lg p-2.5 border border-gray-200 dark:border-gray-700">
                          <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Price</p>
                          <p class="text-xs font-bold text-green-600 dark:text-green-400">
                            ₱{{ formatPrice(getProductSubscription('money_loan')?.price || 0) }}
                          </p>
                        </div>
                        <div class="bg-white dark:bg-gray-800 rounded-lg p-2.5 border border-gray-200 dark:border-gray-700">
                          <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Billing</p>
                          <p class="text-xs font-bold text-gray-900 dark:text-white capitalize">
                            {{ getProductSubscription('money_loan')?.billingCycle }}
                          </p>
                        </div>
                        <div class="bg-white dark:bg-gray-800 rounded-lg p-2.5 border border-gray-200 dark:border-gray-700">
                          <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Started</p>
                          <p class="text-xs font-bold text-gray-900 dark:text-white">
                            {{ formatDate(getProductSubscription('money_loan')?.startsAt || '') }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- BNPL Product -->
                  <div *ngIf="tenant()?.bnplEnabled" class="bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
                    <div class="flex items-start justify-between mb-3">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center text-xl border border-blue-200 dark:border-blue-700">
                          💳
                        </div>
                        <div>
                          <h5 class="text-base font-bold text-gray-900 dark:text-white">BNPL</h5>
                          <p class="text-xs text-gray-600 dark:text-gray-400">Buy Now Pay Later</p>
                        </div>
                      </div>
                      <span *ngIf="getProductSubscription('bnpl')"
                            class="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full"
                            [ngClass]="getStatusBadgeClass(getProductSubscription('bnpl')?.status || '')">
                        {{ getProductSubscription('bnpl')?.status?.toUpperCase() }}
                      </span>
                    </div>

                    <div *ngIf="getProductSubscription('bnpl'); else noSubscription">
                      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        <div class="bg-white dark:bg-gray-800 rounded-lg p-2.5 border border-gray-200 dark:border-gray-700">
                          <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Plan</p>
                          <p class="text-sm font-bold text-gray-900 dark:text-white capitalize">
                            {{ getProductSubscription('bnpl')?.subscriptionPlan?.name }}
                          </p>
                        </div>
                        <div class="bg-white dark:bg-gray-800 rounded-lg p-2.5 border border-gray-200 dark:border-gray-700">
                          <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Price</p>
                          <p class="text-xs font-bold text-blue-600 dark:text-blue-400">
                            ₱{{ formatPrice(getProductSubscription('bnpl')?.price || 0) }}
                          </p>
                        </div>
                        <div class="bg-white dark:bg-gray-800 rounded-lg p-2.5 border border-gray-200 dark:border-gray-700">
                          <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Billing</p>
                          <p class="text-xs font-bold text-gray-900 dark:text-white capitalize">
                            {{ getProductSubscription('bnpl')?.billingCycle }}
                          </p>
                        </div>
                        <div class="bg-white dark:bg-gray-800 rounded-lg p-2.5 border border-gray-200 dark:border-gray-700">
                          <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Started</p>
                          <p class="text-xs font-bold text-gray-900 dark:text-white">
                            {{ formatDate(getProductSubscription('bnpl')?.startsAt || '') }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>

                  <!-- Pawnshop Product -->
                  <div *ngIf="tenant()?.pawnshopEnabled" class="bg-gradient-to-br from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
                    <div class="flex items-start justify-between mb-3">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-white dark:bg-gray-800 rounded-lg flex items-center justify-center text-xl border border-purple-200 dark:border-purple-700">
                          💎
                        </div>
                        <div>
                          <h5 class="text-base font-bold text-gray-900 dark:text-white">Pawnshop</h5>
                          <p class="text-xs text-gray-600 dark:text-gray-400">Collateral loans</p>
                        </div>
                      </div>
                      <span *ngIf="getProductSubscription('pawnshop')"
                            class="inline-flex items-center px-2.5 py-1 text-xs font-semibold rounded-full"
                            [ngClass]="getStatusBadgeClass(getProductSubscription('pawnshop')?.status || '')">
                        {{ getProductSubscription('pawnshop')?.status?.toUpperCase() }}
                      </span>
                    </div>

                    <div *ngIf="getProductSubscription('pawnshop'); else noSubscription">
                      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
                        <div class="bg-white dark:bg-gray-800 rounded-lg p-2.5 border border-gray-200 dark:border-gray-700">
                          <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Plan</p>
                          <p class="text-sm font-bold text-gray-900 dark:text-white capitalize">
                            {{ getProductSubscription('pawnshop')?.subscriptionPlan?.name }}
                          </p>
                        </div>
                        <div class="bg-white dark:bg-gray-800 rounded-lg p-2.5 border border-gray-200 dark:border-gray-700">
                          <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Price</p>
                          <p class="text-xs font-bold text-purple-600 dark:text-purple-400">
                            ₱{{ formatPrice(getProductSubscription('pawnshop')?.price || 0) }}
                          </p>
                        </div>
                        <div class="bg-white dark:bg-gray-800 rounded-lg p-2.5 border border-gray-200 dark:border-gray-700">
                          <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Billing</p>
                          <p class="text-xs font-bold text-gray-900 dark:text-white capitalize">
                            {{ getProductSubscription('pawnshop')?.billingCycle }}
                          </p>
                        </div>
                        <div class="bg-white dark:bg-gray-800 rounded-lg p-2.5 border border-gray-200 dark:border-gray-700">
                          <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Started</p>
                          <p class="text-xs font-bold text-gray-900 dark:text-white">
                            {{ formatDate(getProductSubscription('pawnshop')?.startsAt || '') }}
                          </p>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>

              <!-- No subscription template -->
              <ng-template #noSubscription>
                <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800">
                  <p class="text-xs text-yellow-800 dark:text-yellow-300">
                    ⚠️ Product is enabled but no subscription plan is assigned. Please edit the tenant to configure a subscription.
                  </p>
                </div>
              </ng-template>
            </div>
          </div>
        </div>

        <!-- User Usage Progress -->
        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <h2 class="text-sm font-semibold text-gray-900 dark:text-white">User Capacity</h2>
          </div>
          <div class="p-6">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ tenant()?.userCount }} of {{ tenant()?.maxUsers }} users
              </span>
              <span class="text-sm font-semibold" [ngClass]="getUsageColor()">
                {{ getUsagePercentage() }}%
              </span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                class="h-3 rounded-full transition-all duration-500"
                [ngClass]="getUsageBarColor()"
                [style.width.%]="getUsagePercentage()">
              </div>
            </div>
          </div>
        </div>

        <!-- Branding Colors -->
        <div *ngIf="tenant()?.colors" class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Branding Colors</h2>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">Primary Color</p>
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-lg border border-gray-200 dark:border-gray-700" [style.background-color]="tenant()?.colors?.primary"></div>
                  <code class="text-sm text-gray-900 dark:text-white">{{ tenant()?.colors?.primary }}</code>
                </div>
              </div>
              <div>
                <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">Secondary Color</p>
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-lg border border-gray-200 dark:border-gray-700" [style.background-color]="tenant()?.colors?.secondary"></div>
                  <code class="text-sm text-gray-900 dark:text-white">{{ tenant()?.colors?.secondary }}</code>
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
export class TenantDetailsComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);
  private productSubscriptionService = inject(ProductSubscriptionService);

  tenant = signal<Tenant | null>(null);
  stats = signal<TenantStats | null>(null);
  productSubscriptions = signal<PlatformSubscription[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTenant(parseInt(id));
      this.loadStats(parseInt(id));
      this.loadProductSubscriptions(parseInt(id));
    }
    console.log('🏢 TenantDetailsComponent initialized');
  }

  loadProductSubscriptions(tenantId: number): void {
    this.productSubscriptionService.getTenantProductSubscriptions(tenantId).subscribe({
      next: (response) => {
        this.productSubscriptions.set(response.data);
        console.log('📦 Product subscriptions loaded:', response.data);
      },
      error: (err) => {
        console.error('Error loading product subscriptions:', err);
      }
    });
  }

  getProductSubscription(productType: string): PlatformSubscription | undefined {
    return this.productSubscriptions().find(sub => sub.platformType === productType);
  }

  getProductIcon(productType: string): string {
    switch (productType) {
      case 'money_loan': return '💵';
      case 'bnpl': return '💳';
      case 'pawnshop': return '💎';
      default: return '📦';
    }
  }

  getProductName(productType: string): string {
    switch (productType) {
      case 'money_loan': return 'Money Loan';
      case 'bnpl': return 'BNPL';
      case 'pawnshop': return 'Pawnshop';
      default: return productType;
    }
  }

  getProductColor(productType: string): string {
    switch (productType) {
      case 'money_loan': return 'green';
      case 'bnpl': return 'blue';
      case 'pawnshop': return 'purple';
      default: return 'gray';
    }
  }

  getStatusBadgeClass(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'suspended':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      case 'cancelled':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      case 'expired':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-400';
    }
  }

  loadTenant(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<any>(`/api/tenants/${id}`).subscribe({
      next: (response) => {
        this.tenant.set(response.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load tenant');
        this.loading.set(false);
        console.error('Error loading tenant:', err);
      }
    });
  }

  loadStats(id: number): void {
    this.http.get<any>(`/api/tenants/${id}/stats`).subscribe({
      next: (response) => {
        this.stats.set(response.data);
      },
      error: (err) => {
        console.error('Error loading tenant stats:', err);
      }
    });
  }

  getUsagePercentage(): number {
    const t = this.tenant();
    if (!t || !t.maxUsers) return 0;
    return Math.round((t.userCount / t.maxUsers) * 100);
  }

  getUsageColor(): string {
    const usage = this.getUsagePercentage();
    if (usage >= 90) return 'text-red-600 dark:text-red-400';
    if (usage >= 75) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  }

  getUsageBarColor(): string {
    const usage = this.getUsagePercentage();
    if (usage >= 90) return 'bg-red-500';
    if (usage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'suspended':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      case 'trial':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  }

  getPlanClass(plan: string): string {
    switch (plan) {
      case 'enterprise':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
      case 'professional':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      case 'basic':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    // For subscription dates, show short format
    if (dateString.includes('T')) {
      return date.toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'long',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    }
    // For date-only format (YYYY-MM-DD)
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  }
}
