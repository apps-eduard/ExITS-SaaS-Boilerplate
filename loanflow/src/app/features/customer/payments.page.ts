import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import {
  IonContent,
  IonSpinner,
  IonRefresher,
  IonRefresherContent,
  ToastController,
} from '@ionic/angular/standalone';
import { ApiService } from '../../core/services/api.service';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { CustomerTopBarComponent } from '../../shared/components/customer-top-bar.component';

interface Payment {
  id: number;
  loanId: number;
  loanNumber: string;
  paymentReference: string;
  amount: number;
  principalAmount: number;
  interestAmount: number;
  penaltyAmount: number;
  paymentMethod: string;
  paymentDate: string;
  status: string;
  notes: string;
  createdAt: string;
}

@Component({
  selector: 'app-customer-payments',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonContent,
    IonSpinner,
    IonRefresher,
    IonRefresherContent,
    CustomerTopBarComponent
  ],
  template: `
    <ion-content [fullscreen]="true" class="main-content">
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <app-customer-top-bar
        emoji="💳"
        title="Payment History"
      />

      <div class="payments-container">
        <!-- Summary Stats -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-icon-wrapper purple">
              <span class="emoji-icon">🧾</span>
            </div>
            <div class="stat-content">
              <div class="stat-label">Total Payments</div>
              <div class="stat-value">{{ payments().length }}</div>
            </div>
          </div>

          <div class="stat-card">
            <div class="stat-icon-wrapper green">
              <span class="emoji-icon">💰</span>
            </div>
            <div class="stat-content">
              <div class="stat-label">Total Paid</div>
              <div class="stat-value">₱{{ formatCurrency(totalPaid()) }}</div>
            </div>
          </div>
        </div>

        <!-- Filter Tabs -->
        <div class="filter-tabs">
          <button 
            class="filter-tab"
            [class.active]="selectedFilter() === 'all'"
            (click)="applyFilter('all')"
          >
            All
            @if (selectedFilter() === 'all') {
              <span class="tab-indicator"></span>
            }
          </button>
          <button 
            class="filter-tab"
            [class.active]="selectedFilter() === 'completed'"
            (click)="applyFilter('completed')"
          >
            Completed
            @if (selectedFilter() === 'completed') {
              <span class="tab-indicator"></span>
            }
          </button>
          <button 
            class="filter-tab"
            [class.active]="selectedFilter() === 'pending'"
            (click)="applyFilter('pending')"
          >
            Pending
            @if (selectedFilter() === 'pending') {
              <span class="tab-indicator"></span>
            }
          </button>
        </div>

        <!-- Loading State -->
        @if (loading()) {
          <div class="loading-state">
            <ion-spinner name="crescent" color="primary"></ion-spinner>
            <p>Loading payment history...</p>
          </div>
        }

        <!-- Empty State -->
        @if (!loading() && filteredPayments().length === 0) {
          <div class="empty-state">
            <div class="empty-icon">💸</div>
            <h3 class="empty-title">No Payments Found</h3>
            <p class="empty-message">
              @if (selectedFilter() === 'all') {
                Your payment history will appear here once you make your first payment.
              } @else {
                No {{ selectedFilter() }} payments found. Try a different filter.
              }
            </p>
            <div class="empty-actions">
              <button class="refresh-btn" (click)="refreshPayments()" [disabled]="loading()">
                <span class="emoji-icon-inline">🔄</span>
                <span>Refresh</span>
              </button>
              <button class="dashboard-btn" routerLink="/customer/dashboard">
                <span class="emoji-icon-inline">🏠</span>
                <span>Back to Dashboard</span>
              </button>
            </div>
          </div>
        }

        <!-- Payment Cards -->
        @if (!loading() && filteredPayments().length > 0) {
          <div class="payments-list">
            @for (payment of filteredPayments(); track payment.id; let idx = $index) {
              <div 
                class="payment-card"
                [class.expanded]="expandedPaymentId() === payment.id"
                [style.animation-delay]="idx * 50 + 'ms'"
                (click)="togglePayment(payment.id)"
              >
                <!-- Card Header -->
                <div class="card-header">
                  <div class="header-left">
                    <div class="payment-icon" [class]="getPaymentMethodClass(payment.paymentMethod)">
                      <span class="emoji-icon">{{ getPaymentMethodEmoji(payment.paymentMethod) }}</span>
                    </div>
                    <div class="payment-main">
                      <div class="payment-amount">₱{{ formatCurrency(payment.amount) }}</div>
                      <div class="payment-method">{{ getPaymentMethodLabel(payment.paymentMethod) }}</div>
                    </div>
                  </div>
                  <div class="header-right">
                    <div class="status-badge" [class]="getStatusClass(payment.status)">
                      {{ payment.status }}
                    </div>
                  </div>
                </div>

                <!-- Card Summary (Always Visible) -->
                <div class="card-summary">
                  <div class="summary-item">
                    <span class="emoji-icon-small">🧾</span>
                    <span>{{ payment.loanNumber }}</span>
                  </div>
                  <div class="summary-item">
                    <span class="emoji-icon-small">📅</span>
                    <span>{{ formatDate(payment.paymentDate) }}</span>
                  </div>
                </div>

                <!-- Expandable Details -->
                @if (expandedPaymentId() === payment.id) {
                  <div class="card-details">
                    <div class="details-divider"></div>

                    <!-- Reference Number -->
                    <div class="detail-row">
                      <div class="detail-label">Reference Number</div>
                      <div class="detail-value">{{ payment.paymentReference }}</div>
                    </div>

                    <!-- Payment Time -->
                    <div class="detail-row">
                      <div class="detail-label">Payment Time</div>
                      <div class="detail-value">{{ formatTime(payment.createdAt) }}</div>
                    </div>

                    <!-- Amount Breakdown -->
                    @if (payment.principalAmount > 0 || payment.interestAmount > 0) {
                      <div class="breakdown-section">
                        <div class="breakdown-title">Amount Breakdown</div>
                        <div class="breakdown-grid">
                          @if (payment.principalAmount > 0) {
                            <div class="breakdown-item">
                              <span class="breakdown-label">Principal</span>
                              <span class="breakdown-value">₱{{ formatCurrency(payment.principalAmount) }}</span>
                            </div>
                          }
                          @if (payment.interestAmount > 0) {
                            <div class="breakdown-item">
                              <span class="breakdown-label">Interest</span>
                              <span class="breakdown-value">₱{{ formatCurrency(payment.interestAmount) }}</span>
                            </div>
                          }
                          @if (payment.penaltyAmount > 0) {
                            <div class="breakdown-item">
                              <span class="breakdown-label">Penalty</span>
                              <span class="breakdown-value penalty">₱{{ formatCurrency(payment.penaltyAmount) }}</span>
                            </div>
                          }
                        </div>
                      </div>
                    }

                    <!-- Notes -->
                    @if (payment.notes) {
                      <div class="notes-section">
                        <div class="notes-label">Notes</div>
                        <div class="notes-text">{{ payment.notes }}</div>
                      </div>
                    }
                  </div>
                }

                <!-- Expand Indicator -->
                <div class="expand-indicator">
                  <span class="emoji-icon-small">
                    {{ expandedPaymentId() === payment.id ? '🔼' : '🔽' }}
                  </span>
                </div>
              </div>
            }
          </div>
        }
      </div>
    </ion-content>
  `,
  styles: [`
    /* Main Content */
    .main-content {
      --background: linear-gradient(160deg, rgba(102, 126, 234, 0.12), rgba(118, 75, 162, 0.06)), var(--ion-background-color);
    }

    .payments-container {
      padding: 0 1rem 1rem 1rem;
      padding-top: calc(84px + env(safe-area-inset-top) + 0.85rem);
      padding-bottom: calc(60px + env(safe-area-inset-bottom) + 0.85rem);
      max-width: 600px;
      margin: 0 auto;
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.85rem;
      margin-bottom: 1.25rem;
      animation: fadeInUp 0.4s ease-out;
    }

    .stat-card {
      background: var(--ion-card-background, #fff);
      border-radius: 14px;
      padding: 1rem;
      display: flex;
      align-items: center;
      gap: 0.85rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      transition: all 0.3s ease;
    }

    .stat-card:active {
      transform: scale(0.98);
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

    .stat-icon-wrapper.purple {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
    }

    .stat-icon-wrapper.green {
      background: linear-gradient(135deg, #10b981, #059669);
    }

    .stat-icon-wrapper .emoji-icon {
      font-size: 1.5rem;
      line-height: 1;
    }

    .stat-content {
      flex: 1;
      min-width: 0;
    }

    .stat-label {
      font-size: 0.8125rem;
      color: var(--ion-color-step-600, #64748b);
      margin-bottom: 0.25rem;
    }

    .stat-value {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--ion-text-color, #1e293b);
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }

    /* Filter Tabs */
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
      font-weight: 600;
      border-radius: 8px;
      cursor: pointer;
      transition: all 0.3s ease;
      position: relative;
      overflow: hidden;
    }

    .filter-tab.active {
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
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

    /* Loading State */
    .loading-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1.5rem;
      gap: 1rem;
    }

    .loading-state p {
      color: var(--ion-color-step-600, #64748b);
      font-size: 0.9375rem;
    }

    /* Empty State */
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

    /* Payment Cards */
    .payments-list {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .payment-card {
      background: var(--ion-card-background, #fff);
      border-radius: 14px;
      padding: 1rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      cursor: pointer;
      transition: all 0.3s ease;
      animation: fadeInUp 0.4s ease-out both;
      position: relative;
      overflow: hidden;
    }

    .payment-card:active {
      transform: scale(0.98);
    }

    .payment-card.expanded {
      box-shadow: 0 4px 16px rgba(102, 126, 234, 0.2);
    }

    /* Card Header */
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.85rem;
    }

    .header-left {
      display: flex;
      align-items: center;
      gap: 0.85rem;
      flex: 1;
      min-width: 0;
    }

    .payment-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .payment-icon.cash {
      background: linear-gradient(135deg, #10b981, #059669);
    }

    .payment-icon.card {
      background: linear-gradient(135deg, #667eea, #764ba2);
    }

    .payment-icon.bank {
      background: linear-gradient(135deg, #f59e0b, #ea580c);
    }

    .payment-icon.gcash {
      background: linear-gradient(135deg, #0ea5e9, #0284c7);
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
    }

    .payment-main {
      flex: 1;
      min-width: 0;
    }

    .payment-amount {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--ion-text-color, #1e293b);
      margin-bottom: 0.25rem;
    }

    .payment-method {
      font-size: 0.8125rem;
      color: var(--ion-color-step-600, #64748b);
    }

    .header-right {
      flex-shrink: 0;
    }

    .status-badge {
      padding: 0.35rem 0.75rem;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.02em;
    }

    .status-badge.completed {
      background: linear-gradient(135deg, #d1fae5, #a7f3d0);
      color: #065f46;
    }

    .status-badge.pending {
      background: linear-gradient(135deg, #fef3c7, #fde68a);
      color: #92400e;
    }

    .status-badge.failed {
      background: linear-gradient(135deg, #fecaca, #fca5a5);
      color: #991b1b;
    }

    /* Card Summary */
    .card-summary {
      display: flex;
      gap: 1rem;
      padding: 0.75rem;
      background: var(--ion-color-light, #f4f5f8);
      border-radius: 10px;
      margin-bottom: 0.5rem;
    }

    .summary-item {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      font-size: 0.8125rem;
      color: var(--ion-color-step-600, #64748b);
    }

    /* Card Details */
    .card-details {
      animation: expandPanel 0.3s ease-out;
    }

    .details-divider {
      height: 1px;
      background: var(--ion-border-color, #e5e7eb);
      margin: 0.85rem 0;
    }

    .detail-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.65rem 0;
    }

    .detail-label {
      font-size: 0.8125rem;
      color: var(--ion-color-step-600, #64748b);
    }

    .detail-value {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--ion-text-color, #1e293b);
      text-align: right;
    }

    /* Breakdown Section */
    .breakdown-section {
      margin-top: 0.85rem;
      padding: 0.85rem;
      background: linear-gradient(135deg, #ecfdf5, #d1fae5);
      border-radius: 10px;
    }

    .breakdown-title {
      font-size: 0.8125rem;
      font-weight: 600;
      color: #047857;
      margin-bottom: 0.65rem;
    }

    .breakdown-grid {
      display: flex;
      flex-direction: column;
      gap: 0.5rem;
    }

    .breakdown-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .breakdown-label {
      font-size: 0.8125rem;
      color: #047857;
    }

    .breakdown-value {
      font-size: 0.875rem;
      font-weight: 600;
      color: #065f46;
    }

    .breakdown-value.penalty {
      color: #dc2626;
    }

    /* Notes Section */
    .notes-section {
      margin-top: 0.85rem;
      padding: 0.85rem;
      background: var(--ion-color-light, #f4f5f8);
      border-radius: 10px;
    }

    .notes-label {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--ion-text-color, #1e293b);
      margin-bottom: 0.5rem;
      display: block;
    }

    .notes-text {
      font-size: 0.8125rem;
      color: var(--ion-color-step-600, #64748b);
      line-height: 1.5;
    }

    /* Expand Indicator */
    .expand-indicator {
      display: flex;
      justify-content: center;
      padding-top: 0.5rem;
    }

    /* Animations */
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

    /* Dark Mode */
    body.dark .stat-card,
    body.dark .filter-tabs,
    body.dark .payment-card,
    .dark .stat-card,
    .dark .filter-tabs,
    .dark .payment-card {
      background: rgba(30, 41, 59, 0.95);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }

    body.dark .card-summary,
    body.dark .notes-section,
    .dark .card-summary,
    .dark .notes-section {
      background: rgba(15, 23, 42, 0.5);
    }
  `]
})
export class CustomerPaymentsPage implements OnInit {
  payments = signal<Payment[]>([]);
  filteredPayments = signal<Payment[]>([]);
  loading = signal(false);
  selectedFilter = signal<string>('all');
  totalPaid = signal(0);
  expandedPaymentId = signal<number | null>(null);

