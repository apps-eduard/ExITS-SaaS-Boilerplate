import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { RBACService } from '../../../core/services/rbac.service';
import { ToastService } from '../../../core/services/toast.service';

interface PaymentMethod {
  id: string;
  type: 'card' | 'bank';
  last4: string;
  brand?: string;
  expiryMonth?: number;
  expiryYear?: number;
  bankName?: string;
  isDefault: boolean;
}

interface BillingOverview {
  currentBalance: number;
  nextBillingDate: string;
  nextBillingAmount: number;
  lastPaymentDate: string;
  lastPaymentAmount: number;
  paymentMethod: PaymentMethod | null;
}

@Component({
  selector: 'app-tenant-billing-overview',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-6 space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">💰 Billing Overview</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your billing information and payment methods
          </p>
        </div>
        <div class="flex gap-3">
          <a
            routerLink="/tenant/billing/invoices"
            class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition"
          >
            <span>📄</span>
            <span>View Invoices</span>
          </a>
          <a
            routerLink="/tenant/subscriptions"
            class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
          >
            <span>🧾</span>
            <span>Manage Plan</span>
          </a>
        </div>
      </div>

      <!-- Balance Card -->
      <div class="rounded-lg border-2 border-blue-200 bg-gradient-to-br from-blue-50 to-white p-6 dark:border-blue-900 dark:from-blue-950 dark:to-gray-900">
        <div class="flex items-start justify-between">
          <div>
            <div class="flex items-center gap-2">
              <span class="text-3xl">💵</span>
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">Current Balance</p>
                <h2 class="text-3xl font-bold text-gray-900 dark:text-white">
                  {{ formatCurrency(overview().currentBalance) }}
                </h2>
              </div>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-2">
              <span *ngIf="overview().currentBalance === 0" class="text-green-600 dark:text-green-400">
                ✓ All payments up to date
              </span>
              <span *ngIf="overview().currentBalance < 0" class="text-red-600 dark:text-red-400">
                ⚠️ Outstanding balance - please make a payment
              </span>
            </p>
          </div>
          <button
            *ngIf="overview().currentBalance < 0 && canManageBilling()"
            (click)="makePayment()"
            class="rounded-lg bg-green-600 px-4 py-2 text-sm font-medium text-white hover:bg-green-700 transition"
          >
            Pay Now
          </button>
        </div>
      </div>

      <!-- Quick Stats -->
      <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
        <!-- Next Billing -->
        <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <div class="flex items-center gap-3 mb-4">
            <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-purple-100 dark:bg-purple-900/30">
              <span class="text-2xl">📅</span>
            </div>
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Next Billing Date</p>
              <p class="text-lg font-bold text-gray-900 dark:text-white">
                {{ formatDate(overview().nextBillingDate) }}
              </p>
            </div>
          </div>
          <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p class="text-sm text-gray-600 dark:text-gray-400">Amount Due</p>
            <p class="text-xl font-bold text-gray-900 dark:text-white">
              {{ formatCurrency(overview().nextBillingAmount) }}
            </p>
          </div>
        </div>

        <!-- Last Payment -->
        <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <div class="flex items-center gap-3 mb-4">
            <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-green-100 dark:bg-green-900/30">
              <span class="text-2xl">✅</span>
            </div>
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Last Payment</p>
              <p class="text-lg font-bold text-gray-900 dark:text-white">
                {{ formatDate(overview().lastPaymentDate) }}
              </p>
            </div>
          </div>
          <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
            <p class="text-sm text-gray-600 dark:text-gray-400">Amount Paid</p>
            <p class="text-xl font-bold text-green-600 dark:text-green-400">
              {{ formatCurrency(overview().lastPaymentAmount) }}
            </p>
          </div>
        </div>

        <!-- Auto-Renewal -->
        <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
          <div class="flex items-center gap-3 mb-4">
            <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <span class="text-2xl">🔄</span>
            </div>
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Auto-Renewal</p>
              <p class="text-lg font-bold text-gray-900 dark:text-white">
                {{ autoRenewal() ? 'Enabled' : 'Disabled' }}
              </p>
            </div>
          </div>
          <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
            <a
              routerLink="/tenant/billing/renewal"
              class="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center gap-1"
            >
              <span>Configure Settings</span>
              <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
              </svg>
            </a>
          </div>
        </div>
      </div>

      <!-- Payment Method -->
      <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <span class="text-2xl">💳</span>
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">Payment Method</h3>
          </div>
          <button
            *ngIf="canManageBilling()"
            (click)="updatePaymentMethod()"
            class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition"
          >
            {{ overview().paymentMethod ? 'Update' : 'Add' }} Payment Method
          </button>
        </div>

        <div *ngIf="overview().paymentMethod; else noPaymentMethod" class="flex items-center gap-4">
          <div class="flex h-16 w-24 items-center justify-center rounded-lg border-2 border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
            <span class="text-3xl">
              {{ overview().paymentMethod!.type === 'card' ? '💳' : '🏦' }}
            </span>
          </div>
          <div class="flex-1">
            <div class="flex items-center gap-2">
              <p class="font-semibold text-gray-900 dark:text-white">
                {{ getPaymentMethodLabel(overview().paymentMethod!) }}
              </p>
              <span *ngIf="overview().paymentMethod!.isDefault" class="inline-flex items-center rounded-full bg-blue-100 px-2 py-0.5 text-xs font-semibold text-blue-700 dark:bg-blue-900/30 dark:text-blue-400">
                Default
              </span>
            </div>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {{ getPaymentMethodDetails(overview().paymentMethod!) }}
            </p>
          </div>
        </div>

        <ng-template #noPaymentMethod>
          <div class="text-center py-8">
            <div class="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
              <span class="text-3xl">💳</span>
            </div>
            <p class="text-gray-600 dark:text-gray-400 mb-4">
              No payment method on file
            </p>
            <button
              *ngIf="canManageBilling()"
              (click)="updatePaymentMethod()"
              class="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
            >
              Add Payment Method
            </button>
          </div>
        </ng-template>
      </div>

      <!-- Payment History -->
      <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <span class="text-2xl">📊</span>
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">Recent Transactions</h3>
          </div>
          <a
            routerLink="/tenant/billing/invoices"
            class="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300 inline-flex items-center gap-1"
          >
            <span>View All</span>
            <svg class="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
            </svg>
          </a>
        </div>

        <div class="space-y-4">
          <div *ngFor="let transaction of recentTransactions()" class="flex items-center justify-between py-3 border-b border-gray-100 dark:border-gray-800 last:border-0">
            <div class="flex items-center gap-4">
              <div class="flex h-10 w-10 items-center justify-center rounded-lg" [class]="getStatusBgClass(transaction.status)">
                <span class="text-lg">{{ getStatusIcon(transaction.status) }}</span>
              </div>
              <div>
                <p class="font-medium text-gray-900 dark:text-white">{{ transaction.description }}</p>
                <p class="text-sm text-gray-500 dark:text-gray-400">{{ formatDate(transaction.date) }}</p>
              </div>
            </div>
            <div class="text-right">
              <p class="font-semibold" [class]="getAmountClass(transaction.amount)">
                {{ formatCurrency(transaction.amount) }}
              </p>
              <span class="inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium" [class]="getStatusBadgeClass(transaction.status)">
                {{ transaction.status }}
              </span>
            </div>
          </div>
        </div>
      </div>

      <!-- Billing Information -->
      <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <span class="text-2xl">📋</span>
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">Billing Information</h3>
          </div>
          <button
            *ngIf="canManageBilling()"
            (click)="updateBillingInfo()"
            class="text-sm font-medium text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300"
          >
            Edit
          </button>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Company Name</p>
            <p class="text-gray-900 dark:text-white">{{ billingInfo().companyName }}</p>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Tax ID</p>
            <p class="text-gray-900 dark:text-white">{{ billingInfo().taxId || 'Not provided' }}</p>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Billing Email</p>
            <p class="text-gray-900 dark:text-white">{{ billingInfo().email }}</p>
          </div>
          <div>
            <p class="text-sm font-medium text-gray-600 dark:text-gray-400 mb-1">Billing Address</p>
            <p class="text-gray-900 dark:text-white">{{ billingInfo().address }}</p>
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

  autoRenewal = signal(true);

  overview = signal<BillingOverview>({
    currentBalance: 0,
    nextBillingDate: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
    nextBillingAmount: 99900,
    lastPaymentDate: new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(),
    lastPaymentAmount: 99900,
    paymentMethod: {
      id: 'pm_1',
      type: 'card',
      last4: '4242',
      brand: 'Visa',
      expiryMonth: 12,
      expiryYear: 2025,
      isDefault: true
    }
  });

  recentTransactions = signal([
    {
      id: '1',
      description: 'Monthly Subscription - Professional Plan',
      date: new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString(),
      amount: 99900,
      status: 'Completed'
    },
    {
      id: '2',
      description: 'Monthly Subscription - Professional Plan',
      date: new Date(Date.now() - 35 * 24 * 60 * 60 * 1000).toISOString(),
      amount: 99900,
      status: 'Completed'
    },
    {
      id: '3',
      description: 'Monthly Subscription - Basic Plan',
      date: new Date(Date.now() - 65 * 24 * 60 * 60 * 1000).toISOString(),
      amount: 49900,
      status: 'Completed'
    }
  ]);

  billingInfo = signal({
    companyName: 'Acme Corporation',
    taxId: '123-456-789',
    email: 'billing@acme.com',
    address: '123 Business St, Manila, Philippines'
  });

  canManageBilling = computed(() =>
    this.rbacService.can('tenant-billing:update')
  );

  ngOnInit(): void {
    console.log('💰 TenantBillingOverviewComponent initialized');
    // TODO: Load real billing data
  }

  formatCurrency(amount: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0
    }).format(amount);
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  getPaymentMethodLabel(method: PaymentMethod): string {
    if (method.type === 'card') {
      return `${method.brand} •••• ${method.last4}`;
    }
    return `${method.bankName} •••• ${method.last4}`;
  }

  getPaymentMethodDetails(method: PaymentMethod): string {
    if (method.type === 'card') {
      return `Expires ${method.expiryMonth}/${method.expiryYear}`;
    }
    return 'Bank Account';
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
    this.toastService.info('Payment method management will be available soon!');
  }

  updateBillingInfo(): void {
    this.toastService.info('Billing information update will be available soon!');
  }
}
