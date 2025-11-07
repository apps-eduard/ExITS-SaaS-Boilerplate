// Customer Dashboard Page - Modern Ionic 8 + Tailwind Design
import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonButton,
  IonIcon,
  IonBadge,
  IonSkeletonText,
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
  peopleOutline,
  chevronForwardOutline,
  calendarOutline,
  alertCircleOutline,
  refreshOutline
} from 'ionicons/icons';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { ConfirmationService } from '../../core/services/confirmation.service';
import { CustomerTopBarComponent } from '../../shared/components/customer-top-bar.component';

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
  productName?: string;
  type?: string;
}

interface AssignedCollector {
  id: number;
  fullName: string;
  email?: string;
  phone?: string;
  assignedAt?: string | null;
}

@Component({
  selector: 'app-customer-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonButton,
    IonIcon,
    IonBadge,
    IonSkeletonText,
    CustomerTopBarComponent
  ],
  template: `
    <ion-content class="main-content" [fullscreen]="true">
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <app-customer-top-bar
        emoji="💼"
        title="Dashboard"
        [subtitle]="currentDateTime()"
      />

      <div class="dashboard-container">
  
        <!-- Hero Overview -->
        <div class="dashboard-hero animate-fade-up">
          <div class="hero-header">
            <div class="hero-avatar">
              <span>{{ currentUserInitials() }}</span>
            </div>
            <div class="hero-heading">
              <p class="hero-title">
                {{ authService.currentUser()?.firstName }} {{ authService.currentUser()?.lastName }}
              </p>
              <p class="hero-timestamp">{{ currentDateTime() }}</p>
            </div>
          </div>

          <div class="hero-info-cards">
            <div class="info-card">
              <span class="info-icon">🏢</span>
              <div class="info-details">
                <span class="info-label">Tenant</span>
                <span class="info-value">{{ authService.currentUser()?.tenant?.name || 'LoanFlow Tenant' }}</span>
              </div>
            </div>

            <div class="info-card" *ngIf="assignedCollector() as collector">
              <span class="info-icon">🧑‍💼</span>
              <div class="info-details">
                <span class="info-label">Collector</span>
                <span class="info-value">{{ collector.fullName }}</span>
                <span class="info-meta" *ngIf="collector.assignedAt">Assigned {{ collector.assignedAt }}</span>
                <span class="info-meta" *ngIf="collector.phone">{{ collector.phone }}</span>
              </div>
            </div>

            <div class="info-card" *ngIf="stats().activeLoans > 0">
              <span class="info-icon">📊</span>
              <div class="info-details">
                <span class="info-label">Active Loans</span>
                <span class="info-value">{{ stats().activeLoans }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Stats Grid -->
  <div class="stats-grid animate-fade-up delay-1">
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
        <!-- Insights Snapshot -->
        <div class="insights-card animate-fade-up delay-2">
          <div class="insight-item">
            <div class="insight-ring" [style.background]="progressRingBackground()">
              <div class="ring-center">
                <span class="ring-value">{{ clampedProgress() }}%</span>
                <span class="ring-label">Paid</span>
              </div>
            </div>
            <div class="insight-details">
              <p class="insight-title">Repayment progress</p>
              <p class="insight-subtitle">
                ₱{{ formatCurrency(stats().totalPaid) }} of ₱{{ formatCurrency(stats().totalBorrowed) }} cleared
              </p>
            </div>
          </div>
          <div class="insight-divider"></div>
          <div class="insight-item">
            <div class="insight-icon-wrapper">
              <ion-icon name="calendar-outline" class="insight-icon"></ion-icon>
            </div>
            <div class="insight-details">
              <p class="insight-title">Next payment</p>
              <p class="insight-subtitle">{{ stats().nextPaymentDate || 'No upcoming dues' }}</p>
              <p class="insight-amount">₱{{ formatCurrency(stats().nextPaymentAmount) }}</p>
            </div>
          </div>
        </div>

        @if (stats().nextPaymentAmount > 0) {
          <div class="payment-card animate-fade-up delay-3">
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
  <div class="section-card animate-fade-up delay-4">
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
              routerLink="/customer/apply"
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
  <div class="section-card animate-fade-up delay-5">
          <div class="section-header">
            <div class="section-header-left">
              <span class="section-emoji">📋</span>
              <h2 class="section-title">Recent Loans</h2>
            </div>
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

          <!-- Filter Tabs -->
          <div class="filter-tabs">
            <button 
              class="filter-tab"
              [class.active]="loanFilter() === 'active'"
              (click)="applyLoanFilter('active')"
            >
              Active
              <span class="tab-count">{{ loanFilterCount('active') }}</span>
              @if (loanFilter() === 'active') {
                <span class="tab-indicator"></span>
              }
            </button>
            <button 
              class="filter-tab"
              [class.active]="loanFilter() === 'all'"
              (click)="applyLoanFilter('all')"
            >
              In Progress
              <span class="tab-count">{{ loanFilterCount('all') }}</span>
              @if (loanFilter() === 'all') {
                <span class="tab-indicator"></span>
              }
            </button>
          </div>

          @if (loading()) {
            <div class="loans-loading">
              @for (i of [1,2]; track i) {
                <div class="loan-skeleton-compact">
                  <ion-skeleton-text animated class="skeleton-compact-header"></ion-skeleton-text>
                  <ion-skeleton-text animated class="skeleton-compact-body"></ion-skeleton-text>
                </div>
              }
            </div>
          } @else if (filteredRecentLoans().length === 0) {
            <div class="empty-state">
              <div class="empty-icon-wrapper">
                <ion-icon name="document-text-outline" class="empty-icon"></ion-icon>
              </div>
              <p class="empty-title">No Active Loans</p>
              <p class="empty-subtitle">Ready to take the next step? Apply for a loan and unlock financial opportunities.</p>
              <div class="empty-actions">
                <ion-button 
                  routerLink="/customer/apply"
                  size="default"
                  class="empty-cta-primary"
                  expand="block"
                >
                  <ion-icon name="add-circle-outline" slot="start"></ion-icon>
                  Apply for a Loan
                </ion-button>
                <ion-button 
                  (click)="loadDashboardData()"
                  size="default"
                  fill="outline"
                  class="empty-cta-secondary"
                  expand="block"
                >
                  <ion-icon name="refresh-outline" slot="start"></ion-icon>
                  Refresh Dashboard
                </ion-button>
              </div>
            </div>
          } @else {
            <div class="loans-list-compact">
              @for (loan of filteredRecentLoans().slice(0, 3); track loan.id) {
                <div 
                  class="loan-item-compact"
                  (click)="navigateToLoanOrApplication(loan)"
                >
                  <div class="loan-compact-content">
                    <!-- Row 1: App# and Status -->
                    <div class="loan-compact-row">
                      <span class="loan-compact-number">{{ loan.loanNumber }}</span>
                      <ion-badge 
                        [color]="getLoanStatusColor(loan.status)"
                        class="loan-compact-status"
                      >
                        {{ formatLoanStatus(loan.status) }}
                      </ion-badge>
                    </div>
                    
                    <!-- Row 2: Product Name and Amount -->
                    <div class="loan-compact-row">
                      <span class="loan-product-name">{{ loan.productName || 'Loan Product' }}</span>
                      <span class="loan-amount-value">₱{{ formatCurrency(loan.amount) }}</span>
                    </div>
                    
                    <!-- Row 3: Due Date -->
                    <div class="loan-compact-footer">
                      <span class="due-icon-compact">📅</span>
                      <span class="due-text-compact">{{ loan.dueDate }}</span>
                    </div>
                  </div>
                  <div class="loan-compact-arrow">
                    <ion-icon name="chevron-forward-outline" class="arrow-icon"></ion-icon>
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
    /* ===== FIXED TOP BAR ===== */
    /* ===== MAIN CONTENT ===== */
    .main-content {
      --background: linear-gradient(160deg, rgba(102, 126, 234, 0.12), rgba(118, 75, 162, 0.06)) , var(--ion-background-color);
    }

    .dashboard-container {
      padding: 0 1rem 1rem 1rem;
      padding-top: calc(84px + env(safe-area-inset-top) + 0.85rem);
      padding-bottom: calc(60px + env(safe-area-inset-bottom) + 0.85rem);
      max-width: 600px;
      margin: 0 auto;
    }

    @keyframes fadeUp {
      from {
        opacity: 0;
        transform: translateY(16px) scale(0.98);
      }
      to {
        opacity: 1;
        transform: translateY(0) scale(1);
      }
    }

    @keyframes slideInRight {
      from {
        opacity: 0;
        transform: translateX(-20px);
      }
      to {
        opacity: 1;
        transform: translateX(0);
      }
    }

    @keyframes scaleIn {
      from {
        opacity: 0;
        transform: scale(0.9);
      }
      to {
        opacity: 1;
        transform: scale(1);
      }
    }

    @keyframes float {
      0%, 100% {
        transform: translateY(0px);
      }
      50% {
        transform: translateY(-10px);
      }
    }

    @keyframes pulse {
      0%, 100% {
        transform: scale(1);
        opacity: 1;
      }
      50% {
        transform: scale(1.05);
        opacity: 0.8;
      }
    }

    @keyframes shimmer {
      0% {
        background-position: -1000px 0;
      }
      100% {
        background-position: 1000px 0;
      }
    }

    .animate-fade-up {
      opacity: 0;
      transform: translateY(16px) scale(0.98);
      animation: fadeUp 0.6s ease forwards;
      animation-delay: 0s;
    }

    .delay-1 { animation-delay: 0.05s; }
    .delay-2 { animation-delay: 0.1s; }
    .delay-3 { animation-delay: 0.15s; }
    .delay-4 { animation-delay: 0.2s; }
    .delay-5 { animation-delay: 0.25s; }

    @media (prefers-reduced-motion: reduce) {
      .animate-fade-up {
        animation: none;
        opacity: 1;
        transform: none;
      }
    }

    /* ===== HERO CARD ===== */
    .dashboard-hero {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      padding: 0.85rem 1rem;
      margin-bottom: 1rem;
      border-radius: 18px;
      position: relative;
      overflow: hidden;
      background: linear-gradient(135deg, rgba(99, 102, 241, 0.12), rgba(6, 182, 212, 0.08)), var(--ion-card-background);
      border: 1px solid rgba(148, 163, 184, 0.2);
      box-shadow: 0 8px 20px rgba(15, 23, 42, 0.08);
      transition: box-shadow 0.3s ease, transform 0.3s ease;
    }

    .dashboard-hero::before {
      content: '';
      position: absolute;
      width: 180px;
      height: 180px;
      background: rgba(99, 102, 241, 0.3);
      top: -90px;
      right: -80px;
      border-radius: 999px;
      filter: blur(50px);
      opacity: 0.4;
      pointer-events: none;
    }

    .dashboard-hero::after {
      content: '';
      position: absolute;
      width: 140px;
      height: 140px;
      background: rgba(56, 189, 248, 0.3);
      bottom: -80px;
      left: -60px;
      border-radius: 999px;
      filter: blur(50px);
      opacity: 0.4;
      pointer-events: none;
    }

    .dashboard-hero:hover {
      transform: translateY(-1px);
      box-shadow: 0 12px 28px rgba(15, 23, 42, 0.12);
    }

    .hero-header {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      position: relative;
      z-index: 1;
    }

    .hero-avatar {
      width: 42px;
      height: 42px;
      border-radius: 14px;
      background: linear-gradient(135deg, rgba(59, 130, 246, 0.9), rgba(14, 165, 233, 0.85));
      display: flex;
      align-items: center;
      justify-content: center;
      font-size: 1rem;
      font-weight: 700;
      color: white;
      box-shadow: 0 6px 16px rgba(59, 130, 246, 0.3);
      flex-shrink: 0;
    }

    .hero-heading {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      flex: 1;
      min-width: 0;
    }

    .hero-title {
      margin: 0;
      font-size: 1.15rem;
      font-weight: 700;
      color: var(--ion-text-color);
      letter-spacing: -0.01em;
      line-height: 1.25;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .hero-timestamp {
      margin: 0;
      font-size: 0.7rem;
      font-weight: 500;
      color: rgba(var(--ion-text-color-rgb, 15, 23, 42), 0.55);
    }

    .hero-info-cards {
      display: grid;
      gap: 0.5rem;
      grid-template-columns: 1fr;
      position: relative;
      z-index: 1;
    }

    .info-card {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.55rem 0.7rem;
      border-radius: 12px;
      border: 1px solid rgba(148, 163, 184, 0.18);
      background: rgba(255, 255, 255, 0.7);
      backdrop-filter: blur(10px);
      transition: transform 0.2s ease, box-shadow 0.2s ease;
    }

    .info-card:hover {
      transform: translateY(-1px);
      box-shadow: 0 6px 18px rgba(15, 23, 42, 0.1);
    }

    .info-icon {
      font-size: 1rem;
      line-height: 1;
    }

    .info-details {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
      flex: 1;
      min-width: 0;
    }

    .info-label {
      font-size: 0.55rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      color: rgba(var(--ion-text-color-rgb, 15, 23, 42), 0.5);
    }

    .info-value {
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--ion-text-color);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .info-meta {
      font-size: 0.62rem;
      color: rgba(var(--ion-text-color-rgb, 15, 23, 42), 0.5);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    @media (min-width: 420px) {
      .hero-info-cards {
        grid-template-columns: repeat(2, minmax(0, 1fr));
      }

      .info-card {
        padding: 0.6rem 0.75rem;
      }

      .hero-avatar {
        width: 46px;
        height: 46px;
        font-size: 1.1rem;
      }

      .hero-title {
        font-size: 1.25rem;
      }
    }

    /* ===== INSIGHTS CARD ===== */
    .insights-card {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      background: var(--ion-card-background);
      border-radius: 16px;
      padding: 1rem;
      margin-bottom: 1rem;
      border: 1px solid var(--ion-border-color, rgba(148, 163, 184, 0.18));
      box-shadow: 0 4px 16px rgba(15, 23, 42, 0.06);
      position: relative;
      overflow: hidden;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .insights-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 24px rgba(15, 23, 42, 0.1);
      border-color: rgba(102, 126, 234, 0.25);
    }

    .insight-item {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .insight-divider {
      height: 1px;
      width: 100%;
      background: var(--ion-border-color, rgba(148, 163, 184, 0.2));
      opacity: 0.5;
    }

    .insight-ring {
      width: 85px;
      height: 85px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      background: conic-gradient(rgba(14, 165, 233, 0.85) 0 0%, rgba(148, 163, 184, 0.25) 0% 100%);
      position: relative;
      flex-shrink: 0;
      transition: transform 0.3s ease;
    }

    .insights-card:hover .insight-ring {
      transform: scale(1.05) rotate(5deg);
    }

    .ring-center {
      width: 64px;
      height: 64px;
      border-radius: 50%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 0.1rem;
      background: rgba(255, 255, 255, 0.9);
      color: var(--ion-text-color);
      box-shadow: inset 0 1px 4px rgba(15, 23, 42, 0.1);
      font-weight: 700;
      transition: all 0.3s ease;
    }

    .insights-card:hover .ring-center {
      box-shadow: inset 0 2px 8px rgba(15, 23, 42, 0.15);
    }

    .ring-value {
      font-size: 1rem;
      letter-spacing: -0.01em;
    }

    .ring-label {
      font-size: 0.6rem;
      font-weight: 600;
      text-transform: uppercase;
      color: var(--ion-color-medium);
      letter-spacing: 0.06em;
    }

    .insight-details {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      color: var(--ion-text-color);
      flex: 1;
      min-width: 0;
    }

    .insight-title {
      margin: 0;
      font-size: 0.8rem;
      font-weight: 700;
      line-height: 1.3;
    }

    .insight-subtitle {
      margin: 0;
      font-size: 0.65rem;
      color: var(--ion-color-medium);
      font-weight: 500;
      line-height: 1.4;
    }

    .insight-amount {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--ion-text-color);
      line-height: 1.2;
    }

    .insight-icon-wrapper {
      width: 42px;
      height: 42px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      background: linear-gradient(135deg, rgba(14, 165, 233, 0.12), rgba(99, 102, 241, 0.2));
      color: var(--ion-color-primary);
      flex-shrink: 0;
    }

    .insight-icon {
      font-size: 1.2rem;
    }

    @media (min-width: 500px) {
      .insights-card {
        flex-direction: row;
        align-items: center;
      }

      .insight-divider {
        height: 100%;
        width: 1px;
      }

      .insight-item {
        flex: 1;
      }
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
      gap: 0.65rem;
      margin-bottom: 1rem;
    }

    .stat-card {
      background: var(--ion-card-background);
      border-radius: 14px;
      padding: 0.85rem 1rem;
      position: relative;
      overflow: hidden;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
      border: 1px solid var(--ion-border-color, #e5e7eb);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
    }

    .stat-card:hover {
      transform: translateY(-4px);
      box-shadow: 0 8px 16px rgba(0, 0, 0, 0.12);
      border-color: rgba(102, 126, 234, 0.3);
    }

    .stat-card:active {
      transform: translateY(-2px) scale(0.98);
    }

    .stat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }

    .stat-icon-wrapper {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: transform 0.3s ease;
    }

    .stat-card:hover .stat-icon-wrapper {
      transform: rotate(10deg) scale(1.1);
    }

    .stat-icon {
      font-size: 1.25rem;
      transition: transform 0.3s ease;
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
      font-size: 0.65rem;
      font-weight: 600;
      padding: 0.2rem 0.45rem;
    }

    .stat-value {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--ion-text-color);
      margin: 0 0 0.2rem 0;
      line-height: 1.2;
    }

    @media (min-width: 400px) {
      .stat-value {
        font-size: 1.2rem;
      }
    }

    .stat-label {
      font-size: 0.65rem;
      color: var(--ion-color-medium);
      margin: 0;
      font-weight: 500;
      line-height: 1.3;
    }

    .stat-skeleton {
      width: 70%;
      height: 20px;
      border-radius: 6px;
      margin-bottom: 0.4rem;
    }

    .stat-decoration {
      position: absolute;
      bottom: -8px;
      right: -8px;
      width: 60px;
      height: 60px;
      border-radius: 50%;
      opacity: 0.08;
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

    /* ===== FILTER TABS ===== */
    .filter-tabs {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 1.25rem;
      background: var(--ion-card-background, #fff);
      padding: 0.5rem;
      border-radius: 12px;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      animation: fadeInUp 0.4s ease-out 0.1s both;
    }

    .filter-tab {
      flex: 1;
      padding: 0.65rem 1rem;
      border: none;
      background: transparent;
      color: var(--ion-color-step-600, #64748b);
      font-size: 0.875rem;
      font-weight: 500;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.35rem;
    }

    .filter-tab.active {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .tab-count {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 20px;
      height: 20px;
      padding: 0 6px;
      background: var(--ion-color-step-150, rgba(0, 0, 0, 0.1));
      border-radius: 10px;
      font-size: 0.75rem;
      font-weight: 700;
      line-height: 1;
    }

    .filter-tab.active .tab-count {
      background: rgba(255, 255, 255, 0.25);
      color: white;
    }

    .tab-indicator {
      position: absolute;
      bottom: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 32px;
      height: 3px;
      background: white;
      border-radius: 3px 3px 0 0;
    }

    /* ===== SECTION CARD ===== */
    .section-card {
      background: var(--ion-card-background);
      border-radius: 16px;
      padding: 1rem;
      margin-bottom: 1rem;
      box-shadow: 0 2px 6px rgba(0, 0, 0, 0.06);
      border: 1px solid var(--ion-border-color, #e5e7eb);
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.85rem;
    }

    .section-header-left {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .section-emoji {
      font-size: 1.25rem;
      line-height: 1;
    }

    .section-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--ion-text-color);
      margin: 0;
      line-height: 1.3;
      letter-spacing: -0.01em;
    }

    .view-all-btn {
      --color: var(--ion-color-primary);
      font-size: 0.8rem;
      font-weight: 600;
    }

    /* ===== ACTIONS GRID ===== */
    .actions-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.6rem;
    }

    .action-btn {
      background: var(--ion-card-background);
      border: 2px solid;
      border-radius: 12px;
      padding: 0.75rem 0.85rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
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
      width: 40px;
      height: 40px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .action-icon {
      font-size: 1.25rem;
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
      font-size: 0.8rem;
      font-weight: 600;
      color: var(--ion-text-color);
      line-height: 1.3;
    }

    .action-arrow {
      font-size: 1rem;
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
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 3rem 1.5rem;
      animation: fadeUp 0.5s ease-out;
    }

    .empty-icon-wrapper {
      width: 100px;
      height: 100px;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
      position: relative;
      animation: float 3s ease-in-out infinite;
      box-shadow: 0 8px 24px rgba(102, 126, 234, 0.15);
    }

    .empty-icon-wrapper::before {
      content: '';
      position: absolute;
      inset: -8px;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.2), rgba(118, 75, 162, 0.2));
      opacity: 0;
      animation: pulse 2s ease-in-out infinite;
    }

    .empty-icon {
      font-size: 3rem;
      color: #667eea;
      animation: scaleIn 0.6s ease-out 0.2s backwards;
    }

    .empty-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--ion-text-color, #1e293b);
      margin: 0 0 0.75rem 0;
      animation: slideInRight 0.5s ease-out 0.3s backwards;
    }

    .empty-subtitle {
      font-size: 0.9375rem;
      color: var(--ion-color-step-600, #64748b);
      margin: 0 0 2rem 0;
      line-height: 1.6;
      max-width: 320px;
      animation: slideInRight 0.5s ease-out 0.4s backwards;
    }

    .empty-actions {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      width: 100%;
      max-width: 300px;
      animation: slideInRight 0.5s ease-out 0.5s backwards;
    }

    .empty-cta-primary {
      --border-radius: 12px;
      --background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      --background-activated: linear-gradient(135deg, #5568d3 0%, #653a8b 100%);
      --box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      font-weight: 600;
      text-transform: none;
      letter-spacing: 0.3px;
      height: 48px;
      transition: all 0.3s ease;
    }

    .empty-cta-primary:hover {
      transform: translateY(-2px);
      --box-shadow: 0 6px 16px rgba(102, 126, 234, 0.4);
    }

    .empty-cta-secondary {
      --border-radius: 12px;
      --border-width: 1.5px;
      --border-color: var(--ion-border-color, rgba(0, 0, 0, 0.1));
      font-weight: 600;
      text-transform: none;
      letter-spacing: 0.3px;
      height: 48px;
      transition: all 0.3s ease;
    }

    .empty-cta-secondary:hover {
      transform: translateY(-2px);
      --background: var(--ion-color-light);
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
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      position: relative;
      overflow: hidden;
    }

    .loan-item::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.03), rgba(118, 75, 162, 0.03));
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .loan-item:hover {
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
      transform: translateY(-4px);
      border-color: rgba(102, 126, 234, 0.2);
    }

    .loan-item:hover::before {
      opacity: 1;
    }

    .loan-item:active {
      transform: translateY(-2px);
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

    /* ===== COMPACT LOAN ITEMS ===== */
    .loans-list-compact {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }

    .loan-item-compact {
      background: var(--ion-item-background);
      border: 1px solid var(--ion-border-color, #e5e7eb);
      border-radius: 12px;
      padding: 0.85rem;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      position: relative;
      overflow: hidden;
    }

    .loan-item-compact::before {
      content: '';
      position: absolute;
      inset: 0;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.04), rgba(118, 75, 162, 0.04));
      opacity: 0;
      transition: opacity 0.3s ease;
    }

    .loan-item-compact:hover {
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.1);
      transform: translateX(4px);
      border-color: rgba(102, 126, 234, 0.25);
    }

    .loan-item-compact:hover::before {
      opacity: 1;
    }

    .loan-item-compact:active {
      transform: translateX(2px) scale(0.99);
    }

    .loan-compact-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.6rem;
      position: relative;
      z-index: 1;
    }

    .loan-compact-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
    }

    .loan-compact-number {
      font-size: 0.75rem;
      font-weight: 700;
      color: var(--ion-color-medium);
      letter-spacing: 0.3px;
      text-transform: uppercase;
    }

    .loan-compact-status {
      font-size: 0.625rem;
      font-weight: 700;
      padding: 0.2rem 0.5rem;
      letter-spacing: 0.3px;
    }

    .loan-product-name {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--ion-text-color);
      flex: 1;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .loan-amount-value {
      font-size: 1rem;
      font-weight: 700;
      color: #667eea;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.12), rgba(118, 75, 162, 0.12));
      padding: 0.35rem 0.75rem;
      border-radius: 8px;
    }

    .loan-compact-footer {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      font-size: 0.75rem;
      color: var(--ion-color-step-600, #64748b);
    }

    .due-icon-compact {
      font-size: 0.875rem;
      line-height: 1;
    }

    .due-text-compact {
      font-weight: 500;
      letter-spacing: -0.01em;
    }

    .loan-compact-arrow {
      display: flex;
      align-items: center;
      position: relative;
      z-index: 1;
    }

    .arrow-icon {
      font-size: 1.125rem;
      color: var(--ion-color-medium);
      opacity: 0.3;
      transition: all 0.3s ease;
    }

    .loan-item-compact:hover .arrow-icon {
      opacity: 1;
      transform: translateX(4px);
      color: #667eea;
    }

    /* ===== COMPACT SKELETONS ===== */
    .loan-skeleton-compact {
      background: var(--ion-card-background);
      border-radius: 12px;
      padding: 0.75rem;
      border: 1px solid var(--ion-border-color, #e5e7eb);
    }

    .skeleton-compact-header {
      width: 40%;
      height: 14px;
      margin-bottom: 0.5rem;
      border-radius: 4px;
    }

    .skeleton-compact-body {
      width: 70%;
      height: 18px;
      border-radius: 4px;
    }

    /* ===== FOOTER SPACING ===== */
    .footer-space {
      height: 2rem;
    }

    /* ===== DARK MODE ADJUSTMENTS ===== */
    body.dark .main-content,
    .dark .main-content {
      --background: linear-gradient(160deg, rgba(14, 165, 233, 0.08), rgba(79, 70, 229, 0.12)), var(--ion-background-color);
    }

    body.dark .dashboard-hero,
    .dark .dashboard-hero {
      background: rgba(30, 41, 59, 0.8);
      border-color: rgba(148, 163, 184, 0.2);
      box-shadow: 0 20px 40px rgba(15, 23, 42, 0.4);
    }

    body.dark .dashboard-hero::before,
    .dark .dashboard-hero::before {
      background: rgba(99, 102, 241, 0.35);
    }

    body.dark .dashboard-hero::after,
    .dark .dashboard-hero::after {
      background: rgba(14, 165, 233, 0.35);
    }

    body.dark .hero-tag,
    .dark .hero-tag {
      background: rgba(79, 70, 229, 0.25);
      color: rgba(224, 231, 255, 0.95);
    }

    body.dark .hero-progress,
    .dark .hero-progress {
      background: rgba(15, 23, 42, 0.7);
      border-color: rgba(148, 163, 184, 0.15);
    }

    body.dark .progress-bar,
    .dark .progress-bar {
      background: rgba(255, 255, 255, 0.08);
    }

    body.dark .insights-card,
    .dark .insights-card {
      background: rgba(30, 41, 59, 0.9);
      border-color: rgba(148, 163, 184, 0.16);
      box-shadow: 0 18px 40px rgba(2, 6, 23, 0.55);
    }

    body.dark .insight-divider,
    .dark .insight-divider {
      background: rgba(148, 163, 184, 0.25);
    }

    body.dark .ring-center,
    .dark .ring-center {
      background: rgba(15, 23, 42, 0.9);
      color: rgba(226, 232, 240, 0.95);
      box-shadow: inset 0 1px 6px rgba(255, 255, 255, 0.04);
    }

    body.dark .insight-subtitle,
    .dark .insight-subtitle {
      color: rgba(148, 163, 184, 0.85);
    }

    body.dark .insight-icon-wrapper,
    .dark .insight-icon-wrapper {
      background: linear-gradient(135deg, rgba(14, 165, 233, 0.18), rgba(99, 102, 241, 0.25));
      color: rgba(224, 231, 255, 0.95);
    }

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

    body.dark .dashboard-hero,
    .dark .dashboard-hero {
      background: linear-gradient(150deg, rgba(30, 64, 175, 0.35), rgba(12, 74, 110, 0.25)), rgba(30, 41, 59, 0.85);
      border-color: rgba(148, 163, 184, 0.18);
      box-shadow: 0 18px 42px rgba(2, 6, 23, 0.45);
    }

    body.dark .hero-timestamp,
    .dark .hero-timestamp {
      color: rgba(226, 232, 240, 0.65);
    }

    body.dark .info-card,
    .dark .info-card {
      background: rgba(15, 23, 42, 0.62);
      border-color: rgba(148, 163, 184, 0.2);
      box-shadow: 0 14px 32px rgba(2, 6, 23, 0.45);
    }

    body.dark .info-label,
    .dark .info-label {
      color: rgba(226, 232, 240, 0.5);
    }

    body.dark .info-value,
    .dark .info-value {
      color: rgba(226, 232, 240, 0.92);
    }

    body.dark .info-meta,
    .dark .info-meta {
      color: rgba(226, 232, 240, 0.65);
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
  loanFilter = signal<'active' | 'all'>('active');
  assignedCollector = signal<AssignedCollector | null>(null);

  constructor(
    private apiService: ApiService,
    public authService: AuthService,
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
      peopleOutline,
      chevronForwardOutline,
      calendarOutline,
      alertCircleOutline,
      refreshOutline
    });
  }

  ngOnInit() {
    this.currentUser.set(this.authService.currentUser());
    this.loadDashboardData();
  }

  ionViewWillEnter() {
    // Reload dashboard data whenever the page becomes visible
    // This ensures Recent Loans updates after submitting an application
    console.log('🔄 Dashboard - ionViewWillEnter - Refreshing data');
    this.loadDashboardData();
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  async loadDashboardData() {
    this.loading.set(true);
    try {
      const user = this.authService.currentUser();
      console.log('🔵 Current user:', user);
      
      if (!user) {
        console.warn('⚠️ No user found');
        this.setMockData();
        return;
      }

      console.log('🔵 Fetching dashboard data from authenticated endpoint');

      // Fetch dashboard data using JWT authenticated endpoint
      const response = await this.apiService.getCustomerDashboard().toPromise();
      console.log('📡 Raw API response:', response);
      
      const dashboardData = response?.data || response;
      console.log('📊 Dashboard data received:', dashboardData);
      console.log('📊 Recent loans:', dashboardData?.recentLoans);

      // Update stats from dashboard data
      if (dashboardData) {
        // Format next payment date
        let formattedDate = 'N/A';
        if (dashboardData.nextPaymentDate) {
          const date = new Date(dashboardData.nextPaymentDate);
          formattedDate = date.toLocaleDateString('en-US', { 
            month: 'short', 
            day: 'numeric', 
            year: 'numeric' 
          });
        }

        this.stats.set({
          totalLoans: dashboardData.totalLoans || 0,
          activeLoans: dashboardData.activeLoans || 0,
          totalBorrowed: parseFloat(dashboardData.totalBorrowed) || 0,
          totalPaid: parseFloat(dashboardData.totalPaid) || 0,
          remainingBalance: parseFloat(dashboardData.remainingBalance) || 0,
          nextPaymentAmount: parseFloat(dashboardData.nextPaymentAmount) || 0,
          nextPaymentDate: formattedDate
        });

        // Update recent loans from dashboard data
        if (dashboardData.recentLoans && Array.isArray(dashboardData.recentLoans)) {
          const mappedLoans = dashboardData.recentLoans.map((item: any) => {
            // Handle both loans and applications
            const isApplication = item.type === 'application';
            
            // Format due date
            let formattedDueDate = 'N/A';
            if (item.dueDate) {
              const date = new Date(item.dueDate);
              formattedDueDate = date.toLocaleDateString('en-US', { 
                month: 'short', 
                day: 'numeric', 
                year: 'numeric' 
              });
            } else if (isApplication) {
              formattedDueDate = 'Pending'; // Applications don't have due dates yet
            }

            const balance = parseFloat(item.balance) || 0;
            const amount = parseFloat(item.amount) || 0;
            
            // Determine actual status
            let actualStatus = this.mapLoanStatus(item.status);
            
            // For applications, keep the original status
            if (isApplication) {
              actualStatus = item.status; // submitted, approved, pending
            } else {
              // For loans, if balance is 0 or negative, mark as completed
              if (balance <= 0 && amount > 0) {
                actualStatus = 'completed';
              }
            }

            return {
              id: item.id,
              loanNumber: item.loanNumber || item.applicationNumber || `${isApplication ? 'APP' : 'LN'}-${item.id}`,
              amount: amount,
              balance: isApplication ? 0 : Math.max(0, balance), // Applications don't have balance
              status: actualStatus,
              dueDate: formattedDueDate,
              type: item.type || 'loan', // Track if it's application or loan
              productName: item.productName
            };
          });
          console.log('📋 Mapped recent loans/applications:', mappedLoans);
          this.recentLoans.set(mappedLoans);
        }

        const collectorData = dashboardData.assignedCollector;
        if (collectorData) {
          const assignedAtValue = collectorData.assignedAt;
          let formattedAssignedAt: string | null = null;
          if (assignedAtValue) {
            const assignedAtDate = new Date(assignedAtValue);
            if (!Number.isNaN(assignedAtDate.getTime())) {
              formattedAssignedAt = assignedAtDate.toLocaleDateString('en-US', {
                month: 'short',
                day: 'numeric',
                year: 'numeric'
              });
            }
          }

          const fullName = collectorData.fullName
            || `${collectorData.firstName ?? ''} ${collectorData.lastName ?? ''}`.trim()
            || collectorData.email
            || 'Assigned Collector';

          this.assignedCollector.set({
            id: collectorData.id,
            fullName,
            email: collectorData.email,
            phone: collectorData.phone,
            assignedAt: formattedAssignedAt,
          });
        } else {
          this.assignedCollector.set(null);
        }
      }

      console.log('✅ Dashboard data loaded successfully');
    } catch (error) {
      console.error('❌ Failed to load dashboard data:', error);
      console.error('Error details:', error);
      
      // Show error toast
      const toast = await this.toastController.create({
        message: 'Failed to load dashboard data. Please try again.',
        duration: 3000,
        position: 'bottom',
        color: 'danger',
        icon: 'alert-circle-outline'
      });
      await toast.present();
      
      // Set empty data instead of mock data
      this.stats.set({
        totalLoans: 0,
        activeLoans: 0,
        totalBorrowed: 0,
        totalPaid: 0,
        remainingBalance: 0,
        nextPaymentAmount: 0,
        nextPaymentDate: 'N/A'
      });
      this.recentLoans.set([]);
  this.assignedCollector.set(null);
    } finally {
      this.loading.set(false);
    }
  }

  /**
   * Map API loan status to display status
   */
  private mapLoanStatus(apiStatus: string): 'active' | 'pending' | 'completed' | 'overdue' {
    const status = (apiStatus || '').toLowerCase();
    
    // Completed/Paid statuses
    if (status === 'paid' || status === 'completed' || status === 'closed' || status === 'fully_paid') {
      return 'completed';
    }
    
    // Overdue/Late statuses
    if (status === 'overdue' || status === 'late' || status === 'delinquent') {
      return 'overdue';
    }
    
    // Pending statuses
    if (status === 'pending' || status === 'submitted' || status === 'under_review') {
      return 'pending';
    }
    
    // Active statuses (approved, disbursed, active)
    return 'active';
  }

  getLoanStatusColor(status: string): string {
    const normalized = (status || '').toLowerCase();
    
    switch (normalized) {
      case 'submitted':
      case 'pending':
      case 'under_review':
        return 'warning';
      
      case 'approved':
        return 'primary';
      
      case 'active':
      case 'disbursed':
        return 'success';
      
      case 'completed':
      case 'paid':
      case 'fully_paid':
        return 'medium';
      
      case 'overdue':
      case 'late':
      case 'delinquent':
        return 'danger';
      
      case 'rejected':
      case 'cancelled':
        return 'dark';
      
      default:
        return 'medium';
    }
  }

  formatLoanStatus(status: string): string {
    const normalized = (status || '').toLowerCase();
    
    switch (normalized) {
      case 'submitted':
        return 'Submitted';
      case 'pending':
        return 'Pending';
      case 'approved':
        return 'Approved';
      case 'active':
        return 'Active';
      case 'disbursed':
        return 'Disbursed';
      case 'completed':
        return 'Completed';
      case 'paid':
      case 'fully_paid':
        return 'Paid';
      case 'overdue':
        return 'Overdue';
      case 'rejected':
        return 'Rejected';
      default:
        return status.charAt(0).toUpperCase() + status.slice(1);
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
    this.assignedCollector.set({
      id: 101,
      fullName: 'Sample Collector',
      email: 'collector@example.com',
      phone: '+63 917 000 0000',
      assignedAt: 'Nov 1, 2025'
    });
  }

  async handleRefresh(event: any) {
    await this.loadDashboardData();
    event.target.complete();
  }

  navigateToLoanOrApplication(item: any) {
    // Check if it's an application (not yet an active loan)
    const isApplication = item.type === 'application' || 
                         ['submitted', 'approved', 'pending'].includes(item.status?.toLowerCase());
    
    if (isApplication) {
      // Navigate to application timeline
      this.router.navigate(['/customer/applications', item.id]);
    } else {
      // Navigate to loan details
      this.router.navigate(['/customer/loans', item.id]);
    }
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  paymentProgress(): number {
    const total = this.stats().totalBorrowed;
    const paid = this.stats().totalPaid;
    return total > 0 ? Math.round((paid / total) * 100) : 0;
  }

  clampedProgress(): number {
    const progress = this.paymentProgress();
    return Math.max(0, Math.min(100, progress));
  }

  filteredRecentLoans(): RecentLoan[] {
    const loans = this.recentLoans();
    if (this.loanFilter() === 'all') {
      // "In Progress" - show pending, submitted, approved loans
      return loans.filter(loan => 
        loan.status === 'pending' || 
        loan.status === 'submitted' ||
        loan.status === 'approved'
      );
    }
    // "Active" - show active and disbursed loans
    return loans.filter(loan => 
      loan.status === 'active' || 
      loan.status === 'disbursed'
    );
  }

  loanFilterCount(filter: 'active' | 'all'): number {
    const loans = this.recentLoans();
    if (filter === 'all') {
      // "In Progress" count - pending, submitted, approved loans
      return loans.filter(loan => 
        loan.status === 'pending' || 
        loan.status === 'submitted' ||
        loan.status === 'approved'
      ).length;
    }
    // "Active" count - active and disbursed loans
    return loans.filter(loan => 
      loan.status === 'active' || 
      loan.status === 'disbursed'
    ).length;
  }

  applyLoanFilter(filter: 'active' | 'all') {
    this.loanFilter.set(filter);
  }

  currentDateTime(): string {
    const now = new Date();
    const dateOptions: Intl.DateTimeFormatOptions = { 
      weekday: 'long', 
      year: 'numeric', 
      month: 'long', 
      day: 'numeric' 
    };
    const timeOptions: Intl.DateTimeFormatOptions = { 
      hour: 'numeric', 
      minute: '2-digit', 
      hour12: true 
    };
    const formattedDate = now.toLocaleDateString('en-US', dateOptions);
    const formattedTime = now.toLocaleTimeString('en-US', timeOptions);
    return `${formattedDate} at ${formattedTime}`;
  }

  currentUserInitials(): string {
    const user = this.authService.currentUser();
    const first = (user?.firstName || '').trim();
    const last = (user?.lastName || '').trim();
    const initials = `${first.charAt(0)}${last.charAt(0)}`.toUpperCase();
    return initials || (first.slice(0, 2).toUpperCase() || 'YOU');
  }

  progressRingBackground(): string {
    const progress = this.clampedProgress();
    const progressStop = `${progress}%`;
    const isDark = this.themeService.isDark();
    const activeColor = isDark ? 'rgba(96, 165, 250, 0.95)' : 'rgba(14, 165, 233, 0.95)';
    const remainderColor = isDark ? 'rgba(148, 163, 184, 0.25)' : 'rgba(148, 163, 184, 0.22)';
    return `conic-gradient(${activeColor} 0 ${progressStop}, ${remainderColor} ${progressStop} 100%)`;
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
