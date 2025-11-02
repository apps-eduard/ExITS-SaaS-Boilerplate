import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, 
  IonIcon, IonContent, IonBadge, MenuController,
  AlertController, ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  menuOutline, notificationsOutline, logOutOutline,
  peopleOutline, shieldCheckmarkOutline, keyOutline,
  timeOutline, arrowForwardOutline, moonOutline, sunnyOutline
} from 'ionicons/icons';
import { AuthService } from '@app/core/services/auth.service';
import { NotificationService } from '@app/core/services/notification.service';
import { ThemeService } from '@app/core/services/theme.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    RouterLink,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonBadge
  ],
  template: `
    <ion-header>
      <ion-toolbar class="custom-toolbar">
        <ion-buttons slot="start">
          <ion-button class="header-btn">
            <ion-icon slot="icon-only" name="menu-outline"></ion-icon>
          </ion-button>
        </ion-buttons>
        
        <ion-title class="header-title">
          <ion-icon class="title-icon" name="shield-checkmark-outline"></ion-icon>
          <span class="title-text">Admin Dashboard</span>
        </ion-title>
        
        <ion-buttons slot="end">
          <ion-button class="header-btn" (click)="themeService.toggleTheme()">
            <ion-icon slot="icon-only" [name]="themeService.isDark() ? 'sunny-outline' : 'moon-outline'"></ion-icon>
          </ion-button>
          <ion-button class="header-btn" routerLink="/notifications">
            <ion-icon slot="icon-only" name="notifications-outline"></ion-icon>
            @if ((notifications$ | async)?.length) {
              <ion-badge class="notif-badge" color="danger">{{ (notifications$ | async)?.length }}</ion-badge>
            }
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="main-content">
      <div class="dashboard-container">
        <!-- User Header -->
        <div class="user-header">
          <div class="user-info">
            <p class="user-greeting">Hello, <strong>{{ currentUser?.firstName || 'Admin' }}</strong></p>
            <p class="user-subtitle">Welcome to your admin dashboard</p>
          </div>
        </div>

        <!-- Stats Grid -->
        <div class="stats-grid">
          <div class="stat-card">
            <div class="stat-header">
              <div class="stat-icon-wrapper stat-icon-primary">
                <ion-icon class="stat-icon" name="people-outline"></ion-icon>
              </div>
            </div>
            <h2 class="stat-value">{{ stats().users }}</h2>
            <p class="stat-label">Total Users</p>
            <div class="stat-decoration stat-decoration-primary"></div>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <div class="stat-icon-wrapper stat-icon-success">
                <ion-icon class="stat-icon" name="shield-checkmark-outline"></ion-icon>
              </div>
            </div>
            <h2 class="stat-value">{{ stats().roles }}</h2>
            <p class="stat-label">Active Roles</p>
            <div class="stat-decoration stat-decoration-success"></div>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <div class="stat-icon-wrapper stat-icon-warning">
                <ion-icon class="stat-icon" name="key-outline"></ion-icon>
              </div>
            </div>
            <h2 class="stat-value">{{ stats().permissions }}</h2>
            <p class="stat-label">Permissions</p>
            <div class="stat-decoration stat-decoration-warning"></div>
          </div>

          <div class="stat-card">
            <div class="stat-header">
              <div class="stat-icon-wrapper stat-icon-info">
                <ion-icon class="stat-icon" name="time-outline"></ion-icon>
              </div>
            </div>
            <h2 class="stat-value">{{ stats().activities }}</h2>
            <p class="stat-label">Recent Activities</p>
            <div class="stat-decoration stat-decoration-info"></div>
          </div>
        </div>

        <!-- Quick Actions -->
        <div class="section-card">
          <h3 class="section-title">Quick Actions</h3>
          
          <div class="actions-grid">
            <button class="action-btn" routerLink="/users">
              <div class="action-icon-wrapper action-primary">
                <ion-icon name="people-outline"></ion-icon>
              </div>
              <div class="action-content">
                <span class="action-title">Manage Users</span>
                <span class="action-subtitle">Add, edit, or remove users</span>
              </div>
              <ion-icon class="action-arrow" name="arrow-forward-outline"></ion-icon>
            </button>

            <button class="action-btn" routerLink="/roles">
              <div class="action-icon-wrapper action-success">
                <ion-icon name="shield-checkmark-outline"></ion-icon>
              </div>
              <div class="action-content">
                <span class="action-title">Manage Roles</span>
                <span class="action-subtitle">Configure user roles</span>
              </div>
              <ion-icon class="action-arrow" name="arrow-forward-outline"></ion-icon>
            </button>

            <button class="action-btn" routerLink="/audit-logs">
              <div class="action-icon-wrapper action-warning">
                <ion-icon name="time-outline"></ion-icon>
              </div>
              <div class="action-content">
                <span class="action-title">Audit Logs</span>
                <span class="action-subtitle">View system activity</span>
              </div>
              <ion-icon class="action-arrow" name="arrow-forward-outline"></ion-icon>
            </button>

            <button class="action-btn logout-btn" (click)="logout()">
              <div class="action-icon-wrapper action-danger">
                <ion-icon name="log-out-outline"></ion-icon>
              </div>
              <div class="action-content">
                <span class="action-title">Sign Out</span>
                <span class="action-subtitle">Logout from dashboard</span>
              </div>
              <ion-icon class="action-arrow" name="arrow-forward-outline"></ion-icon>
            </button>
          </div>
        </div>
      </div>
    </ion-content>
  `,
  styles: [`
    /* ===== HEADER STYLES ===== */
    .custom-toolbar {
      --background: linear-gradient(135deg, #667eea, #764ba2);
      --color: white;
      --border-style: none;
      --min-height: 60px;
    }

    .header-title {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      font-size: 1.125rem;
      font-weight: 700;
    }

    .title-icon {
      font-size: 1.5rem;
    }

    .title-text {
      font-weight: 700;
    }

    .header-btn {
      --background-hover: rgba(255, 255, 255, 0.15);
      --border-radius: 50%;
      --padding-start: 8px;
      --padding-end: 8px;
      position: relative;
    }

    .notif-badge {
      position: absolute;
      top: 4px;
      right: 4px;
      font-size: 0.65rem;
      min-width: 16px;
      height: 16px;
    }

    /* ===== MAIN CONTENT ===== */
    .main-content {
      --background: var(--ion-background-color);
    }

    .dashboard-container {
      padding: 1rem;
      max-width: 600px;
      margin: 0 auto;
    }

    /* ===== USER HEADER ===== */
    .user-header {
      margin-bottom: 1.5rem;
      padding: 0 0.25rem;
    }

    .user-info {
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .user-greeting {
      font-size: 1.125rem;
      color: var(--ion-text-color);
      margin: 0;
      font-weight: 400;
    }

    .user-greeting strong {
      font-weight: 700;
    }

    .user-subtitle {
      font-size: 0.875rem;
      color: var(--ion-color-medium);
      margin: 0;
    }

    /* ===== STATS GRID ===== */
    .stats-grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 1rem;
      margin-bottom: 1.25rem;
    }

    .stat-card {
      background: var(--ion-card-background);
      border-radius: 16px;
      padding: 1.25rem;
      position: relative;
      overflow: hidden;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      border: 1px solid var(--ion-border-color, #e5e7eb);
      transition: all 0.3s ease;
    }

    .stat-card:active {
      transform: scale(0.98);
    }

    .stat-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 0.75rem;
    }

    .stat-icon-wrapper {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .stat-icon {
      font-size: 1.5rem;
      color: white;
    }

    .stat-icon-primary {
      background: linear-gradient(135deg, #667eea, #764ba2);
    }

    .stat-icon-success {
      background: linear-gradient(135deg, #4facfe, #00f2fe);
    }

    .stat-icon-warning {
      background: linear-gradient(135deg, #f093fb, #f5576c);
    }

    .stat-icon-info {
      background: linear-gradient(135deg, #a8edea, #fed6e3);
    }

    .stat-value {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--ion-text-color);
      margin: 0 0 0.25rem 0;
      line-height: 1.2;
    }

    .stat-label {
      font-size: 0.75rem;
      color: var(--ion-color-medium);
      margin: 0;
      font-weight: 500;
    }

    .stat-decoration {
      position: absolute;
      bottom: -10px;
      right: -10px;
      width: 80px;
      height: 80px;
      border-radius: 50%;
      opacity: 0.1;
    }

    .stat-decoration-primary {
      background: #667eea;
    }

    .stat-decoration-success {
      background: #00f2fe;
    }

    .stat-decoration-warning {
      background: #f5576c;
    }

    .stat-decoration-info {
      background: #a8edea;
    }

    /* ===== SECTION CARD ===== */
    .section-card {
      background: var(--ion-card-background);
      border-radius: 18px;
      padding: 1.25rem;
      margin-bottom: 1.25rem;
      box-shadow: 0 2px 8px rgba(0, 0, 0, 0.08);
      border: 1px solid var(--ion-border-color, #e5e7eb);
    }

    .section-title {
      font-size: 1.125rem;
      font-weight: 700;
      color: var(--ion-text-color);
      margin: 0 0 1rem 0;
    }

    /* ===== ACTIONS GRID ===== */
    .actions-grid {
      display: flex;
      flex-direction: column;
      gap: 0.75rem;
    }

    .action-btn {
      display: flex;
      align-items: center;
      gap: 1rem;
      padding: 1rem;
      background: var(--ion-item-background);
      border: 1px solid var(--ion-border-color, #e5e7eb);
      border-radius: 12px;
      cursor: pointer;
      transition: all 0.3s ease;
      width: 100%;
      text-align: left;
    }

    .action-btn:active {
      transform: scale(0.98);
    }

    .action-btn:hover .action-arrow {
      transform: translateX(4px);
    }

    .action-icon-wrapper {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .action-icon-wrapper ion-icon {
      font-size: 1.5rem;
      color: white;
    }

    .action-primary {
      background: linear-gradient(135deg, #667eea, #764ba2);
    }

    .action-success {
      background: linear-gradient(135deg, #4facfe, #00f2fe);
    }

    .action-warning {
      background: linear-gradient(135deg, #f093fb, #f5576c);
    }

    .action-danger {
      background: linear-gradient(135deg, #ff6b6b, #ee5a6f);
    }

    .action-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
    }

    .action-title {
      font-size: 0.9375rem;
      font-weight: 600;
      color: var(--ion-text-color);
    }

    .action-subtitle {
      font-size: 0.75rem;
      color: var(--ion-color-medium);
    }

    .action-arrow {
      font-size: 1.25rem;
      color: var(--ion-color-medium);
      transition: transform 0.3s ease;
      flex-shrink: 0;
    }

    .logout-btn {
      border-color: rgba(255, 107, 107, 0.2);
    }

    .logout-btn:hover {
      border-color: rgba(255, 107, 107, 0.4);
      background: rgba(255, 107, 107, 0.05);
    }

    /* ===== DARK MODE ADJUSTMENTS ===== */
    body.dark .stat-card,
    .dark .stat-card {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.1);
    }

    body.dark .section-card,
    .dark .section-card {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.1);
    }

    body.dark .action-btn,
    .dark .action-btn {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.1);
    }

    body.dark .action-btn:hover,
    .dark .action-btn:hover {
      background: rgba(255, 255, 255, 0.08);
    }

    body.dark .logout-btn,
    .dark .logout-btn {
      border-color: rgba(255, 107, 107, 0.3);
    }

    body.dark .logout-btn:hover,
    .dark .logout-btn:hover {
      border-color: rgba(255, 107, 107, 0.5);
      background: rgba(255, 107, 107, 0.1);
    }
  `]
})
export class DashboardPage implements OnInit {
  currentUser = this.authService.getCurrentUser();
  notifications$: Observable<any[]>;
  stats = signal({
    users: 0,
    roles: 0,
    permissions: 0,
    activities: 0,
  });

