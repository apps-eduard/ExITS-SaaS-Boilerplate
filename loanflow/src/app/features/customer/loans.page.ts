import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  ToastController
} from '@ionic/angular/standalone';
import { Router, RouterLink } from '@angular/router';

import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { CustomerTopBarComponent } from '../../shared/components/customer-top-bar.component';

interface Loan {
  id: number;
  loanNumber: string;
  amount: number;
  balance: number;
  interestRate: number;
  term: number;
  monthlyPayment: number;
  status: string;
  dueDate: string;
  progress: number;
}

@Component({
  selector: 'app-customer-loans',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonSkeletonText,
    CustomerTopBarComponent
  ],
  template: `
    <app-customer-top-bar emoji="📄" title="My Loans" />
    
    <ion-content [fullscreen]="true" class="main-content">
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <div class="loans-container">
        <!-- Summary Stats -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon-wrapper purple-gradient">
              <span class="emoji-icon">💼</span>
            </div>
            <div class="stat-content">
              <div class="stat-label">Total Loans</div>
              @if (loading()) {
                <ion-skeleton-text animated class="stat-skeleton"></ion-skeleton-text>
              } @else {
                <div class="stat-value">{{ loans().length }}</div>
              }
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon-wrapper green-gradient">
              <span class="emoji-icon">📈</span>
            </div>
            <div class="stat-content">
              <div class="stat-label">Total Balance</div>
              @if (loading()) {
                <ion-skeleton-text animated class="stat-skeleton"></ion-skeleton-text>
              } @else {
                <div class="stat-value">₱{{ formatCurrency(totalBalance()) }}</div>
              }
            </div>
          </div>
        </div>

        <!-- Filter Tabs -->
        <div class="filter-tabs">
          <button 
            class="filter-tab"
            [class.active]="filter() === 'active'"
            (click)="applyFilter('active')"
          >
            Active
            <span class="tab-count">{{ filterCount('active') }}</span>
            @if (filter() === 'active') {
              <span class="tab-indicator"></span>
            }
          </button>
          <button 
            class="filter-tab"
            [class.active]="filter() === 'completed'"
            (click)="applyFilter('completed')"
          >
            Completed
            <span class="tab-count">{{ filterCount('completed') }}</span>
            @if (filter() === 'completed') {
              <span class="tab-indicator"></span>
            }
          </button>
          <button 
            class="filter-tab"
            [class.active]="filter() === 'all'"
            (click)="applyFilter('all')"
          >
            All
            <span class="tab-count">{{ filterCount('all') }}</span>
            @if (filter() === 'all') {
              <span class="tab-indicator"></span>
            }
          </button>
          <button 
            class="filter-tab"
            [class.active]="filter() === 'submitted'"
            (click)="applyFilter('submitted')"
          >
            Submitted
            <span class="tab-count">{{ filterCount('submitted') }}</span>
            @if (filter() === 'submitted') {
              <span class="tab-indicator"></span>
            }
          </button>
        </div>

        <!-- Loans List -->
        @if (loading()) {
          <div class="loading-state">
            @for (i of [1,2,3]; track i) {
              <div class="loan-skeleton">
                <ion-skeleton-text animated class="skeleton-header"></ion-skeleton-text>
                <ion-skeleton-text animated class="skeleton-text"></ion-skeleton-text>
                <ion-skeleton-text animated class="skeleton-text"></ion-skeleton-text>
              </div>
            }
          </div>
        } @else if (filter() === 'submitted' && applications().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">📋</div>
            <h3 class="empty-title">No Submitted Applications</h3>
            <p class="empty-message">
              You don't have any submitted applications at the moment.
            </p>
            <div class="empty-actions">
              <button class="refresh-btn" (click)="loadApplications()" [disabled]="loading()">
                <span class="emoji-icon-inline">🔄</span>
                <span>Refresh</span>
              </button>
              <button class="dashboard-btn" routerLink="/customer/dashboard">
                <span class="emoji-icon-inline">🏠</span>
                <span>Back to Dashboard</span>
              </button>
            </div>
          </div>
        } @else if (filter() !== 'submitted' && filteredLoans().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">🎗️</div>
            <h3 class="empty-title">No Loans Found</h3>
            <p class="empty-message">
              @if (filter() === 'all') {
                Your loan history will appear here once you apply for your first loan.
              } @else if (filter() === 'active') {
                No active loans at the moment. Check "Submitted" to see pending applications.
              } @else if (filter() === 'completed') {
                No completed loans yet. Your paid-off loans will appear here.
              } @else {
                No loans found for this filter.
              }
            </p>
            <div class="empty-actions">
              <button class="refresh-btn" (click)="loadLoans()" [disabled]="loading()">
                <span class="emoji-icon-inline">🔄</span>
                <span>Refresh</span>
              </button>
              <button class="dashboard-btn" routerLink="/customer/dashboard">
                <span class="emoji-icon-inline">🏠</span>
                <span>Back to Dashboard</span>
              </button>
            </div>
          </div>
        } @else if (filter() === 'submitted') {
          <!-- Applications List -->
          <div class="loans-list">
            @for (app of applications(); track app.id; let idx = $index) {
              <div 
                class="loan-card application-card"
                [style.animation-delay]="idx * 50 + 'ms'"
                (click)="viewApplication(app.id)"
              >
                <!-- Compact Header -->
                <div class="app-header">
                  <div class="app-left">
                    <div class="app-icon">📋</div>
                    <div class="app-info">
                      <div class="app-number">{{ app.applicationNumber }}</div>
                      <div class="app-product">{{ app.productName }}</div>
                    </div>
                  </div>
                  <div class="app-right">
                    <div class="app-amount">₱{{ formatCurrency(app.amount) }}</div>
                    <div class="app-status">{{ app.status | titlecase }}</div>
                  </div>
                </div>
              </div>
            }
          </div>
        } @else {
          <div class="loans-list">
            @for (loan of filteredLoans(); track loan.id; let idx = $index) {
              <div 
                class="loan-card"
                [class.expanded]="expandedLoanId() === loan.id"
                [style.animation-delay]="idx * 50 + 'ms'"
                (click)="toggleLoan(loan.id)"
              >
                <!-- Card Header -->
                <div class="loan-card-header">
                  <div class="loan-number-section">
                    <div class="loan-icon-wrapper" [ngClass]="{
                      'status-active': loan.status === 'active',
                      'status-completed': loan.status === 'completed',
                      'status-overdue': loan.status === 'overdue',
                      'status-pending': loan.status === 'pending'
                    }">
                      <span class="emoji-icon-small">🎗️</span>
                    </div>
                    <div>
                      <div class="loan-number">{{ loan.loanNumber }}</div>
                      <div class="loan-date">Applied: {{ loan.dueDate }}</div>
                    </div>
                  </div>
                  <span class="emoji-icon-small">
                    {{ expandedLoanId() === loan.id ? '🔼' : '🔽' }}
                  </span>
                </div>

                <!-- Status Badge -->
                <div class="status-badge" [ngClass]="{
                  'completed': loan.status === 'completed',
                  'pending': loan.status === 'pending',
                  'overdue': loan.status === 'overdue',
                  'active': loan.status === 'active'
                }">
                  {{ loan.status | titlecase }}
                </div>

                <!-- Amount Summary -->
                <div class="amount-summary">
                  <div class="amount-item">
                    <div class="amount-label">Loan Amount</div>
                    <div class="amount-value primary">₱{{ formatCurrency(loan.amount) }}</div>
                  </div>
                  <div class="amount-divider"></div>
                  <div class="amount-item">
                    <div class="amount-label">Balance</div>
                    <div class="amount-value" [ngClass]="{
                      'success': loan.balance === 0,
                      'danger': loan.balance > 0
                    }">₱{{ formatCurrency(loan.balance) }}</div>
                  </div>
                </div>

                <!-- Progress Bar (for active/overdue) -->
                @if (loan.status === 'active' || loan.status === 'overdue') {
                  <div class="progress-section">
                    <div class="progress-header">
                      <span class="progress-label">Payment Progress</span>
                      <span class="progress-percentage">{{ loan.progress }}%</span>
                    </div>
                    <div class="progress-bar">
                      <div 
                        class="progress-fill"
                        [ngClass]="{
                          'high': loan.progress >= 75,
                          'medium': loan.progress >= 50 && loan.progress < 75,
                          'low': loan.progress < 50
                        }"
                        [style.width.%]="loan.progress"
                      ></div>
                    </div>
                  </div>
                }

                <!-- Expandable Details -->
                @if (expandedLoanId() === loan.id) {
                  <div class="loan-details">
                    <div class="details-grid">
                      <div class="detail-row">
                        <div class="detail-icon-wrapper">
                          <span class="emoji-icon-tiny">📅</span>
                        </div>
                        <div class="detail-content">
                          <div class="detail-label">Due Date</div>
                          <div class="detail-value">{{ loan.dueDate }}</div>
                        </div>
                      </div>

                      <div class="detail-row">
                        <div class="detail-icon-wrapper">
                          <span class="emoji-icon-tiny">💵</span>
                        </div>
                        <div class="detail-content">
                          <div class="detail-label">Monthly Payment</div>
                          <div class="detail-value">₱{{ formatCurrency(loan.monthlyPayment) }}</div>
                        </div>
                      </div>
                    </div>

                    <!-- Action Button -->
                    <button 
                      class="view-details-btn"
                      (click)="viewLoanDetails(loan); $event.stopPropagation()"
                    >
                      View Full Details
                      <span class="emoji-icon-inline" style="transform: rotate(-90deg);">🔽</span>
                    </button>
                  </div>
                }
              </div>
            }
          </div>
        }
      </div>
    </ion-content>
  `,
  styles: [`
    /* ===== ANIMATIONS ===== */
    @keyframes fadeInUp {
      from {
        opacity: 0;
        transform: translateY(20px);
      }
      to {
        opacity: 1;
        transform: translateY(0);
      }
    }

    @keyframes expandPanel {
      from {
        opacity: 0;
        max-height: 0;
      }
      to {
        opacity: 1;
        max-height: 500px;
      }
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }

    /* ===== MAIN CONTENT ===== */
    .main-content {
      --background: linear-gradient(160deg, rgba(102, 126, 234, 0.08), rgba(118, 75, 162, 0.04)), var(--ion-background-color);
    }

    .loans-container {
      padding: 0 1rem 1rem 1rem;
      padding-top: calc(84px + env(safe-area-inset-top));
      padding-bottom: calc(72px + env(safe-area-inset-bottom));
      max-width: 600px;
      margin: 0 auto;
    }

    /* ===== STATS GRID ===== */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .stat-card {
      background: var(--ion-card-background);
      border-radius: 16px;
      padding: 1.25rem;
      display: flex;
      gap: 1rem;
      align-items: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      border: 1px solid var(--ion-border-color, rgba(0, 0, 0, 0.08));
      animation: fadeInUp 0.5s ease-out;
    }

    .stat-icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .purple-gradient {
      background: linear-gradient(135deg, #667eea, #764ba2);
    }

    .green-gradient {
      background: linear-gradient(135deg, #10b981, #059669);
    }

    .emoji-icon {
      font-size: 1.5rem;
      line-height: 1;
    }

    .emoji-icon-small {
      font-size: 1rem;
      line-height: 1;
    }

    .emoji-icon-tiny {
      font-size: 1.125rem;
      line-height: 1;
    }

    .emoji-icon-inline {
      font-size: 1.125rem;
      line-height: 1;
      display: inline-block;
    }

    .emoji-icon-large {
      font-size: 2.5rem;
      line-height: 1;
    }

    .stat-content {
      flex: 1;
      min-width: 0;
    }

    .stat-label {
      font-size: 0.75rem;
      color: var(--ion-color-medium);
      margin-bottom: 0.25rem;
      font-weight: 500;
    }

    .stat-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--ion-text-color);
    }

    .stat-skeleton {
      width: 60%;
      height: 1.25rem;
      border-radius: 4px;
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
      padding: 0.65rem 0.75rem;
      border: none;
      background: transparent;
      color: var(--ion-color-step-600, #64748b);
      font-size: 0.8rem;
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

    /* ===== LOADING STATE ===== */
    .loading-state {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .loan-skeleton {
      background: var(--ion-card-background);
      border-radius: 16px;
      padding: 1.25rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .skeleton-header {
      width: 60%;
      height: 1.25rem;
      margin-bottom: 0.75rem;
      border-radius: 4px;
    }

    .skeleton-text {
      width: 100%;
      height: 1rem;
      margin-bottom: 0.5rem;
      border-radius: 4px;
    }

    /* ===== EMPTY STATE ===== */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      text-align: center;
      padding: 3rem 1.5rem;
      animation: fadeInUp 0.4s ease-out;
    }

    .empty-icon {
      font-size: 4rem;
      margin-bottom: 1rem;
      animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0); }
      50% { transform: translateY(-10px); }
    }

    .empty-title {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--ion-text-color, #1e293b);
      margin: 0 0 0.5rem 0;
    }

    .empty-message {
      font-size: 0.9375rem;
      color: var(--ion-color-step-600, #64748b);
      margin: 0 0 1.5rem 0;
      line-height: 1.5;
      max-width: 300px;
    }

    .empty-actions {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      width: 100%;
      max-width: 280px;
    }

    .refresh-btn,
    .dashboard-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem 1.5rem;
      border: none;
      border-radius: 10px;
      font-size: 0.9375rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .refresh-btn {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      color: white;
    }

    .refresh-btn:active {
      transform: scale(0.95);
    }

    .refresh-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .dashboard-btn {
      background: var(--ion-color-light);
      color: var(--ion-text-color);
      border: 1.5px solid var(--ion-border-color, rgba(0, 0, 0, 0.1));
    }

    .dashboard-btn:active {
      transform: scale(0.95);
    }

    .emoji-icon-inline {
      font-size: 1rem;
    }

    /* ===== LOANS LIST ===== */
    .loans-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .loan-card {
      background: var(--ion-card-background);
      border-radius: 16px;
      padding: 1.25rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      border: 1px solid var(--ion-border-color, rgba(0, 0, 0, 0.08));
      cursor: pointer;
      transition: all 0.3s ease;
      animation: fadeInUp 0.5s ease-out backwards;
    }

    .loan-card:hover {
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.12);
      transform: translateY(-2px);
    }

    .loan-card.expanded {
      box-shadow: 0 4px 16px rgba(102, 126, 234, 0.15);
    }

    /* ===== APPLICATION CARD ===== */
    .application-card {
      cursor: pointer;
      padding: 1rem;
    }

    .application-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
    }

    .app-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
    }

    .app-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;
      min-width: 0;
    }

    .app-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .app-info {
      flex: 1;
      min-width: 0;
    }

    .app-number {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--ion-text-color);
      margin-bottom: 0.15rem;
    }

    .app-product {
      font-size: 0.8rem;
      color: var(--ion-color-medium);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .app-right {
      text-align: right;
      flex-shrink: 0;
    }

    .app-amount {
      font-size: 1rem;
      font-weight: 700;
      color: var(--ion-color-primary);
      margin-bottom: 0.15rem;
    }

    .app-status {
      font-size: 0.75rem;
      font-weight: 500;
      color: var(--ion-color-warning);
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    /* ===== CARD HEADER ===== */
    .loan-card-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .loan-number-section {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .loan-icon-wrapper {
      width: 42px;
      height: 42px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .loan-icon-wrapper.status-active {
      background: linear-gradient(135deg, #10b981, #059669);
    }

    .loan-icon-wrapper.status-completed {
      background: linear-gradient(135deg, #667eea, #764ba2);
    }

    .loan-icon-wrapper.status-overdue {
      background: linear-gradient(135deg, #ef4444, #dc2626);
    }

    .loan-icon-wrapper.status-pending {
      background: linear-gradient(135deg, #f59e0b, #d97706);
    }

    .loan-number {
      font-size: 0.938rem;
      font-weight: 700;
      color: var(--ion-text-color);
      margin-bottom: 0.125rem;
    }

    .loan-date {
      font-size: 0.75rem;
      color: var(--ion-color-medium);
    }

    /* ===== STATUS BADGE ===== */
    .status-badge {
      display: inline-block;
      padding: 0.375rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      margin-bottom: 1rem;
    }

    .status-badge.completed {
      background: rgba(102, 126, 234, 0.1);
      color: #667eea;
    }

    .status-badge.pending {
      background: rgba(245, 158, 11, 0.1);
      color: #d97706;
    }

    .status-badge.overdue {
      background: rgba(239, 68, 68, 0.1);
      color: #dc2626;
    }

    .status-badge.active {
      background: rgba(16, 185, 129, 0.1);
      color: #059669;
    }

    /* ===== AMOUNT SUMMARY ===== */
    .amount-summary {
      display: grid;
      grid-template-columns: 1fr auto 1fr;
      gap: 1rem;
      align-items: center;
      margin-bottom: 1rem;
    }

    .amount-item {
      text-align: center;
    }

    .amount-label {
      font-size: 0.75rem;
      color: var(--ion-color-medium);
      margin-bottom: 0.25rem;
      font-weight: 500;
    }

    .amount-value {
      font-size: 1rem;
      font-weight: 700;
      color: var(--ion-text-color);
    }

    .amount-value.primary {
      color: #667eea;
    }

    .amount-value.success {
      color: #10b981;
    }

    .amount-value.danger {
      color: #ef4444;
    }

    .amount-divider {
      width: 1px;
      height: 32px;
      background: var(--ion-border-color, rgba(0, 0, 0, 0.1));
    }

    /* ===== PROGRESS SECTION ===== */
    .progress-section {
      margin-bottom: 1rem;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .progress-label {
      font-size: 0.75rem;
      color: var(--ion-color-medium);
      font-weight: 500;
    }

    .progress-percentage {
      font-size: 0.813rem;
      font-weight: 700;
      color: var(--ion-text-color);
    }

    .progress-bar {
      height: 8px;
      background: rgba(0, 0, 0, 0.08);
      border-radius: 4px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      border-radius: 4px;
      transition: width 0.6s ease;
    }

    .progress-fill.high {
      background: linear-gradient(90deg, #10b981, #059669);
    }

    .progress-fill.medium {
      background: linear-gradient(90deg, #f59e0b, #d97706);
    }

    .progress-fill.low {
      background: linear-gradient(90deg, #ef4444, #dc2626);
    }

    /* ===== EXPANDABLE DETAILS ===== */
    .loan-details {
      animation: expandPanel 0.3s ease-out;
      overflow: hidden;
      border-top: 1px solid var(--ion-border-color, rgba(0, 0, 0, 0.08));
      padding-top: 1rem;
      margin-top: 1rem;
    }

    .details-grid {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .detail-row {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05));
      border-radius: 12px;
    }

    .detail-icon-wrapper {
      width: 36px;
      height: 36px;
      border-radius: 8px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .detail-content {
      flex: 1;
    }

    .detail-label {
      font-size: 0.75rem;
      color: var(--ion-color-medium);
      margin-bottom: 0.125rem;
    }

    .detail-value {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--ion-text-color);
    }

    /* ===== VIEW DETAILS BUTTON ===== */
    .view-details-btn {
      width: 100%;
      padding: 0.875rem;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border: none;
      border-radius: 12px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      transition: all 0.3s ease;
    }

    .view-details-btn:hover {
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.4);
      transform: translateY(-2px);
    }

    /* ===== DARK MODE ===== */
    body.dark .main-content,
    .dark .main-content {
      --background: linear-gradient(160deg, rgba(102, 126, 234, 0.06), rgba(118, 75, 162, 0.03)), var(--ion-background-color);
    }

    body.dark .stat-card,
    body.dark .loan-card,
    body.dark .loan-skeleton,
    .dark .stat-card,
    .dark .loan-card,
    .dark .loan-skeleton {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.1);
    }

    body.dark .filter-tab,
    .dark .filter-tab {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.1);
    }

    body.dark .progress-bar,
    .dark .progress-bar {
      background: rgba(255, 255, 255, 0.1);
    }

    body.dark .amount-divider,
    .dark .amount-divider {
      background: rgba(255, 255, 255, 0.1);
    }

    body.dark .detail-row,
    .dark .detail-row {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
    }
  `]
})
export class CustomerLoansPage implements OnInit {
  loading = signal(false);
  loans = signal<Loan[]>([]);
  applications = signal<any[]>([]);
  filter = signal<string>('active');
  expandedLoanId = signal<number | null>(null);

