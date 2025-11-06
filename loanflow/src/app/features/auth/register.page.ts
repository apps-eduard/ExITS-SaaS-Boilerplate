import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import {
  IonContent,
  IonCard,
  IonCardContent,
  IonButton,
  IonSpinner,
  IonIcon,
  IonSelect,
  IonSelectOption,
  ToastController
} from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { 
  mailOutline, 
  lockClosedOutline, 
  eyeOutline, 
  eyeOffOutline,
  arrowBackOutline,
  businessOutline,
  logoGoogle
} from 'ionicons/icons';
import { AuthService } from '../../core/services/auth.service';
import { TenantService, Tenant } from '../../core/services/tenant.service';
import { ThemeService } from '../../core/services/theme.service';
import { HeaderUtilsComponent } from '../../shared/components/header-utils.component';

@Component({
  selector: 'app-register',
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
    IonIcon,
    IonSelect,
    IonSelectOption,
    HeaderUtilsComponent
  ],
  template: `
    <ion-content class="register-content">
      <!-- Floating Back Button -->
      <button class="floating-back-btn" [routerLink]="['/login']">
        <span class="back-emoji">←</span>
      </button>
      
      <!-- Floating Theme Toggle and Dev Info -->
      <div class="floating-dev-info">
        <app-header-utils />
      </div>
      
      <div class="register-container">
        <!-- Hero Section -->
        <div class="hero-section">
          <div class="logo-circle">
            <span class="logo-emoji">🎉</span>
          </div>
          <h1 class="welcome-title">Create Account</h1>
          <p class="welcome-subtitle">Join LoanFlow today - complete your profile after registration</p>
        </div>

        <!-- Registration Form Card -->
        <ion-card class="register-card">
          <ion-card-content class="card-content">
            <form (ngSubmit)="onSubmit()" #registerForm="ngForm">
              
              <!-- Tenant Selection -->
              <div class="input-group">
                <label class="input-label">Select Tenant</label>
                <div class="input-wrapper">
                  <span class="input-emoji">🏢</span>
                  <ion-select
                    [(ngModel)]="formData.tenant"
                    name="tenant"
                    placeholder="Select Tenant"
                    interface="popover"
                    class="custom-select"
                    [disabled]="loadingTenants"
                  >
                    <ion-select-option 
                      *ngFor="let tenant of tenants" 
                      [value]="tenant.name"
                    >
                      {{ tenant.name }}
                    </ion-select-option>
                  </ion-select>
                </div>
                <div class="input-hint" *ngIf="loadingTenants">
                  <ion-spinner name="dots" style="width: 14px; height: 14px;"></ion-spinner>
                  <span class="hint-text">Loading tenants...</span>
                </div>
                <div class="input-hint" *ngIf="!loadingTenants && tenants.length === 0">
                  <span class="hint-emoji">⚠️</span>
                  <span class="hint-text">No active tenants available</span>
                </div>
              </div>

              <!-- Email Input -->
              <div class="input-group">
                <label class="input-label">Email Address</label>
                <div class="input-wrapper">
                  <span class="input-emoji">📧</span>
                  <input
                    type="email"
                    class="custom-input"
                    [class.input-error]="emailError"
                    placeholder="you@example.com"
                    [(ngModel)]="formData.email"
                    name="email"
                    required
                    autocomplete="email"
                    (blur)="checkEmailAvailability()"
                  />
                  <ion-spinner 
                    *ngIf="checkingEmail" 
                    name="dots" 
                    style="width: 20px; height: 20px; position: absolute; right: 1rem;"
                  ></ion-spinner>
                </div>
                <div class="error-message" *ngIf="emailError">
                  <span class="error-emoji">❌</span>
                  <span class="error-text">{{ emailError }}</span>
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
                    placeholder="Minimum 8 characters"
                    [(ngModel)]="formData.password"
                    name="password"
                    required
                    minlength="8"
                    autocomplete="new-password"
                  />
                  <button
                    type="button"
                    class="password-toggle"
                    (click)="showPassword = !showPassword"
                  >
                    <span class="toggle-eye-emoji">{{ showPassword ? '👁️' : '👁️‍🗨️' }}</span>
                  </button>
                </div>
                <div class="input-hint">
                  <span class="hint-emoji">💡</span>
                  <span class="hint-text">Use at least 8 characters with letters and numbers</span>
                </div>
              </div>

              <!-- Confirm Password Input -->
              <div class="input-group">
                <label class="input-label">Confirm Password</label>
                <div class="input-wrapper">
                  <span class="input-emoji">🔐</span>
                  <input
                    [type]="showConfirmPassword ? 'text' : 'password'"
                    class="custom-input"
                    placeholder="Re-enter your password"
                    [(ngModel)]="formData.confirmPassword"
                    name="confirmPassword"
                    required
                    autocomplete="new-password"
                  />
                  <button
                    type="button"
                    class="password-toggle"
                    (click)="showConfirmPassword = !showConfirmPassword"
                  >
                    <span class="toggle-eye-emoji">{{ showConfirmPassword ? '👁️' : '👁️‍🗨️' }}</span>
                  </button>
                </div>
                @if (formData.confirmPassword && formData.password !== formData.confirmPassword) {
                  <div class="error-message">
                    <span class="error-emoji">⚠️</span>
                    <span class="error-text">Passwords do not match</span>
                  </div>
                }
              </div>

              <!-- Register Button -->
              <ion-button
                type="submit"
                expand="block"
                [disabled]="loading || !registerForm.valid || formData.password !== formData.confirmPassword"
                class="register-button"
                size="large"
              >
                <ion-spinner name="crescent" *ngIf="loading" class="button-spinner"></ion-spinner>
                <span *ngIf="!loading" class="button-emoji">🚀</span>
                {{ loading ? 'Creating Account...' : 'Create Account' }}
              </ion-button>

            </form>

            <!-- Divider -->
            <div class="divider">
              <span class="divider-text">or continue with</span>
            </div>

            <!-- Google Sign-In Button -->
            <button 
              type="button"
              class="google-btn"
              (click)="signInWithGoogle()"
              [disabled]="loading"
            >
              <span class="google-icon">
                <ion-icon name="logo-google"></ion-icon>
              </span>
              <span class="google-text">Sign up with Google</span>
            </button>

            <!-- Login Link -->
            <div class="login-link">
              <span class="link-text">Already have an account? </span>
              <a [routerLink]="['/login']" class="link-action">Sign In</a>
            </div>

          </ion-card-content>
        </ion-card>

        <!-- Footer -->
        <div class="register-footer">
          <p class="footer-text">
            By signing up, you agree to our 
            <a href="#" class="footer-link">Terms of Service</a> and 
            <a href="#" class="footer-link">Privacy Policy</a>
          </p>
        </div>

      </div>
    </ion-content>
  `,
  styles: [`
    /* ===== FLOATING BUTTONS ===== */
    .floating-back-btn {
      position: fixed;
      top: 16px;
      left: 80px;
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

    .floating-back-btn:hover {
      transform: scale(1.1);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }

    .floating-back-btn:active {
      transform: scale(0.95);
    }

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
      .floating-back-btn,
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

    .back-emoji,
    .theme-emoji {
      font-size: 1.5rem;
      display: inline-flex;
      filter: drop-shadow(0 2px 4px rgba(0, 0, 0, 0.15));
    }

    /* ===== GRADIENT BACKGROUND ===== */
    .register-content {
      --background: linear-gradient(165deg,
                    rgba(var(--ion-color-primary-rgb), 0.16) 0%,
                    rgba(var(--ion-color-secondary-rgb), 0.12) 40%,
                    var(--ion-background-color) 100%);
    }

    .register-container {
      max-width: 480px;
      margin: 0 auto;
      padding: 1rem 1rem 2rem;
      min-height: 100%;
      display: flex;
      flex-direction: column;
      position: relative;
      z-index: 1;
    }

    /* Decorative blobs */
    .register-container::before {
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

    .register-container::after {
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

    /* Hero Section */
    .hero-section {
      text-align: center;
      margin-bottom: 1.5rem;
      padding-top: 1rem;
      position: relative;
    }

    .logo-circle {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin: 0 auto 1rem;
      box-shadow: 0 10px 30px rgba(102, 126, 234, 0.3);
      animation: float 3s ease-in-out infinite;
    }

    @keyframes float {
      0%, 100% { transform: translateY(0px); }
      50% { transform: translateY(-8px); }
    }

    .logo-emoji {
      font-size: 2.5rem;
      filter: drop-shadow(0 4px 8px rgba(0, 0, 0, 0.2));
    }

    .welcome-title {
      font-size: 1.75rem;
      font-weight: 700;
      color: var(--ion-text-color);
      margin-bottom: 0.5rem;
      text-shadow: 0 2px 4px rgba(0, 0, 0, 0.05);
    }

    .welcome-subtitle {
      font-size: 0.9375rem;
      color: var(--ion-color-medium);
      font-weight: 500;
      margin: 0;
    }

    /* Register Card */
    .register-card {
      margin: 0;
      box-shadow: 0 10px 40px rgba(0, 0, 0, 0.15);
      border-radius: 20px;
      overflow: hidden;
      background: var(--ion-card-background);
    }

    .card-content {
      padding: 2rem !important;
    }

    /* Form Inputs */
    .input-group {
      margin-bottom: 1.25rem;
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

    .input-error {
      border-color: #ef4444 !important;
      background: rgba(239, 68, 68, 0.05);
    }

    .input-error:focus {
      border-color: #ef4444 !important;
      box-shadow: 0 0 0 4px rgba(239, 68, 68, 0.12);
    }

    /* Custom Select */
    .custom-select {
      width: 100%;
      padding: 0.875rem 1rem;
      padding-left: 2.75rem;
      border: 2px solid rgba(148, 163, 184, 0.2);
      border-radius: 12px;
      background: rgba(255, 255, 255, 0.9);
      font-size: 1rem;
      color: var(--ion-color-dark);
      transition: all 0.3s ease;
      --padding-start: 0;
      --padding-end: 0;
    }

    .custom-select::part(container) {
      border: none;
    }

    .custom-select::part(text) {
      color: var(--ion-color-dark);
    }

    .custom-select::part(placeholder) {
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

    /* Input Hints and Errors */
    .input-hint {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      margin-top: 0.5rem;
      font-size: 0.75rem;
      color: var(--ion-color-medium);
    }

    .hint-emoji {
      font-size: 0.875rem;
    }

    .hint-text {
      flex: 1;
    }

    .error-message {
      display: flex;
      align-items: center;
      gap: 0.375rem;
      margin-top: 0.5rem;
      font-size: 0.75rem;
      color: #ef4444;
      animation: shake 0.5s ease-in-out;
    }

    @keyframes shake {
      0%, 100% { transform: translateX(0); }
      10%, 30%, 50%, 70%, 90% { transform: translateX(-2px); }
      20%, 40%, 60%, 80% { transform: translateX(2px); }
    }

    .error-emoji {
      font-size: 0.875rem;
    }

    .error-text {
      flex: 1;
    }

    /* Register Button */
    .register-button {
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

    .register-button:hover:not(:disabled) {
      transform: translateY(-2px);
      --box-shadow: 0 8px 24px rgba(102, 126, 234, 0.4);
    }

    .register-button:active:not(:disabled) {
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
      margin: 1.5rem 0 1rem;
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
      background: var(--ion-card-background);
      padding: 0 1rem;
      font-size: 0.875rem;
      color: var(--ion-color-medium);
      font-weight: 500;
    }

    /* Google Sign-In Button */
    .google-btn {
      width: 100%;
      padding: 0.875rem 1rem;
      background: white;
      border: 2px solid rgba(148, 163, 184, 0.2);
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      cursor: pointer;
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      font-size: 1rem;
      font-weight: 600;
      color: #1f2937;
      font-family: inherit;
    }

    .google-btn:hover:not(:disabled) {
      border-color: #667eea;
      box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
      transform: translateY(-1px);
    }

    .google-btn:active:not(:disabled) {
      transform: translateY(0);
    }

    .google-btn:disabled {
      opacity: 0.5;
      cursor: not-allowed;
    }

    .google-icon {
      width: 20px;
      height: 20px;
      display: flex;
      align-items: center;
      justify-content: center;
    }

    .google-icon ion-icon {
      font-size: 20px;
      color: #4285f4;
    }

    .google-text {
      color: var(--ion-text-color);
    }

    /* Login Link */
    .login-link {
      text-align: center;
      margin-top: 1.5rem;
      font-size: 0.9375rem;
    }

    .link-text {
      color: var(--ion-color-medium);
    }

    .link-action {
      color: #667eea;
      font-weight: 600;
      text-decoration: none;
      transition: all 0.2s ease;
    }

    .link-action:hover {
      text-decoration: underline;
      color: #5568d3;
    }

    /* Footer */
    .register-footer {
      text-align: center;
      padding: 1.5rem 0;
      margin-top: auto;
    }

    .footer-text {
      font-size: 0.75rem;
      color: var(--ion-color-medium);
      margin: 0;
      line-height: 1.5;
    }

    .footer-link {
      color: #667eea;
      text-decoration: none;
      font-weight: 500;
    }

    .footer-link:hover {
      text-decoration: underline;
    }

    /* Dark Mode Adjustments */
    body.dark .google-btn,
    .dark .google-btn {
      background: rgba(255, 255, 255, 0.05);
      border-color: rgba(255, 255, 255, 0.12);
    }

    body.dark .google-btn:hover:not(:disabled),
    .dark .google-btn:hover:not(:disabled) {
      background: rgba(255, 255, 255, 0.08);
      border-color: #667eea;
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
  `]
})
export class RegisterPage {
  formData = {
    tenant: '', // Will be set to first tenant or ACME
    email: '',
    password: '',
    confirmPassword: ''
  };
  
