import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

@Component({
  selector: 'app-platform-new',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 sm:p-6 space-y-4">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Add New Platform</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Create a new platform offering for your service
          </p>
        </div>
        <button
          (click)="cancel()"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          Back to Catalog
        </button>
      </div>

      <!-- Platform Form -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
        <form (ngSubmit)="savePlatform()" class="space-y-6">
          <!-- Basic Information -->
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Platform Name <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  [(ngModel)]="formData.name"
                  name="name"
                  required
                  placeholder="e.g., Personal Loan Plus"
                  class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Product Code <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  [(ngModel)]="formData.code"
                  name="code"
                  required
                  placeholder="e.g., LOAN-001"
                  class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div class="md:col-span-2">
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Description
                </label>
                <textarea
                  [(ngModel)]="formData.description"
                  name="description"
                  rows="3"
                  placeholder="Enter product description..."
                  class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500"
                ></textarea>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Product Type <span class="text-red-500">*</span>
                </label>
                <select
                  [(ngModel)]="formData.type"
                  name="type"
                  required
                  class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                >
                  <option value="">Select type</option>
                  <option value="loan">💰 Loan</option>
                  <option value="bnpl">🛒 Buy Now Pay Later</option>
                  <option value="pawnshop">💎 Pawnshop</option>
                  <option value="other">📋 Other</option>
                </select>
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Category
                </label>
                <input
                  type="text"
                  [(ngModel)]="formData.category"
                  name="category"
                  placeholder="e.g., Personal Finance"
                  class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status <span class="text-red-500">*</span>
                </label>
                <select
                  [(ngModel)]="formData.status"
                  name="status"
                  required
                  class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                >
                  <option value="draft">📝 Draft</option>
                  <option value="active">✅ Active</option>
                  <option value="inactive">⏸️ Inactive</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Pricing -->
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Pricing Configuration</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Base Rate (%)
                </label>
                <input
                  type="number"
                  [(ngModel)]="formData.baseRate"
                  name="baseRate"
                  step="0.01"
                  placeholder="e.g., 12.50"
                  class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500"
                />
              </div>

              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Currency
                </label>
                <select
                  [(ngModel)]="formData.currency"
                  name="currency"
                  class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                >
                  <option value="PHP">🇵🇭 PHP - Philippine Peso</option>
                  <option value="USD">🇺🇸 USD - US Dollar</option>
                  <option value="EUR">🇪🇺 EUR - Euro</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Features -->
          <div>
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Product Features</h3>
            <div class="space-y-2">
              <div class="flex items-center gap-2">
                <input
                  type="text"
                  [(ngModel)]="newFeature"
                  name="newFeature"
                  placeholder="Enter feature name..."
                  (keyup.enter)="addFeature()"
                  class="flex-1 px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500"
                />
                <button
                  type="button"
                  (click)="addFeature()"
                  class="px-3 py-2 text-xs font-medium bg-primary-600 text-white rounded hover:bg-primary-700 transition"
                >
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                  </svg>
                </button>
              </div>

              @if (formData.features.length > 0) {
                <div class="flex flex-wrap gap-2">
                  @for (feature of formData.features; track feature) {
                    <span class="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded-full">
                      {{ feature }}
                      <button
                        type="button"
                        (click)="removeFeature(feature)"
                        class="hover:text-blue-900 dark:hover:text-blue-100"
                      >
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    </span>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              (click)="cancel()"
              class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition"
            >
              Cancel
            </button>
            <button
              type="submit"
              class="px-4 py-2 text-sm font-medium text-white bg-primary-600 rounded hover:bg-primary-700 transition shadow-sm"
            >
              <svg class="w-4 h-4 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
              </svg>
              Create Product
            </button>
          </div>
        </form>
      </div>
    </div>
  `
})
export class PlatformNewComponent {
  private router = inject(Router);

  formData = {
    name: '',
    code: '',
    description: '',
    type: '',
    category: '',
    status: 'draft' as 'draft' | 'active' | 'inactive',
    baseRate: 0,
    currency: 'PHP',
    features: [] as string[]
  };

  newFeature = '';

  addFeature() {
    if (this.newFeature.trim()) {
      this.formData.features.push(this.newFeature.trim());
      this.newFeature = '';
    }
  }

  removeFeature(feature: string) {
    this.formData.features = this.formData.features.filter(f => f !== feature);
  }

  savePlatform() {
    console.log('Creating platform:', this.formData);
    alert('Platform created successfully! (Mock implementation)');
    this.router.navigate(['/admin/platforms']);
  }

  cancel() {
    this.router.navigate(['/admin/products']);
  }
}
