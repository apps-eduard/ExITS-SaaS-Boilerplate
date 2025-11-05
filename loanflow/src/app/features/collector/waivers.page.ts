// Collector Penalty Waivers Page - Request and View Waivers
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
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonButtons,
  IonBackButton,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonBadge,
  IonItem,
  IonLabel,
  IonSkeletonText,
  IonSegment,
  IonSegmentButton,
  ToastController,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  timeOutline,
  checkmarkCircleOutline,
  closeCircleOutline,
  alertCircleOutline,
  addCircleOutline,
  documentTextOutline,
} from 'ionicons/icons';
import { 
  CollectorService, 
  PenaltyWaiver,
  RequestWaiverDto,
  AssignedCustomer,
} from '../../core/services/collector.service';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-collector-waivers',
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
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonButtons,
    IonBackButton,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonBadge,
    IonItem,
    IonLabel,
    IonSkeletonText,
    IonSegment,
    IonSegmentButton,
  ],
  template: `
    <ion-header>
      <ion-toolbar>
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/collector/dashboard"></ion-back-button>
        </ion-buttons>
        <ion-title>Penalty Waivers</ion-title>
      </ion-toolbar>
      <ion-toolbar>
        <ion-segment [(ngModel)]="selectedTab" (ionChange)="onTabChange()">
          <ion-segment-button value="pending">
            <ion-label>Pending</ion-label>
          </ion-segment-button>
          <ion-segment-button value="request">
            <ion-label>Request New</ion-label>
          </ion-segment-button>
        </ion-segment>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Pending Waivers Tab -->
      @if (selectedTab === 'pending') {
        <!-- Loading State -->
        @if (loading()) {
          <div class="space-y-4">
            @for (i of [1,2,3]; track i) {
              <ion-skeleton-text animated class="h-32 rounded-lg"></ion-skeleton-text>
            }
          </div>
        }

        <!-- Empty State -->
        @if (!loading() && pendingWaivers().length === 0) {
          <div class="flex flex-col items-center justify-center h-full text-center p-8">
            <ion-icon [icon]="'time-outline'" class="text-6xl text-gray-400 mb-4"></ion-icon>
            <h2 class="text-xl font-bold text-gray-700 mb-2">No Pending Waivers</h2>
            <p class="text-gray-500">All waiver requests have been processed</p>
          </div>
        }

        <!-- Waivers List -->
        @if (!loading() && pendingWaivers().length > 0) {
          <div class="space-y-4">
            @for (waiver of pendingWaivers(); track waiver.id) {
              <ion-card class="m-0">
                <ion-card-header>
                  <div class="flex justify-between items-start">
                    <div>
                      <ion-card-title class="text-base">{{ waiver.customerName }}</ion-card-title>
                      <p class="text-sm text-gray-600 mt-1">{{ waiver.loanNumber }}</p>
                    </div>
                    <ion-badge [color]="getWaiverStatusColor(waiver.status)">
                      {{ waiver.status | titlecase }}
                    </ion-badge>
                  </div>
                </ion-card-header>

                <ion-card-content>
                  <div class="space-y-3">
                    <!-- Waiver Details -->
                    <div class="bg-orange-50 p-4 rounded-lg space-y-2">
                      <div class="flex justify-between items-center">
                        <span class="text-gray-700">Original Penalty</span>
                        <span class="font-bold text-red-600">₱{{ waiver.originalPenaltyAmount.toLocaleString() }}</span>
                      </div>
                      <div class="flex justify-between items-center">
                        <span class="text-gray-700">Requested Waiver</span>
                        <span class="font-bold text-orange-600">₱{{ waiver.requestedWaiverAmount.toLocaleString() }}</span>
                      </div>
                      @if (waiver.approvedWaiverAmount) {
                        <div class="flex justify-between items-center border-t border-orange-200 pt-2">
                          <span class="font-semibold text-gray-700">Approved Amount</span>
                          <span class="font-bold text-green-600">₱{{ waiver.approvedWaiverAmount.toLocaleString() }}</span>
                        </div>
                      }
                    </div>

                    <!-- Additional Info -->
                    <div class="grid grid-cols-2 gap-3 text-sm">
                      <div>
                        <div class="text-gray-600">Type</div>
                        <div class="font-semibold">{{ waiver.waiveType | titlecase }}</div>
                      </div>
                      @if (waiver.installmentNumber) {
                        <div>
                          <div class="text-gray-600">Installment</div>
                          <div class="font-semibold">#{{ waiver.installmentNumber }}</div>
                        </div>
                      }
                      <div>
                        <div class="text-gray-600">Requested</div>
                        <div class="font-semibold">{{ formatDate(waiver.requestedAt) }}</div>
                      </div>
                      @if (waiver.approvedAt) {
                        <div>
                          <div class="text-gray-600">Approved</div>
                          <div class="font-semibold">{{ formatDate(waiver.approvedAt) }}</div>
                        </div>
                      }
                    </div>

                    <!-- Reason -->
                    <div class="bg-gray-50 p-3 rounded">
                      <div class="text-sm text-gray-600 mb-1">Reason</div>
                      <div class="text-sm">{{ waiver.reason }}</div>
                    </div>
                  </div>
                </ion-card-content>
              </ion-card>
            }
          </div>
        }
      }

      <!-- Request New Waiver Tab -->
      @if (selectedTab === 'request') {
        <div class="space-y-4">
          <ion-card class="m-0">
            <ion-card-header>
              <ion-card-title class="text-base">Request Penalty Waiver</ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <div class="space-y-4">
                <!-- Customer Selection -->
                <ion-item>
                  <ion-label position="stacked">Customer *</ion-label>
                  <ion-select 
                    [(ngModel)]="requestForm.loanId" 
                    placeholder="Select customer loan"
                    interface="action-sheet">
                    @for (customer of assignedCustomers(); track customer.id) {
                      <ion-select-option [value]="customer.id">
                        {{ customer.firstName }} {{ customer.lastName }}
                      </ion-select-option>
                    }
                  </ion-select>
                </ion-item>

                <!-- Waive Type -->
                <ion-item>
                  <ion-label position="stacked">Waiver Type *</ion-label>
                  <ion-select 
                    [(ngModel)]="requestForm.waiveType" 
                    placeholder="Select type"
                    interface="action-sheet">
                    <ion-select-option value="full">Full Waiver</ion-select-option>
                    <ion-select-option value="partial">Partial Waiver</ion-select-option>
                  </ion-select>
                </ion-item>

                <!-- Requested Amount -->
                <ion-item>
                  <ion-label position="stacked">Requested Waiver Amount *</ion-label>
                  <ion-input 
                    type="number"
                    [(ngModel)]="requestForm.requestedWaiverAmount"
                    placeholder="Enter amount">
                  </ion-input>
                </ion-item>

                <!-- Reason -->
                <ion-item>
                  <ion-label position="stacked">Reason *</ion-label>
                  <ion-select 
                    [(ngModel)]="requestForm.reason" 
                    placeholder="Select reason"
                    interface="action-sheet">
                    <ion-select-option value="Financial hardship">Financial hardship</ion-select-option>
                    <ion-select-option value="Medical emergency">Medical emergency</ion-select-option>
                    <ion-select-option value="Natural disaster">Natural disaster</ion-select-option>
                    <ion-select-option value="Job loss">Job loss</ion-select-option>
                    <ion-select-option value="Good payment history">Good payment history</ion-select-option>
                    <ion-select-option value="System error">System error</ion-select-option>
                    <ion-select-option value="Other">Other</ion-select-option>
                  </ion-select>
                </ion-item>

                <!-- Additional Notes -->
                <ion-item>
                  <ion-label position="stacked">Additional Notes</ion-label>
                  <ion-textarea 
                    [(ngModel)]="requestForm.notes"
                    rows="4"
                    placeholder="Provide detailed explanation for waiver request...">
                  </ion-textarea>
                </ion-item>

                <!-- Info Box -->
                <div class="bg-blue-50 border-l-4 border-blue-500 p-4 rounded">
                  <div class="flex items-start">
                    <ion-icon [icon]="'alert-circle-outline'" class="text-blue-500 text-xl mr-2"></ion-icon>
                    <div class="text-sm text-blue-700">
                      <p class="font-semibold mb-1">Auto-Approval</p>
                      <p>Waiver requests within your limit will be automatically approved. Higher amounts require manager approval.</p>
                    </div>
                  </div>
                </div>

                <!-- Submit Button -->
                <ion-button 
                  expand="block" 
                  color="primary"
                  [disabled]="!isRequestFormValid()"
                  (click)="submitWaiverRequest()">
                  <ion-icon slot="start" [icon]="'add-circle-outline'"></ion-icon>
                  Submit Waiver Request
                </ion-button>
              </div>
            </ion-card-content>
          </ion-card>

          <!-- Recent Requests -->
          @if (pendingWaivers().length > 0) {
            <div class="mt-6">
              <h3 class="text-lg font-bold text-gray-800 mb-3">Recent Requests</h3>
              <div class="space-y-3">
                @for (waiver of pendingWaivers().slice(0, 3); track waiver.id) {
                  <ion-card class="m-0">
                    <ion-card-content>
                      <div class="flex justify-between items-start">
                        <div>
                          <div class="font-bold">{{ waiver.customerName }}</div>
                          <div class="text-sm text-gray-600">₱{{ waiver.requestedWaiverAmount.toLocaleString() }}</div>
                        </div>
                        <ion-badge [color]="getWaiverStatusColor(waiver.status)">
                          {{ waiver.status | titlecase }}
                        </ion-badge>
                      </div>
                    </ion-card-content>
                  </ion-card>
                }
              </div>
            </div>
          }
        </div>
      }
    </ion-content>
  `,
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

  constructor() {
    addIcons({
      timeOutline,
      checkmarkCircleOutline,
      closeCircleOutline,
      alertCircleOutline,
      addCircleOutline,
      documentTextOutline,
    });
  }

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
