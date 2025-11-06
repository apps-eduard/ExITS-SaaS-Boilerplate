import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonCard,
  IonCardContent,
  IonButton,
  IonSpinner,
  ToastController,
  AlertController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { cashOutline, personOutline, lockClosedOutline, logInOutline, moonOutline, sunnyOutline, arrowForwardOutline, briefcaseOutline, eyeOutline, eyeOffOutline } from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { ThemeService } from '../../core/services/theme.service';
import { HeaderUtilsComponent } from '../../shared/components/header-utils.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    RouterLink,
    IonContent,
    IonCard,
    IonCardContent,
    IonButton,
    IonSpinner,
    HeaderUtilsComponent
  ],
  template: `
    <ion-content class="login-content">
      <!-- Floating Theme Toggle and Dev Info -->
      <div class="floating-dev-info">
        <app-header-utils />
      </div>
      
      <div class="login-container">
        <!-- Hero Section -->
        <div class="hero-section">
          <div class="logo-circle">
            <span class="logo-emoji">💵</span>
          </div>
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
                <span class="toggle-emoji">👤</span>
                Customer
              </button>
              <button 
                type="button"
                class="toggle-btn"
                [class.active]="loginAsEmployee"
                (click)="loginAsEmployee = true"
              >
                <span class="toggle-emoji">💼</span>
                Employee
              </button>
            </div>

            <form (ngSubmit)="onSubmit()" #loginForm="ngForm">
              <!-- Email Input -->
              <div class="input-group">
                <label class="input-label">{{ loginAsEmployee ? 'Email' : 'Email or Phone' }}</label>
                <div class="input-wrapper">
                  <span class="input-emoji">👤</span>
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
                  <span class="input-emoji">🔒</span>
                  <input
                    [type]="showPassword ? 'text' : 'password'"
                    class="custom-input"
                    placeholder="••••••••"
                    [(ngModel)]="password"
                    name="password"
                    required
                    autocomplete="current-password"
                  />
                  <button
                    type="button"
                    class="password-toggle"
                    (click)="showPassword = !showPassword"
                  >
                    <span class="toggle-eye-emoji">{{ showPassword ? '👁️' : '👁️‍🗨️' }}</span>
                  </button>
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
                <span *ngIf="!loading" class="button-emoji">🚀</span>
                {{ loading ? 'Signing in...' : 'Sign In' }}
              </ion-button>

            </form>

            <!-- Register Link -->
            <div class="register-link">
              <span class="link-text">Don't have an account? </span>
              <a [routerLink]="['/register']" class="link-action">Sign Up</a>
            </div>

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
              <span class="card-emoji">→</span>
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
              <span class="card-emoji">→</span>
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
              <span class="card-emoji">→</span>
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
              <span class="card-emoji">→</span>
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
    /* ===== FLOATING BUTTONS ===== */
    .floating-theme-btn {
      position: fixed;
      top: 16px;
      right: 16px;
      z-index: 1000;
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: rgba(255, 255, 255, 0.95);
      border: none;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.15);
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
      backdrop-filter: blur(10px);
    }

    .floating-theme-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }

    .floating-theme-btn:active {
      transform: scale(0.95);
    }

    @media (prefers-color-scheme: dark) {
      .floating-theme-btn {
        background: rgba(30, 30, 30, 0.95);
      }
    }

    .floating-dev-info {
      position: fixed;
      top: 16px;
      left: 16px;
      z-index: 1000;
    }

    .theme-emoji {
      font-size: 1.5rem;
      display: inline-flex;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));
    }

    /* ===== GRADIENT BACKGROUND ===== */
    .login-content {
      --background: linear-gradient(165deg,
                    rgba(var(--ion-color-primary-rgb), 0.16) 0%,
                    rgba(var(--ion-color-secondary-rgb), 0.12) 40%,
                    var(--ion-background-color) 100%);
    }

    @media (prefers-color-scheme: dark) {
      .login-content {
        --background: linear-gradient(165deg,
                      rgba(var(--ion-color-primary-rgb), 0.35) 0%,
                      rgba(var(--ion-color-secondary-rgb), 0.28) 35%,
                      var(--ion-background-color) 100%);
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
      background: rgba(var(--ion-color-primary-rgb), 0.18);
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
      background: rgba(var(--ion-color-tertiary-rgb), 0.18);
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
      background: rgba(var(--ion-color-secondary-rgb), 0.12);
      border-radius: 9999px;
      filter: blur(80px);
      pointer-events: none;
      z-index: -1;
    }

    .login-container {
      max-width: 480px;
      margin: 0 auto;
      padding: 1rem .5rem;
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
      background: linear-gradient(135deg, #667eea, #764ba2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1.5rem;
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
      animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-10px); }
    }

    .logo-emoji {
      font-size: 3.5rem;
      filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
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
      padding: 0.35rem;
      background: rgba(148, 163, 184, 0.12);
      border-radius: 14px;
    }

    .toggle-btn {
      flex: 1;
      padding: 0.85rem 1rem;
      border: none;
      background: transparent;
      color: var(--ion-color-medium);
      font-size: 0.95rem;
      font-weight: 600;
      border-radius: 11px;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
    }

    .toggle-emoji {
      font-size: 1.25rem;
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.1));
    }

    .toggle-btn.active {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      box-shadow: 0 4px 12px rgba(102, 126, 234, 0.35);
      transform: translateY(-1px);
    }

    .toggle-btn:not(.active):hover {
      background: rgba(102, 126, 234, 0.08);
      transform: translateY(-1px);
    }

    .toggle-btn:active {
      transform: translateY(0);
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

    .input-emoji {
      position: absolute;
      left: 1rem;
      font-size: 1.25rem;
      z-index: 2;
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.08));
    }

    .custom-input {
      width: 100%;
      padding: 0.85rem 0.85rem 0.85rem 3rem;
      font-size: 1rem;
      border: 2px solid rgba(148, 163, 184, 0.2);
      border-radius: 12px;
      background: var(--ion-item-background);
      color: var(--ion-text-color);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-family: inherit;
    }

    .custom-input:focus {
      outline: none;
      border-color: #667eea;
      box-shadow: 0 0 0 4px rgba(102, 126, 234, 0.12);
      transform: translateY(-1px);
    }

    .custom-input::placeholder {
      color: var(--ion-color-medium);
      opacity: 0.7;
    }

    /* Password Toggle Button */
    .password-toggle {
      position: absolute;
      right: 1rem;
      background: transparent;
      border: none;
      cursor: pointer;
      padding: 0.5rem;
      display: flex;
      align-items: center;
      justify-content: center;
      z-index: 2;
      transition: all 0.3s ease;
    }

    .toggle-eye-emoji {
      font-size: 1.25rem;
      filter: grayscale(0.3);
      opacity: 0.7;
      transition: all 0.3s ease;
    }

    .password-toggle:hover .toggle-eye-emoji {
      opacity: 1;
      filter: grayscale(0);
      transform: scale(1.1);
    }

    .password-toggle:active .toggle-eye-emoji {
      transform: scale(0.95);
    }

    /* Login Button */
    .login-button {
      margin-top: 0.75rem;
      --border-radius: 12px;
      --background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      --background-hover: linear-gradient(135deg, #5568d3 0%, #6a4199 100%);
      --box-shadow: 0 6px 20px rgba(102, 126, 234, 0.35);
      font-weight: 600;
      font-size: 1rem;
      height: 56px;
      text-transform: none;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .login-button:hover {
      transform: translateY(-2px);
      --box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
    }

    .login-button:active {
      transform: translateY(0);
    }

    .button-spinner {
      margin-right: 0.5rem;
    }

    .button-emoji {
      font-size: 1.15rem;
      margin-right: 0.35rem;
      filter: drop-shadow(0 1px 2px rgba(0, 0, 0, 0.2));
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
      display: flex;
      gap: 0.75rem;
      margin-bottom: 2rem;
      overflow-x: auto;
      overflow-y: hidden;
      padding-bottom: 0.5rem;
      scroll-snap-type: x mandatory;
      -webkit-overflow-scrolling: touch;
    }

    .quick-login-grid::-webkit-scrollbar {
      height: 6px;
    }

    .quick-login-grid::-webkit-scrollbar-track {
      background: rgba(var(--ion-color-medium-rgb), 0.1);
      border-radius: 3px;
    }

    .quick-login-grid::-webkit-scrollbar-thumb {
      background: rgba(var(--ion-color-medium-rgb), 0.3);
      border-radius: 3px;
    }

    .quick-login-grid::-webkit-scrollbar-thumb:hover {
      background: rgba(var(--ion-color-medium-rgb), 0.5);
    }

    .quick-login-card {
      background: var(--ion-card-background);
      border-radius: 12px;
      padding: 1rem;
      cursor: pointer;
      transition: all 0.3s ease;
      border: 2px solid transparent;
      min-width: 280px;
      flex-shrink: 0;
      scroll-snap-align: start;
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

    .card-emoji {
      font-size: 1.5rem;
      opacity: 0.5;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .quick-login-card:hover .card-arrow {
      opacity: 1;
      transform: translateX(4px);
    }

    .quick-login-card:hover .card-emoji {
      opacity: 1;
      transform: translateX(4px);
    }

    /* Register Link */
    .register-link {
      text-align: center;
      margin-top: 1.5rem;
      padding-top: 1.5rem;
      border-top: 1px solid rgba(148, 163, 184, 0.2);
    }

    .link-text {
      color: var(--ion-color-medium);
      font-size: 0.9rem;
    }

    .link-action {
      color: #667eea;
      font-weight: 600;
      text-decoration: none;
      margin-left: 0.25rem;
      transition: all 0.3s ease;
      position: relative;
    }

    .link-action::after {
      content: '';
      position: absolute;
      width: 0;
      height: 2px;
      bottom: -2px;
      left: 0;
      background: linear-gradient(135deg, #667eea, #764ba2);
      transition: width 0.3s ease;
    }

    .link-action:hover {
      color: #764ba2;
    }

    .link-action:hover::after {
      width: 100%;
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
      --background: linear-gradient(170deg,
        rgba(var(--ion-color-primary-rgb), 0.32) 0%,
        rgba(var(--ion-color-secondary-rgb), 0.28) 35%,
        rgba(15, 23, 42, 0.85) 100%),
        var(--ion-background-color);
    }

    body.dark .login-type-toggle,
    .dark .login-type-toggle {
      background: rgba(148, 163, 184, 0.18);
    }

    body.dark .toggle-btn.active,
    .dark .toggle-btn.active {
      background: linear-gradient(135deg, #667eea, #764ba2);
    }

    body.dark .custom-input,
    .dark .custom-input {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.12);
    }

    body.dark .custom-input:focus,
    .dark .custom-input:focus {
      border-color: #667eea;
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
      background: rgba(var(--ion-color-success-rgb), 0.14);
    }

    body.dark .customer-card:hover,
    .dark .customer-card:hover {
      background: rgba(var(--ion-color-success-rgb), 0.22);
    }

    body.dark .employee-card,
    .dark .employee-card {
      background: rgba(var(--ion-color-primary-rgb), 0.16);
    }

    body.dark .employee-card:hover,
    .dark .employee-card:hover {
      background: rgba(var(--ion-color-primary-rgb), 0.24);
    }
  `]
})
export class LoginPage {
  email = '';
  password = '';
  loading = false;
  loginAsEmployee = false; // Toggle: false = Customer, true = Employee
  showPassword = false; // Toggle password visibility

