/**
 * Collector Limits Management Component
 *
 * Manages collection limits and targets for collectors in the Money Loan platform.
 *
 * Features:
 * - View all collectors with their current limits
 * - Set/update limits: daily target, max customers, max amount
 * - Track limit utilization and performance
 * - Dark mode support
 *
 * Route: /platforms/money-loan/dashboard/collectors/limits
 */

import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastService } from '../../../../../core/services/toast.service';

interface CollectorLimit {
  id?: number;
  employeeId: number;
  employeeName?: string;
  maxCustomers: number;
  maxDailyAmount: number;
  maxMonthlyAmount: number;
  maxActiveLoans: number;
  dailyVisitTarget: number;
  monthlyCollectionTarget: number;
  effectiveDate: string;
  isActive: boolean;
  currentCustomers?: number;
  currentActiveLoans?: number;
}

@Component({
  selector: 'app-collector-limits',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <!-- Compact Header -->
      <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-2xl">📊</span>
            <div>
              <h1 class="text-lg font-semibold text-gray-900 dark:text-white">
                Collector Limits
              </h1>
              <p class="text-xs text-gray-600 dark:text-gray-400">
                Configure limits and targets
              </p>
            </div>
          </div>
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

      <!-- Main Content -->
      <div class="flex-1 overflow-auto p-4">
        
        <!-- Loading State -->
        @if (loading()) {
          <div class="flex items-center justify-center h-64">
            <div class="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        }

        <!-- Compact Modern Table -->
        @if (!loading()) {
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <div class="overflow-x-auto">
              <table class="w-full">
                <thead class="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-600">
                  <tr>
                    <th class="px-4 py-2.5 text-left text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Collector
                    </th>
                    <th class="px-4 py-2.5 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Max Customers
                    </th>
                    <th class="px-4 py-2.5 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Max Loans
                    </th>
                    <th class="px-4 py-2.5 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Daily Limit
                    </th>
                    <th class="px-4 py-2.5 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Monthly Limit
                    </th>
                    <th class="px-4 py-2.5 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Visit Target
                    </th>
                    <th class="px-4 py-2.5 text-right text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Collection Target
                    </th>
                    <th class="px-4 py-2.5 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Status
                    </th>
                    <th class="px-4 py-2.5 text-center text-xs font-semibold text-gray-600 dark:text-gray-300 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody class="divide-y divide-gray-100 dark:divide-gray-700">
                  @for (limit of limits(); track limit.employeeId) {
                    <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                      <td class="px-4 py-3">
                        <div class="flex items-center gap-2">
                          <div class="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-blue-600 flex items-center justify-center text-white text-xs font-semibold">
                            {{ getInitials(limit.employeeName) }}
                          </div>
                          <div>
                            <div class="text-sm font-medium text-gray-900 dark:text-white">
                              {{ limit.employeeName }}
                            </div>
                            <div class="text-xs text-gray-500 dark:text-gray-400">
                              {{ limit.currentCustomers || 0 }} customers · {{ limit.currentActiveLoans || 0 }} loans
                            </div>
                          </div>
                        </div>
                      </td>
                      <td class="px-4 py-3 text-center">
                        @if (editingId() === limit.employeeId) {
                          <input
                            type="number"
                            [(ngModel)]="editingLimit.maxCustomers"
                            class="w-16 px-2 py-1 text-sm text-center border border-blue-300 dark:border-blue-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500">
                        } @else {
                          <span class="inline-flex items-center justify-center px-2 py-1 text-sm font-medium text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 rounded">
                            {{ limit.maxCustomers }}
                          </span>
                        }
                      </td>
                      <td class="px-4 py-3 text-center">
                        @if (editingId() === limit.employeeId) {
                          <input
                            type="number"
                            [(ngModel)]="editingLimit.maxActiveLoans"
                            class="w-16 px-2 py-1 text-sm text-center border border-blue-300 dark:border-blue-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500">
                        } @else {
                          <span class="inline-flex items-center justify-center px-2 py-1 text-sm font-medium text-gray-900 dark:text-white bg-gray-100 dark:bg-gray-700 rounded">
                            {{ limit.maxActiveLoans }}
                          </span>
                        }
                      </td>
                      <td class="px-4 py-3 text-right">
                        @if (editingId() === limit.employeeId) {
                          <input
                            type="number"
                            [(ngModel)]="editingLimit.maxDailyAmount"
                            class="w-28 px-2 py-1 text-sm text-right border border-blue-300 dark:border-blue-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500">
                        } @else {
                          <span class="text-sm font-medium text-gray-900 dark:text-white">₱{{ limit.maxDailyAmount | number:'1.0-0' }}</span>
                        }
                      </td>
                      <td class="px-4 py-3 text-right">
                        @if (editingId() === limit.employeeId) {
                          <input
                            type="number"
                            [(ngModel)]="editingLimit.maxMonthlyAmount"
                            class="w-28 px-2 py-1 text-sm text-right border border-blue-300 dark:border-blue-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500">
                        } @else {
                          <span class="text-sm font-medium text-gray-900 dark:text-white">₱{{ limit.maxMonthlyAmount | number:'1.0-0' }}</span>
                        }
                      </td>
                      <td class="px-4 py-3 text-center">
                        @if (editingId() === limit.employeeId) {
                          <input
                            type="number"
                            [(ngModel)]="editingLimit.dailyVisitTarget"
                            class="w-16 px-2 py-1 text-sm text-center border border-blue-300 dark:border-blue-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500">
                        } @else {
                          <span class="inline-flex items-center justify-center gap-1 px-2 py-1 text-sm font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded">
                            <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                              <path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>
                            </svg>
                            {{ limit.dailyVisitTarget }}
                          </span>
                        }
                      </td>
                      <td class="px-4 py-3 text-right">
                        @if (editingId() === limit.employeeId) {
                          <input
                            type="number"
                            [(ngModel)]="editingLimit.monthlyCollectionTarget"
                            class="w-28 px-2 py-1 text-sm text-right border border-blue-300 dark:border-blue-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500">
                        } @else {
                          <span class="text-sm font-medium text-green-700 dark:text-green-400">₱{{ limit.monthlyCollectionTarget | number:'1.0-0' }}</span>
                        }
                      </td>
                      <td class="px-4 py-3 text-center">
                        @if (limit.isActive) {
                          <span class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                            <span class="w-1.5 h-1.5 bg-green-500 rounded-full"></span>
                            Active
                          </span>
                        } @else {
                          <span class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                            <span class="w-1.5 h-1.5 bg-gray-400 rounded-full"></span>
                            Inactive
                          </span>
                        }
                      </td>
                      <td class="px-4 py-3">
                        @if (editingId() === limit.employeeId) {
                          <div class="flex items-center justify-center gap-1.5">
                            <button
                              (click)="saveLimit()"
                              class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors">
                              <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"/>
                              </svg>
                              Save
                            </button>
                            <button
                              (click)="cancelEdit()"
                              class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded transition-colors">
                              <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                              </svg>
                              Cancel
                            </button>
                          </div>
                        } @else {
                          <div class="flex justify-center">
                            <button
                              (click)="editLimit(limit)"
                              class="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-blue-700 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors">
                              <svg class="w-3.5 h-3.5" fill="currentColor" viewBox="0 0 20 20">
                                <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                              </svg>
                              Edit
                            </button>
                          </div>
                        }
                      </td>
                    </tr>
                  } @empty {
                    <tr>
                      <td colspan="9" class="px-4 py-12 text-center">
                        <div class="flex flex-col items-center gap-3">
                          <div class="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
                            <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                            </svg>
                          </div>
                          <div class="text-sm text-gray-500 dark:text-gray-400">No collector limits configured</div>
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
export class CollectorLimitsComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private toastService = inject(ToastService);

  limits = signal<CollectorLimit[]>([]);
  loading = signal(false);
  editingId = signal<number | null>(null);
  editingLimit: Partial<CollectorLimit> = {};

  ngOnInit(): void {
    this.loadLimits();
  }

  async loadLimits(): Promise<void> {
    this.loading.set(true);
    try {
      // Get all collectors
      const collectorsResponse: any = await this.http.get('/api/collectors').toPromise();
      const collectors = collectorsResponse?.data || collectorsResponse || [];
      
      // Get existing limits
      const limitsResponse: any = await this.http.get('/api/money-loan/collector-limits').toPromise();
      const limitsData = limitsResponse?.data || limitsResponse || [];
      
      // Merge data
      const limitsMap = new Map(limitsData.map((l: any) => [l.id, l]));
      
      const mergedLimits = collectors.map((collector: any) => {
        const limit: any = limitsMap.get(collector.id);
        return {
          employeeId: collector.id,
          employeeName: `${collector.firstName} ${collector.lastName}`,
          maxCustomers: limit?.currentCustomers || 50,
          maxDailyAmount: limit?.dailyDisbursementLimit || 100000,
          maxMonthlyAmount: limit?.monthlyDisbursementLimit || 2000000,
          maxActiveLoans: limit?.maxActiveLoans || 30,
          dailyVisitTarget: limit?.dailyVisitTarget || 10,
          monthlyCollectionTarget: limit?.monthlyCollectionTarget || 500000,
          effectiveDate: limit?.effectiveDate || new Date().toISOString(),
          isActive: limit?.isActive ?? true,
          currentCustomers: collector.activeAssignments || 0,
          currentActiveLoans: 0,
          id: limit?.id
        };
      });
      
      this.limits.set(mergedLimits);
    } catch (error: any) {
      console.error('Error loading limits:', error);
      this.toastService.error(error.error?.message || 'Failed to load collector limits');
    } finally {
      this.loading.set(false);
    }
  }

  editLimit(limit: CollectorLimit): void {
    this.editingId.set(limit.employeeId);
    this.editingLimit = { ...limit };
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.editingLimit = {};
  }

  async saveLimit(): Promise<void> {
    if (!this.editingId()) return;

    try {
      const payload = {
        employeeId: this.editingId(),
        maxCustomers: this.editingLimit.maxCustomers,
        maxDailyAmount: this.editingLimit.maxDailyAmount,
        maxMonthlyAmount: this.editingLimit.maxMonthlyAmount,
        maxActiveLoans: this.editingLimit.maxActiveLoans,
        dailyVisitTarget: this.editingLimit.dailyVisitTarget,
        monthlyCollectionTarget: this.editingLimit.monthlyCollectionTarget,
        effectiveDate: this.editingLimit.effectiveDate || new Date().toISOString(),
        isActive: this.editingLimit.isActive ?? true
      };

      if (this.editingLimit.id) {
        await this.http.put(`/api/money-loan/collector-limits/${this.editingLimit.id}`, payload).toPromise();
      } else {
        await this.http.post('/api/money-loan/collector-limits', payload).toPromise();
      }

      this.toastService.success('Collector limits updated successfully');
      this.editingId.set(null);
      this.editingLimit = {};
      this.loadLimits();
    } catch (error: any) {
      console.error('Error saving limit:', error);
      this.toastService.error(error.error?.message || 'Failed to save collector limit');
    }
  }

  goBack(): void {
    this.router.navigate(['/platforms/money-loan/dashboard']);
  }

  getInitials(name: string | undefined): string {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }
}
