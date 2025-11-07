// Collector Applications Page - Approve/Reject Applications
import { Component, OnInit, signal, inject, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonItem,
  IonLabel,
  IonBadge,
  IonButton,
  IonIcon,
  IonSkeletonText,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonModal,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonInput,
  IonTextarea,
  IonSelect,
  IonSelectOption,
  ToastController,
  AlertController,
  ModalController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  documentTextOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  alertCircleOutline,
  personOutline,
  calendarOutline,
  cashOutline,
  timeOutline,
  arrowBackOutline,
  refreshOutline,
} from 'ionicons/icons';
import { 
  CollectorService, 
  CollectorApplication,
  ApproveApplicationDto,
  RejectApplicationDto,
} from '../../core/services/collector.service';
import { AuthService } from '../../core/services/auth.service';
import { LoanCalculationResult, LoanCalculationPreview, LoanCalculationRequest } from '../../core/models/loan-calculation.model';
import { CollectorTopBarComponent } from '../../shared/components/collector-top-bar.component';

@Component({
  selector: 'app-collector-applications',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonItem,
    IonLabel,
    IonButton,
    IonIcon,
    IonSkeletonText,
    IonModal,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonTextarea,
    IonSelect,
    IonSelectOption,
    CollectorTopBarComponent
  ],
  template: `
    <ion-content [fullscreen]="true" class="main-content">
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <app-collector-top-bar
        emoji="📄"
        title="Pending Applications"
        subtitle="Review and approve requests"
      />

      <!-- Content Container with Padding -->
      <div class="applications-container">

      <!-- Loading Skeleton -->
      @if (loading()) {
        <div class="space-y-4">
          @for (i of [1,2,3]; track i) {
            <ion-skeleton-text animated class="h-32 rounded-lg"></ion-skeleton-text>
          }
        </div>
      }

      <!-- Empty State -->
      @if (!loading() && applications().length === 0) {
        <div class="empty-state">
          <div class="empty-pill">
            <span class="empty-emoji">🎯</span>
          </div>
          <h2 class="empty-title">No Pending Applications</h2>
          <p class="empty-subtitle">
            You're all caught up. We'll let you know the moment a new request needs your review.
          </p>
          <div class="empty-hint">
            <ion-icon [icon]="'time-outline'"></ion-icon>
            <span>Pull down anytime or tap below to check for updates.</span>
          </div>
          <div class="empty-actions">
            <ion-button
              size="small"
              shape="round"
              class="empty-refresh-button"
              (click)="refreshApplications()"
              [disabled]="loading()"
            >
              <ion-icon slot="start" [icon]="'refresh-outline'"></ion-icon>
              Check for updates
            </ion-button>
          </div>
        </div>
      }

      <!-- Applications List -->
      @if (!loading() && applications().length > 0) {
        <div class="applications-list">
          @for (app of applications(); track app.id) {
            <div 
              class="application-card" 
              [class.expanded]="selectedApp()?.id === app.id && showApproveModal()"
              (click)="toggleCard(app)"
            >
              <!-- Card Header -->
              <div class="card-header">
                <div class="customer-info">
                  <div class="customer-name">{{ getCustomerName(app) }}</div>
                  <div class="application-number">{{ app.applicationNumber }}</div>
                </div>
                <div class="status-badge" [attr.data-status]="app.status.toLowerCase()">
                  {{ app.status }}
                </div>
              </div>

              <!-- Loan Details Summary -->
              <div class="loan-summary">
                <div class="summary-row">
                  <span class="summary-label">💼 Product</span>
                  <span class="summary-value">{{ getProductName(app) }}</span>
                </div>
                <div class="summary-divider"></div>
                
                <div class="summary-row">
                  <span class="summary-label">💰 Amount</span>
                  <span class="summary-value amount">₱{{ formatAmount(app.requestedAmount) }}</span>
                </div>
                <div class="summary-divider"></div>
                
                <div class="summary-row">
                  <span class="summary-label">📅 Term</span>
                  <span class="summary-value">{{ app.requestedTermDays }} days</span>
                </div>
                <div class="summary-divider"></div>
                
                <div class="summary-row">
                  <span class="summary-label">⏰ Submitted</span>
                  <span class="summary-value">{{ formatDateWithYear(app.submittedAt || app.createdAt || '') }}</span>
                </div>
              </div>

              <!-- Expandable Breakdown (shows when View is clicked) -->
              @if (selectedApp()?.id === app.id && showApproveModal() && calculation()) {
                <div class="breakdown-section">
                  <div class="breakdown-title">💰 Loan Breakdown</div>
                  
                  <div class="loan-summary">
                    <div class="summary-row">
                      <span class="summary-label">Principal</span>
                      <span class="summary-value">₱{{ calculation()!.loanAmount.toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2}) }}</span>
                    </div>
                    <div class="summary-divider"></div>
                    
                    <div class="summary-row">
                      <span class="summary-label">
                        Interest ({{ approveForm.approvedInterestRate | number:'1.0-2' }}%)
                      </span>
                      <span class="summary-value highlight-orange">₱{{ calculation()!.interestAmount.toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2}) }}</span>
                    </div>
                    <div class="summary-divider"></div>
                    
                    <div class="summary-row">
                      <span class="summary-label">
                        Processing Fee ({{ productProcessingFeePercent | number:'1.0-2' }}%)
                      </span>
                      <span class="summary-value">₱{{ calculation()!.processingFeeAmount.toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2}) }}</span>
                    </div>
                    <div class="summary-divider"></div>
                    
                    @if (calculation()!.platformFee > 0) {
                      <div class="summary-row">
                        <span class="summary-label">
                          Platform Fee (₱{{ productPlatformFee | number:'1.0-2' }}/month)
                        </span>
                        <span class="summary-value">₱{{ calculation()!.platformFee.toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2}) }}</span>
                      </div>
                      <div class="summary-divider"></div>
                    }
                    
                    <div class="summary-row">
                      <span class="summary-label">Net Proceeds</span>
                      <span class="summary-value amount">₱{{ calculation()!.netProceeds.toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2}) }}</span>
                    </div>
                    <div class="summary-divider"></div>
                    
                    <div class="summary-row">
                      <span class="summary-label">Total Repayment</span>
                      <span class="summary-value highlight-green">₱{{ calculation()!.totalRepayable.toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2}) }}</span>
                    </div>
                    <div class="summary-divider"></div>
                    
                    <div class="summary-row">
                      <span class="summary-label">Installments</span>
                      <span class="summary-value">{{ calculation()!.numPayments }} payments</span>
                    </div>
                    <div class="summary-divider"></div>
                    
                    <div class="summary-row highlight-row">
                      <span class="summary-label">Per Installment</span>
                      <span class="summary-value highlight-large">₱{{ calculation()!.installmentAmount.toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2}) }}</span>
                    </div>
                  </div>

                  <!-- Notes Field -->
                  <div class="notes-field">
                    <ion-textarea 
                      [(ngModel)]="approveForm.notes"
                      rows="2"
                      placeholder="Add notes (optional)...">
                    </ion-textarea>
                  </div>

                  <!-- Approve/Reject in expanded state -->
                  <div class="expanded-actions" (click)="$event.stopPropagation()">
                    <button class="action-btn approve" (click)="confirmApprove()">
                      <ion-icon [icon]="'checkmark-circle-outline'"></ion-icon>
                      <span>Approve</span>
                    </button>
                    <button class="action-btn reject" (click)="openRejectModal(app)">
                      <ion-icon [icon]="'close-circle-outline'"></ion-icon>
                      <span>Reject</span>
                    </button>
                    <button class="action-btn back" (click)="closeApproveModal()">
                      <ion-icon [icon]="'arrow-back-outline'"></ion-icon>
                      <span>Close</span>
                    </button>
                  </div>
                </div>
              }

              <!-- Action Buttons (collapsed state) -->
              @if (selectedApp()?.id !== app.id || !showApproveModal()) {
                <div class="action-buttons" (click)="$event.stopPropagation()">
                  <button class="action-btn reject" (click)="openRejectModal(app)">
                    <ion-icon [icon]="'close-circle-outline'"></ion-icon>
                    <span>Reject</span>
                  </button>
                  <button class="action-btn review" (click)="requestReview(app)">
                    <ion-icon [icon]="'alert-circle-outline'"></ion-icon>
                    <span>Review</span>
                  </button>
                </div>
              }
            </div>
          }
        </div>
      }

      </div><!-- Close applications-container -->

      <!-- Reject Modal -->
      <ion-modal [isOpen]="showRejectModal()" (didDismiss)="closeRejectModal()">
        <ng-template>
          <ion-header>
            <ion-toolbar>
              <ion-title>Reject Application</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="closeRejectModal()">Close</ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content class="ion-padding">
            @if (selectedApp()) {
              <div class="space-y-4">
                <!-- Customer Info -->
                <div class="bg-red-50 p-4 rounded-lg">
                  <div class="font-bold text-lg">{{ getCustomerName(selectedApp()!) }}</div>
                  <div class="text-sm text-gray-600">{{ selectedApp()!.applicationNumber }}</div>
                </div>

                <!-- Rejection Form -->
                <ion-item>
                  <ion-label position="stacked">Rejection Reason *</ion-label>
                  <ion-select [(ngModel)]="rejectForm.rejectionReason" placeholder="Select reason">
                    <ion-select-option value="Insufficient credit score">Insufficient credit score</ion-select-option>
                    <ion-select-option value="Incomplete documentation">Incomplete documentation</ion-select-option>
                    <ion-select-option value="High debt-to-income ratio">High debt-to-income ratio</ion-select-option>
                    <ion-select-option value="Negative credit history">Negative credit history</ion-select-option>
                    <ion-select-option value="Unable to verify information">Unable to verify information</ion-select-option>
                    <ion-select-option value="Other">Other</ion-select-option>
                  </ion-select>
                </ion-item>

                <ion-item>
                  <ion-label position="stacked">Additional Notes (Optional)</ion-label>
                  <ion-textarea 
                    [(ngModel)]="rejectForm.notes"
                    rows="4"
                    placeholder="Provide additional details...">
                  </ion-textarea>
                </ion-item>

                <!-- Action Buttons -->
                <div class="flex gap-2">
                  <ion-button 
                    expand="block" 
                    color="danger" 
                    [disabled]="!rejectForm.rejectionReason"
                    (click)="confirmReject()">
                    <ion-icon slot="start" [icon]="'close-circle-outline'"></ion-icon>
                    Confirm Rejection
                  </ion-button>
                  <ion-button expand="block" fill="outline" (click)="closeRejectModal()">
                    Cancel
                  </ion-button>
                </div>
              </div>
            }
          </ion-content>
        </ng-template>
      </ion-modal>
    </ion-content>
  `,
  styles: [`
    /* Main Content */
    .main-content {
      --background: #f8fafc;
    }

    /* Container */
    .applications-container {
      padding: calc(84px + env(safe-area-inset-top) + 0.85rem) 0.85rem calc(72px + env(safe-area-inset-bottom) + 0.85rem) 0.85rem;
    }

    .empty-state {
      position: relative;
      overflow: hidden;
      margin-top: 2.5rem;
      padding: 2.25rem 1.75rem;
      border-radius: 18px;
      background: linear-gradient(145deg, rgba(37, 99, 235, 0.16) 0%, rgba(236, 72, 153, 0.12) 45%, #ffffff 100%);
      border: 1px solid rgba(148, 163, 184, 0.18);
      box-shadow: 0 18px 38px rgba(15, 23, 42, 0.08);
      text-align: center;
      color: #0f172a;
    }

    .empty-state::before,
    .empty-state::after {
      content: '';
      position: absolute;
      border-radius: 50%;
      filter: blur(0);
      opacity: 0.45;
    }

    .empty-state::before {
      width: 180px;
      height: 180px;
      top: -70px;
      right: -40px;
      background: rgba(59, 130, 246, 0.22);
    }

    .empty-state::after {
      width: 140px;
      height: 140px;
      bottom: -60px;
      left: -30px;
      background: rgba(14, 165, 233, 0.18);
    }

    .empty-pill {
      position: relative;
      z-index: 1;
      width: 70px;
      height: 70px;
      margin: 0 auto 1.25rem;
      display: flex;
      align-items: center;
      justify-content: center;
      border-radius: 18px;
      background: rgba(255, 255, 255, 0.6);
      box-shadow: 0 12px 25px rgba(37, 99, 235, 0.2);
      backdrop-filter: blur(10px);
    }

    .empty-emoji {
      font-size: 2rem;
      line-height: 1;
    }

    .empty-title {
      position: relative;
      z-index: 1;
      font-size: 1.4rem;
      font-weight: 700;
      color: #0f172a;
      margin-bottom: 0.5rem;
    }

    .empty-subtitle {
      position: relative;
      z-index: 1;
      font-size: 0.95rem;
      color: #475569;
      margin: 0 auto 1.5rem;
      max-width: 18rem;
      line-height: 1.5;
    }

    .empty-hint {
      position: relative;
      z-index: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-size: 0.85rem;
      color: #1e293b;
      font-weight: 600;
    }

    .empty-hint ion-icon {
      font-size: 1rem;
      color: #2563eb;
    }

    .empty-actions {
      position: relative;
      z-index: 1;
      margin-top: 1.75rem;
      display: flex;
      justify-content: center;
    }

    .empty-refresh-button {
      --background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
      --background-activated: linear-gradient(135deg, #1d4ed8 0%, #1e40af 100%);
      --border-radius: 999px;
      --padding-start: 1.25rem;
      --padding-end: 1.25rem;
      --box-shadow: 0 12px 25px rgba(37, 99, 235, 0.25);
      font-weight: 600;
      letter-spacing: 0.02em;
    }

    /* Applications List */
    .applications-list {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    /* Modern Compact Application Card */
    .application-card {
      background: white;
      border-radius: 14px;
      padding: 1rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
      position: relative;
      overflow: hidden;
    }

    .application-card:hover {
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
      transform: translateY(-2px);
    }

    .application-card:active {
      transform: scale(0.98);
      box-shadow: 0 1px 4px rgba(0, 0, 0, 0.1);
    }

    .application-card.expanded {
      box-shadow: 0 8px 24px rgba(59, 130, 246, 0.15);
      border: 2px solid rgba(59, 130, 246, 0.2);
    }

    .application-card::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      height: 3px;
      background: linear-gradient(90deg, #3b82f6, #8b5cf6);
      transform: scaleX(0);
      transform-origin: left;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .application-card.expanded::before {
      transform: scaleX(1);
    }

    /* Card Header */
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 1rem;
      gap: 0.75rem;
    }

    .customer-info {
      flex: 1;
      min-width: 0;
    }

    .customer-name {
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
      line-height: 1.3;
      margin-bottom: 0.25rem;
    }

    .application-number {
      font-size: 0.75rem;
      color: #64748b;
      font-weight: 500;
    }

    /* Status Badge */
    .status-badge {
      padding: 0.35rem 0.75rem;
      border-radius: 12px;
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.03em;
      white-space: nowrap;
    }

    .status-badge[data-status="submitted"] {
      background: #dbeafe;
      color: #1e40af;
    }

    .status-badge[data-status="under_review"] {
      background: #fef3c7;
      color: #92400e;
    }

    .status-badge[data-status="approved"] {
      background: #dcfce7;
      color: #166534;
    }

    .status-badge[data-status="rejected"] {
      background: #fee2e2;
      color: #991b1b;
    }

    /* Loan Summary - Clean Compact Style */
    .loan-summary {
      margin-bottom: 1rem;
      padding: 0.5rem 0;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      gap: 1rem;
    }

    .summary-label {
      font-size: 0.8rem;
      color: #64748b;
      font-weight: 500;
      flex-shrink: 0;
    }

    .summary-value {
      font-size: 0.875rem;
      color: #1e293b;
      font-weight: 600;
      text-align: right;
    }

    .summary-value.amount {
      color: #2563eb;
      font-size: 0.95rem;
    }

    .summary-divider {
      height: 1px;
      background: #e2e8f0;
      margin: 0 0.25rem;
    }

    /* Calculation Summary (used in approve modal) */
    .calculation-summary {
      background: #f8fafc;
      border-radius: 12px;
      padding: 1rem;
      margin: 1rem 0;
    }

    .summary-title {
      font-size: 0.875rem;
      font-weight: 700;
      color: #1e293b;
      margin-bottom: 0.75rem;
      padding-bottom: 0.5rem;
      border-bottom: 2px solid #e2e8f0;
    }

    .highlight-row {
      background: #eff6ff;
      padding: 0.65rem 0.5rem;
      margin: 0.25rem -0.5rem;
      border-radius: 8px;
    }

    .highlight-orange {
      color: #ea580c !important;
    }

    .highlight-green {
      color: #16a34a !important;
    }

    .highlight-large {
      font-size: 1.05rem !important;
      font-weight: 700 !important;
      color: #2563eb !important;
    }

    /* Action Buttons */
    .action-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .action-btn {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.35rem;
      padding: 0.5rem 0.5rem;
      border: none;
      border-radius: 10px;
      font-size: 0.7rem;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.2s ease;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.08);
    }

    .action-btn:active {
      transform: scale(0.95);
    }

    .action-btn ion-icon {
      font-size: 0.95rem;
    }

    .action-btn span {
      white-space: nowrap;
    }

    .action-btn.approve {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
    }

    .action-btn.approve:active {
      background: linear-gradient(135deg, #059669 0%, #047857 100%);
    }

    .action-btn.view {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      color: white;
    }

    /* Breakdown Section Styles */
    .breakdown-section {
      margin-top: 0.85rem;
      padding-top: 0.85rem;
      border-top: 1px solid rgba(0, 0, 0, 0.08);
      animation: expandDown 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    @keyframes expandDown {
      from {
        opacity: 0;
        transform: translateY(-10px);
        max-height: 0;
      }
      to {
        opacity: 1;
        transform: translateY(0);
        max-height: 2000px;
      }
    }

    .breakdown-title {
      font-size: 0.85rem;
      font-weight: 600;
      color: #1f2937;
      margin-bottom: 0.75rem;
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .breakdown-title ion-icon {
      font-size: 1rem;
      color: #3b82f6;
    }

    .notes-field {
      margin-top: 0.85rem;
      padding: 0.65rem;
      background: #f9fafb;
      border-radius: 8px;
      border: 1px solid rgba(0, 0, 0, 0.08);
    }

    .notes-field ion-label {
      font-size: 0.75rem;
      font-weight: 600;
      color: #6b7280;
      margin-bottom: 0.4rem;
      display: block;
    }

    .notes-field ion-textarea {
      --background: white;
      --padding-start: 0.65rem;
      --padding-end: 0.65rem;
      --padding-top: 0.5rem;
      --padding-bottom: 0.5rem;
      border-radius: 6px;
      border: 1px solid rgba(0, 0, 0, 0.08);
      font-size: 0.8rem;
    }

    .expanded-actions {
      display: flex;
      gap: 0.6rem;
      margin-top: 0.85rem;
      padding-top: 0.85rem;
      border-top: 1px solid rgba(0, 0, 0, 0.08);
    }

    .expanded-actions .action-btn {
      flex: 1;
    }

    .action-btn.view:active {
      background: linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%);
    }

    .action-btn.reject {
      background: linear-gradient(135deg, #ef4444 0%, #dc2626 100%);
      color: white;
    }

    .action-btn.reject:active {
      background: linear-gradient(135deg, #dc2626 0%, #b91c1c 100%);
    }

    .action-btn.review {
      background: linear-gradient(135deg, #f59e0b 0%, #d97706 100%);
      color: white;
    }

    .action-btn.review:active {
      background: linear-gradient(135deg, #d97706 0%, #b45309 100%);
    }

    /* Approve Form View Styles */
    .approve-form-view {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .customer-header-card {
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      padding: 1.25rem;
      border-radius: 14px;
      color: white;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.25);
    }

    .customer-header-card .customer-name {
      font-size: 1.25rem;
      font-weight: 700;
      margin-bottom: 0.25rem;
    }

    .customer-header-card .application-number {
      font-size: 0.85rem;
      opacity: 0.9;
    }

    .details-card {
      background: white;
      border-radius: 14px;
      padding: 1rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .form-section {
      background: white;
      border-radius: 14px;
      padding: 1rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .form-section-title {
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 1rem;
    }

    .form-item {
      --background: #f8fafc;
      --border-radius: 10px;
      --padding-start: 0.75rem;
      --padding-end: 0.75rem;
      margin-bottom: 0.75rem;
      border-radius: 10px;
    }

    .calculation-card {
      background: white;
      border-radius: 14px;
      padding: 1rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.06);
    }

    .calculation-title {
      font-size: 1rem;
      font-weight: 600;
      color: #1e293b;
      margin-bottom: 1rem;
    }

    .warning-card {
      display: flex;
      align-items: flex-start;
      gap: 0.75rem;
      background: #fff7ed;
      border-left: 4px solid #f59e0b;
      padding: 1rem;
      border-radius: 10px;
    }

    .warning-icon {
      font-size: 1.5rem;
      color: #f59e0b;
      flex-shrink: 0;
    }

    .warning-text {
      font-size: 0.85rem;
      color: #92400e;
      line-height: 1.5;
    }

    .action-buttons-fixed {
      display: flex;
      gap: 0.5rem;
      margin-top: 1rem;
    }

    .action-btn.large {
      flex: 1;
      padding: 0.65rem 0.75rem;
      font-size: 0.8rem;
    }

    .action-btn.large ion-icon {
      font-size: 1rem;
    }

    .action-btn.cancel {
      background: white;
      color: #64748b;
      border: 2px solid #e2e8f0;
    }

    .action-btn.cancel:active {
      background: #f8fafc;
    }

    .action-btn.back {
      background: white;
      color: #64748b;
      border: 2px solid #e2e8f0;
    }

    .action-btn.back:active {
      background: #f8fafc;
    }

    .summary-value.highlight-orange {
      color: #f59e0b;
    }

    .summary-value.highlight-green {
      color: #10b981;
      font-weight: 700;
    }

    .summary-row.highlight-row {
      background: #eff6ff;
      padding: 0.75rem 0.5rem;
      margin: 0 -0.5rem;
      border-radius: 8px;
    }

    .summary-value.highlight-large {
      font-size: 1.1rem;
      color: #2563eb;
      font-weight: 700;
    }

    /* Empty State */
    .flex {
      display: flex;
    }

    .flex-col {
      flex-direction: column;
    }

    .items-center {
      align-items: center;
    }

    .justify-center {
      justify-content: center;
    }

    .text-center {
      text-align: center;
    }

    .h-full {
      height: 100%;
    }

    .p-8 {
      padding: 2rem;
    }

    .text-6xl {
      font-size: 3.75rem;
    }

    .text-xl {
      font-size: 1.25rem;
    }

    .text-gray-400 {
      color: #9ca3af;
    }

    .text-gray-500 {
      color: #6b7280;
    }

    .text-gray-700 {
      color: #374151;
    }

    .font-bold {
      font-weight: 700;
    }

    .mb-2 {
      margin-bottom: 0.5rem;
    }

    .mb-4 {
      margin-bottom: 1rem;
    }

    /* Skeleton Loading */
    .space-y-4 > * + * {
      margin-top: 1rem;
    }

    .h-32 {
      height: 8rem;
    }

    .rounded-lg {
      border-radius: 0.85rem;
    }
  `],
})
export class CollectorApplicationsPage implements OnInit, OnDestroy {
  private collectorService = inject(CollectorService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);

