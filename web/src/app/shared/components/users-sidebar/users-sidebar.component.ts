import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { RBACService } from '../../../core/services/rbac.service';

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  menuKey: string;
  requiredAction?: string;
  children?: MenuItem[];
}

@Component({
  selector: 'app-users-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <!-- Backdrop (mobile only) -->
    <div
      *ngIf="isOpen() && !isDesktop()"
      (click)="closeMenu()"
      class="fixed inset-0 bg-black/50 z-40 lg:hidden"
    ></div>

    <!-- Sidebar: Fixed overlay on mobile, sticky on desktop -->
    <aside
      [class]="isOpen() && !isDesktop() ? 'translate-x-0' : '-translate-x-full lg:translate-x-0'"
      class="fixed lg:sticky top-0 left-0 z-50 h-screen w-64 flex-shrink-0 transform transition-transform duration-300 ease-in-out lg:z-auto bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700"
    >
      <div class="flex h-full flex-col">
        <!-- Logo -->
        <div class="flex items-center gap-2 border-b border-gray-200 px-4 py-3 dark:border-gray-700">
          <div class="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-green-500 to-teal-600 text-white font-bold text-sm">
            👥
          </div>
          <div class="flex-1 min-w-0">
            <h2 class="text-sm font-bold text-gray-900 dark:text-white truncate">
              User Management
            </h2>
            <p class="text-xs text-gray-500 dark:text-gray-400">Admin Portal</p>
          </div>
        </div>

        <!-- User Info -->
        <div class="border-b border-gray-200 px-4 py-2 dark:border-gray-700">
          <div class="flex items-center gap-2">
            <div class="flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900 text-green-600 dark:text-green-300 text-xs font-semibold">
              {{ getUserInitials() }}
            </div>
            <div class="flex-1 min-w-0">
              <p class="text-xs font-medium text-gray-900 dark:text-white truncate">
                {{ authService.currentUser()?.email }}
              </p>
              <p class="text-xs text-gray-500 dark:text-gray-400">System Admin</p>
            </div>
          </div>
        </div>

        <!-- Navigation -->
        <nav class="flex-1 overflow-y-auto px-2 py-3 space-y-1">
          <div *ngFor="let item of menuItems()">
            <!-- Parent Menu Item -->
            <div *ngIf="!item.children">
              <a
                *ngIf="hasMenuAccessMethod(item.menuKey)"
                [routerLink]="item.route"
                routerLinkActive="bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                [routerLinkActiveOptions]="{exact: false}"
                (click)="closeMenu()"
                class="flex items-center gap-2 rounded px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition"
              >
                <span class="text-lg">{{ item.icon }}</span>
                <span class="flex-1">{{ item.label }}</span>
              </a>
            </div>

            <!-- Group Menu Item -->
            <div *ngIf="item.children" class="space-y-0.5">
              <button
                *ngIf="hasMenuAccessMethod(item.menuKey)"
                (click)="toggleGroup(item.label)"
                class="flex w-full items-center gap-2 rounded px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-100 dark:text-gray-300 dark:hover:bg-gray-700 transition"
              >
                <span class="text-lg">{{ item.icon }}</span>
                <span class="flex-1 text-left">{{ item.label }}</span>
                <svg
                  [class.rotate-180]="expandedGroups().has(item.label)"
                  class="h-4 w-4 transform transition-transform"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              <!-- Children -->
              <div *ngIf="expandedGroups().has(item.label)" class="ml-4 space-y-0.5 border-l-2 border-gray-200 dark:border-gray-700 pl-2">
                <a
                  *ngFor="let child of item.children"
                  [routerLink]="child.route"
                  routerLinkActive="bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400"
                  (click)="closeMenu()"
                  [class.hidden]="!hasMenuAccessMethod(child.menuKey) || (child.requiredAction && !hasActionMethod(child.menuKey, child.requiredAction))"
                  class="flex items-center gap-2 rounded px-3 py-1.5 text-sm font-medium text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-700 transition"
                >
                  <span class="text-base flex-shrink-0">{{ child.icon }}</span>
                  <span>{{ child.label }}</span>
                </a>
              </div>
            </div>
          </div>
        </nav>

        <!-- Footer -->
        <div class="border-t border-gray-200 px-4 py-2 dark:border-gray-700">
          <button
            (click)="logout()"
            class="flex w-full items-center gap-2 rounded px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/20 transition"
          >
            <span class="text-lg">🚪</span>
            <span>Logout</span>
          </button>
        </div>
      </div>
    </aside>
  `,
  styles: []
})
export class UsersSidebarComponent {
  authService = inject(AuthService);
  rbacService = inject(RBACService);
  router = inject(Router);

  isOpen = signal(false);
  isDesktop = signal(window.innerWidth >= 1024);
  expandedGroups = signal(new Set<string>(['Users']));

  menuItems = signal<MenuItem[]>([
    { label: 'All Users', icon: '👥', route: '/admin/users', menuKey: 'users' },
    { label: 'Admin Users', icon: '👨‍�', route: '/admin/users/admins', menuKey: 'users' },
    { label: 'Invite User', icon: '✉️', route: '/admin/users/invite', menuKey: 'users', requiredAction: 'create' },
    { label: 'User Activity', icon: '👣', route: '/admin/users/activity', menuKey: 'users' },
    { label: 'Roles & Permissions', icon: '🔐', route: '/admin/roles', menuKey: 'roles' },
    {
      label: 'Audit',
      icon: '📋',
      menuKey: 'audit',
      children: [
        { label: 'Audit Logs', icon: '📝', route: '/monitoring/audit', menuKey: 'monitoring' },
        { label: 'Activity Logs', icon: '📊', route: '/monitoring/activity', menuKey: 'monitoring' },
        { label: 'Security Events', icon: '🔒', route: '/monitoring/security', menuKey: 'monitoring' },
      ]
    },
  ]);

  constructor() {
    // Track desktop status
    const handleResize = () => {
      this.isDesktop.set(window.innerWidth >= 1024);
      if (window.innerWidth >= 1024) {
        this.isOpen.set(false);
      }
    };

    window.addEventListener('resize', handleResize);
    console.log('🧭 UsersSidebarComponent initialized');
  }

  getUserInitials(): string {
    const email = this.authService.currentUser()?.email || '';
    const parts = email.split('@')[0].split('.');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return email.substring(0, 2).toUpperCase();
  }

  hasMenuAccessMethod(menuKey?: string): boolean {
    if (!menuKey) return false;

    return this.rbacService.hasMenuAccess(menuKey);
  }

  hasActionMethod(menuKey?: string, actionKey?: string): boolean {
    if (!menuKey || !actionKey) return false;

    return this.rbacService.hasAction(menuKey, actionKey);
  }

  toggleGroup(label: string) {
    const groups = this.expandedGroups();
    const newGroups = new Set(groups);
    if (newGroups.has(label)) {
      newGroups.delete(label);
    } else {
      newGroups.add(label);
    }
    this.expandedGroups.set(newGroups);
  }

  logout() {
    this.authService.logout().subscribe({
      next: () => {
        this.router.navigate(['/login']);
      },
      error: () => {
        this.router.navigate(['/login']);
      }
    });
  }

  closeMenu() {
    this.isOpen.set(false);
  }
}
