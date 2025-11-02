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
import { cashOutline, personOutline, lockClosedOutline, logInOutline, moonOutline, sunnyOutline, arrowForwardOutline, briefcaseOutline } from 'ionicons/icons';
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
    IonButton,
    IonIcon,
    IonSpinner,
    IonButtons
  ],
  template: `
    <ion-header class="ion-no-border">
      <ion-toolbar>
        <ion-title class="text-center font-bold">
          <div class="flex items-center justify-center gap-2">
            <ion-icon name="cash-outline" class="text-2xl"></ion-icon>
            <span>LoanFlow</span>
          </div>
        </ion-title>
        <ion-buttons slot="end">
          <ion-button (click)="toggleTheme()" class="theme-toggle">
            <ion-icon 
              [name]="themeService.isDark() ? 'sunny-outline' : 'moon-outline'" 
              slot="icon-only"
            ></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-toolbar>
    </ion-header>

    <ion-content class="login-content">
      <div class="login-container">
        
        <!-- Hero Section -->
        <div class="hero-section">
          <div class="logo-circle">
            <ion-icon name="cash-outline" class="logo-icon"></ion-icon>
          </div>
          <h1 class="welcome-title">Welcome Back</h1>
          <p class="welcome-subtitle">Sign in to manage your loans</p>
        </div>

        <!-- Login Form Card -->
        <ion-card class="login-card">
          <ion-card-content class="card-content">
            
            <!-- Login Type Toggle -->
            <div class="login-type-toggle">
              <button 
                type="button"
                class="toggle-btn"
                [class.active]="!loginAsEmployee"
                (click)="loginAsEmployee = false"
              >
                <ion-icon name="person-outline"></ion-icon>
                Customer
              </button>
              <button 
                type="button"
                class="toggle-btn"
                [class.active]="loginAsEmployee"
                (click)="loginAsEmployee = true"
              >
                <ion-icon name="briefcase-outline"></ion-icon>
                Employee
              </button>
            </div>

            <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
              
              <!-- Email Input -->
              <div class="input-group">
                <label class="input-label">{{ loginAsEmployee ? 'Email' : 'Email or Phone' }}</label>
                <div class="input-wrapper">
                  <ion-icon name="person-outline" class="input-icon"></ion-icon>
                  <input
                    type="email"
                    class="custom-input"
                    placeholder="Enter your email"
                    [(ngModel)]="email"
                    name="email"
                    required
                    autocomplete="email"
                  />
                </div>
              </div>

              <!-- Password Input -->
              <div class="input-group">
                <label class="input-label">Password</label>
                <div class="input-wrapper">
                  <ion-icon name="lock-closed-outline" class="input-icon"></ion-icon>
                  <input
                    type="password"
                    class="custom-input"
                    placeholder="Enter your password"
                    [(ngModel)]="password"
                    name="password"
                    required
                    autocomplete="current-password"
                  />
                </div>
              </div>

              <!-- Login Button -->
              <ion-button
                type="submit"
                expand="block"
                [disabled]="loading || !loginForm.valid"
                class="login-button"
                size="large"
              >
                <ion-spinner name="crescent" *ngIf="loading" class="button-spinner"></ion-spinner>
                <ion-icon name="log-in-outline" slot="start" *ngIf="!loading"></ion-icon>
                {{ loading ? 'Signing in...' : 'Sign In' }}
              </ion-button>

            </form>
          </ion-card-content>
        </ion-card>

        <!-- Divider -->
        <div class="divider">
          <span class="divider-text">Quick Login (Dev Only)</span>
        </div>

        <!-- Quick Login Cards -->
        <div class="quick-login-grid">
          <!-- Customer Quick Logins -->
          <div 
            class="quick-login-card customer-card"
            (click)="quickLogin(testUsers[0])"
          >
            <div class="quick-card-content">
              <div class="user-avatar customer-avatar">
                <span class="avatar-text">{{ testUsers[0].initials }}</span>
              </div>
              <div class="user-info">
                <p class="user-name">{{ testUsers[0].name }}</p>
                <p class="user-role">{{ testUsers[0].role }}</p>
              </div>
              <ion-icon name="arrow-forward-outline" class="card-arrow"></ion-icon>
            </div>
          </div>

          <div 
            class="quick-login-card customer-card"
            (click)="quickLogin(testUsers[1])"
          >
            <div class="quick-card-content">
              <div class="user-avatar customer-avatar">
                <span class="avatar-text">{{ testUsers[1].initials }}</span>
              </div>
              <div class="user-info">
                <p class="user-name">{{ testUsers[1].name }}</p>
                <p class="user-role">{{ testUsers[1].role }}</p>
              </div>
              <ion-icon name="arrow-forward-outline" class="card-arrow"></ion-icon>
            </div>
          </div>

          <!-- Employee Quick Logins -->
          <div 
            class="quick-login-card employee-card"
            (click)="quickLogin(testUsers[2])"
          >
            <div class="quick-card-content">
              <div class="user-avatar employee-avatar">
                <span class="avatar-text">{{ testUsers[2].initials }}</span>
              </div>
              <div class="user-info">
                <p class="user-name">{{ testUsers[2].name }}</p>
                <p class="user-role">{{ testUsers[2].role }}</p>
              </div>
              <ion-icon name="arrow-forward-outline" class="card-arrow"></ion-icon>
            </div>
          </div>

          <div 
            class="quick-login-card employee-card"
            (click)="quickLogin(testUsers[3])"
          >
            <div class="quick-card-content">
              <div class="user-avatar employee-avatar">
                <span class="avatar-text">{{ testUsers[3].initials }}</span>
              </div>
              <div class="user-info">
                <p class="user-name">{{ testUsers[3].name }}</p>
                <p class="user-role">{{ testUsers[3].role }}</p>
              </div>
              <ion-icon name="arrow-forward-outline" class="card-arrow"></ion-icon>
            </div>
          </div>
        </div>

        <!-- Footer -->
        <div class="login-footer">
          <p class="footer-text">© 2025 LoanFlow. All rights reserved.</p>
        </div>

      </div>
    </ion-content>
  `,
  styles: [`
    /* Main Content - Exact match from web: bg-gradient-to-br from-gray-50 via-blue-50 to-purple-50 */
    .login-content {
      --background: linear-gradient(to bottom right,
                    #f9fafb 0%,
                    #eff6ff 50%,
                    #faf5ff 100%);
    }

    /* Dark mode - Exact match from web: dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 */
    @media (prefers-color-scheme: dark) {
      .login-content {
        --background: linear-gradient(to bottom right,
                      #111827 0%,
                      #1f2937 50%,
                      #111827 100%);
      }
    }

    /* Wrapper for pseudo elements */
    ion-content::part(scroll) {
      position: relative;
      overflow: hidden;
    }

    /* Blue circle top-left - matching web exactly */
    .login-container::before {
      content: '';
      position: absolute;
      top: -6rem;
      left: -6rem;
      width: 24rem;
      height: 24rem;
      background: rgba(59, 130, 246, 0.1);
      border-radius: 9999px;
      filter: blur(80px);
      pointer-events: none;
    }

    /* Purple circle bottom-right - matching web exactly */
    .login-container::after {
      content: '';
      position: absolute;
      bottom: -6rem;
      right: -6rem;
      width: 24rem;
      height: 24rem;
      background: rgba(168, 85, 247, 0.1);
      border-radius: 9999px;
      filter: blur(80px);
      pointer-events: none;
    }

    /* Pink/rose circle center - matching web exactly */
    .hero-section::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 50%;
      transform: translate(-50%, -50%);
      width: 24rem;
      height: 24rem;
      background: rgba(236, 72, 153, 0.05);
      border-radius: 9999px;
      filter: blur(80px);
      pointer-events: none;
      z-index: -1;
    }

    .login-container {
      max-width: 480px;
      margin: 0 auto;
      padding: 2rem 1rem;
      min-height: 100%;
      display: flex;
      flex-direction: column;
      position: relative;
      z-index: 1;
      overflow: hidden;
    }

    /* Header Styles */
    ion-toolbar {
      --background: transparent;
      --border-style: none;
    }

    .theme-toggle {
      --background-hover: rgba(255, 255, 255, 0.1);
      --border-radius: 50%;
    }

    /* Hero Section */
    .hero-section {
      text-align: center;
      margin-bottom: 2rem;
      padding-top: 1rem;
      position: relative;
    }

    .logo-circle {
      width: 100px;
      height: 100px;
      background: linear-gradient(135deg, var(--ion-color-primary), var(--ion-color-secondary));
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.2);
      animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }

    .logo-icon {
      font-size: 3.5rem;
      color: white;
    }

    .welcome-title {
      font-size: 2rem;
      font-weight: 700;
      color: var(--ion-text-color);
      margin-bottom: 0.5rem;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
    }

    .welcome-subtitle {
      font-size: 1rem;
      color: var(--ion-color-medium);
      font-weight: 500;
    }

    /* Login Card */
    .login-card {
      margin: 0;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
      border-radius: 20px;
      overflow: hidden;
      background: var(--ion-card-background);
    }

    .card-content {
      padding: 2rem !important;
    }

    /* Login Type Toggle */
    .login-type-toggle {
      display: flex;
      gap: 0.5rem;
      margin-bottom: 2rem;
      padding: 0.25rem;
      background: var(--ion-color-light);
      border-radius: 12px;
    }

    .toggle-btn {
      flex: 1;
      padding: 0.75rem 1rem;
      border: none;
      background: transparent;
      color: var(--ion-color-medium);
      font-size: 0.9rem;
      font-weight: 600;
      border-radius: 10px;
      cursor: pointer;
      transition: all 0.3s ease;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .toggle-btn ion-icon {
      font-size: 1.2rem;
    }

    .toggle-btn.active {
      background: var(--ion-color-primary);
      color: white;
      box-shadow: 0 2px 8px rgba(56, 128, 255, 0.3);
    }

    .toggle-btn:not(.active):hover {
      background: rgba(var(--ion-color-primary-rgb), 0.1);
    }

    /* Form Inputs */
    .input-group {
      margin-bottom: 1.5rem;
    }

    .input-label {
      display: block;
      font-size: 0.875rem;
      font-weight: 600;
      color: var(--ion-text-color);
      margin-bottom: 0.5rem;
      opacity: 0.9;
    }

    .input-wrapper {
      position: relative;
      display: flex;
      align-items: center;
    }

    .input-icon {
      position: absolute;
      left: 1rem;
      font-size: 1.25rem;
      color: var(--ion-color-medium);
      z-index: 2;
    }

    .custom-input {
      width: 100%;
      padding: 1rem 1rem 1rem 3rem;
      font-size: 1rem;
      border: 2px solid var(--ion-border-color, #e5e7eb);
      border-radius: 12px;
      background: var(--ion-item-background);
      color: var(--ion-text-color);
      transition: all 0.3s ease;
      font-family: inherit;
    }

    .custom-input:focus {
      outline: none;
      border-color: var(--ion-color-primary);
      box-shadow: 0 0 0 3px rgba(56, 128, 255, 0.1);
    }

    .custom-input::placeholder {
      color: var(--ion-color-medium);
      opacity: 0.7;
    }

    /* Login Button */
    .login-button {
      margin-top: 1rem;
      --border-radius: 12px;
      --box-shadow: 0 4px 12px rgba(56, 128, 255, 0.3);
      font-weight: 600;
      font-size: 1rem;
      height: 56px;
      text-transform: none;
    }

    .button-spinner {
      margin-right: 0.5rem;
    }

    /* Divider */
    .divider {
      text-align: center;
      margin: 2rem 0 1.5rem;
      position: relative;
    }

    .divider::before {
      content: '';
      position: absolute;
      top: 50%;
      left: 0;
      right: 0;
      height: 1px;
      background: var(--ion-border-color, #e5e7eb);
    }

    .divider-text {
      position: relative;
      background: var(--ion-background-color);
      padding: 0 1rem;
      font-size: 0.875rem;
      color: var(--ion-color-medium);
      font-weight: 500;
    }

    /* Quick Login Grid */
    .quick-login-grid {
      display: grid;
      grid-template-columns: 1fr;
      gap: 0.75rem;
      margin-bottom: 2rem;
    }

    .quick-login-card {
      background: var(--ion-card-background);
      border-radius: 12px;
      padding: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
      border: 2px solid transparent;
    }

    .quick-login-card:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(0, 0, 0, 0.1);
    }

    .quick-login-card:active {
      transform: translateY(0);
    }

    .customer-card {
      border-color: var(--ion-color-success);
      background: rgba(45, 211, 111, 0.05);
    }

    .customer-card:hover {
      background: rgba(45, 211, 111, 0.1);
    }

    .employee-card {
      border-color: var(--ion-color-primary);
      background: rgba(56, 128, 255, 0.05);
    }

    .employee-card:hover {
      background: rgba(56, 128, 255, 0.1);
    }

    .quick-card-content {
      display: flex;
      align-items: center;
      gap: 1rem;
    }

    .user-avatar {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .customer-avatar {
      background: linear-gradient(135deg, #2dd36f, #1ab759);
    }

    .employee-avatar {
      background: linear-gradient(135deg, #3880ff, #2563eb);
    }

    .avatar-text {
      color: white;
      font-weight: 700;
      font-size: 1rem;
    }

    .user-info {
      flex: 1;
      text-align: left;
    }

    .user-name {
      font-size: 0.95rem;
      font-weight: 600;
      color: var(--ion-text-color);
      margin: 0 0 0.25rem 0;
    }

    .user-role {
      font-size: 0.8rem;
      color: var(--ion-color-medium);
      margin: 0;
    }

    .card-arrow {
      font-size: 1.25rem;
      color: var(--ion-color-medium);
      opacity: 0.5;
      transition: all 0.3s ease;
    }

    .quick-login-card:hover .card-arrow {
      opacity: 1;
      transform: translateX(4px);
    }

    /* Footer */
    .login-footer {
      text-align: center;
      padding: 1.5rem 0;
      margin-top: auto;
    }

    .footer-text {
      font-size: 0.8rem;
      color: var(--ion-color-medium);
      margin: 0;
    }

    /* Utility Classes */
    .flex { display: flex; }
    .items-center { align-items: center; }
    .justify-center { justify-content: center; }
    .gap-2 { gap: 0.5rem; }
    .text-center { text-align: center; }
    .text-2xl { font-size: 1.5rem; }
    .font-bold { font-weight: 700; }

    /* Dark Mode Adjustments */
    body.dark .login-content,
    .dark .login-content {
      --background: linear-gradient(135deg, 
        rgba(66, 140, 255, 0.15) 0%, 
        rgba(80, 200, 255, 0.15) 100%),
        var(--ion-background-color);
    }

    body.dark .custom-input,
    .dark .custom-input {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.1);
    }

    body.dark .custom-input:focus,
    .dark .custom-input:focus {
      border-color: var(--ion-color-primary);
      background: rgba(255, 255, 255, 0.08);
    }

    body.dark .divider::before,
    .dark .divider::before {
      background: rgba(255, 255, 255, 0.1);
    }

    body.dark .quick-login-card,
    .dark .quick-login-card {
      background: rgba(255, 255, 255, 0.03);
    }

    body.dark .customer-card,
    .dark .customer-card {
      background: rgba(45, 211, 111, 0.08);
    }

    body.dark .customer-card:hover,
    .dark .customer-card:hover {
      background: rgba(45, 211, 111, 0.15);
    }

    body.dark .employee-card,
    .dark .employee-card {
      background: rgba(66, 140, 255, 0.08);
    }

    body.dark .employee-card:hover,
    .dark .employee-card:hover {
      background: rgba(66, 140, 255, 0.15);
    }
  `]
})
export class LoginPage {
  email = '';
  password = '';
  loading = false;
  loginAsEmployee = false; // Toggle: false = Customer, true = Employee

