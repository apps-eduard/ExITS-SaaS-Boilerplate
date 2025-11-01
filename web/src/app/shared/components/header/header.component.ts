import { Component, inject, output, HostListener, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, NavigationEnd } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ThemeService } from '../../../core/services/theme.service';
import { SpaceService } from '../../../core/services/space.service';
import { DevInfoComponent } from '../dev-info/dev-info.component';
import { filter } from 'rxjs/operators';

@Component({
  selector: 'app-header',
  standalone: true,
  imports: [CommonModule, DevInfoComponent],
  template: `
    <header class="h-16 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between px-4 lg:px-6 w-full">
      <!-- Left: Menu Toggle + Breadcrumb -->
      <div class="flex items-center gap-4">
        <button
          (click)="menuToggle.emit()"
          class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
          <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"/>
          </svg>
        </button>

        <!-- Dev Info Icon (Development Only) -->
        <app-dev-info />

        <!-- Current Space Badge -->
  <div class="flex items-center gap-2 px-3 py-1.5 rounded-lg border {{ spaceService.getBadgeColor() }}">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" [attr.d]="spaceService.getIcon()"/>
          </svg>
          <span class="text-sm font-semibold">
            {{ spaceService.getDisplayName() }}
          </span>
        </div>

        <!-- Breadcrumb Navigation -->
        <nav class="hidden md:flex items-center gap-2 text-sm">
          @for (breadcrumb of breadcrumbs(); track $index) {
            @if (!$last) {
              <div class="flex items-center gap-2">
                <a 
                  [href]="breadcrumb.url"
                  (click)="navigateTo(breadcrumb.url); $event.preventDefault()"
                  class="text-gray-600 dark:text-gray-400 hover:text-primary-600 dark:hover:text-primary-400 transition-colors">
                  {{ breadcrumb.label }}
                </a>
                <svg class="w-4 h-4 text-gray-400" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M7.293 14.707a1 1 0 010-1.414L10.586 10 7.293 6.707a1 1 0 011.414-1.414l4 4a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0z" clip-rule="evenodd"/>
                </svg>
              </div>
            } @else {
              <span class="text-gray-900 dark:text-white font-medium">
                {{ breadcrumb.label }}
              </span>
            }
          }
        </nav>

        <!-- Mobile: Current Page Only -->
        <div class="md:hidden flex items-center gap-2">
          @if (currentPage(); as page) {
            <span class="text-sm text-gray-900 dark:text-white font-medium">
              {{ page }}
            </span>
          }
        </div>
      </div>

      <!-- Right: Actions -->
      <div class="flex items-center gap-2">
        <!-- Theme Toggle -->
        <button
          (click)="themeService.toggle()"
          class="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700"
          title="Toggle theme">
          @if (themeService.isDark()) {
            <svg class="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"/>
            </svg>
          } @else {
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
              <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
            </svg>
          }
        </button>

        <!-- Notifications -->
        <button class="relative p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"/>
          </svg>
          <span class="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
        </button>

        <!-- User Menu -->
        <div class="relative user-menu-container">
          <button
            type="button"
            (click)="toggleUserMenu($event)"
            class="flex items-center gap-2 p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 cursor-pointer">
            <div class="w-8 h-8 rounded-full bg-primary-600 flex items-center justify-center text-white text-sm font-medium cursor-pointer pointer-events-none">
              {{ getUserInitials() }}
            </div>
            <div class="hidden lg:block text-left pointer-events-none">
              <div class="text-sm font-medium text-gray-900 dark:text-white">
                {{ getUserDisplayName() }}
              </div>
              <div class="text-xs text-gray-500 dark:text-gray-400">
                {{ user()?.email || (authService.isSystemAdmin() ? 'System Admin' : 'User') }}
              </div>
            </div>
            <svg class="w-4 h-4 text-gray-400 pointer-events-none" fill="currentColor" viewBox="0 0 20 20">
              <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
            </svg>
          </button>

          @if (showUserMenu) {
            <div class="absolute right-0 mt-2 w-56 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 py-1 z-50">
              <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
                <p class="text-sm font-medium text-gray-900 dark:text-white">{{ user()?.firstName }} {{ user()?.lastName }}</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">{{ user()?.email }}</p>
              </div>
              <button
                (click)="navigateTo('/profile'); showUserMenu = false"
                class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                </svg>
                Profile
              </button>
              @if (canAccessSettings()) {
                <button
                  (click)="navigateTo('/settings'); showUserMenu = false"
                  class="w-full text-left px-4 py-2 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  Settings
                </button>
              }
              <div class="border-t border-gray-200 dark:border-gray-700 my-1"></div>
              <button
                (click)="logout()"
                class="w-full text-left px-4 py-2 text-sm text-red-600 dark:text-red-400 hover:bg-gray-100 dark:hover:bg-gray-700 flex items-center gap-2">
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
                </svg>
                Logout
              </button>
            </div>
          }
        </div>
      </div>
    </header>
  `
})
export class HeaderComponent {
  authService = inject(AuthService);
  themeService = inject(ThemeService);
  spaceService = inject(SpaceService);
  router = inject(Router);

