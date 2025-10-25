import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';

interface SystemInfo {
  version: string;
  uptime: number;
  nodeVersion: string;
  platform: string;
  cpuUsage: number;
  memoryUsage: number;
  diskUsage: number;
}

interface DatabaseStats {
  totalUsers: number;
  totalTenants: number;
  totalRoles: number;
  activeConnections: number;
}

@Component({
  selector: 'app-system-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="p-6 space-y-4">
      <!-- Header -->
      <div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">⚙️ System Settings</h1>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Monitor and configure system settings
        </p>
      </div>

      <!-- Quick Actions -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
        <a
          *ngIf="canViewHealth()"
          routerLink="/admin/system/health"
          class="group p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all"
        >
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded bg-green-100 dark:bg-green-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg class="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div class="min-w-0">
              <p class="text-xs font-medium text-gray-900 dark:text-white">System Health</p>
              <p class="text-[10px] text-gray-500 dark:text-gray-400">View status</p>
            </div>
          </div>
        </a>

        <a
          *ngIf="canViewPerformance()"
          routerLink="/admin/system/performance"
          class="group p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all"
        >
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
            </div>
            <div class="min-w-0">
              <p class="text-xs font-medium text-gray-900 dark:text-white">Performance</p>
              <p class="text-[10px] text-gray-500 dark:text-gray-400">Metrics & stats</p>
            </div>
          </div>
        </a>

        <a
          *ngIf="canManageConfig()"
          routerLink="/admin/system/config"
          class="group p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all"
        >
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg class="w-4 h-4 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </div>
            <div class="min-w-0">
              <p class="text-xs font-medium text-gray-900 dark:text-white">Configuration</p>
              <p class="text-[10px] text-gray-500 dark:text-gray-400">System settings</p>
            </div>
          </div>
        </a>

        <a
          *ngIf="canManageConfig()"
          routerLink="/admin/system/logs"
          class="group p-3 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-blue-500 dark:hover:border-blue-400 hover:shadow-md transition-all"
        >
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center group-hover:scale-110 transition-transform">
              <svg class="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div class="min-w-0">
              <p class="text-xs font-medium text-gray-900 dark:text-white">System Logs</p>
              <p class="text-[10px] text-gray-500 dark:text-gray-400">View logs</p>
            </div>
          </div>
        </a>
      </div>

      <!-- System Information -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <!-- System Stats -->
        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          <div class="px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <h2 class="text-xs font-semibold text-gray-900 dark:text-white">System Information</h2>
          </div>
          <div class="p-3 space-y-2">
            <div class="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-700">
              <span class="text-xs text-gray-600 dark:text-gray-400">Version</span>
              <span class="text-xs font-medium text-gray-900 dark:text-white">{{ systemInfo().version }}</span>
            </div>
            <div class="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-700">
              <span class="text-xs text-gray-600 dark:text-gray-400">Platform</span>
              <span class="text-xs font-medium text-gray-900 dark:text-white">{{ systemInfo().platform }}</span>
            </div>
            <div class="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-700">
              <span class="text-xs text-gray-600 dark:text-gray-400">Node Version</span>
              <span class="text-xs font-medium text-gray-900 dark:text-white">{{ systemInfo().nodeVersion }}</span>
            </div>
            <div class="flex items-center justify-between py-1.5">
              <span class="text-xs text-gray-600 dark:text-gray-400">Uptime</span>
              <span class="text-xs font-medium text-gray-900 dark:text-white">{{ formatUptime(systemInfo().uptime) }}</span>
            </div>
          </div>
        </div>

        <!-- Database Stats -->
        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          <div class="px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <h2 class="text-xs font-semibold text-gray-900 dark:text-white">Database Statistics</h2>
          </div>
          <div class="p-3 space-y-2">
            <div class="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-700">
              <span class="text-xs text-gray-600 dark:text-gray-400">Total Users</span>
              <span class="text-xs font-medium text-gray-900 dark:text-white">{{ dbStats().totalUsers.toLocaleString() }}</span>
            </div>
            <div class="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-700">
              <span class="text-xs text-gray-600 dark:text-gray-400">Total Tenants</span>
              <span class="text-xs font-medium text-gray-900 dark:text-white">{{ dbStats().totalTenants.toLocaleString() }}</span>
            </div>
            <div class="flex items-center justify-between py-1.5 border-b border-gray-100 dark:border-gray-700">
              <span class="text-xs text-gray-600 dark:text-gray-400">Total Roles</span>
              <span class="text-xs font-medium text-gray-900 dark:text-white">{{ dbStats().totalRoles.toLocaleString() }}</span>
            </div>
            <div class="flex items-center justify-between py-1.5">
              <span class="text-xs text-gray-600 dark:text-gray-400">Active Connections</span>
              <span class="text-xs font-medium text-gray-900 dark:text-white">{{ dbStats().activeConnections }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Resource Usage -->
      <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <div class="px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <h2 class="text-xs font-semibold text-gray-900 dark:text-white">Resource Usage</h2>
        </div>
        <div class="p-3 space-y-3">
          <!-- CPU Usage -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-xs font-medium text-gray-700 dark:text-gray-300">CPU Usage</span>
              <span class="text-xs font-semibold" [class]="getCpuColor()">{{ systemInfo().cpuUsage }}%</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div
                class="h-1.5 rounded-full transition-all duration-500"
                [class]="getCpuBarColor()"
                [style.width.%]="systemInfo().cpuUsage">
              </div>
            </div>
          </div>

          <!-- Memory Usage -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-xs font-medium text-gray-700 dark:text-gray-300">Memory Usage</span>
              <span class="text-xs font-semibold" [class]="getMemoryColor()">{{ systemInfo().memoryUsage }}%</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div
                class="h-1.5 rounded-full transition-all duration-500"
                [class]="getMemoryBarColor()"
                [style.width.%]="systemInfo().memoryUsage">
              </div>
            </div>
          </div>

          <!-- Disk Usage -->
          <div>
            <div class="flex items-center justify-between mb-1.5">
              <span class="text-xs font-medium text-gray-700 dark:text-gray-300">Disk Usage</span>
              <span class="text-xs font-semibold" [class]="getDiskColor()">{{ systemInfo().diskUsage }}%</span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5">
              <div
                class="h-1.5 rounded-full transition-all duration-500"
                [class]="getDiskBarColor()"
                [style.width.%]="systemInfo().diskUsage">
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Recent Activity -->
      <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <div class="px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <h2 class="text-xs font-semibold text-gray-900 dark:text-white">Recent System Events</h2>
        </div>
        <div class="p-3">
          <div class="space-y-2">
            <div class="flex items-start gap-2 pb-2 border-b border-gray-100 dark:border-gray-700">
              <div class="w-6 h-6 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
                <svg class="w-3 h-3 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-medium text-gray-900 dark:text-white">System Started</p>
                <p class="text-[10px] text-gray-500 dark:text-gray-400">{{ formatUptime(systemInfo().uptime) }} ago</p>
              </div>
            </div>
            <div class="flex items-start gap-2 pb-2 border-b border-gray-100 dark:border-gray-700">
              <div class="w-6 h-6 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
                <svg class="w-3 h-3 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-medium text-gray-900 dark:text-white">Database Connected</p>
                <p class="text-[10px] text-gray-500 dark:text-gray-400">{{ dbStats().activeConnections }} active connections</p>
              </div>
            </div>
            <div class="flex items-start gap-2">
              <div class="w-6 h-6 rounded-full bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center flex-shrink-0">
                <svg class="w-3 h-3 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-xs font-medium text-gray-900 dark:text-white">Security Check Passed</p>
                <p class="text-[10px] text-gray-500 dark:text-gray-400">All systems operational</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class SystemDashboardComponent implements OnInit {
  private authService = inject(AuthService);

  systemInfo = signal<SystemInfo>({
    version: '1.0.0',
    uptime: 0,
    nodeVersion: 'v18.19.0',
    platform: 'Linux x64',
    cpuUsage: 45,
    memoryUsage: 62,
    diskUsage: 38
  });

  dbStats = signal<DatabaseStats>({
    totalUsers: 0,
    totalTenants: 0,
    totalRoles: 0,
    activeConnections: 5
  });

  // Permission checks
  // Map system dashboard permissions to actual system permission keys present in DB
  // (settings:read and settings:update are used for system settings access)
  canViewHealth = computed(() => this.authService.hasPermission('settings:read'));
  canViewPerformance = computed(() => this.authService.hasPermission('settings:read'));
  canManageConfig = computed(() => this.authService.hasPermission('settings:update'));

  ngOnInit(): void {
    console.log('⚙️ SystemDashboardComponent initialized');
    this.loadSystemInfo();
    this.loadDatabaseStats();

    // Update stats every 30 seconds
    setInterval(() => {
      this.updateResourceUsage();
    }, 30000);
  }

  loadSystemInfo(): void {
    // Simulate loading system info
    // In production, this would call the backend API
    const uptime = Math.floor(Math.random() * 86400 * 7); // Random uptime up to 7 days
    this.systemInfo.update(info => ({ ...info, uptime }));
  }

  loadDatabaseStats(): void {
    // Simulate loading DB stats
    // In production, this would call the backend API
    this.dbStats.set({
      totalUsers: 1247,
      totalTenants: 89,
      totalRoles: 15,
      activeConnections: 5
    });
  }

  updateResourceUsage(): void {
    // Simulate resource usage updates
    this.systemInfo.update(info => ({
      ...info,
      cpuUsage: Math.floor(Math.random() * 100),
      memoryUsage: Math.floor(Math.random() * 100),
      diskUsage: Math.floor(Math.random() * 100),
      uptime: info.uptime + 30
    }));
  }

  formatUptime(seconds: number): string {
    const days = Math.floor(seconds / 86400);
    const hours = Math.floor((seconds % 86400) / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);

    if (days > 0) return `${days}d ${hours}h`;
    if (hours > 0) return `${hours}h ${minutes}m`;
    return `${minutes}m`;
  }

  getCpuColor(): string {
    const usage = this.systemInfo().cpuUsage;
    if (usage >= 80) return 'text-red-600 dark:text-red-400';
    if (usage >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  }

  getCpuBarColor(): string {
    const usage = this.systemInfo().cpuUsage;
    if (usage >= 80) return 'bg-red-500';
    if (usage >= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  }

  getMemoryColor(): string {
    const usage = this.systemInfo().memoryUsage;
    if (usage >= 80) return 'text-red-600 dark:text-red-400';
    if (usage >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  }

  getMemoryBarColor(): string {
    const usage = this.systemInfo().memoryUsage;
    if (usage >= 80) return 'bg-red-500';
    if (usage >= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  }

  getDiskColor(): string {
    const usage = this.systemInfo().diskUsage;
    if (usage >= 80) return 'text-red-600 dark:text-red-400';
    if (usage >= 60) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  }

  getDiskBarColor(): string {
    const usage = this.systemInfo().diskUsage;
    if (usage >= 80) return 'bg-red-500';
    if (usage >= 60) return 'bg-yellow-500';
    return 'bg-green-500';
  }
}
