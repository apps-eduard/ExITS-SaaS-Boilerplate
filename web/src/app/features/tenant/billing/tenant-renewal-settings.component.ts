import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RBACService } from '../../../core/services/rbac.service';
import { ToastService } from '../../../core/services/toast.service';
import { BillingService, AvailablePaymentMethod } from '../../../core/services/billing.service';

interface RenewalSettings {
  autoRenewal: boolean;
  renewalReminder: boolean;
  reminderDays: number;
  cancelAtPeriodEnd: boolean;
  notifyOnFailure: boolean;
  retryFailedPayments: boolean;
  maxRetryAttempts: number;
}

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

@Component({
  selector: 'app-tenant-renewal-settings',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="p-6 space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">🔄 Renewal Settings</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure your subscription renewal preferences
          </p>
        </div>
        <a
          routerLink="/tenant/billing"
          class="inline-flex items-center gap-2 rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition"
        >
          <span>💰</span>
          <span>Back to Billing</span>
        </a>
      </div>

      <!-- Auto-Renewal Section -->
      <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div class="flex items-start justify-between mb-6">
          <div class="flex items-center gap-3">
            <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-blue-100 dark:bg-blue-900/30">
              <span class="text-2xl">🔄</span>
            </div>
            <div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white">Automatic Renewal</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Your subscription will automatically renew at the end of each billing period
              </p>
            </div>
          </div>
          <button
            *ngIf="canManageRenewal()"
            (click)="toggleAutoRenewal()"
            class="relative inline-flex h-6 w-11 items-center rounded-full transition"
            [class.bg-blue-600]="settings().autoRenewal"
            [class.bg-gray-200]="!settings().autoRenewal"
            [class.dark:bg-gray-700]="!settings().autoRenewal"
          >
            <span
              class="inline-block h-4 w-4 transform rounded-full bg-white transition"
              [class.translate-x-6]="settings().autoRenewal"
              [class.translate-x-1]="!settings().autoRenewal"
            ></span>
          </button>
        </div>

        <div *ngIf="settings().autoRenewal" class="border-t border-gray-200 dark:border-gray-700 pt-6 space-y-4">
          <!-- Renewal Reminder -->
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  [(ngModel)]="localSettings.renewalReminder"
                  (ngModelChange)="onSettingsChange()"
                  [disabled]="!canManageRenewal()"
                  class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
                />
                <div>
                  <span class="text-sm font-medium text-gray-900 dark:text-white">
                    Send renewal reminders
                  </span>
                  <p class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    Receive email notifications before your subscription renews
                  </p>
                </div>
              </label>
            </div>
          </div>

          <!-- Reminder Days -->
          <div *ngIf="localSettings.renewalReminder" class="ml-6 flex items-center gap-3">
            <label class="text-sm text-gray-700 dark:text-gray-300">
              Remind me
            </label>
            <select
              [(ngModel)]="localSettings.reminderDays"
              (ngModelChange)="onSettingsChange()"
              [disabled]="!canManageRenewal()"
              class="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option [value]="1">1 day</option>
              <option [value]="3">3 days</option>
              <option [value]="7">7 days</option>
              <option [value]="14">14 days</option>
              <option [value]="30">30 days</option>
            </select>
            <label class="text-sm text-gray-700 dark:text-gray-300">
              before renewal
            </label>
          </div>

          <!-- Notify on Failure -->
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  [(ngModel)]="localSettings.notifyOnFailure"
                  (ngModelChange)="onSettingsChange()"
                  [disabled]="!canManageRenewal()"
                  class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
                />
                <div>
                  <span class="text-sm font-medium text-gray-900 dark:text-white">
                    Notify on payment failure
                  </span>
                  <p class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    Get notified immediately if a renewal payment fails
                  </p>
                </div>
              </label>
            </div>
          </div>

          <!-- Retry Failed Payments -->
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  [(ngModel)]="localSettings.retryFailedPayments"
                  (ngModelChange)="onSettingsChange()"
                  [disabled]="!canManageRenewal()"
                  class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800"
                />
                <div>
                  <span class="text-sm font-medium text-gray-900 dark:text-white">
                    Retry failed payments
                  </span>
                  <p class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    Automatically retry payment if renewal fails
                  </p>
                </div>
              </label>
            </div>
          </div>

          <!-- Max Retry Attempts -->
          <div *ngIf="localSettings.retryFailedPayments" class="ml-6 flex items-center gap-3">
            <label class="text-sm text-gray-700 dark:text-gray-300">
              Maximum retry attempts:
            </label>
            <select
              [(ngModel)]="localSettings.maxRetryAttempts"
              (ngModelChange)="onSettingsChange()"
              [disabled]="!canManageRenewal()"
              class="rounded-lg border border-gray-300 bg-white px-3 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option [value]="1">1 time</option>
              <option [value]="2">2 times</option>
              <option [value]="3">3 times</option>
              <option [value]="5">5 times</option>
            </select>
          </div>
        </div>

        <!-- Warning for Auto-Renewal Off -->
        <div *ngIf="!settings().autoRenewal" class="rounded-lg bg-yellow-50 border border-yellow-200 p-4 dark:bg-yellow-900/20 dark:border-yellow-900">
          <div class="flex items-start gap-3">
            <span class="text-xl">⚠️</span>
            <div>
              <p class="text-sm font-medium text-yellow-800 dark:text-yellow-400">
                Auto-renewal is disabled
              </p>
              <p class="text-sm text-yellow-700 dark:text-yellow-500 mt-1">
                Your subscription will not renew automatically. You'll need to manually renew before it expires to avoid service interruption.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Cancel at Period End -->
      <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div class="flex items-start justify-between">
          <div class="flex items-center gap-3 flex-1">
            <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-red-100 dark:bg-red-900/30">
              <span class="text-2xl">⏸️</span>
            </div>
            <div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white">Cancel at Period End</h3>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Your subscription will remain active until {{ getNextBillingDate() }}, then it will be cancelled
              </p>
            </div>
          </div>
          <button
            *ngIf="canManageRenewal()"
            (click)="toggleCancelAtPeriodEnd()"
            class="relative inline-flex h-6 w-11 items-center rounded-full transition"
            [class.bg-red-600]="settings().cancelAtPeriodEnd"
            [class.bg-gray-200]="!settings().cancelAtPeriodEnd"
            [class.dark:bg-gray-700]="!settings().cancelAtPeriodEnd"
          >
            <span
              class="inline-block h-4 w-4 transform rounded-full bg-white transition"
              [class.translate-x-6]="settings().cancelAtPeriodEnd"
              [class.translate-x-1]="!settings().cancelAtPeriodEnd"
            ></span>
          </button>
        </div>

        <div *ngIf="settings().cancelAtPeriodEnd" class="mt-4 rounded-lg bg-red-50 border border-red-200 p-4 dark:bg-red-900/20 dark:border-red-900">
          <div class="flex items-start gap-3">
            <span class="text-xl">⚠️</span>
            <div>
              <p class="text-sm font-medium text-red-800 dark:text-red-400">
                Subscription scheduled for cancellation
              </p>
              <p class="text-sm text-red-700 dark:text-red-500 mt-1">
                Your subscription will end on {{ getNextBillingDate() }}. You can reactivate anytime before this date.
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Payment Method -->
      <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
        <div class="flex items-center justify-between mb-6">
          <div class="flex items-center gap-3">
            <span class="text-2xl">💳</span>
            <h3 class="text-lg font-bold text-gray-900 dark:text-white">Default Payment Method</h3>
          </div>
          <button
            *ngIf="canManageRenewal()"
            (click)="updatePaymentMethod()"
            class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition"
          >
            {{ paymentMethod() ? 'Update' : 'Add' }} Payment Method
          </button>
        </div>

        <div *ngIf="paymentMethod(); else noPaymentMethod" class="flex items-center gap-4">
          <div class="flex h-16 w-24 items-center justify-center rounded-lg border-2 border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-800">
            <span class="text-3xl">
              {{ getPaymentMethodIcon(paymentMethod()!) }}
            </span>
          </div>
          <div class="flex-1">
            <p class="font-semibold text-gray-900 dark:text-white">
              {{ getPaymentMethodLabel(paymentMethod()!) }}
            </p>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              {{ getPaymentMethodDetails(paymentMethod()!) }}
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
              *ngIf="canManageRenewal()"
              (click)="updatePaymentMethod()"
              class="rounded-lg bg-blue-600 px-6 py-2 text-sm font-medium text-white hover:bg-blue-700 transition"
            >
              Add Payment Method
            </button>
          </div>
        </ng-template>
      </div>

      <!-- Save Button -->
      <div *ngIf="hasChanges()" class="flex items-center justify-end gap-3 sticky bottom-4">
        <button
          (click)="resetChanges()"
          class="rounded-lg border border-gray-300 bg-white px-6 py-2.5 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition"
        >
          Cancel
        </button>
        <button
          (click)="saveSettings()"
          class="rounded-lg bg-blue-600 px-6 py-2.5 text-sm font-medium text-white hover:bg-blue-700 transition shadow-lg"
        >
          Save Changes
        </button>
      </div>

      <!-- Payment Method Selector Modal -->
      <div
        *ngIf="showPaymentMethodForm()"
        class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4"
        (click)="closePaymentMethodForm()"
      >
        <div
          class="relative w-full max-w-2xl rounded-xl border border-gray-200 bg-white shadow-2xl dark:border-gray-700 dark:bg-gray-900"
          (click)="$event.stopPropagation()"
        >
          <!-- Modal Header -->
          <div class="flex items-center justify-between border-b border-gray-200 p-6 dark:border-gray-700">
            <div>
              <h2 class="text-xl font-bold text-gray-900 dark:text-white">💳 Select Payment Method</h2>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Choose your preferred payment method for renewals</p>
            </div>
            <button
              (click)="closePaymentMethodForm()"
              class="rounded-lg p-2 text-gray-500 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-400 dark:hover:bg-gray-800 dark:hover:text-white transition"
            >
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="p-6 space-y-4">
            <div *ngIf="availablePaymentMethods().length === 0" class="text-center py-8">
              <div class="inline-flex h-16 w-16 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-800 mb-4">
                <span class="text-3xl">💳</span>
              </div>
              <p class="text-gray-600 dark:text-gray-400">No payment methods available</p>
            </div>

            <div *ngIf="availablePaymentMethods().length > 0" class="grid gap-3">
              <div
                *ngFor="let method of availablePaymentMethods()"
                (click)="selectPaymentMethodFromList(method.id)"
                class="flex items-center gap-4 rounded-lg border-2 p-4 cursor-pointer transition"
                [class.border-blue-600]="selectedPaymentMethodId() === method.id"
                [class.bg-blue-50]="selectedPaymentMethodId() === method.id"
                [class.dark:bg-blue-900/20]="selectedPaymentMethodId() === method.id"
                [class.border-gray-200]="selectedPaymentMethodId() !== method.id"
                [class.dark:border-gray-700]="selectedPaymentMethodId() !== method.id"
                [class.hover:border-gray-300]="selectedPaymentMethodId() !== method.id"
                [class.dark:hover:border-gray-600]="selectedPaymentMethodId() !== method.id"
              >
                <!-- Icon -->
                <div class="flex h-14 w-14 items-center justify-center rounded-lg bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700">
                  <span class="text-2xl">
                    @if (method.name === 'stripe') { 💳 }
                    @else if (method.name === 'paypal') { 💰 }
                    @else if (method.name === 'gcash') { 📱 }
                    @else if (method.name === 'bank_transfer') { 🏦 }
                    @else { 💵 }
                  </span>
                </div>

                <!-- Info -->
                <div class="flex-1">
                  <h4 class="font-bold text-gray-900 dark:text-white">{{ method.display_name }}</h4>
                  <p class="text-sm text-gray-600 dark:text-gray-400">{{ method.description }}</p>
                </div>

                <!-- Selection Indicator -->
                <div
                  class="h-5 w-5 rounded-full border-2 flex items-center justify-center transition"
                  [class.border-blue-600]="selectedPaymentMethodId() === method.id"
                  [class.bg-blue-600]="selectedPaymentMethodId() === method.id"
                  [class.border-gray-300]="selectedPaymentMethodId() !== method.id"
                  [class.dark:border-gray-600]="selectedPaymentMethodId() !== method.id"
                >
                  <span *ngIf="selectedPaymentMethodId() === method.id" class="text-white text-xs">✓</span>
                </div>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="flex items-center justify-end gap-3 border-t border-gray-200 p-6 dark:border-gray-700">
            <button
              (click)="closePaymentMethodForm()"
              class="rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button
              (click)="savePaymentMethodSelection()"
              [disabled]="!selectedPaymentMethodId()"
              class="rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Save Payment Method
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class TenantRenewalSettingsComponent implements OnInit {
  private rbacService = inject(RBACService);
  private toastService = inject(ToastService);
  private billingService = inject(BillingService);

  settings = signal<RenewalSettings>({
    autoRenewal: true,
    renewalReminder: true,
    reminderDays: 7,
    cancelAtPeriodEnd: false,
    notifyOnFailure: true,
    retryFailedPayments: true,
    maxRetryAttempts: 3
  });

  localSettings: RenewalSettings = { ...this.settings() };

  // Available payment methods from the database
  availablePaymentMethods = signal<AvailablePaymentMethod[]>([]);
  selectedPaymentMethodId = signal<number | null>(null);

  // Sample payment method (will be loaded from backend)
  // Supported types: 'card', 'bank', 'gcash', 'bank_transfer'
  // Examples:
  // Card: { type: 'card', last4: '4242', brand: 'Visa', expiryMonth: 12, expiryYear: 2025 }
  // GCash: { type: 'gcash', phoneNumber: '+63 917 123 4567', last4: '4567' }
  // Bank Transfer: { type: 'bank_transfer', bankName: 'BDO', accountName: 'Company Name', last4: '1234' }
  paymentMethod = signal<PaymentMethod | null>(null);

  // Payment method form
  showPaymentMethodForm = signal(false);
  selectedPaymentType = signal<'card' | 'bank' | 'gcash' | 'bank_transfer'>('card');

  paymentForm = {
    // Card fields
    cardNumber: '',
    cardBrand: 'Visa',
    expiryMonth: 1,
    expiryYear: 2025,
    cvv: '',

    // Bank fields
    bankName: '',
    accountNumber: '',
    accountName: '',

    // GCash fields
    gcashNumber: '',
    gcashName: ''
  };

  hasChanges = signal(false);

  canManageRenewal = computed(() =>
    this.rbacService.can('tenant-billing:manage-renewals')
  );

  ngOnInit(): void {
    console.log('🔄 TenantRenewalSettingsComponent initialized');
    this.loadAvailablePaymentMethods();
    // TODO: Load real renewal settings
  }

  toggleAutoRenewal(): void {
    this.localSettings.autoRenewal = !this.localSettings.autoRenewal;
    this.onSettingsChange();
  }

  toggleCancelAtPeriodEnd(): void {
    this.localSettings.cancelAtPeriodEnd = !this.localSettings.cancelAtPeriodEnd;
    this.onSettingsChange();
  }

  onSettingsChange(): void {
    const changed = JSON.stringify(this.settings()) !== JSON.stringify(this.localSettings);
    this.hasChanges.set(changed);
  }

  saveSettings(): void {
    if (!this.canManageRenewal()) {
      this.toastService.error('You do not have permission to update renewal settings');
      return;
    }

    console.log('💾 Saving renewal settings:', this.localSettings);
    this.settings.set({ ...this.localSettings });
    this.hasChanges.set(false);
    this.toastService.success('✓ Renewal settings saved successfully');
    // TODO: Save to backend
  }

  resetChanges(): void {
    this.localSettings = { ...this.settings() };
    this.hasChanges.set(false);
    this.toastService.info('Changes discarded');
  }

  loadAvailablePaymentMethods(): void {
    this.billingService.getAvailablePaymentMethods().subscribe({
      next: (response) => {
        if (response.success) {
          this.availablePaymentMethods.set(response.data);
        }
      },
      error: (error) => {
        console.error('Error loading payment methods:', error);
        this.toastService.error('Failed to load payment methods');
      }
    });
  }

  updatePaymentMethod(): void {
    this.loadAvailablePaymentMethods();
    this.showPaymentMethodForm.set(true);
  }

  closePaymentMethodForm(): void {
    this.showPaymentMethodForm.set(false);
    this.resetPaymentForm();
  }

  resetPaymentForm(): void {
    this.paymentForm = {
      cardNumber: '',
      cardBrand: 'Visa',
      expiryMonth: 1,
      expiryYear: 2025,
      cvv: '',
      bankName: '',
      accountNumber: '',
      accountName: '',
      gcashNumber: '',
      gcashName: ''
    };
    this.selectedPaymentType.set('card');
  }

  selectPaymentType(type: 'card' | 'bank' | 'gcash' | 'bank_transfer'): void {
    this.selectedPaymentType.set(type);
  }

  selectPaymentMethodFromList(methodId: number): void {
    this.selectedPaymentMethodId.set(methodId);
  }

  savePaymentMethodSelection(): void {
    if (!this.canManageRenewal()) {
      this.toastService.error('You do not have permission to update payment method');
      return;
    }

    const methodId = this.selectedPaymentMethodId();
    if (!methodId) {
      this.toastService.error('Please select a payment method');
      return;
    }

    // For now, we'll save without additional details
    // In a real implementation, you might prompt for card number, account number, etc.
    this.billingService.updatePaymentMethod(methodId, {}).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('✓ Payment method updated successfully');
          this.closePaymentMethodForm();
          // Optionally reload payment method data
        }
      },
      error: (error) => {
        console.error('Error updating payment method:', error);
        this.toastService.error('Failed to update payment method');
      }
    });
  }

  savePaymentMethod(): void {
    if (!this.canManageRenewal()) {
      this.toastService.error('You do not have permission to update payment method');
      return;
    }

    const type = this.selectedPaymentType();
    let newPaymentMethod: PaymentMethod | null = null;

    switch (type) {
      case 'card':
        if (!this.paymentForm.cardNumber || !this.paymentForm.cvv) {
          this.toastService.error('Please fill in all card details');
          return;
        }
        newPaymentMethod = {
          id: 'pm_' + Date.now(),
          type: 'card',
          brand: this.paymentForm.cardBrand,
          last4: this.paymentForm.cardNumber.slice(-4),
          expiryMonth: this.paymentForm.expiryMonth,
          expiryYear: this.paymentForm.expiryYear,
          isDefault: true
        };
        break;

      case 'bank':
      case 'bank_transfer':
        if (!this.paymentForm.bankName || !this.paymentForm.accountNumber || !this.paymentForm.accountName) {
          this.toastService.error('Please fill in all bank details');
          return;
        }
        newPaymentMethod = {
          id: 'pm_' + Date.now(),
          type: type,
          bankName: this.paymentForm.bankName,
          accountName: this.paymentForm.accountName,
          last4: this.paymentForm.accountNumber.slice(-4),
          isDefault: true
        };
        break;

      case 'gcash':
        if (!this.paymentForm.gcashNumber || !this.paymentForm.gcashName) {
          this.toastService.error('Please fill in all GCash details');
          return;
        }
        newPaymentMethod = {
          id: 'pm_' + Date.now(),
          type: 'gcash',
          phoneNumber: this.paymentForm.gcashNumber,
          last4: this.paymentForm.gcashNumber.slice(-4),
          isDefault: true
        };
        break;
    }

    if (newPaymentMethod) {
      this.paymentMethod.set(newPaymentMethod);
      this.toastService.success('✓ Payment method updated successfully');
      this.closePaymentMethodForm();
      // TODO: Save to backend
    }
  }

  getNextBillingDate(): string {
    const next = new Date();
    next.setMonth(next.getMonth() + 1);
    return next.toLocaleDateString('en-US', {
      month: 'long',
      day: 'numeric',
      year: 'numeric'
    });
  }

  getPaymentMethodIcon(method: PaymentMethod): string {
    switch (method.type) {
      case 'card':
        return '💳';
      case 'bank':
      case 'bank_transfer':
        return '🏦';
      case 'gcash':
        return '📱';
      default:
        return '💳';
    }
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
}
