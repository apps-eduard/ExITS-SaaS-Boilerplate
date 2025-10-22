import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

interface PerformanceMetric {
  name: string;
  value: number;
  unit: string;
  trend: 'up' | 'down' | 'stable';
  change: number;
}

@Component({
  selector: 'app-system-performance',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6 space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">⚡ Performance Metrics</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Real-time system performance monitoring
          </p>
        </div>
        <div class="flex items-center gap-2">
          <select class="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-900 dark:text-white rounded-lg">
            <option>Last Hour</option>
            <option>Last 24 Hours</option>
            <option>Last 7 Days</option>
            <option>Last 30 Days</option>
          </select>
          <button
            (click)="refreshMetrics()"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      <!-- Key Metrics -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        @for (metric of metrics(); track metric.name) {
          <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
            <div class="p-4">
              <div class="flex items-center justify-between mb-2">
                <span class="text-sm font-medium text-gray-600 dark:text-gray-400">{{ metric.name }}</span>
                <div class="flex items-center gap-1 text-xs font-medium" [ngClass]="getTrendClass(metric.trend)">
                  @if (metric.trend === 'up') {
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18" />
                    </svg>
                  } @else if (metric.trend === 'down') {
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3" />
                    </svg>
                  }
                  <span>{{ metric.change }}%</span>
                </div>
              </div>
              <div class="flex items-baseline gap-2">
                <span class="text-2xl font-bold text-gray-900 dark:text-white">{{ metric.value }}</span>
                <span class="text-sm text-gray-500 dark:text-gray-400">{{ metric.unit }}</span>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Response Time Chart -->
      <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Average Response Time</h2>
        </div>
        <div class="p-6">
          <div class="h-64 flex items-end justify-between gap-2">
            @for (bar of responseTimeData(); track $index) {
              <div class="flex-1 flex flex-col items-center gap-2">
                <div class="w-full bg-blue-500 rounded-t transition-all duration-300 hover:bg-blue-600" 
                     [style.height.%]="(bar.value / maxResponseTime()) * 100"
                     [title]="bar.value + 'ms'">
                </div>
                <span class="text-xs text-gray-500 dark:text-gray-400">{{ bar.label }}</span>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Database Performance -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Query Performance -->
        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Database Query Performance</h2>
          </div>
          <div class="p-4 space-y-3">
            <div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span class="text-sm text-gray-600 dark:text-gray-400">Average Query Time</span>
              <span class="text-sm font-medium text-gray-900 dark:text-white">12.5ms</span>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span class="text-sm text-gray-600 dark:text-gray-400">Slow Queries (>100ms)</span>
              <span class="text-sm font-medium text-yellow-600 dark:text-yellow-400">3</span>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span class="text-sm text-gray-600 dark:text-gray-400">Total Queries</span>
              <span class="text-sm font-medium text-gray-900 dark:text-white">15,234</span>
            </div>
            <div class="flex items-center justify-between py-2">
              <span class="text-sm text-gray-600 dark:text-gray-400">Connection Pool Usage</span>
              <span class="text-sm font-medium text-gray-900 dark:text-white">45%</span>
            </div>
          </div>
        </div>

        <!-- Cache Performance -->
        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Cache Performance</h2>
          </div>
          <div class="p-4 space-y-3">
            <div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span class="text-sm text-gray-600 dark:text-gray-400">Hit Rate</span>
              <span class="text-sm font-medium text-green-600 dark:text-green-400">87.3%</span>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span class="text-sm text-gray-600 dark:text-gray-400">Miss Rate</span>
              <span class="text-sm font-medium text-gray-900 dark:text-white">12.7%</span>
            </div>
            <div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
              <span class="text-sm text-gray-600 dark:text-gray-400">Total Keys</span>
              <span class="text-sm font-medium text-gray-900 dark:text-white">2,456</span>
            </div>
            <div class="flex items-center justify-between py-2">
              <span class="text-sm text-gray-600 dark:text-gray-400">Memory Usage</span>
              <span class="text-sm font-medium text-gray-900 dark:text-white">234 MB</span>
            </div>
          </div>
        </div>
      </div>

      <!-- API Endpoints -->
      <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Top API Endpoints (by response time)</h2>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Endpoint</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Method</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Avg Response</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Requests</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Errors</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td class="px-4 py-3 text-sm text-gray-900 dark:text-white font-mono">/api/users</td>
                <td class="px-4 py-3 text-sm"><span class="px-2 py-1 text-xs font-semibold rounded bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">GET</span></td>
                <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">45ms</td>
                <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">5,234</td>
                <td class="px-4 py-3 text-sm text-green-600 dark:text-green-400">0</td>
              </tr>
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td class="px-4 py-3 text-sm text-gray-900 dark:text-white font-mono">/api/roles</td>
                <td class="px-4 py-3 text-sm"><span class="px-2 py-1 text-xs font-semibold rounded bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">GET</span></td>
                <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">32ms</td>
                <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">3,112</td>
                <td class="px-4 py-3 text-sm text-green-600 dark:text-green-400">0</td>
              </tr>
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td class="px-4 py-3 text-sm text-gray-900 dark:text-white font-mono">/api/auth/login</td>
                <td class="px-4 py-3 text-sm"><span class="px-2 py-1 text-xs font-semibold rounded bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200">POST</span></td>
                <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">156ms</td>
                <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">1,856</td>
                <td class="px-4 py-3 text-sm text-yellow-600 dark:text-yellow-400">12</td>
              </tr>
              <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td class="px-4 py-3 text-sm text-gray-900 dark:text-white font-mono">/api/permissions</td>
                <td class="px-4 py-3 text-sm"><span class="px-2 py-1 text-xs font-semibold rounded bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-200">GET</span></td>
                <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">28ms</td>
                <td class="px-4 py-3 text-sm text-gray-900 dark:text-white">2,945</td>
                <td class="px-4 py-3 text-sm text-green-600 dark:text-green-400">0</td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class SystemPerformanceComponent implements OnInit {
  private authService = inject(AuthService);

  metrics = signal<PerformanceMetric[]>([
    { name: 'Requests/min', value: 1245, unit: 'req', trend: 'up', change: 12 },
    { name: 'Avg Response', value: 45, unit: 'ms', trend: 'down', change: 8 },
    { name: 'Error Rate', value: 0.3, unit: '%', trend: 'stable', change: 0 },
    { name: 'Uptime', value: 99.9, unit: '%', trend: 'stable', change: 0 }
  ]);

  responseTimeData = signal([
    { label: '00:00', value: 45 },
    { label: '04:00', value: 32 },
    { label: '08:00', value: 78 },
    { label: '12:00', value: 125 },
    { label: '16:00', value: 95 },
    { label: '20:00', value: 67 },
    { label: 'Now', value: 45 }
  ]);

  maxResponseTime = signal(150);

  ngOnInit(): void {
    console.log('⚡ SystemPerformanceComponent initialized');
  }

  refreshMetrics(): void {
    console.log('🔄 Refreshing performance metrics...');
    // In production, this would call the backend API
  }

  getTrendClass(trend: string): string {
    if (trend === 'up') return 'text-green-600 dark:text-green-400';
    if (trend === 'down') return 'text-red-600 dark:text-red-400';
    return 'text-gray-500 dark:text-gray-400';
  }
}
