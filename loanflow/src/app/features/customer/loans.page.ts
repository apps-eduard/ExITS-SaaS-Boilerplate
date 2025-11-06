import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonButton,
  IonIcon,
  IonBadge,
  IonRefresher,
  IonRefresherContent,
  IonSkeletonText,
  IonChip,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  documentTextOutline,
  calendarOutline,
  cashOutline,
  checkmarkCircleOutline,
  timeOutline,
  alertCircleOutline,
  eyeOutline,
  moonOutline,
  sunnyOutline,
  businessOutline
} from 'ionicons/icons';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { HeaderUtilsComponent } from '../../shared/components/header-utils.component';

interface Loan {
  id: number;
  loanNumber: string;
  amount: number;
  balance: number;
  interestRate: number;
  term: number;
  monthlyPayment: number;
  status: 'active' | 'completed' | 'overdue' | 'pending';
  startDate: string;
  dueDate: string;
  totalPaid: number;
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
    IonChip,
    HeaderUtilsComponent
  ],
  template: `
    <ion-content [fullscreen]="true" class="main-content">
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Fixed Top Bar -->
      <div class="fixed-top-bar">
        <div class="top-bar-content">
          <div class="top-bar-left">
            <span class="app-emoji">📄</span>
            <span class="app-title">My Loans</span>
          </div>
          
          <div class="top-bar-right">
            <app-header-utils />
          </div>
        </div>
      </div>

      <div class="loans-container">
        <!-- Summary Cards -->
        <div class="summary-grid">
          <div class="summary-card">
            <div class="summary-icon-wrapper summary-primary">
              <ion-icon name="document-text-outline" class="summary-icon"></ion-icon>
            </div>
            <div class="summary-content">
              <p class="summary-label">Total Loans</p>
              @if (loading()) {
                <ion-skeleton-text animated class="summary-skeleton"></ion-skeleton-text>
              } @else {
                <h3 class="summary-value">{{ loans().length }}</h3>
              }
            </div>
          </div>

          <div class="summary-card">
            <div class="summary-icon-wrapper summary-warning">
              <ion-icon name="cash-outline" class="summary-icon"></ion-icon>
            </div>
            <div class="summary-content">
              <p class="summary-label">Total Balance</p>
              @if (loading()) {
                <ion-skeleton-text animated class="summary-skeleton"></ion-skeleton-text>
              } @else {
                <h3 class="summary-value">₱{{ formatCurrency(totalBalance()) }}</h3>
              }
            </div>
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
            All ({{ loans().length }})
          </ion-chip>
          <ion-chip 
            class="filter-chip filter-chip-success"
            [class.chip-active]="filter() === 'active'"
            [class.chip-inactive]="filter() !== 'active'"
            (click)="setFilter('active')"
          >
            Active ({{ filterCount('active') }})
          </ion-chip>
          <ion-chip 
            class="filter-chip filter-chip-primary"
            [class.chip-active]="filter() === 'completed'"
            [class.chip-inactive]="filter() !== 'completed'"
            (click)="setFilter('completed')"
          >
            Completed ({{ filterCount('completed') }})
          </ion-chip>
          <ion-chip 
            class="filter-chip filter-chip-pending"
            [class.chip-active]="filter() === 'overdue'"
            [class.chip-inactive]="filter() !== 'overdue'"
            (click)="setFilter('overdue')"
          >
            Overdue ({{ filterCount('overdue') }})
          </ion-chip>
        </div>

        <!-- Loans List -->
        <div class="section-card">
          <h3 class="section-title">Loan Details</h3>

          @if (loading()) {
            <div class="loans-loading">
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
              <div class="empty-icon-wrapper">
                <ion-icon name="document-text-outline" class="empty-icon"></ion-icon>
              </div>
              <p class="empty-title">No loans found</p>
              <p class="empty-subtitle">
                @if (filter() === 'all') {
                  You don't have any loans yet
                } @else {
                  No {{ filter() }} loans at the moment
                }
              </p>
            </div>
          } @else {
            <div class="loans-list">
              @for (loan of filteredLoans(); track loan.id) {
                <div class="loan-card" (click)="viewLoanDetails(loan)">
                  <!-- Header -->
                  <div class="loan-header">
                    <div class="loan-title-section">
                      <h4 class="loan-number">{{ loan.loanNumber }}</h4>
                      <ion-badge [color]="getStatusColor(loan.status)" class="loan-status-badge">
                        {{ loan.status | titlecase }}
                      </ion-badge>
                    </div>
                    <ion-icon name="eye-outline" class="view-icon"></ion-icon>
                  </div>

                  <!-- Amount Info -->
                  <div class="loan-amounts">
                    <div class="amount-item">
                      <p class="amount-label">Loan Amount</p>
                      <p class="amount-value">₱{{ formatCurrency(loan.amount) }}</p>
                    </div>
                    <div class="amount-divider"></div>
                    <div class="amount-item">
                      <p class="amount-label">Balance</p>
                      <p class="amount-value amount-balance">₱{{ formatCurrency(loan.balance) }}</p>
                    </div>
                  </div>

                  <!-- Progress Bar -->
                  @if (loan.status === 'active' || loan.status === 'overdue') {
                    <div class="loan-progress">
                      <div class="progress-info">
                        <span class="progress-label">Payment Progress</span>
                        <span class="progress-percentage">{{ loan.progress }}%</span>
                      </div>
                      <div class="progress-bar-container">
                        <div 
                          class="progress-bar-fill"
                          [class.progress-success]="loan.progress >= 75"
                          [class.progress-warning]="loan.progress >= 50 && loan.progress < 75"
                          [class.progress-danger]="loan.progress < 50"
                          [style.width.%]="loan.progress"
                        ></div>
                      </div>
                    </div>
                  }

                  <!-- Details Grid -->
                  <div class="loan-details-grid">
                    <div class="detail-item">
                      <ion-icon name="calendar-outline" class="detail-icon"></ion-icon>
                      <div class="detail-content">
                        <p class="detail-label">Due Date</p>
                        <p class="detail-value">{{ loan.dueDate }}</p>
                      </div>
                    </div>
                    <div class="detail-item">
                      <ion-icon name="cash-outline" class="detail-icon"></ion-icon>
                      <div class="detail-content">
                        <p class="detail-label">Monthly</p>
                        <p class="detail-value">₱{{ formatCurrency(loan.monthlyPayment) }}</p>
                      </div>
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
    /* ===== FIXED TOP BAR ===== */
    .fixed-top-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 100;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.15);
      padding-top: env(safe-area-inset-top);
    }

    .top-bar-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0.75rem 1rem;
      height: 56px;
    }

    .top-bar-left {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .top-bar-right {
      display: flex;
      align-items: center;
      gap: 0.25rem;
    }

    .app-emoji {
      font-size: 1.5rem;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
    }

    .app-title {
      font-size: 1rem;
      font-weight: 700;
      color: white;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.15);
      letter-spacing: -0.02em;
    }

    /* ===== MAIN CONTENT ===== */
    .main-content {
      --background: linear-gradient(160deg, rgba(102, 126, 234, 0.12), rgba(118, 75, 162, 0.06)), var(--ion-background-color);
    }

    .loans-container {
      padding: 0 1rem 1rem 1rem;
      padding-top: calc(56px + env(safe-area-inset-top) + 0.85rem);
      padding-bottom: calc(60px + env(safe-area-inset-bottom) + 0.85rem);
      max-width: 600px;
      margin: 0 auto;
    }

    /* ===== SUMMARY CARDS ===== */
    .summary-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.65rem;
      margin-bottom: 1rem;
    }

    .summary-card {
      background: var(--ion-card-background);
      border-radius: 16px;
      padding: 1.25rem;
      display: flex;
      gap: 1rem;
      align-items: center;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      border: 1px solid var(--ion-border-color, #e5e7eb);
    }

    .summary-icon-wrapper {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .summary-icon {
      font-size: 1.5rem;
      color: white;
    }

    .summary-primary {
      background: linear-gradient(135deg, #667eea, #764ba2);
    }

    .summary-warning {
      background: linear-gradient(135deg, #f093fb, #f5576c);
    }

    .summary-content {
      flex: 1;
      min-width: 0;
    }

    .summary-label {
      font-size: 0.75rem;
      color: var(--ion-color-medium);
      margin: 0 0 0.25rem 0;
      font-weight: 500;
    }

    .summary-value {
      font-size: 1.25rem;
      font-weight: 700;
      color: var(--ion-text-color);
      margin: 0;
      line-height: 1.2;
    }

    .summary-skeleton {
      width: 60%;
      height: 20px;
      border-radius: 4px;
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
      --background: #667eea !important;
      --color: white !important;
    }

    .chip-inactive {
      --background: var(--ion-color-light);
      --color: var(--ion-color-medium);
    }

    .filter-chip-success.chip-active {
      --background: #10b981 !important;
    }

    .filter-chip-primary.chip-active {
      --background: #4facfe !important;
    }

    .filter-chip-pending.chip-active {
      --background: #f59e0b !important;
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

    /* ===== LOADING STATES ===== */
    .loans-loading {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .loan-skeleton {
      background: var(--ion-item-background);
      border-radius: 12px;
      padding: 1rem;
    }

    .skeleton-header {
      width: 60%;
      height: 18px;
      border-radius: 4px;
      margin-bottom: 0.75rem;
    }

    .skeleton-text {
      width: 40%;
      height: 14px;
      border-radius: 4px;
      margin-bottom: 0.5rem;
    }

    /* ===== EMPTY STATE ===== */
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

    /* ===== LOANS LIST ===== */
    .loans-list {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .loan-card {
      background: var(--ion-item-background);
      border: 1px solid var(--ion-border-color, #e5e7eb);
      border-radius: 16px;
      padding: 1.25rem;
      cursor: pointer;
      transition: all 0.3s ease;
    }

    .loan-card:active {
      transform: scale(0.98);
    }

    .loan-header {
      display: flex;
      align-items: flex-start;
      justify-content: space-between;
      margin-bottom: 1rem;
    }

    .loan-title-section {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;
    }

    .loan-number {
      font-size: 1rem;
      font-weight: 700;
      color: var(--ion-text-color);
      margin: 0;
    }

    .loan-status-badge {
      font-size: 0.75rem;
      padding: 0.25rem 0.75rem;
    }

    .view-icon {
      font-size: 1.25rem;
      color: var(--ion-color-medium);
    }

    /* ===== LOAN AMOUNTS ===== */
    .loan-amounts {
      display: flex;
      gap: 1rem;
      align-items: center;
      margin-bottom: 1rem;
    }

    .amount-item {
      flex: 1;
    }

    .amount-divider {
      width: 1px;
      height: 40px;
      background: var(--ion-border-color, #e5e7eb);
    }

    .amount-label {
      font-size: 0.75rem;
      color: var(--ion-color-medium);
      margin: 0 0 0.25rem 0;
      font-weight: 500;
    }

    .amount-value {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--ion-text-color);
      margin: 0;
    }

    .amount-balance {
      color: #667eea;
    }

    /* ===== PROGRESS BAR ===== */
    .loan-progress {
      margin-bottom: 1rem;
    }

    .progress-info {
      display: flex;
      justify-content: space-between;
      margin-bottom: 0.5rem;
    }

    .progress-label {
      font-size: 0.75rem;
      color: var(--ion-color-medium);
      font-weight: 500;
    }

    .progress-percentage {
      font-size: 0.75rem;
      font-weight: 700;
      color: #667eea;
    }

    .progress-bar-container {
      width: 100%;
      height: 8px;
      background: var(--ion-color-light);
      border-radius: 9999px;
      overflow: hidden;
    }

    .progress-bar-fill {
      height: 100%;
      border-radius: 9999px;
      transition: width 0.5s ease;
    }

    .progress-success {
      background: linear-gradient(90deg, #10b981, #34d399);
    }

    .progress-warning {
      background: linear-gradient(90deg, #f59e0b, #fbbf24);
    }

    .progress-danger {
      background: linear-gradient(90deg, #ef4444, #f87171);
    }

    /* ===== DETAILS GRID ===== */
    .loan-details-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
    }

    .detail-item {
      display: flex;
      gap: 0.75rem;
      align-items: center;
    }

    .detail-icon {
      font-size: 1.25rem;
      color: var(--ion-color-medium);
      flex-shrink: 0;
    }

    .detail-content {
      flex: 1;
      min-width: 0;
    }

    .detail-label {
      font-size: 0.75rem;
      color: var(--ion-color-medium);
      margin: 0 0 0.125rem 0;
      font-weight: 500;
    }

    .detail-value {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--ion-text-color);
      margin: 0;
    }

    /* ===== DARK MODE ===== */
    body.dark .summary-card,
    .dark .summary-card,
    body.dark .section-card,
    .dark .section-card {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.1);
    }

    body.dark .loan-card,
    .dark .loan-card {
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

    body.dark .amount-divider,
    .dark .amount-divider {
      background: rgba(255, 255, 255, 0.1);
    }
  `]
})
export class CustomerLoansPage implements OnInit {
  loading = signal(false);
  loans = signal<Loan[]>([]);
  filter = signal<string>('all');

