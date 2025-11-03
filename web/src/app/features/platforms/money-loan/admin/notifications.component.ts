import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../../core/services/toast.service';

interface Notification {
  id: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  timestamp: string;
  isRead: boolean;
  actionUrl?: string;
  actionLabel?: string;
}

@Component({
  selector: 'app-notifications',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 md:p-6">
      <div class="mb-4">
        <div class="flex items-center justify-between mb-1">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
              <span class="text-lg">🔔</span>
            </div>
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">Notifications</h1>
          </div>
          <div class="flex gap-2">
            <button (click)="markAllAsRead()" class="px-3 py-1.5 text-sm font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded-lg">
              ✓ Mark All Read
            </button>
            <button (click)="clearAll()" class="px-3 py-1.5 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg">
              🗑️ Clear All
            </button>
          </div>
        </div>
        <p class="text-xs text-gray-600 dark:text-gray-400 ml-11">View and manage your notifications</p>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
          <p class="text-xs text-blue-600 dark:text-blue-400 mb-0.5">Total</p>
          <p class="text-xl font-bold text-blue-700 dark:text-blue-300">{{ notifications().length }}</p>
        </div>
        <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
          <p class="text-xs text-orange-600 dark:text-orange-400 mb-0.5">Unread</p>
          <p class="text-xl font-bold text-orange-700 dark:text-orange-300">{{ unreadCount() }}</p>
        </div>
        <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
          <p class="text-xs text-green-600 dark:text-green-400 mb-0.5">Today</p>
          <p class="text-xl font-bold text-green-700 dark:text-green-300">{{ todayCount() }}</p>
        </div>
        <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
          <p class="text-xs text-purple-600 dark:text-purple-400 mb-0.5">This Week</p>
          <p class="text-xl font-bold text-purple-700 dark:text-purple-300">{{ weekCount() }}</p>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 mb-4">
        <div class="flex gap-2">
          <button (click)="filterType = 'all'; onFilterChange()" [class.bg-blue-100]="filterType === 'all'" [class.dark:bg-blue-900/30]="filterType === 'all'" class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors">All</button>
          <button (click)="filterType = 'unread'; onFilterChange()" [class.bg-blue-100]="filterType === 'unread'" [class.dark:bg-blue-900/30]="filterType === 'unread'" class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors">Unread</button>
          <button (click)="filterType = 'info'; onFilterChange()" [class.bg-blue-100]="filterType === 'info'" [class.dark:bg-blue-900/30]="filterType === 'info'" class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors">Info</button>
          <button (click)="filterType = 'warning'; onFilterChange()" [class.bg-blue-100]="filterType === 'warning'" [class.dark:bg-blue-900/30]="filterType === 'warning'" class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors">Warnings</button>
          <button (click)="filterType = 'error'; onFilterChange()" [class.bg-blue-100]="filterType === 'error'" [class.dark:bg-blue-900/30]="filterType === 'error'" class="px-3 py-1.5 text-xs font-medium rounded-lg transition-colors">Errors</button>
        </div>
      </div>

      <div class="space-y-2">
        @for (notification of filteredNotifications(); track notification.id) {
          <div [class]="notification.isRead ? 'bg-white dark:bg-gray-800' : 'bg-blue-50 dark:bg-blue-900/10'" class="rounded-lg border border-gray-200 dark:border-gray-700 p-4 hover:shadow-sm transition-shadow">
            <div class="flex gap-3">
              <div class="flex-shrink-0">
                <span [class]="getTypeIconClass(notification.type)" class="w-8 h-8 rounded-full flex items-center justify-center text-sm">
                  {{ getTypeIcon(notification.type) }}
                </span>
              </div>
              <div class="flex-1 min-w-0">
                <div class="flex justify-between items-start mb-1">
                  <h3 class="text-sm font-semibold text-gray-900 dark:text-white">{{ notification.title }}</h3>
                  <span class="text-xs text-gray-500 dark:text-gray-400 whitespace-nowrap ml-2">{{ notification.timestamp }}</span>
                </div>
                <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">{{ notification.message }}</p>
                <div class="flex gap-2">
                  @if (notification.actionUrl) {
                    <button class="px-3 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded">
                      {{ notification.actionLabel || 'View' }}
                    </button>
                  }
                  @if (!notification.isRead) {
                    <button (click)="markAsRead(notification)" class="px-3 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded">
                      Mark as Read
                    </button>
                  }
                  <button (click)="deleteNotification(notification.id)" class="px-3 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                    Delete
                    </button>
                </div>
              </div>
            </div>
          </div>
        } @empty {
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-8 text-center">
            <p class="text-gray-500 dark:text-gray-400">No notifications</p>
          </div>
        }
      </div>
    </div>
  `
})
export class NotificationsComponent {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);

  filterType = 'all';

  notifications = signal<Notification[]>([
    {
      id: '1',
      title: 'New Loan Application',
      message: 'Customer John Doe has submitted a new loan application for ₱50,000.',
      type: 'info',
      timestamp: '2 hours ago',
      isRead: false,
      actionUrl: '/loans/LN-2024-123',
      actionLabel: 'Review Application'
    },
    {
      id: '2',
      title: 'Payment Overdue',
      message: 'Account LN-2024-045 is now 15 days overdue. Total due: ₱12,500.',
      type: 'warning',
      timestamp: '5 hours ago',
      isRead: false,
      actionUrl: '/collections/overdue',
      actionLabel: 'View Account'
    },
    {
      id: '3',
      title: 'KYC Verification Complete',
      message: 'Customer verification for Jane Smith has been completed successfully.',
      type: 'success',
      timestamp: '1 day ago',
      isRead: true
    },
    {
      id: '4',
      title: 'System Alert',
      message: 'Failed login attempt detected from unusual location.',
      type: 'error',
      timestamp: '2 days ago',
      isRead: true,
      actionUrl: '/audit-log',
      actionLabel: 'View Logs'
    }
  ]);

  unreadCount = computed(() => this.notifications().filter(n => !n.isRead).length);
  todayCount = computed(() => this.notifications().filter(n => n.timestamp.includes('hour')).length);
  weekCount = computed(() => this.notifications().length);

  filteredNotifications = computed(() => {
    let notifs = this.notifications();
    
    if (this.filterType === 'unread') {
      notifs = notifs.filter(n => !n.isRead);
    } else if (this.filterType !== 'all') {
      notifs = notifs.filter(n => n.type === this.filterType);
    }
    
    return notifs;
  });

  onFilterChange() {
    // Filters computed automatically
  }

  markAsRead(notification: Notification) {
    notification.isRead = true;
    this.toastService.success('Marked as read');
  }

  markAllAsRead() {
    this.notifications.update(notifs => notifs.map(n => ({ ...n, isRead: true })));
    this.toastService.success('All notifications marked as read');
  }

  deleteNotification(id: string) {
    this.notifications.update(notifs => notifs.filter(n => n.id !== id));
    this.toastService.success('Notification deleted');
  }

  clearAll() {
    if (confirm('Clear all notifications?')) {
      this.notifications.set([]);
      this.toastService.success('All notifications cleared');
    }
  }

  getTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      info: 'ℹ️',
      success: '✅',
      warning: '⚠️',
      error: '❌'
    };
    return icons[type] || 'ℹ️';
  }

  getTypeIconClass(type: string): string {
    const classes: Record<string, string> = {
      info: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      success: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      warning: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      error: 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    };
    return classes[type] || '';
  }
}
