import { Component, OnInit, signal, inject, ViewChild, ElementRef, AfterViewInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Subscription } from 'rxjs';
import { MoneyloanApplicationService } from '../../shared/services/moneyloan-application.service';
import { LoanService } from '../../shared/services/loan.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { ComponentPathService } from '../../../../../core/services/component-path.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { ConfirmationService } from '../../../../../core/services/confirmation.service';
import { CurrencyMaskDirective } from '../../../../../shared/directives/currency-mask.directive';
import {
  LoanCalculationPreview,
  LoanCalculationRequest,
  LoanInterestType,
  PaymentFrequency,
} from '../../shared/models/loan-calculation.model';
import {
  DataManagementPageComponent,
  StatCard,
  FilterField,
  ColumnDefinition,
  ActionButton,
  BulkAction  
} from '../../../../../shared/components/ui';

interface LoanApplication {
  id?: number;
  application_number?: string;
  customer_id: number;
  first_name?: string;
  last_name?: string;
  customer_email?: string;
  customer_phone?: string;
  customer_credit_score?: number;
  product_code?: string;
  product_name?: string;
  product_min_amount?: number;
  product_max_amount?: number;
  product_platform_fee?: number;
  product_processing_fee_percent?: number;
  product_payment_frequency?: string;
  product_interest_type?: string;
  loan_product_id: number;
  requested_amount: number;
  requested_term_days: number;
  purpose?: string;
  status: string;
  created_at?: string;
  approved_amount?: number;
  approved_term_days?: number;
  approved_interest_rate?: number;
  reviewed_by?: number;
  reviewed_at?: string;
  review_notes?: string;
  reviewer_first_name?: string;
  reviewer_last_name?: string;
  reviewer_email?: string;
}

