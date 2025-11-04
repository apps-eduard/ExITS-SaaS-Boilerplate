import { Component, signal, computed, inject, ViewChild, ElementRef, AfterViewInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '../../../core/services/toast.service';

export interface ResetPasswordModalData {
  userId: number | string;
  userName: string;
  userEmail: string;
}

@Component({
  selector: 'app-reset-password-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Modal Backdrop -->
    <div
      *ngIf="isOpen()"
      class="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm"
      (click)="onBackdropClick($event)"
    >
      <!-- Modal Container -->
      <div
        class="relative w-full max-w-md mx-4 bg-white dark:bg-gray-800 rounded-2xl shadow-2xl transform transition-all"
        (click)="$event.stopPropagation()"
      >
        <!-- Modal Header -->
        <div class="flex items-center justify-between p-5 border-b border-gray-200 dark:border-gray-700">
          <div class="flex items-center gap-3">
            <div class="flex items-center justify-center w-10 h-10 rounded-full bg-purple-100 dark:bg-purple-900/30">
              <span class="text-xl">🔑</span>
            </div>
            <div>
              <h3 class="text-base font-semibold text-gray-900 dark:text-white">
                Reset Password
              </h3>
              <p class="text-xs text-gray-500 dark:text-gray-400">
                Set a new password for {{ userData()?.userName }}
              </p>
            </div>
          </div>
          <button
            (click)="close()"
            class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <!-- Modal Body -->
        <div class="p-5 space-y-4">
          <!-- User Info Card -->
          <div class="p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg border border-gray-200 dark:border-gray-600">
            <div class="flex items-center gap-3">
              <div class="flex-shrink-0 w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                <span class="text-white font-medium text-sm">
                  {{ getInitials(userData()?.userName || '') }}
                </span>
              </div>
              <div class="flex-1 min-w-0">
                <p class="text-sm font-medium text-gray-900 dark:text-white truncate">
                  {{ userData()?.userName }}
                </p>
                <p class="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {{ userData()?.userEmail }}
                </p>
              </div>
            </div>
          </div>

          <!-- Password Input -->
          <div>
            <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              New Password
            </label>
            <div class="relative">
              <input
                #passwordInput
                [ngModel]="newPassword()"
                (ngModelChange)="newPassword.set($event)"
                [type]="showPassword() ? 'text' : 'password'"
                placeholder="Enter new password"
                class="w-full px-4 py-2.5 pr-10 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-purple-500 focus:border-transparent transition"
                [class.border-red-500]="newPassword() && newPassword().length < 8"
                [class.border-green-500]="newPassword() && newPassword().length >= 8"
              />
              <button
                type="button"
                (click)="togglePasswordVisibility()"
                class="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <span class="text-sm">{{ showPassword() ? '👁️' : '👁️‍🗨️' }}</span>
              </button>
            </div>

            <!-- Password Strength Indicator -->
            <div class="mt-2 space-y-1">
              <div class="flex items-center gap-2">
                <div class="flex-1 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                  <div
                    class="h-full transition-all duration-300"
                    [style.width.%]="passwordStrength()"
                    [class]="getPasswordStrengthClass()"
                  ></div>
                </div>
                <span class="text-xs font-medium" [class]="getPasswordStrengthTextClass()">
                  {{ getPasswordStrengthLabel() }}
                </span>
              </div>

              <!-- Requirements -->
              <div class="space-y-1">
                <div class="flex items-center gap-2 text-xs">
                  <span [class]="newPassword().length >= 8 ? 'text-green-600 dark:text-green-400' : 'text-gray-400'">
                    {{ newPassword().length >= 8 ? '✓' : '○' }}
                  </span>
                  <span [class]="newPassword().length >= 8 ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'">
                    At least 8 characters
                  </span>
                </div>
                <div class="flex items-center gap-2 text-xs">
                  <span [class]="hasUpperCase() ? 'text-green-600 dark:text-green-400' : 'text-gray-400'">
                    {{ hasUpperCase() ? '✓' : '○' }}
                  </span>
                  <span [class]="hasUpperCase() ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'">
                    Contains uppercase letter
                  </span>
                </div>
                <div class="flex items-center gap-2 text-xs">
                  <span [class]="hasNumber() ? 'text-green-600 dark:text-green-400' : 'text-gray-400'">
                    {{ hasNumber() ? '✓' : '○' }}
                  </span>
                  <span [class]="hasNumber() ? 'text-gray-700 dark:text-gray-300' : 'text-gray-500 dark:text-gray-400'">
                    Contains number
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Warning Notice -->
          <div class="flex items-start gap-2 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg">
            <span class="text-amber-600 dark:text-amber-400 text-base">⚠️</span>
            <div class="flex-1">
              <p class="text-xs font-medium text-amber-800 dark:text-amber-200">
                Important
              </p>
              <p class="text-xs text-amber-700 dark:text-amber-300 mt-0.5">
                The user will need to use this new password on their next login.
              </p>
            </div>
          </div>
        </div>

        <!-- Modal Footer -->
        <div class="flex items-center justify-end gap-2 p-5 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 rounded-b-2xl">
          <button
            (click)="close()"
            [disabled]="isResetting()"
            class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-600 transition disabled:opacity-50"
          >
            Cancel
          </button>
          <button
            (click)="resetPassword()"
            [disabled]="!canReset() || isResetting()"
            class="px-4 py-2 text-sm font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
          >
            <span *ngIf="isResetting()" class="inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></span>
            {{ isResetting() ? 'Resetting...' : 'Reset Password' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    @keyframes slideIn {
      from {
        opacity: 0;
        transform: scale(0.95) translateY(-10px);
      }
      to {
        opacity: 1;
        transform: scale(1) translateY(0);
      }
    }

    .relative {
      animation: slideIn 0.2s ease-out;
    }
  `]
})
export class ResetPasswordModalComponent {
  @ViewChild('passwordInput') passwordInput!: ElementRef<HTMLInputElement>;

  private http = inject(HttpClient);
  private toastService = inject(ToastService);

  isOpen = signal(false);
  userData = signal<ResetPasswordModalData | null>(null);
  newPassword = signal('');
  showPassword = signal(false);
  isResetting = signal(false);

  // Password validation computed signals
  hasUpperCase = computed(() => /[A-Z]/.test(this.newPassword()));
  hasNumber = computed(() => /[0-9]/.test(this.newPassword()));

  passwordStrength = computed(() => {
    const pwd = this.newPassword();
    if (!pwd) return 0;

    let strength = 0;
    if (pwd.length >= 8) strength += 25;
    if (pwd.length >= 12) strength += 25;
    if (this.hasUpperCase()) strength += 25;
    if (this.hasNumber()) strength += 25;

    return strength;
  });

  canReset = computed(() => {
    const pwd = this.newPassword();
    return pwd && pwd.length >= 8;
  });

  open(data: ResetPasswordModalData) {
    console.log('Reset Password Modal - Opening with data:', data);
    this.userData.set(data);
    this.newPassword.set('');
    this.showPassword.set(false);
    this.isOpen.set(true);
  }

  close() {
    this.isOpen.set(false);
    this.userData.set(null);
    this.newPassword.set('');
    this.isResetting.set(false);
  }

  togglePasswordVisibility() {
    this.showPassword.update(v => !v);
  }

  onBackdropClick(event: MouseEvent) {
    // Prevent closing when clicking outside - user must use close button or ESC
    // if (event.target === event.currentTarget) {
    //   this.close();
    // }
  }

  getInitials(name: string): string {
    if (!name) return '?';
    const parts = name.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return name.substring(0, 2).toUpperCase();
  }

  getPasswordStrengthClass(): string {
    const strength = this.passwordStrength();
    if (strength >= 75) return 'bg-green-500';
    if (strength >= 50) return 'bg-yellow-500';
    if (strength >= 25) return 'bg-orange-500';
    return 'bg-red-500';
  }

  getPasswordStrengthTextClass(): string {
    const strength = this.passwordStrength();
    if (strength >= 75) return 'text-green-600 dark:text-green-400';
    if (strength >= 50) return 'text-yellow-600 dark:text-yellow-400';
    if (strength >= 25) return 'text-orange-600 dark:text-orange-400';
    return 'text-red-600 dark:text-red-400';
  }

  getPasswordStrengthLabel(): string {
    const strength = this.passwordStrength();
    const pwd = this.newPassword();
    if (!pwd) return 'Enter password';
    if (strength >= 75) return 'Strong';
    if (strength >= 50) return 'Good';
    if (strength >= 25) return 'Fair';
    return 'Weak';
  }

  async resetPassword() {
    if (!this.canReset() || this.isResetting()) return;

    const data = this.userData();
    if (!data) return;

    // Ensure userId is properly formatted
    const userId = String(data.userId);
    if (!userId || userId === 'undefined' || userId === 'null') {
      this.toastService.show('error', 'Invalid user ID');
      return;
    }

    this.isResetting.set(true);

    try {
      const response = await firstValueFrom(
        this.http.put<{ success: boolean; message?: string }>(`/api/users/${userId}/reset-password`, {
          newPassword: this.newPassword()
        })
      );

      if (response.success) {
        this.toastService.show('success', `Password reset successfully for ${data.userName}`);
        this.close();
      } else {
        this.toastService.show('error', 'Failed to reset password');
        this.isResetting.set(false);
      }
    } catch (error: any) {
      console.error('Error resetting password:', error);
      const errorMsg = error?.error?.message || 'Failed to reset password';
      this.toastService.show('error', errorMsg);
      this.isResetting.set(false);
    }
  }
}
