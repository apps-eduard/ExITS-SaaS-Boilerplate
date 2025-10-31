import { Component, inject, signal, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';
import { AuthService } from '../../core/services/auth.service';
import { RegisterComponentPath } from '../../core/decorators/register-component-path.decorator';

@RegisterComponentPath('src/app/features/dashboard/dashboard.component.ts', 'Dashboard')
@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, HeaderComponent, SidebarComponent],
  template: `
    <div class="flex h-screen bg-gray-50 dark:bg-gray-900">
      <app-sidebar #sidebar/>
      
      <div class="flex-1 flex flex-col overflow-hidden w-full transition-all duration-300 ease-in-out">
        <app-header (menuToggle)="toggleSidebar()"/>
        
        <main class="flex-1 overflow-y-auto p-4 lg:p-6">

        <!-- Stats Grid -->
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 mb-6 transition-all duration-300">
            @for (stat of stats; track stat.label) {
              <div class="bg-white dark:bg-gray-800 rounded-xl p-5 shadow-sm border border-gray-200 dark:border-gray-700 hover:shadow-md transition-all duration-300 hover:scale-105 hover:-translate-y-1">
                <div class="flex items-start justify-between">
                  <div class="flex-1">
                    <p class="text-sm text-gray-600 dark:text-gray-400 mb-1">{{ stat.label }}</p>
                    <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stat.value }}</p>
                    <p class="text-xs mt-2"
                       [class.text-green-600]="stat.change > 0"
                       [class.text-red-600]="stat.change < 0"
                       [class.text-gray-500]="stat.change === 0">
                      <span>{{ stat.change > 0 ? '↑' : stat.change < 0 ? '↓' : '−' }}</span>
                      {{ Math.abs(stat.change) }}% from last month
                    </p>
                  </div>
                  <div class="w-12 h-12 rounded-lg flex items-center justify-center text-2xl"
                       [ngClass]="stat.bgClass">
                    {{ stat.icon }}
                  </div>
                </div>
              </div>
            }
          </div>

          <!-- Main Content Grid -->
          <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <!-- Recent Activity -->
            <div class="lg:col-span-2 bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
              <div class="flex items-center justify-between mb-4">
                <h2 class="text-lg font-bold text-gray-900 dark:text-white">Recent Activity</h2>
                <button class="text-sm text-primary-600 dark:text-primary-400 hover:underline">View All</button>
              </div>
              
              <div class="space-y-4">
                @for (activity of recentActivity; track activity.id) {
                  <div class="flex items-start gap-4 pb-4 border-b border-gray-200 dark:border-gray-700 last:border-0">
                    <div class="w-10 h-10 rounded-lg flex items-center justify-center flex-shrink-0"
                         [ngClass]="activity.iconBg">
                      <span class="text-xl">{{ activity.icon }}</span>
                    </div>
                    <div class="flex-1 min-w-0">
                      <p class="text-sm font-medium text-gray-900 dark:text-white">{{ activity.title }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ activity.description }}</p>
                      <p class="text-xs text-gray-400 dark:text-gray-500 mt-1">{{ activity.time }}</p>
                    </div>
                    <span class="px-2 py-1 text-xs font-medium rounded-full"
                          [ngClass]="{
                            'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400': activity.status === 'success',
                            'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400': activity.status === 'pending',
                            'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400': activity.status === 'info'
                          }">
                      {{ activity.status }}
                    </span>
                  </div>
                }
              </div>
            </div>

            <!-- Quick Actions & Stats -->
            <div class="space-y-6">
              <!-- Quick Actions -->
              <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Quick Actions</h2>
                <div class="space-y-2">
                  @for (action of quickActions; track action.label) {
                    <button class="w-full flex items-center gap-3 px-4 py-3 rounded-lg bg-gray-50 dark:bg-gray-700 hover:bg-gray-100 dark:hover:bg-gray-600 transition-colors text-left">
                      <span class="text-xl">{{ action.icon }}</span>
                      <span class="text-sm font-medium text-gray-900 dark:text-white">{{ action.label }}</span>
                    </button>
                  }
                </div>
              </div>

              <!-- System Status -->
              <div class="bg-white dark:bg-gray-800 rounded-xl p-6 shadow-sm border border-gray-200 dark:border-gray-700">
                <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-4">System Status</h2>
                <div class="space-y-3">
                  @for (metric of systemMetrics; track metric.label) {
                    <div>
                      <div class="flex items-center justify-between mb-1.5">
                        <span class="text-sm text-gray-600 dark:text-gray-400">{{ metric.label }}</span>
                        <span class="text-sm font-medium text-gray-900 dark:text-white">{{ metric.value }}%</span>
                      </div>
                      <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-2">
                        <div
                          class="h-2 rounded-full transition-all"
                          [style.width.%]="metric.value"
                          [ngClass]="{
                            'bg-green-500': metric.value >= 70,
                            'bg-yellow-500': metric.value >= 40 && metric.value < 70,
                            'bg-red-500': metric.value < 40
                          }">
                        </div>
                      </div>
                    </div>
                  }
                </div>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
  `
})
export class DashboardComponent {
  authService = inject(AuthService);
  user = this.authService.currentUser;
  @ViewChild('sidebar') sidebar!: SidebarComponent;
  
