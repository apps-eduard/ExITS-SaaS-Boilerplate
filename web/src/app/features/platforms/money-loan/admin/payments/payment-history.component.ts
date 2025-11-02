import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface Payment {
  id: number;
  loanNumber: string;
  customerName: string;
  amount: number;
  principalAmount: number;
  interestAmount: number;
  penaltyAmount: number;
  paymentMethod: string;
  paymentDate: string;
  status: string;
  paymentReference: string;
  notes?: string;
}

interface PaymentStats {
  totalPayments: number;
  totalAmount: number;
  completedPayments: number;
  pendingPayments: number;
}

@Component({
  selector: 'app-payment-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <!-- Compact Header -->
      <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">Payment History</h1>
            <p class="text-sm text-gray-500 dark:text-gray-400 mt-0.5">Track all loan payments</p>
          </div>
          <button 
            (click)="loadPayments()"
            class="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-sm font-medium transition-colors">
            🔄 Refresh
          </button>
        </div>

        <!-- Compact Stats -->
        <div class="grid grid-cols-4 gap-4 mt-4">
          <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3">
            <div class="text-xs text-blue-600 dark:text-blue-400 font-medium">Total Payments</div>
            <div class="text-2xl font-bold text-blue-700 dark:text-blue-300 mt-1">{{ stats().totalPayments }}</div>
          </div>
          <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-3">
            <div class="text-xs text-green-600 dark:text-green-400 font-medium">Total Amount</div>
            <div class="text-2xl font-bold text-green-700 dark:text-green-300 mt-1">₱{{ formatAmount(stats().totalAmount) }}</div>
          </div>
          <div class="bg-emerald-50 dark:bg-emerald-900/20 rounded-lg p-3">
            <div class="text-xs text-emerald-600 dark:text-emerald-400 font-medium">Completed</div>
            <div class="text-2xl font-bold text-emerald-700 dark:text-emerald-300 mt-1">{{ stats().completedPayments }}</div>
          </div>
          <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3">
            <div class="text-xs text-orange-600 dark:text-orange-400 font-medium">Pending</div>
            <div class="text-2xl font-bold text-orange-700 dark:text-orange-300 mt-1">{{ stats().pendingPayments }}</div>
          </div>
        </div>
      </div>

      <!-- Filters Bar -->
      <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-3">
        <div class="flex items-center gap-4">
          <!-- Search -->
          <div class="flex-1">
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (input)="applyFilters()"
              placeholder="🔍 Search by loan number, customer, reference..."
              class="w-full px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 text-sm focus:ring-2 focus:ring-blue-500 focus:border-transparent">
          </div>

          <!-- Status Filter -->
          <select
            [(ngModel)]="statusFilter"
            (change)="applyFilters()"
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500">
            <option value="all">All Status</option>
            <option value="completed">Completed</option>
            <option value="pending">Pending</option>
            <option value="failed">Failed</option>
          </select>

          <!-- Payment Method Filter -->
          <select
            [(ngModel)]="methodFilter"
            (change)="applyFilters()"
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500">
            <option value="all">All Methods</option>
            <option value="cash">Cash</option>
            <option value="bank_transfer">Bank Transfer</option>
            <option value="gcash">GCash</option>
            <option value="card">Card</option>
          </select>

          <!-- Date Range -->
          <input
            type="date"
            [(ngModel)]="dateFrom"
            (change)="applyFilters()"
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500">
          <input
            type="date"
            [(ngModel)]="dateTo"
            (change)="applyFilters()"
            class="px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-blue-500">
        </div>
      </div>

      <!-- Payments Table -->
      <div class="flex-1 overflow-auto">
        @if (loading()) {
          <div class="flex items-center justify-center h-64">
            <div class="text-center">
              <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-blue-500 border-t-transparent"></div>
              <p class="mt-4 text-gray-500 dark:text-gray-400">Loading payments...</p>
            </div>
          </div>
        } @else if (filteredPayments().length === 0) {
          <div class="flex items-center justify-center h-64">
            <div class="text-center">
              <div class="text-6xl mb-4">💸</div>
              <p class="text-lg font-medium text-gray-900 dark:text-white">No payments found</p>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">Try adjusting your filters</p>
            </div>
          </div>
        } @else {
          <div class="p-6">
            <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
              <table class="w-full">
                <thead class="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Date</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Loan</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Customer</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Reference</th>
                    <th class="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Amount</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Method</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Status</th>
                    <th class="px-4 py-3 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                  @for (payment of filteredPayments(); track payment.id) {
                    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <!-- Date -->
                      <td class="px-4 py-3 text-sm">
                        <div class="text-gray-900 dark:text-white font-medium">{{ formatDate(payment.paymentDate) }}</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">{{ formatTime(payment.paymentDate) }}</div>
                      </td>

                      <!-- Loan -->
                      <td class="px-4 py-3 text-sm">
                        <div class="font-mono text-blue-600 dark:text-blue-400 font-medium">{{ payment.loanNumber }}</div>
                      </td>

                      <!-- Customer -->
                      <td class="px-4 py-3 text-sm">
                        <div class="text-gray-900 dark:text-white">{{ payment.customerName }}</div>
                      </td>

                      <!-- Reference -->
                      <td class="px-4 py-3 text-sm">
                        <div class="font-mono text-xs text-gray-600 dark:text-gray-400">{{ payment.paymentReference }}</div>
                      </td>

                      <!-- Amount -->
                      <td class="px-4 py-3 text-sm text-right">
                        <div class="font-bold text-gray-900 dark:text-white">₱{{ formatAmount(payment.amount) }}</div>
                        <div class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                          P: ₱{{ formatAmount(payment.principalAmount) }} | 
                          I: ₱{{ formatAmount(payment.interestAmount) }}
                          @if (payment.penaltyAmount > 0) {
                            <span class="text-orange-600"> | Pen: ₱{{ formatAmount(payment.penaltyAmount) }}</span>
                          }
                        </div>
                      </td>

                      <!-- Method -->
                      <td class="px-4 py-3 text-sm">
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                              [ngClass]="getMethodClass(payment.paymentMethod)">
                          {{ getMethodIcon(payment.paymentMethod) }} {{ formatMethod(payment.paymentMethod) }}
                        </span>
                      </td>

                      <!-- Status -->
                      <td class="px-4 py-3 text-sm">
                        <span class="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium"
                              [ngClass]="getStatusClass(payment.status)">
                          {{ getStatusIcon(payment.status) }} {{ payment.status }}
                        </span>
                      </td>

                      <!-- Actions -->
                      <td class="px-4 py-3 text-sm text-right">
                        <button
                          (click)="viewDetails(payment)"
                          class="text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 font-medium">
                          View
                        </button>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>

            <!-- Pagination -->
            <div class="flex items-center justify-between mt-4">
              <div class="text-sm text-gray-500 dark:text-gray-400">
                Showing {{ filteredPayments().length }} of {{ payments().length }} payments
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class PaymentHistoryComponent implements OnInit {
  private http = inject(HttpClient);
  
  loading = signal(false);
  payments = signal<Payment[]>([]);
  searchQuery = '';
  statusFilter = 'all';
  methodFilter = 'all';
  dateFrom = '';
  dateTo = '';

  stats = computed(() => {
    const all = this.payments();
    return {
      totalPayments: all.length,
      totalAmount: all.reduce((sum, p) => sum + p.amount, 0),
      completedPayments: all.filter(p => p.status === 'completed').length,
      pendingPayments: all.filter(p => p.status === 'pending').length,
    };
  });

  filteredPayments = computed(() => {
    let result = this.payments();

    // Search
    if (this.searchQuery) {
      const q = this.searchQuery.toLowerCase();
      result = result.filter(p =>
        p.loanNumber.toLowerCase().includes(q) ||
        p.customerName.toLowerCase().includes(q) ||
        p.paymentReference.toLowerCase().includes(q)
      );
    }

    // Status filter
    if (this.statusFilter !== 'all') {
      result = result.filter(p => p.status === this.statusFilter);
    }

    // Method filter
    if (this.methodFilter !== 'all') {
      result = result.filter(p => p.paymentMethod === this.methodFilter);
    }

    // Date range
    if (this.dateFrom) {
      result = result.filter(p => new Date(p.paymentDate) >= new Date(this.dateFrom));
    }
    if (this.dateTo) {
      result = result.filter(p => new Date(p.paymentDate) <= new Date(this.dateTo));
    }

    return result;
  });

  ngOnInit() {
    this.loadPayments();
  }

  loadPayments() {
    this.loading.set(true);
    this.http.get('/api/money-loan/payments').subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          const payments = response.data.map((p: any) => ({
            id: p.id,
            loanNumber: p.loanNumber || p.loan_number,
            customerName: `${p.customerFirstName || p.customer_first_name || ''} ${p.customerLastName || p.customer_last_name || ''}`.trim(),
            amount: parseFloat(p.amount || 0),
            principalAmount: parseFloat(p.principalAmount || p.principal_amount || 0),
            interestAmount: parseFloat(p.interestAmount || p.interest_amount || 0),
            penaltyAmount: parseFloat(p.penaltyAmount || p.penalty_amount || 0),
            paymentMethod: p.paymentMethod || p.payment_method || 'cash',
            paymentDate: p.paymentDate || p.payment_date || p.createdAt || p.created_at,
            status: p.status || 'completed',
            paymentReference: p.paymentReference || p.payment_reference || `PAY-${p.id}`,
            notes: p.notes
          }));
          this.payments.set(payments);
        }
        this.loading.set(false);
      },
      error: (err: any) => {
        console.error('Error loading payments:', err);
        this.loading.set(false);
      }
    });
  }

  applyFilters() {
    // Triggers computed signal recalculation
  }

  viewDetails(payment: Payment) {
    console.log('View payment details:', payment);
    // TODO: Open modal with payment details
  }

  formatAmount(amount: number): string {
    return amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  formatTime(date: string): string {
    return new Date(date).toLocaleTimeString('en-PH', { hour: '2-digit', minute: '2-digit' });
  }

  formatMethod(method: string): string {
    return method.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getMethodIcon(method: string): string {
    const icons: Record<string, string> = {
      cash: '💵',
      gcash: '📱',
      bank_transfer: '🏦',
      card: '💳',
    };
    return icons[method] || '💰';
  }

  getMethodClass(method: string): string {
    const classes: Record<string, string> = {
      cash: 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      gcash: 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400',
      bank_transfer: 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400',
      card: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
    };
    return classes[method] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400';
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      completed: '✅',
      pending: '⏳',
      failed: '❌',
    };
    return icons[status] || '⚪';
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      completed: 'bg-emerald-100 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-400',
      pending: 'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400',
      failed: 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
    };
    return classes[status] || 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-400';
  }
}
