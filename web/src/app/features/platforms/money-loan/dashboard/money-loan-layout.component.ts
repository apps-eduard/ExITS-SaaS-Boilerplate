import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { DevInfoComponent } from '../../../../shared/components/dev-info/dev-info.component';
import { AuthService } from '../../../../core/services/auth.service';

@Component({
  selector: 'app-money-loan-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, DevInfoComponent],
  template: `
    <div class="flex h-screen bg-gray-50 dark:bg-gray-900">
      <!-- Sidebar -->
      <aside [class.hidden]="!sidebarOpen()"
             class="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out overflow-y-auto"
             [class.-translate-x-full]="!sidebarOpen()"
             [class.translate-x-0]="sidebarOpen()">

        <!-- Logo -->
        <div class="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
              <span class="text-white font-bold text-sm">ML</span>
            </div>
            <span class="text-lg font-bold text-gray-900 dark:text-white">Money Loan</span>
          </div>
          <button (click)="toggleSidebar()" class="md:hidden text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>
        </div>

        <!-- Navigation -->
        <nav class="p-4 space-y-1">
          <!-- Overview -->
          <a routerLink="/platforms/money-loan/dashboard"
             routerLinkActive="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
             [routerLinkActiveOptions]="{exact: true}"
             class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <span class="text-xl">📊</span>
            <span class="font-medium">Overview</span>
          </a>

          <!-- Customers -->
          <div class="space-y-1">
            <button (click)="toggleSection('customers')"
                    class="w-full flex items-center justify-between px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <div class="flex items-center gap-3">
                <span class="text-xl">👥</span>
                <span class="font-medium">Customers</span>
              </div>
              <svg class="w-4 h-4 transition-transform" [class.rotate-180]="expandedSections().customers" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            @if (expandedSections().customers) {
              <div class="ml-8 space-y-1">
                <a routerLink="/platforms/money-loan/dashboard/customers/all" routerLinkActive="!text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-700"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  🧑‍🤝‍🧑 All Customers
                </a>
                <a routerLink="/platforms/money-loan/dashboard/customers/new" routerLinkActive="!text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-700"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  ✨ New Customers
                </a>
                <a routerLink="/platforms/money-loan/dashboard/customers/kyc-pending" routerLinkActive="!text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-700"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  ⏳ KYC Pending
                </a>
                <a routerLink="/platforms/money-loan/dashboard/customers/high-risk" routerLinkActive="!text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-700"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  ⚠️ High-Risk Flags
                </a>
              </div>
            }
          </div>

          <!-- Loans -->
          <div class="space-y-1">
            <button (click)="toggleSection('loans')"
                    class="w-full flex items-center justify-between px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <div class="flex items-center gap-3">
                <span class="text-xl">💳</span>
                <span class="font-medium">Loans</span>
              </div>
              <svg class="w-4 h-4 transition-transform" [class.rotate-180]="expandedSections().loans" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            @if (expandedSections().loans) {
              <div class="ml-8 space-y-1">
                <a routerLink="/platforms/money-loan/dashboard/loans/all" routerLinkActive="!text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-700"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  📜 All Loans
                </a>
                <a routerLink="/platforms/money-loan/dashboard/loans/pending" routerLinkActive="!text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-700"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  📝 Pending Approval
                </a>
                <a routerLink="/platforms/money-loan/dashboard/loans/active" routerLinkActive="!text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-700"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  🔄 Active Loans
                </a>
                <a routerLink="/platforms/money-loan/dashboard/loans/overdue" routerLinkActive="!text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-700"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  🕔 Overdue Loans
                </a>
                <a routerLink="/platforms/money-loan/dashboard/loans/closed" routerLinkActive="!text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-700"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  ✅ Closed/Paid Off
                </a>
                <a routerLink="/platforms/money-loan/dashboard/loans/disbursement" routerLinkActive="!text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-700"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  💸 Loan Disbursement
                </a>
                <a routerLink="/platforms/money-loan/dashboard/loans/calculator" routerLinkActive="!text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-700"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  🧮 Loan Calculator
                </a>
              </div>
            }
          </div>

          <!-- Payments -->
          <div class="space-y-1">
            <button (click)="toggleSection('payments')"
                    class="w-full flex items-center justify-between px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <div class="flex items-center gap-3">
                <span class="text-xl">💳</span>
                <span class="font-medium">Payments</span>
              </div>
              <svg class="w-4 h-4 transition-transform" [class.rotate-180]="expandedSections().payments" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            @if (expandedSections().payments) {
              <div class="ml-8 space-y-1">
                <a routerLink="payments/record" routerLinkActive="!text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-700"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  💵 Record Payment
                </a>
                <a routerLink="/platforms/money-loan/dashboard/payments/today" routerLinkActive="!text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-700"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  📅 Today's Collections
                </a>
                <a routerLink="/platforms/money-loan/dashboard/payments/history" routerLinkActive="!text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-700"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  📜 Payment History
                </a>
                <a routerLink="/platforms/money-loan/dashboard/payments/bulk-import" routerLinkActive="!text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-700"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  📤 Bulk Import Payments
                </a>
                <a routerLink="/platforms/money-loan/dashboard/payments/refunds" routerLinkActive="!text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-700"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  🔄 Refunds & Waivers
                </a>
                <a routerLink="/platforms/money-loan/dashboard/payments/failed" routerLinkActive="!text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-700"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  ⚠️ Failed Payments
                </a>
                <a routerLink="/platforms/money-loan/dashboard/payments/gateway-settings" routerLinkActive="!text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-700"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  ⚙️ Payment Gateway Settings
                </a>
              </div>
            }
          </div>

          <!-- Interest & Rules -->
          <div class="space-y-1">
            <button (click)="toggleSection('interest')"
                    class="w-full flex items-center justify-between px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <div class="flex items-center gap-3">
                <span class="text-xl">📊</span>
                <span class="font-medium">Interest & Rules</span>
              </div>
              <svg class="w-4 h-4 transition-transform" [class.rotate-180]="expandedSections().interest" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            @if (expandedSections().interest) {
              <div class="ml-8 space-y-1">
                <a routerLink="/platforms/money-loan/dashboard/interest/rates" routerLinkActive="!text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-700"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  📉 Interest Rates
                </a>
                <a routerLink="/platforms/money-loan/dashboard/interest/auto-rules" routerLinkActive="!text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-700"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  🔄 Auto Rate Rules
                </a>
                <a routerLink="/platforms/money-loan/dashboard/interest/manual-overrides" routerLinkActive="!text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-700"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  🖊️ Manual Overrides
                </a>
                <a routerLink="/platforms/money-loan/dashboard/interest/calculator" routerLinkActive="!text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-700"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  🧮 Interest Calculator
                </a>
              </div>
            }
          </div>

          <!-- Collections -->
          <div class="space-y-1">
            <button (click)="toggleSection('collections')"
                    class="w-full flex items-center justify-between px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <div class="flex items-center gap-3">
                <span class="text-xl">💼</span>
                <span class="font-medium">Collections</span>
              </div>
              <svg class="w-4 h-4 transition-transform" [class.rotate-180]="expandedSections().collections" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            @if (expandedSections().collections) {
              <div class="ml-8 space-y-1">
                <a routerLink="/platforms/money-loan/dashboard/collections/overdue-workflow" routerLinkActive="!text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-700"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  📈 Overdue Workflow
                </a>
                <a routerLink="/platforms/money-loan/dashboard/collections/strategies" routerLinkActive="!text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-700"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  📋 Collection Strategies
                </a>
                <a routerLink="/platforms/money-loan/dashboard/collections/legal-actions" routerLinkActive="!text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-700"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  ⚖️ Legal Actions
                </a>
                <a routerLink="/platforms/money-loan/dashboard/collections/recovery" routerLinkActive="!text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-700"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  🔄 Recovery Dashboard
                </a>
              </div>
            }
          </div>

          <!-- Collector Management -->
          <div class="space-y-1">
            <button (click)="toggleSection('collectors')"
                    class="w-full flex items-center justify-between px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <div class="flex items-center gap-3">
                <span class="text-xl">📱</span>
                <span class="font-medium">Collectors</span>
              </div>
              <svg class="w-4 h-4 transition-transform" [class.rotate-180]="expandedSections().collectors" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            @if (expandedSections().collectors) {
              <div class="ml-8 space-y-1">
                <a routerLink="/platforms/money-loan/dashboard/collectors/performance" routerLinkActive="!text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-700"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  📈 Performance
                </a>
                <a routerLink="/platforms/money-loan/dashboard/collectors/targets" routerLinkActive="!text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-700"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  🎯 Targets
                </a>
                <a routerLink="/platforms/money-loan/dashboard/collectors/limits" routerLinkActive="!text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-700"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  📊 Limits
                </a>
                <a routerLink="/platforms/money-loan/dashboard/collectors/routes" routerLinkActive="!text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-700"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  🗺️ Routes & GPS
                </a>
                <a routerLink="/platforms/money-loan/dashboard/collectors/waivers" routerLinkActive="!text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-700"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  💰 Penalty Waivers
                </a>
                <a routerLink="/platforms/money-loan/dashboard/collectors/action-logs" routerLinkActive="!text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-700"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  📋 Activity Logs
                </a>
              </div>
            }
          </div>

          <!-- KYC Verification -->
          <div class="space-y-1">
            <button (click)="toggleSection('kyc')"
                    class="w-full flex items-center justify-between px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <div class="flex items-center gap-3">
                <span class="text-xl">✅</span>
                <span class="font-medium">KYC Verification</span>
              </div>
              <svg class="w-4 h-4 transition-transform" [class.rotate-180]="expandedSections().kyc" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            @if (expandedSections().kyc) {
              <div class="ml-8 space-y-1">
                <a routerLink="/platforms/money-loan/dashboard/kyc/pending" routerLinkActive="!text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-700"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  ⏳ Pending Reviews
                </a>
                <a routerLink="/platforms/money-loan/dashboard/kyc/verified" routerLinkActive="!text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-700"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  ✅ Verified Customers
                </a>
                <a routerLink="/platforms/money-loan/dashboard/kyc/rejected" routerLinkActive="!text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-700"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  ❌ Rejected Customers
                </a>
                <a routerLink="/platforms/money-loan/dashboard/kyc/audit-logs" routerLinkActive="!text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-700"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  📜 KYC Audit Logs
                </a>
                <a routerLink="/platforms/money-loan/dashboard/kyc/webhook-logs" routerLinkActive="!text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-700"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  📡 Onfido Webhook Logs
                </a>
              </div>
            }
          </div>

          <!-- Reports -->
          <div class="space-y-1">
            <button (click)="toggleSection('reports')"
                    class="w-full flex items-center justify-between px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <div class="flex items-center gap-3">
                <span class="text-xl">📈</span>
                <span class="font-medium">Reports</span>
              </div>
              <svg class="w-4 h-4 transition-transform" [class.rotate-180]="expandedSections().reports" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            @if (expandedSections().reports) {
              <div class="ml-8 space-y-1">
                <a routerLink="/platforms/money-loan/dashboard/reports/periodic" routerLinkActive="!text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-700"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  🗓️ Daily/Weekly/Monthly
                </a>
                <a routerLink="/platforms/money-loan/dashboard/reports/tax-summary" routerLinkActive="!text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-700"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  🧾 Tax Summary
                </a>
                <a routerLink="/platforms/money-loan/dashboard/reports/export" routerLinkActive="!text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-700"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  📤 Export Data
                </a>
                <a routerLink="/platforms/money-loan/dashboard/reports/custom-queries" routerLinkActive="!text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-700"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  🧑‍💻 Custom Queries
                </a>
              </div>
            }
          </div>

          <!-- Audit Log -->
          <a routerLink="/platforms/money-loan/dashboard/audit-log"
             routerLinkActive="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
             class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <span class="text-xl">📜</span>
            <span class="font-medium">Audit Log</span>
          </a>

          <!-- Notifications -->
          <a routerLink="/platforms/money-loan/dashboard/notifications"
             routerLinkActive="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
             class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <span class="text-xl">🔔</span>
            <span class="font-medium">Notifications</span>
          </a>

          <!-- User Management -->
          <a routerLink="/platforms/money-loan/dashboard/users"
             routerLinkActive="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
             class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <span class="text-xl">🧑‍💻</span>
            <span class="font-medium">User Management</span>
          </a>

          <!-- Integration Settings -->
          <a routerLink="/platforms/money-loan/dashboard/integrations"
             routerLinkActive="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
             class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <span class="text-xl">🔌</span>
            <span class="font-medium">Integration Settings</span>
          </a>

          <!-- Settings / Configuration -->
          <div class="space-y-1">
            <button (click)="toggleSection('settings')"
                    class="w-full flex items-center justify-between px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <div class="flex items-center gap-3">
                <span class="text-xl">⚙️</span>
                <span class="font-medium">Settings</span>
              </div>
              <svg class="w-4 h-4 transition-transform" [class.rotate-180]="expandedSections().settings" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"/>
              </svg>
            </button>
            @if (expandedSections().settings) {
              <div class="ml-8 space-y-1">
                <a routerLink="/platforms/money-loan/dashboard/config/quick-product" routerLinkActive="!text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-700"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  ⚡ Quick Create Product
                </a>
                <a routerLink="/platforms/money-loan/dashboard/config/loan-products" routerLinkActive="!text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-700"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  📦 Loan Products
                </a>
                <a routerLink="/platforms/money-loan/dashboard/config/payment-schedules" routerLinkActive="!text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-700"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  📅 Payment Schedules
                </a>
                <a routerLink="/platforms/money-loan/dashboard/config/fees" routerLinkActive="!text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-700"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  💰 Fee Structures
                </a>
                <a routerLink="/platforms/money-loan/dashboard/config/approval-rules" routerLinkActive="!text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-700"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  ✅ Approval Rules
                </a>
                <a routerLink="/platforms/money-loan/dashboard/config/modifications" routerLinkActive="!text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-700"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  🔄 Loan Modifications
                </a>
                <a routerLink="/platforms/money-loan/dashboard/loans/calculator" routerLinkActive="!text-gray-900 dark:!text-white bg-gray-100 dark:bg-gray-700"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  🧮 Loan Calculator
                </a>
              </div>
            }
          </div>
        </nav>

        <!-- User Info -->
        <div class="sticky bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <span class="text-white font-semibold">{{ getInitials() }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ userName() }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 truncate">Money Loan Staff</p>
            </div>
          </div>
        </div>
      </aside>

      <!-- Main Content -->
      <div
        class="flex-1 flex flex-col overflow-hidden transition-all duration-300 ease-in-out"
        [style.margin-left]="sidebarOpen() ? '16rem' : '0'">
        <!-- Top Navigation Bar -->
        <header class="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-6">
          <!-- Left: Menu Toggle -->
          <div class="flex items-center gap-4">
            <button
              (click)="toggleSidebar()"
              class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
            <span class="text-lg font-bold text-gray-900 dark:text-white md:hidden">Money Loan</span>
          </div>

          <!-- Right: User Info -->
          <div class="flex items-center gap-4">
            <!-- Dev Info Icon -->
            <app-dev-info />
            
            <div class="relative">
              <button
                (click)="toggleUserMenu()"
                class="flex items-center gap-3 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg p-2 transition-colors">
                <div class="text-right hidden sm:block pointer-events-none">
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ userName() }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">Money Loan Staff</p>
                </div>
                <div class="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center pointer-events-none">
                  <span class="text-white font-semibold">{{ getInitials() }}</span>
                </div>
                <svg class="w-4 h-4 text-gray-400 pointer-events-none" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
                </svg>
              </button>

              @if (showUserMenu()) {
                <div class="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50">
                  <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ userName() }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Money Loan Staff</p>
                  </div>
                  <button
                    (click)="navigateTo('/profile'); showUserMenu.set(false)"
                    class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                    </svg>
                    Profile
                  </button>
                  <button
                    (click)="navigateTo('/settings'); showUserMenu.set(false)"
                    class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                    </svg>
                    Settings
                  </button>
                  <div class="border-t border-gray-200 dark:border-gray-700 my-1"></div>
                  <button
                    (click)="logout()"
                    class="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                    </svg>
                    Logout
                  </button>
                </div>
              }
            </div>
          </div>
        </header>

        <!-- Page Content -->
        <main class="flex-1 overflow-y-auto bg-gray-50 dark:bg-gray-900">
          <router-outlet></router-outlet>
        </main>
      </div>

      <!-- Overlay (Mobile) -->
      @if (sidebarOpen()) {
        <div (click)="toggleSidebar()"
             class="fixed inset-0 bg-black bg-opacity-50 z-40 md:hidden"></div>
      }
    </div>
  `
})
export class MoneyLoanLayoutComponent {
  sidebarOpen = signal(true); // Default to true for desktop
  userName = signal('Admin User');
  showUserMenu = signal(false);

