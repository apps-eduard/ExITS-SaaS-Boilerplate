import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
} from '@ionic/angular/standalone';
import { ApiService } from '../../core/services/api.service';
import { CollectorTopBarComponent } from '../../shared/components/collector-top-bar.component';

@Component({
  selector: 'app-visit',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    CollectorTopBarComponent
  ],
  template: `
    <ion-content [fullscreen]="true" class="main-content">
      <app-collector-top-bar
        emoji="👤"
        title="Customer Visit"
        subtitle="Feature in progress"
      />

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

    .visit-container {
      padding: calc(84px + env(safe-area-inset-top) + 0.85rem) 0.85rem calc(60px + env(safe-area-inset-bottom) + 0.85rem) 0.85rem;
    }
  `]
})
export class VisitPage {}
