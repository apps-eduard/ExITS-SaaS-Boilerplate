import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MoneyloanConfigService } from '../../shared/services/moneyloan-config.service';
import { AuthService } from '../../../../../core/services/auth.service';

interface PaymentScheduleConfig {
  id?: number;
  schedule_type: string;
  payment_frequency: string;
  day_of_payment?: number;
  grace_period_days: number;
  late_payment_penalty_type: string;
  late_payment_penalty_value: number;
  is_active: boolean;
}

@Component({
  selector: 'app-payment-schedules',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>📅</span>
            Payment Schedules Configuration
          </h1>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Configure payment frequencies and penalties
          </p>
        </div>
        <button
          (click)="showAddForm()"
          class="px-3 py-1.5 text-xs font-medium rounded shadow-sm bg-green-600 text-white hover:bg-green-700 transition flex items-center gap-1.5"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Schedule
        </button>
      </div>

      <!-- Product Selection -->
      <div class="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Loan Product</label>
        <select
          [(ngModel)]="selectedProductId"
          (change)="loadSchedules()"
          class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
        >
          <option value="">Select a product</option>
          <option value="1">Personal Loan</option>
          <option value="2">Business Loan</option>
          <option value="3">Emergency Loan</option>
        </select>
      </div>

      <!-- Add/Edit Form -->
      @if (showForm()) {
        <div class="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">
              {{ editingConfig() ? 'Edit' : 'Add' }} Payment Schedule
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
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Schedule Type</label>
                <select
                  [(ngModel)]="formData.schedule_type"
                  name="schedule_type"
                  required
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                >
                  <option value="fixed">Fixed</option>
                  <option value="flexible">Flexible</option>
                  <option value="milestone">Milestone-based</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Frequency</label>
                <select
                  [(ngModel)]="formData.payment_frequency"
                  name="payment_frequency"
                  required
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                >
                  <option value="weekly">Weekly</option>
                  <option value="bi-weekly">Bi-Weekly</option>
                  <option value="monthly">Monthly</option>
                  <option value="quarterly">Quarterly</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Day of Payment</label>
                <input
                  type="number"
                  [(ngModel)]="formData.day_of_payment"
                  name="day_of_payment"
                  min="1"
                  max="31"
                  placeholder="1-31"
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Grace Period (days)</label>
                <input
                  type="number"
                  [(ngModel)]="formData.grace_period_days"
                  name="grace_period_days"
                  required
                  min="0"
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Late Penalty Type</label>
                <select
                  [(ngModel)]="formData.late_payment_penalty_type"
                  name="late_payment_penalty_type"
                  required
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                >
                  <option value="fixed">Fixed Amount</option>
                  <option value="percentage">Percentage</option>
                  <option value="daily">Daily Rate</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Penalty Value {{ formData.late_payment_penalty_type === 'percentage' ? '(%)' : '(₱)' }}
                </label>
                <input
                  type="number"
                  [(ngModel)]="formData.late_payment_penalty_value"
                  name="late_payment_penalty_value"
                  required
                  step="0.01"
                  min="0"
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
                class="px-3 py-1.5 text-xs rounded shadow-sm bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50"
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
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-3">Loading...</p>
        </div>
      }

      <!-- Schedules Table -->
      @if (!loading() && selectedProductId) {
        <div class="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          <table class="w-full">
            <thead class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Type</th>
                <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Frequency</th>
                <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Day</th>
                <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Grace Period</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Late Penalty</th>
                <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              @for (config of schedules(); track config.id) {
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td class="px-3 py-2">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                      {{ config.schedule_type }}
                    </span>
                  </td>
                  <td class="px-3 py-2 text-center text-xs text-gray-900 dark:text-white">
                    {{ config.payment_frequency }}
                  </td>
                  <td class="px-3 py-2 text-center text-xs text-gray-600 dark:text-gray-400">
                    {{ config.day_of_payment || '-' }}
                  </td>
                  <td class="px-3 py-2 text-center text-xs text-gray-600 dark:text-gray-400">
                    {{ config.grace_period_days }} days
                  </td>
                  <td class="px-3 py-2">
                    <div class="text-xs text-gray-900 dark:text-white">
                      <span class="font-medium">{{ config.late_payment_penalty_value }}</span>
                      <span class="text-gray-500 dark:text-gray-400 ml-1">
                        ({{ config.late_payment_penalty_type }})
                      </span>
                    </div>
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
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="px-3 py-8 text-center text-xs text-gray-500 dark:text-gray-400">
                    No payment schedules configured yet
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }
    </div>
  `,
  styles: []
})
export class PaymentSchedulesComponent implements OnInit {
  private configService = inject(MoneyloanConfigService);
  private authService = inject(AuthService);

  loading = signal(false);
  saving = signal(false);
  showForm = signal(false);
  editingConfig = signal<PaymentScheduleConfig | null>(null);
  schedules = signal<PaymentScheduleConfig[]>([]);
  selectedProductId = '';
  private tenantId: string | number = '';

  formData: PaymentScheduleConfig = this.getEmptyForm();

  ngOnInit() {
    const user = this.authService.currentUser();
    this.tenantId = user?.tenantId || '';

    this.selectedProductId = '1';
    this.loadSchedules();
  }

  loadSchedules() {
    if (!this.selectedProductId) {
      this.schedules.set([]);
      return;
    }

    this.loading.set(true);

    this.configService.getPaymentSchedules(String(this.tenantId), this.selectedProductId).subscribe({
      next: (response) => {
        this.schedules.set(response.data || []);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load payment schedules:', error);
        this.loading.set(false);
      }
    });
  }

  showAddForm() {
    this.editingConfig.set(null);
    this.formData = this.getEmptyForm();
    this.showForm.set(true);
  }

  editConfig(config: PaymentScheduleConfig) {
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
    if (!this.selectedProductId) return;

    this.saving.set(true);

    const observable = this.editingConfig()
      ? this.configService.updatePaymentSchedule(String(this.tenantId), this.selectedProductId, this.formData.id!, this.formData)
      : this.configService.createPaymentSchedule(String(this.tenantId), this.selectedProductId, this.formData);

    observable.subscribe({
      next: () => {
        this.saving.set(false);
        this.cancelForm();
        this.loadSchedules();
      },
      error: (error) => {
        console.error('Failed to save payment schedule:', error);
        this.saving.set(false);
      }
    });
  }

  private getEmptyForm(): PaymentScheduleConfig {
    return {
      schedule_type: 'fixed',
      payment_frequency: 'monthly',
      day_of_payment: 1,
      grace_period_days: 5,
      late_payment_penalty_type: 'percentage',
      late_payment_penalty_value: 2.0,
      is_active: true
    };
  }
}
