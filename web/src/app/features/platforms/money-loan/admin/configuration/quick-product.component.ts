import { Component, signal, inject, OnDestroy, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { Subscription } from 'rxjs';
import { LoanService } from '../../shared/services/loan.service';
import { CustomerService } from '../../shared/services/customer.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { AuthService } from '../../../../../core/services/auth.service';
import {
  LoanCalculationRequest,
  LoanCalculationResult,
  LoanInterestType,
  PaymentFrequency,
  LoanSchedulePreviewItem,
} from '../../shared/models/loan-calculation.model';

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
              } @else {
                <button
                  type="button"
                  (click)="resetForm()"
                  class="px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
                >
                  🔄 Reset Form
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
                    (input)="validateMinAmount()"
                    (blur)="validateMinAmount()"
                    name="minAmount"
                    min="0"
                    step="1000"
                    class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded focus:border-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white"
                    placeholder="1,000"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Maximum (₱)</label>
                  <input
                    type="number"
                    [(ngModel)]="maxAmount"
                    (input)="validateMaxAmount()"
                    (blur)="validateMaxAmount()"
                    name="maxAmount"
                    min="0"
                    step="1000"
                    class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded focus:border-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white"
                    placeholder="100,000"
                  />
                </div>
              </div>
            </div>

            <!-- Loan Terms -->
            <div class="bg-purple-50 dark:bg-purple-900/20 p-2.5 rounded space-y-2">
              <p class="text-xs font-semibold text-purple-700 dark:text-purple-400">📅 Loan Terms</p>

              <div class="grid grid-cols-3 gap-2">
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
                  <div class="col-span-2">
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Fixed Term (Months)</label>
                    <input
                      type="number"
                      [(ngModel)]="fixedTermMonths"
                      (input)="validateFixedTermMonths()"
                      (blur)="validateFixedTermMonths()"
                      name="fixedTermMonths"
                      min="1"
                      step="1"
                      class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded focus:border-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white"
                      placeholder="3"
                    />
                  </div>
                }

                <!-- Flexible Range -->
                @if (loanTermType === 'flexible') {
                  <div>
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Min (months)</label>
                    <input
                      type="number"
                      [(ngModel)]="minTermMonths"
                      (input)="validateMinTermMonths()"
                      (blur)="validateMinTermMonths()"
                      name="minTermMonths"
                      min="1"
                      step="1"
                      class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded focus:border-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white"
                      placeholder="1"
                    />
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Max (months)</label>
                    <input
                      type="number"
                      [(ngModel)]="maxTermMonths"
                      (input)="validateMaxTermMonths()"
                      (blur)="validateMaxTermMonths()"
                      name="maxTermMonths"
                      min="1"
                      step="1"
                      class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded focus:border-blue-500 focus:outline-none dark:bg-gray-800 dark:text-white"
                      placeholder="6"
                    />
                  </div>
                }
              </div>
            </div>

            <!-- Payment Frequency -->
            <div class="bg-indigo-50 dark:bg-indigo-900/20 p-2.5 rounded space-y-2">
              <p class="text-xs font-semibold text-indigo-700 dark:text-indigo-400">🔄 Payment Frequency</p>
              <div class="grid grid-cols-3 gap-2">
                <label class="flex items-center gap-1.5 p-1.5 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/30 cursor-pointer">
                  <input
                    type="radio"
                    [(ngModel)]="paymentFrequency"
                    name="paymentFrequency"
                    value="daily"
                    (ngModelChange)="calculatePreview()"
                    class="w-3.5 h-3.5 text-blue-600 focus:ring-1 focus:ring-blue-500"
                  />
                  <span class="text-xs text-gray-700 dark:text-gray-300">📅 Daily</span>
                </label>
                <label class="flex items-center gap-1.5 p-1.5 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/30 cursor-pointer">
                  <input
                    type="radio"
                    [(ngModel)]="paymentFrequency"
                    name="paymentFrequency"
                    value="weekly"
                    (ngModelChange)="calculatePreview()"
                    class="w-3.5 h-3.5 text-blue-600 focus:ring-1 focus:ring-blue-500"
                  />
                  <span class="text-xs text-gray-700 dark:text-gray-300">📆 Weekly</span>
                </label>
                <label class="flex items-center gap-1.5 p-1.5 rounded hover:bg-indigo-100 dark:hover:bg-indigo-900/30 cursor-pointer">
                  <input
                    type="radio"
                    [(ngModel)]="paymentFrequency"
                    name="paymentFrequency"
                    value="monthly"
                    (ngModelChange)="calculatePreview()"
                    class="w-3.5 h-3.5 text-blue-600 focus:ring-1 focus:ring-blue-500"
                  />
                  <span class="text-xs text-gray-700 dark:text-gray-300">🗓️ Monthly</span>
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

            <!-- Deduct Fees in Advance -->
            <div class="bg-green-50 dark:bg-green-900/20 p-2.5 rounded space-y-2">
              <p class="text-xs font-semibold text-green-700 dark:text-green-400">💸 Deduct Fees in Advance</p>
              
              <div class="grid grid-cols-3 gap-2">
                <label class="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 p-1.5 rounded transition">
                  <input
                    type="checkbox"
                    [(ngModel)]="deductPlatformFeeInAdvance"
                    (ngModelChange)="calculatePreview()"
                    name="deductPlatformFeeInAdvance"
                    class="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span>Platform Fee</span>
                </label>

                <label class="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 p-1.5 rounded transition">
                  <input
                    type="checkbox"
                    [(ngModel)]="deductProcessingFeeInAdvance"
                    (ngModelChange)="calculatePreview()"
                    name="deductProcessingFeeInAdvance"
                    class="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span>Processing Fee</span>
                </label>

                <label class="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-green-100 dark:hover:bg-green-900/30 p-1.5 rounded transition">
                  <input
                    type="checkbox"
                    [(ngModel)]="deductInterestInAdvance"
                    (ngModelChange)="calculatePreview()"
                    name="deductInterestInAdvance"
                    class="w-4 h-4 text-green-600 border-gray-300 rounded focus:ring-green-500"
                  />
                  <span>Interest</span>
                </label>
              </div>

              @if (deductPlatformFeeInAdvance || deductProcessingFeeInAdvance || deductInterestInAdvance) {
                <div class="p-2 bg-yellow-50 dark:bg-yellow-900/20 rounded border border-yellow-200 dark:border-yellow-800">
                  <p class="text-xs text-yellow-800 dark:text-yellow-400">
                    ⚠️ Customer receives: <span class="font-semibold">₱{{ formatCurrency(getNetDisbursement()) }}</span>
                  </p>
                </div>
              }
            </div>

            <!-- Product Availability -->
            <div class="bg-orange-50 dark:bg-orange-900/20 p-2.5 rounded space-y-2">
              <p class="text-xs font-semibold text-orange-700 dark:text-orange-400">👥 Product Availability</p>
              
              <div class="grid grid-cols-3 gap-2">
                <label class="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/30 p-1.5 rounded transition">
                  <input
                    type="radio"
                    [(ngModel)]="availabilityType"
                    name="availabilityType"
                    value="all"
                    (ngModelChange)="onAvailabilityTypeChange()"
                    class="w-3.5 h-3.5 text-orange-600 focus:ring-1 focus:ring-orange-500"
                  />
                  <span>🌐 All Customers</span>
                </label>

                <label class="flex items-center gap-1.5 text-xs text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-orange-100 dark:hover:bg-orange-900/30 p-1.5 rounded transition">
                  <input
                    type="radio"
                    [(ngModel)]="availabilityType"
                    name="availabilityType"
                    value="selected"
                    (ngModelChange)="onAvailabilityTypeChange()"
                    class="w-3.5 h-3.5 text-orange-600 focus:ring-1 focus:ring-orange-500"
                  />
                  <span>🎯 Selected Only</span>
                </label>

                @if (availabilityType === 'selected') {
                  <button
                    type="button"
                    (click)="openCustomerSelector()"
                    class="text-xs bg-orange-600 hover:bg-orange-700 text-white py-1.5 px-3 rounded flex items-center justify-center gap-1"
                  >
                    <span>👤</span>
                    <span>Select ({{ selectedCustomerIds.length }})</span>
                  </button>
                }
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

            <!-- Compute Button -->
            <button
              type="button"
              (click)="calculatePreview()"
              [disabled]="previewLoading()"
              class="w-full mb-4 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 disabled:from-gray-400 disabled:to-gray-500 text-white text-sm font-semibold py-2.5 px-4 rounded-lg shadow-md hover:shadow-lg transition-all duration-200 flex items-center justify-center gap-2"
            >
              @if (previewLoading()) {
                <span>⏳</span>
                <span>Computing...</span>
              } @else {
                <span>🧮</span>
                <span>Compute Preview</span>
              }
            </button>

            @if (previewLoading()) {
              <div class="text-center py-8 text-gray-500 dark:text-gray-300">
                <div class="text-4xl mb-3 animate-spin">⏳</div>
                <p class="text-xs font-semibold">Calculating preview…</p>
                <p class="text-xs opacity-70">Fetching the latest repayment details.</p>
              </div>
            } @else if (previewError()) {
              <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-300 rounded-lg p-4">
                <div class="flex items-start gap-2">
                  <span class="text-lg">⚠️</span>
                  <div class="text-xs space-y-1">
                    <p class="font-semibold">Unable to generate preview</p>
                    <p>{{ previewError() }}</p>
                  </div>
                </div>
              </div>
            } @else if (preview()) {
              <!-- Deduct in Advance Warning -->
              @if (deductPlatformFeeInAdvance || deductProcessingFeeInAdvance || deductInterestInAdvance) {
                <div class="mb-3 p-3 bg-gradient-to-r from-yellow-50 to-orange-50 dark:from-yellow-900/20 dark:to-orange-900/20 rounded-lg border border-yellow-300 dark:border-yellow-700">
                  <div class="flex items-start gap-2">
                    <span class="text-lg">💸</span>
                    <div class="flex-1 space-y-1.5">
                      <p class="text-xs font-semibold text-yellow-800 dark:text-yellow-300">Fees Deducted in Advance</p>
                      <div class="text-xs text-yellow-700 dark:text-yellow-400 space-y-0.5">
                        @if (deductPlatformFeeInAdvance) {
                          <div class="flex justify-between">
                            <span>Platform Fee:</span>
                            <span class="font-semibold">-{{ formatCurrency(preview()!.platformFee) }}</span>
                          </div>
                        }
                        @if (deductProcessingFeeInAdvance) {
                          <div class="flex justify-between">
                            <span>Processing Fee:</span>
                            <span class="font-semibold">-{{ formatCurrency(preview()!.processingFeeAmount) }}</span>
                          </div>
                        }
                        @if (deductInterestInAdvance) {
                          <div class="flex justify-between">
                            <span>Interest:</span>
                            <span class="font-semibold">-{{ formatCurrency(preview()!.interestAmount) }}</span>
                          </div>
                        }
                      </div>
                      <div class="pt-1.5 mt-1.5 border-t border-yellow-400 dark:border-yellow-700">
                        <div class="flex justify-between items-center">
                          <span class="text-xs font-bold text-yellow-900 dark:text-yellow-200">Customer Receives:</span>
                          <span class="text-base font-bold text-yellow-900 dark:text-yellow-200">{{ formatCurrency(getNetDisbursement()) }}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              }

              <!-- Quick Stats Grid -->
              <div class="grid grid-cols-2 gap-2 mb-3">
                <div class="bg-green-50 dark:bg-green-900/20 rounded p-2">
                  <p class="text-xs text-green-600 dark:text-green-400">
                    @if (deductPlatformFeeInAdvance || deductProcessingFeeInAdvance || deductInterestInAdvance) {
                      <span>Disbursed Amount</span>
                    } @else {
                      <span>Net Proceeds</span>
                    }
                  </p>
                  <p class="text-sm font-bold text-green-700 dark:text-green-300">
                    @if (deductPlatformFeeInAdvance || deductProcessingFeeInAdvance || deductInterestInAdvance) {
                      {{ formatCurrency(getNetDisbursement()) }}
                    } @else {
                      {{ formatCurrency(preview()!.netProceeds) }}
                    }
                  </p>
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

              <!-- Payment Cadence Summary -->
              <div class="bg-white dark:bg-gray-900/40 rounded border border-gray-200 dark:border-gray-700 p-3 space-y-2">
                <div class="flex items-center justify-between">
                  <p class="text-xs font-semibold text-indigo-700 dark:text-indigo-300 flex items-center gap-1">
                    <span>🔁</span>
                    <span>Payment Cadence</span>
                  </p>
                  <div class="flex items-center gap-2">
                    <span class="text-xs text-gray-500 dark:text-gray-400">{{ getPaymentFrequencyLabel() }}</span>
                    @if (cadencePreview().length) {
                      <button
                        type="button"
                        (click)="toggleUpcomingInstallments()"
                        class="text-[11px] px-2 py-0.5 rounded border border-indigo-200 dark:border-indigo-700 text-indigo-600 dark:text-indigo-300 hover:bg-indigo-50 dark:hover:bg-indigo-900/30 transition"
                        title="Toggle upcoming installments"
                      >
                        {{ showUpcomingInstallments() ? 'Hide' : 'Show' }}
                      </button>
                    }
                  </div>
                </div>
                <div class="space-y-1 text-xs">
                  <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Installment</span>
                    <span class="font-semibold text-gray-900 dark:text-white">{{ formatCurrency(preview()!.installmentAmount) }} {{ getCadenceSuffix() }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Schedule</span>
                    <span class="font-semibold text-gray-900 dark:text-white">
                      {{ preview()!.numPayments }} {{ preview()!.numPayments === 1 ? 'payment' : 'payments' }}
                      ({{ getDurationDescriptor() }})
                    </span>
                  </div>
                  @if (getFirstPaymentDate()) {
                    <div class="flex justify-between">
                      <span class="text-gray-600 dark:text-gray-400">First Due</span>
                      <span class="font-semibold text-gray-900 dark:text-white">{{ getFirstPaymentDate() }}</span>
                    </div>
                  }
                  @if (getLastPaymentDate()) {
                    <div class="flex justify-between">
                      <span class="text-gray-600 dark:text-gray-400">Final Due</span>
                      <span class="font-semibold text-gray-900 dark:text-white">{{ getLastPaymentDate() }}</span>
                    </div>
                  }
                </div>
                @if (cadencePreview().length) {
                  <div class="pt-2 mt-2 border-t border-indigo-100 dark:border-indigo-800/60">
                    <p class="text-[11px] font-semibold uppercase text-indigo-600 dark:text-indigo-300 tracking-wide mb-1.5">
                      Upcoming Installments
                    </p>
                    @if (showUpcomingInstallments()) {
                      <div class="space-y-1.5">
                        @for (item of cadencePreview(); track item.paymentNumber) {
                          <div class="flex items-start justify-between text-xs">
                            <div>
                              <p class="font-medium text-gray-700 dark:text-gray-300">{{ getCadenceLabel(item.paymentNumber) }}</p>
                              @if (getCadenceDueDate(item)) {
                                <p class="text-[11px] text-gray-500 dark:text-gray-400">{{ getCadenceDueDate(item) }}</p>
                              }
                            </div>
                            <div class="text-right">
                              <p class="font-semibold text-gray-900 dark:text-white">{{ formatCurrency(item.installmentAmount) }}</p>
                            </div>
                          </div>
                        }
                        @if (cadenceRemainingCount() > 0) {
                          <p class="text-[11px] text-gray-500 dark:text-gray-400 italic">
                            + {{ cadenceRemainingCount() }} more {{ cadenceRemainingCount() === 1 ? 'payment' : 'payments' }}
                          </p>
                        }
                      </div>
                    } @else {
                      <p class="text-[11px] text-gray-500 dark:text-gray-400 italic">Upcoming installments hidden</p>
                    }
                  </div>
                }
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
                        <th class="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Term</th>
                        <th class="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Interest</th>
                        <th class="px-3 py-2 text-center text-xs font-semibold text-gray-700 dark:text-gray-300">Availability</th>
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
                                <span class="text-xs font-medium">{{ Math.round((product.fixedTermDays || 90) / 30) }}mo Fixed</span>
                              </div>
                            } @else {
                              <div class="text-xs text-gray-700 dark:text-gray-300">
                                <p class="font-medium">{{ Math.round(product.minTermDays / 30) }}-{{ Math.round(product.maxTermDays / 30) }}mo</p>
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
                          <td class="px-3 py-2 text-center">
                            @if (product.availabilityType === 'all') {
                              <div class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300">
                                <span class="text-xs">🌐</span>
                                <span class="text-xs font-medium">All Customers</span>
                              </div>
                            } @else {
                              <div class="inline-flex items-center gap-1 px-2 py-0.5 rounded bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300">
                                <span class="text-xs">🎯</span>
                                <span class="text-xs font-medium">Selected ({{ product.selectedCustomerIds?.length || 0 }})</span>
                              </div>
                            }
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

    <!-- Customer Selector Modal -->
    @if (showCustomerSelector) {
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" (click)="closeCustomerSelector()">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[80vh] flex flex-col" (click)="$event.stopPropagation()">
          <!-- Modal Header -->
          <div class="flex items-center justify-between p-4 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h3 class="text-lg font-bold text-gray-900 dark:text-white">👥 Select Customers</h3>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Choose which customers can access this product
              </p>
            </div>
            <button
              (click)="closeCustomerSelector()"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <span class="text-2xl">×</span>
            </button>
          </div>

          <!-- Search and Actions Bar -->
          <div class="p-4 border-b border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-3 mb-3">
              <div class="relative flex-1">
                <input
                  type="text"
                  [(ngModel)]="customerSearchQuery"
                  (input)="onCustomerSearchChange()"
                  placeholder="🔍 Search by name, code, or email..."
                  class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                />
                @if (searchingCustomers()) {
                  <div class="absolute right-3 top-2.5">
                    <div class="animate-spin text-blue-600 text-sm">⏳</div>
                  </div>
                }
              </div>
              <select
                [(ngModel)]="customerPageSize"
                (ngModelChange)="onPageSizeChange()"
                class="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option [value]="10">10 per page</option>
                <option [value]="25">25 per page</option>
                <option [value]="50">50 per page</option>
                <option [value]="100">100 per page</option>
              </select>
            </div>
            
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                @if (selectedCustomerIds.length > 0) {
                  <span class="text-xs font-semibold text-blue-600 dark:text-blue-400">
                    {{ selectedCustomerIds.length }} selected
                  </span>
                  <button
                    (click)="clearAllSelections()"
                    class="text-xs text-red-600 hover:text-red-700 dark:text-red-400 font-medium"
                  >
                    Clear
                  </button>
                }
              </div>
              <button
                (click)="selectAllOnPage()"
                [disabled]="filteredCustomers().length === 0"
                class="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Select All on Page
              </button>
            </div>
          </div>

          <!-- Customer Table -->
          <div class="flex-1 overflow-auto">
            @if (loadingCustomers()) {
              <div class="flex items-center justify-center h-64">
                <div class="text-center">
                  <div class="animate-spin text-4xl mb-3">⏳</div>
                  <p class="text-sm text-gray-500">Loading customers...</p>
                </div>
              </div>
            } @else if (filteredCustomers().length === 0) {
              <div class="flex items-center justify-center h-64">
                <div class="text-center">
                  <div class="text-5xl mb-3">📭</div>
                  <p class="text-sm text-gray-500 font-medium">No customers found</p>
                  @if (customerSearchQuery.trim()) {
                    <button
                      (click)="clearSearchAndReload()"
                      class="mt-2 text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium"
                    >
                      Clear search
                    </button>
                  }
                </div>
              </div>
            } @else {
              <table class="w-full">
                <thead class="bg-gray-50 dark:bg-gray-700 sticky top-0">
                  <tr>
                    <th class="w-10 px-4 py-3 text-left">
                      <input
                        type="checkbox"
                        [checked]="areAllOnPageSelected()"
                        [indeterminate]="areSomeOnPageSelected()"
                        (change)="toggleAllOnPage()"
                        class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                      />
                    </th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Code</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Name</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Email</th>
                    <th class="px-4 py-3 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Status</th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                  @for (customer of filteredCustomers(); track customer.id) {
                    <tr 
                      class="hover:bg-gray-50 dark:hover:bg-gray-700/30 cursor-pointer transition"
                      [class.bg-blue-50]="isCustomerSelected(customer.id)"
                      [class.dark:bg-blue-900/20]="isCustomerSelected(customer.id)"
                      (click)="toggleCustomerSelection(customer.id)"
                    >
                      <td class="px-4 py-3" (click)="$event.stopPropagation()">
                        <input
                          type="checkbox"
                          [checked]="isCustomerSelected(customer.id)"
                          (change)="toggleCustomerSelection(customer.id)"
                          class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                        />
                      </td>
                      <td class="px-4 py-3">
                        <span class="text-xs font-mono text-blue-600 dark:text-blue-400 font-semibold">
                          {{ customer.customerCode }}
                        </span>
                      </td>
                      <td class="px-4 py-3">
                        <span class="text-sm font-medium text-gray-900 dark:text-white">
                          {{ customer.fullName }}
                        </span>
                      </td>
                      <td class="px-4 py-3">
                        <span class="text-sm text-gray-600 dark:text-gray-400">
                          {{ customer.email || '-' }}
                        </span>
                      </td>
                      <td class="px-4 py-3">
                        <span 
                          class="inline-flex px-2 py-0.5 text-xs font-medium rounded-full"
                          [class]="customer.kycStatus === 'verified' 
                            ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                            : 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400'"
                        >
                          {{ customer.kycStatus || 'pending' }}
                        </span>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            }
          </div>

          <!-- Pagination Footer -->
          <div class="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800">
            <div class="flex items-center justify-between">
              <div class="text-xs text-gray-600 dark:text-gray-400">
                Showing {{ ((customerPagination().page - 1) * customerPageSize) + 1 }} 
                to {{ Math.min(customerPagination().page * customerPageSize, customerPagination().total) }}
                of {{ customerPagination().total }} customers
              </div>
              
              <div class="flex items-center gap-2">
                <button
                  (click)="goToCustomerPage(1)"
                  [disabled]="customerPagination().page === 1 || loadingCustomers()"
                  class="px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  ⏮ First
                </button>
                <button
                  (click)="goToCustomerPage(customerPagination().page - 1)"
                  [disabled]="customerPagination().page === 1 || loadingCustomers()"
                  class="px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  ← Prev
                </button>
                
                <span class="px-3 py-1 text-xs font-medium text-gray-900 dark:text-white">
                  Page {{ customerPagination().page }} of {{ Math.ceil(customerPagination().total / customerPageSize) || 1 }}
                </span>
                
                <button
                  (click)="goToCustomerPage(customerPagination().page + 1)"
                  [disabled]="!customerPagination().hasMore || loadingCustomers()"
                  class="px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next →
                </button>
                <button
                  (click)="goToCustomerPage(Math.ceil(customerPagination().total / customerPageSize))"
                  [disabled]="!customerPagination().hasMore || loadingCustomers()"
                  class="px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 rounded disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Last ⏭
                </button>
              </div>
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="flex items-center justify-between p-4 border-t border-gray-200 dark:border-gray-700">
            <div class="text-sm text-gray-600 dark:text-gray-400">
              <span class="font-semibold text-blue-600 dark:text-blue-400">{{ selectedCustomerIds.length }}</span> customer(s) selected
            </div>
            <div class="flex gap-2">
              <button
                (click)="closeCustomerSelector()"
                class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
              >
                Cancel
              </button>
              <button
                (click)="confirmCustomerSelection()"
                class="px-4 py-2 text-sm font-medium bg-blue-600 hover:bg-blue-700 text-white rounded shadow-sm transition"
              >
                ✓ Confirm Selection
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `,
  styles: []
})
export class QuickProductComponent implements OnDestroy {
  private loanService = inject(LoanService);
  private customerService = inject(CustomerService);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private previewSubscription?: Subscription;
  private previewTimer?: ReturnType<typeof setTimeout>;
  private lastPreviewKey: string | null = null;

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
  interestType: LoanInterestType = 'flat';
  processingFeePercent = 0;
  platformFee = 50;
  latePaymentPenaltyPercent = 1;
  gracePeriodDays = 1;
  isActive = true;
  paymentFrequency: PaymentFrequency = 'weekly';
  previewLoanAmount = 0; // Default to min amount, set in ngOnInit
  previewTermMonths = 0; // Default to min term, set in ngOnInit
  previewDaysOverdue = 5; // For penalty calculation
  penaltyAmount = signal<number>(0);
  
  // Deduct in advance options
  deductPlatformFeeInAdvance = false;
  deductProcessingFeeInAdvance = false;
  deductInterestInAdvance = false;
  
  // Product availability
  availabilityType: 'all' | 'selected' = 'all';
  selectedCustomerIds: number[] = [];
  showCustomerSelector = false;
  
  // Customer selection
  customers = signal<any[]>([]);
  filteredCustomers = signal<any[]>([]);
  loadingCustomers = signal(false);
  searchingCustomers = signal(false);
  customerSearchQuery = '';
  customerPageSize = 10;
  customerPagination = signal({ page: 1, limit: 10, total: 0, hasMore: false });
  private searchTimeout?: ReturnType<typeof setTimeout>;

  // State
  saving = signal(false);
  preview = signal<LoanCalculationResult | null>(null);
  previewSchedule = signal<LoanSchedulePreviewItem[]>([]);
  showUpcomingInstallments = signal<boolean>(true);

  private readonly cadencePreviewLimits: Record<PaymentFrequency, number> = {
    daily: 7,
    weekly: 4,
    biweekly: 3,
    monthly: 3,
  };

  cadencePreview = computed<LoanSchedulePreviewItem[]>(() => {
    const schedule = this.previewSchedule();
    if (!schedule.length) {
      return [];
    }

    const preview = this.preview();
    const frequency = this.normalizeFrequency(
      (preview?.paymentFrequency as PaymentFrequency) || this.paymentFrequency
    );
    const limit = this.cadencePreviewLimits[frequency] ?? 4;
    return schedule.slice(0, limit);
  });

  cadenceRemainingCount = computed<number>(() => {
    const schedule = this.previewSchedule();
    if (!schedule.length) {
      return 0;
    }

    const preview = this.preview();
    const frequency = this.normalizeFrequency(
      (preview?.paymentFrequency as PaymentFrequency) || this.paymentFrequency
    );
    const limit = this.cadencePreviewLimits[frequency] ?? 4;
    return Math.max(0, schedule.length - limit);
  });
  previewLoading = signal(false);
  previewError = signal<string | null>(null);
  products = signal<any[]>([]);
  loading = signal(false);
  editingProductId: number | null = null;
  activeView: 'create' | 'products' = 'create'; // Sidebar navigation
  searchQuery = '';
  filteredProducts = signal<any[]>([]);

  constructor() {
    // Set default preview values to minimum amounts
  this.previewLoanAmount = this.minAmount;
  this.previewTermMonths = this.minTermMonths;
    
    // Don't auto-calculate on init, user must click "Compute Preview"
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

  validateMinAmount(): void {
    // Remove leading zeros and ensure it's a valid number
    this.minAmount = Number(this.minAmount) || 0;

    // Ensure it's not negative
    if (this.minAmount < 0) {
      this.minAmount = 0;
    }

    // Keep preview amount aligned with minimums
    if (this.editingProductId) {
      if (this.previewLoanAmount < this.minAmount) {
        this.previewLoanAmount = this.minAmount;
      }
    } else {
      this.previewLoanAmount = this.minAmount;
    }

    // Trigger preview calculation
    this.calculatePreview();
  }

  validateMaxAmount(): void {
    // Remove leading zeros and ensure it's a valid number
    this.maxAmount = Number(this.maxAmount) || 0;

    // Ensure it's not negative
    if (this.maxAmount < 0) {
      this.maxAmount = 0;
    }

    // Only set max to min if max is explicitly less than min (not when it's being increased)
    // This was causing the bug where increasing max would reset it to min
    // if (this.maxAmount > 0 && this.maxAmount < this.minAmount) {
    //   this.maxAmount = this.minAmount;
    // }

    // Trigger preview calculation
    this.calculatePreview();
  }

  validateMinTermMonths(): void {
    // Round to whole number and remove leading zeros
    this.minTermMonths = Math.round(Number(this.minTermMonths)) || 1;

    // Ensure minimum is at least 1
    if (this.minTermMonths < 1) {
      this.minTermMonths = 1;
    }

    // Align preview term with the new minimum when flexible
    if (this.loanTermType === 'flexible') {
      if (this.editingProductId) {
        if (this.previewTermMonths < this.minTermMonths) {
          this.previewTermMonths = this.minTermMonths;
        }
      } else {
        this.previewTermMonths = this.minTermMonths;
      }
    }

    // Trigger preview calculation
    this.calculatePreview();
  }

  validateMaxTermMonths(): void {
    // Round to whole number and remove leading zeros
    this.maxTermMonths = Math.round(Number(this.maxTermMonths)) || 1;

    // Ensure minimum is at least 1
    if (this.maxTermMonths < 1) {
      this.maxTermMonths = 1;
    }

    // Ensure max is not less than min
    if (this.maxTermMonths < this.minTermMonths) {
      this.maxTermMonths = this.minTermMonths;
    }

    // Trigger preview calculation
    this.calculatePreview();
  }

  validateFixedTermMonths(): void {
    // Round to whole number and remove leading zeros
    this.fixedTermMonths = Math.round(Number(this.fixedTermMonths)) || 1;

    // Ensure minimum is at least 1
    if (this.fixedTermMonths < 1) {
      this.fixedTermMonths = 1;
    }

    // Trigger preview calculation
    this.calculatePreview();
  }

  calculatePenalty(): void {
    const preview = this.preview();
    if (!preview) {
      this.penaltyAmount.set(0);
      return;
    }

    const overdueDays = Math.max(0, Number(this.previewDaysOverdue) || 0);
    const graceDays = Math.max(0, Number(this.gracePeriodDays) || 0);
    const penaltyRate = Math.max(0, Number(this.latePaymentPenaltyPercent) || 0);
    const billableDays = Math.max(0, overdueDays - graceDays);
    const dailyPenalty = preview.installmentAmount * (penaltyRate / 100);
    const totalPenalty = dailyPenalty * billableDays;

    this.penaltyAmount.set(totalPenalty);
  }

  calculatePreview(): void {
    if (this.minAmount <= 0) {
      this.resetPreview();
      return;
    }

    let calculationAmount = Number(this.previewLoanAmount) || 0;
    if (calculationAmount < this.minAmount || calculationAmount > this.maxAmount) {
      calculationAmount = (Number(this.minAmount) + Number(this.maxAmount)) / 2;
      this.previewLoanAmount = calculationAmount;
    }

    let calculationTerm: number;
    if (this.loanTermType === 'fixed') {
      calculationTerm = Math.max(1, Math.round(Number(this.fixedTermMonths) || 0));
      this.fixedTermMonths = calculationTerm;
      this.previewTermMonths = calculationTerm;
    } else {
      calculationTerm = Math.max(1, Math.round(Number(this.previewTermMonths) || 0));
      if (calculationTerm < this.minTermMonths || calculationTerm > this.maxTermMonths) {
        calculationTerm = Math.ceil((this.minTermMonths + this.maxTermMonths) / 2);
        this.previewTermMonths = calculationTerm;
      }
    }

    const request = this.buildPreviewRequest(calculationAmount, calculationTerm);
    if (!request) {
      this.resetPreview();
      return;
    }

    const cacheKey = JSON.stringify(request);
    if (this.lastPreviewKey === cacheKey && this.preview()) {
      this.calculatePenalty();
      return;
    }

    this.lastPreviewKey = null;
    this.cancelPendingPreview();
    this.previewLoading.set(true);
    this.previewError.set(null);

    this.previewTimer = setTimeout(() => {
      this.previewSubscription = this.loanService.calculateLoanPreview(request).subscribe({
        next: (response) => {
          this.previewLoading.set(false);
          this.preview.set(response.calculation);
          this.previewSchedule.set(response.schedule || []);
          this.lastPreviewKey = cacheKey;
          this.calculatePenalty();
        },
        error: (error) => {
          console.error('Error fetching loan preview:', error);
          this.previewLoading.set(false);
          const message = error?.error?.message || 'Unable to calculate loan preview';
          this.previewError.set(message);
          this.preview.set(null);
          this.lastPreviewKey = null;
          this.penaltyAmount.set(0);
          this.previewSchedule.set([]);
        },
      });
    }, 200);
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
      isActive: this.isActive,
      deductPlatformFeeInAdvance: this.deductPlatformFeeInAdvance,
      deductProcessingFeeInAdvance: this.deductProcessingFeeInAdvance,
      deductInterestInAdvance: this.deductInterestInAdvance,
      availabilityType: this.availabilityType,
      selectedCustomerIds: this.availabilityType === 'selected' ? this.selectedCustomerIds : []
    };

    if (this.editingProductId) {
      // Update existing product
      this.loanService.updateLoanProduct(tenantId, this.editingProductId, productData).subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success('Product updated successfully! ✅');
            this.resetForm();
            this.activeView = 'products';
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
          console.log('📦 Raw products from API:', response.data);
          console.log('🔍 First product keys:', response.data[0] ? Object.keys(response.data[0]) : 'no products');
          console.log('🔍 First product minAmount:', response.data[0]?.minAmount);
          console.log('🔍 First product maxAmount:', response.data[0]?.maxAmount);

          // Ensure all numeric fields are converted from strings to numbers (PostgreSQL returns decimals as strings)
          const normalizedProducts = response.data.map((p: any) => ({
            ...p,
            minAmount: Number(p.minAmount) || 0,
            maxAmount: Number(p.maxAmount) || 0,
            interestRate: Number(p.interestRate) || 0,
            minTermDays: Number(p.minTermDays) || 30,
            maxTermDays: Number(p.maxTermDays) || 360,
            fixedTermDays: Number(p.fixedTermDays) || 90,
            processingFeePercent: Number(p.processingFeePercent) || 0,
            platformFee: Number(p.platformFee) || 0,
            latePaymentPenaltyPercent: Number(p.latePaymentPenaltyPercent) || 0,
            gracePeriodDays: Number(p.gracePeriodDays) || 0
          }));

          console.log('✅ Normalized products:', normalizedProducts);
          this.products.set(normalizedProducts);
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
    
    // Load deduct in advance options
    this.deductPlatformFeeInAdvance = product.deductPlatformFeeInAdvance || false;
    this.deductProcessingFeeInAdvance = product.deductProcessingFeeInAdvance || false;
    this.deductInterestInAdvance = product.deductInterestInAdvance || false;
    
    // Load availability options
    this.availabilityType = product.availabilityType || 'all';
    this.selectedCustomerIds = product.selectedCustomerIds || [];
    
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
    this.previewLoanAmount = this.minAmount;
    this.previewTermMonths = this.minTermMonths;
    this.previewDaysOverdue = 5;
    this.deductPlatformFeeInAdvance = false;
    this.deductProcessingFeeInAdvance = false;
    this.deductInterestInAdvance = false;
    this.availabilityType = 'all';
    this.selectedCustomerIds = [];
    this.previewSchedule.set([]);
    this.calculatePreview();
  }

  onAvailabilityTypeChange(): void {
    if (this.availabilityType === 'all') {
      this.selectedCustomerIds = [];
    }
  }

  openCustomerSelector(): void {
    this.showCustomerSelector = true;
    this.customerSearchQuery = '';
    this.loadCustomers(1);
  }

  closeCustomerSelector(): void {
    this.showCustomerSelector = false;
    this.customerSearchQuery = '';
    this.filteredCustomers.set([]);
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }
  }

  onCustomerSearchChange(): void {
    // Clear previous timeout
    if (this.searchTimeout) {
      clearTimeout(this.searchTimeout);
    }

    // Debounce search by 400ms
    this.searchTimeout = setTimeout(() => {
      this.loadCustomers(1);
    }, 400);
  }

  loadCustomers(page: number = 1): void {
    this.loadingCustomers.set(true);
    
    const query = this.customerSearchQuery.trim();
    
    // Build params object, only include search if it has a value
    const params: any = {
      page: page,
      limit: this.customerPageSize
    };
    
    if (query) {
      params.search = query;
    }
    
    console.log('🔍 Loading customers with params:', params);
    
    this.customerService.listCustomers(params).subscribe({
      next: (response) => {
        console.log('✅ Customers loaded:', response);
        
        if (response.success && response.data) {
          this.filteredCustomers.set(response.data);
          console.log('📋 Filtered customers set:', response.data.length);
          console.log('📋 Raw pagination from API:', response.pagination);

          // Update pagination info
          if (response.pagination) {
            const totalPages = response.pagination.totalPages || response.pagination.pages || 1;
            this.customerPagination.set({
              page: response.pagination.page,
              limit: response.pagination.limit,
              total: response.pagination.total,
              hasMore: response.pagination.page < totalPages
            });
            console.log('📄 Pagination:', this.customerPagination());
          }
        } else {
          console.warn('⚠️ No data in response or success=false');
        }
        this.loadingCustomers.set(false);
      },
      error: (error) => {
        console.error('❌ Error loading customers:', error);
        this.toastService.error('Failed to load customers: ' + (error.error?.message || error.message));
        this.loadingCustomers.set(false);
      }
    });
  }

  goToCustomerPage(page: number): void {
    if (page < 1) return;
    const maxPage = Math.ceil(this.customerPagination().total / this.customerPageSize);
    if (page > maxPage) return;
    
    this.loadCustomers(page);
  }

  onPageSizeChange(): void {
    this.customerPagination.update(p => ({ ...p, limit: this.customerPageSize }));
    this.loadCustomers(1);
  }

  clearSearchAndReload(): void {
    this.customerSearchQuery = '';
    this.loadCustomers(1);
  }

  isCustomerSelected(customerId: number): boolean {
    return this.selectedCustomerIds.includes(customerId);
  }

  toggleCustomerSelection(customerId: number): void {
    const index = this.selectedCustomerIds.indexOf(customerId);
    if (index > -1) {
      this.selectedCustomerIds.splice(index, 1);
    } else {
      this.selectedCustomerIds.push(customerId);
    }
  }

  areAllOnPageSelected(): boolean {
    if (this.filteredCustomers().length === 0) return false;
    return this.filteredCustomers().every((c: any) => this.isCustomerSelected(c.id));
  }

  areSomeOnPageSelected(): boolean {
    if (this.filteredCustomers().length === 0) return false;
    const selected = this.filteredCustomers().filter((c: any) => this.isCustomerSelected(c.id));
    return selected.length > 0 && selected.length < this.filteredCustomers().length;
  }

  toggleAllOnPage(): void {
    const allSelected = this.areAllOnPageSelected();
    const pageIds = this.filteredCustomers().map((c: any) => c.id);
    
    if (allSelected) {
      // Deselect all on page
      this.selectedCustomerIds = this.selectedCustomerIds.filter(id => !pageIds.includes(id));
    } else {
      // Select all on page
      pageIds.forEach(id => {
        if (!this.selectedCustomerIds.includes(id)) {
          this.selectedCustomerIds.push(id);
        }
      });
    }
  }

  selectAllOnPage(): void {
    const pageIds = this.filteredCustomers().map((c: any) => c.id);
    pageIds.forEach(id => {
      if (!this.selectedCustomerIds.includes(id)) {
        this.selectedCustomerIds.push(id);
      }
    });
    this.toastService.success(`${pageIds.length} customer(s) selected`);
  }

  clearAllSelections(): void {
    const count = this.selectedCustomerIds.length;
    this.selectedCustomerIds = [];
    this.toastService.info(`${count} selection(s) cleared`);
  }

  confirmCustomerSelection(): void {
    this.showCustomerSelector = false;
    this.customerSearchQuery = '';
    this.toastService.success(`${this.selectedCustomerIds.length} customer(s) selected`);
  }

  // Make Math available in template
  Math = Math;

  cancelEdit(): void {
    this.resetForm();
    this.toastService.info('Edit cancelled');
  }

  getNetDisbursement(): number {
    const preview = this.preview();
    if (!preview) {
      return this.previewLoanAmount;
    }

    let netAmount = preview.loanAmount;

    // Use product deduct settings for calculator display
    if (this.deductPlatformFeeInAdvance) {
      netAmount -= preview.platformFee;
    }

    if (this.deductProcessingFeeInAdvance) {
      netAmount -= preview.processingFeeAmount;
    }

    if (this.deductInterestInAdvance) {
      netAmount -= preview.interestAmount;
    }

    return Math.max(0, netAmount);
  }

  getPaymentFrequencyLabel(): string {
    const frequency = this.normalizeFrequency((this.preview()?.paymentFrequency as PaymentFrequency) || this.paymentFrequency);
    const labels: Record<PaymentFrequency, string> = {
      daily: 'Daily Payments',
      weekly: 'Weekly Payments',
      biweekly: 'Bi-Weekly Payments',
      monthly: 'Monthly Payments',
    };
    return labels[frequency];
  }

  getCadenceSuffix(): string {
    const frequency = this.normalizeFrequency((this.preview()?.paymentFrequency as PaymentFrequency) || this.paymentFrequency);
    const suffix: Record<PaymentFrequency, string> = {
      daily: 'per day',
      weekly: 'per week',
      biweekly: 'every 2 weeks',
      monthly: 'per month',
    };
    return suffix[frequency];
  }

  toggleUpcomingInstallments(): void {
    this.showUpcomingInstallments.set(!this.showUpcomingInstallments());
  }

  getCadenceLabel(paymentNumber: number): string {
    const frequency = this.normalizeFrequency(
      (this.preview()?.paymentFrequency as PaymentFrequency) || this.paymentFrequency
    );
    const labels: Record<PaymentFrequency, string> = {
      daily: 'Day',
      weekly: 'Week',
      biweekly: 'Bi-Week',
      monthly: 'Month',
    };
    const base = labels[frequency] || 'Payment';
    return `${base} ${paymentNumber}`;
  }

  getCadenceDueDate(item: LoanSchedulePreviewItem): string | null {
    return this.formatScheduleDate(item.dueDate);
  }

  getDurationDescriptor(): string {
    const preview = this.preview();
    if (!preview) {
      return '—';
    }

    const frequency = this.normalizeFrequency(preview.paymentFrequency as PaymentFrequency);
    const spanMap: Record<PaymentFrequency, { multiplier: number; unit: string }> = {
      daily: { multiplier: 1, unit: 'day' },
      weekly: { multiplier: 1, unit: 'week' },
      biweekly: { multiplier: 2, unit: 'week' },
      monthly: { multiplier: 1, unit: 'month' },
    };

    const meta = spanMap[frequency];
    const totalUnits = Math.max(0, Math.round(preview.numPayments * meta.multiplier));
    if (!totalUnits) {
      return '—';
    }

    const unitLabel = totalUnits === 1 ? meta.unit : `${meta.unit}s`;
    return `≈ ${totalUnits} ${unitLabel}`;
  }

  getFirstPaymentDate(): string | null {
    const schedule = this.previewSchedule();
    if (!schedule.length) {
      return null;
    }
    return this.formatScheduleDate(schedule[0].dueDate);
  }

  getLastPaymentDate(): string | null {
    const schedule = this.previewSchedule();
    if (!schedule.length) {
      return null;
    }
    return this.formatScheduleDate(schedule[schedule.length - 1].dueDate);
  }

  private formatScheduleDate(value: string | Date): string | null {
    if (!value) {
      return null;
    }

    const date = value instanceof Date ? value : new Date(value);
    if (Number.isNaN(date.getTime())) {
      return null;
    }

    return date.toLocaleDateString('en-PH', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
    });
  }

  formatCurrency(amount: number): string {
    const value = Number.isFinite(amount) ? amount : 0;
    return `₱${value.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    })}`;
  }

  ngOnDestroy(): void {
    this.cancelPendingPreview();
  }

  private buildPreviewRequest(amount: number, termMonths: number): LoanCalculationRequest | null {
    const loanAmount = Math.max(0, Number(amount) || 0);
    if (loanAmount <= 0) {
      return null;
    }

    const term = Math.max(1, Math.round(Number(termMonths) || 0));
    if (!Number.isFinite(term) || term <= 0) {
      return null;
    }

    return {
      loanAmount,
      termMonths: term,
      paymentFrequency: this.normalizeFrequency(this.paymentFrequency),
      interestRate: Math.max(0, Number(this.interestRate) || 0),
      interestType: this.normalizeInterestType(this.interestType),
      processingFeePercentage: Math.max(0, Number(this.processingFeePercent) || 0),
      platformFee: Math.max(0, Number(this.platformFee) || 0),
      latePenaltyPercentage: Math.max(0, Number(this.latePaymentPenaltyPercent) || 0),
      deductPlatformFeeInAdvance: this.deductPlatformFeeInAdvance,
      deductProcessingFeeInAdvance: this.deductProcessingFeeInAdvance,
      deductInterestInAdvance: this.deductInterestInAdvance,
    };
  }

  private normalizeFrequency(value: string | PaymentFrequency): PaymentFrequency {
    const normalized = (value || 'weekly').toString().toLowerCase() as PaymentFrequency;
    const allowed: PaymentFrequency[] = ['daily', 'weekly', 'biweekly', 'monthly'];
    return allowed.includes(normalized) ? normalized : 'weekly';
  }

  private normalizeInterestType(value: string | LoanInterestType): LoanInterestType {
    const normalized = (value || 'flat').toString().toLowerCase() as LoanInterestType;
    const allowed: LoanInterestType[] = ['flat', 'reducing', 'compound'];
    return allowed.includes(normalized) ? normalized : 'flat';
  }

  private cancelPendingPreview(): void {
    if (this.previewTimer) {
      clearTimeout(this.previewTimer);
      this.previewTimer = undefined;
    }

    if (this.previewSubscription) {
      this.previewSubscription.unsubscribe();
      this.previewSubscription = undefined;
    }
  }

  private resetPreview(): void {
    this.cancelPendingPreview();
    this.previewLoading.set(false);
    this.previewError.set(null);
    this.preview.set(null);
    this.lastPreviewKey = null;
    this.penaltyAmount.set(0);
    this.previewSchedule.set([]);
  }
}
