import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface GeneralSetting {
  key: string;
  value: string;
  label: string;
  description: string;
  type: 'text' | 'select' | 'boolean';
  options?: string[];
  maxLength?: number;
}

@Component({
  selector: 'app-general-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">🔧 General Settings</h1>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Configure basic application settings
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

      <!-- Settings Grid -->
      <div class="grid gap-3">
        @for (setting of settings(); track setting.key) {
          <div class="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
            <label class="block text-xs font-medium text-gray-900 dark:text-white mb-1">
              {{ setting.label }}
            </label>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">{{ setting.description }}</p>

            @if (setting.type === 'text') {
              <input
                type="text"
                [(ngModel)]="setting.value"
                [attr.maxlength]="setting.maxLength"
                class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
              @if (setting.maxLength) {
                <p class="text-xs text-gray-400 mt-1">Max {{ setting.maxLength }} characters</p>
              }
            } @else if (setting.type === 'select' && setting.options) {
              <select
                [(ngModel)]="setting.value"
                class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                @for (option of setting.options; track option) {
                  <option [value]="option">{{ option }}</option>
                }
              </select>
            } @else if (setting.type === 'boolean') {
              <label class="flex items-center gap-2 cursor-pointer">
                <input
                  type="checkbox"
                  [checked]="setting.value === 'true'"
                  (change)="toggleBoolean(setting)"
                  class="w-3.5 h-3.5 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                />
                <span class="text-xs text-gray-700 dark:text-gray-300">Enabled</span>
              </label>
            }
          </div>
        }
      </div>

      @if (successMessage()) {
        <div class="rounded border border-green-200 dark:border-green-800 bg-green-50 dark:bg-green-900/20 p-3">
          <p class="text-xs text-green-800 dark:text-green-200">{{ successMessage() }}</p>
        </div>
      }

      @if (errorMessage()) {
        <div class="rounded border border-red-200 dark:border-red-800 bg-red-50 dark:bg-red-900/20 p-3">
          <p class="text-xs text-red-800 dark:text-red-200">{{ errorMessage() }}</p>
        </div>
      }
    </div>
  `
})
export class GeneralSettingsComponent {
  private http = inject(HttpClient);

  saving = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  settings = signal<GeneralSetting[]>([
    {
      key: 'APP_NAME',
      value: 'ExITS SaaS',
      label: 'Application Name',
      description: 'Display name for your application',
      type: 'text',
      maxLength: 50
    },
    {
      key: 'APP_URL',
      value: 'http://localhost:4200',
      label: 'Application URL',
      description: 'Base URL of your application',
      type: 'text',
      maxLength: 255
    },
    {
      key: 'TIMEZONE',
      value: 'UTC',
      label: 'Default Timezone',
      description: 'Timezone for system operations',
      type: 'select',
      options: ['UTC', 'America/New_York', 'America/Los_Angeles', 'Europe/London', 'Asia/Tokyo', 'Asia/Manila']
    },
    {
      key: 'MAINTENANCE_MODE',
      value: 'false',
      label: 'Maintenance Mode',
      description: 'Enable maintenance mode to prevent user access',
      type: 'boolean'
    }
  ]);

  saveSettings(): void {
    this.saving.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    // Simulate API call
    setTimeout(() => {
      this.saving.set(false);
      this.successMessage.set('✅ Settings saved successfully!');

      setTimeout(() => this.successMessage.set(''), 3000);
    }, 800);

    // TODO: Implement actual API call
    // this.http.post('/api/settings/general', this.settings())
    //   .subscribe({
    //     next: () => {
    //       this.saving.set(false);
    //       this.successMessage.set('✅ Settings saved successfully!');
    //       setTimeout(() => this.successMessage.set(''), 3000);
    //     },
    //     error: (error) => {
    //       this.saving.set(false);
    //       this.errorMessage.set('❌ Failed to save settings');
    //       setTimeout(() => this.errorMessage.set(''), 5000);
    //     }
    //   });
  }

  toggleBoolean(setting: GeneralSetting): void {
    setting.value = setting.value === 'true' ? 'false' : 'true';
  }
}
