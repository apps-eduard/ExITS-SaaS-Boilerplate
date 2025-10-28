import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface PaymentDue {
  id: number;
  loanId: number;
  borrowerName: string;
  loanReference: string;
  dueAmount: number;
  dueDate: string;
  principalAmount: number;
  interestAmount: number;
  feesAmount: number;
  status: 'due_today' | 'overdue' | 'upcoming';
  daysOverdue?: number;
}

@Component({
  selector: 'app-payments-due-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
      <!-- Header -->
      <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Payments Due Today</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ formatDate(currentDate) }}</p>
          </div>
          <div class="text-right">
            <p class="text-xs text-gray-500 dark:text-gray-400">Total Due</p>
            <p class="text-sm font-bold text-orange-600 dark:text-orange-400">₱{{ formatNumber(totalDueToday()) }}</p>
          </div>
        </div>
      </div>

      <!-- Content -->
      <div class="p-4">
        @if (paymentsDue().length > 0) {
          <!-- Summary Cards -->
          <div class="grid grid-cols-3 gap-2 mb-4">
            <div class="p-2 rounded bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-center">
              <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Due Today</p>
              <p class="text-lg font-bold text-orange-600 dark:text-orange-400">{{ dueToday() }}</p>
            </div>
            <div class="p-2 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-center">
              <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Overdue</p>
              <p class="text-lg font-bold text-red-600 dark:text-red-400">{{ overdue() }}</p>
            </div>
            <div class="p-2 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 text-center">
              <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Upcoming</p>
              <p class="text-lg font-bold text-blue-600 dark:text-blue-400">{{ upcoming() }}</p>
            </div>
          </div>

          <!-- Payments List -->
          <div class="space-y-2 max-h-80 overflow-y-auto">
            @for (payment of paymentsDue(); track payment.id) {
              <div [class]="getPaymentCardClass(payment.status)"
                   class="p-3 rounded border cursor-pointer hover:shadow-sm transition"
                   (click)="processPayment(payment.loanId)">
                <div class="flex items-start justify-between mb-2">
                  <div class="flex-1">
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ payment.borrowerName }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400 font-mono">{{ payment.loanReference }}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-sm font-bold" [class]="getAmountClass(payment.status)">₱{{ formatNumber(payment.dueAmount) }}</p>
                    @if (payment.status === 'overdue' && payment.daysOverdue) {
                      <span class="text-xs font-medium text-red-600 dark:text-red-400">{{ payment.daysOverdue }}d overdue</span>
                    }
                  </div>
                </div>

                <!-- Payment Breakdown -->
                <div class="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
                  <span>P: ₱{{ formatNumber(payment.principalAmount) }}</span>
                  <span>I: ₱{{ formatNumber(payment.interestAmount) }}</span>
                  @if (payment.feesAmount > 0) {
                    <span>F: ₱{{ formatNumber(payment.feesAmount) }}</span>
                  }
                </div>

                <!-- Status Badge -->
                <div class="flex items-center justify-between mt-2">
                  <span [class]="getStatusBadgeClass(payment.status)" class="px-2 py-0.5 rounded-full text-xs font-medium">
                    {{ getStatusLabel(payment.status) }}
                  </span>
                  <button class="text-xs text-blue-600 dark:text-blue-400 hover:underline"
                          (click)="processPayment(payment.loanId); $event.stopPropagation()">
                    Record Payment →
                  </button>
                </div>
              </div>
            }
          </div>

          <!-- Action Buttons -->
          <div class="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
            <button (click)="viewAllPayments()"
                    class="flex-1 px-3 py-1.5 text-xs font-medium rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              View All
            </button>
            <button (click)="sendReminders()"
                    class="flex-1 px-3 py-1.5 text-xs font-medium rounded bg-blue-600 text-white hover:bg-blue-700 transition">
              Send Reminders
            </button>
          </div>
        } @else if (loading()) {
          <!-- Loading State -->
          <div class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600"></div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">Loading payments...</p>
          </div>
        } @else {
          <!-- Empty State -->
          <div class="text-center py-8">
            <svg class="w-12 h-12 mx-auto text-green-500 dark:text-green-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p class="text-sm font-medium text-gray-900 dark:text-white">All caught up!</p>
            <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">No payments due today</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: []
})
export class PaymentsDueWidgetComponent implements OnInit {
  private router: Router;

