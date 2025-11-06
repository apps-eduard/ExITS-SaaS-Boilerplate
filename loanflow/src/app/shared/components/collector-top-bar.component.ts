import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import {
  IonButton,
  IonIcon,
  IonBadge,
  MenuController,
  ToastController,
  AlertController,
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import {
  menuOutline,
  notificationsOutline,
  logOutOutline,
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { ThemeService } from '../../core/services/theme.service';
import { HeaderUtilsComponent } from './header-utils.component';

@Component({
  selector: 'app-collector-top-bar',
  standalone: true,
  imports: [CommonModule, RouterLink, IonButton, IonIcon, IonBadge, HeaderUtilsComponent],
  template: `
    <div class="fixed-top-bar">
      <div class="top-bar-content">
        <div class="top-bar-left">
          <ion-button fill="clear" class="icon-button" size="small" (click)="openMenu()">
            <ion-icon slot="icon-only" name="menu-outline"></ion-icon>
          </ion-button>
          <span class="app-emoji">{{ emoji }}</span>
          <div class="title-group">
            <span class="app-title">{{ title }}</span>
            <span class="app-subtitle">{{ subtitle }}</span>
          </div>
        </div>
        <div class="top-bar-right">
          <ng-content select="[topbar-right]"></ng-content>
          <app-header-utils [showLogout]="false" />
          <ion-button fill="clear" class="icon-button" size="small" [routerLink]="notificationsLink">
            <ion-icon slot="icon-only" name="notifications-outline"></ion-icon>
            @if ((notifications$ | async)?.length) {
              <ion-badge class="notif-badge" color="danger">{{ (notifications$ | async)?.length }}</ion-badge>
            }
          </ion-button>
          <ion-button
            *ngIf="showLogout"
            fill="clear"
            class="icon-button"
            size="small"
            (click)="logout()"
          >
            <ion-icon slot="icon-only" name="log-out-outline"></ion-icon>
          </ion-button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    :host {
      display: block;
    }

    .fixed-top-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 24;
      background: linear-gradient(135deg, #4f46e5, #6d28d9);
      box-shadow: 0 12px 28px rgba(79, 70, 229, 0.25);
      padding-top: env(safe-area-inset-top);
    }

    .top-bar-content {
      display: flex;
      align-items: center;
      justify-content: space-between;
      gap: 0.75rem;
      padding: 0.65rem 1rem;
    }

    .top-bar-left {
      display: flex;
      align-items: center;
      gap: 0.65rem;
    }

    .title-group {
      display: flex;
      flex-direction: column;
      gap: 0.15rem;
    }

    .app-emoji {
      font-size: 1.6rem;
      filter: drop-shadow(0 2px 6px rgba(15, 23, 42, 0.28));
    }

    .app-title {
      font-size: 1rem;
      font-weight: 700;
      color: rgba(255, 255, 255, 0.96);
      letter-spacing: -0.01em;
    }

    .app-subtitle {
      font-size: 0.68rem;
      font-weight: 600;
      text-transform: uppercase;
      letter-spacing: 0.08em;
      color: rgba(226, 232, 240, 0.78);
    }

    .top-bar-right {
      display: flex;
      align-items: center;
      gap: 0.4rem;
    }

    .icon-button {
      --padding-start: 6px;
      --padding-end: 6px;
      --padding-top: 4px;
      --padding-bottom: 4px;
      --background: transparent;
      color: rgba(255, 255, 255, 0.92);
      position: relative;
    }

    .icon-button ion-icon {
      font-size: 1.35rem;
    }

    .notif-badge {
      position: absolute;
      top: 2px;
      right: 2px;
      font-size: 0.6rem;
      min-width: 16px;
      height: 16px;
    }

    @media (max-width: 520px) {
      .top-bar-content {
        padding: 0.55rem 0.8rem;
        gap: 0.6rem;
      }

      .top-bar-left {
        gap: 0.55rem;
      }

      .app-emoji {
        font-size: 1.45rem;
      }

      .app-title {
        font-size: 0.95rem;
      }

      .app-subtitle {
        font-size: 0.62rem;
      }
    }

    body.dark .fixed-top-bar,
    .dark .fixed-top-bar {
      background: linear-gradient(135deg, rgba(37, 99, 235, 0.92), rgba(76, 29, 149, 0.9));
      box-shadow: 0 12px 28px rgba(15, 23, 42, 0.55);
    }

    body.dark .icon-button,
    .dark .icon-button {
      color: rgba(255, 255, 255, 0.9);
    }

    body.dark .app-subtitle,
    .dark .app-subtitle {
      color: rgba(226, 232, 240, 0.7);
    }
  `],
})
export class CollectorTopBarComponent {
  @Input() title = 'Collector HQ';
  @Input() subtitle = 'Daily progress overview';
  @Input() emoji = '🛡️';
  @Input() notificationsLink: string | any[] = ['/notifications'];
  @Input() showLogout = true;
  notifications$ = this.notificationService.notifications$;

  constructor(
    private menu: MenuController,
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationService,
    private toastController: ToastController,
    private alertController: AlertController,
    public themeService: ThemeService
  ) {
    addIcons({
      menuOutline,
      notificationsOutline,
      logOutOutline,
    });
  }

  openMenu(): void {
    this.menu.open('mainMenu');
  }

  async logout(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Confirm Logout',
      message: 'Are you sure you want to sign out?',
      buttons: [
        { text: 'Cancel', role: 'cancel' },
        {
          text: 'Logout',
          role: 'confirm',
          handler: async () => {
            this.authService.logout();
            const toast = await this.toastController.create({
              message: 'Successfully logged out',
              duration: 2000,
              position: 'bottom',
              color: 'success'
            });
            await toast.present();
            this.router.navigate(['/login']);
          }
        }
      ]
    });

    await alert.present();
  }
}