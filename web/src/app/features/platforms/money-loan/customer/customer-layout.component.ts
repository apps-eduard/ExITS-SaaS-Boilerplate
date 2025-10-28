import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';

@Component({
  selector: 'app-customer-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive],
  template: `
    <div class="flex h-screen bg-gray-50 dark:bg-gray-900">
      <!-- Sidebar -->
      <aside [class.hidden]="!sidebarOpen()"
             class="fixed md:relative inset-y-0 left-0 z-50 w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-transform duration-300 ease-in-out"
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
          <!-- Dashboard -->
          <a routerLink="/products/money-loan/customer/dashboard"
             routerLinkActive="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
             [routerLinkActiveOptions]="{exact: true}"
             class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"/>
            </svg>
            <span class="font-medium">Dashboard</span>
          </a>

          <!-- My Loans -->
          <a routerLink="/products/money-loan/customer/loans"
             routerLinkActive="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
             class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
            </svg>
            <span class="font-medium">My Loans</span>
          </a>

          <!-- Apply for Loan -->
          <a routerLink="/products/money-loan/customer/apply"
             routerLinkActive="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
             class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            <span class="font-medium">Apply for Loan</span>
          </a>

          <!-- Make Payment -->
          <a routerLink="/products/money-loan/customer/payment"
             routerLinkActive="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
             class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            <span class="font-medium">Make Payment</span>
          </a>

          <!-- Divider -->
          <div class="my-4 border-t border-gray-200 dark:border-gray-700"></div>

          <!-- Account -->
          <a routerLink="/products/money-loan/customer/account"
             routerLinkActive="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
             class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            <span class="font-medium">My Account</span>
          </a>

          <!-- Logout -->
          <button (click)="logout()"
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
            </svg>
            <span class="font-medium">Logout</span>
          </button>
        </nav>

        <!-- User Info -->
        <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <span class="text-white font-semibold">{{ getInitials() }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ customerName() }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400 truncate">{{ customerEmail() }}</p>
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
            <div class="flex items-center gap-3">
              <div class="text-right hidden sm:block">
                <p class="text-sm font-medium text-gray-900 dark:text-white">{{ customerName() }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ customerEmail() }}</p>
              </div>
              <div class="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
                <span class="text-white font-semibold">{{ getInitials() }}</span>
              </div>
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
export class CustomerLayoutComponent {
  private router = Router;

  sidebarOpen = signal(false);
  customerName = signal('Guest');
  customerEmail = signal('');

  constructor(private routerService: Router) {
    this.loadCustomerInfo();
  }

  loadCustomerInfo() {
    const customerData = localStorage.getItem('customer');
    if (customerData) {
      try {
        const customer = JSON.parse(customerData);
        this.customerName.set(`${customer.firstName} ${customer.lastName}`);
        this.customerEmail.set(customer.email || '');
      } catch (e) {
        console.error('Error parsing customer data:', e);
      }
    }
  }

  getInitials(): string {
    const name = this.customerName();
    const parts = name.split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  toggleSidebar() {
    this.sidebarOpen.update(v => !v);
  }

  logout() {
    if (confirm('Are you sure you want to logout?')) {
      localStorage.removeItem('customer');
      localStorage.removeItem('customerToken');
      this.routerService.navigate(['/customer/login']);
    }
  }
}
