import { Component, OnInit, signal, inject, computed, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { LoanService } from '../../shared/services/loan.service';
import { ToastService } from '../../../../../core/services/toast.service';
import { AuthService } from '../../../../../core/services/auth.service';
import { CurrencyMaskDirective } from '../../../../../shared/directives/currency-mask.directive';

interface PaymentData {
  loanId: number | null;
  amount: number | null;
  paymentMethod: string;
  paymentDate: string;
  referenceNumber: string;
  notes: string;
  installmentIds?: number[]; // IDs of installments being paid
}

interface Installment {
  id: number;
  installmentNumber: number;
  dueDate: string;
  principalDue: number;
  interestDue: number;
  totalDue: number;
  amountPaid: number;
  status: 'pending' | 'paid' | 'overdue' | 'partial';
  selected?: boolean;
}

interface LoanWithSchedule {
  id: number;
  loanNumber: string;
  customerName: string;
  principalAmount: number;
  outstandingBalance: number;
  paymentFrequency?: 'daily' | 'weekly' | 'monthly';
  productPaymentFrequency?: 'daily' | 'weekly' | 'monthly';
  [key: string]: any; // Allow other properties
}

@Component({
  selector: 'app-record-payment',
  standalone: true,
  imports: [CommonModule, FormsModule, CurrencyMaskDirective],
  template: `
    <div class="p-4 space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">💵 Record Walk-in Payment</h1>
          <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">Record cash/check payments from customers</p>
        </div>
      </div>

      <!-- Search Customer/Loan -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300">1. Find Loan</h2>
          <button
            *ngIf="searchQuery || searchResults().length > 0 || selectedLoan()"
            (click)="resetSearch()"
            class="px-2 py-1 text-xs bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded transition">
            ↺ Reset
          </button>
        </div>
        
        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Search by</label>
            <div class="flex gap-2">
              <select 
                [(ngModel)]="searchType"
                class="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option value="loanNumber">Loan Number</option>
                <option value="customerName">Customer Name</option>
                <option value="customerId">Customer ID</option>
              </select>
            </div>
          </div>
          
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Enter {{ searchType === 'loanNumber' ? 'Loan Number' : searchType === 'customerName' ? 'Name' : 'ID' }}</label>
            <div class="flex gap-2">
              <input
                #searchInput
                type="text"
                [(ngModel)]="searchQuery"
                (keyup.enter)="searchLoan()"
                placeholder="Type and press Enter..."
                class="flex-1 px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400">
              <button
                (click)="searchLoan()"
                [disabled]="searching() || !searchQuery"
                class="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white text-xs rounded-lg transition">
                {{ searching() ? 'Searching...' : '🔍 Search' }}
              </button>
            </div>
          </div>
        </div>

        <!-- Search Results -->
        <div *ngIf="searchResults().length > 0" class="space-y-2">
          <p class="text-xs text-gray-600 dark:text-gray-400">{{ searchResults().length }} loan(s) found:</p>
          <div class="space-y-1 max-h-40 overflow-y-auto">
            <div 
              *ngFor="let loan of searchResults()"
              (click)="selectLoan(loan)"
              class="p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-blue-50 dark:hover:bg-blue-900/20 cursor-pointer transition"
              [class.bg-blue-100]="selectedLoan()?.id === loan.id"
              [class.dark:bg-blue-900/30]="selectedLoan()?.id === loan.id">
              <div class="flex items-center justify-between">
                <div class="flex-1">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ loan.loanNumber }}</p>
                  <p class="text-xs text-gray-600 dark:text-gray-400">{{ loan.customerName }} • {{ loan.productName }}</p>
                </div>
                <div class="text-right">
                  <p class="text-sm font-semibold text-orange-600 dark:text-orange-400">₱{{ formatCurrency(loan.outstandingBalance) }}</p>
                  <p class="text-xs text-gray-500">Outstanding</p>
                </div>
              </div>
            </div>
          </div>
        </div>

        <div *ngIf="!searching() && searchQuery && searchResults().length === 0" class="text-center py-2">
          <p class="text-sm text-gray-500">No loans found</p>
        </div>
      </div>

      <!-- Selected Loan Details -->
      <div *ngIf="selectedLoan()" class="bg-gradient-to-br from-blue-50 to-white dark:from-blue-900/20 dark:to-gray-800 rounded-lg border border-blue-200 dark:border-blue-800 p-3">
        <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">2. Loan Details</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-2 text-xs">
          <div>
            <span class="text-gray-600 dark:text-gray-400">Loan Number:</span>
            <p class="font-medium text-gray-900 dark:text-white">{{ selectedLoan()?.loanNumber }}</p>
          </div>
          <div>
            <span class="text-gray-600 dark:text-gray-400">Customer:</span>
            <p class="font-medium text-gray-900 dark:text-white">{{ selectedLoan()?.customerName }}</p>
          </div>
          <div>
            <span class="text-gray-600 dark:text-gray-400">Principal:</span>
            <p class="font-medium text-gray-900 dark:text-white">₱{{ formatCurrency(selectedLoan()?.principalAmount) }}</p>
          </div>
          <div>
            <span class="text-gray-600 dark:text-gray-400">Outstanding:</span>
            <p class="font-medium text-orange-600 dark:text-orange-400">₱{{ formatCurrency(selectedLoan()?.outstandingBalance) }}</p>
          </div>
        </div>
      </div>

      <!-- Repayment Schedule -->
      <div *ngIf="selectedLoan()" class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-3">
        <div class="flex items-center justify-between">
          <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300">
            3. Select Installments to Pay 
            <span class="text-xs font-normal text-gray-500">({{ getFrequencyLabel() }} payments)</span>
          </h2>
          <div *ngIf="loadingSchedule()" class="text-xs text-gray-500">Loading...</div>
        </div>

        <!-- Quick Select Buttons -->
        <div class="flex gap-2 flex-wrap">
          <button
            (click)="selectNextInstallments(1)"
            class="px-3 py-1.5 bg-blue-100 hover:bg-blue-200 dark:bg-blue-900/30 dark:hover:bg-blue-900/50 text-blue-700 dark:text-blue-300 text-xs rounded-lg transition">
            📅 Pay 1 {{ selectedLoan()?.paymentFrequency === 'daily' ? 'Day' : selectedLoan()?.paymentFrequency === 'monthly' ? 'Month' : 'Week' }}
          </button>
          <button
            (click)="selectNextInstallments(2)"
            class="px-3 py-1.5 bg-purple-100 hover:bg-purple-200 dark:bg-purple-900/30 dark:hover:bg-purple-900/50 text-purple-700 dark:text-purple-300 text-xs rounded-lg transition">
            📅 Pay 2 {{ selectedLoan()?.paymentFrequency === 'daily' ? 'Days' : selectedLoan()?.paymentFrequency === 'monthly' ? 'Months' : 'Weeks' }}
          </button>
          <button
            (click)="selectAllInstallments()"
            class="px-3 py-1.5 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-300 text-xs rounded-lg transition">
            💰 Pay Full
          </button>
          <button
            (click)="clearSelection()"
            *ngIf="selectedInstallments().length > 0"
            class="px-3 py-1.5 bg-red-100 hover:bg-red-200 dark:bg-red-900/30 dark:hover:bg-red-900/50 text-red-700 dark:text-red-300 text-xs rounded-lg transition">
            ✖ Clear Selection
          </button>
        </div>

        <!-- Installments List -->
        <div class="space-y-1 max-h-60 overflow-y-auto">
          <div
            *ngFor="let installment of repaymentSchedule()"
            (click)="toggleInstallment(installment)"
            class="p-2 border rounded-lg cursor-pointer transition"
            [class.border-gray-200]="!installment.selected && installment.status !== 'paid'"
            [class.dark:border-gray-700]="!installment.selected && installment.status !== 'paid'"
            [class.border-green-300]="installment.selected"
            [class.bg-green-50]="installment.selected"
            [class.dark:bg-green-900/20]="installment.selected"
            [class.border-gray-300]="installment.status === 'paid'"
            [class.bg-gray-100]="installment.status === 'paid'"
            [class.dark:bg-gray-700]="installment.status === 'paid'"
            [class.opacity-50]="installment.status === 'paid'"
            [class.cursor-not-allowed]="installment.status === 'paid'">
            <div class="flex items-center justify-between">
              <div class="flex items-center gap-2">
                <input
                  type="checkbox"
                  [checked]="installment.selected"
                  [disabled]="installment.status === 'paid'"
                  class="w-4 h-4"
                  (click)="$event.stopPropagation()">
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ getInstallmentLabel(installment.installmentNumber) }}
                    <span *ngIf="installment.status === 'paid'" class="ml-2 text-xs text-green-600">✓ Paid</span>
                    <span *ngIf="installment.status === 'overdue'" class="ml-2 text-xs text-red-600">⚠ Overdue</span>
                  </p>
                  <p class="text-xs text-gray-600 dark:text-gray-400">Due: {{ installment.dueDate | date:'MMM d, y' }}</p>
                </div>
              </div>
              <div class="text-right">
                <p class="text-sm font-semibold text-gray-900 dark:text-white">
                  ₱{{ formatCurrency(installment.totalDue - (installment.amountPaid || 0)) }}
                </p>
                <p class="text-xs text-gray-500">
                  <span *ngIf="installment.amountPaid > 0">Paid: ₱{{ formatCurrency(installment.amountPaid) }}</span>
                  <span *ngIf="!installment.amountPaid || installment.amountPaid === 0">Total: ₱{{ formatCurrency(installment.totalDue) }}</span>
                </p>
              </div>
            </div>
          </div>

          <div *ngIf="repaymentSchedule().length === 0 && !loadingSchedule()" class="text-center py-4 text-sm text-gray-500">
            No repayment schedule available
          </div>
        </div>

        <!-- Selected Summary -->
        <div *ngIf="selectedInstallments().length > 0" class="border-t border-gray-200 dark:border-gray-700 pt-3">
          <div class="flex items-center justify-between text-sm">
            <span class="text-gray-700 dark:text-gray-300">Selected: {{ selectedInstallments().length }} installment(s)</span>
            <span class="font-semibold text-green-600 dark:text-green-400">Total: ₱{{ formatCurrency(totalSelectedAmount()) }}</span>
          </div>
        </div>
      </div>

      <!-- Payment Form -->
      <div *ngIf="selectedLoan()" class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 space-y-3">
        <h2 class="text-sm font-semibold text-gray-700 dark:text-gray-300">4. Payment Information</h2>
        
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Amount *</label>
            <input
              type="text"
              [(ngModel)]="paymentData.amount"
              (ngModelChange)="onAmountChange($event)"
              appCurrencyMask
              currencyCode="PHP"
              placeholder="₱0.00"
              class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <p *ngIf="paymentData.amount && paymentData.amount > selectedLoan()?.outstandingBalance" class="text-xs text-red-600 mt-1">
              Cannot exceed outstanding balance
            </p>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Method *</label>
            <select
              [(ngModel)]="paymentData.paymentMethod"
              (change)="onPaymentMethodChange()"
              required
              class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="cash" selected>💵 Cash</option>
              <option value="check">📝 Check</option>
              <option value="bank_transfer">🏦 Bank Transfer</option>
              <option value="gcash">📱 GCash</option>
              <option value="paymaya">💳 PayMaya</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Payment Date *</label>
            <input
              type="date"
              [(ngModel)]="paymentData.paymentDate"
              [max]="maxDate"
              class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
          </div>
        </div>

        <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Reference Number
              <span *ngIf="paymentData.paymentMethod === 'cash'" class="text-xs text-gray-500">(Auto-generated)</span>
            </label>
            <input
              type="text"
              [(ngModel)]="paymentData.referenceNumber"
              [readonly]="paymentData.paymentMethod === 'cash'"
              placeholder="Receipt/Check/Transaction #"
              class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              [class.bg-gray-50]="paymentData.paymentMethod === 'cash'"
              [class.dark:bg-gray-600]="paymentData.paymentMethod === 'cash'">
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Notes</label>
            <input
              type="text"
              [(ngModel)]="paymentData.notes"
              placeholder="Walk-in payment at Main Branch"
              class="w-full px-2 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
          </div>
        </div>

        <!-- Payment Summary -->
        <div *ngIf="paymentData.amount" class="bg-green-50 dark:bg-green-900/20 rounded-lg p-2 border border-green-200 dark:border-green-800">
          <div class="grid grid-cols-2 gap-2 text-xs">
            <div>
              <span class="text-gray-600 dark:text-gray-400">Current Outstanding:</span>
              <p class="font-medium text-gray-900 dark:text-white">₱{{ formatCurrency(selectedLoan()?.outstandingBalance) }}</p>
            </div>
            <div>
              <span class="text-gray-600 dark:text-gray-400">Payment Amount:</span>
              <p class="font-medium text-blue-600 dark:text-blue-400">₱{{ formatCurrency(paymentData.amount) }}</p>
            </div>
            <div class="col-span-2 border-t border-green-200 dark:border-green-800 pt-2">
              <span class="text-gray-600 dark:text-gray-400">New Outstanding:</span>
              <p class="text-lg font-bold text-green-600 dark:text-green-400">
                ₱{{ formatCurrency((selectedLoan()?.outstandingBalance || 0) - (paymentData.amount || 0)) }}
              </p>
              <p *ngIf="(selectedLoan()?.outstandingBalance || 0) - (paymentData.amount || 0) === 0" class="text-xs text-green-600 dark:text-green-400 mt-1">
                ✅ Loan will be fully paid
              </p>
            </div>
          </div>
        </div>

        <!-- Action Buttons -->
        <div class="flex gap-2 pt-2">
          <button
            (click)="clearForm()"
            class="flex-1 px-3 py-2 bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 text-sm rounded-lg transition">
            ↺ Clear
          </button>
          <button
            (click)="recordPayment()"
            [disabled]="!canSubmit() || submitting()"
            class="flex-1 px-3 py-2 bg-green-600 hover:bg-green-700 disabled:bg-gray-400 disabled:cursor-not-allowed text-white text-sm rounded-lg transition font-medium">
            {{ submitting() ? 'Recording...' : '✓ Record Payment' }}
          </button>
        </div>
      </div>

    </div>
  `
})
export class RecordPaymentComponent implements OnInit, AfterViewInit {
  @ViewChild('searchInput') searchInput!: ElementRef<HTMLInputElement>;
  
  private loanService = inject(LoanService);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private authService = inject(AuthService);

  searchType = 'loanNumber';
  searchQuery = '';
  searching = signal(false);
  searchResults = signal<any[]>([]);
  selectedLoan = signal<LoanWithSchedule | null>(null);
  repaymentSchedule = signal<Installment[]>([]);
  loadingSchedule = signal(false);
  submitting = signal(false);
  paymentAmount = signal<number | null>(null);

  maxDate = new Date().toISOString().split('T')[0];

  paymentData: PaymentData = {
    loanId: null,
    amount: null,
    paymentMethod: 'cash',
    paymentDate: this.maxDate,
    referenceNumber: '',
    notes: 'Walk-in payment',
    installmentIds: []
  };

  selectedInstallments = computed(() => {
    return this.repaymentSchedule().filter(inst => inst.selected);
  });

  totalSelectedAmount = computed(() => {
    return this.selectedInstallments().reduce((sum, inst) => {
      const remaining = inst.totalDue - (inst.amountPaid || 0);
      return sum + remaining;
    }, 0);
  });

  canSubmit = computed(() => {
    const amount = this.paymentAmount();
    const hasLoan = !!this.selectedLoan();
    const hasAmount = amount != null && amount > 0;
    const hasMethod = !!(this.paymentData.paymentMethod && this.paymentData.paymentMethod.trim());
    const hasDate = !!this.paymentData.paymentDate;
    
    return hasLoan && hasAmount && hasMethod && hasDate;
  });

  ngOnInit() {
    const tenantId = this.authService.getTenantId();
    if (!tenantId) {
      this.toastService.error('Tenant information not found');
    }
    // Generate initial cash reference number since cash is the default
    this.generateCashReferenceNumber();
  }

  onAmountChange(value: any) {
    const numValue = typeof value === 'string' ? parseFloat(value) : value;
    this.paymentAmount.set(numValue);
  }

  ngAfterViewInit() {
    // Auto-focus on search input when component loads
    setTimeout(() => {
      this.searchInput?.nativeElement?.focus();
    }, 100);
  }

  searchLoan() {
    if (!this.searchQuery.trim()) {
      return;
    }

    this.searching.set(true);
    this.searchResults.set([]);

    const tenantId = this.authService.getTenantId();
    
    if (!tenantId) {
      this.toastService.error('Tenant information not found');
      this.searching.set(false);
      return;
    }

    // Build filters based on search type
    const filters: any = { 
      limit: 50,
      status: 'active'
    };
    
    if (this.searchType === 'loanNumber') {
      filters.search = this.searchQuery;
    } else if (this.searchType === 'customerName') {
      filters.search = this.searchQuery;
    } else if (this.searchType === 'customerId') {
      const customerId = parseInt(this.searchQuery);
      if (!isNaN(customerId)) {
        filters.customerId = customerId;
      }
    }

    this.loanService.listLoans(tenantId.toString(), filters).subscribe({
      next: (response: any) => {
        const loans = response.data || [];
        this.searchResults.set(loans);
        
        if (loans.length === 0) {
          this.toastService.warning(`No loans found for "${this.searchQuery}". Try a different search term.`);
        } else {
          console.log(`📋 Found ${loans.length} loans`);
        }
        
        this.searching.set(false);
      },
      error: (error: any) => {
        console.error('❌ Search error:', error);
        this.toastService.error(`Failed to search: ${error?.error?.message || error?.message || 'Please try again'}`);
        this.searching.set(false);
      }
    });
  }

  selectLoan(loan: any) {
    this.selectedLoan.set(loan);
    this.paymentData.loanId = loan.id;
    this.loadRepaymentSchedule(loan.id);
  }

  loadRepaymentSchedule(loanId: number) {
    this.loadingSchedule.set(true);
    console.log('🔄 Loading repayment schedule for loan:', loanId);
    
    this.loanService.getRepaymentSchedule(loanId).subscribe({
      next: (response: any) => {
        console.log('📦 Raw schedule response:', response);
        const schedule = (response.data || []).map((inst: any) => ({
          id: inst.id,
          installmentNumber: inst.installmentNumber || inst.installment_number,
          dueDate: inst.dueDate || inst.due_date,
          principalDue: inst.principalDue || inst.principal_due,
          interestDue: inst.interestDue || inst.interest_due,
          totalDue: inst.totalDue || inst.total_due,
          amountPaid: inst.amountPaid || inst.amount_paid || 0,
          status: inst.status,
          selected: false
        }));
        console.log('✅ Mapped schedule:', schedule);
        console.log('📊 Schedule summary:', {
          total: schedule.length,
          paid: schedule.filter((s: any) => s.status === 'paid').length,
          pending: schedule.filter((s: any) => s.status === 'pending').length,
          overdue: schedule.filter((s: any) => s.status === 'overdue').length,
        });
        this.repaymentSchedule.set(schedule);
        this.loadingSchedule.set(false);
      },
      error: (error: any) => {
        console.error('Failed to load repayment schedule:', error);
        this.toastService.error('Failed to load payment schedule');
        this.loadingSchedule.set(false);
      }
    });
  }

  toggleInstallment(installment: Installment) {
    const schedule = this.repaymentSchedule();
    const index = schedule.findIndex(inst => inst.id === installment.id);
    if (index !== -1) {
      schedule[index].selected = !schedule[index].selected;
      this.repaymentSchedule.set([...schedule]);
      this.updatePaymentAmount();
    }
  }

  selectNextInstallments(count: number) {
    const schedule = this.repaymentSchedule();
    // Clear all selections
    schedule.forEach(inst => inst.selected = false);
    
    // Select next unpaid/pending installments
    let selected = 0;
    for (const inst of schedule) {
      if (inst.status !== 'paid' && selected < count) {
        inst.selected = true;
        selected++;
      }
    }
    
    this.repaymentSchedule.set([...schedule]);
    this.updatePaymentAmount();
  }

  selectAllInstallments() {
    const schedule = this.repaymentSchedule();
    schedule.forEach(inst => {
      if (inst.status !== 'paid') {
        inst.selected = true;
      }
    });
    this.repaymentSchedule.set([...schedule]);
    this.updatePaymentAmount();
  }

  clearSelection() {
    const schedule = this.repaymentSchedule();
    schedule.forEach(inst => {
      inst.selected = false;
    });
    this.repaymentSchedule.set([...schedule]);
    this.paymentData.amount = null;
    this.paymentAmount.set(null); // Reset signal too
    this.paymentData.installmentIds = [];
  }

  onPaymentMethodChange() {
    // Auto-generate reference number for cash payments
    if (this.paymentData.paymentMethod === 'cash') {
      this.generateCashReferenceNumber();
    } else {
      // Clear for other payment methods so user can enter manually
      if (this.paymentData.referenceNumber?.startsWith('CASH-')) {
        this.paymentData.referenceNumber = '';
      }
    }
  }

  generateCashReferenceNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const hours = String(now.getHours()).padStart(2, '0');
    const minutes = String(now.getMinutes()).padStart(2, '0');
    const seconds = String(now.getSeconds()).padStart(2, '0');
    const random = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
    
    this.paymentData.referenceNumber = `CASH-${year}${month}${day}-${hours}${minutes}${seconds}-${random}`;
  }

  updatePaymentAmount() {
    const total = this.totalSelectedAmount();
    const rounded = Math.round(total * 100) / 100;
    
    // If total is 0, set to null instead to disable button
    if (rounded === 0) {
      this.paymentData.amount = null;
      this.paymentAmount.set(null);
    } else {
      this.paymentData.amount = rounded;
      this.paymentAmount.set(rounded);
    }
    
    this.paymentData.installmentIds = this.selectedInstallments().map(inst => inst.id);
  }

  recordPayment() {
    if (!this.canSubmit() || this.submitting()) return;

    this.submitting.set(true);

    // Use the signal value for amount
    const amount = this.paymentAmount() || 0;

    const payload = {
      loanId: this.paymentData.loanId!,
      amount: amount,
      paymentMethod: this.paymentData.paymentMethod,
      paymentDate: this.paymentData.paymentDate,
      transactionId: this.paymentData.referenceNumber || `WALKIN-${Date.now()}`,
      notes: this.paymentData.notes
    };

    this.loanService.recordPayment(payload).subscribe({
      next: (response: any) => {
        this.submitting.set(false);
        this.toastService.success(`Payment of ₱${this.formatCurrency(amount)} recorded for loan ${this.selectedLoan()?.loanNumber}`);
        
        // Reset form after 1.5 seconds
        setTimeout(() => {
          this.clearForm();
        }, 1500);
      },
      error: (error: any) => {
        this.submitting.set(false);
        this.toastService.error(error.error?.message || 'Failed to record payment. Please try again.');
      }
    });
  }

  resetSearch() {
    this.searchQuery = '';
    this.searchResults.set([]);
    this.selectedLoan.set(null);
    this.repaymentSchedule.set([]);
    this.paymentData = {
      loanId: null,
      amount: null,
      paymentMethod: 'cash',
      paymentDate: this.maxDate,
      referenceNumber: '', // Will be set below
      notes: 'Walk-in payment',
      installmentIds: []
    };
    // Generate cash reference number for default payment method
    this.generateCashReferenceNumber();
    // Re-focus on search input after reset
    setTimeout(() => {
      this.searchInput?.nativeElement?.focus();
    }, 100);
  }

  clearForm() {
    this.selectedLoan.set(null);
    this.searchQuery = '';
    this.searchResults.set([]);
    this.repaymentSchedule.set([]);
    this.paymentAmount.set(null);
    this.paymentData = {
      loanId: null,
      amount: null,
      paymentMethod: 'cash',
      paymentDate: this.maxDate,
      referenceNumber: '', // Will be set below
      notes: 'Walk-in payment',
      installmentIds: []
    };
    // Generate cash reference number for default payment method
    this.generateCashReferenceNumber();
  }

  formatCurrency(amount: number | null | undefined): string {
    const numAmount = typeof amount === 'string' ? parseFloat(amount) : amount;
    return (numAmount || 0).toFixed(2);
  }

  getInstallmentLabel(installmentNumber: number): string {
    const loan = this.selectedLoan();
    const frequency = loan?.paymentFrequency || loan?.productPaymentFrequency || 'weekly';
    
    switch (frequency.toLowerCase()) {
      case 'daily':
        return `Day ${installmentNumber}`;
      case 'weekly':
        return `Week ${installmentNumber}`;
      case 'monthly':
        return `Month ${installmentNumber}`;
      default:
        return `Payment ${installmentNumber}`;
    }
  }

  getFrequencyLabel(): string {
    const loan = this.selectedLoan();
    const frequency = loan?.paymentFrequency || loan?.productPaymentFrequency || 'weekly';
    return frequency.charAt(0).toUpperCase() + frequency.slice(1);
  }
}
