// Collector Penalty Waivers Page - Request and View Waivers
import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonSegment,
  IonSegmentButton,
  ToastController,
  AlertController,
} from '@ionic/angular/standalone';
import { 
  CollectorService, 
  PenaltyWaiver,
  RequestWaiverDto,
  AssignedCustomer,
} from '../../core/services/collector.service';
import { AuthService } from '../../core/services/auth.service';
import { CollectorTopBarComponent } from '../../shared/components/collector-top-bar.component';

@Component({
  selector: 'app-collector-waivers',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonSegment,
    IonSegmentButton,
    CollectorTopBarComponent
  ],
  template: `
    <ion-content [fullscreen]="true" class="main-content">
      <app-collector-top-bar
        emoji="⚠️"
        title="Penalty Waivers"
        subtitle="Request and track waivers"
      />

      <!-- Pull to Refresh -->
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Content Container with Padding -->
      <div class="waivers-container">
        
        <!-- Segment Tabs -->
        <ion-segment [(ngModel)]="selectedTab" (ionChange)="onTabChange()" class="content-segment">
          <ion-segment-button value="pending">
            <span>Pending</span>
          </ion-segment-button>
          <ion-segment-button value="request">
            <span>Request</span>
          </ion-segment-button>
        </ion-segment>

        <!-- PENDING TAB -->
        @if (selectedTab === 'pending') {
          <!-- Loading State -->
          @if (loading()) {
            <div class="loading-container">
              @for (item of [1,2,3]; track item) {
                <div class="skeleton-card"></div>
              }
            </div>
          }

          <!-- Empty State -->
          @else if (pendingWaivers().length === 0) {
            <div class="empty-state">
              <div class="empty-emoji">⚠️</div>
              <h3 class="empty-title">No Pending Waivers</h3>
              <p class="empty-subtitle">You don't have any waiver requests at the moment</p>
              <div class="hint-box">
                <div class="hint-label">💡 Quick Tip</div>
                <div class="hint-text">Switch to "Request New" tab to submit a waiver request for your customers</div>
              </div>
            </div>
          }

          <!-- Waivers List -->
          @else {
            <div class="waivers-list">
              @for (waiver of pendingWaivers(); track waiver.id) {
                <div class="waiver-card">
                  <!-- Header -->
                  <div class="waiver-header">
                    <div>
                      <div class="waiver-customer">{{ waiver.customerName }}</div>
                      <div class="waiver-loan">Loan #{{ waiver.loanNumber }}</div>
                    </div>
                    <div class="status-badge" 
                         [class.status-pending]="waiver.status === 'pending'"
                         [class.status-approved]="waiver.status === 'approved' || waiver.status === 'auto_approved'"
                         [class.status-rejected]="waiver.status === 'rejected'">
                      {{ waiver.status === 'auto_approved' ? 'Auto-Approved' : (waiver.status | titlecase) }}
                    </div>
                  </div>

                  <!-- Amounts -->
                  <div class="amounts-section">
                    <div class="amount-row">
                      <span class="amount-label">Original Penalty</span>
                      <span class="amount-value original">₱{{ waiver.originalPenaltyAmount.toLocaleString() }}</span>
                    </div>
                    <div class="amount-row">
                      <span class="amount-label">Requested Waiver</span>
                      <span class="amount-value waiver">₱{{ waiver.requestedWaiverAmount.toLocaleString() }}</span>
                    </div>
                    @if (waiver.approvedWaiverAmount) {
                      <div class="amount-row approved-row">
                        <span class="amount-label bold">Approved Amount</span>
                        <span class="amount-value approved">₱{{ waiver.approvedWaiverAmount.toLocaleString() }}</span>
                      </div>
                    }
                  </div>

                  <!-- Details Grid -->
                  <div class="details-grid">
                    <div class="detail-item">
                      <div class="detail-label">Type</div>
                      <div class="detail-value">{{ waiver.waiveType | titlecase }}</div>
                    </div>
                    @if (waiver.installmentNumber) {
                      <div class="detail-item">
                        <div class="detail-label">Installment</div>
                        <div class="detail-value">#{{ waiver.installmentNumber }}</div>
                      </div>
                    }
                    <div class="detail-item">
                      <div class="detail-label">Requested</div>
                      <div class="detail-value">{{ formatDate(waiver.requestedAt) }}</div>
                    </div>
                    @if (waiver.approvedAt) {
                      <div class="detail-item">
                        <div class="detail-label">Approved</div>
                        <div class="detail-value">{{ formatDate(waiver.approvedAt) }}</div>
                      </div>
                    }
                  </div>

                  <!-- Reason Box -->
                  <div class="reason-box">
                    <div class="reason-label">Reason</div>
                    <div class="reason-text">{{ waiver.reason }}</div>
                  </div>
                </div>
              }
            </div>
          }
        }

        <!-- REQUEST NEW TAB -->
        @if (selectedTab === 'request') {
          <div class="request-container">
            <!-- Request Form Card -->
            <div class="form-card">
              <div class="form-header">
                <h2 class="form-title">📝 Request Penalty Waiver</h2>
              </div>

              <!-- Customer Selection -->
              <div class="form-field">
                <label class="field-label">Customer <span class="required">*</span></label>
                <div class="select-wrapper">
                  <select 
                    [(ngModel)]="requestForm.loanId" 
                    class="custom-select">
                    <option [value]="0">Select customer loan</option>
                    @for (customer of assignedCustomers(); track customer.id) {
                      <option [value]="customer.id">
                        {{ customer.firstName }} {{ customer.lastName }}
                      </option>
                    }
                  </select>
                  <div class="select-arrow">▼</div>
                </div>
              </div>

              <!-- Waive Type -->
              <div class="form-field">
                <label class="field-label">Waiver Type <span class="required">*</span></label>
                <div class="select-wrapper">
                  <select 
                    [(ngModel)]="requestForm.waiveType" 
                    class="custom-select">
                    <option value="full">Full Waiver</option>
                    <option value="partial">Partial Waiver</option>
                  </select>
                  <div class="select-arrow">▼</div>
                </div>
              </div>

              <!-- Requested Amount -->
              <div class="form-field">
                <label class="field-label">Requested Waiver Amount <span class="required">*</span></label>
                <input 
                  type="number"
                  [(ngModel)]="requestForm.requestedWaiverAmount"
                  placeholder="Enter amount"
                  class="custom-input">
              </div>

              <!-- Reason -->
              <div class="form-field">
                <label class="field-label">Reason <span class="required">*</span></label>
                <div class="select-wrapper">
                  <select 
                    [(ngModel)]="requestForm.reason" 
                    class="custom-select">
                    <option value="">Select reason</option>
                    <option value="Financial hardship">Financial hardship</option>
                    <option value="Medical emergency">Medical emergency</option>
                    <option value="Natural disaster">Natural disaster</option>
                    <option value="Job loss">Job loss</option>
                    <option value="Good payment history">Good payment history</option>
                    <option value="System error">System error</option>
                    <option value="Other">Other</option>
                  </select>
                  <div class="select-arrow">▼</div>
                </div>
              </div>

              <!-- Additional Notes -->
              <div class="form-field">
                <label class="field-label">Additional Notes</label>
                <textarea 
                  [(ngModel)]="requestForm.notes"
                  rows="4"
                  placeholder="Provide detailed explanation for waiver request..."
                  class="custom-textarea"></textarea>
              </div>

              <!-- Info Box -->
              <div class="info-box">
                <div class="info-icon">ℹ️</div>
                <div class="info-content">
                  <div class="info-title">Auto-Approval</div>
                  <div class="info-text">Waiver requests within your limit will be automatically approved. Higher amounts require manager approval.</div>
                </div>
              </div>

              <!-- Submit Button -->
              <button 
                class="submit-button"
                [class.disabled]="!isRequestFormValid()"
                [disabled]="!isRequestFormValid()"
                (click)="submitWaiverRequest()">
                <span class="button-icon">✓</span>
                <span>Submit Waiver Request</span>
              </button>
            </div>

            <!-- Recent Requests -->
            @if (pendingWaivers().length > 0) {
              <div class="recent-section">
                <h3 class="recent-title">Recent Requests</h3>
                <div class="recent-list">
                  @for (waiver of pendingWaivers().slice(0, 3); track waiver.id) {
                    <div class="recent-card">
                      <div class="recent-info">
                        <div class="recent-customer">{{ waiver.customerName }}</div>
                        <div class="recent-amount">₱{{ waiver.requestedWaiverAmount.toLocaleString() }}</div>
                      </div>
                      <div class="status-badge status-small"
                           [class.status-pending]="waiver.status === 'pending'"
                           [class.status-approved]="waiver.status === 'approved' || waiver.status === 'auto_approved'"
                           [class.status-rejected]="waiver.status === 'rejected'">
                        {{ waiver.status | titlecase }}
                      </div>
                    </div>
                  }
                </div>
              </div>
            }
          </div>
        }

      </div>
    </ion-content>
  `,
  styles: [`
    /* ======================
       MAIN LAYOUT
       ====================== */
    .main-content {
      --background: var(--ion-background-color, #f8fafc);
    }

    /* Main Container */
    .waivers-container {
      padding: calc(84px + env(safe-area-inset-top) + 0.85rem) 0.85rem calc(72px + env(safe-area-inset-bottom) + 0.85rem) 0.85rem;
    }

    /* Content Segment Tabs */
    .content-segment {
      --background: white;
      border-radius: 12px;
      margin-bottom: 1rem;
      box-shadow: 0 2px 8px rgba(15, 23, 42, 0.06);
      border: 1px solid rgba(148, 163, 184, 0.12);
    }

    .content-segment ion-segment-button {
      --color: #64748b;
      --color-checked: #3b82f6;
      --indicator-color: #3b82f6;
      font-size: 0.85rem;
      font-weight: 600;
      min-height: 42px;
      text-transform: none;
    }

    /* ======================
       LOADING STATE
       ====================== */
    .loading-container {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .skeleton-card {
      height: 180px;
      background: linear-gradient(
        90deg,
        var(--ion-card-background, #fff) 0%,
        var(--ion-color-light, #f4f5f8) 50%,
        var(--ion-card-background, #fff) 100%
      );
      background-size: 200% 100%;
      animation: shimmer 1.5s infinite;
      border-radius: 14px;
      border: 1px solid var(--ion-border-color, rgba(0,0,0,0.08));
    }

    @keyframes shimmer {
      0% { background-position: -200% 0; }
      100% { background-position: 200% 0; }
    }

    /* ======================
       EMPTY STATE
       ====================== */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 3rem 1.5rem;
      text-align: center;
    }

    .empty-emoji {
      font-size: 4rem;
      margin-bottom: 1.25rem;
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

    .empty-subtitle {
      font-size: 0.9375rem;
      color: var(--ion-color-step-600, #64748b);
      margin: 0 0 1.5rem 0;
      line-height: 1.5;
    }

    .hint-box {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      border-radius: 12px;
      padding: 1rem;
      max-width: 280px;
      box-shadow: 0 2px 8px rgba(251, 191, 36, 0.15);
    }

    .hint-label {
      font-size: 0.875rem;
      font-weight: 600;
      color: #92400e;
      margin-bottom: 0.35rem;
    }

    .hint-text {
      font-size: 0.8125rem;
      color: #78350f;
      line-height: 1.4;
    }

    /* ======================
       WAIVER CARDS
       ====================== */
    .waivers-list {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    .waiver-card {
      background: var(--ion-card-background, #fff);
      border-radius: 14px;
      padding: 1rem;
      border: 1px solid var(--ion-border-color, rgba(0,0,0,0.08));
      box-shadow: 0 1px 3px var(--shadow-color, rgba(0,0,0,0.05));
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    /* Header */
    .waiver-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      gap: 0.75rem;
    }

    .waiver-customer {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--ion-text-color, #1e293b);
      line-height: 1.3;
    }

    .waiver-loan {
      font-size: 0.8125rem;
      color: var(--ion-color-step-600, #64748b);
      margin-top: 0.25rem;
    }

    /* Status Badge */
    .status-badge {
      padding: 0.3rem 0.65rem;
      border-radius: 8px;
      font-size: 0.75rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.02em;
      white-space: nowrap;
    }

    .status-badge.status-pending {
      background: linear-gradient(135deg, #fef3c7 0%, #fde68a 100%);
      color: #92400e;
    }

    .status-badge.status-approved {
      background: linear-gradient(135deg, #d1fae5 0%, #a7f3d0 100%);
      color: #065f46;
    }

    .status-badge.status-rejected {
      background: linear-gradient(135deg, #fee2e2 0%, #fecaca 100%);
      color: #991b1b;
    }

    .status-badge.status-small {
      padding: 0.25rem 0.5rem;
      font-size: 0.6875rem;
    }

    /* Amounts Section */
    .amounts-section {
      background: linear-gradient(135deg, #fff7ed 0%, #ffedd5 100%);
      border-radius: 10px;
      padding: 0.85rem;
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }

    .amount-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .amount-row.approved-row {
      border-top: 1px solid #fed7aa;
      padding-top: 0.65rem;
      margin-top: 0.2rem;
    }

    .amount-label {
      font-size: 0.8125rem;
      color: var(--ion-color-step-700, #475569);
    }

    .amount-label.bold {
      font-weight: 600;
      color: var(--ion-text-color, #1e293b);
    }

    .amount-value {
      font-size: 0.9375rem;
      font-weight: 700;
    }

    .amount-value.original {
      color: #dc2626;
    }

    .amount-value.waiver {
      color: #ea580c;
    }

    .amount-value.approved {
      color: #16a34a;
    }

    /* Details Grid */
    .details-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 0.75rem;
    }

    .detail-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .detail-label {
      font-size: 0.75rem;
      color: var(--ion-color-step-600, #64748b);
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .detail-value {
      font-size: 0.8125rem;
      font-weight: 600;
      color: var(--ion-text-color, #1e293b);
    }

    /* Reason Box */
    .reason-box {
      background: var(--ion-color-light, #f8fafc);
      border-radius: 10px;
      padding: 0.85rem;
    }

    .reason-label {
      font-size: 0.75rem;
      color: var(--ion-color-step-600, #64748b);
      text-transform: uppercase;
      letter-spacing: 0.03em;
      margin-bottom: 0.35rem;
    }

    .reason-text {
      font-size: 0.8125rem;
      color: var(--ion-text-color, #1e293b);
      line-height: 1.5;
    }

    /* ======================
       REQUEST FORM
       ====================== */
    .request-container {
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    .form-card {
      background: var(--ion-card-background, #fff);
      border-radius: 14px;
      padding: 1.25rem;
      border: 1px solid var(--ion-border-color, rgba(0,0,0,0.08));
      box-shadow: 0 2px 8px var(--shadow-color, rgba(0,0,0,0.06));
    }

    .form-header {
      margin-bottom: 1.25rem;
      padding-bottom: 0.85rem;
      border-bottom: 1px solid var(--ion-border-color, rgba(0,0,0,0.08));
    }

    .form-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--ion-text-color, #1e293b);
      margin: 0;
    }

    /* Form Fields */
    .form-field {
      margin-bottom: 1.25rem;
    }

    .field-label {
      display: block;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--ion-text-color, #1e293b);
      margin-bottom: 0.5rem;
    }

    .field-label .required {
      color: #dc2626;
      margin-left: 0.15rem;
    }

    /* Custom Select */
    .select-wrapper {
      position: relative;
    }

    .custom-select {
      width: 100%;
      padding: 0.75rem 2.5rem 0.75rem 0.85rem;
      border: 1.5px solid var(--ion-border-color, rgba(0,0,0,0.15));
      border-radius: 10px;
      font-size: 0.9375rem;
      color: var(--ion-text-color, #1e293b);
      background: var(--ion-card-background, #fff);
      appearance: none;
      cursor: pointer;
      transition: all 0.2s;
    }

    .custom-select:focus {
      outline: none;
      border-color: #fb923c;
      box-shadow: 0 0 0 3px rgba(251, 146, 60, 0.1);
    }

    .select-arrow {
      position: absolute;
      right: 0.85rem;
      top: 50%;
      transform: translateY(-50%);
      color: var(--ion-color-step-600, #64748b);
      pointer-events: none;
      font-size: 0.75rem;
    }

    /* Custom Input */
    .custom-input {
      width: 100%;
      padding: 0.75rem 0.85rem;
      border: 1.5px solid var(--ion-border-color, rgba(0,0,0,0.15));
      border-radius: 10px;
      font-size: 0.9375rem;
      color: var(--ion-text-color, #1e293b);
      background: var(--ion-card-background, #fff);
      transition: all 0.2s;
    }

    .custom-input:focus {
      outline: none;
      border-color: #fb923c;
      box-shadow: 0 0 0 3px rgba(251, 146, 60, 0.1);
    }

    .custom-input::placeholder {
      color: var(--ion-color-step-400, #94a3b8);
    }

    /* Custom Textarea */
    .custom-textarea {
      width: 100%;
      padding: 0.75rem 0.85rem;
      border: 1.5px solid var(--ion-border-color, rgba(0,0,0,0.15));
      border-radius: 10px;
      font-size: 0.9375rem;
      color: var(--ion-text-color, #1e293b);
      background: var(--ion-card-background, #fff);
      font-family: inherit;
      resize: vertical;
      transition: all 0.2s;
    }

    .custom-textarea:focus {
      outline: none;
      border-color: #fb923c;
      box-shadow: 0 0 0 3px rgba(251, 146, 60, 0.1);
    }

    .custom-textarea::placeholder {
      color: var(--ion-color-step-400, #94a3b8);
    }

    /* Info Box */
    .info-box {
      background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
      border-radius: 10px;
      padding: 0.85rem;
      display: flex;
      gap: 0.75rem;
      align-items: flex-start;
      margin-bottom: 1.25rem;
    }

    .info-icon {
      font-size: 1.25rem;
      line-height: 1;
    }

    .info-content {
      flex: 1;
    }

    .info-title {
      font-size: 0.875rem;
      font-weight: 600;
      color: #1e40af;
      margin-bottom: 0.25rem;
    }

    .info-text {
      font-size: 0.8125rem;
      color: #1e3a8a;
      line-height: 1.4;
    }

    /* Submit Button */
    .submit-button {
      width: 100%;
      background: linear-gradient(135deg, #fb923c 0%, #f97316 100%);
      color: white;
      border: none;
      border-radius: 10px;
      padding: 0.85rem 1.25rem;
      font-size: 0.9375rem;
      font-weight: 600;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      cursor: pointer;
      box-shadow: 0 4px 12px rgba(249, 115, 22, 0.25);
      transition: all 0.2s;
    }

    .submit-button:active {
      transform: scale(0.98);
      box-shadow: 0 2px 8px rgba(249, 115, 22, 0.25);
    }

    .submit-button.disabled {
      opacity: 0.5;
      cursor: not-allowed;
      box-shadow: none;
    }

    .submit-button.disabled:active {
      transform: none;
    }

    .button-icon {
      font-size: 1.125rem;
      line-height: 1;
    }

    /* ======================
       RECENT REQUESTS
       ====================== */
    .recent-section {
      margin-top: 1.5rem;
    }

    .recent-title {
      font-size: 1rem;
      font-weight: 700;
      color: var(--ion-text-color, #1e293b);
      margin: 0 0 0.85rem 0;
    }

    .recent-list {
      display: flex;
      flex-direction: column;
      gap: 0.65rem;
    }

    .recent-card {
      background: var(--ion-card-background, #fff);
      border-radius: 10px;
      padding: 0.85rem;
      border: 1px solid var(--ion-border-color, rgba(0,0,0,0.08));
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 0.75rem;
    }

    .recent-info {
      flex: 1;
    }

    .recent-customer {
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--ion-text-color, #1e293b);
      margin-bottom: 0.2rem;
    }

    .recent-amount {
      font-size: 0.8125rem;
      color: var(--ion-color-step-600, #64748b);
    }

    /* ======================
       RESPONSIVE
       ====================== */
    @media (min-width: 768px) {
      .waivers-container {
        max-width: 600px;
        margin: 0 auto;
      }

      .form-card {
        padding: 1.5rem;
      }

      .details-grid {
        grid-template-columns: repeat(3, 1fr);
      }
    }
  `]
})
export class CollectorWaiversPage implements OnInit {
  private collectorService = inject(CollectorService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);

