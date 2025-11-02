import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoanService } from '../../shared/services/loan.service';
import { LoanPayment } from '../../shared/models/loan.models';

interface CollectionSummary {
  date: string;
  totalPayments: number;
  totalAmount: number;
  principalCollected: number;
  interestCollected: number;
  penaltyCollected: number;
  expectedAmount: number;
  collectionRate: number;
}

interface TodayPayment {
  id: number;
  paymentReference: string;
  customerName: string;
  loanNumber: string;
  amount: number;
  principalAmount: number;
  interestAmount: number;
  penaltyAmount: number;
  paymentMethod: string;
  paymentDate: string;
  status: 'pending' | 'completed' | 'failed';
  time: string;
}

@Component({
  selector: 'app-today-collections',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 space-y-3">
      <!-- Compact Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-2">
          <span class="text-lg">📅</span>
          <div>
            <h1 class="text-base font-bold text-gray-900 dark:text-white">Today's Collections</h1>
            <p class="text-xs text-gray-500 dark:text-gray-400">{{ currentDate() }}</p>
          </div>
        </div>
        <div class="flex items-center gap-2">
          <button
            (click)="refresh()"
            [disabled]="loading()"
            class="p-1.5 rounded hover:bg-gray-100 dark:hover:bg-gray-700 transition"
            title="Refresh"
          >
            <svg class="w-4 h-4 text-gray-600 dark:text-gray-400" [class.animate-spin]="loading()" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
          <button
            (click)="goBack()"
            class="px-2.5 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Back
          </button>
        </div>
      </div>

      @if (loading()) {
        <div class="text-center py-8">
          <div class="inline-block animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600"></div>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">Loading collections...</p>
        </div>
      }

      @if (!loading()) {
        <!-- Compact Summary Cards -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
          <!-- Total Collected -->
          <div class="p-3 rounded-lg border border-green-200 dark:border-green-800 bg-gradient-to-br from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20">
            <p class="text-xs text-gray-600 dark:text-gray-400 mb-0.5">Collected</p>
            <p class="text-xl font-bold text-green-600 dark:text-green-400">₱{{ formatNumber(summary().totalAmount) }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ summary().totalPayments }} payments</p>
          </div>

          <!-- Expected Amount -->
          <div class="p-3 rounded-lg border border-blue-200 dark:border-blue-800 bg-gradient-to-br from-blue-50 to-cyan-50 dark:from-blue-900/20 dark:to-cyan-900/20">
            <p class="text-xs text-gray-600 dark:text-gray-400 mb-0.5">Expected</p>
            <p class="text-xl font-bold text-blue-600 dark:text-blue-400">₱{{ formatNumber(summary().expectedAmount) }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Due today</p>
          </div>

          <!-- Collection Rate -->
          <div class="p-3 rounded-lg border border-purple-200 dark:border-purple-800 bg-gradient-to-br from-purple-50 to-fuchsia-50 dark:from-purple-900/20 dark:to-fuchsia-900/20">
            <p class="text-xs text-gray-600 dark:text-gray-400 mb-0.5">Collection Rate</p>
            <p class="text-xl font-bold text-purple-600 dark:text-purple-400">{{ summary().collectionRate }}%</p>
            <div class="mt-1 bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
              <div class="bg-purple-600 dark:bg-purple-400 h-full transition-all" [style.width.%]="summary().collectionRate"></div>
            </div>
          </div>

          <!-- Outstanding -->
          <div class="p-3 rounded-lg border border-orange-200 dark:border-orange-800 bg-gradient-to-br from-orange-50 to-amber-50 dark:from-orange-900/20 dark:to-amber-900/20">
            <p class="text-xs text-gray-600 dark:text-gray-400 mb-0.5">Outstanding</p>
            <p class="text-xl font-bold text-orange-600 dark:text-orange-400">₱{{ formatNumber(outstandingToday()) }}</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Uncollected</p>
          </div>
        </div>

        <!-- Breakdown Pills -->
        <div class="flex flex-wrap gap-2">
          <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-blue-100 dark:bg-blue-900/30 border border-blue-200 dark:border-blue-800">
            <span class="text-xs font-medium text-blue-700 dark:text-blue-300">Principal:</span>
            <span class="text-xs font-bold text-blue-900 dark:text-blue-100">₱{{ formatNumber(summary().principalCollected) }}</span>
          </div>
          <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-purple-100 dark:bg-purple-900/30 border border-purple-200 dark:border-purple-800">
            <span class="text-xs font-medium text-purple-700 dark:text-purple-300">Interest:</span>
            <span class="text-xs font-bold text-purple-900 dark:text-purple-100">₱{{ formatNumber(summary().interestCollected) }}</span>
          </div>
          <div class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-100 dark:bg-red-900/30 border border-red-200 dark:border-red-800">
            <span class="text-xs font-medium text-red-700 dark:text-red-300">Penalty:</span>
            <span class="text-xs font-bold text-red-900 dark:text-red-100">₱{{ formatNumber(summary().penaltyCollected) }}</span>
          </div>
        </div>

        <!-- Filter & Search Bar -->
        <div class="flex flex-col sm:flex-row gap-2">
          <div class="flex-1 relative">
            <svg class="absolute left-2.5 top-2 w-3.5 h-3.5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              [(ngModel)]="searchTerm"
              (input)="applyFilters()"
              placeholder="Search customer, loan number, reference..."
              class="w-full pl-8 pr-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <select
            [(ngModel)]="filterStatus"
            (change)="applyFilters()"
            class="px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>
          <select
            [(ngModel)]="filterMethod"
            (change)="applyFilters()"
            class="px-2.5 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
          >
            <option value="all">All Methods</option>
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="check">Check</option>
            <option value="online">Online</option>
          </select>
        </div>

        <!-- Compact Payments List -->
        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          <div class="px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <h3 class="text-xs font-semibold text-gray-900 dark:text-white">Payments ({{ filteredPayments().length }})</h3>
          </div>

          @if (filteredPayments().length === 0) {
            <div class="p-8 text-center">
              <svg class="mx-auto h-10 w-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <p class="mt-2 text-xs text-gray-500 dark:text-gray-400">No payments found for today</p>
            </div>
          } @else {
            <div class="divide-y divide-gray-200 dark:divide-gray-700 max-h-[500px] overflow-y-auto">
              @for (payment of filteredPayments(); track payment.id) {
                <div class="p-3 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <div class="flex items-start justify-between gap-3">
                    <!-- Left: Customer & Loan Info -->
                    <div class="flex-1 min-w-0">
                      <div class="flex items-center gap-2 mb-1">
                        <p class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ payment.customerName }}</p>
                        <span [class]="getStatusBadgeClass(payment.status)">
                          {{ payment.status | titlecase }}
                        </span>
                      </div>
                      <div class="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                        <span class="flex items-center gap-1">
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                          </svg>
                          {{ payment.loanNumber }}
                        </span>
                        <span class="flex items-center gap-1">
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          {{ payment.time }}
                        </span>
                        <span class="flex items-center gap-1">
                          {{ getPaymentMethodIcon(payment.paymentMethod) }}
                          {{ payment.paymentMethod | titlecase }}
                        </span>
                      </div>
                      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Ref: {{ payment.paymentReference }}</p>
                    </div>

                    <!-- Right: Amount & Breakdown -->
                    <div class="text-right">
                      <p class="text-base font-bold text-green-600 dark:text-green-400 mb-1">₱{{ formatNumber(payment.amount) }}</p>
                      <div class="space-y-0.5 text-xs">
                        @if (payment.principalAmount > 0) {
                          <p class="text-gray-600 dark:text-gray-400">
                            <span class="text-blue-600 dark:text-blue-400">P:</span> ₱{{ formatNumber(payment.principalAmount) }}
                          </p>
                        }
                        @if (payment.interestAmount > 0) {
                          <p class="text-gray-600 dark:text-gray-400">
                            <span class="text-purple-600 dark:text-purple-400">I:</span> ₱{{ formatNumber(payment.interestAmount) }}
                          </p>
                        }
                        @if (payment.penaltyAmount > 0) {
                          <p class="text-gray-600 dark:text-gray-400">
                            <span class="text-red-600 dark:text-red-400">Pen:</span> ₱{{ formatNumber(payment.penaltyAmount) }}
                          </p>
                        }
                      </div>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      }
    </div>
  `,
  styles: []
})
export class TodayCollectionsComponent implements OnInit {
  private router = inject(Router);
  private loanService = inject(LoanService);

  loading = signal(false);
  payments = signal<TodayPayment[]>([]);
  expectedAmount = 0;
  searchTerm = '';
  filterStatus = 'all';
  filterMethod = 'all';

  summary = computed((): CollectionSummary => {
    const allPayments = this.payments();
    const completedPayments = allPayments.filter(p => p.status === 'completed');

    const totalAmount = completedPayments.reduce((sum, p) => sum + p.amount, 0);
    const expectedAmount = this.expectedAmount;
    const collectionRate = expectedAmount > 0 ? Math.min(100, Math.round((totalAmount / expectedAmount) * 100)) : 0;

    return {
      date: new Date().toISOString().split('T')[0],
      totalPayments: completedPayments.length,
      totalAmount,
      principalCollected: completedPayments.reduce((sum, p) => sum + p.principalAmount, 0),
      interestCollected: completedPayments.reduce((sum, p) => sum + p.interestAmount, 0),
      penaltyCollected: completedPayments.reduce((sum, p) => sum + p.penaltyAmount, 0),
      expectedAmount,
      collectionRate
    };
  });

  outstandingToday = computed(() => {
    const expected = this.summary().expectedAmount;
    const collected = this.summary().totalAmount;
    return Math.max(0, expected - collected);
  });

  filteredPayments = computed(() => {
    let result = this.payments();

    // Filter by status
    if (this.filterStatus !== 'all') {
      result = result.filter(p => p.status === this.filterStatus);
    }

    // Filter by payment method
    if (this.filterMethod !== 'all') {
      result = result.filter(p => p.paymentMethod === this.filterMethod);
    }

    // Search filter
    if (this.searchTerm) {
      const term = this.searchTerm.toLowerCase();
      result = result.filter(p =>
        p.customerName.toLowerCase().includes(term) ||
        p.loanNumber.toLowerCase().includes(term) ||
        p.paymentReference.toLowerCase().includes(term)
      );
    }

    // Sort by time (newest first)
    return result.sort((a, b) => b.time.localeCompare(a.time));
  });

  currentDate = computed(() => {
    const options: Intl.DateTimeFormatOptions = {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    };
    return new Date().toLocaleDateString('en-US', options);
  });

  ngOnInit() {
    this.loadTodayCollections();
  }

  loadTodayCollections() {
    this.loading.set(true);

    this.loanService.getTodayCollections().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          // Backend returns { summary: {...}, payments: [...] }
          const { summary, payments } = response.data;
          
          // Update summary with backend data
          if (summary) {
            this.expectedAmount = summary.expectedAmount || 0;
          }
          
          // Map payments data
          if (Array.isArray(payments)) {
            this.payments.set(payments.map(p => ({
              id: p.id,
              paymentReference: p.paymentReference,
              customerName: p.customerName,
              loanNumber: p.loanNumber,
              amount: p.amount,
              principalAmount: p.principalAmount,
              interestAmount: p.interestAmount,
              penaltyAmount: p.penaltyAmount,
              paymentMethod: p.paymentMethod,
              paymentDate: p.paymentDate,
              status: p.status,
              time: this.extractTime(p.createdAt || p.paymentDate)
            })));
          }
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading today collections:', error);
        // Load mock data for development
        this.loadMockData();
        this.loading.set(false);
      }
    });
  }

  loadMockData() {
    // Mock data for development/testing
    const mockPayments: TodayPayment[] = [
      {
        id: 1,
        paymentReference: 'PAY-2025-001',
        customerName: 'Juan Dela Cruz',
        loanNumber: 'ML-2025-001',
        amount: 8884.88,
        principalAmount: 7884.88,
        interestAmount: 1000,
        penaltyAmount: 0,
        paymentMethod: 'cash',
        paymentDate: new Date().toISOString(),
        status: 'completed',
        time: '09:30 AM'
      },
      {
        id: 2,
        paymentReference: 'PAY-2025-002',
        customerName: 'Maria Santos',
        loanNumber: 'ML-2025-002',
        amount: 5500,
        principalAmount: 4800,
        interestAmount: 650,
        penaltyAmount: 50,
        paymentMethod: 'bank_transfer',
        paymentDate: new Date().toISOString(),
        status: 'completed',
        time: '10:15 AM'
      },
      {
        id: 3,
        paymentReference: 'PAY-2025-003',
        customerName: 'Pedro Reyes',
        loanNumber: 'ML-2025-003',
        amount: 12000,
        principalAmount: 10500,
        interestAmount: 1500,
        penaltyAmount: 0,
        paymentMethod: 'online',
        paymentDate: new Date().toISOString(),
        status: 'completed',
        time: '11:45 AM'
      },
      {
        id: 4,
        paymentReference: 'PAY-2025-004',
        customerName: 'Ana Garcia',
        loanNumber: 'ML-2025-004',
        amount: 3200,
        principalAmount: 2800,
        interestAmount: 400,
        penaltyAmount: 0,
        paymentMethod: 'cash',
        paymentDate: new Date().toISOString(),
        status: 'pending',
        time: '01:20 PM'
      },
      {
        id: 5,
        paymentReference: 'PAY-2025-005',
        customerName: 'Roberto Tan',
        loanNumber: 'ML-2025-005',
        amount: 15000,
        principalAmount: 13200,
        interestAmount: 1650,
        penaltyAmount: 150,
        paymentMethod: 'check',
        paymentDate: new Date().toISOString(),
        status: 'completed',
        time: '02:00 PM'
      }
    ];

    this.payments.set(mockPayments);
    // Set expected amount for mock data (higher than collected to show collection rate)
    this.expectedAmount = 50000;
  }

  extractTime(dateString: string): string {
    try {
      const date = new Date(dateString);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    } catch {
      return new Date().toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    }
  }

  applyFilters() {
    // Triggers computed signal re-evaluation
    this.filteredPayments();
  }

  refresh() {
    this.loadTodayCollections();
  }

  getStatusBadgeClass(status: string): string {
    const baseClasses = 'inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium';
    const colorMap: Record<string, string> = {
      completed: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      pending: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
      failed: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300'
    };
    return `${baseClasses} ${colorMap[status] || colorMap['pending']}`;
  }

  getPaymentMethodIcon(method: string): string {
    const iconMap: Record<string, string> = {
      cash: '💵',
      bank_transfer: '🏦',
      check: '📝',
      online: '💳',
      mobile_money: '📱'
    };
    return iconMap[method] || '💰';
  }

  formatNumber(value: number): string {
    return value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  goBack() {
    this.router.navigate(['/platforms/money-loan/dashboard']);
  }
}
