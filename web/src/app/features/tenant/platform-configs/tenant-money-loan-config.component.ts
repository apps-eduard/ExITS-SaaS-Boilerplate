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
  selector: 'app-tenant-money-loan-config',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 py-8 px-4">
      <div class="max-w-7xl mx-auto">
        <!-- Header -->
        <div class="mb-8">
          <div class="flex items-center gap-3 mb-2">
            <div class="w-8 h-8 rounded-lg bg-slate-700 flex items-center justify-center">
              <span class="text-xl">⚙️</span>
            </div>
            <h1 class="text-2xl font-bold text-white">Money Loan Configuration</h1>
          </div>
          <p class="text-sm text-slate-400 ml-11">Manage interest rates, fees, payment schedules, and loan policies</p>
        </div>

        <!-- Configuration Sections -->
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
          @for (section of configSections(); track section.id) {
            <button (click)="navigateToConfig(section.path)"
                    class="relative p-5 rounded-xl bg-slate-800/60 border border-slate-700 hover:border-slate-600 hover:bg-slate-800 transition-all duration-200 text-left group">
              <div class="flex items-start justify-between mb-3">
                <div [class]="'w-12 h-12 rounded-lg flex items-center justify-center transition-colors ' + getIconBgClass(section.icon)">
                  <span class="text-2xl">{{ getIconEmoji(section.icon) }}</span>
                </div>
                @if (section.badge) {
                  <span class="px-2 py-0.5 rounded-full text-xs font-semibold bg-red-500/20 text-red-400 border border-red-500/30">
                    {{ section.badge }}
                  </span>
                }
              </div>
              <h3 class="text-base font-semibold text-white mb-2">
                {{ section.name }}
              </h3>
              <p class="text-sm text-slate-400 leading-relaxed">{{ section.description }}</p>
              
              <!-- Arrow indicator -->
              <div class="absolute top-5 right-5 opacity-0 group-hover:opacity-100 group-hover:translate-x-1 transition-all">
                <svg class="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                </svg>
              </div>
            </button>
          }
        </div>

        <!-- Quick Stats -->
        <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div class="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
            <div class="flex items-center gap-3 mb-2">
              <div class="w-10 h-10 rounded-lg bg-blue-500/10 flex items-center justify-center">
                <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                </svg>
              </div>
              <p class="text-xs text-slate-400">Active Products</p>
            </div>
            <p class="text-2xl font-bold text-white">3</p>
          </div>
          
          <div class="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
            <div class="flex items-center gap-3 mb-2">
              <div class="w-10 h-10 rounded-lg bg-green-500/10 flex items-center justify-center">
                <svg class="w-5 h-5 text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6"/>
                </svg>
              </div>
              <p class="text-xs text-slate-400">Interest Rates</p>
            </div>
            <p class="text-2xl font-bold text-white">5</p>
          </div>
          
          <div class="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
            <div class="flex items-center gap-3 mb-2">
              <div class="w-10 h-10 rounded-lg bg-purple-500/10 flex items-center justify-center">
                <svg class="w-5 h-5 text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1"/>
                </svg>
              </div>
              <p class="text-xs text-slate-400">Fee Structures</p>
            </div>
            <p class="text-2xl font-bold text-white">8</p>
          </div>
          
          <div class="p-4 rounded-xl bg-slate-800/60 border border-slate-700">
            <div class="flex items-center gap-3 mb-2">
              <div class="w-10 h-10 rounded-lg bg-orange-500/10 flex items-center justify-center">
                <svg class="w-5 h-5 text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <p class="text-xs text-slate-400">Approval Rules</p>
            </div>
            <p class="text-2xl font-bold text-white">4</p>
          </div>
        </div>

        <!-- Configuration Best Practices -->
        <div class="mt-8 p-5 rounded-xl bg-blue-500/10 border border-blue-500/30">
          <div class="flex items-start gap-3">
            <div class="w-8 h-8 rounded-lg bg-blue-500/20 flex items-center justify-center flex-shrink-0 mt-0.5">
              <svg class="w-5 h-5 text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
            <div class="flex-1">
              <h3 class="text-sm font-semibold text-blue-300 mb-2">Configuration Best Practices</h3>
              <ul class="space-y-1 text-sm text-slate-300">
                <li class="flex items-start gap-2">
                  <span class="text-blue-400 mt-0.5">•</span>
                  <span>Always test configurations in a sandbox environment before applying to production</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-blue-400 mt-0.5">•</span>
                  <span>Review interest rate changes with finance team before activation</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-blue-400 mt-0.5">•</span>
                  <span>Document all configuration changes for audit purposes</span>
                </li>
                <li class="flex items-start gap-2">
                  <span class="text-blue-400 mt-0.5">•</span>
                  <span>Set effective dates appropriately to avoid disrupting active loans</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class TenantMoneyLoanConfigComponent implements OnInit {
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
        id: 'products',
        name: 'Loan Products',
        description: 'Manage loan types, interest rates, and terms',
        path: '/platforms/money-loan/dashboard/config/loan-products',
        icon: 'package',
        badge: '3'
      },
      {
        id: 'payment-schedules',
        name: 'Payment Schedules',
        description: 'Set up payment frequencies and penalty structures',
        path: '/platforms/money-loan/dashboard/config/payment-schedules',
        icon: 'calendar'
      },
      {
        id: 'fees',
        name: 'Fee Structures',
        description: 'Manage loan fees, processing charges, and other costs',
        path: '/platforms/money-loan/dashboard/config/fees',
        icon: 'dollar'
      },
      {
        id: 'approval-rules',
        name: 'Approval Rules',
        description: 'Configure credit scoring and approval criteria',
        path: '/platforms/money-loan/dashboard/config/approval-rules',
        icon: 'check'
      },
      {
        id: 'modifications',
        name: 'Loan Modifications',
        description: 'Set up restructuring and modification policies',
        path: '/platforms/money-loan/dashboard/config/modifications',
        icon: 'edit'
      }
    ]);
  }

  navigateToConfig(path: string) {
    this.router.navigateByUrl(path);
  }

  getIconEmoji(icon: string): string {
    const icons: { [key: string]: string } = {
      'percent': '📊',
      'calendar': '📅',
      'dollar': '💰',
      'check': '✅',
      'edit': '📧',
      'package': '📦'
    };
    return icons[icon] || '⚙️';
  }

  getIconBgClass(icon: string): string {
    const bgClasses: { [key: string]: string } = {
      'percent': 'bg-green-500/10 group-hover:bg-green-500/20',
      'calendar': 'bg-blue-500/10 group-hover:bg-blue-500/20',
      'dollar': 'bg-purple-500/10 group-hover:bg-purple-500/20',
      'check': 'bg-teal-500/10 group-hover:bg-teal-500/20',
      'edit': 'bg-indigo-500/10 group-hover:bg-indigo-500/20',
      'package': 'bg-orange-500/10 group-hover:bg-orange-500/20'
    };
    return bgClasses[icon] || 'bg-slate-700/50 group-hover:bg-slate-600/50';
  }

  getIconPath(icon: string): string {
    const icons: { [key: string]: string } = {
      'percent': 'M9 8h6m-5 8h1m4-8a1 1 0 011-1h3m-3 5l3 3m-3-3l3-3',
      'calendar': 'M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z',
      'dollar': 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1',
      'check': 'M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z',
      'edit': 'M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z',
      'package': 'M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4'
    };
    return icons[icon] || icons['check'];
  }
}