  // Quick login test users (matching database seed)
  testUsers = [
    { email: 'customer1@acme.com', password: 'Admin@123', name: 'Maria Santos', role: 'Customer (ACME)', initials: 'MS' },
    { email: 'customer1@techstart.com', password: 'Admin@123', name: 'Juan Dela Cruz', role: 'Customer (TechStart)', initials: 'JD' },
    { email: 'employee1@acme.com', password: 'Admin@123', name: 'Employee 1', role: 'Employee (ACME)', initials: 'E1' },
    { email: 'employee1@techstart.com', password: 'Admin@123', name: 'Employee 1', role: 'Employee (TechStart)', initials: 'E1' }
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
      'sunny-outline': sunnyOutline,
      'arrow-forward-outline': arrowForwardOutline,
      'briefcase-outline': briefcaseOutline
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
      // Use appropriate login method based on toggle
      const response = this.loginAsEmployee 
        ? await this.authService.loginAsStaff(this.email, this.password).toPromise()
        : await this.authService.loginAsCustomer(this.email, this.password).toPromise();
      
      console.log('Login response:', response);
      
      const user = this.authService.currentUser();
      console.log('Current user:', user);
      console.log('User role:', user?.role);
      const role = user?.role?.toLowerCase();
      
      // Navigate based on role
      if (role === 'collector' || role === 'employee') {
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
