import { Component, OnInit, signal } from '@angular/core';
import { CommonModule, Location } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import {
  IonContent,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonBadge,
  IonSpinner,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  arrowBackOutline,
  checkmarkCircleOutline,
  timeOutline,
  documentTextOutline,
  cashOutline,
  moonOutline,
  sunnyOutline
} from 'ionicons/icons';
import { ApiService } from '../../core/services/api.service';
import { ThemeService } from '../../core/services/theme.service';
import { HeaderUtilsComponent } from '../../shared/components/header-utils.component';

interface ApplicationTimeline {
  id: number;
  applicationNumber: string;
  status: string;
  requestedAmount: number;
  requestedTerm: number;
  productName: string;
  createdAt: string;
  reviewedAt?: string;
  approvedAt?: string;
  disbursedAt?: string;
  rejectedAt?: string;
}

interface TimelineStep {
  title: string;
  status: 'completed' | 'current' | 'pending' | 'rejected';
  date?: string;
  icon: string;
}

@Component({
  selector: 'app-application-timeline',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonBadge,
    IonSpinner,
    HeaderUtilsComponent
  ],
  template: `
    <ion-content [fullscreen]="true" class="main-content">
      <!-- Fixed Top Bar -->
      <div class="fixed-top-bar">
        <div class="top-bar-content">
          <div class="top-bar-left">
            <span class="app-emoji">📋</span>
            <span class="app-title">Application Status</span>
          </div>
          
          <div class="top-bar-right">
            <app-header-utils />
          </div>
        </div>
      </div>

      <div class="timeline-container">

        @if (loading()) {
          <div class="loading-state">
            <ion-spinner name="crescent"></ion-spinner>
            <p>Loading application details...</p>
          </div>
        } @else if (application()) {
          <!-- Application Header Card -->
          <ion-card class="app-header-card">
            <ion-card-header>
              <div class="header-content">
                <div>
                  <ion-card-title class="app-number">{{ application()?.applicationNumber }}</ion-card-title>
                  <p class="product-name">{{ application()?.productName }}</p>
                </div>
                <ion-badge [color]="getStatusColor(application()?.status || '')">
                  {{ formatStatus(application()?.status || '') }}
                </ion-badge>
              </div>
            </ion-card-header>
            <ion-card-content>
              <div class="app-details">
                <div class="detail-item">
                  <span class="detail-label">Requested Amount</span>
                  <span class="detail-value">₱{{ formatCurrency(application()?.requestedAmount || 0) }}</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Loan Term</span>
                  <span class="detail-value">{{ application()?.requestedTerm }} days</span>
                </div>
                <div class="detail-item">
                  <span class="detail-label">Applied On</span>
                  <span class="detail-value">{{ formatDate(application()?.createdAt || '') }}</span>
                </div>
              </div>
            </ion-card-content>
          </ion-card>

          <!-- Timeline Card -->
          <ion-card class="timeline-card">
            <ion-card-header>
              <ion-card-title class="timeline-title">Application Progress</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <div class="timeline">
                @for (step of timelineSteps(); track step.title) {
                  <div class="timeline-step" [class.completed]="step.status === 'completed'" 
                       [class.current]="step.status === 'current'"
                       [class.rejected]="step.status === 'rejected'">
                    <div class="step-icon">
                      <ion-icon [name]="step.icon"></ion-icon>
                    </div>
                    <div class="step-content">
                      <h3 class="step-title">{{ step.title }}</h3>
                      @if (step.date) {
                        <p class="step-date">{{ step.date }}</p>
                      }
                      @if (step.status === 'current') {
                        <p class="step-status">In Progress</p>
                      }
                      @if (step.status === 'pending') {
                        <p class="step-status pending">Pending</p>
                      }
                    </div>
                  </div>
                }
              </div>
            </ion-card-content>
          </ion-card>

          <!-- Action Buttons -->
          <div class="action-buttons">
            @if (application()?.status === 'approved') {
              <div class="info-message success">
                <ion-icon name="checkmark-circle-outline"></ion-icon>
                <p>Your application has been approved! Waiting for disbursement.</p>
              </div>
            }
            @if (application()?.status === 'rejected') {
              <div class="info-message error">
                <ion-icon name="close-circle-outline"></ion-icon>
                <p>Unfortunately, your application was not approved. You can apply again with a different product.</p>
              </div>
              <ion-button expand="block" (click)="applyAgain()">
                Apply for Another Loan
              </ion-button>
            }
            @if (application()?.status === 'submitted' || application()?.status === 'pending') {
              <div class="info-message warning">
                <ion-icon name="time-outline"></ion-icon>
                <p>Your application is being reviewed. We'll notify you once it's processed.</p>
              </div>
            }
          </div>

          <!-- Back to Dashboard Button -->
          <div class="dashboard-button-container">
            <button class="dashboard-button" (click)="goBack()">
              <span class="dashboard-icon">🏠</span>
              <span class="dashboard-text">Back to Dashboard</span>
            </button>
          </div>
        } @else {
          <div class="error-state">
            <ion-icon name="document-text-outline" class="error-icon"></ion-icon>
            <p>Application not found</p>
            <ion-button (click)="goBack()">Go Back</ion-button>
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

    @keyframes progressPulse {
      0%, 100% {
        box-shadow: 0 0 0 0 rgba(102, 126, 234, 0.4);
      }
      50% {
        box-shadow: 0 0 0 10px rgba(102, 126, 234, 0);
      }
    }

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
      animation: scaleIn 0.5s ease-out;
    }

    .app-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: white;
      letter-spacing: -0.01em;
      animation: slideInRight 0.5s ease-out 0.1s backwards;
    }

    /* Main Content Background */
    .main-content {
      --background: linear-gradient(to bottom, #f7f7f9 0%, #eeeef2 100%);
    }

    /* Timeline Container with safe area padding */
    .timeline-container {
      padding-top: calc(56px + env(safe-area-inset-top) + 0.85rem);
      padding-bottom: calc(60px + env(safe-area-inset-bottom) + 0.85rem);
      padding-left: 1rem;
      padding-right: 1rem;
    }

    /* ===== DASHBOARD BUTTON ===== */
    .dashboard-button-container {
      display: flex;
      justify-content: center;
      margin-top: 2rem;
      padding: 1rem 0;
      animation: fadeInUp 0.5s ease-out 0.8s backwards;
    }

    .dashboard-button {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      gap: 0.65rem;
      padding: 0.875rem 2rem;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      border: none;
      border-radius: 14px;
      color: white;
      font-size: 0.9375rem;
      font-weight: 700;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
      letter-spacing: -0.01em;
    }

    .dashboard-icon {
      font-size: 1.25rem;
      line-height: 1;
      transition: transform 0.3s ease;
    }

    .dashboard-text {
      letter-spacing: 0.01em;
    }

    .dashboard-button:hover {
      transform: translateY(-3px);
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.4);
    }

    .dashboard-button:hover .dashboard-icon {
      transform: scale(1.1) rotate(-5deg);
    }

    .dashboard-button:active {
      transform: translateY(-1px);
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.3);
    }

    .loading-state, .error-state {
      text-align: center;
      padding: 3rem 1rem;
    }

    .loading-state ion-spinner {
      margin-bottom: 1rem;
    }

    .error-icon {
      font-size: 4rem;
      color: var(--ion-color-medium);
      margin-bottom: 1rem;
    }

    .app-header-card {
      margin-bottom: 1rem;
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.15);
      border: 1px solid rgba(102, 126, 234, 0.1);
      animation: fadeInUp 0.5s ease-out;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      overflow: hidden;
      position: relative;
    }

    .app-header-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: -100%;
      width: 100%;
      height: 100%;
      background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.1), transparent);
      transition: left 0.5s;
    }

    .app-header-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(102, 126, 234, 0.2);
    }

    .app-header-card:hover::before {
      left: 100%;
    }

    .header-content {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
    }

    .app-number {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
      background: linear-gradient(135deg, #667eea, #764ba2);
      -webkit-background-clip: text;
      -webkit-text-fill-color: transparent;
      background-clip: text;
    }

    .product-name {
      margin: 0;
      color: var(--ion-color-medium);
      font-size: 0.9rem;
      font-weight: 500;
    }

    .app-details {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
      margin-top: 1rem;
      padding-top: 1rem;
      border-top: 1px solid var(--ion-border-color, rgba(0, 0, 0, 0.1));
    }

    .detail-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.65rem;
      background: var(--ion-color-light);
      border-radius: 10px;
      transition: all 0.3s ease;
    }

    .detail-item:hover {
      transform: translateX(4px);
      background: rgba(102, 126, 234, 0.08);
    }

    .detail-label {
      color: var(--ion-color-medium);
      font-size: 0.875rem;
      font-weight: 500;
    }

    .detail-value {
      font-weight: 700;
      font-size: 1rem;
      color: var(--ion-text-color);
    }

    .timeline-card {
      margin-bottom: 1rem;
      border-radius: 16px;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      animation: fadeInUp 0.5s ease-out 0.2s backwards;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .timeline-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.12);
    }

    .timeline-title {
      font-size: 1.1rem;
      font-weight: 700;
      color: var(--ion-text-color);
    }

    .timeline {
      position: relative;
      padding-left: 2.5rem;
    }

    .timeline::before {
      content: '';
      position: absolute;
      left: 1.25rem;
      top: 0;
      bottom: 0;
      width: 3px;
      background: linear-gradient(to bottom, var(--ion-color-light) 0%, rgba(102, 126, 234, 0.1) 100%);
      border-radius: 2px;
    }

    .timeline-step {
      position: relative;
      margin-bottom: 2rem;
      animation: slideInRight 0.5s ease-out backwards;
    }

    .timeline-step:nth-child(1) { animation-delay: 0.3s; }
    .timeline-step:nth-child(2) { animation-delay: 0.4s; }
    .timeline-step:nth-child(3) { animation-delay: 0.5s; }
    .timeline-step:nth-child(4) { animation-delay: 0.6s; }

    .timeline-step:last-child {
      margin-bottom: 0;
    }

    .step-icon {
      position: absolute;
      left: -2.5rem;
      width: 2.5rem;
      height: 2.5rem;
      border-radius: 50%;
      background: var(--ion-color-light);
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 1;
      border: 3px solid var(--ion-card-background);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
      transition: all 0.3s ease;
    }

    .step-icon ion-icon {
      font-size: 1.25rem;
      color: var(--ion-color-medium);
      transition: all 0.3s ease;
    }

    .timeline-step.completed .step-icon {
      background: linear-gradient(135deg, #10b981, #059669);
      animation: scaleIn 0.4s ease-out;
    }

    .timeline-step.completed .step-icon ion-icon {
      color: white;
    }

    .timeline-step.current .step-icon {
      background: linear-gradient(135deg, #667eea, #764ba2);
      animation: progressPulse 2s infinite;
    }

    .timeline-step.current .step-icon ion-icon {
      color: white;
      animation: pulse 1.5s infinite;
    }

    .timeline-step.rejected .step-icon {
      background: linear-gradient(135deg, #ef4444, #dc2626);
    }

    .timeline-step.rejected .step-icon ion-icon {
      color: white;
    }

    .timeline-step:hover .step-icon {
      transform: scale(1.1) rotate(5deg);
    }

    .step-content {
      padding-left: 0.75rem;
      transition: all 0.3s ease;
    }

    .timeline-step:hover .step-content {
      transform: translateX(4px);
    }

    .step-title {
      font-size: 1rem;
      font-weight: 700;
      margin: 0 0 0.35rem 0;
      color: var(--ion-text-color);
    }

    .step-date {
      font-size: 0.8125rem;
      color: var(--ion-color-step-600, #64748b);
      margin: 0;
      font-weight: 500;
    }

    .step-status {
      font-size: 0.85rem;
      color: var(--ion-color-primary);
      margin: 0.25rem 0 0 0;
      font-weight: 500;
    }

    .step-status.pending {
      color: var(--ion-color-medium);
    }

    .action-buttons {
      margin-top: 1rem;
      animation: fadeInUp 0.5s ease-out 0.7s backwards;
    }

    .info-message {
      padding: 1rem;
      border-radius: 14px;
      display: flex;
      align-items: flex-start;
      gap: 0.85rem;
      margin-bottom: 1rem;
      border: 1.5px solid transparent;
      transition: all 0.3s ease;
      animation: scaleIn 0.4s ease-out;
    }

    .info-message:hover {
      transform: translateY(-2px);
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
    }

    .info-message ion-icon {
      font-size: 1.75rem;
      flex-shrink: 0;
    }

    .info-message p {
      margin: 0;
      flex: 1;
      font-size: 0.9375rem;
      line-height: 1.5;
      font-weight: 500;
    }

    .info-message.success {
      background: rgba(16, 185, 129, 0.1);
      color: #10b981;
      border-color: rgba(16, 185, 129, 0.2);
    }

    .info-message.warning {
      background: rgba(245, 158, 11, 0.1);
      color: #f59e0b;
      border-color: rgba(245, 158, 11, 0.2);
    }

    .info-message.error {
      background: rgba(239, 68, 68, 0.1);
      color: #ef4444;
      border-color: rgba(239, 68, 68, 0.2);
    }

    ion-button {
      --border-radius: 12px;
      font-weight: 600;
      text-transform: none;
      letter-spacing: -0.01em;
      transition: all 0.3s ease;
    }

    ion-button:hover {
      transform: translateY(-2px);
    }

    ion-button:active {
      transform: translateY(0);
    }

    body.dark .info-message.success {
      background: rgba(16, 185, 129, 0.2);
    }

    body.dark .info-message.warning {
      background: rgba(245, 158, 11, 0.2);
    }

    body.dark .info-message.error {
      background: rgba(239, 68, 68, 0.2);
    }
  `]
})
export class ApplicationTimelinePage implements OnInit {
  loading = signal(false);
  application = signal<ApplicationTimeline | null>(null);
  timelineSteps = signal<TimelineStep[]>([]);

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private location: Location,
    private apiService: ApiService,
    public themeService: ThemeService,
    private toastController: ToastController
  ) {
    addIcons({
      arrowBackOutline,
      checkmarkCircleOutline,
      timeOutline,
      documentTextOutline,
      cashOutline,
      moonOutline,
      sunnyOutline
    });
  }

  ngOnInit() {
    const applicationId = this.route.snapshot.paramMap.get('id');
    if (applicationId) {
      this.loadApplication(applicationId);
    }
  }

  async loadApplication(id: string) {
    this.loading.set(true);
    try {
      // Fetch application details from API
      const response = await this.apiService.getApplicationDetails(id).toPromise();
      const app = response?.data || response;

      this.application.set({
        id: app.id,
        applicationNumber: app.application_number || app.applicationNumber || `APP-${app.id}`,
        status: app.status,
        requestedAmount: app.requested_amount || app.requestedAmount,
        requestedTerm: app.requested_term_days || app.requestedTermDays || 30,
        productName: app.productName || app.product_name || 'Loan Product',
        createdAt: app.created_at || app.createdAt,
        reviewedAt: app.reviewed_at || app.reviewedAt,
        approvedAt: app.approved_at || app.approvedAt,
        disbursedAt: app.disbursed_at || app.disbursedAt,
        rejectedAt: app.rejected_at || app.rejectedAt
      });

      this.buildTimeline();
    } catch (error) {
      console.error('Failed to load application:', error);
      const toast = await this.toastController.create({
        message: 'Failed to load application details',
        duration: 3000,
        color: 'danger',
        position: 'bottom'
      });
      await toast.present();
    } finally {
      this.loading.set(false);
    }
  }

  buildTimeline() {
    const app = this.application();
    if (!app) return;

    const status = app.status.toLowerCase();
    const steps: TimelineStep[] = [];

    // Step 1: Submitted
    steps.push({
      title: 'Application Submitted',
      status: 'completed',
      date: this.formatDate(app.createdAt),
      icon: 'document-text-outline'
    });

    // Step 2: Under Review
    if (status === 'submitted' || status === 'pending') {
      steps.push({
        title: 'Under Review',
        status: 'current',
        icon: 'time-outline'
      });
      steps.push({
        title: 'Approval Decision',
        status: 'pending',
        icon: 'checkmark-circle-outline'
      });
      steps.push({
        title: 'Disbursement',
        status: 'pending',
        icon: 'cash-outline'
      });
    } else if (status === 'approved') {
      steps.push({
        title: 'Under Review',
        status: 'completed',
        date: app.reviewedAt ? this.formatDate(app.reviewedAt) : undefined,
        icon: 'time-outline'
      });
      steps.push({
        title: 'Approved',
        status: 'completed',
        date: app.approvedAt ? this.formatDate(app.approvedAt) : undefined,
        icon: 'checkmark-circle-outline'
      });
      steps.push({
        title: 'Awaiting Disbursement',
        status: 'current',
        icon: 'cash-outline'
      });
    } else if (status === 'disbursed' || status === 'active') {
      steps.push({
        title: 'Under Review',
        status: 'completed',
        date: app.reviewedAt ? this.formatDate(app.reviewedAt) : undefined,
        icon: 'time-outline'
      });
      steps.push({
        title: 'Approved',
        status: 'completed',
        date: app.approvedAt ? this.formatDate(app.approvedAt) : undefined,
        icon: 'checkmark-circle-outline'
      });
      steps.push({
        title: 'Disbursed',
        status: 'completed',
        date: app.disbursedAt ? this.formatDate(app.disbursedAt) : undefined,
        icon: 'cash-outline'
      });
    } else if (status === 'rejected') {
      steps.push({
        title: 'Under Review',
        status: 'completed',
        date: app.reviewedAt ? this.formatDate(app.reviewedAt) : undefined,
        icon: 'time-outline'
      });
      steps.push({
        title: 'Application Rejected',
        status: 'rejected',
        date: app.rejectedAt ? this.formatDate(app.rejectedAt) : undefined,
        icon: 'close-circle-outline'
      });
    }

    this.timelineSteps.set(steps);
  }

  formatDate(dateStr: string): string {
    if (!dateStr) return '';
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric',
      hour: 'numeric',
      minute: '2-digit'
    });
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'submitted':
      case 'pending':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'danger';
      default:
        return 'medium';
    }
  }

  formatStatus(status: string): string {
    switch (status.toLowerCase()) {
      case 'submitted':
        return 'Submitted';
      case 'pending':
        return 'Pending Review';
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'disbursed':
        return 'Disbursed';
      default:
        return status;
    }
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  goBack() {
    this.location.back();
  }

  applyAgain() {
    this.router.navigate(['/customer/apply']);
  }
}
