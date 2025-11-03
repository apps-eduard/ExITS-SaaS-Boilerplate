import { Component, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RoleService } from '../../../core/services/role.service';

@Component({
  selector: 'app-user-invite',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 max-w-4xl mx-auto">
      <!-- Header -->
      <div class="mb-4">
        <div class="flex items-center gap-2 mb-1">
          <button
            (click)="goBack()"
            class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
          >
            <svg class="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">Invite Users</h1>
        </div>
        <p class="text-xs text-gray-500 dark:text-gray-400 ml-7">
          Send email invitations to new users to join the platform
        </p>
      </div>

      <!-- Success Message -->
      <div *ngIf="successMessage()" class="mb-3 rounded border border-green-200 bg-green-50 px-3 py-2 dark:border-green-900 dark:bg-green-900/20">
        <div class="flex items-start gap-2">
          <svg class="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p class="text-xs font-medium text-green-800 dark:text-green-300">{{ successMessage() }}</p>
          </div>
        </div>
      </div>

      <!-- Error Message -->
      <div *ngIf="errorMessage()" class="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 dark:border-red-900 dark:bg-red-900/20">
        <div class="flex items-start gap-2">
          <svg class="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p class="text-xs font-medium text-red-800 dark:text-red-300">{{ errorMessage() }}</p>
          </div>
        </div>
      </div>

      <div class="space-y-4">
        <!-- Invitation Method -->
        <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Invitation Method</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <button
              (click)="inviteMethod.set('single')"
              [class]="'flex items-start gap-2 p-3 rounded-lg border-2 transition ' + (inviteMethod() === 'single' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600')"
            >
              <div class="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div class="text-left">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Single Invitation</h3>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Invite one user at a time</p>
              </div>
            </button>

            <button
              (click)="inviteMethod.set('bulk')"
              [class]="'flex items-start gap-2 p-3 rounded-lg border-2 transition ' + (inviteMethod() === 'bulk' ? 'border-blue-500 bg-blue-50 dark:bg-blue-900/20' : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600')"
            >
              <div class="flex-shrink-0 w-8 h-8 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <div class="text-left">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Bulk Invitation</h3>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Invite multiple users</p>
              </div>
            </button>
          </div>
        </div>

        <!-- Single Invitation Form -->
        <div *ngIf="inviteMethod() === 'single'" class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">User Details</h2>
          
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email Address <span class="text-red-500">*</span>
              </label>
              <input
                [(ngModel)]="singleInvite.email"
                type="email"
                placeholder="user@example.com"
                class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                First Name
              </label>
              <input
                [(ngModel)]="singleInvite.firstName"
                type="text"
                placeholder="John"
                class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Name
              </label>
              <input
                [(ngModel)]="singleInvite.lastName"
                type="text"
                placeholder="Doe"
                class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                User Type <span class="text-red-500">*</span>
              </label>
              <select
                [(ngModel)]="singleInvite.userType"
                class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="system">System Admin</option>
                <option value="tenant">Tenant User</option>
              </select>
            </div>
          </div>

          <div class="mt-3">
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Assign Role
            </label>
            <select
              [(ngModel)]="singleInvite.roleId"
              class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            >
              <option value="">No role (assign later)</option>
              <option *ngFor="let role of getAvailableRoles(singleInvite.userType)" [value]="role.id">
                {{ role.name }} ({{ role.space }})
              </option>
            </select>
          </div>

          <div class="mt-3">
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Custom Message (Optional)
            </label>
            <textarea
              [(ngModel)]="singleInvite.message"
              rows="3"
              placeholder="Add a personal message to the invitation email..."
              class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
            ></textarea>
          </div>
        </div>

        <!-- Bulk Invitation Form -->
        <div *ngIf="inviteMethod() === 'bulk'" class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <h2 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Bulk Invitation</h2>
          
          <div class="mb-3">
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Email Addresses <span class="text-red-500">*</span>
            </label>
            <textarea
              [(ngModel)]="bulkEmails"
              rows="6"
              placeholder="Enter email addresses (one per line)&#10;user1@example.com&#10;user2@example.com&#10;user3@example.com"
              class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white font-mono"
            ></textarea>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {{ getEmailCount() }} email(s) detected
            </p>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                User Type <span class="text-red-500">*</span>
              </label>
              <select
                [(ngModel)]="bulkInvite.userType"
                class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="system">System Admin</option>
                <option value="tenant">Tenant User</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Assign Role
              </label>
              <select
                [(ngModel)]="bulkInvite.roleId"
                class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="">No role (assign later)</option>
                <option *ngFor="let role of getAvailableRoles(bulkInvite.userType)" [value]="role.id">
                  {{ role.name }} ({{ role.space }})
                </option>
              </select>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-2">
          <button
            (click)="goBack()"
            type="button"
            class="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition"
          >
            Cancel
          </button>
          <button
            (click)="sendInvitations()"
            [disabled]="sending() || !canSendInvitations()"
            class="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {{ sending() ? 'Sending...' : 'Send Invitation' + (inviteMethod() === 'bulk' && getEmailCount() > 1 ? 's' : '') }}
          </button>
        </div>
      </div>
    </div>
  `
})
export class UserInviteComponent {
  inviteMethod = signal<'single' | 'bulk'>('single');
  sending = signal(false);
  successMessage = signal<string | null>(null);
  errorMessage = signal<string | null>(null);
  private returnRoute = '/admin/users';

  singleInvite = {
    email: '',
    firstName: '',
    lastName: '',
    userType: 'tenant',
    roleId: '',
    message: ''
  };

  bulkEmails = '';
  bulkInvite = {
    userType: 'tenant',
    roleId: ''
  };

  constructor(
    private router: Router,
    public roleService: RoleService
  ) {
    this.roleService.loadRoles();
    const currentUrl = this.router.url || '';
    if (currentUrl.startsWith('/tenant')) {
      this.returnRoute = '/tenant/users';
    }
  }

  getAvailableRoles(userType: string) {
    return this.roleService.rolesSignal().filter(r => r.space === userType);
  }

  getEmailCount(): number {
    if (!this.bulkEmails.trim()) return 0;
    return this.bulkEmails.split('\n').filter(e => e.trim()).length;
  }

  canSendInvitations(): boolean {
    if (this.inviteMethod() === 'single') {
      return !!this.singleInvite.email && this.isValidEmail(this.singleInvite.email);
    } else {
      return this.getEmailCount() > 0;
    }
  }

  isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  async sendInvitations() {
    if (!this.canSendInvitations() || this.sending()) return;

    this.sending.set(true);
    this.successMessage.set(null);
    this.errorMessage.set(null);

    try {
      if (this.inviteMethod() === 'single') {
        // Send single invitation
        console.log('📧 Sending invitation to:', this.singleInvite);
        
        // TODO: Call API endpoint to send invitation
        // await this.userService.sendInvitation(this.singleInvite);
        
        await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate API call
        
        this.successMessage.set(`Invitation sent successfully to ${this.singleInvite.email}`);
        
        // Reset form
        this.singleInvite = {
          email: '',
          firstName: '',
          lastName: '',
          userType: 'tenant',
          roleId: '',
          message: ''
        };
      } else {
        // Send bulk invitations
        const emails = this.bulkEmails.split('\n')
          .map(e => e.trim())
          .filter(e => e && this.isValidEmail(e));
        
        console.log('📧 Sending bulk invitations to:', emails);
        
        // TODO: Call API endpoint to send bulk invitations
        // await this.userService.sendBulkInvitations(emails, this.bulkInvite);
        
        await new Promise(resolve => setTimeout(resolve, 1500)); // Simulate API call
        
        this.successMessage.set(`Successfully sent ${emails.length} invitation${emails.length > 1 ? 's' : ''}`);
        
        // Reset form
        this.bulkEmails = '';
        this.bulkInvite = {
          userType: 'tenant',
          roleId: ''
        };
      }

      // Navigate back after 2 seconds
      setTimeout(() => {
        this.router.navigateByUrl(this.returnRoute);
      }, 2000);

    } catch (error) {
      console.error('❌ Error sending invitations:', error);
      this.errorMessage.set(error instanceof Error ? error.message : 'Failed to send invitations');
    } finally {
      this.sending.set(false);
    }
  }

  goBack() {
    this.router.navigateByUrl(this.returnRoute);
  }
}
