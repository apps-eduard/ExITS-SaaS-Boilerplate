import { Component, OnInit, signal, inject, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { LoanService } from '../shared/services/loan.service';
import { MoneyloanApplicationService } from '../shared/services/moneyloan-application.service';
import { Loan } from '../shared/models/loan.models';

interface LoanOrApplication {
  id: number;
  type: 'application' | 'loan';
  applicationNumber?: string;
  loanNumber?: string;
  productName: string;
  requestedAmount?: number;
  principalAmount?: number;
  status: string;
  createdAt: string;
  disbursementDate?: string;
  outstandingBalance?: number;
  monthlyPayment?: number;
  interestRate?: number;
  interestType?: string;
  approvedAmount?: number;
  termDays?: number;
}

interface StatCard {
  label: string;
  value: string | number;
  icon: string;
  valueClass?: string;
  iconBgClass?: string;
  onClick?: () => void;
}

interface Tab {
  id: string;
  label: string;
  count?: number;
}

@Component({
  selector: 'app-my-loans',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-4 p-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <div class="flex items-center gap-2">
            <span class="text-2xl">💳</span>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">My Loans</h1>
          </div>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Track your loan applications and active loans</p>
        </div>
        <button
          (click)="navigateToApply()"
          class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-sm rounded-lg transition-colors shadow-sm">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Apply for New Loan
        </button>
      </div>

      <!-- Stat Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div 
          *ngFor="let stat of statCards()"
          [class]="'bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition' + (stat.onClick ? ' cursor-pointer' : '')"
          (click)="stat.onClick ? stat.onClick() : null"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400">{{ stat.label }}</p>
              <p [class]="stat.valueClass || 'text-lg font-bold text-gray-900 dark:text-white'">{{ stat.value }}</p>
            </div>
            <div [class]="stat.iconBgClass || 'flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30'">
              <span class="text-base">{{ stat.icon }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Tabs -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
        <div class="flex border-b border-gray-200 dark:border-gray-700 overflow-x-auto">
          <button
            *ngFor="let tab of tabs()"
            (click)="activeTab.set(tab.id)"
            [class]="'px-4 py-3 text-sm font-medium transition-colors whitespace-nowrap ' + 
              (activeTab() === tab.id 
                ? 'text-blue-600 dark:text-blue-400 border-b-2 border-blue-600 dark:border-blue-400' 
                : 'text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white')"
          >
            {{ tab.label }} ({{ tab.count }})
          </button>
        </div>

        <!-- Loading State -->
        <div *ngIf="loading()" class="p-8 text-center">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading...</p>
        </div>

        <!-- Empty State -->
        <div *ngIf="!loading() && displayedItems().length === 0" class="p-8 text-center">
          <p class="text-gray-600 dark:text-gray-400">No items found</p>
        </div>

        <!-- Content -->
        <div *ngIf="!loading() && displayedItems().length > 0" class="p-4 space-y-4">
          <!-- Applications Section -->
          <div *ngIf="displayedApplications().length > 0">
            <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">📋 Applications ({{ displayedApplications().length }})</h3>
            <div class="space-y-3">
              <div 
                *ngFor="let app of displayedApplications()"
                class="bg-gradient-to-br from-purple-50 to-white dark:from-purple-900/20 dark:to-gray-800 rounded-lg p-4 border border-purple-200 dark:border-purple-800 hover:shadow-md transition"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                      <span class="text-lg">{{ app.productName }}</span>
                      <span [class]="'px-2 py-0.5 text-xs rounded-full ' + getStatusClass(app.status)">
                        {{ getStatusLabel(app.status) }}
                      </span>
                    </div>
                    <div class="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span class="text-gray-600 dark:text-gray-400">Reference:</span>
                        <span class="ml-2 font-medium text-gray-900 dark:text-white">{{ app.applicationNumber }}</span>
                      </div>
                      <div>
                        <span class="text-gray-600 dark:text-gray-400">Amount:</span>
                        <span class="ml-2 font-medium text-gray-900 dark:text-white">₱{{ formatCurrency(app.approvedAmount || app.requestedAmount || 0) }}</span>
                      </div>
                      <div>
                        <span class="text-gray-600 dark:text-gray-400">Applied:</span>
                        <span class="ml-2 font-medium text-gray-900 dark:text-white">{{ formatDate(app.createdAt) }}</span>
                      </div>
                      <div *ngIf="app.status === 'approved'">
                        <span class="text-indigo-600 dark:text-indigo-400 text-xs">⏳ Awaiting disbursement</span>
                      </div>
                    </div>
                  </div>
                  <button
                    (click)="trackStatus(app)"
                    class="ml-4 px-3 py-1.5 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400 text-xs rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50 transition"
                  >
                    📊 Track Status
                  </button>
                </div>
              </div>
            </div>
          </div>

          <!-- Active Loans Section -->
          <div *ngIf="displayedLoans().length > 0">
            <h3 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-3">💳 Loans ({{ displayedLoans().length }})</h3>
            <div class="space-y-3">
              <div 
                *ngFor="let loan of displayedLoans()"
                class="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800 rounded-lg p-4 border border-blue-200 dark:border-blue-800 hover:shadow-md transition"
              >
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-2">
                      <span class="text-lg">{{ loan.productName }}</span>
                      <span [class]="'px-2 py-0.5 text-xs rounded-full ' + getStatusClass(loan.status)">
                        {{ getStatusLabel(loan.status) }}
                      </span>
                    </div>
                    <div class="grid grid-cols-2 gap-2 text-sm">
                      <div>
                        <span class="text-gray-600 dark:text-gray-400">Loan #:</span>
                        <span class="ml-2 font-medium text-gray-900 dark:text-white">{{ loan.loanNumber }}</span>
                      </div>
                      <div>
                        <span class="text-gray-600 dark:text-gray-400">Principal:</span>
                        <span class="ml-2 font-medium text-gray-900 dark:text-white">₱{{ formatCurrency(loan.principalAmount || 0) }}</span>
                      </div>
                      <div>
                        <span class="text-gray-600 dark:text-gray-400">Outstanding:</span>
                        <span class="ml-2 font-medium text-orange-600 dark:text-orange-400">₱{{ formatCurrency(loan.outstandingBalance || 0) }}</span>
                      </div>
                      <div>
                        <span class="text-gray-600 dark:text-gray-400">Disbursed:</span>
                        <span class="ml-2 font-medium text-gray-900 dark:text-white">{{ formatDate(loan.disbursementDate) }}</span>
                      </div>
                    </div>
                    <!-- Progress Bar -->
                    <div *ngIf="loan.status === 'active' || loan.status === 'overdue'" class="mt-3">
                      <div class="flex items-center justify-between text-xs mb-1">
                        <span class="text-gray-600 dark:text-gray-400">Repayment Progress</span>
                        <span class="font-medium text-gray-900 dark:text-white">{{ calculateProgress(loan) }}%</span>
                      </div>
                      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div 
                          class="bg-green-600 dark:bg-green-500 h-2 rounded-full transition-all"
                          [style.width.%]="calculateProgress(loan)"
                        ></div>
                      </div>
                    </div>
                  </div>
                  <div class="ml-4 flex flex-col gap-2">
                    <button
                      (click)="viewDetails(loan)"
                      class="px-3 py-1.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400 text-xs rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50 transition"
                    >
                      👁️ View Details
                    </button>
                    <button
                      *ngIf="loan.status === 'active' || loan.status === 'overdue'"
                      (click)="makePayment(loan.id)"
                      class="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 text-xs rounded-lg hover:bg-green-200 dark:hover:bg-green-900/50 transition"
                    >
                      💳 Make Payment
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class MyLoansComponent implements OnInit {
  private loanService = inject(LoanService);
  private applicationService = inject(MoneyloanApplicationService);
  private router = inject(Router);

  applications = signal<any[]>([]);
  loans = signal<Loan[]>([]);
  loading = signal(false);
  pagination = signal<any>({});
  activeTab = signal<string>('active');

  filterValues = {
    page: 1,
    limit: 20,
    status: ''
  };

  tabs = computed(() => [
    { id: 'all', label: 'All', count: this.allItems().length },
    { id: 'applications', label: 'Applications', count: this.applications().length },
    { id: 'active', label: 'Active Loans', count: this.activeLoans() },
    { id: 'loans', label: 'All Loans', count: this.loans().length },
    { id: 'rejected', label: 'Rejected', count: this.rejectedApplications() },
    { id: 'completed', label: 'Completed', count: this.completedLoans() }
  ]);

  allItems = computed<LoanOrApplication[]>(() => {
    const apps = this.applications().map((app: any) => ({
      id: app.id,
      type: 'application' as const,
      applicationNumber: app.application_number || app.applicationNumber,
      productName: app.product_name || app.productName || 'N/A',
      requestedAmount: app.requested_amount || app.requestedAmount,
      approvedAmount: app.approved_amount || app.approvedAmount,
      status: app.status,
      createdAt: app.created_at || app.createdAt,
      termDays: app.requested_term_days || app.requestedTermDays,
      interestRate: parseFloat(app.product_interest_rate || app.productInterestRate || 0),
      interestType: app.product_interest_type || app.productInterestType
    }));

    const loanItems = this.loans().map((loan: any) => ({
      id: loan.id,
      type: 'loan' as const,
      loanNumber: loan.loanNumber || loan.loan_number,
      productName: loan.productName || loan.product_name || 'N/A',
      principalAmount: loan.principalAmount || loan.principal_amount,
      outstandingBalance: loan.outstandingBalance || loan.outstanding_balance,
      monthlyPayment: loan.monthlyPayment || loan.monthly_payment,
      status: loan.status,
      createdAt: loan.createdAt || loan.created_at,
      disbursementDate: loan.disbursementDate || loan.disbursement_date,
      interestRate: loan.interestRate || loan.interest_rate,
      interestType: loan.interestType || loan.interest_type
    }));

    console.log('🔄 Transformed applications:', apps);
    console.log('🔄 Transformed loans:', loanItems);

    return [...apps, ...loanItems].sort((a, b) => 
      new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );
  });

  displayedItems = computed(() => {
    const all = this.allItems();
    switch (this.activeTab()) {
      case 'applications':
        return all.filter(item => item.type === 'application');
      case 'active':
        return all.filter(item => item.type === 'loan' && (item.status === 'active' || item.status === 'overdue'));
      case 'loans':
        return all.filter(item => item.type === 'loan');
      case 'rejected':
        return all.filter(item => item.type === 'application' && item.status === 'rejected');
      case 'completed':
        return all.filter(item => item.type === 'loan' && item.status === 'paid_off');
      default:
        return all;
    }
  });

  displayedApplications = computed(() => 
    this.displayedItems().filter(item => item.type === 'application')
  );

  displayedLoans = computed(() => 
    this.displayedItems().filter(item => item.type === 'loan')
  );

  pendingApplications = computed(() => 
    this.applications().filter(a => a.status === 'submitted' || a.status === 'pending').length
  );
  
  approvedPendingDisbursement = computed(() =>
    this.applications().filter(a => a.status === 'approved').length
  );
  
  activeLoans = computed(() => 
    this.loans().filter(l => l.status === 'active').length
  );
  
  overdueLoans = computed(() => 
    this.loans().filter(l => l.status === 'overdue').length
  );
  
  completedLoans = computed(() => 
    this.loans().filter(l => l.status === 'paid_off').length
  );
  
  rejectedApplications = computed(() =>
    this.applications().filter(a => a.status === 'rejected').length
  );

  totalOutstanding = computed(() => 
    this.loans()
      .filter(l => l.status === 'active' || l.status === 'overdue')
      .reduce((sum, loan) => sum + (loan.outstandingBalance || 0), 0)
  );

  statCards = computed(() => [
    {
      label: 'Pending Applications',
      value: this.pendingApplications(),
      icon: '⏳',
      valueClass: 'text-lg font-bold text-yellow-600 dark:text-yellow-400',
      iconBgClass: 'flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30',
      onClick: () => this.setTab('applications', 'submitted')
    },
    {
      label: 'Approved (Pending Disbursement)',
      value: this.approvedPendingDisbursement(),
      icon: '✓',
      valueClass: 'text-lg font-bold text-indigo-600 dark:text-indigo-400',
      iconBgClass: 'flex h-8 w-8 items-center justify-center rounded-full bg-indigo-100 dark:bg-indigo-900/30',
      onClick: () => this.setTab('applications', 'approved')
    },
    {
      label: 'Active Loans',
      value: this.activeLoans(),
      icon: '🟢',
      valueClass: 'text-lg font-bold text-green-600 dark:text-green-400',
      iconBgClass: 'flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30',
      onClick: () => this.activeTab.set('active')
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
      value: this.overdueLoans(),
      icon: '⚠️',
      valueClass: 'text-lg font-bold text-red-600 dark:text-red-400',
      iconBgClass: 'flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30',
      onClick: () => this.setTab('active', 'overdue')
    },
    {
      label: 'Completed',
      value: this.completedLoans(),
      icon: '✅',
      valueClass: 'text-lg font-bold text-blue-600 dark:text-blue-400',
      iconBgClass: 'flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30',
      onClick: () => this.activeTab.set('completed')
    },
    {
      label: 'Rejected',
      value: this.rejectedApplications(),
      icon: '❌',
      valueClass: 'text-lg font-bold text-gray-600 dark:text-gray-400',
      iconBgClass: 'flex h-8 w-8 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700',
      onClick: () => this.setTab('applications', 'rejected')
    }
  ] as StatCard[]);

  ngOnInit() {
    this.loadData();
  }

  loadData() {
    this.loading.set(true);

    const customerDataStr = localStorage.getItem('customerData');
    
    if (!customerDataStr) {
      console.error('No customer data found in localStorage');
      this.loading.set(false);
      return;
    }

    const customerData = JSON.parse(customerDataStr);
    const tenantId = customerData.tenantId;
    const customerId = customerData.id;
    
    console.log('🔍 Customer My Loans - Loading data for:', { tenantId, customerId });
    
    if (!tenantId || !customerId) {
      console.error('Missing tenantId or customer ID', { tenantId, customerId });
      this.loading.set(false);
      return;
    }

    Promise.all([
      this.applicationService.getApplications(tenantId.toString(), { customerId }).toPromise(),
      this.loanService.listCustomerLoans(tenantId.toString(), customerId, this.filterValues).toPromise()
    ]).then(([applicationsResponse, loansResponse]) => {
      console.log('✅ Applications loaded:', applicationsResponse);
      console.log('✅ Loans loaded:', loansResponse);
      
      const apps = (applicationsResponse as any)?.data || [];
      const lns = (loansResponse as any)?.data || [];
      
      console.log('📊 Applications array:', apps);
      console.log('📊 Loans array:', lns);
      
      this.applications.set(apps);
      this.loans.set(lns);
      this.pagination.set((loansResponse as any)?.pagination || {});
      this.loading.set(false);
      
      console.log('✅ State updated - Applications signal:', this.applications());
      console.log('✅ State updated - Loans signal:', this.loans());
      console.log('✅ All items computed:', this.allItems());
    }).catch((error) => {
      console.error('❌ Error loading data:', error);
      this.loading.set(false);
    });
  }

  setTab(tab: string, status?: string) {
    this.activeTab.set(tab);
    if (status) {
      this.filterValues.status = status;
    }
  }

  calculateProgress(loan: any): number {
    const principal = loan.principalAmount || 0;
    const outstanding = loan.outstandingBalance || 0;
    const paid = principal - outstanding;
    return principal > 0 ? Math.round((paid / principal) * 100) : 0;
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
      case 'submitted':
      case 'pending':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      case 'approved':
        return 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400';
      case 'rejected':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
      case 'active':
      case 'disbursed':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'overdue':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      case 'paid_off':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  }

  getStatusLabel(status: string): string {
    switch (status) {
      case 'submitted':
        return 'PENDING REVIEW';
      case 'pending':
        return 'PENDING';
      case 'approved':
        return 'APPROVED';
      case 'rejected':
        return 'REJECTED';
      case 'active':
        return 'ACTIVE';
      case 'disbursed':
        return 'DISBURSED';
      case 'overdue':
        return 'OVERDUE';
      case 'paid_off':
        return 'COMPLETED';
      default:
        return status?.toUpperCase() || 'N/A';
    }
  }

  viewDetails(item: LoanOrApplication) {
    if (item.type === 'application') {
      this.router.navigate(['/platforms/money-loan/customer/loan-status-tracking'], {
        queryParams: { applicationId: item.id }
      });
    } else {
      this.router.navigate(['/platforms/money-loan/customer/loans', item.id]);
    }
  }

  trackStatus(item: LoanOrApplication) {
    this.router.navigate(['/platforms/money-loan/customer/loan-status-tracking'], {
      queryParams: { applicationId: item.id }
    });
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
