import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TenantService } from '../../core/services/tenant.service';
import { SubscriptionService, SubscriptionPlan } from '../../core/services/subscription.service';
import { UserService } from '../../core/services/user.service';
import { ToastService } from '../../core/services/toast.service';
import { debounceTime, Subject } from 'rxjs';

interface OnboardingStep {
  step: number;
  title: string;
  description: string;
  completed: boolean;
}

@Component({
  selector: 'app-signup',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, RouterLink],
  templateUrl: './signup.component.html',
  styleUrl: './signup.component.scss'
})
export class SignupComponent implements OnInit {
  readonly currentStep = signal(1);
  readonly loading = signal(false);
  readonly error = signal('');
  readonly success = signal(false);

  signupForm!: FormGroup;
  tenantForm!: FormGroup;

  readonly onboardingSteps: OnboardingStep[] = [
    { step: 1, title: 'Admin Account', description: 'Create your admin account', completed: false },
    { step: 2, title: 'Organization', description: 'Enter your organization details', completed: false },
    { step: 3, title: 'Choose Plan', description: 'Select your subscription plan', completed: false },
    { step: 4, title: 'Features', description: 'Customize your features', completed: false },
    { step: 5, title: 'Complete', description: 'Setup complete!', completed: false }
  ];

  readonly features = [
    { id: 'money-loan', name: 'Money Loan', icon: '💸', selected: true },
    { id: 'pawnshop', name: 'Pawnshop', icon: '💍', selected: false },
    { id: 'bnpl', name: 'BNPL', icon: '🛒', selected: false }
  ];

  // Subscription plans
  readonly subscriptionPlans = signal<SubscriptionPlan[]>([]);
  readonly loadingPlans = signal(false);
  readonly selectedPlan = signal<SubscriptionPlan | null>(null);
  readonly selectedBillingCycle = signal<'monthly' | 'yearly'>('monthly');

  // Email validation signals
  readonly emailExists = signal(false);
  readonly emailCheckInProgress = signal(false);
  readonly emailCheckError = signal('');
  private emailCheckSubject = new Subject<string>();

  constructor(
    private fb: FormBuilder,
    private tenantService: TenantService,
    private subscriptionService: SubscriptionService,
    private userService: UserService,
    private toastService: ToastService,
    private router: Router
  ) {
    this.initializeSignupForm();
    this.initializeTenantForm();
    this.setupEmailValidation();
  }

  ngOnInit(): void {
    // Load subscription plans
    this.loadSubscriptionPlans();
  }

