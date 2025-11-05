/**
 * Collector Targets Component
 *
 * Set and manage collection targets for collectors.
 *
 * Features:
 * - Set daily/weekly/monthly targets
 * - Collection amount and visit count targets
 * - Target progress tracking
 * - Bulk target updates
 * - Compact, modern design
 *
 * Route: /platforms/money-loan/dashboard/collectors/targets
 */

import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastService } from '../../../../../core/services/toast.service';

interface CollectorTarget {
  id?: number;
  employeeId: number;
  employeeName?: string;
  period: 'daily' | 'weekly' | 'monthly';
  collectionTarget: number;
  visitTarget: number;
  disbursementTarget: number;
  currentCollection?: number;
  currentVisits?: number;
  currentDisbursements?: number;
  startDate: string;
  endDate: string;
  isActive: boolean;
}

@Component({
  selector: 'app-collector-targets',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <!-- Compact Header -->
      <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-2xl">🎯</span>
            <div>
              <h1 class="text-lg font-semibold text-gray-900 dark:text-white">
                Collector Targets
              </h1>
              <p class="text-xs text-gray-600 dark:text-gray-400">
                Set and manage collection targets
              </p>
            </div>
          </div>
          <div class="flex items-center gap-2">
            <select
              [(ngModel)]="selectedPeriod"
              (change)="loadTargets()"
              class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="daily">Daily Targets</option>
              <option value="weekly">Weekly Targets</option>
              <option value="monthly">Monthly Targets</option>
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
          <!-- Targets Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
            @for (target of targets(); track target.employeeId) {
              <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm overflow-hidden">
                
                <!-- Header -->
                <div class="px-4 py-3 bg-gradient-to-r from-blue-500 to-blue-600 flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <div class="w-10 h-10 rounded-full bg-white/20 backdrop-blur-sm flex items-center justify-center text-white text-sm font-bold">
                      {{ getInitials(target.employeeName) }}
                    </div>
                    <div class="text-white">
                      <div class="text-sm font-semibold">{{ target.employeeName }}</div>
                      <div class="text-xs opacity-90">{{ selectedPeriod() }} targets</div>
                    </div>
                  </div>
                  @if (target.isActive) {
                    <span class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full bg-white/20 backdrop-blur-sm text-white">
                      <span class="w-1.5 h-1.5 bg-white rounded-full animate-pulse"></span>
                      Active
                    </span>
                  }
                </div>

                <!-- Body -->
                <div class="p-4">
                  @if (editingId() === target.employeeId) {
                    <!-- Edit Mode -->
                    <div class="space-y-3">
                      <div>
                        <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Collection Target (₱)
                        </label>
                        <input
                          type="number"
                          [(ngModel)]="editingTarget.collectionTarget"
                          class="w-full px-3 py-2 text-sm border border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500">
                      </div>

                      <div>
                        <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Visit Target
                        </label>
                        <input
                          type="number"
                          [(ngModel)]="editingTarget.visitTarget"
                          class="w-full px-3 py-2 text-sm border border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500">
                      </div>

                      <div>
                        <label class="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                          Disbursement Target
                        </label>
                        <input
                          type="number"
                          [(ngModel)]="editingTarget.disbursementTarget"
                          class="w-full px-3 py-2 text-sm border border-blue-300 dark:border-blue-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500">
                      </div>

                      <div class="flex gap-2 pt-2">
                        <button
                          (click)="saveTarget()"
                          class="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors">
                          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                          </svg>
                          Save
                        </button>
                        <button
                          (click)="cancelEdit()"
                          class="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
                          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>
                          </svg>
                          Cancel
                        </button>
                      </div>
                    </div>
                  } @else {
                    <!-- View Mode -->
                    <div class="space-y-3">
                      <!-- Collection Target -->
                      <div>
                        <div class="flex items-center justify-between mb-1">
                          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Collection Target</span>
                          <span class="text-xs font-semibold text-green-700 dark:text-green-400">
                            {{ calculatePercentage(target.currentCollection || 0, target.collectionTarget) }}%
                          </span>
                        </div>
                        <div class="mb-1">
                          <div class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              class="h-full bg-gradient-to-r from-green-500 to-green-600 rounded-full transition-all"
                              [style.width.%]="calculatePercentage(target.currentCollection || 0, target.collectionTarget)">
                            </div>
                          </div>
                        </div>
                        <div class="flex items-center justify-between text-xs">
                          <span class="text-gray-600 dark:text-gray-400">
                            ₱{{ target.currentCollection || 0 | number:'1.0-0' }}
                          </span>
                          <span class="font-medium text-gray-900 dark:text-white">
                            / ₱{{ target.collectionTarget | number:'1.0-0' }}
                          </span>
                        </div>
                      </div>

                      <!-- Visit Target -->
                      <div>
                        <div class="flex items-center justify-between mb-1">
                          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Visit Target</span>
                          <span class="text-xs font-semibold text-blue-700 dark:text-blue-400">
                            {{ calculatePercentage(target.currentVisits || 0, target.visitTarget) }}%
                          </span>
                        </div>
                        <div class="mb-1">
                          <div class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              class="h-full bg-gradient-to-r from-blue-500 to-blue-600 rounded-full transition-all"
                              [style.width.%]="calculatePercentage(target.currentVisits || 0, target.visitTarget)">
                            </div>
                          </div>
                        </div>
                        <div class="flex items-center justify-between text-xs">
                          <span class="text-gray-600 dark:text-gray-400">
                            {{ target.currentVisits || 0 }} visits
                          </span>
                          <span class="font-medium text-gray-900 dark:text-white">
                            / {{ target.visitTarget }}
                          </span>
                        </div>
                      </div>

                      <!-- Disbursement Target -->
                      <div>
                        <div class="flex items-center justify-between mb-1">
                          <span class="text-xs font-medium text-gray-600 dark:text-gray-400">Disbursement Target</span>
                          <span class="text-xs font-semibold text-purple-700 dark:text-purple-400">
                            {{ calculatePercentage(target.currentDisbursements || 0, target.disbursementTarget) }}%
                          </span>
                        </div>
                        <div class="mb-1">
                          <div class="w-full h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                            <div 
                              class="h-full bg-gradient-to-r from-purple-500 to-purple-600 rounded-full transition-all"
                              [style.width.%]="calculatePercentage(target.currentDisbursements || 0, target.disbursementTarget)">
                            </div>
                          </div>
                        </div>
                        <div class="flex items-center justify-between text-xs">
                          <span class="text-gray-600 dark:text-gray-400">
                            {{ target.currentDisbursements || 0 }}
                          </span>
                          <span class="font-medium text-gray-900 dark:text-white">
                            / {{ target.disbursementTarget }}
                          </span>
                        </div>
                      </div>

                      <!-- Edit Button -->
                      <button
                        (click)="editTarget(target)"
                        class="w-full inline-flex items-center justify-center gap-1.5 px-3 py-2 text-sm font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded-lg transition-colors mt-2">
                        <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z"/>
                        </svg>
                        Edit Targets
                      </button>
                    </div>
                  }
                </div>
              </div>
            } @empty {
              <div class="col-span-3 flex flex-col items-center justify-center py-12">
                <div class="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
                  <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                  </svg>
                </div>
                <div class="text-sm text-gray-500 dark:text-gray-400">No targets configured</div>
              </div>
            }
          </div>
        }
      </div>
    </div>
  `
})
export class CollectorTargetsComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private toastService = inject(ToastService);

  targets = signal<CollectorTarget[]>([]);
  loading = signal(false);
  selectedPeriod = signal<'daily' | 'weekly' | 'monthly'>('monthly');
  editingId = signal<number | null>(null);
  editingTarget: Partial<CollectorTarget> = {};

  ngOnInit(): void {
    this.loadTargets();
  }

  async loadTargets(): Promise<void> {
    this.loading.set(true);
    try {
      // Get all collectors
      const collectorsResponse: any = await this.http.get('/api/collectors').toPromise();
      const collectors = collectorsResponse?.data || collectorsResponse || [];
      
      // Get existing targets
      const targetsResponse: any = await this.http.get(
        `/api/money-loan/collector-targets?period=${this.selectedPeriod()}`
      ).toPromise();
      const targetsData = targetsResponse?.data || targetsResponse || [];
      
      // Merge data
      const targetsMap = new Map(targetsData.map((t: any) => [t.collectorId, t]));
      
      const mergedTargets = collectors.map((collector: any) => {
        const target: any = targetsMap.get(collector.id);
        return {
          employeeId: collector.id,
          employeeName: `${collector.firstName} ${collector.lastName}`,
          period: this.selectedPeriod(),
          collectionTarget: target?.targetAmount || this.getDefaultTarget('collection'),
          visitTarget: target?.targetCount || this.getDefaultTarget('visit'),
          disbursementTarget: target?.targetAmount || this.getDefaultTarget('disbursement'),
          currentCollection: target?.actualAmount || 0,
          currentVisits: target?.actualCount || 0,
          currentDisbursements: target?.actualAmount || 0,
          startDate: target?.periodStart || new Date().toISOString(),
          endDate: target?.periodEnd || new Date().toISOString(),
          isActive: target?.status === 'active',
          id: target?.id
        };
      });
      
      this.targets.set(mergedTargets);
    } catch (error: any) {
      console.error('Error loading targets:', error);
      this.toastService.error(error.error?.message || 'Failed to load collector targets');
    } finally {
      this.loading.set(false);
    }
  }

  getDefaultTarget(type: 'collection' | 'visit' | 'disbursement'): number {
    const period = this.selectedPeriod();
    const defaults = {
      daily: { collection: 50000, visit: 10, disbursement: 3 },
      weekly: { collection: 250000, visit: 50, disbursement: 15 },
      monthly: { collection: 1000000, visit: 200, disbursement: 60 }
    };
    return defaults[period][type];
  }

  editTarget(target: CollectorTarget): void {
    this.editingId.set(target.employeeId);
    this.editingTarget = { ...target };
  }

  cancelEdit(): void {
    this.editingId.set(null);
    this.editingTarget = {};
  }

  async saveTarget(): Promise<void> {
    if (!this.editingId()) return;

    try {
      const payload = {
        employeeId: this.editingId(),
        period: this.selectedPeriod(),
        collectionTarget: this.editingTarget.collectionTarget,
        visitTarget: this.editingTarget.visitTarget,
        disbursementTarget: this.editingTarget.disbursementTarget,
        startDate: this.editingTarget.startDate || new Date().toISOString(),
        endDate: this.editingTarget.endDate || new Date().toISOString(),
        isActive: this.editingTarget.isActive ?? true
      };

      if (this.editingTarget.id) {
        await this.http.put(`/api/money-loan/collector-targets/${this.editingTarget.id}`, payload).toPromise();
      } else {
        await this.http.post('/api/money-loan/collector-targets', payload).toPromise();
      }

      this.toastService.success('Collector targets updated successfully');
      this.editingId.set(null);
      this.editingTarget = {};
      this.loadTargets();
    } catch (error: any) {
      console.error('Error saving target:', error);
      this.toastService.error(error.error?.message || 'Failed to save collector target');
    }
  }

  calculatePercentage(current: number, target: number): number {
    if (target === 0) return 0;
    return Math.min(Math.round((current / target) * 100), 100);
  }

  goBack(): void {
    this.router.navigate(['/platforms/money-loan/dashboard']);
  }

  getInitials(name: string | undefined): string {
    if (!name) return '';
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  }
}
