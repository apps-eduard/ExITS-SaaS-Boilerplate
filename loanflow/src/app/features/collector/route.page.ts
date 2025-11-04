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
  IonChip,
  ToastController
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
import { ConfirmationService } from '../../core/services/confirmation.service';
import { DevInfoComponent } from '../../shared/components/dev-info.component';

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
    IonChip,
    DevInfoComponent
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar class="custom-toolbar">
        <ion-buttons slot="start">
          <ion-button (click)="logout()" class="header-btn">
            <ion-icon name="log-out-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
        <ion-title>
          <div class="header-title">
            <ion-icon name="map-outline" class="title-icon"></ion-icon>
            <span class="title-text">Route</span>
          </div>
        </ion-title>
        <ion-buttons slot="end">
          <!-- Dev Info (Development Only) -->
          <app-dev-info />
          
          <ion-button (click)="themeService.toggleTheme()" class="header-btn">
            <ion-icon [name]="themeService.isDark() ? 'sunny-outline' : 'moon-outline'" slot="icon-only" class="theme-icon"></ion-icon>
          </ion-button>
          <ion-button (click)="syncNow()" class="header-btn">
            <ion-icon [name]="syncing() ? 'sync-outline' : 'sync-outline'" slot="icon-only" [class.animate-spin]="syncing()"></ion-icon>
            @if (syncService.pendingSyncCount() > 0) {
              <ion-badge color="danger" class="sync-badge">
                {{ syncService.pendingSyncCount() }}
              </ion-badge>
            }
          </ion-button>
        </ion-buttons>
      </ion-toolbar>

      <!-- Sync Status Banner -->
      @if (!syncService.isOnline()) {
        <div class="offline-banner">
          <ion-icon name="cloud-offline-outline" class="offline-icon"></ion-icon>
          <span>Offline Mode - {{ syncService.pendingSyncCount() }} pending sync</span>
        </div>
      }
    </ion-header>

    <ion-content class="main-content">
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="dashboard-container">
        
        <!-- User Info Header -->
        <div class="user-header">
          <div class="user-info">
            <p class="user-greeting">Hello, <strong>{{ currentUser()?.firstName || 'Collector' }}</strong></p>
            <p class="user-subtitle">{{ currentDate }}</p>
          </div>
        </div>

        <!-- Collection Stats -->
        <div class="stats-grid">
          <!-- Total Assigned -->
          <div class="stat-card">
            <div class="stat-header">
              <div class="stat-icon-wrapper stat-icon-purple">
                <ion-icon class="stat-icon" name="list-outline"></ion-icon>
              </div>
            </div>
            @if (loading()) {
              <ion-skeleton-text animated class="stat-skeleton"></ion-skeleton-text>
            } @else {
              <h2 class="stat-value">{{ stats().totalAssigned }}</h2>
            }
            <p class="stat-label">Assigned</p>
            <div class="stat-decoration stat-decoration-purple"></div>
          </div>

          <!-- Visited -->
          <div class="stat-card">
            <div class="stat-header">
              <div class="stat-icon-wrapper stat-icon-success">
                <ion-icon class="stat-icon" name="checkmark-circle-outline"></ion-icon>
              </div>
            </div>
            @if (loading()) {
              <ion-skeleton-text animated class="stat-skeleton"></ion-skeleton-text>
            } @else {
              <h2 class="stat-value">{{ stats().visited }}</h2>
            }
            <p class="stat-label">Visited</p>
            <div class="stat-decoration stat-decoration-success"></div>
          </div>

          <!-- Total Collected -->
          <div class="stat-card">
            <div class="stat-header">
              <div class="stat-icon-wrapper stat-icon-primary">
                <ion-icon class="stat-icon" name="cash-outline"></ion-icon>
              </div>
            </div>
            @if (loading()) {
              <ion-skeleton-text animated class="stat-skeleton"></ion-skeleton-text>
            } @else {
              <h2 class="stat-value stat-value-sm">₱{{ formatCurrency(stats().totalCollected) }}</h2>
            }
            <p class="stat-label">Collected</p>
            <div class="stat-decoration stat-decoration-primary"></div>
          </div>

          <!-- Pending -->
          <div class="stat-card">
            <div class="stat-header">
              <div class="stat-icon-wrapper stat-icon-warning">
                <ion-icon class="stat-icon" name="time-outline"></ion-icon>
              </div>
            </div>
            @if (loading()) {
              <ion-skeleton-text animated class="stat-skeleton"></ion-skeleton-text>
            } @else {
              <h2 class="stat-value">{{ stats().pendingVisits }}</h2>
            }
            <p class="stat-label">Pending</p>
            <div class="stat-decoration stat-decoration-warning"></div>
          </div>
        </div>

        <!-- Progress Card -->
        <div class="progress-card">
          <div class="progress-header">
            <span class="progress-title">Today's Progress</span>
            <span class="progress-percentage">{{ progressPercentage() }}%</span>
          </div>
          <div class="progress-bar-container">
            <div 
              class="progress-bar-fill"
              [style.width.%]="progressPercentage()"
            ></div>
          </div>
        </div>

        <!-- Filter Chips -->
        <div class="filter-chips">
          <ion-chip 
            class="filter-chip"
            [class.chip-active]="filter() === 'all'"
            [class.chip-inactive]="filter() !== 'all'"
            (click)="setFilter('all')"
          >
            All ({{ customers().length }})
          </ion-chip>
          <ion-chip 
            class="filter-chip filter-chip-pending"
            [class.chip-active]="filter() === 'not-visited'"
            [class.chip-inactive]="filter() !== 'not-visited'"
            (click)="setFilter('not-visited')"
          >
            Pending ({{ filterCount('not-visited') }})
          </ion-chip>
          <ion-chip 
            class="filter-chip filter-chip-success"
            [class.chip-active]="filter() === 'collected'"
            [class.chip-inactive]="filter() !== 'collected'"
            (click)="setFilter('collected')"
          >
            Collected ({{ filterCount('collected') }})
          </ion-chip>
        </div>

        <!-- Customer Route List -->
        <div class="section-card">
          <h3 class="section-title">Today's Route</h3>

          @if (loading()) {
            <div class="customers-loading">
              @for (i of [1,2,3,4]; track i) {
                <div class="customer-skeleton">
                  <ion-skeleton-text animated class="skeleton-name"></ion-skeleton-text>
                  <ion-skeleton-text animated class="skeleton-address"></ion-skeleton-text>
                </div>
              }
            </div>
          } @else if (filteredCustomers().length === 0) {
            <div class="empty-state">
              <div class="empty-icon-wrapper">
                <ion-icon name="map-outline" class="empty-icon"></ion-icon>
              </div>
              <p class="empty-title">No customers found</p>
              <p class="empty-subtitle">Check back later or adjust your filters</p>
            </div>
          } @else {
            <div class="customers-list">
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
    /* ===== HEADER STYLES ===== */
    .custom-toolbar {
      --background: linear-gradient(135deg, #a855f7, #6366f1);
      --color: white;
      --border-style: none;
      --min-height: 60px;
    }

    .header-title {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-size: 1.125rem;
      font-weight: 700;
    }

    .title-icon {
      font-size: 1.5rem;
    }

    .title-text {
      font-weight: 700;
    }

    .header-btn {
      --background-hover: rgba(255, 255, 255, 0.15);
      --border-radius: 50%;
      --padding-start: 8px;
      --padding-end: 8px;
      position: relative;
    }

    .sync-badge {
      position: absolute;
      top: 4px;
      right: 4px;
      font-size: 0.65rem;
      min-width: 16px;
      height: 16px;
    }

    .offline-banner {
      background: #f59e0b;
      color: white;
      padding: 0.75rem 1rem;
      text-align: center;
      font-size: 0.875rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .offline-icon {
      font-size: 1.125rem;
    }

    /* ===== MAIN CONTENT ===== */
    .main-content {
      --background: var(--ion-background-color);
    }

    .dashboard-container {
      padding: 1rem;
      max-width: 600px;
      margin: 0 auto;
    }

    /* ===== USER HEADER ===== */
    .user-header {
      margin-bottom: 1.5rem;
      padding: 0 0.25rem;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .user-greeting {
      font-size: 1.125rem;
      color: var(--ion-text-color);
      margin: 0;
      font-weight: 400;
    }

    .user-greeting strong {
      font-weight: 700;
    }

    .user-subtitle {
      font-size: 0.875rem;
      color: var(--ion-color-medium);
      margin: 0;
    }

    /* ===== STATS GRID ===== */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 1.25rem;
    }

    .stat-card {
      background: var(--ion-card-background);
      border-radius: 16px;
      padding: 1.25rem;
      position: relative;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      border: 1px solid var(--ion-border-color, #e5e7eb);
      transition: all 0.3s ease;
    }

    .stat-card:active {
      transform: scale(0.98);
    }

    .stat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }

    .stat-icon-wrapper {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-icon {
      font-size: 1.5rem;
    }

    .stat-icon-purple {
      background: linear-gradient(135deg, #a855f7, #6366f1);
    }

    .stat-icon-purple .stat-icon {
      color: white;
    }

    .stat-icon-primary {
      background: linear-gradient(135deg, #667eea, #764ba2);
    }

    .stat-icon-primary .stat-icon {
      color: white;
    }

    .stat-icon-success {
      background: linear-gradient(135deg, #4facfe, #00f2fe);
    }

    .stat-icon-success .stat-icon {
      color: white;
    }

    .stat-icon-warning {
      background: linear-gradient(135deg, #f093fb, #f5576c);
    }

    .stat-icon-warning .stat-icon {
      color: white;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--ion-text-color);
      margin: 0 0 0.25rem 0;
      line-height: 1.2;
    }

    .stat-value-sm {
      font-size: 1.25rem;
    }

    .stat-label {
      font-size: 0.75rem;
      color: var(--ion-color-medium);
      margin: 0;
      font-weight: 500;
    }

    .stat-skeleton {
      width: 70%;
      height: 24px;
      border-radius: 6px;
      margin-bottom: 0.5rem;
    }

    .stat-decoration {
      position: absolute;
      bottom: -10px;
      right: -10px;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      opacity: 0.1;
    }

    .stat-decoration-purple {
      background: #a855f7;
    }

    .stat-decoration-primary {
      background: #667eea;
    }

    .stat-decoration-success {
      background: #00f2fe;
    }

    .stat-decoration-warning {
      background: #f5576c;
    }

    /* ===== PROGRESS CARD ===== */
    .progress-card {
      background: var(--ion-card-background);
      border-radius: 16px;
      padding: 1.25rem;
      margin-bottom: 1.25rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      border: 1px solid var(--ion-border-color, #e5e7eb);
    }

    .progress-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }

    .progress-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--ion-text-color);
    }

    .progress-percentage {
      font-size: 0.875rem;
      font-weight: 700;
      color: #a855f7;
    }

    .progress-bar-container {
      width: 100%;
      height: 12px;
      background: var(--ion-color-light);
      border-radius: 9999px;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      background: linear-gradient(90deg, #a855f7, #6366f1);
      border-radius: 9999px;
      transition: width 0.5s ease;
    }

    /* ===== FILTER CHIPS ===== */
    .filter-chips {
      display: flex;
      gap: 0.5rem;
      overflow-x: auto;
      padding-bottom: 0.5rem;
      margin-bottom: 1.25rem;
      -webkit-overflow-scrolling: touch;
    }

    .filter-chips::-webkit-scrollbar {
      display: none;
    }

    .filter-chip {
      flex-shrink: 0;
      cursor: pointer;
      transition: all 0.3s ease;
      font-size: 0.875rem;
      font-weight: 600;
      --background: var(--ion-color-light);
      --color: var(--ion-text-color);
    }

    .chip-active {
      --background: #a855f7 !important;
      --color: white !important;
    }

    .chip-inactive {
      --background: var(--ion-color-light);
      --color: var(--ion-color-medium);
    }

    .filter-chip-pending.chip-active {
      --background: #f59e0b !important;
    }

    .filter-chip-success.chip-active {
      --background: #10b981 !important;
    }

    /* ===== SECTION CARD ===== */
    .section-card {
      background: var(--ion-card-background);
      border-radius: 18px;
      padding: 1.25rem;
      margin-bottom: 1.25rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      border: 1px solid var(--ion-border-color, #e5e7eb);
    }

    .section-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--ion-text-color);
      margin: 0 0 1rem 0;
    }

    /* ===== CUSTOMERS LIST ===== */
    .customers-loading {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .customer-skeleton {
      background: var(--ion-item-background);
      border-radius: 12px;
      padding: 1rem;
    }

    .skeleton-name {
      width: 50%;
      height: 16px;
      border-radius: 4px;
      margin-bottom: 0.5rem;
    }

    .skeleton-address {
      width: 40%;
      height: 12px;
      border-radius: 4px;
    }

    .empty-state {
      text-align: center;
      padding: 2.5rem 1rem;
    }

    .empty-icon-wrapper {
      width: 80px;
      height: 80px;
      background: var(--ion-color-light);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1rem;
    }

    .empty-icon {
      font-size: 2.5rem;
      color: var(--ion-color-medium);
    }

    .empty-title {
      font-size: 1rem;
      font-weight: 600;
      color: var(--ion-text-color);
      margin: 0 0 0.5rem 0;
    }

    .empty-subtitle {
      font-size: 0.875rem;
      color: var(--ion-color-medium);
      margin: 0;
    }

    .customers-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    /* Legacy utility classes for customer cards */
    .flex { display: flex; }
    .items-start { align-items: flex-start; }
    .items-center { align-items: center; }
    .justify-between { justify-content: space-between; }
    .gap-2 { gap: 0.5rem; }
    .gap-3 { gap: 0.75rem; }
    .space-y-3 > * + * { margin-top: 0.75rem; }
    .mb-3 { margin-bottom: 0.75rem; }
    .mb-2 { margin-bottom: 0.5rem; }
    .mb-1 { margin-bottom: 0.25rem; }
    .mt-1 { margin-top: 0.25rem; }
    .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
    .text-base { font-size: 1rem; line-height: 1.5rem; }
    .text-xs { font-size: 0.75rem; line-height: 1rem; }
    .font-semibold { font-weight: 600; }
    .font-medium { font-weight: 500; }
    .font-bold { font-weight: 700; }
    .text-gray-900 { color: #111827; }
    .text-gray-600 { color: #4b5563; }
    .text-gray-500 { color: #6b7280; }
    .text-orange-600 { color: #ea580c; }
    .text-green-600 { color: #16a34a; }
    .dark\\:text-white { color: var(--ion-text-color, #ffffff); }
    .dark\\:text-gray-300 { color: #d1d5db; }
    .dark\\:text-gray-400 { color: #9ca3af; }
    .dark\\:text-orange-400 { color: #fb923c; }
    .dark\\:text-green-400 { color: #4ade80; }
    .p-4 { padding: 1rem; }
    .rounded-xl { border-radius: 0.75rem; }
    .border-2 { border-width: 2px; }
    .border-orange-200 { border-color: #fed7aa; }
    .border-green-200 { border-color: #bbf7d0; }
    .border-blue-200 { border-color: #bfdbfe; }
    .border-gray-200 { border-color: #e5e7eb; }
    .dark\\:border-orange-800 { border-color: #9a3412; }
    .dark\\:border-green-800 { border-color: #166534; }
    .dark\\:border-blue-800 { border-color: #1e40af; }
    .dark\\:border-gray-700 { border-color: #374151; }
    .bg-orange-50 { background-color: #fff7ed; }
    .bg-green-50 { background-color: #f0fdf4; }
    .bg-blue-50 { background-color: #eff6ff; }
    .dark\\:bg-orange-900\\/10 { background-color: rgba(124, 45, 18, 0.1); }
    .dark\\:bg-green-900\\/10 { background-color: rgba(20, 83, 45, 0.1); }
    .dark\\:bg-blue-900\\/10 { background-color: rgba(30, 58, 138, 0.1); }
    .transition-all { transition-property: all; transition-timing-function: cubic-bezier(0.4, 0, 0.2, 1); transition-duration: 150ms; }
    .cursor-pointer { cursor: pointer; }
    .hover\\:shadow-lg:hover {
      box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    }

    /* ===== DARK MODE ADJUSTMENTS ===== */
    body.dark .stat-card,
    .dark .stat-card {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.1);
    }

    body.dark .progress-card,
    .dark .progress-card {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.1);
    }

    body.dark .section-card,
    .dark .section-card {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.1);
    }

    body.dark .empty-icon-wrapper,
    .dark .empty-icon-wrapper {
      background: rgba(255, 255, 255, 0.1);
    }

    body.dark .progress-bar-container,
    .dark .progress-bar-container {
      background: rgba(255, 255, 255, 0.1);
    }

    body.dark .customer-skeleton,
    .dark .customer-skeleton {
      background: rgba(255, 255, 255, 0.05);
    }

    /* ===== ANIMATION ===== */
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
    public themeService: ThemeService,
    private confirmationService: ConfirmationService,
    private toastController: ToastController
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
      
      if (!collectorId) {
        console.warn('No collector ID found');
        this.setMockData();
        return;
      }

      const routeData = await this.apiService.getCollectorRoute(collectorId).toPromise();
      
      if (routeData && Array.isArray(routeData)) {
        // Map API response to our customer interface
        const mappedCustomers = routeData.map((customer: any) => ({
          id: customer.id,
          name: customer.name || customer.customer_name || 'Unknown',
          address: customer.address || customer.customer_address || 'N/A',
          phone: customer.phone || customer.contact_number || customer.phone_number || 'N/A',
          loanBalance: customer.loanBalance || customer.loan_balance || customer.remaining_balance || 0,
          amountDue: customer.amountDue || customer.amount_due || customer.payment_amount || 0,
          dueDate: this.formatDueDate(customer.dueDate || customer.due_date || customer.next_due_date),
          status: this.mapCustomerStatus(customer.status || customer.visit_status),
          distance: customer.distance || 'N/A'
        }));
        this.customers.set(mappedCustomers);
      } else {
        this.customers.set([]);
      }
      
      this.calculateStats();
      console.log('Route data loaded successfully');
    } catch (error) {
      console.error('Failed to load route data:', error);
      // Only show mock data in development
      if (window.location.hostname === 'localhost') {
        console.warn('Using mock data for development');
        this.setMockData();
      } else {
        // Show error toast in production
        const toast = await this.toastController.create({
          message: 'Failed to load route data',
          duration: 3000,
          position: 'bottom',
          color: 'danger'
        });
        await toast.present();
        this.customers.set([]);
        this.calculateStats();
      }
    } finally {
      this.loading.set(false);
    }
  }

  private formatDueDate(rawDate: string | null | undefined): string {
    if (!rawDate) {
      return 'N/A';
    }

    const parsed = new Date(rawDate);
    if (Number.isNaN(parsed.getTime())) {
      return rawDate;
    }

    return parsed.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  /**
   * Map API customer status to display status
   */
  private mapCustomerStatus(apiStatus: string): 'not-visited' | 'visited' | 'collected' | 'missed' {
    const status = (apiStatus || '').toLowerCase();
    if (status === 'collected' || status === 'paid') {
      return 'collected';
    }
    if (status === 'visited' || status === 'visit-complete') {
      return 'visited';
    }
    if (status === 'missed' || status === 'failed') {
      return 'missed';
    }
    return 'not-visited';
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

  async logout() {
    const confirmed = await this.confirmationService.confirmLogout();
    
    if (confirmed) {
      this.authService.logout();
      
      const toast = await this.toastController.create({
        message: 'Logged out successfully',
        duration: 2000,
        position: 'bottom',
        color: 'success',
        icon: 'checkmark-circle-outline'
      });
      await toast.present();
    }
  }
}
