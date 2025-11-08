import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ComponentPathService } from '../../../../core/services/component-path.service';

@Component({
  selector: 'app-money-loan-overview',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-3 md:p-4 space-y-3">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl md:text-2xl font-bold text-gray-900 dark:text-white">Money Loan Dashboard</h1>
          <p class="text-xs md:text-sm text-gray-600 dark:text-gray-400">Overview of loan operations and metrics</p>
        </div>
        <button (click)="refreshData()"
                class="flex items-center gap-2 px-3 py-2 text-sm bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-all hover:shadow-lg">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" [class.animate-spin]="loading()">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
          </svg>
          <span class="hidden md:inline">Refresh</span>
        </button>
      </div>

      <!-- Key Metrics Grid -->
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          <button (click)="navigateTo('/platforms/money-loan/dashboard/config/quick-product')"
                  class="flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-800/60 text-blue-700 dark:text-blue-300 rounded-lg transition-all border border-blue-200 dark:border-blue-700">
            <span>⚡</span>
            <span class="hidden sm:inline">Quick Create</span>
          </button>
        <!-- Total Loans -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all cursor-pointer"
             (click)="navigateTo('/platforms/money-loan/dashboard/loans/all')">
          <div class="flex items-center justify-between mb-2">
            <span class="text-2xl">💵</span>
            <span class="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">+12%</span>
          </div>
          <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Loans</p>
          <p class="text-lg md:text-xl font-bold text-gray-900 dark:text-white">{{ formatCurrency(totalLoans()) }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ loanCount() }} loans</p>
        </div>

        <!-- Collection Rate -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all cursor-pointer"
             (click)="navigateTo('/platforms/money-loan/dashboard/payments/today')">
          <div class="flex items-center justify-between mb-2">
            <span class="text-2xl">📈</span>
            <span class="text-xs px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 rounded">Good</span>
          </div>
          <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Collection Rate</p>
          <p class="text-lg md:text-xl font-bold text-green-600 dark:text-green-400">{{ collectionRate() }}%</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Last 30 days</p>
        </div>

        <!-- Overdue % -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all cursor-pointer"
             (click)="navigateTo('/platforms/money-loan/dashboard/loans/overdue')">
          <div class="flex items-center justify-between mb-2">
            <span class="text-2xl">⏳</span>
            <span class="text-xs px-2 py-1 bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400 rounded">Alert</span>
          </div>
          <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Overdue %</p>
          <p class="text-lg md:text-xl font-bold text-orange-600 dark:text-orange-400">{{ overduePercentage() }}%</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ overdueCount() }} loans</p>
        </div>

        <!-- Outstanding Amount -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all cursor-pointer">
          <div class="flex items-center justify-between mb-2">
            <span class="text-2xl">💰</span>
            <span class="text-xs px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 rounded">Total</span>
          </div>
          <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Outstanding</p>
          <p class="text-lg md:text-xl font-bold text-purple-600 dark:text-purple-400">{{ formatCurrency(outstandingAmount()) }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">To be collected</p>
        </div>

        <!-- Active Loans -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all cursor-pointer"
             (click)="navigateTo('/platforms/money-loan/dashboard/loans/active')">
          <div class="flex items-center justify-between mb-2">
            <span class="text-2xl">🔄</span>
            <span class="text-xs px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded">Active</span>
          </div>
          <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Active Loans</p>
          <p class="text-lg md:text-xl font-bold text-blue-600 dark:text-blue-400">{{ activeLoansCount() }}</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Currently paying</p>
        </div>

        <!-- Default Rate -->
        <div class="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 hover:shadow-lg transition-all cursor-pointer">
          <div class="flex items-center justify-between mb-2">
            <span class="text-2xl">🚫</span>
            <span class="text-xs px-2 py-1 bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 rounded">Risk</span>
          </div>
          <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Default Rate</p>
          <p class="text-lg md:text-xl font-bold text-red-600 dark:text-red-400">{{ defaultRate() }}%</p>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ defaultedCount() }} loans</p>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
        <h2 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Quick Actions</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-2">
          <button (click)="navigateTo('/platforms/money-loan/dashboard/config/quick-product')"
                  class="flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 rounded-lg transition-all border border-blue-200 dark:border-blue-800">
            <span>⚡</span>
            <span class="hidden sm:inline">Quick Create</span>
          </button>
          <button (click)="navigateTo('/platforms/money-loan/dashboard/customers/all')"
                  class="flex items-center gap-2 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-all border border-gray-200 dark:border-gray-600">
            <span>👥</span>
            <span class="hidden sm:inline">Customers</span>
          </button>
          <button (click)="navigateTo('/platforms/money-loan/dashboard/loans/pending')"
                  class="flex items-center gap-2 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-all border border-gray-200 dark:border-gray-600">
            <span>📝</span>
            <span class="hidden sm:inline">Approvals</span>
          </button>
          <button (click)="navigateTo('/platforms/money-loan/dashboard/loans/disbursement')"
                  class="flex items-center gap-2 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-all border border-gray-200 dark:border-gray-600">
            <span>💸</span>
            <span class="hidden sm:inline">Disburse</span>
          </button>
          <button (click)="navigateTo('/platforms/money-loan/dashboard/payments/today')"
                  class="flex items-center gap-2 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-all border border-gray-200 dark:border-gray-600">
            <span>💳</span>
            <span class="hidden sm:inline">Payments</span>
          </button>
          <button (click)="navigateTo('/platforms/money-loan/dashboard/kyc/pending')"
                  class="flex items-center gap-2 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-all border border-gray-200 dark:border-gray-600">
            <span>✅</span>
            <span class="hidden sm:inline">KYC</span>
          </button>
          <button (click)="navigateTo('/platforms/money-loan/dashboard/reports/periodic')"
                  class="flex items-center gap-2 px-3 py-2 text-sm bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg transition-all border border-gray-200 dark:border-gray-600">
            <span>📊</span>
            <span class="hidden sm:inline">Reports</span>
          </button>
        </div>
      </div>

      <!-- Recent Activity & Alerts Grid -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <!-- Pending Approvals -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span>📝</span>
              <span>Pending Approvals</span>
            </h2>
            <button (click)="navigateTo('/platforms/money-loan/dashboard/loans/pending')"
                    class="text-xs text-blue-600 dark:text-blue-400 hover:underline flex items-center gap-1">
              <span>View All</span>
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
          <div class="space-y-2">
            @for (loan of pendingLoans(); track loan.id) {
              <div class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-600 transition-all cursor-pointer">
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ loan.customerName }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">₱{{ formatCurrency(loan.amount) }} • {{ loan.term }} months</p>
                </div>
                <button class="ml-2 px-2 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded transition-all">
                  <span>Review</span>
                </button>
              </div>
            } @empty {
              <p class="text-xs text-gray-500 dark:text-gray-400 text-center py-4">No pending approvals</p>
            }
          </div>
        </div>

        <!-- Overdue Alerts -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span>⚠️</span>
              <span>Overdue Alerts</span>
            </h2>
            <button (click)="navigateTo('/platforms/money-loan/dashboard/loans/overdue')"
                    class="text-xs text-orange-600 dark:text-orange-400 hover:underline flex items-center gap-1">
              <span>View All</span>
              <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
              </svg>
            </button>
          </div>
          <div class="space-y-2">
            @for (loan of overdueLoans(); track loan.id) {
              <div class="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-900/20 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-all cursor-pointer border border-orange-200 dark:border-orange-800">
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ loan.customerName }}</p>
                  <p class="text-xs text-orange-600 dark:text-orange-400">{{ loan.daysOverdue }} days overdue • ₱{{ formatCurrency(loan.amount) }}</p>
                </div>
                <button class="ml-2 px-2 py-1 text-xs bg-orange-600 hover:bg-orange-700 text-white rounded transition-all">
                  <span>Follow Up</span>
                </button>
              </div>
            } @empty {
              <p class="text-xs text-gray-500 dark:text-gray-400 text-center py-4">No overdue loans</p>
            }
          </div>
        </div>
      </div>

      <!-- Charts & Analytics -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-3">
        <!-- Loan Distribution -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <span>📊</span>
            <span>Loan Status Distribution</span>
          </h2>
          <div class="space-y-2">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 bg-green-500 rounded"></div>
                <span class="text-xs text-gray-600 dark:text-gray-400">Active</span>
              </div>
              <span class="text-xs font-medium text-gray-900 dark:text-white">{{ activeLoansCount() }}</span>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 bg-orange-500 rounded"></div>
                <span class="text-xs text-gray-600 dark:text-gray-400">Overdue</span>
              </div>
              <span class="text-xs font-medium text-gray-900 dark:text-white">{{ overdueCount() }}</span>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 bg-yellow-500 rounded"></div>
                <span class="text-xs text-gray-600 dark:text-gray-400">Pending</span>
              </div>
              <span class="text-xs font-medium text-gray-900 dark:text-white">{{ pendingLoans().length }}</span>
            </div>
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <div class="w-3 h-3 bg-blue-500 rounded"></div>
                <span class="text-xs text-gray-600 dark:text-gray-400">Paid Off</span>
              </div>
              <span class="text-xs font-medium text-gray-900 dark:text-white">{{ paidOffCount() }}</span>
            </div>
          </div>
        </div>

        <!-- Recent Collections -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <span>💰</span>
            <span>Today's Collections</span>
          </h2>
          <div class="space-y-2">
            @for (payment of recentPayments(); track payment.id) {
              <div class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-700 rounded-lg">
                <div class="flex-1 min-w-0">
                  <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ payment.customerName }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ payment.time }}</p>
                </div>
                <span class="ml-2 text-sm font-semibold text-green-600 dark:text-green-400">₱{{ formatCurrency(payment.amount) }}</span>
              </div>
            } @empty {
              <p class="text-xs text-gray-500 dark:text-gray-400 text-center py-4">No payments today</p>
            }
          </div>
        </div>
      </div>
    </div>
  `
})
export class MoneyLoanOverviewComponent implements OnInit {
  loading = signal(false);
  
  // Metrics
  totalLoans = signal(2850000);
  loanCount = signal(156);
  collectionRate = signal(94.5);
  overduePercentage = signal(8.2);
  overdueCount = signal(12);
  outstandingAmount = signal(1245000);
  activeLoansCount = signal(89);
  defaultRate = signal(2.1);
  defaultedCount = signal(3);
  paidOffCount = signal(52);

  // Mock data
  pendingLoans = signal([
    { id: 1, customerName: 'Juan Dela Cruz', amount: 50000, term: 12 },
    { id: 2, customerName: 'Maria Santos', amount: 75000, term: 24 },
    { id: 3, customerName: 'Pedro Gonzales', amount: 30000, term: 6 }
  ]);

  overdueLoans = signal([
    { id: 1, customerName: 'Ana Garcia', amount: 25000, daysOverdue: 15 },
    { id: 2, customerName: 'Carlos Reyes', amount: 40000, daysOverdue: 7 }
  ]);

  recentPayments = signal([
    { id: 1, customerName: 'Lisa Torres', amount: 5500, time: '10:30 AM' },
    { id: 2, customerName: 'Mark Cruz', amount: 12000, time: '09:15 AM' },
    { id: 3, customerName: 'Sofia Mendoza', amount: 8000, time: '08:45 AM' }
  ]);

  private componentPathService = inject(ComponentPathService);
  private router = inject(Router);

  ngOnInit() {
    // Register component path for dev info
    this.componentPathService.setComponentPath({
      componentName: 'MoneyLoanOverviewComponent',
      moduleName: 'Money Loan - Dashboard',
      filePath: 'src/app/features/platforms/money-loan/dashboard/money-loan-overview.component.ts',
      routePath: this.router.url
    });

    this.loadDashboardData();
  }

  loadDashboardData() {
    this.loading.set(true);
    // TODO: Replace with actual API call
    setTimeout(() => {
      this.loading.set(false);
    }, 1000);
  }

  refreshData() {
    this.loadDashboardData();
  }

  navigateTo(route: string) {
    this.router.navigate([route]);
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
}
