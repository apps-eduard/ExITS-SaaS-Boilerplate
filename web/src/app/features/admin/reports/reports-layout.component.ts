import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule, Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-reports-layout',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="p-4 sm:p-6 max-w-7xl mx-auto">
      <!-- Header -->
      <div class="mb-4">
        <h1 class="text-lg font-semibold text-gray-900 dark:text-white mb-1">Reports</h1>
        <p class="text-xs text-gray-600 dark:text-gray-400">View system reports and analytics</p>
      </div>

      <!-- Tabs -->
      <div class="border-b border-gray-200 dark:border-gray-700 mb-4">
        <nav class="-mb-px flex space-x-4" aria-label="Tabs">
          <button
            (click)="navigateToTab('tenant-usage')"
            [class.border-blue-500]="activeTab() === 'tenant-usage'"
            [class.text-blue-600]="activeTab() === 'tenant-usage'"
            [class.dark:text-blue-400]="activeTab() === 'tenant-usage'"
            [class.border-transparent]="activeTab() !== 'tenant-usage'"
            [class.text-gray-500]="activeTab() !== 'tenant-usage'"
            [class.dark:text-gray-400]="activeTab() !== 'tenant-usage'"
            class="group inline-flex items-center px-3 py-2 border-b-2 font-medium text-xs transition hover:border-gray-300 dark:hover:border-gray-600"
          >
            <svg class="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"/>
            </svg>
            Tenant Usage
          </button>

          <button
            (click)="navigateToTab('revenue')"
            [class.border-blue-500]="activeTab() === 'revenue'"
            [class.text-blue-600]="activeTab() === 'revenue'"
            [class.dark:text-blue-400]="activeTab() === 'revenue'"
            [class.border-transparent]="activeTab() !== 'revenue'"
            [class.text-gray-500]="activeTab() !== 'revenue'"
            [class.dark:text-gray-400]="activeTab() !== 'revenue'"
            class="group inline-flex items-center px-3 py-2 border-b-2 font-medium text-xs transition hover:border-gray-300 dark:hover:border-gray-600"
          >
            <svg class="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
            </svg>
            Revenue Reports
          </button>

          <button
            (click)="navigateToTab('subscription-history')"
            [class.border-blue-500]="activeTab() === 'subscription-history'"
            [class.text-blue-600]="activeTab() === 'subscription-history'"
            [class.dark:text-blue-400]="activeTab() === 'subscription-history'"
            [class.border-transparent]="activeTab() !== 'subscription-history'"
            [class.text-gray-500]="activeTab() !== 'subscription-history'"
            [class.dark:text-gray-400]="activeTab() !== 'subscription-history'"
            class="group inline-flex items-center px-3 py-2 border-b-2 font-medium text-xs transition hover:border-gray-300 dark:hover:border-gray-600"
          >
            <svg class="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            Subscription History
          </button>
        </nav>
      </div>

      <!-- Tab Content -->
      <div class="mt-4">
        <router-outlet></router-outlet>
      </div>
    </div>
  `
})
export class ReportsLayoutComponent {
  activeTab = signal<string>('tenant-usage');

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) {
    // Detect active tab from URL
    this.router.events.subscribe(() => {
      const url = this.router.url;
      if (url.includes('subscription-history')) {
        this.activeTab.set('subscription-history');
      } else if (url.includes('revenue')) {
        this.activeTab.set('revenue');
      } else {
        this.activeTab.set('tenant-usage');
      }
    });

    // Set initial tab based on current route
    const url = this.router.url;
    if (url.includes('subscription-history')) {
      this.activeTab.set('subscription-history');
    } else if (url.includes('revenue')) {
      this.activeTab.set('revenue');
    }
  }

  navigateToTab(tab: string): void {
    this.activeTab.set(tab);
    this.router.navigate(['/admin/reports', tab]);
  }
}
