// Collector Applications Page - Approve/Reject Applications
import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
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
  IonButtons,
  IonBackButton,
  IonModal,
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
} from 'ionicons/icons';
import { 
  CollectorService, 
  CollectorApplication,
  ApproveApplicationDto,
  RejectApplicationDto,
} from '../../core/services/collector.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-collector-applications',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
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
    IonButtons,
    IonBackButton,
    IonModal,
    IonInput,
    IonTextarea,
    IonSelect,
    IonSelectOption,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/collector/dashboard"></ion-back-button>
        </ion-buttons>
        <ion-title>Pending Applications</ion-title>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Loading State -->
      @if (loading()) {
        <div class="space-y-4">
          @for (i of [1,2,3]; track i) {
            <ion-skeleton-text animated class="h-32 rounded-lg"></ion-skeleton-text>
          }
        </div>
      }

      <!-- Empty State -->
      @if (!loading() && applications().length === 0) {
        <div class="flex flex-col items-center justify-center h-full text-center p-8">
          <ion-icon [icon]="'document-text-outline'" class="text-6xl text-gray-400 mb-4"></ion-icon>
          <h2 class="text-xl font-bold text-gray-700 mb-2">No Pending Applications</h2>
          <p class="text-gray-500">All applications have been processed</p>
        </div>
      }

      <!-- Applications List -->
      @if (!loading() && applications().length > 0) {
        <div class="space-y-4">
          @for (app of applications(); track app.id) {
            <ion-card class="m-0">
              <ion-card-header>
                <div class="flex justify-between items-start">
                  <div>
                    <ion-card-title class="text-base">{{ app.customerName }}</ion-card-title>
                    <p class="text-sm text-gray-600 mt-1">{{ app.applicationNumber }}</p>
                  </div>
                  <ion-badge [color]="getStatusColor(app.status)">
                    {{ app.status }}
                  </ion-badge>
                </div>
              </ion-card-header>

              <ion-card-content>
                <div class="space-y-3">
                  <!-- Application Details -->
                  <div class="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div class="text-gray-600">Product</div>
                      <div class="font-semibold">{{ app.loanProductName }}</div>
                    </div>
                    <div>
                      <div class="text-gray-600">Requested Amount</div>
                      <div class="font-semibold text-blue-600">₱{{ app.requestedAmount.toLocaleString() }}</div>
                    </div>
                    <div>
                      <div class="text-gray-600">Term</div>
                      <div class="font-semibold">{{ app.requestedTermDays }} days</div>
                    </div>
                    <div>
                      <div class="text-gray-600">Submitted</div>
                      <div class="font-semibold">{{ formatDate(app.submittedAt) }}</div>
                    </div>
                  </div>

                  <!-- Action Buttons -->
                  <div class="flex gap-2 mt-4">
                    <ion-button 
                      expand="block" 
                      color="success" 
                      size="small"
                      (click)="openApproveModal(app)">
                      <ion-icon slot="start" [icon]="'checkmark-circle-outline'"></ion-icon>
                      Approve
                    </ion-button>
                    <ion-button 
                      expand="block" 
                      color="danger" 
                      size="small"
                      (click)="openRejectModal(app)">
                      <ion-icon slot="start" [icon]="'close-circle-outline'"></ion-icon>
                      Reject
                    </ion-button>
                    <ion-button 
                      expand="block" 
                      color="warning" 
                      size="small"
                      (click)="requestReview(app)">
                      <ion-icon slot="start" [icon]="'alert-circle-outline'"></ion-icon>
                      Review
                    </ion-button>
                  </div>
                </div>
              </ion-card-content>
            </ion-card>
          }
        </div>
      }

      <!-- Approve Modal -->
      <ion-modal [isOpen]="showApproveModal()" (didDismiss)="closeApproveModal()">
        <ng-template>
          <ion-header>
            <ion-toolbar>
              <ion-title>Approve Application</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="closeApproveModal()">Close</ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content class="ion-padding">
            @if (selectedApp()) {
              <div class="space-y-4">
                <!-- Customer Info -->
                <div class="bg-blue-50 p-4 rounded-lg">
                  <div class="font-bold text-lg">{{ selectedApp()!.customerName }}</div>
                  <div class="text-sm text-gray-600">{{ selectedApp()!.applicationNumber }}</div>
                </div>

                <!-- Approval Form -->
                <ion-item>
                  <ion-label position="stacked">Approved Amount *</ion-label>
                  <ion-input 
                    type="number" 
                    [(ngModel)]="approveForm.approvedAmount"
                    [placeholder]="'Max: ' + selectedApp()!.requestedAmount">
                  </ion-input>
                </ion-item>

                <ion-item>
                  <ion-label position="stacked">Approved Term (Days) *</ion-label>
                  <ion-input 
                    type="number" 
                    [(ngModel)]="approveForm.approvedTermDays"
                    [placeholder]="selectedApp()!.requestedTermDays.toString()">
                  </ion-input>
                </ion-item>

                <ion-item>
                  <ion-label position="stacked">Interest Rate (%) *</ion-label>
                  <ion-input 
                    type="number" 
                    step="0.01"
                    [(ngModel)]="approveForm.approvedInterestRate"
                    placeholder="e.g., 2.5">
                  </ion-input>
                </ion-item>

                <ion-item>
                  <ion-label position="stacked">Notes (Optional)</ion-label>
                  <ion-textarea 
                    [(ngModel)]="approveForm.notes"
                    rows="3"
                    placeholder="Add any approval notes...">
                  </ion-textarea>
                </ion-item>

                <!-- Warning if above limit -->
                @if (approveForm.approvedAmount > 50000) {
                  <div class="bg-orange-50 border-l-4 border-orange-500 p-4 rounded">
                    <div class="flex items-start">
                      <ion-icon [icon]="'alert-circle-outline'" class="text-orange-500 text-xl mr-2"></ion-icon>
                      <div class="text-sm text-orange-700">
                        This amount may exceed your approval limit. Manager approval may be required.
                      </div>
                    </div>
                  </div>
                }

                <!-- Action Buttons -->
                <div class="flex gap-2">
                  <ion-button 
                    expand="block" 
                    color="success" 
                    [disabled]="!isApproveFormValid()"
                    (click)="confirmApprove()">
                    <ion-icon slot="start" [icon]="'checkmark-circle-outline'"></ion-icon>
                    Confirm Approval
                  </ion-button>
                  <ion-button expand="block" fill="outline" (click)="closeApproveModal()">
                    Cancel
                  </ion-button>
                </div>
              </div>
            }
          </ion-content>
        </ng-template>
      </ion-modal>

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
                  <div class="font-bold text-lg">{{ selectedApp()!.customerName }}</div>
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
})
export class CollectorApplicationsPage implements OnInit {
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
    notes: '',
  };

  rejectForm: RejectApplicationDto = {
    rejectionReason: '',
    notes: '',
  };

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
    });
  }

  ngOnInit() {
    const user = this.authService.currentUser();
    if (user) {
      this.collectorId.set(Number(user.id));
      this.loadApplications();
    }
  }

  async loadApplications() {
    this.loading.set(true);
    try {
      const apps = await this.collectorService.getPendingApplications(this.collectorId()).toPromise();
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

  openApproveModal(app: CollectorApplication) {
    this.selectedApp.set(app);
    this.approveForm = {
      approvedAmount: app.requestedAmount,
      approvedTermDays: app.requestedTermDays,
      approvedInterestRate: 2.5, // Default rate
      notes: '',
    };
    this.showApproveModal.set(true);
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

    const alert = await this.alertController.create({
      header: 'Confirm Approval',
      message: `Approve loan of ₱${this.approveForm.approvedAmount.toLocaleString()} for ${this.selectedApp()!.customerName}?`,
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

    const alert = await this.alertController.create({
      header: 'Confirm Rejection',
      message: `Reject application from ${this.selectedApp()!.customerName}?`,
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

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
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