  constructor(
    private apiService: ApiService,
    private authService: AuthService,
    private toastController: ToastController,
    private router: Router
  ) {
  }

  ngOnInit() {
    this.loadPayments();
  }

  async loadPayments() {
    this.loading.set(true);
    try {
      console.log('📡 Loading payment history...');
      const response: any = await this.apiService.getPaymentHistory().toPromise();
      console.log('✅ Payment history response:', response);

      if (response && response.success && response.data) {
        const paymentsData = response.data.map((p: any) => ({
          id: p.id,
          loanId: p.loanId || p.loan_id,
          loanNumber: p.loanNumber || p.loan_number,
          paymentReference: p.paymentReference || p.payment_reference,
          amount: parseFloat(p.amount || 0),
          principalAmount: parseFloat(p.principalAmount || p.principal_amount || 0),
          interestAmount: parseFloat(p.interestAmount || p.interest_amount || 0),
          penaltyAmount: parseFloat(p.penaltyAmount || p.penalty_amount || 0),
          paymentMethod: p.paymentMethod || p.payment_method || 'cash',
          paymentDate: p.paymentDate || p.payment_date,
          status: p.status || 'completed',
          notes: p.notes || '',
          createdAt: p.createdAt || p.created_at,
        }));

        this.payments.set(paymentsData);
        this.totalPaid.set(paymentsData.reduce((sum: number, p: Payment) => sum + p.amount, 0));
        this.applyFilter(this.selectedFilter());
        console.log(`💰 Total payments: ${this.payments().length}, Total paid: ${this.totalPaid()}`);
      }
    } catch (error) {
      console.error('❌ Error loading payments:', error);
      const toast = await this.toastController.create({
        message: 'Failed to load payment history',
        duration: 3000,
        color: 'danger',
      });
      await toast.present();
    } finally {
      this.loading.set(false);
    }
  }