  loading = signal(true);
  pendingWaivers = signal<PenaltyWaiver[]>([]);
  assignedCustomers = signal<AssignedCustomer[]>([]);
  collectorId = signal<number>(0);
  selectedTab = 'pending';

  // Form model
  requestForm: RequestWaiverDto = {
    loanId: 0,
    waiveType: 'partial',
    requestedWaiverAmount: 0,
    reason: '',
    notes: '',
  };

  async ngOnInit() {
    const user = this.authService.currentUser();
    if (user) {
      this.collectorId.set(Number(user.id));
      await this.loadData();
    }
  }

  async loadData() {
    this.loading.set(true);
    try {
      const [waivers, customers] = await Promise.all([
        this.collectorService.getPendingWaivers(this.collectorId()).toPromise(),
        this.collectorService.getAssignedCustomers(this.collectorId()).toPromise(),
      ]);

      this.pendingWaivers.set(waivers || []);
      this.assignedCustomers.set(customers || []);
    } catch (error: any) {
      await this.showToast(error.error?.message || 'Failed to load waivers', 'danger');
    } finally {
      this.loading.set(false);
    }
  }

  async handleRefresh(event: any) {
    await this.loadData();
    event.target.complete();
  }

  onTabChange() {
    // Reset form when switching to request tab
    if (this.selectedTab === 'request') {
      this.requestForm = {
        loanId: 0,
        waiveType: 'partial',
        requestedWaiverAmount: 0,
        reason: '',
        notes: '',
      };
    }
  }

