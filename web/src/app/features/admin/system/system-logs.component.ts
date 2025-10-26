import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../core/services/toast.service';

interface DashboardStats {
  systemLogs: {
    errorCount: number;
    warningCount: number;
    criticalCount: number;
    infoCount: number;
    totalLogs: number;
    avgResponseTime: number;
    uniqueCategories: number;
  };
  auditLogs: {
    loginCount: number;
    createCount: number;
    updateCount: number;
    deleteCount: number;
    totalAudits: number;
    uniqueUsers: number;
    uniqueTenants: number;
  };
  topErrors: Array<{ category: string; count: number }>;
  criticalErrors: Array<any>;
  topUsers: Array<any>;
  timeline: Array<any>;
}

interface SystemLog {
  id: number;
  timestamp: string;
  level: string;
  category: string;
  message: string;
  userEmail?: string;
  tenantName?: string;
  ipAddress?: string;
  responseTimeMs?: number;
  statusCode?: number;
  method?: string;
  endpoint?: string;
}

interface AuditLog {
  id: number;
  timestamp: string;
  action: string;
  resourceType: string;
  resourceId?: string;
  userEmail?: string;
  firstName?: string;
  lastName?: string;
  tenantName?: string;
  description?: string;
  ipAddress?: string;
}

@Component({
  selector: 'app-system-activity-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-4 p-10">
      <!-- Page Header -->
      <div class="flex items-center justify-between">
        <div>
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">System Activity Logs</h2>
          <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">Monitor system logs, audit trails, and activity dashboard</p>
        </div>
        <div class="flex items-center gap-2">
          <!-- Time Range Filter -->
          <select
            [(ngModel)]="timeRange"
            (change)="loadDashboard()"
            class="px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="1h">Last Hour</option>
            <option value="6h">Last 6 Hours</option>
            <option value="24h">Last 24 Hours</option>
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
          </select>
          <button
            (click)="refreshData()"
            type="button"
            class="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded shadow-sm transition text-white bg-blue-600 hover:bg-blue-700"
          >
            <svg class="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <!-- Tabs -->
      <div class="border-b border-gray-200 dark:border-gray-700">
        <nav class="flex gap-4">
          <button
            (click)="switchTab('dashboard')"
            [class]="activeTab() === 'dashboard'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'"
            class="px-3 py-2 text-xs font-medium border-b-2 transition"
          >
            <svg class="w-3.5 h-3.5 inline-block mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            Dashboard
          </button>
          <button
            (click)="switchTab('system')"
            [class]="activeTab() === 'system'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'"
            class="px-3 py-2 text-xs font-medium border-b-2 transition"
          >
            <svg class="w-3.5 h-3.5 inline-block mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            System Logs
          </button>
          <button
            (click)="switchTab('audit')"
            [class]="activeTab() === 'audit'
              ? 'border-blue-500 text-blue-600 dark:text-blue-400'
              : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'"
            class="px-3 py-2 text-xs font-medium border-b-2 transition"
          >
            <svg class="w-3.5 h-3.5 inline-block mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
            </svg>
            Audit Logs
          </button>
        </nav>
      </div>

      <!-- Dashboard Tab Content -->
      <div *ngIf="activeTab() === 'dashboard'" class="space-y-4">
        <!-- Stats Cards Row 1 - System Logs -->
        <div>
          <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-3">System Logs Overview</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Total Logs Card -->
            <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Total Logs</p>
                  <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">{{ dashboardStats()?.systemLogs?.totalLogs || 0 }}</p>
                </div>
                <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                </div>
              </div>
            </div>

            <!-- Errors Card -->
            <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Errors</p>
                  <p class="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{{ dashboardStats()?.systemLogs?.errorCount || 0 }}</p>
                </div>
                <div class="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                  <svg class="w-6 h-6 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                </div>
              </div>
            </div>

            <!-- Warnings Card -->
            <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Warnings</p>
                  <p class="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{{ dashboardStats()?.systemLogs?.warningCount || 0 }}</p>
                </div>
                <div class="w-12 h-12 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                  <svg class="w-6 h-6 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
                  </svg>
                </div>
              </div>
            </div>

            <!-- Avg Response Time Card -->
            <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Avg Response</p>
                  <p class="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{{ (dashboardStats()?.systemLogs?.avgResponseTime || 0).toFixed(0) }}ms</p>
                </div>
                <div class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Stats Cards Row 2 - Audit Logs -->
        <div>
          <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-3">Audit Activity Overview</h3>
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <!-- Total Audits Card -->
            <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Total Actions</p>
                  <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">{{ dashboardStats()?.auditLogs?.totalAudits || 0 }}</p>
                </div>
                <div class="w-12 h-12 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                  <svg class="w-6 h-6 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
                  </svg>
                </div>
              </div>
            </div>

            <!-- Logins Card -->
            <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Logins</p>
                  <p class="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">{{ dashboardStats()?.auditLogs?.loginCount || 0 }}</p>
                </div>
                <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                  <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1"/>
                  </svg>
                </div>
              </div>
            </div>

            <!-- Active Users Card -->
            <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Active Users</p>
                  <p class="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{{ dashboardStats()?.auditLogs?.uniqueUsers || 0 }}</p>
                </div>
                <div class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                  <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                  </svg>
                </div>
              </div>
            </div>

            <!-- Active Tenants Card -->
            <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Active Tenants</p>
                  <p class="text-2xl font-bold text-orange-600 dark:text-orange-400 mt-1">{{ dashboardStats()?.auditLogs?.uniqueTenants || 0 }}</p>
                </div>
                <div class="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                  <svg class="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4"/>
                  </svg>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- Recent Critical Errors -->
        <div *ngIf="dashboardStats()?.criticalErrors && (dashboardStats()?.criticalErrors?.length ?? 0) > 0" class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <svg class="w-4 h-4 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"/>
            </svg>
            Recent Critical Errors
          </h3>
          <div class="space-y-2">
            <div *ngFor="let error of dashboardStats()?.criticalErrors" class="text-xs p-2 bg-red-50 dark:bg-red-900/20 rounded border border-red-200 dark:border-red-800">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <span class="font-medium text-red-900 dark:text-red-300">{{ error.category }}</span>
                  <p class="text-red-700 dark:text-red-400 mt-1">{{ error.message }}</p>
                </div>
                <span class="text-red-600 dark:text-red-400 text-xs">{{ formatDate(error.timestamp) }}</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- System Logs Tab Content -->
      <div *ngIf="activeTab() === 'system'" class="space-y-4">
        <!-- Filters -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Log Level</label>
              <select
                [(ngModel)]="systemFilters.level"
                (change)="loadSystemLogs()"
                class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Levels</option>
                <option value="error">Error</option>
                <option value="warn">Warning</option>
                <option value="info">Info</option>
                <option value="debug">Debug</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
              <select
                [(ngModel)]="systemFilters.category"
                (change)="loadSystemLogs()"
                class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Categories</option>
                <option value="api">API</option>
                <option value="database">Database</option>
                <option value="auth">Authentication</option>
                <option value="payment">Payment</option>
                <option value="system">System</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
              <input
                type="text"
                [(ngModel)]="systemFilters.search"
                (ngModelChange)="loadSystemLogs()"
                placeholder="Search message..."
                class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Page Size</label>
              <select
                [(ngModel)]="systemPagination.limit"
                (change)="systemPagination.page = 1; loadSystemLogs()"
                class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option [value]="10">10</option>
                <option [value]="25">25</option>
                <option [value]="50">50</option>
                <option [value]="100">100</option>
              </select>
            </div>

            <div class="flex items-end">
              <button
                (click)="clearSystemFilters()"
                type="button"
                class="w-full px-3 py-1.5 text-xs font-medium rounded transition bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        <!-- System Logs Table -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th class="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Timestamp</th>
                  <th class="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Level</th>
                  <th class="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Category</th>
                  <th class="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Message</th>
                  <th class="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">User</th>
                  <th class="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Endpoint</th>
                  <th class="px-3 py-2 text-right font-medium text-gray-700 dark:text-gray-300">Response Time</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr *ngIf="loading()" class="text-center">
                  <td colspan="7" class="px-3 py-8 text-gray-500 dark:text-gray-400">Loading...</td>
                </tr>
                <tr *ngIf="!loading() && systemLogs().length === 0" class="text-center">
                  <td colspan="7" class="px-3 py-8 text-gray-500 dark:text-gray-400">No system logs found</td>
                </tr>
                <tr *ngFor="let log of systemLogs()" class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td class="px-3 py-2 text-gray-900 dark:text-white whitespace-nowrap">{{ formatDate(log.timestamp) }}</td>
                  <td class="px-3 py-2">
                    <span [class]="getLogLevelClass(log.level)" class="px-2 py-0.5 rounded font-medium">
                      {{ log.level }}
                    </span>
                  </td>
                  <td class="px-3 py-2 text-gray-600 dark:text-gray-400">{{ log.category }}</td>
                  <td class="px-3 py-2 text-gray-900 dark:text-white max-w-md truncate">{{ log.message }}</td>
                  <td class="px-3 py-2 text-gray-600 dark:text-gray-400">{{ log.userEmail || '-' }}</td>
                  <td class="px-3 py-2 text-gray-600 dark:text-gray-400 font-mono">{{ log.endpoint || '-' }}</td>
                  <td class="px-3 py-2 text-right text-gray-900 dark:text-white">{{ log.responseTimeMs ? log.responseTimeMs + 'ms' : '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div class="text-xs text-gray-600 dark:text-gray-400">
              Showing {{ (systemPagination.page - 1) * systemPagination.limit + 1 }} - {{ Math.min(systemPagination.page * systemPagination.limit, systemPagination.total) }} of {{ systemPagination.total }}
            </div>
            <div class="flex items-center gap-2">
              <button
                (click)="systemPagination.page = systemPagination.page - 1; loadSystemLogs()"
                [disabled]="systemPagination.page === 1"
                class="px-3 py-1.5 text-xs font-medium rounded shadow-sm transition bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span class="text-xs text-gray-600 dark:text-gray-400">
                Page {{ systemPagination.page }} of {{ systemPagination.totalPages }}
              </span>
              <button
                (click)="systemPagination.page = systemPagination.page + 1; loadSystemLogs()"
                [disabled]="systemPagination.page >= systemPagination.totalPages"
                class="px-3 py-1.5 text-xs font-medium rounded shadow-sm transition bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Audit Logs Tab Content -->
      <div *ngIf="activeTab() === 'audit'" class="space-y-4">
        <!-- Filters -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Action</label>
              <select
                [(ngModel)]="auditFilters.action"
                (change)="loadAuditLogs()"
                class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Actions</option>
                <option value="create">Create</option>
                <option value="read">Read</option>
                <option value="update">Update</option>
                <option value="delete">Delete</option>
                <option value="login">Login</option>
                <option value="logout">Logout</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Resource Type</label>
              <select
                [(ngModel)]="auditFilters.resourceType"
                (change)="loadAuditLogs()"
                class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">All Resources</option>
                <option value="user">User</option>
                <option value="tenant">Tenant</option>
                <option value="subscription">Subscription</option>
                <option value="role">Role</option>
                <option value="permission">Permission</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
              <input
                type="text"
                [(ngModel)]="auditFilters.search"
                (ngModelChange)="loadAuditLogs()"
                placeholder="Search description..."
                class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Page Size</label>
              <select
                [(ngModel)]="auditPagination.limit"
                (change)="auditPagination.page = 1; loadAuditLogs()"
                class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option [value]="10">10</option>
                <option [value]="25">25</option>
                <option [value]="50">50</option>
                <option [value]="100">100</option>
              </select>
            </div>

            <div class="flex items-end">
              <button
                (click)="clearAuditFilters()"
                type="button"
                class="w-full px-3 py-1.5 text-xs font-medium rounded transition bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        <!-- Audit Logs Table -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-xs">
              <thead class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th class="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Timestamp</th>
                  <th class="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">User</th>
                  <th class="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Action</th>
                  <th class="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Resource</th>
                  <th class="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Description</th>
                  <th class="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">Tenant</th>
                  <th class="px-3 py-2 text-left font-medium text-gray-700 dark:text-gray-300">IP Address</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                <tr *ngIf="loading()" class="text-center">
                  <td colspan="7" class="px-3 py-8 text-gray-500 dark:text-gray-400">Loading...</td>
                </tr>
                <tr *ngIf="!loading() && auditLogs().length === 0" class="text-center">
                  <td colspan="7" class="px-3 py-8 text-gray-500 dark:text-gray-400">No audit logs found</td>
                </tr>
                <tr *ngFor="let log of auditLogs()" class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td class="px-3 py-2 text-gray-900 dark:text-white whitespace-nowrap">{{ formatDate(log.timestamp) }}</td>
                  <td class="px-3 py-2 text-gray-900 dark:text-white">
                    {{ log.firstName && log.lastName ? (log.firstName + ' ' + log.lastName) : (log.userEmail || '-') }}
                  </td>
                  <td class="px-3 py-2">
                    <span [class]="getActionClass(log.action)" class="px-2 py-0.5 rounded font-medium capitalize">
                      {{ log.action }}
                    </span>
                  </td>
                  <td class="px-3 py-2 text-gray-600 dark:text-gray-400 capitalize">{{ log.resourceType }}</td>
                  <td class="px-3 py-2 text-gray-900 dark:text-white max-w-md truncate">{{ log.description || '-' }}</td>
                  <td class="px-3 py-2 text-gray-600 dark:text-gray-400">{{ log.tenantName || '-' }}</td>
                  <td class="px-3 py-2 text-gray-600 dark:text-gray-400 font-mono">{{ log.ipAddress || '-' }}</td>
                </tr>
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
            <div class="text-xs text-gray-600 dark:text-gray-400">
              Showing {{ (auditPagination.page - 1) * auditPagination.limit + 1 }} - {{ Math.min(auditPagination.page * auditPagination.limit, auditPagination.total) }} of {{ auditPagination.total }}
            </div>
            <div class="flex items-center gap-2">
              <button
                (click)="auditPagination.page = auditPagination.page - 1; loadAuditLogs()"
                [disabled]="auditPagination.page === 1"
                class="px-3 py-1.5 text-xs font-medium rounded shadow-sm transition bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Previous
              </button>
              <span class="text-xs text-gray-600 dark:text-gray-400">
                Page {{ auditPagination.page }} of {{ auditPagination.totalPages }}
              </span>
              <button
                (click)="auditPagination.page = auditPagination.page + 1; loadAuditLogs()"
                [disabled]="auditPagination.page >= auditPagination.totalPages"
                class="px-3 py-1.5 text-xs font-medium rounded shadow-sm transition bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
})
export class SystemActivityLogsComponent implements OnInit {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);

  // State
  activeTab = signal<'dashboard' | 'system' | 'audit'>('dashboard');
  timeRange = '24h';
  loading = signal<boolean>(false);

  // Dashboard data
  dashboardStats = signal<DashboardStats | null>(null);

  // System Logs
  systemLogs = signal<SystemLog[]>([]);
  systemFilters = {
    level: '',
    category: '',
    search: '',
  };
  systemPagination = {
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  };

  // Audit Logs
  auditLogs = signal<AuditLog[]>([]);
  auditFilters = {
    action: '',
    resourceType: '',
    search: '',
  };
  auditPagination = {
    page: 1,
    limit: 25,
    total: 0,
    totalPages: 0,
  };

  // Make Math available in template
  Math = Math;

  ngOnInit(): void {
    this.loadDashboard();
  }

  loadDashboard(): void {
    this.loading.set(true);
    this.http.get<{ success: boolean; data: DashboardStats }>(`/api/system-logs/dashboard?timeRange=${this.timeRange}`)
      .subscribe({
        next: (response) => {
          this.dashboardStats.set(response.data);
          this.loading.set(false);
        },
        error: (err) => {
          console.error('Error loading dashboard:', err);
          this.toastService.error(err.error?.message || 'Failed to load dashboard');
          this.loading.set(false);
        },
      });
  }

  loadSystemLogs(): void {
    this.loading.set(true);
    const params = new URLSearchParams({
      page: this.systemPagination.page.toString(),
      limit: this.systemPagination.limit.toString(),
      timeRange: this.timeRange,
      ...(this.systemFilters.level && { level: this.systemFilters.level }),
      ...(this.systemFilters.category && { category: this.systemFilters.category }),
      ...(this.systemFilters.search && { search: this.systemFilters.search }),
    });

    this.http.get<{ success: boolean; data: { logs: SystemLog[]; total: number; page: number; totalPages: number } }>(
      `/api/system-logs/system?${params.toString()}`
    ).subscribe({
      next: (response) => {
        this.systemLogs.set(response.data.logs);
        this.systemPagination.total = response.data.total;
        this.systemPagination.totalPages = response.data.totalPages;
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading system logs:', err);
        this.toastService.error(err.error?.message || 'Failed to load system logs');
        this.loading.set(false);
      },
    });
  }

  loadAuditLogs(): void {
    this.loading.set(true);
    const params = new URLSearchParams({
      page: this.auditPagination.page.toString(),
      limit: this.auditPagination.limit.toString(),
      timeRange: this.timeRange,
      ...(this.auditFilters.action && { action: this.auditFilters.action }),
      ...(this.auditFilters.resourceType && { resourceType: this.auditFilters.resourceType }),
      ...(this.auditFilters.search && { search: this.auditFilters.search }),
    });

    this.http.get<{ success: boolean; data: { logs: AuditLog[]; total: number; page: number; totalPages: number } }>(
      `/api/system-logs/audit?${params.toString()}`
    ).subscribe({
      next: (response) => {
        this.auditLogs.set(response.data.logs);
        this.auditPagination.total = response.data.total;
        this.auditPagination.totalPages = response.data.totalPages;
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading audit logs:', err);
        this.toastService.error(err.error?.message || 'Failed to load audit logs');
        this.loading.set(false);
      },
    });
  }

  switchTab(tab: 'dashboard' | 'system' | 'audit'): void {
    this.activeTab.set(tab);

    // Load data for System/Audit tabs on first view
    if (tab === 'system' && this.systemLogs().length === 0) {
      this.loadSystemLogs();
    } else if (tab === 'audit' && this.auditLogs().length === 0) {
      this.loadAuditLogs();
    }
  }

  refreshData(): void {
    if (this.activeTab() === 'dashboard') {
      this.loadDashboard();
    } else if (this.activeTab() === 'system') {
      this.loadSystemLogs();
    } else if (this.activeTab() === 'audit') {
      this.loadAuditLogs();
    }
    this.toastService.success('Data refreshed successfully');
  }

  clearSystemFilters(): void {
    this.systemFilters = { level: '', category: '', search: '' };
    this.systemPagination.page = 1;
    this.loadSystemLogs();
  }

  clearAuditFilters(): void {
    this.auditFilters = { action: '', resourceType: '', search: '' };
    this.auditPagination.page = 1;
    this.loadAuditLogs();
  }

  getLogLevelClass(level: string): string {
    const classes: Record<string, string> = {
      'error': 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300',
      'warn': 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300',
      'info': 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
      'debug': 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300',
    };
    return classes[level] || classes['info'];
  }

  getActionClass(action: string): string {
    const classes: Record<string, string> = {
      'create': 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300',
      'read': 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
      'update': 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300',
      'delete': 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300',
      'login': 'bg-purple-100 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300',
      'logout': 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300',
    };
    return classes[action] || 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300';
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  }
}
