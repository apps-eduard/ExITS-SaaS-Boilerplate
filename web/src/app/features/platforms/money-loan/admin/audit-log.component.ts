import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../../core/services/toast.service';

interface AuditLog {
  id: string;
  timestamp: string;
  user: string;
  action: string;
  module: string;
  entityType: string;
  entityId: string;
  changes: string;
  ipAddress: string;
  userAgent: string;
  severity: 'low' | 'medium' | 'high' | 'critical';
}

@Component({
  selector: 'app-audit-log',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 md:p-6">
      <div class="mb-4">
        <div class="flex items-center justify-between mb-1">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-gray-500 rounded-lg flex items-center justify-center">
              <span class="text-lg">📜</span>
            </div>
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">Audit Log</h1>
          </div>
          <button (click)="exportAuditLog()" class="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
            📥 Export
          </button>
        </div>
        <p class="text-xs text-gray-600 dark:text-gray-400 ml-11">System activity and security audit trail</p>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
          <p class="text-xs text-blue-600 dark:text-blue-400 mb-0.5">Today's Events</p>
          <p class="text-xl font-bold text-blue-700 dark:text-blue-300">{{ todayEvents() }}</p>
        </div>
        <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
          <p class="text-xs text-green-600 dark:text-green-400 mb-0.5">This Week</p>
          <p class="text-xl font-bold text-green-700 dark:text-green-300">{{ weekEvents() }}</p>
        </div>
        <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
          <p class="text-xs text-orange-600 dark:text-orange-400 mb-0.5">Critical Events</p>
          <p class="text-xl font-bold text-orange-700 dark:text-orange-300">{{ criticalEvents() }}</p>
        </div>
        <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
          <p class="text-xs text-purple-600 dark:text-purple-400 mb-0.5">Unique Users</p>
          <p class="text-xl font-bold text-purple-700 dark:text-purple-300">{{ uniqueUsers() }}</p>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 mb-4">
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <select [(ngModel)]="filterModule" (ngModelChange)="onFilterChange()" class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option value="all">All Modules</option>
            <option value="customers">Customers</option>
            <option value="loans">Loans</option>
            <option value="payments">Payments</option>
            <option value="users">Users</option>
          </select>
          <select [(ngModel)]="filterSeverity" (ngModelChange)="onFilterChange()" class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option value="all">All Severity</option>
            <option value="low">Low</option>
            <option value="medium">Medium</option>
            <option value="high">High</option>
            <option value="critical">Critical</option>
          </select>
          <input type="date" [(ngModel)]="filterDate" (ngModelChange)="onFilterChange()" class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
          <input type="search" [(ngModel)]="searchQuery" (ngModelChange)="onFilterChange()" placeholder="Search user, action..." class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="p-3 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">🔍 Audit Trail</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Timestamp</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">User</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Action</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Module</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase hidden lg:table-cell">Entity</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase hidden xl:table-cell">IP Address</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Severity</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              @for (log of filteredLogs(); track log.id) {
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td class="px-3 py-2 text-xs text-gray-700 dark:text-gray-300">{{ log.timestamp }}</td>
                  <td class="px-3 py-2 text-gray-900 dark:text-white font-medium">{{ log.user }}</td>
                  <td class="px-3 py-2 text-gray-700 dark:text-gray-300">{{ log.action }}</td>
                  <td class="px-3 py-2">
                    <span class="px-2 py-0.5 text-xs font-semibold bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-400 rounded">
                      {{ log.module }}
                    </span>
                  </td>
                  <td class="px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hidden lg:table-cell">{{ log.entityType }} #{{ log.entityId }}</td>
                  <td class="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 font-mono hidden xl:table-cell">{{ log.ipAddress }}</td>
                  <td class="px-3 py-2">
                    <span [class]="getSeverityClass(log.severity)" class="px-2 py-0.5 text-xs font-semibold rounded">
                      {{ log.severity }}
                    </span>
                  </td>
                  <td class="px-3 py-2">
                    <button (click)="viewDetails(log)" class="px-2 py-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded">👁️</button>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class AuditLogComponent {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);

  filterModule = 'all';
  filterSeverity = 'all';
  filterDate = '';
  searchQuery = '';

  auditLogs = signal<AuditLog[]>([
    {
      id: '1',
      timestamp: '2024-11-03 14:32:15',
      user: 'admin@example.com',
      action: 'Updated loan status',
      module: 'loans',
      entityType: 'Loan',
      entityId: 'LN-2024-001',
      changes: 'Status: pending → approved',
      ipAddress: '192.168.1.100',
      userAgent: 'Mozilla/5.0',
      severity: 'medium'
    },
    {
      id: '2',
      timestamp: '2024-11-03 13:15:22',
      user: 'collector@example.com',
      action: 'Failed login attempt',
      module: 'users',
      entityType: 'User',
      entityId: 'USER-123',
      changes: 'Invalid password',
      ipAddress: '203.0.113.42',
      userAgent: 'Chrome/120.0',
      severity: 'high'
    },
    {
      id: '3',
      timestamp: '2024-11-03 12:05:33',
      user: 'system',
      action: 'Auto-escalated overdue account',
      module: 'collections',
      entityType: 'Account',
      entityId: 'ACC-5678',
      changes: 'Stage: warning → pre-legal',
      ipAddress: '127.0.0.1',
      userAgent: 'System/1.0',
      severity: 'low'
    }
  ]);

  todayEvents = computed(() => this.auditLogs().length);
  weekEvents = computed(() => this.auditLogs().length * 7);
  criticalEvents = computed(() => this.auditLogs().filter(l => l.severity === 'critical').length);
  uniqueUsers = computed(() => new Set(this.auditLogs().map(l => l.user)).size);

  filteredLogs = computed(() => {
    let logs = this.auditLogs();
    
    if (this.filterModule !== 'all') {
      logs = logs.filter(l => l.module === this.filterModule);
    }
    
    if (this.filterSeverity !== 'all') {
      logs = logs.filter(l => l.severity === this.filterSeverity);
    }
    
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      logs = logs.filter(l => 
        l.user.toLowerCase().includes(query) || 
        l.action.toLowerCase().includes(query)
      );
    }
    
    return logs;
  });

  onFilterChange() {
    // Filters computed automatically
  }

  viewDetails(log: AuditLog) {
    this.toastService.info(`Viewing details for log: ${log.id}`);
  }

  exportAuditLog() {
    this.toastService.info('Exporting audit log...');
  }

  getSeverityClass(severity: string): string {
    const classes: Record<string, string> = {
      low: 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      medium: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      high: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      critical: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    };
    return classes[severity] || '';
  }
}