@Component({
  selector: 'app-loan-applications',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    DataManagementPageComponent,
    CurrencyMaskDirective
  ],
  template: `
    <div class="h-full flex flex-col">
      <app-data-management-page
        [pageIcon]="'📝'"
        [pageTitle]="'Pending Approvals'"
        [pageDescription]="'Review and process loan applications'"
        [statCards]="statCards"
      [filterFields]="filterFields"
      [filterValues]="filterValues"
      [columns]="columns"
      [data]="applications()"
      [loading]="loading()"
      [selectable]="true"
      [showRowNumbers]="true"
      [selectedIds]="selectedIds()"
      [selectAll]="selectAll()"
      [sortColumn]="sortColumn()"
      [sortDirection]="sortDirection()"
      [rowActions]="rowActions"
      [bulkActions]="bulkActions"
      [currentPage]="currentPage"
      [pageSize]="pageSize"
      [totalRecords]="totalRecords()"
      [totalPages]="totalPages()"
      [emptyIcon]="'📋'"
      [emptyTitle]="'No applications found'"
      [emptyMessage]="'Try adjusting your filters to see more results'"
      (filterChange)="onFilterChange($event)"
      (clearFilters)="onClearFilters()"
      (sortChange)="onSortChange($event)"
      (toggleSelection)="toggleSelection($event)"
      (selectAllChange)="toggleSelectAll()"
      (clearSelection)="clearSelection()"
      (pageSizeChange)="onPageSizeChange($event)"
      (previousPage)="onPreviousPage()"
      (nextPage)="onNextPage()"
    />

    <!-- Approval Modal - Compact Design -->
    @if (showApprovalModal()) {
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" (click)="showApprovalModal.set(false)">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
          
          <!-- Modal Header - Compact -->
          <div class="sticky top-0 bg-gradient-to-r from-purple-600 to-indigo-600 text-white px-3 py-2 rounded-t-lg">
            <div class="flex items-center justify-between gap-2">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <h2 class="text-sm font-bold">📋 Review</h2>
                  <span class="text-xs text-purple-100 truncate">#{{ selectedApplication()?.application_number }}</span>
                  @if (selectedApplication()?.product_code) {
                    <span class="px-1.5 py-0.5 text-xs font-mono font-semibold bg-white/20 text-white rounded">
                      {{ selectedApplication()?.product_code }}
                    </span>
                  }
                </div>
                @if (selectedApplication()?.product_name) {
                  <p class="text-xs text-purple-50 truncate">{{ selectedApplication()?.product_name }}</p>
                }
              </div>
              <button (click)="showApprovalModal.set(false)" class="text-white hover:bg-white/20 rounded p-1 transition-colors flex-shrink-0">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Modal Body - Compact -->
          <div class="p-3 space-y-2.5">
            
            <!-- Customer Info - Inline Compact -->
            <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded px-2.5 py-1.5">
              <div class="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">Name:</span>
                  <span class="font-semibold text-gray-900 dark:text-white truncate ml-1">{{ getCustomerName(selectedApplication()) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">Score:</span>
                  <span class="font-semibold ml-1" [class]="getCreditScoreClass(selectedApplication()?.customer_credit_score || 0)">
                    {{ selectedApplication()?.customer_credit_score || 'N/A' }}
                  </span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">Requested:</span>
                  <span class="font-semibold text-gray-900 dark:text-white ml-1">₱{{ formatNumber(selectedApplication()?.requested_amount || 0) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">Term:</span>
                  <span class="font-semibold text-gray-900 dark:text-white ml-1">{{ selectedApplication()?.requested_term_days }}d</span>
                </div>
              </div>
            </div>

            <!-- Approved Amount with Min/Max - Compact -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">
                💰 Approved Amount
              </label>
              <input
                type="text"
                appCurrencyMask
                [(ngModel)]="approvalData.approved_amount"
                (ngModelChange)="onApprovalDataChange()"
                [class]="'w-full px-2.5 py-1.5 text-sm border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:border-transparent ' + (amountError() ? 'border-red-500 dark:border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-green-500')"
                placeholder="Enter approved amount"
              />
              @if (amountError()) {
                <p class="mt-1 text-xs text-red-600 dark:text-red-400 font-semibold">{{ amountError() }}</p>
              }
              @if (selectedApplication()?.product_min_amount || selectedApplication()?.product_max_amount) {
                <div class="mt-1 flex gap-1.5 text-xs">
                  <div class="flex-1 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded px-1.5 py-0.5 flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Min:</span>
                    <span class="font-semibold text-blue-600 dark:text-blue-400">₱{{ formatNumber(selectedApplication()?.product_min_amount || 0) }}</span>
                  </div>
                  <div class="flex-1 bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-700 rounded px-1.5 py-0.5 flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Max:</span>
                    <span class="font-semibold text-purple-600 dark:text-purple-400">₱{{ formatNumber(selectedApplication()?.product_max_amount || 0) }}</span>
                  </div>
                </div>
              }
            </div>

            <!-- Terms and Interest - Compact Row -->
            <div class="grid grid-cols-2 gap-2">
              <div>
                <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">📅 Term</label>
                <input
                  type="number"
                  [(ngModel)]="approvalData.approved_term_days"
                  readonly
                  class="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                />
              </div>
              <div>
                <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">📊 Rate (%)</label>
                <input
                  type="number"
                  step="0.01"
                  [(ngModel)]="approvalData.approved_interest_rate"
                  readonly
                  class="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300 cursor-not-allowed"
                />
              </div>
            </div>

            <!-- Payment Summary - Final Design -->
            @if (loanPreviewLoading()) {
              <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded px-3 py-2 text-xs text-blue-700 dark:text-blue-300">
                ⏳ Calculating preview…
              </div>
            } @else if (loanPreviewError()) {
              <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded px-3 py-2 text-xs text-red-700 dark:text-red-300">
                ⚠️ {{ loanPreviewError() }}
              </div>
            }
            <div class="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded border border-blue-200 dark:border-blue-700 p-2.5">
              <h3 class="text-xs font-bold text-gray-900 dark:text-white mb-2">Payment Summary</h3>
              
              <div class="space-y-0.5 text-xs">
                <!-- Loan Amount -->
                <div class="flex justify-between items-center">
                  <span class="text-gray-700 dark:text-gray-300">Loan Amount</span>
                  <span class="font-semibold text-gray-900 dark:text-white">₱{{ formatNumber(approvalData.approved_amount) }}</span>
                </div>
                
                <!-- Deductions -->
                <div class="flex justify-between items-center">
                  <span class="text-gray-600 dark:text-gray-400">Processing Fee ({{ selectedApplication()?.product_processing_fee_percent || 0 }}%)</span>
                  <span class="font-semibold text-red-600 dark:text-red-400">-₱{{ formatNumber(calcProcessingFee()) }}</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-gray-600 dark:text-gray-400">Platform Fee</span>
                  <span class="font-semibold text-red-600 dark:text-red-400">-₱{{ formatNumber(calcTotalPlatformFee()) }}</span>
                </div>
                
                <!-- Divider -->
                <div class="border-t border-gray-300 dark:border-gray-600 my-1.5"></div>
                
                <!-- Net Received -->
                <div class="flex justify-between items-center bg-green-500/10 border border-green-500/20 dark:bg-green-500/20 dark:border-green-500/30 rounded px-2 py-1.5">
                  <span class="font-bold text-green-700 dark:text-green-300 flex items-center gap-1">
                    <span>💰</span> Net Received
                  </span>
                  <span class="font-bold text-green-700 dark:text-green-300 text-sm">₱{{ formatNumber(calcNetPay()) }}</span>
                </div>
                <div class="text-xs text-green-700 dark:text-green-400 italic text-center -mt-0.5 mb-1">*You receive this today*</div>
                
                <!-- Interest Details -->
                <div class="flex justify-between items-center">
                  <span class="text-gray-600 dark:text-gray-400">Interest Rate (Flat)</span>
                  <span class="font-semibold text-gray-900 dark:text-white">{{ approvalData.approved_interest_rate }}%</span>
                </div>
                <div class="flex justify-between items-center">
                  <span class="text-gray-600 dark:text-gray-400">Total Interest</span>
                  <span class="font-semibold text-gray-900 dark:text-white">₱{{ formatNumber(calcTotalInterest()) }}</span>
                </div>
                
                <!-- Divider -->
                <div class="border-t border-gray-300 dark:border-gray-600 my-1.5"></div>
                
                <!-- Total Repayment -->
                <div class="flex justify-between items-center">
                  <span class="font-bold text-gray-900 dark:text-white">Total Repayment</span>
                  <span class="font-bold text-blue-600 dark:text-blue-400 text-sm">₱{{ formatNumber(calcTotalRepayment()) }}</span>
                </div>
                
                <!-- Payment Info -->
                <div class="flex justify-between items-center pt-1 text-gray-600 dark:text-gray-400">
                  <span>{{ getPaymentFrequencyLabel() }} Payment ({{ approvalData.approved_term_days }} days)</span>
                  <span class="font-semibold text-blue-600 dark:text-blue-400">≈ ₱{{ formatNumber(calcPaymentAmount()) }}</span>
                </div>
              </div>
            </div>

            <!-- Notes - Compact -->
            <div>
              <label class="block text-xs font-semibold text-gray-700 dark:text-gray-300 mb-1">📝 Notes <span class="text-red-500">*</span></label>
              <textarea
                #notesTextarea
                [(ngModel)]="approvalData.review_notes"
                (ngModelChange)="validateNotes()"
                rows="2"
                [class]="'w-full px-2.5 py-1.5 text-xs border rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:border-transparent resize-none ' + (notesError() ? 'border-red-500 dark:border-red-500 focus:ring-red-500' : 'border-gray-300 dark:border-gray-600 focus:ring-purple-500')"
                placeholder="Please provide notes for this decision (required)..."
              ></textarea>
              @if (notesError()) {
                <p class="mt-1 text-xs text-red-600 dark:text-red-400 font-semibold">{{ notesError() }}</p>
              }
            </div>
          </div>

          <!-- Modal Footer - Compact -->
          <div class="p-2.5 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-1.5 bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
            <button
              (click)="showApprovalModal.set(false)"
              class="px-3 py-1.5 text-xs font-medium rounded shadow-sm transition bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              (click)="rejectApplication()"
              [disabled]="notesError() !== ''"
              [class]="'px-3 py-1.5 text-xs font-medium rounded shadow-sm transition text-white ' + (notesError() ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' : 'bg-red-600 hover:bg-red-700')"
            >
              ❌ Reject
            </button>
            <button
              (click)="confirmApproval()"
              [disabled]="amountError() !== '' || notesError() !== ''"
              [class]="'px-3 py-1.5 text-xs font-medium rounded shadow-sm transition text-white ' + (amountError() || notesError() ? 'bg-gray-400 dark:bg-gray-600 cursor-not-allowed' : 'bg-green-600 hover:bg-green-700')"
            >
              ✅ Approve
            </button>
          </div>
        </div>
      </div>
    }

    <!-- View Application Modal -->
    @if (showViewModal()) {
      <div class="fixed inset-0 bg-black/50 dark:bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto animate-slideUp">
          <!-- Modal Header - Compact -->
          <div class="sticky top-0 bg-gradient-to-r from-blue-600 to-indigo-600 dark:from-blue-700 dark:to-indigo-700 px-3 py-2 rounded-t-lg">
            <div class="flex items-center justify-between gap-2">
              <div class="flex-1 min-w-0">
                <div class="flex items-center gap-2">
                  <h2 class="text-sm font-bold text-white">👁️ Application</h2>
                  <span class="text-xs text-blue-100 truncate">#{{ selectedApplication()?.application_number }}</span>
                </div>
                @if (selectedApplication()?.product_name) {
                  <p class="text-xs text-blue-50 truncate">{{ selectedApplication()?.product_name }}</p>
                }
              </div>
              <button (click)="showViewModal.set(false)" class="text-white hover:bg-white/20 rounded p-1 transition-colors flex-shrink-0">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>
          </div>

          <!-- Modal Content - Compact -->
          <div class="p-3 space-y-2.5">
            
            <!-- Customer Info - Inline Compact (matching approval modal) -->
            <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-700 rounded px-2.5 py-1.5">
              <div class="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">Name:</span>
                  <span class="font-semibold text-gray-900 dark:text-white truncate ml-1">{{ selectedApplication()?.first_name }} {{ selectedApplication()?.last_name }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">Score:</span>
                  <span class="font-semibold text-gray-900 dark:text-white ml-1">{{ selectedApplication()?.customer_credit_score || 'N/A' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">Email:</span>
                  <span class="font-medium text-gray-900 dark:text-white text-[10px] truncate ml-1">{{ selectedApplication()?.customer_email || 'N/A' }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">Status:</span>
                  <span [class]="'px-1.5 py-0.5 rounded text-[10px] font-medium ml-1 ' + getStatusClass(selectedApplication()?.status)">
                    {{ getStatusLabel(selectedApplication()?.status) }}
                  </span>
                </div>
              </div>
            </div>

            <!-- Loan Details - Compact -->
            <div class="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded px-2.5 py-1.5">
              <h3 class="text-xs font-bold text-gray-900 dark:text-white mb-1.5">💰 Loan Details</h3>
              <div class="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">Requested:</span>
                  <span class="font-semibold text-gray-900 dark:text-white ml-1">₱{{ formatNumber(selectedApplication()?.requested_amount || 0) }}</span>
                </div>
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">Term:</span>
                  <span class="font-semibold text-gray-900 dark:text-white ml-1">{{ selectedApplication()?.requested_term_days }}d</span>
                </div>
                @if (selectedApplication()?.approved_amount) {
                  <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Approved:</span>
                    <span class="font-semibold text-green-600 dark:text-green-400 ml-1">₱{{ formatNumber(selectedApplication()?.approved_amount || 0) }}</span>
                  </div>
                  <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Term:</span>
                    <span class="font-semibold text-green-600 dark:text-green-400 ml-1">{{ selectedApplication()?.approved_term_days }}d</span>
                  </div>
                  <div class="flex justify-between col-span-2">
                    <span class="text-gray-600 dark:text-gray-400">Interest:</span>
                    <span class="font-semibold text-green-600 dark:text-green-400 ml-1">{{ selectedApplication()?.approved_interest_rate }}%</span>
                  </div>
                }
                <div class="flex justify-between col-span-2">
                  <span class="text-gray-600 dark:text-gray-400">Purpose:</span>
                  <span class="font-medium text-gray-900 dark:text-white text-[11px] truncate ml-1">{{ selectedApplication()?.purpose || 'N/A' }}</span>
                </div>
              </div>
            </div>

            <!-- Payment Summary (if approved) -->
            @if (selectedApplication()?.approved_amount && selectedApplication()?.status !== 'submitted') {
              <div class="bg-gradient-to-br from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded border border-blue-200 dark:border-blue-700 p-3">
                <h3 class="text-xs font-bold text-gray-900 dark:text-white mb-2">Payment Summary</h3>
                
                <div class="space-y-0.5 text-xs">
                  <!-- Loan Amount -->
                  <div class="flex justify-between items-center">
                    <span class="text-gray-700 dark:text-gray-300">Loan Amount</span>
                    <span class="font-semibold text-gray-900 dark:text-white">₱{{ formatNumber(selectedApplication()?.approved_amount || 0) }}</span>
                  </div>
                  
                  <!-- Deductions -->
                  <div class="flex justify-between items-center">
                    <span class="text-gray-600 dark:text-gray-400">Processing Fee ({{ selectedApplication()?.product_processing_fee_percent || 0 }}%)</span>
                    <span class="font-semibold text-red-600 dark:text-red-400">-₱{{ formatNumber(calcProcessingFeeForView()) }}</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-gray-600 dark:text-gray-400">Platform Fee</span>
                    <span class="font-semibold text-red-600 dark:text-red-400">-₱{{ formatNumber(calcTotalPlatformFeeForView()) }}</span>
                  </div>
                  
                  <!-- Divider -->
                  <div class="border-t border-gray-300 dark:border-gray-600 my-1.5"></div>
                  
                  <!-- Net Received -->
                  <div class="flex justify-between items-center bg-green-500/10 border border-green-500/20 dark:bg-green-500/20 dark:border-green-500/30 rounded px-2 py-1.5">
                    <span class="font-bold text-green-700 dark:text-green-300 flex items-center gap-1">
                      <span>💰</span> Net Received
                    </span>
                    <span class="font-bold text-green-700 dark:text-green-300 text-sm">₱{{ formatNumber(calcNetPayForView()) }}</span>
                  </div>
                  <div class="text-xs text-green-700 dark:text-green-400 italic text-center -mt-0.5 mb-1">*Customer receives this amount*</div>
                  
                  <!-- Interest Details -->
                  <div class="flex justify-between items-center">
                    <span class="text-gray-600 dark:text-gray-400">Interest Rate (Flat)</span>
                    <span class="font-semibold text-gray-900 dark:text-white">{{ selectedApplication()?.approved_interest_rate }}%</span>
                  </div>
                  <div class="flex justify-between items-center">
                    <span class="text-gray-600 dark:text-gray-400">Total Interest</span>
                    <span class="font-semibold text-gray-900 dark:text-white">₱{{ formatNumber(calcTotalInterestForView()) }}</span>
                  </div>
                  
                  <!-- Divider -->
                  <div class="border-t border-gray-300 dark:border-gray-600 my-1.5"></div>
                  
                  <!-- Total Repayment -->
                  <div class="flex justify-between items-center">
                    <span class="font-bold text-gray-900 dark:text-white">Total Repayment</span>
                    <span class="font-bold text-blue-600 dark:text-blue-400 text-sm">₱{{ formatNumber(calcTotalRepaymentForView()) }}</span>
                  </div>
                  
                  <!-- Payment Info -->
                  <div class="flex justify-between items-center pt-1 text-gray-600 dark:text-gray-400">
                    <span>{{ getPaymentFrequencyLabelForView() }} Payment ({{ selectedApplication()?.approved_term_days }} days)</span>
                    <span class="font-semibold text-blue-600 dark:text-blue-400">≈ ₱{{ formatNumber(calcPaymentAmountForView()) }}</span>
                  </div>
                </div>
              </div>
            }

            <!-- Review Notes (if any) - Compact -->
            @if (selectedApplication()?.review_notes) {
              <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded px-2.5 py-1.5">
                <div class="flex items-center gap-1 mb-1">
                  <span class="text-xs font-bold text-gray-900 dark:text-white">📝 Review Notes</span>
                </div>
                <p class="text-[11px] text-gray-700 dark:text-gray-300">{{ selectedApplication()?.review_notes }}</p>
              </div>
            }

            <!-- Timestamps & Reviewer - Compact Inline -->
            <div class="bg-gray-50 dark:bg-gray-900/20 border border-gray-200 dark:border-gray-700 rounded px-2.5 py-1.5">
              <div class="grid grid-cols-2 gap-x-3 gap-y-0.5 text-xs">
                <div class="flex justify-between">
                  <span class="text-gray-600 dark:text-gray-400">Submitted:</span>
                  <span class="font-medium text-gray-900 dark:text-white text-[10px] ml-1">{{ formatDate(selectedApplication()?.created_at) }}</span>
                </div>
                @if (selectedApplication()?.reviewed_at) {
                  <div class="flex justify-between">
                    <span class="text-gray-600 dark:text-gray-400">Reviewed:</span>
                    <span class="font-medium text-gray-900 dark:text-white text-[10px] ml-1">{{ formatDate(selectedApplication()?.reviewed_at) }}</span>
                  </div>
                }
                @if (selectedApplication()?.reviewer_first_name || selectedApplication()?.reviewer_last_name) {
                  <div class="flex justify-between col-span-2">
                    <span class="text-gray-600 dark:text-gray-400">Reviewed By:</span>
                    <span class="font-medium text-gray-900 dark:text-white text-[11px] truncate ml-1">
                      {{ selectedApplication()?.reviewer_first_name }} {{ selectedApplication()?.reviewer_last_name }}
                      @if (selectedApplication()?.reviewer_email) {
                        <span class="text-gray-400 text-[10px]">({{ selectedApplication()?.reviewer_email }})</span>
                      }
                    </span>
                  </div>
                }
              </div>
            </div>
          </div>

          <!-- Modal Footer - Compact -->
          <div class="p-2.5 border-t border-gray-200 dark:border-gray-700 flex justify-end bg-gray-50 dark:bg-gray-900/50 rounded-b-lg">
            <button
              (click)="showViewModal.set(false)"
              class="px-3 py-1.5 text-xs font-medium rounded shadow-sm transition bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Close
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: []
})
export class LoanApplicationsComponent implements OnInit, AfterViewInit, OnDestroy {
  private applicationService = inject(MoneyloanApplicationService);
  private loanService = inject(LoanService);
  private authService = inject(AuthService);
  private componentPathService = inject(ComponentPathService);
  private toastService = inject(ToastService);
  private confirmationService = inject(ConfirmationService);
  private http = inject(HttpClient);
  private previewSubscription?: Subscription;
  private previewTimer?: ReturnType<typeof setTimeout>;
  private lastPreviewKey: string | null = null;

  @ViewChild('notesTextarea') notesTextarea?: ElementRef<HTMLTextAreaElement>;

  Math = Math;
  loading = signal(false);
  applications = signal<LoanApplication[]>([]);
  products = signal<any[]>([]);
  stats = signal({ draft: 0, submitted: 0, under_review: 0, approved: 0, rejected: 0 });
  showApprovalModal = signal(false);
  showViewModal = signal(false);
  selectedApplication = signal<LoanApplication | null>(null);
  amountError = signal<string>('');
  notesError = signal<string>('');
  loanPreviewLoading = signal(false);
  loanPreviewError = signal<string | null>(null);
  private tenantId: string | number = '';

  approvalData = {
    approved_amount: 0,
    approved_term_days: 0,
    approved_interest_rate: 12,
    review_notes: '',
    // Calculated fields
    calculated_interest: 0,
    calculated_total: 0,
    calculated_processing_fee: 0,
    calculated_platform_fee: 0,
    calculated_net_proceeds: 0
  };

  currentPage = 1;
  pageSize = 20;
  totalRecords = signal(0);
  totalPages = signal(1);

  // Selection state
  selectedIds = signal<Set<number>>(new Set());
  selectAll = signal(false);

  // Sorting state
  sortColumn = signal<string | null>(null);
  sortDirection = signal<'asc' | 'desc'>('desc');

  // Filter values
  filterValues: Record<string, any> = {
    search: '',
    status: '',
    product_id: ''
  };

  // Stats Cards Configuration
  get statCards(): StatCard[] {
    return [
      {
        label: 'Draft',
        value: this.stats().draft,
        icon: '📝',
        valueClass: 'text-lg font-bold text-gray-600 dark:text-gray-400',
        iconBgClass: 'flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700'
      },
      {
        label: 'Submitted',
        value: this.stats().submitted,
        icon: '⏳',
        valueClass: 'text-lg font-bold text-yellow-600 dark:text-yellow-400',
        iconBgClass: 'flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30'
      },
      {
        label: 'Under Review',
        value: this.stats().under_review,
        icon: '🔍',
        valueClass: 'text-lg font-bold text-blue-600 dark:text-blue-400',
        iconBgClass: 'flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30'
      },
      {
        label: 'Approved',
        value: this.stats().approved,
        icon: '✅',
        valueClass: 'text-lg font-bold text-green-600 dark:text-green-400',
        iconBgClass: 'flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30'
      },
      {
        label: 'Rejected',
        value: this.stats().rejected,
        icon: '❌',
        valueClass: 'text-lg font-bold text-red-600 dark:text-red-400',
        iconBgClass: 'flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30'
      }
    ];
  }

  // Filter Fields Configuration
  filterFields: FilterField[] = [
    {
      type: 'search',
      label: 'Search',
      modelKey: 'search',
      placeholder: 'Search by application number...'
    },
    {
      type: 'select',
      label: 'Status',
      modelKey: 'status',
      options: [
        { value: '', label: 'All Status' },
        { value: 'draft', label: 'Draft' },
        { value: 'submitted', label: 'Submitted' },
        { value: 'under_review', label: 'Under Review' },
        { value: 'approved', label: 'Approved' },
        { value: 'rejected', label: 'Rejected' }
      ]
    },
    {
      type: 'select',
      label: 'Product',
      modelKey: 'product_id',
      options: [
        { value: '', label: 'All Products' }
      ]
    }
  ];

  // Table Columns Configuration
  columns: ColumnDefinition[] = [
    {
      key: 'application_number',
      label: 'Application #',
      icon: '🔢',
      sortable: true,
      type: 'text'
    },
    {
      key: 'customer_name',
      label: 'Customer',
      icon: '👤',
      sortable: true,
      type: 'text',
      format: (value, row) => this.getCustomerName(row)
    },
    {
      key: 'requested_amount',
      label: 'Amount',
      icon: '💰',
      sortable: true,
      type: 'number',
      align: 'right',
      format: (value) => `₱${this.formatNumber(value)}`
    },
    {
      key: 'requested_term_days',
      label: 'Term',
      icon: '📅',
      sortable: true,
      type: 'text',
      align: 'center',
      format: (value) => `${value} days`
    },
    {
      key: 'purpose',
      label: 'Purpose',
      icon: '📋',
      sortable: false,
      type: 'text',
      format: (value) => value || 'N/A'
    },
    {
      key: 'status',
      label: 'Status',
      icon: '🔘',
      sortable: true,
      type: 'badge',
      align: 'center',
      getBadgeClass: (value) => this.getStatusClass(value),
      format: (value) => this.getStatusLabel(value)
    },
    {
      key: 'created_at',
      label: 'Date',
      icon: '📆',
      sortable: true,
      type: 'date',
      format: (value) => this.formatDate(value)
    },
    {
      key: 'actions',
      label: 'Actions',
      icon: '⚙️',
      sortable: false,
      type: 'actions',
      align: 'center'
    }
  ];

  // Row Actions Configuration
  rowActions: ActionButton[] = [
    {
      icon: '👁️',
      label: 'View Details',
      class: 'inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded shadow-sm hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200 hover:scale-105 hover:shadow-md group',
      action: (app) => this.viewApplication(app)
    },
    {
      icon: '📋',
      label: 'Review',
      class: 'inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded shadow-sm hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all duration-200 hover:scale-105 hover:shadow-md group',
      action: (app) => this.reviewApplication(app),
      show: (app) => {
        // Only show Review button for applications that haven't been reviewed yet
        // Hide for approved, rejected, or any other final status
        return app.status === 'submitted' || app.status === 'under_review';
      }
    }
  ];

  // Bulk Actions Configuration
  bulkActions: BulkAction[] = [
    {
      icon: '📄',
      label: 'CSV',
      class: 'inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition',
      action: (items) => this.exportToCSV(items)
    },
    {
      icon: '📊',
      label: 'EXCEL',
      class: 'inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition',
      action: (items) => this.exportToExcel(items)
    },
    {
      icon: '📕',
      label: 'PDF',
      class: 'inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition',
      action: (items) => this.exportToPDF(items)
    }
  ];

  ngOnInit() {
    // Register component path
    this.componentPathService.setComponentPath({
      componentName: 'LoanApplicationsComponent',
      moduleName: 'Money Loan - Applications',
      filePath: 'src/app/features/platforms/money-loan/admin/applications/loan-applications.component.ts',
      routePath: window.location.pathname
    });

    const user = this.authService.currentUser();
    this.tenantId = user?.tenantId || '';

    this.loadProducts();
    this.loadApplications();
  }

  ngAfterViewInit() {
    // Auto-focus notes textarea when modal opens
    if (this.showApprovalModal() && this.notesTextarea) {
      setTimeout(() => {
        this.notesTextarea?.nativeElement.focus();
      }, 100);
    }
  }

  loadProducts() {
    this.http.get<any>(`/api/tenants/${this.tenantId}/platforms/moneyloan/loans/products`).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.products.set(response.data);
          console.log('📦 Products loaded:', response.data);
        }
      },
      error: (error) => {
        console.error('Error loading products:', error);
      }
    });
  }

  loadApplications() {
    this.loading.set(true);

    this.applicationService.getApplications(String(this.tenantId), {
      status: this.filterValues['status'] || '',
      product_id: this.filterValues['product_id'] || '',
      search: this.filterValues['search'] || '',
      page: this.currentPage,
      limit: this.pageSize
    }).subscribe({
      next: (response) => {
        const normalizedApplications = Array.isArray(response.data)
          ? response.data.map((app: any) => this.normalizeApplication(app))
          : [];

        console.log('📦 Applications loaded with status:', normalizedApplications.map((app: any) => ({
          id: app.id,
          app_number: app.application_number,
          status: app.status,
          status_type: typeof app.status,
          created_at: app.created_at
        })));

        this.applications.set(normalizedApplications);
        this.totalRecords.set(response.pagination?.total || 0);
        this.totalPages.set(Math.ceil(this.totalRecords() / this.pageSize));
        this.calculateStats();
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load applications:', error);
        this.loading.set(false);
      }
    });
  }

  calculateStats() {
    const apps = this.applications();
    this.stats.set({
      draft: apps.filter(a => a.status === 'draft').length,
      submitted: apps.filter(a => a.status === 'submitted').length,
      under_review: apps.filter(a => a.status === 'under_review').length,
      approved: apps.filter(a => a.status === 'approved').length,
      rejected: apps.filter(a => a.status === 'rejected').length
    });
  }

  private normalizeApplication(application: any): LoanApplication {
    if (!application) {
      return application;
    }

    const normalizeStatus = (status: any) => {
      if (status === null || status === undefined) {
        return 'submitted';
      }
      return String(status).toLowerCase();
    };

    const pickDate = (...values: any[]): string | undefined => {
      for (const value of values) {
        if (!value) continue;
        // Accept both ISO strings and numeric timestamps
        if (typeof value === 'number') {
          return new Date(value).toISOString();
        }
        if (typeof value === 'string' && value.trim() !== '') {
          const parsed = new Date(value);
          if (!Number.isNaN(parsed.getTime())) {
            return parsed.toISOString();
          }
          // If parsing fails, still return original string so formatter can handle custom formats
          return value;
        }
        if (value instanceof Date && !Number.isNaN(value.getTime())) {
          return value.toISOString();
        }
      }
      return undefined;
    };

    const createdAt = pickDate(
      application.created_at,
      application.createdAt,
      application.submitted_at,
      application.submittedAt,
      application.application_date,
      application.applicationDate,
      application.requested_at,
      application.requestedAt
    );

    const reviewedAt = pickDate(
      application.reviewed_at,
      application.reviewedAt,
      application.approved_at,
      application.approvedAt
    );

    const firstName = application.first_name ?? application.firstName ?? application.customer_first_name ?? application.customerFirstName ?? application.customer?.first_name ?? application.customer?.firstName;
    const lastName = application.last_name ?? application.lastName ?? application.customer_last_name ?? application.customerLastName ?? application.customer?.last_name ?? application.customer?.lastName;

    const loanProductId = application.loan_product_id ?? application.loanProductId ?? application.product_id ?? application.productId;

    return {
      ...application,
      first_name: firstName,
      last_name: lastName,
      loan_product_id: loanProductId,
      status: normalizeStatus(application.status ?? application.application_status ?? application.applicationStatus),
      created_at: createdAt,
      reviewed_at: reviewedAt
    };
  }

  // Event handlers for DataManagementPageComponent
  onFilterChange(event: { key: string; value: any }) {
    this.filterValues[event.key] = event.value;
    this.currentPage = 1;
    this.loadApplications();
  }

  onClearFilters() {
    this.filterValues = {
      status: '',
      product_id: '',
      search: ''
    };
    this.currentPage = 1;
    this.loadApplications();
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    this.currentPage = 1;
    this.loadApplications();
  }

  onPreviousPage(): void {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.loadApplications();
    }
  }

  onNextPage(): void {
    if (this.currentPage < this.totalPages()) {
      this.currentPage++;
      this.loadApplications();
    }
  }

  // Selection handlers
  toggleSelection(id: number): void {
    const selected = new Set(this.selectedIds());
    if (selected.has(id)) {
      selected.delete(id);
    } else {
      selected.add(id);
    }
    this.selectedIds.set(selected);
    this.selectAll.set(selected.size === this.applications().length && this.applications().length > 0);
  }

  toggleSelectAll(): void {
    if (this.selectAll()) {
      this.selectedIds.set(new Set());
      this.selectAll.set(false);
    } else {
      const allIds = new Set(this.applications().map(app => app.id!));
      this.selectedIds.set(allIds);
      this.selectAll.set(true);
    }
  }

  clearSelection(): void {
    this.selectedIds.set(new Set());
    this.selectAll.set(false);
  }

  // Sorting handler
  onSortChange(column: string): void {
    if (this.sortColumn() === column) {
      this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
    } else {
      this.sortColumn.set(column);
      this.sortDirection.set('desc');
    }
    this.loadApplications();
  }

  // Bulk action handlers
  bulkApprove(items: LoanApplication[]): void {
    if (items.length === 0) return;

    const confirmMessage = items.length === 1
      ? `Approve application ${items[0].application_number}?`
      : `Approve ${items.length} selected applications?`;

    if (confirm(confirmMessage)) {
      this.loading.set(true);
      const approvals = items.map(item =>
        this.applicationService.approveApplication(String(this.tenantId), item.id!, { notes: 'Bulk approval' })
      );

      Promise.all(approvals)
        .then(() => {
          this.clearSelection();
          this.loadApplications();
          alert(`Successfully approved ${items.length} application(s)`);
        })
        .catch(error => {
          console.error('Bulk approval failed:', error);
          alert('Some applications could not be approved. Please try again.');
        })
        .finally(() => {
          this.loading.set(false);
        });
    }
  }

  bulkReject(items: LoanApplication[]): void {
    if (items.length === 0) return;

    const confirmMessage = items.length === 1
      ? `Reject application ${items[0].application_number}?`
      : `Reject ${items.length} selected applications?`;

    const reason = prompt(confirmMessage + '\n\nPlease provide a reason for rejection:');
    if (reason && reason.trim()) {
      this.loading.set(true);
      const rejections = items.map(item =>
        this.applicationService.rejectApplication(String(this.tenantId), item.id!, { 
          reason: reason.trim() 
        })
      );

      Promise.all(rejections)
        .then(() => {
          this.clearSelection();
          this.loadApplications();
          alert(`Successfully rejected ${items.length} application(s)`);
        })
        .catch(error => {
          console.error('Bulk rejection failed:', error);
          alert('Some applications could not be rejected. Please try again.');
        })
        .finally(() => {
          this.loading.set(false);
        });
    }
  }

  // Export handlers
  exportToCSV(items: LoanApplication[]): void {
    console.log(`Exporting ${items.length} application(s) to CSV`);
    
    // Prepare CSV data
    const headers = ['Application #', 'Customer', 'Amount', 'Term (Days)', 'Purpose', 'Status', 'Submitted'];
    const rows = items.map(app => [
      app.application_number || '',
      this.getCustomerName(app),
      app.requested_amount?.toString() || '0',
      app.requested_term_days?.toString() || '0',
      app.purpose || 'N/A',
      app.status || '',
      app.created_at ? new Date(app.created_at).toLocaleDateString() : ''
    ]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `loan-applications-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }

  exportToExcel(items: LoanApplication[]): void {
    console.log(`Exporting ${items.length} application(s) to Excel`);
    alert(`Export to Excel functionality coming soon! (${items.length} items selected)`);
  }

  exportToPDF(items: LoanApplication[]): void {
    console.log(`Exporting ${items.length} application(s) to PDF`);
    alert(`Export to PDF functionality coming soon! (${items.length} items selected)`);
  }

  viewApplication(app: LoanApplication) {
    // Find the product details
    const product = this.products().find(p => p.id === app.loan_product_id);
    
    // Enrich application with product data
    const enrichedApp = {
      ...app,
      product_code: product?.productCode,
      product_name: product?.name,
      product_min_amount: product?.minAmount,
      product_max_amount: product?.maxAmount,
      product_platform_fee: product?.platformFee || 50,
      product_processing_fee_percent: product?.processingFeePercent || 0,
      product_payment_frequency: product?.paymentFrequency || 'monthly'
    };
    
    this.selectedApplication.set(enrichedApp);
    this.showViewModal.set(true);
  }

  reviewApplication(app: LoanApplication) {
    // Find the product details
    const product = this.products().find(p => p.id === app.loan_product_id);
    
    console.log('📝 Opening review modal for application:', app);
    console.log('🔍 Found product:', product);
    
    // Enrich application with product data
    const enrichedApp = {
      ...app,
      product_code: product?.productCode,
      product_name: product?.name,
      product_min_amount: product?.minAmount,
      product_max_amount: product?.maxAmount,
      product_platform_fee: product?.platformFee || 50,
      product_processing_fee_percent: product?.processingFeePercent || 0,
      product_payment_frequency: product?.paymentFrequency || 'monthly'
    };
    
    console.log('Product Details:', {
      code: enrichedApp.product_code,
      name: enrichedApp.product_name,
      min: enrichedApp.product_min_amount,
      max: enrichedApp.product_max_amount,
      platform_fee: enrichedApp.product_platform_fee,
      processing_fee_percent: enrichedApp.product_processing_fee_percent,
      payment_frequency: enrichedApp.product_payment_frequency,
      credit_score: enrichedApp.customer_credit_score
    });
    
    this.selectedApplication.set(enrichedApp);
    this.approvalData = {
      approved_amount: app.requested_amount,
      approved_term_days: app.requested_term_days,
      approved_interest_rate: product?.interestRate || 12,
      review_notes: '',
      calculated_interest: 0,
      calculated_total: 0,
      calculated_processing_fee: 0,
      calculated_platform_fee: 0,
      calculated_net_proceeds: 0
    };
    
    // Calculate loan amounts using calculator service
    this.calculateLoanAmounts();
    
    this.amountError.set(''); // Clear any previous errors
    this.notesError.set('Notes are required'); // Set initial error
    this.showApprovalModal.set(true);
    
    // Auto-focus notes field after modal renders
    setTimeout(() => {
      this.notesTextarea?.nativeElement.focus();
    }, 100);
  }

  calculateLoanAmounts(): void {
    const app = this.selectedApplication();
    if (!app) {
      this.resetCalculatedFields();
      this.cancelPendingPreview();
      this.loanPreviewLoading.set(false);
      this.loanPreviewError.set(null);
      this.lastPreviewKey = null;
      return;
    }

    const amount = Math.max(0, Number(this.approvalData.approved_amount) || 0);
    const termDays = Math.max(0, Number(this.approvalData.approved_term_days) || 0);
    const interestRate = Math.max(0, Number(this.approvalData.approved_interest_rate) || 0);

    if (amount <= 0 || termDays <= 0 || interestRate < 0) {
      this.resetCalculatedFields();
      this.cancelPendingPreview();
      this.loanPreviewLoading.set(false);
      this.loanPreviewError.set(null);
      this.lastPreviewKey = null;
      return;
    }

    const termMonths = Math.max(1, Math.round(termDays / 30));
    const request = this.buildPreviewRequest(app, amount, termMonths, interestRate);
    if (!request) {
      this.resetCalculatedFields();
      this.cancelPendingPreview();
      this.loanPreviewLoading.set(false);
      this.loanPreviewError.set(null);
      this.lastPreviewKey = null;
      return;
    }

    const cacheKey = JSON.stringify(request);
    if (this.lastPreviewKey === cacheKey && !this.loanPreviewLoading()) {
      return;
    }

    this.lastPreviewKey = null;
    this.cancelPendingPreview();
    this.loanPreviewLoading.set(true);
    this.loanPreviewError.set(null);

    this.previewTimer = setTimeout(() => {
      this.previewSubscription = this.loanService.calculateLoanPreview(request).subscribe({
        next: (preview: LoanCalculationPreview) => {
          const calculation = preview.calculation;
          this.approvalData.calculated_interest = calculation.interestAmount;
          this.approvalData.calculated_total = calculation.totalRepayable;
          this.approvalData.calculated_processing_fee = calculation.processingFeeAmount;
          this.approvalData.calculated_platform_fee = calculation.platformFee;
          this.approvalData.calculated_net_proceeds = calculation.netProceeds;
          this.loanPreviewLoading.set(false);
          this.loanPreviewError.set(null);
          this.lastPreviewKey = cacheKey;
        },
        error: (error) => {
          console.error('Error calculating loan preview:', error);
          this.loanPreviewLoading.set(false);
          const message = error?.error?.message || 'Unable to calculate loan preview';
          this.loanPreviewError.set(message);
          this.resetCalculatedFields();
          this.lastPreviewKey = null;
        },
      });
    }, 200);
  }

  onApprovalDataChange(): void {
    this.validateAmount();
    this.calculateLoanAmounts();
  }

  validateAmount(): void {
    const app = this.selectedApplication();
    if (!app) return;

    const amount = Number(this.approvalData.approved_amount) || 0;
    const minAmount = app.product_min_amount || 0;
    const maxAmount = app.product_max_amount || 0;

    if (amount <= 0) {
      this.amountError.set('Amount must be greater than zero');
      return;
    }

    if (minAmount > 0 && amount < minAmount) {
      this.amountError.set(`Amount must be at least ₱${this.formatNumber(minAmount)}`);
      return;
    }

    if (maxAmount > 0 && amount > maxAmount) {
      this.amountError.set(`Amount cannot exceed ₱${this.formatNumber(maxAmount)}`);
      return;
    }

    this.amountError.set('');
  }

  validateNotes(): void {
    const notes = this.approvalData.review_notes?.trim() || '';
    
    if (!notes || notes.length === 0) {
      this.notesError.set('Notes are required');
      return;
    }

    if (notes.length < 2) {
      this.notesError.set('Notes must be at least 2 characters');
      return;
    }

    this.notesError.set('');
  }

  async confirmApproval() {
    const app = this.selectedApplication();
    if (!app?.id) return;

    // Validate amount before approval
    this.validateAmount();
    if (this.amountError()) {
      this.toastService.error(`Cannot approve: ${this.amountError()}`);
      return;
    }

    // Validate notes before approval
    this.validateNotes();
    if (this.notesError()) {
      this.toastService.error(`Cannot approve: ${this.notesError()}`);
      this.notesTextarea?.nativeElement.focus();
      return;
    }

    const amount = Number(this.approvalData.approved_amount) || 0;
    if (amount <= 0) {
      this.toastService.error('Please enter a valid approved amount');
      return;
    }

    // Show confirmation dialog
    const confirmed = await this.confirmationService.confirm({
      title: 'Approve Loan Application',
      message: `
        <div class="space-y-2">
          <p class="mb-3">Are you sure you want to approve this loan application for <strong>${this.getCustomerName(app)}</strong>?</p>
          <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3 space-y-1.5">
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Amount:</span>
              <span class="font-semibold">₱${this.formatNumber(amount)}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Term:</span>
              <span class="font-semibold">${this.approvalData.approved_term_days} days</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Interest Rate:</span>
              <span class="font-semibold">${this.approvalData.approved_interest_rate}%</span>
            </div>
          </div>
        </div>
      `,
      confirmText: 'Approve',
      cancelText: 'Cancel',
      type: 'success'
    });

    if (!confirmed) return;

    // Map frontend fields to backend DTO format - include all calculated values
    const approvalPayload = {
      approvedAmount: amount,
      approvedTermDays: Number(this.approvalData.approved_term_days) || 0,
      interestRate: Number(this.approvalData.approved_interest_rate) || 0,
      interestType: app?.product_interest_type || 'flat',
      totalInterest: this.approvalData.calculated_interest,
      totalAmount: this.approvalData.calculated_total,
      processingFee: this.approvalData.calculated_processing_fee,
      platformFee: this.approvalData.calculated_platform_fee,
      notes: this.approvalData.review_notes || ''
    };

    this.applicationService.approveApplication(String(this.tenantId), app.id, approvalPayload).subscribe({
      next: () => {
        this.showApprovalModal.set(false);
        this.amountError.set('');
        this.notesError.set('');
        this.toastService.success(`✅ Loan application approved successfully! Amount: ₱${this.formatNumber(amount)}`);
        this.loadApplications();
      },
      error: (error) => {
        console.error('Failed to approve application:', error);
        this.toastService.error('Failed to approve application: ' + (error.error?.message || error.message));
      }
    });
  }

  async rejectApplication() {
    const app = this.selectedApplication();
    if (!app?.id) return;

    // Validate notes before rejection
    this.validateNotes();
    if (this.notesError()) {
      this.toastService.error(`Cannot reject: ${this.notesError()}`);
      this.notesTextarea?.nativeElement.focus();
      return;
    }

    // Show confirmation dialog
    const confirmed = await this.confirmationService.confirm({
      title: 'Reject Loan Application',
      message: `
        <div class="space-y-2">
          <p class="mb-3">Are you sure you want to reject this loan application for <strong>${this.getCustomerName(app)}</strong>?</p>
          <div class="bg-gray-50 dark:bg-gray-800 rounded-lg p-3">
            <div class="text-gray-600 dark:text-gray-400 text-xs mb-1">Rejection Reason:</div>
            <div class="text-gray-900 dark:text-white">${this.approvalData.review_notes}</div>
          </div>
        </div>
      `,
      confirmText: 'Reject',
      cancelText: 'Cancel',
      type: 'danger'
    });

    if (!confirmed) return;

    const user = this.authService.currentUser();

    this.applicationService.rejectApplication(String(this.tenantId), app.id, {
      reason: this.approvalData.review_notes,
      rejectedBy: user?.id || 0
    }).subscribe({
      next: () => {
        this.showApprovalModal.set(false);
        this.notesError.set('');
        this.toastService.success('❌ Loan application rejected successfully');
        this.loadApplications();
      },
      error: (error) => {
        console.error('Failed to reject application:', error);
        this.toastService.error('Failed to reject application: ' + (error.error?.message || error.message));
      }
    });
  }

  ngOnDestroy(): void {
    this.cancelPendingPreview();
  }

  private buildPreviewRequest(app: LoanApplication, amount: number, termMonths: number, interestRate: number): LoanCalculationRequest | null {
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
      paymentFrequency: this.normalizePaymentFrequency(app.product_payment_frequency),
      interestRate: Math.max(0, Number(interestRate) || 0),
      interestType: this.normalizeInterestType(app.product_interest_type),
      processingFeePercentage: Math.max(0, Number(app.product_processing_fee_percent) || 0),
      platformFee: Math.max(0, Number(app.product_platform_fee) || 0),
      latePenaltyPercentage: 0,
    };
  }

  private normalizePaymentFrequency(value?: string): PaymentFrequency {
    const allowed: PaymentFrequency[] = ['daily', 'weekly', 'biweekly', 'monthly'];
    const normalized = (value || 'monthly').toString().toLowerCase() as PaymentFrequency;
    return allowed.includes(normalized) ? normalized : 'monthly';
  }

  private normalizeInterestType(value?: string): LoanInterestType {
    const allowed: LoanInterestType[] = ['flat', 'reducing', 'compound'];
    const normalized = (value || 'flat').toString().toLowerCase() as LoanInterestType;
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

  private resetCalculatedFields(): void {
    this.approvalData.calculated_interest = 0;
    this.approvalData.calculated_total = 0;
    this.approvalData.calculated_processing_fee = 0;
    this.approvalData.calculated_platform_fee = 0;
    this.approvalData.calculated_net_proceeds = 0;
  }

  formatNumber(value: number): string {
    return new Intl.NumberFormat('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  /**
   * Calculate processing fee (service charge)
   * Processing fee is a percentage of the approved amount
   */
  calcProcessingFee(): number {
    return this.approvalData.calculated_processing_fee || 0;
  }

  /**
   * Calculate platform fee per month
   * Platform fee is a fixed amount from product configuration
   */
  calcPlatformFeePerMonth(): number {
    const app = this.selectedApplication();
    if (!app) return 0;
    
    // Get platform fee from product data (default to 50 if not specified)
    return app.product_platform_fee || 50;
  }

  /**
   * Calculate total platform fee for the entire loan term
   */
  calcTotalPlatformFee(): number {
    return this.approvalData.calculated_platform_fee || 0;
  }

  /**
   * Calculate total interest - uses calculator service
   */
  calcTotalInterest(): number {
    return this.approvalData.calculated_interest || 0;
  }

  /**
   * Calculate total repayment (what customer must pay back) - uses calculator service
   */
  calcTotalRepayment(): number {
    return this.approvalData.calculated_total || 0;
  }

  /**
   * Calculate net pay (amount customer actually receives) - uses calculator service
   */
  calcNetPay(): number {
    return this.approvalData.calculated_net_proceeds || 0;
  }

  /**
   * Calculate number of payments based on term and payment frequency
   */
  calcNumberOfPayments(): number {
    const app = this.selectedApplication();
    if (!app) return 0;
    
    const frequency = app.product_payment_frequency || 'monthly';
    const termDays = Number(this.approvalData.approved_term_days) || 0;
    const termMonths = Math.round(termDays / 30);

    switch (frequency) {
      case 'daily':
        return termDays;
      case 'weekly':
        return Math.ceil(termDays / 7);
      case 'biweekly':
        return Math.ceil(termDays / 14);
      case 'monthly':
        return termMonths;
      default:
        return termMonths; // Default to monthly
    }
  }

  /**
   * Calculate payment amount per installment
   */
  calcPaymentAmount(): number {
    const numPayments = this.calcNumberOfPayments();
    if (numPayments === 0) return 0;
    return this.calcTotalRepayment() / numPayments;
  }

  /**
   * Get payment frequency label
   */
  getPaymentFrequencyLabel(): string {
    const app = this.selectedApplication();
    if (!app) return 'Monthly';
    
    const frequency = app.product_payment_frequency || 'monthly';
    return frequency.charAt(0).toUpperCase() + frequency.slice(1);
  }

  formatDate(date: string | undefined): string {
    console.log('🗓️ formatDate called with:', date, 'type:', typeof date);
    if (!date) {
      console.log('❌ Date is empty/null/undefined');
      return 'N/A';
    }
    try {
      const d = new Date(date);
      console.log('📅 Parsed date:', d, 'isValid:', !isNaN(d.getTime()));
      if (isNaN(d.getTime())) return 'N/A';
      const formatted = d.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
      console.log('✅ Formatted date:', formatted);
      return formatted;
    } catch (e) {
      console.error('❌ Date formatting error:', e);
      return 'N/A';
    }
  }

  getCustomerName(app: LoanApplication): string {
    if (app.first_name && app.last_name) {
      return `${app.first_name} ${app.last_name}`;
    }
    if (app.first_name) return app.first_name;
    if (app.last_name) return app.last_name;
    if (app.customer_email) return app.customer_email;
    return `Customer #${app.customer_id}`;
  }

  getCreditScoreClass(score: number): string {
    if (score >= 700) {
      return 'text-green-600 dark:text-green-400 font-bold';
    } else if (score >= 600) {
      return 'text-blue-600 dark:text-blue-400 font-bold';
    } else if (score >= 500) {
      return 'text-yellow-600 dark:text-yellow-400 font-bold';
    } else {
      return 'text-red-600 dark:text-red-400 font-bold';
    }
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'draft': 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300',
      'submitted': 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300',
      'under_review': 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
      'approved': 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300',
      'rejected': 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300',
      'cancelled': 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300'
    };
    return classes[status] || 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300';
  }

  getStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'draft': 'Draft',
      'submitted': 'Submitted',
      'under_review': 'Under Review',
      'approved': 'Approved',
      'rejected': 'Rejected',
      'cancelled': 'Cancelled'
    };
    return labels[status] || status;
  }

  // Calculation methods for View Modal
  calcProcessingFeeForView(): number {
    const app = this.selectedApplication();
    if (!app || !app.approved_amount) return 0;
    
    const processingFeePercent = app.product_processing_fee_percent || 0;
    const amount = Number(app.approved_amount) || 0;
    return (amount * processingFeePercent) / 100;
  }

  calcTotalPlatformFeeForView(): number {
    const app = this.selectedApplication();
    if (!app || !app.approved_term_days) return 0;
    
    const termDays = Number(app.approved_term_days) || 0;
    const months = Math.round(termDays / 30);
    const platformFee = app.product_platform_fee || 50;
    return platformFee * months;
  }

  calcTotalInterestForView(): number {
    const app = this.selectedApplication();
    if (!app || !app.approved_amount) return 0;
    
    const amount = Number(app.approved_amount) || 0;
    const rate = Number(app.approved_interest_rate) || 0;
    return (amount * rate) / 100;
  }

  calcNetPayForView(): number {
    const app = this.selectedApplication();
    if (!app || !app.approved_amount) return 0;
    
    const amount = Number(app.approved_amount) || 0;
    return amount - this.calcProcessingFeeForView() - this.calcTotalPlatformFeeForView();
  }

  calcTotalRepaymentForView(): number {
    const app = this.selectedApplication();
    if (!app || !app.approved_amount) return 0;
    
    const amount = Number(app.approved_amount) || 0;
    return amount + this.calcTotalInterestForView() + this.calcProcessingFeeForView() + this.calcTotalPlatformFeeForView();
  }

  calcPaymentAmountForView(): number {
    const app = this.selectedApplication();
    if (!app || !app.approved_term_days) return 0;
    
    const frequency = app.product_payment_frequency || 'monthly';
    const termDays = Number(app.approved_term_days) || 0;
    const termMonths = Math.round(termDays / 30);
    
    let numPayments = termMonths;
    switch (frequency) {
      case 'daily':
        numPayments = termDays;
        break;
      case 'weekly':
        numPayments = Math.ceil(termDays / 7);
        break;
      case 'biweekly':
        numPayments = Math.ceil(termDays / 14);
        break;
      case 'monthly':
        numPayments = termMonths;
        break;
    }
    
    if (numPayments === 0) return 0;
    return this.calcTotalRepaymentForView() / numPayments;
  }

  getPaymentFrequencyLabelForView(): string {
    const app = this.selectedApplication();
    if (!app) return 'Monthly';
    
    const frequency = app.product_payment_frequency || 'monthly';
    return frequency.charAt(0).toUpperCase() + frequency.slice(1);
  }

  changePage(page: number) {
    if (page < 1 || page > this.totalPages()) return;
    this.currentPage = page;
    this.loadApplications();
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage;
    const pages: number[] = [];

    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push(-1, total);
      } else if (current >= total - 3) {
        pages.push(1, -1);
        for (let i = total - 4; i <= total; i++) pages.push(i);
      } else {
        pages.push(1, -1);
        for (let i = current - 1; i <= current + 1; i++) pages.push(i);
        pages.push(-1, total);
      }
    }

    return pages;
  }
}