  applyFilter(filter: string) {
    this.selectedFilter.set(filter);
    if (filter === 'all') {
      this.filteredPayments.set(this.payments());
    } else {
      this.filteredPayments.set(this.payments().filter((p) => p.status === filter));
    }
  }

  togglePayment(id: number) {
    if (this.expandedPaymentId() === id) {
      this.expandedPaymentId.set(null);
    } else {
      this.expandedPaymentId.set(id);
    }
  }

  async handleRefresh(event: any) {
    await this.loadPayments();
    event.target.complete();
  }

  async refreshPayments() {
    if (this.loading()) {
      return;
    }

    await this.loadPayments();
  }

  goToDashboard() {
    this.router.navigate(['/customer/dashboard']);
  }

  getPaymentMethodEmoji(method: string): string {
    switch (method.toLowerCase()) {
      case 'cash':
        return '💵';
      case 'card':
      case 'credit_card':
      case 'debit_card':
        return '💳';
      case 'bank_transfer':
      case 'online_banking':
        return '🏦';
      case 'gcash':
      case 'paymaya':
        return '📱';
      default:
        return '💰';
    }
  }

  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'success';
      case 'pending':
      case 'processing':
        return 'warning';
      case 'failed':
      case 'rejected':
        return 'danger';
      default:
        return 'medium';
    }
  }

  formatDate(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
    });
  }

  formatTime(dateStr: string): string {
    const date = new Date(dateStr);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit',
    });
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  getPaymentMethodClass(method: string): string {
    switch (method.toLowerCase()) {
      case 'cash':
        return 'cash';
      case 'card':
      case 'credit_card':
      case 'debit_card':
        return 'card';
      case 'bank_transfer':
      case 'online_banking':
        return 'bank';
      case 'gcash':
      case 'paymaya':
        return 'gcash';
      default:
        return 'card';
    }
  }

  getStatusClass(status: string): string {
    switch (status.toLowerCase()) {
      case 'completed':
      case 'success':
        return 'completed';
      case 'pending':
      case 'processing':
        return 'pending';
      case 'failed':
      case 'rejected':
        return 'failed';
      default:
        return 'pending';
    }
  }

  getPaymentMethodLabel(method: string): string {
    switch (method.toLowerCase()) {
      case 'cash':
        return 'Cash';
      case 'card':
      case 'credit_card':
        return 'Credit Card';
      case 'debit_card':
        return 'Debit Card';
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'online_banking':
        return 'Online Banking';
      case 'gcash':
        return 'GCash';
      case 'paymaya':
        return 'PayMaya';
      default:
        return method.charAt(0).toUpperCase() + method.slice(1).replace('_', ' ');
    }
  }
}

