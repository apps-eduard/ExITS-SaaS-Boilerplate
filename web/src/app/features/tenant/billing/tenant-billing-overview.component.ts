import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, Router } from '@angular/router';
import { HttpClientModule } from '@angular/common/http';
import { RBACService } from '../../../core/services/rbac.service';
import { ToastService } from '../../../core/services/toast.service';
import { BillingService, BillingOverview as ApiBillingOverview, BillingInfo as ApiBillingInfo } from '../../../core/services/billing.service';
import { InvoiceService } from '../../../core/services/invoice.service';
import { forkJoin } from 'rxjs';

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank' | 'gcash' | 'bank_transfer';
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  bankName?: string;
  accountName?: string;
  phoneNumber?: string; // For GCash
  isDefault: boolean;
}

interface BillingOverview {
  currentBalance: number;
  nextBillingDate: string | null;
  nextBillingAmount: number;
  lastPaymentDate: string | null;
  lastPaymentAmount: number;
  paymentMethod: PaymentMethod | null;
  subscriptionStatus?: string;
  autoRenewal?: boolean;
  planName?: string | null;
  billingCycle?: string;
}

@Component({
  selector: 'app-tenant-billing-overview',
  standalone: true,
  imports: [CommonModule, RouterLink, HttpClientModule],
  template: `
    <div class="p-6 space-y-6 bg-gray-50 dark:bg-gray-950 min-h-screen">
      <!-- Loading State -->
      <div *ngIf="isLoading()" class="flex items-center justify-center py-12">
        <div class="text-center">
          <div class="inline-block h-8 w-8 animate-spin rounded-full border-3 border-solid border-blue-600 border-r-transparent"></div>
          <p class="mt-3 text-sm text-gray-600 dark:text-gray-400">Loading billing information...</p>
        </div>
      </div>

      <!-- Content -->
      <div *ngIf="!isLoading()" class="max-w-7xl mx-auto space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span class="text-3xl">💰</span>
            <span>Billing Overview</span>
          </h1>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            Manage your subscriptions, billing information, and payment methods
          </p>
        </div>
        <div class="flex gap-3">
          <a
            routerLink="/tenant/billing/invoices"
            class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-all shadow-sm hover:shadow"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>View Invoices</span>
          </a>
          <a
            routerLink="/tenant/subscriptions"
            class="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2.5 text-sm font-medium text-white hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            <span>Manage Plan</span>
          </a>
        </div>
      </div>

      <!-- Balance Card - Enhanced -->
      <div class="relative overflow-hidden rounded-2xl border border-blue-200 bg-gradient-to-br from-blue-50 via-indigo-50 to-white p-6 dark:border-blue-900/50 dark:from-blue-950 dark:via-indigo-950 dark:to-gray-900 shadow-lg">
        <div class="absolute top-0 right-0 w-64 h-64 bg-blue-400/10 rounded-full blur-3xl"></div>
        <div class="relative flex items-start justify-between">
          <div>
            <div class="flex items-center gap-3 mb-3">
              <div class="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 shadow-lg">
                <span class="text-2xl">💵</span>
              </div>
              <div>
                <p class="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Current Balance</p>
                <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
                  {{ formatCurrency(overview().currentBalance) }}
                </h2>
              </div>
            </div>
            <div class="flex items-center gap-2 mt-4">
              <span *ngIf="overview().currentBalance === 0" class="inline-flex items-center gap-1.5 text-sm font-medium text-green-700 dark:text-green-400 bg-green-100 dark:bg-green-900/30 px-3 py-1.5 rounded-full">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                All payments up to date
              </span>
              <span *ngIf="overview().currentBalance < 0" class="inline-flex items-center gap-1.5 text-sm font-medium text-red-700 dark:text-red-400 bg-red-100 dark:bg-red-900/30 px-3 py-1.5 rounded-full">
                <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd" />
                </svg>
                Outstanding balance - please make a payment
              </span>
            </div>
          </div>
          <button
            *ngIf="overview().currentBalance < 0 && canManageBilling()"
            (click)="makePayment()"
            class="rounded-lg bg-gradient-to-r from-green-600 to-emerald-600 px-4 py-2.5 text-sm font-medium text-white hover:from-green-700 hover:to-emerald-700 transition-all shadow-md hover:shadow-lg"
          >
            Pay Now
          </button>
        </div>
      </div>

      <!-- Quick Stats - Enhanced -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Next Billing -->
        <div class="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900 shadow-sm hover:shadow-md transition-all">
          <div class="flex items-start justify-between mb-4">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-pink-500 shadow-md">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
            </div>
            <span *ngIf="hasActiveSubscription()" class="inline-flex items-center rounded-full bg-purple-100 px-2.5 py-0.5 text-xs font-semibold text-purple-700 dark:bg-purple-900/30 dark:text-purple-400">
              Upcoming
            </span>
            <span *ngIf="!hasActiveSubscription()" class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-400">
              No Subscription
            </span>
          </div>
          <div>
            <p class="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">Next Billing Date</p>
            <p *ngIf="hasActiveSubscription()" class="text-xl font-bold text-gray-900 dark:text-white mb-3">
              {{ formatDate(overview().nextBillingDate) }}
            </p>
            <p *ngIf="!hasActiveSubscription()" class="text-xl font-bold text-gray-500 dark:text-gray-400 mb-3">
              N/A
            </p>
            <div class="pt-3 border-t border-gray-100 dark:border-gray-800">
              <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Amount Due</p>
              <p *ngIf="hasActiveSubscription()" class="text-lg font-bold text-gray-900 dark:text-white">
                {{ formatCurrency(overview().nextBillingAmount) }}
              </p>
              <p *ngIf="!hasActiveSubscription()" class="text-sm text-gray-500 dark:text-gray-400 italic">
                No active subscription
              </p>
            </div>
          </div>
        </div>

        <!-- Last Payment -->
        <div class="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900 shadow-sm hover:shadow-md transition-all">
          <div class="flex items-start justify-between mb-4">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-emerald-500 shadow-md">
              <svg class="w-5 h-5 text-white" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
              </svg>
            </div>
            <span *ngIf="hasPaymentHistory()" class="inline-flex items-center rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-semibold text-green-700 dark:bg-green-900/30 dark:text-green-400">
              Completed
            </span>
            <span *ngIf="!hasPaymentHistory()" class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-400">
              No History
            </span>
          </div>
          <div>
            <p class="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">Last Payment</p>
            <p *ngIf="hasPaymentHistory()" class="text-xl font-bold text-gray-900 dark:text-white mb-3">
              {{ formatDate(overview().lastPaymentDate) }}
            </p>
            <p *ngIf="!hasPaymentHistory()" class="text-xl font-bold text-gray-500 dark:text-gray-400 mb-3">
              N/A
            </p>
            <div class="pt-3 border-t border-gray-100 dark:border-gray-800">
              <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Amount Paid</p>
              <p *ngIf="hasPaymentHistory()" class="text-lg font-bold text-green-600 dark:text-green-400">
                {{ formatCurrency(overview().lastPaymentAmount) }}
              </p>
              <p *ngIf="!hasPaymentHistory()" class="text-sm text-gray-500 dark:text-gray-400 italic">
                No payment history
              </p>
            </div>
          </div>
        </div>

        <!-- Auto-Renewal -->
        <div class="group relative overflow-hidden rounded-xl border border-gray-200 bg-white p-5 dark:border-gray-700 dark:bg-gray-900 shadow-sm hover:shadow-md transition-all">
          <div class="flex items-start justify-between mb-4">
            <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-500 shadow-md">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
            </div>
            <span *ngIf="autoRenewal()" class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
              Active
            </span>
            <span *ngIf="!autoRenewal()" class="inline-flex items-center rounded-full bg-gray-100 px-2.5 py-0.5 text-xs font-semibold text-gray-700 dark:bg-gray-700 dark:text-gray-400">
              Inactive
            </span>
          </div>
          <div>
            <p class="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide mb-1">Auto-Renewal</p>
            <p class="text-xl font-bold text-gray-900 dark:text-white mb-3">
              {{ autoRenewal() ? 'Enabled' : 'Disabled' }}
            </p>
            <div class="pt-3 border-t border-gray-100 dark:border-gray-800">
              <a
                routerLink="/tenant/billing/renewal"
                class="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
              >
                <span>Configure Settings</span>
                <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Payment Method - Enhanced -->
      <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900 shadow-sm">
        <div class="flex items-center justify-between mb-5">
          <div class="flex items-center gap-2.5">
            <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-indigo-500 to-purple-500 shadow-sm">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">Payment Method</h3>
          </div>
          <button
            *ngIf="canManageBilling()"
            (click)="updatePaymentMethod()"
            class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 hover:border-gray-400 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-all shadow-sm"
          >
            {{ overview().paymentMethod ? 'Update' : 'Add' }} Payment Method
          </button>
        </div>

        <div *ngIf="overview().paymentMethod; else noPaymentMethod" class="flex items-center gap-4 p-4 rounded-lg border border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-800/50">
          <div class="flex h-14 w-20 items-center justify-center rounded-lg border-2 border-dashed border-gray-300 bg-white dark:border-gray-700 dark:bg-gray-900">
            <svg *ngIf="overview().paymentMethod!.type === 'card'" class="w-8 h-8 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
            </svg>
            <svg *ngIf="overview().paymentMethod!.type === 'bank' || overview().paymentMethod!.type === 'bank_transfer'" class="w-8 h-8 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 14v3m4-3v3m4-3v3M3 21h18M3 10h18M3 7l9-4 9 4M4 10h16v11H4V10z" />
            </svg>
            <svg *ngIf="overview().paymentMethod!.type === 'gcash'" class="w-8 h-8 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-2 mb-1">
              <p class="text-sm font-semibold text-gray-900 dark:text-white">
                {{ getPaymentMethodLabel(overview().paymentMethod!) }}
              </p>
              <span *ngIf="overview().paymentMethod!.isDefault" class="inline-flex items-center rounded-full bg-blue-100 px-2.5 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                <svg class="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                </svg>
                Default
              </span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400">
              {{ getPaymentMethodDetails(overview().paymentMethod!) }}
            </p>
          </div>
        </div>

        <ng-template #noPaymentMethod>
          <div class="text-center py-8 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-lg">
            <div class="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gradient-to-br from-gray-100 to-gray-200 dark:from-gray-800 dark:to-gray-700 mb-4">
              <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
            </div>
            <p class="text-sm font-medium text-gray-900 dark:text-white mb-1">No payment method on file</p>
            <p class="text-xs text-gray-600 dark:text-gray-400 mb-4">
              Add a payment method to enable automatic billing
            </p>
            <button
              *ngIf="canManageBilling()"
              (click)="updatePaymentMethod()"
              class="inline-flex items-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-2 text-sm font-medium text-white hover:from-blue-700 hover:to-blue-800 transition-all shadow-md hover:shadow-lg"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              Add Payment Method
            </button>
          </div>
        </ng-template>
      </div>

      <!-- Payment History - Enhanced -->
      <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900 shadow-sm">
        <div class="flex items-center justify-between mb-5">
          <div class="flex items-center gap-2.5">
            <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-amber-500 to-orange-500 shadow-sm">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">Recent Transactions</h3>
          </div>
          <a
            routerLink="/tenant/billing/invoices"
            class="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            <span>View All</span>
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        <div class="space-y-1">
          <div *ngFor="let transaction of recentTransactions(); let last = last"
               class="flex items-center justify-between py-3 px-4 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
               [class.border-b]="!last"
               [class.border-gray-100]="!last"
               [class.dark:border-gray-800]="!last">
            <div class="flex items-center gap-4">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg shadow-sm" [class]="getStatusBgClass(transaction.status)">
                <span class="text-base">{{ getStatusIcon(transaction.status) }}</span>
              </div>
              <div>
                <p class="text-sm font-medium text-gray-900 dark:text-white">{{ transaction.description }}</p>
                <div class="flex items-center gap-2 mt-0.5">
                  <svg class="w-3 h-3 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ formatDate(transaction.date) }}</p>
                </div>
              </div>
            </div>
            <div class="text-right">
              <p class="text-sm font-bold mb-1" [class]="getAmountClass(transaction.amount)">
                {{ formatCurrency(transaction.amount) }}
              </p>
              <span class="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium" [class]="getStatusBadgeClass(transaction.status)">
                {{ transaction.status }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Billing Information - Enhanced -->
      <div class="rounded-xl border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900 shadow-sm">
        <div class="flex items-center justify-between mb-5">
          <div class="flex items-center gap-2.5">
            <div class="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br from-teal-500 to-cyan-500 shadow-sm">
              <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">Billing Information</h3>
          </div>
          <button
            *ngIf="canManageBilling()"
            (click)="updateBillingInfo()"
            class="inline-flex items-center gap-1.5 text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div class="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div class="flex items-center gap-2 mb-2">
              <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
              <p class="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Company Name</p>
            </div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ billingInfo().companyName || 'Not provided' }}</p>
          </div>
          <div class="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div class="flex items-center gap-2 mb-2">
              <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
              </svg>
              <p class="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Tax ID</p>
            </div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ billingInfo().taxId || 'Not provided' }}</p>
          </div>
          <div class="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div class="flex items-center gap-2 mb-2">
              <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              <p class="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Billing Email</p>
            </div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ billingInfo().email || 'Not provided' }}</p>
          </div>
          <div class="p-4 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div class="flex items-center gap-2 mb-2">
              <svg class="w-4 h-4 text-gray-500 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              <p class="text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wide">Billing Address</p>
            </div>
            <p class="text-sm font-medium text-gray-900 dark:text-white">{{ billingInfo().address || 'Not provided' }}</p>
          </div>
        </div>
      </div>
      </div>
    </div>
  `,
  styles: []
})
export class TenantBillingOverviewComponent implements OnInit {
  private rbacService = inject(RBACService);
  private toastService = inject(ToastService);
  private billingService = inject(BillingService);
  private invoiceService = inject(InvoiceService);
  private router = inject(Router);

