import { Component, inject, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { IonButton, IonIcon } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { moonOutline, sunnyOutline, logOutOutline } from 'ionicons/icons';
import { ThemeService } from '../../core/services/theme.service';
import { DevInfoComponent } from './dev-info.component';
import { AuthService } from '../../core/services/auth.service';

/**
 * Shared header utilities component
 * Displays dev info and theme toggle buttons consistently across all pages
 */
@Component({
  selector: 'app-header-utils',
  standalone: true,
  imports: [CommonModule, IonButton, IonIcon, DevInfoComponent],
  template: `
    <!-- Dev Info (Development Only) -->
    <app-dev-info (devIconClicked)="onDevIconClicked()" />
    
    <!-- Theme Toggle -->
    <ion-button (click)="themeService.toggleTheme()" class="header-btn">
      <ion-icon 
        [name]="themeService.isDark() ? 'sunny-outline' : 'moon-outline'" 
        slot="icon-only"
      ></ion-icon>
    </ion-button>

    <!-- Logout (optional) -->
    @if (showLogout) {
      <ion-button (click)="logout()" class="header-btn logout-btn">
        <ion-icon name="log-out-outline" slot="icon-only"></ion-icon>
      </ion-button>
    }
  `,
  styles: [`
    :host {
      display: contents;
    }

    .header-btn {
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
export class HeaderUtilsComponent {
  @Input() showLogout = true;
  @Output() devIconClicked = new EventEmitter<void>();
  
  public themeService = inject(ThemeService);
  private authService = inject(AuthService);

  constructor() {
    addIcons({
      moonOutline,
      sunnyOutline,
      logOutOutline,
    });
  }

  onDevIconClicked(): void {
    this.devIconClicked.emit();
  }

  logout(): void {
    this.authService.logout();
  }
}
