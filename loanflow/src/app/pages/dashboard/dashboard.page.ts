import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  IonHeader, IonToolbar, IonTitle, IonButtons, IonButton, 
  IonIcon, IonContent, IonCard, IonCardHeader, IonCardTitle, 
  IonCardContent, IonBadge, MenuController 
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { menuOutline, notificationsOutline, logOutOutline } from 'ionicons/icons';
import { AuthService } from '@app/core/services/auth.service';
import { NotificationService } from '@app/core/services/notification.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [
    CommonModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonButtons,
    IonButton,
    IonIcon,
    IonContent,
    IonCard,
    IonCardHeader,
    IonCardTitle,
    IonCardContent,
    IonBadge
  ],
  templateUrl: './dashboard.page.html',
  styleUrls: ['./dashboard.page.scss'],
})
export class DashboardPage implements OnInit {
  currentUser = this.authService.getCurrentUser();
  notifications$: Observable<any[]>;
  stats = {
    users: 0,
    roles: 0,
    permissions: 0,
    activities: 0,
  };

  constructor(
    private menu: MenuController,
    private authService: AuthService,
    private notificationService: NotificationService
  ) {
    this.notifications$ = this.notificationService.notifications$;
    addIcons({
      'menu-outline': menuOutline,
      'notifications-outline': notificationsOutline,
      'log-out-outline': logOutOutline,
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
    this.stats = {
      users: 42,
      roles: 5,
      permissions: 28,
      activities: 156,
    };
  }

  logout(): void {
    this.authService.logout().subscribe();
  }
}
