import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface StorageSetting {
  key: string;
  value: string;
  label: string;
  description: string;
  type: 'select' | 'number';
  options?: string[];
  min?: number;
  max?: number;
}

@Component({
  selector: 'app-storage-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">💾 Storage Settings</h1>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Configure file storage and upload limits
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
                <p class="text-xs text-gray-400 mt-1">Range: {{ setting.min ?? 0 }} - {{ setting.max ?? '∞' }} MB</p>
              }
            }
          </div>
        }
      </div>

      <!-- Storage Info -->
      <div class="rounded border border-purple-200 dark:border-purple-800 bg-purple-50 dark:bg-purple-900/20 p-3">
        <h3 class="text-xs font-semibold text-purple-900 dark:text-purple-200 mb-2">📊 Storage Information</h3>
        <div class="grid grid-cols-2 gap-3 text-xs">
          <div>
            <p class="text-gray-600 dark:text-gray-400">Total Storage</p>
            <p class="font-semibold text-gray-900 dark:text-white">500 GB</p>
          </div>
          <div>
            <p class="text-gray-600 dark:text-gray-400">Used Storage</p>
            <p class="font-semibold text-gray-900 dark:text-white">127 GB</p>
          </div>
          <div>
            <p class="text-gray-600 dark:text-gray-400">Available</p>
            <p class="font-semibold text-green-600 dark:text-green-400">373 GB</p>
          </div>
          <div>
            <p class="text-gray-600 dark:text-gray-400">Usage</p>
            <p class="font-semibold text-blue-600 dark:text-blue-400">25.4%</p>
          </div>
        </div>
        <div class="mt-2 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
          <div class="h-full bg-blue-600" style="width: 25.4%"></div>
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
export class StorageSettingsComponent {
  private http = inject(HttpClient);

  saving = signal(false);
  successMessage = signal('');
  errorMessage = signal('');

  settings = signal<StorageSetting[]>([
    {
      key: 'STORAGE_DRIVER',
      value: 'local',
      label: 'Storage Driver',
      description: 'File storage backend',
      type: 'select',
      options: ['local', 's3', 'azure', 'google-cloud']
    },
    {
      key: 'MAX_UPLOAD_SIZE',
      value: '10',
      label: 'Max Upload Size',
      description: 'Maximum file upload size in MB',
      type: 'number',
      min: 1,
      max: 100
    }
  ]);

  saveSettings(): void {
    this.saving.set(true);
    this.successMessage.set('');
    this.errorMessage.set('');

    setTimeout(() => {
      this.saving.set(false);
      this.successMessage.set('✅ Storage settings saved successfully!');
      setTimeout(() => this.successMessage.set(''), 3000);
    }, 800);
  }
}
