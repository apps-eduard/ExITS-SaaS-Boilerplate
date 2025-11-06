// Collector Disbursements Page - Disburse Approved Loans
import { Component, OnInit, AfterViewInit, signal, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
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
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  ToastController,
  AlertController,
  ViewWillEnter,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  cardOutline,
  cashOutline,
  phonePortraitOutline,
  checkmarkCircleOutline,
  alertCircleOutline,
  personOutline,
  calendarOutline,
  documentTextOutline,
} from 'ionicons/icons';
import { 
  CollectorService, 
  PendingDisbursement,
  DisburseDto,
} from '../../core/services/collector.service';
import { AuthService } from '../../core/services/auth.service';
import { HeaderUtilsComponent } from '../../shared/components/header-utils.component';

@Component({
  selector: 'app-collector-disbursements',
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
    IonInput,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    HeaderUtilsComponent
  ],
  template: `
    <ion-content [fullscreen]="true" [scrollY]="true" class="main-content">
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Fixed Top Bar -->
      <div class="fixed-top-bar">
        <div class="top-bar-content">
          <div class="top-bar-left">
            <span class="app-emoji">💰</span>
            <span class="app-title">Disbursements</span>
          </div>
          
          <div class="top-bar-right">
            <app-header-utils />
          </div>
        </div>
      </div>

      <!-- Content Container with Padding -->
      <div class="disbursements-container">

      <!-- Loading State -->
      @if (loading()) {
        <div class="loading-skeletons">
          @for (i of [1,2,3]; track i) {
            <ion-skeleton-text animated style="height: 180px; border-radius: 14px;"></ion-skeleton-text>
          }
        </div>
      }

      <!-- Empty State -->
      @if (!loading() && disbursements().length === 0) {
        <div class="empty-state">
          <div class="empty-icon">💰</div>
          <h2 class="empty-title">No Pending Disbursements</h2>
          <p class="empty-description">All approved loans have been disbursed</p>
          <div class="empty-hint">
            <span class="hint-emoji">✨</span>
            <span>New disbursements will appear here when loans are approved</span>
          </div>
        </div>
      }

      <!-- Disbursements List -->
      @if (!loading() && disbursements().length > 0) {
        <div class="disbursements-list">
          @for (disbursement of disbursements(); track disbursement.id) {
            <div class="disbursement-card">
              <!-- Card Header -->
              <div class="card-header">
                <div class="customer-info">
                  <div class="customer-name">{{ disbursement.customerName }}</div>
                  <div class="loan-number">{{ disbursement.loanNumber }}</div>
                </div>
                <div class="status-badge" data-status="approved">
                  Approved
                </div>
              </div>

              <!-- Amount Summary -->
              <div class="amount-summary">
                <div class="summary-row">
                  <span class="summary-label">💵 Principal</span>
                  <span class="summary-value">₱{{ disbursement.principalAmount.toLocaleString() }}</span>
                </div>
                <div class="summary-divider"></div>
                
                <div class="summary-row">
                  <span class="summary-label">📝 Processing Fee</span>
                  <span class="summary-value fee">-₱{{ disbursement.processingFee.toLocaleString() }}</span>
                </div>
                <div class="summary-divider"></div>
                
                <div class="summary-row">
                  <span class="summary-label">⚡ Platform Fee</span>
                  <span class="summary-value fee">-₱{{ disbursement.platformFee.toLocaleString() }}</span>
                </div>
                <div class="summary-divider"></div>
                
                <div class="summary-row highlight">
                  <span class="summary-label"><strong>💰 Net Amount</strong></span>
                  <span class="summary-value net">₱{{ disbursement.netDisbursement.toLocaleString() }}</span>
                </div>
              </div>

              <!-- Additional Info -->
              <div class="info-row">
                <div class="info-item">
                  <span class="info-label">📅 Approved</span>
                  <span class="info-value">{{ formatDate(disbursement.approvedAt) }}</span>
                </div>
                <div class="info-item">
                  <span class="info-label">👤 Customer ID</span>
                  <span class="info-value">#{{ disbursement.customerId }}</span>
                </div>
              </div>

              <!-- Action Button -->
              <button class="action-btn disburse" (click)="openDisburseModal(disbursement)">
                <ion-icon name="checkmark-circle-outline"></ion-icon>
                <span>Disburse Now</span>
              </button>
            </div>
          }
        </div>
      }

      <!-- Disburse Modal -->
      <ion-modal [isOpen]="showDisburseModal()" (didDismiss)="closeDisburseModal()">
        <ng-template>
          <ion-header>
            <ion-toolbar>
              <ion-title>Disburse Loan</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="closeDisburseModal()">Close</ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content class="ion-padding">
            @if (selectedDisbursement()) {
              <div class="space-y-4">
                <!-- Customer Info -->
                <div class="bg-green-50 p-4 rounded-lg">
                  <div class="font-bold text-lg">{{ selectedDisbursement()!.customerName }}</div>
                  <div class="text-sm text-gray-600">{{ selectedDisbursement()!.loanNumber }}</div>
                </div>

                <!-- Net Amount -->
                <div class="bg-blue-50 border-2 border-blue-200 p-4 rounded-lg text-center">
                  <div class="text-sm text-gray-600 mb-1">Net Disbursement Amount</div>
                  <div class="text-3xl font-bold text-green-600">
                    ₱{{ selectedDisbursement()!.netDisbursement.toLocaleString() }}
                  </div>
                </div>

                <!-- Disbursement Form -->
                <ion-item>
                  <ion-label position="stacked">Disbursement Method *</ion-label>
                  <ion-select 
                    [(ngModel)]="disburseForm.disbursementMethod" 
                    placeholder="Select method"
                    interface="action-sheet">
                    <ion-select-option value="cash">
                      <ion-icon [icon]="'cash-outline'"></ion-icon>
                      Cash
                    </ion-select-option>
                    <ion-select-option value="bank_transfer">
                      <ion-icon [icon]="'card-outline'"></ion-icon>
                      Bank Transfer
                    </ion-select-option>
                    <ion-select-option value="mobile_money">
                      <ion-icon [icon]="'phone-portrait-outline'"></ion-icon>
                      Mobile Money (GCash/Maya)
                    </ion-select-option>
                  </ion-select>
                </ion-item>

                @if (disburseForm.disbursementMethod && disburseForm.disbursementMethod !== 'cash') {
                  <ion-item>
                    <ion-label position="stacked">Reference Number</ion-label>
                    <ion-input 
                      [(ngModel)]="disburseForm.referenceNumber"
                      placeholder="Enter transaction reference">
                    </ion-input>
                  </ion-item>
                }

                <ion-item>
                  <ion-label position="stacked">Notes (Optional)</ion-label>
                  <ion-textarea 
                    [(ngModel)]="disburseForm.notes"
                    rows="3"
                    placeholder="Add disbursement notes...">
                  </ion-textarea>
                </ion-item>

                <!-- Warning Messages -->
                @if (selectedDisbursement()!.principalAmount > 100000) {
                  <div class="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
                    <div class="flex items-start">
                      <ion-icon [icon]="'alert-circle-outline'" class="text-orange-500 text-xl mr-2"></ion-icon>
                      <div class="text-sm text-orange-700">
                        High-value disbursement. Please verify customer identity and ensure proper documentation.
                      </div>
                    </div>
                  </div>
                }

                <!-- Action Buttons -->
                <div class="flex gap-2">
                  <ion-button 
                    expand="block" 
                    color="success" 
                    [disabled]="!isDisburseFormValid()"
                    (click)="confirmDisburse()">
                    <ion-icon slot="start" [icon]="'checkmark-circle-outline'"></ion-icon>
                    Confirm Disbursement
                  </ion-button>
                  <ion-button expand="block" fill="outline" (click)="closeDisburseModal()">
                    Cancel
                  </ion-button>
                </div>

                <!-- Info Box -->
                <div class="bg-gray-50 p-4 rounded text-sm text-gray-600">
                  <p class="mb-2">📋 <strong>Important:</strong></p>
                  <ul class="list-disc list-inside space-y-1">
                    <li>Verify customer identity before disbursing</li>
                    <li>Customer must sign disbursement receipt</li>
                    <li>For cash: Count amount in front of customer</li>
                    <li>For transfers: Confirm receipt before closing</li>
                  </ul>
                </div>
              </div>
            }
          </ion-content>
        </ng-template>
      </ion-modal>
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
    .disbursements-container {
      padding-top: calc(56px + env(safe-area-inset-top) + 0.85rem);
      padding-bottom: calc(60px + env(safe-area-inset-bottom) + 0.85rem);
      padding-left: 0.85rem;
      padding-right: 0.85rem;
    }

    /* Empty State */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      min-height: calc(100vh - 56px - env(safe-area-inset-top) - 60px - env(safe-area-inset-bottom));
      text-align: center;
      padding: 3rem 1.5rem;
    }

    .empty-icon {
      font-size: 5rem;
      margin-bottom: 1.5rem;
      animation: float 3s ease-in-out infinite;
      filter: drop-shadow(0 4px 12px rgba(0,0,0,0.1));
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-12px); }
    }

    .empty-title {
      font-size: 1.375rem;
      font-weight: 700;
      color: var(--ion-text-color, #1f2937);
      margin: 0 0 0.75rem 0;
    }

    .empty-description {
      font-size: 1rem;
      color: var(--ion-color-step-600, #64748b);
      margin: 0 0 2rem 0;
      line-height: 1.5;
    }

    .empty-hint {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.65rem;
      padding: 1rem 1.5rem;
      background: linear-gradient(135deg, #dbeafe 0%, #bfdbfe 100%);
      border-radius: 14px;
      font-size: 0.9375rem;
      color: #1e40af;
      max-width: 340px;
      box-shadow: 0 2px 8px rgba(59, 130, 246, 0.15);
      line-height: 1.4;
    }

    .hint-emoji {
      font-size: 1.5rem;
      line-height: 1;
    }

    /* Disbursements List */
    .disbursements-list {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    /* Disbursement Card */
    .disbursement-card {
      background: var(--ion-card-background, white);
      border-radius: 14px;
      padding: 1rem;
      box-shadow: 0 1px 3px rgba(0, 0, 0, 0.06);
      border: 1px solid var(--ion-border-color, rgba(0, 0, 0, 0.04));
      transition: transform 0.2s, box-shadow 0.2s;
    }

    .disbursement-card:active {
      transform: scale(0.99);
    }

    /* Card Header */
    .card-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 0.85rem;
      padding-bottom: 0.85rem;
      border-bottom: 1px solid rgba(0, 0, 0, 0.06);
    }

    .customer-info {
      flex: 1;
    }

    .customer-name {
      font-size: 1rem;
      font-weight: 700;
      color: var(--ion-text-color, #1f2937);
      margin-bottom: 0.25rem;
    }

    .loan-number {
      font-size: 0.75rem;
      color: var(--ion-color-medium, #6b7280);
      font-weight: 500;
    }

    .status-badge {
      padding: 0.35rem 0.75rem;
      border-radius: 8px;
      font-size: 0.7rem;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.03em;
    }

    .status-badge[data-status="approved"] {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
    }

    /* Amount Summary */
    .amount-summary {
      margin-bottom: 0.85rem;
    }

    .summary-row {
      display: flex;
      justify-content: space-between;
      align-items: center;
      padding: 0.5rem 0;
      gap: 1rem;
    }

    .summary-row.highlight {
      padding: 0.65rem;
      background: linear-gradient(135deg, #ecfdf5 0%, #d1fae5 100%);
      border-radius: 8px;
      margin-top: 0.5rem;
    }

    .summary-label {
      font-size: 0.8rem;
      color: var(--ion-color-medium, #64748b);
      font-weight: 500;
      flex-shrink: 0;
    }

    .summary-value {
      font-size: 0.875rem;
      color: var(--ion-text-color, #1e293b);
      font-weight: 600;
      text-align: right;
    }

    .summary-value.fee {
      color: #dc2626;
      font-size: 0.8rem;
    }

    .summary-value.net {
      color: #059669;
      font-size: 1.05rem;
      font-weight: 700;
    }

    .summary-divider {
      height: 1px;
      background: #e2e8f0;
      margin: 0 0.25rem;
    }

    /* Info Row */
    .info-row {
      display: grid;
      grid-template-columns: 1fr 1fr;
      gap: 0.75rem;
      margin-bottom: 0.85rem;
      padding: 0.75rem;
      background: var(--ion-color-light, #f8fafc);
      border-radius: 8px;
    }

    .info-item {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .info-label {
      font-size: 0.7rem;
      color: var(--ion-color-medium, #64748b);
      font-weight: 500;
    }

    .info-value {
      font-size: 0.8rem;
      color: var(--ion-text-color, #1e293b);
      font-weight: 600;
    }

    /* Action Button */
    .action-btn {
      width: 100%;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      padding: 0.75rem;
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

    .action-btn.disburse {
      background: linear-gradient(135deg, #10b981 0%, #059669 100%);
      color: white;
    }

    .action-btn.disburse:active {
      transform: scale(0.98);
      box-shadow: 0 1px 2px rgba(0, 0, 0, 0.1);
    }

    /* Loading Skeleton */
    .loading-skeletons {
      display: flex;
      flex-direction: column;
      gap: 0.85rem;
    }

    ion-skeleton-text {
      border-radius: 14px;
      margin-bottom: 0;
    }
  `],
})
export class CollectorDisbursementsPage implements OnInit, AfterViewInit, ViewWillEnter {
  @ViewChild(IonContent) content?: IonContent;

