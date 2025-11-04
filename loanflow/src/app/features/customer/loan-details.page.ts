import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonContent,
  IonBackButton,
  IonButton,
  IonIcon,
  IonBadge,
  IonSkeletonText,
  IonProgressBar,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  calendarOutline,
  cashOutline,
  cardOutline,
  documentTextOutline,
  checkmarkCircleOutline,
  timeOutline,
  alertCircleOutline,
  walletOutline,
  trendingUpOutline,
  moonOutline,
  sunnyOutline
} from 'ionicons/icons';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { DevInfoComponent } from '../../shared/components/dev-info.component';

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
  IonHeader,
  IonToolbar,
  IonContent,
  IonBackButton,
    IonButton,
    IonIcon,
    IonBadge,
    IonSkeletonText,
    IonProgressBar,
    DevInfoComponent
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar class="custom-toolbar">
        <div class="toolbar-content">
          <div class="toolbar-left">
            <ion-back-button defaultHref="/customer/dashboard" class="icon-btn"></ion-back-button>
          </div>
          
          <div class="toolbar-center">
            <span class="title-text">Loan Details</span>
          </div>
          
          <div class="toolbar-right">
            <!-- Dev Info (Development Only) -->
            <app-dev-info />
            
            <ion-button (click)="toggleTheme()" class="icon-btn" fill="clear">
              <ion-icon 
                [name]="themeService.isDark() ? 'sunny-outline' : 'moon-outline'" 
                slot="icon-only"
                class="theme-icon"
              ></ion-icon>
            </ion-button>
          </div>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content class="main-content">
      @if (loading()) {
        <div class="loading-container">
          <div class="stat-card">
            <ion-skeleton-text animated class="skeleton-header"></ion-skeleton-text>
            <ion-skeleton-text animated class="skeleton-amount"></ion-skeleton-text>
          </div>
        </div>
      } @else if (loanDetails()) {
        <div class="details-container">
          
          <!-- Loan Header Card -->
          <div class="loan-header-card">
            <div class="loan-number-row">
              <h1 class="loan-number">{{ loanDetails()!.loanNumber }}</h1>
              <ion-badge 
                [color]="getStatusColor(loanDetails()!.status)"
                class="status-badge"
              >
                {{ loanDetails()!.status }}
              </ion-badge>
            </div>
            <p class="product-name">{{ loanDetails()!.productName }}</p>
          </div>

          <!-- Amount Stats Grid -->
          <div class="stats-grid">
            <div class="stat-card stat-primary">
              <div class="stat-icon-wrapper">
                <ion-icon name="cash-outline"></ion-icon>
              </div>
              <p class="stat-value">₱{{ formatCurrency(loanDetails()!.principalAmount) }}</p>
              <p class="stat-label">Principal Amount</p>
            </div>

            <div class="stat-card stat-warning">
              <div class="stat-icon-wrapper">
                <ion-icon name="wallet-outline"></ion-icon>
              </div>
              <p class="stat-value">₱{{ formatCurrency(loanDetails()!.outstandingBalance) }}</p>
              <p class="stat-label">Outstanding Balance</p>
            </div>

            <div class="stat-card stat-success">
              <div class="stat-icon-wrapper">
                <ion-icon name="checkmark-circle-outline"></ion-icon>
              </div>
              <p class="stat-value">₱{{ formatCurrency(loanDetails()!.totalPaid) }}</p>
              <p class="stat-label">Total Paid</p>
            </div>

            <div class="stat-card stat-purple">
              <div class="stat-icon-wrapper">
                <ion-icon name="trending-up-outline"></ion-icon>
              </div>
              <p class="stat-value">{{ loanDetails()!.paymentProgress }}%</p>
              <p class="stat-label">Progress</p>
            </div>
          </div>

          <!-- Progress Bar -->
          <div class="progress-card">
            <p class="progress-label">Payment Progress</p>
            <ion-progress-bar 
              [value]="loanDetails()!.paymentProgress / 100"
              color="success"
              class="progress-bar"
            ></ion-progress-bar>
            <p class="progress-text">{{ loanDetails()!.paymentProgress }}% Complete</p>
          </div>

          <!-- Loan Terms -->
          <div class="section-card compact-terms">
            <h2 class="section-title">
              <ion-icon name="document-text-outline"></ion-icon>
              Loan Terms
            </h2>
            <div class="terms-list">
              <div class="term-list-item">
                <ion-icon name="trending-up-outline" class="term-list-icon"></ion-icon>
                <div class="term-list-content">
                  <p class="term-list-label">Interest Rate</p>
                  <p class="term-list-value highlight">{{ loanDetails()!.interestRate }}% (Flat)</p>
                </div>
              </div>
              <div class="term-list-item">
                <ion-icon name="calendar-outline" class="term-list-icon"></ion-icon>
                <div class="term-list-content">
                  <p class="term-list-label">Loan Term</p>
                  <p class="term-list-value">{{ loanDetails()!.term }} months</p>
                </div>
              </div>
              <div class="term-list-item">
                <ion-icon name="time-outline" class="term-list-icon"></ion-icon>
                <div class="term-list-content">
                  <p class="term-list-label">Payment Frequency</p>
                  <p class="term-list-value">{{ getPaymentFrequency() || 'Weekly' }}</p>
                </div>
              </div>
              <div class="term-list-item">
                <ion-icon name="card-outline" class="term-list-icon"></ion-icon>
                <div class="term-list-content">
                  <p class="term-list-label">Processing Fee</p>
                  <p class="term-list-value">{{ loanDetails()!.processingFee || '5.00' }}%</p>
                </div>
              </div>
              <div class="term-list-item">
                <ion-icon name="wallet-outline" class="term-list-icon"></ion-icon>
                <div class="term-list-content">
                  <p class="term-list-label">Platform Fee</p>
                  <div style="text-align: right;">
                    <p class="term-list-value">₱50/mo</p>
                    <p class="term-list-value muted">Only while loan is active</p>
                  </div>
                </div>
              </div>
              <div class="term-list-item">
                <ion-icon name="alert-circle-outline" class="term-list-icon"></ion-icon>
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
          @if (loanDetails()!.nextPaymentDate && loanDetails()!.nextPaymentAmount > 0) {
            <div class="payment-due-card">
              <div class="payment-due-header">
                <ion-icon name="time-outline" class="payment-due-icon"></ion-icon>
                <h3 class="payment-due-title">Next Payment Due</h3>
              </div>
              <div class="payment-due-body">
                <p class="payment-due-amount">₱{{ formatCurrency(loanDetails()!.nextPaymentAmount) }}</p>
                <p class="payment-due-date">
                  <ion-icon name="calendar-outline"></ion-icon>
                  {{ formatDate(loanDetails()!.nextPaymentDate) }}
                </p>
              </div>
              <ion-button 
                expand="block"
                class="pay-now-btn"
                (click)="makePayment()"
              >
                <ion-icon name="card-outline" slot="start"></ion-icon>
                Make Payment
              </ion-button>
            </div>
          }

          <!-- Repayment Schedule -->
          @if (loanDetails()!.schedule && loanDetails()!.schedule.length > 0) {
            <div class="section-card">
              <h2 class="section-title">
                <ion-icon name="calendar-outline"></ion-icon>
                Repayment Schedule
              </h2>
              
              <!-- Schedule Summary -->
              <div class="schedule-summary">
                <div class="summary-item">
                  <span class="summary-label">Total</span>
                  <span class="summary-value">{{ loanDetails()!.schedule.length }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Paid</span>
                  <span class="summary-value paid">{{ getPaidCount() }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Pending</span>
                  <span class="summary-value pending">{{ getPendingCount() }}</span>
                </div>
                <div class="summary-item">
                  <span class="summary-label">Overdue</span>
                  <span class="summary-value overdue">{{ getOverdueCount() }}</span>
                </div>
              </div>

              <div class="schedule-list">
                @for (item of loanDetails()!.schedule; track item.id) {
                  <div class="schedule-item" [class.paid]="item.status === 'paid'" [class.pending]="item.status === 'pending'" [class.overdue]="item.status === 'overdue'">
                    <div class="schedule-left">
                      <div class="repayment-number">Repayment #{{ item.installmentNumber }}</div>
                      <div class="repayment-date">{{ formatDate(item.dueDate) }}</div>
                    </div>
                    <div class="schedule-right">
                      <div class="repayment-amount">₱{{ formatCurrency(item.totalAmount) }}</div>
                      <div class="repayment-status" [class.status-paid]="item.status === 'paid'" [class.status-pending]="item.status === 'pending'" [class.status-overdue]="item.status === 'overdue'">
                        {{ getScheduleStatusLabel(item.status) }}
                      </div>
                    </div>
                  </div>
                }
              </div>
            </div>
          }

          <!-- Payment History -->
          @if (loanDetails()!.payments && loanDetails()!.payments.length > 0) {
            <div class="section-card">
              <h2 class="section-title">
                <ion-icon name="card-outline"></ion-icon>
                Payment History
              </h2>
              <div class="payments-list">
                @for (payment of loanDetails()!.payments; track payment.id) {
                  <div class="payment-item">
                    <div class="payment-header">
                      <ion-icon name="checkmark-circle-outline" color="success"></ion-icon>
                      <span class="payment-date">{{ formatDate(payment.paymentDate) }}</span>
                    </div>
                    <div class="payment-body">
                      <div class="payment-row">
                        <span class="payment-label">Amount Paid:</span>
                        <span class="payment-amount">₱{{ formatCurrency(payment.amount) }}</span>
                      </div>
                      <div class="payment-row">
                        <span class="payment-label">Principal:</span>
                        <span class="payment-value">₱{{ formatCurrency(payment.principalPaid) }}</span>
                      </div>
                      <div class="payment-row">
                        <span class="payment-label">Interest:</span>
                        <span class="payment-value">₱{{ formatCurrency(payment.interestPaid) }}</span>
                      </div>
                      @if (payment.referenceNumber) {
                        <div class="payment-row">
                          <span class="payment-label">Reference:</span>
                          <span class="payment-value">{{ payment.referenceNumber }}</span>
                        </div>
                      }
                      <div class="payment-row">
                        <span class="payment-label">Method:</span>
                        <span class="payment-value">{{ payment.paymentMethod || 'N/A' }}</span>
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
          <ion-icon name="alert-circle-outline" class="error-icon"></ion-icon>
          <h2>Loan Not Found</h2>
          <p>Unable to load loan details. Please try again.</p>
          <ion-button (click)="loadLoanDetails()">Retry</ion-button>
        </div>
      }
    </ion-content>
  `,
  styles: [`
    .custom-toolbar {
      --background: linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-secondary));
      --color: white;
      --min-height: 60px;
      --padding-top: 0;
      --padding-bottom: 0;
      --padding-start: 0;
      --padding-end: 0;
    }

    .toolbar-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 12px;
      width: 100%;
      height: 60px;
      color: white;
    }

    .toolbar-left,
    .toolbar-right {
      display: flex;
      align-items: center;
      gap: 6px;
      flex: 1;
      min-width: 0;
    }

    .toolbar-left {
      justify-content: flex-start;
    }

    .toolbar-right {
      justify-content: flex-end;
    }

    .toolbar-center {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 8px;
      flex: 0 0 auto;
    }

    .info-text {
      font-size: 13px;
      font-weight: 600;
      opacity: 0.95;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .title-text {
      font-size: 18px;
      font-weight: 700;
      white-space: nowrap;
    }

    .icon-btn {
      --color: white;
      --padding-start: 8px;
      --padding-end: 8px;
      margin: 0;
      height: 40px;
      width: 40px;
    }

    .icon-btn ion-icon {
      font-size: 22px;
    }

    .main-content {
      --background: var(--ion-background-color);
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

    .stat-icon-wrapper ion-icon {
      font-size: 1.5rem;
      color: white;
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
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--ion-text-color);
      margin: 0 0 1rem 0;
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .section-title ion-icon {
      font-size: 1.25rem;
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
      font-size: 1.15rem;
      color: var(--ion-color-medium);
      flex-shrink: 0;
      opacity: 0.7;
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

    .schedule-value.paid-text ion-icon {
      font-size: 1.1rem;
    }

    @media (min-width: 500px) {
      .schedule-value.paid-text ion-icon {
        font-size: 1.2rem;
      }
    }

    /* Payments List */
    .payments-list {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .payment-item {
      background: var(--ion-item-background);
      border: 1px solid var(--ion-border-color, #e5e7eb);
      border-radius: 12px;
      padding: 1rem;
    }

    .payment-header {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-bottom: 0.75rem;
    }

    .payment-header ion-icon {
      font-size: 1.25rem;
    }

    .payment-date {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--ion-text-color);
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

    .payment-amount {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--ion-color-success);
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

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    public authService: AuthService,
    public themeService: ThemeService,
    private toastController: ToastController
  ) {
    addIcons({
      calendarOutline,
      cashOutline,
      cardOutline,
      documentTextOutline,
      checkmarkCircleOutline,
      timeOutline,
      alertCircleOutline,
      walletOutline,
      trendingUpOutline,
      moonOutline,
      sunnyOutline
    });
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
        // Flatten the response structure for template compatibility
        const flattenedData = {
          ...loanData.loan,
          schedule: (loanData.schedule || []).map((item: any) => ({
            id: item.id,
            installmentNumber: item.installment_number || item.installmentNumber,
            dueDate: item.due_date || item.dueDate,
            principalAmount: item.principal_amount || item.principalAmount || 0,
            interestAmount: item.interest_amount || item.interestAmount || 0,
            totalAmount: item.total_amount || item.totalAmount || 0,
            outstandingAmount: item.outstanding_amount || item.outstandingAmount || 0,
            status: item.status
          })),
          payments: loanData.payments || [],
          paymentProgress: loanData.paymentProgress || 0,
          // Calculate totalPaid from payments
          totalPaid: loanData.payments?.reduce((sum: number, p: any) => sum + parseFloat(p.amount || 0), 0) || 0
        };
        
        console.log('📈 Total Paid:', flattenedData.totalPaid);
        console.log('📉 Outstanding:', flattenedData.outstandingBalance);
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

  getPaidCount(): number {
    return this.loanDetails()?.schedule.filter(s => s.status === 'paid').length || 0;
  }

  getPendingCount(): number {
    return this.loanDetails()?.schedule.filter(s => s.status === 'pending' || s.status === 'upcoming').length || 0;
  }

  getOverdueCount(): number {
    return this.loanDetails()?.schedule.filter(s => s.status === 'overdue').length || 0;
  }

  async makePayment() {
    await this.router.navigate(['/customer/payments']);
  }
}