  menuToggle = output();
  showUserMenu = false;
  user = this.authService.currentUser;

  // Breadcrumb state
  currentUrl = signal('');
  breadcrumbs = computed(() => this.generateBreadcrumbs(this.currentUrl()));
  currentPage = computed(() => {
    const crumbs = this.breadcrumbs();
    return crumbs.length > 0 ? crumbs[crumbs.length - 1].label : '';
  });

  constructor() {
    // Update breadcrumbs on route changes
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: any) => {
        this.currentUrl.set(event.urlAfterRedirects || event.url);
      });

    // Set initial URL
    this.currentUrl.set(this.router.url);
  }

  private generateBreadcrumbs(url: string): Array<{ label: string; url: string }> {
    if (!url || url === '/') {
      return [{ label: 'Home', url: '/' }];
    }

    const segments = url.split('/').filter(s => s);
    const breadcrumbs: Array<{ label: string; url: string }> = [];
    let currentPath = '';

    // Route label mapping
    const labelMap: Record<string, string> = {
      // Admin routes
      'admin': 'Admin',
      'dashboard': 'Dashboard',
      'users': 'Users',
      'roles': 'Roles',
      'tenants': 'Tenants',
      'products': 'Products',
      'plans': 'Subscription Plans',
      'audit': 'Audit Logs',
      'system': 'System',
      'config': 'Configuration',
      'logs': 'System Logs',
      'backup': 'Backup & Restore',
      'recycle-bin': 'Recycle Bin',
      
      // Tenant routes
      'tenant': 'Tenant',
      'platform-configs': 'Platform Configs',
      'billing': 'Billing',
      'subscriptions': 'Subscriptions',
      'usage': 'Usage',
      'invoices': 'Invoices',
      'platform-settings': 'Platform Settings',
      
      // Money Loan Platform
      'money-loan': 'Money Loan',
      'applications': 'Applications',
      'customers': 'Customers',
      'loans': 'Loans',
      'payments': 'Payments',
      'reports': 'Reports',
      'collections': 'Collections',
      'settings': 'Settings',
      'product-config': 'Product Configuration',
      
      // Common
      'profile': 'My Profile',
      'new': 'New',
      'edit': 'Edit',
      'view': 'View',
      'create': 'Create',
    };

    segments.forEach((segment, index) => {
      currentPath += `/${segment}`;
      
      // Skip numeric IDs in breadcrumbs
      if (/^\d+$/.test(segment)) {
        return;
      }

      // Get friendly label
      const label = labelMap[segment] || this.formatSegment(segment);
      
      breadcrumbs.push({
        label,
        url: currentPath
      });
    });

    return breadcrumbs.length > 0 ? breadcrumbs : [{ label: 'Home', url: '/' }];
  }

  private formatSegment(segment: string): string {
    // Convert kebab-case or snake_case to Title Case
    return segment
      .replace(/[-_]/g, ' ')
      .split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  }

  toggleUserMenu(event: Event): void {
    event.stopPropagation();
    this.showUserMenu = !this.showUserMenu;
    console.log('User menu toggled:', this.showUserMenu);
  }

  getUserInitials(): string {
    const user = this.user();
    if (!user) return '?';
    const firstInitial = user.firstName?.[0] || '';
    const lastInitial = user.lastName?.[0] || '';
    return `${firstInitial}${lastInitial}`.toUpperCase() || '??';
  }

  getUserDisplayName(): string {
    const user = this.user();
    if (!user) return 'Loading...';
    
    const firstName = user.firstName || '';
    const lastName = user.lastName || '';
    const fullName = `${firstName} ${lastName}`.trim();
    
    if (fullName) return fullName;
    if (user.email) return user.email;
    
    return 'User';
  }

  canAccessSettings(): boolean {
    // Settings accessible to system admins or users with system:view or settings:view permission
    return this.authService.isSystemAdmin() ||
           this.authService.hasPermission('system:view') ||
           this.authService.hasPermission('settings:view');
  }

  navigateTo(path: string): void {
    this.showUserMenu = false;
    this.router.navigate([path]);
  }

  logout() {
    console.log('Logout clicked');
    this.showUserMenu = false;
    this.authService.logout().subscribe({
      next: () => {
        console.log('Logout successful, navigating to login');
        this.router.navigate(['/login']);
      },
      error: (err) => {
        console.error('Logout error:', err);
        this.router.navigate(['/login']);
      }
    });
  }

  @HostListener('document:click', ['$event'])
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    const userMenuButton = target.closest('.user-menu-container');
    
    if (!userMenuButton && this.showUserMenu) {
      this.showUserMenu = false;
    }
  }
}