  constructor(
    private apiService: ApiService,
    public authService: AuthService,
    private router: Router,
    public themeService: ThemeService,
    private toastController: ToastController
  ) {
  }

  ngOnInit() {
    this.loadLoans();
    this.loadApplications();
  }

  async loadLoans() {
    this.loading.set(true);
    try {
      const response = await this.apiService.getCustomerLoans().toPromise();
      console.log('🔍 Loans API Response:', response);
      const loansData = response?.data || response;
      console.log('🔍 Loans Data:', loansData);
      console.log('🔍 Is Array:', Array.isArray(loansData));
      console.log('🔍 Loans Count:', loansData?.length);
      
      if (loansData && Array.isArray(loansData)) {
        const mappedLoans = loansData.map((loan: any) => {
          console.log('🔍 Original Loan:', loan);
          const amount = parseFloat(loan.principalAmount || loan.principal_amount || loan.amount || 0);
          const balance = parseFloat(loan.outstandingBalance || loan.outstanding_balance || loan.balance || loan.remainingBalance || loan.remaining_balance || 0);
          const totalPaid = parseFloat(loan.amountPaid || loan.amount_paid || 0);
          const progress = amount > 0 ? Math.round((totalPaid / amount) * 100) : 0;

          let actualStatus = this.mapLoanStatus(loan.status);
          console.log('🔍 Status mapping:', loan.status, '→', actualStatus);
          if (balance <= 0 && amount > 0) {
            actualStatus = 'completed';
          }

          const mappedLoan = {
            id: loan.id,
            loanNumber: loan.loanNumber || loan.loan_number || `LN-${loan.id}`,
            amount: amount,
            balance: Math.max(0, balance),
            interestRate: parseFloat(loan.interestRate || loan.interest_rate || 0),
            term: loan.termDays || loan.term_days || loan.term || loan.loan_term || 0,
            monthlyPayment: parseFloat(loan.monthlyPayment || loan.monthly_payment || 0),
            status: actualStatus,
            dueDate: loan.dueDate || loan.due_date || loan.maturityDate || loan.maturity_date || 'N/A',
            progress: progress
          };
          console.log('🔍 Mapped Loan:', mappedLoan);
          return mappedLoan;
        });

        console.log('🔍 All Mapped Loans:', mappedLoans);
        this.loans.set(mappedLoans);
      } else {
        console.log('❌ Loans data is not an array or is empty');
      }
    } catch (error) {
      console.error('Error loading loans:', error);
      const toast = await this.toastController.create({
        message: 'Failed to load loans',
        duration: 2000,
        color: 'danger',
        position: 'top'
      });
      await toast.present();
    } finally {
      this.loading.set(false);
    }
  }