  loading = signal(true);
  applications = signal<CollectorApplication[]>([]);
  collectorId = signal<number>(0);

  // Modal states
  showApproveModal = signal(false);
  showRejectModal = signal(false);
  selectedApp = signal<CollectorApplication | null>(null);

  // Form models
  approveForm: ApproveApplicationDto = {
    approvedAmount: 0,
    approvedTermDays: 0,
    approvedInterestRate: 0,
    interestType: 'flat',
    notes: '',
  };

  rejectForm: RejectApplicationDto = {
    rejectionReason: '',
    notes: '',
  };

  // Loan calculation
  calculation = signal<LoanCalculationResult | null>(null);
  calculationLoading = signal(false);
  calculationError = signal<string | null>(null);
  private calculationTimer: any = null;

  productProcessingFeePercent = 0;
  productPlatformFee = 0;
  productPaymentFrequency: 'daily' | 'weekly' | 'biweekly' | 'monthly' = 'daily';
  productInterestType: 'flat' | 'reducing' | 'compound' = 'flat';

  constructor() {
    addIcons({
      documentTextOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      alertCircleOutline,
      personOutline,
      calendarOutline,
      cashOutline,
      timeOutline,
      arrowBackOutline,
      refreshOutline,
    });
  }

  ngOnInit() {
    const user = this.authService.currentUser();
    if (user) {
      this.collectorId.set(Number(user.id));
      this.loadApplications();
    }
  }

