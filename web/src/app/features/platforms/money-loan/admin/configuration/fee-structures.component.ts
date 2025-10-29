import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MoneyloanConfigService } from '../../shared/services/moneyloan-config.service';
import { AuthService } from '../../../../../core/services/auth.service';

interface FeeStructure {
  id?: number;
  fee_type: string;
  fee_name: string;
  calculation_method: string;
  amount: number;
  min_amount?: number;
  max_amount?: number;
  charge_timing: string;
  is_waivable: boolean;
  is_active: boolean;
}

@Component({
  selector: 'app-fee-structures',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>💰</span>
            Fee Structures Configuration
          </h1>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Manage processing, disbursement, and penalty fees
          </p>
        </div>
        <button
          (click)="showAddForm()"
          class="px-3 py-1.5 text-xs font-medium rounded shadow-sm bg-green-600 text-white hover:bg-green-700 transition flex items-center gap-1.5"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Fee
        </button>
      </div>

      <!-- Product Selection -->
      <div class="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Loan Product</label>
        <select
          [(ngModel)]="selectedProductId"
          (change)="loadFees()"
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
              {{ editingFee() ? 'Edit' : 'Add' }} Fee Structure
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

          <form (ngSubmit)="saveFee()" class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Fee Type</label>
                <select
                  [(ngModel)]="formData.fee_type"
                  name="fee_type"
                  required
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                >
                  <option value="processing">Processing Fee</option>
                  <option value="disbursement">Disbursement Fee</option>
                  <option value="late_payment">Late Payment Fee</option>
                  <option value="early_settlement">Early Settlement Fee</option>
                  <option value="insurance">Insurance Fee</option>
                  <option value="documentation">Documentation Fee</option>
                  <option value="restructuring">Restructuring Fee</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Fee Name</label>
                <input
                  type="text"
                  [(ngModel)]="formData.fee_name"
                  name="fee_name"
                  required
                  placeholder="e.g., Standard Processing Fee"
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Calculation Method</label>
                <select
                  [(ngModel)]="formData.calculation_method"
                  name="calculation_method"
                  required
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                >
                  <option value="percentage">Percentage of Principal</option>
                  <option value="fixed">Fixed Amount</option>
                  <option value="tiered">Tiered (by loan amount)</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Amount {{ formData.calculation_method === 'percentage' ? '(%)' : '(₱)' }}
                </label>
                <input
                  type="number"
                  [(ngModel)]="formData.amount"
                  name="amount"
                  required
                  step="0.01"
                  min="0"
                  placeholder="Enter amount"
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Minimum Amount (₱)</label>
                <input
                  type="number"
                  [(ngModel)]="formData.min_amount"
                  name="min_amount"
                  step="0.01"
                  min="0"
                  placeholder="Optional"
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Maximum Amount (₱)</label>
                <input
                  type="number"
                  [(ngModel)]="formData.max_amount"
                  name="max_amount"
                  step="0.01"
                  min="0"
                  placeholder="Optional"
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div class="col-span-2">
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Charge Timing</label>
                <select
                  [(ngModel)]="formData.charge_timing"
                  name="charge_timing"
                  required
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                >
                  <option value="upfront">Upfront (at disbursement)</option>
                  <option value="recurring">Recurring (monthly)</option>
                  <option value="upon_event">Upon Event</option>
                  <option value="deferred">Deferred</option>
                </select>
              </div>
            </div>

            <div class="flex items-center gap-4 pt-2">
              <div class="flex items-center gap-2">
                <input
                  type="checkbox"
                  [(ngModel)]="formData.is_waivable"
                  name="is_waivable"
                  id="is_waivable"
                  class="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-1 focus:ring-blue-500"
                />
                <label for="is_waivable" class="text-xs text-gray-700 dark:text-gray-300">Waivable</label>
              </div>
              <div class="flex items-center gap-2">
                <input
                  type="checkbox"
                  [(ngModel)]="formData.is_active"
                  name="is_active"
                  id="is_active"
                  class="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-1 focus:ring-blue-500"
                />
                <label for="is_active" class="text-xs text-gray-700 dark:text-gray-300">Active</label>
              </div>
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

      <!-- Fees Table -->
      @if (!loading() && selectedProductId) {
        <div class="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          <table class="w-full">
            <thead class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Fee Type</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Name</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Amount</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Limits</th>
                <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Timing</th>
                <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Flags</th>
                <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              @for (fee of fees(); track fee.id) {
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td class="px-3 py-2">
                    <span [class]="getFeeTypeBadgeClass(fee.fee_type)">
                      {{ fee.fee_type | titlecase }}
                    </span>
                  </td>
                  <td class="px-3 py-2 text-xs text-gray-900 dark:text-white">
                    {{ fee.fee_name }}
                  </td>
                  <td class="px-3 py-2">
                    <div class="text-xs">
                      <span class="font-medium text-gray-900 dark:text-white">
                        {{ fee.calculation_method === 'percentage' ? fee.amount + '%' : '₱' + fee.amount }}
                      </span>
                      <span class="text-gray-500 dark:text-gray-400 ml-1">
                        ({{ fee.calculation_method }})
                      </span>
                    </div>
                  </td>
                  <td class="px-3 py-2">
                    <div class="text-xs text-gray-600 dark:text-gray-400">
                      @if (fee.min_amount || fee.max_amount) {
                        <span>
                          {{ fee.min_amount ? '₱' + fee.min_amount : '-' }} -
                          {{ fee.max_amount ? '₱' + fee.max_amount : '-' }}
                        </span>
                      } @else {
                        <span class="text-gray-400">No limits</span>
                      }
                    </div>
                  </td>
                  <td class="px-3 py-2 text-center">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300">
                      {{ fee.charge_timing | titlecase }}
                    </span>
                  </td>
                  <td class="px-3 py-2">
                    <div class="flex items-center justify-center gap-1">
                      @if (fee.is_waivable) {
                        <span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                          W
                        </span>
                      }
                      @if (fee.is_active) {
                        <span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                          A
                        </span>
                      }
                    </div>
                  </td>
                  <td class="px-3 py-2">
                    <div class="flex items-center justify-center gap-1">
                      <button
                        (click)="editFee(fee)"
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
                    No fees configured yet
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Fee Type Legend -->
      @if (!loading() && fees().length > 0) {
        <div class="rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3">
          <div class="text-xs text-gray-600 dark:text-gray-400">
            <span class="font-medium">Flags:</span>
            <span class="ml-2"><strong>W</strong> = Waivable</span>
            <span class="ml-3"><strong>A</strong> = Active</span>
          </div>
        </div>
      }
    </div>
  `,
  styles: []
})
export class FeeStructuresComponent implements OnInit {
  private configService = inject(MoneyloanConfigService);
  private authService = inject(AuthService);

  loading = signal(false);
  saving = signal(false);
  showForm = signal(false);
  editingFee = signal<FeeStructure | null>(null);
  fees = signal<FeeStructure[]>([]);
  selectedProductId = '';
  private tenantId: string | number = '';

  formData: FeeStructure = this.getEmptyForm();

  ngOnInit() {
    const user = this.authService.currentUser();
    this.tenantId = user?.tenantId || '';

    this.selectedProductId = '1';
    this.loadFees();
  }

  loadFees() {
    if (!this.selectedProductId) {
      this.fees.set([]);
      return;
    }

    this.loading.set(true);

    this.configService.getFeeStructures(String(this.tenantId), this.selectedProductId).subscribe({
      next: (response: any) => {
        this.fees.set(response.data || []);
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('Failed to load fee structures:', error);
        this.loading.set(false);
      }
    });
  }

  showAddForm() {
    this.editingFee.set(null);
    this.formData = this.getEmptyForm();
    this.showForm.set(true);
  }

  editFee(fee: FeeStructure) {
    this.editingFee.set(fee);
    this.formData = { ...fee };
    this.showForm.set(true);
  }

  cancelForm() {
    this.showForm.set(false);
    this.editingFee.set(null);
    this.formData = this.getEmptyForm();
  }

  saveFee() {
    if (!this.selectedProductId) return;

    this.saving.set(true);

    const observable = this.editingFee()
      ? this.configService.updateFeeStructure(String(this.tenantId), this.selectedProductId, this.formData.id!, this.formData)
      : this.configService.createFeeStructure(String(this.tenantId), this.selectedProductId, this.formData);

    observable.subscribe({
      next: () => {
        this.saving.set(false);
        this.cancelForm();
        this.loadFees();
      },
      error: (error) => {
        console.error('Failed to save fee structure:', error);
        this.saving.set(false);
      }
    });
  }

  getFeeTypeBadgeClass(type: string): string {
    const baseClasses = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium';
    const colorMap: Record<string, string> = {
      processing: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      disbursement: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      late_payment: 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300',
      early_settlement: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
      insurance: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
      documentation: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
      restructuring: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
    };
    return `${baseClasses} ${colorMap[type] || colorMap['documentation']}`;
  }

  private getEmptyForm(): FeeStructure {
    return {
      fee_type: 'processing',
      fee_name: '',
      calculation_method: 'percentage',
      amount: 0,
      min_amount: undefined,
      max_amount: undefined,
      charge_timing: 'upfront',
      is_waivable: false,
      is_active: true
    };
  }
}
