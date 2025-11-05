// Collector Route Page - Modern Ionic 8 + Tailwind Design
import { Component, OnInit, signal, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
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
  IonModal,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonItem,
  IonLabel,
  IonList,
  ToastController,
  ModalController
} from '@ionic/angular/standalone';
import { CurrencyMaskDirective } from '../../shared/directives/currency-mask.directive';
import { addIcons } from 'ionicons';
import {
  mapOutline,
  locationOutline,
  cashOutline,
  checkmarkCircleOutline,
  timeOutline,
  personOutline,
  callOutline,
  mailOutline,
  navigateOutline,
  listOutline,
  statsChartOutline,
  logOutOutline,
  syncOutline,
  moonOutline,
  sunnyOutline,
  alertCircleOutline,
  documentTextOutline,
  cardOutline,
  calendarOutline,
  closeOutline,
  logoGoogle
} from 'ionicons/icons';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { SyncService } from '../../core/services/sync.service';
import { ThemeService } from '../../core/services/theme.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { DevInfoComponent } from '../../shared/components/dev-info.component';

interface RouteCustomer {
  customerId: number;
  customerName: string;
  address: string;
  phone: string;
  email?: string;
  // Loan info
  loanId: number;
  loanNumber: string;
  productName: string;
  principalAmount: number;
  outstandingBalance: number;
  amountDue: number;
  nextInstallment: number | null;
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
    FormsModule,
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
    IonModal,
    CurrencyMaskDirective,
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

        <!-- Search Bar -->
        <div class="search-container">
          <div class="search-wrapper">
            <span class="search-icon">🔍</span>
            <input 
              type="text" 
              class="search-input"
              [(ngModel)]="searchQuery"
              (input)="onSearchChange()"
              placeholder="Search by name, phone, or email..."
            />
            @if (searchQuery) {
              <button class="search-clear" (click)="clearSearch()">
                <ion-icon name="close-outline"></ion-icon>
              </button>
            }
          </div>
        </div>

