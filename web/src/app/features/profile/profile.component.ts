import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, User } from '../../core/services/auth.service';
import { HttpClient } from '@angular/common/http';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 space-y-4 max-w-4xl mx-auto bg-gray-50 dark:bg-gray-900 min-h-screen">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">My Profile</h1>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Manage your personal information</p>
        </div>
        <button
          (click)="goBack()"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      </div>

      <!-- Profile Card -->
      <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <!-- Profile Header -->
        <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500 to-blue-600">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-full bg-white flex items-center justify-center text-blue-600 text-2xl font-bold">
              {{ getUserInitials() }}
            </div>
            <div>
              <h2 class="text-lg font-bold text-white">{{ form.first_name }} {{ form.last_name }}</h2>
              <p class="text-sm text-blue-100">{{ user()?.email }}</p>
            </div>
          </div>
        </div>

        <!-- Error/Success Messages -->
        <div *ngIf="errorMessage()" class="mx-4 mt-4 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
          {{ errorMessage() }}
        </div>
        <div *ngIf="successMessage()" class="mx-4 mt-4 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-xs text-green-700 dark:text-green-300">
          {{ successMessage() }}
        </div>

        <!-- Profile Form -->
        <form (ngSubmit)="saveProfile()" class="p-4 space-y-4">
          <!-- Personal Information -->
          <div class="space-y-3">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Personal Information</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  [(ngModel)]="form.first_name"
                  name="first_name"
                  required
                  class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Name <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  [(ngModel)]="form.last_name"
                  name="last_name"
                  required
                  class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div class="md:col-span-2">
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  [value]="user()?.email"
                  disabled
                  class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Email cannot be changed</p>
              </div>
            </div>
          </div>

          <!-- Account Information -->
          <div class="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Account Information</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  User Type
                </label>
                <input
                  type="text"
                  [value]="authService.isSystemAdmin() ? 'System Admin' : 'Tenant User'"
                  disabled
                  class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <input
                  type="text"
                  value="Active"
                  disabled
                  class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              (click)="goBack()"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
            <button
              type="submit"
              [disabled]="saving()"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg *ngIf="!saving()" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span *ngIf="saving()" class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              {{ saving() ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </form>
      </div>

      <!-- Change Password Section -->
      <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Change Password</h3>
        </div>
        <form (ngSubmit)="changePassword()" class="p-4 space-y-3">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Current Password <span class="text-red-500">*</span>
            </label>
            <input
              type="password"
              [(ngModel)]="passwordForm.currentPassword"
              name="currentPassword"
              class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              New Password <span class="text-red-500">*</span>
            </label>
            <input
              type="password"
              [(ngModel)]="passwordForm.newPassword"
              name="newPassword"
              class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Minimum 8 characters</p>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirm New Password <span class="text-red-500">*</span>
            </label>
            <input
              type="password"
              [(ngModel)]="passwordForm.confirmPassword"
              name="confirmPassword"
              class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            [disabled]="savingPassword()"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg *ngIf="!savingPassword()" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            <span *ngIf="savingPassword()" class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
            {{ savingPassword() ? 'Updating...' : 'Update Password' }}
          </button>
        </form>
      </div>
    </div>
  `
})
export class ProfileComponent implements OnInit {
  authService = inject(AuthService);
  http = inject(HttpClient);
  router = inject(Router);

  user = this.authService.currentUser;
  saving = signal(false);
  savingPassword = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  form = {
    first_name: '',
    last_name: ''
  };

  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  ngOnInit(): void {
    const currentUser = this.user();
    if (currentUser) {
      this.form.first_name = currentUser.first_name;
      this.form.last_name = currentUser.last_name;
    }
  }

  getUserInitials(): string {
    return `${this.form.first_name?.[0] || ''}${this.form.last_name?.[0] || ''}`.toUpperCase();
  }

  saveProfile(): void {
    this.saving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.http.put(`http://localhost:3000/api/users/${this.user()?.id}`, this.form).subscribe({
      next: (response: any) => {
        this.saving.set(false);
        this.successMessage.set('Profile updated successfully!');
        
        // Update the user in AuthService
        const updatedUser = { ...this.user()!, ...this.form };
        this.authService.currentUser.set(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));

        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (error) => {
        this.saving.set(false);
        this.errorMessage.set(error.error?.message || 'Failed to update profile');
      }
    });
  }

  changePassword(): void {
    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.errorMessage.set('New passwords do not match');
      return;
    }

    if (this.passwordForm.newPassword.length < 8) {
      this.errorMessage.set('Password must be at least 8 characters');
      return;
    }

    this.savingPassword.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.http.put(`http://localhost:3000/api/users/${this.user()?.id}/password`, {
      currentPassword: this.passwordForm.currentPassword,
      newPassword: this.passwordForm.newPassword
    }).subscribe({
      next: () => {
        this.savingPassword.set(false);
        this.successMessage.set('Password updated successfully!');
        this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (error) => {
        this.savingPassword.set(false);
        this.errorMessage.set(error.error?.message || 'Failed to update password');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }
}
