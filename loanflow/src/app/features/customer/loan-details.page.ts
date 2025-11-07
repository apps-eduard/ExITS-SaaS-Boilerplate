import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent,
  IonButton,
  IonBadge,
  IonSkeletonText,
  IonProgressBar,
  ToastController
} from '@ionic/angular/standalone';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { HeaderUtilsComponent } from '../../shared/components/header-utils.component';

interface LoanDetails {
  id: number;
  loanNumber: string;
  status: string;
  principalAmount: number;
  outstandingBalance: number;
  totalPaid: number;
  paymentProgress: number;
  interestRate: number;
  term: number;
  disbursementDate: string;
  maturityDate: string;
  nextPaymentDate: string;
  nextPaymentAmount: number;
  productName: string;
  productInterestRate: number;
  productInterestType: string;
  productDescription: string;
  productMinAmount: number;
  productMaxAmount: number;
  processingFee?: number;
  schedule: RepaymentSchedule[];
  payments: Payment[];
}

interface RepaymentSchedule {
  id: number;
  installmentNumber: number;
  dueDate: string;
  principalAmount: number;
  interestAmount: number;
  totalAmount: number;
  outstandingAmount: number;
  status: string;
}

interface Payment {
  id: number;
  paymentDate: string;
  amount: number;
  principalPaid: number;
  interestPaid: number;
  paymentMethod: string;
  referenceNumber: string;
  status: string;
}

