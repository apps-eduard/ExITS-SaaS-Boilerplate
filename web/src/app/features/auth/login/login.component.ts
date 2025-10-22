import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';
import { ThemeService } from '../../../core/services/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen flex items-center justify-center bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 px-4">
      <!-- Theme Toggle -->
      <button
        (click)="themeService.toggle()"
        class="fixed top-4 right-4 p-2.5 rounded-lg bg-white dark:bg-gray-800 shadow-lg hover:shadow-xl border border-gray-200 dark:border-gray-700">
        @if (themeService.isDark()) {
          <svg class="w-5 h-5 text-yellow-500" fill="currentColor" viewBox="0 0 20 20">
            <path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"/>
          </svg>
        } @else {
          <svg class="w-5 h-5 text-gray-700" fill="currentColor" viewBox="0 0 20 20">
            <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
          </svg>
        }
      </button>

      <div class="w-full max-w-md">
        <!-- Logo & Title -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-primary-600 to-primary-700 shadow-lg mb-4">
            <svg class="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
            </svg>
          </div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white">ExITS SaaS</h1>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">Integrated Loan & Appraisal Management</p>
        </div>

        <!-- Login Card -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 p-8">
          <h2 class="text-2xl font-bold text-gray-900 dark:text-white mb-6">Welcome Back</h2>

          <form (ngSubmit)="login()" class="space-y-4">
            <!-- Email -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Email</label>
              <input
                type="email"
                [(ngModel)]="email"
                name="email"
                required
                placeholder="admin@exitsaas.com"
                class="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            </div>

            <!-- Password -->
            <div>
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">Password</label>
              <input
                type="password"
                [(ngModel)]="password"
                name="password"
                required
                placeholder="••••••••"
                class="w-full px-4 py-2.5 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-primary-500 focus:border-transparent">
            </div>

            <!-- Remember & Forgot -->
            <div class="flex items-center justify-between text-sm">
              <label class="flex items-center">
                <input type="checkbox" class="w-4 h-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500">
                <span class="ml-2 text-gray-700 dark:text-gray-300">Remember me</span>
              </label>
              <a href="#" class="text-primary-600 dark:text-primary-400 hover:underline">Forgot password?</a>
            </div>

            <!-- Submit Button -->
            <button
              type="submit"
              [disabled]="loading()"
              class="w-full py-3 px-4 bg-primary-600 hover:bg-primary-700 disabled:bg-gray-400 text-white font-medium rounded-lg shadow-lg hover:shadow-xl transition-all duration-200 flex items-center justify-center gap-2">
              @if (loading()) {
                <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                  <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                  <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Signing in...</span>
              } @else {
                <span>Sign In</span>
              }
            </button>
          </form>

          <!-- Test Accounts -->
          <div class="mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
            <p class="text-xs text-gray-500 dark:text-gray-400 mb-3 text-center">Quick Test Accounts</p>
            <div class="grid grid-cols-2 gap-2">
              @for (account of testAccounts; track account.email) {
                <button
                  (click)="fillCredentials(account)"
                  class="px-3 py-2 text-xs font-medium rounded-lg border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300">
                  {{ account.label }}
                </button>
              }
            </div>
          </div>
        </div>

        <!-- Footer -->
        <p class="text-center text-xs text-gray-500 dark:text-gray-400 mt-6">
          © 2025 ExITS. All rights reserved.
        </p>
      </div>
    </div>
  `
})
export class LoginComponent {
  authService = inject(AuthService);
  toastService = inject(ToastService);
  themeService = inject(ThemeService);
  router = inject(Router);

  email = '';
  password = '';
  loading = signal(false);

  testAccounts = [
    { email: 'admin@exitsaas.com', password: 'Admin@123', label: 'System Admin' },
    { email: 'admin-1@example.com', password: 'Admin@123', label: 'Tenant 1 Admin' },
    { email: 'admin-2@example.com', password: 'Admin@123', label: 'Tenant 2 Admin' },
    { email: 'admin-3@example.com', password: 'Admin@123', label: 'Tenant 3 Admin' }
  ];

  fillCredentials(account: any) {
    this.email = account.email;
    this.password = account.password;
  }

  login() {
    if (!this.email || !this.password) {
      this.toastService.warning('Please enter email and password');
      return;
    }

    this.loading.set(true);

    this.authService.login(this.email, this.password).subscribe({
      next: (response) => {
        this.loading.set(false);
        console.log('Login successful:', response);
        console.log('isAuthenticated:', this.authService.isAuthenticated());
        this.toastService.success(`Welcome back, ${response.data.user.first_name}!`);

        // Route based on user type
        const user = response.data.user;
        const isSystemAdmin = user.tenant_id === null || user.tenant_id === undefined;
        const targetRoute = isSystemAdmin ? '/dashboard' : '/tenant/dashboard';

        console.log('User type:', isSystemAdmin ? 'System Admin' : 'Tenant User');
        console.log('Redirecting to:', targetRoute);

        // Use setTimeout to ensure state is updated before navigation
        setTimeout(() => {
          this.router.navigate([targetRoute]).then(success => {
            console.log('Navigation result:', success);
          });
        }, 100);
      },
      error: (error) => {
        this.loading.set(false);
        console.error('Login error:', error);
        const message = error.error?.message || 'Login failed. Please check your credentials.';
        this.toastService.error(message);
      }
    });
  }
}
