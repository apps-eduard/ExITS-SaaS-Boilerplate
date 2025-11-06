import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
} from '@ionic/angular/standalone';
import { ApiService } from '../../core/services/api.service';
import { HeaderUtilsComponent } from '../../shared/components/header-utils.component';

@Component({
  selector: 'app-visit',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    HeaderUtilsComponent
  ],
  template: `
    <ion-content [fullscreen]="true" class="main-content">
      <!-- Fixed Top Bar -->
      <div class="fixed-top-bar">
        <div class="top-bar-content">
          <div class="top-bar-left">
            <span class="app-emoji">👤</span>
            <span class="app-title">Customer Visit</span>
          </div>
          <div class="top-bar-right">
            <app-header-utils />
          </div>
        </div>
      </div>

      <!-- Content Container -->
      <div class="visit-container">
        <h2>Customer Visit - Coming Soon</h2>
        <p>This feature is under development.</p>
      </div>
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

    .visit-container {
      padding: calc(56px + env(safe-area-inset-top) + 0.85rem) 0.85rem calc(60px + env(safe-area-inset-bottom) + 0.85rem) 0.85rem;
    }
  `]
})
export class VisitPage {}
