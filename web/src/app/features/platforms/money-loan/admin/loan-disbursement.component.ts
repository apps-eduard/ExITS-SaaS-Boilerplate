import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DataManagementPageComponent, StatCard, FilterField, ColumnDefinition, ActionButton } from '../../../../shared/components/ui/data-management-page.component';
import { LoanService } from '../shared/services/loan.service';
import { MoneyloanApplicationService } from '../shared/services/moneyloan-application.service';
import { AuthService } from '../../../../core/services/auth.service';
import { Loan } from '../shared/models/loan.models';

interface DisbursementData {
  disbursementMethod: string;
  disbursementReference: string;
  disbursementNotes?: string;
}

@Component({
  selector: 'app-loan-disbursement',
  standalone: true,
  imports: [CommonModule, FormsModule, DataManagementPageComponent],
  template: `
    <app-data-management-page
      pageIcon="💸"
      pageTitle="Loan Disbursement"
      pageDescription="Disburse approved loans and release funds to customers"
      [statCards]="statCards()"
      [filterFields]="filterFields"
      [filterValues]="filterValues"
      [columns]="columns"
      [data]="loans() || []"
      [rowActions]="rowActions"
      [loading]="loading()"
      [pagination]="pagination()"
      (filterChange)="onFilterChange($event)"
      (pageChange)="onPageChange($event)"
      (sortChange)="onSortChange($event)"
    ></app-data-management-page>

    <!-- Disbursement Modal -->
    <div *ngIf="showDisbursementModal()"
         class="fixed inset-0 bg-black/50 dark:bg-black/70 flex items-center justify-center z-50 p-4">
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full max-h-[90vh] overflow-y-auto">
        <!-- Modal Header -->
        <div class="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
          <div class="flex items-center justify-between">
            <div class="flex items-center gap-2">
              <span class="text-xl">💰</span>
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">Disburse Loan</h3>
            </div>
            <button
              (click)="closeDisbursementModal()"
              class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>
        </div>

        <!-- Modal Body -->
        <div class="p-4 space-y-4">
          <div *ngIf="selectedLoan()" class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-3 space-y-2">
            <div class="flex justify-between text-xs">
              <span class="text-gray-600 dark:text-gray-400">Loan Number:</span>
              <code class="text-blue-600 dark:text-blue-400 font-medium">{{ selectedLoan()?.loanNumber }}</code>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-gray-600 dark:text-gray-400">Customer:</span>
              <span class="text-gray-900 dark:text-white font-medium">{{ getCustomerName(selectedLoan()) }}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-gray-600 dark:text-gray-400">Principal Amount:</span>
              <span class="text-gray-900 dark:text-white font-bold">₱{{ formatCurrency(selectedLoan()?.principalAmount || 0) }}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-gray-600 dark:text-gray-400">Interest Rate:</span>
              <span class="text-gray-900 dark:text-white">{{ selectedLoan()?.interestRate }}% {{ selectedLoan()?.interestType === 'flat' ? 'Flat' : 'Reducing' }}</span>
            </div>
            <div class="flex justify-between text-xs">
              <span class="text-gray-600 dark:text-gray-400">Term:</span>
              <span class="text-gray-900 dark:text-white">{{ selectedLoan()?.loanTermMonths }} months</span>
            </div>
          </div>

          <form (submit)="submitDisbursement($event)" class="space-y-3">
            <!-- Disbursement Method -->
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Disbursement Method <span class="text-red-500">*</span>
              </label>
              <select
                [(ngModel)]="disbursementData.disbursementMethod"
                name="disbursementMethod"
                (ngModelChange)="onDisbursementMethodChange($event)"
                required
                class="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500">
                <option value="">Select Method</option>
                <option value="bank_transfer">Bank Transfer</option>
                <option value="cash">Cash</option>
                <option value="check">Check</option>
                <option value="online_payment">Online Payment (GCash/PayMaya)</option>
                <option value="other">Other</option>
              </select>
            </div>

            <!-- Reference Number -->
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Reference Number <span class="text-red-500">*</span>
                @if (disbursementData.disbursementMethod === 'cash') {
                  <span class="text-xs text-gray-500 dark:text-gray-400 font-normal">(Auto-generated)</span>
                }
              </label>
              <input
                type="text"
                [(ngModel)]="disbursementData.disbursementReference"
                name="disbursementReference"
                required
                [readonly]="disbursementData.disbursementMethod === 'cash'"
                [placeholder]="disbursementData.disbursementMethod === 'cash' ? 'Auto-generated for cash' : 'Enter transaction reference number'"
                [class.bg-gray-100]="disbursementData.disbursementMethod === 'cash'"
                [class.dark:bg-gray-900]="disbursementData.disbursementMethod === 'cash'"
                [class.cursor-not-allowed]="disbursementData.disbursementMethod === 'cash'"
                class="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-1 focus:ring-blue-500">
            </div>

            <!-- Notes (Optional) -->
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notes (Optional)
              </label>
              <textarea
                [(ngModel)]="disbursementData.disbursementNotes"
                name="disbursementNotes"
                rows="3"
                placeholder="Additional notes about this disbursement..."
                class="w-full px-2.5 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-1 focus:ring-blue-500"></textarea>
            </div>

            <!-- Action Buttons -->
            <div class="flex gap-2 pt-2">
              <button
                type="button"
                (click)="closeDisbursementModal()"
                class="flex-1 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition">
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="processing()"
                class="flex-1 px-3 py-2 text-sm font-medium text-white bg-green-600 rounded hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center gap-2">
                <span *ngIf="processing()" class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
                {{ processing() ? 'Processing...' : 'Disburse Loan' }}
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class LoanDisbursementComponent implements OnInit {
  private loanService = inject(LoanService);
  private applicationService = inject(MoneyloanApplicationService);
  private authService = inject(AuthService);

  // Signals
  loans = signal<Loan[]>([]);
  loading = signal(false);
  processing = signal(false);
  pagination = signal<any>({});
  selectedLoan = signal<Loan | null>(null);
  showDisbursementModal = signal(false);

  // Filter values
  filterValues = {
    page: 1,
    limit: 20,
    status: 'pending', // Only show approved but not disbursed loans
    search: ''
  };

  // Disbursement form data
  disbursementData: DisbursementData = {
    disbursementMethod: '',
    disbursementReference: '',
    disbursementNotes: ''
  };

  // Computed stats
  statCards = computed(() => {
    const loansData = this.loans() || [];
    const totalAmount = loansData.reduce((sum, loan) => sum + (loan.principalAmount || 0), 0);
    const avgLoanSize = loansData.length > 0 ? totalAmount / loansData.length : 0;

    return [
      {
        label: 'Pending Disbursement',
        value: loansData.length,
        icon: '📋',
        valueClass: 'text-lg font-bold text-orange-600 dark:text-orange-400',
        iconBgClass: 'flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30'
      },
      {
        label: 'Total Amount',
        value: `₱${this.formatCurrency(totalAmount)}`,
        icon: '💰',
        valueClass: 'text-lg font-bold text-green-600 dark:text-green-400',
        iconBgClass: 'flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30'
      },
      {
        label: 'Average Loan Size',
        value: `₱${this.formatCurrency(avgLoanSize)}`,
        icon: '📊',
        valueClass: 'text-lg font-bold text-blue-600 dark:text-blue-400',
        iconBgClass: 'flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30'
      }
    ] as StatCard[];
  });

  // Filter fields
  filterFields: FilterField[] = [
    {
      type: 'search',
      label: 'Search',
      modelKey: 'search',
      placeholder: 'Search by loan number, customer name...'
    }
  ];

  // Column definitions
  columns: ColumnDefinition[] = [
    {
      key: 'loanNumber',
      label: 'Loan Number',
      icon: '🔢',
      sortable: true,
      type: 'text',
      width: '12%'
    },
    {
      key: 'customer',
      label: 'Customer',
      icon: '👤',
      type: 'text',
      format: (value, row) => {
        // Use customer object from backend (now includes firstName, lastName)
        if (value?.fullName && value.fullName.trim() !== '') {
          return value.fullName;
        }
        // Fallback to building from firstName and lastName
        const firstName = value?.firstName || row?.firstName || '';
        const lastName = value?.lastName || row?.lastName || '';
        const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
        if (fullName) {
          return fullName;
        }
        // Fallback to email/customerCode
        if (value?.email) {
          return value.email;
        }
        if (value?.customerCode) {
          return value.customerCode;
        }
        return 'N/A';
      },
      width: '18%'
    },
    {
      key: 'assignedEmployeeName',
      label: 'Collector',
      icon: '🚶',
      type: 'text',
      format: (value, row) => {
        // Backend now provides assignedEmployeeName directly
        if (value && value.trim()) {
          return value;
        }
        // Check customer object as well
        if (row?.customer?.assignedEmployeeName && row.customer.assignedEmployeeName.trim()) {
          return row.customer.assignedEmployeeName;
        }
        // Check other possible field names for backward compatibility
        if (row?.collectorName && row.collectorName.trim()) {
          return row.collectorName;
        }
        if (row?.assignedCollector?.fullName && row.assignedCollector.fullName.trim()) {
          return row.assignedCollector.fullName;
        }
        return 'Unassigned';
      },
      width: '15%'
    },
    {
      key: 'principalAmount',
      label: 'Principal',
      icon: '💵',
      sortable: true,
      type: 'number',
      align: 'right',
      format: (value) => `₱${this.formatCurrency(value)}`,
      width: '12%'
    },
    {
      key: 'interestRate',
      label: 'Interest',
      icon: '📈',
      type: 'text',
      align: 'center',
      format: (value, row) => `${value}% ${row?.interestType === 'flat' ? 'Flat' : 'Reducing'}`,
      width: '10%'
    },
    {
      key: 'loanTermMonths',
      label: 'Term',
      icon: '📅',
      type: 'text',
      align: 'center',
      format: (value) => `${value} months`,
      width: '8%'
    },
    {
      key: 'createdAt',
      label: 'Approved Date',
      icon: '🗓️',
      sortable: true,
      type: 'date',
      align: 'center',
      format: (value) => this.formatDate(value),
      width: '11%'
    },
    {
      key: 'status',
      label: 'Status',
      icon: '🏷️',
      type: 'badge',
      align: 'center',
      getBadgeClass: (value) => this.getStatusClass(value),
      format: (value) => value?.toUpperCase().replace('_', ' ') || 'N/A',
      width: '9%'
    },
    {
      key: 'actions',
      label: 'Actions',
      type: 'actions',
      align: 'center',
      width: '5%'
    }
  ];

  // Row actions
  rowActions: ActionButton[] = [
    {
      icon: '👁️',
      label: 'View Details',
      class: 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300',
      action: (loan) => this.viewLoan(loan)
    },
    {
      icon: '💸',
      label: 'Disburse',
      class: 'text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300',
      action: (loan) => this.openDisbursementModal(loan),
      show: (loan) => loan.status === 'pending' // Only show for pending loans
    }
  ];

  ngOnInit(): void {
    this.loadLoans();
  }

  loadLoans(): void {
    this.loading.set(true);

    const tenantId = this.authService.getTenantId();
    if (!tenantId) {
      console.error('No tenant ID found');
      this.loading.set(false);
      return;
    }

    this.loanService.listLoans(tenantId.toString(), this.filterValues).subscribe({
      next: (response) => {
        console.log('📊 Loans received:', response.data);
        console.log('📊 First loan FULL DATA:', JSON.stringify(response.data[0], null, 2));
        console.log('📊 First loan customer object:', response.data[0]?.customer);
        this.loans.set(response.data);
        this.pagination.set(response.pagination);
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading loans:', err);
        this.loading.set(false);
      }
    });
  }

  onFilterChange(filters: any): void {
    this.filterValues = { ...this.filterValues, ...filters, page: 1 };
    this.loadLoans();
  }

  onPageChange(page: number): void {
    this.filterValues.page = page;
    this.loadLoans();
  }

  onSortChange(sort: any): void {
    // Handle sorting if needed
    console.log('Sort changed:', sort);
  }

  viewLoan(loan: Loan): void {
    // Navigate to loan details or show modal
    console.log('View loan:', loan);
  }

  openDisbursementModal(loan: Loan): void {
    this.selectedLoan.set(loan);
    this.showDisbursementModal.set(true);
    // Reset form
    this.disbursementData = {
      disbursementMethod: '',
      disbursementReference: '',
      disbursementNotes: ''
    };
  }

  onDisbursementMethodChange(method: string): void {
    if (method === 'cash') {
      // Auto-generate reference number for cash disbursements
      this.disbursementData.disbursementReference = this.generateCashReference();
    } else {
      // Clear the reference number for other methods
      if (this.disbursementData.disbursementReference.startsWith('CASH-')) {
        this.disbursementData.disbursementReference = '';
      }
    }
  }

  generateCashReference(): string {
    const loan = this.selectedLoan();
    const date = new Date();
    const dateStr = date.toISOString().split('T')[0].replace(/-/g, '');
    const timeStr = date.getHours().toString().padStart(2, '0') +
                   date.getMinutes().toString().padStart(2, '0') +
                   date.getSeconds().toString().padStart(2, '0');
    const loanNumber = loan?.loanNumber || 'UNKNOWN';

    return `CASH-${dateStr}-${timeStr}-${loanNumber}`;
  }

  closeDisbursementModal(): void {
    this.showDisbursementModal.set(false);
    this.selectedLoan.set(null);
  }

  submitDisbursement(event: Event): void {
    event.preventDefault();

    const loan = this.selectedLoan();
    if (!loan || !loan.id) {
      alert('No loan selected');
      return;
    }

    if (!this.disbursementData.disbursementMethod || !this.disbursementData.disbursementReference) {
      alert('Please fill in all required fields');
      return;
    }

    this.processing.set(true);

    const tenantId = this.authService.getTenantId();
    const currentUser = this.authService.currentUser();

    if (!tenantId) {
      alert('No tenant ID found');
      this.processing.set(false);
      return;
    }

    if (!currentUser?.id) {
      alert('User not authenticated');
      this.processing.set(false);
      return;
    }

    // Backend will get disbursedBy from JWT token (req.user.id)
    this.applicationService.disburseLoan(tenantId.toString(), loan.id, this.disbursementData).subscribe({
      next: (response) => {
        this.processing.set(false);
        this.closeDisbursementModal();
        alert('✅ Loan disbursed successfully!');
        this.loadLoans(); // Reload the list
      },
      error: (err) => {
        console.error('Error disbursing loan:', err);
        this.processing.set(false);
        alert('❌ Error disbursing loan: ' + (err.error?.message || err.message || 'Unknown error'));
      }
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      case 'disbursed':
        return 'bg-cyan-100 dark:bg-cyan-900/30 text-cyan-700 dark:text-cyan-400';
      case 'overdue':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      case 'paid_off':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  }

  formatCurrency(value: number): string {
    return new Intl.NumberFormat('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(value);
  }

  formatDate(date: string | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getCustomerName(loan: Loan | null): string {
    if (!loan) return 'N/A';

    const customer = loan.customer;
    if (!customer) return 'N/A';

    // Try fullName first (backend now populates this correctly)
    if (customer.fullName && customer.fullName.trim() !== '') {
      return customer.fullName;
    }

    // Build from firstName and lastName (backend now includes these)
    const firstName = (customer as any).firstName || '';
    const lastName = (customer as any).lastName || '';
    const fullName = [firstName, lastName].filter(Boolean).join(' ').trim();
    if (fullName) {
      return fullName;
    }

    // Fallback to email
    if (customer.email) {
      return customer.email;
    }

    // Fallback to customerCode
    if (customer.customerCode) {
      return customer.customerCode;
    }

    return 'N/A';
  }
}
