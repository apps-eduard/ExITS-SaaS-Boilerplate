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
import { CollectorTopBarComponent } from '../../shared/components/collector-top-bar.component';

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
    CollectorTopBarComponent
  ],
  template: `
    <ion-content [fullscreen]="true" class="main-content">
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <app-collector-top-bar
        emoji="🧭"
        title="Customer Visits"
        subtitle="Live check-ins and history"
      >
        <div topbar-right class="topbar-pills">
          @if (activeVisit()) {
            <span class="pill pill-live">Active visit</span>
          }
          <span class="pill pill-outline">{{ todayVisits().length }} today</span>
        </div>
      </app-collector-top-bar>

      <!-- Content Container -->
      <div class="visits-container">
        @if (activeVisit()) {
          <ion-card class="m-0">
            <ion-card-header>
              <ion-card-title class="visit-card-title">
                <span>Active Visit</span>
                <ion-badge color="success">In Progress</ion-badge>
              </ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <div class="active-visit">
                <div>
                  <div class="value text-lg">{{ activeVisit()!.customerName }}</div>
                  <div class="label">{{ activeVisit()!.visitType | titlecase }}</div>
                </div>

                <div class="visit-meta">
                  <div>
                    <div class="label">Started</div>
                    <div class="value">{{ formatTime(activeVisit()!.checkInTime) }}</div>
                  </div>

                  @if (activeVisit()!.distanceFromCustomerMeters !== null) {
                    <div>
                      <div class="label">Distance</div>
                      <div class="value">{{ formatDistance(activeVisit()!.distanceFromCustomerMeters!) }}</div>
                    </div>
                  }
                </div>

                <ion-button expand="block" color="success" (click)="openCheckOutModal()">
                  <ion-icon slot="start" [icon]="'checkmark-circle-outline'"></ion-icon>
                  Check Out
                </ion-button>
              </div>
            </ion-card-content>
          </ion-card>
        } @else {
          <ion-card class="cta-card">
            <ion-card-content>
              <div class="cta-content">
                <div>
                  <div class="cta-title">No active visit</div>
                  <div class="cta-subtitle">Start your next customer visit with GPS tracking.</div>
                </div>
                <ion-button color="primary" (click)="openCheckInModal()">
                  <ion-icon slot="start" [icon]="'location-outline'"></ion-icon>
                  Start Visit
                </ion-button>
              </div>
            </ion-card-content>
          </ion-card>
        }

        <div class="section-header">
          <h3>Today's Visits</h3>
          <span class="count-badge">{{ todayVisits().length }}</span>
        </div>

        @if (loading()) {
          <ion-card>
            <ion-card-content>
              <div class="state-message">Loading visits...</div>
            </ion-card-content>
          </ion-card>
        } @else if (todayVisits().length === 0) {
          <ion-card>
            <ion-card-content class="empty-state">
              <div class="state-message">No visits logged yet today.</div>
              <ion-button expand="block" fill="outline" color="primary" (click)="openCheckInModal()">
                <ion-icon slot="start" [icon]="'location-outline'"></ion-icon>
                Start a visit
              </ion-button>
            </ion-card-content>
          </ion-card>
        } @else {
          @for (visit of todayVisits(); track visit.id) {
            <ion-card>
              <ion-card-header>
                <ion-card-title class="visit-card-title">
                  <span>{{ visit.customerName }}</span>
                  <ion-badge [color]="getVisitStatusColor(visit.status)">
                    {{ visit.status | titlecase }}
                  </ion-badge>
                </ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <div class="visit-meta">
                  <div>
                    <div class="label">Visit Type</div>
                    <div class="value">{{ visit.visitType | titlecase }}</div>
                  </div>
                  <div>
                    <div class="label">Check In</div>
                    <div class="value">{{ formatTime(visit.checkInTime) }}</div>
                  </div>
                  @if (visit.checkOutTime) {
                    <div>
                      <div class="label">Check Out</div>
                      <div class="value">{{ formatTime(visit.checkOutTime) }}</div>
                    </div>
                  }
                  @if (visit.durationMinutes) {
                    <div>
                      <div class="label">Duration</div>
                      <div class="value">{{ visit.durationMinutes }} mins</div>
                    </div>
                  }
                </div>

                @if (visit.visitOutcome) {
                  <div class="visit-detail">
                    <div class="label">Outcome</div>
                    <div class="value">{{ visit.visitOutcome | titlecase }}</div>
                  </div>
                }

                @if (visit.paymentCollectedAmount) {
                  <div class="visit-detail">
                    <div class="label">Payment Collected</div>
                    <div class="value payment">₱{{ visit.paymentCollectedAmount.toLocaleString() }}</div>
                  </div>
                }
              </ion-card-content>
            </ion-card>
          }
        }
      </div>

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

    .visits-container {
      padding: calc(84px + env(safe-area-inset-top) + 0.85rem) 0.85rem calc(72px + env(safe-area-inset-bottom) + 0.85rem) 0.85rem;
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .topbar-pills {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-right: 0.15rem;
    }

    .pill {
      display: inline-flex;
      align-items: center;
      gap: 0.25rem;
      padding: 0.35rem 0.75rem;
      border-radius: 999px;
      background: rgba(255, 255, 255, 0.2);
      color: rgba(255, 255, 255, 0.9);
      font-size: 0.7rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      backdrop-filter: blur(4px);
    }

    .pill-live {
      background: rgba(34, 197, 94, 0.25);
      color: #bbf7d0;
    }

    .pill-outline {
      background: transparent;
      border: 1px solid rgba(255, 255, 255, 0.35);
    }

    .cta-card {
      margin: 0;
    }

    .cta-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .cta-title {
      font-size: 1rem;
      font-weight: 600;
      color: #0f172a;
    }

    .cta-subtitle {
      font-size: 0.875rem;
      color: #475569;
      margin-top: 0.25rem;
    }

    .section-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      padding: 0 0.25rem;
    }

    .section-header h3 {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 600;
      color: #1e293b;
    }

    .count-badge {
      display: inline-flex;
      align-items: center;
      justify-content: center;
      min-width: 2rem;
      padding: 0.15rem 0.55rem;
      border-radius: 999px;
      background: #e2e8f0;
      color: #0f172a;
      font-size: 0.75rem;
      font-weight: 600;
    }

    .state-message {
      text-align: center;
      color: #475569;
    }

    .empty-state {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
      align-items: stretch;
    }

    .visit-card-title {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.5rem;
      font-size: 1rem;
    }

    .active-visit {
      display: flex;
      flex-direction: column;
      gap: 1rem;
    }

    .visit-meta {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(140px, 1fr));
      gap: 0.75rem;
    }

    .visit-detail {
      margin-top: 0.75rem;
    }

    .label {
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: #64748b;
    }

    .value {
      font-size: 0.95rem;
      font-weight: 600;
      color: #0f172a;
    }

    .payment {
      color: #15803d;
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
