import { Component, OnInit } from '@angular/core';
import { MenuController } from '@ionic/angular';
import { AuthService } from '@app/core/services/auth.service';
import { NotificationService } from '@app/core/services/notification.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-dashboard',
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
