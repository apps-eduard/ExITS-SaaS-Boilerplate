import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';

@Component({
  selector: 'app-money-loan-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="flex h-screen bg-gray-50 dark:bg-gray-900">
      <!-- Sidebar -->
      <aside [class.hidden]="!sidebarOpen()" 
             class="fixed inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out md:relative md:translate-x-0 overflow-y-auto"
             [class.-translate-x-full]="!sidebarOpen()">
        
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
          <a routerLink="/products/money-loan/dashboard"
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
                <a routerLink="/products/money-loan/dashboard/customers/all" routerLinkActive="text-blue-600 dark:text-blue-400"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  🧑‍🤝‍🧑 All Customers
                </a>
                <a routerLink="/products/money-loan/dashboard/customers/new" routerLinkActive="text-blue-600 dark:text-blue-400"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  ✨ New Customers
                </a>
                <a routerLink="/products/money-loan/dashboard/customers/kyc-pending" routerLinkActive="text-blue-600 dark:text-blue-400"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  ⏳ KYC Pending
                </a>
                <a routerLink="/products/money-loan/dashboard/customers/high-risk" routerLinkActive="text-blue-600 dark:text-blue-400"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  ⚠️ High-Risk Flags
                </a>
                <a routerLink="/products/money-loan/dashboard/customers/search" routerLinkActive="text-blue-600 dark:text-blue-400"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  🔍 Customer Search
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
                <a routerLink="/products/money-loan/dashboard/loans/all" routerLinkActive="text-blue-600 dark:text-blue-400"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  📜 All Loans
                </a>
                <a routerLink="/products/money-loan/dashboard/loans/pending" routerLinkActive="text-blue-600 dark:text-blue-400"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  📝 Pending Approval
                </a>
                <a routerLink="/products/money-loan/dashboard/loans/active" routerLinkActive="text-blue-600 dark:text-blue-400"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  🔄 Active Loans
                </a>
                <a routerLink="/products/money-loan/dashboard/loans/overdue" routerLinkActive="text-blue-600 dark:text-blue-400"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  🕔 Overdue Loans
                </a>
                <a routerLink="/products/money-loan/dashboard/loans/closed" routerLinkActive="text-blue-600 dark:text-blue-400"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  ✅ Closed/Paid Off
                </a>
                <a routerLink="/products/money-loan/dashboard/loans/disbursement" routerLinkActive="text-blue-600 dark:text-blue-400"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  💸 Loan Disbursement
                </a>
                <a routerLink="/products/money-loan/dashboard/loans/calculator" routerLinkActive="text-blue-600 dark:text-blue-400"
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
                <a routerLink="/products/money-loan/dashboard/payments/today" routerLinkActive="text-blue-600 dark:text-blue-400"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  📅 Today's Collections
                </a>
                <a routerLink="/products/money-loan/dashboard/payments/history" routerLinkActive="text-blue-600 dark:text-blue-400"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  📜 Payment History
                </a>
                <a routerLink="/products/money-loan/dashboard/payments/bulk-import" routerLinkActive="text-blue-600 dark:text-blue-400"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  📤 Bulk Import Payments
                </a>
                <a routerLink="/products/money-loan/dashboard/payments/refunds" routerLinkActive="text-blue-600 dark:text-blue-400"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  🔄 Refunds & Waivers
                </a>
                <a routerLink="/products/money-loan/dashboard/payments/failed" routerLinkActive="text-blue-600 dark:text-blue-400"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  ⚠️ Failed Payments
                </a>
                <a routerLink="/products/money-loan/dashboard/payments/gateway-settings" routerLinkActive="text-blue-600 dark:text-blue-400"
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
                <a routerLink="/products/money-loan/dashboard/interest/rates" routerLinkActive="text-blue-600 dark:text-blue-400"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  📉 Interest Rates
                </a>
                <a routerLink="/products/money-loan/dashboard/interest/auto-rules" routerLinkActive="text-blue-600 dark:text-blue-400"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  🔄 Auto Rate Rules
                </a>
                <a routerLink="/products/money-loan/dashboard/interest/manual-overrides" routerLinkActive="text-blue-600 dark:text-blue-400"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  🖊️ Manual Overrides
                </a>
                <a routerLink="/products/money-loan/dashboard/interest/calculator" routerLinkActive="text-blue-600 dark:text-blue-400"
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
                <a routerLink="/products/money-loan/dashboard/collections/overdue-workflow" routerLinkActive="text-blue-600 dark:text-blue-400"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  📈 Overdue Workflow
                </a>
                <a routerLink="/products/money-loan/dashboard/collections/strategies" routerLinkActive="text-blue-600 dark:text-blue-400"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  📋 Collection Strategies
                </a>
                <a routerLink="/products/money-loan/dashboard/collections/legal-actions" routerLinkActive="text-blue-600 dark:text-blue-400"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  ⚖️ Legal Actions
                </a>
                <a routerLink="/products/money-loan/dashboard/collections/recovery" routerLinkActive="text-blue-600 dark:text-blue-400"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  🔄 Recovery Dashboard
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
                <a routerLink="/products/money-loan/dashboard/kyc/pending" routerLinkActive="text-blue-600 dark:text-blue-400"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  ⏳ Pending Reviews
                </a>
                <a routerLink="/products/money-loan/dashboard/kyc/verified" routerLinkActive="text-blue-600 dark:text-blue-400"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  ✅ Verified Customers
                </a>
                <a routerLink="/products/money-loan/dashboard/kyc/rejected" routerLinkActive="text-blue-600 dark:text-blue-400"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  ❌ Rejected Customers
                </a>
                <a routerLink="/products/money-loan/dashboard/kyc/audit-logs" routerLinkActive="text-blue-600 dark:text-blue-400"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  📜 KYC Audit Logs
                </a>
                <a routerLink="/products/money-loan/dashboard/kyc/webhook-logs" routerLinkActive="text-blue-600 dark:text-blue-400"
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
                <a routerLink="/products/money-loan/dashboard/reports/periodic" routerLinkActive="text-blue-600 dark:text-blue-400"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  🗓️ Daily/Weekly/Monthly
                </a>
                <a routerLink="/products/money-loan/dashboard/reports/tax-summary" routerLinkActive="text-blue-600 dark:text-blue-400"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  🧾 Tax Summary
                </a>
                <a routerLink="/products/money-loan/dashboard/reports/export" routerLinkActive="text-blue-600 dark:text-blue-400"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  📤 Export Data
                </a>
                <a routerLink="/products/money-loan/dashboard/reports/custom-queries" routerLinkActive="text-blue-600 dark:text-blue-400"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  🧑‍💻 Custom Queries
                </a>
              </div>
            }
          </div>

          <!-- Settings -->
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
                <a routerLink="/products/money-loan/dashboard/settings/roles-permissions" routerLinkActive="text-blue-600 dark:text-blue-400"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  🔑 Roles & Permissions
                </a>
                <a routerLink="/products/money-loan/dashboard/settings/loan-products" routerLinkActive="text-blue-600 dark:text-blue-400"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  🏷️ Loan Product Settings
                </a>
                <a routerLink="/products/money-loan/dashboard/settings/templates" routerLinkActive="text-blue-600 dark:text-blue-400"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  📨 SMS/Email Templates
                </a>
                <a routerLink="/products/money-loan/dashboard/settings/branding" routerLinkActive="text-blue-600 dark:text-blue-400"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  🎨 Company Branding
                </a>
                <a routerLink="/products/money-loan/dashboard/settings/api-keys" routerLinkActive="text-blue-600 dark:text-blue-400"
                   class="block px-4 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white">
                  🔑 API Keys
                </a>
              </div>
            }
          </div>

          <!-- Audit Log -->
          <a routerLink="/products/money-loan/dashboard/audit-log"
             routerLinkActive="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
             class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <span class="text-xl">📜</span>
            <span class="font-medium">Audit Log</span>
          </a>

          <!-- Notifications -->
          <a routerLink="/products/money-loan/dashboard/notifications"
             routerLinkActive="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
             class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <span class="text-xl">🔔</span>
            <span class="font-medium">Notifications</span>
          </a>

          <!-- User Management -->
          <a routerLink="/products/money-loan/dashboard/users"
             routerLinkActive="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
             class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <span class="text-xl">🧑‍💻</span>
            <span class="font-medium">User Management</span>
          </a>

          <!-- Integration Settings -->
          <a routerLink="/products/money-loan/dashboard/integrations"
             routerLinkActive="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
             class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <span class="text-xl">🔌</span>
            <span class="font-medium">Integration Settings</span>
          </a>
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
      <div class="flex-1 flex flex-col overflow-hidden">
        <!-- Top Bar (Mobile) -->
        <header class="md:hidden flex items-center justify-between h-16 px-4 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
          <button (click)="toggleSidebar()" class="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
            </svg>
          </button>
          <span class="text-lg font-bold text-gray-900 dark:text-white">Money Loan</span>
          <div class="w-6"></div>
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
  sidebarOpen = signal(false);
  userName = signal('Admin User');
  
  expandedSections = signal({
    customers: false,
    loans: false,
    payments: false,
    interest: false,
    collections: false,
    kyc: false,
    reports: false,
    settings: false
  });

  constructor(private router: Router) {
    this.loadUserInfo();
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
}
