import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../../../core/services/toast.service';

interface TaxSummary {
  period: string;
  grossIncome: number;
  taxableIncome: number;
  withholdingTax: number;
  interestIncome: number;
  feeIncome: number;
  deductions: number;
  netTaxableIncome: number;
}

interface QuarterlyTax {
  quarter: string;
  year: number;
  totalIncome: number;
  totalDeductions: number;
  taxPayable: number;
  taxPaid: number;
  balance: number;
}

@Component({
  selector: 'app-reports-tax-summary',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 md:p-6">
      <!-- Compact Header -->
      <div class="mb-4">
        <div class="flex items-center justify-between mb-1">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
              <span class="text-lg">💰</span>
            </div>
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">Tax Summary Reports</h1>
          </div>
          <button
            (click)="exportTaxReport()"
            [disabled]="loading()"
            class="px-3 py-1.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors disabled:opacity-50">
            {{ loading() ? '⏳ Exporting...' : '📥 Export PDF' }}
          </button>
        </div>
        <p class="text-xs text-gray-600 dark:text-gray-400 ml-11">Tax calculations, withholding, and compliance reports</p>
      </div>

      <!-- Period Selector -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 mb-4">
        <div class="grid grid-cols-1 sm:grid-cols-3 gap-2">
          <select
            [(ngModel)]="reportPeriod"
            (ngModelChange)="onPeriodChange()"
            class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option value="monthly">Monthly Summary</option>
            <option value="quarterly">Quarterly Summary</option>
            <option value="annual">Annual Summary</option>
            <option value="ytd">Year to Date</option>
          </select>
          
          <select
            [(ngModel)]="selectedYear"
            (ngModelChange)="onPeriodChange()"
            class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option value="2025">2025</option>
            <option value="2024">2024</option>
            <option value="2023">2023</option>
          </select>

          @if (reportPeriod === 'quarterly') {
            <select
              [(ngModel)]="selectedQuarter"
              (ngModelChange)="onPeriodChange()"
              class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="Q1">Q1 (Jan-Mar)</option>
              <option value="Q2">Q2 (Apr-Jun)</option>
              <option value="Q3">Q3 (Jul-Sep)</option>
              <option value="Q4">Q4 (Oct-Dec)</option>
            </select>
          }
          @if (reportPeriod === 'monthly') {
            <select
              [(ngModel)]="selectedMonth"
              (ngModelChange)="onPeriodChange()"
              class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="1">January</option>
              <option value="2">February</option>
              <option value="3">March</option>
              <option value="4">April</option>
              <option value="5">May</option>
              <option value="6">June</option>
              <option value="7">July</option>
              <option value="8">August</option>
              <option value="9">September</option>
              <option value="10">October</option>
              <option value="11">November</option>
              <option value="12">December</option>
            </select>
          }
        </div>
      </div>

      <!-- Tax Summary Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-3 mb-4">
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
          <p class="text-xs text-blue-600 dark:text-blue-400 mb-0.5">Gross Income</p>
          <p class="text-xl font-bold text-blue-700 dark:text-blue-300">₱{{ formatCurrency(taxStats().grossIncome) }}</p>
        </div>
        <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
          <p class="text-xs text-green-600 dark:text-green-400 mb-0.5">Taxable Income</p>
          <p class="text-xl font-bold text-green-700 dark:text-green-300">₱{{ formatCurrency(taxStats().taxableIncome) }}</p>
        </div>
        <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
          <p class="text-xs text-purple-600 dark:text-purple-400 mb-0.5">Withholding Tax</p>
          <p class="text-xl font-bold text-purple-700 dark:text-purple-300">₱{{ formatCurrency(taxStats().withholdingTax) }}</p>
        </div>
        <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
          <p class="text-xs text-orange-600 dark:text-orange-400 mb-0.5">Total Deductions</p>
          <p class="text-xl font-bold text-orange-700 dark:text-orange-300">₱{{ formatCurrency(taxStats().deductions) }}</p>
        </div>
        <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
          <p class="text-xs text-red-600 dark:text-red-400 mb-0.5">Net Taxable</p>
          <p class="text-xl font-bold text-red-700 dark:text-red-300">₱{{ formatCurrency(taxStats().netTaxableIncome) }}</p>
        </div>
      </div>

      <!-- Tax Breakdown Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
        <!-- Income Breakdown -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">💵 Income Breakdown</h3>
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-xs text-gray-600 dark:text-gray-400">Interest Income</span>
              <span class="text-sm font-semibold text-gray-900 dark:text-white">₱{{ formatCurrency(taxStats().grossIncome * 0.65) }}</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div class="bg-blue-500 h-1.5 rounded-full" style="width: 65%"></div>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs text-gray-600 dark:text-gray-400">Processing Fees</span>
              <span class="text-sm font-semibold text-gray-900 dark:text-white">₱{{ formatCurrency(taxStats().grossIncome * 0.20) }}</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div class="bg-green-500 h-1.5 rounded-full" style="width: 20%"></div>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs text-gray-600 dark:text-gray-400">Late Payment Fees</span>
              <span class="text-sm font-semibold text-gray-900 dark:text-white">₱{{ formatCurrency(taxStats().grossIncome * 0.10) }}</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div class="bg-orange-500 h-1.5 rounded-full" style="width: 10%"></div>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs text-gray-600 dark:text-gray-400">Other Income</span>
              <span class="text-sm font-semibold text-gray-900 dark:text-white">₱{{ formatCurrency(taxStats().grossIncome * 0.05) }}</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div class="bg-purple-500 h-1.5 rounded-full" style="width: 5%"></div>
            </div>
            <div class="pt-2 border-t border-gray-200 dark:border-gray-700"></div>
            <div class="flex justify-between items-center">
              <span class="text-xs font-semibold text-gray-900 dark:text-white">Total Gross Income</span>
              <span class="text-base font-bold text-blue-600 dark:text-blue-400">₱{{ formatCurrency(taxStats().grossIncome) }}</span>
            </div>
          </div>
        </div>

        <!-- Deductions Breakdown -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">📉 Tax Deductions</h3>
          <div class="space-y-2">
            <div class="flex justify-between items-center">
              <span class="text-xs text-gray-600 dark:text-gray-400">Operating Expenses</span>
              <span class="text-sm font-semibold text-gray-900 dark:text-white">₱{{ formatCurrency(taxStats().deductions * 0.45) }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs text-gray-600 dark:text-gray-400">Staff Salaries</span>
              <span class="text-sm font-semibold text-gray-900 dark:text-white">₱{{ formatCurrency(taxStats().deductions * 0.30) }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs text-gray-600 dark:text-gray-400">Loan Loss Provision</span>
              <span class="text-sm font-semibold text-gray-900 dark:text-white">₱{{ formatCurrency(taxStats().deductions * 0.15) }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs text-gray-600 dark:text-gray-400">Technology & Systems</span>
              <span class="text-sm font-semibold text-gray-900 dark:text-white">₱{{ formatCurrency(taxStats().deductions * 0.07) }}</span>
            </div>
            <div class="flex justify-between items-center">
              <span class="text-xs text-gray-600 dark:text-gray-400">Other Deductions</span>
              <span class="text-sm font-semibold text-gray-900 dark:text-white">₱{{ formatCurrency(taxStats().deductions * 0.03) }}</span>
            </div>
            <div class="pt-2 border-t border-gray-200 dark:border-gray-700"></div>
            <div class="flex justify-between items-center">
              <span class="text-xs font-semibold text-gray-900 dark:text-white">Total Deductions</span>
              <span class="text-base font-bold text-orange-600 dark:text-orange-400">₱{{ formatCurrency(taxStats().deductions) }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Monthly Tax Summary Table -->
      @if (reportPeriod === 'monthly' || reportPeriod === 'ytd') {
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-4">
          <div class="p-3 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">📅 Monthly Tax Summary</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Month</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Gross Income</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Deductions</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase hidden lg:table-cell">Interest Income</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase hidden xl:table-cell">Fee Income</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Withholding Tax</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Net Taxable</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                @for (summary of taxSummaryData(); track summary.period) {
                  <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td class="px-3 py-2 text-gray-900 dark:text-white font-medium">{{ summary.period }}</td>
                    <td class="px-3 py-2 text-gray-700 dark:text-gray-300">₱{{ formatCurrency(summary.grossIncome) }}</td>
                    <td class="px-3 py-2 text-orange-600 dark:text-orange-400">₱{{ formatCurrency(summary.deductions) }}</td>
                    <td class="px-3 py-2 text-gray-700 dark:text-gray-300 hidden lg:table-cell">₱{{ formatCurrency(summary.interestIncome) }}</td>
                    <td class="px-3 py-2 text-gray-700 dark:text-gray-300 hidden xl:table-cell">₱{{ formatCurrency(summary.feeIncome) }}</td>
                    <td class="px-3 py-2 text-purple-600 dark:text-purple-400 font-semibold">₱{{ formatCurrency(summary.withholdingTax) }}</td>
                    <td class="px-3 py-2 text-green-600 dark:text-green-400 font-bold">₱{{ formatCurrency(summary.netTaxableIncome) }}</td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Quarterly Tax Summary -->
      @if (reportPeriod === 'quarterly' || reportPeriod === 'annual') {
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="p-3 border-b border-gray-200 dark:border-gray-700">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">📊 Quarterly Tax Payments</h3>
          </div>
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Quarter</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Year</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Total Income</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Deductions</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Tax Payable</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase hidden md:table-cell">Tax Paid</th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Balance</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                @for (quarter of quarterlyData(); track quarter.quarter + quarter.year) {
                  <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                    <td class="px-3 py-2 text-gray-900 dark:text-white font-medium">{{ quarter.quarter }}</td>
                    <td class="px-3 py-2 text-gray-700 dark:text-gray-300">{{ quarter.year }}</td>
                    <td class="px-3 py-2 text-gray-700 dark:text-gray-300">₱{{ formatCurrency(quarter.totalIncome) }}</td>
                    <td class="px-3 py-2 text-orange-600 dark:text-orange-400">₱{{ formatCurrency(quarter.totalDeductions) }}</td>
                    <td class="px-3 py-2 text-purple-600 dark:text-purple-400 font-semibold">₱{{ formatCurrency(quarter.taxPayable) }}</td>
                    <td class="px-3 py-2 text-green-600 dark:text-green-400 hidden md:table-cell">₱{{ formatCurrency(quarter.taxPaid) }}</td>
                    <td class="px-3 py-2">
                      <span [class]="getBalanceClass(quarter.balance)" class="px-2 py-0.5 text-xs font-semibold rounded">
                        ₱{{ formatCurrency(quarter.balance) }}
                      </span>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- BIR Forms & Compliance -->
      <div class="mt-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">📋 BIR Forms & Compliance</h3>
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-3">
          <button class="flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
            <span>📄</span>
            <span class="text-gray-900 dark:text-white">BIR Form 1701Q</span>
          </button>
          <button class="flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
            <span>📄</span>
            <span class="text-gray-900 dark:text-white">BIR Form 1701A</span>
          </button>
          <button class="flex items-center gap-2 px-3 py-2 text-sm bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-colors">
            <span>📄</span>
            <span class="text-gray-900 dark:text-white">BIR Form 2307</span>
          </button>
          <button class="flex items-center gap-2 px-3 py-2 text-sm bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg hover:bg-green-100 dark:hover:bg-green-900/30 transition-colors">
            <span>📊</span>
            <span class="text-gray-900 dark:text-white">Alphalist Export</span>
          </button>
          <button class="flex items-center gap-2 px-3 py-2 text-sm bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-colors">
            <span>🧾</span>
            <span class="text-gray-900 dark:text-white">Summary List</span>
          </button>
          <button class="flex items-center gap-2 px-3 py-2 text-sm bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800 rounded-lg hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-colors">
            <span>💾</span>
            <span class="text-gray-900 dark:text-white">DAT File Generator</span>
          </button>
        </div>
      </div>
    </div>
  `
})
export class ReportsTaxSummaryComponent {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);

  loading = signal(false);
  reportPeriod = 'monthly';
  selectedYear = '2025';
  selectedMonth = '10';
  selectedQuarter = 'Q4';

  taxSummaryData = signal<TaxSummary[]>([]);
  quarterlyData = signal<QuarterlyTax[]>([]);

  taxStats = computed(() => {
    const data = this.taxSummaryData();
    if (data.length === 0) {
      return {
        grossIncome: 0,
        taxableIncome: 0,
        withholdingTax: 0,
        deductions: 0,
        netTaxableIncome: 0
      };
    }
    
    return data.reduce((acc, curr) => ({
      grossIncome: acc.grossIncome + curr.grossIncome,
      taxableIncome: acc.taxableIncome + curr.taxableIncome,
      withholdingTax: acc.withholdingTax + curr.withholdingTax,
      deductions: acc.deductions + curr.deductions,
      netTaxableIncome: acc.netTaxableIncome + curr.netTaxableIncome
    }), { grossIncome: 0, taxableIncome: 0, withholdingTax: 0, deductions: 0, netTaxableIncome: 0 });
  });

  ngOnInit() {
    this.loadTaxData();
  }

  onPeriodChange() {
    this.loadTaxData();
  }

  loadTaxData() {
    this.loading.set(true);
    
    // Mock data - Replace with actual API call
    setTimeout(() => {
      const mockTaxSummary: TaxSummary[] = [
        {
          period: 'Oct 2025',
          grossIncome: 1890000,
          taxableIncome: 1512000,
          withholdingTax: 453600,
          interestIncome: 1228500,
          feeIncome: 378000,
          deductions: 378000,
          netTaxableIncome: 1058400
        },
        {
          period: 'Sep 2025',
          grossIncome: 1752000,
          taxableIncome: 1401600,
          withholdingTax: 420480,
          interestIncome: 1138800,
          feeIncome: 350400,
          deductions: 350400,
          netTaxableIncome: 981120
        },
        {
          period: 'Aug 2025',
          grossIncome: 1608000,
          taxableIncome: 1286400,
          withholdingTax: 385920,
          interestIncome: 1045200,
          feeIncome: 321600,
          deductions: 321600,
          netTaxableIncome: 900480
        }
      ];

      const mockQuarterly: QuarterlyTax[] = [
        {
          quarter: 'Q4',
          year: 2025,
          totalIncome: 5250000,
          totalDeductions: 1050000,
          taxPayable: 1260000,
          taxPaid: 1260000,
          balance: 0
        },
        {
          quarter: 'Q3',
          year: 2025,
          totalIncome: 4980000,
          totalDeductions: 996000,
          taxPayable: 1195200,
          taxPaid: 1195200,
          balance: 0
        },
        {
          quarter: 'Q2',
          year: 2025,
          totalIncome: 4720000,
          totalDeductions: 944000,
          taxPayable: 1132800,
          taxPaid: 1100000,
          balance: 32800
        }
      ];

      this.taxSummaryData.set(mockTaxSummary);
      this.quarterlyData.set(mockQuarterly);
      this.loading.set(false);
    }, 500);
  }

  exportTaxReport() {
    this.toastService.info('Generating PDF tax report... Please wait');
    // Implement PDF export logic
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  getBalanceClass(balance: number): string {
    if (balance === 0) return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
    if (balance > 0) return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
    return 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400';
  }
}