  isLoading = signal(false);
  autoRenewal = signal(false);

  overview = signal<BillingOverview>({
    currentBalance: 0,
    nextBillingDate: '',
    nextBillingAmount: 0,
    lastPaymentDate: '',
    lastPaymentAmount: 0,
    paymentMethod: null
  });

  recentTransactions = signal<any[]>([]);

  billingInfo = signal({
    companyName: '',
    taxId: '' as string | null,
    email: '',
    address: ''
  });

  canManageBilling = computed(() =>
    this.rbacService.can('tenant-billing:update')
  );

  ngOnInit(): void {
    console.log('💰 TenantBillingOverviewComponent initialized');
    this.loadBillingData();
  }

  loadBillingData(): void {
    this.isLoading.set(true);

    forkJoin({
      overview: this.billingService.getBillingOverview(),
      billingInfo: this.billingService.getBillingInfo(),
      transactions: this.invoiceService.getInvoices({ limit: 5 })
    }).subscribe({
      next: (response) => {
        console.log('📊 Billing overview response:', response.overview);
        
        // Set overview data
        this.overview.set({
          currentBalance: response.overview.currentBalance,
          nextBillingDate: response.overview.nextBillingDate,
          nextBillingAmount: response.overview.nextBillingAmount,
          lastPaymentDate: response.overview.lastPaymentDate,
          lastPaymentAmount: response.overview.lastPaymentAmount,
          paymentMethod: response.overview.paymentMethod,
          subscriptionStatus: response.overview.subscriptionStatus,
          autoRenewal: response.overview.autoRenewal,
          planName: response.overview.planName,
          billingCycle: response.overview.billingCycle
        });

        this.autoRenewal.set(response.overview.autoRenewal || false);

        // Set billing info
        this.billingInfo.set(response.billingInfo);

        // Set recent transactions
        this.recentTransactions.set(response.transactions.invoices.map((inv: any) => ({
          id: inv.id,
          description: inv.description,
          date: inv.date,
          amount: inv.amount,
          status: inv.status.charAt(0).toUpperCase() + inv.status.slice(1)
        })));

        this.isLoading.set(false);
        console.log('✅ Billing data loaded successfully');
      },
      error: (error) => {
        console.error('❌ Error loading billing data:', error);
        this.toastService.error('Failed to load billing data');
        this.isLoading.set(false);
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

  formatDate(dateStr: string | null | undefined): string {
    if (!dateStr) {
      return 'N/A';
    }
    const date = new Date(dateStr);
    if (isNaN(date.getTime())) {
      return 'N/A';
    }
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  hasActiveSubscription(): boolean {
    const status = this.overview().subscriptionStatus;
    // Check if subscription status indicates an active subscription
    return status === 'active' || status === 'trial' || status === 'pending';
  }

  hasPaymentHistory(): boolean {
    return !!this.overview().lastPaymentDate && this.overview().lastPaymentAmount > 0;
  }

  getPaymentMethodLabel(method: PaymentMethod): string {
    switch (method.type) {
      case 'card':
        return `${method.brand} •••• ${method.last4}`;
      case 'bank':
        return `${method.bankName} •••• ${method.last4}`;
      case 'bank_transfer':
        return `${method.bankName || 'Bank Transfer'} - ${method.accountName || 'Account'}`;
      case 'gcash':
        return `GCash - ${method.phoneNumber || '••••'}`;
      default:
        return `Payment Method •••• ${method.last4}`;
    }
  }

  getPaymentMethodDetails(method: PaymentMethod): string {
    switch (method.type) {
      case 'card':
        return `Expires ${method.expiryMonth}/${method.expiryYear}`;
      case 'bank':
        return 'Bank Account';
      case 'bank_transfer':
        return method.accountName ? `Account: ${method.accountName}` : 'Bank Transfer Account';
      case 'gcash':
        return method.phoneNumber ? `Mobile: ${method.phoneNumber}` : 'GCash Account';
      default:
        return 'Payment Method';
    }
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      'Completed': '✅',
      'Pending': '⏳',
      'Failed': '❌',
      'Refunded': '↩️'
    };
    return icons[status] || '📄';
  }

  getStatusBgClass(status: string): string {
    const classes: Record<string, string> = {
      'Completed': 'bg-green-100 dark:bg-green-900/30',
      'Pending': 'bg-yellow-100 dark:bg-yellow-900/30',
      'Failed': 'bg-red-100 dark:bg-red-900/30',
      'Refunded': 'bg-blue-100 dark:bg-blue-900/30'
    };
    return classes[status] || 'bg-gray-100 dark:bg-gray-800';
  }

  getStatusBadgeClass(status: string): string {
    const classes: Record<string, string> = {
      'Completed': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'Pending': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      'Failed': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      'Refunded': 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400'
    };
    return classes[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400';
  }

  getAmountClass(amount: number): string {
    return amount >= 0 ? 'text-gray-900 dark:text-white' : 'text-red-600 dark:text-red-400';
  }

  makePayment(): void {
    this.toastService.info('Payment processing will be available soon!');
  }

  updatePaymentMethod(): void {
    // Navigate to Renewal Settings page where payment method selection is available
    this.router.navigate(['/tenant/billing/renewal']);
  }

  updateBillingInfo(): void {
    // TODO: Open a modal/dialog to edit billing information
    // For now, just show a message
    this.toastService.info('Billing information editor will be available soon!');

    // Example of how to update:
    // const updatedInfo = {
    //   companyName: 'New Company Name',
    //   taxId: '123-456-789',
    //   email: 'billing@company.com',
    //   address: 'New Address'
    // };
    // this.billingService.updateBillingInfo(updatedInfo).subscribe({
    //   next: () => {
    //     this.toastService.success('Billing information updated successfully');
    //     this.loadBillingData();
    //   },
    //   error: (error) => {
    //     this.toastService.error('Failed to update billing information');
    //   }
    // });
  }

  toggleAutoRenewal(): void {
    const newValue = !this.autoRenewal();

    this.billingService.updateAutoRenewal(newValue).subscribe({
      next: () => {
        this.autoRenewal.set(newValue);
        this.toastService.success(`Auto-renewal ${newValue ? 'enabled' : 'disabled'}`);
      },
      error: (error) => {
        console.error('❌ Error updating auto-renewal:', error);
        this.toastService.error('Failed to update auto-renewal setting');
      }
    });
  }
}
