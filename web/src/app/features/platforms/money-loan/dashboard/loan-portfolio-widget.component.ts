import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';

interface PortfolioStats {
  totalActiveLoans: number;
  totalLoanAmount: number;
  totalOutstanding: number;
  totalCollected: number;
  collectionRate: number;
  averageLoanSize: number;
  performingLoans: number;
  nonPerformingLoans: number;
}

interface LoanByStatus {
  status: string;
  count: number;
  amount: number;
  color: string;
}

@Component({
  selector: 'app-loan-portfolio-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
      <!-- Header -->
      <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Loan Portfolio Overview</h3>
          <button class="text-xs text-blue-600 dark:text-blue-400 hover:underline">View Details</button>
        </div>
      </div>

      <!-- Content -->
      <div class="p-4">
        @if (stats()) {
          <!-- Key Metrics Grid -->
          <div class="grid grid-cols-2 gap-3 mb-4">
            <div class="p-3 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
              <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Active Loans</p>
              <p class="text-xl font-bold text-blue-600 dark:text-blue-400">{{ stats()!.totalActiveLoans }}</p>
            </div>
            <div class="p-3 rounded bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
              <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Collection Rate</p>
              <p class="text-xl font-bold text-green-600 dark:text-green-400">{{ stats()!.collectionRate }}%</p>
            </div>
            <div class="p-3 rounded bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800">
              <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Portfolio</p>
              <p class="text-lg font-bold text-purple-600 dark:text-purple-400">₱{{ formatNumber(stats()!.totalLoanAmount) }}</p>
            </div>
            <div class="p-3 rounded bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800">
              <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Outstanding</p>
              <p class="text-lg font-bold text-yellow-600 dark:text-yellow-400">₱{{ formatNumber(stats()!.totalOutstanding) }}</p>
            </div>
          </div>

          <!-- Collection Progress Bar -->
          <div class="mb-4">
            <div class="flex items-center justify-between mb-1">
              <span class="text-xs text-gray-600 dark:text-gray-400">Collections</span>
              <span class="text-xs font-medium text-gray-900 dark:text-white">
                ₱{{ formatNumber(stats()!.totalCollected) }} / ₱{{ formatNumber(stats()!.totalLoanAmount) }}
              </span>
            </div>
            <div class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
              <div
                class="h-full bg-gradient-to-r from-green-500 to-green-600 transition-all duration-500"
                [style.width.%]="stats()!.collectionRate">
              </div>
            </div>
          </div>

          <!-- Loan Status Breakdown -->
          <div class="space-y-2">
            <p class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Loan Status Distribution</p>
            @for (status of loansByStatus(); track status.status) {
              <div class="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-700/50">
                <div class="flex items-center gap-2">
                  <div [class]="'w-2 h-2 rounded-full ' + status.color"></div>
                  <span class="text-xs text-gray-700 dark:text-gray-300">{{ status.status }}</span>
                </div>
                <div class="text-right">
                  <p class="text-xs font-semibold text-gray-900 dark:text-white">{{ status.count }} loans</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">₱{{ formatNumber(status.amount) }}</p>
                </div>
              </div>
            }
          </div>

          <!-- Performance Metrics -->
          <div class="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Avg Loan Size</p>
                <p class="text-sm font-semibold text-gray-900 dark:text-white">₱{{ formatNumber(stats()!.averageLoanSize) }}</p>
              </div>
              <div>
                <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">NPL Ratio</p>
                <p class="text-sm font-semibold" [class]="nplRatio() > 5 ? 'text-red-600 dark:text-red-400' : 'text-green-600 dark:text-green-400'">
                  {{ nplRatio() }}%
                </p>
              </div>
            </div>
          </div>
        } @else {
          <!-- Loading State -->
          <div class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600"></div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">Loading portfolio data...</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: []
})
export class LoanPortfolioWidgetComponent implements OnInit {
  stats = signal<PortfolioStats | null>(null);
  loansByStatus = signal<LoanByStatus[]>([]);

  nplRatio = computed(() => {
    const s = this.stats();
    if (!s || s.totalActiveLoans === 0) return 0;
    return Math.round((s.nonPerformingLoans / s.totalActiveLoans) * 100 * 10) / 10;
  });

  ngOnInit() {
    this.loadPortfolioStats();
  }

  loadPortfolioStats() {
    // TODO: Replace with actual API call
    setTimeout(() => {
      this.stats.set({
        totalActiveLoans: 234,
        totalLoanAmount: 15750000,
        totalOutstanding: 8920000,
        totalCollected: 6830000,
        collectionRate: 43.4,
        averageLoanSize: 67307,
        performingLoans: 219,
        nonPerformingLoans: 15
      });

      this.loansByStatus.set([
        { status: 'Current', count: 189, amount: 12500000, color: 'bg-green-500' },
        { status: 'Due Soon', count: 30, amount: 2100000, color: 'bg-yellow-500' },
        { status: 'Overdue', count: 15, amount: 1150000, color: 'bg-red-500' }
      ]);
    }, 500);
  }

  formatNumber(value: number): string {
    return value.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
}
