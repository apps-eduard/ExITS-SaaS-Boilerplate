import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-tenant-settings',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 space-y-6">
      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span class="text-2xl">⚙️</span>
            Tenant Settings
          </h1>
          <p class="mt-1 text-sm text-gray-600 dark:text-gray-400">
            Configure tenant-specific settings and policies
          </p>
        </div>
      </div>

      <!-- Settings Navigation -->
      <div class="border-b border-gray-200 dark:border-gray-700">
        <nav class="-mb-px flex gap-4 overflow-x-auto">
          <button
            *ngFor="let section of sections"
            (click)="activeSection.set(section.id)"
            [class.border-primary-600]="activeSection() === section.id"
            [class.text-primary-600]="activeSection() === section.id"
            [class.dark:border-primary-500]="activeSection() === section.id"
            [class.dark:text-primary-500]="activeSection() === section.id"
            [class.border-transparent]="activeSection() !== section.id"
            [class.text-gray-500]="activeSection() !== section.id"
            [class.dark:text-gray-400]="activeSection() !== section.id"
            class="flex items-center gap-2 border-b-2 py-4 px-1 text-sm font-medium transition-colors hover:text-gray-700 dark:hover:text-gray-300 whitespace-nowrap">
            <span class="text-lg">{{ section.icon }}</span>
            {{ section.label }}
          </button>
        </nav>
      </div>

      <!-- Organization Info Section -->
      @if (activeSection() === 'organization') {
        <div class="space-y-6">
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span>🏷️</span>
              Organization Information
            </h2>

            <div class="space-y-4">
              <!-- Tenant Display Name -->
              <div>
                <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tenant Display Name
                </label>
                <input
                  type="text"
                  placeholder="Enter organization name"
                  class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500">
              </div>

              <!-- Contact Details -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Contact Email
                  </label>
                  <input
                    type="email"
                    placeholder="contact@company.com"
                    class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500">
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Contact Phone
                  </label>
                  <input
                    type="tel"
                    placeholder="+1 (555) 000-0000"
                    class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500">
                </div>
              </div>

              <!-- Logo & Color Theme -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Company Logo
                  </label>
                  <div class="flex items-center gap-3">
                    <div class="w-16 h-16 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                      <span class="text-2xl">🏢</span>
                    </div>
                    <button class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-600 text-white rounded hover:bg-primary-700 transition">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                      </svg>
                      Upload Logo
                    </button>
                  </div>
                </div>
                <div>
                  <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Brand Color
                  </label>
                  <div class="flex items-center gap-2">
                    <input
                      type="color"
                      value="#3B82F6"
                      class="w-12 h-10 rounded border border-gray-300 dark:border-gray-600">
                    <input
                      type="text"
                      value="#3B82F6"
                      class="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Branch Management Section -->
      @if (activeSection() === 'branches') {
        <div class="space-y-6">
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <div class="flex items-center justify-between mb-4">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                <span>🌍</span>
                Branch Management
              </h2>
              <button class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-600 text-white rounded hover:bg-primary-700 transition">
                <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                </svg>
                Add Branch
              </button>
            </div>

            <!-- Branches List -->
            <div class="space-y-3">
              <div class="p-4 border border-gray-200 dark:border-gray-700 rounded-lg">
                <div class="flex items-center justify-between">
                  <div>
                    <h3 class="font-medium text-gray-900 dark:text-white">Main Office</h3>
                    <p class="text-sm text-gray-600 dark:text-gray-400">123 Business St, City</p>
                    <div class="flex items-center gap-2 mt-2">
                      <span class="px-2 py-1 text-xs bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300 rounded">Active</span>
                      <span class="text-xs text-gray-500">Manager: John Doe</span>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <button class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-blue-700 bg-blue-50 hover:bg-blue-100 dark:text-blue-300 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 rounded transition">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                      Edit
                    </button>
                    <button class="inline-flex items-center gap-1 px-2.5 py-1.5 text-xs font-medium text-red-700 bg-red-50 hover:bg-red-100 dark:text-red-300 dark:bg-red-900/30 dark:hover:bg-red-900/50 rounded transition">
                      <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636"/>
                      </svg>
                      Deactivate
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Product Configuration Section -->
      @if (activeSection() === 'products') {
        <div class="space-y-6">
          <!-- Product Enablement -->
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span>🎯</span>
              Active Products
            </h2>
            <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
              Enable or disable products for this tenant. Disabled products will not be accessible to users.
            </p>

            <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
              <!-- Money Loan Product -->
              <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-primary-500 transition-colors"
                   [class.bg-primary-50]="productSettings().money_loan_enabled"
                   [class.dark:bg-primary-900/20]="productSettings().money_loan_enabled">
                <div class="flex items-start justify-between mb-3">
                  <div class="flex items-center gap-2">
                    <span class="text-2xl">💵</span>
                    <div>
                      <h3 class="font-semibold text-gray-900 dark:text-white">Money Loan</h3>
                      <p class="text-xs text-gray-500 dark:text-gray-400">Quick cash loans</p>
                    </div>
                  </div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox"
                         [checked]="productSettings().money_loan_enabled"
                         (change)="toggleProduct('money_loan_enabled')"
                         class="sr-only peer">
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  <span class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                    {{ productSettings().money_loan_enabled ? 'Enabled' : 'Disabled' }}
                  </span>
                </label>
              </div>

              <!-- BNPL Product -->
              <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-primary-500 transition-colors"
                   [class.bg-primary-50]="productSettings().bnpl_enabled"
                   [class.dark:bg-primary-900/20]="productSettings().bnpl_enabled">
                <div class="flex items-start justify-between mb-3">
                  <div class="flex items-center gap-2">
                    <span class="text-2xl">💳</span>
                    <div>
                      <h3 class="font-semibold text-gray-900 dark:text-white">BNPL</h3>
                      <p class="text-xs text-gray-500 dark:text-gray-400">Buy Now Pay Later</p>
                    </div>
                  </div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox"
                         [checked]="productSettings().bnpl_enabled"
                         (change)="toggleProduct('bnpl_enabled')"
                         class="sr-only peer">
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  <span class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                    {{ productSettings().bnpl_enabled ? 'Enabled' : 'Disabled' }}
                  </span>
                </label>
              </div>

              <!-- Pawnshop Product -->
              <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-primary-500 transition-colors"
                   [class.bg-primary-50]="productSettings().pawnshop_enabled"
                   [class.dark:bg-primary-900/20]="productSettings().pawnshop_enabled">
                <div class="flex items-start justify-between mb-3">
                  <div class="flex items-center gap-2">
                    <span class="text-2xl">💎</span>
                    <div>
                      <h3 class="font-semibold text-gray-900 dark:text-white">Pawnshop</h3>
                      <p class="text-xs text-gray-500 dark:text-gray-400">Collateral-based loans</p>
                    </div>
                  </div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox"
                         [checked]="productSettings().pawnshop_enabled"
                         (change)="toggleProduct('pawnshop_enabled')"
                         class="sr-only peer">
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-primary-300 dark:peer-focus:ring-primary-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-primary-600"></div>
                  <span class="ms-3 text-sm font-medium text-gray-900 dark:text-gray-300">
                    {{ productSettings().pawnshop_enabled ? 'Enabled' : 'Disabled' }}
                  </span>
                </label>
              </div>
            </div>
          </div>

          <!-- Product Configuration Rules -->
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span>💰</span>
              Product Configuration Rules
            </h2>

            <div class="space-y-6">
              <!-- MoneyLoan Rules -->
              <div>
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <span>💵</span>
                  MoneyLoan Rules
                </h3>
                <div class="space-y-3">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">Interest Rate (%)</label>
                      <input type="number" value="5.5" step="0.1" class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    </div>
                    <div>
                      <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">Maximum Loan Amount</label>
                      <input type="number" value="50000" class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    </div>
                    <div>
                      <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">Minimum Loan Amount</label>
                      <input type="number" value="1000" class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    </div>
                    <div>
                      <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">Maximum Term (months)</label>
                      <input type="number" value="24" class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    </div>
                  </div>
                </div>
              </div>

              <!-- BNPL Rules -->
              <div>
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <span>💳</span>
                  Buy Now Pay Later (BNPL) Rules
                </h3>
                <div class="space-y-3">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">Maximum Installments</label>
                      <input type="number" value="12" class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    </div>
                    <div>
                      <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">Processing Fee (%)</label>
                      <input type="number" value="2.5" step="0.1" class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    </div>
                    <div>
                      <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">Late Payment Fee</label>
                      <input type="number" value="50" class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    </div>
                    <div>
                      <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">Grace Period (days)</label>
                      <input type="number" value="3" class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    </div>
                  </div>
                </div>
              </div>

              <!-- Pawnshop Rules -->
              <div>
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <span>💎</span>
                  Pawnshop Rules
                </h3>
                <div class="space-y-3">
                  <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">Valuation Formula</label>
                      <select class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                        <option>Market Price × 0.7</option>
                        <option>Market Price × 0.8</option>
                        <option>Custom Formula</option>
                      </select>
                    </div>
                    <div>
                      <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">Storage Fee (per month)</label>
                      <input type="number" value="20" class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    </div>
                    <div>
                      <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">Redemption Period (days)</label>
                      <input type="number" value="30" class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    </div>
                    <div>
                      <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">Interest Rate (%/month)</label>
                      <input type="number" value="3" step="0.1" class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Templates & Notifications Section -->
      @if (activeSection() === 'notifications') {
        <div class="space-y-6">
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span>🧾</span>
              Templates & Notifications
            </h2>

            <div class="space-y-6">
              <!-- Email/SMS Templates -->
              <div>
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Email & SMS Templates</h3>
                <div class="space-y-2">
                  <button class="w-full p-2.5 text-left border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between transition">
                    <span class="text-xs flex items-center gap-2">
                      <span>📧</span>
                      <span class="font-medium">Welcome Email Template</span>
                    </span>
                    <span class="inline-flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                      Edit
                    </span>
                  </button>
                  <button class="w-full p-2.5 text-left border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between transition">
                    <span class="text-xs flex items-center gap-2">
                      <span>💬</span>
                      <span class="font-medium">Payment Reminder SMS</span>
                    </span>
                    <span class="inline-flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                      Edit
                    </span>
                  </button>
                  <button class="w-full p-2.5 text-left border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 flex items-center justify-between transition">
                    <span class="text-xs flex items-center gap-2">
                      <span>📱</span>
                      <span class="font-medium">Loan Approval Notification</span>
                    </span>
                    <span class="inline-flex items-center gap-1 text-xs text-primary-600 dark:text-primary-400">
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                      Edit
                    </span>
                  </button>
                </div>
              </div>

              <!-- Reminder Settings -->
              <div>
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Reminder Settings</h3>
                <div class="space-y-3">
                  <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span class="text-sm text-gray-700 dark:text-gray-300">Days Before Payment Reminder</span>
                    <input type="number" value="3" class="w-20 px-2 py-1 text-xs border rounded">
                  </div>
                  <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span class="text-sm text-gray-700 dark:text-gray-300">Send Reminder via Email</span>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked class="sr-only peer">
                      <div class="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span class="text-sm text-gray-700 dark:text-gray-300">Send Reminder via SMS</span>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked class="sr-only peer">
                      <div class="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <!-- Branding on Messages -->
              <div>
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Message Branding</h3>
                <div class="space-y-3">
                  <div>
                    <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">Email Footer Text</label>
                    <textarea rows="3" class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white" placeholder="Add your company footer..."></textarea>
                  </div>
                  <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span class="text-sm text-gray-700 dark:text-gray-300">Include Company Logo in Emails</span>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked class="sr-only peer">
                      <div class="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Security Section -->
      @if (activeSection() === 'security') {
        <div class="space-y-6">
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
              <span>🛡️</span>
              Security Settings
            </h2>

            <div class="space-y-6">
              <!-- Session Timeout -->
              <div>
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Session Management</h3>
                <div class="space-y-3">
                  <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span class="text-sm text-gray-700 dark:text-gray-300">Session Timeout (minutes)</span>
                    <input type="number" value="30" min="5" max="480" class="w-24 px-2 py-1 text-xs border rounded">
                  </div>
                  <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span class="text-sm text-gray-700 dark:text-gray-300">Auto-logout on Inactivity</span>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" checked class="sr-only peer">
                      <div class="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <!-- Device Management -->
              <div>
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Device Management</h3>
                <div class="space-y-3">
                  <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span class="text-sm text-gray-700 dark:text-gray-300">Maximum Active Devices per User</span>
                    <input type="number" value="3" min="1" max="10" class="w-20 px-2 py-1 text-xs border rounded">
                  </div>
                  <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span class="text-sm text-gray-700 dark:text-gray-300">Require Device Approval</span>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" class="sr-only peer">
                      <div class="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                </div>
              </div>

              <!-- IP Whitelist -->
              <div>
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">IP Whitelist</h3>
                <div class="space-y-3">
                  <div class="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                    <span class="text-sm text-gray-700 dark:text-gray-300">Enable IP Whitelisting</span>
                    <label class="relative inline-flex items-center cursor-pointer">
                      <input type="checkbox" class="sr-only peer">
                      <div class="w-11 h-6 bg-gray-200 peer-focus:ring-2 peer-focus:ring-primary-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary-600"></div>
                    </label>
                  </div>
                  <div>
                    <label class="block text-xs text-gray-600 dark:text-gray-400 mb-1">Allowed IP Addresses</label>
                    <textarea rows="4" class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white font-mono" placeholder="192.168.1.1&#10;10.0.0.0/24&#10;172.16.0.1"></textarea>
                    <p class="text-xs text-gray-500 mt-1">Enter one IP address or CIDR range per line</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      }

      <!-- Save Button -->
      <div class="flex justify-end gap-3">
        <button class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
          Cancel
        </button>
        <button class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-600 text-white rounded hover:bg-primary-700 transition">
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          Save Changes
        </button>
      </div>
    </div>
  `,
  styles: []
})
export class TenantSettingsComponent {
  activeSection = signal('organization');

  sections = [
    { id: 'organization', label: 'Organization Info', icon: '🏷️' },
    { id: 'branches', label: 'Branches', icon: '🌍' },
    { id: 'products', label: 'Product Config', icon: '💰' },
    { id: 'notifications', label: 'Templates & Notifications', icon: '🧾' },
    { id: 'security', label: 'Security', icon: '🛡️' }
  ];

  // Product enablement settings
  productSettings = signal({
    money_loan_enabled: true,
    bnpl_enabled: true,
    pawnshop_enabled: false
  });

  toggleProduct(product: 'money_loan_enabled' | 'bnpl_enabled' | 'pawnshop_enabled') {
    this.productSettings.update(settings => ({
      ...settings,
      [product]: !settings[product]
    }));

    // TODO: Call API to save product settings
    console.log('Product settings updated:', this.productSettings());
  }
}
