/**
 * Collector Performance Dashboard Component
 *
 * Displays comprehensive performance metrics for collectors.
 *
 * Features:
 * - Daily and monthly performance summaries
 * - Collections vs targets tracking
 * - Visit completion rates
 * - Performance trends and rankings
 * - Compact, modern card-based layout
 *
 * Route: /platforms/money-loan/dashboard/collectors/performance
 */

import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastService } from '../../../../../core/services/toast.service';

interface CollectorPerformance {
  employeeId: number;
  employeeName: string;
  date: string;
  customersVisited: number;
  visitTarget: number;
  paymentsCollected: number;
  amountCollected: number;
  collectionTarget: number;
  disbursementsMade: number;
  disbursementAmount: number;
  routeEfficiency: number;
  averageTimePerVisit: number;
  successRate: number;
}

interface PerformanceStats {
  totalCollections: number;
  totalDisbursements: number;
  totalVisits: number;
  avgSuccessRate: number;
  topPerformer: string;
}

@Component({
  selector: 'app-collector-performance',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <!-- Compact Header -->
      <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-2xl">📈</span>
            <div>
              <h1 class="text-lg font-semibold text-gray-900 dark:text-white">
                Collector Performance
              </h1>
              <p class="text-xs text-gray-600 dark:text-gray-400">
                Track performance metrics and targets
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <select
              [(ngModel)]="selectedPeriod"
              (change)="loadPerformance()"
              class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="today">Today</option>
              <option value="week">This Week</option>
              <option value="month">This Month</option>
            </select>
            <button
              (click)="goBack()"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
              </svg>
              Back
            </button>
          </div>
        </div>
      </div>

      <!-- Main Content -->
      <div class="flex-1 overflow-auto p-4">
        
        <!-- Loading State -->
        @if (loading()) {
          <div class="flex items-center justify-center h-64">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        }

        @if (!loading()) {
          <!-- Summary Stats -->
          <div class="grid grid-cols-4 gap-3 mb-4">
            <div class="bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg p-4 text-white shadow-sm">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-medium opacity-90">Total Collections</span>
                <svg class="w-5 h-5 opacity-80" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/>
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd"/>
                </svg>
              </div>
              <div class="text-2xl font-bold">₱{{ stats().totalCollections | number:'1.0-0' }}</div>
              <div class="text-xs opacity-75 mt-1">{{ selectedPeriod }}</div>
            </div>

            <div class="bg-gradient-to-br from-green-500 to-green-600 rounded-lg p-4 text-white shadow-sm">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-medium opacity-90">Customer Visits</span>
                <svg class="w-5 h-5 opacity-80" fill="currentColor" viewBox="0 0 20 20">
                  <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
                </svg>
              </div>
              <div class="text-2xl font-bold">{{ stats().totalVisits }}</div>
              <div class="text-xs opacity-75 mt-1">{{ selectedPeriod }}</div>
            </div>

            <div class="bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg p-4 text-white shadow-sm">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-medium opacity-90">Disbursements</span>
                <svg class="w-5 h-5 opacity-80" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
                </svg>
              </div>
              <div class="text-2xl font-bold">{{ stats().totalDisbursements }}</div>
              <div class="text-xs opacity-75 mt-1">{{ selectedPeriod }}</div>
            </div>

            <div class="bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg p-4 text-white shadow-sm">
              <div class="flex items-center justify-between mb-2">
                <span class="text-xs font-medium opacity-90">Avg Success Rate</span>
                <svg class="w-5 h-5 opacity-80" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
              </div>
              <div class="text-2xl font-bold">{{ stats().avgSuccessRate }}%</div>
              <div class="text-xs opacity-75 mt-1">{{ selectedPeriod }}</div>
            </div>
          </div>

          <!-- Performance Table -->
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th class="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                      Collector
                    </th>
                    <th class="px-4 py-2.5 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                      Visits
                    </th>
                    <th class="px-4 py-2.5 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                      Collections
                    </th>
                    <th class="px-4 py-2.5 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                      Payments
                    </th>
                    <th class="px-4 py-2.5 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                      Disbursements
                    </th>
                    <th class="px-4 py-2.5 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                      Success Rate
                    </th>
                    <th class="px-4 py-2.5 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                      Efficiency
                    </th>
                    <th class="px-4 py-2.5 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase">
                      Target
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                  @for (perf of performance(); track perf.employeeId) {
                    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td class="px-4 py-3">
                        <div class="flex items-center gap-2">
                          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-indigo-600 flex items-center justify-center text-white text-xs font-semibold">
                            {{ getInitials(perf.employeeName) }}
                          </div>
                          <div class="text-sm font-medium text-gray-900 dark:text-white">
                            {{ perf.employeeName }}
                          </div>
                        </div>
                      </td>
                      <td class="px-4 py-3 text-center">
                        <div class="flex flex-col items-center gap-0.5">
                          <span class="text-sm font-semibold text-gray-900 dark:text-white">
                            {{ perf.customersVisited }}
                          </span>
                          <span class="text-xs text-gray-500 dark:text-gray-400">
                            of {{ perf.visitTarget }}
                          </span>
                        </div>
                      </td>
                      <td class="px-4 py-3 text-right">
                        <div class="text-sm font-semibold text-green-700 dark:text-green-400">
                          ₱{{ perf.amountCollected | number:'1.0-0' }}
                        </div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">
                          Target: ₱{{ perf.collectionTarget | number:'1.0-0' }}
                        </div>
                      </td>
                      <td class="px-4 py-3 text-center">
                        <span class="inline-flex items-center justify-center px-2 py-1 text-sm font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded">
                          {{ perf.paymentsCollected }}
                        </span>
                      </td>
                      <td class="px-4 py-3 text-right">
                        <div class="text-sm font-semibold text-purple-700 dark:text-purple-400">
                          {{ perf.disbursementsMade }}
                        </div>
                        <div class="text-xs text-gray-500 dark:text-gray-400">
                          ₱{{ perf.disbursementAmount | number:'1.0-0' }}
                        </div>
                      </td>
                      <td class="px-4 py-3 text-center">
                        <div class="flex flex-col items-center gap-1">
                          <span class="text-sm font-semibold" [class]="perf.successRate >= 80 ? 'text-green-700 dark:text-green-400' : perf.successRate >= 50 ? 'text-yellow-700 dark:text-yellow-400' : 'text-red-700 dark:text-red-400'">
                            {{ perf.successRate }}%
                          </span>
                          <div class="w-16 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              class="h-full rounded-full transition-all"
                              [class]="perf.successRate >= 80 ? 'bg-green-500' : perf.successRate >= 50 ? 'bg-yellow-500' : 'bg-red-500'"
                              [style.width.%]="perf.successRate">
                            </div>
                          </div>
                        </div>
                      </td>
                      <td class="px-4 py-3 text-center">
                        <span class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full"
                          [class]="perf.routeEfficiency >= 80 ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'">
                          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M11.3 1.046A1 1 0 0112 2v5h4a1 1 0 01.82 1.573l-7 10A1 1 0 018 18v-5H4a1 1 0 01-.82-1.573l7-10a1 1 0 011.12-.38z" clip-rule="evenodd"/>
                          </svg>
                          {{ perf.routeEfficiency }}%
                        </span>
                      </td>
                      <td class="px-4 py-3 text-center">
                        @if (perf.amountCollected >= perf.collectionTarget) {
                          <span class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                            </svg>
                            Met
                          </span>
                        } @else {
                          <span class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400">
                            <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                              <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd"/>
                            </svg>
                            Pending
                          </span>
                        }
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="8" class="px-4 py-12 text-center">
                        <div class="flex flex-col items-center gap-3">
                          <div class="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                            </svg>
                          </div>
                          <div class="text-sm text-gray-500 dark:text-gray-400">No performance data available</div>
                        </div>
                      </td>
                    </tr>
                  }
                </tbody>
              </table>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class CollectorPerformanceComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private toastService = inject(ToastService);

  performance = signal<CollectorPerformance[]>([]);
  loading = signal(false);
  selectedPeriod = signal<string>('today');

  stats = computed(() => {
    const perf = this.performance();
    return {
      totalCollections: perf.reduce((sum, p) => sum + p.amountCollected, 0),
      totalDisbursements: perf.reduce((sum, p) => sum + p.disbursementsMade, 0),
      totalVisits: perf.reduce((sum, p) => sum + p.customersVisited, 0),
      avgSuccessRate: perf.length > 0 
        ? Math.round(perf.reduce((sum, p) => sum + p.successRate, 0) / perf.length)
        : 0,
      topPerformer: perf.length > 0
        ? perf.sort((a, b) => b.amountCollected - a.amountCollected)[0]?.employeeName
        : 'N/A'
    };
  });

  ngOnInit(): void {
    this.loadPerformance();
  }

  async loadPerformance(): Promise<void> {
    this.loading.set(true);
    try {
      const response: any = await this.http.get(
        `/api/money-loan/collector-performance?period=${this.selectedPeriod()}`
      ).toPromise();
      
      const data = response?.data || response || [];
      this.performance.set(data);
    } catch (error: any) {
      console.error('Error loading performance:', error);
      this.performance.set([]);
      this.toastService.error(error.error?.message || 'Failed to load performance data');
    } finally {
      this.loading.set(false);
    }
  }

  goBack(): void {
    this.router.navigate(['/platforms/money-loan/dashboard']);
  }

  getInitials(name: string): string {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }
}
