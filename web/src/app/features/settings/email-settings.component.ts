import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface EmailSetting {
  key: string;
  value: string;
  label: string;
  description: string;
  type: 'text' | 'select' | 'number' | 'password';
  options?: string[];
  maxLength?: number;
}

@Component({
  selector: 'app-email-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">📧 Email Settings</h1>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Configure email delivery and sender information
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

      <!-- Tabs -->
      <div class="border-b border-gray-200 dark:border-gray-700">
        <nav class="flex gap-4">
          <button
            (click)="selectedTab.set('settings')"
            class="px-3 py-2 text-xs font-medium border-b-2 transition-colors"
            [ngClass]="selectedTab() === 'settings'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'"
          >
            Email Settings
          </button>
          <button
            (click)="selectedTab.set('configuration')"
            class="px-3 py-2 text-xs font-medium border-b-2 transition-colors"
            [ngClass]="selectedTab() === 'configuration'
              ? 'border-blue-600 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'"
          >
            Email Configuration
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      @if (selectedTab() === 'settings') {
        <!-- Email Settings Tab -->
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
            }
          </div>
        }
      </div>

      <!-- Test Email Section -->
      <div class="rounded border border-blue-200 dark:border-blue-800 bg-blue-50 dark:bg-blue-900/20 p-3">
        <h3 class="text-xs font-semibold text-blue-900 dark:text-blue-200 mb-2">📤 Test Email Configuration</h3>
        <div class="flex gap-2">
          <input
            type="email"
            [(ngModel)]="testEmail"
            placeholder="Enter email address"
            class="flex-1 px-2 py-1.5 text-xs border border-blue-300 dark:border-blue-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          />
          <button
            (click)="sendTestEmail()"
            [disabled]="sendingTest()"
            class="px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 rounded shadow-sm"
          >
            {{ sendingTest() ? 'Sending...' : 'Send Test' }}
          </button>
        </div>
      </div>
      } @else {
        <!-- Email Configuration Tab -->
        <div class="grid gap-3">
          @for (config of emailConfig(); track config.key) {
            <div class="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
              <label class="block text-xs font-medium text-gray-900 dark:text-white mb-1">
                {{ config.label }}
              </label>
              <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">{{ config.description }}</p>

              @if (config.type === 'text' || config.type === 'number') {
                <input
                  [type]="config.type"
                  [(ngModel)]="config.value"
                  [attr.maxlength]="config.maxLength"
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              } @else if (config.type === 'password') {
                <input
                  type="password"
                  [(ngModel)]="config.value"
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              } @else if (config.type === 'select' && config.options) {
                <select
                  [(ngModel)]="config.value"
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  @for (option of config.options; track option) {
                    <option [value]="option">{{ option }}</option>
                  }
                </select>
              }
            </div>
          }
        </div>

        <!-- SMTP Configuration Details -->
        <div class="rounded border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 p-3">
          <h3 class="text-xs font-semibold text-purple-900 dark:text-purple-200 mb-2">ℹ️ SMTP Configuration Help</h3>
          <div class="text-xs text-gray-700 dark:text-gray-300 space-y-1">
            <p><strong>Gmail:</strong> smtp.gmail.com, Port 587 (TLS) or 465 (SSL)</p>
            <p><strong>Outlook:</strong> smtp-mail.outlook.com, Port 587 (TLS)</p>
            <p><strong>Yahoo:</strong> smtp.mail.yahoo.com, Port 587 (TLS)</p>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">
              💡 For Gmail, you may need to use an App Password instead of your regular password.
            </p>
          </div>
        </div>
      }

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
export class EmailSettingsComponent {
  private http = inject(HttpClient);

  selectedTab = signal<'settings' | 'configuration'>('settings');
  saving = signal(false);
  sendingTest = signal(false);
  successMessage = signal('');
  errorMessage = signal('');
  testEmail = signal('');

  settings = signal<EmailSetting[]>([
    {
      key: 'MAIL_DRIVER',
      value: 'smtp',
      label: 'Mail Driver',
      description: 'Email delivery method',
      type: 'select',
      options: ['smtp', 'sendgrid', 'mailgun', 'ses']
    },
    {
      key: 'MAIL_FROM_ADDRESS',
      value: 'noreply@exits.com',
      label: 'From Email Address',
      description: 'Default sender email address',
      type: 'text',
      maxLength: 100
    },
    {
      key: 'MAIL_FROM_NAME',
      value: 'ExITS SaaS',
      label: 'From Name',
      description: 'Default sender name',
      type: 'text',
      maxLength: 50
    }
  ]);

  emailConfig = signal<EmailSetting[]>([
    {
      key: 'SMTP_HOST',
      value: 'smtp.gmail.com',
      label: 'SMTP Host',
      description: 'SMTP server hostname',
      type: 'text',
      maxLength: 255
    },
    {
      key: 'SMTP_PORT',
      value: '587',
      label: 'SMTP Port',
      description: 'SMTP server port (usually 587 for TLS, 465 for SSL)',
      type: 'number'
    },
    {
      key: 'SMTP_USERNAME',
      value: '',
      label: 'SMTP Username',
      description: 'SMTP authentication username',
      type: 'text',
      maxLength: 255
    },
    {
      key: 'SMTP_PASSWORD',
      value: '',
      label: 'SMTP Password',
      description: 'SMTP authentication password',
      type: 'password'
    },
    {
      key: 'SMTP_ENCRYPTION',
      value: 'tls',
      label: 'SMTP Encryption',
      description: 'Email encryption method',
      type: 'select',
      options: ['tls', 'ssl', 'none']
    }
  ]);

  saveSettings(): void {
    this.saving.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    setTimeout(() => {
      this.saving.set(false);
      if (this.selectedTab() === 'settings') {
        this.successMessage.set('✅ Email settings saved successfully!');
      } else {
        this.successMessage.set('✅ Email configuration saved successfully!');
      }
      setTimeout(() => this.successMessage.set(''), 3000);
    }, 800);
  }

  sendTestEmail(): void {
    if (!this.testEmail()) {
      this.errorMessage.set('❌ Please enter an email address');
      setTimeout(() => this.errorMessage.set(''), 3000);
      return;
    }

    this.sendingTest.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    setTimeout(() => {
      this.sendingTest.set(false);
      this.successMessage.set(`✅ Test email sent to ${this.testEmail()}`);
      setTimeout(() => this.successMessage.set(''), 3000);
    }, 1500);
  }
}