  ngOnDestroy() {
    if (this.calculationTimer) {
      clearTimeout(this.calculationTimer);
      this.calculationTimer = null;
    }
  }

  async loadApplications() {
    this.loading.set(true);
    try {
      const apps = await this.collectorService.getPendingApplications(this.collectorId()).toPromise();
      console.log('🔍 Loaded applications:', apps);
      if (apps && apps.length > 0) {
        console.log('📋 First application sample:', apps[0]);
      }
      this.applications.set(apps || []);
    } catch (error: any) {
      await this.showToast(error.error?.message || 'Failed to load applications', 'danger');
    } finally {
      this.loading.set(false);
    }
  }

  async handleRefresh(event: any) {
    await this.loadApplications();
    event.target.complete();
  }

  async refreshApplications() {
    if (this.loading()) {
      return;
    }
    await this.loadApplications();
  }

  openApproveModal(app: CollectorApplication) {
    this.selectedApp.set(app);

    const requestedAmount = Math.max(0, this.resolveNumber(app, [
      'requestedAmount',
      'requested_amount',
      'approvedAmount',
      'approved_amount',
    ]) ?? 0);

    const requestedTermDays = Math.max(0, this.resolveNumber(app, [
      'requestedTermDays',
      'requested_term_days',
      'approvedTermDays',
      'approved_term_days',
    ]) ?? 0);

    const productFixedTermDays = Math.max(0, this.resolveNumber(app, [
      'productFixedTermDays',
      'product_fixed_term_days',
    ]) ?? 0);

    const productInterestRate = this.resolveNumber(app, [
      'productInterestRate',
      'product_interest_rate',
      'approvedInterestRate',
      'approved_interest_rate',
    ]);

    const resolvedProcessingFee = this.resolveNumber(app, [
      'productProcessingFeePercent',
      'product_processing_fee_percent',
    ]);
    this.productProcessingFeePercent = resolvedProcessingFee !== null ? resolvedProcessingFee : 0;

    const resolvedPlatformFee = this.resolveNumber(app, [
      'productPlatformFee',
      'product_platform_fee',
    ]);
    this.productPlatformFee = resolvedPlatformFee !== null ? resolvedPlatformFee : 0;

    const resolvedFrequency = this.resolveString(app, [
      'productPaymentFrequency',
      'product_payment_frequency',
    ]);
    this.productPaymentFrequency = this.normalizeFrequency(resolvedFrequency);

    const resolvedInterestType = this.resolveString(app, [
      'productInterestType',
      'product_interest_type',
    ]);
    this.productInterestType = this.normalizeInterestType(resolvedInterestType);

    const defaultInterestRate = productInterestRate !== null && productInterestRate > 0
      ? productInterestRate
      : 2.5;

    const effectiveTermDays = requestedTermDays > 0 ? requestedTermDays : productFixedTermDays;

    this.approveForm = {
      approvedAmount: requestedAmount,
      approvedTermDays: effectiveTermDays > 0 ? effectiveTermDays : 30,
      approvedInterestRate: defaultInterestRate,
      interestType: this.productInterestType,
      notes: '',
    };

    if (!this.approveForm.approvedInterestRate || this.approveForm.approvedInterestRate <= 0) {
      this.approveForm.approvedInterestRate = 2.5;
    }

  this.showApproveModal.set(true);
  // Calculate initial loan breakdown
  this.calculateLoan(true);
  }

