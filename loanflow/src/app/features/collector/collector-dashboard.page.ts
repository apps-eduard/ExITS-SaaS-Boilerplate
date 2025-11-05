// Collector Dashboard Page - Ionic 8 + Tailwind Design
import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import {
  IonHeader,
  IonToolbar,
  IonContent,
  IonRefresher,
  IonRefresherContent,
  IonButton,
  IonIcon,
  IonBadge,
  IonSkeletonText,
  IonCard,
  IonCardHeader,
  IonCardTitle,
  IonCardContent,
  ToastController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  personOutline,
  walletOutline,
  documentTextOutline,
  checkmarkCircleOutline,
  timeOutline,
  locationOutline,
  alertCircleOutline,
  trendingUpOutline,
  cardOutline,
  refreshOutline,
  arrowForwardOutline,
} from 'ionicons/icons';
import { CollectorService, CollectorDailySummary, CollectorLimits } from '../../core/services/collector.service';
import { AuthService } from '../../core/services/auth.service';
import { CollectorTabsComponent } from '../../shared/components/collector-tabs.component';

@Component({
  selector: 'app-collector-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonContent,
    IonRefresher,
    IonRefresherContent,
    IonButton,
    IonIcon,
    IonBadge,
    IonSkeletonText,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    CollectorTabsComponent,
  ],
  template: `
    <ion-header>
      <ion-toolbar class="bg-gradient-to-r from-blue-600 to-blue-700">
        <div class="px-4 py-2">
          <h1 class="text-2xl font-bold text-white">Collector Dashboard</h1>
          <p class="text-blue-100 text-sm">{{ currentDate }}</p>
        </div>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding bg-gray-50">
      <ion-refresher slot="fixed" (ionRefresh)="handleRefresh($event)">
        <ion-refresher-content></ion-refresher-content>
      </ion-refresher>

      <!-- Loading Skeleton -->
      @if (loading()) {
        <div class="space-y-4">
          <ion-skeleton-text animated class="h-32 rounded-lg"></ion-skeleton-text>
          <ion-skeleton-text animated class="h-24 rounded-lg"></ion-skeleton-text>
          <ion-skeleton-text animated class="h-24 rounded-lg"></ion-skeleton-text>
        </div>
      }

      <!-- Dashboard Content -->
      @if (!loading() && summary()) {
        <div class="space-y-4">
          <!-- Collection Progress Card -->
          <ion-card class="m-0">
            <ion-card-header>
              <ion-card-title class="text-lg font-bold text-gray-800">
                Today's Collection Progress
              </ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <div class="space-y-4">
                <!-- Collection Amount -->
                <div>
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-sm text-gray-600">Collected</span>
                    <span class="text-lg font-bold text-green-600">
                      ₱{{ summary()!.collectedToday.toLocaleString() }}
                    </span>
                  </div>
                  <div class="flex justify-between items-center text-sm text-gray-500">
                    <span>Target: ₱{{ summary()!.collectionTarget.toLocaleString() }}</span>
                    <span>{{ collectionPercentage() }}%</span>
                  </div>
                  <!-- Progress Bar -->
                  <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      class="h-2 rounded-full transition-all"
                      [class.bg-green-500]="collectionPercentage() >= 100"
                      [class.bg-blue-500]="collectionPercentage() < 100"
                      [style.width.%]="Math.min(collectionPercentage(), 100)">
                    </div>
                  </div>
                </div>

                <!-- Visits Progress -->
                <div>
                  <div class="flex justify-between items-center mb-2">
                    <span class="text-sm text-gray-600">Visits Completed</span>
                    <span class="text-lg font-bold text-blue-600">
                      {{ summary()!.visitsCompleted }} / {{ summary()!.visitsPlanned }}
                    </span>
                  </div>
                  <!-- Progress Bar -->
                  <div class="w-full bg-gray-200 rounded-full h-2 mt-2">
                    <div 
                      class="bg-blue-500 h-2 rounded-full transition-all"
                      [style.width.%]="visitPercentage()">
                    </div>
                  </div>
                </div>
              </div>
            </ion-card-content>
          </ion-card>

          <!-- Quick Stats Grid -->
          <div class="grid grid-cols-2 gap-4">
            <!-- Customers Card -->
            <ion-card class="m-0" button (click)="navigateTo('/collector/customers')">
              <ion-card-content class="text-center py-6">
                <ion-icon [icon]="'person-outline'" class="text-4xl text-blue-600 mb-2"></ion-icon>
                <div class="text-2xl font-bold text-gray-800">{{ summary()!.totalCustomers }}</div>
                <div class="text-sm text-gray-600 mt-1">Customers</div>
              </ion-card-content>
            </ion-card>

            <!-- Active Loans Card -->
            <ion-card class="m-0">
              <ion-card-content class="text-center py-6">
                <ion-icon [icon]="'wallet-outline'" class="text-4xl text-green-600 mb-2"></ion-icon>
                <div class="text-2xl font-bold text-gray-800">{{ summary()!.activeLoans }}</div>
                <div class="text-sm text-gray-600 mt-1">Active Loans</div>
              </ion-card-content>
            </ion-card>

            <!-- Overdue Loans Card -->
            <ion-card class="m-0">
              <ion-card-content class="text-center py-6">
                <ion-icon [icon]="'alert-circle-outline'" class="text-4xl text-red-600 mb-2"></ion-icon>
                <div class="text-2xl font-bold text-gray-800">{{ summary()!.overdueLoans }}</div>
                <div class="text-sm text-gray-600 mt-1">Overdue</div>
              </ion-card-content>
            </ion-card>

            <!-- Total Outstanding Card -->
            <ion-card class="m-0">
              <ion-card-content class="text-center py-6">
                <ion-icon [icon]="'trending-up-outline'" class="text-4xl text-purple-600 mb-2"></ion-icon>
                <div class="text-xl font-bold text-gray-800">₱{{ (summary()!.totalOutstanding / 1000).toFixed(0) }}k</div>
                <div class="text-sm text-gray-600 mt-1">Outstanding</div>
              </ion-card-content>
            </ion-card>
          </div>

          <!-- Pending Actions -->
          <ion-card class="m-0">
            <ion-card-header>
              <ion-card-title class="text-lg font-bold text-gray-800 flex items-center justify-between">
                <span>Pending Actions</span>
                <ion-badge color="danger">{{ totalPendingActions() }}</ion-badge>
              </ion-card-title>
            </ion-card-header>
            <ion-card-content>
              <div class="space-y-3">
                <!-- Applications -->
                <div 
                  class="flex items-center justify-between p-3 bg-blue-50 rounded-lg cursor-pointer hover:bg-blue-100"
                  (click)="navigateTo('/collector/applications')">
                  <div class="flex items-center gap-3">
                    <ion-icon [icon]="'document-text-outline'" class="text-2xl text-blue-600"></ion-icon>
                    <div>
                      <div class="font-semibold text-gray-800">Applications</div>
                      <div class="text-sm text-gray-600">Pending approval</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <ion-badge color="primary">{{ summary()!.pendingApplications }}</ion-badge>
                    <ion-icon [icon]="'arrow-forward-outline'" class="text-gray-400"></ion-icon>
                  </div>
                </div>

                <!-- Disbursements -->
                <div 
                  class="flex items-center justify-between p-3 bg-green-50 rounded-lg cursor-pointer hover:bg-green-100"
                  (click)="navigateTo('/collector/disbursements')">
                  <div class="flex items-center gap-3">
                    <ion-icon [icon]="'card-outline'" class="text-2xl text-green-600"></ion-icon>
                    <div>
                      <div class="font-semibold text-gray-800">Disbursements</div>
                      <div class="text-sm text-gray-600">Ready to disburse</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <ion-badge color="success">{{ summary()!.pendingDisbursements }}</ion-badge>
                    <ion-icon [icon]="'arrow-forward-outline'" class="text-gray-400"></ion-icon>
                  </div>
                </div>

                <!-- Penalty Waivers -->
                <div 
                  class="flex items-center justify-between p-3 bg-orange-50 rounded-lg cursor-pointer hover:bg-orange-100"
                  (click)="navigateTo('/collector/waivers')">
                  <div class="flex items-center gap-3">
                    <ion-icon [icon]="'time-outline'" class="text-2xl text-orange-600"></ion-icon>
                    <div>
                      <div class="font-semibold text-gray-800">Penalty Waivers</div>
                      <div class="text-sm text-gray-600">Pending approval</div>
                    </div>
                  </div>
                  <div class="flex items-center gap-2">
                    <ion-badge color="warning">{{ summary()!.pendingWaivers }}</ion-badge>
                    <ion-icon [icon]="'arrow-forward-outline'" class="text-gray-400"></ion-icon>
                  </div>
                </div>
              </div>
            </ion-card-content>
          </ion-card>

          <!-- Collector Limits -->
          @if (limits()) {
            <ion-card class="m-0">
              <ion-card-header>
                <ion-card-title class="text-lg font-bold text-gray-800">
                  Your Limits
                </ion-card-title>
              </ion-card-header>
              <ion-card-content>
                <div class="space-y-3">
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Max Approval Amount</span>
                    <span class="font-semibold">₱{{ limits()!.maxApprovalAmount.toLocaleString() }}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Max Approvals/Day</span>
                    <span class="font-semibold">{{ limits()!.maxApprovalPerDay }}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Max Disbursement</span>
                    <span class="font-semibold">₱{{ limits()!.maxDisbursementAmount.toLocaleString() }}</span>
                  </div>
                  <div class="flex justify-between text-sm">
                    <span class="text-gray-600">Max Penalty Waiver</span>
                    <span class="font-semibold">₱{{ limits()!.maxPenaltyWaiverAmount.toLocaleString() }} ({{ limits()!.maxPenaltyWaiverPercent }}%)</span>
                  </div>
                </div>
              </ion-card-content>
            </ion-card>
          }

          <!-- Quick Actions -->
          <div class="grid grid-cols-2 gap-4 mb-4">
            <ion-button expand="block" (click)="navigateTo('/collector/visits')">
              <ion-icon slot="start" [icon]="'location-outline'"></ion-icon>
              Start Visit
            </ion-button>
            <ion-button expand="block" color="success" (click)="navigateTo('/collector/customers')">
              <ion-icon slot="start" [icon]="'person-outline'"></ion-icon>
              Customers
            </ion-button>
          </div>
        </div>
      }
    </ion-content>

    <!-- Bottom Navigation Tabs -->
    <app-collector-tabs />
  `,
})
export class CollectorDashboardPage implements OnInit {
  private collectorService = inject(CollectorService);
  private authService = inject(AuthService);
  private router = inject(Router);
  private toastController = inject(ToastController);

