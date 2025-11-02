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
  IonButton,
  IonIcon,
  IonBadge,
  IonSkeletonText,
  IonButtons,
  ToastController
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
  sunnyOutline,
  chevronForwardOutline,
  calendarOutline
} from 'ionicons/icons';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { ConfirmationService } from '../../core/services/confirmation.service';

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
    IonButton,
    IonIcon,
    IonBadge,
    IonSkeletonText,
    IonButtons
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
            <ion-icon name="wallet-outline" class="title-icon"></ion-icon>
            <span class="title-text">Dashboard</span>
          </div>
        </ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="themeService.toggleTheme()" class="header-btn">
            <ion-icon [name]="themeService.isDark() ? 'sunny-outline' : 'moon-outline'" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="main-content">
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="dashboard-container">
  
        <!-- Stats Grid -->
        <div class="stats-grid">
          <!-- Total Borrowed Card -->
          <div class="stat-card stat-primary">
            <div class="stat-header">
              <div class="stat-icon-wrapper stat-icon-primary">
                <ion-icon name="wallet-outline" class="stat-icon"></ion-icon>
              </div>
              <ion-badge color="primary" class="stat-badge">{{ stats().activeLoans }}</ion-badge>
            </div>
            @if (loading()) {
              <ion-skeleton-text animated class="stat-skeleton"></ion-skeleton-text>
            } @else {
              <p class="stat-value">₱{{ formatCurrency(stats().totalBorrowed) }}</p>
            }
            <p class="stat-label">Total Borrowed</p>
            <div class="stat-decoration stat-decoration-primary"></div>
          </div>

          <!-- Balance Due Card -->
          <div class="stat-card stat-warning">
            <div class="stat-header">
              <div class="stat-icon-wrapper stat-icon-warning">
                <ion-icon name="time-outline" class="stat-icon"></ion-icon>
              </div>
            </div>
            @if (loading()) {
              <ion-skeleton-text animated class="stat-skeleton"></ion-skeleton-text>
            } @else {
              <p class="stat-value">₱{{ formatCurrency(stats().remainingBalance) }}</p>
            }
            <p class="stat-label">Balance Due</p>
            <div class="stat-decoration stat-decoration-warning"></div>
          </div>

          <!-- Total Paid Card -->
          <div class="stat-card stat-success">
            <div class="stat-header">
              <div class="stat-icon-wrapper stat-icon-success">
                <ion-icon name="checkmark-circle-outline" class="stat-icon"></ion-icon>
              </div>
            </div>
            @if (loading()) {
              <ion-skeleton-text animated class="stat-skeleton"></ion-skeleton-text>
            } @else {
              <p class="stat-value">₱{{ formatCurrency(stats().totalPaid) }}</p>
            }
            <p class="stat-label">Total Paid</p>
            <div class="stat-decoration stat-decoration-success"></div>
          </div>

          <!-- Progress Card -->
          <div class="stat-card stat-purple">
            <div class="stat-header">
              <div class="stat-icon-wrapper stat-icon-purple">
                <ion-icon name="trending-up-outline" class="stat-icon"></ion-icon>
              </div>
            </div>
            @if (loading()) {
              <ion-skeleton-text animated class="stat-skeleton"></ion-skeleton-text>
            } @else {
              <p class="stat-value">{{ paymentProgress() }}%</p>
            }
            <p class="stat-label">Paid Off</p>
            <div class="stat-decoration stat-decoration-purple"></div>
          </div>
        </div>

        <!-- Next Payment Card -->
        @if (stats().nextPaymentAmount > 0) {
          <div class="payment-card">
            <div class="payment-header">
              <div class="payment-icon-wrapper">
                <ion-icon name="time-outline" class="payment-icon"></ion-icon>
              </div>
              <p class="payment-title">Next Payment Due</p>
            </div>
            <div class="payment-body">
              <div class="payment-info">
                <p class="payment-amount">₱{{ formatCurrency(stats().nextPaymentAmount) }}</p>
                <p class="payment-date">
                  <ion-icon name="calendar-outline" class="date-icon"></ion-icon>
                  Due: {{ stats().nextPaymentDate }}
                </p>
              </div>
              <ion-button 
                routerLink="/customer/payments"
                class="payment-btn"
                size="default"
                expand="block"
              >
                <ion-icon name="card-outline" slot="start"></ion-icon>
                Pay Now
              </ion-button>
            </div>
          </div>
        }

        <!-- Quick Actions -->
        <div class="section-card">
          <div class="section-header">
            <h2 class="section-title">Quick Actions</h2>
          </div>
          <div class="actions-grid">
            <button
              routerLink="/customer/loans"
              class="action-btn action-primary"
            >
              <div class="action-icon-wrapper action-icon-primary">
                <ion-icon name="document-text-outline" class="action-icon"></ion-icon>
              </div>
              <span class="action-label">My Loans</span>
              <ion-icon name="chevron-forward-outline" class="action-arrow"></ion-icon>
            </button>

            <button
              routerLink="/customer/payments"
              class="action-btn action-success"
            >
              <div class="action-icon-wrapper action-icon-success">
                <ion-icon name="card-outline" class="action-icon"></ion-icon>
              </div>
              <span class="action-label">Payments</span>
              <ion-icon name="chevron-forward-outline" class="action-arrow"></ion-icon>
            </button>

            <button
              routerLink="/customer/apply"
              class="action-btn action-purple"
            >
              <div class="action-icon-wrapper action-icon-purple">
                <ion-icon name="add-circle-outline" class="action-icon"></ion-icon>
              </div>
              <span class="action-label">Apply Loan</span>
              <ion-icon name="chevron-forward-outline" class="action-arrow"></ion-icon>
            </button>

            <button
              routerLink="/customer/products"
              class="action-btn action-warning"
            >
              <div class="action-icon-wrapper action-icon-warning">
                <ion-icon name="wallet-outline" class="action-icon"></ion-icon>
              </div>
              <span class="action-label">Products</span>
              <ion-icon name="chevron-forward-outline" class="action-arrow"></ion-icon>
            </button>
          </div>
        </div>

        <!-- Recent Loans -->
        <div class="section-card">
          <div class="section-header">
            <h2 class="section-title">Recent Loans</h2>
            <ion-button 
              routerLink="/customer/loans"
              fill="clear" 
              size="small"
              class="view-all-btn"
            >
              View All
              <ion-icon name="arrow-forward-outline" slot="end"></ion-icon>
            </ion-button>
          </div>

          @if (loading()) {
            <div class="loans-loading">
              @for (i of [1,2,3]; track i) {
                <div class="loan-skeleton">
                  <ion-skeleton-text animated class="skeleton-header"></ion-skeleton-text>
                  <ion-skeleton-text animated class="skeleton-amount"></ion-skeleton-text>
                </div>
              }
            </div>
          } @else if (recentLoans().length === 0) {
            <div class="empty-state">
              <div class="empty-icon-wrapper">
                <ion-icon name="document-text-outline" class="empty-icon"></ion-icon>
              </div>
              <p class="empty-title">No loans yet</p>
              <p class="empty-subtitle">Start your journey by applying for a loan</p>
              <ion-button 
                routerLink="/customer/apply"
                size="default"
                class="empty-cta"
              >
                <ion-icon name="add-circle-outline" slot="start"></ion-icon>
                Apply for a Loan
              </ion-button>
            </div>
          } @else {
            <div class="loans-list">
              @for (loan of recentLoans().slice(0, 3); track loan.id) {
                <div 
                  class="loan-item"
                  [routerLink]="['/customer/loans', loan.id]"
                >
                  <div class="loan-header">
                    <span class="loan-number">{{ loan.loanNumber }}</span>
                    <ion-badge 
                      [color]="loan.status === 'active' ? 'success' : loan.status === 'pending' ? 'warning' : 'medium'"
                      class="loan-status"
                    >
                      {{ loan.status }}
                    </ion-badge>
                  </div>
                  <div class="loan-body">
                    <div class="loan-amounts">
                      <div class="loan-amount-item">
                        <p class="loan-amount-label">Amount</p>
                        <p class="loan-amount-value">₱{{ formatCurrency(loan.amount) }}</p>
                      </div>
                      <div class="loan-amount-divider"></div>
                      <div class="loan-amount-item">
                        <p class="loan-amount-label">Balance</p>
                        <p class="loan-amount-value">₱{{ formatCurrency(loan.balance) }}</p>
                      </div>
                    </div>
                    <div class="loan-footer">
                      <div class="loan-due">
                        <ion-icon name="calendar-outline" class="due-icon"></ion-icon>
                        <span class="due-text">{{ loan.dueDate }}</span>
                      </div>
                      <ion-icon name="chevron-forward-outline" class="loan-arrow"></ion-icon>
                    </div>
                  </div>
                </div>
              }
            </div>
          }
        </div>

        <!-- Footer Spacing -->
        <div class="footer-space"></div>

      </div>
    </ion-content>
  `,
  styles: [`
    /* ===== HEADER STYLES ===== */
    .custom-toolbar {
      --background: linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-secondary));
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

    .stat-icon-primary {
      background: linear-gradient(135deg, #667eea, #764ba2);
    }

    .stat-icon-primary .stat-icon {
      color: white;
    }

    .stat-icon-warning {
      background: linear-gradient(135deg, #f093fb, #f5576c);
    }

    .stat-icon-warning .stat-icon {
      color: white;
    }

    .stat-icon-success {
      background: linear-gradient(135deg, #4facfe, #00f2fe);
    }

    .stat-icon-success .stat-icon {
      color: white;
    }

    .stat-icon-purple {
      background: linear-gradient(135deg, #a8edea, #fed6e3);
    }

    .stat-icon-purple .stat-icon {
      color: #764ba2;
    }

    .stat-badge {
      font-size: 0.7rem;
      font-weight: 600;
      padding: 0.25rem 0.5rem;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--ion-text-color);
      margin: 0 0 0.25rem 0;
      line-height: 1.2;
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

    .stat-decoration-primary {
      background: #667eea;
    }

    .stat-decoration-warning {
      background: #f5576c;
    }

    .stat-decoration-success {
      background: #00f2fe;
    }

    .stat-decoration-purple {
      background: #fed6e3;
    }

    /* ===== PAYMENT CARD ===== */
    .payment-card {
      background: linear-gradient(135deg, #ff9a9e 0%, #fecfef 100%);
      border-radius: 18px;
      padding: 1.25rem;
      margin-bottom: 1.25rem;
      box-shadow: 0 8px 16px rgba(255, 154, 158, 0.3);
    }

    .payment-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .payment-icon-wrapper {
      width: 40px;
      height: 40px;
      background: rgba(255, 255, 255, 0.3);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .payment-icon {
      font-size: 1.25rem;
      color: white;
    }

    .payment-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: white;
      margin: 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .payment-body {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .payment-info {
      flex: 1;
    }

    .payment-amount {
      font-size: 2rem;
      font-weight: 700;
      color: white;
      margin: 0 0 0.5rem 0;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .payment-date {
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.9);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0;
    }

    .date-icon {
      font-size: 1rem;
    }

    .payment-btn {
      --background: white;
      --color: #f5576c;
      --border-radius: 12px;
      --box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      font-weight: 600;
      height: 48px;
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

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .section-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--ion-text-color);
      margin: 0;
    }

    .view-all-btn {
      --color: var(--ion-color-primary);
      font-size: 0.875rem;
      font-weight: 600;
    }

    /* ===== ACTIONS GRID ===== */
    .actions-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.75rem;
    }

    .action-btn {
      background: var(--ion-card-background);
      border: 2px solid;
      border-radius: 14px;
      padding: 1rem;
      display: flex;
      align-items: center;
      gap: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
      text-align: left;
      width: 100%;
    }

    .action-btn:active {
      transform: scale(0.98);
    }

    .action-primary {
      border-color: #667eea;
      background: rgba(102, 126, 234, 0.05);
    }

    .action-primary:hover {
      background: rgba(102, 126, 234, 0.1);
    }

    .action-success {
      border-color: #00f2fe;
      background: rgba(0, 242, 254, 0.05);
    }

    .action-success:hover {
      background: rgba(0, 242, 254, 0.1);
    }

    .action-purple {
      border-color: #a8edea;
      background: rgba(168, 237, 234, 0.05);
    }

    .action-purple:hover {
      background: rgba(168, 237, 234, 0.1);
    }

    .action-warning {
      border-color: #f5576c;
      background: rgba(245, 87, 108, 0.05);
    }

    .action-warning:hover {
      background: rgba(245, 87, 108, 0.1);
    }

    .action-icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .action-icon {
      font-size: 1.5rem;
      color: white;
    }

    .action-icon-primary {
      background: linear-gradient(135deg, #667eea, #764ba2);
    }

    .action-icon-success {
      background: linear-gradient(135deg, #4facfe, #00f2fe);
    }

    .action-icon-purple {
      background: linear-gradient(135deg, #a8edea, #fed6e3);
    }

    .action-icon-purple .action-icon {
      color: #764ba2;
    }

    .action-icon-warning {
      background: linear-gradient(135deg, #f093fb, #f5576c);
    }

    .action-label {
      flex: 1;
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--ion-text-color);
    }

    .action-arrow {
      font-size: 1.125rem;
      color: var(--ion-color-medium);
      opacity: 0.6;
      transition: all 0.3s ease;
    }

    .action-btn:hover .action-arrow {
      opacity: 1;
      transform: translateX(4px);
    }

    /* ===== LOANS LIST ===== */
    .loans-loading {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .loan-skeleton {
      background: var(--ion-item-background);
      border-radius: 12px;
      padding: 1rem;
    }

    .skeleton-header {
      width: 40%;
      height: 12px;
      border-radius: 4px;
      margin-bottom: 0.75rem;
    }

    .skeleton-amount {
      width: 30%;
      height: 20px;
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
      margin: 0 0 1.5rem 0;
    }

    .empty-cta {
      --border-radius: 12px;
      font-weight: 600;
    }

    .loans-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .loan-item {
      background: var(--ion-item-background);
      border: 1px solid var(--ion-border-color, #e5e7eb);
      border-radius: 14px;
      padding: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .loan-item:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    .loan-item:active {
      transform: translateY(0);
    }

    .loan-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }

    .loan-number {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--ion-color-medium);
      letter-spacing: 0.3px;
    }

    .loan-status {
      font-size: 0.7rem;
      font-weight: 600;
      padding: 0.25rem 0.65rem;
    }

    .loan-body {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .loan-amounts {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .loan-amount-item {
      flex: 1;
    }

    .loan-amount-label {
      font-size: 0.7rem;
      color: var(--ion-color-medium);
      margin: 0 0 0.25rem 0;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      font-weight: 500;
    }

    .loan-amount-value {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--ion-text-color);
      margin: 0;
    }

    .loan-amount-divider {
      width: 1px;
      height: 40px;
      background: var(--ion-border-color, #e5e7eb);
    }

    .loan-footer {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding-top: 0.75rem;
      border-top: 1px solid var(--ion-border-color, #e5e7eb);
    }

    .loan-due {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8rem;
      color: var(--ion-color-medium);
    }

    .due-icon {
      font-size: 1rem;
    }

    .due-text {
      font-weight: 500;
    }

    .loan-arrow {
      font-size: 1.125rem;
      color: var(--ion-color-medium);
      opacity: 0.4;
      transition: all 0.3s ease;
    }

    .loan-item:hover .loan-arrow {
      opacity: 1;
      transform: translateX(4px);
    }

    /* ===== FOOTER SPACING ===== */
    .footer-space {
      height: 2rem;
    }

    /* ===== DARK MODE ADJUSTMENTS ===== */
    body.dark .stat-card,
    .dark .stat-card {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.1);
    }

    body.dark .payment-card,
    .dark .payment-card {
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.3);
    }

    body.dark .section-card,
    .dark .section-card {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.1);
    }

    body.dark .action-btn,
    .dark .action-btn {
      background: rgba(255, 255, 255, 0.03);
    }

    body.dark .action-primary,
    .dark .action-primary {
      background: rgba(102, 126, 234, 0.08);
    }

    body.dark .action-success,
    .dark .action-success {
      background: rgba(0, 242, 254, 0.08);
    }

    body.dark .action-purple,
    .dark .action-purple {
      background: rgba(168, 237, 234, 0.08);
    }

    body.dark .action-warning,
    .dark .action-warning {
      background: rgba(245, 87, 108, 0.08);
    }

    body.dark .loan-item,
    .dark .loan-item {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.1);
    }

    body.dark .loan-amount-divider,
    .dark .loan-amount-divider {
      background: rgba(255, 255, 255, 0.1);
    }

    body.dark .loan-footer,
    .dark .loan-footer {
      border-top-color: rgba(255, 255, 255, 0.1);
    }

    body.dark .empty-icon-wrapper,
    .dark .empty-icon-wrapper {
      background: rgba(255, 255, 255, 0.1);
    }
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
    public themeService: ThemeService,
    private confirmationService: ConfirmationService,
    private toastController: ToastController
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
      sunnyOutline,
      chevronForwardOutline,
      calendarOutline
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
