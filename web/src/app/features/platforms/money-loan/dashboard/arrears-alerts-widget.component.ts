import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface ArrearLoan {
  id: number;
  borrowerName: string;
  loanReference: string;
  loanAmount: number;
  outstandingBalance: number;
  amountOverdue: number;
  daysOverdue: number;
  lastPaymentDate: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  contactAttempts: number;
}

@Component({
  selector: 'app-arrears-alerts-widget',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm">
      <!-- Header -->
      <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center justify-between">
          <div>
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Arrears Alerts</h3>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Loans requiring attention</p>
          </div>
          <span class="px-2 py-1 rounded-full text-xs font-semibold bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
            {{ totalArrears() }}
          </span>
        </div>
      </div>

      <!-- Content -->
      <div class="p-4">
        @if (arrearLoans().length > 0) {
          <!-- Risk Summary -->
          <div class="grid grid-cols-4 gap-2 mb-4">
            <div class="p-2 rounded bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 text-center">
              <p class="text-xl font-bold text-yellow-600 dark:text-yellow-400">{{ lowRisk() }}</p>
              <p class="text-xs text-gray-600 dark:text-gray-400">Low</p>
            </div>
            <div class="p-2 rounded bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 text-center">
              <p class="text-xl font-bold text-orange-600 dark:text-orange-400">{{ mediumRisk() }}</p>
              <p class="text-xs text-gray-600 dark:text-gray-400">Medium</p>
            </div>
            <div class="p-2 rounded bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 text-center">
              <p class="text-xl font-bold text-red-600 dark:text-red-400">{{ highRisk() }}</p>
              <p class="text-xs text-gray-600 dark:text-gray-400">High</p>
            </div>
            <div class="p-2 rounded bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 text-center">
              <p class="text-xl font-bold text-purple-600 dark:text-purple-400">{{ criticalRisk() }}</p>
              <p class="text-xs text-gray-600 dark:text-gray-400">Critical</p>
            </div>
          </div>

          <!-- Total Overdue Amount -->
          <div class="mb-4 p-3 rounded bg-gradient-to-r from-red-500 to-red-600 text-white">
            <p class="text-xs opacity-90 mb-1">Total Amount Overdue</p>
            <p class="text-2xl font-bold">₱{{ formatNumber(totalOverdue()) }}</p>
          </div>

          <!-- Arrears List -->
          <div class="space-y-2 max-h-80 overflow-y-auto">
            @for (loan of arrearLoans(); track loan.id) {
              <div [class]="'p-3 rounded border ' + getRiskBorderClass(loan.riskLevel)"
                   class="cursor-pointer hover:shadow-sm transition"
                   (click)="viewLoan(loan.id)">
                <!-- Header Row -->
                <div class="flex items-start justify-between mb-2">
                  <div class="flex-1">
                    <div class="flex items-center gap-2 mb-1">
                      <p class="text-sm font-medium text-gray-900 dark:text-white">{{ loan.borrowerName }}</p>
                      <span [class]="getRiskBadgeClass(loan.riskLevel)" class="px-1.5 py-0.5 rounded text-xs font-medium">
                        {{ getRiskLabel(loan.riskLevel) }}
                      </span>
                    </div>
                    <p class="text-xs text-gray-500 dark:text-gray-400 font-mono">{{ loan.loanReference }}</p>
                  </div>
                  <div class="text-right">
                    <p class="text-sm font-bold text-red-600 dark:text-red-400">₱{{ formatNumber(loan.amountOverdue) }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ loan.daysOverdue }} days</p>
                  </div>
                </div>

                <!-- Loan Details -->
                <div class="flex items-center justify-between text-xs text-gray-600 dark:text-gray-400 mb-2">
                  <span>Outstanding: ₱{{ formatNumber(loan.outstandingBalance) }}</span>
                  <span>Last Payment: {{ formatDate(loan.lastPaymentDate) }}</span>
                </div>

                <!-- Action Bar -->
                <div class="flex items-center justify-between pt-2 border-t border-gray-200 dark:border-gray-700">
                  <div class="flex items-center gap-1 text-xs text-gray-600 dark:text-gray-400">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                    </svg>
                    <span>{{ loan.contactAttempts }} attempts</span>
                  </div>
                  <div class="flex items-center gap-2">
                    <button (click)="contactBorrower(loan); $event.stopPropagation()"
                            class="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                      Contact
                    </button>
                    <button (click)="schedulePayment(loan); $event.stopPropagation()"
                            class="text-xs text-green-600 dark:text-green-400 hover:underline">
                      Schedule
                    </button>
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- Action Buttons -->
          <div class="mt-4 pt-3 border-t border-gray-200 dark:border-gray-700 flex gap-2">
            <button (click)="viewAllArrears()"
                    class="flex-1 px-3 py-1.5 text-xs font-medium rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition">
              View All Arrears
            </button>
            <button (click)="generateReport()"
                    class="flex-1 px-3 py-1.5 text-xs font-medium rounded bg-red-600 text-white hover:bg-red-700 transition">
              Export Report
            </button>
          </div>
        } @else if (loading()) {
          <!-- Loading State -->
          <div class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-6 w-6 border-2 border-gray-300 border-t-blue-600"></div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">Loading arrears data...</p>
          </div>
        } @else {
          <!-- Empty State -->
          <div class="text-center py-8">
            <svg class="w-12 h-12 mx-auto text-green-500 dark:text-green-400 mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            <p class="text-sm font-medium text-gray-900 dark:text-white">No arrears!</p>
            <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">All payments are current</p>
          </div>
        }
      </div>
    </div>
  `,
  styles: []
})
export class ArrearsAlertsWidgetComponent implements OnInit {
  private router: Router;

  arrearLoans = signal<ArrearLoan[]>([]);
  loading = signal(true);

  totalArrears = signal(0);
  totalOverdue = signal(0);
  lowRisk = signal(0);
  mediumRisk = signal(0);
  highRisk = signal(0);
  criticalRisk = signal(0);

  constructor(router: Router) {
    this.router = router;
  }

  ngOnInit() {
    this.loadArrearsData();
  }

  loadArrearsData() {
    // TODO: Replace with actual API call
    setTimeout(() => {
      const loans: ArrearLoan[] = [
        {
          id: 101,
          borrowerName: 'Maria Santos',
          loanReference: 'ML-2024-000101',
          loanAmount: 150000,
          outstandingBalance: 98000,
          amountOverdue: 8300,
          daysOverdue: 15,
          lastPaymentDate: '2024-01-10',
          riskLevel: 'medium',
          contactAttempts: 3
        },
        {
          id: 102,
          borrowerName: 'Carlos Lopez',
          loanReference: 'ML-2024-000102',
          loanAmount: 200000,
          outstandingBalance: 175000,
          amountOverdue: 24500,
          daysOverdue: 45,
          lastPaymentDate: '2023-12-15',
          riskLevel: 'critical',
          contactAttempts: 7
        },
        {
          id: 103,
          borrowerName: 'Ana Reyes',
          loanReference: 'ML-2024-000103',
          loanAmount: 75000,
          outstandingBalance: 52000,
          amountOverdue: 5200,
          daysOverdue: 8,
          lastPaymentDate: '2024-01-18',
          riskLevel: 'low',
          contactAttempts: 1
        },
        {
          id: 104,
          borrowerName: 'Pedro Garcia',
          loanReference: 'ML-2024-000104',
          loanAmount: 120000,
          outstandingBalance: 85000,
          amountOverdue: 15300,
          daysOverdue: 30,
          lastPaymentDate: '2023-12-28',
          riskLevel: 'high',
          contactAttempts: 5
        },
        {
          id: 105,
          borrowerName: 'Rosa Martinez',
          loanReference: 'ML-2024-000105',
          loanAmount: 90000,
          outstandingBalance: 68000,
          amountOverdue: 6800,
          daysOverdue: 12,
          lastPaymentDate: '2024-01-14',
          riskLevel: 'medium',
          contactAttempts: 2
        }
      ];

      this.arrearLoans.set(loans);
      this.totalArrears.set(loans.length);
      this.totalOverdue.set(loans.reduce((sum, loan) => sum + loan.amountOverdue, 0));
      this.lowRisk.set(loans.filter(l => l.riskLevel === 'low').length);
      this.mediumRisk.set(loans.filter(l => l.riskLevel === 'medium').length);
      this.highRisk.set(loans.filter(l => l.riskLevel === 'high').length);
      this.criticalRisk.set(loans.filter(l => l.riskLevel === 'critical').length);
      this.loading.set(false);
    }, 500);
  }

  viewLoan(id: number) {
    this.router.navigate(['/platforms/money-loan/loans', id]);
  }

  viewAllArrears() {
    this.router.navigate(['/platforms/money-loan/loans'], { queryParams: { filter: 'arrears' } });
  }

  contactBorrower(loan: ArrearLoan) {
    // TODO: Implement contact borrower functionality
    alert(`Contacting ${loan.borrowerName}...`);
  }

  schedulePayment(loan: ArrearLoan) {
    this.router.navigate(['/platforms/money-loan/payments/process', loan.id]);
  }

  generateReport() {
    // TODO: Implement export report functionality
    alert('Generating arrears report...');
  }

  getRiskBorderClass(risk: string): string {
    const classes = {
      'low': 'border-yellow-200 dark:border-yellow-800 bg-yellow-50/50 dark:bg-yellow-900/10',
      'medium': 'border-orange-200 dark:border-orange-800 bg-orange-50/50 dark:bg-orange-900/10',
      'high': 'border-red-200 dark:border-red-800 bg-red-50/50 dark:bg-red-900/10',
      'critical': 'border-purple-200 dark:border-purple-800 bg-purple-50/50 dark:bg-purple-900/10'
    };
    return classes[risk as keyof typeof classes] || 'border-gray-200 dark:border-gray-700';
  }

  getRiskBadgeClass(risk: string): string {
    const classes = {
      'low': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-300',
      'medium': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-300',
      'high': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300',
      'critical': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300'
    };
    return classes[risk as keyof typeof classes] || 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
  }

  getRiskLabel(risk: string): string {
    return risk.charAt(0).toUpperCase() + risk.slice(1);
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  formatNumber(value: number): string {
    return value.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }
}
