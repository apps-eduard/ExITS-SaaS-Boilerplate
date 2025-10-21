import { Component, inject, input, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface MenuItem {
  label: string;
  icon: string;
  route?: string;
  children?: MenuItem[];
  permission?: string;
}

@Component({
  selector: 'app-sidebar',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive],
  template: `
    <!-- Mobile Overlay (Mobile only) -->
    @if (isOpen() && !isDesktop()) {
      <div
        (click)="isOpen.set(false)"
        class="fixed inset-0 z-30 bg-black/50 lg:hidden">
      </div>
    }

    <!-- Sidebar: Fixed overlay on mobile, sticky on desktop -->
    <aside
      class="w-64 bg-white dark:bg-gray-800 border-r border-gray-200 dark:border-gray-700 flex flex-col transition-all duration-300 ease-in-out"
      [class.fixed]="!isDesktop()"
      [class.lg:sticky]="isDesktop()"
      [class.top-0]="!isDesktop()"
      [class.left-0]="!isDesktop()"
      [class.z-40]="!isDesktop()"
      [class.h-screen]="!isDesktop()"
      [class.-translate-x-full]="!isOpen() && !isDesktop()"
      [class.translate-x-0]="isOpen() || isDesktop()">
      
      <!-- Logo -->
      <div class="h-16 flex items-center justify-between px-4 border-b border-gray-200 dark:border-gray-700">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-primary-600 to-primary-700 flex items-center justify-center shadow-lg">
            <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <div>
            <h1 class="text-lg font-bold text-gray-900 dark:text-white">ExITS</h1>
            <p class="text-xs text-gray-500 dark:text-gray-400">SaaS Platform</p>
          </div>
        </div>
        <!-- Close Button (Mobile) -->
        <button
          (click)="isOpen.set(false)"
          class="lg:hidden p-1.5 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
          <svg class="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
          </svg>
        </button>
      </div>

      <!-- Navigation -->
      <nav class="flex-1 overflow-y-auto p-3 space-y-1">
        @for (item of menuItems(); track item.label) {
          @if (!item.children) {
            <!-- Simple Link -->
            <a
              [routerLink]="item.route"
              routerLinkActive="bg-primary-50 dark:bg-primary-900/20 text-primary-600 dark:text-primary-400"
              [routerLinkActiveOptions]="{exact: false}"
              class="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
              <span class="text-xl">{{ item.icon }}</span>
              <span class="text-sm font-medium">{{ item.label }}</span>
            </a>
          } @else {
            <!-- Expandable Group -->
            <div>
              <button
                (click)="toggleGroup(item.label)"
                class="w-full flex items-center justify-between gap-3 px-3 py-2.5 rounded-lg text-gray-700 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                <div class="flex items-center gap-3">
                  <span class="text-xl">{{ item.icon }}</span>
                  <span class="text-sm font-medium">{{ item.label }}</span>
                </div>
                <svg
                  class="w-4 h-4 transition-transform"
                  [class.rotate-180]="expandedGroups().has(item.label)"
                  fill="currentColor"
                  viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clip-rule="evenodd"/>
                </svg>
              </button>
              
              @if (expandedGroups().has(item.label)) {
                <div class="mt-1 ml-4 pl-6 border-l-2 border-gray-200 dark:border-gray-700 space-y-1">
                  @for (child of item.children; track child.label) {
                    <a
                      [routerLink]="child.route"
                      routerLinkActive="text-primary-600 dark:text-primary-400 font-medium"
                      class="block px-3 py-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-gray-200 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700">
                      {{ child.label }}
                    </a>
                  }
                </div>
              }
            </div>
          }
        }
      </nav>

      <!-- Footer -->
      <div class="p-3 border-t border-gray-200 dark:border-gray-700">
        <div class="bg-gradient-to-r from-primary-50 to-blue-50 dark:from-primary-900/20 dark:to-blue-900/20 rounded-lg p-3">
          <p class="text-xs font-semibold text-gray-900 dark:text-white mb-2">Need Help?</p>
          <button class="w-full px-3 py-1.5 bg-primary-600 hover:bg-primary-700 text-white text-xs font-medium rounded-md">
            Contact Support
          </button>
        </div>
      </div>
    </aside>
  `
})
export class SidebarComponent {
  authService = inject(AuthService);
  isOpen = signal(false);
  isDesktop = signal(window.innerWidth >= 1024);
  
  expandedGroups = signal(new Set<string>(['Dashboard']));
  
  menuItems = signal<MenuItem[]>([]);

