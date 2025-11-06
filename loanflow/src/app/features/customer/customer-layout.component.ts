// Customer Layout with Bottom Tabs Navigation
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import {
  IonTabs,
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline,
  home,
  documentTextOutline,
  documentText,
  cardOutline,
  card,
  addCircleOutline,
  addCircle,
  personOutline,
  person,
} from 'ionicons/icons';

@Component({
  selector: 'app-customer-layout',
  standalone: true,
  imports: [
    CommonModule,
    RouterModule,
    IonTabs,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonLabel,
  ],
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom" class="custom-tab-bar">
        <ion-tab-button tab="dashboard" class="custom-tab-button">
          <ion-icon name="home-outline" class="tab-icon-outline"></ion-icon>
          <ion-icon name="home" class="tab-icon-filled"></ion-icon>
          <ion-label class="tab-label">Dashboard</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="loans" class="custom-tab-button">
          <ion-icon name="document-text-outline" class="tab-icon-outline"></ion-icon>
          <ion-icon name="document-text" class="tab-icon-filled"></ion-icon>
          <ion-label class="tab-label">Loans</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="apply" class="custom-tab-button tab-center">
          <div class="center-fab">
            <ion-icon name="add-circle" class="fab-icon"></ion-icon>
          </div>
          <ion-label class="tab-label">Apply</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="payments" class="custom-tab-button">
          <ion-icon name="card-outline" class="tab-icon-outline"></ion-icon>
          <ion-icon name="card" class="tab-icon-filled"></ion-icon>
          <ion-label class="tab-label">Payments</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="profile" class="custom-tab-button">
          <ion-icon name="person-outline" class="tab-icon-outline"></ion-icon>
          <ion-icon name="person" class="tab-icon-filled"></ion-icon>
          <ion-label class="tab-label">Profile</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
  styles: [`
    /* Modern Tab Bar Styling */
    .custom-tab-bar {
      --background: var(--ion-card-background);
      --border: 1px solid var(--ion-border-color, rgba(148, 163, 184, 0.15));
      height: 60px;
      padding-bottom: env(safe-area-inset-bottom);
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.08);
      backdrop-filter: blur(10px);
      position: relative;
    }

    .custom-tab-button {
      --color: var(--ion-color-medium);
      --color-selected: var(--ion-color-primary);
      --padding-top: 6px;
      --padding-bottom: 6px;
      position: relative;
      max-width: 100px;
    }

    /* Tab Icons */
    .tab-icon-outline,
    .tab-icon-filled {
      font-size: 24px;
      margin-bottom: 2px;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .tab-icon-filled {
      display: none;
    }

    /* Active state - show filled icon */
    .custom-tab-button.tab-selected .tab-icon-outline {
      display: none;
    }

    .custom-tab-button.tab-selected .tab-icon-filled {
      display: block;
      color: var(--ion-color-primary);
      animation: tabBounce 0.4s cubic-bezier(0.4, 0, 0.2, 1);
    }

    @keyframes tabBounce {
      0% { transform: scale(1); }
      50% { transform: scale(1.2); }
      100% { transform: scale(1); }
    }

    /* Tab Labels */
    .tab-label {
      font-size: 11px;
      font-weight: 500;
      margin-top: 2px;
      letter-spacing: 0.02em;
      transition: all 0.3s ease;
    }

    .custom-tab-button.tab-selected .tab-label {
      font-weight: 700;
      color: var(--ion-color-primary);
    }

    /* Center FAB Button */
    .tab-center {
      position: relative;
      --color-selected: white;
    }

    .center-fab {
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 16px rgba(102, 126, 234, 0.4);
      margin: -20px auto 4px;
      position: relative;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      border: 3px solid var(--ion-card-background);
    }

    .custom-tab-button:active .center-fab {
      transform: scale(0.9);
    }

    .custom-tab-button.tab-selected .center-fab {
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.5);
      transform: scale(1.05);
    }

    .fab-icon {
      font-size: 32px;
      color: white;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.2));
    }

    .tab-center .tab-label {
      color: var(--ion-text-color);
      font-weight: 600;
    }

    .tab-center.tab-selected .tab-label {
      color: var(--ion-color-primary);
      font-weight: 700;
    }

    /* Active Tab Indicator */
    .custom-tab-button::before {
      content: '';
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%);
      width: 0;
      height: 3px;
      background: linear-gradient(90deg, #667eea, #764ba2);
      border-radius: 0 0 3px 3px;
      transition: width 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .custom-tab-button.tab-selected::before {
      width: 40px;
    }

    /* Center tab doesn't need top indicator */
    .tab-center::before {
      display: none;
    }

    /* Ripple Effect */
    .custom-tab-button {
      overflow: visible;
    }

    /* Dark Mode */
    body.dark .custom-tab-bar,
    .dark .custom-tab-bar {
      --background: rgba(30, 41, 59, 0.95);
      --border: 1px solid rgba(148, 163, 184, 0.2);
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.3);
    }

    body.dark .center-fab,
    .dark .center-fab {
      border-color: rgba(30, 41, 59, 0.95);
      box-shadow: 0 4px 16px rgba(102, 126, 234, 0.5);
    }

    body.dark .custom-tab-button.tab-selected .center-fab,
    .dark .custom-tab-button.tab-selected .center-fab {
      box-shadow: 0 6px 20px rgba(102, 126, 234, 0.6);
    }

    /* Safe Area Adjustments */
    @supports (padding: max(0px)) {
      .custom-tab-bar {
        padding-bottom: max(6px, env(safe-area-inset-bottom));
      }
    }

    /* Small Screen Optimizations */
    @media (max-width: 360px) {
      .tab-label {
        font-size: 10px;
      }

      .center-fab {
        width: 50px;
        height: 50px;
        margin: -18px auto 4px;
      }

      .fab-icon {
        font-size: 28px;
      }

      .tab-icon-outline,
      .tab-icon-filled {
        font-size: 22px;
      }
    }
  `],
})
export class CustomerLayoutComponent {
  constructor() {
    addIcons({
      'home-outline': homeOutline,
      'home': home,
      'document-text-outline': documentTextOutline,
      'document-text': documentText,
      'card-outline': cardOutline,
      'card': card,
      'add-circle-outline': addCircleOutline,
      'add-circle': addCircle,
      'person-outline': personOutline,
      'person': person,
    });
  }
}