  tenants: Tenant[] = [];
  loadingTenants = false;
  loading = false;
  checkingEmail = false;
  emailError = '';
  showPassword = false;
  showConfirmPassword = false;

  constructor(
    private authService: AuthService,
    private tenantService: TenantService,
    private router: Router,
    public themeService: ThemeService,
    private toastController: ToastController
  ) {
    addIcons({
      'mail-outline': mailOutline,
      'lock-closed-outline': lockClosedOutline,
      'business-outline': businessOutline,
      'eye-outline': eyeOutline,
      'eye-off-outline': eyeOffOutline,
      'arrow-back-outline': arrowBackOutline,
      'logo-google': logoGoogle
    });
    
    // Load tenants on initialization
    this.loadTenants();
  }

  async loadTenants() {
    this.loadingTenants = true;
    try {
      const response = await this.tenantService.getActiveTenants().toPromise();
      if (response?.success && response.data) {
        this.tenants = response.data;
        
        // Set default tenant to ACME if available, otherwise first tenant
        const acmeTenant = this.tenants.find(t => t.name.toUpperCase() === 'ACME');
        if (acmeTenant) {
          this.formData.tenant = acmeTenant.name;
        } else if (this.tenants.length > 0) {
          this.formData.tenant = this.tenants[0].name;
        }
      }
    } catch (error: any) {
      console.error('Error loading tenants:', error);
      await this.showToast('Failed to load tenants. Please try again.', 'warning');
    } finally {
      this.loadingTenants = false;
    }
  }

