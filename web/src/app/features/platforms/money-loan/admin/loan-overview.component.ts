import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { LoanService } from '../shared/services/loan.service';
import { LoanOverview } from '../shared/models/loan.models';

@Component({
  selector: 'app-loan-overview',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-6 space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>🏦</span>
            Money Loan Overview
          </h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Real-time loan portfolio statistics and metrics
          </p>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-4">Loading overview...</p>
      </div>

      <!-- Stats Grid -->
      <div *ngIf="!loading() && overview()" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <!-- Total Loans -->
        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <span class="text-2xl">💵</span>
            </div>
            <div class="min-w-0">
              <p class="text-xs text-gray-600 dark:text-gray-400">Total Loans</p>
              <p class="text-xl font-bold text-gray-900 dark:text-white">{{ overview()?.totalLoans || 0 }}</p>
            </div>
          </div>
        </div>

        <!-- Collection Rate -->
        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
              <span class="text-2xl">📈</span>
            </div>
            <div class="min-w-0">
              <p class="text-xs text-gray-600 dark:text-gray-400">Collection Rate</p>
              <p class="text-xl font-bold text-green-600 dark:text-green-400">{{ overview()?.collectionRate || 0 }}%</p>
            </div>
          </div>
        </div>

        <!-- Overdue % -->
        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center flex-shrink-0">
              <span class="text-2xl">⏳</span>
            </div>
            <div class="min-w-0">
              <p class="text-xs text-gray-600 dark:text-gray-400">Overdue %</p>
              <p class="text-xl font-bold text-yellow-600 dark:text-yellow-400">{{ overview()?.overduePercent || 0 }}%</p>
            </div>
          </div>
        </div>

        <!-- Outstanding Amount -->
        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
              <span class="text-2xl">💰</span>
            </div>
            <div class="min-w-0">
              <p class="text-xs text-gray-600 dark:text-gray-400">Outstanding</p>
              <p class="text-xl font-bold text-purple-600 dark:text-purple-400">₱{{ formatCurrency(overview()?.totalOutstanding || 0) }}</p>
            </div>
          </div>
        </div>

        <!-- Active Loans -->
        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-cyan-100 dark:bg-cyan-900/30 flex items-center justify-center flex-shrink-0">
              <span class="text-2xl">🔄</span>
            </div>
            <div class="min-w-0">
              <p class="text-xs text-gray-600 dark:text-gray-400">Active Loans</p>
              <p class="text-xl font-bold text-cyan-600 dark:text-cyan-400">{{ overview()?.activeLoans || 0 }}</p>
            </div>
          </div>
        </div>

        <!-- Default Rate -->
        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
              <span class="text-2xl">🚫</span>
            </div>
            <div class="min-w-0">
              <p class="text-xs text-gray-600 dark:text-gray-400">Default Rate</p>
              <p class="text-xl font-bold text-red-600 dark:text-red-400">{{ overview()?.defaultRate || 0 }}%</p>
            </div>
          </div>
        </div>

        <!-- Overdue Loans -->
        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center flex-shrink-0">
              <span class="text-2xl">🕔</span>
            </div>
            <div class="min-w-0">
              <p class="text-xs text-gray-600 dark:text-gray-400">Overdue Loans</p>
              <p class="text-xl font-bold text-orange-600 dark:text-orange-400">{{ overview()?.overdueLoans || 0 }}</p>
            </div>
          </div>
        </div>

        <!-- Total Collected -->
        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 rounded-lg bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center flex-shrink-0">
              <span class="text-2xl">💸</span>
            </div>
            <div class="min-w-0">
              <p class="text-xs text-gray-600 dark:text-gray-400">Total Collected</p>
              <p class="text-xl font-bold text-emerald-600 dark:text-emerald-400">₱{{ formatCurrency(overview()?.totalCollected || 0) }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <button
          routerLink="/platforms/money-loan/dashboard/config/quick-product"
          class="flex items-center gap-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/30 p-4 hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors"
        >
          <span class="text-2xl">⚡</span>
          <div class="text-left">
            <p class="text-sm font-semibold text-blue-700 dark:text-blue-300">Quick Create Product</p>
            <p class="text-xs text-blue-600 dark:text-blue-400">Launch the streamlined loan product setup</p>
          </div>
        </button>

        <button
          routerLink="/platforms/money-loan/dashboard/customers/all"
          class="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <span class="text-2xl">👥</span>
          <div class="text-left">
            <p class="text-sm font-semibold text-gray-900 dark:text-white">Manage Customers</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">View and manage borrowers</p>
          </div>
        </button>

        <button
          routerLink="/platforms/money-loan/dashboard/loans/all"
          class="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <span class="text-2xl">💳</span>
          <div class="text-left">
            <p class="text-sm font-semibold text-gray-900 dark:text-white">View All Loans</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Manage loan portfolio</p>
          </div>
        </button>

        <button
          routerLink="/platforms/money-loan/dashboard/payments/record"
          class="flex items-center gap-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
        >
          <span class="text-2xl">💸</span>
          <div class="text-left">
            <p class="text-sm font-semibold text-gray-900 dark:text-white">Record Payment</p>
            <p class="text-xs text-gray-500 dark:text-gray-400">Process loan payments</p>
          </div>
        </button>
      </div>
    </div>
  `,
  styles: []
})
export class LoanOverviewComponent implements OnInit {
  private loanService = inject(LoanService);

  overview = signal<LoanOverview | null>(null);
  loading = signal(false);

  ngOnInit(): void {
    this.loadOverview();
  }

  loadOverview(): void {
    this.loading.set(true);

    this.loanService.getLoanOverview().subscribe({
      next: (response) => {
        this.overview.set(response.data);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading overview:', err);
        this.loading.set(false);
      }
    });
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }
}
