import { Component, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../core/services/toast.service';
import { ThemeService } from '../../../core/services/theme.service';
import { DevInfoComponent } from '../../../shared/components/dev-info/dev-info.component';

@Component({
  selector: 'app-customer-login',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, DevInfoComponent],
  template: `
    <div class="min-h-screen bg-gradient-to-br from-blue-50 via-white to-purple-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 flex items-center justify-center p-4">
      <!-- Background Pattern -->
      <div class="absolute inset-0 bg-grid-pattern opacity-5"></div>

      <div class="relative w-full max-w-md">
        <!-- Logo & Branding -->
        <div class="text-center mb-8">
          <div class="inline-flex items-center justify-center w-16 h-16 bg-gradient-to-br from-blue-600 to-purple-600 rounded-2xl mb-4 shadow-lg">
            <span class="text-3xl">💰</span>
          </div>
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white mb-2">
            Customer Portal
          </h1>
          <p class="text-gray-600 dark:text-gray-400">
            Access your loan account and manage payments
          </p>
        </div>

        <!-- Login Card -->
        <div class="bg-white dark:bg-gray-800 rounded-2xl shadow-xl border border-gray-200 dark:border-gray-700 overflow-hidden">
          <!-- Header -->
          <div class="bg-gradient-to-r from-blue-600 to-purple-600 px-8 py-6">
            <h2 class="text-2xl font-bold text-white">Sign In</h2>
            <p class="text-blue-100 text-sm mt-1">Welcome back! Please login to your account</p>
          </div>

          <!-- Form -->
          <form (ngSubmit)="onSubmit()" class="p-8 space-y-6">
            <!-- Email/Phone Field -->
            <div>
              <label for="identifier" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Email or Phone Number
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span class="text-gray-400">👤</span>
                </div>
                <input
                  type="text"
                  id="identifier"
                  [(ngModel)]="identifier"
                  name="identifier"
                  placeholder="Enter your email or phone"
                  class="w-full pl-10 pr-4 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                  required
                  [disabled]="loading()"
                />
              </div>
            </div>

            <!-- Password Field -->
            <div>
              <label for="password" class="block text-sm font-semibold text-gray-700 dark:text-gray-300 mb-2">
                Password
              </label>
              <div class="relative">
                <div class="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <span class="text-gray-400">🔒</span>
                </div>
                <input
                  [type]="showPassword() ? 'text' : 'password'"
                  id="password"
                  [(ngModel)]="password"
                  name="password"
                  placeholder="Enter your password"
                  class="w-full pl-10 pr-12 py-3 border border-gray-300 dark:border-gray-600 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-400"
                  required
                  [disabled]="loading()"
                />
                <button
                  type="button"
                  (click)="showPassword.set(!showPassword())"
                  class="absolute inset-y-0 right-0 pr-3 flex items-center text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <span>{{ showPassword() ? '🙈' : '👁️' }}</span>
                </button>
              </div>
            </div>

            <!-- Remember Me & Forgot Password -->
            <div class="flex items-center justify-between">
              <label class="flex items-center">
                <input
                  type="checkbox"
                  [(ngModel)]="rememberMe"
                  name="rememberMe"
                  class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-700"
                />
                <span class="ml-2 text-sm text-gray-600 dark:text-gray-400">Remember me</span>
              </label>
              <a routerLink="/customer/forgot-password" class="text-sm text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium">
                Forgot password?
              </a>
            </div>

            <!-- Error Message -->
            @if (error) {
              <div class="bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded-lg p-3">
                <p class="text-sm text-red-600 dark:text-red-400">{{ error }}</p>
              </div>
            }

            <!-- Submit Button -->
            <button
              type="submit"
              [disabled]="loading()"
              class="w-full bg-gradient-to-r from-blue-600 to-purple-600 hover:from-blue-700 hover:to-purple-700 disabled:from-gray-400 disabled:to-gray-500 text-white font-semibold py-3 rounded-lg transition-all duration-200 shadow-lg hover:shadow-xl disabled:cursor-not-allowed"
            >
              @if (loading()) {
                <span class="flex items-center justify-center">
                  <svg class="animate-spin -ml-1 mr-3 h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Signing in...
                </span>
              } @else {
                <span>Sign In</span>
              }
            </button>

            <!-- Divider -->
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-2 bg-white dark:bg-gray-800 text-gray-500">Quick Test Login</span>
              </div>
            </div>

            <!-- Test Accounts -->
            <div class="space-y-2">
              <p class="text-xs text-center text-gray-500 dark:text-gray-400 mb-3">⚡ Quick Test Login (Auto Submit)</p>
              @for (account of testAccounts; track account.email) {
                <button
                  type="button"
                  (click)="quickLogin(account)"
                  class="w-full p-3 bg-gradient-to-r from-green-50 to-emerald-50 dark:from-green-900/20 dark:to-emerald-900/20 hover:from-green-100 hover:to-emerald-100 dark:hover:from-green-900/30 dark:hover:to-emerald-900/30 border border-green-200 dark:border-green-800 rounded-lg transition-all text-left group"
                >
                  <div class="flex items-center justify-between">
                    <div class="flex items-center space-x-3">
                      <div class="w-8 h-8 bg-gradient-to-br from-green-600 to-emerald-600 rounded-full flex items-center justify-center flex-shrink-0">
                        <span class="text-white text-sm font-bold">{{ account.label.charAt(0) }}</span>
                      </div>
                      <div>
                        <p class="text-sm font-medium text-gray-900 dark:text-white">{{ account.label }}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">{{ account.email }}</p>
                      </div>
                    </div>
                    <span class="text-green-600 dark:text-green-400 font-bold">⚡</span>
                  </div>
                </button>
              }
            </div>

            <!-- Divider -->
            <div class="relative">
              <div class="absolute inset-0 flex items-center">
                <div class="w-full border-t border-gray-300 dark:border-gray-600"></div>
              </div>
              <div class="relative flex justify-center text-sm">
                <span class="px-2 bg-white dark:bg-gray-800 text-gray-500">Need help?</span>
              </div>
            </div>

            <!-- Help Links -->
            <div class="text-center space-y-2">
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Don't have an account? Contact your loan officer.
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                System Administrator?
                <a routerLink="/login" class="font-semibold text-indigo-600 hover:text-indigo-700 dark:text-indigo-400 dark:hover:text-indigo-300">
                  System Login →
                </a>
              </p>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Platform Employee?
                <a routerLink="/platform/login" class="font-semibold text-blue-600 hover:text-blue-700 dark:text-blue-400 dark:hover:text-blue-300">
                  Platform Login →
                </a>
              </p>
            </div>
          </form>
        </div>

        <!-- Footer Info -->
        <div class="mt-8 text-center">
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Secure customer portal • Your data is protected with encryption
          </p>
        </div>

        <!-- Theme Toggle -->
        <div class="mt-4 flex justify-center gap-2">
          <!-- Dev Info (Development Only) -->
          <app-dev-info />

          <button
            (click)="toggleTheme()"
            class="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition-colors"
            title="Toggle theme"
          >
            {{ themeService.isDarkMode() ? '☀️' : '🌙' }}
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .bg-grid-pattern {
      background-image:
        linear-gradient(to right, rgb(200, 200, 200) 1px, transparent 1px),
        linear-gradient(to bottom, rgb(200, 200, 200) 1px, transparent 1px);
      background-size: 20px 20px;
    }
  `]
})
export class CustomerLoginComponent {
  private http = inject(HttpClient);
  private router = inject(Router);
  private apiUrl = 'http://localhost:3000/api';

