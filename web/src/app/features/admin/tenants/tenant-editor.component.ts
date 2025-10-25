import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

interface TenantForm {
  name: string;
  subdomain: string;
  logo_url?: string;
  colors?: {
    primary?: string;
    secondary?: string;
  };
  // Contact Person
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  // Product Enablement
  money_loan_enabled: boolean;
  bnpl_enabled: boolean;
  pawnshop_enabled: boolean;
}

@Component({
  selector: 'app-tenant-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="p-4 space-y-4 max-w-4xl">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">
            {{ isEditMode() ? '✏️ Edit Tenant' : '➕ New Tenant' }}
          </h1>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
            {{ isEditMode() ? 'Update tenant information and settings' : 'Create a new tenant organization' }}
          </p>
        </div>
        <button
          routerLink="/admin/tenants"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back to List
        </button>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()" class="text-center py-8">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-3">Loading tenant...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error()" class="rounded border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/10 p-3">
        <p class="text-xs text-red-800 dark:text-red-200">{{ error() }}</p>
      </div>

      <!-- Form -->
      <form *ngIf="!loading()" (ngSubmit)="saveTenant()" class="space-y-4">
        <!-- Basic Information -->
        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          <div class="px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <h2 class="text-xs font-semibold text-gray-900 dark:text-white">Basic Information</h2>
          </div>
          <div class="p-4 space-y-3">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tenant Name <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  [(ngModel)]="form.name"
                  name="name"
                  required
                  placeholder="Acme Corporation"
                  class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                />
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Subdomain <span class="text-red-500">*</span>
                </label>
                <div class="flex items-center gap-2">
                  <input
                    type="text"
                    [(ngModel)]="form.subdomain"
                    name="subdomain"
                    required
                    [disabled]="isEditMode()"
                    placeholder="acme"
                    pattern="[a-z0-9-]+"
                    class="flex-1 px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent disabled:opacity-50 disabled:cursor-not-allowed"
                  />
                  <span class="text-xs text-gray-500 dark:text-gray-400">.yourapp.com</span>
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {{ isEditMode() ? 'Subdomain cannot be changed after creation' : 'Only lowercase letters, numbers, and hyphens' }}
                </p>
              </div>
            </div>
          </div>
        </div>

        <!-- Contact Person -->
        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          <div class="px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <h2 class="text-xs font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span>👤</span>
              Contact Person
            </h2>
          </div>
          <div class="p-4 space-y-3">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Full Name
                </label>
                <input
                  type="text"
                  [(ngModel)]="form.contact_person"
                  name="contact_person"
                  placeholder="John Doe"
                  class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                />
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email Address
                </label>
                <input
                  type="email"
                  [(ngModel)]="form.contact_email"
                  name="contact_email"
                  placeholder="john.doe@example.com"
                  class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                />
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Phone Number
                </label>
                <input
                  type="tel"
                  [(ngModel)]="form.contact_phone"
                  name="contact_phone"
                  placeholder="+1 234 567 8900"
                  class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Product Enablement -->
        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          <div class="px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <h2 class="text-xs font-semibold text-gray-900 dark:text-white flex items-center gap-2">
              <span>🎯</span>
              Product Enablement
            </h2>
          </div>
          <div class="p-4">
            <p class="text-xs text-gray-600 dark:text-gray-400 mb-3">
              Enable or disable products for this tenant. Tenants can manage their own subscriptions through their portal.
            </p>
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <!-- Money Loan -->
              <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:border-primary-500 transition-colors"
                   [class.bg-green-50]="form.money_loan_enabled"
                   [class.dark:bg-green-900/20]="form.money_loan_enabled">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-lg">💵</span>
                  <div>
                    <h3 class="text-xs font-semibold text-gray-900 dark:text-white">Money Loan</h3>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Quick cash loans</p>
                  </div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox"
                         [(ngModel)]="form.money_loan_enabled"
                         name="money_loan_enabled"
                         class="sr-only peer">
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 dark:peer-focus:ring-green-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-600"></div>
                  <span class="ms-3 text-xs font-medium text-gray-900 dark:text-gray-300">
                    {{ form.money_loan_enabled ? 'Enabled' : 'Disabled' }}
                  </span>
                </label>
              </div>

              <!-- BNPL -->
              <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:border-primary-500 transition-colors"
                   [class.bg-blue-50]="form.bnpl_enabled"
                   [class.dark:bg-blue-900/20]="form.bnpl_enabled">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-lg">💳</span>
                  <div>
                    <h3 class="text-xs font-semibold text-gray-900 dark:text-white">BNPL</h3>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Buy Now Pay Later</p>
                  </div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox"
                         [(ngModel)]="form.bnpl_enabled"
                         name="bnpl_enabled"
                         class="sr-only peer">
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 dark:peer-focus:ring-blue-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-blue-600"></div>
                  <span class="ms-3 text-xs font-medium text-gray-900 dark:text-gray-300">
                    {{ form.bnpl_enabled ? 'Enabled' : 'Disabled' }}
                  </span>
                </label>
              </div>

              <!-- Pawnshop -->
              <div class="border border-gray-200 dark:border-gray-700 rounded-lg p-3 hover:border-primary-500 transition-colors"
                   [class.bg-purple-50]="form.pawnshop_enabled"
                   [class.dark:bg-purple-900/20]="form.pawnshop_enabled">
                <div class="flex items-center gap-2 mb-2">
                  <span class="text-lg">💎</span>
                  <div>
                    <h3 class="text-xs font-semibold text-gray-900 dark:text-white">Pawnshop</h3>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Collateral loans</p>
                  </div>
                </div>
                <label class="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox"
                         [(ngModel)]="form.pawnshop_enabled"
                         name="pawnshop_enabled"
                         class="sr-only peer">
                  <div class="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-purple-300 dark:peer-focus:ring-purple-800 rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full rtl:peer-checked:after:-translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:start-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-purple-600"></div>
                  <span class="ms-3 text-xs font-medium text-gray-900 dark:text-gray-300">
                    {{ form.pawnshop_enabled ? 'Enabled' : 'Disabled' }}
                  </span>
                </label>
              </div>
            </div>
          </div>
        </div>

        <!-- Branding (Optional) -->
        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          <div class="px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <h2 class="text-xs font-semibold text-gray-900 dark:text-white">Branding (Optional)</h2>
          </div>
          <div class="p-4 space-y-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Logo URL
              </label>
              <input
                type="url"
                [(ngModel)]="form.logo_url"
                name="logo_url"
                placeholder="https://example.com/logo.png"
                class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
              />
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Primary Color
                </label>
                <input
                  type="color"
                  [(ngModel)]="form.colors!.primary"
                  name="primary_color"
                  class="w-full h-8 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                />
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Secondary Color
                </label>
                <input
                  type="color"
                  [(ngModel)]="form.colors!.secondary"
                  name="secondary_color"
                  class="w-full h-8 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700"
                />
              </div>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-between">
          <button
            type="button"
            routerLink="/admin/tenants"
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
            <span *ngIf="saving()" class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
            <svg *ngIf="!saving()" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <span>{{ saving() ? 'Saving...' : (isEditMode() ? 'Update Tenant' : 'Create Tenant') }}</span>
          </button>
        </div>
      </form>
    </div>
  `,
  styles: []
})
export class TenantEditorComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);

  tenantId = signal<number | null>(null);
  isEditMode = signal(false);
  loading = signal(false);
  saving = signal(false);
  error = signal<string | null>(null);

  form: TenantForm = {
    name: '',
    subdomain: '',
    logo_url: '',
    colors: {
      primary: '#3b82f6',
      secondary: '#8b5cf6'
    },
    contact_person: '',
    contact_email: '',
    contact_phone: '',
    money_loan_enabled: false,
    bnpl_enabled: false,
    pawnshop_enabled: false
  };

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    
    if (id && id !== 'new') {
      this.tenantId.set(parseInt(id));
      this.isEditMode.set(true);
      this.loadTenant();
    }
    console.log('🏢 TenantEditorComponent initialized', { isEdit: this.isEditMode() });
  }

  loadTenant(): void {
    if (!this.tenantId()) return;

    console.log('🔍 [DEBUG] loadTenant() called for ID:', this.tenantId());
    
    this.loading.set(true);
    this.error.set(null);

    this.http.get<any>(`/api/tenants/${this.tenantId()}`).subscribe({
      next: (response) => {
        const tenant = response.data;
        console.log('✅ [DEBUG] Tenant data loaded:', tenant);
        console.log('   Product flags (camelCase):', {
          moneyLoanEnabled: tenant.moneyLoanEnabled,
          bnplEnabled: tenant.bnplEnabled,
          pawnshopEnabled: tenant.pawnshopEnabled
        });
        
        this.form = {
          name: tenant.name,
          subdomain: tenant.subdomain,
          logo_url: tenant.logoUrl || '',
          colors: { 
            primary: tenant.primaryColor || '#3b82f6', 
            secondary: tenant.secondaryColor || '#8b5cf6' 
          },
          contact_person: tenant.contact_person || '',
          contact_email: tenant.contact_email || '',
          contact_phone: tenant.contact_phone || '',
          money_loan_enabled: tenant.moneyLoanEnabled || false,
          bnpl_enabled: tenant.bnplEnabled || false,
          pawnshop_enabled: tenant.pawnshopEnabled || false
        };
        
        console.log('📝 Form populated with:', {
          money_loan_enabled: this.form.money_loan_enabled,
          bnpl_enabled: this.form.bnpl_enabled,
          pawnshop_enabled: this.form.pawnshop_enabled
        });
        
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load tenant');
        this.loading.set(false);
        console.error('❌ [DEBUG] Error loading tenant:', err);
      }
    });
  }

  saveTenant(): void {
    this.saving.set(true);
    this.error.set(null);

    const request = this.isEditMode()
      ? this.http.put<any>(`/api/tenants/${this.tenantId()}`, this.form)
      : this.http.post<any>('/api/tenants', this.form);

    request.subscribe({
      next: (response) => {
        console.log('✅ Tenant saved successfully:', response);
        this.saving.set(false);
        this.router.navigate(['/admin/tenants']);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to save tenant');
        this.saving.set(false);
        console.error('❌ Error saving tenant:', err);
      }
    });
  }
}