  async loadApplications() {
    try {
      const response = await this.apiService.getCustomerApplications().toPromise();
      console.log('🔍 Applications API Response:', response);
      const applicationsData = response?.data || response;
      console.log('🔍 Applications Data:', applicationsData);
      console.log('🔍 Is Array:', Array.isArray(applicationsData));
      console.log('🔍 Applications Count:', applicationsData?.length);
      
      if (applicationsData && Array.isArray(applicationsData)) {
        const mappedApplications = applicationsData.map((app: any) => {
          console.log('🔍 Original Application - Full Object:', JSON.stringify(app, null, 2));
          
          // Generate application number if not present
          const appNumber = app.application_number || 
                           app.applicationNumber || 
                           `APP-${app.customer_id || app.customerId || 1}-${app.created_at || Date.now()}`;
          
          console.log('🔍 Application Number:', appNumber);
          
          const mappedApp = {
            id: app.id,
            applicationNumber: appNumber,
            amount: parseFloat(app.requested_amount || app.requestedAmount || app.amount || 0),
            productName: app.productName || app.product_name || 'N/A',
            status: app.status || 'submitted',
            createdAt: app.created_at || app.createdAt,
            updatedAt: app.updated_at || app.updatedAt
          };
          
          console.log('🔍 Mapped Application:', mappedApp);
          return mappedApp;
        });
        
        console.log('🔍 Mapped Applications:', mappedApplications);
        this.applications.set(mappedApplications);
      }
    } catch (error) {
      console.error('Error loading applications:', error);
    }
  }

