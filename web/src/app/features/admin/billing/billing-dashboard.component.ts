import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

@Component({
  selector: 'app-billing-dashboard',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4 space-y-4 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">Billing Management</h1>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Manage subscription plans, tenant subscriptions, and invoices</p>
        </div>
        <button
          (click)="goBack()"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      </div>

      <!-- Billing Sections Grid -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
        <!-- Subscription Plans -->
        <div
          (click)="navigateTo('plans')"
          class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 hover:shadow-lg transition-all cursor-pointer group"
        >
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-2">Subscription Plans</h3>
              <p class="text-xs text-gray-600 dark:text-gray-400 mb-3">Create and manage pricing plans with features and limits</p>
              <div class="flex items-center gap-2 text-xs text-blue-600 dark:text-blue-400 font-medium">
                <span>Manage Plans</span>
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Tenant Subscriptions -->
        <div
          (click)="navigateTo('subscriptions')"
          class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 hover:shadow-lg transition-all cursor-pointer group"
        >
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-2">Tenant Subscriptions</h3>
              <p class="text-xs text-gray-600 dark:text-gray-400 mb-3">View and manage tenant subscriptions and renewals</p>
              <div class="flex items-center gap-2 text-xs text-green-600 dark:text-green-400 font-medium">
                <span>View Subscriptions</span>
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>

        <!-- Invoices -->
        <div
          (click)="navigateTo('invoices')"
          class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 hover:shadow-lg transition-all cursor-pointer group"
        >
          <div class="flex items-start gap-4">
            <div class="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-2">Invoices</h3>
              <p class="text-xs text-gray-600 dark:text-gray-400 mb-3">Track billing invoices, payments, and revenue</p>
              <div class="flex items-center gap-2 text-xs text-purple-600 dark:text-purple-400 font-medium">
                <span>Manage Invoices</span>
                <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Info -->
      <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Billing Overview</h3>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <p class="text-xs text-gray-500 dark:text-gray-400">Active Plans</p>
            <p class="text-xl font-bold text-gray-900 dark:text-white mt-1">-</p>
          </div>
          <div class="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <p class="text-xs text-gray-500 dark:text-gray-400">Subscriptions</p>
            <p class="text-xl font-bold text-gray-900 dark:text-white mt-1">-</p>
          </div>
          <div class="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <p class="text-xs text-gray-500 dark:text-gray-400">Pending Invoices</p>
            <p class="text-xl font-bold text-gray-900 dark:text-white mt-1">-</p>
          </div>
          <div class="text-center p-3 rounded-lg bg-gray-50 dark:bg-gray-700/50">
            <p class="text-xs text-gray-500 dark:text-gray-400">Monthly Revenue</p>
            <p class="text-xl font-bold text-gray-900 dark:text-white mt-1">$-</p>
          </div>
        </div>
      </div>
    </div>
  `
})
export class BillingDashboardComponent {
  router = inject(Router);
  authService = inject(AuthService);

  navigateTo(section: string): void {
    this.router.navigate(['/admin/billing', section]);
  }

  goBack(): void {
    this.router.navigate(['/admin']);
  }
}
