import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MoneyloanApplicationService } from '../../shared/services/moneyloan-application.service';
import { AuthService } from '../../../../../core/services/auth.service';
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
  product_name?: string;
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
}

@Component({
  selector: 'app-loan-applications',
  standalone: true,
  imports: [
    CommonModule, 
    FormsModule,
    DataManagementPageComponent
  ],
  template: `
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

    <!-- Approval Modal -->
    @if (showApprovalModal()) {
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" (click)="showApprovalModal.set(false)">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full" (click)="$event.stopPropagation()">
          <div class="p-4 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-base font-semibold text-gray-900 dark:text-white">Approve Application</h3>
          </div>
          <div class="p-4 space-y-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Approved Amount</label>
              <input
                type="number"
                [(ngModel)]="approvalData.approved_amount"
                class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Approved Term (days)</label>
              <input
                type="number"
                [(ngModel)]="approvalData.approved_term_days"
                class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Interest Rate (%)</label>
              <input
                type="number"
                step="0.01"
                [(ngModel)]="approvalData.approved_interest_rate"
                class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
              <textarea
                [(ngModel)]="approvalData.review_notes"
                rows="3"
                class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              ></textarea>
            </div>
          </div>
          <div class="p-4 border-t border-gray-200 dark:border-gray-700 flex justify-end gap-2">
            <button
              (click)="showApprovalModal.set(false)"
              class="px-3 py-1.5 text-xs font-medium rounded shadow-sm transition bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Cancel
            </button>
            <button
              (click)="confirmApproval()"
              class="px-3 py-1.5 text-xs font-medium rounded shadow-sm transition text-white bg-green-600 hover:bg-green-700"
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
  private authService = inject(AuthService);

  Math = Math;
  loading = signal(false);
  applications = signal<LoanApplication[]>([]);
  stats = signal({ draft: 0, submitted: 0, under_review: 0, approved: 0, rejected: 0 });
  showApprovalModal = signal(false);
  selectedApplication = signal<LoanApplication | null>(null);
  private tenantId: string | number = '';

  approvalData = {
    approved_amount: 0,
    approved_term_days: 0,
    approved_interest_rate: 12,
    review_notes: ''
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
      icon: '✅',
      label: 'Approve',
      class: 'inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded shadow-sm hover:bg-green-100 dark:hover:bg-green-900/30 transition-all duration-200 hover:scale-105 hover:shadow-md group',
      action: (app) => this.approveApplication(app),
      show: (app) => app.status === 'submitted' || app.status === 'under_review'
    },
    {
      icon: '❌',
      label: 'Reject',
      class: 'inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded shadow-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200 hover:scale-105 hover:shadow-md group',
      action: (app) => this.rejectApplication(app),
      show: (app) => app.status === 'submitted' || app.status === 'under_review'
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
    const user = this.authService.currentUser();
    this.tenantId = user?.tenantId || '';

    this.loadApplications();
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
      draft: apps.filter(a => a.status === 'draft').length,
      submitted: apps.filter(a => a.status === 'submitted').length,
      under_review: apps.filter(a => a.status === 'under_review').length,
      approved: apps.filter(a => a.status === 'approved').length,
      rejected: apps.filter(a => a.status === 'rejected').length
    });
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
    // TODO: Navigate to application details page
    console.log('View application:', app);
  }

  approveApplication(app: LoanApplication) {
    this.selectedApplication.set(app);
    this.approvalData = {
      approved_amount: app.requested_amount,
      approved_term_days: app.requested_term_days,
      approved_interest_rate: 12,
      review_notes: ''
    };
    this.showApprovalModal.set(true);
  }

  confirmApproval() {
    const app = this.selectedApplication();
    if (!app?.id) return;

    const user = this.authService.currentUser();

    // Map frontend fields to backend expected fields
    const approvalPayload = {
      approvedBy: user?.id || 0,
      approvedAmount: this.approvalData.approved_amount,
      interestRate: this.approvalData.approved_interest_rate,
      loanTermDays: this.approvalData.approved_term_days,
      totalFees: 0,
      totalInterest: 0,
      monthlyPayment: 0,
      notes: this.approvalData.review_notes
    };

    this.applicationService.approveApplication(String(this.tenantId), app.id, approvalPayload).subscribe({
      next: () => {
        this.showApprovalModal.set(false);
        this.loadApplications();
      },
      error: (error) => {
        console.error('Failed to approve application:', error);
        alert('Failed to approve application: ' + (error.error?.message || error.message));
      }
    });
  }

  rejectApplication(app: LoanApplication) {
    const reason = prompt('Enter rejection reason:');
    if (!reason) return;

    const user = this.authService.currentUser();
    if (!app.id) return;

    this.applicationService.rejectApplication(String(this.tenantId), app.id, {
      reason: reason,
      rejectedBy: user?.id || 0
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

  formatNumber(value: number): string {
    return new Intl.NumberFormat('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  formatDate(date: string | undefined): string {
    if (!date) return 'N/A';
    try {
      const d = new Date(date);
      if (isNaN(d.getTime())) return 'N/A';
      return d.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (e) {
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
