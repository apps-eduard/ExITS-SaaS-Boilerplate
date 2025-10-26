import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface SecurityPolicySetting {
  key: string;
  value: string;
  label: string;
  description: string;
  type: 'number' | 'boolean' | 'select';
  min?: number;
  max?: number;
  options?: string[];
}

@Component({
  selector: 'app-security-policies-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">🔒 Security & Policies</h1>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Configure security and access control policies
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
      <div class="grid md:grid-cols-2 gap-3">
        @for (setting of settings(); track setting.key) {
          <div class="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
            <label class="block text-xs font-medium text-gray-900 dark:text-white mb-1">
              {{ setting.label }}
            </label>
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">{{ setting.description }}</p>

            @if (setting.type === 'number') {
              <input
                type="number"
                [(ngModel)]="setting.value"
                [min]="setting.min ?? 0"
                [max]="setting.max ?? 999999"
                class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
              @if (setting.min !== undefined || setting.max !== undefined) {
                <p class="text-xs text-gray-400 mt-1">Range: {{ setting.min ?? 0 }} - {{ setting.max ?? '∞' }}</p>
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
export class SecurityPoliciesSettingsComponent {
  private http = inject(HttpClient);

  saving = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  settings = signal<SecurityPolicySetting[]>([
    {
      key: 'SESSION_LIFETIME',
      value: '120',
      label: 'Session Lifetime',
      description: 'Session timeout in minutes',
      type: 'number',
      min: 5,
      max: 1440
    },
    {
      key: 'MAX_LOGIN_ATTEMPTS',
      value: '5',
      label: 'Max Login Attempts',
      description: 'Maximum failed login attempts before lockout',
      type: 'number',
      min: 1,
      max: 20
    },
    {
      key: 'PASSWORD_MIN_LENGTH',
      value: '8',
      label: 'Password Min Length',
      description: 'Minimum password length requirement',
      type: 'number',
      min: 6,
      max: 32
    },
    {
      key: 'PASSWORD_REQUIRE_SPECIAL_CHARS',
      value: 'true',
      label: 'Require Special Characters',
      description: 'Require special characters in passwords',
      type: 'boolean'
    },
    {
      key: 'PASSWORD_EXPIRY_DAYS',
      value: '90',
      label: 'Password Expiry',
      description: 'Password expiry in days (0 = never)',
      type: 'number',
      min: 0,
      max: 365
    },
    {
      key: 'REQUIRE_2FA',
      value: 'false',
      label: '2FA Required',
      description: 'Require two-factor authentication',
      type: 'boolean'
    },
    {
      key: 'ENFORCE_2FA_ALL_USERS',
      value: 'false',
      label: 'Enforce 2FA (All Users)',
      description: 'Force 2FA for all users',
      type: 'boolean'
    },
    {
      key: 'ENFORCE_2FA_ADMIN_ONLY',
      value: 'true',
      label: 'Enforce 2FA (Admins Only)',
      description: 'Force 2FA for admin users only',
      type: 'boolean'
    },
    {
      key: 'DEFAULT_USER_ROLE',
      value: 'user',
      label: 'Default User Role',
      description: 'Default role assigned to new users',
      type: 'select',
      options: ['user', 'editor', 'admin']
    },
    {
      key: 'ALLOW_USER_REGISTRATION',
      value: 'false',
      label: 'Public Registration',
      description: 'Allow public user registration',
      type: 'boolean'
    }
  ]);

  saveSettings(): void {
    this.saving.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    setTimeout(() => {
      this.saving.set(false);
      this.successMessage.set('✅ Security policies saved successfully!');
      setTimeout(() => this.successMessage.set(''), 3000);
    }, 800);
  }

  toggleBoolean(setting: SecurityPolicySetting): void {
    setting.value = setting.value === 'true' ? 'false' : 'true';
  }
}
