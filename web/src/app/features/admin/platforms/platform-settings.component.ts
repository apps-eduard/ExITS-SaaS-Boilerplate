import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Category {
  id: number;
  name: string;
  productCount: number;
}

interface ProductAttribute {
  id: number;
  name: string;
  type: 'text' | 'number' | 'boolean' | 'select';
  required: boolean;
}

@Component({
  selector: 'app-platform-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 sm:p-6 space-y-4">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Platform Settings</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Configure system-wide Platform Settings, categories, and behavior
          </p>
        </div>
      </div>

      <!-- General Settings -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
          <span>⚙️</span>
          General Settings
        </h3>

        <div class="space-y-4">
          <!-- Default Pricing Settings -->
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Default Currency
              </label>
              <select
                [(ngModel)]="settings.defaultCurrency"
                class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              >
                <option value="PHP">🇵🇭 PHP - Philippine Peso</option>
                <option value="USD">🇺🇸 USD - US Dollar</option>
                <option value="EUR">🇪🇺 EUR - Euro</option>
              </select>
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Default Tax Rate (%)
              </label>
              <input
                type="number"
                [(ngModel)]="settings.defaultTaxRate"
                step="0.01"
                class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Max Discount (%)
              </label>
              <input
                type="number"
                [(ngModel)]="settings.maxDiscount"
                step="0.01"
                max="100"
                class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Price Decimal Places
              </label>
              <select
                [(ngModel)]="settings.priceDecimalPlaces"
                class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              >
                <option value="0">0 (whole numbers)</option>
                <option value="2">2 (e.g., 99.99)</option>
                <option value="4">4 (e.g., 99.9999)</option>
              </select>
            </div>
          </div>

          <!-- Feature Toggles -->
          <div class="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Feature Toggles</h4>
            <div class="space-y-3">
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  [(ngModel)]="settings.enableVariants"
                  class="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <span class="text-sm font-medium text-gray-900 dark:text-white">Enable Product Variants</span>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Allow products to have multiple variants (size, color, etc.)</p>
                </div>
              </label>

              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  [(ngModel)]="settings.enableInventoryTracking"
                  class="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <span class="text-sm font-medium text-gray-900 dark:text-white">Enable Inventory Tracking</span>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Track stock levels and availability</p>
                </div>
              </label>

              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  [(ngModel)]="settings.enableAutomaticUpdates"
                  class="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <span class="text-sm font-medium text-gray-900 dark:text-white">Enable Automatic Updates</span>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Automatically sync product changes across tenants</p>
                </div>
              </label>

              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  [(ngModel)]="settings.requireApproval"
                  class="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                />
                <div>
                  <span class="text-sm font-medium text-gray-900 dark:text-white">Require Approval for New Products</span>
                  <p class="text-xs text-gray-500 dark:text-gray-400">New products need admin approval before going live</p>
                </div>
              </label>
            </div>
          </div>

          <!-- Notifications -->
          <div class="border-t border-gray-200 dark:border-gray-700 pt-4 mt-4">
            <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Notifications & Alerts</h4>
            <div class="space-y-3">
              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  [(ngModel)]="settings.notifyProductUpdates"
                  class="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                />
                <span class="text-sm text-gray-900 dark:text-white">Notify on product updates</span>
              </label>

              <label class="flex items-center gap-3 cursor-pointer">
                <input
                  type="checkbox"
                  [(ngModel)]="settings.notifyLowStock"
                  class="rounded border-gray-300 dark:border-gray-600 text-primary-600 focus:ring-primary-500"
                />
                <span class="text-sm text-gray-900 dark:text-white">Alert when stock is low</span>
              </label>

              <div class="ml-6 mt-2">
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Low Stock Threshold
                </label>
                <input
                  type="number"
                  [(ngModel)]="settings.lowStockThreshold"
                  class="w-32 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                />
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Categories Management -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span>📁</span>
            Product Categories
          </h3>
          <button
            (click)="addCategory()"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-600 text-white rounded hover:bg-primary-700 transition"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Add Category
          </button>
        </div>

        <div class="p-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            @for (category of categories(); track category.id) {
              <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ category.name }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ category.productCount }} products</p>
                </div>
                <div class="flex items-center gap-1">
                  <button
                    (click)="editCategory(category)"
                    class="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition"
                    title="Edit"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                    </svg>
                  </button>
                  <button
                    (click)="deleteCategory(category)"
                    class="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                    title="Delete"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                    </svg>
                  </button>
                </div>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Product Attributes -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
        <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span>🏷️</span>
            Product Attributes
          </h3>
          <button
            (click)="addAttribute()"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-600 text-white rounded hover:bg-primary-700 transition"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Add Attribute
          </button>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Name</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Type</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Required</th>
                <th class="px-4 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              @for (attr of attributes(); track attr.id) {
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td class="px-4 py-3 text-xs font-medium text-gray-900 dark:text-white">{{ attr.name }}</td>
                  <td class="px-4 py-3">
                    <span class="px-2 py-0.5 text-xs rounded bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300">
                      {{ attr.type }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="text-xs">
                      {{ attr.required ? '✅ Yes' : '⏸️ No' }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center justify-end gap-1">
                      <button
                        (click)="editAttribute(attr)"
                        class="p-1 text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                        title="Edit"
                      >
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                        </svg>
                      </button>
                      <button
                        (click)="deleteAttribute(attr)"
                        class="p-1 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                        title="Delete"
                      >
                        <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Save Button -->
      <div class="flex items-center justify-end gap-3">
        <button
          (click)="resetSettings()"
          class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          Reset to Defaults
        </button>
        <button
          (click)="saveSettings()"
          class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded hover:bg-primary-700 transition shadow-sm"
        >
          <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          Save Settings
        </button>
      </div>
    </div>
  `
})
export class PlatformSettingsComponent {
  settings = {
    defaultCurrency: 'PHP',
    defaultTaxRate: 12.00,
    maxDiscount: 50.00,
    priceDecimalPlaces: '2',
    enableVariants: true,
    enableInventoryTracking: true,
    enableAutomaticUpdates: false,
    requireApproval: true,
    notifyProductUpdates: true,
    notifyLowStock: true,
    lowStockThreshold: 10
  };

  categories = signal<Category[]>([
    { id: 1, name: 'Personal Finance', productCount: 12 },
    { id: 2, name: 'Business Loans', productCount: 8 },
    { id: 3, name: 'Consumer Finance', productCount: 15 },
    { id: 4, name: 'Pawnshop Services', productCount: 5 },
    { id: 5, name: 'BNPL Solutions', productCount: 10 }
  ]);

  attributes = signal<ProductAttribute[]>([
    { id: 1, name: 'Interest Rate', type: 'number', required: true },
    { id: 2, name: 'Loan Term', type: 'number', required: true },
    { id: 3, name: 'Collateral Required', type: 'boolean', required: false },
    { id: 4, name: 'Processing Fee', type: 'number', required: false }
  ]);

  addCategory() {
    const name = prompt('Enter category name:');
    if (name) {
      alert(`Category "${name}" added! (Mock implementation)`);
    }
  }

  editCategory(category: Category) {
    const newName = prompt('Enter new category name:', category.name);
    if (newName) {
      alert(`Category updated to "${newName}"! (Mock implementation)`);
    }
  }

  deleteCategory(category: Category) {
    if (confirm(`Delete category "${category.name}"? This will affect ${category.productCount} products.`)) {
      alert('Category deleted! (Mock implementation)');
    }
  }

  addAttribute() {
    alert('Add attribute form would open here (Modal implementation needed)');
  }

  editAttribute(attr: ProductAttribute) {
    alert(`Edit attribute "${attr.name}" (Modal implementation needed)`);
  }

  deleteAttribute(attr: ProductAttribute) {
    if (confirm(`Delete attribute "${attr.name}"?`)) {
      alert('Attribute deleted! (Mock implementation)');
    }
  }

  saveSettings() {
    console.log('Saving settings:', this.settings);
    alert('Settings saved successfully! (Mock implementation)');
  }

  resetSettings() {
    if (confirm('Reset all settings to default values?')) {
      alert('Settings reset to defaults! (Mock implementation)');
    }
  }
}
