import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { DataManagementPageComponent, StatCard, FilterField, ColumnDefinition, ActionButton } from '../../../../shared/components/ui/data-management-page.component';
import { LoanService } from '../shared/services/loan.service';
import { Loan } from '../shared/models/loan.models';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-my-loans',
  standalone: true,
  imports: [CommonModule, FormsModule, DataManagementPageComponent],
  template: `
    <app-data-management-page
      pageIcon="💳"
      pageTitle="My Loans"
      pageDescription="View and manage all your loans"
      [statCards]="statCards()"
      [filterFields]="filterFields"
      [filterValues]="filterValues"
      [columns]="columns"
      [data]="filteredLoans() || []"
      [rowActions]="rowActions"
      [loading]="loading()"
      [pagination]="pagination()"
      (filterChange)="onFilterChange($event)"
      (pageChange)="onPageChange($event)"
    >
      <div headerActions class="flex gap-2">
        <button
          (click)="navigateToApply()"
          class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors shadow-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Apply for New Loan
        </button>
      </div>
    </app-data-management-page>
  `
})
export class MyLoansComponent implements OnInit {
  private loanService = inject(LoanService);
  private router = inject(Router);
  private authService = inject(AuthService);

  // Signals
  loans = signal<Loan[]>([]);
  loading = signal(false);
  pagination = signal<any>({});

  // Filter values
  filterValues = {
    page: 1,
    limit: 20,
    status: '' // Empty means all disbursed loans (active, overdue, paid_off)
  };

  // Computed signals
  activeLoans = computed(() => (this.loans() || []).filter(l => l.status === 'active'));
  overdueLoans = computed(() => (this.loans() || []).filter(l => l.status === 'overdue'));
  completedLoans = computed(() => (this.loans() || []).filter(l => l.status === 'paid_off'));
  
  filteredLoans = computed(() => {
    const all = this.loans() || [];
    if (!this.filterValues.status) return all;
    return all.filter(l => l.status === this.filterValues.status);
  });

  totalOutstanding = computed(() => 
    [...this.activeLoans(), ...this.overdueLoans()].reduce((sum, loan) => sum + (loan.outstandingBalance || 0), 0)
  );

  // Stat cards
  statCards = computed(() => [
    {
      label: 'Active Loans',
      value: this.activeLoans().length,
      icon: '🟢',
      valueClass: 'text-lg font-bold text-green-600 dark:text-green-400',
      iconBgClass: 'flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30'
    },
    {
      label: 'Total Outstanding',
      value: `₱${this.formatCurrency(this.totalOutstanding())}`,
      icon: '💰',
      valueClass: 'text-lg font-bold text-orange-600 dark:text-orange-400',
      iconBgClass: 'flex h-8 w-8 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30'
    },
    {
      label: 'Overdue Loans',
      value: this.overdueLoans().length,
      icon: '⚠️',
      valueClass: 'text-lg font-bold text-red-600 dark:text-red-400',
      iconBgClass: 'flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30'
    },
    {
      label: 'Completed Loans',
      value: this.completedLoans().length,
      icon: '✅',
      valueClass: 'text-lg font-bold text-blue-600 dark:text-blue-400',
      iconBgClass: 'flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30'
    }
  ] as StatCard[]);

  // Filter fields
  filterFields: FilterField[] = [
    {
      type: 'select',
      label: 'Filter by Status',
      modelKey: 'status',
      options: [
        { value: '', label: 'All Loans' },
        { value: 'active', label: 'Active' },
        { value: 'overdue', label: 'Overdue' },
        { value: 'paid_off', label: 'Completed' }
      ]
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
      key: 'outstandingBalance',
      label: 'Outstanding',
      icon: '📊',
      sortable: true,
      type: 'number',
      align: 'right',
      format: (value) => `₱${this.formatCurrency(value)}`,
      width: '12%'
    },
    {
      key: 'monthlyPayment',
      label: 'Monthly Payment',
      icon: '📅',
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
      format: (value, row) => `${value}% ${row?.interestType}`,
      width: '10%'
    },
    {
      key: 'disbursementDate',
      label: 'Disbursed',
      icon: '🗓️',
      sortable: true,
      type: 'date',
      align: 'center',
      format: (value) => this.formatDate(value),
      width: '12%'
    },
    {
      key: 'status',
      label: 'Status',
      icon: '🏷️',
      type: 'badge',
      align: 'center',
      getBadgeClass: (value) => this.getStatusClass(value),
      format: (value) => value?.toUpperCase().replace('_', ' ') || 'N/A',
      width: '10%'
    },
    {
      key: 'actions',
      label: 'Actions',
      type: 'actions',
      align: 'center',
      width: '12%'
    }
  ];

  // Row actions
  rowActions: ActionButton[] = [
    {
      icon: '👁️',
      label: 'View Details',
      class: 'text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300',
      action: (loan) => this.viewLoanDetails(loan.id)
    },
    {
      icon: '💳',
      label: 'Make Payment',
      class: 'text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300',
      action: (loan) => this.makePayment(loan.id),
      show: (loan) => loan.status === 'active' || loan.status === 'overdue'
    }
  ];

  ngOnInit() {
    this.loadLoans();
  }

  loadLoans() {
    this.loading.set(true);

    // Get customer data from localStorage (customer portal uses separate auth)
    const customerDataStr = localStorage.getItem('customerData');
    
    if (!customerDataStr) {
      console.error('No customer data found in localStorage');
      this.loading.set(false);
      return;
    }

    const customerData = JSON.parse(customerDataStr);
    const tenantId = customerData.tenantId;
    const customerId = customerData.id;
    
    console.log('🔍 Customer My Loans - Auth Check:', {
      tenantId,
      customerId,
      customerData
    });
    
    if (!tenantId || !customerId) {
      console.error('Missing tenantId or customer ID', { tenantId, customerId });
      this.loading.set(false);
      return;
    }

    console.log('📞 Calling listCustomerLoans with:', { tenantId: tenantId.toString(), customerId, filters: this.filterValues });

    this.loanService.listCustomerLoans(tenantId.toString(), customerId, this.filterValues).subscribe({
      next: (response) => {
        console.log('✅ Customer loans loaded:', response);
        this.loans.set(response.data || []);
        this.pagination.set(response.pagination);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('❌ Error loading loans:', error);
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

  calculateProgress(loan: Loan): number {
    const paid = (loan.totalAmount || 0) - (loan.outstandingBalance || 0);
    return Math.round((paid / (loan.totalAmount || 1)) * 100);
  }

  formatCurrency(amount: number): string {
    return (amount || 0).toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatDate(date: string): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'overdue':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      case 'paid_off':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  }

  viewLoanDetails(loanId: number) {
    this.router.navigate(['/platforms/money-loan/customer/loans', loanId]);
  }

  makePayment(loanId: number) {
    this.router.navigate(['/platforms/money-loan/customer/payment'], {
      queryParams: { loanId }
    });
  }

  navigateToApply() {
    this.router.navigate(['/platforms/money-loan/customer/apply']);
  }
}
