import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonButton,
  IonIcon,
  IonBadge,
  IonSkeletonText,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline,
  walletOutline,
  documentTextOutline,
  checkmarkCircleOutline,
  timeOutline,
  locationOutline,
  alertCircleOutline,
  trendingUpOutline,
  cardOutline,
  refreshOutline,
  arrowForwardOutline,
} from 'ionicons/icons';
import { CollectorService, CollectorDailySummary, CollectorLimits } from '../../core/services/collector.service';
import { AuthService } from '../../core/services/auth.service';
import { HeaderUtilsComponent } from '../../shared/components/header-utils.component';

@Component({
  selector: 'app-collector-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonIcon,
    IonSkeletonText,
    HeaderUtilsComponent,
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
            <span class="app-emoji">📊</span>
            <span class="app-title">Collector Dashboard</span>
          </div>
          
          <div class="top-bar-right">
            <app-header-utils />
          </div>
        </div>
      </div>

      <!-- Content Container with Padding -->
      <div class="dashboard-container">

      <!-- Loading Skeleton -->
      @if (loading()) {
        <div class="loading-skeletons">
          <ion-skeleton-text animated style="height: 140px; border-radius: 14px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height: 100px; border-radius: 14px;"></ion-skeleton-text>
          <ion-skeleton-text animated style="height: 180px; border-radius: 14px;"></ion-skeleton-text>
        </div>
      }

      <!-- Dashboard Content -->
      @if (!loading() && summary()) {
        <div class="dashboard-content">
          <!-- Collection Progress Card -->
          <div class="progress-card">
            <div class="card-title">📈 Today's Collection Progress</div>
            
            <!-- Collection Amount -->
            <div class="progress-item">
              <div class="progress-header">
                <span class="progress-label">Collected Today</span>
                <span class="progress-value collected">₱{{ summary()!.collectedToday.toLocaleString() }}</span>
              </div>
              <div class="progress-subtext">
                <span>Target: ₱{{ summary()!.collectionTarget.toLocaleString() }}</span>
                <span class="percentage">{{ collectionPercentage() }}%</span>
              </div>
              <div class="progress-bar">
                <div 
                  class="progress-fill"
                  [class.complete]="collectionPercentage() >= 100"
                  [style.width.%]="Math.min(collectionPercentage(), 100)">
                </div>
              </div>
            </div>

            <!-- Visits Progress -->
            <div class="progress-item">
              <div class="progress-header">
                <span class="progress-label">Visits Completed</span>
                <span class="progress-value visits">
                  {{ summary()!.visitsCompleted }} / {{ summary()!.visitsPlanned }}
                </span>
              </div>
              <div class="progress-bar">
                <div 
                  class="progress-fill visits"
                  [style.width.%]="visitPercentage()">
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Stats Grid -->
          <div class="stats-grid">
            <!-- Customers Card -->
            <div class="stat-card" (click)="navigateTo('/collector/customers')">
              <div class="stat-icon customers">👥</div>
              <div class="stat-value">{{ summary()!.totalCustomers }}</div>
              <div class="stat-label">Customers</div>
            </div>

            <!-- Active Loans Card -->
            <div class="stat-card">
              <div class="stat-icon active">💰</div>
              <div class="stat-value">{{ summary()!.activeLoans }}</div>
              <div class="stat-label">Active Loans</div>
            </div>

            <!-- Overdue Loans Card -->
            <div class="stat-card">
              <div class="stat-icon overdue">⚠️</div>
              <div class="stat-value">{{ summary()!.overdueLoans }}</div>
              <div class="stat-label">Overdue</div>
            </div>

            <!-- Total Outstanding Card -->
            <div class="stat-card">
              <div class="stat-icon outstanding">📊</div>
              <div class="stat-value">₱{{ (summary()!.totalOutstanding / 1000).toFixed(0) }}k</div>
              <div class="stat-label">Outstanding</div>
            </div>
          </div>

          <!-- Pending Actions -->
          <div class="actions-card">
            <div class="card-header">
              <span class="card-title">⚡ Pending Actions</span>
              <div class="badge-count">{{ totalPendingActions() }}</div>
            </div>
            
            <div class="actions-list">
              <!-- Applications -->
              <div class="action-item applications" (click)="navigateTo('/collector/applications')">
                <div class="action-info">
                  <div class="action-icon">📄</div>
                  <div>
                    <div class="action-title">Applications</div>
                    <div class="action-subtitle">Pending approval</div>
                  </div>
                </div>
                <div class="action-right">
                  <div class="action-badge">{{ summary()!.pendingApplications }}</div>
                  <ion-icon name="chevron-forward-outline" class="chevron-icon"></ion-icon>
                </div>
              </div>

              <!-- Disbursements -->
              <div class="action-item disbursements" (click)="navigateTo('/collector/disbursements')">
                <div class="action-info">
                  <div class="action-icon">💳</div>
                  <div>
                    <div class="action-title">Disbursements</div>
                    <div class="action-subtitle">Ready to disburse</div>
                  </div>
                </div>
                <div class="action-right">
                  <div class="action-badge">{{ summary()!.pendingDisbursements }}</div>
                  <ion-icon name="chevron-forward-outline" class="chevron-icon"></ion-icon>
                </div>
              </div>

              <!-- Penalty Waivers -->
              <div class="action-item waivers" (click)="navigateTo('/collector/waivers')">
                <div class="action-info">
                  <div class="action-icon">⏰</div>
                  <div>
                    <div class="action-title">Penalty Waivers</div>
                    <div class="action-subtitle">Pending approval</div>
                  </div>
                </div>
                <div class="action-right">
                  <div class="action-badge">{{ summary()!.pendingWaivers }}</div>
                  <ion-icon name="chevron-forward-outline" class="chevron-icon"></ion-icon>
                </div>
              </div>
            </div>
          </div>

          <!-- Collector Limits -->
          @if (limits()) {
            <div class="limits-card">
              <div class="card-title">🎯 Your Limits</div>
              
              <div class="limits-list">
                <div class="limit-item">
                  <span class="limit-label">Max Approval Amount</span>
                  <span class="limit-value">₱{{ limits()!.maxApprovalAmount.toLocaleString() }}</span>
                </div>
                <div class="limit-divider"></div>
                
                <div class="limit-item">
                  <span class="limit-label">Max Approvals/Day</span>
                  <span class="limit-value">{{ limits()!.maxApprovalPerDay }}</span>
                </div>
                <div class="limit-divider"></div>
                
                <div class="limit-item">
                  <span class="limit-label">Max Disbursement</span>
                  <span class="limit-value">₱{{ limits()!.maxDisbursementAmount.toLocaleString() }}</span>
                </div>
                <div class="limit-divider"></div>
                
                <div class="limit-item">
                  <span class="limit-label">Max Penalty Waiver</span>
                  <span class="limit-value">₱{{ limits()!.maxPenaltyWaiverAmount.toLocaleString() }} ({{ limits()!.maxPenaltyWaiverPercent }}%)</span>
                </div>
              </div>
            </div>
          }

          <!-- Quick Actions -->
          <div class="quick-actions">
            <button class="action-btn primary" (click)="navigateTo('/collector/visits')">
              <ion-icon name="location-outline"></ion-icon>
              <span>Start Visit</span>
            </button>
            <button class="action-btn success" (click)="navigateTo('/collector/route')">
              <ion-icon name="people-outline"></ion-icon>
              <span>My Customers</span>
            </button>
          </div>
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
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
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
      --background: var(--ion-background-color, #f7f7f9);
    }

    /* Container with safe area padding */
    .dashboard-container {
      padding-top: calc(56px + env(safe-area-inset-top) + 0.85rem);
      padding-bottom: calc(60px + env(safe-area-inset-bottom) + 0.85rem);
      padding-left: 0.85rem;
      padding-right: 0.85rem;
    }

    /* Loading Skeletons */
    .loading-skeletons {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    /* Dashboard Content */
    .dashboard-content {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    /* Progress Card */
    .progress-card {
      background: var(--ion-card-background, white);
      border-radius: 14px;
      padding: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
      border: 1px solid var(--ion-border-color, rgba(0, 0, 0, 0.04));
    }

    .card-title {
      font-size: 0.95rem;
      font-weight: 700;
      color: var(--ion-text-color, #1f2937);
      margin-bottom: 0.85rem;
    }

    .progress-item {
      margin-bottom: 1rem;
    }

    .progress-item:last-child {
      margin-bottom: 0;
    }

    .progress-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.5rem;
    }

    .progress-label {
      font-size: 0.8rem;
      color: var(--ion-color-medium, #64748b);
      font-weight: 500;
    }

    .progress-value {
      font-size: 1rem;
      font-weight: 700;
    }

    .progress-value.collected {
      color: #10b981;
    }

    .progress-value.visits {
      color: #3b82f6;
    }

    .progress-subtext {
      display: flex;
      justify-content: space-between;
      font-size: 0.75rem;
      color: var(--ion-color-medium, #6b7280);
      margin-bottom: 0.5rem;
    }

    .percentage {
      font-weight: 600;
      color: var(--ion-text-color, #1f2937);
    }

    .progress-bar {
      width: 100%;
      height: 6px;
      background: var(--ion-color-light, #e5e7eb);
      border-radius: 10px;
      overflow: hidden;
    }

    .progress-fill {
      height: 100%;
      background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
      border-radius: 10px;
      transition: width 0.3s ease;
    }

    .progress-fill.complete {
      background: linear-gradient(90deg, #10b981 0%, #059669 100%);
    }

    .progress-fill.visits {
      background: linear-gradient(90deg, #3b82f6 0%, #2563eb 100%);
    }

    /* Stats Grid */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }

    .stat-card {
      background: var(--ion-card-background, white);
      border-radius: 14px;
      padding: 1rem;
      text-align: center;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
      border: 1px solid var(--ion-border-color, rgba(0, 0, 0, 0.04));
      cursor: pointer;
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .stat-card:active {
      transform: scale(0.98);
    }

    .stat-icon {
      font-size: 2.5rem;
      margin-bottom: 0.5rem;
    }

    .stat-value {
      font-size: 1.5rem;
      font-weight: 700;
      color: var(--ion-text-color, #1f2937);
      margin-bottom: 0.25rem;
    }

    .stat-label {
      font-size: 0.75rem;
      color: var(--ion-color-medium, #6b7280);
      font-weight: 500;
    }

    /* Actions Card */
    .actions-card {
      background: var(--ion-card-background, white);
      border-radius: 14px;
      padding: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
      border: 1px solid var(--ion-border-color, rgba(0, 0, 0, 0.04));
    }

    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 0.85rem;
    }

    .badge-count {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
      padding: 0.25rem 0.65rem;
      border-radius: 12px;
      font-size: 0.75rem;
      font-weight: 700;
    }

    .actions-list {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }

    .action-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.85rem;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.2s;
    }

    .action-item.applications {
      background: linear-gradient(135deg, #eff6ff 0%, #dbeafe 100%);
    }

    .action-item.applications:active {
      background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
    }

    .action-item.disbursements {
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
    }

    .action-item.disbursements:active {
      background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
    }

    .action-item.waivers {
      background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
    }

    .action-item.waivers:active {
      background: linear-gradient(135deg, #ffedd5 0%, #fed7aa 100%);
    }

    .action-info {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .action-icon {
      font-size: 1.75rem;
    }

    .action-title {
      font-size: 0.875rem;
      font-weight: 700;
      color: var(--ion-text-color, #1f2937);
    }

    .action-subtitle {
      font-size: 0.7rem;
      color: var(--ion-color-medium, #6b7280);
      margin-top: 0.15rem;
    }

    .action-right {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .action-badge {
      background: var(--ion-card-background, white);
      color: var(--ion-text-color, #1f2937);
      padding: 0.25rem 0.65rem;
      border-radius: 8px;
      font-size: 0.8rem;
      font-weight: 700;
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .chevron-icon {
      font-size: 1.1rem;
      color: var(--ion-color-medium, #9ca3af);
    }

    /* Limits Card */
    .limits-card {
      background: var(--ion-card-background, white);
      border-radius: 14px;
      padding: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
      border: 1px solid var(--ion-border-color, rgba(0, 0, 0, 0.04));
    }

    .limits-list {
      display: flex;
      flex-direction: column;
    }

    .limit-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.65rem 0;
    }

    .limit-label {
      font-size: 0.8rem;
      color: var(--ion-color-medium, #64748b);
      font-weight: 500;
    }

    .limit-value {
      font-size: 0.85rem;
      color: var(--ion-text-color, #1f2937);
      font-weight: 700;
    }

    .limit-divider {
      height: 1px;
      background: var(--ion-border-color, #e5e7eb);
    }

    /* Quick Actions */
    .quick-actions {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }

    .action-btn {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.85rem;
      border: none;
      border-radius: 10px;
      font-size: 0.875rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s;
      box-shadow: 0 2px 4px rgba(0, 0, 0, 0.08);
    }

    .action-btn ion-icon {
      font-size: 1.1rem;
    }

    .action-btn.primary {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
    }

    .action-btn.primary:active {
      transform: scale(0.98);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    .action-btn.success {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
    }

    .action-btn.success:active {
      transform: scale(0.98);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }
  `],
})
export class CollectorDashboardPage implements OnInit {
  private collectorService = inject(CollectorService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastController = inject(ToastController);

  Math = Math;
  loading = signal(true);
  summary = signal<CollectorDailySummary | null>(null);
  limits = signal<CollectorLimits | null>(null);
  currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  collectorId = signal<number>(0);

  constructor() {
    addIcons({
      personOutline,
      walletOutline,
      documentTextOutline,
      checkmarkCircleOutline,
      timeOutline,
      locationOutline,
      alertCircleOutline,
      trendingUpOutline,
      cardOutline,
      refreshOutline,
      arrowForwardOutline,
    });
  }

  ngOnInit() {
    const user = this.authService.currentUser();
    if (user) {
      this.collectorId.set(Number(user.id));
      this.loadDashboard();
    }
  }

  async loadDashboard() {
    this.loading.set(true);
    try {
      const [summaryData, limitsData] = await Promise.all([
        this.collectorService.getDailySummary(this.collectorId()).toPromise(),
        this.collectorService.getLimits(this.collectorId()).toPromise(),
      ]);

      this.summary.set(summaryData!);
      this.limits.set(limitsData!);
    } catch (error: any) {
      await this.showToast(error.error?.message || 'Failed to load dashboard', 'danger');
    } finally {
      this.loading.set(false);
    }
  }

  async handleRefresh(event: any) {
    await this.loadDashboard();
    event.target.complete();
  }

  collectionPercentage(): number {
    if (!this.summary() || this.summary()!.collectionTarget === 0) return 0;
    return Math.round((this.summary()!.collectedToday / this.summary()!.collectionTarget) * 100);
  }

  visitPercentage(): number {
    if (!this.summary() || this.summary()!.visitsPlanned === 0) return 0;
    return Math.round((this.summary()!.visitsCompleted / this.summary()!.visitsPlanned) * 100);
  }

  totalPendingActions(): number {
    if (!this.summary()) return 0;
    return this.summary()!.pendingApplications + 
           this.summary()!.pendingDisbursements + 
           this.summary()!.pendingWaivers;
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
  }

  async showToast(message: string, color: string = 'success') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      color,
      position: 'bottom',
    });
    await toast.present();
  }
}
