import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../../../core/services/toast.service';

interface PeriodicReport {
  period: string;
  totalLoans: number;
  totalDisbursed: number;
  totalCollected: number;
  totalOutstanding: number;
  portfolioAtRisk: number;
  activeCustomers: number;
  newCustomers: number;
  averageTicketSize: number;
  collectionRate: number;
}

interface ArrearsData {
  customerName: string;
  loanNumber: string;
  principalDue: number;
  daysOverdue: number;
  totalArrears: number;
  lastPaymentDate: string;
}

@Component({
  selector: 'app-reports-periodic',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 md:p-6">
      <!-- Compact Header -->
      <div class="mb-4">
        <div class="flex items-center justify-between mb-1">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span class="text-lg">📊</span>
            </div>
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">Periodic Reports</h1>
          </div>
          <button
            (click)="generateReport()"
            [disabled]="loading()"
            class="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50">
            {{ loading() ? '⏳ Generating...' : '📥 Generate Report' }}
          </button>
        </div>
        <p class="text-xs text-gray-600 dark:text-gray-400 ml-11">Performance, collections, and arrears analytics</p>
      </div>

      <!-- Period Selector -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 mb-4">
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <select
            [(ngModel)]="reportType"
            (ngModelChange)="onFilterChange()"
            class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option value="performance">Performance Report</option>
            <option value="collections">Collections Report</option>
            <option value="arrears">Arrears Report</option>
            <option value="portfolio">Portfolio Analysis</option>
          </select>
          
          <select
            [(ngModel)]="periodType"
            (ngModelChange)="onFilterChange()"
            class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
            <option value="quarterly">Quarterly</option>
            <option value="yearly">Yearly</option>
          </select>

          <input
            type="date"
            [(ngModel)]="startDate"
            (ngModelChange)="onFilterChange()"
            class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
          
          <input
            type="date"
            [(ngModel)]="endDate"
            (ngModelChange)="onFilterChange()"
            class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
        </div>
      </div>

      <!-- Performance Overview Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-4">
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
          <p class="text-xs text-blue-600 dark:text-blue-400 mb-0.5">Total Disbursed</p>
          <p class="text-xl font-bold text-blue-700 dark:text-blue-300">₱{{ formatCurrency(summary().totalDisbursed) }}</p>
        </div>
        <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
          <p class="text-xs text-green-600 dark:text-green-400 mb-0.5">Total Collected</p>
          <p class="text-xl font-bold text-green-700 dark:text-green-300">₱{{ formatCurrency(summary().totalCollected) }}</p>
        </div>
        <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
          <p class="text-xs text-orange-600 dark:text-orange-400 mb-0.5">Outstanding</p>
          <p class="text-xl font-bold text-orange-700 dark:text-orange-300">₱{{ formatCurrency(summary().totalOutstanding) }}</p>
        </div>
        <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
          <p class="text-xs text-purple-600 dark:text-purple-400 mb-0.5">Collection Rate</p>
          <p class="text-xl font-bold text-purple-700 dark:text-purple-300">{{ summary().collectionRate }}%</p>
        </div>
        <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
          <p class="text-xs text-red-600 dark:text-red-400 mb-0.5">Portfolio @ Risk</p>
          <p class="text-xl font-bold text-red-700 dark:text-red-300">{{ summary().portfolioAtRisk }}%</p>
        </div>
      </div>

      <!-- Report Content Based on Type -->
      @if (reportType === 'performance') {
        <!-- Performance Report Table -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-4">
          <div class="p-3 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">📈 Performance Metrics</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Period</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Loans</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Disbursed</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Collected</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase hidden lg:table-cell">Customers</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase hidden xl:table-cell">Avg Ticket</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Rate</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                @for (report of periodicData(); track report.period) {
                  <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td class="px-3 py-2 text-gray-900 dark:text-white font-medium">{{ report.period }}</td>
                    <td class="px-3 py-2 text-gray-700 dark:text-gray-300">{{ report.totalLoans }}</td>
                    <td class="px-3 py-2 text-gray-700 dark:text-gray-300">₱{{ formatCurrency(report.totalDisbursed) }}</td>
                    <td class="px-3 py-2 text-green-600 dark:text-green-400 font-semibold">₱{{ formatCurrency(report.totalCollected) }}</td>
                    <td class="px-3 py-2 text-gray-700 dark:text-gray-300 hidden lg:table-cell">
                      {{ report.activeCustomers }} <span class="text-xs text-green-600">(+{{ report.newCustomers }})</span>
                    </td>
                    <td class="px-3 py-2 text-gray-700 dark:text-gray-300 hidden xl:table-cell">₱{{ formatCurrency(report.averageTicketSize) }}</td>
                    <td class="px-3 py-2">
                      <span [class]="getCollectionRateClass(report.collectionRate)" class="px-2 py-0.5 text-xs font-semibold rounded">
                        {{ report.collectionRate }}%
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      @if (reportType === 'collections') {
        <!-- Collections Report -->
        <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">💰 Collection Breakdown</h3>
            <div class="space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-600 dark:text-gray-400">Principal Collected</span>
                <span class="text-sm font-semibold text-gray-900 dark:text-white">₱{{ formatCurrency(summary().totalCollected * 0.7) }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-600 dark:text-gray-400">Interest Collected</span>
                <span class="text-sm font-semibold text-gray-900 dark:text-white">₱{{ formatCurrency(summary().totalCollected * 0.25) }}</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-600 dark:text-gray-400">Fees Collected</span>
                <span class="text-sm font-semibold text-gray-900 dark:text-white">₱{{ formatCurrency(summary().totalCollected * 0.05) }}</span>
              </div>
              <div class="pt-2 border-t border-gray-200 dark:border-gray-700"></div>
              <div class="flex justify-between items-center">
                <span class="text-xs font-semibold text-gray-900 dark:text-white">Total Collections</span>
                <span class="text-base font-bold text-green-600 dark:text-green-400">₱{{ formatCurrency(summary().totalCollected) }}</span>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">📅 Collection Methods</h3>
            <div class="space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-600 dark:text-gray-400">Cash Payments</span>
                <span class="text-sm font-semibold text-gray-900 dark:text-white">45%</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-600 dark:text-gray-400">Bank Transfer</span>
                <span class="text-sm font-semibold text-gray-900 dark:text-white">30%</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-600 dark:text-gray-400">Online Payment</span>
                <span class="text-sm font-semibold text-gray-900 dark:text-white">20%</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-600 dark:text-gray-400">Others</span>
                <span class="text-sm font-semibold text-gray-900 dark:text-white">5%</span>
              </div>
            </div>
          </div>
        </div>
      }

      @if (reportType === 'arrears') {
        <!-- Arrears Report Table -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="p-3 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">⚠️ Arrears Analysis</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Customer</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Loan #</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Principal Due</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Days Overdue</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Total Arrears</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase hidden md:table-cell">Last Payment</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                @for (arrear of arrearsData(); track arrear.loanNumber) {
                  <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td class="px-3 py-2 text-gray-900 dark:text-white font-medium">{{ arrear.customerName }}</td>
                    <td class="px-3 py-2 text-gray-700 dark:text-gray-300 font-mono text-xs">{{ arrear.loanNumber }}</td>
                    <td class="px-3 py-2 text-gray-700 dark:text-gray-300">₱{{ formatCurrency(arrear.principalDue) }}</td>
                    <td class="px-3 py-2">
                      <span [class]="getDaysOverdueClass(arrear.daysOverdue)" class="px-2 py-0.5 text-xs font-semibold rounded">
                        {{ arrear.daysOverdue }}d
                      </span>
                    </td>
                    <td class="px-3 py-2 text-red-600 dark:text-red-400 font-semibold">₱{{ formatCurrency(arrear.totalArrears) }}</td>
                    <td class="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 hidden md:table-cell">{{ arrear.lastPaymentDate }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      @if (reportType === 'portfolio') {
        <!-- Portfolio Analysis -->
        <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">📊 Loan Status Distribution</h3>
            <div class="space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-600 dark:text-gray-400">Active Loans</span>
                <span class="text-sm font-semibold text-green-600 dark:text-green-400">65%</span>
              </div>
              <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div class="bg-green-500 h-1.5 rounded-full" style="width: 65%"></div>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-600 dark:text-gray-400">Pending Approval</span>
                <span class="text-sm font-semibold text-orange-600 dark:text-orange-400">20%</span>
              </div>
              <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div class="bg-orange-500 h-1.5 rounded-full" style="width: 20%"></div>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-600 dark:text-gray-400">Overdue</span>
                <span class="text-sm font-semibold text-red-600 dark:text-red-400">10%</span>
              </div>
              <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div class="bg-red-500 h-1.5 rounded-full" style="width: 10%"></div>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-600 dark:text-gray-400">Closed/Paid</span>
                <span class="text-sm font-semibold text-gray-600 dark:text-gray-400">5%</span>
              </div>
              <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
                <div class="bg-gray-500 h-1.5 rounded-full" style="width: 5%"></div>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">💼 Product Mix</h3>
            <div class="space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-600 dark:text-gray-400">Personal Loans</span>
                <span class="text-sm font-semibold text-gray-900 dark:text-white">50%</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-600 dark:text-gray-400">Business Loans</span>
                <span class="text-sm font-semibold text-gray-900 dark:text-white">30%</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-600 dark:text-gray-400">Emergency Loans</span>
                <span class="text-sm font-semibold text-gray-900 dark:text-white">15%</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-600 dark:text-gray-400">Education Loans</span>
                <span class="text-sm font-semibold text-gray-900 dark:text-white">5%</span>
              </div>
            </div>
          </div>

          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">⏱️ Aging Analysis</h3>
            <div class="space-y-2">
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-600 dark:text-gray-400">Current (0-30 days)</span>
                <span class="text-sm font-semibold text-green-600 dark:text-green-400">85%</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-600 dark:text-gray-400">31-60 days</span>
                <span class="text-sm font-semibold text-yellow-600 dark:text-yellow-400">8%</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-600 dark:text-gray-400">61-90 days</span>
                <span class="text-sm font-semibold text-orange-600 dark:text-orange-400">4%</span>
              </div>
              <div class="flex justify-between items-center">
                <span class="text-xs text-gray-600 dark:text-gray-400">90+ days</span>
                <span class="text-sm font-semibold text-red-600 dark:text-red-400">3%</span>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class ReportsPeriodicComponent {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);

  loading = signal(false);
  reportType = 'performance';
  periodType = 'monthly';
  startDate = this.getDefaultStartDate();
  endDate = this.getDefaultEndDate();

  periodicData = signal<PeriodicReport[]>([]);
  arrearsData = signal<ArrearsData[]>([]);

  summary = computed(() => {
    const data = this.periodicData();
    if (data.length === 0) {
      return {
        totalDisbursed: 0,
        totalCollected: 0,
        totalOutstanding: 0,
        collectionRate: 0,
        portfolioAtRisk: 0
      };
    }
    
    const totals = data.reduce((acc, curr) => ({
      totalDisbursed: acc.totalDisbursed + curr.totalDisbursed,
      totalCollected: acc.totalCollected + curr.totalCollected,
      totalOutstanding: acc.totalOutstanding + curr.totalOutstanding,
      portfolioAtRisk: acc.portfolioAtRisk + curr.portfolioAtRisk
    }), { totalDisbursed: 0, totalCollected: 0, totalOutstanding: 0, portfolioAtRisk: 0 });

    return {
      ...totals,
      collectionRate: totals.totalDisbursed > 0 
        ? Math.round((totals.totalCollected / totals.totalDisbursed) * 100) 
        : 0,
      portfolioAtRisk: data.length > 0 
        ? Math.round(totals.portfolioAtRisk / data.length) 
        : 0
    };
  });

  ngOnInit() {
    this.loadReportData();
  }

  getDefaultStartDate(): string {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  }

  getDefaultEndDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  onFilterChange() {
    this.loadReportData();
  }

  loadReportData() {
    this.loading.set(true);
    
    // Mock data - Replace with actual API call
    setTimeout(() => {
      const mockPeriodicData: PeriodicReport[] = [
        {
          period: 'Oct 2025',
          totalLoans: 145,
          totalDisbursed: 5750000,
          totalCollected: 4890000,
          totalOutstanding: 860000,
          portfolioAtRisk: 8.5,
          activeCustomers: 128,
          newCustomers: 15,
          averageTicketSize: 39655,
          collectionRate: 85
        },
        {
          period: 'Sep 2025',
          totalLoans: 132,
          totalDisbursed: 5280000,
          totalCollected: 4752000,
          totalOutstanding: 528000,
          portfolioAtRisk: 6.2,
          activeCustomers: 120,
          newCustomers: 12,
          averageTicketSize: 40000,
          collectionRate: 90
        },
        {
          period: 'Aug 2025',
          totalLoans: 128,
          totalDisbursed: 5120000,
          totalCollected: 4608000,
          totalOutstanding: 512000,
          portfolioAtRisk: 5.8,
          activeCustomers: 115,
          newCustomers: 10,
          averageTicketSize: 40000,
          collectionRate: 90
        }
      ];

      const mockArrearsData: ArrearsData[] = [
        {
          customerName: 'John Doe',
          loanNumber: 'LN-2024-001',
          principalDue: 50000,
          daysOverdue: 45,
          totalArrears: 52500,
          lastPaymentDate: '2025-09-15'
        },
        {
          customerName: 'Jane Smith',
          loanNumber: 'LN-2024-015',
          principalDue: 35000,
          daysOverdue: 62,
          totalArrears: 38150,
          lastPaymentDate: '2025-08-28'
        },
        {
          customerName: 'Bob Johnson',
          loanNumber: 'LN-2024-023',
          principalDue: 75000,
          daysOverdue: 15,
          totalArrears: 76125,
          lastPaymentDate: '2025-10-15'
        }
      ];

      this.periodicData.set(mockPeriodicData);
      this.arrearsData.set(mockArrearsData);
      this.loading.set(false);
    }, 500);
  }

  generateReport() {
    this.toastService.info('Generating report... Please wait');
    this.loadReportData();
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  getCollectionRateClass(rate: number): string {
    if (rate >= 90) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    if (rate >= 75) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
  }

  getDaysOverdueClass(days: number): string {
    if (days <= 30) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    if (days <= 60) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
  }
}
