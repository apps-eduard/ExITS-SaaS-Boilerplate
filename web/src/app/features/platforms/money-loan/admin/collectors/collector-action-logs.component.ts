/**
 * Collector Action Logs Component
 *
 * Browse and filter collector activity logs.
 *
 * Features:
 * - Timeline view of collector actions
 * - Filter by collector, action type, date range
 * - Real-time activity tracking
 * - Compact, modern design with icons
 *
 * Route: /platforms/money-loan/dashboard/collectors/action-logs
 */

import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastService } from '../../../../../core/services/toast.service';

interface ActionLog {
  id: number;
  employeeId: number;
  employeeName?: string;
  actionType: 'assignment' | 'unassignment' | 'status_change' | 'route_update' | 'collection' | 'disbursement' | 'visit';
  description: string;
  metadata?: any;
  createdAt: string;
  ipAddress?: string;
}

@Component({
  selector: 'app-collector-action-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <!-- Compact Header -->
      <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-2xl">📋</span>
            <div>
              <h1 class="text-lg font-semibold text-gray-900 dark:text-white">
                Collector Activity Logs
              </h1>
              <p class="text-xs text-gray-600 dark:text-gray-400">
                Track all collector actions and changes
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

      <!-- Filters -->
      <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div class="flex items-center gap-3">
          <select
            [(ngModel)]="filterCollectorId"
            (change)="loadLogs()"
            class="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option [value]="null">All Collectors</option>
            @for (collector of collectors(); track collector.id) {
              <option [value]="collector.id">{{ collector.name }}</option>
            }
          </select>

          <select
            [(ngModel)]="filterActionType"
            (change)="loadLogs()"
            class="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option value="">All Actions</option>
            <option value="assignment">Assignments</option>
            <option value="unassignment">Unassignments</option>
            <option value="status_change">Status Changes</option>
            <option value="route_update">Route Updates</option>
            <option value="collection">Collections</option>
            <option value="disbursement">Disbursements</option>
            <option value="visit">Visits</option>
          </select>

          <input
            type="date"
            [(ngModel)]="filterDate"
            (change)="loadLogs()"
            class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
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
          <!-- Activity Timeline -->
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
            <div class="p-4">
              @if (logs().length > 0) {
                <div class="space-y-3">
                  @for (log of logs(); track log.id) {
                    <div class="flex gap-3 group">
                      <!-- Icon & Timeline -->
                      <div class="flex flex-col items-center">
                        <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0"
                          [class]="getActionIconClass(log.actionType)">
                          <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20" [innerHTML]="getActionIcon(log.actionType)">
                          </svg>
                        </div>
                        @if (!$last) {
                          <div class="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700 mt-1"></div>
                        }
                      </div>

                      <!-- Content -->
                      <div class="flex-1 pb-4">
                        <div class="flex items-start justify-between gap-3">
                          <div class="flex-1">
                            <div class="flex items-center gap-2 mb-1">
                              <span class="text-sm font-semibold text-gray-900 dark:text-white">
                                {{ log.employeeName }}
                              </span>
                              <span class="inline-flex px-2 py-0.5 text-xs font-medium rounded"
                                [class]="getActionBadgeClass(log.actionType)">
                                {{ getActionLabel(log.actionType) }}
                              </span>
                            </div>
                            <p class="text-sm text-gray-700 dark:text-gray-300 mb-1">
                              {{ log.description }}
                            </p>
                            @if (log.metadata) {
                              <div class="flex flex-wrap gap-2 mt-2">
                                @for (item of getMetadataItems(log.metadata); track $index) {
                                  <span class="inline-flex items-center gap-1 px-2 py-0.5 text-xs bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400 rounded">
                                    <span class="font-medium">{{ item.key }}:</span>
                                    <span>{{ item.value }}</span>
                                  </span>
                                }
                              </div>
                            }
                          </div>
                          <div class="text-xs text-gray-500 dark:text-gray-400 text-right whitespace-nowrap">
                            <div>{{ formatDate(log.createdAt) }}</div>
                            <div>{{ formatTime(log.createdAt) }}</div>
                          </div>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              } @else {
                <div class="flex flex-col items-center justify-center py-12">
                  <div class="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
                    <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                  </div>
                  <div class="text-sm text-gray-500 dark:text-gray-400">No activity logs found</div>
                </div>
              }
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class CollectorActionLogsComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private toastService = inject(ToastService);

  logs = signal<ActionLog[]>([]);
  collectors = signal<Array<{id: number, name: string}>>([]);
  loading = signal(false);
  filterCollectorId = signal<number | null>(null);
  filterActionType = signal<string>('');
  filterDate = signal<string>('');

  ngOnInit(): void {
    this.loadCollectors();
    this.loadLogs();
  }

  async loadCollectors(): Promise<void> {
    try {
      const response: any = await this.http.get('/api/collectors').toPromise();
      const data = response?.data || response || [];
      this.collectors.set(data.map((c: any) => ({
        id: c.id,
        name: `${c.firstName} ${c.lastName}`
      })));
    } catch (error: any) {
      console.error('Error loading collectors:', error);
      this.collectors.set([]);
    }
  }

  async loadLogs(): Promise<void> {
    this.loading.set(true);
    try {
      const params: any = {};
      if (this.filterCollectorId()) params.employeeId = this.filterCollectorId();
      if (this.filterActionType()) params.actionType = this.filterActionType();
      if (this.filterDate()) params.date = this.filterDate();

      const queryString = new URLSearchParams(params).toString();
      const data: any = await this.http.get(
        `/api/money-loan/collector-action-logs${queryString ? '?' + queryString : ''}`
      ).toPromise();
      
      this.logs.set(data || []);
    } catch (error: any) {
      console.error('Error loading logs:', error);
      this.toastService.error(error.error?.message || 'Failed to load activity logs');
    } finally {
      this.loading.set(false);
    }
  }

  getActionIcon(type: string): string {
    const icons: Record<string, string> = {
      'assignment': '<path d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>',
      'unassignment': '<path fill-rule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clip-rule="evenodd"/>',
      'status_change': '<path fill-rule="evenodd" d="M4 2a1 1 0 011 1v2.101a7.002 7.002 0 0111.601 2.566 1 1 0 11-1.885.666A5.002 5.002 0 005.999 7H9a1 1 0 010 2H4a1 1 0 01-1-1V3a1 1 0 011-1zm.008 9.057a1 1 0 011.276.61A5.002 5.002 0 0014.001 13H11a1 1 0 110-2h5a1 1 0 011 1v5a1 1 0 11-2 0v-2.101a7.002 7.002 0 01-11.601-2.566 1 1 0 01.61-1.276z" clip-rule="evenodd"/>',
      'route_update': '<path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>',
      'collection': '<path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z"/><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clip-rule="evenodd"/>',
      'disbursement': '<path fill-rule="evenodd" d="M4 4a2 2 0 00-2 2v4a2 2 0 002 2V6h10a2 2 0 00-2-2H4zm2 6a2 2 0 012-2h8a2 2 0 012 2v4a2 2 0 01-2 2H8a2 2 0 01-2-2v-4zm6 4a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>',
      'visit': '<path d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z"/>'
    };
    return icons[type] || icons['assignment'];
  }

  getActionIconClass(type: string): string {
    const classes: Record<string, string> = {
      'assignment': 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      'unassignment': 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400',
      'status_change': 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
      'route_update': 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
      'collection': 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      'disbursement': 'bg-indigo-100 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400',
      'visit': 'bg-orange-100 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
    };
    return classes[type] || classes['assignment'];
  }

  getActionBadgeClass(type: string): string {
    const classes: Record<string, string> = {
      'assignment': 'bg-blue-50 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400',
      'unassignment': 'bg-red-50 dark:bg-red-900/30 text-red-700 dark:text-red-400',
      'status_change': 'bg-yellow-50 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400',
      'route_update': 'bg-purple-50 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400',
      'collection': 'bg-green-50 dark:bg-green-900/30 text-green-700 dark:text-green-400',
      'disbursement': 'bg-indigo-50 dark:bg-indigo-900/30 text-indigo-700 dark:text-indigo-400',
      'visit': 'bg-orange-50 dark:bg-orange-900/30 text-orange-700 dark:text-orange-400'
    };
    return classes[type] || classes['assignment'];
  }

  getActionLabel(type: string): string {
    const labels: Record<string, string> = {
      'assignment': 'Assignment',
      'unassignment': 'Unassignment',
      'status_change': 'Status Change',
      'route_update': 'Route Update',
      'collection': 'Collection',
      'disbursement': 'Disbursement',
      'visit': 'Visit'
    };
    return labels[type] || type;
  }

  getMetadataItems(metadata: any): Array<{key: string, value: string}> {
    if (!metadata || typeof metadata !== 'object') return [];
    return Object.entries(metadata).map(([key, value]) => ({
      key: key.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase()),
      value: String(value)
    }));
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  goBack(): void {
    this.router.navigate(['/platforms/money-loan/dashboard']);
  }
}