  Math = Math;
  loading = signal(true);
  summary = signal<CollectorDailySummary | null>(null);
  limits = signal<CollectorLimits | null>(null);
  currentDate = new Date().toLocaleDateString('en-US', { 
    weekday: 'long', 
    year: 'numeric', 
    month: 'long', 
    day: 'numeric' 
  });

  collectorId = signal<number>(0);

  constructor() {
    addIcons({
      personOutline,
      walletOutline,
      documentTextOutline,
      checkmarkCircleOutline,
      timeOutline,
      locationOutline,
      alertCircleOutline,
      trendingUpOutline,
      cardOutline,
      refreshOutline,
      arrowForwardOutline,
    });
  }

  ngOnInit() {
    const user = this.authService.currentUser();
    if (user) {
      this.collectorId.set(Number(user.id));
      this.loadDashboard();
    }
  }

  async loadDashboard() {
    this.loading.set(true);
    try {
      const [summaryData, limitsData] = await Promise.all([
        this.collectorService.getDailySummary(this.collectorId()).toPromise(),
        this.collectorService.getLimits(this.collectorId()).toPromise(),
      ]);

      this.summary.set(summaryData!);
      this.limits.set(limitsData!);
    } catch (error: any) {
      await this.showToast(error.error?.message || 'Failed to load dashboard', 'danger');
    } finally {
      this.loading.set(false);
    }
  }

  async handleRefresh(event: any) {
    await this.loadDashboard();
    event.target.complete();
  }

  collectionPercentage(): number {
    if (!this.summary() || this.summary()!.collectionTarget === 0) return 0;
    return Math.round((this.summary()!.collectedToday / this.summary()!.collectionTarget) * 100);
  }

  visitPercentage(): number {
    if (!this.summary() || this.summary()!.visitsPlanned === 0) return 0;
    return Math.round((this.summary()!.visitsCompleted / this.summary()!.visitsPlanned) * 100);
  }

  totalPendingActions(): number {
    if (!this.summary()) return 0;
    return this.summary()!.pendingApplications + 
           this.summary()!.pendingDisbursements + 
           this.summary()!.pendingWaivers;
  }

  navigateTo(path: string) {
    this.router.navigate([path]);
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