@Component({
  selector: 'app-loan-details',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonButton,
    IonBadge,
    IonSkeletonText,
    IonProgressBar,
    HeaderUtilsComponent
  ],
  template: `
    <ion-content [fullscreen]="true" class="main-content">
      <!-- Fixed Top Bar -->
      <div class="fixed-top-bar">
        <div class="top-bar-content">
          <div class="top-bar-left">
            <span class="app-emoji">📋</span>
            <span class="app-title">Loan Details</span>
          </div>
          
          <div class="top-bar-right">
            <app-header-utils (devIconClicked)="logLoanDetailsToConsole()" />
          </div>
        </div>
      </div>

      <!-- Content Container with Padding -->
      <div class="loan-details-container">
      @if (loading()) {
        <div class="loading-container">
          <div class="stat-card">
            <ion-skeleton-text animated class="skeleton-header"></ion-skeleton-text>
            <ion-skeleton-text animated class="skeleton-amount"></ion-skeleton-text>
          </div>
        </div>
      } @else if (loanDetails()) {
        <div class="details-container">
          
          <!-- Modern Compact Card -->
          <div class="modern-loan-card">
            <!-- Header -->
            <div class="card-header">
              <div class="header-top">
                <h1 class="loan-title">{{ loanDetails()!.loanNumber }}</h1>
                <ion-badge 
                  [color]="getStatusColor(loanDetails()!.status)"
                  class="status-badge-compact"
                >
                  {{ loanDetails()!.status }}
                </ion-badge>
              </div>
              <p class="product-subtitle">{{ loanDetails()!.productName }}</p>
            </div>

            <!-- Stats Grid - Compact -->
            <div class="compact-stats-list">
              <div class="stat-row">
                <div class="stat-row-label">
                  <span class="stat-icon-inline">💵</span>
                  <span>Principal Amount</span>
                </div>
                <div class="stat-row-value">₱{{ formatCurrency(loanDetails()!.principalAmount) }}</div>
              </div>
              <div class="stat-row">
                <div class="stat-row-label">
                  <span class="stat-icon-inline">💰</span>
                  <span>Outstanding Balance</span>
                </div>
                <div class="stat-row-value">₱{{ formatCurrency(loanDetails()!.outstandingBalance) }}</div>
              </div>
              <div class="stat-row">
                <div class="stat-row-label">
                  <span class="stat-icon-inline">✅</span>
                  <span>Total Paid</span>
                </div>
                <div class="stat-row-value">₱{{ formatCurrency(loanDetails()!.totalPaid) }}</div>
              </div>
            </div>

            <!-- Progress Bar -->
            <div class="progress-section-compact">
              <div class="progress-header-compact">
                <span>Payment Progress</span>
                <span class="progress-percent">{{ loanDetails()!.paymentProgress }}%</span>
              </div>
              <ion-progress-bar 
                [value]="loanDetails()!.paymentProgress / 100"
                color="success"
                class="progress-bar-compact"
              ></ion-progress-bar>
            </div>

          </div>

          <!-- Loan Terms -->
          <div class="section-card compact-terms">
            <h2 class="section-title">
              📄 Loan Terms
            </h2>
            <div class="terms-list">
              <div class="term-list-item">
                <span class="term-list-icon">📈</span>
                <div class="term-list-content">
                  <p class="term-list-label">Interest Rate</p>
                  <p class="term-list-value highlight">{{ loanDetails()!.interestRate }}% (Flat)</p>
                </div>
              </div>
              <div class="term-list-item">
                <span class="term-list-icon">📅</span>
                <div class="term-list-content">
                  <p class="term-list-label">Loan Term</p>
                  <p class="term-list-value">{{ loanDetails()!.term }} months</p>
                </div>
              </div>
              <div class="term-list-item">
                <span class="term-list-icon">🔁</span>
                <div class="term-list-content">
                  <p class="term-list-label">Payment Frequency</p>
                  <p class="term-list-value">{{ getPaymentFrequency() || 'Monthly' }}</p>
                </div>
              </div>
              <div class="term-list-item">
                <span class="term-list-icon">💳</span>
                <div class="term-list-content">
                  <p class="term-list-label">Processing Fee</p>
                  <p class="term-list-value">{{ loanDetails()!.processingFee || '5000' }}%</p>
                </div>
              </div>
              <div class="term-list-item">
                <span class="term-list-icon">💼</span>
                <div class="term-list-content">
                  <p class="term-list-label">Platform Fee</p>
                  <div style="text-align: right;">
                    <p class="term-list-value">₱50/mo</p>
                    <p class="term-list-value muted">Only while loan is active</p>
                  </div>
                </div>
              </div>
              <div class="term-list-item">
                <span class="term-list-icon">⚠️</span>
                <div class="term-list-content">
                  <p class="term-list-label">Late Penalty</p>
                  <div style="text-align: right;">
                    <p class="term-list-value warning">10.00%/day</p>
                    <p class="term-list-value muted">0 day grace period</p>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Next Payment -->
          @if (loanDetails()!.nextPaymentDate && loanDetails()!.nextPaymentAmount > 0 && loanDetails()!.outstandingBalance > 0) {
            <div class="payment-due-card">
              <div class="payment-due-header">
                <span class="emoji-icon-large payment-due-icon">⏰</span>
                <h3 class="payment-due-title">Next Payment Due</h3>
              </div>
              <div class="payment-due-body">
                <p class="payment-due-amount">₱{{ formatCurrency(loanDetails()!.nextPaymentAmount) }}</p>
                <p class="payment-due-date">
                  <span class="emoji-icon-inline">📅</span>
                  {{ formatDate(loanDetails()!.nextPaymentDate) }}
                </p>
              </div>
              <ion-button 
                expand="block"
                class="pay-now-btn"
                (click)="makePayment()"
              >
                <span class="emoji-icon-inline" slot="start">💳</span>
                Make Payment
              </ion-button>
            </div>
          }

          <!-- Repayment Schedule -->
          @if (loanDetails()!.schedule && loanDetails()!.schedule.length > 0 && loanDetails()!.outstandingBalance > 0) {
            <div class="section-card schedule-card">
              <div class="section-header-toggle" (click)="scheduleExpanded.set(!scheduleExpanded())">
                <h2 class="section-title">
                  <div class="title-with-icon">
                    <span class="emoji-icon">📅</span>
                    <span>Repayment Schedule</span>
                  </div>
                  <div class="schedule-progress-badge">
                    {{ getFullyPaidCount() + getPartiallyPaidCount() }}/{{ loanDetails()!.schedule.length }} Paid/Partial
                  </div>
                </h2>
                <span class="emoji-icon toggle-icon">
                  {{ scheduleExpanded() ? '🔼' : '🔽' }}
                </span>
              </div>
              
              <!-- Schedule Summary (Always Visible) -->
              <div class="schedule-summary-modern">
                <div class="summary-item-modern paid-item">
                  <div class="summary-icon-wrapper paid-icon">
                    <span class="emoji-icon-small">✅</span>
                  </div>
                  <div class="summary-content">
                    <span class="summary-value-modern">{{ getFullyPaidCount() }}</span>
                    <span class="summary-label-modern">Fully Paid</span>
                  </div>
                </div>
                <div class="summary-item-modern pending-item">
                  <div class="summary-icon-wrapper pending-icon">
                    <span class="emoji-icon-small">⏳</span>
                  </div>
                  <div class="summary-content">
                    <span class="summary-value-modern">{{ getPendingCount() }}</span>
                    <span class="summary-label-modern">Pending</span>
                  </div>
                </div>
                <div class="summary-item-modern overdue-item">
                  <div class="summary-icon-wrapper overdue-icon">
                    <span class="emoji-icon-small">⚠️</span>
                  </div>
                  <div class="summary-content">
                    <span class="summary-value-modern">{{ getOverdueCount() }}</span>
                    <span class="summary-label-modern">Overdue</span>
                  </div>
                </div>
              </div>

              @if (scheduleExpanded()) {
                <div class="schedule-list expandable-content">
                  @for (item of loanDetails()!.schedule; track item.id; let idx = $index) {
                    <div 
                      class="schedule-item-modern" 
                      [class.paid]="item.status === 'paid'" 
                      [class.pending]="item.status === 'pending'" 
                      [class.overdue]="item.status === 'overdue'"
                      [style.animation-delay]="idx * 30 + 'ms'"
                    >
                      <div class="schedule-status-indicator"></div>
                      <div class="schedule-content">
                        <div class="schedule-header">
                          <div class="installment-info">
                            <div class="installment-number">Installment #{{ item.installmentNumber }}</div>
                            <div class="installment-date">
                              <span class="emoji-icon-inline">📅</span>
                              {{ formatDate(item.dueDate) }}
                            </div>
                          </div>
                          <div class="installment-status-badge" [class.badge-paid]="item.status === 'paid'" [class.badge-pending]="item.status === 'pending'" [class.badge-overdue]="item.status === 'overdue'">
                            {{ getScheduleStatusLabel(item.status) }}
                          </div>
                        </div>
                        <div class="schedule-amount-row">
                          <div class="amount-label">Amount Due</div>
                          <div class="amount-value">₱{{ formatCurrency(item.totalAmount) }}</div>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              }
            </div>
          }

          <!-- Payment History -->
          @if (loanDetails()!.payments && loanDetails()!.payments.length > 0) {
            <div class="section-card">
              <h2 class="section-title">
                <span class="emoji-icon">💳</span>
                Payment History
              </h2>
              <div class="payments-list">
                @for (payment of loanDetails()!.payments; track payment.id; let idx = $index) {
                  <div class="payment-item" [style.animation-delay]="idx * 50 + 'ms'">
                    <div class="payment-icon-wrapper">
                      <span class="emoji-icon-small">✅</span>
                    </div>
                    <div class="payment-content">
                      <div class="payment-main-row">
                        <div class="payment-date-amount">
                          <div class="payment-date">{{ formatDate(payment.paymentDate) }}</div>
                          <div class="payment-amount">₱{{ formatCurrency(payment.amount) }}</div>
                        </div>
                        <div class="payment-method-badge" [ngClass]="getPaymentMethodClass(payment.paymentMethod)">
                          {{ payment.paymentMethod || 'N/A' }}
                        </div>
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Footer Spacing -->
          <div class="footer-space"></div>
        </div>
      } @else {
        <div class="error-container">
          <span class="emoji-icon-large error-icon">⚠️</span>
          <h2>Loan Not Found</h2>
          <p>Unable to load loan details. Please try again.</p>
          <ion-button (click)="loadLoanDetails()">Retry</ion-button>
        </div>
      }
      </div>
    </ion-content>
  `,
  styles: [`
    /* Fixed Top Bar Styles */
    .fixed-top-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 100;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding-top: env(safe-area-inset-top);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
    }

    .top-bar-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      height: 56px;
      padding: 0 1rem;
    }

    .top-bar-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;
    }

    .top-bar-right {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .app-emoji {
      font-size: 1.5rem;
      line-height: 1;
    }

    .app-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: white;
      letter-spacing: -0.01em;
    }

    /* Main Content Background */
    .main-content {
      --background: linear-gradient(to bottom, #f7f7f9 0%, #eeeef2 100%);
    }

    /* Container with safe area padding */
    .loan-details-container {
      padding-top: calc(56px + env(safe-area-inset-top) + 0.85rem);
      padding-bottom: calc(60px + env(safe-area-inset-bottom) + 0.85rem);
      padding-left: 0;
      padding-right: 0;
    }

    .details-container {
      padding: 1rem;
      max-width: 600px;
      margin: 0 auto;
    }

    .loading-container,
    .error-container {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1rem;
      text-align: center;
    }

    .error-icon {
      font-size: 4rem;
      color: var(--ion-color-danger);
      margin-bottom: 1rem;
    }

    /* Modern Compact Loan Card */
    .modern-loan-card {
      background: var(--ion-card-background);
      border-radius: 20px;
      padding: 1.5rem;
      margin-bottom: 1.25rem;
      box-shadow: 0 4px 16px rgba(0, 0, 0, 0.08);
      border: 1px solid var(--ion-border-color, rgba(0, 0, 0, 0.06));
    }

    .card-header {
      margin-bottom: 1.5rem;
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--ion-border-color, rgba(0, 0, 0, 0.08));
    }

    .header-top {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.3rem;
    }

    .loan-title {
      font-size: 1rem;
      font-weight: 600;
      background: linear-gradient(135deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
      margin: 0;
    }

    .status-badge-compact {
      font-size: 0.5rem;
      font-weight: 600;
      padding: 0.35rem 0.5rem;
      border-radius: 10px;
    }

    .product-subtitle {
      font-size: 0.85rem;
      color: var(--ion-color-medium);
      margin: 0;
    }

    /* Compact Stats List */
    .compact-stats-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-bottom: .5rem;
    }

    .stat-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.4em 0;
      border-bottom: 1px solid var(--ion-border-color, rgba(0, 0, 0, 0.08));
    }

    .stat-row:last-child {
      border-bottom: none;
    }

    .stat-row-label {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: var(--ion-color-medium);
    }

    .stat-icon-inline {
      font-size: 1.25rem;
    }

    .stat-row-value {
      font-size: 1rem;
      font-weight: 500;
      color: var(--ion-text-color);
    }

    /* Compact Stats Grid */
    .compact-stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 1rem;
    }

    .compact-stat {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      padding: 0.75rem;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.05));
      border-radius: 12px;
    }

    .compact-stat .stat-icon {
      font-size: 1.75rem;
      flex-shrink: 0;
    }

    .compact-stat .stat-content {
      flex: 1;
      min-width: 0;
    }

    .stat-value-compact {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--ion-text-color);
      margin-bottom: 0.15rem;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    .stat-label-compact {
      font-size: 0.7rem;
      color: var(--ion-color-medium);
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    /* Progress Section Compact */
    .progress-section-compact {
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--ion-border-color, rgba(0, 0, 0, 0.06));
    }

    .progress-header-compact {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.5rem;
      font-size: 0.85rem;
      font-weight: 600;
      color: var(--ion-text-color);
    }

    .progress-percent {
      color: var(--ion-color-success);
      font-weight: 700;
    }

    .progress-bar-compact {
      height: 8px;
      border-radius: 4px;
    }

    /* Loan Header */
    .loan-header-card {
      background: linear-gradient(135deg, #667eea, #764ba2);
      border-radius: 18px;
      padding: 1.5rem;
      margin-bottom: 1.25rem;
      box-shadow: 0 8px 16px rgba(102, 126, 234, 0.3);
    }

    .loan-number-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }

    .loan-number {
      font-size: 1.5rem;
      font-weight: 700;
      color: white;
      margin: 0;
    }

    .status-badge {
      font-size: 0.75rem;
      font-weight: 600;
      padding: 0.4rem 0.8rem;
    }

    .product-name {
      font-size: 0.95rem;
      color: rgba(255, 255, 255, 0.9);
      margin: 0;
    }

    /* Stats Grid */
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
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      border: 1px solid var(--ion-border-color, #e5e7eb);
    }

    .stat-icon-wrapper {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 0.75rem;
      background: var(--ion-color-primary);
    }

    .emoji-icon {
      font-size: 1.5rem;
      line-height: 1;
    }

    .emoji-icon-small {
      font-size: 1rem;
      line-height: 1;
    }

    .emoji-icon-inline {
      font-size: 1.125rem;
      line-height: 1;
      display: inline-block;
    }

    .emoji-icon-large {
      font-size: 2rem;
      line-height: 1;
    }

    .stat-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--ion-text-color);
      margin: 0 0 0.25rem 0;
    }

    .stat-label {
      font-size: 0.75rem;
      color: var(--ion-color-medium);
      margin: 0;
    }

    /* Progress Card */
    .progress-card {
      background: var(--ion-card-background);
      border-radius: 16px;
      padding: 1.25rem;
      margin-bottom: 1.25rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      border: 1px solid var(--ion-border-color, #e5e7eb);
    }

    .progress-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--ion-text-color);
      margin: 0 0 0.75rem 0;
    }

    .progress-bar {
      height: 12px;
      border-radius: 6px;
      margin-bottom: 0.5rem;
    }

    .progress-text {
      font-size: 0.75rem;
      color: var(--ion-color-medium);
      text-align: center;
      margin: 0;
    }

    /* Section Card */
    .section-card {
      background: var(--ion-card-background);
      border-radius: 18px;
      padding: 1.25rem;
      margin-bottom: 1.25rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      border: 1px solid var(--ion-border-color, #e5e7eb);
    }

    .section-title {
      font-size: 0.9rem;
      font-weight: 500;
      color: var(--ion-text-color);
      margin: 0 0 1rem 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    /* Section Header with Toggle */
    .section-header-toggle {
      display: flex;
      align-items: center;
      justify-content: space-between;
      cursor: pointer;
      margin-bottom: 1rem;
      padding: 0.5rem;
      margin: -0.5rem -0.5rem 1rem -0.5rem;
      border-radius: 12px;
      transition: background 0.2s ease;
    }

    .section-header-toggle:hover {
      background: rgba(0, 0, 0, 0.02);
    }

    .section-header-toggle .section-title {
      margin: 0;
      flex: 1;
    }

    .toggle-icon {
      font-size: 1.5rem;
      color: var(--ion-color-medium);
      transition: transform 0.3s ease, color 0.3s ease;
    }

    .section-header-toggle:hover .toggle-icon {
      color: var(--ion-color-primary);
    }

    /* Expandable Content Animation */
    @keyframes expandPanel {
      from {
        opacity: 0;
        max-height: 0;
        transform: translateY(-10px);
      }
      to {
        opacity: 1;
        max-height: 5000px;
        transform: translateY(0);
      }
    }

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

    .expandable-content {
      animation: expandPanel 0.4s ease-out;
      overflow: hidden;
    }

    /* Compact Terms Section */
    .compact-terms {
      padding: 1.25rem;
    }

    .terms-list {
      display: flex;
      flex-direction: column;
      gap: 0;
    }

    .term-list-item {
      display: flex;
      align-items: center;
      gap: 0.875rem;
      padding: 0.875rem 0;
      border-bottom: 1px solid var(--ion-border-color, rgba(148, 163, 184, 0.15));
    }

    .term-list-item:last-child {
      border-bottom: none;
    }

    .term-list-icon {
      font-size: 1.25rem;
      flex-shrink: 0;
      opacity: 1;
      line-height: 1;
    }

    .term-list-content {
      flex: 1;
      min-width: 0;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
    }

    .term-list-label {
      font-size: 0.8rem;
      color: var(--ion-color-medium);
      margin: 0;
      font-weight: 400;
      line-height: 1.3;
    }

    .term-list-value {
      font-size: 0.8rem;
      font-weight: 500;
      color: var(--ion-text-color);
      margin: 0;
      line-height: 1.3;
      text-align: right;
      flex-shrink: 0;
    }

    .term-list-value.highlight {
      color: var(--ion-color-success);
    }

    .term-list-value.warning {
      color: var(--ion-color-warning);
    }

    .term-list-value.muted {
      font-size: 0.7rem;
      opacity: 0.6;
    }

    @media (min-width: 400px) {
      .term-list-label {
        font-size: 0.85rem;
      }

      .term-list-value {
        font-size: 0.85rem;
      }

      .term-list-value.muted {
        font-size: 0.75rem;
      }
    }

    /* Old compact grid styles - kept for backward compatibility */
    .terms-compact-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }

    @media (min-width: 500px) {
      .terms-compact-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }

    .term-compact-item {
      display: flex;
      align-items: center;
      gap: 0.65rem;
      padding: 0.75rem;
      background: var(--ion-item-background);
      border-radius: 12px;
      border: 1px solid var(--ion-border-color, rgba(148, 163, 184, 0.2));
    }

    .term-compact-icon {
      font-size: 1.25rem;
      color: var(--ion-color-primary);
      flex-shrink: 0;
    }

    .term-compact-content {
      min-width: 0;
      flex: 1;
    }

    .term-compact-label {
      font-size: 0.65rem;
      color: var(--ion-color-medium);
      margin: 0 0 0.2rem 0;
      text-transform: uppercase;
      letter-spacing: 0.3px;
      font-weight: 600;
      line-height: 1.2;
    }

    .term-compact-value {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--ion-text-color);
      margin: 0;
      line-height: 1.3;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    @media (min-width: 400px) {
      .term-compact-label {
        font-size: 0.7rem;
      }

      .term-compact-value {
        font-size: 0.9rem;
      }
    }

    /* Terms Grid */
    .terms-grid {
      display: grid;
      gap: 1rem;
    }

    .term-item {
      padding-bottom: 1rem;
      border-bottom: 1px solid var(--ion-border-color, #e5e7eb);
    }

    .term-item:last-child {
      border-bottom: none;
      padding-bottom: 0;
    }

    .term-label {
      font-size: 0.75rem;
      color: var(--ion-color-medium);
      margin: 0 0 0.25rem 0;
      text-transform: uppercase;
      letter-spacing: 0.5px;
    }

    .term-value {
      font-size: 1rem;
      font-weight: 600;
      color: var(--ion-text-color);
      margin: 0;
    }

    /* Payment Due Card */
    .payment-due-card {
      background: linear-gradient(135deg, #f093fb, #f5576c);
      border-radius: 18px;
      padding: 1.25rem;
      margin-bottom: 1.25rem;
      box-shadow: 0 8px 16px rgba(245, 87, 108, 0.3);
    }

    .payment-due-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 1rem;
    }

    .payment-due-icon {
      font-size: 1.5rem;
      color: white;
    }

    .payment-due-title {
      font-size: 0.95rem;
      font-weight: 600;
      color: white;
      margin: 0;
      text-transform: uppercase;
    }

    .payment-due-body {
      margin-bottom: 1rem;
    }

    .payment-due-amount {
      font-size: 2rem;
      font-weight: 700;
      color: white;
      margin: 0 0 0.5rem 0;
    }

    .payment-due-date {
      font-size: 0.875rem;
      color: rgba(255, 255, 255, 0.9);
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin: 0;
    }

    .pay-now-btn {
      --background: white;
      --color: #f5576c;
      --border-radius: 12px;
      font-weight: 600;
      height: 48px;
    }

    /* Enhanced Schedule Card */
    .schedule-card {
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.03), rgba(118, 75, 162, 0.02)), var(--ion-card-background);
    }

    .title-with-icon {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .schedule-progress-badge {
      padding: 0.375rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      background: rgba(102, 126, 234, 0.1);
      color: #667eea;
      margin-left: 0.5rem;
    }

    /* Modern Schedule Summary */
    .schedule-summary-modern {
      display: grid;
      grid-template-columns: repeat(3, 1fr);
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }

    @media (max-width: 480px) {
      .schedule-summary-modern {
        grid-template-columns: 1fr;
        gap: 0.5rem;
      }
    }

    @media (min-width: 481px) and (max-width: 768px) {
      .schedule-summary-modern {
        grid-template-columns: repeat(2, 1fr);
      }
    }

    .summary-item-modern {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.65rem;
      background: var(--ion-card-background);
      border-radius: 10px;
      border: 1px solid var(--ion-border-color, rgba(0, 0, 0, 0.08));
      transition: all 0.3s ease;
      min-width: 0;
    }

    .summary-item-modern:hover {
      transform: translateY(-1px);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .summary-icon-wrapper {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .paid-icon {
      background: linear-gradient(135deg, #10b981, #059669);
    }

    .pending-icon {
      background: linear-gradient(135deg, #f59e0b, #d97706);
    }

    .overdue-icon {
      background: linear-gradient(135deg, #ef4444, #dc2626);
    }

    .summary-content {
      display: flex;
      flex-direction: column;
      gap: 0.1rem;
    }

    .summary-value-modern {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--ion-text-color);
      line-height: 1;
    }

    .summary-label-modern {
      font-size: 0.7rem;
      color: var(--ion-color-medium);
      font-weight: 500;
      text-transform: uppercase;
      letter-spacing: 0.3px;
    }

    /* Modern Schedule Items */
    .schedule-item-modern {
      position: relative;
      display: flex;
      gap: 0.75rem;
      padding: 1.25rem;
      background: var(--ion-card-background);
      border: 1px solid var(--ion-border-color, rgba(0, 0, 0, 0.08));
      border-radius: 14px;
      transition: all 0.3s ease;
      overflow: hidden;
      animation: fadeInUp 0.4s ease-out backwards;
    }

    .schedule-item-modern:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      transform: translateX(4px);
    }

    .schedule-status-indicator {
      position: absolute;
      left: 0;
      top: 0;
      bottom: 0;
      width: 4px;
      background: var(--ion-color-medium);
      transition: background 0.3s ease;
    }

    .schedule-item-modern.paid .schedule-status-indicator {
      background: linear-gradient(180deg, #10b981, #059669);
    }

    .schedule-item-modern.pending .schedule-status-indicator {
      background: linear-gradient(180deg, #f59e0b, #d97706);
    }

    .schedule-item-modern.overdue .schedule-status-indicator {
      background: linear-gradient(180deg, #ef4444, #dc2626);
    }

    .schedule-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .schedule-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      gap: 1rem;
    }

    .installment-info {
      flex: 1;
    }

    .installment-number {
      font-size: 0.938rem;
      font-weight: 700;
      color: var(--ion-text-color);
      margin-bottom: 0.25rem;
    }

    .installment-date {
      font-size: 0.813rem;
      color: var(--ion-color-medium);
      display: flex;
      align-items: center;
      gap: 0.375rem;
    }

    .installment-status-badge {
      padding: 0.375rem 0.75rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 600;
      flex-shrink: 0;
    }

    .badge-paid {
      background: rgba(16, 185, 129, 0.1);
      color: #059669;
    }

    .badge-pending {
      background: rgba(245, 158, 11, 0.1);
      color: #d97706;
    }

    .badge-overdue {
      background: rgba(239, 68, 68, 0.1);
      color: #dc2626;
    }

    .schedule-amount-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.75rem;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.05), rgba(118, 75, 162, 0.03));
      border-radius: 10px;
      flex-wrap: wrap;
      gap: 0.5rem;
    }

    @media (max-width: 480px) {
      .schedule-amount-row {
        flex-direction: column;
        align-items: flex-start;
        gap: 0.25rem;
      }

      .schedule-header {
        flex-direction: column;
        gap: 0.5rem;
      }

      .installment-status-badge {
        align-self: flex-start;
      }

      .amount-value {
        font-size: 1rem;
      }

      .summary-value-modern {
        font-size: 1.25rem;
      }
    }

    .amount-label {
      font-size: 0.813rem;
      color: var(--ion-color-medium);
      font-weight: 500;
    }

    .amount-value {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--ion-text-color);
    }

    .schedule-item-modern.paid .amount-value {
      color: #10b981;
    }

    .schedule-item-modern.pending .amount-value {
      color: #f59e0b;
    }

    .schedule-item-modern.overdue .amount-value {
      color: #ef4444;
    }

    /* Old schedule summary - keeping for backward compatibility */
    .schedule-summary {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 0.5rem;
      margin-bottom: 1.25rem;
      padding: 0.75rem;
      background: var(--ion-background-color);
      border-radius: 12px;
      border: 1px solid var(--ion-border-color, #e5e7eb);
    }

    .summary-item {
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.15rem;
    }

    .summary-label {
      font-size: 0.6rem;
      color: var(--ion-color-medium);
      text-transform: uppercase;
      letter-spacing: 0.3px;
      font-weight: 600;
      line-height: 1.2;
    }

    @media (min-width: 400px) {
      .summary-label {
        font-size: 0.65rem;
      }
    }

    @media (min-width: 500px) {
      .summary-label {
        font-size: 0.7rem;
      }
    }

    .summary-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--ion-text-color);
      line-height: 1.2;
    }

    @media (min-width: 400px) {
      .summary-value {
        font-size: 1.35rem;
      }
    }

    @media (min-width: 500px) {
      .summary-value {
        font-size: 1.5rem;
      }
    }

    .summary-value.paid {
      color: var(--ion-color-success);
    }

    .summary-value.pending {
      color: var(--ion-color-warning);
    }

    .summary-value.overdue {
      color: var(--ion-color-danger);
    }

    /* Schedule List */
    .schedule-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .schedule-item {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 1rem;
      background: var(--ion-item-background);
      border: 2px solid var(--ion-border-color, rgba(148, 163, 184, 0.2));
      border-radius: 12px;
      transition: all 0.2s ease;
    }

    .schedule-item.paid {
      border-color: var(--ion-color-success);
      background: rgba(34, 197, 94, 0.05);
    }

    .schedule-item.pending {
      border-color: var(--ion-border-color, rgba(148, 163, 184, 0.2));
    }

    .schedule-item.overdue {
      border-color: var(--ion-color-danger);
      background: rgba(239, 68, 68, 0.05);
    }

    .schedule-left {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .repayment-number {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--ion-text-color);
    }

    .repayment-date {
      font-size: 0.8rem;
      color: var(--ion-color-medium);
    }

    .schedule-right {
      display: flex;
      flex-direction: column;
      align-items: flex-end;
      gap: 0.25rem;
    }

    .repayment-amount {
      font-size: 1.1rem;
      font-weight: 400;
    }

    .schedule-item.paid .repayment-amount {
      color: var(--ion-color-success);
    }

    .schedule-item.pending .repayment-amount {
      color: #f59e0b;
    }

    .schedule-item.overdue .repayment-amount {
      color: var(--ion-color-danger);
    }

    .repayment-status {
      font-size: 0.8rem;
      font-weight: 400;
      letter-spacing: 0.3px;
    }

    .repayment-status.status-paid {
      color: var(--ion-color-success);
    }

    .repayment-status.status-pending {
      color: #f59e0b;
    }

    .repayment-status.status-overdue {
      color: var(--ion-color-danger);
    }

    @media (min-width: 400px) {
      .schedule-item {
        padding: 1.25rem;
      }

      .repayment-number {
        font-size: 1rem;
      }

      .repayment-date {
        font-size: 0.85rem;
      }

      .repayment-amount {
        font-size: 1.2rem;
      }

      .repayment-status {
        font-size: 0.8rem;
      }
    }

    @media (min-width: 500px) {
      .schedule-item {
        padding: 1.5rem;
      }

      .repayment-number {
        font-size: 1.05rem;
      }

      .repayment-date {
        font-size: 0.9rem;
      }

      .repayment-amount {
        font-size: 1.3rem;
      }

      .repayment-status {
        font-size: 0.85rem;
        padding: 0.3rem 0.85rem;
      }
    }

    /* Old schedule styles - keeping for backward compatibility */
    .schedule-item {
      background: var(--ion-item-background);
      border: 1px solid var(--ion-border-color, #e5e7eb);
      border-radius: 12px;
      padding: 0.75rem;
    }

    @media (min-width: 400px) {
      .schedule-item {
        padding: 0.85rem;
      }
    }

    @media (min-width: 500px) {
      .schedule-item {
        padding: 1rem;
      }
    }

    .schedule-item.paid {
      border-color: var(--ion-color-success);
      background: rgba(16, 185, 129, 0.05);
    }

    .schedule-item.overdue {
      border-color: var(--ion-color-danger);
      background: rgba(220, 38, 38, 0.05);
    }

    .schedule-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
      padding-bottom: 0.5rem;
      border-bottom: 1px solid var(--ion-border-color, #e5e7eb);
    }

    @media (min-width: 500px) {
      .schedule-header {
        margin-bottom: 1rem;
        padding-bottom: 0.75rem;
      }
    }

    .installment-info {
      display: flex;
      flex-direction: column;
      gap: 0.2rem;
    }

    .installment-number {
      font-size: 0.85rem;
      font-weight: 700;
      color: var(--ion-text-color);
      line-height: 1.2;
    }

    @media (min-width: 400px) {
      .installment-number {
        font-size: 0.9rem;
      }
    }

    @media (min-width: 500px) {
      .installment-number {
        font-size: 0.95rem;
      }
    }

    .installment-date {
      font-size: 0.7rem;
      color: var(--ion-color-medium);
      display: flex;
      align-items: center;
      gap: 0.25rem;
      line-height: 1.2;
    }

    @media (min-width: 400px) {
      .installment-date {
        font-size: 0.75rem;
      }
    }

    @media (min-width: 500px) {
      .installment-date {
        font-size: 0.8rem;
      }
    }

    .installment-date::before {
      content: '📅';
      font-size: 0.75rem;
    }

    .schedule-status {
      font-size: 0.65rem;
      padding: 0.25rem 0.6rem;
      font-weight: 600;
    }

    @media (min-width: 400px) {
      .schedule-status {
        font-size: 0.7rem;
        padding: 0.3rem 0.7rem;
      }
    }

    .schedule-body {
      display: flex;
      flex-direction: column;
    }

    .schedule-amounts-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.4rem;
      margin-bottom: 0.4rem;
    }

    @media (min-width: 500px) {
      .schedule-amounts-grid {
        gap: 0.5rem;
        margin-bottom: 0.5rem;
      }
    }

    .schedule-total-row {
      display: flex;
      gap: 0.4rem;
    }

    @media (min-width: 500px) {
      .schedule-total-row {
        gap: 0.5rem;
      }
    }

    .schedule-total-row .schedule-amount-box {
      flex: 1;
    }

    .schedule-amount-box {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
      padding: 0.5rem;
      background: var(--ion-background-color);
      border-radius: 8px;
      border: 1px solid var(--ion-border-color, #e5e7eb);
    }

    @media (min-width: 400px) {
      .schedule-amount-box {
        padding: 0.55rem;
      }
    }

    @media (min-width: 500px) {
      .schedule-amount-box {
        gap: 0.2rem;
        padding: 0.6rem;
      }
    }

    .schedule-amount-box.total-box {
      background: rgba(59, 130, 246, 0.05);
      border-color: rgba(59, 130, 246, 0.2);
    }

    .schedule-amount-box.outstanding-box {
      background: rgba(251, 146, 60, 0.05);
      border-color: rgba(251, 146, 60, 0.2);
    }

    .schedule-amount-box.paid-box {
      background: rgba(16, 185, 129, 0.05);
      border-color: rgba(16, 185, 129, 0.2);
    }

    .schedule-label {
      font-size: 0.55rem;
      color: var(--ion-color-medium);
      text-transform: uppercase;
      letter-spacing: 0.3px;
      font-weight: 600;
      line-height: 1.1;
    }

    @media (min-width: 400px) {
      .schedule-label {
        font-size: 0.6rem;
      }
    }

    @media (min-width: 500px) {
      .schedule-label {
        font-size: 0.65rem;
        letter-spacing: 0.4px;
      }
    }

    .schedule-value {
      font-size: 0.8rem;
      color: var(--ion-text-color);
      font-weight: 600;
      line-height: 1.1;
    }

    @media (min-width: 400px) {
      .schedule-value {
        font-size: 0.85rem;
      }
    }

    @media (min-width: 500px) {
      .schedule-value {
        font-size: 0.9rem;
      }
    }

    .schedule-value.total {
      color: #3b82f6;
      font-size: 0.85rem;
    }

    @media (min-width: 400px) {
      .schedule-value.total {
        font-size: 0.9rem;
      }
    }

    @media (min-width: 500px) {
      .schedule-value.total {
        font-size: 0.95rem;
      }
    }

    .schedule-value.outstanding {
      color: var(--ion-color-danger);
      font-size: 0.85rem;
    }

    @media (min-width: 400px) {
      .schedule-value.outstanding {
        font-size: 0.9rem;
      }
    }

    @media (min-width: 500px) {
      .schedule-value.outstanding {
        font-size: 0.95rem;
      }
    }

    .schedule-value.paid-text {
      color: var(--ion-color-success);
      display: flex;
      align-items: center;
      gap: 0.35rem;
      font-size: 0.85rem;
    }

    @media (min-width: 400px) {
      .schedule-value.paid-text {
        font-size: 0.9rem;
      }
    }

    @media (min-width: 500px) {
      .schedule-value.paid-text {
        gap: 0.4rem;
        font-size: 0.95rem;
      }
    }

    /* Payments List */
    .payments-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .payment-item {
      background: var(--ion-card-background);
      border: 1px solid var(--ion-border-color, rgba(0, 0, 0, 0.08));
      border-radius: 12px;
      padding: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.75rem;
      transition: all 0.3s ease;
      animation: fadeInUp 0.5s ease-out backwards;
    }

    .payment-item:hover {
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      transform: translateY(-1px);
    }

    .payment-icon-wrapper {
      width: 36px;
      height: 36px;
      border-radius: 10px;
      background: linear-gradient(135deg, #10b981, #059669);
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .payment-content {
      flex: 1;
      min-width: 0;
    }

    .payment-main-row {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
    }

    .payment-date-amount {
      flex: 1;
      min-width: 0;
    }

    .payment-date {
      font-size: 0.75rem;
      color: var(--ion-color-medium);
      margin-bottom: 0.15rem;
    }

    .payment-amount {
      font-size: 1rem;
      font-weight: 700;
      color: var(--ion-text-color);
    }

    .payment-method-badge {
      padding: 0.3rem 0.65rem;
      border-radius: 10px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: capitalize;
      flex-shrink: 0;
    }

    .payment-method-badge.cash {
      background: rgba(16, 185, 129, 0.1);
      color: #059669;
    }

    .payment-method-badge.card,
    .payment-method-badge.credit-card,
    .payment-method-badge.debit-card {
      background: rgba(102, 126, 234, 0.1);
      color: #667eea;
    }

    .payment-method-badge.bank,
    .payment-method-badge.bank-transfer {
      background: rgba(245, 158, 11, 0.1);
      color: #d97706;
    }

    .payment-method-badge.gcash,
    .payment-method-badge.e-wallet {
      background: rgba(59, 130, 246, 0.1);
      color: #3b82f6;
    }

    /* Old payment styles - keeping for backward compatibility */
    .payment-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }

    .payment-body {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .payment-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      font-size: 0.875rem;
    }

    .payment-label {
      color: var(--ion-color-medium);
    }

    .payment-value {
      color: var(--ion-text-color);
      font-weight: 500;
    }

    .footer-space {
      height: 2rem;
    }

    .skeleton-header {
      width: 60%;
      height: 24px;
      border-radius: 4px;
      margin-bottom: 1rem;
    }

    .skeleton-amount {
      width: 40%;
      height: 32px;
      border-radius: 4px;
    }
  `]
})
export class LoanDetailsPage implements OnInit {
  loanId = signal<number | null>(null);
  loading = signal(false);
  loanDetails = signal<LoanDetails | null>(null);
  scheduleExpanded = signal(false);
  paymentsExpanded = signal(false);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    public authService: AuthService,
    public themeService: ThemeService,
    private toastController: ToastController
  ) {
  }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loanId.set(parseInt(id));
      this.loadLoanDetails();
    }
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  async loadLoanDetails() {
    if (!this.loanId()) return;
    
    this.loading.set(true);
    try {
      const user = this.authService.currentUser();
      
      if (!user) {
        throw new Error('User not found');
      }

      console.log('📡 Loading loan details - Loan ID:', this.loanId());
      const response = await this.apiService.getLoanDetails(this.loanId()!).toPromise();
      const loanData = response?.data || response;
      
      console.log('✅ Loan details response:', loanData);
      console.log('📊 Schedule data:', loanData?.schedule);
      console.log('💰 Payment data:', loanData?.payments);
      
      if (loanData && loanData.loan) {
        // Log raw schedule data before mapping
        console.log('🔍 Raw schedule items from backend:', loanData.schedule?.slice(0, 3));
        
        // Flatten the response structure for template compatibility
        const flattenedData = {
          ...loanData.loan,
          schedule: (loanData.schedule || []).map((item: any) => {
            const mappedItem = {
              id: item.id,
              installmentNumber: item.installment_number || item.installmentNumber,
              dueDate: item.due_date || item.dueDate,
              principalAmount: item.principal_amount || item.principalAmount || 0,
              interestAmount: item.interest_amount || item.interestAmount || 0,
              totalAmount: item.total_amount || item.totalAmount || 0,
              outstandingAmount: item.outstanding_amount || item.outstandingAmount || 0,
              status: item.status
            };
            
            // Log first 3 mapped items
            if (item.installment_number <= 3 || item.installmentNumber <= 3) {
              console.log(`🔍 Mapped installment #${mappedItem.installmentNumber}:`, {
                status: mappedItem.status,
                outstanding: mappedItem.outstandingAmount,
                total: mappedItem.totalAmount
              });
            }
            
            return mappedItem;
          }),
          payments: loanData.payments || [],
          // Calculate totalPaid from payments
          totalPaid: loanData.payments?.reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0) || 0
        };
        
        // Calculate payment progress correctly
        const principalAmount = parseFloat(flattenedData.principalAmount || flattenedData.principal_amount || 0);
        const outstandingBalance = parseFloat(flattenedData.outstandingBalance || flattenedData.outstanding_balance || 0);
        
        let paymentProgress = 0;
        if (principalAmount > 0) {
          if (outstandingBalance <= 0) {
            paymentProgress = 100; // Fully paid
          } else {
            const amountPaid = principalAmount - outstandingBalance;
            paymentProgress = Math.round((amountPaid / principalAmount) * 100);
          }
        }
        
        flattenedData.paymentProgress = paymentProgress;
        
        console.log('📈 Total Paid:', flattenedData.totalPaid);
        console.log('📉 Outstanding:', flattenedData.outstandingBalance);
        console.log('📊 Payment Progress:', paymentProgress + '%');
        console.log('📅 Mapped schedule:', flattenedData.schedule);
        
        this.loanDetails.set(flattenedData);
      }
    } catch (error) {
      console.error('Failed to load loan details:', error);
      
      const toast = await this.toastController.create({
        message: 'Failed to load loan details. Please try again.',
        duration: 3000,
        position: 'bottom',
        color: 'danger',
        icon: 'alert-circle-outline'
      });
      await toast.present();
    } finally {
      this.loading.set(false);
    }
  }

  formatCurrency(amount: number | undefined): string {
    if (amount === undefined || amount === null) return '0';
    return amount.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  formatDate(date: string | null): string {
    if (!date) return 'N/A';
    const d = new Date(date);
    return d.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  getStatusColor(status: string): string {
    const s = status?.toLowerCase() || '';
    if (s === 'paid' || s === 'completed' || s === 'active' || s === 'approved') return 'success';
    if (s === 'pending' || s === 'partially_paid') return 'warning';
    if (s === 'overdue' || s === 'late') return 'danger';
    return 'medium';
  }

  getScheduleStatusLabel(status: string): string {
    const labels: Record<string, string> = {
      'paid': 'Paid',
      'partially_paid': 'Partial',
      'overdue': 'Overdue',
      'pending': 'Pending',
      'upcoming': 'Upcoming'
    };
    return labels[status] || status;
  }

  getPaymentFrequency(): string {
    const schedule = this.loanDetails()?.schedule;
    if (!schedule || schedule.length < 2) return '';
    
    // Calculate days between first two payments
    const firstDate = new Date(schedule[0].dueDate);
    const secondDate = new Date(schedule[1].dueDate);
    const daysDiff = Math.round((secondDate.getTime() - firstDate.getTime()) / (1000 * 60 * 60 * 24));
    
    if (daysDiff <= 1) return 'Daily';
    if (daysDiff <= 7) return 'Weekly';
    if (daysDiff <= 14) return 'Bi-weekly';
    if (daysDiff <= 31) return 'Monthly';
    return `Every ${daysDiff} days`;
  }

  getFullyPaidCount(): number {
    const schedule = this.loanDetails()?.schedule || [];
    return schedule.filter(s => 
      s.status === 'paid' || s.status === 'completed' || s.status === 'paid_off'
    ).length;
  }

  getPartiallyPaidCount(): number {
    const schedule = this.loanDetails()?.schedule || [];
    return schedule.filter(s => s.status === 'partially_paid').length;
  }

  getPaidCount(): number {
    const schedule = this.loanDetails()?.schedule || [];
    
    // Log all statuses for debugging
    console.log('🔍 Schedule item statuses:', schedule.map(s => ({ 
      installment: s.installmentNumber, 
      status: s.status,
      outstanding: s.outstandingAmount 
    })));
    
    // Count only FULLY paid installments
    const fullyPaidCount = schedule.filter(s => 
      s.status === 'paid' || s.status === 'completed' || s.status === 'paid_off'
    ).length;
    
    // Count partially paid installments
    const partiallyPaidCount = schedule.filter(s => 
      s.status === 'partially_paid'
    ).length;

    console.log(`✅ Fully paid: ${fullyPaidCount}, Partially paid: ${partiallyPaidCount}, Total: ${schedule.length}`);
    
    // Return fully paid + partially paid for consistency with collector view
    return fullyPaidCount + partiallyPaidCount;
  }

  getPendingCount(): number {
    const schedule = this.loanDetails()?.schedule || [];
    // Pending means not yet paid or partially paid - just pure pending/upcoming
    return schedule.filter(s => s.status === 'pending' || s.status === 'upcoming').length;
  }

  getOverdueCount(): number {
    return this.loanDetails()?.schedule.filter(s => s.status === 'overdue').length || 0;
  }

  getPaymentMethodClass(method: string): string {
    if (!method) return '';
    const m = method.toLowerCase();
    if (m.includes('cash')) return 'cash';
    if (m.includes('card') || m.includes('credit') || m.includes('debit')) return 'card';
    if (m.includes('bank') || m.includes('transfer')) return 'bank';
    if (m.includes('gcash') || m.includes('wallet')) return 'gcash';
    return '';
  }

  async makePayment() {
    await this.router.navigate(['/customer/payments']);
  }

  logLoanDetailsToConsole() {
    console.log('========================================');
    console.log('📋 LOAN DETAILS - FULL DATA');
    console.log('========================================');
    console.log('Raw Loan Details Object:', this.loanDetails());
    console.log('----------------------------------------');
    console.log('JSON Format:', JSON.stringify(this.loanDetails(), null, 2));
    console.log('========================================');
    
    if (this.loanDetails()) {
      const details = this.loanDetails()!;
      console.log('📊 Key Metrics:');
      console.log('  - Loan Number:', details.loanNumber);
      console.log('  - Status:', details.status);
      console.log('  - Principal Amount:', details.principalAmount);
      console.log('  - Outstanding Balance:', details.outstandingBalance);
      console.log('  - Total Paid:', details.totalPaid);
      console.log('  - Payment Progress:', details.paymentProgress + '%');
      console.log('  - Interest Rate:', details.interestRate);
      console.log('  - Term:', details.term);
      console.log('----------------------------------------');
      console.log('📅 Schedule Items:', details.schedule?.length || 0);
      console.log('💰 Payment Records:', details.payments?.length || 0);
      console.log('========================================');
    } else {
      console.log('⚠️ No loan details available');
    }
  }
}
