import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MoneyloanApplicationService } from '../../shared/services/moneyloan-application.service';

interface LoanApplication {
  id?: number;
  application_number?: string;
  customer_id: string;
  customer_name?: string;
  loan_product_id: string;
  requested_amount: number;
  requested_term_months: number;
  loan_purpose: string;
  employment_status: string;
  monthly_income: number;
  existing_debts: number;
  status: string;
  created_at?: string;
  approved_amount?: number;
  approved_term_months?: number;
  interest_rate?: number;
}

@Component({
  selector: 'app-loan-applications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>📝</span>
            Loan Applications
          </h1>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Review and process loan applications
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button
            (click)="loadApplications()"
            class="px-3 py-1.5 text-xs font-medium rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              [(ngModel)]="filters.status"
              (change)="loadApplications()"
              class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Status</option>
              <option value="pending">Pending Review</option>
              <option value="under_review">Under Review</option>
              <option value="approved">Approved</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Product</label>
            <select
              [(ngModel)]="filters.product_id"
              (change)="loadApplications()"
              class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
            >
              <option value="">All Products</option>
              <option value="1">Personal Loan</option>
              <option value="2">Business Loan</option>
              <option value="3">Emergency Loan</option>
            </select>
          </div>

          <div class="md:col-span-2">
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
            <input
              type="text"
              [(ngModel)]="filters.search"
              (input)="onSearch()"
              placeholder="Search by application number, customer name..."
              class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
            />
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
        <div class="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
          <p class="text-xs text-gray-500 dark:text-gray-400">Pending</p>
          <p class="text-xl font-bold text-orange-600 dark:text-orange-400 mt-1">{{ stats().pending }}</p>
        </div>
        <div class="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
          <p class="text-xs text-gray-500 dark:text-gray-400">Under Review</p>
          <p class="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">{{ stats().under_review }}</p>
        </div>
        <div class="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
          <p class="text-xs text-gray-500 dark:text-gray-400">Approved</p>
          <p class="text-xl font-bold text-green-600 dark:text-green-400 mt-1">{{ stats().approved }}</p>
        </div>
        <div class="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
          <p class="text-xs text-gray-500 dark:text-gray-400">Rejected</p>
          <p class="text-xl font-bold text-red-600 dark:text-red-400 mt-1">{{ stats().rejected }}</p>
        </div>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-3">Loading applications...</p>
        </div>
      }

      <!-- Applications Table -->
      @if (!loading()) {
        <div class="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Application</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Customer</th>
                  <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Amount</th>
                  <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Term</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Purpose</th>
                  <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Monthly Income</th>
                  <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Status</th>
                  <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Date</th>
                  <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                @for (app of applications(); track app.id) {
                  <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td class="px-3 py-2">
                      <code class="text-xs text-blue-600 dark:text-blue-400 font-medium">{{ app.application_number }}</code>
                    </td>
                    <td class="px-3 py-2">
                      <p class="text-xs font-medium text-gray-900 dark:text-white">{{ app.customer_name }}</p>
                    </td>
                    <td class="px-3 py-2 text-right">
                      <span class="text-sm font-semibold text-gray-900 dark:text-white">₱{{ app.requested_amount | number:'1.2-2' }}</span>
                    </td>
                    <td class="px-3 py-2 text-center text-xs text-gray-600 dark:text-gray-400">
                      {{ app.requested_term_months }} months
                    </td>
                    <td class="px-3 py-2">
                      <span class="text-xs text-gray-600 dark:text-gray-400">{{ app.loan_purpose }}</span>
                    </td>
                    <td class="px-3 py-2 text-right text-xs text-gray-600 dark:text-gray-400">
                      ₱{{ app.monthly_income | number:'1.2-2' }}
                    </td>
                    <td class="px-3 py-2 text-center">
                      @if (app.status === 'pending') {
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-orange-100 dark:bg-orange-900/30 text-orange-800 dark:text-orange-300">
                          Pending
                        </span>
                      } @else if (app.status === 'under_review') {
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300">
                          Under Review
                        </span>
                      } @else if (app.status === 'approved') {
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300">
                          Approved
                        </span>
                      } @else if (app.status === 'rejected') {
                        <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300">
                          Rejected
                        </span>
                      }
                    </td>
                    <td class="px-3 py-2 text-center text-xs text-gray-600 dark:text-gray-400">
                      {{ app.created_at | date:'short' }}
                    </td>
                    <td class="px-3 py-2">
                      <div class="flex items-center justify-center gap-1">
                        <button
                          (click)="viewApplication(app)"
                          class="p-1 rounded text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 transition"
                          title="View Details"
                        >
                          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                          </svg>
                        </button>
                        @if (app.status === 'pending' || app.status === 'under_review') {
                          <button
                            (click)="approveApplication(app)"
                            class="p-1 rounded text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 transition"
                            title="Approve"
                          >
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                            </svg>
                          </button>
                          <button
                            (click)="rejectApplication(app)"
                            class="p-1 rounded text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                            title="Reject"
                          >
                            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                } @empty {
                  <tr>
                    <td colspan="9" class="px-3 py-8 text-center text-xs text-gray-500 dark:text-gray-400">
                      No applications found
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Pagination -->
      @if (totalPages() > 1) {
        <div class="flex items-center justify-between">
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ Math.min(currentPage * pageSize, totalRecords()) }} of {{ totalRecords() }} results
          </p>
          <div class="flex items-center gap-1">
            <button
              (click)="changePage(currentPage - 1)"
              [disabled]="currentPage === 1"
              class="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Previous
            </button>
            @for (page of getPageNumbers(); track page) {
              <button
                (click)="changePage(page)"
                [class.bg-blue-600]="page === currentPage"
                [class.text-white]="page === currentPage"
                class="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
              >
                {{ page }}
              </button>
            }
            <button
              (click)="changePage(currentPage + 1)"
              [disabled]="currentPage === totalPages()"
              class="px-2 py-1 text-xs rounded border border-gray-300 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Next
            </button>
          </div>
        </div>
      }
    </div>

    <!-- Approval Modal (Simple - can be enhanced) -->
    @if (showApprovalModal()) {
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50" (click)="showApprovalModal.set(false)">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-6 max-w-md w-full mx-4" (click)="$event.stopPropagation()">
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Approve Application</h3>
          <div class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Approved Amount</label>
              <input
                type="number"
                [(ngModel)]="approvalData.approved_amount"
                class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Approved Term (months)</label>
              <input
                type="number"
                [(ngModel)]="approvalData.approved_term_months"
                class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Interest Rate (%)</label>
              <input
                type="number"
                step="0.01"
                [(ngModel)]="approvalData.interest_rate"
                class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
              <textarea
                [(ngModel)]="approvalData.approval_notes"
                rows="3"
                class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              ></textarea>
            </div>
          </div>
          <div class="flex justify-end gap-2 mt-4">
            <button
              (click)="showApprovalModal.set(false)"
              class="px-3 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-600"
            >
              Cancel
            </button>
            <button
              (click)="confirmApproval()"
              class="px-3 py-1.5 text-xs rounded bg-green-600 text-white hover:bg-green-700"
            >
              Confirm Approval
            </button>
          </div>
        </div>
      </div>
    }
  `,
  styles: []
})
export class LoanApplicationsComponent implements OnInit {
  private applicationService = inject(MoneyloanApplicationService);

  Math = Math;
  loading = signal(false);
  applications = signal<LoanApplication[]>([]);
  stats = signal({ pending: 0, under_review: 0, approved: 0, rejected: 0 });
  showApprovalModal = signal(false);
  selectedApplication = signal<LoanApplication | null>(null);

  filters = {
    status: '',
    product_id: '',
    search: ''
  };

  approvalData = {
    approved_amount: 0,
    approved_term_months: 0,
    interest_rate: 12,
    approval_notes: ''
  };

  currentPage = 1;
  pageSize = 20;
  totalRecords = signal(0);
  totalPages = signal(1);

  ngOnInit() {
    this.loadApplications();
  }

  loadApplications() {
    this.loading.set(true);
    const tenantId = '1'; // TODO: Get from auth

    this.applicationService.getApplications(tenantId, {
      ...this.filters,
      page: this.currentPage,
      limit: this.pageSize
    }).subscribe({
      next: (response) => {
        this.applications.set(response.data || []);
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
      pending: apps.filter(a => a.status === 'pending').length,
      under_review: apps.filter(a => a.status === 'under_review').length,
      approved: apps.filter(a => a.status === 'approved').length,
      rejected: apps.filter(a => a.status === 'rejected').length
    });
  }

  onSearch() {
    // Debounce search if needed
    this.loadApplications();
  }

  viewApplication(app: LoanApplication) {
    // TODO: Navigate to application details page
    console.log('View application:', app);
  }

  approveApplication(app: LoanApplication) {
    this.selectedApplication.set(app);
    this.approvalData = {
      approved_amount: app.requested_amount,
      approved_term_months: app.requested_term_months,
      interest_rate: 12,
      approval_notes: ''
    };
    this.showApprovalModal.set(true);
  }

  confirmApproval() {
    const app = this.selectedApplication();
    if (!app?.id) return;

    const tenantId = '1'; // TODO: Get from auth

    this.applicationService.approveApplication(tenantId, app.id, this.approvalData).subscribe({
      next: () => {
        this.showApprovalModal.set(false);
        this.loadApplications();
      },
      error: (error) => {
        console.error('Failed to approve application:', error);
        alert('Failed to approve application');
      }
    });
  }

  rejectApplication(app: LoanApplication) {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    const tenantId = '1'; // TODO: Get from auth

    this.applicationService.rejectApplication(tenantId, app.id!, {
      rejection_reason: reason,
      rejection_notes: ''
    }).subscribe({
      next: () => {
        this.loadApplications();
      },
      error: (error) => {
        console.error('Failed to reject application:', error);
        alert('Failed to reject application');
      }
    });
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
