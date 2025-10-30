import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoanCalculatorService, LoanParams, LoanCalculation } from '../../shared/services/loan-calculator.service';
import { LoanService } from '../../shared/services/loan.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { AuthService } from '../../../../../core/services/auth.service';

@Component({
  selector: 'app-quick-product',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="flex h-full">
      <!-- Sidebar Navigation -->
      <div class="w-56 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex-shrink-0">
        <div class="p-4">
          <h2 class="text-sm font-bold text-gray-900 dark:text-white mb-3">📦 Product Management</h2>

          <nav class="space-y-1">
            <button
              (click)="activeView = 'create'"
              [class]="activeView === 'create'
                ? 'w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                : 'w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition'"
            >
              <span>⚡</span>
              <span>Create New Product</span>
            </button>

            <button
              (click)="activeView = 'products'"
              [class]="activeView === 'products'
                ? 'w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800'
                : 'w-full flex items-center gap-2 px-3 py-2 text-xs font-medium rounded text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition'"
            >
              <span>📋</span>
              <span>All Products ({{ products().length }})</span>
            </button>
          </nav>

          <!-- Quick Stats -->
          <div class="mt-6 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p class="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2">📊 Quick Stats</p>
            <div class="space-y-2">
              <div class="flex justify-between text-xs">
                <span class="text-gray-600 dark:text-gray-400">Total Products</span>
                <span class="font-semibold text-gray-900 dark:text-white">{{ products().length }}</span>
              </div>
              <div class="flex justify-between text-xs">
                <span class="text-gray-600 dark:text-gray-400">Active</span>
                <span class="font-semibold text-green-600 dark:text-green-400">{{ getActiveProductsCount() }}</span>
              </div>
              <div class="flex justify-between text-xs">
                <span class="text-gray-600 dark:text-gray-400">Inactive</span>
                <span class="font-semibold text-gray-600 dark:text-gray-400">{{ getInactiveProductsCount() }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Main Content Area -->
      <div class="flex-1 overflow-auto">
        <div class="p-4">
          <!-- Create New Product View -->
          @if (activeView === 'create') {
            <!-- Compact Header -->
            <div class="flex items-center justify-between mb-4">
              <div>
                <h1 class="text-xl font-bold text-gray-900 dark:text-white">
                  @if (editingProductId) {
                    <span>✏️ Edit Product</span>
                  } @else {
                    <span>⚡ Quick Create Product</span>
                  }
                </h1>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  @if (editingProductId) {
                    <span>Update product details with instant calculation preview</span>
                  } @else {
                    <span>Create loan products with instant calculation preview</span>
                  }
                </p>
              </div>
              @if (editingProductId) {
                <button
                  (click)="cancelEdit()"
                  class="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
                >
                  ❌ Cancel Edit
                </button>
              }
            </div>

            <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- Left: Compact Form -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <span>📝</span> Product Details
          </h2>

          <form class="space-y-3">
            <!-- Product Code & Name (2 columns) -->
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Product Code *</label>
                <input
                  type="text"
                  [(ngModel)]="productCode"
                  name="productCode"
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded focus:border-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white"
                  placeholder="LP-001"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Product Name *</label>
                <input
                  type="text"
                  [(ngModel)]="productName"
                  name="productName"
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded focus:border-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white"
                  placeholder="Quick Loan"
                />
              </div>
            </div>

            <!-- Description -->
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
              <textarea
                [(ngModel)]="description"
                name="description"
                rows="2"
                class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded focus:border-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white"
                placeholder="Short-term loan for quick access to funds"
              ></textarea>
            </div>

            <!-- Loan Amount Range -->
            <div class="bg-blue-50 dark:bg-blue-900/20 p-2.5 rounded space-y-2">
              <p class="text-xs font-semibold text-blue-700 dark:text-blue-400">💰 Loan Amount Range</p>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Minimum (₱)</label>
                  <input
                    type="number"
                    [(ngModel)]="minAmount"
                    (ngModelChange)="calculatePreview()"
                    name="minAmount"
                    class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded focus:border-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white"
                    placeholder="1,000"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Maximum (₱)</label>
                  <input
                    type="number"
                    [(ngModel)]="maxAmount"
                    (ngModelChange)="calculatePreview()"
                    name="maxAmount"
                    class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded focus:border-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white"
                    placeholder="100,000"
                  />
                </div>
              </div>
            </div>

            <!-- Loan Terms -->
            <div class="bg-purple-50 dark:bg-purple-900/20 p-2.5 rounded space-y-2">
              <p class="text-xs font-semibold text-purple-700 dark:text-purple-400">📅 Loan Terms</p>

              <!-- Term Type Selector -->
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Term Type</label>
                <select
                  [(ngModel)]="loanTermType"
                  (ngModelChange)="onTermTypeChange()"
                  name="loanTermType"
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded focus:border-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white"
                >
                  <option value="fixed">Fixed Term</option>
                  <option value="flexible">Flexible Range</option>
                </select>
              </div>

              <!-- Fixed Term -->
              @if (loanTermType === 'fixed') {
                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Fixed Term (Months)</label>
                  <input
                    type="number"
                    [(ngModel)]="fixedTermMonths"
                    (ngModelChange)="calculatePreview()"
                    name="fixedTermMonths"
                    min="1"
                    class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded focus:border-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white"
                    placeholder="3"
                  />
                </div>
              }

              <!-- Flexible Range -->
              @if (loanTermType === 'flexible') {
                <div class="grid grid-cols-2 gap-2">
                  <div>
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Min (months)</label>
                    <input
                      type="number"
                      [(ngModel)]="minTermMonths"
                      (ngModelChange)="calculatePreview()"
                      name="minTermMonths"
                      min="1"
                      class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded focus:border-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white"
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Max (months)</label>
                    <input
                      type="number"
                      [(ngModel)]="maxTermMonths"
                      (ngModelChange)="calculatePreview()"
                      name="maxTermMonths"
                      min="1"
                      class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded focus:border-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white"
                      placeholder="6"
                    />
                  </div>
                </div>
              }
            </div>

            <!-- Payment Frequency -->
            <div class="bg-indigo-50 dark:bg-indigo-900/20 p-2.5 rounded space-y-2">
              <p class="text-xs font-semibold text-indigo-700 dark:text-indigo-400">🔄 Payment Frequency</p>
              <div class="space-y-1.5">
                <label class="flex items-center gap-2 p-1.5 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/30 cursor-pointer">
                  <input
                    type="radio"
                    [(ngModel)]="paymentFrequency"
                    name="paymentFrequency"
                    value="daily"
                    (ngModelChange)="calculatePreview()"
                    class="w-3.5 h-3.5 text-blue-600 focus:ring-1 focus:ring-blue-500"
                  />
                  <span class="text-xs text-gray-700 dark:text-gray-300">📅 Daily (30 payments/month)</span>
                </label>
                <label class="flex items-center gap-2 p-1.5 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/30 cursor-pointer">
                  <input
                    type="radio"
                    [(ngModel)]="paymentFrequency"
                    name="paymentFrequency"
                    value="weekly"
                    (ngModelChange)="calculatePreview()"
                    class="w-3.5 h-3.5 text-blue-600 focus:ring-1 focus:ring-blue-500"
                  />
                  <span class="text-xs text-gray-700 dark:text-gray-300">📆 Weekly (4 payments/month)</span>
                </label>
                <label class="flex items-center gap-2 p-1.5 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/30 cursor-pointer">
                  <input
                    type="radio"
                    [(ngModel)]="paymentFrequency"
                    name="paymentFrequency"
                    value="monthly"
                    (ngModelChange)="calculatePreview()"
                    class="w-3.5 h-3.5 text-blue-600 focus:ring-1 focus:ring-blue-500"
                  />
                  <span class="text-xs text-gray-700 dark:text-gray-300">🗓️ Monthly (1 payment/month)</span>
                </label>
              </div>
            </div>

            <!-- Interest & Fees (3 columns) -->
            <div class="bg-green-50 dark:bg-green-900/20 p-2.5 rounded space-y-2">
              <p class="text-xs font-semibold text-green-700 dark:text-green-400">💵 Interest & Fees</p>
              <div class="grid grid-cols-3 gap-2">
                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Interest % *</label>
                  <input
                    type="number"
                    [(ngModel)]="interestRate"
                    (ngModelChange)="calculatePreview()"
                    name="interestRate"
                    step="0.5"
                    class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded focus:border-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white"
                    placeholder="5.0"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Process %</label>
                  <input
                    type="number"
                    [(ngModel)]="processingFeePercent"
                    (ngModelChange)="calculatePreview()"
                    name="processingFeePercent"
                    step="0.1"
                    class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded focus:border-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white"
                    placeholder="2.0"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Platform ₱</label>
                  <input
                    type="number"
                    [(ngModel)]="platformFee"
                    (ngModelChange)="calculatePreview()"
                    name="platformFee"
                    class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded focus:border-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white"
                    placeholder="50"
                  />
                </div>
              </div>
            </div>

            <!-- Penalty & Grace (2 columns) -->
            <div class="bg-amber-50 dark:bg-amber-900/20 p-2.5 rounded space-y-2">
              <p class="text-xs font-semibold text-amber-700 dark:text-amber-400">⚠️ Penalties</p>
              <div class="grid grid-cols-2 gap-2">
                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Late Penalty %/day</label>
                  <input
                    type="number"
                    [(ngModel)]="latePaymentPenaltyPercent"
                    name="latePaymentPenaltyPercent"
                    step="0.1"
                    class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded focus:border-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white"
                    placeholder="1.0"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Grace Days</label>
                  <input
                    type="number"
                    [(ngModel)]="gracePeriodDays"
                    name="gracePeriodDays"
                    class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded focus:border-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white"
                    placeholder="1"
                  />
                </div>
              </div>
            </div>

            <!-- Interest Type & Status (2 columns) -->
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Interest Type</label>
                <select
                  [(ngModel)]="interestType"
                  (ngModelChange)="calculatePreview()"
                  name="interestType"
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded focus:border-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white"
                >
                  <option value="flat">Flat</option>
                  <option value="reducing">Reducing</option>
                  <option value="compound">Compound</option>
                </select>
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
                <select
                  [(ngModel)]="isActive"
                  name="isActive"
                  class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded focus:border-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white"
                >
                  <option [value]="true">Active</option>
                  <option [value]="false">Inactive</option>
                </select>
              </div>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-2 pt-2">
              <button
                type="button"
                (click)="saveProduct()"
                [disabled]="saving()"
                class="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-xs font-medium py-1.5 px-3 rounded shadow-sm transition"
              >
                @if (saving()) {
                  <span>⏳ Saving...</span>
                } @else if (editingProductId) {
                  <span>💾 Update Product</span>
                } @else {
                  <span>💾 Create Product</span>
                }
              </button>
              <button
                type="button"
                (click)="resetForm()"
                class="px-3 py-1.5 text-xs text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
              >
                🔄
              </button>
            </div>
          </form>
        </div>

        <!-- Right: Live Preview -->
        <div class="space-y-4">
          <!-- Calculation Preview -->
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h2 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
              <span>�</span> Live Calculation Preview
            </h2>

            <!-- Preview Loan Amount Input -->
            <div class="mb-3 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 p-3 rounded-lg border border-blue-200 dark:border-blue-800">
              <label class="block text-xs font-semibold text-blue-700 dark:text-blue-400 mb-1.5">
                💰 Preview Loan Amount (₱)
              </label>
              <input
                type="number"
                [(ngModel)]="previewLoanAmount"
                (ngModelChange)="onPreviewAmountChange()"
                name="previewLoanAmount"
                [min]="minAmount"
                [max]="maxAmount"
                class="w-full px-3 py-2 text-sm font-semibold border border-blue-300 dark:border-blue-600 rounded focus:border-blue-500 focus:outline-none focus:ring-2 focus:ring-blue-500/20 dark:bg-gray-800 dark:text-white"
                placeholder="Enter amount"
              />
              <p class="text-xs text-blue-600 dark:text-blue-400 mt-1.5">
                Range: {{ formatCurrency(minAmount) }} - {{ formatCurrency(maxAmount) }}
              </p>
              @if (previewLoanAmount < minAmount || previewLoanAmount > maxAmount) {
                <p class="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                  <span>⚠️</span>
                  <span>Amount must be between {{ formatCurrency(minAmount) }} and {{ formatCurrency(maxAmount) }}</span>
                </p>
              }
            </div>

            <!-- Preview Loan Term Input -->
            <div class="mb-3 bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20 p-3 rounded-lg border border-purple-200 dark:border-purple-800">
              <label class="block text-xs font-semibold text-purple-700 dark:text-purple-400 mb-1.5">
                📅 Preview Loan Term (Months)
              </label>

              @if (loanTermType === 'fixed') {
                <!-- Fixed Term - Display Only -->
                <div class="bg-white dark:bg-gray-800 rounded p-2 border border-purple-300 dark:border-purple-600">
                  <p class="text-sm font-bold text-purple-700 dark:text-purple-300 text-center">
                    {{ fixedTermMonths }} month(s) (Fixed)
                  </p>
                </div>
                <p class="text-xs text-purple-600 dark:text-purple-400 mt-1.5">
                  🔒 This product has a fixed term of {{ fixedTermMonths }} month(s)
                </p>
              } @else {
                <!-- Flexible Term - User Input -->
                <input
                  type="number"
                  [(ngModel)]="previewTermMonths"
                  (ngModelChange)="onPreviewTermChange()"
                  name="previewTermMonths"
                  [min]="minTermMonths"
                  [max]="maxTermMonths"
                  class="w-full px-3 py-2 text-sm font-semibold border border-purple-300 dark:border-purple-600 rounded focus:border-purple-500 focus:outline-none focus:ring-2 focus:ring-purple-500/20 dark:bg-gray-800 dark:text-white"
                  placeholder="Enter term"
                />
                <p class="text-xs text-purple-600 dark:text-purple-400 mt-1.5">
                  Range: {{ minTermMonths }} - {{ maxTermMonths }} month(s)
                </p>
                @if (previewTermMonths < minTermMonths || previewTermMonths > maxTermMonths) {
                  <p class="text-xs text-red-600 dark:text-red-400 mt-1 flex items-center gap-1">
                    <span>⚠️</span>
                    <span>Term must be between {{ minTermMonths }} and {{ maxTermMonths }} month(s)</span>
                  </p>
                }
              }
            </div>

            @if (preview()) {
              <!-- Quick Stats Grid -->
              <div class="grid grid-cols-2 gap-2 mb-3">
                <div class="bg-green-50 dark:bg-green-900/20 rounded p-2">
                  <p class="text-xs text-green-600 dark:text-green-400">Net Proceeds</p>
                  <p class="text-sm font-bold text-green-700 dark:text-green-300">{{ formatCurrency(preview()!.netProceeds) }}</p>
                </div>
                <div class="bg-blue-50 dark:bg-blue-900/20 rounded p-2">
                  <p class="text-xs text-blue-600 dark:text-blue-400">Total Repayable</p>
                  <p class="text-sm font-bold text-blue-700 dark:text-blue-300">{{ formatCurrency(preview()!.totalRepayable) }}</p>
                </div>
                <div class="bg-purple-50 dark:bg-purple-900/20 rounded p-2">
                  <p class="text-xs text-purple-600 dark:text-purple-400">Per Payment</p>
                  <p class="text-sm font-bold text-purple-700 dark:text-purple-300">{{ formatCurrency(preview()!.installmentAmount) }}</p>
                </div>
                <div class="bg-amber-50 dark:bg-amber-900/20 rounded p-2">
                  <p class="text-xs text-amber-600 dark:text-amber-400">Effective APR</p>
                  <p class="text-sm font-bold text-amber-700 dark:text-amber-300">{{ preview()!.effectiveInterestRate.toFixed(2) }}%</p>
                </div>
              </div>

              <!-- Detailed Breakdown -->
              <div class="bg-gray-50 dark:bg-gray-900/50 rounded p-3 space-y-1.5 text-xs">
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">Loan Amount</span>
                  <span class="font-semibold text-gray-900 dark:text-white">{{ formatCurrency(preview()!.loanAmount) }}</span>
                </div>
                <div class="flex justify-between text-red-600 dark:text-red-400">
                  <span>- Interest ({{ interestRate }}%)</span>
                  <span>{{ formatCurrency(preview()!.interestAmount) }}</span>
                </div>
                @if (preview()!.processingFeeAmount > 0) {
                  <div class="flex justify-between text-red-600 dark:text-red-400">
                    <span>- Processing Fee</span>
                    <span>{{ formatCurrency(preview()!.processingFeeAmount) }}</span>
                  </div>
                }
                @if (preview()!.platformFee > 0) {
                  <div class="flex justify-between text-red-600 dark:text-red-400">
                    <span>- Platform Fee</span>
                    <span>{{ formatCurrency(preview()!.platformFee) }}</span>
                  </div>
                }
                <div class="border-t border-gray-300 dark:border-gray-600 pt-1.5 mt-1.5">
                  <div class="flex justify-between font-semibold text-green-700 dark:text-green-400">
                    <span>Net Proceeds</span>
                    <span>{{ formatCurrency(preview()!.netProceeds) }}</span>
                  </div>
                </div>
                <div class="border-t border-gray-300 dark:border-gray-600 pt-1.5 mt-1.5">
                  <div class="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Payments</span>
                    <span>{{ preview()!.numPayments }} × {{ formatCurrency(preview()!.installmentAmount) }}</span>
                  </div>
                  <div class="flex justify-between text-gray-600 dark:text-gray-400">
                    <span>Grace Period</span>
                    <span>{{ preview()!.gracePeriodDays }} day(s)</span>
                  </div>
                </div>
              </div>

              <!-- Penalty Calculator Section -->
              <div class="bg-gradient-to-r from-red-50 to-orange-50 dark:from-red-900/20 dark:to-orange-900/20 p-3 rounded-lg border border-red-200 dark:border-red-800 mt-3">
                <p class="text-xs font-semibold text-red-700 dark:text-red-400 mb-2">⚠️ Late Payment Penalty Calculator</p>
                <div class="space-y-2">
                  <div>
                    <label class="block text-xs font-medium text-red-700 dark:text-red-400 mb-1">
                      Days Overdue
                    </label>
                    <input
                      type="number"
                      [(ngModel)]="previewDaysOverdue"
                      (ngModelChange)="calculatePenalty()"
                      name="previewDaysOverdue"
                      min="0"
                      class="w-full px-2 py-1.5 text-xs border border-red-300 dark:border-red-600 rounded focus:border-red-500 focus:outline-none focus:ring-2 focus:ring-red-500/20 dark:bg-gray-800 dark:text-white"
                      placeholder="Enter days"
                    />
                  </div>
                  <div class="bg-white dark:bg-gray-800 rounded p-2 space-y-1 text-xs">
                    <div class="flex justify-between">
                      <span class="text-gray-600 dark:text-gray-400">Installment Amount</span>
                      <span class="font-semibold text-gray-900 dark:text-white">{{ formatCurrency(preview()!.installmentAmount) }}</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600 dark:text-gray-400">Penalty Rate</span>
                      <span class="font-semibold text-gray-900 dark:text-white">{{ latePaymentPenaltyPercent }}% per day</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600 dark:text-gray-400">Grace Period</span>
                      <span class="font-semibold text-gray-900 dark:text-white">{{ gracePeriodDays }} day(s)</span>
                    </div>
                    <div class="flex justify-between">
                      <span class="text-gray-600 dark:text-gray-400">Billable Days</span>
                      <span class="font-semibold text-gray-900 dark:text-white">
                        {{ Math.max(0, previewDaysOverdue - gracePeriodDays) }} day(s)
                      </span>
                    </div>
                    <div class="border-t border-gray-300 dark:border-gray-600 pt-1.5 mt-1.5">
                      <div class="flex justify-between font-semibold text-red-700 dark:text-red-400">
                        <span>Total Penalty</span>
                        <span>{{ formatCurrency(penaltyAmount()) }}</span>
                      </div>
                    </div>
                    <div class="border-t border-gray-300 dark:border-gray-600 pt-1.5 mt-1.5">
                      <div class="flex justify-between font-bold text-lg text-red-800 dark:text-red-300">
                        <span>Total Due</span>
                        <span>{{ formatCurrency(preview()!.installmentAmount + penaltyAmount()) }}</span>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            } @else {
              <div class="text-center py-8 text-gray-400">
                <div class="text-4xl mb-2">📊</div>
                <p class="text-xs">Enter values to see preview</p>
              </div>
            }
          </div>

          <!-- Info Card -->
          <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3">
            <div class="flex gap-2">
              <span class="text-blue-600 dark:text-blue-400">💡</span>
              <div class="text-xs text-blue-700 dark:text-blue-300 space-y-1">
                <p class="font-semibold">Quick Tips:</p>
                <ul class="list-disc list-inside space-y-0.5 text-blue-600 dark:text-blue-400">
                  <li>Preview uses mid-range values for calculations</li>
                  <li>Interest is deducted upfront (flat model)</li>
                  <li>Effective APR shows true cost to borrower</li>
                  <li>All fields marked with * are required</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    }

    <!-- All Products View -->
          @if (activeView === 'products') {
            <!-- Products Header -->
            <div class="flex items-center justify-between mb-4">
              <div>
                <h1 class="text-xl font-bold text-gray-900 dark:text-white">📋 All Products</h1>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  Manage and configure all loan products
                </p>
              </div>
              <div class="flex gap-2">
                <button
                  (click)="loadProducts()"
                  class="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
                >
                  🔄 Refresh
                </button>
                <button
                  (click)="activeView = 'create'"
                  class="px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded shadow-sm transition"
                >
                  ➕ Create New
                </button>
              </div>
            </div>

            <!-- Products Table -->
            <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
              <!-- Table Header -->
              <div class="px-3 py-2 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between bg-gray-50 dark:bg-gray-700/50">
                <div class="flex items-center gap-3">
                  <div>
                    <p class="text-xs font-semibold text-gray-900 dark:text-white">{{ products().length }} Products</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">
                      {{ getActiveProductsCount() }} active, {{ getInactiveProductsCount() }} inactive
                    </p>
                  </div>
                </div>
                <div class="flex gap-2">
                  <input
                    type="text"
                    [(ngModel)]="searchQuery"
                    (ngModelChange)="filterProducts()"
                    name="searchQuery"
                    placeholder="Search products..."
                    class="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded focus:border-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <!-- Table Content -->
              <div class="overflow-x-auto">
                @if (loading()) {
                  <div class="p-8 text-center">
                    <div class="inline-block animate-spin rounded-full h-8 w-8 border-4 border-gray-300 border-t-blue-600"></div>
                    <p class="text-sm text-gray-500 dark:text-gray-400 mt-2">Loading products...</p>
                  </div>
                } @else if (filteredProducts().length === 0) {
                  <div class="p-8 text-center">
                    <div class="text-4xl mb-2">📦</div>
                    @if (searchQuery) {
                      <p class="text-sm text-gray-500 dark:text-gray-400">No products found matching "{{ searchQuery }}"</p>
                      <button
                        (click)="clearSearch()"
                        class="mt-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400"
                      >
                        Clear search
                      </button>
                    } @else {
                      <p class="text-sm text-gray-500 dark:text-gray-400">No products created yet</p>
                      <button
                        (click)="activeView = 'create'"
                        class="mt-2 px-3 py-1.5 text-xs font-medium bg-blue-600 hover:bg-blue-700 text-white rounded"
                      >
                        Create your first product
                      </button>
                    }
                  </div>
                } @else {
                  <table class="w-full text-xs">
                    <thead class="bg-gray-50 dark:bg-gray-700">
                      <tr>
                        <th class="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Code</th>
                        <th class="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Product</th>
                        <th class="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Amount Range</th>
                        <th class="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Term Type</th>
                        <th class="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Interest</th>
                        <th class="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Frequency</th>
                        <th class="px-3 py-2 text-center text-xs font-semibold text-gray-700 dark:text-gray-300">Status</th>
                        <th class="px-3 py-2 text-center text-xs font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                      </tr>
                    </thead>
                    <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                      @for (product of filteredProducts(); track product.id) {
                        <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition">
                          <td class="px-3 py-2">
                            <span class="text-xs font-mono text-blue-600 dark:text-blue-400 font-semibold">{{ product.productCode }}</span>
                          </td>
                          <td class="px-3 py-2">
                            <div>
                              <p class="text-xs font-semibold text-gray-900 dark:text-white">{{ product.name }}</p>
                              @if (product.description) {
                                <p class="text-xs text-gray-500 dark:text-gray-400 truncate max-w-xs">{{ product.description }}</p>
                              }
                            </div>
                          </td>
                          <td class="px-3 py-2">
                            <div class="text-xs text-gray-700 dark:text-gray-300">
                              <p class="font-medium">{{ formatCurrency(product.minAmount) }}</p>
                              <p class="text-gray-500 dark:text-gray-400">to {{ formatCurrency(product.maxAmount) }}</p>
                            </div>
                          </td>
                          <td class="px-3 py-2">
                            @if (product.loanTermType === 'fixed') {
                              <div class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300">
                                <span class="text-xs">🔒</span>
                                <span class="text-xs font-medium">{{ (product.fixedTermDays || 90) / 30 }}mo Fixed</span>
                              </div>
                            } @else {
                              <div class="text-xs text-gray-700 dark:text-gray-300">
                                <p class="font-medium">{{ product.minTermDays / 30 }}-{{ product.maxTermDays / 30 }}mo</p>
                                <p class="text-gray-500 dark:text-gray-400">Flexible</p>
                              </div>
                            }
                          </td>
                          <td class="px-3 py-2">
                            <div class="text-xs">
                              <p class="font-semibold text-green-600 dark:text-green-400">{{ product.interestRate }}%</p>
                              <p class="text-gray-500 dark:text-gray-400 capitalize">{{ product.interestType }}</p>
                            </div>
                          </td>
                          <td class="px-3 py-2">
                            <div class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-300">
                              <span class="text-xs">
                                @if (product.paymentFrequency === 'daily') { 📅 }
                                @if (product.paymentFrequency === 'weekly') { 📆 }
                                @if (product.paymentFrequency === 'monthly') { 🗓️ }
                              </span>
                              <span class="text-xs font-medium capitalize">{{ product.paymentFrequency || 'weekly' }}</span>
                            </div>
                          </td>
                          <td class="px-3 py-2 text-center">
                            @if (product.isActive) {
                              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300">
                                <span class="w-1.5 h-1.5 rounded-full bg-green-600"></span>
                                Active
                              </span>
                            } @else {
                              <span class="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300">
                                <span class="w-1.5 h-1.5 rounded-full bg-gray-600"></span>
                                Inactive
                              </span>
                            }
                          </td>
                          <td class="px-3 py-2">
                            <div class="flex items-center justify-center gap-1">
                              <button
                                (click)="editProductAndSwitch(product)"
                                class="p-1 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/20 rounded transition"
                                title="Edit"
                              >
                                ✏️
                              </button>
                              <button
                                (click)="toggleProductStatus(product)"
                                class="p-1 text-amber-600 hover:bg-amber-50 dark:text-amber-400 dark:hover:bg-amber-900/20 rounded transition"
                                [title]="product.isActive ? 'Deactivate' : 'Activate'"
                              >
                                {{ product.isActive ? '⏸️' : '▶️' }}
                              </button>
                              <button
                                (click)="deleteProduct(product)"
                                class="p-1 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 rounded transition"
                                title="Delete"
                              >
                                🗑️
                              </button>
                            </div>
                          </td>
                        </tr>
                      }
                    </tbody>
                  </table>
                }
              </div>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class QuickProductComponent {
  private calculatorService = inject(LoanCalculatorService);
  private loanService = inject(LoanService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private router = inject(Router);

  // Form fields
  productCode = '';
  productName = '';
  description = '';
  minAmount = 1000;
  maxAmount = 100000;
  loanTermType: 'fixed' | 'flexible' = 'flexible';
  fixedTermMonths = 3;
  minTermMonths = 1;
  maxTermMonths = 6;
  interestRate = 5;
  interestType: 'flat' | 'reducing' | 'compound' = 'flat';
  processingFeePercent = 0;
  platformFee = 50;
  latePaymentPenaltyPercent = 1;
  gracePeriodDays = 1;
  isActive = true;
  paymentFrequency: 'daily' | 'weekly' | 'monthly' = 'weekly';
  previewLoanAmount = 50000; // For accurate preview calculation
  previewTermMonths = 3; // For accurate preview calculation
  previewDaysOverdue = 5; // For penalty calculation
  penaltyAmount = signal<number>(0);

  // State
  saving = signal(false);
  preview = signal<LoanCalculation | null>(null);
  products = signal<any[]>([]);
  loading = signal(false);
  editingProductId: number | null = null;
  activeView: 'create' | 'products' = 'create'; // Sidebar navigation
  searchQuery = '';
  filteredProducts = signal<any[]>([]);

  constructor() {
    this.calculatePreview();
    this.loadProducts();
  }

  getActiveProductsCount(): number {
    return this.products().filter(p => p.isActive).length;
  }

  getInactiveProductsCount(): number {
    return this.products().filter(p => !p.isActive).length;
  }

  filterProducts(): void {
    if (!this.searchQuery.trim()) {
      this.filteredProducts.set(this.products());
      return;
    }

    const query = this.searchQuery.toLowerCase();
    const filtered = this.products().filter(product =>
      product.name?.toLowerCase().includes(query) ||
      product.productCode?.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query)
    );
    this.filteredProducts.set(filtered);
  }

  clearSearch(): void {
    this.searchQuery = '';
    this.filterProducts();
  }

  editProductAndSwitch(product: any): void {
    this.editProduct(product);
    this.activeView = 'create';
  }

  onPreviewAmountChange(): void {
    // Enforce min/max constraints
    if (this.previewLoanAmount < this.minAmount) {
      this.previewLoanAmount = this.minAmount;
    } else if (this.previewLoanAmount > this.maxAmount) {
      this.previewLoanAmount = this.maxAmount;
    }
    this.calculatePreview();
  }

  onTermTypeChange(): void {
    // When switching to fixed, use the current preview term or default
    if (this.loanTermType === 'fixed') {
      this.fixedTermMonths = this.previewTermMonths || 3;
    } else {
      // When switching to flexible, ensure preview is within range
      if (this.previewTermMonths < this.minTermMonths || this.previewTermMonths > this.maxTermMonths) {
        this.previewTermMonths = Math.ceil((this.minTermMonths + this.maxTermMonths) / 2);
      }
    }
    this.calculatePreview();
  }

  onPreviewTermChange(): void {
    // Enforce min/max constraints for flexible terms
    if (this.loanTermType === 'flexible') {
      if (this.previewTermMonths < this.minTermMonths) {
        this.previewTermMonths = this.minTermMonths;
      } else if (this.previewTermMonths > this.maxTermMonths) {
        this.previewTermMonths = this.maxTermMonths;
      }
    }
    this.calculatePreview();
  }

  calculatePenalty(): void {
    if (!this.preview()) {
      this.penaltyAmount.set(0);
      return;
    }

    // Use the grace period from the form, not from the preview calculation
    const billableDays = Math.max(0, this.previewDaysOverdue - this.gracePeriodDays);
    const dailyPenalty = this.preview()!.installmentAmount * (this.latePaymentPenaltyPercent / 100);
    const totalPenalty = dailyPenalty * billableDays;

    this.penaltyAmount.set(totalPenalty);
  }

  calculatePreview(): void {
    if (this.minAmount <= 0) {
      this.preview.set(null);
      return;
    }

    // Ensure preview amount is within range
    let calculationAmount = this.previewLoanAmount;
    if (calculationAmount < this.minAmount || calculationAmount > this.maxAmount) {
      calculationAmount = (this.minAmount + this.maxAmount) / 2;
      this.previewLoanAmount = calculationAmount;
    }

    // Determine the term to use based on term type
    let calculationTerm: number;
    if (this.loanTermType === 'fixed') {
      calculationTerm = this.fixedTermMonths;
      this.previewTermMonths = this.fixedTermMonths; // Sync preview with fixed term
    } else {
      // For flexible terms, ensure preview term is within range
      calculationTerm = this.previewTermMonths;
      if (calculationTerm < this.minTermMonths || calculationTerm > this.maxTermMonths) {
        calculationTerm = Math.ceil((this.minTermMonths + this.maxTermMonths) / 2);
        this.previewTermMonths = calculationTerm;
      }
    }

    const params: LoanParams = {
      loanAmount: calculationAmount,
      termMonths: calculationTerm,
      paymentFrequency: this.paymentFrequency,
      interestRate: this.interestRate,
      interestType: this.interestType,
      processingFeePercentage: this.processingFeePercent,
      platformFee: this.platformFee,
      latePenaltyPercentage: this.latePaymentPenaltyPercent
    };

    const calculation = this.calculatorService.calculate(params);
    this.preview.set(calculation);
    this.calculatePenalty(); // Update penalty when preview changes
  }

  saveProduct(): void {
    // Validation
    if (!this.productCode || !this.productName) {
      this.toastService.error('Please fill in all required fields (Product Code and Name)');
      return;
    }

    // Ensure numeric comparison
    const minAmt = Number(this.minAmount);
    const maxAmt = Number(this.maxAmount);

    if (minAmt > maxAmt) {
      this.toastService.error('Minimum amount cannot be greater than maximum amount');
      return;
    }

    // Ensure integer comparison for terms
    const minTerm = Math.round(Number(this.minTermMonths));
    const maxTerm = Math.round(Number(this.maxTermMonths));

    if (minTerm > maxTerm) {
      this.toastService.error('Minimum term cannot be greater than maximum term');
      return;
    }

    this.saving.set(true);

    const tenantId = String(this.authService.getTenantId() || '');

    const productData = {
      productCode: this.productCode,
      name: this.productName,
      description: this.description,
      minAmount: this.minAmount,
      maxAmount: this.maxAmount,
      interestRate: this.interestRate,
      interestType: this.interestType,
  loanTermType: this.loanTermType,
  // Only include the relevant term fields. Use undefined (not null) so the backend
  // will drop the key instead of writing NULL to a NOT NULL column during update.
  fixedTermDays: this.loanTermType === 'fixed' ? this.fixedTermMonths * 30 : undefined,
  minTermDays: this.loanTermType === 'flexible' ? this.minTermMonths * 30 : undefined,
  maxTermDays: this.loanTermType === 'flexible' ? this.maxTermMonths * 30 : undefined,
      processingFeePercent: this.processingFeePercent,
      platformFee: this.platformFee,
      latePaymentPenaltyPercent: this.latePaymentPenaltyPercent,
      gracePeriodDays: this.gracePeriodDays,
      paymentFrequency: this.paymentFrequency,
      isActive: this.isActive
    };

    if (this.editingProductId) {
      // Update existing product
      this.loanService.updateLoanProduct(tenantId, this.editingProductId, productData).subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success('Product updated successfully! ✅');
            this.resetForm();
            this.loadProducts();
          } else {
            this.toastService.error(response.message || 'Failed to update product');
          }
          this.saving.set(false);
        },
        error: (error) => {
          console.error('Error updating product:', error);
          this.toastService.error('Failed to update product. Please try again.');
          this.saving.set(false);
        }
      });
    } else {
      // Create new product
      this.loanService.createLoanProduct(tenantId, productData).subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success('Product created successfully! 🎉');
            this.resetForm();
            this.loadProducts();
          } else {
            this.toastService.error(response.message || 'Failed to create product');
          }
          this.saving.set(false);
        },
        error: (error) => {
          console.error('Error creating product:', error);
          this.toastService.error('Failed to create product. Please try again.');
          this.saving.set(false);
        }
      });
    }
  }

  loadProducts(): void {
    this.loading.set(true);
    const tenantId = String(this.authService.getTenantId() || '');

    this.loanService.getLoanProducts(tenantId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.products.set(response.data);
          this.filterProducts(); // Update filtered list
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading products:', error);
        this.toastService.error('Failed to load products');
        this.loading.set(false);
      }
    });
  }

  editProduct(product: any): void {
    this.editingProductId = product.id;
    this.productCode = product.productCode;
    this.productName = product.name;
    this.description = product.description || '';
    this.minAmount = Number(product.minAmount) || 0;
    this.maxAmount = Number(product.maxAmount) || 0;

    // Handle term type
    this.loanTermType = product.loanTermType || 'flexible';
    if (this.loanTermType === 'fixed') {
      this.fixedTermMonths = Math.round((product.fixedTermDays || 90) / 30);
      this.minTermMonths = 1;
      this.maxTermMonths = 6;
    } else {
      this.minTermMonths = Math.round((product.minTermDays || 30) / 30);
      this.maxTermMonths = Math.round((product.maxTermDays || 180) / 30);
      this.fixedTermMonths = 3;
    }

    this.interestRate = Number(product.interestRate) || 0;
    this.interestType = product.interestType;
    this.processingFeePercent = Number(product.processingFeePercent) || 0;
    this.platformFee = Number(product.platformFee) || 50;
    this.latePaymentPenaltyPercent = Number(product.latePaymentPenaltyPercent) || 0;
    this.gracePeriodDays = Number(product.gracePeriodDays) || 0;
    this.paymentFrequency = product.paymentFrequency || 'weekly';
    this.isActive = product.isActive;
    this.calculatePreview();

    // Scroll to top
    window.scrollTo({ top: 0, behavior: 'smooth' });
    this.toastService.info('Editing product: ' + product.name);
  }

  toggleProductStatus(product: any): void {
    const tenantId = String(this.authService.getTenantId() || '');
    const updatedData = {
      ...product,
      isActive: !product.isActive
    };

    this.loanService.updateLoanProduct(tenantId, product.id, updatedData).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success(
            updatedData.isActive
              ? 'Product activated successfully! ✅'
              : 'Product deactivated successfully! ⏸️'
          );
          this.loadProducts();
        } else {
          this.toastService.error(response.message || 'Failed to update product status');
        }
      },
      error: (error) => {
        console.error('Error updating product status:', error);
        this.toastService.error('Failed to update product status');
      }
    });
  }

  deleteProduct(product: any): void {
    if (!confirm(`Are you sure you want to delete "${product.name}"?`)) {
      return;
    }

    const tenantId = String(this.authService.getTenantId() || '');

    this.loanService.deleteLoanProduct(tenantId, product.id).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success('Product deleted successfully! 🗑️');
          this.loadProducts();
        } else {
          this.toastService.error(response.message || 'Failed to delete product');
        }
      },
      error: (error) => {
        console.error('Error deleting product:', error);
        this.toastService.error('Failed to delete product');
      }
    });
  }

  resetForm(): void {
    this.editingProductId = null;
    this.productCode = '';
    this.productName = '';
    this.description = '';
    this.minAmount = 1000;
    this.maxAmount = 100000;
    this.loanTermType = 'flexible';
    this.fixedTermMonths = 3;
    this.minTermMonths = 1;
    this.maxTermMonths = 6;
    this.interestRate = 5;
    this.interestType = 'flat';
    this.processingFeePercent = 0;
    this.platformFee = 50;
    this.latePaymentPenaltyPercent = 1;
    this.gracePeriodDays = 1;
    this.isActive = true;
    this.paymentFrequency = 'weekly';
    this.previewLoanAmount = 50000;
    this.previewTermMonths = 3;
    this.previewDaysOverdue = 5;
    this.calculatePreview();
  }

  // Make Math available in template
  Math = Math;

  cancelEdit(): void {
    this.resetForm();
    this.toastService.info('Edit cancelled');
  }

  formatCurrency(amount: number): string {
    return this.calculatorService.formatCurrency(amount);
  }
}
