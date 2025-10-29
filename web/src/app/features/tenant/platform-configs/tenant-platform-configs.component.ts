import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';

interface PlatformConfig {
  id: string;
  name: string;
  icon: string;
  description: string;
  enabled: boolean;
  configSections: ConfigSection[];
  color: string;
}

interface ConfigSection {
  id: string;
  name: string;
  description: string;
  path: string;
  icon: string;
  badge?: string;
}

@Component({
  selector: 'app-tenant-platform-configs',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="mb-6">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Platform Configurations</h1>
          <p class="text-sm text-gray-600 dark:text-gray-400">Manage settings for all your enabled platforms</p>
        </div>

        <!-- Platform Configuration Cards -->
        <div class="space-y-6">
          @for (platform of platforms(); track platform.id) {
            <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 shadow-sm overflow-hidden">
              <!-- Platform Header -->
              <div [class]="'px-6 py-4 border-b border-gray-200 dark:border-gray-700 ' + platform.color">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-4">
                    <!-- Platform Icon -->
                    <div [class]="'w-12 h-12 rounded-lg flex items-center justify-center ' + getPlatformIconBg(platform.color)">
                      <span class="text-2xl">{{ platform.icon }}</span>
                    </div>

                    <!-- Platform Info -->
                    <div>
                      <h2 class="text-lg font-semibold text-gray-900 dark:text-white">{{ platform.name }}</h2>
                      <p class="text-sm text-gray-600 dark:text-gray-400">{{ platform.description }}</p>
                    </div>
                  </div>

                  <!-- Platform Status -->
                  <div class="flex items-center gap-3">
                    <span [class]="platform.enabled ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'"
                          class="px-3 py-1 rounded-full text-xs font-medium">
                      {{ platform.enabled ? 'Active' : 'Inactive' }}
                    </span>
                  </div>
                </div>
              </div>

              <!-- Configuration Sections -->
              @if (platform.enabled) {
                <div class="p-6">
                  <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    @for (section of platform.configSections; track section.id) {
                      <button (click)="navigateToConfig(platform.id, section.path)"
                              class="p-4 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition text-left group">
                        <div class="flex items-start justify-between mb-2">
                          <div class="flex items-center gap-3">
                            <div class="w-8 h-8 rounded bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="getIconPath(section.icon)"/>
                              </svg>
                            </div>
                            <div>
                              <h3 class="text-sm font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
                                {{ section.name }}
                              </h3>
                            </div>
                          </div>
                          @if (section.badge) {
                            <span class="px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300">
                              {{ section.badge }}
                            </span>
                          }
                        </div>
                        <p class="text-xs text-gray-600 dark:text-gray-400">{{ section.description }}</p>
                      </button>
                    }
                  </div>
                </div>
              } @else {
                <!-- Inactive Platform Message -->
                <div class="p-6 text-center">
                  <svg class="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
                  </svg>
                  <p class="text-sm text-gray-600 dark:text-gray-400 mb-3">This platform is currently inactive</p>
                  <button class="px-4 py-2 text-sm font-medium rounded bg-blue-600 text-white hover:bg-blue-700 transition">
                    Enable Platform
                  </button>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class TenantPlatformConfigsComponent implements OnInit {
  private router: Router;

  platforms = signal<PlatformConfig[]>([]);

  constructor(router: Router) {
    this.router = router;
  }

  ngOnInit() {
    this.loadPlatformConfigs();
  }

  loadPlatformConfigs() {
    // TODO: Replace with actual API call
    // Note: Money Loan configuration has been moved to the platform itself
    // Users can access all Money Loan settings from the Settings menu within the Money Loan platform
    this.platforms.set([
      {
        id: 'bnpl',
        name: 'Buy Now, Pay Later',
        icon: '🛒',
        description: 'Installment payment solutions for e-commerce',
        enabled: true,
        color: 'bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20',
        configSections: [
          {
            id: 'installment-plans',
            name: 'Installment Plans',
            description: 'Configure payment plan options',
            path: '/config/installment-plans',
            icon: 'list'
          },
          {
            id: 'merchant-fees',
            name: 'Merchant Fees',
            description: 'Set merchant discount rates',
            path: '/config/merchant-fees',
            icon: 'dollar'
          },
          {
            id: 'credit-limits',
            name: 'Credit Limits',
            description: 'Customer spending limits',
            path: '/config/credit-limits',
            icon: 'shield'
          },
          {
            id: 'late-fees',
            name: 'Late Payment Fees',
            description: 'Penalty and late fee settings',
            path: '/config/late-fees',
            icon: 'alert'
          },
          {
            id: 'integrations',
            name: 'E-commerce Integrations',
            description: 'Connect with online stores',
            path: '/config/integrations',
            icon: 'link',
            badge: 'New'
          }
        ]
      },
      {
        id: 'pawnshop',
        name: 'Pawnshop',
        icon: '💎',
        description: 'Collateral-based lending and pawn operations',
        enabled: true,
        color: 'bg-gradient-to-r from-purple-50 to-pink-50 dark:from-purple-900/20 dark:to-pink-900/20',
        configSections: [
          {
            id: 'appraisal-rules',
            name: 'Appraisal Rules',
            description: 'Item valuation and appraisal settings',
            path: '/config/appraisal-rules',
            icon: 'search'
          },
          {
            id: 'loan-to-value',
            name: 'Loan-to-Value Ratios',
            description: 'LTV ratios per item category',
            path: '/config/loan-to-value',
            icon: 'percent'
          },
          {
            id: 'storage-fees',
            name: 'Storage & Handling',
            description: 'Storage fees and handling charges',
            path: '/config/storage-fees',
            icon: 'box'
          },
          {
            id: 'redemption-periods',
            name: 'Redemption Periods',
            description: 'Grace periods and extensions',
            path: '/config/redemption-periods',
            icon: 'clock'
          },
          {
            id: 'auction-settings',
            name: 'Auction Settings',
            description: 'Unclaimed item auction policies',
            path: '/config/auction-settings',
            icon: 'gavel'
          },
          {
            id: 'item-categories',
            name: 'Item Categories',
            description: 'Accepted collateral types',
            path: '/config/item-categories',
            icon: 'tag'
          }
        ]
      }
    ]);
  }

  navigateToConfig(platformId: string, path: string) {
    // Path is already the full route path (e.g., /platforms/money-loan/dashboard/interest/rates)
    this.router.navigateByUrl(path);
  }

  getPlatformIconBg(colorClass: string): string {
    if (colorClass.includes('green')) return 'bg-green-100 dark:bg-green-900/30';
    if (colorClass.includes('blue')) return 'bg-blue-100 dark:bg-blue-900/30';
    if (colorClass.includes('purple')) return 'bg-purple-100 dark:bg-purple-900/30';
    if (colorClass.includes('orange')) return 'bg-orange-100 dark:bg-orange-900/30';
    return 'bg-gray-100 dark:bg-gray-700';
  }

  getIconPath(icon: string): string {
    const icons: { [key: string]: string } = {
      'percent': 'M9 8h6m-5 8h1m4-8a1 1 0 011-1h3m-3 5l3 3m-3-3l3-3',
      'calendar': 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      'dollar': 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1',
      'check': 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      'edit': 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      'package': 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
      'list': 'M4 6h16M4 12h16M4 18h16',
      'shield': 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      'alert': 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
      'link': 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1',
      'search': 'M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z',
      'box': 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4',
      'clock': 'M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z',
      'gavel': 'M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z',
      'tag': 'M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z',
      'refresh': 'M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15',
      'globe': 'M3.055 11H5a2 2 0 012 2v1a2 2 0 002 2 2 2 0 012 2v2.945M8 3.935V5.5A2.5 2.5 0 0010.5 8h.5a2 2 0 012 2 2 2 0 104 0 2 2 0 012-2h1.064M15 20.488V18a2 2 0 012-2h3.064M21 12a9 9 0 11-18 0 9 9 0 0118 0z',
      'users': 'M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z'
    };
    return icons[icon] || icons['check'];
  }
}
