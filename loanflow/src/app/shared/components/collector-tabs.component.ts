// Collector Bottom Navigation Tabs Component
import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import {
  IonTabBar,
  IonTabButton,
  IonIcon,
  IonLabel
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  gridOutline,
  grid,
  mapOutline,
  map,
  documentTextOutline,
  documentText,
  cashOutline,
  cash,
  peopleOutline,
  people,
  alertCircleOutline,
  alertCircle
} from 'ionicons/icons';

@Component({
  selector: 'app-collector-tabs',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    RouterLinkActive,
    IonTabBar,
    IonTabButton,
    IonIcon,
    IonLabel
  ],
  template: `
    <ion-tab-bar class="bottom-tabs">
      <ion-tab-button 
        [routerLink]="['/collector/dashboard']"
        routerLinkActive="tab-selected"
        [routerLinkActiveOptions]="{exact: false}"
      >
        <ion-icon name="grid-outline" class="tab-icon"></ion-icon>
        <ion-label class="tab-label">Dashboard</ion-label>
      </ion-tab-button>

      <ion-tab-button 
        [routerLink]="['/collector/route']"
        routerLinkActive="tab-selected"
        [routerLinkActiveOptions]="{exact: false}"
      >
        <ion-icon name="map-outline" class="tab-icon"></ion-icon>
        <ion-label class="tab-label">Route</ion-label>
      </ion-tab-button>

      <ion-tab-button 
        [routerLink]="['/collector/applications']"
        routerLinkActive="tab-selected"
        [routerLinkActiveOptions]="{exact: false}"
      >
        <ion-icon name="document-text-outline" class="tab-icon"></ion-icon>
        <ion-label class="tab-label">Applications</ion-label>
      </ion-tab-button>

      <ion-tab-button 
        [routerLink]="['/collector/disbursements']"
        routerLinkActive="tab-selected"
        [routerLinkActiveOptions]="{exact: false}"
      >
        <ion-icon name="cash-outline" class="tab-icon"></ion-icon>
        <ion-label class="tab-label">Disbursements</ion-label>
      </ion-tab-button>

      <ion-tab-button 
        [routerLink]="['/collector/visits']"
        routerLinkActive="tab-selected"
        [routerLinkActiveOptions]="{exact: false}"
      >
        <ion-icon name="people-outline" class="tab-icon"></ion-icon>
        <ion-label class="tab-label">Visits</ion-label>
      </ion-tab-button>

      <ion-tab-button 
        [routerLink]="['/collector/waivers']"
        routerLinkActive="tab-selected"
        [routerLinkActiveOptions]="{exact: false}"
      >
        <ion-icon name="alert-circle-outline" class="tab-icon"></ion-icon>
        <ion-label class="tab-label">Waivers</ion-label>
      </ion-tab-button>
    </ion-tab-bar>
  `,
  styles: [`
    :host {
      display: block;
    }

    .bottom-tabs {
      height: 56px;
      border-top: 1px solid var(--ion-color-light-shade);
      background: var(--ion-background-color, #fff);
      box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.08);
      --background: var(--ion-background-color, #fff);
      --color: var(--ion-color-medium);
    }

    ion-tab-button {
      --color: var(--ion-color-medium);
      --color-selected: var(--ion-color-primary);
      --ripple-color: var(--ion-color-primary-tint);
      font-size: 10px;
    }

    ion-tab-button.tab-selected {
      --color: var(--ion-color-primary);
    }

    .tab-icon {
      font-size: 24px;
      margin-bottom: 2px;
    }

    .tab-label {
      font-size: 10px;
      font-weight: 500;
      margin-top: 2px;
    }

    /* Active state styles */
    ion-tab-button.tab-selected .tab-icon {
      color: var(--ion-color-primary);
    }

    ion-tab-button.tab-selected .tab-label {
      color: var(--ion-color-primary);
      font-weight: 600;
    }

    /* Hover effect for desktop */
    @media (hover: hover) {
      ion-tab-button:hover {
        --color: var(--ion-color-primary-shade);
      }
    }

    /* Dark mode support */
    @media (prefers-color-scheme: dark) {
      .bottom-tabs {
        border-top-color: rgba(255, 255, 255, 0.1);
        box-shadow: 0 -2px 10px rgba(0, 0, 0, 0.3);
      }
    }
  `]
})
export class CollectorTabsComponent {
  private router = inject(Router);

  constructor() {
    addIcons({
      gridOutline,
      grid,
      mapOutline,
      map,
      documentTextOutline,
      documentText,
      cashOutline,
      cash,
      peopleOutline,
      people,
      alertCircleOutline,
      alertCircle
    });
  }
}