  paymentsDue = signal<PaymentDue[]>([]);
  loading = signal(true);

  dueToday = signal(0);
  overdue = signal(0);
  upcoming = signal(0);
  totalDueToday = signal(0);
  currentDate = new Date();

  constructor(router: Router) {
    this.router = router;
  }

  ngOnInit() {
    this.loadPaymentsDue();
  }

  loadPaymentsDue() {
    // TODO: Replace with actual API call
    setTimeout(() => {
      const payments: PaymentDue[] = [
        {
          id: 1,
          loanId: 101,
          borrowerName: 'Juan Dela Cruz',
          loanReference: 'ML-2024-000101',
          dueAmount: 5250,
          dueDate: new Date().toISOString(),
          principalAmount: 4500,
          interestAmount: 650,
          feesAmount: 100,
          status: 'due_today'
        },
        {
          id: 2,
          loanId: 102,
          borrowerName: 'Maria Santos',
          loanReference: 'ML-2024-000102',
          dueAmount: 8300,
          dueDate: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
          principalAmount: 7000,
          interestAmount: 1100,
          feesAmount: 200,
          status: 'overdue',
          daysOverdue: 2
        },
        {
          id: 3,
          loanId: 103,
          borrowerName: 'Pedro Garcia',
          loanReference: 'ML-2024-000103',
          dueAmount: 3200,
          dueDate: new Date().toISOString(),
          principalAmount: 2800,
          interestAmount: 400,
          feesAmount: 0,
          status: 'due_today'
        },
        {
          id: 4,
          loanId: 104,
          borrowerName: 'Ana Reyes',
          loanReference: 'ML-2024-000104',
          dueAmount: 12500,
          dueDate: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
          principalAmount: 10000,
          interestAmount: 2000,
          feesAmount: 500,
          status: 'overdue',
          daysOverdue: 5
        },
        {
          id: 5,
          loanId: 105,
          borrowerName: 'Carlos Lopez',
          loanReference: 'ML-2024-000105',
          dueAmount: 6750,
          dueDate: new Date(Date.now() + 1 * 24 * 60 * 60 * 1000).toISOString(),
          principalAmount: 6000,
          interestAmount: 750,
          feesAmount: 0,
          status: 'upcoming'
        }
      ];

      this.paymentsDue.set(payments);
      this.dueToday.set(payments.filter(p => p.status === 'due_today').length);
      this.overdue.set(payments.filter(p => p.status === 'overdue').length);
      this.upcoming.set(payments.filter(p => p.status === 'upcoming').length);
      this.totalDueToday.set(
        payments
          .filter(p => p.status === 'due_today' || p.status === 'overdue')
          .reduce((sum, p) => sum + p.dueAmount, 0)
      );
      this.loading.set(false);
    }, 500);
  }

  processPayment(loanId: number) {
    this.router.navigate(['/platforms/money-loan/payments/process', loanId]);
  }

  viewAllPayments() {
    this.router.navigate(['/platforms/money-loan/payments']);
  }

  sendReminders() {
    // TODO: Implement send reminders functionality
    alert('Payment reminders sent successfully!');
  }

  getPaymentCardClass(status: string): string {
    const classes = {
      'due_today': 'border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10',
      'overdue': 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10',
      'upcoming': 'border-blue-200 dark:border-blue-800 bg-blue-50/50 dark:bg-blue-900/10'
    };
    return classes[status as keyof typeof classes] || 'border-gray-200 dark:border-gray-700';
  }

  getAmountClass(status: string): string {
    const classes = {
      'due_today': 'text-orange-600 dark:text-orange-400',
      'overdue': 'text-red-600 dark:text-red-400',
      'upcoming': 'text-blue-600 dark:text-blue-400'
    };
    return classes[status as keyof typeof classes] || 'text-gray-900 dark:text-white';
  }

  getStatusBadgeClass(status: string): string {
    const classes = {
      'due_today': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
      'overdue': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
      'upcoming': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300'
    };
    return classes[status as keyof typeof classes] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
  }

  getStatusLabel(status: string): string {
    const labels = {
      'due_today': 'Due Today',
      'overdue': 'Overdue',
      'upcoming': 'Upcoming'
    };
    return labels[status as keyof typeof labels] || status;
  }

  formatDate(date: Date): string {
    return date.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'short', day: 'numeric' });
  }

  formatNumber(value: number): string {
    return value.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
}
