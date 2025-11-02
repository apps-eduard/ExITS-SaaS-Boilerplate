// Customer Dashboard Page - Modern Ionic 8 + Tailwind Design
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonCard,
  IonButton,
  IonIcon,
  IonBadge,
  IonSkeletonText,
  IonButtons
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  walletOutline, 
  cardOutline, 
  timeOutline, 
  checkmarkCircleOutline,
  trendingUpOutline,
  documentTextOutline,
  addCircleOutline,
  arrowForwardOutline,
  personCircleOutline,
  logOutOutline,
  moonOutline,
  sunnyOutline
} from 'ionicons/icons';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

interface DashboardStats {
  totalLoans: number;
  activeLoans: number;
  totalBorrowed: number;
  totalPaid: number;
  remainingBalance: number;
  nextPaymentAmount: number;
  nextPaymentDate: string;
}

interface RecentLoan {
  id: number;
  loanNumber: string;
  amount: number;
  balance: number;
  status: string;
  dueDate: string;
}

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonCard,
    IonButton,
    IonIcon,
    IonBadge,
    IonSkeletonText,
    IonButtons
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar class="bg-gradient-to-r from-blue-600 to-blue-800 text-white">
        <ion-buttons slot="start">
          <ion-button (click)="logout()">
            <ion-icon name="log-out-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title class="font-bold">My Dashboard</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="themeService.toggleTheme()">
            <ion-icon [name]="themeService.isDark() ? 'sunny-outline' : 'moon-outline'" slot="icon-only"></ion-icon>
          </ion-button>
          <ion-button>
            <ion-icon name="person-circle-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="bg-gray-50 dark:bg-gray-900">
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="p-4 space-y-4">
        
        <!-- Welcome Banner -->
        <div class="bg-gradient-to-br from-blue-500 via-blue-600 to-purple-600 rounded-2xl p-6 text-white shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm opacity-90">Welcome back,</p>
              <h1 class="text-2xl font-bold mt-1">{{ currentUser()?.firstName || 'Customer' }}</h1>
              <p class="text-xs opacity-75 mt-1">Manage your loans and payments</p>
            </div>
            <div class="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <ion-icon name="person-circle-outline" class="text-4xl"></ion-icon>
            </div>
          </div>
        </div>

        <!-- Quick Stats -->
        <div class="grid grid-cols-2 gap-3">
          <!-- Total Borrowed -->
          <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-100 dark:border-gray-700">
            <div class="flex items-center justify-between mb-2">
              <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
                <ion-icon name="wallet-outline" class="text-xl text-blue-600 dark:text-blue-400"></ion-icon>
              </div>
              <ion-badge color="primary" class="text-xs">{{ stats().activeLoans }}</ion-badge>
            </div>
            @if (loading()) {
              <ion-skeleton-text animated class="w-20 h-6 rounded"></ion-skeleton-text>
            } @else {
              <p class="text-2xl font-bold text-gray-900 dark:text-white">₱{{ formatCurrency(stats().totalBorrowed) }}</p>
            }
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Borrowed</p>
          </div>

          <!-- Outstanding Balance -->
          <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-100 dark:border-gray-700">
            <div class="flex items-center justify-between mb-2">
              <div class="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
                <ion-icon name="time-outline" class="text-xl text-orange-600 dark:text-orange-400"></ion-icon>
              </div>
            </div>
            @if (loading()) {
              <ion-skeleton-text animated class="w-20 h-6 rounded"></ion-skeleton-text>
            } @else {
              <p class="text-2xl font-bold text-gray-900 dark:text-white">₱{{ formatCurrency(stats().remainingBalance) }}</p>
            }
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Balance Due</p>
          </div>

          <!-- Total Paid -->
          <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-100 dark:border-gray-700">
            <div class="flex items-center justify-between mb-2">
              <div class="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <ion-icon name="checkmark-circle-outline" class="text-xl text-green-600 dark:text-green-400"></ion-icon>
              </div>
            </div>
            @if (loading()) {
              <ion-skeleton-text animated class="w-20 h-6 rounded"></ion-skeleton-text>
            } @else {
              <p class="text-2xl font-bold text-gray-900 dark:text-white">₱{{ formatCurrency(stats().totalPaid) }}</p>
            }
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Total Paid</p>
          </div>

          <!-- Payment Progress -->
          <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-100 dark:border-gray-700">
            <div class="flex items-center justify-between mb-2">
              <div class="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center">
                <ion-icon name="trending-up-outline" class="text-xl text-purple-600 dark:text-purple-400"></ion-icon>
              </div>
            </div>
            @if (loading()) {
              <ion-skeleton-text animated class="w-20 h-6 rounded"></ion-skeleton-text>
            } @else {
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ paymentProgress() }}%</p>
            }
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Paid Off</p>
          </div>
        </div>

        <!-- Next Payment Due -->
        @if (stats().nextPaymentAmount > 0) {
          <ion-card class="m-0 shadow-lg rounded-2xl border-2 border-orange-200 dark:border-orange-800 overflow-hidden">
            <div class="bg-gradient-to-r from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 p-4">
              <div class="flex items-center justify-between">
                <div>
                  <p class="text-xs font-semibold text-orange-600 dark:text-orange-400 uppercase tracking-wide">Next Payment Due</p>
                  <p class="text-3xl font-bold text-gray-900 dark:text-white mt-1">₱{{ formatCurrency(stats().nextPaymentAmount) }}</p>
                  <p class="text-sm text-gray-600 dark:text-gray-300 mt-2">
                    <ion-icon name="time-outline" class="text-orange-500 mr-1"></ion-icon>
                    Due: {{ stats().nextPaymentDate }}
                  </p>
                </div>
                <ion-button 
                  routerLink="/customer/payments"
                  class="font-semibold"
                  color="warning"
                >
                  Pay Now
                  <ion-icon name="arrow-forward-outline" slot="end"></ion-icon>
                </ion-button>
              </div>
            </div>
          </ion-card>
        }

        <!-- Quick Actions -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md">
          <h2 class="text-base font-bold text-gray-900 dark:text-white mb-3">Quick Actions</h2>
          <div class="grid grid-cols-2 gap-3">
            <button
              routerLink="/customer/loans"
              class="flex flex-col items-center p-4 bg-blue-50 dark:bg-blue-900/20 rounded-xl border-2 border-blue-200 dark:border-blue-800 hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all active:scale-95"
            >
              <div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mb-2">
                <ion-icon name="document-text-outline" class="text-2xl text-white"></ion-icon>
              </div>
              <span class="text-sm font-semibold text-gray-900 dark:text-white">My Loans</span>
            </button>

            <button
              routerLink="/customer/payments"
              class="flex flex-col items-center p-4 bg-green-50 dark:bg-green-900/20 rounded-xl border-2 border-green-200 dark:border-green-800 hover:bg-green-100 dark:hover:bg-green-900/30 transition-all active:scale-95"
            >
              <div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mb-2">
                <ion-icon name="card-outline" class="text-2xl text-white"></ion-icon>
              </div>
              <span class="text-sm font-semibold text-gray-900 dark:text-white">Payments</span>
            </button>

            <button
              routerLink="/customer/apply"
              class="flex flex-col items-center p-4 bg-purple-50 dark:bg-purple-900/20 rounded-xl border-2 border-purple-200 dark:border-purple-800 hover:bg-purple-100 dark:hover:bg-purple-900/30 transition-all active:scale-95"
            >
              <div class="w-12 h-12 bg-purple-500 rounded-full flex items-center justify-center mb-2">
                <ion-icon name="add-circle-outline" class="text-2xl text-white"></ion-icon>
              </div>
              <span class="text-sm font-semibold text-gray-900 dark:text-white">Apply Loan</span>
            </button>

            <button
              routerLink="/customer/products"
              class="flex flex-col items-center p-4 bg-orange-50 dark:bg-orange-900/20 rounded-xl border-2 border-orange-200 dark:border-orange-800 hover:bg-orange-100 dark:hover:bg-orange-900/30 transition-all active:scale-95"
            >
              <div class="w-12 h-12 bg-orange-500 rounded-full flex items-center justify-center mb-2">
                <ion-icon name="wallet-outline" class="text-2xl text-white"></ion-icon>
              </div>
              <span class="text-sm font-semibold text-gray-900 dark:text-white">Products</span>
            </button>
          </div>
        </div>

        <!-- Recent Loans -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md">
          <div class="flex items-center justify-between mb-3">
            <h2 class="text-base font-bold text-gray-900 dark:text-white">Recent Loans</h2>
            <ion-button 
              routerLink="/customer/loans"
              fill="clear" 
              size="small"
              class="text-blue-600 dark:text-blue-400"
            >
              View All
              <ion-icon name="arrow-forward-outline" slot="end"></ion-icon>
            </ion-button>
          </div>

          @if (loading()) {
            <div class="space-y-3">
              @for (i of [1,2,3]; track i) {
                <div class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <ion-skeleton-text animated class="w-32 h-4 rounded mb-2"></ion-skeleton-text>
                  <ion-skeleton-text animated class="w-24 h-6 rounded"></ion-skeleton-text>
                </div>
              }
            </div>
          } @else if (recentLoans().length === 0) {
            <div class="text-center py-8">
              <div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <ion-icon name="document-text-outline" class="text-3xl text-gray-400"></ion-icon>
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400">No loans yet</p>
              <ion-button 
                routerLink="/customer/apply"
                size="small"
                class="mt-3"
              >
                Apply for a Loan
              </ion-button>
            </div>
          } @else {
            <div class="space-y-3">
              @for (loan of recentLoans().slice(0, 3); track loan.id) {
                <div 
                  class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-xl border border-gray-200 dark:border-gray-600 hover:shadow-md transition-shadow cursor-pointer"
                  [routerLink]="['/customer/loans', loan.id]"
                >
                  <div class="flex items-center justify-between mb-2">
                    <span class="text-xs font-semibold text-gray-600 dark:text-gray-400">{{ loan.loanNumber }}</span>
                    <ion-badge 
                      [color]="loan.status === 'active' ? 'success' : loan.status === 'pending' ? 'warning' : 'medium'"
                      class="text-xs"
                    >
                      {{ loan.status }}
                    </ion-badge>
                  </div>
                  <div class="flex items-center justify-between">
                    <div>
                      <p class="text-lg font-bold text-gray-900 dark:text-white">₱{{ formatCurrency(loan.amount) }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">Balance: ₱{{ formatCurrency(loan.balance) }}</p>
                    </div>
                    <div class="text-right">
                      <p class="text-xs text-gray-500 dark:text-gray-400">Due Date</p>
                      <p class="text-xs font-semibold text-gray-900 dark:text-white">{{ loan.dueDate }}</p>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    /* Layout utilities */
    .flex { display: flex; }
    .grid { display: grid; }
    .grid-cols-2 { grid-template-columns: repeat(2, 1fr); }
    .grid-cols-4 { grid-template-columns: repeat(4, 1fr); }
    
    .items-center { align-items: center; }
    .items-start { align-items: flex-start; }
    .justify-between { justify-content: space-between; }
    .justify-center { justify-content: center; }
    
    .gap-3 { gap: 0.75rem; }
    .gap-4 { gap: 1rem; }
    .space-y-4 > * + * { margin-top: 1rem; }
    
    /* Sizing */
    .w-10 { width: 2.5rem; }
    .h-10 { height: 2.5rem; }
    .w-12 { width: 3rem; }
    .h-12 { height: 3rem; }
    .w-16 { width: 4rem; }
    .h-16 { height: 4rem; }
    .w-full { width: 100%; }
    
    /* Spacing */
    .p-2 { padding: 0.5rem; }
    .p-3 { padding: 0.75rem; }
    .p-4 { padding: 1rem; }
    .p-6 { padding: 1.5rem; }
    .mb-1 { margin-bottom: 0.25rem; }
    .mb-2 { margin-bottom: 0.5rem; }
    .mb-3 { margin-bottom: 0.75rem; }
    .mb-4 { margin-bottom: 1rem; }
    .mt-1 { margin-top: 0.25rem; }
    .mt-2 { margin-top: 0.5rem; }
    .mr-1 { margin-right: 0.25rem; }
    .mx-auto { margin-left: auto; margin-right: auto; }
    
    /* Text */
    .text-xs { font-size: 0.75rem; line-height: 1rem; }
    .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
    .text-base { font-size: 1rem; line-height: 1.5rem; }
    .text-lg { font-size: 1.125rem; line-height: 1.75rem; }
    .text-xl { font-size: 1.25rem; line-height: 1.75rem; }
    .text-2xl { font-size: 1.5rem; line-height: 2rem; }
    .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
    
    .font-medium { font-weight: 500; }
    .font-semibold { font-weight: 600; }
    .font-bold { font-weight: 700; }
    
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    
    .opacity-75 { opacity: 0.75; }
    .opacity-90 { opacity: 0.9; }
    
    /* Colors */
    .text-white { color: #ffffff; }
    .text-blue-600 { color: #2563eb; }
    .text-orange-500 { color: #f97316; }
    .text-green-600 { color: #16a34a; }
    .text-purple-600 { color: #9333ea; }
    .text-gray-400 { color: #9ca3af; }
    .text-gray-500 { color: #6b7280; }
    .text-gray-600 { color: #4b5563; }
    .text-gray-900 { color: #111827; }
    
    .bg-white { background-color: #ffffff; }
    .bg-gray-50 { background-color: #f9fafb; }
    .bg-gray-100 { background-color: #f3f4f6; }
    .bg-blue-100 { background-color: #dbeafe; }
    .bg-blue-500 { background-color: #3b82f6; }
    .bg-blue-600 { background-color: #2563eb; }
    .bg-orange-100 { background-color: #ffedd5; }
    .bg-green-100 { background-color: #dcfce7; }
    .bg-green-500 { background-color: #22c55e; }
    .bg-purple-100 { background-color: #f3e8ff; }
    .bg-purple-600 { background-color: #9333ea; }
    
    /* Dark mode colors */
    .dark\\:text-white { color: var(--ion-text-color, #ffffff); }
    .dark\\:text-gray-300 { color: #d1d5db; }
    .dark\\:text-gray-400 { color: #9ca3af; }
    .dark\\:text-blue-400 { color: #60a5fa; }
    .dark\\:text-orange-400 { color: #fb923c; }
    .dark\\:text-green-400 { color: #4ade80; }
    .dark\\:text-purple-400 { color: #c084fc; }
    
    .dark\\:bg-gray-700 { background-color: #374151; }
    .dark\\:bg-gray-800 { background-color: #1f2937; }
    .dark\\:bg-gray-900 { background-color: #111827; }
    .dark\\:bg-blue-900\\/30 { background-color: rgba(30, 58, 138, 0.3); }
    .dark\\:bg-orange-900\\/30 { background-color: rgba(124, 45, 18, 0.3); }
    .dark\\:bg-green-900\\/30 { background-color: rgba(20, 83, 45, 0.3); }
    .dark\\:bg-purple-900\\/30 { background-color: rgba(88, 28, 135, 0.3); }
    
    /* Border */
    .rounded-lg { border-radius: 0.5rem; }
    .rounded-xl { border-radius: 0.75rem; }
    .rounded-2xl { border-radius: 1rem; }
    .rounded-full { border-radius: 9999px; }
    
    .border { border-width: 1px; }
    .border-gray-100 { border-color: #f3f4f6; }
    .border-gray-200 { border-color: #e5e7eb; }
    
    .dark\\:border-gray-700 { border-color: #374151; }
    
    /* Shadow */
    .shadow-md {
      box-shadow: 0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1);
    }
    .shadow-lg {
      box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    }
    
    /* Effects */
    .backdrop-blur-sm { backdrop-filter: blur(4px); }
    
    /* Gradients */
    .bg-gradient-to-br {
      background-image: linear-gradient(to bottom right, var(--tw-gradient-stops));
    }
    .bg-gradient-to-r {
      background-image: linear-gradient(to right, var(--tw-gradient-stops));
    }
    
    .from-blue-500 { --tw-gradient-from: #3b82f6; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(59, 130, 246, 0)); }
    .via-blue-600 { --tw-gradient-stops: var(--tw-gradient-from), #2563eb, var(--tw-gradient-to, rgba(37, 99, 235, 0)); }
    .to-purple-600 { --tw-gradient-to: #9333ea; }
    
    .from-blue-600 { --tw-gradient-from: #2563eb; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(37, 99, 235, 0)); }
    .to-blue-800 { --tw-gradient-to: #1e40af; }
    
    /* Progress bar */
    .transition-all { transition-property: all; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
    .duration-500 { transition-duration: 500ms; }
    
    /* Hover effects */
    .hover\\:shadow-lg:hover {
      box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    }
    
    /* Cursor */
    .cursor-pointer { cursor: pointer; }
  `]
})
export class CustomerDashboardPage implements OnInit {
  loading = signal(false);
  currentUser = signal<any>(null);
  stats = signal<DashboardStats>({
    totalLoans: 0,
    activeLoans: 0,
    totalBorrowed: 0,
    totalPaid: 0,
    remainingBalance: 0,
    nextPaymentAmount: 0,
    nextPaymentDate: ''
  });
  recentLoans = signal<RecentLoan[]>([]);

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private router: Router,
    public themeService: ThemeService
  ) {
    addIcons({
      walletOutline,
      cardOutline,
      timeOutline,
      checkmarkCircleOutline,
      trendingUpOutline,
      documentTextOutline,
      addCircleOutline,
      arrowForwardOutline,
      personCircleOutline,
      logOutOutline,
      moonOutline,
      sunnyOutline
    });
  }

  ngOnInit() {
    this.currentUser.set(this.authService.currentUser());
    this.loadDashboardData();
  }

  async loadDashboardData() {
    this.loading.set(true);
    try {
      const customerId = this.authService.getCurrentUserId();
      if (customerId) {
        // Load dashboard stats
        const dashboardData = await this.apiService.getCustomerDashboard(customerId).toPromise();
        this.stats.set(dashboardData.stats);
        
        // Load recent loans
        const loans = await this.apiService.getCustomerLoans(customerId).toPromise();
        this.recentLoans.set(loans || []);
      }
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
      // Set mock data for development
      this.setMockData();
    } finally {
      this.loading.set(false);
    }
  }

  setMockData() {
    this.stats.set({
      totalLoans: 3,
      activeLoans: 2,
      totalBorrowed: 150000,
      totalPaid: 45000,
      remainingBalance: 105000,
      nextPaymentAmount: 5250,
      nextPaymentDate: 'Nov 15, 2025'
    });

    this.recentLoans.set([
      { id: 1, loanNumber: 'LN-2024-001', amount: 50000, balance: 35000, status: 'active', dueDate: 'Nov 15, 2025' },
      { id: 2, loanNumber: 'LN-2024-002', amount: 75000, balance: 70000, status: 'active', dueDate: 'Nov 20, 2025' },
      { id: 3, loanNumber: 'LN-2023-045', amount: 25000, balance: 0, status: 'completed', dueDate: 'Paid in Full' }
    ]);
  }

  async handleRefresh(event: any) {
    await this.loadDashboardData();
    event.target.complete();
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  paymentProgress(): number {
    const total = this.stats().totalBorrowed;
    const paid = this.stats().totalPaid;
    return total > 0 ? Math.round((paid / total) * 100) : 0;
  }

  logout() {
    this.authService.logout();
  }
}
