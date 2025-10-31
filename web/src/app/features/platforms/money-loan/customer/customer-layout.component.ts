import { Component, signal, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { DevInfoComponent } from '../../../../shared/components/dev-info/dev-info.component';

@Component({
  selector: 'app-customer-layout',
  standalone: true,
  imports: [CommonModule, RouterOutlet, RouterLink, RouterLinkActive, DevInfoComponent],
  template: `
    <div class="flex h-screen bg-gray-50 dark:bg-gray-900">
      <!-- Sidebar -->
      <aside
             class="fixed md:relative inset-y-0 left-0 z-50 md:z-auto h-screen bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 transform transition-all duration-300 ease-in-out overflow-y-auto"
             [class.-translate-x-full]="!sidebarOpen()"
             [class.translate-x-0]="sidebarOpen()"
             [class.w-64]="sidebarOpen()"
             [class.w-0]="!sidebarOpen()"
             [class.md:border-r-0]="!sidebarOpen()">

        <!-- Logo / Tenant Info -->
        <div class="flex items-center justify-between h-16 px-6 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-blue-600 to-purple-600 rounded-full flex items-center justify-center">
              <span class="text-white font-bold text-sm">{{ getTenantInitials() }}</span>
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-sm font-bold text-gray-900 dark:text-white truncate">{{ tenantName() }}</p>
              <p class="text-xs text-gray-500 dark:text-gray-400">Customer Portal</p>
            </div>
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
          <a routerLink="/platforms/money-loan/customer/dashboard"
             routerLinkActive="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
             [routerLinkActiveOptions]="{exact: true}"
             class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <span class="text-xl">📊</span>
            <span class="font-medium">Dashboard</span>
          </a>

          <!-- My Loans -->
          <a routerLink="/platforms/money-loan/customer/loans"
             routerLinkActive="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
             class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <span class="text-xl">📝</span>
            <span class="font-medium">My Loans</span>
          </a>

          <!-- Apply for Loan -->
          <a routerLink="/platforms/money-loan/customer/apply"
             routerLinkActive="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
             class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <span class="text-xl">➕</span>
            <span class="font-medium">Apply for Loan</span>
          </a>

          <!-- Products -->
          <a routerLink="/platforms/money-loan/customer/products"
             routerLinkActive="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
             class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <span class="text-xl">💼</span>
            <span class="font-medium">Loan Products</span>
          </a>

          <!-- Make Payment -->
          <a routerLink="/platforms/money-loan/customer/payment"
             routerLinkActive="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
             class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <span class="text-xl">💳</span>
            <span class="font-medium">Make Payment</span>
          </a>

          <!-- Divider -->
          <div class="my-4 border-t border-gray-200 dark:border-gray-700"></div>

          <!-- Account -->
          <a routerLink="/platforms/money-loan/customer/account"
             routerLinkActive="bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400"
             class="flex items-center gap-3 px-4 py-3 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
            <span class="text-xl">👤</span>
            <span class="font-medium">My Account</span>
          </a>

          <!-- Logout -->
          <button (click)="logout()"
                  class="w-full flex items-center gap-3 px-4 py-3 rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
            <span class="text-xl">🚪</span>
            <span class="font-medium">Logout</span>
          </button>
        </nav>

        <!-- User Info - Customer Name -->
        <div class="absolute bottom-0 left-0 right-0 p-4 border-t border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center">
              <span class="text-white font-semibold">{{ getCustomerInitials() }}</span>
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
        class="flex-1 flex flex-col overflow-hidden w-full transition-all duration-300 ease-in-out">
        <!-- Top Navigation Bar -->
        <header class="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-6">
          <!-- Left: Menu Toggle & Platform Name -->
          <div class="flex items-center gap-4">
            <button
              (click)="toggleSidebar()"
              class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
              </svg>
            </button>
            
            <!-- Dev Info Icon -->
            <app-dev-info />
            
            <div class="flex items-center gap-2">
              <div class="w-8 h-8 bg-gradient-to-br from-blue-600 to-purple-600 rounded-lg flex items-center justify-center">
                <span class="text-white font-bold text-sm">💰</span>
              </div>
              <span class="text-lg font-bold text-gray-900 dark:text-white">{{ platformName() }}</span>
            </div>
          </div>

          <!-- Right: User Info -->
          <div class="flex items-center gap-4">
            <div class="flex items-center gap-3 relative user-menu-container">
              <div class="text-right hidden sm:block">
                <p class="text-sm font-medium text-gray-900 dark:text-white">{{ customerName() }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ customerEmail() }}</p>
              </div>
              <button
                (click)="toggleUserMenu()"
                class="w-10 h-10 bg-gradient-to-br from-green-500 to-emerald-600 rounded-full flex items-center justify-center hover:shadow-lg hover:shadow-green-500/50 transition-all cursor-pointer">
                <span class="text-white font-semibold">{{ getCustomerInitials() }}</span>
              </button>

              <!-- User Menu Dropdown -->
              @if (showUserMenu()) {
                <div class="absolute right-0 mt-2 w-48 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50"
                     style="top: 100%">
                  <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                    <p class="text-sm font-medium text-gray-900 dark:text-white">{{ customerName() }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ customerEmail() }}</p>
                  </div>
                  <button
                    (click)="logout()"
                    class="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 flex items-center gap-2">
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
export class CustomerLayoutComponent implements OnInit {
  private router = Router;

  sidebarOpen = signal(true); // Default to true for desktop
  showUserMenu = signal(false);
  customerName = signal('Guest');
  customerEmail = signal('');
  tenantName = signal('Company Name');
  platformName = signal('Money Loan');

  constructor(private routerService: Router) {
  }

  ngOnInit() {
    this.loadCustomerInfo();
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

  loadCustomerInfo() {
    const customerData = localStorage.getItem('customerData');
    if (customerData) {
      try {
        const customer = JSON.parse(customerData);
        console.log('🔍 Customer Data from localStorage:', customer);
        this.customerName.set(`${customer.firstName} ${customer.lastName}`);
        this.customerEmail.set(customer.email || '');
        this.tenantName.set(customer.tenantName || 'Company Name');
        console.log('📝 Tenant Name set to:', customer.tenantName || 'Company Name');
      } catch (e) {
        console.error('Error parsing customer data:', e);
      }
    }
  }

  getTenantInitials(): string {
    const name = this.tenantName();
    const words = name.split(' ');
    if (words.length >= 2) {
      return (words[0][0] + words[words.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getCustomerInitials(): string {
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

  toggleUserMenu() {
    this.showUserMenu.update(v => !v);
  }

  logout() {
    localStorage.removeItem('customerData');
    localStorage.removeItem('customerToken');
    localStorage.removeItem('customerRefreshToken');
    this.routerService.navigate(['/customer/login']);
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const userMenuContainer = target.closest('.user-menu-container');

    // Close user menu if clicking outside
    if (!userMenuContainer && this.showUserMenu()) {
      this.showUserMenu.set(false);
    }
  }
}
