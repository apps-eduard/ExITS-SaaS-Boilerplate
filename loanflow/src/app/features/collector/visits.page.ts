// Collector Visits Page - GPS Check-in/out and Visit Logging
import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import {
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonButton,
  IonIcon,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  IonHeader,
  IonToolbar,
  IonTitle,
  IonButtons,
  IonModal,
  IonInput,
  IonSelect,
  IonSelectOption,
  IonTextarea,
  IonBadge,
  IonItem,
  IonLabel,
  ToastController,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  locationOutline,
  checkmarkCircleOutline,
  timeOutline,
  navigateOutline,
  personOutline,
  calendarOutline,
  cashOutline,
  alertCircleOutline,
} from 'ionicons/icons';
import { 
  CollectorService, 
  CustomerVisit,
  LogVisitDto,
  CheckOutVisitDto,
  AssignedCustomer,
} from '../../core/services/collector.service';
import { AuthService } from '../../core/services/auth.service';
import { Geolocation } from '@capacitor/geolocation';
import { HeaderUtilsComponent } from '../../shared/components/header-utils.component';

@Component({
  selector: 'app-collector-visits',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonButton,
    IonIcon,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonModal,
    IonInput,
    IonSelect,
    IonSelectOption,
    IonTextarea,
    IonBadge,
    IonItem,
    IonLabel,
    HeaderUtilsComponent
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
            <span class="app-emoji">📍</span>
            <span class="app-title">Customer Visits</span>
          </div>
          <div class="top-bar-right">
            <app-header-utils />
          </div>
        </div>
      </div>

      <!-- Content Container -->
      <div class="visits-container">
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Active Visit Card -->
      @if (activeVisit()) {
        <ion-card class="m-0 mb-4 bg-green-50 border-2 border-green-500">
          <ion-card-header>
            <ion-card-title class="text-base flex items-center justify-between">
              <span>Active Visit</span>
              <ion-badge color="success">In Progress</ion-badge>
            </ion-card-title>
          </ion-card-header>
          <ion-card-content>
            <div class="space-y-3">
              <div>
                <div class="text-lg font-bold">{{ activeVisit()!.customerName }}</div>
                <div class="text-sm text-gray-600">{{ activeVisit()!.visitType | titlecase }}</div>
              </div>

              <div class="flex items-center gap-2 text-sm">
                <ion-icon [icon]="'time-outline'" class="text-gray-600"></ion-icon>
                <span>Started {{ formatTime(activeVisit()!.checkInTime) }}</span>
              </div>

              @if (activeVisit()!.distanceFromCustomerMeters !== null) {
                <div class="flex items-center gap-2 text-sm">
                  <ion-icon [icon]="'navigate-outline'" class="text-gray-600"></ion-icon>
                  <span>{{ formatDistance(activeVisit()!.distanceFromCustomerMeters!) }} from registered address</span>
                </div>
              }

              <ion-button expand="block" color="success" (click)="openCheckOutModal()">
                <ion-icon slot="start" [icon]="'checkmark-circle-outline'"></ion-icon>
                Check Out
              </ion-button>
            </div>
          </ion-card-content>
        </ion-card>
      }

      <!-- Start Visit Button -->
      @if (!activeVisit()) {
        <ion-button expand="block" color="primary" class="mb-4" (click)="openCheckInModal()">
          <ion-icon slot="start" [icon]="'location-outline'"></ion-icon>
          Start New Visit
        </ion-button>
      }

      <!-- Today's Visits -->
      <div class="mb-4">
        <h2 class="text-lg font-bold text-gray-800 mb-3">Today's Visits</h2>

        @if (loading()) {
          <div class="text-center py-8 text-gray-500">Loading...</div>
        }

        @if (!loading() && todayVisits().length === 0) {
          <div class="text-center py-8 text-gray-500">
            <ion-icon [icon]="'location-outline'" class="text-5xl text-gray-400 mb-2"></ion-icon>
            <p>No visits logged today</p>
          </div>
        }

        @if (!loading() && todayVisits().length > 0) {
          <div class="space-y-3">
            @for (visit of todayVisits(); track visit.id) {
              <ion-card class="m-0">
                <ion-card-content>
                  <div class="flex justify-between items-start mb-2">
                    <div>
                      <div class="font-bold">{{ visit.customerName }}</div>
                      <div class="text-sm text-gray-600">{{ visit.visitType | titlecase }}</div>
                    </div>
                    <ion-badge [color]="getVisitStatusColor(visit.status)">
                      {{ visit.status }}
                    </ion-badge>
                  </div>

                  <div class="grid grid-cols-2 gap-2 text-sm mt-3">
                    <div>
                      <div class="text-gray-600">Check In</div>
                      <div class="font-semibold">{{ formatTime(visit.checkInTime) }}</div>
                    </div>
                    @if (visit.checkOutTime) {
                      <div>
                        <div class="text-gray-600">Check Out</div>
                        <div class="font-semibold">{{ formatTime(visit.checkOutTime) }}</div>
                      </div>
                    }
                    @if (visit.durationMinutes) {
                      <div>
                        <div class="text-gray-600">Duration</div>
                        <div class="font-semibold">{{ visit.durationMinutes }} mins</div>
                      </div>
                    }
                    @if (visit.visitOutcome) {
                      <div>
                        <div class="text-gray-600">Outcome</div>
                        <div class="font-semibold">{{ visit.visitOutcome | titlecase }}</div>
                      </div>
                    }
                    @if (visit.paymentCollectedAmount) {
                      <div class="col-span-2">
                        <div class="text-gray-600">Payment Collected</div>
                        <div class="font-semibold text-green-600">₱{{ visit.paymentCollectedAmount.toLocaleString() }}</div>
                      </div>
                    }
                  </div>
                </ion-card-content>
              </ion-card>
            }
          </div>
        }
      </div>
      </div><!-- Close visits-container -->

      <!-- Check-In Modal -->
      <ion-modal [isOpen]="showCheckInModal()" (didDismiss)="closeCheckInModal()">
        <ng-template>
          <ion-header>
            <ion-toolbar>
              <ion-title>Start Visit</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="closeCheckInModal()">Close</ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content class="ion-padding">
            <div class="space-y-4">
              <!-- GPS Status -->
              @if (currentLocation()) {
                <div class="bg-green-50 p-4 rounded-lg">
                  <div class="flex items-center gap-2 text-green-700">
                    <ion-icon [icon]="'checkmark-circle-outline'" class="text-xl"></ion-icon>
                    <span class="font-semibold">GPS Location Acquired</span>
                  </div>
                  <div class="text-sm text-gray-600 mt-1">
                    {{ currentLocation()!.latitude.toFixed(6) }}, {{ currentLocation()!.longitude.toFixed(6) }}
                  </div>
                </div>
              } @else {
                <div class="bg-yellow-50 p-4 rounded-lg">
                  <div class="flex items-center gap-2 text-yellow-700">
                    <ion-icon [icon]="'alert-circle-outline'" class="text-xl"></ion-icon>
                    <span class="font-semibold">Getting GPS location...</span>
                  </div>
                </div>
              }

              <!-- Customer Selection -->
              <ion-item>
                <ion-label position="stacked">Select Customer *</ion-label>
                <ion-select 
                  [(ngModel)]="checkInForm.customerId" 
                  placeholder="Choose customer"
                  interface="action-sheet">
                  @for (customer of assignedCustomers(); track customer.id) {
                    <ion-select-option [value]="customer.id">
                      {{ customer.firstName }} {{ customer.lastName }}
                    </ion-select-option>
                  }
                </ion-select>
              </ion-item>

              <!-- Visit Type -->
              <ion-item>
                <ion-label position="stacked">Visit Type *</ion-label>
                <ion-select 
                  [(ngModel)]="checkInForm.visitType" 
                  placeholder="Select type"
                  interface="action-sheet">
                  <ion-select-option value="collection">Collection</ion-select-option>
                  <ion-select-option value="follow_up">Follow Up</ion-select-option>
                  <ion-select-option value="documentation">Documentation</ion-select-option>
                  <ion-select-option value="relationship">Relationship Building</ion-select-option>
                  <ion-select-option value="other">Other</ion-select-option>
                </ion-select>
              </ion-item>

              <!-- Visit Purpose -->
              <ion-item>
                <ion-label position="stacked">Purpose *</ion-label>
                <ion-input 
                  [(ngModel)]="checkInForm.visitPurpose"
                  placeholder="e.g., Collect overdue payment">
                </ion-input>
              </ion-item>

              <!-- Notes -->
              <ion-item>
                <ion-label position="stacked">Notes (Optional)</ion-label>
                <ion-textarea 
                  [(ngModel)]="checkInForm.notes"
                  rows="3"
                  placeholder="Additional notes...">
                </ion-textarea>
              </ion-item>

              <!-- Action Buttons -->
              <div class="flex gap-2">
                <ion-button 
                  expand="block" 
                  color="primary" 
                  [disabled]="!isCheckInFormValid() || !currentLocation()"
                  (click)="confirmCheckIn()">
                  <ion-icon slot="start" [icon]="'location-outline'"></ion-icon>
                  Start Visit
                </ion-button>
                <ion-button expand="block" fill="outline" (click)="closeCheckInModal()">
                  Cancel
                </ion-button>
              </div>
            </div>
          </ion-content>
        </ng-template>
      </ion-modal>

      <!-- Check-Out Modal -->
      <ion-modal [isOpen]="showCheckOutModal()" (didDismiss)="closeCheckOutModal()">
        <ng-template>
          <ion-header>
            <ion-toolbar>
              <ion-title>Check Out</ion-title>
              <ion-buttons slot="end">
                <ion-button (click)="closeCheckOutModal()">Close</ion-button>
              </ion-buttons>
            </ion-toolbar>
          </ion-header>
          <ion-content class="ion-padding">
            <div class="space-y-4">
              @if (activeVisit()) {
                <!-- Visit Info -->
                <div class="bg-blue-50 p-4 rounded-lg">
                  <div class="font-bold text-lg">{{ activeVisit()!.customerName }}</div>
                  <div class="text-sm text-gray-600">{{ activeVisit()!.visitType | titlecase }}</div>
                  <div class="text-sm text-gray-600 mt-2">Started: {{ formatTime(activeVisit()!.checkInTime) }}</div>
                </div>

                <!-- Outcome -->
                <ion-item>
                  <ion-label position="stacked">Visit Outcome *</ion-label>
                  <ion-select 
                    [(ngModel)]="checkOutForm.outcome" 
                    placeholder="Select outcome"
                    interface="action-sheet">
                    <ion-select-option value="payment_collected">Payment Collected</ion-select-option>
                    <ion-select-option value="promise_to_pay">Promise to Pay</ion-select-option>
                    <ion-select-option value="customer_not_home">Customer Not Home</ion-select-option>
                    <ion-select-option value="refused_payment">Refused Payment</ion-select-option>
                    <ion-select-option value="other">Other</ion-select-option>
                  </ion-select>
                </ion-item>

                <!-- Payment Amount (if collected) -->
                @if (checkOutForm.outcome === 'payment_collected') {
                  <ion-item>
                    <ion-label position="stacked">Payment Amount *</ion-label>
                    <ion-input 
                      type="number"
                      [(ngModel)]="checkOutForm.paymentAmount"
                      placeholder="Enter amount">
                    </ion-input>
                  </ion-item>
                }

                <!-- Next Follow-up (if promise to pay) -->
                @if (checkOutForm.outcome === 'promise_to_pay') {
                  <ion-item>
                    <ion-label position="stacked">Next Follow-up Date</ion-label>
                    <ion-input 
                      type="date"
                      [(ngModel)]="checkOutForm.nextFollowUpDate">
                    </ion-input>
                  </ion-item>
                }

                <!-- Outcome Notes -->
                <ion-item>
                  <ion-label position="stacked">Outcome Notes *</ion-label>
                  <ion-textarea 
                    [(ngModel)]="checkOutForm.outcomeNotes"
                    rows="4"
                    placeholder="Describe the visit outcome...">
                  </ion-textarea>
                </ion-item>

                <!-- Action Buttons -->
                <div class="flex gap-2">
                  <ion-button 
                    expand="block" 
                    color="success" 
                    [disabled]="!isCheckOutFormValid()"
                    (click)="confirmCheckOut()">
                    <ion-icon slot="start" [icon]="'checkmark-circle-outline'"></ion-icon>
                    Complete Visit
                  </ion-button>
                  <ion-button expand="block" fill="outline" (click)="closeCheckOutModal()">
                    Cancel
                  </ion-button>
                </div>
              }
            </div>
          </ion-content>
        </ng-template>
      </ion-modal>
    </ion-content>
  `,
  styles: [`
    .main-content {
      --background: #f8fafc;
    }

    .fixed-top-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 100;
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      box-shadow: 0 4px 12px rgba(37, 99, 235, 0.15);
      padding-top: env(safe-area-inset-top);
    }

    .top-bar-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      height: 56px;
      padding: 0 1rem;
    }

    .top-bar-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
    }

    .app-emoji {
      font-size: 1.5rem;
      filter: drop-shadow(0 2px 4px rgba(0,0,0,0.1));
    }

    .app-title {
      font-size: 1.125rem;
      font-weight: 600;
      color: white;
      letter-spacing: 0.01em;
    }

    .top-bar-right {
      display: flex;
      align-items: center;
      gap: 0.5rem;
    }

    .visits-container {
      padding: calc(56px + env(safe-area-inset-top) + 0.85rem) 0.85rem calc(60px + env(safe-area-inset-bottom) + 0.85rem) 0.85rem;
    }
  `]
})
export class CollectorVisitsPage implements OnInit {
  private collectorService = inject(CollectorService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastController = inject(ToastController);
  private alertController = inject(AlertController);

  loading = signal(true);
  todayVisits = signal<CustomerVisit[]>([]);
  activeVisit = signal<CustomerVisit | null>(null);
  assignedCustomers = signal<AssignedCustomer[]>([]);
  collectorId = signal<number>(0);
  currentLocation = signal<{ latitude: number; longitude: number } | null>(null);

  // Modal states
  showCheckInModal = signal(false);
  showCheckOutModal = signal(false);

  // Form models
  checkInForm: LogVisitDto = {
    customerId: 0,
    visitType: 'collection',
    visitPurpose: '',
    latitude: 0,
    longitude: 0,
    notes: '',
  };

  checkOutForm: CheckOutVisitDto = {
    latitude: 0,
    longitude: 0,
    outcome: 'payment_collected',
    outcomeNotes: '',
  };

  constructor() {
    addIcons({
      locationOutline,
      checkmarkCircleOutline,
      timeOutline,
      navigateOutline,
      personOutline,
      calendarOutline,
      cashOutline,
      alertCircleOutline,
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
      const [visits, active, customers] = await Promise.all([
        this.collectorService.getTodayVisits(this.collectorId()).toPromise(),
        this.collectorService.getActiveVisit(this.collectorId()).toPromise(),
        this.collectorService.getAssignedCustomers(this.collectorId()).toPromise(),
      ]);

      this.todayVisits.set(visits || []);
      this.activeVisit.set(active || null);
      this.assignedCustomers.set(customers || []);
    } catch (error: any) {
      await this.showToast(error.error?.message || 'Failed to load visits', 'danger');
    } finally {
      this.loading.set(false);
    }
  }

  async handleRefresh(event: any) {
    await this.loadData();
    event.target.complete();
  }

  async openCheckInModal() {
    // Get GPS location
    await this.getCurrentLocation();
    
    this.checkInForm = {
      customerId: 0,
      visitType: 'collection',
      visitPurpose: '',
      latitude: this.currentLocation()?.latitude || 0,
      longitude: this.currentLocation()?.longitude || 0,
      notes: '',
    };
    
    this.showCheckInModal.set(true);
  }

  closeCheckInModal() {
    this.showCheckInModal.set(false);
  }

  async openCheckOutModal() {
    // Get GPS location
    await this.getCurrentLocation();
    
    this.checkOutForm = {
      latitude: this.currentLocation()?.latitude || 0,
      longitude: this.currentLocation()?.longitude || 0,
      outcome: 'payment_collected',
      outcomeNotes: '',
    };
    
    this.showCheckOutModal.set(true);
  }

  closeCheckOutModal() {
    this.showCheckOutModal.set(false);
  }

  async getCurrentLocation() {
    try {
      const coordinates = await Geolocation.getCurrentPosition();
      this.currentLocation.set({
        latitude: coordinates.coords.latitude,
        longitude: coordinates.coords.longitude,
      });
    } catch (error) {
      await this.showToast('Unable to get GPS location. Please enable location services.', 'warning');
    }
  }

  isCheckInFormValid(): boolean {
    return (
      this.checkInForm.customerId > 0 &&
      !!this.checkInForm.visitType &&
      this.checkInForm.visitPurpose !== ''
    );
  }

  isCheckOutFormValid(): boolean {
    if (!this.checkOutForm.outcome || !this.checkOutForm.outcomeNotes) return false;
    
    // If payment collected, amount is required
    if (this.checkOutForm.outcome === 'payment_collected' && !this.checkOutForm.paymentAmount) {
      return false;
    }
    
    return true;
  }

  async confirmCheckIn() {
    const alert = await this.alertController.create({
      header: 'Start Visit',
      message: 'GPS location will be recorded. Continue?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Start',
          handler: async () => {
            await this.checkIn();
          },
        },
      ],
    });

    await alert.present();
  }

  async checkIn() {
    try {
      this.checkInForm.latitude = this.currentLocation()?.latitude || 0;
      this.checkInForm.longitude = this.currentLocation()?.longitude || 0;

      const visit = await this.collectorService.logVisit(this.collectorId(), this.checkInForm).toPromise();
      
      await this.showToast('Visit started successfully', 'success');
      this.closeCheckInModal();
      await this.loadData();
    } catch (error: any) {
      await this.showToast(error.error?.message || 'Failed to start visit', 'danger');
    }
  }

  async confirmCheckOut() {
    const alert = await this.alertController.create({
      header: 'Complete Visit',
      message: 'Are you ready to check out from this visit?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Check Out',
          handler: async () => {
            await this.checkOut();
          },
        },
      ],
    });

    await alert.present();
  }

  async checkOut() {
    if (!this.activeVisit()) return;

    try {
      this.checkOutForm.latitude = this.currentLocation()?.latitude || 0;
      this.checkOutForm.longitude = this.currentLocation()?.longitude || 0;

      await this.collectorService.checkOutVisit(
        this.collectorId(),
        this.activeVisit()!.id,
        this.checkOutForm
      ).toPromise();
      
      await this.showToast('Visit completed successfully', 'success');
      this.closeCheckOutModal();
      await this.loadData();
    } catch (error: any) {
      await this.showToast(error.error?.message || 'Failed to complete visit', 'danger');
    }
  }

  formatTime(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  formatDistance(meters: number): string {
    if (meters < 1000) {
      return `${Math.round(meters)}m`;
    }
    return `${(meters / 1000).toFixed(1)}km`;
  }

  getVisitStatusColor(status: string): string {
    switch (status.toLowerCase()) {
      case 'in_progress':
        return 'warning';
      case 'completed':
        return 'success';
      case 'cancelled':
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
