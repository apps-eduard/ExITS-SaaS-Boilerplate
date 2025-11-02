import { Injectable } from '@angular/core';
import { Preferences } from '@capacitor/preferences';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root',
})
export class NotificationService {
  private notificationsSubject = new BehaviorSubject<any[]>([]);
  public notifications$ = this.notificationsSubject.asObservable();

  private unreadCountSubject = new BehaviorSubject<number>(0);
  public unreadCount$ = this.unreadCountSubject.asObservable();

  constructor() {
    this.loadNotifications();
  }

  async loadNotifications(): Promise<void> {
    const result = await Preferences.get({ key: 'notifications' });
    if (result.value) {
      const notifications = JSON.parse(result.value);
      this.notificationsSubject.next(notifications);
      this.updateUnreadCount();
    }
  }

  async addNotification(notification: any): Promise<void> {
    const current = this.notificationsSubject.value;
    const updated = [notification, ...current];
    this.notificationsSubject.next(updated);
    await Preferences.set({ key: 'notifications', value: JSON.stringify(updated) });
    this.updateUnreadCount();
  }

  async markAsRead(notificationId: string): Promise<void> {
    const current = this.notificationsSubject.value;
    const updated = current.map((n) =>
      n.id === notificationId ? { ...n, read: true } : n
    );
    this.notificationsSubject.next(updated);
    await Preferences.set({ key: 'notifications', value: JSON.stringify(updated) });
    this.updateUnreadCount();
  }

  async markAllAsRead(): Promise<void> {
    const current = this.notificationsSubject.value;
    const updated = current.map((n) => ({ ...n, read: true }));
    this.notificationsSubject.next(updated);
    await Preferences.set({ key: 'notifications', value: JSON.stringify(updated) });
    this.updateUnreadCount();
  }

  async clearNotifications(): Promise<void> {
    this.notificationsSubject.next([]);
    await Preferences.remove({ key: 'notifications' });
    this.updateUnreadCount();
  }

  async deleteNotification(notificationId: string): Promise<void> {
    const current = this.notificationsSubject.value;
    const updated = current.filter((n) => n.id !== notificationId);
    this.notificationsSubject.next(updated);
    await Preferences.set({ key: 'notifications', value: JSON.stringify(updated) });
    this.updateUnreadCount();
  }

  private updateUnreadCount(): void {
    const notifications = this.notificationsSubject.value;
    const unreadCount = notifications.filter((n) => !n.read).length;
    this.unreadCountSubject.next(unreadCount);
  }

  getNotifications(): any[] {
    return this.notificationsSubject.value;
  }

  getUnreadCount(): number {
    return this.unreadCountSubject.value;
  }
}
