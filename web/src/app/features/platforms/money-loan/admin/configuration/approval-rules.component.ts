import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MoneyloanConfigService } from '../../shared/services/moneyloan-config.service';
import { AuthService } from '../../../../../core/services/auth.service';

interface ApprovalRule {
  id?: number;
  rule_name: string;
  rule_type: string;
  min_credit_score?: number;
  max_debt_to_income_ratio?: number;
  min_employment_months?: number;
  auto_approve_threshold?: number;
  approval_level: string;
  requires_verification: boolean;
  is_active: boolean;
}

@Component({
  selector: 'app-approval-rules',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>✅</span>
            Approval Rules Configuration
          </h1>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Set credit score, DTI ratio, and auto-approval thresholds
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
              {{ editingRule() ? 'Edit' : 'Add' }} Approval Rule
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
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Rule Name</label>
                <input
                  type="text"
                  [(ngModel)]="formData.rule_name"
                  name="rule_name"
                  required
                  placeholder="e.g., Standard Approval"
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Rule Type</label>
                <select
                  [(ngModel)]="formData.rule_type"
                  name="rule_type"
                  required
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                >
                  <option value="standard">Standard</option>
                  <option value="priority">Priority</option>
                  <option value="express">Express</option>
                  <option value="first_time">First Time Borrower</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Min Credit Score</label>
                <input
                  type="number"
                  [(ngModel)]="formData.min_credit_score"
                  name="min_credit_score"
                  min="300"
                  max="850"
                  placeholder="300-850"
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Max DTI Ratio (%)</label>
                <input
                  type="number"
                  [(ngModel)]="formData.max_debt_to_income_ratio"
                  name="max_debt_to_income_ratio"
                  step="0.01"
                  min="0"
                  max="100"
                  placeholder="e.g., 43"
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Min Employment (months)</label>
                <input
                  type="number"
                  [(ngModel)]="formData.min_employment_months"
                  name="min_employment_months"
                  min="0"
                  placeholder="e.g., 6"
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Auto-Approve Threshold (₱)</label>
                <input
                  type="number"
                  [(ngModel)]="formData.auto_approve_threshold"
                  name="auto_approve_threshold"
                  step="1000"
                  min="0"
                  placeholder="e.g., 50000"
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                />
              </div>

              <div class="col-span-2">
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Approval Level</label>
                <select
                  [(ngModel)]="formData.approval_level"
                  name="approval_level"
                  required
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                >
                  <option value="auto">Auto Approval</option>
                  <option value="level1">Level 1 (Loan Officer)</option>
                  <option value="level2">Level 2 (Branch Manager)</option>
                  <option value="level3">Level 3 (Regional Manager)</option>
                  <option value="level4">Level 4 (C-Level)</option>
                </select>
              </div>
            </div>

            <div class="flex items-center gap-4 pt-2">
              <div class="flex items-center gap-2">
                <input
                  type="checkbox"
                  [(ngModel)]="formData.requires_verification"
                  name="requires_verification"
                  id="requires_verification"
                  class="w-3.5 h-3.5 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-1 focus:ring-blue-500"
                />
                <label for="requires_verification" class="text-xs text-gray-700 dark:text-gray-300">
                  Requires Verification
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
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Rule Name</th>
                <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Type</th>
                <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Credit Score</th>
                <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Max DTI</th>
                <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Employment</th>
                <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Auto-Approve</th>
                <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Level</th>
                <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
                <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              @for (rule of rules(); track rule.id) {
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td class="px-3 py-2 text-xs font-medium text-gray-900 dark:text-white">
                    {{ rule.rule_name }}
                  </td>
                  <td class="px-3 py-2 text-center">
                    <span [class]="getRuleTypeBadgeClass(rule.rule_type)">
                      {{ rule.rule_type | titlecase }}
                    </span>
                  </td>
                  <td class="px-3 py-2 text-center text-xs text-gray-600 dark:text-gray-400">
                    {{ rule.min_credit_score || '-' }}
                  </td>
                  <td class="px-3 py-2 text-center text-xs text-gray-600 dark:text-gray-400">
                    {{ rule.max_debt_to_income_ratio ? rule.max_debt_to_income_ratio + '%' : '-' }}
                  </td>
                  <td class="px-3 py-2 text-center text-xs text-gray-600 dark:text-gray-400">
                    {{ rule.min_employment_months ? rule.min_employment_months + 'mo' : '-' }}
                  </td>
                  <td class="px-3 py-2 text-center text-xs text-gray-600 dark:text-gray-400">
                    {{ rule.auto_approve_threshold ? '₱' + rule.auto_approve_threshold.toLocaleString() : '-' }}
                  </td>
                  <td class="px-3 py-2 text-center">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                      {{ getApprovalLevelLabel(rule.approval_level) }}
                    </span>
                  </td>
                  <td class="px-3 py-2 text-center">
                    <div class="flex items-center justify-center gap-1">
                      @if (rule.requires_verification) {
                        <span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300" title="Requires Verification">
                          V
                        </span>
                      }
                      @if (rule.is_active) {
                        <span class="inline-flex items-center px-1.5 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300" title="Active">
                          A
                        </span>
                      }
                    </div>
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
                  <td colspan="9" class="px-3 py-8 text-center text-xs text-gray-500 dark:text-gray-400">
                    No approval rules configured yet
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      }

      <!-- Status Legend -->
      @if (!loading() && rules().length > 0) {
        <div class="rounded border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 p-3">
          <div class="text-xs text-gray-600 dark:text-gray-400">
            <span class="font-medium">Flags:</span>
            <span class="ml-2"><strong>V</strong> = Requires Verification</span>
            <span class="ml-3"><strong>A</strong> = Active</span>
          </div>
        </div>
      }
    </div>
  `,
  styles: []
})
export class ApprovalRulesComponent implements OnInit {
  private configService = inject(MoneyloanConfigService);
  private authService = inject(AuthService);

  loading = signal(false);
  saving = signal(false);
  showForm = signal(false);
  editingRule = signal<ApprovalRule | null>(null);
  rules = signal<ApprovalRule[]>([]);
  selectedProductId = '';
  private tenantId: string | number = '';

  formData: ApprovalRule = this.getEmptyForm();

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

    this.configService.getApprovalRules(String(this.tenantId), this.selectedProductId).subscribe({
      next: (response) => {
        this.rules.set(response.data || []);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load approval rules:', error);
        this.loading.set(false);
      }
    });
  }

  showAddForm() {
    this.editingRule.set(null);
    this.formData = this.getEmptyForm();
    this.showForm.set(true);
  }

  editRule(rule: ApprovalRule) {
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
      ? this.configService.updateApprovalRule(String(this.tenantId), this.selectedProductId, this.formData.id!, this.formData)
      : this.configService.createApprovalRule(String(this.tenantId), this.selectedProductId, this.formData);

    observable.subscribe({
      next: () => {
        this.saving.set(false);
        this.cancelForm();
        this.loadRules();
      },
      error: (error) => {
        console.error('Failed to save approval rule:', error);
        this.saving.set(false);
      }
    });
  }

  getRuleTypeBadgeClass(type: string): string {
    const baseClasses = 'inline-flex items-center px-2 py-0.5 rounded text-xs font-medium';
    const colorMap: Record<string, string> = {
      standard: 'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300',
      priority: 'bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300',
      express: 'bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300',
      first_time: 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300'
    };
    return `${baseClasses} ${colorMap[type] || colorMap['standard']}`;
  }

  getApprovalLevelLabel(level: string): string {
    const labels: Record<string, string> = {
      auto: 'Auto',
      level1: 'L1',
      level2: 'L2',
      level3: 'L3',
      level4: 'L4'
    };
    return labels[level] || level;
  }

  private getEmptyForm(): ApprovalRule {
    return {
      rule_name: '',
      rule_type: 'standard',
      min_credit_score: undefined,
      max_debt_to_income_ratio: undefined,
      min_employment_months: undefined,
      auto_approve_threshold: undefined,
      approval_level: 'level1',
      requires_verification: true,
      is_active: true
    };
  }
}
