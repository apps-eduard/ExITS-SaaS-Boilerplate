// Collector Disbursements Page - Disburse Approved Loans
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
  IonSelect,
  IonSelectOption,
  IonTextarea,
  ToastController,
  AlertController,
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

@Component({
  selector: 'app-collector-disbursements',
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
    IonSelect,
    IonSelectOption,
    IonTextarea,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/collector/dashboard"></ion-back-button>
        </ion-buttons>
        <ion-title>Pending Disbursements</ion-title>
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
            <ion-skeleton-text animated class="h-40 rounded-lg"></ion-skeleton-text>
          }
        </div>
      }

      <!-- Empty State -->
      @if (!loading() && disbursements().length === 0) {
        <div class="flex flex-col items-center justify-center h-full text-center p-8">
          <ion-icon [icon]="'card-outline'" class="text-6xl text-gray-400 mb-4"></ion-icon>
          <h2 class="text-xl font-bold text-gray-700 mb-2">No Pending Disbursements</h2>
          <p class="text-gray-500">All approved loans have been disbursed</p>
        </div>
      }

      <!-- Disbursements List -->
      @if (!loading() && disbursements().length > 0) {
        <div class="space-y-4">
          @for (disbursement of disbursements(); track disbursement.id) {
            <ion-card class="m-0">
              <ion-card-header>
                <div class="flex justify-between items-start">
                  <div>
                    <ion-card-title class="text-base">{{ disbursement.customerName }}</ion-card-title>
                    <p class="text-sm text-gray-600 mt-1">{{ disbursement.loanNumber }}</p>
                  </div>
                  <ion-badge color="success">Approved</ion-badge>
                </div>
              </ion-card-header>

              <ion-card-content>
                <div class="space-y-4">
                  <!-- Disbursement Details -->
                  <div class="bg-blue-50 p-4 rounded-lg space-y-2">
                    <div class="flex justify-between items-center">
                      <span class="text-gray-700">Principal Amount</span>
                      <span class="font-bold text-blue-900">₱{{ disbursement.principalAmount.toLocaleString() }}</span>
                    </div>
                    <div class="flex justify-between items-center text-sm">
                      <span class="text-gray-600">Processing Fee</span>
                      <span class="text-red-600">- ₱{{ disbursement.processingFee.toLocaleString() }}</span>
                    </div>
                    <div class="flex justify-between items-center text-sm">
                      <span class="text-gray-600">Platform Fee</span>
                      <span class="text-red-600">- ₱{{ disbursement.platformFee.toLocaleString() }}</span>
                    </div>
                    <div class="border-t border-blue-200 pt-2 mt-2">
                      <div class="flex justify-between items-center">
                        <span class="font-semibold text-gray-700">Net Disbursement</span>
                        <span class="font-bold text-green-600 text-lg">₱{{ disbursement.netDisbursement.toLocaleString() }}</span>
                      </div>
                    </div>
                  </div>

                  <!-- Additional Info -->
                  <div class="grid grid-cols-2 gap-3 text-sm">
                    <div>
                      <div class="text-gray-600">Approved Date</div>
                      <div class="font-semibold">{{ formatDate(disbursement.approvedAt) }}</div>
                    </div>
                    <div>
                      <div class="text-gray-600">Customer ID</div>
                      <div class="font-semibold">{{ disbursement.customerId }}</div>
                    </div>
                  </div>

                  <!-- Action Buttons -->
                  <div class="flex gap-2">
                    <ion-button 
                      expand="block" 
                      color="success"
                      (click)="openDisburseModal(disbursement)">
                      <ion-icon slot="start" [icon]="'checkmark-circle-outline'"></ion-icon>
                      Disburse Now
                    </ion-button>
                  </div>
                </div>
              </ion-card-content>
            </ion-card>
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
    </ion-content>
  `,
})
export class CollectorDisbursementsPage implements OnInit {
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
      this.loadDisbursements();
    }
  }

  async loadDisbursements() {
    this.loading.set(true);
    try {
      const data = await this.collectorService.getPendingDisbursements(this.collectorId()).toPromise();
      this.disbursements.set(data || []);
    } catch (error: any) {
      await this.showToast(error.error?.message || 'Failed to load disbursements', 'danger');
    } finally {
      this.loading.set(false);
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