  private collectorService = inject(CollectorService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);

  loading = signal(true);
  disbursements = signal<PendingDisbursement[]>([]);
  collectorId = signal<number>(0);

  // Modal states
  showDisburseModal = signal(false);
  selectedDisbursement = signal<PendingDisbursement | null>(null);

  // Form model
  disburseForm: DisburseDto = {
    disbursementMethod: 'cash',
    referenceNumber: '',
    notes: '',
  };

  constructor() {
    addIcons({
      cardOutline,
      cashOutline,
      phonePortraitOutline,
      checkmarkCircleOutline,
      alertCircleOutline,
      personOutline,
      calendarOutline,
      documentTextOutline,
    });
  }

  ngOnInit() {
    const user = this.authService.currentUser();
    if (user) {
      this.collectorId.set(Number(user.id));
    }
  }

  ionViewWillEnter() {
    // Load data when view is about to enter
    if (this.collectorId()) {
      this.loadDisbursements();
    }
  }

  ngAfterViewInit() {
    // Content is now available
    if (this.content) {
      console.log('✅ Ion-content initialized');
    }
  }

  async loadDisbursements() {
    this.loading.set(true);
    try {
      const data = await this.collectorService.getPendingDisbursements(this.collectorId()).toPromise();
      console.log('💰 Loaded disbursements:', data);
      this.disbursements.set(data || []);
    } catch (error: any) {
      console.error('❌ Failed to load disbursements:', error);
      await this.showToast(error.error?.message || 'Failed to load disbursements', 'danger');
    } finally {
      this.loading.set(false);
      console.log('✅ Loading complete. Count:', this.disbursements().length);
    }
  }

