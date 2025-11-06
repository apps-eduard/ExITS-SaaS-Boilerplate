import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonContent,
} from '@ionic/angular/standalone';
import { ApiService } from '../../core/services/api.service';
import { CollectorTopBarComponent } from '../../shared/components/collector-top-bar.component';

@Component({
  selector: 'app-collect',
  standalone: true,
  imports: [
    CommonModule,
    IonContent,
    CollectorTopBarComponent
  ],
  template: `
    <ion-content [fullscreen]="true" class="main-content">
      <app-collector-top-bar
        emoji="💵"
        title="Collect Payment"
        subtitle="Feature in progress"
      />

      <!-- Content Container -->
      <div class="collect-container">
        <h2>Payment Collection - Coming Soon</h2>
        <p>This feature is under development.</p>
      </div>
    </ion-content>
  `,
  styles: [`
    .main-content {
      --background: #f8fafc;
    }

    .collect-container {
      padding: calc(84px + env(safe-area-inset-top) + 0.85rem) 0.85rem calc(60px + env(safe-area-inset-bottom) + 0.85rem) 0.85rem;
    }
  `]
})
export class CollectPage {}
