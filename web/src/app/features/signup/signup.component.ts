import { Component, OnInit, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { TenantService } from '../../core/services/tenant.service';

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
    { step: 3, title: 'Features', description: 'Choose your initial features', completed: false },
    { step: 4, title: 'Complete', description: 'Setup complete!', completed: false }
  ];

  readonly features = [
    { id: 'money-loan', name: 'Money Loan', icon: '💸', selected: true },
    { id: 'pawnshop', name: 'Pawnshop', icon: '💍', selected: false },
    { id: 'bnpl', name: 'BNPL', icon: '🛒', selected: false }
  ];

  constructor(
    private fb: FormBuilder,
    private tenantService: TenantService,
    private router: Router
  ) {
    this.initializeSignupForm();
    this.initializeTenantForm();
  }

  ngOnInit(): void {
    // Form is initialized in constructor
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

    if (current < 4) {
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

    // Create tenant with admin user
    const createTenantPayload = {
      name: tenantData.organizationName,
      subdomain: tenantData.subdomain,
      industry: tenantData.industry,
      subscriptionPlan: 'trial',
      status: 'trial',
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
          this.onboardingSteps[3].completed = true;

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
