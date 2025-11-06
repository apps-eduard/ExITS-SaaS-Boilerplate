import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
  IonIcon,
  IonBadge,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  ToastController
} from '@ionic/angular/standalone';
import { Router } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  documentTextOutline,
  calendarOutline,
  cashOutline,
  checkmarkCircleOutline,
  timeOutline,
  alertCircleOutline,
  eyeOutline,
  chevronDownOutline,
  chevronUpOutline,
  walletOutline,
  trendingUpOutline,
  ribbonOutline
} from 'ionicons/icons';

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
    IonContent,
    IonIcon,
    IonBadge,
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
              <ion-icon name="wallet-outline" class="stat-icon"></ion-icon>
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
              <ion-icon name="trending-up-outline" class="stat-icon"></ion-icon>
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
            [class.active]="filter() === 'all'"
            (click)="setFilter('all')"
          >
            All ({{ loans().length }})
          </button>
          <button 
            class="filter-tab"
            [class.active]="filter() === 'active'"
            (click)="setFilter('active')"
          >
            Active ({{ filterCount('active') }})
          </button>
          <button 
            class="filter-tab"
            [class.active]="filter() === 'completed'"
            (click)="setFilter('completed')"
          >
            Completed ({{ filterCount('completed') }})
          </button>
          <button 
            class="filter-tab"
            [class.active]="filter() === 'overdue'"
            (click)="setFilter('overdue')"
          >
            Overdue ({{ filterCount('overdue') }})
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
        } @else if (filteredLoans().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">
              <ion-icon name="ribbon-outline"></ion-icon>
            </div>
            <div class="empty-title">No loans found</div>
            <div class="empty-subtitle">
              @if (filter() === 'all') {
                You don't have any loans yet
              } @else {
                No {{ filter() }} loans at the moment
              }
            </div>
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
                      <ion-icon name="ribbon-outline"></ion-icon>
                    </div>
                    <div>
                      <div class="loan-number">{{ loan.loanNumber }}</div>
                      <div class="loan-date">Applied: {{ loan.dueDate }}</div>
                    </div>
                  </div>
                  <ion-icon 
                    [name]="expandedLoanId() === loan.id ? 'chevron-up-outline' : 'chevron-down-outline'"
                    class="expand-icon"
                  ></ion-icon>
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
                          <ion-icon name="calendar-outline"></ion-icon>
                        </div>
                        <div class="detail-content">
                          <div class="detail-label">Due Date</div>
                          <div class="detail-value">{{ loan.dueDate }}</div>
                        </div>
                      </div>

                      <div class="detail-row">
                        <div class="detail-icon-wrapper">
                          <ion-icon name="cash-outline"></ion-icon>
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
                      <ion-icon name="chevron-down-outline" style="transform: rotate(-90deg);"></ion-icon>
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

    .stat-icon {
      font-size: 1.5rem;
      color: white;
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
      margin-bottom: 1rem;
      overflow-x: auto;
      padding-bottom: 0.25rem;
      scrollbar-width: none;
      animation: fadeInUp 0.5s ease-out 0.1s backwards;
    }

    .filter-tabs::-webkit-scrollbar {
      display: none;
    }

    .filter-tab {
      flex-shrink: 0;
      padding: 0.5rem 1rem;
      border-radius: 20px;
      border: 1.5px solid var(--ion-border-color, rgba(0, 0, 0, 0.1));
      background: var(--ion-card-background);
      color: var(--ion-color-medium);
      font-size: 0.813rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .filter-tab.active {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border-color: transparent;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .filter-tab:not(.active):hover {
      border-color: #667eea;
      color: #667eea;
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
      text-align: center;
      padding: 3rem 1.5rem;
      animation: fadeInUp 0.5s ease-out;
    }

    .empty-icon {
      width: 80px;
      height: 80px;
      margin: 0 auto 1.5rem;
      border-radius: 50%;
      background: linear-gradient(135deg, rgba(102, 126, 234, 0.1), rgba(118, 75, 162, 0.1));
      display: flex;
      align-items: center;
      justify-content: center;
      animation: float 3s ease-in-out infinite;
    }

    .empty-icon ion-icon {
      font-size: 2.5rem;
      color: #667eea;
    }

    .empty-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--ion-text-color);
      margin-bottom: 0.5rem;
    }

    .empty-subtitle {
      font-size: 0.875rem;
      color: var(--ion-color-medium);
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

    .loan-icon-wrapper ion-icon {
      font-size: 1.25rem;
      color: white;
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

    .expand-icon {
      font-size: 1.25rem;
      color: var(--ion-color-medium);
      transition: transform 0.3s ease;
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

    .detail-icon-wrapper ion-icon {
      font-size: 1.125rem;
      color: white;
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

    .view-details-btn ion-icon {
      font-size: 1.125rem;
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
  filter = signal<string>('all');
  expandedLoanId = signal<number | null>(null);

  constructor(
    private apiService: ApiService,
    public authService: AuthService,
    private router: Router,
    public themeService: ThemeService,
    private toastController: ToastController
  ) {
    addIcons({
      documentTextOutline,
      calendarOutline,
      cashOutline,
      checkmarkCircleOutline,
      timeOutline,
      alertCircleOutline,
      eyeOutline,
      chevronDownOutline,
      chevronUpOutline,
      walletOutline,
      trendingUpOutline,
      ribbonOutline
    });
  }

  ngOnInit() {
    this.loadLoans();
  }

  async loadLoans() {
    this.loading.set(true);
    try {
      const response = await this.apiService.getCustomerLoans().toPromise();
      const loansData = response?.data || response;
      
      if (loansData && Array.isArray(loansData)) {
        const mappedLoans = loansData.map((loan: any) => {
          const amount = parseFloat(loan.principalAmount || loan.principal_amount || loan.amount || 0);
          const balance = parseFloat(loan.outstandingBalance || loan.outstanding_balance || loan.balance || loan.remainingBalance || loan.remaining_balance || 0);
          const totalPaid = parseFloat(loan.amountPaid || loan.amount_paid || 0);
          const progress = amount > 0 ? Math.round((totalPaid / amount) * 100) : 0;

          let actualStatus = this.mapLoanStatus(loan.status);
          if (balance <= 0 && amount > 0) {
            actualStatus = 'completed';
          }

          return {
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
        });

        this.loans.set(mappedLoans);
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

  async handleRefresh(event: any) {
    await this.loadLoans();
    event.target.complete();
  }

  mapLoanStatus(status: string): string {
    if (!status) return 'active';
    status = status.toLowerCase();
    if (status === 'paid' || status === 'paid_off' || status === 'completed' || status === 'closed' || status === 'fully_paid') {
      return 'completed';
    }
    if (status === 'overdue' || status === 'late' || status === 'delinquent') {
      return 'overdue';
    }
    if (status === 'pending' || status === 'processing' || status === 'approved') {
      return 'pending';
    }
    return 'active';
  }

  filteredLoans() {
    if (this.filter() === 'all') {
      return this.loans();
    }
    return this.loans().filter(loan => loan.status === this.filter());
  }

  filterCount(status: string): number {
    return this.loans().filter(loan => loan.status === status).length;
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
}