  // Quick login test users (matching database seed)
  testUsers = [
    { email: 'customer1@acme.com', password: 'Admin@123', name: 'Maria Santos', role: 'Customer (ACME)', initials: 'MS' },
    { email: 'customer1@techstart.com', password: 'Admin@123', name: 'Juan Dela Cruz', role: 'Customer (TechStart)', initials: 'JD' },
    { email: 'employee1@acme.com', password: 'Admin@123', name: 'Employee1 ACME', role: 'Loan Officer', initials: 'E1' },
    { email: 'employee1@techstart.com', password: 'Admin@123', name: 'Employee1 TechStart', role: 'Loan Officer', initials: 'E1' }
  ];

  constructor(
    private authService: AuthService,
    private router: Router,
    public themeService: ThemeService,
    private alertController: AlertController
  ) {
    addIcons({
      'cash-outline': cashOutline,
      'person-outline': personOutline,
      'lock-closed-outline': lockClosedOutline,
      'log-in-outline': logInOutline,
      'moon-outline': moonOutline,
      'sunny-outline': sunnyOutline,
      'arrow-forward-outline': arrowForwardOutline,
      'briefcase-outline': briefcaseOutline,
      'eye-outline': eyeOutline,
      'eye-off-outline': eyeOffOutline
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
      
      // console.log('Login response:', response);
      
      const user = this.authService.currentUser();
      console.log('Current user:', user);
      console.log('User role:', user?.role);
      const role = user?.role?.toLowerCase();
      
      // Check if customer profile is incomplete
      if (role === 'customer') {
        // Check profileComplete from the user object directly
        const profileComplete = user?.profileComplete;
        
        console.log('Profile complete check:', {
          user,
          profileComplete,
          shouldRedirect: profileComplete === false
        });
        
        if (profileComplete === false) {
          console.log('Profile incomplete, redirecting to profile page...');
          // Navigate to profile completion page
          await this.router.navigate(['/customer/profile']);
          
          // Show alert after navigation
          setTimeout(async () => {
            const alert = await this.alertController.create({
              header: '⚠️ Complete Your Profile',
              message: 'Your name and phone number are required. Please update them to continue.',
              buttons: ['OK']
            });
            await alert.present();
          }, 500);
          return;
        }
      }
      
      // Navigate based on role
      if (role === 'collector' || role === 'employee') {
        console.log('Navigating to collector dashboard...');
        await this.router.navigate(['/collector/dashboard']);
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
    // Auto-detect if employee/collector based on role or email
    this.loginAsEmployee = user.role?.toLowerCase().includes('employee') || 
                          user.role?.toLowerCase().includes('loan officer') ||
                          user.role?.toLowerCase().includes('specialist') ||
                          user.email.includes('employee');
    this.onSubmit();
  }
}