  calculateLoan(immediate = false) {
    this.approveForm.interestType = this.productInterestType;

    const amount = this.approveForm.approvedAmount;
    const termDays = this.approveForm.approvedTermDays;
    const interestRate = this.approveForm.approvedInterestRate;

    if (this.calculationTimer) {
      clearTimeout(this.calculationTimer);
      this.calculationTimer = null;
    }

    const hasValidInputs = amount > 0 && termDays > 0 && interestRate > 0;

    if (!hasValidInputs) {
      this.calculation.set(null);
      return;
    }

    const execute = async () => {
      const termMonths = Math.max(1, Math.ceil(termDays / 30));
      const payload: LoanCalculationRequest = {
        loanAmount: amount,
        termMonths,
        paymentFrequency: this.productPaymentFrequency || 'monthly',
        interestRate,
        interestType: this.productInterestType,
        processingFeePercentage: Math.max(0, this.productProcessingFeePercent || 0),
        platformFee: Math.max(0, this.productPlatformFee || 0),
        latePenaltyPercentage: 0,
        disbursementDate: new Date().toISOString(),
      };

      this.calculationLoading.set(true);
      this.calculationError.set(null);

      try {
        const preview = await this.collectorService.calculateLoanPreview(payload).toPromise();
        const calculation = (preview as LoanCalculationPreview)?.calculation ?? (preview as any)?.calculation ?? (preview as any) ?? null;
        this.calculation.set(calculation);
      } catch (error: any) {
        console.error('❌ Collector loan preview error:', error);
        this.calculation.set(null);
        this.calculationError.set(error?.error?.message || 'Unable to calculate loan preview');
      } finally {
        this.calculationLoading.set(false);
      }
    };

    if (immediate) {
      execute();
    } else {
      this.calculationTimer = setTimeout(() => execute(), 500);
    }
  }

