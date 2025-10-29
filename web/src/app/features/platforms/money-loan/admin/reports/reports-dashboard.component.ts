import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MoneyloanReportService } from '../../shared/services/moneyloan-report.service';
import { AuthService } from '../../../../../core/services/auth.service';

@Component({
  selector: 'app-reports-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>📊</span>
            Reports & Analytics
          </h1>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            Comprehensive reporting for portfolio, performance, and collections
          </p>
        </div>
        <button
          (click)="exportReport()"
          class="px-3 py-1.5 text-xs font-medium rounded shadow-sm bg-green-600 text-white hover:bg-green-700 transition flex items-center gap-1.5"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          Export CSV
        </button>
      </div>

      <!-- Date Range Filter -->
      <div class="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
        <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
            <input
              type="date"
              [(ngModel)]="dateRange.start_date"
              (change)="loadAllReports()"
              class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
            <input
              type="date"
              [(ngModel)]="dateRange.end_date"
              (change)="loadAllReports()"
              class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
            />
          </div>
          <div class="flex items-end gap-2">
            <button
              (click)="setQuickDate('today')"
              class="px-3 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              Today
            </button>
            <button
              (click)="setQuickDate('week')"
              class="px-3 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              This Week
            </button>
            <button
              (click)="setQuickDate('month')"
              class="px-3 py-1.5 text-xs rounded border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700"
            >
              This Month
            </button>
          </div>
        </div>
      </div>

      <!-- Loading -->
      @if (loading()) {
        <div class="text-center py-12">
          <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-3">Loading reports...</p>
        </div>
      }

      <!-- Portfolio Summary -->
      @if (!loading() && portfolioReport()) {
        <div class="space-y-3">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Portfolio Summary</h2>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div class="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <p class="text-xs text-gray-500 dark:text-gray-400">Total Loans</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {{ portfolioReport().total_loans || 0 }}
              </p>
              <p class="text-xs text-green-600 dark:text-green-400 mt-1">
                +{{ portfolioReport().new_loans || 0 }} new
              </p>
            </div>
            <div class="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <p class="text-xs text-gray-500 dark:text-gray-400">Total Disbursed</p>
              <p class="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                ₱{{ (portfolioReport().total_disbursed || 0) | number:'1.2-2' }}
              </p>
            </div>
            <div class="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <p class="text-xs text-gray-500 dark:text-gray-400">Total Outstanding</p>
              <p class="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">
                ₱{{ (portfolioReport().total_outstanding || 0) | number:'1.2-2' }}
              </p>
            </div>
            <div class="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <p class="text-xs text-gray-500 dark:text-gray-400">Collection Rate</p>
              <p class="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {{ (portfolioReport().collection_rate || 0) | number:'1.1-1' }}%
              </p>
            </div>
          </div>
        </div>
      }

      <!-- Performance Report -->
      @if (!loading() && performanceReport()) {
        <div class="space-y-3">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Performance Metrics</h2>
          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            <div class="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <p class="text-xs text-gray-500 dark:text-gray-400">Approval Rate</p>
              <p class="text-xl font-bold text-green-600 dark:text-green-400 mt-1">
                {{ (performanceReport().approval_rate || 0) | number:'1.1-1' }}%
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {{ performanceReport().approved_count || 0 }} / {{ performanceReport().total_applications || 0 }} applications
              </p>
            </div>
            <div class="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <p class="text-xs text-gray-500 dark:text-gray-400">Avg Disbursement Time</p>
              <p class="text-xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {{ (performanceReport().avg_disbursement_days || 0) | number:'1.0-0' }} days
              </p>
            </div>
            <div class="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <p class="text-xs text-gray-500 dark:text-gray-400">Default Rate</p>
              <p class="text-xl font-bold text-red-600 dark:text-red-400 mt-1">
                {{ (performanceReport().default_rate || 0) | number:'1.1-1' }}%
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                {{ performanceReport().defaulted_count || 0 }} loans
              </p>
            </div>
          </div>
        </div>
      }

      <!-- Collections Report -->
      @if (!loading() && collectionsReport()) {
        <div class="space-y-3">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Collections</h2>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div class="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <p class="text-xs text-gray-500 dark:text-gray-400">Expected</p>
              <p class="text-lg font-bold text-gray-900 dark:text-white mt-1">
                ₱{{ (collectionsReport().expected_collections || 0) | number:'1.2-2' }}
              </p>
            </div>
            <div class="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <p class="text-xs text-gray-500 dark:text-gray-400">Collected</p>
              <p class="text-lg font-bold text-green-600 dark:text-green-400 mt-1">
                ₱{{ (collectionsReport().actual_collections || 0) | number:'1.2-2' }}
              </p>
            </div>
            <div class="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <p class="text-xs text-gray-500 dark:text-gray-400">Overdue</p>
              <p class="text-lg font-bold text-red-600 dark:text-red-400 mt-1">
                ₱{{ (collectionsReport().overdue_amount || 0) | number:'1.2-2' }}
              </p>
            </div>
            <div class="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <p class="text-xs text-gray-500 dark:text-gray-400">Efficiency</p>
              <p class="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">
                {{ (collectionsReport().collection_efficiency || 0) | number:'1.1-1' }}%
              </p>
            </div>
          </div>
        </div>
      }

      <!-- Arrears Report -->
      @if (!loading() && arrearsReport()) {
        <div class="space-y-3">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Arrears Aging</h2>
          <div class="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
            <table class="w-full">
              <thead class="bg-gray-50 dark:bg-gray-900">
                <tr>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400">Aging Bucket</th>
                  <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Count</th>
                  <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">Amount</th>
                  <th class="px-4 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400">% of Portfolio</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr>
                  <td class="px-4 py-2 text-xs text-gray-900 dark:text-white">0-30 days</td>
                  <td class="px-4 py-2 text-xs text-right">{{ arrearsReport().bucket_0_30_count || 0 }}</td>
                  <td class="px-4 py-2 text-xs text-right">₱{{ (arrearsReport().bucket_0_30_amount || 0) | number:'1.2-2' }}</td>
                  <td class="px-4 py-2 text-xs text-right">{{ (arrearsReport().bucket_0_30_percent || 0) | number:'1.1-1' }}%</td>
                </tr>
                <tr>
                  <td class="px-4 py-2 text-xs text-gray-900 dark:text-white">31-60 days</td>
                  <td class="px-4 py-2 text-xs text-right">{{ arrearsReport().bucket_31_60_count || 0 }}</td>
                  <td class="px-4 py-2 text-xs text-right">₱{{ (arrearsReport().bucket_31_60_amount || 0) | number:'1.2-2' }}</td>
                  <td class="px-4 py-2 text-xs text-right">{{ (arrearsReport().bucket_31_60_percent || 0) | number:'1.1-1' }}%</td>
                </tr>
                <tr>
                  <td class="px-4 py-2 text-xs text-gray-900 dark:text-white">61-90 days</td>
                  <td class="px-4 py-2 text-xs text-right">{{ arrearsReport().bucket_61_90_count || 0 }}</td>
                  <td class="px-4 py-2 text-xs text-right">₱{{ (arrearsReport().bucket_61_90_amount || 0) | number:'1.2-2' }}</td>
                  <td class="px-4 py-2 text-xs text-right">{{ (arrearsReport().bucket_61_90_percent || 0) | number:'1.1-1' }}%</td>
                </tr>
                <tr class="bg-red-50 dark:bg-red-900/10">
                  <td class="px-4 py-2 text-xs font-semibold text-red-900 dark:text-red-300">90+ days</td>
                  <td class="px-4 py-2 text-xs text-right font-semibold text-red-900 dark:text-red-300">{{ arrearsReport().bucket_90_plus_count || 0 }}</td>
                  <td class="px-4 py-2 text-xs text-right font-semibold text-red-900 dark:text-red-300">₱{{ (arrearsReport().bucket_90_plus_amount || 0) | number:'1.2-2' }}</td>
                  <td class="px-4 py-2 text-xs text-right font-semibold text-red-900 dark:text-red-300">{{ (arrearsReport().bucket_90_plus_percent || 0) | number:'1.1-1' }}%</td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      }

      <!-- Revenue Report -->
      @if (!loading() && revenueReport()) {
        <div class="space-y-3">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Revenue Breakdown</h2>
          <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div class="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <p class="text-xs text-gray-500 dark:text-gray-400">Interest Income</p>
              <p class="text-lg font-bold text-green-600 dark:text-green-400 mt-1">
                ₱{{ (revenueReport().interest_income || 0) | number:'1.2-2' }}
              </p>
            </div>
            <div class="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <p class="text-xs text-gray-500 dark:text-gray-400">Fee Income</p>
              <p class="text-lg font-bold text-blue-600 dark:text-blue-400 mt-1">
                ₱{{ (revenueReport().fee_income || 0) | number:'1.2-2' }}
              </p>
            </div>
            <div class="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <p class="text-xs text-gray-500 dark:text-gray-400">Penalty Income</p>
              <p class="text-lg font-bold text-orange-600 dark:text-orange-400 mt-1">
                ₱{{ (revenueReport().penalty_income || 0) | number:'1.2-2' }}
              </p>
            </div>
            <div class="rounded border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
              <p class="text-xs text-gray-500 dark:text-gray-400">Total Revenue</p>
              <p class="text-lg font-bold text-purple-600 dark:text-purple-400 mt-1">
                ₱{{ (revenueReport().total_revenue || 0) | number:'1.2-2' }}
              </p>
            </div>
          </div>
        </div>
      }
    </div>
  `,
  styles: []
})
export class ReportsDashboardComponent implements OnInit {
  private reportService = inject(MoneyloanReportService);
  private authService = inject(AuthService);

  loading = signal(false);
  portfolioReport = signal<any>(null);
  performanceReport = signal<any>(null);
  collectionsReport = signal<any>(null);
  arrearsReport = signal<any>(null);
  revenueReport = signal<any>(null);
  private tenantId: string | number = '';

  dateRange = {
    start_date: new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0],
    end_date: new Date().toISOString().split('T')[0]
  };

  ngOnInit() {
    const user = this.authService.currentUser();
    this.tenantId = user?.tenantId || '';

    this.loadAllReports();
  }

  loadAllReports() {
    this.loading.set(true);

    // Load all reports in parallel
    Promise.all([
      this.reportService.getPortfolioReport(String(this.tenantId), this.dateRange).toPromise(),
      this.reportService.getPerformanceReport(String(this.tenantId), this.dateRange).toPromise(),
      this.reportService.getCollectionsReport(String(this.tenantId), this.dateRange).toPromise(),
      this.reportService.getArrearsReport(String(this.tenantId)).toPromise(),
      this.reportService.getRevenueReport(String(this.tenantId), this.dateRange).toPromise()
    ]).then(([portfolio, performance, collections, arrears, revenue]) => {
      this.portfolioReport.set(portfolio?.data || {});
      this.performanceReport.set(performance?.data || {});
      this.collectionsReport.set(collections?.data || {});
      this.arrearsReport.set(arrears?.data || {});
      this.revenueReport.set(revenue?.data || {});
      this.loading.set(false);
    }).catch((error) => {
      console.error('Failed to load reports:', error);
      this.loading.set(false);
    });
  }

  setQuickDate(period: string) {
    const today = new Date();

    switch (period) {
      case 'today':
        this.dateRange.start_date = today.toISOString().split('T')[0];
        this.dateRange.end_date = today.toISOString().split('T')[0];
        break;
      case 'week':
        const weekStart = new Date(today);
        weekStart.setDate(today.getDate() - today.getDay());
        this.dateRange.start_date = weekStart.toISOString().split('T')[0];
        this.dateRange.end_date = today.toISOString().split('T')[0];
        break;
      case 'month':
        this.dateRange.start_date = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
        this.dateRange.end_date = today.toISOString().split('T')[0];
        break;
    }

    this.loadAllReports();
  }

  exportReport() {
    this.reportService.exportReport(String(this.tenantId), {
      report_type: 'portfolio',
      ...this.dateRange,
      format: 'csv'
    }).subscribe({
      next: (response: any) => {
        // Create blob and download
        const blob = new Blob([response.data], { type: 'text/csv' });
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `moneyloan_report_${this.dateRange.start_date}_to_${this.dateRange.end_date}.csv`;
        a.click();
        window.URL.revokeObjectURL(url);
      },
      error: (error: any) => {
        console.error('Failed to export report:', error);
        alert('Failed to export report');
      }
    });
  }
}