        <!-- Customer Route List -->
        <div class="section-card">
          <h3 class="section-title">
            Today's Route
            @if (searchQuery) {
              <span class="search-results-count">({{ filteredCustomers().length }} results)</span>
            }
          </h3>

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
              @if (searchQuery) {
                <p class="empty-title">No customers found</p>
                <p class="empty-subtitle">No matches for "{{ searchQuery }}"</p>
              } @else {
                <p class="empty-title">No customers found</p>
                <p class="empty-subtitle">Check back later for your route</p>
              }
            </div>
          } @else {
            <div class="customers-list">
              @for (loan of filteredCustomers(); track loan.loanId) {
                <div 
                  class="customer-card"
                  [class.card-pending]="loan.status === 'not-visited'"
                  [class.card-collected]="loan.status === 'collected'"
                  [class.card-visited]="loan.status === 'visited'"
                  [class.card-missed]="loan.status === 'missed'"
                  (click)="toggleLoanDetails(loan.loanId)"
                >
                  <!-- Header: Avatar, Name, Status -->
                  <div class="card-header">
                    <div class="avatar-circle">
                      {{ getInitials(loan.customerName) }}
                    </div>
                    <div class="customer-main">
                      <h3 class="customer-name">{{ loan.customerName }}</h3>
                      <div class="contact-chips">
                        <span class="contact-chip loan-chip">
                          <ion-icon name="document-text-outline"></ion-icon>
                          {{ loan.loanNumber }}
                        </span>
                        @if (loan.nextInstallment) {
                          <span class="contact-chip">
                            <ion-icon name="calendar-outline"></ion-icon>
                            #{{ loan.nextInstallment }}
                          </span>
                        }
                      </div>
                    </div>
                    <ion-badge [color]="getStatusColor(loan.status)" class="status-badge">
                      {{ getStatusLabel(loan.status) }}
                    </ion-badge>
                  </div>

                  <!-- Loan Product -->
                  @if (loan.productName) {
                    <div class="product-badge">
                      <ion-icon name="card-outline"></ion-icon>
                      <span>{{ loan.productName }}</span>
                    </div>
                  }

                  <!-- Contact Info -->
                  <div class="contact-info-compact">
                    @if (loan.phone && loan.phone !== 'N/A') {
                      <span class="info-item">
                        <ion-icon name="call-outline"></ion-icon>
                        {{ loan.phone }}
                      </span>
                    }
                    @if (loan.email) {
                      <span class="info-item">
                        <ion-icon name="mail-outline"></ion-icon>
                        {{ loan.email }}
                      </span>
                    }
                  </div>

                  <!-- Address -->
                  @if (loan.address && loan.address !== 'N/A') {
                    <div class="address-row">
                      <ion-icon name="location-outline"></ion-icon>
                      <span>{{ loan.address }}</span>
                    </div>
                  }

                  <!-- Financial Info -->
                  <div class="financial-info">
                    <div class="info-row">
                      <span class="info-label">Loan Amount</span>
                      <span class="info-value">₱{{ formatCurrency(loan.principalAmount) }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Total Repayment</span>
                      <span class="info-value">₱{{ formatCurrency(getTotalRepayment(loan)) }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Balance</span>
                      <span class="info-value">₱{{ formatCurrency(getOutstandingBalance(loan)) }}</span>
                    </div>
                    <div class="info-row">
                      <span class="info-label">Installments</span>
                      <span class="info-value">{{ getInstallmentsPaid(loan) }} / {{ getTotalInstallments(loan) }}</span>
                    </div>
                  </div>

                  <!-- Actions -->
                  <div class="card-actions">
                    @if (loan.phone && loan.phone !== 'N/A') {
                      <ion-button 
                        size="small" 
                        fill="clear"
                        [href]="'tel:' + loan.phone"
                        (click)="$event.stopPropagation()"
                      >
                        <ion-icon name="call-outline" slot="icon-only"></ion-icon>
                      </ion-button>
                    }
                    <ion-button 
                      size="small" 
                      fill="clear"
                      (click)="openMap(loan); $event.stopPropagation()"
                    >
                      <ion-icon name="navigate-outline" slot="icon-only"></ion-icon>
                    </ion-button>

                    <ion-button size="small" fill="clear" (click)="goToVisit(loan.customerId); $event.stopPropagation()">
                      Visit
                    </ion-button>

                    @if (loan.dueDate) {
                      <div class="due-chip">
                        <ion-icon name="time-outline"></ion-icon>
                        {{ formatDueDate(loan.dueDate) }}
                      </div>
                    }
                  </div>

                  <!-- Expandable repayment panel (toggle by clicking the card) -->
                  @if (isExpanded(loan.loanId)) {
                    <div class="repayment-panel">
                      <!-- Filter buttons -->
                      <div class="filter-buttons">
                        <ion-button 
                          size="small" 
                          [fill]="installmentFilter() === 'pending' ? 'solid' : 'outline'"
                          (click)="installmentFilter.set('pending'); $event.stopPropagation()">
                          <ion-icon name="time-outline" slot="start"></ion-icon>
                          Pending
                        </ion-button>
                        <ion-button 
                          size="small" 
                          [fill]="installmentFilter() === 'paid' ? 'solid' : 'outline'"
                          color="success"
                          [disabled]="!hasPaidInstallments(loan)"
                          (click)="installmentFilter.set('paid'); $event.stopPropagation()">
                          <ion-icon name="checkmark-circle-outline" slot="start"></ion-icon>
                          Paid
                        </ion-button>
                        <ion-button 
                          size="small" 
                          [fill]="installmentFilter() === 'all' ? 'solid' : 'outline'"
                          color="medium"
                          (click)="installmentFilter.set('all'); $event.stopPropagation()">
                          <ion-icon name="list-outline" slot="start"></ion-icon>
                          All
                        </ion-button>
                      </div>

                      @if (getLoanDetailsFromCache(loan.loanId) && getLoanDetailsFromCache(loan.loanId).schedule && getLoanDetailsFromCache(loan.loanId).schedule.length > 0) {
                        <div class="repayment-list">
                          @for (item of getFilteredInstallments(getLoanDetailsFromCache(loan.loanId).schedule); track item.installmentNumber) {
                            <div class="repayment-row" 
                                 [class.paid]="item.status === 'paid'" 
                                 [class.partial]="item.status === 'partially_paid'"
                                 [class.pending]="item.status === 'pending'"
                                 [class.overdue]="item.status === 'overdue'"
                                 [class.disabled]="item.status === 'paid'"
                                 [style.cursor]="item.status === 'paid' ? 'not-allowed' : 'pointer'"
                                 (click)="item.status !== 'paid' && openPaymentModal(loan, item)">
                              <div class="repayment-left">
                                <div class="repayment-num">Installment {{ item.installmentNumber }}</div>
                                <div class="repayment-date">{{ formatDueDate(item.dueDate) }}</div>
                              </div>
                              <div class="repayment-right">
                                <div class="repayment-amount">₱{{ formatCurrency(item.outstandingAmount) }}</div>
                                <div class="repayment-status" 
                                     [class.status-paid]="item.status === 'paid'"
                                     [class.status-partial]="item.status === 'partially_paid'"
                                     [class.status-pending]="item.status === 'pending'"
                                     [class.status-overdue]="item.status === 'overdue'">
                                  {{ getStatusLabel(item.status) }}
                                </div>
                              </div>
                            </div>
                          }
                        </div>
                      } @else {
                        <div class="repayment-empty">
                          <p class="text-sm">No repayment schedule available for this loan.</p>
                          <div class="loan-quick-info">
                            <p class="text-xs">Principal: ₱{{ formatCurrency(loan.principalAmount) }}</p>
                            <p class="text-xs">Outstanding: ₱{{ formatCurrency(loan.outstandingBalance) }}</p>
                            <p class="text-xs">Product: {{ loan.productName }}</p>
                          </div>
                        </div>
                      }
                    </div>
                  }
                </div>
              }
            </div>
          }
        </div>
      </div>
    </ion-content>

    <!-- Payment Modal -->
    <ion-modal [isOpen]="showPaymentModal()" (didDismiss)="closePaymentModal()">
      <ng-template>
        <ion-header>
          <ion-toolbar color="primary">
            <ion-title class="compact-title">Payment</ion-title>
            <ion-buttons slot="end">
              <ion-button (click)="closePaymentModal()">
                <ion-icon name="close-outline" slot="icon-only"></ion-icon>
              </ion-button>
            </ion-buttons>
          </ion-toolbar>
        </ion-header>
        <ion-content class="compact-modal-content">
          @if (selectedInstallment()) {
            <div class="payment-compact">
              <!-- Compact Header -->
              <div class="payment-header-compact">
                <div class="customer-name">{{ selectedLoan()?.customerName }}</div>
                <div class="installment-badge">Installment {{ selectedInstallment()?.installmentNumber }}</div>
                <div class="amount-due">
                  <span class="label">Due Amount:</span>
                  <span class="value">₱{{ formatCurrency(selectedInstallment()?.outstandingAmount || 0) }}</span>
                </div>
              </div>

              <!-- Compact Form -->
              <div class="payment-form-compact">
                <!-- Payment Method Chips -->
                <div class="method-label">Payment Method</div>
                <div class="payment-methods">
                  <div 
                    class="method-chip"
                    [class.active]="paymentMethod === 'cash'"
                    (click)="selectPaymentMethod('cash')"
                  >
                    <ion-icon name="cash-outline"></ion-icon>
                    <span>Cash</span>
                  </div>
                  <div 
                    class="method-chip"
                    [class.active]="paymentMethod === 'cheque'"
                    (click)="selectPaymentMethod('cheque')"
                  >
                    <ion-icon name="card-outline"></ion-icon>
                    <span>Cheque</span>
                  </div>
                  <div 
                    class="method-chip"
                    [class.active]="paymentMethod === 'gcash'"
                    (click)="selectPaymentMethod('gcash')"
                  >
                    <ion-icon name="logo-google"></ion-icon>
                    <span>GCash</span>
                  </div>
                </div>

                <!-- Amount with Partial Payment Option -->
                <div class="amount-section">
                  <div class="amount-header">
                    <label>Payment Amount</label>
                    <button 
                      type="button" 
                      class="partial-btn"
                      [class.active]="isPartialPayment"
                      (click)="togglePartialPayment()"
                    >
                      {{ isPartialPayment ? 'Full Payment' : 'Partial Payment' }}
                    </button>
                  </div>
                  
                  @if (!isPartialPayment) {
                    <!-- Full Payment Display -->
                    <div class="full-payment-display">
                      <span class="currency">₱</span>
                      <span class="amount-value">{{ formatCurrency(selectedInstallment()?.outstandingAmount || 0) }}</span>
                    </div>
                  } @else {
                    <!-- Partial Payment Input -->
                    <div class="amount-input-wrapper">
                      <span class="currency"></span>
                      <input 
                        #partialAmountInput
                        type="text" 
                        class="amount-input"
                        [(ngModel)]="paymentAmount" 
                        appCurrencyMask
                        placeholder="0.00"
                      />
                    </div>
                    @if (paymentAmount > 0 && paymentAmount < (selectedInstallment()?.outstandingAmount || 0)) {
                      <div class="remaining-balance">
                        Remaining: ₱{{ formatCurrency((selectedInstallment()?.outstandingAmount || 0) - paymentAmount) }}
                      </div>
                    }
                    @if (paymentAmount <= 0 || paymentAmount >= (selectedInstallment()?.outstandingAmount || 0)) {
                      <div class="payment-error">
                        @if (paymentAmount <= 0) {
                          <ion-icon name="alert-circle-outline"></ion-icon>
                          <span>Amount must be greater than ₱0</span>
                        } @else if (paymentAmount >= (selectedInstallment()?.outstandingAmount || 0)) {
                          <ion-icon name="alert-circle-outline"></ion-icon>
                          <span>Use Full Payment instead</span>
                        }
                      </div>
                    }
                  }
                </div>

                <!-- Reference Number -->
                <div class="reference-section">
                  <label>Reference Number</label>
                  <input 
                    type="text"
                    class="reference-input"
                    [(ngModel)]="paymentReference" 
                    [readonly]="paymentMethod === 'cash'"
                    [class.readonly]="paymentMethod === 'cash'"
                    placeholder="Auto-generated"
                  />
                </div>

                <!-- Quick Notes Chips -->
                <div class="notes-section">
                  <label>Notes (Optional)</label>
                  <div class="quick-notes">
                    <span class="quick-note" (click)="addQuickNote('Full payment')">Full payment</span>
                    <span class="quick-note" (click)="addQuickNote('Partial payment')">Partial</span>
                    <span class="quick-note" (click)="addQuickNote('Late payment')">Late</span>
                  </div>
                  <input 
                    type="text"
                    class="notes-input"
                    [(ngModel)]="paymentNotes" 
                    placeholder="Add notes..."
                  />
                </div>
              </div>

              <!-- Submit Button -->
              <button 
                class="submit-payment-btn" 
                (click)="submitPayment()"
                [disabled]="!isPaymentValid()"
              >
                <ion-icon name="checkmark-circle-outline"></ion-icon>
                <span>Record ₱{{ formatCurrency(paymentAmount || 0) }}</span>
              </button>
            </div>
          }
        </ion-content>
      </ng-template>
    </ion-modal>
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

    /* ===== SEARCH BAR ===== */
    .search-container {
      margin-bottom: 1.25rem;
    }

    .search-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      background: var(--ion-card-background);
      border: 2px solid var(--ion-border-color, #e5e7eb);
      border-radius: 16px;
      padding: 0.75rem 1rem;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
    }

    .search-wrapper:focus-within {
      border-color: #a855f7;
      box-shadow: 0 4px 16px rgba(168, 85, 247, 0.15);
      transform: translateY(-2px);
    }

    .search-icon {
      font-size: 1.25rem;
      margin-right: 0.75rem;
      flex-shrink: 0;
    }

    .search-input {
      flex: 1;
      border: none;
      background: transparent;
      font-size: 0.9375rem;
      color: var(--ion-text-color);
      outline: none;
      font-weight: 500;
    }

    .search-input::placeholder {
      color: var(--ion-color-medium);
      font-weight: 400;
    }

    .search-clear {
      background: rgba(168, 85, 247, 0.1);
      border: none;
      border-radius: 50%;
      width: 24px;
      height: 24px;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: all 0.2s ease;
      flex-shrink: 0;
      margin-left: 0.5rem;
    }

    .search-clear:hover {
      background: rgba(168, 85, 247, 0.2);
      transform: scale(1.1);
    }

    .search-clear:active {
      transform: scale(0.95);
    }

    .search-clear ion-icon {
      font-size: 1rem;
      color: #a855f7;
    }

    .search-results-count {
      font-size: 0.875rem;
      font-weight: 500;
      color: var(--ion-color-medium);
      margin-left: 0.5rem;
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

    /* ===== COMPACT CUSTOMER CARD ===== */
    .customer-card {
      background: var(--ion-card-background, #ffffff);
      border-radius: 12px;
      padding: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      border-left: 4px solid transparent;
      overflow: hidden;
    }

    .customer-card:active {
      transform: scale(0.98);
    }

    .customer-card:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      transform: translateY(-2px);
    }

    .card-pending {
      border-left-color: #f97316;
      background: linear-gradient(to right, rgba(249, 115, 22, 0.05), transparent);
    }

    .card-collected {
      border-left-color: #10b981;
      background: linear-gradient(to right, rgba(16, 185, 129, 0.05), transparent);
    }

    .card-visited {
      border-left-color: #3b82f6;
      background: linear-gradient(to right, rgba(59, 130, 246, 0.05), transparent);
    }

    .card-missed {
      border-left-color: #6b7280;
      background: linear-gradient(to right, rgba(107, 114, 128, 0.05), transparent);
    }

    .card-header {
      display: flex;
      align-items: center;
      gap: 10px;
      margin-bottom: 10px;
    }

    .avatar-circle {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: linear-gradient(135deg, #a855f7, #6366f1);
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 16px;
      font-weight: 700;
      flex-shrink: 0;
    }

    .customer-main {
      flex: 1;
      min-width: 0;
    }

    .customer-name {
      font-size: 16px;
      font-weight: 700;
      color: var(--ion-text-color);
      margin: 0 0 4px 0;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .contact-chips {
      display: flex;
      flex-wrap: wrap;
      gap: 6px;
      align-items: center;
    }

    .contact-chip {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: var(--ion-color-medium);
      background: var(--ion-color-light);
      padding: 2px 8px;
      border-radius: 12px;
      max-width: 100%;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .contact-chip ion-icon {
      font-size: 12px;
      flex-shrink: 0;
    }

    .loan-chip {
      background: linear-gradient(135deg, rgba(168, 85, 247, 0.15), rgba(99, 102, 241, 0.1));
      color: #a855f7;
      font-weight: 600;
    }

    .status-badge {
      font-size: 10px;
      padding: 4px 8px;
      flex-shrink: 0;
    }

    .product-badge {
      display: flex;
      align-items: center;
      gap: 6px;
      font-size: 12px;
      font-weight: 600;
      color: #6366f1;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.1), rgba(99, 102, 241, 0.05));
      padding: 6px 10px;
      border-radius: 8px;
      margin-bottom: 8px;
      border: 1px solid rgba(99, 102, 241, 0.2);
    }

    .product-badge ion-icon {
      font-size: 14px;
    }

    .contact-info-compact {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      margin-bottom: 8px;
    }

    .info-item {
      display: inline-flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      color: var(--ion-color-medium);
      background: var(--ion-color-light);
      padding: 4px 8px;
      border-radius: 12px;
    }

    .info-item ion-icon {
      font-size: 12px;
    }

    .address-row {
      display: flex;
      align-items: flex-start;
      gap: 6px;
      font-size: 12px;
      color: var(--ion-color-medium);
      margin-bottom: 10px;
      padding: 8px;
      background: var(--ion-color-light);
      border-radius: 8px;
    }

    .address-row ion-icon {
      font-size: 14px;
      margin-top: 1px;
      flex-shrink: 0;
    }

    .address-row span {
      flex: 1;
      line-height: 1.4;
    }

    .financial-info {
      display: flex;
      flex-direction: column;
      gap: 8px;
      margin-bottom: 10px;
      padding: 12px;
      background: var(--ion-color-light);
      border-radius: 8px;
    }

    .info-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 16px;
    }

    .info-label {
      font-size: 13px;
      font-weight: 500;
      color: var(--ion-color-medium);
    }

    .info-value {
      font-size: 15px;
      font-weight: 700;
      color: var(--ion-text-color);
    }

    .card-actions {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 8px;
      padding-top: 8px;
      border-top: 1px solid var(--ion-border-color, #e5e7eb);
    }

    .card-actions ion-button {
      margin: 0;
      --padding-start: 8px;
      --padding-end: 8px;
      height: 32px;
    }

    .card-actions ion-icon {
      font-size: 18px;
    }

    .due-chip {
      display: flex;
      align-items: center;
      gap: 4px;
      font-size: 11px;
      font-weight: 600;
      color: var(--ion-color-medium);
      background: var(--ion-color-light);
      padding: 4px 10px;
      border-radius: 12px;
      margin-left: auto;
    }

    .due-chip ion-icon {
      font-size: 12px;
    }

    /* ===== Repayment panel ===== */
    .repayment-panel {
      padding: 10px 12px 12px 12px;
      border-top: 1px solid var(--ion-border-color, #e5e7eb);
      margin-top: 8px;
      background: rgba(0,0,0,0.02);
      border-radius: 0 0 12px 12px;
      animation: expandPanel 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      transform-origin: top;
      overflow: hidden;
    }

    @keyframes expandPanel {
      from {
        opacity: 0;
        max-height: 0;
        padding-top: 0;
        padding-bottom: 0;
        margin-top: 0;
      }
      to {
        opacity: 1;
        max-height: 2000px;
        padding-top: 10px;
        padding-bottom: 12px;
        margin-top: 8px;
      }
    }

    .filter-buttons {
      display: flex;
      gap: 8px;
      padding: 8px;
      margin-bottom: 8px;
      border-bottom: 1px solid var(--ion-border-color, #e5e7eb);
      animation: fadeInSlideDown 0.4s cubic-bezier(0.4, 0, 0.2, 1) 0.1s backwards;
    }

    @keyframes fadeInSlideDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .filter-buttons ion-button {
      flex: 1;
      margin: 0;
      --padding-start: 8px;
      --padding-end: 8px;
      height: 32px;
      font-size: 13px;
      text-transform: none;
      transition: all 0.2s ease;
    }

    .filter-buttons ion-button:hover {
      transform: translateY(-1px);
    }

    .repayment-list { 
      display: flex; 
      flex-direction: column; 
      gap: 8px; 
    }

    .repayment-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 10px;
      padding: 8px;
      background: var(--ion-background-color);
      border-radius: 8px;
      border: 1px solid rgba(0,0,0,0.04);
      animation: fadeInSlideUp 0.4s cubic-bezier(0.4, 0, 0.2, 1) backwards;
      transition: all 0.2s ease;
    }

    /* Staggered animation for each row */
    .repayment-row:nth-child(1) { animation-delay: 0.15s; }
    .repayment-row:nth-child(2) { animation-delay: 0.2s; }
    .repayment-row:nth-child(3) { animation-delay: 0.25s; }
    .repayment-row:nth-child(4) { animation-delay: 0.3s; }
    .repayment-row:nth-child(5) { animation-delay: 0.35s; }
    .repayment-row:nth-child(n+6) { animation-delay: 0.4s; }

    @keyframes fadeInSlideUp {
      from {
        opacity: 0;
        transform: translateY(15px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    .repayment-row.disabled {
      opacity: 0.6;
      pointer-events: none;
    }

    .repayment-left { display: flex; flex-direction: column; gap: 2px; }
    .repayment-num { font-weight: 700; font-size: 13px; }
    .repayment-date { font-size: 12px; color: var(--ion-color-medium); }

    .repayment-right { text-align: right; }
    .repayment-amount { font-weight: 700; color: var(--ion-text-color); }
    .repayment-status { 
      font-size: 12px; 
      font-weight: 600;
      padding: 2px 8px;
      border-radius: 10px;
      display: inline-block;
    }

    /* Status colors */
    .repayment-status.status-paid {
      color: #10b981;
      background: rgba(16, 185, 129, 0.1);
    }

    .repayment-status.status-partial {
      color: #f59e0b;
      background: rgba(245, 158, 11, 0.1);
    }

    .repayment-status.status-pending {
      color: #6b7280;
      background: rgba(107, 114, 128, 0.1);
    }

    .repayment-status.status-overdue {
      color: #ef4444;
      background: rgba(239, 68, 68, 0.1);
    }

    /* Row background colors based on status */
    .repayment-row.paid {
      background: rgba(16, 185, 129, 0.05);
      border-left: 3px solid #10b981;
    }

    .repayment-row.partial {
      background: rgba(245, 158, 11, 0.05);
      border-left: 3px solid #f59e0b;
    }

    .repayment-row.overdue {
      background: rgba(239, 68, 68, 0.05);
      border-left: 3px solid #ef4444;
    }

    .repayment-empty { padding: 8px; }
    .loan-quick-info { display:flex; gap:12px; flex-wrap:wrap; margin-top:6px; }

    /* Dark mode adjustments for cards */
    body.dark .customer-card,
    .dark .customer-card {
      background: rgba(255, 255, 255, 0.05);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    body.dark .address-row,
    .dark .address-row {
      background: rgba(255, 255, 255, 0.05);
    }

    body.dark .contact-chip,
    .dark .contact-chip {
      background: rgba(255, 255, 255, 0.08);
    }

    body.dark .due-chip,
    .dark .due-chip {
      background: rgba(255, 255, 255, 0.08);
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

    /* ===== PAYMENT MODAL STYLES (COMPACT) ===== */
    .compact-modal-content {
      --padding-top: 0;
      --padding-bottom: 0;
      --padding-start: 0;
      --padding-end: 0;
    }

    .compact-title {
      font-size: 1rem;
      font-weight: 600;
    }

    .payment-compact {
      display: flex;
      flex-direction: column;
      height: 100%;
    }

    .payment-header-compact {
      background: linear-gradient(135deg, #a855f7, #6366f1);
      color: white;
      padding: 1rem;
    }

    .customer-name {
      font-size: 1.125rem;
      font-weight: 600;
      margin-bottom: 0.25rem;
    }

    .installment-badge {
      display: inline-block;
      background: rgba(255, 255, 255, 0.2);
      padding: 0.25rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      margin-bottom: 0.75rem;
    }

    .amount-due {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding-top: 0.75rem;
      border-top: 1px solid rgba(255, 255, 255, 0.2);
    }

    .amount-due .label {
      font-size: 0.875rem;
      opacity: 0.9;
    }

    .amount-due .value {
      font-size: 1.5rem;
      font-weight: 700;
    }

    .payment-form-compact {
      flex: 1;
      padding: 1rem;
      overflow-y: auto;
    }

    .method-label {
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: var(--ion-text-color);
    }

    .payment-methods {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
      margin-bottom: 1.25rem;
    }

    .method-chip {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.25rem;
      padding: 0.75rem 0.5rem;
      border: 2px solid rgba(168, 85, 247, 0.2);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.2s ease;
      background: transparent;
    }

    .method-chip ion-icon {
      font-size: 1.5rem;
      color: #a855f7;
    }

    .method-chip span {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--ion-text-color);
    }

    .method-chip.active {
      background: linear-gradient(135deg, #a855f7, #6366f1);
      border-color: #a855f7;
    }

    .method-chip.active ion-icon,
    .method-chip.active span {
      color: white;
    }

    .amount-section {
      margin-bottom: 1.25rem;
      position: relative;
    }

    .amount-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .amount-header label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--ion-text-color);
    }

    .partial-btn {
      background: rgba(168, 85, 247, 0.1);
      border: 1px solid rgba(168, 85, 247, 0.3);
      border-radius: 8px;
      padding: 0.25rem 0.75rem;
      font-size: 0.75rem;
      color: #a855f7;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      transform: scale(1);
    }

    .partial-btn:hover {
      transform: scale(1.05);
    }

    .partial-btn:active {
      transform: scale(0.95);
    }

    .partial-btn.active {
      background: #a855f7;
      color: white;
      border-color: #a855f7;
      box-shadow: 0 4px 12px rgba(168, 85, 247, 0.3);
    }

    .full-payment-display {
      display: flex;
      align-items: center;
      background: linear-gradient(135deg, rgba(168, 85, 247, 0.1), rgba(99, 102, 241, 0.1));
      border: 2px solid rgba(168, 85, 247, 0.3);
      border-radius: 12px;
      padding: 1rem 1.25rem;
      animation: slideInFromTop 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      opacity: 1;
      transform: translateY(0);
    }

    .full-payment-display .currency {
      font-size: 1.25rem;
      font-weight: 600;
      color: #a855f7;
      margin-right: 0.5rem;
    }

    .full-payment-display .amount-value {
      flex: 1;
      font-size: 1.5rem;
      font-weight: 700;
      color: #a855f7;
    }

    .amount-input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
      border: 2px solid rgba(168, 85, 247, 0.2);
      border-radius: 12px;
      padding: 0.75rem 1rem;
      background: var(--ion-background-color);
      animation: slideInFromTop 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      opacity: 1;
      transform: translateY(0);
      transition: all 0.3s ease;
    }

    .amount-input-wrapper:focus-within {
      border-color: #a855f7;
      box-shadow: 0 0 0 3px rgba(168, 85, 247, 0.1);
    }

    .amount-input-wrapper .currency {
      font-size: 1.25rem;
      font-weight: 600;
      color: #a855f7;
      margin-right: 0.5rem;
    }

    .amount-input-wrapper .amount-input {
      flex: 1;
      border: none;
      background: transparent;
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--ion-text-color);
      outline: none;
    }

    .amount-input-wrapper .amount-input[readonly] {
      opacity: 0.7;
    }

    .remaining-balance {
      margin-top: 0.5rem;
      font-size: 0.75rem;
      color: #f59e0b;
      font-weight: 500;
      animation: fadeInSlide 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      opacity: 1;
      transform: translateY(0);
    }

    .payment-error {
      margin-top: 0.5rem;
      display: flex;
      align-items: center;
      gap: 0.375rem;
      font-size: 0.75rem;
      color: #ef4444;
      font-weight: 500;
      animation: fadeInSlide 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      opacity: 1;
      transform: translateY(0);
    }

    .payment-error ion-icon {
      font-size: 1rem;
      animation: shake 0.5s ease-in-out;
    }

    .reference-section,
    .notes-section {
      margin-bottom: 1.25rem;
    }

    .reference-section label,
    .notes-section label {
      display: block;
      font-size: 0.875rem;
      font-weight: 600;
      margin-bottom: 0.5rem;
      color: var(--ion-text-color);
    }

    .reference-input,
    .notes-input {
      width: 100%;
      border: 2px solid rgba(168, 85, 247, 0.2);
      border-radius: 12px;
      padding: 0.75rem 1rem;
      font-size: 0.875rem;
      color: var(--ion-text-color);
      background: var(--ion-background-color);
      outline: none;
      transition: border-color 0.2s ease;
    }

    .reference-input:focus,
    .notes-input:focus {
      border-color: #a855f7;
    }

    .reference-input.readonly {
      background: rgba(168, 85, 247, 0.05);
      opacity: 0.8;
      cursor: not-allowed;
    }

    .quick-notes {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 0.5rem;
      flex-wrap: wrap;
    }

    .quick-note {
      padding: 0.25rem 0.75rem;
      background: rgba(168, 85, 247, 0.1);
      border: 1px solid rgba(168, 85, 247, 0.3);
      border-radius: 12px;
      font-size: 0.75rem;
      color: #a855f7;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .quick-note:active {
      background: #a855f7;
      color: white;
    }

    .submit-payment-btn {
      margin: 1rem;
      padding: 1rem;
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .submit-payment-btn:active:not(:disabled) {
      transform: scale(0.98);
    }

    .submit-payment-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .submit-payment-btn ion-icon {
      font-size: 1.5rem;
    }

    .repayment-row {
      cursor: pointer;
      transition: all 0.2s ease;
    }

    .repayment-row:hover {
      transform: translateX(4px);
      background: rgba(168, 85, 247, 0.05);
    }

    .repayment-row:active {
      transform: scale(0.98);
    }

    /* ===== ANIMATION ===== */
    @keyframes spin {
      from { transform: rotate(0deg); }
      to { transform: rotate(360deg); }
    }
    
    @keyframes slideInFromTop {
      from {
        opacity: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes fadeInSlide {
      from {
        opacity: 0;
        transform: translateY(-5px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
      20%, 40%, 60%, 80% { transform: translateX(2px); }
    }

    .animate-spin {
      animation: spin 1s linear infinite;
    }
  `]
})
export class CollectorRoutePage implements OnInit {
  @ViewChild('partialAmountInput') partialAmountInput?: ElementRef<HTMLInputElement>;

  loading = signal(false);
  syncing = signal(false);
  currentUser = signal<any>(null);
  currentDate = new Date().toLocaleDateString('en-PH', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
  
  searchQuery: string = '';
  installmentFilter = signal<'pending' | 'paid' | 'all'>('pending'); // Default to pending only
  customers = signal<RouteCustomer[]>([]);
  stats = signal<CollectionStats>({
    totalAssigned: 0,
    visited: 0,
    collected: 0,
    totalCollected: 0,
    pendingVisits: 0
  });
  // Track expanded loans (one card per loan). Use an array inside a signal so UI updates.
  expandedLoanIds = signal<number[]>([]);
  // Simple in-memory cache for loan details fetched on demand
  loanDetailsCache: Record<number, any> = {};

  // Payment modal state
  showPaymentModal = signal(false);
  selectedLoan = signal<RouteCustomer | null>(null);
  selectedInstallment = signal<any>(null);
  paymentMethod: 'cash' | 'cheque' | 'gcash' | '' = 'cash'; // Default to cash
  paymentAmount: number = 0;
  paymentReference: string = '';
  paymentNotes: string = '';
  isPartialPayment: boolean = false;

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
      mailOutline,
      navigateOutline,
      listOutline,
      statsChartOutline,
      logOutOutline,
      syncOutline,
      moonOutline,
      sunnyOutline,
      alertCircleOutline,
      documentTextOutline,
      cardOutline,
      calendarOutline,
      closeOutline,
      logoGoogle
    });
  }

  ngOnInit() {
    this.currentUser.set(this.authService.currentUser());
    this.loadRouteData();
  }

  isExpanded(loanId: number) {
    return this.expandedLoanIds().includes(loanId);
  }

  async toggleLoanDetails(loanId: number) {
    // Toggle expansion state
    const arr = [...this.expandedLoanIds()];
    const idx = arr.indexOf(loanId);
    if (idx > -1) {
      arr.splice(idx, 1);
      this.expandedLoanIds.set(arr);
      return;
    }

    // expand
    arr.push(loanId);
    this.expandedLoanIds.set(arr);

    // fetch loan details if not cached
    await this.loadLoanDetails(loanId);
  }

  async loadLoanDetails(loanId: number) {
    if (!loanId) return null;
    if (this.loanDetailsCache[loanId]) return this.loanDetailsCache[loanId];
    try {
      console.log('📡 Fetching loan details for loan ID:', loanId);
      
      // Check if user is a collector (employee)
      const userRole = this.authService.userRole();
      
      if (userRole === 'collector') {
        // For collectors, fetch loan details and schedule separately
        const [loanRes, scheduleRes]: any[] = await Promise.all([
          this.apiService.getLoanDetails(loanId).toPromise(),
          this.apiService.getLoanSchedule(loanId).toPromise()
        ]);
        
        console.log('✅ Loan details API response:', loanRes);
        console.log('✅ Schedule API response:', scheduleRes);
        
        // Combine the responses
        const loanData = loanRes?.data || loanRes;
        const scheduleData = scheduleRes?.data || scheduleRes;
        
        const combinedData = {
          ...loanData,
          schedule: scheduleData
        };
        
        console.log('📋 Combined loan data:', combinedData);
        console.log('📋 Schedule length:', combinedData?.schedule?.length);
        
        this.loanDetailsCache[loanId] = combinedData;
        return combinedData;
      } else {
        // For customers, use the existing endpoint which includes schedule
        const res: any = await this.apiService.getLoanDetails(loanId).toPromise();
        console.log('✅ Loan details API response:', res);
        const data = res?.data || res;
        console.log('📋 Processed loan data:', data);
        console.log('📋 Schedule length:', data?.schedule?.length);
        this.loanDetailsCache[loanId] = data;
        return data;
      }
    } catch (err) {
      console.error('❌ Failed to load loan details for', loanId, err);
      return null;
    }
  }

  getLoanDetailsFromCache(loanId: number) {
    return this.loanDetailsCache[loanId] || null;
  }

  getTotalRepayment(loan: RouteCustomer): number {
    const details = this.getLoanDetailsFromCache(loan.loanId);
    if (details) {
      // Try to get totalAmount from loan details (supports both snake_case and camelCase)
      const totalAmount = details.totalAmount || details.total_amount;
      if (totalAmount) {
        console.log('💰 Total Repayment from cache:', totalAmount);
        return Number(totalAmount);
      }
    }
    
    // Fallback: Calculate based on your formula
    // Principal + Interest (5%) + Service Charge (1%) + Platform Fee (50)
    const principal = loan.principalAmount;
    const interest = principal * 0.05; // 5% interest
    const serviceCharge = principal * 0.01; // 1% service charge
    const platformFee = 50; // Fixed platform fee
    const total = principal + interest + serviceCharge + platformFee;
    
    console.log('💰 Calculated Total Repayment:', {
      principal,
      interest,
      serviceCharge,
      platformFee,
      total
    });
    
    return total;
  }

  getOutstandingBalance(loan: RouteCustomer): number {
    const details = this.getLoanDetailsFromCache(loan.loanId);
    if (details && details.schedule && Array.isArray(details.schedule)) {
      // Calculate balance from schedule: sum of all outstanding amounts
      const balance = details.schedule.reduce((total: number, item: any) => {
        const outstanding = item.outstandingAmount || item.outstanding_amount || 0;
        return total + Number(outstanding);
      }, 0);
      
      console.log('💰 Outstanding Balance calculated from schedule:', balance);
      return balance;
    }
    
    if (details) {
      // Try to get outstandingBalance from loan details (supports both snake_case and camelCase)
      const balance = details.outstandingBalance ?? details.outstanding_balance;
      if (balance !== undefined && balance !== null) {
        console.log('💰 Outstanding Balance from cache:', balance);
        return Number(balance);
      }
    }
    
    // Fallback to route data
    console.log('💰 Outstanding Balance from route data:', loan.outstandingBalance);
    return loan.outstandingBalance;
  }

  getTotalInstallments(loan: RouteCustomer): number {
    const details = this.getLoanDetailsFromCache(loan.loanId);
    if (details && details.schedule && Array.isArray(details.schedule)) {
      return details.schedule.length;
    }
    return 0;
  }

  getInstallmentsPaid(loan: RouteCustomer): number {
    const details = this.getLoanDetailsFromCache(loan.loanId);
    if (details && details.schedule && Array.isArray(details.schedule)) {
      // Count installments that are fully paid or partially paid
      const paidCount = details.schedule.filter((item: any) => {
        const status = item.status;
        return status === 'paid' || status === 'partially_paid';
      }).length;
      
      console.log('📊 Installments paid:', paidCount, 'out of', details.schedule.length);
      return paidCount;
    }
    return 0;
  }

  hasPaidInstallments(loan: RouteCustomer): boolean {
    return this.getInstallmentsPaid(loan) > 0;
  }

  getFilteredInstallments(schedule: any[]): any[] {
    if (!schedule || !Array.isArray(schedule)) {
      return [];
    }

    const filter = this.installmentFilter();
    
    if (filter === 'pending') {
      // Show pending, overdue, and partially paid installments (still need payment)
      return schedule.filter(item => 
        item.status === 'pending' || item.status === 'overdue' || item.status === 'partially_paid'
      );
    } else if (filter === 'paid') {
      // Show only fully paid installments
      return schedule.filter(item => 
        item.status === 'paid'
      );
    }
    
    // Show all installments
    return schedule;
  }

  goToVisit(customerId: number) {
    if (!customerId) return;
    this.router.navigate(['/collector/visit', customerId]);
  }

  async loadRouteData() {
    this.loading.set(true);
    try {
      const collectorId = this.authService.getCurrentUserId();
      
      if (!collectorId) {
        console.error('❌ No collector ID found in auth service');
        const toast = await this.toastController.create({
          message: 'Unable to identify collector. Please log in again.',
          duration: 3000,
          position: 'bottom',
          color: 'danger'
        });
        await toast.present();
        this.customers.set([]);
        this.calculateStats();
        return;
      }

      console.log('📡 Fetching route data for collector ID:', collectorId);
      const response: any = await this.apiService.getCollectorRoute(collectorId).toPromise();
      
      console.log('✅ API Response received:', response);
      console.log('📋 Response type:', typeof response);
      console.log('📋 Is array:', Array.isArray(response));
      
      // Handle both wrapped ({ success: true, data: [...] }) and unwrapped ([...]) responses
      const routeData = Array.isArray(response) ? response : (response?.data || []);
      
      console.log('📋 Route data after unwrapping:', routeData);
      console.log('📋 Route data length:', routeData?.length);
      if (routeData && routeData.length > 0) {
        console.log('📋 First item structure:', routeData[0]);
      }
      
      if (routeData && Array.isArray(routeData) && routeData.length > 0) {
        // Map API response to our loan interface
        const mappedLoans: RouteCustomer[] = routeData.map((loan: any) => {
          console.log('🔍 Raw loan data from API:', loan);
          
          // Handle both snake_case and camelCase field names from API
          const loanId = loan.loanId || loan.loan_id;
          const loanNumber = loan.loanNumber || loan.loan_number;
          const customerId = loan.customerId || loan.customer_id;
          const customerName = loan.customerName || loan.customer_name;
          const productName = loan.productName || loan.product_name;
          const principalAmount = loan.principalAmount || loan.principal_amount;
          const outstandingBalance = loan.outstandingBalance || loan.outstanding_balance;
          const amountDue = loan.amountDue || loan.amount_due || loan.total_due;
          const nextInstallment = loan.nextInstallment || loan.next_installment;
          const dueDate = loan.dueDate || loan.due_date || loan.next_due_date;
          
          console.log('🔍 Mapped loan:', {
            loanId,
            loanNumber,
            customerName,
            productName,
            email: loan.email,
            nextInstallment
          });
          
          return {
            customerId: customerId,
            customerName: customerName || 'Unknown Customer',
            address: loan.address || loan.full_address || 'N/A',
            phone: loan.phone || 'N/A',
            email: loan.email || '',
            loanId: loanId,
            loanNumber: loanNumber || `LOAN-${loanId}`,
            productName: productName || 'Loan Product',
            principalAmount: Number(principalAmount || 0),
            outstandingBalance: Number(outstandingBalance || 0),
            amountDue: Number(amountDue || 0),
            nextInstallment: nextInstallment ? Number(nextInstallment) : null,
            dueDate: this.formatDueDate(dueDate),
            status: loan.status || 'not-visited',
            distance: 'N/A' // Distance calculation would require GPS integration
          };
        });
        
        console.log('📊 Successfully mapped', mappedLoans.length, 'loans to route');
        this.customers.set(mappedLoans);
        
        // Preload loan details for all loans to show balance and installments immediately
        console.log('🔄 Preloading loan details for all loans...');
        for (const loan of mappedLoans) {
          try {
            await this.loadLoanDetails(loan.loanId);
            console.log(`✅ Preloaded details for loan ${loan.loanId}`);
          } catch (err) {
            console.error(`❌ Failed to preload details for loan ${loan.loanId}:`, err);
          }
        }
        console.log('✅ All loan details preloaded');
      } else {
        console.warn('⚠️ No customers assigned to this collector');
        this.customers.set([]);
        
        const toast = await this.toastController.create({
          message: 'No customers assigned to your route today',
          duration: 3000,
          position: 'bottom',
          color: 'warning'
        });
        await toast.present();
      }
      
      this.calculateStats();
    } catch (error: any) {
      console.error('❌ Error loading route data:', error);
      console.error('Error details:', {
        message: error?.message,
        status: error?.status,
        error: error?.error
      });
      
      const errorMessage = error?.error?.message || error?.message || 'Failed to load route data. Please try again.';
      
      const toast = await this.toastController.create({
        message: errorMessage,
        duration: 4000,
        position: 'bottom',
        color: 'danger',
        icon: 'alert-circle-outline'
      });
      await toast.present();
      
      this.customers.set([]);
      this.calculateStats();
    } finally {
      this.loading.set(false);
    }
  }

  formatDueDate(rawDate: string | null | undefined): string {
    if (!rawDate) {
      return 'N/A';
    }

    const parsed = new Date(rawDate);
    if (Number.isNaN(parsed.getTime())) {
      return 'N/A';
    }

    const today = new Date();
    const diffTime = parsed.getTime() - today.getTime();
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

    // Show relative dates for near-term due dates
    if (diffDays === 0) {
      return 'Today';
    } else if (diffDays === 1) {
      return 'Tomorrow';
    } else if (diffDays === -1) {
      return 'Yesterday';
    } else if (diffDays > 1 && diffDays <= 7) {
      return `In ${diffDays} days`;
    } else if (diffDays < -1 && diffDays >= -7) {
      return `${Math.abs(diffDays)} days ago`;
    }

    return parsed.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: parsed.getFullYear() !== today.getFullYear() ? 'numeric' : undefined
    });
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
    let filtered = this.customers();
    
    // Apply search filter
    if (this.searchQuery && this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase().trim();
      filtered = filtered.filter(c => 
        c.customerName.toLowerCase().includes(query) ||
        c.phone.toLowerCase().includes(query) ||
        (c.email && c.email.toLowerCase().includes(query))
      );
    }
    
    return filtered;
  }

  onSearchChange() {
    // Trigger change detection
  }

  clearSearch() {
    this.searchQuery = '';
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

  getStatusLabel(status: string): string {
    switch (status) {
      // Loan status
      case 'not-visited': return 'Pending';
      case 'visited': return 'Visited';
      case 'collected': return 'Collected';
      case 'missed': return 'Missed';
      // Installment status
      case 'paid': return 'Paid';
      case 'partially_paid': return 'Partial';
      case 'pending': return 'Pending';
      case 'overdue': return 'Overdue';
      default: return status;
    }
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length === 1) {
      return parts[0].charAt(0).toUpperCase();
    }
    return (parts[0].charAt(0) + parts[parts.length - 1].charAt(0)).toUpperCase();
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

  /**
   * Open payment modal for an installment
   */
  openPaymentModal(loan: RouteCustomer, installment: any) {
    this.selectedLoan.set(loan);
    this.selectedInstallment.set(installment);
    // Ensure amount is a proper number with 2 decimal places
    const amount = parseFloat(installment.outstandingAmount || 0);
    this.paymentAmount = Math.round(amount * 100) / 100; // Round to 2 decimal places
    this.paymentMethod = 'cash'; // Default to cash
    this.paymentReference = this.generateReference('cash'); // Auto-generate for cash
    this.paymentNotes = '';
    this.isPartialPayment = false;
    this.showPaymentModal.set(true);
  }

  /**
   * Select payment method (chip selection)
   */
  selectPaymentMethod(method: 'cash' | 'cheque' | 'gcash') {
    this.paymentMethod = method;
    if (method === 'cash') {
      this.paymentReference = this.generateReference('cash');
    } else {
      this.paymentReference = '';
    }
  }

  /**
   * Toggle between full and partial payment
   */
  togglePartialPayment() {
    this.isPartialPayment = !this.isPartialPayment;
    if (!this.isPartialPayment) {
      // Reset to full amount when switching back to full payment
      this.paymentAmount = this.selectedInstallment()?.outstandingAmount || 0;
    } else {
      // Clear amount and focus input when switching to partial payment
      this.paymentAmount = 0;
      setTimeout(() => {
        this.partialAmountInput?.nativeElement.focus();
      }, 100);
    }
  }

  /**
   * Validate payment amount
   */
  isPaymentValid(): boolean {
    if (!this.paymentMethod) return false;
    if (!this.paymentAmount || this.paymentAmount <= 0) return false;
    
    const outstandingAmount = this.selectedInstallment()?.outstandingAmount || 0;
    
    // For partial payments, amount must be less than outstanding
    if (this.isPartialPayment) {
      return this.paymentAmount > 0 && this.paymentAmount < outstandingAmount;
    }
    
    // For full payments, allow the full amount
    return this.paymentAmount > 0;
  }

  /**
   * Add quick note
   */
  addQuickNote(note: string) {
    if (this.paymentNotes) {
      this.paymentNotes += `, ${note}`;
    } else {
      this.paymentNotes = note;
    }
  }

  /**
   * Handle payment method change - auto-generate reference for cash
   */
  onPaymentMethodChange() {
    if (this.paymentMethod === 'cash') {
      this.paymentReference = this.generateReference('cash');
    } else {
      this.paymentReference = '';
    }
  }

  /**
   * Close payment modal
   */
  closePaymentModal() {
    this.showPaymentModal.set(false);
    this.selectedLoan.set(null);
    this.selectedInstallment.set(null);
    this.paymentMethod = 'cash';
    this.paymentAmount = 0;
    this.paymentReference = '';
    this.paymentNotes = '';
    this.isPartialPayment = false;
  }

  /**
   * Generate reference number based on payment method
   */
  private generateReference(method: string): string {
    const timestamp = Date.now();
    const random = Math.floor(Math.random() * 1000);
    
    switch(method) {
      case 'cash':
        return `CASH-${timestamp}-${random}`;
      case 'cheque':
        return this.paymentReference || `CHK-${timestamp}`;
      case 'gcash':
        return this.paymentReference || `GCASH-${timestamp}`;
      default:
        return `REF-${timestamp}`;
    }
  }

  /**
   * Submit payment
   */
  async submitPayment() {
    if (!this.paymentMethod || !this.paymentAmount || this.paymentAmount <= 0) {
      const toast = await this.toastController.create({
        message: 'Please enter a valid payment amount',
        duration: 2000,
        position: 'bottom',
        color: 'warning'
      });
      await toast.present();
      return;
    }

    const outstandingAmount = this.selectedInstallment()?.outstandingAmount || 0;

    // Validate payment amount
    if (this.paymentAmount > outstandingAmount) {
      const toast = await this.toastController.create({
        message: `Payment amount cannot exceed ₱${this.formatCurrency(outstandingAmount)}`,
        duration: 2000,
        position: 'bottom',
        color: 'warning'
      });
      await toast.present();
      return;
    }

    // Auto-generate reference for cash, or use provided reference
    const reference = this.paymentMethod === 'cash' 
      ? this.paymentReference // Already generated on method selection
      : this.paymentReference || this.generateReference(this.paymentMethod);

    const isPartial = this.paymentAmount < outstandingAmount;
    const remainingBalance = outstandingAmount - this.paymentAmount;

    const paymentData = {
      amount: this.paymentAmount,
      paymentMethod: this.paymentMethod,
      reference: reference,
      notes: this.paymentNotes
    };

    console.log('💰 Recording payment:', paymentData);

    try {
      // Call API to record payment
      const loanId = this.selectedLoan()?.loanId;
      if (!loanId) {
        throw new Error('Loan ID not found');
      }

      // Include loanId in payload to match DTO validation (same as web app)
      const payload = {
        loanId: loanId,
        amount: this.paymentAmount,
        paymentMethod: this.paymentMethod,
        reference: reference,
        notes: this.paymentNotes
      };

      console.log('📤 Payment payload:', payload);

      const response = await this.apiService.recordPayment(loanId, payload).toPromise();
      console.log('✅ Payment recorded:', response);

      // Show success toast with payment details
      const message = isPartial 
        ? `Partial payment ₱${this.formatCurrency(this.paymentAmount)} recorded! Remaining: ₱${this.formatCurrency(remainingBalance)}`
        : `Full payment ₱${this.formatCurrency(this.paymentAmount)} recorded!`;

      const toast = await this.toastController.create({
        message: `${message}\nRef: ${reference}`,
        duration: 4000,
        position: 'bottom',
        color: 'success',
        icon: 'checkmark-circle-outline'
      });
      await toast.present();

      // Close modal
      this.closePaymentModal();
      
      // Clear cache and reload the specific loan details to refresh schedule and balance
      if (loanId) {
        console.log('🔄 Clearing cache and reloading loan details for loan', loanId);
        // Clear the cached loan details to force a fresh fetch
        delete this.loanDetailsCache[loanId];
        await this.loadLoanDetails(loanId);
        console.log('✅ Loan details refreshed');
      }

    } catch (error) {
      console.error('❌ Failed to record payment:', error);
      const toast = await this.toastController.create({
        message: 'Failed to record payment. Please try again.',
        duration: 3000,
        position: 'bottom',
        color: 'danger'
      });
      await toast.present();
    }
  }
}
