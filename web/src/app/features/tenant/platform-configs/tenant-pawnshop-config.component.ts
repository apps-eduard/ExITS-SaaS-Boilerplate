import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface ConfigSection {
  id: string;
  name: string;
  description: string;
  path: string;
  icon: string;
  badge?: string;
}

@Component({
  selector: 'app-tenant-pawnshop-config',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="mb-6">
          <div class="flex items-center gap-4 mb-4">
            <div class="w-16 h-16 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
              <span class="text-3xl">💎</span>
            </div>
            <div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Pawnshop Configuration</h1>
              <p class="text-sm text-gray-600 dark:text-gray-400">Manage settings for your collateral-based lending platform</p>
            </div>
          </div>
        </div>

        <!-- Configuration Sections -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (section of configSections(); track section.id) {
            <button (click)="navigateToConfig(section.path)"
                    class="p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-purple-500 dark:hover:border-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 transition text-left group bg-white dark:bg-gray-800">
              <div class="flex items-start justify-between mb-3">
                <div class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/30 group-hover:text-purple-600 dark:group-hover:text-purple-400 transition">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="getIconPath(section.icon)"/>
                  </svg>
                </div>
                @if (section.badge) {
                  <span class="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                    {{ section.badge }}
                  </span>
                }
              </div>
              <h3 class="text-base font-semibold text-gray-900 dark:text-white group-hover:text-purple-600 dark:group-hover:text-purple-400 transition mb-2">
                {{ section.name }}
              </h3>
              <p class="text-sm text-gray-600 dark:text-gray-400">{{ section.description }}</p>
            </button>
          }
        </div>

        <!-- Quick Stats -->
        <div class="mt-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div class="p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <span class="text-lg">✅</span>
              </div>
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">Platform Status</p>
                <p class="text-lg font-semibold text-gray-900 dark:text-white">Active</p>
              </div>
            </div>
          </div>
          <div class="p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center">
                <span class="text-lg">🏷️</span>
              </div>
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">Item Categories</p>
                <p class="text-lg font-semibold text-gray-900 dark:text-white">12 Active</p>
              </div>
            </div>
          </div>
          <div class="p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <span class="text-lg">⚙️</span>
              </div>
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">Last Updated</p>
                <p class="text-lg font-semibold text-gray-900 dark:text-white">Today</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class TenantPawnshopConfigComponent implements OnInit {
  private router: Router;

  configSections = signal<ConfigSection[]>([]);

  constructor(router: Router) {
    this.router = router;
  }

  ngOnInit() {
    this.loadConfigSections();
  }

  loadConfigSections() {
    this.configSections.set([
      {
        id: 'appraisal-rules',
        name: 'Appraisal Rules',
        description: 'Configure item valuation and appraisal settings',
        path: '/config/appraisal-rules',
        icon: 'search'
      },
      {
        id: 'loan-to-value',
        name: 'Loan-to-Value Ratios',
        description: 'Set LTV ratios per item category',
        path: '/config/loan-to-value',
        icon: 'percent'
      },
      {
        id: 'storage-fees',
        name: 'Storage & Handling',
        description: 'Configure storage fees and handling charges',
        path: '/config/storage-fees',
        icon: 'box'
      },
      {
        id: 'redemption-periods',
        name: 'Redemption Periods',
        description: 'Set grace periods and extension policies',
        path: '/config/redemption-periods',
        icon: 'clock'
      },
      {
        id: 'auction-settings',
        name: 'Auction Settings',
        description: 'Manage unclaimed item auction policies',
        path: '/config/auction-settings',
        icon: 'gavel'
      },
      {
        id: 'item-categories',
        name: 'Item Categories',
        description: 'Configure accepted collateral types',
        path: '/config/item-categories',
        icon: 'tag'
      }
    ]);
  }

  navigateToConfig(path: string) {
    this.router.navigateByUrl(path);
  }

  getIconPath(icon: string): string {
    const icons: { [key: string]: string } = {
      'search': 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
      'percent': 'M9 8h6m-5 8h1m4-8a1 1 0 011-1h3m-3 5l3 3m-3-3l3-3',
      'box': 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
      'clock': 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      'gavel': 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
      'tag': 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z'
    };
    return icons[icon] || icons['search'];
  }
}
