import { Component, OnInit, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface Stat {
  label: string;
  value: string | number;
  icon: string;
  trend?: string;
  trendUp?: boolean;
  color: string;
}

interface QuickAction {
  label: string;
  icon: string;
  route: string;
  color: string;
}

@Component({
  selector: 'app-tenant-dashboard',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-6 space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            Welcome back, {{ getFirstName() }}! 👋
          </h1>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            Here's what's happening with your business today
          </p>
        </div>
        <div class="text-right">
          <p class="text-xs text-gray-500 dark:text-gray-400">{{ getCurrentDate() }}</p>
          <p class="text-sm font-medium text-gray-900 dark:text-white">{{ tenantName() }}</p>
        </div>
      </div>

      <!-- Stats Grid -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <div *ngFor="let stat of stats()" 
          class="rounded-lg border p-4 bg-white dark:bg-gray-800 dark:border-gray-700 hover:shadow-lg transition">
          <div class="flex items-start justify-between">
            <div class="flex-1">
              <p class="text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {{ stat.label }}
              </p>
              <p class="text-2xl font-bold" [class]="'text-' + stat.color + '-600 dark:text-' + stat.color + '-400'">
                {{ stat.value }}
              </p>
              <p *ngIf="stat.trend" 
                class="text-xs mt-2 flex items-center gap-1"
                [class.text-green-600]="stat.trendUp"
                [class.text-red-600]="!stat.trendUp">
                <span>{{ stat.trendUp ? '↑' : '↓' }}</span>
                <span>{{ stat.trend }}</span>
              </p>
            </div>
            <div class="text-3xl">{{ stat.icon }}</div>
          </div>
        </div>
      </div>

      <!-- Quick Actions -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
        <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
        <div class="grid grid-cols-2 md:grid-cols-4 gap-3">
          <a *ngFor="let action of quickActions()"
            [routerLink]="action.route"
            class="flex flex-col items-center gap-2 p-4 rounded-lg border-2 border-dashed hover:border-solid transition"
            [class]="'border-' + action.color + '-300 hover:bg-' + action.color + '-50 dark:border-' + action.color + '-700 dark:hover:bg-' + action.color + '-900/20'">
            <span class="text-3xl">{{ action.icon }}</span>
            <span class="text-sm font-medium text-gray-900 dark:text-white text-center">
              {{ action.label }}
            </span>
          </a>
        </div>
      </div>

      <!-- Recent Activity & Active Modules -->
      <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <!-- Recent Activity -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Recent Activity</h2>
          <div class="space-y-3">
            <div *ngFor="let activity of recentActivity()" class="flex items-start gap-3 pb-3 border-b dark:border-gray-700 last:border-0">
              <div class="text-2xl">{{ activity.icon }}</div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-white">
                  {{ activity.title }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400">
                  {{ activity.description }}
                </p>
                <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">
                  {{ activity.time }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Active Modules -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Active Modules</h2>
          <div class="space-y-3">
            <div *ngFor="let module of activeModules()" 
              class="flex items-center justify-between p-3 rounded-lg bg-gray-50 dark:bg-gray-900/50">
              <div class="flex items-center gap-3">
                <span class="text-2xl">{{ module.icon }}</span>
                <div>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ module.name }}
                  </p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ module.usage }}
                  </p>
                </div>
              </div>
              <a [routerLink]="module.route" 
                class="text-xs font-medium text-blue-600 dark:text-blue-400 hover:underline">
                View →
              </a>
            </div>
          </div>
        </div>
      </div>

      <!-- Upcoming Tasks / Notifications -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border dark:border-gray-700 p-6">
        <div class="flex items-center justify-between mb-4">
          <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Upcoming Tasks</h2>
          <button class="text-sm text-blue-600 dark:text-blue-400 hover:underline">
            View All
          </button>
        </div>
        <div class="space-y-2">
          <div *ngFor="let task of upcomingTasks()" 
            class="flex items-center gap-3 p-3 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-900/50 transition">
            <input type="checkbox" class="w-4 h-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500">
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900 dark:text-white">{{ task.title }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">{{ task.dueDate }}</p>
            </div>
            <span class="px-2 py-1 text-xs rounded-full" 
              [class]="'bg-' + task.priority + '-100 text-' + task.priority + '-700 dark:bg-' + task.priority + '-900/30 dark:text-' + task.priority + '-400'">
              {{ task.priority }}
            </span>
          </div>
        </div>
      </div>
    </div>
  `
})
export class TenantDashboardComponent implements OnInit {
  authService = inject(AuthService);
  
  tenantName = signal('My Business');
  
  stats = signal<Stat[]>([
    { label: 'Total Loans', value: '₱2.5M', icon: '💰', trend: '+12.5%', trendUp: true, color: 'green' },
    { label: 'Active Users', value: '48', icon: '👥', trend: '+8', trendUp: true, color: 'blue' },
    { label: 'Pending Payments', value: '₱350K', icon: '💳', trend: '-5.2%', trendUp: false, color: 'orange' },
    { label: 'This Month Revenue', value: '₱1.2M', icon: '📊', trend: '+18.3%', trendUp: true, color: 'purple' },
  ]);
  
  quickActions = signal<QuickAction[]>([
    { label: 'New Loan', icon: '💰', route: '/tenant/transactions/loans/new', color: 'green' },
    { label: 'Process Payment', icon: '💳', route: '/tenant/transactions/payments/new', color: 'blue' },
    { label: 'Add User', icon: '👤', route: '/tenant/users/create', color: 'purple' },
    { label: 'View Reports', icon: '📊', route: '/tenant/reports', color: 'orange' },
  ]);
  
  recentActivity = signal([
    { icon: '💰', title: 'New loan approved', description: 'Loan #1234 for ₱50,000', time: '2 minutes ago' },
    { icon: '💳', title: 'Payment received', description: 'Payment #5678 - ₱5,000', time: '15 minutes ago' },
    { icon: '👤', title: 'New user added', description: 'Juan Dela Cruz joined', time: '1 hour ago' },
    { icon: '📊', title: 'Report generated', description: 'Monthly financial report', time: '2 hours ago' },
  ]);
  
  activeModules = signal([
    { icon: '💰', name: 'Money Loan', usage: '125 active loans', route: '/tenant/modules/money-loan' },
    { icon: '💳', name: 'BNPL', usage: '48 transactions', route: '/tenant/modules/bnpl' },
    { icon: '💎', name: 'Pawnshop', usage: '32 items pawned', route: '/tenant/modules/pawnshop' },
  ]);
  
  upcomingTasks = signal([
    { title: 'Review loan applications', dueDate: 'Due today', priority: 'red' },
    { title: 'Process pending payments', dueDate: 'Due tomorrow', priority: 'orange' },
    { title: 'Generate weekly report', dueDate: 'Due in 3 days', priority: 'blue' },
  ]);

  ngOnInit() {
    console.log('🏢 Tenant Dashboard initialized');
  }

  getFirstName(): string {
    const email = this.authService.currentUser()?.email || '';
    const name = email.split('@')[0];
    return name.charAt(0).toUpperCase() + name.slice(1);
  }

  getCurrentDate(): string {
    return new Date().toLocaleDateString('en-US', { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    });
  }
}
