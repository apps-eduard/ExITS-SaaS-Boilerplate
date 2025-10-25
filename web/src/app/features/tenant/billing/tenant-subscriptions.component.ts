import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { TenantService, SubscriptionPlan as ApiSubscriptionPlan } from '../../../core/services/tenant.service';
import { RBACService } from '../../../core/services/rbac.service';
import { ToastService } from '../../../core/services/toast.service';
import { forkJoin } from 'rxjs';

interface SubscriptionPlan {
  id: string;
  name: string;
  description?: string;
  icon: string;
  price: number;
  currency?: string;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  productType?: string;
  trialDays?: number;
  current: boolean;
  recommended?: boolean;
  isActive?: boolean;
}

@Component({
  selector: 'app-tenant-subscriptions',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-4 space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>🧾</span>
            <span>My Subscriptions</span>
          </h1>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            Manage your subscription plans and billing
          </p>
        </div>
        <a
          routerLink="/tenant/billing"
          class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
          </svg>
          <span>View Billing</span>
        </a>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()" class="flex items-center justify-center py-8">
        <div class="text-center">
          <div class="inline-block h-6 w-6 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p class="mt-2 text-xs text-gray-600 dark:text-gray-400">Loading...</p>
        </div>
      </div>

      <!-- Current Subscription Card -->
      <div *ngIf="!loading() && currentSubscription() as currentPlan" class="rounded-lg border border-blue-200 bg-gradient-to-br from-blue-50 to-white p-4 dark:border-blue-900 dark:from-blue-950 dark:to-gray-900">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-2xl shadow-md">
              {{ currentPlan.icon }}
            </div>
            <div>
              <div class="flex items-center gap-2">
                <h2 class="text-lg font-bold text-gray-900 dark:text-white">
                  {{ currentPlan.name }}
                </h2>
                <span class="inline-flex items-center rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  <svg class="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  Active
                </span>
              </div>
              <div class="mt-1 flex items-baseline gap-1.5">
                <span class="text-xl font-bold text-gray-900 dark:text-white">
                  {{ formatPrice(currentPlan.price) }}
                </span>
                <span class="text-xs text-gray-600 dark:text-gray-400">
                  / {{ currentPlan.billingCycle }}
                </span>
              </div>
              <p class="mt-0.5 text-xs text-gray-600 dark:text-gray-400">
                <svg class="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Next billing: {{ getNextBillingDate() }}
              </p>
            </div>
          </div>
          <button
            *ngIf="canManageBilling()"
            (click)="managePlan()"
            class="rounded-lg bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition inline-flex items-center gap-1.5"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Manage
          </button>
        </div>

              <!-- Current Plan Features -->
        <div class="mt-4 grid grid-cols-2 gap-2 border-t border-blue-200 pt-4 dark:border-blue-900">
          <div *ngFor="let feature of getFeatures(currentPlan.features).slice(0, 6)" class="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300">
            <svg class="h-4 w-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>{{ feature }}</span>
          </div>
        </div>
      </div>

      <!-- Billing Cycle Toggle -->
      <div class="flex items-center justify-center gap-2">
        <span class="text-xs font-medium" [class.text-gray-900]="billingCycle() === 'monthly'" [class.text-gray-500]="billingCycle() !== 'monthly'" [class.dark:text-white]="billingCycle() === 'monthly'" [class.dark:text-gray-400]="billingCycle() !== 'monthly'">
          Monthly
        </span>
        <button
          (click)="toggleBillingCycle()"
          class="relative inline-flex h-5 w-9 items-center rounded-full transition"
          [class.bg-blue-600]="billingCycle() === 'yearly'"
          [class.bg-gray-200]="billingCycle() === 'monthly'"
          [class.dark:bg-gray-700]="billingCycle() === 'monthly'"
        >
          <span
            class="inline-block h-3.5 w-3.5 transform rounded-full bg-white transition"
            [class.translate-x-5]="billingCycle() === 'yearly'"
            [class.translate-x-0.5]="billingCycle() === 'monthly'"
          ></span>
        </button>
        <span class="text-xs font-medium" [class.text-gray-900]="billingCycle() === 'yearly'" [class.text-gray-500]="billingCycle() !== 'yearly'" [class.dark:text-white]="billingCycle() === 'yearly'" [class.dark:text-gray-400]="billingCycle() !== 'yearly'">
          Yearly <span class="text-green-600 dark:text-green-400">(Save 20%)</span>
        </span>
      </div>

      <!-- Available Plans -->
      <div *ngIf="!loading()">
        <h3 class="text-base font-bold text-gray-900 dark:text-white mb-3">
          Available Plans
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <div
            *ngFor="let plan of availablePlans()"
            class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition"
          >
            <!-- Plan Header -->
            <div class="p-4 border-b border-gray-200 dark:border-gray-700">
              <div class="flex items-start justify-between mb-2">
                <div class="flex-1">
                  <h3 class="text-lg font-bold text-gray-900 dark:text-white">{{ plan.name }}</h3>
                  <p *ngIf="plan.description" class="text-xs text-gray-600 dark:text-gray-400 mt-1">{{ plan.description }}</p>
                  
                  <!-- Product Type Badge -->
                  <div class="mt-2">
                    <span
                      *ngIf="plan.productType === 'platform'"
                      class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded"
                    >
                      🌐 Platform Plan (All Products)
                    </span>
                    <span
                      *ngIf="plan.productType === 'money_loan'"
                      class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded"
                    >
                      💰 Money Loan
                    </span>
                    <span
                      *ngIf="plan.productType === 'bnpl'"
                      class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded"
                    >
                      🛍️ Buy Now Pay Later
                    </span>
                    <span
                      *ngIf="plan.productType === 'pawnshop'"
                      class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded"
                    >
                      💎 Pawnshop
                    </span>
                  </div>
                </div>
                <span
                  *ngIf="plan.current"
                  class="px-2 py-0.5 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300"
                >
                  ✓ Active
                </span>
              </div>

              <div class="flex items-baseline gap-1 mt-3">
                <span class="text-3xl font-bold text-gray-900 dark:text-white">{{ plan.currency || 'PHP' }} {{ formatPriceNumber(getPlanPrice(plan)) }}</span>
                <span class="text-sm text-gray-500 dark:text-gray-400">/{{ billingCycle() }}</span>
              </div>

              <div *ngIf="plan.trialDays && plan.trialDays > 0" class="mt-2 inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium rounded">
                🎁 {{ plan.trialDays }} days free trial
              </div>

              <div *ngIf="billingCycle() === 'yearly'" class="mt-2 inline-flex items-center gap-1 px-2 py-0.5 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300 text-xs font-medium rounded">
                💰 Save {{ formatPrice(plan.price * 12 * 0.2) }}/year
              </div>
            </div>

            <!-- Features -->
            <div class="p-4">
              <h4 class="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase">Features</h4>
              <ul class="space-y-1.5">
                <li *ngFor="let feature of getFeatures(plan.features)" class="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <svg class="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                  </svg>
                  {{ feature }}
                </li>
              </ul>
            </div>

            <!-- Actions -->
            <div class="p-3 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2">
              <button
                *ngIf="!plan.current && canManageBilling()"
                (click)="selectPlan(plan)"
                class="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium rounded transition"
                [class]="plan.recommended 
                  ? 'text-white bg-blue-600 hover:bg-blue-700' 
                  : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path *ngIf="plan.price > (currentSubscription()?.price || 0)" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  <path *ngIf="plan.price <= (currentSubscription()?.price || 0)" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                {{ plan.price > (currentSubscription()?.price || 0) ? 'Upgrade' : 'Switch' }}
              </button>
              <div *ngIf="plan.current" class="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                Current Plan
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Need Help Section -->
      <div class="rounded-lg border border-gray-200 bg-gray-50 p-4 dark:border-gray-700 dark:bg-gray-800/50">
        <div class="flex items-start gap-3">
          <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div class="flex-1">
            <h4 class="text-sm font-bold text-gray-900 dark:text-white">
              Need help choosing a plan?
            </h4>
            <p class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              Contact our sales team to discuss your requirements and find the perfect plan for your business.
            </p>
            <button class="mt-2 inline-flex items-center gap-1.5 text-xs font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>Contact Sales</span>
              <svg class="h-3.5 w-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class TenantSubscriptionsComponent implements OnInit {
  private tenantService = inject(TenantService);
  private rbacService = inject(RBACService);
  private toastService = inject(ToastService);

  billingCycle = signal<'monthly' | 'yearly'>('monthly');
  loading = signal(false);
  currentSubscription = signal<SubscriptionPlan | null>(null);
  allPlans = signal<ApiSubscriptionPlan[]>([]);

  availablePlans = computed(() => {
    const cycle = this.billingCycle();
    const currentPlan = this.currentSubscription();
    const currentName = currentPlan?.name || '';
    
    return this.allPlans().map(apiPlan => ({
      id: apiPlan.name,
      name: apiPlan.displayName || apiPlan.name,
      description: apiPlan.description,
      icon: apiPlan.icon || '📦',
      price: apiPlan.price,
      currency: 'PHP',
      billingCycle: cycle,
      features: apiPlan.features || [],
      productType: apiPlan.productType,
      trialDays: 0,
      current: currentName === apiPlan.displayName || currentName === apiPlan.name,
      recommended: apiPlan.isRecommended,
      isActive: apiPlan.isActive
    } as SubscriptionPlan));
  });

  canManageBilling = computed(() =>
    this.rbacService.can('tenant-billing:read')
  );

  ngOnInit(): void {
    console.log('🧾 TenantSubscriptionsComponent initialized');
    this.loadSubscriptionData();
  }

  loadSubscriptionData(): void {
    this.loading.set(true);
    
    // Load both tenant data and ALL available plans (including product-specific plans)
    forkJoin({
      tenant: this.tenantService.getMyTenant(),
      plans: this.tenantService.getAllSubscriptionPlans()
    }).subscribe({
      next: ({ tenant, plans }) => {
        if (tenant.success && tenant.data) {
          console.log('📦 All available plans:', plans.data);
          this.allPlans.set(plans.data || []);
          
          const currentPlanName = tenant.data.plan;
          const currentPlan = plans.data?.find(p => 
            p.name.toLowerCase() === currentPlanName?.toLowerCase()
          );
          
          if (currentPlan) {
            this.currentSubscription.set({
              id: currentPlan.name,
              name: currentPlan.displayName || currentPlan.name,
              icon: currentPlan.icon || '📦',
              price: currentPlan.price,
              billingCycle: 'monthly', // TODO: Add billing_cycle to tenant table
              features: Array.isArray(currentPlan.features) ? currentPlan.features : [],
              current: true,
              recommended: currentPlan.isRecommended
            });
            console.log('✅ Loaded subscription:', currentPlan.displayName || currentPlan.name);
          } else {
            console.warn('⚠️ Current plan not found in available plans:', currentPlanName);
          }
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('❌ Failed to load subscription data:', error);
        this.toastService.error('Failed to load subscription details');
        this.loading.set(false);
      }
    });
  }

  toggleBillingCycle(): void {
    this.billingCycle.update(cycle => cycle === 'monthly' ? 'yearly' : 'monthly');
  }

  getPlanPrice(plan: SubscriptionPlan): number {
    if (this.billingCycle() === 'yearly') {
      return plan.price * 12 * 0.8; // 20% discount
    }
    return plan.price;
  }

  getFeatures(features: any): string[] {
    // Features are already stored with icons in the database, just return them
    if (Array.isArray(features)) {
      return features;
    }
    return [];
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
  }

  formatPriceNumber(amount: number): string {
    return new Intl.NumberFormat('en-PH', {
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  getNextBillingDate(): string {
    const next = new Date();
    const cycle = this.billingCycle();
    if (cycle === 'monthly') {
      next.setMonth(next.getMonth() + 1);
    } else {
      next.setFullYear(next.getFullYear() + 1);
    }
    return next.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

  selectPlan(plan: SubscriptionPlan): void {
    console.log('📦 Selected plan:', plan.name);
    // TODO: Implement plan change/upgrade logic
    this.toastService.info(`Upgrading to ${plan.name} plan will be available soon!`);
  }

  managePlan(): void {
    // Navigate to billing settings or open manage dialog
    this.toastService.info('Plan management features coming soon!');
  }
}
