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
  selector: 'app-tenant-bnpl-config',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="mb-6">
          <div class="flex items-center gap-4 mb-4">
            <div class="w-16 h-16 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <span class="text-3xl">🛒</span>
            </div>
            <div>
              <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Buy Now, Pay Later Configuration</h1>
              <p class="text-sm text-gray-600 dark:text-gray-400">Manage settings for your BNPL installment platform</p>
            </div>
          </div>
        </div>

        <!-- Configuration Sections -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (section of configSections(); track section.id) {
            <button (click)="navigateToConfig(section.path)"
                    class="p-6 rounded-lg border border-gray-200 dark:border-gray-700 hover:border-blue-500 dark:hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition text-left group bg-white dark:bg-gray-800">
              <div class="flex items-start justify-between mb-3">
                <div class="w-10 h-10 rounded-lg bg-gray-100 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-400 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/30 group-hover:text-blue-600 dark:group-hover:text-blue-400 transition">
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
              <h3 class="text-base font-semibold text-gray-900 dark:text-white group-hover:text-blue-600 dark:group-hover:text-blue-400 transition mb-2">
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
              <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
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
              <div class="w-10 h-10 rounded-lg bg-indigo-100 dark:bg-indigo-900/30 flex items-center justify-center">
                <span class="text-lg">🔗</span>
              </div>
              <div>
                <p class="text-sm text-gray-600 dark:text-gray-400">Integrations</p>
                <p class="text-lg font-semibold text-gray-900 dark:text-white">5 Connected</p>
              </div>
            </div>
          </div>
          <div class="p-4 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
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
export class TenantBnplConfigComponent implements OnInit {
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
        id: 'installment-plans',
        name: 'Installment Plans',
        description: 'Configure payment plan options and terms',
        path: '/config/installment-plans',
        icon: 'list'
      },
      {
        id: 'merchant-fees',
        name: 'Merchant Fees',
        description: 'Set merchant discount rates and fee structures',
        path: '/config/merchant-fees',
        icon: 'dollar'
      },
      {
        id: 'credit-limits',
        name: 'Credit Limits',
        description: 'Configure customer spending limits and controls',
        path: '/config/credit-limits',
        icon: 'shield'
      },
      {
        id: 'late-fees',
        name: 'Late Payment Fees',
        description: 'Set penalty and late fee policies',
        path: '/config/late-fees',
        icon: 'alert'
      },
      {
        id: 'integrations',
        name: 'E-commerce Integrations',
        description: 'Connect with online stores and platforms',
        path: '/config/integrations',
        icon: 'link',
        badge: 'New'
      }
    ]);
  }

  navigateToConfig(path: string) {
    this.router.navigateByUrl(path);
  }

  getIconPath(icon: string): string {
    const icons: { [key: string]: string } = {
      'list': 'M4 6h16M4 12h16M4 18h16',
      'dollar': 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1',
      'shield': 'M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z',
      'alert': 'M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z',
      'link': 'M13.828 10.172a4 4 0 00-5.656 0l-4 4a4 4 0 105.656 5.656l1.102-1.101m-.758-4.899a4 4 0 005.656 0l4-4a4 4 0 00-5.656-5.656l-1.1 1.1'
    };
    return icons[icon] || icons['list'];
  }
}
