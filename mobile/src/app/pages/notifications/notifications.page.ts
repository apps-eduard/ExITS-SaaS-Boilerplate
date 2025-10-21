import { Component, OnInit } from '@angular/core';
import { NotificationService } from '@app/core/services/notification.service';
import { Observable } from 'rxjs';

@Component({
  selector: 'app-notifications',
  templateUrl: './notifications.page.html',
  styleUrls: ['./notifications.page.scss'],
})
export class NotificationsPage implements OnInit {
  notifications$: Observable<any[]>;
  unreadCount$: Observable<number>;

  constructor(private notificationService: NotificationService) {
    this.notifications$ = this.notificationService.notifications$;
    this.unreadCount$ = this.notificationService.unreadCount$;
  }

  ngOnInit(): void {}

  markAsRead(notificationId: string): void {
    this.notificationService.markAsRead(notificationId);
  }

  markAllAsRead(): void {
    this.notificationService.markAllAsRead();
  }

  deleteNotification(notificationId: string): void {
    this.notificationService.deleteNotification(notificationId);
  }

  clearAll(): void {
    this.notificationService.clearNotifications();
  }
}
