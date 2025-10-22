import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

interface LogEntry {
  timestamp: Date;
  level: 'info' | 'warning' | 'error' | 'debug';
  message: string;
  source: string;
  details?: string;
}

@Component({
  selector: 'app-system-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6 space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">📋 System Logs</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            View and filter system activity logs
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button
            (click)="clearLogs()"
            class="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 border border-red-300 dark:border-red-600 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-colors"
          >
            🗑️ Clear Logs
          </button>
          <button
            (click)="refreshLogs()"
            class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors"
          >
            🔄 Refresh
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <div class="p-4">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Level</label>
              <select
                [(ngModel)]="selectedLevel"
                (change)="filterLogs()"
                class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Levels</option>
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="error">Error</option>
                <option value="debug">Debug</option>
              </select>
            </div>
            
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Source</label>
              <select
                [(ngModel)]="selectedSource"
                (change)="filterLogs()"
                class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              >
                <option value="">All Sources</option>
                <option value="API">API</option>
                <option value="Database">Database</option>
                <option value="Auth">Authentication</option>
                <option value="Cache">Cache</option>
                <option value="Email">Email</option>
              </select>
            </div>
            
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Time Range</label>
              <select class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                <option>Last Hour</option>
                <option>Last 24 Hours</option>
                <option>Last 7 Days</option>
                <option>Last 30 Days</option>
              </select>
            </div>
            
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (input)="filterLogs()"
                placeholder="Search logs..."
                class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Log Stats -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <span class="text-blue-600 dark:text-blue-400 font-semibold">ℹ️</span>
            </div>
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">Info</p>
              <p class="text-lg font-bold text-gray-900 dark:text-white">{{ countByLevel('info') }}</p>
            </div>
          </div>
        </div>
        
        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
              <span class="text-yellow-600 dark:text-yellow-400 font-semibold">⚠️</span>
            </div>
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">Warning</p>
              <p class="text-lg font-bold text-gray-900 dark:text-white">{{ countByLevel('warning') }}</p>
            </div>
          </div>
        </div>
        
        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
              <span class="text-red-600 dark:text-red-400 font-semibold">❌</span>
            </div>
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">Error</p>
              <p class="text-lg font-bold text-gray-900 dark:text-white">{{ countByLevel('error') }}</p>
            </div>
          </div>
        </div>
        
        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <span class="text-gray-600 dark:text-gray-400 font-semibold">🐛</span>
            </div>
            <div>
              <p class="text-sm text-gray-600 dark:text-gray-400">Debug</p>
              <p class="text-lg font-bold text-gray-900 dark:text-white">{{ countByLevel('debug') }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Log Entries -->
      <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 flex items-center justify-between">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white">
            Log Entries ({{ filteredLogs().length }})
          </h2>
          <button
            (click)="toggleAutoRefresh()"
            class="px-3 py-1 text-xs font-medium rounded"
            [ngClass]="autoRefresh() 
              ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' 
              : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'"
          >
            {{ autoRefresh() ? '● Live' : '○ Paused' }}
          </button>
        </div>
        
        <div class="divide-y divide-gray-200 dark:divide-gray-700 max-h-[600px] overflow-y-auto">
          @for (log of filteredLogs(); track $index) {
            <div class="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
              <div class="flex items-start gap-3">
                <div class="flex-shrink-0 mt-1">
                  <span
                    class="inline-flex items-center px-2 py-1 text-xs font-semibold rounded"
                    [ngClass]="getLevelClass(log.level)"
                  >
                    {{ log.level.toUpperCase() }}
                  </span>
                </div>
                
                <div class="flex-1 min-w-0">
                  <div class="flex items-start justify-between gap-4 mb-1">
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ log.message }}</p>
                    <span class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap">
                      {{ formatTimestamp(log.timestamp) }}
                    </span>
                  </div>
                  
                  <div class="flex items-center gap-4 text-xs text-gray-500 dark:text-gray-400">
                    <span class="flex items-center gap-1">
                      <span class="font-medium">Source:</span>
                      <span>{{ log.source }}</span>
                    </span>
                  </div>
                  
                  @if (log.details) {
                    <pre class="mt-2 p-2 text-xs bg-gray-100 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700 overflow-x-auto">{{ log.details }}</pre>
                  }
                </div>
              </div>
            </div>
          } @empty {
            <div class="p-8 text-center">
              <p class="text-sm text-gray-500 dark:text-gray-400">No log entries found</p>
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class SystemLogsComponent implements OnInit {
  private authService = inject(AuthService);

  selectedLevel = '';
  selectedSource = '';
  searchQuery = '';
  autoRefresh = signal(false);

  logs = signal<LogEntry[]>([
    { timestamp: new Date(), level: 'info', message: 'User authentication successful', source: 'Auth' },
    { timestamp: new Date(Date.now() - 60000), level: 'info', message: 'Database connection established', source: 'Database' },
    { timestamp: new Date(Date.now() - 120000), level: 'warning', message: 'High memory usage detected', source: 'API', details: 'Memory usage: 78%' },
    { timestamp: new Date(Date.now() - 180000), level: 'info', message: 'Cache cleared successfully', source: 'Cache' },
    { timestamp: new Date(Date.now() - 240000), level: 'error', message: 'Email delivery failed', source: 'Email', details: 'SMTP connection timeout' },
    { timestamp: new Date(Date.now() - 300000), level: 'debug', message: 'API request processed', source: 'API', details: 'GET /api/users - 200 OK' },
    { timestamp: new Date(Date.now() - 360000), level: 'info', message: 'Role permissions updated', source: 'API' },
    { timestamp: new Date(Date.now() - 420000), level: 'warning', message: 'Slow query detected', source: 'Database', details: 'Query time: 2.5s' },
    { timestamp: new Date(Date.now() - 480000), level: 'info', message: 'Backup completed successfully', source: 'Database' },
    { timestamp: new Date(Date.now() - 540000), level: 'error', message: 'Failed login attempt', source: 'Auth', details: 'User: admin@example.com' }
  ]);

  filteredLogs = signal<LogEntry[]>([]);

  ngOnInit(): void {
    console.log('📋 SystemLogsComponent initialized');
    this.filterLogs();
  }

  filterLogs(): void {
    let filtered = this.logs();

    if (this.selectedLevel) {
      filtered = filtered.filter(log => log.level === this.selectedLevel);
    }

    if (this.selectedSource) {
      filtered = filtered.filter(log => log.source === this.selectedSource);
    }

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(log =>
        log.message.toLowerCase().includes(query) ||
        log.source.toLowerCase().includes(query) ||
        log.details?.toLowerCase().includes(query)
      );
    }

    this.filteredLogs.set(filtered);
  }

  refreshLogs(): void {
    console.log('🔄 Refreshing logs...');
    // In production, this would call the backend API
  }

  clearLogs(): void {
    if (confirm('Are you sure you want to clear all logs? This action cannot be undone.')) {
      this.logs.set([]);
      this.filterLogs();
      console.log('🗑️ Logs cleared');
    }
  }

  toggleAutoRefresh(): void {
    this.autoRefresh.update(v => !v);
    console.log('Auto-refresh:', this.autoRefresh() ? 'enabled' : 'disabled');
  }

  countByLevel(level: string): number {
    return this.logs().filter(log => log.level === level).length;
  }

  getLevelClass(level: string): string {
    switch (level) {
      case 'info':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      case 'warning':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      case 'error':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      case 'debug':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  }

  formatTimestamp(date: Date): string {
    const now = new Date();
    const diff = Math.floor((now.getTime() - date.getTime()) / 1000);

    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    
    return date.toLocaleString();
  }
}