  expandedSections = signal({
    customers: false,
    loans: false,
    payments: false,
    interest: false,
    collections: false,
    collectors: false,
    kyc: false,
    reports: false,
    settings: false
  });

  private authService = inject(AuthService);

  constructor(private router: Router) {
    this.loadUserInfo();
    // Initialize sidebar visibility based on screen size
    this.initializeSidebar();
  }

  initializeSidebar() {
    // Show sidebar by default on desktop (>= 768px), hide on mobile
    const isDesktop = window.innerWidth >= 768;
    this.sidebarOpen.set(isDesktop);

    // Listen to window resize
    window.addEventListener('resize', () => {
      const isDesktop = window.innerWidth >= 768;
      this.sidebarOpen.set(isDesktop);
    });
  }

  loadUserInfo() {
    const userData = localStorage.getItem('user');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        this.userName.set(`${user.firstName} ${user.lastName}`);
      } catch (e) {
        console.error('Error parsing user data:', e);
      }
    }
  }

  getInitials(): string {
    const name = this.userName();
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }

  toggleSection(section: string) {
    this.expandedSections.update(sections => ({
      ...sections,
      [section]: !sections[section as keyof typeof sections]
    }));
  }

  toggleUserMenu() {
    this.showUserMenu.update(v => !v);
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
    this.showUserMenu.set(false);
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        this.router.navigate(['/login']);
      }
    });
  }
}