  closeApproveModal() {
    this.showApproveModal.set(false);
    this.selectedApp.set(null);
  }

  openRejectModal(app: CollectorApplication) {
    this.selectedApp.set(app);
    this.rejectForm = {
      rejectionReason: '',
      notes: '',
    };
    this.showRejectModal.set(true);
  }

  closeRejectModal() {
    this.showRejectModal.set(false);
    this.selectedApp.set(null);
  }

  isApproveFormValid(): boolean {
    return (
      this.approveForm.approvedAmount > 0 &&
      this.approveForm.approvedTermDays > 0 &&
      this.approveForm.approvedInterestRate > 0
    );
  }

  async confirmApprove() {
    if (!this.selectedApp()) return;

    const customerName = this.getCustomerName(this.selectedApp()!);

    const alert = await this.alertController.create({
      header: 'Confirm Approval',
      message: `Approve loan of ₱${this.approveForm.approvedAmount.toLocaleString()} for ${customerName}?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Approve',
          handler: async () => {
            await this.approveApplication();
          },
        },
      ],
    });

    await alert.present();
  }

  async approveApplication() {
    if (!this.selectedApp()) return;

    try {
      await this.collectorService.approveApplication(
        this.collectorId(),
        this.selectedApp()!.id,
        this.approveForm
      ).toPromise();

      await this.showToast('Application approved successfully', 'success');
      this.closeApproveModal();
      await this.loadApplications();
    } catch (error: any) {
      await this.showToast(error.error?.message || 'Failed to approve application', 'danger');
    }
  }

  async confirmReject() {
    if (!this.selectedApp()) return;

    const customerName = this.getCustomerName(this.selectedApp()!);

    const alert = await this.alertController.create({
      header: 'Confirm Rejection',
      message: `Reject application from ${customerName}?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Reject',
          role: 'destructive',
          handler: async () => {
            await this.rejectApplication();
          },
        },
      ],
    });

    await alert.present();
  }

  async rejectApplication() {
    if (!this.selectedApp()) return;

    try {
      await this.collectorService.rejectApplication(
        this.collectorId(),
        this.selectedApp()!.id,
        this.rejectForm
      ).toPromise();

      await this.showToast('Application rejected', 'success');
      this.closeRejectModal();
      await this.loadApplications();
    } catch (error: any) {
      await this.showToast(error.error?.message || 'Failed to reject application', 'danger');
    }
  }

  async requestReview(app: CollectorApplication) {
    const alert = await this.alertController.create({
      header: 'Request Manager Review',
      message: 'This application will be escalated to a manager for review.',
      inputs: [
        {
          name: 'notes',
          type: 'textarea',
          placeholder: 'Add notes for the manager...',
        },
      ],
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Submit',
          handler: async (data) => {
            try {
              await this.collectorService.requestApplicationReview(
                this.collectorId(),
                app.id,
                data.notes || 'Amount exceeds collector approval limit'
              ).toPromise();

              await this.showToast('Review request submitted', 'success');
              await this.loadApplications();
            } catch (error: any) {
              await this.showToast(error.error?.message || 'Failed to request review', 'danger');
            }
          },
        },
      ],
    });

    await alert.present();
  }

  private resolveNumber(app: CollectorApplication, keys: string[]): number | null {
    for (const key of keys) {
      const value = (app as any)[key];
      if (value === undefined || value === null) {
        continue;
      }
      const parsed = Number(value);
      if (!Number.isNaN(parsed)) {
        return parsed;
      }
    }
    return null;
  }

  private resolveString(app: CollectorApplication, keys: string[]): string | null {
    for (const key of keys) {
      const value = (app as any)[key];
      if (typeof value === 'string' && value.trim().length > 0) {
        return value;
      }
    }
    return null;
  }

  private normalizeFrequency(value: string | null): 'daily' | 'weekly' | 'biweekly' | 'monthly' {
    const normalized = (value ?? '').toLowerCase().replace(/\s+/g, '_');
    switch (normalized) {
      case 'weekly':
        return 'weekly';
      case 'biweekly':
      case 'bi-weekly':
      case 'semi_monthly':
      case 'semi-monthly':
        return 'biweekly';
      case 'monthly':
        return 'monthly';
      case 'daily':
      default:
        return 'daily';
    }
  }

  private normalizeInterestType(value: string | null): 'flat' | 'reducing' | 'compound' {
    const normalized = (value ?? '').toLowerCase();
    if (normalized === 'reducing') {
      return 'reducing';
    }
    if (normalized === 'compound') {
      return 'compound';
    }
    return 'flat';
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    } catch {
      return 'N/A';
    }
  }

  formatDateWithYear(dateString: string): string {
    if (!dateString) return 'N/A';
    try {
      const date = new Date(dateString);
      if (isNaN(date.getTime())) return 'N/A';
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    } catch {
      return 'N/A';
    }
  }

  formatAmount(amount: number): string {
    // Currency formatting: comma separator with 2 decimal places
    return amount.toLocaleString('en-PH', {
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    });
  }

  toggleCard(app: CollectorApplication): void {
    if (this.selectedApp()?.id === app.id && this.showApproveModal()) {
      this.closeApproveModal();
    } else {
      this.openApproveModal(app);
    }
  }

  getCustomerName(app: CollectorApplication): string {
    // API returns customerFirstName and customerLastName from JOIN
    if (app.customerFirstName && app.customerLastName) {
      return `${app.customerFirstName} ${app.customerLastName}`;
    }
    // Fallback to nested Customer object
    if (app.Customer?.firstName && app.Customer?.lastName) {
      return `${app.Customer.firstName} ${app.Customer.lastName}`;
    }
    // Fallback to flat customerName
    if (app.customerName) {
      return app.customerName;
    }
    return 'N/A';
  }

  getProductName(app: CollectorApplication): string {
    // API returns productName from JOIN
    if (app.productName) {
      return app.productName;
    }
    // Fallback to nested LoanProduct object
    if (app.LoanProduct?.name) {
      return app.LoanProduct.name;
    }
    // Fallback to flat loanProductName
    if (app.loanProductName) {
      return app.loanProductName;
    }
    return 'N/A';
  }

  getStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'submitted':
        return 'primary';
      case 'under_review':
        return 'warning';
      case 'approved':
        return 'success';
      case 'rejected':
        return 'danger';
      default:
        return 'medium';
    }
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