  constructor(
    private menu: MenuController,
    private authService: AuthService,
    private notificationService: NotificationService,
    public themeService: ThemeService,
    private alertController: AlertController,
    private toastController: ToastController,
    private router: Router
  ) {
    this.notifications$ = this.notificationService.notifications$;
    addIcons({
      'menu-outline': menuOutline,
      'notifications-outline': notificationsOutline,
      'log-out-outline': logOutOutline,
      'people-outline': peopleOutline,
      'shield-checkmark-outline': shieldCheckmarkOutline,
      'key-outline': keyOutline,
      'time-outline': timeOutline,
      'arrow-forward-outline': arrowForwardOutline,
      'moon-outline': moonOutline,
      'sunny-outline': sunnyOutline,
    });
  }

  ngOnInit(): void {
    this.loadStats();
  }

  openMenu(): void {
    this.menu.open('mainMenu');
  }

  loadStats(): void {
    // TODO: Fetch from backend
    this.stats.set({
      users: 42,
      roles: 5,
      permissions: 28,
      activities: 156,
    });
  }

  async logout(): Promise<void> {
    const alert = await this.alertController.create({
      header: 'Confirm Logout',
      message: 'Are you sure you want to sign out?',
      buttons: [
        {
          text: 'Cancel',
          role: 'cancel'
        },
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
          }
        }
      ]
    });

    await alert.present();
  }
}
