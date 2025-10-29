import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MoneyloanConfigService } from '../../shared/services/moneyloan-config.service';
import { AuthService } from '../../../../../core/services/auth.service';

interface ModificationRule {
  id?: number;
  modification_type: string;
  max_modifications_allowed: number;
  cooling_period_days: number;
  modification_fee_type: string;
  modification_fee_value: number;
  requires_approval: boolean;
  approval_level?: string;
  is_active: boolean;
}

@Component({
  selector: 'app-loan-modifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>🔄</span>
            Loan Modifications Configuration
          </h1>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Configure term extensions, restructuring, and payment modifications
          </p>
        </div>
        <button
          (click)="showAddForm()"
          class="px-3 py-1.5 text-xs font-medium rounded shadow-sm bg-green-600 text-white hover:bg-green-700 transition flex items-center gap-1.5"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
          </svg>
          Add Rule
        </button>
      </div>

      <!-- Product Selection -->
      <div class="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Loan Product</label>
        <select
          [(ngModel)]="selectedProductId"
          (change)="loadRules()"
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
              {{ editingRule() ? 'Edit' : 'Add' }} Modification Rule
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

          <form (ngSubmit)="saveRule()" class="space-y-3">
            <div class="grid grid-cols-2 gap-3">
              <div class="col-span-2">
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Modification Type</label>
                <select
                  [(ngModel)]="formData.modification_type"
                  name="modification_type"
                  required
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                >
                  <option value="term_extension">Term Extension</option>
                  <option value="payment_restructuring">Payment Restructuring</option>
                  <option value="interest_rate_change">Interest Rate Change</option>
                  <option value="principal_reduction">Principal Reduction</option>
                  <option value="payment_holiday">Payment Holiday</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Max Modifications Allowed</label>
                <input
                  type="number"
                  [(ngModel)]="formData.max_modifications_allowed"
                  name="max_modifications_allowed"
                  required
                  min="1"
                  placeholder="e.g., 3"
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Cooling Period (days)</label>
                <input
                  type="number"
                  [(ngModel)]="formData.cooling_period_days"
                  name="cooling_period_days"
                  required
                  min="0"
                  placeholder="e.g., 30"
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Modification Fee Type</label>
                <select
                  [(ngModel)]="formData.modification_fee_type"
                  name="modification_fee_type"
                  required
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                >
                  <option value="fixed">Fixed Amount</option>
                  <option value="percentage">Percentage of Balance</option>
                  <option value="none">No Fee</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Fee Value {{ formData.modification_fee_type === 'percentage' ? '(%)' : formData.modification_fee_type === 'none' ? '' : '(₱)' }}
                </label>
                <input
                  type="number"
                  [(ngModel)]="formData.modification_fee_value"
                  name="modification_fee_value"
                  [required]="formData.modification_fee_type !== 'none'"
                  [disabled]="formData.modification_fee_type === 'none'"
                  step="0.01"
                  min="0"
                  placeholder="Enter value"
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
                />
              </div>

              @if (formData.requires_approval) {
                <div class="col-span-2">
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Approval Level</label>
                  <select
                    [(ngModel)]="formData.approval_level"
                    name="approval_level"
                    class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                  >
                    <option value="level1">Level 1 (Loan Officer)</option>
                    <option value="level2">Level 2 (Branch Manager)</option>
                    <option value="level3">Level 3 (Regional Manager)</option>
                    <option value="level4">Level 4 (C-Level)</option>
                  </select>
                </div>
              }
            </div>

            <div class="flex items-center gap-4 pt-2">
              <div class="flex items-center gap-2">
                <input
                  type="checkbox"
                  [(ngModel)]="formData.requires_approval"
                  name="requires_approval"
                  id="requires_approval"
                  class="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-1 focus:ring-blue-500"
                />
                <label for="requires_approval" class="text-xs text-gray-700 dark:text-gray-300">
                  Requires Approval
                </label>
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

      <!-- Rules Table -->
      @if (!loading() && selectedProductId) {
        <div class="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          <table class="w-full">
            <thead class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Modification Type</th>
                <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Max Allowed</th>
                <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Cooling Period</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Fee</th>
                <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Approval</th>
                <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              @for (rule of rules(); track rule.id) {
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td class="px-3 py-2">
                    <span [class]="getModificationTypeBadgeClass(rule.modification_type)">
                      {{ getModificationTypeLabel(rule.modification_type) }}
                    </span>
                  </td>
                  <td class="px-3 py-2 text-center text-xs text-gray-900 dark:text-white">
                    {{ rule.max_modifications_allowed }}x
                  </td>
                  <td class="px-3 py-2 text-center text-xs text-gray-600 dark:text-gray-400">
                    {{ rule.cooling_period_days }} days
                  </td>
                  <td class="px-3 py-2">
                    <div class="text-xs text-gray-900 dark:text-white">
                      @if (rule.modification_fee_type === 'none') {
                        <span class="text-gray-500 dark:text-gray-400">No Fee</span>
                      } @else {
                        <span class="font-medium">
                          {{ rule.modification_fee_type === 'percentage' ? rule.modification_fee_value + '%' : '₱' + rule.modification_fee_value }}
                        </span>
                        <span class="text-gray-500 dark:text-gray-400 ml-1">
                          ({{ rule.modification_fee_type }})
                        </span>
                      }
                    </div>
                  </td>
                  <td class="px-3 py-2 text-center">
                    @if (rule.requires_approval) {
                      <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                        {{ getApprovalLevelLabel(rule.approval_level || 'level1') }}
                      </span>
                    } @else {
                      <span class="text-xs text-gray-400">Auto</span>
                    }
                  </td>
                  <td class="px-3 py-2 text-center">
                    @if (rule.is_active) {
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
                        (click)="editRule(rule)"
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
                    No modification rules configured yet
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
export class LoanModificationsComponent implements OnInit {
  private configService = inject(MoneyloanConfigService);
  private authService = inject(AuthService);

  loading = signal(false);
  saving = signal(false);
  showForm = signal(false);
  editingRule = signal<ModificationRule | null>(null);
  rules = signal<ModificationRule[]>([]);
  selectedProductId = '';
  private tenantId: string | number = '';

  formData: ModificationRule = this.getEmptyForm();

  ngOnInit() {
    const user = this.authService.currentUser();
    this.tenantId = user?.tenantId || '';

    this.selectedProductId = '1';
    this.loadRules();
  }

  loadRules() {
    if (!this.selectedProductId) {
      this.rules.set([]);
      return;
    }

    this.loading.set(true);

    this.configService.getLoanModifications(String(this.tenantId), this.selectedProductId).subscribe({
      next: (response: any) => {
        this.rules.set(response.data || []);
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('Failed to load modification rules:', error);
        this.loading.set(false);
      }
    });
  }

  showAddForm() {
    this.editingRule.set(null);
    this.formData = this.getEmptyForm();
    this.showForm.set(true);
  }

  editRule(rule: ModificationRule) {
    this.editingRule.set(rule);
    this.formData = { ...rule };
    this.showForm.set(true);
  }

  cancelForm() {
    this.showForm.set(false);
    this.editingRule.set(null);
    this.formData = this.getEmptyForm();
  }

  saveRule() {
    if (!this.selectedProductId) return;

    this.saving.set(true);

    const observable = this.editingRule()
      ? this.configService.updateLoanModification(String(this.tenantId), this.selectedProductId, this.formData.id!, this.formData)
      : this.configService.createLoanModification(String(this.tenantId), this.selectedProductId, this.formData);

    observable.subscribe({
      next: () => {
        this.saving.set(false);
        this.cancelForm();
        this.loadRules();
      },
      error: (error: any) => {
        console.error('Failed to save modification rule:', error);
        this.saving.set(false);
      }
    });
  }

  getModificationTypeBadgeClass(type: string): string {
    const baseClasses = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium';
    const colorMap: Record<string, string> = {
      term_extension: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      payment_restructuring: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
      interest_rate_change: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300',
      principal_reduction: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300',
      payment_holiday: 'bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300'
    };
    return `${baseClasses} ${colorMap[type] || colorMap['term_extension']}`;
  }

  getModificationTypeLabel(type: string): string {
    const labels: Record<string, string> = {
      term_extension: 'Term Extension',
      payment_restructuring: 'Payment Restructuring',
      interest_rate_change: 'Interest Rate Change',
      principal_reduction: 'Principal Reduction',
      payment_holiday: 'Payment Holiday'
    };
    return labels[type] || type;
  }

  getApprovalLevelLabel(level: string): string {
    const labels: Record<string, string> = {
      level1: 'L1',
      level2: 'L2',
      level3: 'L3',
      level4: 'L4'
    };
    return labels[level] || level;
  }

  private getEmptyForm(): ModificationRule {
    return {
      modification_type: 'term_extension',
      max_modifications_allowed: 3,
      cooling_period_days: 30,
      modification_fee_type: 'percentage',
      modification_fee_value: 1.0,
      requires_approval: true,
      approval_level: 'level2',
      is_active: true
    };
  }
}
