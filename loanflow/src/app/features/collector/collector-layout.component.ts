import { Component } from '@angular/core';
import { IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  homeOutline,
  home,
  documentTextOutline,
  documentText,
  walletOutline,
  wallet,
  locationOutline,
  location,
  alertCircleOutline,
  alertCircle,
} from 'ionicons/icons';

@Component({
  selector: 'app-collector-layout',
  standalone: true,
  imports: [IonTabs, IonTabBar, IonTabButton, IonIcon, IonLabel],
  template: `
    <ion-tabs>
      <ion-tab-bar slot="bottom" class="collector-tab-bar">
        <ion-tab-button tab="dashboard" class="tab-button">
          <ion-icon [name]="'home-outline'" class="tab-icon tab-icon-outline"></ion-icon>
          <ion-icon [name]="'home'" class="tab-icon tab-icon-filled"></ion-icon>
          <ion-label class="tab-label">Dashboard</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="applications" class="tab-button">
          <ion-icon [name]="'document-text-outline'" class="tab-icon tab-icon-outline"></ion-icon>
          <ion-icon [name]="'document-text'" class="tab-icon tab-icon-filled"></ion-icon>
          <ion-label class="tab-label">Applications</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="route" class="tab-button tab-button-fab">
          <div class="fab-button">
            <ion-icon name="location" class="fab-icon"></ion-icon>
          </div>
          <ion-label class="tab-label fab-label">Route</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="disbursements" class="tab-button">
          <ion-icon [name]="'wallet-outline'" class="tab-icon tab-icon-outline"></ion-icon>
          <ion-icon [name]="'wallet'" class="tab-icon tab-icon-filled"></ion-icon>
          <ion-label class="tab-label">Disbursements</ion-label>
        </ion-tab-button>

        <ion-tab-button tab="waivers" class="tab-button">
          <ion-icon [name]="'alert-circle-outline'" class="tab-icon tab-icon-outline"></ion-icon>
          <ion-icon [name]="'alert-circle'" class="tab-icon tab-icon-filled"></ion-icon>
          <ion-label class="tab-label">Waivers</ion-label>
        </ion-tab-button>
      </ion-tab-bar>
    </ion-tabs>
  `,
  styles: [`
    /* Tab Bar Container */
    .collector-tab-bar {
      --background: rgba(255, 255, 255, 0.95);
      --color: #64748b;
      --color-selected: #3b82f6;
      height: calc(60px + env(safe-area-inset-bottom));
      padding-bottom: env(safe-area-inset-bottom);
      border-top: 1px solid rgba(0, 0, 0, 0.06);
      backdrop-filter: blur(10px);
      -webkit-backdrop-filter: blur(10px);
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.05);
    }

    /* Dark Mode Support */
    @media (prefers-color-scheme: dark) {
      .collector-tab-bar {
        --background: rgba(30, 30, 30, 0.95);
        --color: #94a3b8;
        --color-selected: #60a5fa;
        border-top-color: rgba(255, 255, 255, 0.1);
      }
    }

    /* Tab Button Base */
    .tab-button {
      position: relative;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 2px;
      padding: 8px 4px 4px 4px;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Tab Icons */
    .tab-icon {
      font-size: 1.375rem;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Outline icons visible by default */
    .tab-icon-outline {
      display: block;
    }

    /* Filled icons hidden by default */
    .tab-icon-filled {
      display: none;
    }

    /* Active tab - show filled icon, hide outline */
    .tab-button.tab-selected .tab-icon-outline {
      display: none;
    }

    .tab-button.tab-selected .tab-icon-filled {
      display: block;
    }

    /* Tab Label */
    .tab-label {
      font-size: 0.6875rem;
      font-weight: 600;
      margin-top: 0;
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    /* Active Tab Indicator - Top Line */
    .tab-button::before {
      content: '';
      position: absolute;
      top: 0;
      left: 50%;
      transform: translateX(-50%) scaleX(0);
      width: 32px;
      height: 3px;
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      border-radius: 0 0 3px 3px;
      transition: transform 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .tab-button.tab-selected::before {
      transform: translateX(-50%) scaleX(1);
    }

    /* Active Tab Styles */
    .tab-button.tab-selected {
      --color-selected: #3b82f6;
    }

    .tab-button.tab-selected .tab-icon {
      color: #3b82f6;
      animation: tabBounce 0.5s cubic-bezier(0.68, -0.55, 0.265, 1.55);
    }

    .tab-button.tab-selected .tab-label {
      color: #3b82f6;
      font-weight: 700;
    }

    /* FAB Button (Center - Route) */
    .tab-button-fab {
      position: relative;
      padding-top: 0;
    }

    .fab-button {
      position: absolute;
      top: -20px;
      left: 50%;
      transform: translateX(-50%);
      width: 56px;
      height: 56px;
      border-radius: 50%;
      background: linear-gradient(135deg, #3b82f6 0%, #2563eb 100%);
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 4px 12px rgba(59, 130, 246, 0.4),
                  0 2px 4px rgba(0, 0, 0, 0.12);
      transition: all 0.25s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .fab-icon {
      font-size: 1.75rem;
      color: white;
    }

    .fab-label {
      margin-top: 32px;
      font-size: 0.6875rem;
      font-weight: 600;
      color: #64748b;
    }

    .tab-button-fab.tab-selected .fab-label {
      color: #3b82f6;
      font-weight: 700;
    }

    .tab-button-fab.tab-selected .fab-button {
      box-shadow: 0 6px 20px rgba(59, 130, 246, 0.5),
                  0 3px 6px rgba(0, 0, 0, 0.15);
      transform: translateX(-50%) scale(1.05);
    }

    /* Dark Mode FAB */
    @media (prefers-color-scheme: dark) {
      .fab-button {
        background: linear-gradient(135deg, #60a5fa 0%, #3b82f6 100%);
      }

      .fab-label {
        color: #94a3b8;
      }

      .tab-button-fab.tab-selected .fab-label {
        color: #60a5fa;
      }
    }

    /* Bounce Animation */
    @keyframes tabBounce {
      0%, 100% {
        transform: translateY(0);
      }
      50% {
        transform: translateY(-4px);
      }
    }

    /* Ripple Effect */
    .tab-button::after {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 0;
      height: 0;
      border-radius: 50%;
      background: rgba(59, 130, 246, 0.15);
      opacity: 0;
      transition: width 0.4s, height 0.4s, opacity 0.4s;
    }

    .tab-button:active::after {
      width: 48px;
      height: 48px;
      opacity: 1;
      transition: 0s;
    }
  `],
})
export class CollectorLayoutComponent {
  constructor() {
    addIcons({
      homeOutline,
      home,
      documentTextOutline,
      documentText,
      walletOutline,
      wallet,
      locationOutline,
      location,
      alertCircleOutline,
      alertCircle,
    });
  }
}
