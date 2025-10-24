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
  icon: string;
  price: number;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  current: boolean;
  recommended?: boolean;
}

@Component({
  selector: 'app-tenant-subscriptions',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-6 space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">🧾 My Subscriptions</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your subscription plans and billing
          </p>
        </div>
        <a
          routerLink="/tenant/billing"
          class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition"
        >
          <span>💰</span>
          <span>View Billing</span>
        </a>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()" class="flex items-center justify-center py-12">
        <div class="text-center">
          <div class="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-blue-600 border-r-transparent"></div>
          <p class="mt-3 text-sm text-gray-600 dark:text-gray-400">Loading subscription details...</p>
        </div>
      </div>

      <!-- Current Subscription Card -->
      <div *ngIf="!loading() && currentSubscription() as currentPlan" class="rounded-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 dark:border-blue-900 dark:from-blue-950 dark:to-gray-900">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-4">
            <div class="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-3xl shadow-lg">
              {{ currentPlan.icon }}
            </div>
            <div>
              <div class="flex items-center gap-3">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white">
                  {{ currentPlan.name }} Plan
                </h2>
                <span class="inline-flex items-center rounded-full bg-green-100 px-3 py-1 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                  ✓ Active
                </span>
              </div>
              <div class="mt-2 flex items-baseline gap-2">
                <span class="text-3xl font-bold text-gray-900 dark:text-white">
                  {{ formatPrice(currentPlan.price) }}
                </span>
                <span class="text-sm text-gray-600 dark:text-gray-400">
                  / {{ currentPlan.billingCycle }}
                </span>
              </div>
              <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
                Next billing date: {{ getNextBillingDate() }}
              </p>
            </div>
          </div>
          <button
            *ngIf="canManageBilling()"
            (click)="managePlan()"
            class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
          >
            Manage Plan
          </button>
        </div>

              <!-- Current Plan Features -->
        <div class="mt-6 grid grid-cols-2 gap-3 border-t border-blue-200 pt-6 dark:border-blue-900">
          <div *ngFor="let feature of (currentPlan.features || []).slice(0, 6)" class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <svg class="h-5 w-5 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>{{ feature }}</span>
          </div>
        </div>
      </div>

      <!-- Billing Cycle Toggle -->
      <div class="flex items-center justify-center gap-4">
        <span class="text-sm font-medium" [class.text-gray-900]="billingCycle() === 'monthly'" [class.text-gray-500]="billingCycle() !== 'monthly'" [class.dark:text-white]="billingCycle() === 'monthly'" [class.dark:text-gray-400]="billingCycle() !== 'monthly'">
          Monthly
        </span>
        <button
          (click)="toggleBillingCycle()"
          class="relative inline-flex h-6 w-11 items-center rounded-full transition"
          [class.bg-blue-600]="billingCycle() === 'yearly'"
          [class.bg-gray-200]="billingCycle() === 'monthly'"
          [class.dark:bg-gray-700]="billingCycle() === 'monthly'"
        >
          <span
            class="inline-block h-4 w-4 transform rounded-full bg-white transition"
            [class.translate-x-6]="billingCycle() === 'yearly'"
            [class.translate-x-1]="billingCycle() === 'monthly'"
          ></span>
        </button>
        <span class="text-sm font-medium" [class.text-gray-900]="billingCycle() === 'yearly'" [class.text-gray-500]="billingCycle() !== 'yearly'" [class.dark:text-white]="billingCycle() === 'yearly'" [class.dark:text-gray-400]="billingCycle() !== 'yearly'">
          Yearly <span class="text-green-600 dark:text-green-400">(Save 20%)</span>
        </span>
      </div>

      <!-- Available Plans -->
      <div *ngIf="!loading()">
        <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">
          Available Plans
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div
            *ngFor="let plan of availablePlans()"
            class="relative rounded-lg border p-6 transition-all hover:shadow-lg"
            [class.border-blue-600]="plan.current"
            [class.border-2]="plan.current"
            [class.bg-blue-50]="plan.current"
            [class.dark:bg-blue-950]="plan.current"
            [class.border-gray-200]="!plan.current"
            [class.bg-white]="!plan.current"
            [class.dark:border-gray-700]="!plan.current"
            [class.dark:bg-gray-900]="!plan.current"
          >
            <!-- Recommended Badge -->
            <div *ngIf="plan.recommended" class="absolute -top-3 left-1/2 -translate-x-1/2">
              <span class="inline-flex items-center rounded-full bg-gradient-to-r from-blue-600 to-purple-600 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                ⭐ Recommended
              </span>
            </div>

            <!-- Current Plan Badge -->
            <div *ngIf="plan.current" class="absolute -top-3 right-4">
              <span class="inline-flex items-center rounded-full bg-green-600 px-3 py-1 text-xs font-semibold text-white shadow-lg">
                ✓ Current Plan
              </span>
            </div>

            <!-- Plan Icon -->
            <div class="text-center mb-4">
              <div class="inline-flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-3xl shadow-md">
                {{ plan.icon }}
              </div>
            </div>

            <!-- Plan Name -->
            <h4 class="text-xl font-bold text-center text-gray-900 dark:text-white mb-2">
              {{ plan.name }}
            </h4>

            <!-- Price -->
            <div class="text-center mb-6">
              <div class="flex items-baseline justify-center gap-1">
                <span class="text-3xl font-bold text-gray-900 dark:text-white">
                  {{ formatPrice(getPlanPrice(plan)) }}
                </span>
                <span class="text-sm text-gray-600 dark:text-gray-400">
                  / {{ billingCycle() }}
                </span>
              </div>
              <p *ngIf="billingCycle() === 'yearly'" class="text-xs text-green-600 dark:text-green-400 mt-1">
                Save {{ formatPrice(plan.price * 12 * 0.2) }} per year
              </p>
            </div>

            <!-- Features -->
            <ul class="space-y-3 mb-6">
              <li *ngFor="let feature of plan.features" class="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                <svg class="h-5 w-5 text-green-500 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>{{ feature }}</span>
              </li>
            </ul>

            <!-- Action Button -->
            <button
              *ngIf="!plan.current && canManageBilling()"
              (click)="selectPlan(plan)"
              class="w-full rounded-lg py-2 text-sm font-medium transition"
              [class.bg-blue-600]="plan.recommended"
              [class.hover:bg-blue-700]="plan.recommended"
              [class.text-white]="plan.recommended"
              [class.bg-gray-100]="!plan.recommended"
              [class.hover:bg-gray-200]="!plan.recommended"
              [class.text-gray-900]="!plan.recommended"
              [class.dark:bg-gray-800]="!plan.recommended"
              [class.dark:hover:bg-gray-700]="!plan.recommended"
              [class.dark:text-white]="!plan.recommended"
            >
              {{ plan.price > (currentSubscription()?.price || 0) ? 'Upgrade' : 'Downgrade' }}
            </button>
            <div *ngIf="plan.current" class="w-full rounded-lg bg-gray-200 py-2 text-center text-sm font-medium text-gray-600 dark:bg-gray-700 dark:text-gray-400">
              Current Plan
            </div>
          </div>
        </div>
      </div>

      <!-- Need Help Section -->
      <div class="rounded-lg border border-gray-200 bg-gray-50 p-6 dark:border-gray-700 dark:bg-gray-800/50">
        <div class="flex items-start gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
            <span class="text-2xl">💬</span>
          </div>
          <div class="flex-1">
            <h4 class="text-lg font-bold text-gray-900 dark:text-white">
              Need help choosing a plan?
            </h4>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Contact our sales team to discuss your requirements and find the perfect plan for your business.
            </p>
            <button class="mt-3 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
              <span>Contact Sales</span>
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
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
      icon: apiPlan.icon || '📦',
      price: apiPlan.price,
      billingCycle: cycle,
      features: apiPlan.features || [],
      current: currentName === apiPlan.displayName || currentName === apiPlan.name,
      recommended: apiPlan.isRecommended
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
    
    // Load both tenant data and available plans
    forkJoin({
      tenant: this.tenantService.getMyTenant(),
      plans: this.tenantService.getSubscriptionPlans()
    }).subscribe({
      next: ({ tenant, plans }) => {
        if (tenant.success && tenant.data) {
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
              features: currentPlan.features || [],
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

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(price);
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
