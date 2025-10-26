import { Component, signal, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-tenant-platform-config',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="p-6 space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <div class="flex items-center gap-3">
            <button
              routerLink="/tenant/products"
              class="rounded-lg p-2 hover:bg-gray-100 dark:hover:bg-gray-800 transition"
            >
              <svg class="h-5 w-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
                🔧 Platform Configuration
              </h1>
              <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
                Configure advanced product settings and parameters
              </p>
            </div>
          </div>
        </div>
        <button
          (click)="saveConfiguration()"
          [disabled]="!hasChanges()"
          class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow-sm transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <span>💾</span>
          <span>Save Configuration</span>
        </button>
      </div>

      <!-- Product Selection -->
      <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
        <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
          Select Product
        </label>
        <select
          [ngModel]="selectedProduct()"
          (ngModelChange)="selectedProduct.set($event); onProductChange(); markAsChanged()"
          class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
        >
          <option value="">-- Select a product --</option>
          <option value="money-loan">💸 Money Loan</option>
          <option value="pawnshop">💍 Pawnshop</option>
          <option value="bnpl">🛒 Buy Now Pay Later</option>
        </select>
      </div>

      <!-- Configuration Panel -->
      <div *ngIf="selectedProduct()" class="space-y-6">
        <!-- Money Loan Configuration -->
        <div *ngIf="selectedProduct() === 'money-loan'" class="space-y-4">
          <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">
              💸 Money Loan Settings
            </h3>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Minimum Loan Amount
                </label>
                <input
                  type="number"
                  [(ngModel)]="config().moneyLoan.minAmount"
                  (change)="markAsChanged()"
                  class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="5000"
                >
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Maximum Loan Amount
                </label>
                <input
                  type="number"
                  [(ngModel)]="config().moneyLoan.maxAmount"
                  (change)="markAsChanged()"
                  class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="500000"
                >
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Interest Rate (%)
                </label>
                <input
                  type="number"
                  step="0.1"
                  [(ngModel)]="config().moneyLoan.interestRate"
                  (change)="markAsChanged()"
                  class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="2.5"
                >
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Loan Term (months)
                </label>
                <input
                  type="number"
                  [(ngModel)]="config().moneyLoan.maxTermMonths"
                  (change)="markAsChanged()"
                  class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="24"
                >
              </div>
            </div>

            <div class="mt-4">
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  [(ngModel)]="config().moneyLoan.requireCollateral"
                  (change)="markAsChanged()"
                  class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                >
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Require Collateral
                </span>
              </label>
            </div>
          </div>
        </div>

        <!-- Pawnshop Configuration -->
        <div *ngIf="selectedProduct() === 'pawnshop'" class="space-y-4">
          <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">
              💍 Pawnshop Settings
            </h3>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Loan-to-Value Ratio (%)
                </label>
                <input
                  type="number"
                  [(ngModel)]="config().pawnshop.loanToValueRatio"
                  (change)="markAsChanged()"
                  class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="70"
                >
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Default Term (days)
                </label>
                <input
                  type="number"
                  [(ngModel)]="config().pawnshop.defaultTermDays"
                  (change)="markAsChanged()"
                  class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="30"
                >
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Storage Fee (per month)
                </label>
                <input
                  type="number"
                  [(ngModel)]="config().pawnshop.storageFee"
                  (change)="markAsChanged()"
                  class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="100"
                >
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Grace Period (days)
                </label>
                <input
                  type="number"
                  [(ngModel)]="config().pawnshop.gracePeriodDays"
                  (change)="markAsChanged()"
                  class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="7"
                >
              </div>
            </div>
          </div>
        </div>

        <!-- BNPL Configuration -->
        <div *ngIf="selectedProduct() === 'bnpl'" class="space-y-4">
          <div class="rounded-lg border border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">
            <h3 class="text-lg font-bold text-gray-900 dark:text-white mb-4">
              🛒 BNPL Settings
            </h3>
            
            <div class="grid grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Minimum Purchase Amount
                </label>
                <input
                  type="number"
                  [(ngModel)]="config().bnpl.minPurchaseAmount"
                  (change)="markAsChanged()"
                  class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="1000"
                >
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Maximum Purchase Amount
                </label>
                <input
                  type="number"
                  [(ngModel)]="config().bnpl.maxPurchaseAmount"
                  (change)="markAsChanged()"
                  class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="50000"
                >
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Number of Installments
                </label>
                <input
                  type="number"
                  [(ngModel)]="config().bnpl.installmentOptions"
                  (change)="markAsChanged()"
                  class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="3, 6, 12"
                >
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Late Fee Amount
                </label>
                <input
                  type="number"
                  [(ngModel)]="config().bnpl.lateFeeAmount"
                  (change)="markAsChanged()"
                  class="w-full rounded-lg border border-gray-300 bg-white px-4 py-2 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  placeholder="50"
                >
              </div>
            </div>

            <div class="mt-4">
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  [(ngModel)]="config().bnpl.zeroInterest"
                  (change)="markAsChanged()"
                  class="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                >
                <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                  Zero Interest Option
                </span>
              </label>
            </div>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        *ngIf="!selectedProduct()"
        class="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700"
      >
        <div class="text-6xl mb-4">🔧</div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          Select a Product
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400">
          Choose a product from the dropdown above to configure its settings
        </p>
      </div>
    </div>
  `,
  styles: []
})
export class TenantPlatformConfigComponent implements OnInit {
  private route = inject(ActivatedRoute);
  private toastService = inject(ToastService);

  selectedProduct = signal('');
  hasChanges = signal(false);

  config = signal({
    moneyLoan: {
      minAmount: 5000,
      maxAmount: 500000,
      interestRate: 2.5,
      maxTermMonths: 24,
      requireCollateral: true
    },
    pawnshop: {
      loanToValueRatio: 70,
      defaultTermDays: 30,
      storageFee: 100,
      gracePeriodDays: 7
    },
    bnpl: {
      minPurchaseAmount: 1000,
      maxPurchaseAmount: 50000,
      installmentOptions: '3, 6, 12',
      lateFeeAmount: 50,
      zeroInterest: false
    }
  });

  ngOnInit(): void {
    // Check if product was passed via query param
    this.route.queryParams.subscribe(params => {
      if (params['product']) {
        this.selectedProduct.set(params['product']);
      }
    });
  }

  onProductChange(): void {
    console.log('📦 Selected product:', this.selectedProduct());
  }

  markAsChanged(): void {
    this.hasChanges.set(true);
  }

  saveConfiguration(): void {
    if (!this.hasChanges()) return;

    console.log('💾 Saving configuration for:', this.selectedProduct());
    console.log('Config:', this.config());
    
    // TODO: API call to save configuration
    this.toastService.success('Configuration saved successfully!');
    this.hasChanges.set(false);
  }
}