  async handleRefresh(event: any) {
    await Promise.all([this.loadLoans(), this.loadApplications()]);
    event.target.complete();
  }

  mapLoanStatus(status: string): string {
    if (!status) return 'active';
    status = status.toLowerCase();
    
    // Completed statuses
    if (status === 'paid' || status === 'paid_off' || status === 'completed' || status === 'closed' || status === 'fully_paid') {
      return 'completed';
    }
    
    // Overdue statuses
    if (status === 'overdue' || status === 'late' || status === 'delinquent') {
      return 'overdue';
    }
    
    // In Progress statuses (applications that are pending approval or approved but not disbursed)
    if (status === 'pending' || status === 'processing' || status === 'submitted' || status === 'approved') {
      return 'pending';
    }
    
    // Rejected status
    if (status === 'rejected') {
      return 'rejected';
    }
    
    // Disbursed status (application disbursed, loan being repaid)
    if (status === 'disbursed') {
      return 'disbursed';
    }
    
    // Active status (loan is active and being repaid)
    return 'active';
  }

  filteredLoans() {
    const allLoans = this.loans();
    
    if (this.filter() === 'all') {
      return allLoans;
    }
    
    if (this.filter() === 'completed') {
      // "Completed" - show completed loans from money_loan_loans
      return allLoans.filter(loan => 
        loan.status === 'completed' || loan.status === 'paid' || loan.status === 'closed'
      );
    }
    
    if (this.filter() === 'submitted') {
      // "Submitted" - return empty for loans, applications will be shown separately
      return [];
    }
    
    // "Active" - show only active loans (being repaid)
    return allLoans.filter(loan => 
      loan.status === 'active'
    );
  }

