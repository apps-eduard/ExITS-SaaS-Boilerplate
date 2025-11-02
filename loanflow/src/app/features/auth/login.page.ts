import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonHeader,
  IonToolbar,
  IonTitle,
  IonContent,
  IonCard,
  IonCardContent,
  IonItem,
  IonInput,
  IonButton,
  IonIcon,
  IonSpinner,
  IonButtons,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cashOutline, personOutline, lockClosedOutline, logInOutline, moonOutline, sunnyOutline } from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    IonHeader,
    IonToolbar,
    IonTitle,
    IonContent,
    IonCard,
    IonCardContent,
    IonItem,
    IonInput,
    IonButton,
    IonIcon,
    IonSpinner,
    IonButtons
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar color="primary">
        <ion-title class="text-center font-bold">LoanFlow</ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="toggleTheme()">
            <ion-icon [name]="themeService.isDark() ? 'sunny-outline' : 'moon-outline'" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="ion-padding" [class.dark-mode]="themeService.isDark()">
      <div class="login-container">
        
        <!-- Logo/Header Section -->
        <div class="text-center mb-8">
          <div class="w-20 h-20 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <ion-icon name="cash-outline" class="text-5xl text-white"></ion-icon>
          </div>
          <h1 class="text-3xl font-bold heading-text mb-2">Welcome Back</h1>
          <p class="subtitle-text">Sign in to your account</p>
        </div>

        <!-- Login Form -->
        <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
          <ion-card class="shadow-lg card-bg">
            <ion-card-content class="p-6">
              
              <!-- Email Input -->
              <ion-item lines="none" class="mb-4 rounded-lg input-item">
                <ion-icon name="person-outline" slot="start" color="medium"></ion-icon>
                <ion-input
                  type="email"
                  placeholder="Email"
                  [(ngModel)]="email"
                  name="email"
                  required
                  autocomplete="email"
                ></ion-input>
              </ion-item>

              <!-- Password Input -->
              <ion-item lines="none" class="mb-6 rounded-lg input-item">
                <ion-icon name="lock-closed-outline" slot="start" color="medium"></ion-icon>
                <ion-input
                  type="password"
                  placeholder="Password"
                  [(ngModel)]="password"
                  name="password"
                  required
                  autocomplete="current-password"
                ></ion-input>
              </ion-item>

              <!-- Login Button -->
              <ion-button
                type="submit"
                expand="block"
                [disabled]="loading || !loginForm.valid"
                class="font-semibold"
              >
                <ion-spinner name="crescent" *ngIf="loading" class="mr-2"></ion-spinner>
                <ion-icon name="log-in-outline" slot="start" *ngIf="!loading"></ion-icon>
                {{ loading ? 'Signing in...' : 'Sign In' }}
              </ion-button>

            </ion-card-content>
          </ion-card>
        </form>

        <!-- Quick Login Section -->
        <div class="mt-8">
          <div class="text-center mb-4">
            <p class="subtitle-text text-sm">Quick Login (Development Only)</p>
          </div>

          <div class="grid grid-cols-2 gap-3">
            <!-- Customer Quick Logins -->
            <ion-card 
              button
              (click)="quickLogin(testUsers[0])"
              class="quick-login-card customer-card"
            >
              <ion-card-content class="text-center p-3">
                <div class="w-12 h-12 bg-green-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span class="text-white font-bold">{{ testUsers[0].initials }}</span>
                </div>
                <p class="text-sm font-semibold card-text">{{ testUsers[0].name }}</p>
                <p class="text-xs subtitle-text">{{ testUsers[0].role }}</p>
              </ion-card-content>
            </ion-card>

            <ion-card 
              button
              (click)="quickLogin(testUsers[1])"
              class="quick-login-card customer-card"
            >
              <ion-card-content class="text-center p-3">
                <div class="w-12 h-12 bg-green-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span class="text-white font-bold">{{ testUsers[1].initials }}</span>
                </div>
                <p class="text-sm font-semibold card-text">{{ testUsers[1].name }}</p>
                <p class="text-xs subtitle-text">{{ testUsers[1].role }}</p>
              </ion-card-content>
            </ion-card>

            <!-- Collector Quick Logins -->
            <ion-card 
              button
              (click)="quickLogin(testUsers[2])"
              class="quick-login-card collector-card"
            >
              <ion-card-content class="text-center p-3">
                <div class="w-12 h-12 bg-blue-500 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span class="text-white font-bold">{{ testUsers[2].initials }}</span>
                </div>
                <p class="text-sm font-semibold card-text">{{ testUsers[2].name }}</p>
                <p class="text-xs subtitle-text">{{ testUsers[2].role }}</p>
              </ion-card-content>
            </ion-card>

            <ion-card 
              button
              (click)="quickLogin(testUsers[3])"
              class="quick-login-card collector-card"
            >
              <ion-card-content class="text-center p-3">
                <div class="w-12 h-12 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-2">
                  <span class="text-white font-bold">{{ testUsers[3].initials }}</span>
                </div>
                <p class="text-sm font-semibold card-text">{{ testUsers[3].name }}</p>
                <p class="text-xs subtitle-text">{{ testUsers[3].role }}</p>
              </ion-card-content>
            </ion-card>
          </div>
        </div>

      </div>
    </ion-content>
  `,
  styles: [`
    .login-container {
      max-width: 500px;
      margin: 0 auto;
      padding: 2rem 0;
    }

    ion-item {
      --background: transparent;
      --padding-start: 12px;
    }

    ion-card {
      margin: 0;
    }

    /* Dark mode support */
    .heading-text {
      color: var(--ion-text-color, #111827);
    }

    .subtitle-text {
      color: var(--ion-color-medium);
    }

    .card-text {
      color: var(--ion-text-color);
    }

    .card-bg {
      background: var(--ion-card-background, #ffffff);
    }

    .input-item {
      border: 1px solid var(--ion-color-medium);
      --background: var(--ion-item-background, transparent);
    }

    .quick-login-card {
      margin: 0;
      border: 2px solid;
    }

    .customer-card {
      background: var(--ion-color-success-tint);
      border-color: var(--ion-color-success);
      --background: var(--ion-color-success-tint);
    }

    .collector-card {
      background: var(--ion-color-primary-tint);
      border-color: var(--ion-color-primary);
      --background: var(--ion-color-primary-tint);
    }

    .grid {
      display: grid;
    }

    .grid-cols-2 {
      grid-template-columns: repeat(2, 1fr);
    }

    .gap-3 {
      gap: 0.75rem;
    }

    .text-center {
      text-align: center;
    }

    .mb-2 { margin-bottom: 0.5rem; }
    .mb-4 { margin-bottom: 1rem; }
    .mb-6 { margin-bottom: 1.5rem; }
    .mb-8 { margin-bottom: 2rem; }
    .mt-8 { margin-top: 2rem; }
    .mr-2 { margin-right: 0.5rem; }

    .mx-auto {
      margin-left: auto;
      margin-right: auto;
    }

    .w-12 { width: 3rem; }
    .h-12 { height: 3rem; }
    .w-20 { width: 5rem; }
    .h-20 { height: 5rem; }

    .rounded-full { border-radius: 9999px; }
    .rounded-lg { border-radius: 0.5rem; }

    .flex {
      display: flex;
    }

    .items-center {
      align-items: center;
    }

    .justify-center {
      justify-content: center;
    }

    .font-bold { font-weight: 700; }
    .font-semibold { font-weight: 600; }

    .text-3xl { font-size: 1.875rem; line-height: 2.25rem; }
    .text-5xl { font-size: 3rem; line-height: 1; }
    .text-sm { font-size: 0.875rem; line-height: 1.25rem; }
    .text-xs { font-size: 0.75rem; line-height: 1rem; }

    .bg-primary { background-color: var(--ion-color-primary); }
    .bg-green-500 { background-color: #22c55e; }
    .bg-green-600 { background-color: #16a34a; }
    .bg-blue-500 { background-color: #3b82f6; }
    .bg-blue-600 { background-color: #2563eb; }

    .text-white { color: #ffffff; }

    .p-3 { padding: 0.75rem; }
    .p-6 { padding: 1.5rem; }

    .shadow-lg {
      box-shadow: 0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1);
    }
  `]
})
export class LoginPage {
  email = '';
  password = '';
  loading = false;

  // Quick login test users (matching database seed)
  testUsers = [
    { email: 'customer1@test.com', password: 'Admin@123', name: 'Maria Santos', role: 'Customer', initials: 'MS' },
    { email: 'customer2@test.com', password: 'Admin@123', name: 'Juan Dela Cruz', role: 'Customer', initials: 'JD' },
    { email: 'collector1@test.com', password: 'Admin@123', name: 'Pedro Reyes', role: 'Collector', initials: 'PR' },
    { email: 'collector2@test.com', password: 'Admin@123', name: 'Ana Garcia', role: 'Collector', initials: 'AG' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    public themeService: ThemeService
  ) {
    addIcons({
      'cash-outline': cashOutline,
      'person-outline': personOutline,
      'lock-closed-outline': lockClosedOutline,
      'log-in-outline': logInOutline,
      'moon-outline': moonOutline,
      'sunny-outline': sunnyOutline
    });
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  async onSubmit() {
    if (!this.email || !this.password) {
      return;
    }

    this.loading = true;
    try {
      const response = await this.authService.login(this.email, this.password).toPromise();
      console.log('Login response:', response);
      
      const user = this.authService.currentUser();
      console.log('Current user after login:', user);
      console.log('User role:', user?.role);
      
      // Navigate based on role (case-insensitive comparison)
      const role = user?.role?.toLowerCase();
      if (role === 'collector') {
        console.log('Navigating to collector route...');
        await this.router.navigate(['/collector/route']);
      } else {
        console.log('Navigating to customer dashboard...');
        await this.router.navigate(['/customer/dashboard']);
      }
    } catch (error) {
      console.error('Login error:', error);
      alert('Login failed. Please check your credentials.');
    } finally {
      this.loading = false;
    }
  }

  quickLogin(user: any) {
    this.email = user.email;
    this.password = user.password;
    this.onSubmit();
  }
}