  isRequestFormValid(): boolean {
    return (
      this.requestForm.loanId > 0 &&
      this.requestForm.requestedWaiverAmount > 0 &&
      this.requestForm.reason !== ''
    );
  }

  async submitWaiverRequest() {
    const alert = await this.alertController.create({
      header: 'Submit Waiver Request',
      message: `Request waiver of ₱${this.requestForm.requestedWaiverAmount.toLocaleString()}?`,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Submit',
          handler: async () => {
            await this.requestWaiver();
          },
        },
      ],
    });

    await alert.present();
  }

  async requestWaiver() {
    try {
      const result = await this.collectorService.requestWaiver(
        this.collectorId(),
        this.requestForm
      ).toPromise();

      if (result.autoApproved) {
        await this.showToast(
          '✅ Waiver auto-approved and applied immediately!',
          'success'
        );
      } else {
        await this.showToast(
          'Waiver request submitted. Awaiting manager approval.',
          'success'
        );
      }

      // Switch to pending tab and reload
      this.selectedTab = 'pending';
      await this.loadData();
    } catch (error: any) {
      await this.showToast(error.error?.message || 'Failed to submit waiver request', 'danger');
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric',
    });
  }

  getWaiverStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'pending':
        return 'warning';
      case 'approved':
      case 'auto_approved':
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
