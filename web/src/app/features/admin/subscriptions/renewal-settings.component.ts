import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface RenewalSettings {
  defaultBehavior: 'auto_renew' | 'manual_renew' | 'no_renew';
  gracePeriodDays: number;
  maxRetryAttempts: number;
  retryIntervalDays: number;
  emailReminders: boolean;
  emailReminderDays: number[];
  smsReminders: boolean;
  smsReminderDays: number[];
  autoDisableAfterFailed: boolean;
  notifyAdminOnFailure: boolean;
}

interface PlanRenewalRule {
  id: number;
  planName: string;
  behavior: 'auto_renew' | 'manual_renew' | 'no_renew';
  gracePeriodDays: number;
}

@Component({
  selector: 'app-renewal-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 sm:p-6 max-w-5xl mx-auto space-y-6">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Renewal Settings</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Configure how subscriptions renew and handle failed payments
        </p>
      </div>

      <!-- Default Renewal Behavior -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-center gap-2 mb-4">
          <span class="text-2xl">🔄</span>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Default Renewal Behavior</h2>
        </div>

        <div class="space-y-4">
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Choose how subscriptions should renew by default. This can be overridden per plan or customer.
          </p>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
            <label
              class="relative p-4 border-2 rounded-lg cursor-pointer transition"
              [class]="settings().defaultBehavior === 'auto_renew'
                ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'"
            >
              <input
                type="radio"
                name="defaultBehavior"
                value="auto_renew"
                [(ngModel)]="settings().defaultBehavior"
                class="sr-only"
              />
              <div class="flex items-start gap-3">
                <span class="text-3xl">✅</span>
                <div class="flex-1">
                  <h3 class="font-semibold text-sm text-gray-900 dark:text-white mb-1">Auto-Renew</h3>
                  <p class="text-xs text-gray-600 dark:text-gray-400">
                    Automatically renew subscriptions before expiry
                  </p>
                </div>
                @if (settings().defaultBehavior === 'auto_renew') {
                  <svg class="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                }
              </div>
            </label>

            <label
              class="relative p-4 border-2 rounded-lg cursor-pointer transition"
              [class]="settings().defaultBehavior === 'manual_renew'
                ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'"
            >
              <input
                type="radio"
                name="defaultBehavior"
                value="manual_renew"
                [(ngModel)]="settings().defaultBehavior"
                class="sr-only"
              />
              <div class="flex items-start gap-3">
                <span class="text-3xl">👤</span>
                <div class="flex-1">
                  <h3 class="font-semibold text-sm text-gray-900 dark:text-white mb-1">Manual Renewal</h3>
                  <p class="text-xs text-gray-600 dark:text-gray-400">
                    Require customer action to renew
                  </p>
                </div>
                @if (settings().defaultBehavior === 'manual_renew') {
                  <svg class="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                }
              </div>
            </label>

            <label
              class="relative p-4 border-2 rounded-lg cursor-pointer transition"
              [class]="settings().defaultBehavior === 'no_renew'
                ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'"
            >
              <input
                type="radio"
                name="defaultBehavior"
                value="no_renew"
                [(ngModel)]="settings().defaultBehavior"
                class="sr-only"
              />
              <div class="flex items-start gap-3">
                <span class="text-3xl">🚫</span>
                <div class="flex-1">
                  <h3 class="font-semibold text-sm text-gray-900 dark:text-white mb-1">No Renewal</h3>
                  <p class="text-xs text-gray-600 dark:text-gray-400">
                    Subscriptions expire without renewal
                  </p>
                </div>
                @if (settings().defaultBehavior === 'no_renew') {
                  <svg class="w-5 h-5 text-primary-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                }
              </div>
            </label>
          </div>
        </div>
      </div>

      <!-- Payment Retry Settings -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-center gap-2 mb-4">
          <span class="text-2xl">🔁</span>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Payment Retry Logic</h2>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Grace Period (Days)</label>
            <input
              type="number"
              [(ngModel)]="settings().gracePeriodDays"
              min="0"
              max="30"
              class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Allow access during this period after payment failure
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Max Retry Attempts</label>
            <input
              type="number"
              [(ngModel)]="settings().maxRetryAttempts"
              min="0"
              max="10"
              class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Number of times to retry failed payments
            </p>
          </div>

          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Retry Interval (Days)</label>
            <input
              type="number"
              [(ngModel)]="settings().retryIntervalDays"
              min="1"
              max="7"
              class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              Days between retry attempts
            </p>
          </div>
        </div>

        <div class="mt-6 space-y-3">
          <label class="flex items-start gap-3">
            <input
              type="checkbox"
              [(ngModel)]="settings().autoDisableAfterFailed"
              class="mt-1"
            />
            <div>
              <span class="text-sm font-medium text-gray-900 dark:text-white">Auto-disable after max retries</span>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Automatically suspend subscription if all payment retries fail
              </p>
            </div>
          </label>

          <label class="flex items-start gap-3">
            <input
              type="checkbox"
              [(ngModel)]="settings().notifyAdminOnFailure"
              class="mt-1"
            />
            <div>
              <span class="text-sm font-medium text-gray-900 dark:text-white">Notify admin on payment failures</span>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                Send notification to administrators when payments fail
              </p>
            </div>
          </label>
        </div>
      </div>

      <!-- Renewal Notifications -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-center gap-2 mb-4">
          <span class="text-2xl">🔔</span>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Renewal Notifications</h2>
        </div>

        <!-- Email Reminders -->
        <div class="space-y-4 mb-6">
          <label class="flex items-center gap-2">
            <input
              type="checkbox"
              [(ngModel)]="settings().emailReminders"
            />
            <span class="text-sm font-medium text-gray-900 dark:text-white">📧 Send Email Reminders</span>
          </label>

          @if (settings().emailReminders) {
            <div class="pl-6 space-y-3">
              <p class="text-xs text-gray-600 dark:text-gray-400">
                Send email reminders before subscription renewal (days before expiry):
              </p>
              <div class="flex flex-wrap items-center gap-2">
                @for (day of [30, 14, 7, 3, 1]; track day) {
                  <label class="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                    <input
                      type="checkbox"
                      [checked]="settings().emailReminderDays.includes(day)"
                      (change)="toggleEmailReminder(day)"
                    />
                    <span class="text-sm text-gray-700 dark:text-gray-300">{{ day }} {{ day === 1 ? 'day' : 'days' }}</span>
                  </label>
                }
              </div>
            </div>
          }
        </div>

        <!-- SMS Reminders -->
        <div class="space-y-4">
          <label class="flex items-center gap-2">
            <input
              type="checkbox"
              [(ngModel)]="settings().smsReminders"
            />
            <span class="text-sm font-medium text-gray-900 dark:text-white">📱 Send SMS Alerts</span>
          </label>

          @if (settings().smsReminders) {
            <div class="pl-6 space-y-3">
              <p class="text-xs text-gray-600 dark:text-gray-400">
                Send SMS alerts before subscription renewal (days before expiry):
              </p>
              <div class="flex flex-wrap items-center gap-2">
                @for (day of [7, 3, 1]; track day) {
                  <label class="inline-flex items-center gap-2 px-3 py-1.5 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 transition">
                    <input
                      type="checkbox"
                      [checked]="settings().smsReminderDays.includes(day)"
                      (change)="toggleSmsReminder(day)"
                    />
                    <span class="text-sm text-gray-700 dark:text-gray-300">{{ day }} {{ day === 1 ? 'day' : 'days' }}</span>
                  </label>
                }
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Plan-Specific Rules -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <div class="flex items-center justify-between mb-4">
          <div class="flex items-center gap-2">
            <span class="text-2xl">🎯</span>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Plan-Specific Rules</h2>
          </div>
          <button
            (click)="showAddRuleModal = true"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-600 text-white rounded hover:bg-primary-700 transition shadow-sm"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Add Rule
          </button>
        </div>

        <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
          Override default renewal behavior for specific plans
        </p>

        @if (planRules().length === 0) {
          <div class="py-8 text-center">
            <span class="text-4xl mb-2 block">📋</span>
            <p class="text-sm text-gray-500 dark:text-gray-400">No custom rules defined</p>
          </div>
        } @else {
          <div class="space-y-2">
            @for (rule of planRules(); track rule.id) {
              <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded">
                <div class="flex-1">
                  <p class="font-medium text-sm text-gray-900 dark:text-white">{{ rule.planName }}</p>
                  <p class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                    {{ getRenewalBehaviorLabel(rule.behavior) }} • Grace period: {{ rule.gracePeriodDays }} days
                  </p>
                </div>
                <div class="flex items-center gap-2">
                  <button
                    class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition"
                  >
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                    Edit
                  </button>
                  <button
                    (click)="deleteRule(rule.id)"
                    class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                  >
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                    Delete
                  </button>
                </div>
              </div>
            }
          </div>
        }
      </div>

      <!-- Save Actions -->
      <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
        <button
          class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          Reset to Defaults
        </button>
        <button
          (click)="saveSettings()"
          class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded hover:bg-primary-700 transition shadow-sm"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          Save Settings
        </button>
      </div>
    </div>
  `
})
export class RenewalSettingsComponent {
  settings = signal<RenewalSettings>({
    defaultBehavior: 'auto_renew',
    gracePeriodDays: 7,
    maxRetryAttempts: 3,
    retryIntervalDays: 3,
    emailReminders: true,
    emailReminderDays: [30, 7, 3],
    smsReminders: false,
    smsReminderDays: [3, 1],
    autoDisableAfterFailed: true,
    notifyAdminOnFailure: true
  });

  planRules = signal<PlanRenewalRule[]>([
    { id: 1, planName: 'Enterprise Plan', behavior: 'auto_renew', gracePeriodDays: 14 },
    { id: 2, planName: 'Starter Plan', behavior: 'manual_renew', gracePeriodDays: 3 }
  ]);

  showAddRuleModal = false;

  toggleEmailReminder(day: number) {
    const days = this.settings().emailReminderDays;
    if (days.includes(day)) {
      this.settings().emailReminderDays = days.filter(d => d !== day);
    } else {
      this.settings().emailReminderDays = [...days, day].sort((a, b) => b - a);
    }
  }

  toggleSmsReminder(day: number) {
    const days = this.settings().smsReminderDays;
    if (days.includes(day)) {
      this.settings().smsReminderDays = days.filter(d => d !== day);
    } else {
      this.settings().smsReminderDays = [...days, day].sort((a, b) => b - a);
    }
  }

  getRenewalBehaviorLabel(behavior: string): string {
    const labels: Record<string, string> = {
      auto_renew: 'Auto-Renew',
      manual_renew: 'Manual Renewal',
      no_renew: 'No Renewal'
    };
    return labels[behavior] || behavior;
  }

  deleteRule(id: number) {
    if (confirm('Are you sure you want to delete this rule?')) {
      this.planRules.update(rules => rules.filter(r => r.id !== id));
    }
  }

  saveSettings() {
    console.log('Saving renewal settings:', this.settings());
    alert('Renewal settings saved successfully!');
  }
}
