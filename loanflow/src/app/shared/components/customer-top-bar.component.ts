// Customer Top Bar Component - Standardized Navigation Bar
import { Component, Input, signal, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { IonBadge } from '@ionic/angular/standalone';
import { AuthService } from '../../core/services/auth.service';
import { NotificationService } from '../../core/services/notification.service';
import { HeaderUtilsComponent } from './header-utils.component';

@Component({
  selector: 'app-customer-top-bar',
  standalone: true,
  imports: [
    CommonModule,
    IonBadge,
    HeaderUtilsComponent
  ],
  template: `
    <div class="fixed-top-bar">
      <div class="top-bar-content">
        <div class="top-bar-left">
          <span class="app-emoji">{{ emoji }}</span>
          <div class="title-group">
            <span class="app-title">{{ title }}</span>
            @if (subtitle) {
              <span class="app-subtitle">{{ subtitle }}</span>
            }
          </div>
        </div>
        
        <div class="top-bar-right">
          <!-- Dev Icon, Theme Toggle, Logout -->
          <app-header-utils [showLogout]="showLogout" />
          
          <!-- Notifications Bell -->
          @if (notificationsLink) {
            <button 
              (click)="goToNotifications()" 
              class="icon-btn notifications-btn" 
              title="Notifications"
            >
              <span class="emoji-icon">🔔</span>
              @if (unreadCount() > 0) {
                <ion-badge class="notification-badge">{{ unreadCount() }}</ion-badge>
              }
            </button>
          }
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Fixed Top Bar */
    .fixed-top-bar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 999;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      padding: calc(env(safe-area-inset-top) + 0.75rem) 1rem 0.75rem 1rem;
      box-shadow: 0 2px 8px rgba(102, 126, 234, 0.2);
    }

    .top-bar-content {
      display: flex;
      justify-content: space-between;
      align-items: center;
      max-width: 100%;
      margin: 0 auto;
    }

    .top-bar-left {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      flex: 1;
      min-width: 0;
    }

    .app-emoji {
      font-size: 1.75rem;
      line-height: 1;
      flex-shrink: 0;
    }

    .title-group {
      display: flex;
      flex-direction: column;
      gap: 0.125rem;
      min-width: 0;
    }

    .app-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: white;
      line-height: 1.2;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .app-subtitle {
      font-size: 0.75rem;
      font-weight: 500;
      color: rgba(255, 255, 255, 0.85);
      line-height: 1.2;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .top-bar-right {
      display: flex;
      align-items: center;
      gap: 0.25rem;
      flex-shrink: 0;
    }

    .icon-btn {
      --padding-start: 0.5rem;
      --padding-end: 0.5rem;
      --color: white;
      height: 40px;
      margin: 0;
      background: transparent;
      border: none;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      position: relative;
      padding: 0.5rem;
    }

    .emoji-icon {
      font-size: 1.5rem;
      line-height: 1;
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
    }

    .notifications-btn {
      position: relative;
    }

    .notification-badge {
      position: absolute;
      top: 6px;
      right: 6px;
      min-width: 18px;
      height: 18px;
      border-radius: 9px;
      font-size: 0.625rem;
      font-weight: 700;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #ef4444;
      color: white;
      padding: 0 0.25rem;
      box-shadow: 0 2px 4px rgba(239, 68, 68, 0.4);
    }

    /* Dark Mode */
    body.dark .fixed-top-bar,
    .dark .fixed-top-bar {
      background: linear-gradient(135deg, #4c1d95 0%, #5b21b6 100%);
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.3);
    }
  `]
})
export class CustomerTopBarComponent {
  @Input() emoji: string = '💼';
  @Input() title: string = 'Dashboard';
  @Input() subtitle?: string;
  @Input() showLogout: boolean = true;
  @Input() notificationsLink: string = '/customer/notifications';

  unreadCount = signal(0);

  constructor(
    private router: Router,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    // Subscribe to notification count changes
    effect(() => {
      this.notificationService.unreadCount$.subscribe(count => {
        this.unreadCount.set(count);
      });
    });
  }

  goToNotifications() {
    if (this.notificationsLink) {
      this.router.navigate([this.notificationsLink]);
    }
  }
}
