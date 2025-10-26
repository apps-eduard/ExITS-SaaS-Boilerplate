import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface FeatureAdoption {
  featureName: string;
  activeUsers: number;
  totalUsers: number;
  usageFrequency: number;
  trend: number;
  category: string;
}

interface AdoptionTrend {
  date: string;
  users: number;
  sessions: number;
}

@Component({
  selector: 'app-platform-adoption',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 sm:p-6 space-y-4">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Platform Adoption Report</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Track feature usage and engagement across the platform
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button
            (click)="exportReport('csv')"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            Export CSV
          </button>
          <button
            (click)="exportReport('pdf')"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-600 text-white rounded hover:bg-primary-700 transition shadow-sm"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"/>
            </svg>
            Export PDF
          </button>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Time Period</label>
            <select
              [(ngModel)]="timePeriod"
              class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="7d">Last 7 days</option>
              <option value="30d">Last 30 days</option>
              <option value="90d">Last 90 days</option>
              <option value="1y">Last year</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tenant</label>
            <select
              [(ngModel)]="selectedTenant"
              class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Tenants</option>
              <option value="1">Acme Corporation</option>
              <option value="2">TechStart Inc</option>
              <option value="3">Global Solutions</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Plan Type</label>
            <select
              [(ngModel)]="selectedPlan"
              class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Plans</option>
              <option value="starter">Starter</option>
              <option value="professional">Professional</option>
              <option value="enterprise">Enterprise</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Category</label>
            <select
              [(ngModel)]="selectedCategory"
              class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Categories</option>
              <option value="core">Core Features</option>
              <option value="advanced">Advanced</option>
              <option value="analytics">Analytics</option>
              <option value="integration">Integration</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Adoption Overview -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-2xl">🎯</span>
            <span class="text-xs font-medium px-2 py-0.5 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded-full">
              High
            </span>
          </div>
          <p class="text-xs font-medium text-green-700 dark:text-green-300 mb-1">Highly Adopted</p>
          <p class="text-2xl font-bold text-green-900 dark:text-green-100">12</p>
          <p class="text-xs text-green-600 dark:text-green-400 mt-1">features &gt; 80% usage</p>
        </div>

        <div class="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-2xl">📊</span>
            <span class="text-xs font-medium px-2 py-0.5 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full">
              Growing
            </span>
          </div>
          <p class="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Avg Adoption Rate</p>
          <p class="text-2xl font-bold text-blue-900 dark:text-blue-100">68.5%</p>
          <p class="text-xs text-blue-600 dark:text-blue-400 mt-1">+5.2% this month</p>
        </div>

        <div class="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-2xl">⚠️</span>
            <span class="text-xs font-medium px-2 py-0.5 bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 rounded-full">
              Low
            </span>
          </div>
          <p class="text-xs font-medium text-orange-700 dark:text-orange-300 mb-1">Underused</p>
          <p class="text-2xl font-bold text-orange-900 dark:text-orange-100">5</p>
          <p class="text-xs text-orange-600 dark:text-orange-400 mt-1">features &lt; 30% usage</p>
        </div>

        <div class="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-2xl">💡</span>
            <span class="text-xs font-medium px-2 py-0.5 bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 rounded-full">
              Upsell
            </span>
          </div>
          <p class="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">Upsell Opportunities</p>
          <p class="text-2xl font-bold text-purple-900 dark:text-purple-100">18</p>
          <p class="text-xs text-purple-600 dark:text-purple-400 mt-1">potential upgrades</p>
        </div>
      </div>

      <!-- Adoption Trends -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex items-center justify-between mb-4">
          <h3 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span>📈</span>
            Adoption Trends Over Time
          </h3>
          <span class="text-xs text-gray-500 dark:text-gray-400">Last 30 days</span>
        </div>

        <div class="space-y-3">
          @for (trend of adoptionTrends(); track trend.date) {
            <div class="space-y-1">
              <div class="flex items-center justify-between text-xs">
                <span class="text-gray-600 dark:text-gray-400">{{ trend.date }}</span>
                <div class="flex items-center gap-4">
                  <span class="text-green-600 dark:text-green-400">{{ trend.users }} users</span>
                  <span class="text-blue-600 dark:text-blue-400">{{ trend.sessions }} sessions</span>
                </div>
              </div>
              <div class="flex gap-2 h-6">
                <div class="flex-1 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                  <div
                    class="bg-gradient-to-r from-green-500 to-green-600 h-full transition-all duration-500"
                    [style.width.%]="(trend.users / maxUsers()) * 100"
                  ></div>
                </div>
                <div class="flex-1 bg-gray-100 dark:bg-gray-700 rounded overflow-hidden">
                  <div
                    class="bg-gradient-to-r from-blue-500 to-blue-600 h-full transition-all duration-500"
                    [style.width.%]="(trend.sessions / maxSessions()) * 100"
                  ></div>
                </div>
              </div>
            </div>
          }
        </div>
      </div>

      <!-- Feature Adoption Details -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span>🎯</span>
            Feature Adoption Details
          </h3>
          <div class="flex items-center gap-2">
            <span class="text-xs text-gray-500 dark:text-gray-400">Sort by:</span>
            <select
              [(ngModel)]="sortBy"
              class="px-2 py-1 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="adoption">Adoption Rate</option>
              <option value="users">Active Users</option>
              <option value="frequency">Usage Frequency</option>
              <option value="trend">Trend</option>
            </select>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Feature</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Category</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Active Users</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Adoption Rate</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Usage/Day</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Trend</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Status</th>
                <th class="px-4 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              @for (feature of features(); track feature.featureName) {
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  <td class="px-4 py-3">
                    <span class="font-medium text-xs text-gray-900 dark:text-white">{{ feature.featureName }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="px-2 py-0.5 text-xs rounded" [class]="getCategoryClass(feature.category)">
                      {{ feature.category }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="text-xs text-gray-900 dark:text-white">{{ feature.activeUsers }}/{{ feature.totalUsers }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="space-y-1">
                      <div class="flex items-center gap-2">
                        <span class="text-xs font-semibold text-gray-900 dark:text-white">
                          {{ getAdoptionRate(feature.activeUsers, feature.totalUsers) }}%
                        </span>
                      </div>
                      <div class="w-20 bg-gray-100 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                        <div
                          class="h-1.5 rounded-full transition-all duration-500"
                          [class]="getAdoptionColor(feature.activeUsers, feature.totalUsers)"
                          [style.width.%]="getAdoptionRate(feature.activeUsers, feature.totalUsers)"
                        ></div>
                      </div>
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <span class="text-xs text-gray-900 dark:text-white">{{ feature.usageFrequency.toFixed(1) }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center gap-1">
                      @if (feature.trend > 0) {
                        <svg class="w-3 h-3 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
                        </svg>
                        <span class="text-xs text-green-600 dark:text-green-400">+{{ feature.trend }}%</span>
                      } @else if (feature.trend < 0) {
                        <svg class="w-3 h-3 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 14l-7 7m0 0l-7-7m7 7V3"/>
                        </svg>
                        <span class="text-xs text-red-600 dark:text-red-400">{{ feature.trend }}%</span>
                      } @else {
                        <span class="text-xs text-gray-500 dark:text-gray-400">0%</span>
                      }
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <span
                      class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full"
                      [class]="getStatusClass(feature.activeUsers, feature.totalUsers)"
                    >
                      {{ getStatusLabel(feature.activeUsers, feature.totalUsers) }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center justify-end gap-1">
                      <button
                        class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition"
                        title="View Analytics"
                      >
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Insights & Recommendations -->
      <div class="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
        <h3 class="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <span>💡</span>
          Insights & Recommendations
        </h3>

        <div class="space-y-2">
          <div class="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded border border-blue-200 dark:border-blue-700">
            <span class="text-lg">🎯</span>
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900 dark:text-white">High Adoption Features</p>
              <p class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                Dashboard Analytics and User Management have &gt;85% adoption. Consider promoting similar features.
              </p>
            </div>
          </div>

          <div class="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded border border-orange-200 dark:border-orange-700">
            <span class="text-lg">⚠️</span>
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900 dark:text-white">Underutilized Features</p>
              <p class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                Advanced Reporting and API Integration have low adoption (&lt;30%). Consider user education or UX improvements.
              </p>
            </div>
          </div>

          <div class="flex items-start gap-3 p-3 bg-white dark:bg-gray-800 rounded border border-purple-200 dark:border-purple-700">
            <span class="text-lg">💰</span>
            <div class="flex-1">
              <p class="text-sm font-medium text-gray-900 dark:text-white">Upsell Opportunities</p>
              <p class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
                18 Starter plan users actively use advanced features. Target them for Professional plan upgrades.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PlatformAdoptionComponent {
  timePeriod = '30d';
  selectedTenant = 'all';
  selectedPlan = 'all';
  selectedCategory = 'all';
  sortBy = 'adoption';

  features = signal<FeatureAdoption[]>([
    { featureName: 'Dashboard Analytics', activeUsers: 2456, totalUsers: 2847, usageFrequency: 8.5, trend: 12.3, category: 'Core' },
    { featureName: 'User Management', activeUsers: 2389, totalUsers: 2847, usageFrequency: 5.2, trend: 8.7, category: 'Core' },
    { featureName: 'Basic Reporting', activeUsers: 1987, totalUsers: 2847, usageFrequency: 3.8, trend: 5.4, category: 'Analytics' },
    { featureName: 'Billing Overview', activeUsers: 1756, totalUsers: 2847, usageFrequency: 2.9, trend: -1.2, category: 'Core' },
    { featureName: 'Team Collaboration', activeUsers: 1523, totalUsers: 2847, usageFrequency: 4.6, trend: 15.8, category: 'Advanced' },
    { featureName: 'Custom Workflows', activeUsers: 1245, totalUsers: 2847, usageFrequency: 2.1, trend: 7.9, category: 'Advanced' },
    { featureName: 'Advanced Reporting', activeUsers: 789, totalUsers: 2847, usageFrequency: 1.5, trend: -3.4, category: 'Analytics' },
    { featureName: 'API Integration', activeUsers: 456, totalUsers: 2847, usageFrequency: 0.8, trend: -5.2, category: 'Integration' }
  ]);

  adoptionTrends = signal<AdoptionTrend[]>([
    { date: 'Oct 16', users: 2456, sessions: 12340 },
    { date: 'Oct 17', users: 2489, sessions: 12890 },
    { date: 'Oct 18', users: 2534, sessions: 13120 },
    { date: 'Oct 19', users: 2567, sessions: 13450 },
    { date: 'Oct 20', users: 2612, sessions: 13780 },
    { date: 'Oct 21', users: 2689, sessions: 14230 },
    { date: 'Oct 22', users: 2734, sessions: 14560 },
    { date: 'Oct 23', users: 2847, sessions: 15120 }
  ]);

  maxUsers = computed(() => Math.max(...this.adoptionTrends().map(t => t.users)));
  maxSessions = computed(() => Math.max(...this.adoptionTrends().map(t => t.sessions)));

  getAdoptionRate(active: number, total: number): number {
    return Math.round((active / total) * 100);
  }

  getAdoptionColor(active: number, total: number): string {
    const rate = this.getAdoptionRate(active, total);
    if (rate >= 80) return 'bg-gradient-to-r from-green-500 to-green-600';
    if (rate >= 60) return 'bg-gradient-to-r from-blue-500 to-blue-600';
    if (rate >= 40) return 'bg-gradient-to-r from-yellow-500 to-yellow-600';
    return 'bg-gradient-to-r from-red-500 to-red-600';
  }

  getStatusClass(active: number, total: number): string {
    const rate = this.getAdoptionRate(active, total);
    if (rate >= 80) return 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300';
    if (rate >= 60) return 'bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300';
    if (rate >= 40) return 'bg-yellow-100 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300';
    return 'bg-red-100 dark:bg-red-900/20 text-red-700 dark:text-red-300';
  }

  getStatusLabel(active: number, total: number): string {
    const rate = this.getAdoptionRate(active, total);
    if (rate >= 80) return '🎯 High';
    if (rate >= 60) return '📊 Good';
    if (rate >= 40) return '⚡ Fair';
    return '⚠️ Low';
  }

  getCategoryClass(category: string): string {
    const classes: Record<string, string> = {
      'Core': 'bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300',
      'Advanced': 'bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300',
      'Analytics': 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
      'Integration': 'bg-orange-50 dark:bg-orange-900/20 text-orange-700 dark:text-orange-300'
    };
    return classes[category] || 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300';
  }

  exportReport(format: 'csv' | 'pdf') {
    alert(`Exporting Platform Adoption report as ${format.toUpperCase()}...`);
  }
}
