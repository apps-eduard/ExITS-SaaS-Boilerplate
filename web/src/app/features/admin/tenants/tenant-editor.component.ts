import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';

interface TenantForm {
  name: string;
  subdomain: string;
  plan: string;
  status: string;
  max_users: number;
  logo_url?: string;
  colors?: {
    primary?: string;
    secondary?: string;
  };
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

        <!-- Plan & Limits -->
        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          <div class="px-3 py-2 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <h2 class="text-xs font-semibold text-gray-900 dark:text-white">Subscription & Limits</h2>
          </div>
          <div class="p-4 space-y-3">
            <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Plan <span class="text-red-500">*</span>
                </label>
                <select
                  [(ngModel)]="form.plan"
                  name="plan"
                  required
                  class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                >
                  <option value="basic">Basic</option>
                  <option value="professional">Professional</option>
                  <option value="enterprise">Enterprise</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status <span class="text-red-500">*</span>
                </label>
                <select
                  [(ngModel)]="form.status"
                  name="status"
                  required
                  class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                >
                  <option value="active">Active</option>
                  <option value="trial">Trial</option>
                  <option value="suspended">Suspended</option>
                </select>
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Max Users <span class="text-red-500">*</span>
                </label>
                <input
                  type="number"
                  [(ngModel)]="form.max_users"
                  name="max_users"
                  required
                  min="1"
                  placeholder="50"
                  class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400 focus:border-transparent"
                />
              </div>
            </div>

            <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded p-3">
              <div class="flex items-start gap-2">
                <svg class="w-4 h-4 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div class="text-xs text-blue-800 dark:text-blue-200">
                  <p class="font-medium mb-1">Plan Limits</p>
                  <ul class="text-xs space-y-0.5">
                    <li><strong>Basic:</strong> Up to 50 users, basic features</li>
                    <li><strong>Professional:</strong> Up to 200 users, advanced features</li>
                    <li><strong>Enterprise:</strong> Unlimited users, all features</li>
                  </ul>
                </div>
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
    plan: 'basic',
    status: 'active',
    max_users: 50,
    logo_url: '',
    colors: {
      primary: '#3b82f6',
      secondary: '#8b5cf6'
    }
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

    this.loading.set(true);
    this.error.set(null);

    this.http.get<any>(`/api/tenants/${this.tenantId()}`).subscribe({
      next: (response) => {
        const tenant = response.data;
        this.form = {
          name: tenant.name,
          subdomain: tenant.subdomain,
          plan: tenant.plan,
          status: tenant.status,
          max_users: tenant.max_users,
          logo_url: tenant.logo_url || '',
          colors: tenant.colors || { primary: '#3b82f6', secondary: '#8b5cf6' }
        };
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load tenant');
        this.loading.set(false);
        console.error('Error loading tenant:', err);
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
        console.log('Tenant saved:', response);
        this.saving.set(false);
        this.router.navigate(['/admin/tenants']);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to save tenant');
        this.saving.set(false);
        console.error('Error saving tenant:', err);
      }
    });
  }
}