  async handleRefresh(event: any) {
    await this.loadDisbursements();
    event.target.complete();
  }

  openDisburseModal(disbursement: PendingDisbursement) {
    this.selectedDisbursement.set(disbursement);
    this.disburseForm = {
      disbursementMethod: 'cash',
      referenceNumber: '',
      notes: '',
    };
    this.showDisburseModal.set(true);
  }

  closeDisburseModal() {
    this.showDisburseModal.set(false);
    this.selectedDisbursement.set(null);
  }

  isDisburseFormValid(): boolean {
    if (!this.disburseForm.disbursementMethod) return false;
    
    // If not cash, reference number is required
    if (this.disburseForm.disbursementMethod !== 'cash' && !this.disburseForm.referenceNumber) {
      return false;
    }
    
    return true;
  }

  async confirmDisburse() {
    if (!this.selectedDisbursement()) return;

    const methodLabel = this.getMethodLabel(this.disburseForm.disbursementMethod);

    const alert = await this.alertController.create({
      header: 'Confirm Disbursement',
      message: `
        <strong>Customer:</strong> ${this.selectedDisbursement()!.customerName}<br>
        <strong>Amount:</strong> ₱${this.selectedDisbursement()!.netDisbursement.toLocaleString()}<br>
        <strong>Method:</strong> ${methodLabel}<br><br>
        <strong>⚠️ This action cannot be undone.</strong>
      `,
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Disburse',
          handler: async () => {
            await this.disburseLoan();
          },
        },
      ],
    });

    await alert.present();
  }

  async disburseLoan() {
    if (!this.selectedDisbursement()) return;

    try {
      await this.collectorService.disburseLoan(
        this.collectorId(),
        this.selectedDisbursement()!.id,
        this.disburseForm
      ).toPromise();

      await this.showToast(
        `Loan disbursed successfully! ₱${this.selectedDisbursement()!.netDisbursement.toLocaleString()} via ${this.getMethodLabel(this.disburseForm.disbursementMethod)}`,
        'success'
      );
      
      this.closeDisburseModal();
      await this.loadDisbursements();
    } catch (error: any) {
      await this.showToast(error.error?.message || 'Failed to disburse loan', 'danger');
    }
  }

  getMethodLabel(method: string): string {
    switch (method) {
      case 'cash':
        return 'Cash';
      case 'bank_transfer':
        return 'Bank Transfer';
      case 'mobile_money':
        return 'Mobile Money';
      default:
        return method;
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
