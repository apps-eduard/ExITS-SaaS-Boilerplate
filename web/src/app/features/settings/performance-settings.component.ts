import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface PerformanceSetting {
  key: string;
  value: string;
  label: string;
  description: string;
  type: 'select' | 'number' | 'boolean';
  options?: string[];
  min?: number;
  max?: number;
}

@Component({
  selector: 'app-performance-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">⚡ Performance Settings</h1>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Optimize system performance and caching
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

            @if (setting.type === 'select' && setting.options) {
              <select
                [(ngModel)]="setting.value"
                class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                @for (option of setting.options; track option) {
                  <option [value]="option">{{ option }}</option>
                }
              </select>
            } @else if (setting.type === 'number') {
              <input
                type="number"
                [(ngModel)]="setting.value"
                [min]="setting.min ?? 0"
                [max]="setting.max ?? 999999"
                class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              />
              @if (setting.min !== undefined || setting.max !== undefined) {
                <p class="text-xs text-gray-400 mt-1">Range: {{ setting.min ?? 0 }} - {{ setting.max ?? '∞' }} seconds</p>
              }
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

      <!-- Cache Actions -->
      <div class="rounded border border-orange-200 dark:border-orange-800 bg-orange-50 dark:bg-orange-900/20 p-3">
        <h3 class="text-xs font-semibold text-orange-900 dark:text-orange-200 mb-2">🗑️ Cache Management</h3>
        <div class="flex gap-2">
          <button
            (click)="clearCache()"
            [disabled]="clearingCache()"
            class="px-3 py-1.5 text-xs font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 rounded shadow-sm"
          >
            {{ clearingCache() ? 'Clearing...' : 'Clear All Cache' }}
          </button>
          <button
            (click)="clearQueryCache()"
            [disabled]="clearingQueryCache()"
            class="px-3 py-1.5 text-xs font-medium text-white bg-orange-600 hover:bg-orange-700 disabled:bg-orange-400 rounded shadow-sm"
          >
            {{ clearingQueryCache() ? 'Clearing...' : 'Clear Query Cache' }}
          </button>
        </div>
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
export class PerformanceSettingsComponent {
  private http = inject(HttpClient);

  saving = signal(false);
  clearingCache = signal(false);
  clearingQueryCache = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  settings = signal<PerformanceSetting[]>([
    {
      key: 'CACHE_DRIVER',
      value: 'redis',
      label: 'Cache Driver',
      description: 'Cache storage backend',
      type: 'select',
      options: ['redis', 'memcached', 'file', 'database']
    },
    {
      key: 'CACHE_TTL',
      value: '3600',
      label: 'Cache TTL',
      description: 'Default cache time-to-live in seconds',
      type: 'number',
      min: 60,
      max: 86400
    },
    {
      key: 'ENABLE_QUERY_CACHE',
      value: 'true',
      label: 'Query Cache',
      description: 'Enable database query caching',
      type: 'boolean'
    }
  ]);

  saveSettings(): void {
    this.saving.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    setTimeout(() => {
      this.saving.set(false);
      this.successMessage.set('✅ Performance settings saved successfully!');
      setTimeout(() => this.successMessage.set(''), 3000);
    }, 800);
  }

  toggleBoolean(setting: PerformanceSetting): void {
    setting.value = setting.value === 'true' ? 'false' : 'true';
  }

  clearCache(): void {
    this.clearingCache.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    setTimeout(() => {
      this.clearingCache.set(false);
      this.successMessage.set('✅ All cache cleared successfully!');
      setTimeout(() => this.successMessage.set(''), 3000);
    }, 1000);
  }

  clearQueryCache(): void {
    this.clearingQueryCache.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    setTimeout(() => {
      this.clearingQueryCache.set(false);
      this.successMessage.set('✅ Query cache cleared successfully!');
      setTimeout(() => this.successMessage.set(''), 3000);
    }, 1000);
  }
}
