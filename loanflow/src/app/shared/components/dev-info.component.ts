import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonIcon, IonButton, ToastController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { codeSlashOutline } from 'ionicons/icons';
import { Router } from '@angular/router';
import { Location } from '@angular/common';

/**
 * Development info component that displays current route and component information.
 * Shows as an icon that displays info in a toast when clicked.
 * Only for development environment.
 */
@Component({
  selector: 'app-dev-info',
  standalone: true,
  imports: [CommonModule, IonIcon, IonButton],
  template: `
    <ion-button 
      fill="clear" 
      size="small"
      (click)="showInfo()"
      class="dev-info-button"
    >
      <ion-icon slot="icon-only" name="code-slash-outline" class="dev-icon"></ion-icon>
    </ion-button>
  `,
  styles: [`
    .dev-info-button {
      --padding-start: 8px;
      --padding-end: 8px;
      margin: 0;
    }
    
    .dev-icon {
      color: var(--ion-color-primary);
      font-size: 20px;
    }
    
    ion-button::part(native) {
      padding: 4px 8px;
    }
  `]
})
export class DevInfoComponent {
  constructor(
    private router: Router,
    private location: Location,
    private toastController: ToastController
  ) {
    addIcons({ 'code-slash-outline': codeSlashOutline });
  }

  async showInfo() {
    const currentUrl = this.router.url;
    const urlSegments = currentUrl.split('/').filter(s => s);
    const moduleName = urlSegments[0] || 'root';
    const componentName = urlSegments[urlSegments.length - 1] || 'unknown';

    const message = `
🔧 DEV INFO
📱 Platform: Loanflow Mobile
📍 Route: ${currentUrl}
📦 Module: ${moduleName}
🧩 Component: ${componentName}
    `.trim();

    const toast = await this.toastController.create({
      message: message,
      duration: 5000,
      position: 'top',
      color: 'primary',
      cssClass: 'dev-info-toast',
      buttons: [
        {
          text: 'Close',
          role: 'cancel'
        }
      ]
    });

    await toast.present();
  }
}