  loadSubscriptionPlans(): void {
    this.loadingPlans.set(true);
    this.subscriptionService.getPlans().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.subscriptionPlans.set(response.data);
          // Auto-select Free plan by default
          const freePlan = response.data.find(p => p.name.toLowerCase() === 'free');
          if (freePlan) {
            this.selectedPlan.set(freePlan);
          }
        }
        this.loadingPlans.set(false);
      },
      error: (error) => {
        console.error('Error loading subscription plans:', error);
        this.loadingPlans.set(false);
      }
    });
  }

  selectPlan(plan: SubscriptionPlan): void {
    this.selectedPlan.set(plan);
    console.log('📦 Selected plan:', plan.name, `$${plan.price}/${plan.billing_cycle}`);
  }

  toggleBillingCycle(): void {
    const current = this.selectedBillingCycle();
    this.selectedBillingCycle.set(current === 'monthly' ? 'yearly' : 'monthly');
  }

  getYearlyPrice(monthlyPrice: number): number {
    return monthlyPrice * 12 * 0.8; // 20% discount for yearly
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  }

  // Feature checking helpers for templates
  hasFeature(plan: SubscriptionPlan, keyword: string): boolean {
    if (!plan || !plan.features) return false;
    return plan.features.some((f: string) => f.toLowerCase().includes(keyword.toLowerCase()));
  }

  hasAPIAccess(plan: SubscriptionPlan): boolean {
    return this.hasFeature(plan, 'api');
  }

  hasPrioritySupport(plan: SubscriptionPlan): boolean {
    return this.hasFeature(plan, 'priority') || this.hasFeature(plan, '24/7');
  }

  hasAdvancedAnalytics(plan: SubscriptionPlan): boolean {
    return this.hasFeature(plan, 'analytics') || this.hasFeature(plan, 'advanced');
  }

  initializeSignupForm(): void {
    this.signupForm = this.fb.group({
      firstName: ['', [Validators.required, Validators.minLength(2)]],
      lastName: ['', [Validators.required, Validators.minLength(2)]],
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', Validators.required],
      agreeToTerms: [false, Validators.requiredTrue]
    }, { validators: this.passwordMatchValidator });
  }

  initializeTenantForm(): void {
    this.tenantForm = this.fb.group({
      organizationName: ['', [Validators.required, Validators.minLength(2)]],
      subdomain: ['', [Validators.minLength(3), Validators.pattern(/^[a-z0-9-]+$/)]],
      industry: ['', Validators.required],
      country: ['Philippines', Validators.required],
      contactFirstName: ['', Validators.required],
      contactLastName: ['', Validators.required],
      contactEmail: ['', [Validators.required, Validators.email]],
      contactPhone: ['', Validators.required]
    });
  }

  passwordMatchValidator(group: FormGroup): { [key: string]: any } | null {
    const password = group.get('password');
    const confirmPassword = group.get('confirmPassword');

    if (!password || !confirmPassword) return null;
    if (!password.value || !confirmPassword.value) return null;

    return password.value === confirmPassword.value ? null : { passwordMismatch: true };
  }

  setupEmailValidation(): void {
    this.emailCheckSubject.pipe(
      debounceTime(450)
    ).subscribe(email => {
      this.checkEmailExists(email);
    });
  }

  onEmailBlur(): void {
    const email = this.signupForm.get('email')?.value;
    if (email && this.signupForm.get('email')?.valid) {
      this.checkEmailExists(email);
    }
  }

  onEmailInput(): void {
    const email = this.signupForm.get('email')?.value;
    if (email && email.includes('@')) {
      this.emailCheckSubject.next(email);
    } else {
      this.emailExists.set(false);
      this.emailCheckError.set('');
    }
  }

  checkEmailExists(email: string): void {
    if (!email || !this.signupForm.get('email')?.valid) {
      return;
    }

    this.emailCheckInProgress.set(true);
    this.emailCheckError.set('');

    this.userService.checkEmail(email).subscribe({
      next: (response) => {
        this.emailExists.set(response.exists || false);
        this.emailCheckInProgress.set(false);
      },
      error: (error) => {
        console.error('Email check error:', error);
        this.emailCheckError.set('Unable to verify email. Please try again.');
        this.emailCheckInProgress.set(false);
      }
    });
  }

  getPasswordMismatchError(): string {
    const confirmPassword = this.signupForm.get('confirmPassword');
    if (confirmPassword?.touched && this.signupForm.errors?.['passwordMismatch']) {
      return 'Passwords do not match';
    }
    return '';
  }

  goToStep(step: number): void {
    if (step < this.currentStep() || step === 1) {
      this.currentStep.set(step);
      this.error.set('');
    }
  }

  nextStep(): void {
    const current = this.currentStep();

    if (current === 1 && this.signupForm.invalid) {
      Object.keys(this.signupForm.controls).forEach(key => {
        this.signupForm.get(key)?.markAsTouched();
      });
      return;
    }

    // Check if email already exists before proceeding
    if (current === 1 && this.emailExists()) {
      this.error.set('This email is already registered. Please use a different email.');
      return;
    }

    // Auto-fill contact person with admin info when moving from step 1 to step 2
    if (current === 1 && this.signupForm.valid) {
      const adminData = this.signupForm.value;
      this.tenantForm.patchValue({
        contactFirstName: adminData.firstName,
        contactLastName: adminData.lastName,
        contactEmail: adminData.email
      });
    }

    if (current === 2 && this.tenantForm.invalid) {
      Object.keys(this.tenantForm.controls).forEach(key => {
        this.tenantForm.get(key)?.markAsTouched();
      });
      return;
    }

    // Validate plan selection on step 3
    if (current === 3 && !this.selectedPlan()) {
      this.error.set('Please select a subscription plan');
      return;
    }

    if (current < 5) {
      this.onboardingSteps[current - 1].completed = true;
      this.currentStep.set(current + 1);
      this.error.set('');
    }
  }

  previousStep(): void {
    const current = this.currentStep();
    if (current > 1) {
      this.currentStep.set(current - 1);
      this.error.set('');
    }
  }

  toggleFeature(featureId: string): void {
    const feature = this.features.find(f => f.id === featureId);
    if (feature) {
      feature.selected = !feature.selected;
    }
  }

  completeSignup(): void {
    console.log('🚀 [COMPLETE_SIGNUP] Starting signup process...');

    if (!this.signupForm.valid || !this.tenantForm.valid) {
      console.error('❌ [FORM_VALIDATION_FAILED]');
      console.error('  Signup Form Valid:', this.signupForm.valid, this.signupForm.errors);
      console.error('  Tenant Form Valid:', this.tenantForm.valid, this.tenantForm.errors);
      return;
    }

    this.loading.set(true);
    this.error.set('');

    const adminData = this.signupForm.value;
    const tenantData = this.tenantForm.value;
    const selectedFeatures = this.features.filter(f => f.selected).map(f => f.id);

    console.log('📋 [FORM_DATA_COLLECTED]', {
      adminEmail: adminData.email,
      organizationName: tenantData.organizationName,
      subdomain: tenantData.subdomain || '(auto-generated)',
      selectedFeatures: selectedFeatures
    });

    // Get selected plan details
    const selectedPlan = this.selectedPlan();
    const planName = selectedPlan?.name.toLowerCase() || 'free';
    const planId = selectedPlan?.id || null;

    // Create tenant with admin user
    const createTenantPayload = {
      name: tenantData.organizationName,
      subdomain: tenantData.subdomain,
      industry: tenantData.industry,
      subscriptionPlan: planName,
      planId: planId,
      billingCycle: this.selectedBillingCycle(),
      // status: removed - defaults to 'active' on backend
      contactFirstName: tenantData.contactFirstName,
      contactLastName: tenantData.contactLastName,
      contactEmail: tenantData.contactEmail,
      contactPhone: tenantData.contactPhone,
      street_address: '',
      barangay: '',
      city: '',
      province: '',
      region: '',
      postal_code: '',
      country: tenantData.country,
      money_loan_enabled: selectedFeatures.includes('money-loan'),
      bnpl_enabled: selectedFeatures.includes('bnpl'),
      pawnshop_enabled: selectedFeatures.includes('pawnshop'),
      adminFirstName: adminData.firstName,
      adminLastName: adminData.lastName,
      adminEmail: adminData.email,
      adminPassword: adminData.password
    };

    console.log('📤 [SENDING_PAYLOAD] Calling createTenant API...');
    console.log('   Payload:', JSON.stringify(createTenantPayload, null, 2));

    this.tenantService.createTenant(createTenantPayload as any).subscribe({
      next: (response) => {
        console.log('✅ [API_SUCCESS] Response received:');
        console.log('   Success:', response.success);
        console.log('   Tenant ID:', response.tenant?.id);
        console.log('   Message:', response.message);

        if (response.success) {
          console.log('🎉 [SIGNUP_SUCCESS] Account created successfully!');
          this.success.set(true);
          this.loading.set(false);
          this.onboardingSteps[4].completed = true; // Step 5 is index 4

          // Show success toast
          this.toastService.success('🎉 Account created successfully! Redirecting to login...');

          // Redirect to login after 2 seconds
          console.log('⏳ [REDIRECTING] Will redirect to login in 2 seconds...');
          setTimeout(() => {
            console.log('🔄 [REDIRECT] Navigating to /login');
            this.router.navigate(['/login'], {
              queryParams: { email: adminData.email, registered: 'true' }
            });
          }, 2000);
        }
      },
      error: (error) => {
        console.error('❌ [API_ERROR] Request failed:');
        console.error('   Status:', error.status);
        console.error('   Message:', error.error?.error || error.error?.message || error.message);
        console.error('   Full Error:', error);

        this.loading.set(false);
        const errorMsg = error.error?.error ||
                        error.error?.message ||
                        'Failed to create account. Please try again.';
        console.error('📢 [ERROR_DISPLAYED_TO_USER]:', errorMsg);
        this.error.set(errorMsg);
        
        // Show error toast
        this.toastService.error(errorMsg);
      }
    });
  }

  isFieldInvalid(form: FormGroup, fieldName: string): boolean {
    const field = form.get(fieldName);
    return !!(field && field.invalid && field.touched);
  }

  getFieldError(form: FormGroup, fieldName: string): string {
    const field = form.get(fieldName);
    if (field?.hasError('required')) return `${this.formatFieldName(fieldName)} is required`;
    if (field?.hasError('email')) return 'Invalid email format';
    if (field?.hasError('minlength')) return `Minimum length is ${field.errors?.['minlength'].requiredLength}`;
    if (field?.hasError('pattern')) return `${this.formatFieldName(fieldName)} format is invalid`;
    if (this.signupForm.hasError('passwordMismatch') && (fieldName === 'password' || fieldName === 'confirmPassword')) {
      return 'Passwords do not match';
    }
    return '';
  }

  private formatFieldName(fieldName: string): string {
    return fieldName
      .replace(/([A-Z])/g, ' $1')
      .replace('_', ' ')
      .trim()
      .charAt(0)
      .toUpperCase() + fieldName.slice(1);
  }

  getFeatureCardClasses(feature: any): Record<string, boolean> {
    return {
      'p-6': true,
      'border-2': true,
      'rounded-lg': true,
      'cursor-pointer': true,
      'transition-all': true,
      'border-purple-600': feature.selected,
      'bg-purple-900/20': feature.selected,
      'border-gray-700': !feature.selected,
      'bg-gray-900/50': !feature.selected,
      'hover:border-purple-500': !feature.selected
    };
  }

  getFeatureCheckboxClasses(feature: any): Record<string, boolean> {
    return {
      'border-purple-600': feature.selected,
      'bg-purple-600': feature.selected,
      'border-gray-600': !feature.selected
    };
  }

  getFeatureDescription(featureId: string): string {
    switch (featureId) {
      case 'money-loan':
        return 'Manage lending operations';
      case 'pawnshop':
        return 'Manage pawnshop operations';
      case 'bnpl':
        return 'Manage BNPL transactions';
      default:
        return '';
    }
  }
}
