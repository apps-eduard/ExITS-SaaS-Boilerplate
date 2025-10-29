import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MoneyloanConfigService } from '../../shared/services/moneyloan-config.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { LoanService } from '../../shared/services/loan.service';

interface InterestRateConfig {
  id?: number;
  rate_type: string;
  base_rate: number;
  min_rate?: number;
  max_rate?: number;
  rate_adjustment_frequency?: string;
  effective_date: string;
  expiry_date?: string;
  is_active: boolean;
}

@Component({
  selector: 'app-interest-rates',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>📊</span>
            Interest Rates Configuration
          </h1>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Manage interest rate settings for loan products
          </p>
        </div>
        <button
          (click)="showAddForm()"
          class="px-3 py-1.5 text-xs font-medium rounded shadow-sm bg-blue-600 text-white hover:bg-blue-700 transition flex items-center gap-1.5"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Rate
        </button>
      </div>

      <!-- Product Selection -->
      <div class="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Loan Product</label>
        <select
          [(ngModel)]="selectedProductId"
          (change)="loadInterestRates()"
          class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Select a product</option>
          @for (product of loanProducts(); track product.id) {
            <option [value]="product.id">{{ product.name }}</option>
          }
        </select>
      </div>

      <!-- Add/Edit Form -->
      @if (showForm()) {
        <div class="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              {{ editingConfig() ? 'Edit' : 'Add' }} Interest Rate
            </h3>
            <button
              (click)="cancelForm()"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <form (ngSubmit)="saveConfig()" class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Rate Type</label>
                <select
                  [(ngModel)]="formData.rate_type"
                  name="rate_type"
                  required
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                >
                  <option value="fixed">Fixed</option>
                  <option value="variable">Variable</option>
                  <option value="declining">Declining Balance</option>
                  <option value="flat">Flat Rate</option>
                  <option value="compound">Compound</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Base Rate (%)</label>
                <input
                  type="number"
                  [(ngModel)]="formData.base_rate"
                  name="base_rate"
                  required
                  step="0.01"
                  min="0"
                  max="100"
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Min Rate (%)</label>
                <input
                  type="number"
                  [(ngModel)]="formData.min_rate"
                  name="min_rate"
                  step="0.01"
                  min="0"
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Max Rate (%)</label>
                <input
                  type="number"
                  [(ngModel)]="formData.max_rate"
                  name="max_rate"
                  step="0.01"
                  min="0"
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Adjustment Frequency</label>
                <select
                  [(ngModel)]="formData.rate_adjustment_frequency"
                  name="rate_adjustment_frequency"
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                >
                  <option value="">None</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                  <option value="yearly">Yearly</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Effective Date</label>
                <input
                  type="date"
                  [(ngModel)]="formData.effective_date"
                  name="effective_date"
                  required
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                />
              </div>
            </div>

            <div class="flex items-center gap-2 pt-2">
              <input
                type="checkbox"
                [(ngModel)]="formData.is_active"
                name="is_active"
                id="is_active"
                class="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-1 focus:ring-blue-500"
              />
              <label for="is_active" class="text-xs text-gray-700 dark:text-gray-300">Active</label>
            </div>

            <div class="flex justify-end gap-2 pt-2">
              <button
                type="button"
                (click)="cancelForm()"
                class="px-3 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="saving()"
                class="px-3 py-1.5 text-xs rounded shadow-sm bg-blue-600 text-white hover:bg-blue-700 transition disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {{ saving() ? 'Saving...' : 'Save' }}
              </button>
            </div>
          </form>
        </div>
      }

      <!-- Loading State -->
      @if (loading()) {
        <div class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-3">Loading...</p>
        </div>
      }

      <!-- Interest Rates Table -->
      @if (!loading() && selectedProductId) {
        <div class="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Type</th>
                  <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Base Rate</th>
                  <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Min/Max</th>
                  <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Frequency</th>
                  <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Effective Date</th>
                  <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                @for (config of interestRates(); track config.id) {
                  <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td class="px-3 py-2">
                      <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                        {{ config.rate_type }}
                      </span>
                    </td>
                    <td class="px-3 py-2 text-right">
                      <span class="text-sm font-semibold text-gray-900 dark:text-white">{{ config.base_rate }}%</span>
                    </td>
                    <td class="px-3 py-2 text-right text-xs text-gray-600 dark:text-gray-400">
                      {{ config.min_rate }}% - {{ config.max_rate }}%
                    </td>
                    <td class="px-3 py-2 text-center text-xs text-gray-600 dark:text-gray-400">
                      {{ config.rate_adjustment_frequency || '-' }}
                    </td>
                    <td class="px-3 py-2 text-center text-xs text-gray-600 dark:text-gray-400">
                      {{ config.effective_date | date:'shortDate' }}
                    </td>
                    <td class="px-3 py-2 text-center">
                      @if (config.is_active) {
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                          Active
                        </span>
                      } @else {
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                          Inactive
                        </span>
                      }
                    </td>
                    <td class="px-3 py-2">
                      <div class="flex items-center justify-center gap-1">
                        <button
                          (click)="editConfig(config)"
                          class="p-1 rounded text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition"
                          title="Edit"
                        >
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          (click)="deleteConfig(config.id!)"
                          class="p-1 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                          title="Delete"
                        >
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="7" class="px-3 py-8 text-center text-xs text-gray-500 dark:text-gray-400">
                      No interest rates configured yet
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }
    </div>
  `,
  styles: []
})
export class InterestRatesComponent implements OnInit {
  private configService = inject(MoneyloanConfigService);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);
  private loanService = inject(LoanService);

  loading = signal(false);
  saving = signal(false);
  showForm = signal(false);
  editingConfig = signal<InterestRateConfig | null>(null);
  interestRates = signal<InterestRateConfig[]>([]);
  loanProducts = signal<any[]>([]);
  selectedProductId = '';
  private tenantId: string | number = '';

  formData: InterestRateConfig = this.getEmptyForm();

  ngOnInit() {
    // Get current tenant ID from auth service
    const user = this.authService.currentUser();
    this.tenantId = user?.tenantId || '';

    // Load loan products from database
    this.loadLoanProducts();
  }

  loadLoanProducts() {
    this.loanService.getLoanProducts(String(this.tenantId)).subscribe({
      next: (response) => {
        this.loanProducts.set(response.data || []);
        // Auto-select first product if available
        if (this.loanProducts().length > 0) {
          this.selectedProductId = String(this.loanProducts()[0].id);
          this.loadInterestRates();
        }
      },
      error: (error) => {
        console.error('Failed to load loan products:', error);
        this.toastService.error('Failed to load loan products');
      }
    });
  }

  loadInterestRates() {
    if (!this.selectedProductId) {
      this.interestRates.set([]);
      return;
    }

    this.loading.set(true);

    this.configService.getInterestRates(String(this.tenantId), this.selectedProductId).subscribe({
      next: (response) => {
        this.interestRates.set(response.data || []);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load interest rates:', error);
        this.toastService.error('Failed to load interest rates');
        this.loading.set(false);
      }
    });
  }

  showAddForm() {
    this.editingConfig.set(null);
    this.formData = this.getEmptyForm();
    this.showForm.set(true);
  }

  editConfig(config: InterestRateConfig) {
    this.editingConfig.set(config);
    this.formData = { ...config };
    this.showForm.set(true);
  }

  cancelForm() {
    this.showForm.set(false);
    this.editingConfig.set(null);
    this.formData = this.getEmptyForm();
  }

  saveConfig() {
    if (!this.selectedProductId) {
      this.toastService.warning('Please select a product first');
      return;
    }

    this.saving.set(true);

    const observable = this.editingConfig()
      ? this.configService.updateInterestRate(String(this.tenantId), this.selectedProductId, this.formData.id!, this.formData)
      : this.configService.createInterestRate(String(this.tenantId), this.selectedProductId, this.formData);

    observable.subscribe({
      next: () => {
        this.saving.set(false);
        this.cancelForm();
        this.loadInterestRates();
        this.toastService.success(this.editingConfig() ? 'Interest rate updated successfully' : 'Interest rate created successfully');
      },
      error: (error) => {
        console.error('Failed to save interest rate:', error);
        this.saving.set(false);
        this.toastService.error('Failed to save interest rate');
      }
    });
  }

  deleteConfig(configId: number) {
    this.configService.deleteInterestRate(String(this.tenantId), this.selectedProductId, configId).subscribe({
      next: () => {
        this.loadInterestRates();
        this.toastService.success('Interest rate deleted successfully');
      },
      error: (error) => {
        console.error('Failed to delete interest rate:', error);
        this.toastService.error('Failed to delete interest rate');
      }
    });
  }

  private getEmptyForm(): InterestRateConfig {
    return {
      rate_type: 'fixed',
      base_rate: 12,
      min_rate: 10,
      max_rate: 15,
      rate_adjustment_frequency: '',
      effective_date: new Date().toISOString().split('T')[0],
      is_active: true
    };
  }
}