  constructor(
    private apiService: ApiService,
    public authService: AuthService,
    private router: Router,
    public themeService: ThemeService,
    private toastController: ToastController
  ) {
    addIcons({
      arrowBackOutline,
      documentTextOutline,
      calendarOutline,
      cashOutline,
      checkmarkCircleOutline,
      timeOutline,
      alertCircleOutline,
      eyeOutline,
      moonOutline,
      sunnyOutline,
      businessOutline
    });
  }

  ngOnInit() {
    this.loadLoans();
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  async loadLoans() {
    this.loading.set(true);
    try {
      console.log('Fetching authenticated customer loans...');
      const response = await this.apiService.getCustomerLoans().toPromise();
      console.log('Loans API response:', response);
      console.log('Response data array:', JSON.stringify(response?.data, null, 2));
      
      // Handle response structure
      const loansData = response?.data || response;
      
      if (loansData && Array.isArray(loansData)) {
        console.log('📊 Processing loans data:', loansData);
        
        const mappedLoans = loansData.map((loan: any) => {
          console.log('🔍 Raw loan data:', loan);
          
          const amount = parseFloat(loan.principalAmount || loan.principal_amount || loan.amount || 0);
          const balance = parseFloat(loan.outstandingBalance || loan.outstanding_balance || loan.balance || loan.remainingBalance || loan.remaining_balance || 0);
          const totalPaid = parseFloat(loan.amountPaid || loan.amount_paid || 0);
          const progress = amount > 0 ? Math.round((totalPaid / amount) * 100) : 0;

          console.log(`💰 Loan ${loan.id}: amount=${amount}, balance=${balance}, totalPaid=${totalPaid}, status=${loan.status}`);

          // Determine actual status based on balance or status
          let actualStatus = this.mapLoanStatus(loan.status);
          // If balance is 0 or negative, mark as completed
          if (balance <= 0 && amount > 0) {
            actualStatus = 'completed';
            console.log(`✅ Loan ${loan.id} marked as completed (balance <= 0)`);
          }

          return {
            id: loan.id,
            loanNumber: loan.loanNumber || loan.loan_number || `LN-${loan.id}`,
            amount: amount,
            balance: Math.max(0, balance), // Don't show negative balance
            interestRate: parseFloat(loan.interestRate || loan.interest_rate || 0),
            term: loan.termDays || loan.term_days || loan.term || loan.loan_term || 0,
            monthlyPayment: parseFloat(loan.monthlyPayment || loan.monthly_payment || 0),
            status: actualStatus,
            startDate: loan.disbursementDate || loan.disbursement_date || loan.startDate || loan.start_date || 'N/A',
            dueDate: loan.maturityDate || loan.maturity_date || loan.nextPaymentDate || loan.next_payment_date || loan.dueDate || loan.due_date || 'N/A',
            totalPaid: totalPaid,
            progress: progress
          };
        });
        
        console.log('📋 Final mapped loans:', mappedLoans);
        this.loans.set(mappedLoans);
      }
    } catch (error) {
      console.error('Failed to load loans:', error);
      const toast = await this.toastController.create({
        message: 'Failed to load loans',
        duration: 3000,
        position: 'bottom',
        color: 'danger'
      });
      await toast.present();
    } finally {
      this.loading.set(false);
    }
  }

  private mapLoanStatus(apiStatus: string): 'active' | 'completed' | 'overdue' | 'pending' {
    const status = (apiStatus || '').toLowerCase();
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
    return amount.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  getStatusColor(status: string): string {
    switch (status) {
      case 'active': return 'success';
      case 'completed': return 'primary';
      case 'overdue': return 'danger';
      case 'pending': return 'warning';
      default: return 'medium';
    }
  }

  viewLoanDetails(loan: Loan) {
    this.router.navigate(['/customer/loans', loan.id]);
  }

  goBack() {
    this.router.navigate(['/customer/dashboard']);
  }

  async handleRefresh(event: any) {
    await this.loadLoans();
    event.target.complete();
  }
}
