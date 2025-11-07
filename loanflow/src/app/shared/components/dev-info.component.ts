import { Component, Output, EventEmitter } from '@angular/core';
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
      <ion-icon slot="icon-only" name="code-slash-outline"></ion-icon>
    </ion-button>
  `,
  styles: [`
    .dev-info-button {
      --background-hover: rgba(255, 255, 255, 0.15);
      --border-radius: 50%;
      --padding-start: 8px;
      --padding-end: 8px;
      position: relative;
      margin: 0;
    }
    
    ion-icon {
      font-size: 20px;
    }
  `]
})
export class DevInfoComponent {
  @Output() devIconClicked = new EventEmitter<void>();
  
  constructor(
    private router: Router,
    private location: Location,
    private toastController: ToastController
  ) {
    addIcons({ 'code-slash-outline': codeSlashOutline });
  }

  async showInfo() {
    // Emit event for parent component to handle logging
    this.devIconClicked.emit();
    
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