  toastService = inject(ToastService);
  themeService = inject(ThemeService);

  identifier = ''; // Email or phone
  password = '';
  rememberMe = false;
  loading = signal(false);
  showPassword = signal(false);
  error = '';

  testAccounts = [
    { email: 'customer1@acme.com', password: 'Admin@123', label: 'Maria Santos (ACME)' },
    { email: 'customer1@techstart.com', password: 'Admin@123', label: 'Juan Dela Cruz (TechStart)' },
  ];

  fillCredentials(account: { email: string; password: string }) {
    this.identifier = account.email;
    this.password = account.password;
    this.error = '';
  }

  // Quick login - auto submit
  quickLogin(account: { email: string; password: string }) {
    this.identifier = account.email;
    this.password = account.password;
    this.error = '';
    this.onSubmit();
  }

  toggleTheme() {
    this.themeService.toggle();
  }

  onSubmit() {
    if (!this.identifier || !this.password) {
      this.toastService.warning('Please enter your email/phone and password');
      return;
    }

    this.loading.set(true);
    this.error = '';

    // Customer login endpoint (plural: /customers/)
    this.http.post<any>(`${this.apiUrl}/customers/auth/login`, {
      identifier: this.identifier,
      password: this.password,
      rememberMe: this.rememberMe
    }).subscribe({
      next: (response) => {
        this.loading.set(false);

        // Store customer auth data
        if (response.data) {
          localStorage.setItem('customerToken', response.data.tokens.accessToken);
          localStorage.setItem('customerRefreshToken', response.data.tokens.refreshToken);
          localStorage.setItem('customerData', JSON.stringify(response.data.customer));

          const customerName = response.data.customer.firstName + ' ' + response.data.customer.lastName;
          this.toastService.success(`Welcome back, ${customerName}!`);

          // Redirect to customer dashboard
          setTimeout(() => {
            this.router.navigate(['/customer/dashboard']);
          }, 100);
        }
      },
      error: (error) => {
        this.loading.set(false);
        const message = error.error?.message || 'Login failed. Please check your credentials.';
        this.toastService.error(message);
        this.error = message;
      }
    });
  }
}
