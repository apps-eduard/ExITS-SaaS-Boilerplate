/**
 * Collector Routes Component
 *
 * Visualize collector routes and customer visits with GPS tracking.
 *
 * Features:
 * - Interactive route visualization
 * - Customer visit locations and timestamps
 * - Route efficiency metrics
 * - Real-time GPS tracking status
 * - Compact, modern map-inspired design
 *
 * Route: /platforms/money-loan/dashboard/collectors/routes
 */

import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastService } from '../../../../../core/services/toast.service';

interface CustomerVisit {
  id: number;
  employeeId: number;
  customerId: number;
  customerName: string;
  customerAddress: string;
  latitude: number;
  longitude: number;
  visitedAt: string;
  purpose: string;
  outcome: string;
  notes?: string;
  distanceFromPrevious?: number;
  timeFromPrevious?: number;
}

interface RouteData {
  employeeId: number;
  employeeName: string;
  date: string;
  visits: CustomerVisit[];
  totalDistance: number;
  totalTime: number;
  efficiency: number;
  status: 'active' | 'completed' | 'planned';
}

@Component({
  selector: 'app-collector-routes',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <!-- Compact Header -->
      <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-4 py-3">
        <div class="flex items-center justify-between">
          <div class="flex items-center gap-3">
            <span class="text-2xl">🗺️</span>
            <div>
              <h1 class="text-lg font-semibold text-gray-900 dark:text-white">
                Collector Routes & GPS Tracking
              </h1>
              <p class="text-xs text-gray-600 dark:text-gray-400">
                Monitor routes and customer visit locations
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
            [(ngModel)]="selectedCollectorId"
            (change)="loadRoute()"
            class="flex-1 px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option [value]="null">Select Collector</option>
            @for (collector of collectors(); track collector.id) {
              <option [value]="collector.id">{{ collector.name }}</option>
            }
          </select>

          <input
            type="date"
            [(ngModel)]="selectedDate"
            (change)="loadRoute()"
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

        @if (!loading() && route()) {
          <div class="grid grid-cols-12 gap-4">
            <!-- Route Summary -->
            <div class="col-span-4">
              <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm p-4">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clip-rule="evenodd"/>
                  </svg>
                  Route Summary
                </h3>

                <div class="space-y-3">
                  <div class="flex items-center justify-between p-2 bg-blue-50 dark:bg-blue-900/20 rounded">
                    <span class="text-xs text-gray-600 dark:text-gray-400">Collector</span>
                    <span class="text-sm font-semibold text-gray-900 dark:text-white">{{ route()?.employeeName }}</span>
                  </div>

                  <div class="flex items-center justify-between p-2 bg-green-50 dark:bg-green-900/20 rounded">
                    <span class="text-xs text-gray-600 dark:text-gray-400">Total Visits</span>
                    <span class="text-sm font-semibold text-green-700 dark:text-green-400">{{ route()?.visits.length }}</span>
                  </div>

                  <div class="flex items-center justify-between p-2 bg-purple-50 dark:bg-purple-900/20 rounded">
                    <span class="text-xs text-gray-600 dark:text-gray-400">Total Distance</span>
                    <span class="text-sm font-semibold text-purple-700 dark:text-purple-400">{{ route()?.totalDistance }} km</span>
                  </div>

                  <div class="flex items-center justify-between p-2 bg-orange-50 dark:bg-orange-900/20 rounded">
                    <span class="text-xs text-gray-600 dark:text-gray-400">Total Time</span>
                    <span class="text-sm font-semibold text-orange-700 dark:text-orange-400">{{ formatDuration(route()?.totalTime) }}</span>
                  </div>

                  <div class="flex items-center justify-between p-2 bg-indigo-50 dark:bg-indigo-900/20 rounded">
                    <span class="text-xs text-gray-600 dark:text-gray-400">Efficiency</span>
                    <span class="text-sm font-semibold text-indigo-700 dark:text-indigo-400">{{ route()?.efficiency }}%</span>
                  </div>

                  <div class="flex items-center justify-between p-2"
                    [class]="route()?.status === 'active' ? 'bg-green-50 dark:bg-green-900/20' : 'bg-gray-50 dark:bg-gray-700'">
                    <span class="text-xs text-gray-600 dark:text-gray-400">Status</span>
                    <span class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full"
                      [class]="route()?.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300'">
                      <span class="w-1.5 h-1.5 rounded-full"
                        [class]="route()?.status === 'active' ? 'bg-green-500 animate-pulse' : 'bg-gray-400'">
                      </span>
                      {{ route()?.status === 'active' ? 'Active' : 'Completed' }}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            <!-- Visit Timeline -->
            <div class="col-span-8">
              <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 shadow-sm">
                <div class="p-4 border-b border-gray-200 dark:border-gray-700">
                  <h3 class="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                    <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                      <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
                    </svg>
                    Customer Visits
                  </h3>
                </div>

                <div class="p-4 max-h-[600px] overflow-auto">
                  @if (route()?.visits && route()?.visits.length > 0) {
                    <div class="space-y-3">
                      @for (visit of route()?.visits; track visit.id; let idx = $index) {
                        <div class="flex gap-3">
                          <!-- Timeline -->
                          <div class="flex flex-col items-center">
                            <div class="w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 text-white text-xs font-bold"
                              [class]="visit.outcome === 'successful' ? 'bg-gradient-to-br from-green-500 to-green-600' : visit.outcome === 'partial' ? 'bg-gradient-to-br from-yellow-500 to-yellow-600' : 'bg-gradient-to-br from-gray-400 to-gray-500'">
                              {{ idx + 1 }}
                            </div>
                            @if (idx < route()?.visits.length - 1) {
                              <div class="w-0.5 flex-1 bg-gray-200 dark:bg-gray-700 my-1 min-h-[20px]"></div>
                            }
                          </div>

                          <!-- Content -->
                          <div class="flex-1 pb-3">
                            <div class="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-3">
                              <div class="flex items-start justify-between mb-2">
                                <div class="flex-1">
                                  <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-1">
                                    {{ visit.customerName }}
                                  </h4>
                                  <p class="text-xs text-gray-600 dark:text-gray-400 flex items-center gap-1">
                                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
                                    </svg>
                                    {{ visit.customerAddress }}
                                  </p>
                                </div>
                                <div class="text-xs text-gray-500 dark:text-gray-400 text-right">
                                  {{ formatTime(visit.visitedAt) }}
                                </div>
                              </div>

                              <div class="flex flex-wrap gap-2 mb-2">
                                <span class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                                  {{ visit.purpose }}
                                </span>
                                <span class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded"
                                  [class]="visit.outcome === 'successful' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : visit.outcome === 'partial' ? 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400' : 'bg-gray-100 dark:bg-gray-600 text-gray-700 dark:text-gray-300'">
                                  {{ visit.outcome }}
                                </span>
                              </div>

                              @if (visit.distanceFromPrevious && visit.timeFromPrevious) {
                                <div class="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400 pt-2 border-t border-gray-200 dark:border-gray-600">
                                  <span class="flex items-center gap-1">
                                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path fill-rule="evenodd" d="M5.05 4.05a7 7 0 119.9 9.9L10 18.9l-4.95-4.95a7 7 0 010-9.9zM10 11a2 2 0 100-4 2 2 0 000 4z" clip-rule="evenodd"/>
                                    </svg>
                                    {{ visit.distanceFromPrevious }} km from previous
                                  </span>
                                  <span class="flex items-center gap-1">
                                    <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                      <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd"/>
                                    </svg>
                                    {{ visit.timeFromPrevious }} min travel
                                  </span>
                                </div>
                              }

                              @if (visit.notes) {
                                <p class="text-xs text-gray-600 dark:text-gray-400 mt-2 italic">
                                  "{{ visit.notes }}"
                                </p>
                              }
                            </div>
                          </div>
                        </div>
                      }
                    </div>
                  } @else {
                    <div class="flex flex-col items-center justify-center py-12">
                      <div class="w-16 h-16 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-3">
                        <svg class="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
                        </svg>
                      </div>
                      <div class="text-sm text-gray-500 dark:text-gray-400">No visits recorded for this route</div>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        }

        @if (!loading() && !route()) {
          <div class="flex flex-col items-center justify-center h-64">
            <div class="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center mb-4">
              <svg class="w-10 h-10 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7"/>
              </svg>
            </div>
            <div class="text-sm text-gray-500 dark:text-gray-400">Select a collector and date to view route</div>
          </div>
        }
      </div>
    </div>
  `
})
export class CollectorRoutesComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private toastService = inject(ToastService);

  route = signal<RouteData | null>(null);
  collectors = signal<Array<{id: number, name: string}>>([]);
  loading = signal(false);
  selectedCollectorId = signal<number | null>(null);
  selectedDate = signal<string>(new Date().toISOString().split('T')[0]);

  ngOnInit(): void {
    this.loadCollectors();
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

  async loadRoute(): Promise<void> {
    if (!this.selectedCollectorId()) {
      this.route.set(null);
      return;
    }

    this.loading.set(true);
    try {
      const data: any = await this.http.get(
        `/api/money-loan/collector-routes/${this.selectedCollectorId()}?date=${this.selectedDate()}`
      ).toPromise();
      
      this.route.set(data);
    } catch (error: any) {
      console.error('Error loading route:', error);
      this.toastService.error(error.error?.message || 'Failed to load route data');
      this.route.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  formatDuration(minutes: number = 0): string {
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    if (hours > 0) {
      return `${hours}h ${mins}m`;
    }
    return `${mins}m`;
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  goBack(): void {
    this.router.navigate(['/platforms/money-loan/dashboard']);
  }
}
