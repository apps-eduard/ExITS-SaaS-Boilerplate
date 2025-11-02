// Collector Route Page - Modern Ionic 8 + Tailwind Design
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
  IonButton,
  IonIcon,
  IonBadge,
  IonSkeletonText,
  IonButtons,
  IonChip
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  mapOutline,
  locationOutline,
  cashOutline,
  checkmarkCircleOutline,
  timeOutline,
  personOutline,
  callOutline,
  navigateOutline,
  listOutline,
  statsChartOutline,
  logOutOutline,
  syncOutline,
  moonOutline,
  sunnyOutline
} from 'ionicons/icons';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { SyncService } from '../../core/services/sync.service';
import { ThemeService } from '../../core/services/theme.service';

interface RouteCustomer {
  id: number;
  name: string;
  address: string;
  phone: string;
  loanBalance: number;
  amountDue: number;
  dueDate: string;
  status: 'not-visited' | 'visited' | 'collected' | 'missed';
  distance: string;
}

interface CollectionStats {
  totalAssigned: number;
  visited: number;
  collected: number;
  totalCollected: number;
  pendingVisits: number;
}

@Component({
  selector: 'app-collector-route',
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
    IonButton,
    IonIcon,
    IonBadge,
    IonSkeletonText,
    IonButtons,
    IonChip
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar class="bg-gradient-to-r from-purple-600 to-purple-800 text-white">
        <ion-buttons slot="start">
          <ion-button (click)="logout()">
            <ion-icon name="log-out-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title class="font-bold">Collection Route</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="themeService.toggleTheme()">
            <ion-icon [name]="themeService.isDark() ? 'sunny-outline' : 'moon-outline'" slot="icon-only"></ion-icon>
          </ion-button>
          <ion-button (click)="syncNow()">
            <ion-icon [name]="syncing() ? 'sync-outline' : 'sync-outline'" slot="icon-only" [class.animate-spin]="syncing()"></ion-icon>
            @if (syncService.pendingSyncCount() > 0) {
              <ion-badge color="danger" class="absolute -top-1 -right-1 text-xs">
                {{ syncService.pendingSyncCount() }}
              </ion-badge>
            }
          </ion-button>
        </ion-buttons>
      </ion-toolbar>

      <!-- Sync Status Banner -->
      @if (!syncService.isOnline()) {
        <div class="bg-orange-500 text-white px-4 py-2 text-center text-sm font-semibold">
          <ion-icon name="sync-outline" class="mr-1"></ion-icon>
          Offline Mode - {{ syncService.pendingSyncCount() }} pending sync
        </div>
      }
    </ion-header>

    <ion-content class="bg-gray-50 dark:bg-gray-900">
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="p-4 space-y-4">
        
        <!-- Collector Info Banner -->
        <div class="bg-gradient-to-br from-purple-500 via-purple-600 to-indigo-600 rounded-2xl p-6 text-white shadow-lg">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm opacity-90">Field Collector</p>
              <h1 class="text-2xl font-bold mt-1">{{ currentUser()?.firstName || 'Collector' }} {{ currentUser()?.lastName || '' }}</h1>
              <p class="text-xs opacity-75 mt-1">{{ currentDate }}</p>
            </div>
            <div class="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-full flex items-center justify-center">
              <ion-icon name="person-outline" class="text-4xl"></ion-icon>
            </div>
          </div>
        </div>

        <!-- Collection Stats -->
        <div class="grid grid-cols-2 gap-3">
          <!-- Total Assigned -->
          <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-100 dark:border-gray-700">
            <div class="w-10 h-10 bg-purple-100 dark:bg-purple-900/30 rounded-lg flex items-center justify-center mb-2">
              <ion-icon name="list-outline" class="text-xl text-purple-600 dark:text-purple-400"></ion-icon>
            </div>
            @if (loading()) {
              <ion-skeleton-text animated class="w-16 h-6 rounded"></ion-skeleton-text>
            } @else {
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats().totalAssigned }}</p>
            }
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Assigned</p>
          </div>

          <!-- Visited -->
          <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-100 dark:border-gray-700">
            <div class="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center mb-2">
              <ion-icon name="checkmark-circle-outline" class="text-xl text-blue-600 dark:text-blue-400"></ion-icon>
            </div>
            @if (loading()) {
              <ion-skeleton-text animated class="w-16 h-6 rounded"></ion-skeleton-text>
            } @else {
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats().visited }}</p>
            }
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Visited</p>
          </div>

          <!-- Total Collected -->
          <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-100 dark:border-gray-700">
            <div class="w-10 h-10 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center mb-2">
              <ion-icon name="cash-outline" class="text-xl text-green-600 dark:text-green-400"></ion-icon>
            </div>
            @if (loading()) {
              <ion-skeleton-text animated class="w-16 h-6 rounded"></ion-skeleton-text>
            } @else {
              <p class="text-xl font-bold text-gray-900 dark:text-white">₱{{ formatCurrency(stats().totalCollected) }}</p>
            }
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Collected</p>
          </div>

          <!-- Pending -->
          <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md border border-gray-100 dark:border-gray-700">
            <div class="w-10 h-10 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center mb-2">
              <ion-icon name="time-outline" class="text-xl text-orange-600 dark:text-orange-400"></ion-icon>
            </div>
            @if (loading()) {
              <ion-skeleton-text animated class="w-16 h-6 rounded"></ion-skeleton-text>
            } @else {
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats().pendingVisits }}</p>
            }
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Pending</p>
          </div>
        </div>

        <!-- Progress Bar -->
        <div class="bg-white dark:bg-gray-800 rounded-xl p-4 shadow-md">
          <div class="flex items-center justify-between mb-2">
            <span class="text-sm font-semibold text-gray-700 dark:text-gray-300">Today's Progress</span>
            <span class="text-sm font-bold text-purple-600 dark:text-purple-400">{{ progressPercentage() }}%</span>
          </div>
          <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
            <div 
              class="bg-gradient-to-r from-purple-500 to-purple-600 h-full transition-all duration-500 rounded-full"
              [style.width.%]="progressPercentage()"
            ></div>
          </div>
        </div>

        <!-- Filter Chips -->
        <div class="flex gap-2 overflow-x-auto pb-2">
          <ion-chip 
            [class.bg-purple-600]="filter() === 'all'"
            [class.text-white]="filter() === 'all'"
            [class.bg-gray-200]="filter() !== 'all'"
            [class.dark:bg-gray-700]="filter() !== 'all'"
            (click)="setFilter('all')"
            class="cursor-pointer"
          >
            All ({{ customers().length }})
          </ion-chip>
          <ion-chip 
            [class.bg-orange-600]="filter() === 'not-visited'"
            [class.text-white]="filter() === 'not-visited'"
            [class.bg-gray-200]="filter() !== 'not-visited'"
            [class.dark:bg-gray-700]="filter() !== 'not-visited'"
            (click)="setFilter('not-visited')"
            class="cursor-pointer"
          >
            Pending ({{ filterCount('not-visited') }})
          </ion-chip>
          <ion-chip 
            [class.bg-green-600]="filter() === 'collected'"
            [class.text-white]="filter() === 'collected'"
            [class.bg-gray-200]="filter() !== 'collected'"
            [class.dark:bg-gray-700]="filter() !== 'collected'"
            (click)="setFilter('collected')"
            class="cursor-pointer"
          >
            Collected ({{ filterCount('collected') }})
          </ion-chip>
        </div>

        <!-- Customer Route List -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-md">
          <h2 class="text-base font-bold text-gray-900 dark:text-white mb-3">Today's Route</h2>

          @if (loading()) {
            <div class="space-y-3">
              @for (i of [1,2,3,4]; track i) {
                <div class="p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                  <ion-skeleton-text animated class="w-40 h-5 rounded mb-2"></ion-skeleton-text>
                  <ion-skeleton-text animated class="w-32 h-4 rounded"></ion-skeleton-text>
                </div>
              }
            </div>
          } @else if (filteredCustomers().length === 0) {
            <div class="text-center py-8">
              <div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center mx-auto mb-3">
                <ion-icon name="map-outline" class="text-3xl text-gray-400"></ion-icon>
              </div>
              <p class="text-sm text-gray-500 dark:text-gray-400">No customers assigned</p>
            </div>
          } @else {
            <div class="space-y-3">
              @for (customer of filteredCustomers(); track customer.id) {
                <div 
                  class="p-4 rounded-xl border-2 transition-all cursor-pointer hover:shadow-lg"
                  [class.border-orange-200]="customer.status === 'not-visited'"
                  [class.dark:border-orange-800]="customer.status === 'not-visited'"
                  [class.bg-orange-50]="customer.status === 'not-visited'"
                  [class.dark:bg-orange-900/10]="customer.status === 'not-visited'"
                  [class.border-green-200]="customer.status === 'collected'"
                  [class.dark:border-green-800]="customer.status === 'collected'"
                  [class.bg-green-50]="customer.status === 'collected'"
                  [class.dark:bg-green-900/10]="customer.status === 'collected'"
                  [class.border-blue-200]="customer.status === 'visited'"
                  [class.dark:border-blue-800]="customer.status === 'visited'"
                  [class.bg-blue-50]="customer.status === 'visited'"
                  [class.dark:bg-blue-900/10]="customer.status === 'visited'"
                  [class.border-gray-200]="customer.status === 'missed'"
                  [class.dark:border-gray-700]="customer.status === 'missed'"
                  [routerLink]="['/collector/visit', customer.id]"
                >
                  <div class="flex items-start justify-between mb-3">
                    <div class="flex-1">
                      <h3 class="font-bold text-gray-900 dark:text-white text-base">{{ customer.name }}</h3>
                      <p class="text-xs text-gray-600 dark:text-gray-400 mt-1 flex items-center">
                        <ion-icon name="location-outline" class="mr-1"></ion-icon>
                        {{ customer.address }}
                      </p>
                    </div>
                    <ion-badge 
                      [color]="getStatusColor(customer.status)"
                      class="text-xs"
                    >
                      {{ customer.status }}
                    </ion-badge>
                  </div>

                  <div class="grid grid-cols-2 gap-3 mb-3">
                    <div class="bg-white dark:bg-gray-800 rounded-lg p-2">
                      <p class="text-xs text-gray-500 dark:text-gray-400">Amount Due</p>
                      <p class="text-sm font-bold text-gray-900 dark:text-white">₱{{ formatCurrency(customer.amountDue) }}</p>
                    </div>
                    <div class="bg-white dark:bg-gray-800 rounded-lg p-2">
                      <p class="text-xs text-gray-500 dark:text-gray-400">Total Balance</p>
                      <p class="text-sm font-bold text-gray-900 dark:text-white">₱{{ formatCurrency(customer.loanBalance) }}</p>
                    </div>
                  </div>

                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <ion-button 
                        size="small" 
                        fill="clear"
                        [href]="'tel:' + customer.phone"
                        (click)="$event.stopPropagation()"
                      >
                        <ion-icon name="call-outline" slot="icon-only" class="text-purple-600"></ion-icon>
                      </ion-button>
                      <ion-button 
                        size="small" 
                        fill="clear"
                        (click)="openMap(customer); $event.stopPropagation()"
                      >
                        <ion-icon name="navigation-outline" slot="icon-only" class="text-blue-600"></ion-icon>
                      </ion-button>
                    </div>
                    <span class="text-xs text-gray-500 dark:text-gray-400">
                      <ion-icon name="time-outline" class="mr-1"></ion-icon>
                      Due: {{ customer.dueDate }}
                    </span>
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
    
    .items-center { align-items: center; }
    .items-start { align-items: flex-start; }
    .justify-between { justify-content: space-between; }
    .justify-center { justify-content: center; }
    
    .gap-2 { gap: 0.5rem; }
    .gap-3 { gap: 0.75rem; }
    .space-y-3 > * + * { margin-top: 0.75rem; }
    .space-y-4 > * + * { margin-top: 1rem; }
    
    /* Sizing */
    .w-10 { width: 2.5rem; }
    .h-10 { height: 2.5rem; }
    .w-16 { width: 4rem; }
    .h-16 { height: 4rem; }
    .w-full { width: 100%; }
    
    /* Spacing */
    .p-2 { padding: 0.5rem; }
    .p-3 { padding: 0.75rem; }
    .p-4 { padding: 1rem; }
    .p-6 { padding: 1.5rem; }
    .pb-2 { padding-bottom: 0.5rem; }
    .mb-1 { margin-bottom: 0.25rem; }
    .mb-2 { margin-bottom: 0.5rem; }
    .mb-3 { margin-bottom: 0.75rem; }
    .mt-1 { margin-top: 0.25rem; }
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
    .text-4xl { font-size: 2.25rem; line-height: 2.5rem; }
    
    .font-medium { font-weight: 500; }
    .font-semibold { font-weight: 600; }
    .font-bold { font-weight: 700; }
    
    .text-center { text-align: center; }
    .text-right { text-align: right; }
    
    .opacity-75 { opacity: 0.75; }
    
    /* Colors */
    .text-white { color: #ffffff; }
    .text-purple-600 { color: #9333ea; }
    .text-blue-600 { color: #2563eb; }
    .text-green-600 { color: #16a34a; }
    .text-orange-500 { color: #f97316; }
    .text-orange-600 { color: #ea580c; }
    .text-gray-400 { color: #9ca3af; }
    .text-gray-500 { color: #6b7280; }
    .text-gray-600 { color: #4b5563; }
    .text-gray-700 { color: #374151; }
    .text-gray-900 { color: #111827; }
    
    .bg-white { background-color: #ffffff; }
    .bg-gray-50 { background-color: #f9fafb; }
    .bg-gray-100 { background-color: #f3f4f6; }
    .bg-gray-200 { background-color: #e5e7eb; }
    .bg-orange-50 { background-color: #fff7ed; }
    .bg-orange-200 { background-color: #fed7aa; }
    .bg-orange-500 { background-color: #f97316; }
    .bg-orange-600 { background-color: #ea580c; }
    .bg-green-50 { background-color: #f0fdf4; }
    .bg-green-200 { background-color: #bbf7d0; }
    .bg-blue-50 { background-color: #eff6ff; }
    .bg-blue-200 { background-color: #bfdbfe; }
    .bg-purple-100 { background-color: #f3e8ff; }
    .bg-purple-400 { background-color: #c084fc; }
    .bg-purple-600 { color: #9333ea; }
    
    /* Dark mode colors */
    .dark\\:text-white { color: var(--ion-text-color, #ffffff); }
    .dark\\:text-gray-300 { color: #d1d5db; }
    .dark\\:text-gray-400 { color: #9ca3af; }
    .dark\\:text-purple-400 { color: #c084fc; }
    .dark\\:text-blue-400 { color: #60a5fa; }
    .dark\\:text-green-400 { color: #4ade80; }
    .dark\\:text-orange-400 { color: #fb923c; }
    
    .dark\\:bg-gray-700 { background-color: #374151; }
    .dark\\:bg-gray-800 { background-color: #1f2937; }
    .dark\\:bg-gray-900 { background-color: #111827; }
    .dark\\:bg-purple-900\\/30 { background-color: rgba(88, 28, 135, 0.3); }
    .dark\\:bg-blue-900\\/30 { background-color: rgba(30, 58, 138, 0.3); }
    .dark\\:bg-green-900\\/30 { background-color: rgba(20, 83, 45, 0.3); }
    .dark\\:bg-orange-900\\/30 { background-color: rgba(124, 45, 18, 0.3); }
    .dark\\:bg-orange-900\\/10 { background-color: rgba(124, 45, 18, 0.1); }
    .dark\\:bg-green-900\\/10 { background-color: rgba(20, 83, 45, 0.1); }
    .dark\\:bg-blue-900\\/10 { background-color: rgba(30, 58, 138, 0.1); }
    
    /* Border */
    .border-2 { border-width: 2px; }
    .rounded-lg { border-radius: 0.5rem; }
    .rounded-xl { border-radius: 0.75rem; }
    .rounded-2xl { border-radius: 1rem; }
    .rounded-full { border-radius: 9999px; }
    
    .border-gray-100 { border-color: #f3f4f6; }
    .border-gray-200 { border-color: #e5e7eb; }
    .border-orange-200 { border-color: #fed7aa; }
    .border-green-200 { border-color: #bbf7d0; }
    .border-blue-200 { border-color: #bfdbfe; }
    
    .dark\\:border-gray-700 { border-color: #374151; }
    .dark\\:border-orange-800 { border-color: #9a3412; }
    .dark\\:border-green-800 { border-color: #166534; }
    .dark\\:border-blue-800 { border-color: #1e40af; }
    
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
    .bg-gradient-to-r {
      background-image: linear-gradient(to right, var(--tw-gradient-stops));
    }
    .from-purple-500 { --tw-gradient-from: #a855f7; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(168, 85, 247, 0)); }
    .via-purple-600 { --tw-gradient-stops: var(--tw-gradient-from), #9333ea, var(--tw-gradient-to, rgba(147, 51, 234, 0)); }
    .to-indigo-600 { --tw-gradient-to: #4f46e5; }
    
    .from-purple-600 { --tw-gradient-from: #9333ea; --tw-gradient-stops: var(--tw-gradient-from), var(--tw-gradient-to, rgba(147, 51, 234, 0)); }
    .to-purple-800 { --tw-gradient-to: #6b21a8; }
    
    /* Progress bar */
    .transition-all { transition-property: all; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
    .duration-500 { transition-duration: 500ms; }
    
    /* Hover effects */
    .hover\\:shadow-lg:hover {
      box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    }
    
    /* Cursor */
    .cursor-pointer { cursor: pointer; }
    
    /* Overflow */
    .overflow-hidden { overflow: hidden; }
    .overflow-x-auto { overflow-x: auto; }
    
    .flex-1 { flex: 1 1 0%; }
    
    /* Animation */
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    .animate-spin {
      animation: spin 1s linear infinite;
    }
  `]
})
export class CollectorRoutePage implements OnInit {
  loading = signal(false);
  syncing = signal(false);
  currentUser = signal<any>(null);
  currentDate = new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  filter = signal<string>('all');
  customers = signal<RouteCustomer[]>([]);
  stats = signal<CollectionStats>({
    totalAssigned: 0,
    visited: 0,
    collected: 0,
    totalCollected: 0,
    pendingVisits: 0
  });

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    public syncService: SyncService,
    private router: Router,
    public themeService: ThemeService
  ) {
    addIcons({
      mapOutline,
      locationOutline,
      cashOutline,
      checkmarkCircleOutline,
      timeOutline,
      personOutline,
      callOutline,
      navigateOutline,
      listOutline,
      statsChartOutline,
      logOutOutline,
      syncOutline,
      moonOutline,
      sunnyOutline
    });
  }

  ngOnInit() {
    this.currentUser.set(this.authService.currentUser());
    this.loadRouteData();
  }

  async loadRouteData() {
    this.loading.set(true);
    try {
      const collectorId = this.authService.getCurrentUserId();
      if (collectorId) {
        const routeData = await this.apiService.getCollectorRoute(collectorId).toPromise();
        this.customers.set(routeData || []);
        this.calculateStats();
      }
    } catch (error) {
      console.error('Failed to load route data:', error);
      // Set mock data for development
      this.setMockData();
    } finally {
      this.loading.set(false);
    }
  }

  setMockData() {
    this.customers.set([
      { id: 1, name: 'Maria Santos', address: '123 Main St, Manila', phone: '+63 917 123 4567', loanBalance: 50000, amountDue: 5000, dueDate: 'Nov 15', status: 'not-visited', distance: '1.2 km' },
      { id: 2, name: 'Juan Dela Cruz', address: '456 Oak Ave, Quezon City', phone: '+63 917 234 5678', loanBalance: 75000, amountDue: 7500, dueDate: 'Nov 15', status: 'not-visited', distance: '2.5 km' },
      { id: 3, name: 'Pedro Garcia', address: '789 Pine Rd, Makati', phone: '+63 917 345 6789', loanBalance: 30000, amountDue: 3000, dueDate: 'Nov 14', status: 'collected', distance: '0.8 km' },
      { id: 4, name: 'Ana Lopez', address: '321 Elm St, Pasig', phone: '+63 917 456 7890', loanBalance: 45000, amountDue: 4500, dueDate: 'Nov 15', status: 'visited', distance: '3.1 km' },
      { id: 5, name: 'Carlos Rivera', address: '654 Birch Ln, Mandaluyong', phone: '+63 917 567 8901', loanBalance: 60000, amountDue: 6000, dueDate: 'Nov 16', status: 'not-visited', distance: '4.0 km' }
    ]);
    this.calculateStats();
  }

  calculateStats() {
    const customers = this.customers();
    this.stats.set({
      totalAssigned: customers.length,
      visited: customers.filter(c => c.status === 'visited' || c.status === 'collected').length,
      collected: customers.filter(c => c.status === 'collected').length,
      totalCollected: customers.filter(c => c.status === 'collected').reduce((sum, c) => sum + c.amountDue, 0),
      pendingVisits: customers.filter(c => c.status === 'not-visited').length
    });
  }

  filteredCustomers() {
    if (this.filter() === 'all') {
      return this.customers();
    }
    return this.customers().filter(c => c.status === this.filter());
  }

  filterCount(status: string): number {
    return this.customers().filter(c => c.status === status).length;
  }

  setFilter(filter: string) {
    this.filter.set(filter);
  }

  progressPercentage(): number {
    const total = this.stats().totalAssigned;
    const visited = this.stats().visited;
    return total > 0 ? Math.round((visited / total) * 100) : 0;
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'collected': return 'success';
      case 'visited': return 'primary';
      case 'not-visited': return 'warning';
      case 'missed': return 'danger';
      default: return 'medium';
    }
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  async handleRefresh(event: any) {
    await this.loadRouteData();
    event.target.complete();
  }

  async syncNow() {
    this.syncing.set(true);
    await this.syncService.forceSyncNow();
    this.syncing.set(false);
  }

  openMap(customer: RouteCustomer) {
    // Open Google Maps with customer address
    const address = encodeURIComponent(customer.address);
    window.open(`https://maps.google.com/?q=${address}`, '_system');
  }

  logout() {
    this.authService.logout();
  }
}
