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

    /* Timeline Container with safe area padding */
    .timeline-container {
      padding-top: calc(56px + env(safe-area-inset-top) + 0.85rem);
      padding-bottom: calc(60px + env(safe-area-inset-bottom) + 0.85rem);
      padding-left: 1rem;
      padding-right: 1rem;
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
    }

    .product-name {
      margin: 0;
      color: var(--ion-color-medium);
      font-size: 0.9rem;
    }

    .app-details {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      margin-top: 1rem;
    }

    .detail-item {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .detail-label {
      color: var(--ion-color-medium);
      font-size: 0.9rem;
    }

    .detail-value {
      font-weight: 600;
      font-size: 1rem;
    }

    .timeline-card {
      margin-bottom: 1rem;
    }

    .timeline-title {
      font-size: 1.1rem;
      font-weight: 700;
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
      width: 2px;
      background: var(--ion-color-light);
    }

    .timeline-step {
      position: relative;
      margin-bottom: 2rem;
    }

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
    }

    .step-icon ion-icon {
      font-size: 1.25rem;
      color: var(--ion-color-medium);
    }

    .timeline-step.completed .step-icon {
      background: var(--ion-color-success);
    }

    .timeline-step.completed .step-icon ion-icon {
      color: white;
    }

    .timeline-step.current .step-icon {
      background: var(--ion-color-primary);
    }

    .timeline-step.current .step-icon ion-icon {
      color: white;
    }

    .timeline-step.rejected .step-icon {
      background: var(--ion-color-danger);
    }

    .timeline-step.rejected .step-icon ion-icon {
      color: white;
    }

    .step-content {
      padding-left: 0.5rem;
    }

    .step-title {
      font-size: 1rem;
      font-weight: 600;
      margin: 0 0 0.25rem 0;
    }

    .step-date {
      font-size: 0.85rem;
      color: var(--ion-color-medium);
      margin: 0;
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
    }

    .info-message {
      padding: 1rem;
      border-radius: 12px;
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }

    .info-message ion-icon {
      font-size: 1.5rem;
      flex-shrink: 0;
    }

    .info-message p {
      margin: 0;
      flex: 1;
      font-size: 0.9rem;
      line-height: 1.4;
    }

    .info-message.success {
      background: rgba(16, 185, 129, 0.1);
      color: var(--ion-color-success);
    }

    .info-message.warning {
      background: rgba(245, 158, 11, 0.1);
      color: var(--ion-color-warning);
    }

    .info-message.error {
      background: rgba(239, 68, 68, 0.1);
      color: var(--ion-color-danger);
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