  toggleTheme() {
    this.themeService.toggleTheme();
  }

  async checkEmailAvailability() {
    // Reset error
    this.emailError = '';
    
    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!this.formData.email || !emailRegex.test(this.formData.email)) {
      return;
    }

    // Don't check if tenant not selected
    if (!this.formData.tenant) {
      this.emailError = 'Please select a tenant first';
      return;
    }

    this.checkingEmail = true;
    try {
      // Call API to check if email exists
      const response = await this.authService.checkEmailExists(
        this.formData.tenant,
        this.formData.email
      ).toPromise();

      if (response?.exists) {
        this.emailError = 'This email is already registered';
      }
    } catch (error: any) {
      console.error('Error checking email:', error);
      // Don't show error to user, just log it
    } finally {
      this.checkingEmail = false;
    }
  }

  async onSubmit() {
    // Check for email error before submitting
    if (this.emailError) {
      await this.showToast(this.emailError, 'warning');
      return;
    }

    if (this.formData.password !== this.formData.confirmPassword) {
      await this.showToast('Passwords do not match', 'warning');
      return;
    }

    if (this.formData.password.length < 8) {
      await this.showToast('Password must be at least 8 characters', 'warning');
      return;
    }

    this.loading = true;
    try {
      // Call register API with tenant, email and password
      const response = await this.authService.registerCustomer({
        tenant: this.formData.tenant,
        email: this.formData.email,
        password: this.formData.password
      }).toPromise();

      await this.showToast('🎉 Account created successfully! Please log in.', 'success');
      
      // Navigate to login page
      await this.router.navigate(['/login']);
    } catch (error: any) {
      console.error('Registration error:', error);
      const message = error?.error?.message || error?.message || 'Registration failed. Please try again.';
      await this.showToast(message, 'danger');
    } finally {
      this.loading = false;
    }
  }

  async signInWithGoogle() {
    this.loading = true;
    try {
      // TODO: Implement Google Sign-In
      await this.showToast('Google Sign-In coming soon!', 'warning');
      
      // Example implementation:
      // const response = await this.authService.signInWithGoogle().toPromise();
      // await this.router.navigate(['/customer/dashboard']);
    } catch (error: any) {
      console.error('Google Sign-In error:', error);
      await this.showToast('Google Sign-In failed', 'danger');
    } finally {
      this.loading = false;
    }
  }

  async showToast(message: string, color: string = 'primary') {
    const toast = await this.toastController.create({
      message,
      duration: 3000,
      position: 'bottom',
      color,
      cssClass: 'custom-toast'
    });
    await toast.present();
  }
}
