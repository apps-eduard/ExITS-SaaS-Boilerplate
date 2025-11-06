import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent
} from '@ionic/angular/standalone';
import { AuthService } from '@app/core/services/auth.service';
import { CollectorTopBarComponent } from '../../shared/components/collector-top-bar.component';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    CollectorTopBarComponent
  ],
  template: `
    <ion-content [fullscreen]="true" class="main-content">
      <app-collector-top-bar
        emoji="🛡️"
        title="Collector Dashboard"
        subtitle="Overview &amp; quick actions"
      />

      <div class="dashboard-container">
        <!-- User Header -->
        <div class="user-header">
          <div class="user-info">
            <p class="user-greeting">Hello, <strong>{{ currentUser?.firstName || 'Collector' }}</strong></p>
            <p class="user-subtitle">Track your day at a glance</p>
          </div>
        </div>

        <!-- Placeholder for future dashboard stats/widgets -->
        <div class="empty-state">
          <div class="empty-emoji">📊</div>
          <h3 class="empty-title">Dashboard Under Construction</h3>
          <p class="empty-subtitle">Use the bottom tabs to navigate to your work areas</p>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    /* ===== MAIN CONTENT ===== */
    .main-content {
      --background: linear-gradient(160deg, rgba(102, 126, 234, 0.12), rgba(118, 75, 162, 0.05)), var(--ion-background-color);
    }

    .dashboard-container {
      max-width: 640px;
      margin: 0 auto;
      padding-left: 1rem;
      padding-right: 1rem;
      padding-top: calc(84px + env(safe-area-inset-top) + 1rem);
      padding-bottom: calc(84px + env(safe-area-inset-bottom));
      display: flex;
      flex-direction: column;
      gap: 1.25rem;
    }

    /* ===== USER HEADER ===== */
    .user-header {
      margin-bottom: 0.5rem;
      padding: 0 0.25rem;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .user-greeting {
      font-size: 1.125rem;
      color: var(--ion-text-color);
      margin: 0;
      font-weight: 400;
    }

    .user-greeting strong {
      font-weight: 700;
    }

    .user-subtitle {
      font-size: 0.875rem;
      color: var(--ion-color-medium);
      margin: 0;
    }

    /* ===== EMPTY STATE ===== */
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      text-align: center;
      padding: 3rem 1.5rem;
      margin-top: 2rem;
    }

    .empty-emoji {
      font-size: 4rem;
      margin-bottom: 1.25rem;
    }

    .empty-title {
      font-size: 1.25rem;
      font-weight: 600;
      color: var(--ion-text-color);
      margin: 0 0 0.5rem 0;
    }

    .empty-subtitle {
      font-size: 0.875rem;
      color: var(--ion-color-medium);
      margin: 0;
      max-width: 300px;
    }
  `]
})
export class DashboardPage implements OnInit {
  currentUser = this.authService.getCurrentUser();

  constructor(
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Future: Load collector-specific stats
  }
}