  constructor() {
    // Build menu based on user role
    const user = this.authService.currentUser();
    this.buildMenu(user?.role_id);

    // Track desktop status
    const handleResize = () => {
      this.isDesktop.set(window.innerWidth >= 1024);
      // Close sidebar on desktop
      if (window.innerWidth >= 1024) {
        this.isOpen.set(false);
      }
    };
    
    window.addEventListener('resize', handleResize);
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

  closeMenu() {
    this.isOpen.set(false);
  }

  buildMenu(roleId?: string) {
    const commonItems: MenuItem[] = [
      { label: 'Dashboard', icon: '📊', route: '/dashboard' },
    ];

    if (roleId === '1') {
      // System Admin - Full access to all features
      this.menuItems.set([
        ...commonItems,
        {
          label: 'Tenant Management',
          icon: '🏢',
          children: [
            { label: 'All Tenants', icon: '📋', route: '/tenants' },
            { label: 'Create Tenant', icon: '➕', route: '/tenants/create' },
            { label: 'Tenant Settings', icon: '⚙️', route: '/tenants/settings' },
            { label: 'Tenant Analytics', icon: '�', route: '/tenants/analytics' },
          ]
        },
        {
          label: 'User Management',
          icon: '�👥',
          children: [
            { label: 'All Users', icon: '👤', route: '/users' },
            { label: 'Create User', icon: '➕', route: '/users/create' },
            { label: 'User Groups', icon: '👫', route: '/users/groups' },
            { label: 'Active Sessions', icon: '🔌', route: '/users/sessions' },
          ]
        },
        {
          label: 'Access Control',
          icon: '🔐',
          children: [
            { label: 'Roles', icon: '👔', route: '/roles' },
            { label: 'Permissions', icon: '🔑', route: '/permissions' },
            { label: 'API Keys', icon: '�', route: '/api-keys' },
            { label: 'OAuth Clients', icon: '🌐', route: '/oauth' },
          ]
        },
        {
          label: 'System Monitoring',
          icon: '📈',
          children: [
            { label: 'System Health', icon: '💚', route: '/monitoring/health' },
            { label: 'Performance Metrics', icon: '⚡', route: '/monitoring/performance' },
            { label: 'Database Status', icon: '🗄️', route: '/monitoring/database' },
            { label: 'API Analytics', icon: '📊', route: '/monitoring/api' },
            { label: 'Error Tracking', icon: '⚠️', route: '/monitoring/errors' },
          ]
        },
        {
          label: 'Audit & Logs',
          icon: '📋',
          children: [
            { label: 'Audit Logs', icon: '📝', route: '/audit-logs' },
            { label: 'System Logs', icon: '📄', route: '/system-logs' },
            { label: 'User Activity', icon: '👣', route: '/activity-logs' },
            { label: 'Security Events', icon: '🔒', route: '/security-events' },
          ]
        },
        {
          label: 'System Configuration',
          icon: '⚙️',
          children: [
            { label: 'Email Settings', icon: '📧', route: '/config/email' },
            { label: 'SMS Settings', icon: '💬', route: '/config/sms' },
            { label: 'Notification Rules', icon: '🔔', route: '/config/notifications' },
            { label: 'Backup Settings', icon: '💾', route: '/config/backup' },
          ]
        },
      ]);
    } else if (roleId === '2') {
      // Tenant Admin - Tenant-specific features
      this.menuItems.set([
        ...commonItems,
        {
          label: 'Team Management',
          icon: '👥',
          children: [
            { label: 'Team Members', icon: '👤', route: '/team' },
            { label: 'Add Member', icon: '➕', route: '/team/add' },
            { label: 'Departments', icon: '🏢', route: '/departments' },
            { label: 'Teams', icon: '👫', route: '/teams' },
          ]
        },
        {
          label: 'Roles & Access',
          icon: '🔐',
          children: [
            { label: 'Tenant Roles', icon: '👔', route: '/tenant-roles' },
            { label: 'Permissions', icon: '🔑', route: '/tenant-permissions' },
            { label: 'Access Requests', icon: '📬', route: '/access-requests' },
          ]
        },
        {
          label: 'Loan Management',
          icon: '💰',
          children: [
            { label: 'All Loans', icon: '📋', route: '/loans' },
            { label: 'Create Loan', icon: '➕', route: '/loans/create' },
            { label: 'Pending Loans', icon: '⏳', route: '/loans/pending' },
            { label: 'Approved Loans', icon: '✅', route: '/loans/approved' },
            { label: 'Rejected Loans', icon: '❌', route: '/loans/rejected' },
          ]
        },
        {
          label: 'Appraisals',
          icon: '📊',
          children: [
            { label: 'All Appraisals', icon: '📋', route: '/appraisals' },
            { label: 'New Appraisal', icon: '➕', route: '/appraisals/create' },
            { label: 'In Progress', icon: '⏳', route: '/appraisals/in-progress' },
            { label: 'Completed', icon: '✅', route: '/appraisals/completed' },
          ]
        },
        {
          label: 'Customer Management',
          icon: '👤',
          children: [
            { label: 'All Customers', icon: '👥', route: '/customers' },
            { label: 'Add Customer', icon: '➕', route: '/customers/create' },
            { label: 'Customer Analytics', icon: '📊', route: '/customers/analytics' },
            { label: 'KYC Documents', icon: '📄', route: '/customers/kyc' },
          ]
        },
        {
          label: 'Operations',
          icon: '💼',
          children: [
            { label: 'Tasks', icon: '✅', route: '/operations/tasks' },
            { label: 'Requests', icon: '�', route: '/operations/requests' },
            { label: 'Queue Management', icon: '⏱️', route: '/operations/queue' },
          ]
        },
        {
          label: 'Reports & Analytics',
          icon: '📈',
          children: [
            { label: 'Reports', icon: '📊', route: '/reports' },
            { label: 'Loan Analytics', icon: '💹', route: '/reports/loans' },
            { label: 'Revenue Reports', icon: '�', route: '/reports/revenue' },
            { label: 'Performance Reports', icon: '⚡', route: '/reports/performance' },
            { label: 'Export Data', icon: '📥', route: '/reports/export' },
          ]
        },
        {
          label: 'Settings',
          icon: '⚙️',
          children: [
            { label: 'Tenant Settings', icon: '🏢', route: '/settings/tenant' },
            { label: 'Notification Settings', icon: '🔔', route: '/settings/notifications' },
            { label: 'API Configuration', icon: '🌐', route: '/settings/api' },
            { label: 'Integrations', icon: '🔗', route: '/settings/integrations' },
          ]
        },
      ]);
    } else if (roleId === '3') {
      // Department Manager - Department-level features
      this.menuItems.set([
        ...commonItems,
        {
          label: 'Team',
          icon: '👥',
          children: [
            { label: 'Department Members', icon: '👤', route: '/team/department' },
            { label: 'Manage Tasks', icon: '✅', route: '/team/tasks' },
          ]
        },
        {
          label: 'Loans',
          icon: '💰',
          children: [
            { label: 'Department Loans', icon: '📋', route: '/loans/department' },
            { label: 'Create Loan', icon: '➕', route: '/loans/create' },
            { label: 'My Loans', icon: '📝', route: '/loans/my' },
          ]
        },
        {
          label: 'Appraisals',
          icon: '📊',
          children: [
            { label: 'Department Appraisals', icon: '�', route: '/appraisals/department' },
            { label: 'New Appraisal', icon: '➕', route: '/appraisals/create' },
          ]
        },
        {
          label: 'Reports',
          icon: '📈',
          children: [
            { label: 'Department Reports', icon: '📊', route: '/reports/department' },
            { label: 'Team Performance', icon: '⚡', route: '/reports/team' },
          ]
        },
      ]);
    } else {
      // Regular User - Basic features
      this.menuItems.set([
        ...commonItems,
        {
          label: 'My Work',
          icon: '✅',
          children: [
            { label: 'My Tasks', icon: '📋', route: '/tasks' },
            { label: 'Pending Items', icon: '⏳', route: '/tasks/pending' },
            { label: 'Completed Items', icon: '✅', route: '/tasks/completed' },
          ]
        },
        {
          label: 'Loans',
          icon: '💰',
          children: [
            { label: 'My Loans', icon: '📋', route: '/my-loans' },
            { label: 'Loan Status', icon: '📊', route: '/my-loans/status' },
            { label: 'Loan Documents', icon: '📄', route: '/my-loans/documents' },
          ]
        },
        {
          label: 'Documents',
          icon: '📄',
          children: [
            { label: 'My Documents', icon: '📋', route: '/documents' },
            { label: 'Upload Document', icon: '📤', route: '/documents/upload' },
            { label: 'Archived', icon: '📦', route: '/documents/archived' },
          ]
        },
        {
          label: 'Communication',
          icon: '💬',
          children: [
            { label: 'Inbox', icon: '📧', route: '/messages/inbox' },
            { label: 'Sent', icon: '📤', route: '/messages/sent' },
            { label: 'Notifications', icon: '🔔', route: '/messages/notifications' },
          ]
        },
      ]);
    }
  }
}
