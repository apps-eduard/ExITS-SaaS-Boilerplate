import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-notification-rules',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">🔔 Notification Rules</h1>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Configure system notification preferences
          </p>
        </div>
        <button
          (click)="saveSettings()"
          [disabled]="saving()"
          class="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded shadow-sm transition-colors"
        >
          <span class="inline-flex items-center gap-1.5">
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            {{ saving() ? 'Saving...' : 'Save Changes' }}
          </span>
        </button>
      </div>

      <!-- Notification Categories -->
      <div class="grid gap-3">
        @for (category of categories(); track category.id) {
          <div class="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
            <div class="flex items-start justify-between mb-2">
              <div>
                <h3 class="text-sm font-medium text-gray-900 dark:text-white">{{ category.name }}</h3>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ category.description }}</p>
              </div>
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  [(ngModel)]="category.enabled"
                  class="w-3.5 h-3.5 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                />
                <span class="text-xs text-gray-700 dark:text-gray-300">Enabled</span>
              </label>
            </div>

            @if (category.enabled) {
              <div class="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex gap-4 text-xs">
                <label class="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    [(ngModel)]="category.email"
                    class="w-3 h-3 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span class="text-gray-700 dark:text-gray-300">📧 Email</span>
                </label>
                <label class="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    [(ngModel)]="category.sms"
                    class="w-3 h-3 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span class="text-gray-700 dark:text-gray-300">💬 SMS</span>
                </label>
                <label class="flex items-center gap-1.5 cursor-pointer">
                  <input
                    type="checkbox"
                    [(ngModel)]="category.push"
                    class="w-3 h-3 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                  />
                  <span class="text-gray-700 dark:text-gray-300">🔔 Push</span>
                </label>
              </div>
            }
          </div>
        }
      </div>

      @if (successMessage()) {
        <div class="rounded border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-3">
          <p class="text-xs text-green-800 dark:text-green-200">{{ successMessage() }}</p>
        </div>
      }
    </div>
  `
})
export class NotificationRulesComponent {
  saving = signal(false);
  successMessage = signal('');

  categories = signal([
    {
      id: 1,
      name: 'New User Registration',
      description: 'Notify when a new user registers',
      enabled: true,
      email: true,
      sms: false,
      push: true
    },
    {
      id: 2,
      name: 'Subscription Changes',
      description: 'Notify when subscription status changes',
      enabled: true,
      email: true,
      sms: true,
      push: true
    },
    {
      id: 3,
      name: 'Payment Received',
      description: 'Notify when payment is received',
      enabled: true,
      email: true,
      sms: false,
      push: false
    },
    {
      id: 4,
      name: 'System Alerts',
      description: 'Notify on system errors and warnings',
      enabled: true,
      email: true,
      sms: true,
      push: true
    },
    {
      id: 5,
      name: 'Backup Completed',
      description: 'Notify when system backup completes',
      enabled: false,
      email: false,
      sms: false,
      push: false
    }
  ]);

  saveSettings(): void {
    this.saving.set(true);
    this.successMessage.set('');

    setTimeout(() => {
      this.saving.set(false);
      this.successMessage.set('✅ Notification rules saved successfully!');
      setTimeout(() => this.successMessage.set(''), 3000);
    }, 800);
  }
}
