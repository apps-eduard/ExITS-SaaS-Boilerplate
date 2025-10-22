import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AuthService } from '../../../core/services/auth.service';

interface HealthCheck {
  service: string;
  status: 'healthy' | 'degraded' | 'unhealthy';
  responseTime: number;
  lastCheck: Date;
  message?: string;
}

@Component({
  selector: 'app-system-health',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-6 space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">🏥 System Health</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Monitor the health status of all system services
          </p>
        </div>
        <button
          (click)="refreshHealth()"
          class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
        >
          🔄 Refresh
        </button>
      </div>

      <!-- Overall Status -->
      <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <div class="p-6">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-full flex items-center justify-center" [ngClass]="getOverallStatusClass()">
              <svg class="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <h2 class="text-2xl font-bold text-gray-900 dark:text-white">{{ getOverallStatus() }}</h2>
              <p class="text-sm text-gray-500 dark:text-gray-400">
                {{ healthyCount() }}/{{ healthChecks().length }} services healthy
              </p>
            </div>
          </div>
        </div>
      </div>

      <!-- Health Checks -->
      <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
        @for (check of healthChecks(); track check.service) {
          <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
            <div class="p-4">
              <div class="flex items-start justify-between mb-3">
                <div class="flex items-center gap-3">
                  <div class="w-10 h-10 rounded-full flex items-center justify-center" [ngClass]="getStatusClass(check.status)">
                    <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      @if (check.status === 'healthy') {
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      } @else if (check.status === 'degraded') {
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                      } @else {
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                      }
                    </svg>
                  </div>
                  <div>
                    <h3 class="text-sm font-semibold text-gray-900 dark:text-white">{{ check.service }}</h3>
                    <p class="text-xs" [ngClass]="getStatusTextClass(check.status)">{{ check.status.toUpperCase() }}</p>
                  </div>
                </div>
                <span class="text-xs text-gray-500 dark:text-gray-400">{{ check.responseTime }}ms</span>
              </div>
              
              @if (check.message) {
                <p class="text-xs text-gray-600 dark:text-gray-400 mb-2">{{ check.message }}</p>
              }
              
              <div class="flex items-center justify-between text-xs text-gray-500 dark:text-gray-400">
                <span>Last checked</span>
                <span>{{ formatTime(check.lastCheck) }}</span>
              </div>
            </div>
          </div>
        }
      </div>

      <!-- Quick Actions -->
      <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Quick Actions</h2>
        </div>
        <div class="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <button class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
            Run Diagnostics
          </button>
          <button class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
            Clear Cache
          </button>
          <button class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
            Restart Services
          </button>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class SystemHealthComponent implements OnInit {
  private authService = inject(AuthService);

  healthChecks = signal<HealthCheck[]>([
    {
      service: 'API Server',
      status: 'healthy',
      responseTime: 45,
      lastCheck: new Date(),
      message: 'All endpoints responding normally'
    },
    {
      service: 'Database',
      status: 'healthy',
      responseTime: 12,
      lastCheck: new Date(),
      message: 'Connection pool healthy, 5 active connections'
    },
    {
      service: 'Redis Cache',
      status: 'healthy',
      responseTime: 8,
      lastCheck: new Date(),
      message: 'Cache hit ratio: 87%'
    },
    {
      service: 'Email Service',
      status: 'degraded',
      responseTime: 234,
      lastCheck: new Date(),
      message: 'Slow response times detected'
    },
    {
      service: 'File Storage',
      status: 'healthy',
      responseTime: 56,
      lastCheck: new Date(),
      message: 'Storage usage: 38%'
    },
    {
      service: 'Background Jobs',
      status: 'healthy',
      responseTime: 23,
      lastCheck: new Date(),
      message: '12 jobs queued, 3 processing'
    }
  ]);

  healthyCount = computed(() => 
    this.healthChecks().filter(check => check.status === 'healthy').length
  );

  ngOnInit(): void {
    console.log('🏥 SystemHealthComponent initialized');
  }

  refreshHealth(): void {
    console.log('🔄 Refreshing health checks...');
    // In production, this would call the backend API
    this.healthChecks.update(checks =>
      checks.map(check => ({
        ...check,
        lastCheck: new Date(),
        responseTime: Math.floor(Math.random() * 300) + 5
      }))
    );
  }

  getOverallStatus(): string {
    const checks = this.healthChecks();
    const unhealthy = checks.filter(c => c.status === 'unhealthy').length;
    const degraded = checks.filter(c => c.status === 'degraded').length;

    if (unhealthy > 0) return 'System Unhealthy';
    if (degraded > 0) return 'System Degraded';
    return 'All Systems Operational';
  }

  getOverallStatusClass(): string {
    const status = this.getOverallStatus();
    if (status.includes('Unhealthy')) return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
    if (status.includes('Degraded')) return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400';
    return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
  }

  getStatusClass(status: string): string {
    if (status === 'healthy') return 'bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400';
    if (status === 'degraded') return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-600 dark:text-yellow-400';
    return 'bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400';
  }

  getStatusTextClass(status: string): string {
    if (status === 'healthy') return 'text-green-600 dark:text-green-400';
    if (status === 'degraded') return 'text-yellow-600 dark:text-yellow-400';
    return 'text-red-600 dark:text-red-400';
  }

  formatTime(date: Date): string {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    return `${Math.floor(diff / 3600)}h ago`;
  }
}
