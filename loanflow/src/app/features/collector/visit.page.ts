import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonButtons,
  IonBackButton
} from '@ionic/angular/standalone';
import { DevInfoComponent } from '../../shared/components/dev-info.component';

@Component({
  selector: 'app-visit',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonButtons,
    IonBackButton,
    DevInfoComponent
  ],
  template: `
    <ion-header>
      <ion-toolbar color="primary">
        <ion-buttons slot="start">
          <ion-back-button defaultHref="/collector/route"></ion-back-button>
        </ion-buttons>
        <ion-title>Customer Visit</ion-title>
        <ion-buttons slot="end">
          <!-- Dev Info (Development Only) -->
          <app-dev-info />
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding">
      <h2>Customer Visit - Coming Soon</h2>
      <p>This feature is under development.</p>
    </ion-content>
  `
})
export class VisitPage {}