  isDesktop = signal(window.innerWidth >= 1024);
  Math = Math;

  stats = [
    { label: 'Total Users', value: '2,543', change: 12, icon: '👥', bgClass: 'bg-blue-100 dark:bg-blue-900/30' },
    { label: 'Active Tenants', value: '48', change: 5, icon: '🏢', bgClass: 'bg-green-100 dark:bg-green-900/30' },
    { label: 'Revenue', value: '$12.5K', change: 8, icon: '💰', bgClass: 'bg-yellow-100 dark:bg-yellow-900/30' },
    { label: 'System Health', value: '98.5%', change: 0, icon: '📈', bgClass: 'bg-purple-100 dark:bg-purple-900/30' },
  ];

  recentActivity = [
    { id: 1, icon: '👤', title: 'New user registered', description: 'John Doe joined as Tenant Admin', time: '5 min ago', status: 'success', iconBg: 'bg-blue-100 dark:bg-blue-900/30' },
    { id: 2, icon: '📋', title: 'Loan application submitted', description: 'Application #1234 pending review', time: '15 min ago', status: 'pending', iconBg: 'bg-yellow-100 dark:bg-yellow-900/30' },
    { id: 3, icon: '✅', title: 'Appraisal completed', description: 'Property valuation finished', time: '1 hour ago', status: 'success', iconBg: 'bg-green-100 dark:bg-green-900/30' },
    { id: 4, icon: '💳', title: 'Payment processed', description: 'Invoice #5678 paid - $5,000', time: '2 hours ago', status: 'success', iconBg: 'bg-green-100 dark:bg-green-900/30' },
    { id: 5, icon: '⚠️', title: 'System maintenance', description: 'Scheduled for tonight at 2 AM', time: '3 hours ago', status: 'info', iconBg: 'bg-orange-100 dark:bg-orange-900/30' },
  ];

  quickActions = [
    { icon: '➕', label: 'Add New User' },
    { icon: '🏢', label: 'Create Tenant' },
    { icon: '📋', label: 'New Loan Application' },
    { icon: '📊', label: 'Generate Report' },
  ];

  systemMetrics = [
    { label: 'CPU Usage', value: 34 },
    { label: 'Memory', value: 68 },
    { label: 'Storage', value: 46 },
    { label: 'API Response Time', value: 92 },
  ];

  toggleSidebar() {
    if (this.sidebar) {
      this.sidebar.isOpen.update(v => !v);
    }
  }

  constructor() {
    window.addEventListener('resize', () => {
      this.isDesktop.set(window.innerWidth >= 1024);
    });
  }
}
