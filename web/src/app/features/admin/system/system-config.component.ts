import { Component, OnInit, signal, inject, computed, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

interface ConfigSetting {
  key: string;
  value: string;
  category: string;
  description: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  options?: string[];
  min?: number;
  max?: number;
  maxLength?: number;
}

@Component({
  selector: 'app-system-config',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">⚙️ System Configuration</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage system-wide configuration settings
          </p>
        </div>
        <button
          (click)="saveConfiguration()"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          💾 Save Changes
        </button>
      </div>

      <!-- Category Tabs -->
      <div class="border-b border-gray-200 dark:border-gray-700">
        <nav class="flex gap-4">
          @for (category of categories(); track category) {
            <button
              (click)="selectedCategory.set(category)"
              class="px-4 py-2 text-sm font-medium border-b-2 transition-colors"
              [ngClass]="selectedCategory() === category
                ? 'border-blue-600 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300'"
            >
              {{ category }}
            </button>
          }
        </nav>
      </div>

      <!-- Configuration Settings -->
      <div [ngClass]="selectedCategory() === 'Security & Policies' ? 'grid md:grid-cols-2 gap-4' : 'space-y-4'">
        @for (setting of filteredSettings(); track setting.key) {
          <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
            <div class="p-4">
              <div class="flex items-start justify-between gap-4">
                <div class="flex-1 min-w-0">
                  <label class="block text-sm font-medium text-gray-900 dark:text-white mb-1 truncate" [title]="setting.key">
                    {{ setting.key }}
                  </label>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">{{ setting.description }}</p>

                  @if (setting.type === 'text' || setting.type === 'number') {
                    <input
                      [type]="setting.type"
                      [(ngModel)]="setting.value"
                      [min]="setting.min"
                      [max]="setting.max"
                      [attr.maxlength]="setting.maxLength"
                      class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                    />
                    @if (setting.type === 'number' && (setting.min !== undefined || setting.max !== undefined)) {
                      <p class="text-xs text-gray-400 mt-1">
                        Range: {{ setting.min ?? 0 }} - {{ setting.max ?? '∞' }}
                      </p>
                    }
                    @if (setting.type === 'text' && setting.maxLength) {
                      <p class="text-xs text-gray-400 mt-1">
                        Max {{ setting.maxLength }} characters
                      </p>
                    }
                  } @else if (setting.type === 'boolean') {
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        [checked]="setting.value === 'true'"
                        (change)="toggleBoolean(setting)"
                        class="w-4 h-4 text-blue-600 bg-gray-100 dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500 dark:focus:ring-blue-600"
                      />
                      <span class="text-sm text-gray-700 dark:text-gray-300">Enabled</span>
                    </label>
                  } @else if (setting.type === 'select' && setting.options) {
                    <select
                      [(ngModel)]="setting.value"
                      class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                    >
                      @for (option of setting.options; track option) {
                        <option [value]="option">{{ option }}</option>
                      }
                    </select>
                  }
                </div>

                <button
                  (click)="resetSetting(setting)"
                  class="flex-shrink-0 px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
                  title="Reset to default"
                >
                  ↺
                </button>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Danger Zone -->
      <div class="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/10 overflow-hidden">
        <div class="px-4 py-3 border-b border-red-200 dark:border-red-900 bg-red-100 dark:bg-red-900/20">
          <h2 class="text-sm font-semibold text-red-900 dark:text-red-200">⚠️ Danger Zone</h2>
        </div>
        <div class="p-4 space-y-3">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">Clear Application Cache</p>
              <p class="text-xs text-gray-600 dark:text-gray-400">Remove all cached data from the system</p>
            </div>
            <button class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
              Clear Cache
            </button>
          </div>

          <div class="flex items-center justify-between pt-3 border-t border-red-200 dark:border-red-900">
            <div>
              <p class="text-sm font-medium text-gray-900 dark:text-white">Reset All Settings</p>
              <p class="text-xs text-gray-600 dark:text-gray-400">Restore all configuration to default values</p>
            </div>
            <button class="px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors">
              Reset All
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class SystemConfigComponent implements OnInit {
  private authService = inject(AuthService);

  selectedCategory = signal<string>('General');
  categories = signal<string[]>(['General', 'Security & Policies', 'Email', 'Storage', 'Performance']);

  settings = signal<ConfigSetting[]>([
    // General
    { key: 'APP_NAME', value: 'ExITS SaaS', category: 'General', description: 'Application display name', type: 'text', maxLength: 50 },
    { key: 'APP_URL', value: 'http://localhost:4200', category: 'General', description: 'Base application URL', type: 'text', maxLength: 255 },
    { key: 'TIMEZONE', value: 'UTC', category: 'General', description: 'Default timezone', type: 'select', options: ['UTC', 'America/New_York', 'Europe/London', 'Asia/Tokyo'] },
    { key: 'MAINTENANCE_MODE', value: 'false', category: 'General', description: 'Enable maintenance mode', type: 'boolean' },

    // Security & Policies
    { key: 'SESSION_LIFETIME', value: '120', category: 'Security & Policies', description: 'Session timeout in minutes', type: 'number', min: 5, max: 1440 },
    { key: 'MAX_LOGIN_ATTEMPTS', value: '5', category: 'Security & Policies', description: 'Maximum failed login attempts', type: 'number', min: 1, max: 20 },
    { key: 'PASSWORD_MIN_LENGTH', value: '8', category: 'Security & Policies', description: 'Minimum password length', type: 'number', min: 6, max: 32 },
    { key: 'PASSWORD_REQUIRE_SPECIAL_CHARS', value: 'true', category: 'Security & Policies', description: 'Require special characters in passwords', type: 'boolean' },
    { key: 'PASSWORD_EXPIRY_DAYS', value: '90', category: 'Security & Policies', description: 'Password expiry in days (0 = never)', type: 'number', min: 0, max: 365 },
    { key: 'REQUIRE_2FA', value: 'false', category: 'Security & Policies', description: 'Require two-factor authentication', type: 'boolean' },
    { key: 'ENFORCE_2FA_ALL_USERS', value: 'false', category: 'Security & Policies', description: 'Enforce 2FA for all users', type: 'boolean' },
    { key: 'ENFORCE_2FA_ADMIN_ONLY', value: 'true', category: 'Security & Policies', description: 'Enforce 2FA for admin users only', type: 'boolean' },
    { key: 'DEFAULT_USER_ROLE', value: 'user', category: 'Security & Policies', description: 'Default role for new users', type: 'select', options: ['user', 'editor', 'admin'] },
    { key: 'ALLOW_USER_REGISTRATION', value: 'false', category: 'Security & Policies', description: 'Allow public user registration', type: 'boolean' },

    // Email
    { key: 'MAIL_DRIVER', value: 'smtp', category: 'Email', description: 'Email delivery method', type: 'select', options: ['smtp', 'sendgrid', 'mailgun'] },
    { key: 'MAIL_FROM_ADDRESS', value: 'noreply@exits.com', category: 'Email', description: 'Default sender email', type: 'text', maxLength: 100 },
    { key: 'MAIL_FROM_NAME', value: 'ExITS SaaS', category: 'Email', description: 'Default sender name', type: 'text', maxLength: 50 },

    // Storage
    { key: 'STORAGE_DRIVER', value: 'local', category: 'Storage', description: 'File storage driver', type: 'select', options: ['local', 's3', 'azure'] },
    { key: 'MAX_UPLOAD_SIZE', value: '10', category: 'Storage', description: 'Maximum file upload size (MB)', type: 'number', min: 1, max: 100 },

    // Performance
    { key: 'CACHE_DRIVER', value: 'redis', category: 'Performance', description: 'Cache storage driver', type: 'select', options: ['redis', 'memcached', 'file'] },
    { key: 'CACHE_TTL', value: '3600', category: 'Performance', description: 'Default cache TTL in seconds', type: 'number', min: 60, max: 86400 },
    { key: 'ENABLE_QUERY_CACHE', value: 'true', category: 'Performance', description: 'Enable database query caching', type: 'boolean' }
  ]);

  filteredSettings = computed(() =>
    this.settings().filter(s => s.category === this.selectedCategory())
  );

  ngOnInit(): void {
    console.log('⚙️ SystemConfigComponent initialized');
  }

  saveConfiguration(): void {
    console.log('💾 Saving configuration...', this.settings());
    // In production, this would call the backend API
    alert('Configuration saved successfully!');
  }

  toggleBoolean(setting: ConfigSetting): void {
    setting.value = setting.value === 'true' ? 'false' : 'true';
  }

  resetSetting(setting: ConfigSetting): void {
    console.log('↺ Resetting setting:', setting.key);
    // In production, this would fetch the default value from the backend
  }
}