  filterCount(status: string): number {
    const allLoans = this.loans();
    const allApplications = this.applications();
    
    if (status === 'all') {
      return allLoans.length;
    }
    
    if (status === 'completed') {
      // Count completed loans from money_loan_loans
      return allLoans.filter(loan => 
        loan.status === 'completed' || loan.status === 'paid' || loan.status === 'closed'
      ).length;
    }
    
    if (status === 'submitted') {
      // Count submitted applications from money_loan_applications
      return allApplications.length;
    }
    
    // Active count - only active loans
    return allLoans.filter(loan => 
      loan.status === 'active'
    ).length;
  }

  applyFilter(filter: string) {
    this.filter.set(filter);
  }

  setFilter(filter: string) {
    this.filter.set(filter);
  }

  totalBalance(): number {
    return this.loans().reduce((sum, loan) => sum + loan.balance, 0);
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  toggleLoan(id: number, event?: Event) {
    if (event) {
      event.stopPropagation();
    }
    this.expandedLoanId.set(this.expandedLoanId() === id ? null : id);
  }

  viewLoanDetails(loan: Loan) {
    this.router.navigate(['/customer/loans', loan.id]);
  }

  viewApplication(applicationId: number) {
    this.router.navigate(['/customer/applications', applicationId]);
  }
}
