import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { TenantService, SubscriptionPlan as ApiSubscriptionPlan } from '../../../core/services/tenant.service';
import { RBACService } from '../../../core/services/rbac.service';
import { ToastService } from '../../../core/services/toast.service';
import { forkJoin } from 'rxjs';

interface SubscriptionPlan {
  id: number | string; // Allow both number (from API) and string (for compatibility)
  name: string;
  description?: string;
  icon: string;
  price: number;
  currency?: string;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  productType?: string;
  trialDays?: number;
  current: boolean; // User currently has this plan
  hasActiveSubscription: boolean; // User has active subscription for this product
  recommended?: boolean;
  isActive?: boolean;
  subscriptionStatus?: 'available' | 'active' | 'pending'; // New field
  startedAt?: string; // When subscription started
  expiresAt?: string; // When subscription expires
}

@Component({
  selector: 'app-tenant-subscriptions',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-6 space-y-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
      <!-- Header -->
      <div class="max-w-7xl mx-auto">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span class="text-3xl">🧾</span>
              <span>My Subscriptions</span>
            </h1>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Manage your subscription plans and billing preferences
            </p>
          </div>
          <a
            routerLink="/tenant/billing"
            class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-all shadow-sm hover:shadow"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            <span>View Billing</span>
          </a>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()" class="flex items-center justify-center py-12">
        <div class="text-center">
          <div class="inline-block h-8 w-8 animate-spin rounded-full border-3 border-solid border-blue-600 border-r-transparent"></div>
          <p class="mt-3 text-sm text-gray-600 dark:text-gray-400">Loading subscriptions...</p>
        </div>
      </div>

      <!-- Content Wrapper -->
      <div *ngIf="!loading()" class="max-w-7xl mx-auto space-y-6">
        <!-- Current Subscriptions Cards -->
        <div *ngIf="currentSubscriptions().length > 0">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
            <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
            </svg>
            Active Subscriptions
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div *ngFor="let currentPlan of currentSubscriptions()" class="relative overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-white p-6 dark:border-blue-900/50 dark:from-blue-950 dark:via-indigo-950 dark:to-gray-900 shadow-lg hover:shadow-xl transition-all">
            <div class="absolute top-0 right-0 w-48 h-48 bg-blue-400/10 rounded-full blur-3xl"></div>
            <div class="relative flex items-start justify-between">
              <div class="flex items-center gap-4">
                <div class="flex h-14 w-14 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-purple-600 text-3xl shadow-lg">
                  {{ currentPlan.icon }}
                </div>
                <div>
                  <div class="flex items-center gap-2 mb-1">
                    <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                      {{ currentPlan.name }}
                    </h2>
                    <span class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
                      <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                      </svg>
                      Active
                    </span>
                  </div>
                  <!-- Product Type Badge -->
                  <div class="mt-2">
                    <span
                      *ngIf="currentPlan.productType === 'money_loan'"
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded-full"
                    >
                      💰 Money Loan
                    </span>
                    <span
                      *ngIf="currentPlan.productType === 'bnpl'"
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full"
                    >
                      🛍️ BNPL
                    </span>
                    <span
                      *ngIf="currentPlan.productType === 'pawnshop'"
                      class="inline-flex items-center gap-1.5 px-2.5 py-1 text-xs font-medium bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded-full"
                    >
                      💎 Pawnshop
                    </span>
                  </div>
                  <div class="mt-2 flex items-baseline gap-1.5">
                    <span class="text-2xl font-bold text-gray-900 dark:text-white">
                      {{ formatPrice(currentPlan.price) }}
                    </span>
                    <span class="text-sm text-gray-600 dark:text-gray-400">
                      / {{ currentPlan.billingCycle }}
                    </span>
                  </div>
                  <!-- Expiration Date -->
                  <div class="mt-2 flex items-center gap-2">
                    <p *ngIf="currentPlan.expiresAt" class="inline-flex items-center gap-1.5 text-sm text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2.5 py-1 rounded-full">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                      Expires: {{ formatDate(currentPlan.expiresAt) }}
                    </p>
                    <!-- No Expiration (Unlimited) -->
                    <p *ngIf="!currentPlan.expiresAt" class="inline-flex items-center gap-1.5 text-sm text-green-700 dark:text-green-400 font-medium bg-green-100 dark:bg-green-900/30 px-2.5 py-1 rounded-full">
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                      </svg>
                      Active (No expiration)
                    </p>
                  </div>
                </div>
              </div>
              <button
                *ngIf="canManageBilling()"
                (click)="managePlan()"
                class="rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-medium text-white hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg inline-flex items-center gap-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
                Manage
              </button>
            </div>

            <!-- Current Plan Features -->
            <div class="relative mt-5 grid grid-cols-2 gap-3 border-t border-blue-200/50 pt-5 dark:border-blue-900/50">
              <div *ngFor="let feature of getFeatures(currentPlan.features).slice(0, 6)" class="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
                <svg class="h-4 w-4 text-green-500 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                <span>{{ feature }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Billing Cycle Toggle -->
      <div class="flex items-center justify-center gap-3 p-4 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 shadow-sm">
        <span class="text-sm font-medium" [class.text-gray-900]="billingCycle() === 'monthly'" [class.text-gray-500]="billingCycle() !== 'monthly'" [class.dark:text-white]="billingCycle() === 'monthly'" [class.dark:text-gray-400]="billingCycle() !== 'monthly'">
          Monthly
        </span>
        <button
          (click)="toggleBillingCycle()"
          class="relative inline-flex h-6 w-11 items-center rounded-full transition-colors shadow-sm"
          [class.bg-gradient-to-r]="billingCycle() === 'yearly'"
          [class.from-blue-600]="billingCycle() === 'yearly'"
          [class.to-blue-700]="billingCycle() === 'yearly'"
          [class.bg-gray-200]="billingCycle() === 'monthly'"
          [class.dark:bg-gray-700]="billingCycle() === 'monthly'"
        >
          <span
            class="inline-block h-4 w-4 transform rounded-full bg-white transition-transform shadow-md"
            [class.translate-x-6]="billingCycle() === 'yearly'"
            [class.translate-x-1]="billingCycle() === 'monthly'"
          ></span>
        </button>
        <span class="text-sm font-medium" [class.text-gray-900]="billingCycle() === 'yearly'" [class.text-gray-500]="billingCycle() !== 'yearly'" [class.dark:text-white]="billingCycle() === 'yearly'" [class.dark:text-gray-400]="billingCycle() !== 'yearly'">
          Yearly <span class="inline-flex items-center gap-1 text-green-600 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-2 py-0.5 rounded-full text-xs font-semibold ml-1">
            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M12 7a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0V8.414l-4.293 4.293a1 1 0 01-1.414 0L8 10.414l-4.293 4.293a1 1 0 01-1.414-1.414l5-5a1 1 0 011.414 0L11 10.586 14.586 7H12z" clip-rule="evenodd" />
            </svg>
            Save 20%
          </span>
        </span>
      </div>

      <!-- Available Plans -->
      <div *ngIf="availablePlans().length > 0">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
          </svg>
          Available Plans
        </h3>
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          <div
            *ngFor="let plan of availablePlans()"
            class="bg-white dark:bg-gray-900 rounded-xl border overflow-hidden hover:shadow-xl transition-all"
            [class.border-gray-200]="plan.hasActiveSubscription"
            [class.dark:border-gray-700]="plan.hasActiveSubscription"
            [class.border-orange-300]="!plan.hasActiveSubscription && plan.subscriptionStatus === 'available'"
            [class.dark:border-orange-700]="!plan.hasActiveSubscription && plan.subscriptionStatus === 'available'"
            [class.shadow-md]="!plan.hasActiveSubscription && plan.subscriptionStatus === 'available'"
          >
            <!-- Plan Header -->
            <div class="p-5 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-br from-gray-50 to-white dark:from-gray-800 dark:to-gray-900">
              <div class="flex items-start justify-between mb-2">
                <div class="flex-1">
                  <h3 class="text-lg font-bold text-gray-900 dark:text-white">{{ plan.name }}</h3>
                  <p *ngIf="plan.description" class="text-xs text-gray-600 dark:text-gray-400 mt-1">{{ plan.description }}</p>

                  <!-- Product Type Badge -->
                  <div class="mt-2">
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
                <span
                  *ngIf="!plan.current && plan.hasActiveSubscription"
                  class="px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300"
                >
                  Available Tier
                </span>
                <span
                  *ngIf="!plan.hasActiveSubscription && plan.subscriptionStatus === 'available'"
                  class="px-2 py-0.5 text-xs font-medium rounded-full bg-orange-100 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300 flex items-center gap-1"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                  Subscribe to Unlock
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
              <!-- Active Subscription - Current Plan -->
              <div *ngIf="plan.current" class="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 rounded">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                Current Plan
              </div>

              <!-- Active Subscription - Different Tier -->
              <button
                *ngIf="!plan.current && plan.hasActiveSubscription && canManageBilling()"
                (click)="selectPlan(plan)"
                class="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium rounded transition"
                [class]="plan.recommended
                  ? 'text-white bg-blue-600 hover:bg-blue-700'
                  : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30'"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path *ngIf="plan.price > getHighestSubscriptionPrice()" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                  <path *ngIf="plan.price <= getHighestSubscriptionPrice()" stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                </svg>
                {{ plan.price > getHighestSubscriptionPrice() ? 'Upgrade' : 'Switch' }}
              </button>

              <!-- No Active Subscription - Subscribe Now -->
              <button
                *ngIf="!plan.hasActiveSubscription && plan.subscriptionStatus === 'available' && canManageBilling()"
                (click)="selectPlan(plan)"
                class="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium rounded transition text-white bg-green-600 hover:bg-green-700"
              >
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                </svg>
                Subscribe Now
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Need Help Section -->
      <div class="rounded-xl border border-gray-200 bg-gradient-to-br from-blue-50 to-white p-6 dark:border-gray-700 dark:from-gray-900 dark:to-gray-800 shadow-sm">
        <div class="flex items-start gap-4">
          <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-md">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 12h.01M12 12h.01M16 12h.01M21 12c0 4.418-4.03 8-9 8a9.863 9.863 0 01-4.255-.949L3 20l1.395-3.72C3.512 15.042 3 13.574 3 12c0-4.418 4.03-8 9-8s9 3.582 9 8z" />
            </svg>
          </div>
          <div class="flex-1">
            <h4 class="text-base font-bold text-gray-900 dark:text-white">
              Need help choosing a plan?
            </h4>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Contact our sales team to discuss your requirements and find the perfect plan for your business.
            </p>
            <button class="mt-3 inline-flex items-center gap-2 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 bg-blue-100 dark:bg-blue-900/30 px-4 py-2 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition-all">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <span>Contact Sales</span>
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>
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
  private router = inject(Router);

  billingCycle = signal<'monthly' | 'yearly'>('monthly');
  loading = signal(false);
  currentSubscriptions = signal<SubscriptionPlan[]>([]); // Changed to array
  enabledProducts = signal<string[]>([]); // Track tenant's enabled products
  allPlans = signal<ApiSubscriptionPlan[]>([]);

  availablePlans = computed(() => {
    const cycle = this.billingCycle();
    const currentSubscriptionNames = this.currentSubscriptions().map(s => s.name);
    const activeProductTypes = this.currentSubscriptions().map(s => s.productType);
    const enabled = this.enabledProducts().filter(Boolean);
    const enabledSet = new Set(enabled);
    const shouldFilterByEnabled = enabledSet.size > 0;

    // Filter plans: show only plans for enabled products
    return this.allPlans()
      .filter(apiPlan => {
        const productType = apiPlan.productType || null;

        // Always show platform-wide or unspecified product plans
        if (!productType) {
          return true;
        }

        // If no enabled products returned from API, show everything by default
        if (!shouldFilterByEnabled) {
          return true;
        }

        return enabledSet.has(productType);
      })
      .map(apiPlan => {
  const isCurrentPlan = currentSubscriptionNames.includes(apiPlan.displayName) || currentSubscriptionNames.includes(apiPlan.name);
  const productType = apiPlan.productType ?? undefined;
  const hasActiveSubscription = productType ? activeProductTypes.includes(productType) : false;
        const productEnabled = !shouldFilterByEnabled
          ? true
          : !productType
            ? true
            : enabledSet.has(productType);

        // Determine subscription status
        let subscriptionStatus: 'available' | 'active' | 'pending' = 'available';
        if (hasActiveSubscription && isCurrentPlan) {
          subscriptionStatus = 'active';
        } else if (productEnabled && !hasActiveSubscription) {
          subscriptionStatus = 'available';
        }

        return {
          id: apiPlan.id, // Use the numeric ID from the database
          name: apiPlan.displayName || apiPlan.name,
          description: apiPlan.description,
          icon: apiPlan.icon || '📦',
          price: apiPlan.price,
          currency: 'PHP',
          billingCycle: cycle,
          features: apiPlan.features || [],
          productType,
          trialDays: 0,
          current: isCurrentPlan,
          hasActiveSubscription: hasActiveSubscription,
          subscriptionStatus: subscriptionStatus,
          recommended: apiPlan.isRecommended,
          isActive: apiPlan.isActive
        } as SubscriptionPlan;
      });
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

    // Load active subscriptions and all available plans
    forkJoin({
      activeSubscriptions: this.tenantService.getMyActiveSubscriptions(),
      plans: this.tenantService.getAllSubscriptionPlans()
    }).subscribe({
      next: ({ activeSubscriptions, plans }) => {
        console.log('📦 Active subscriptions response:', activeSubscriptions.data);
        console.log('📦 All available plans:', plans.data);

        // Set active subscriptions directly from API
        if (activeSubscriptions.success && activeSubscriptions.data) {
          // Handle both old format (array) and new format (object with subscriptions + enabledProducts)
          let subscriptions: any[];
          let enabledProducts: string[];

          if (Array.isArray(activeSubscriptions.data)) {
            // Old format: data is array of subscriptions
            subscriptions = activeSubscriptions.data;
            enabledProducts = [];
            console.log('⚠️ Using legacy array format for subscriptions');
          } else {
            // New format: data is { subscriptions, enabledProducts }
            subscriptions = activeSubscriptions.data.subscriptions || [];
            enabledProducts = activeSubscriptions.data.enabledProducts || [];
          }

          const transformedSubscriptions: SubscriptionPlan[] = subscriptions.map(apiPlan => ({
            id: apiPlan.name,
            name: apiPlan.displayName || apiPlan.name,
            description: apiPlan.description,
            icon: apiPlan.icon || '📦',
            price: apiPlan.price,
            currency: 'PHP',
            billingCycle: apiPlan.billingCycle as 'monthly' | 'yearly',
            features: Array.isArray(apiPlan.features) ? apiPlan.features : [],
            productType: apiPlan.productType,
            trialDays: 0,
            current: true,
            hasActiveSubscription: true, // These are active subscriptions
            subscriptionStatus: 'active' as const,
            recommended: apiPlan.isRecommended,
            isActive: apiPlan.isActive,
            startedAt: apiPlan.startedAt,
            expiresAt: apiPlan.expiresAt
          }));

          this.currentSubscriptions.set(transformedSubscriptions);
          this.enabledProducts.set(enabledProducts);
          console.log('✅ Loaded active subscriptions:', transformedSubscriptions.length);
          console.log('✅ Enabled products:', enabledProducts);
        }

        // Set all available plans
        this.allPlans.set(plans.data || []);
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

  getHighestSubscriptionPrice(): number {
    const subscriptions = this.currentSubscriptions();
    if (subscriptions.length === 0) return 0;
    return Math.max(...subscriptions.map(s => s.price));
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

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

  selectPlan(plan: SubscriptionPlan): void {
    console.log('📦 Selected plan:', plan.name);
    // Navigate to payment simulation page with plan details
    this.router.navigate(['/tenant/payment-simulation'], {
      state: {
        plan: plan,
        billingCycle: this.billingCycle()
      }
    });
  }

  managePlan(): void {
    // Navigate to billing settings or open manage dialog
    this.toastService.info('Plan management features coming soon!');
  }
}
