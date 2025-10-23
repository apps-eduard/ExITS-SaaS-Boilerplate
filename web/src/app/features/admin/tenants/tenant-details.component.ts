import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface Tenant {
  id: number;
  name: string;
  subdomain: string;
  plan: string;
  status: string;
  max_users: number;
  logo_url?: string;
  colors?: any;
  created_at: string;
  updated_at: string;
  user_count: number;
  role_count: number;
  // Contact Person
  contact_person?: string;
  contact_email?: string;
  contact_phone?: string;
  // Product Enablement
  money_loan_enabled?: boolean;
  bnpl_enabled?: boolean;
  pawnshop_enabled?: boolean;
}

interface TenantStats {
  total_users: number;
  total_roles: number;
  total_assignments: number;
  total_audit_logs: number;
  active_sessions: number;
}

@Component({
  selector: 'app-tenant-details',
  standalone: true,
  imports: [CommonModule, RouterLink],
  template: `
    <div class="p-6 space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">🏢 Tenant Details</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            View tenant information and statistics
          </p>
        </div>
        <div class="flex items-center gap-2">
          <button
            [routerLink]="['/admin/tenants', tenant()?.id, 'edit']"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
            </svg>
            Edit
          </button>
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
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-4">Loading tenant details...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error()" class="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/10 p-4">
        <p class="text-sm text-red-800 dark:text-red-200">{{ error() }}</p>
      </div>

      <!-- Content -->
      <div *ngIf="!loading() && !error() && tenant()" class="space-y-6">
        <!-- Tenant Overview -->
        <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <!-- Main Info -->
          <div class="lg:col-span-2 rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
            <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Tenant Information</h2>
            </div>
            <div class="p-6 space-y-4">
              <div class="flex items-start gap-4">
                <div *ngIf="tenant()?.logo_url" class="w-16 h-16 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-gray-900 overflow-hidden">
                  <img [src]="tenant()?.logo_url" [alt]="tenant()?.name" class="w-full h-full object-cover" />
                </div>
                <div *ngIf="!tenant()?.logo_url" class="w-16 h-16 rounded-lg border border-gray-200 dark:border-gray-700 flex items-center justify-center bg-gray-50 dark:bg-gray-900">
                  <span class="text-2xl">🏢</span>
                </div>
                <div class="flex-1">
                  <h3 class="text-xl font-bold text-gray-900 dark:text-white">{{ tenant()?.name }}</h3>
                  <p class="text-sm text-gray-500 dark:text-gray-400">Tenant ID: {{ tenant()?.id }}</p>
                  <div class="flex items-center gap-2 mt-2">
                    <span class="inline-flex items-center px-2 py-1 text-xs font-semibold rounded" [ngClass]="getStatusClass(tenant()?.status || '')">
                      {{ tenant()?.status?.toUpperCase() }}
                    </span>
                    <span class="inline-flex items-center px-2 py-1 text-xs font-semibold rounded" [ngClass]="getPlanClass(tenant()?.plan || '')">
                      {{ tenant()?.plan?.toUpperCase() }}
                    </span>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4 pt-4 border-t border-gray-200 dark:border-gray-700">
                <div>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Subdomain</p>
                  <code class="text-sm text-blue-600 dark:text-blue-400">{{ tenant()?.subdomain }}.yourapp.com</code>
                </div>
                <div>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">User Limit</p>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">
                    {{ tenant()?.user_count }} / {{ tenant()?.max_users }}
                    <span class="text-xs text-gray-500 dark:text-gray-400">
                      ({{ getUsagePercentage() }}%)
                    </span>
                  </p>
                </div>
                <div>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Created</p>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ formatDate(tenant()?.created_at || '') }}</p>
                </div>
                <div>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Last Updated</p>
                  <p class="text-sm font-medium text-gray-900 dark:text-white">{{ formatDate(tenant()?.updated_at || '') }}</p>
                </div>
              </div>

              <!-- Contact Person Section -->
              <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <span>👤</span>
                  Contact Person
                </h4>
                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Name</p>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ tenant()?.contact_person || 'Not provided' }}
                    </p>
                  </div>
                  <div>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Email</p>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ tenant()?.contact_email || 'Not provided' }}
                    </p>
                  </div>
                  <div>
                    <p class="text-xs text-gray-500 dark:text-gray-400 mb-1">Phone</p>
                    <p class="text-sm font-medium text-gray-900 dark:text-white">
                      {{ tenant()?.contact_phone || 'Not provided' }}
                    </p>
                  </div>
                </div>
              </div>

              <!-- Enabled Products Section -->
              <div class="pt-4 border-t border-gray-200 dark:border-gray-700">
                <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
                  <span>🎯</span>
                  Enabled Products
                </h4>
                <div class="flex flex-wrap gap-2">
                  <span *ngIf="tenant()?.money_loan_enabled" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 border border-green-200 dark:border-green-800">
                    <span>💵</span>
                    Money Loan
                  </span>
                  <span *ngIf="tenant()?.bnpl_enabled" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 border border-blue-200 dark:border-blue-800">
                    <span>💳</span>
                    BNPL
                  </span>
                  <span *ngIf="tenant()?.pawnshop_enabled" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold rounded-lg bg-purple-100 dark:bg-purple-900/30 text-purple-800 dark:text-purple-300 border border-purple-200 dark:border-purple-800">
                    <span>💎</span>
                    Pawnshop
                  </span>
                  <span *ngIf="!tenant()?.money_loan_enabled && !tenant()?.bnpl_enabled && !tenant()?.pawnshop_enabled" class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-400">
                    No products enabled
                  </span>
                </div>
              </div>
            </div>
          </div>

          <!-- Quick Stats -->
          <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
            <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
              <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Quick Stats</h2>
            </div>
            <div class="p-4 space-y-3">
              <div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span class="text-sm text-gray-600 dark:text-gray-400">Total Users</span>
                <span class="text-sm font-medium text-gray-900 dark:text-white">{{ tenant()?.user_count }}</span>
              </div>
              <div class="flex items-center justify-between py-2 border-b border-gray-100 dark:border-gray-700">
                <span class="text-sm text-gray-600 dark:text-gray-400">Total Roles</span>
                <span class="text-sm font-medium text-gray-900 dark:text-white">{{ tenant()?.role_count }}</span>
              </div>
              <div class="flex items-center justify-between py-2">
                <span class="text-sm text-gray-600 dark:text-gray-400">Plan</span>
                <span class="text-sm font-medium text-gray-900 dark:text-white capitalize">{{ tenant()?.plan }}</span>
              </div>
            </div>
          </div>
        </div>

        <!-- Detailed Statistics -->
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
                </svg>
              </div>
              <div>
                <p class="text-xs text-gray-600 dark:text-gray-400">Users</p>
                <p class="text-lg font-bold text-gray-900 dark:text-white">{{ stats()?.total_users || 0 }}</p>
              </div>
            </div>
          </div>

          <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center">
                <svg class="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <div>
                <p class="text-xs text-gray-600 dark:text-gray-400">Roles</p>
                <p class="text-lg font-bold text-gray-900 dark:text-white">{{ stats()?.total_roles || 0 }}</p>
              </div>
            </div>
          </div>

          <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
                <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <div>
                <p class="text-xs text-gray-600 dark:text-gray-400">Assignments</p>
                <p class="text-lg font-bold text-gray-900 dark:text-white">{{ stats()?.total_assignments || 0 }}</p>
              </div>
            </div>
          </div>

          <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center">
                <svg class="w-5 h-5 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <p class="text-xs text-gray-600 dark:text-gray-400">Audit Logs</p>
                <p class="text-lg font-bold text-gray-900 dark:text-white">{{ stats()?.total_audit_logs || 0 }}</p>
              </div>
            </div>
          </div>

          <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-4">
            <div class="flex items-center gap-3">
              <div class="w-10 h-10 rounded-lg bg-red-100 dark:bg-red-900/30 flex items-center justify-center">
                <svg class="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5.636 18.364a9 9 0 010-12.728m12.728 0a9 9 0 010 12.728m-9.9-2.829a5 5 0 010-7.07m7.072 0a5 5 0 010 7.07M13 12a1 1 0 11-2 0 1 1 0 012 0z" />
                </svg>
              </div>
              <div>
                <p class="text-xs text-gray-600 dark:text-gray-400">Active Sessions</p>
                <p class="text-lg font-bold text-gray-900 dark:text-white">{{ stats()?.active_sessions || 0 }}</p>
              </div>
            </div>
          </div>
        </div>

        <!-- User Usage Progress -->
        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <h2 class="text-sm font-semibold text-gray-900 dark:text-white">User Capacity</h2>
          </div>
          <div class="p-6">
            <div class="flex items-center justify-between mb-2">
              <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
                {{ tenant()?.user_count }} of {{ tenant()?.max_users }} users
              </span>
              <span class="text-sm font-semibold" [ngClass]="getUsageColor()">
                {{ getUsagePercentage() }}%
              </span>
            </div>
            <div class="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3">
              <div
                class="h-3 rounded-full transition-all duration-500"
                [ngClass]="getUsageBarColor()"
                [style.width.%]="getUsagePercentage()">
              </div>
            </div>
          </div>
        </div>

        <!-- Branding Colors -->
        <div *ngIf="tenant()?.colors" class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
            <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Branding Colors</h2>
          </div>
          <div class="p-6">
            <div class="grid grid-cols-2 gap-4">
              <div>
                <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">Primary Color</p>
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-lg border border-gray-200 dark:border-gray-700" [style.background-color]="tenant()?.colors?.primary"></div>
                  <code class="text-sm text-gray-900 dark:text-white">{{ tenant()?.colors?.primary }}</code>
                </div>
              </div>
              <div>
                <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">Secondary Color</p>
                <div class="flex items-center gap-3">
                  <div class="w-12 h-12 rounded-lg border border-gray-200 dark:border-gray-700" [style.background-color]="tenant()?.colors?.secondary"></div>
                  <code class="text-sm text-gray-900 dark:text-white">{{ tenant()?.colors?.secondary }}</code>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class TenantDetailsComponent implements OnInit {
  private http = inject(HttpClient);
  private route = inject(ActivatedRoute);

  tenant = signal<Tenant | null>(null);
  stats = signal<TenantStats | null>(null);
  loading = signal(false);
  error = signal<string | null>(null);

  ngOnInit(): void {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.loadTenant(parseInt(id));
      this.loadStats(parseInt(id));
    }
    console.log('🏢 TenantDetailsComponent initialized');
  }

  loadTenant(id: number): void {
    this.loading.set(true);
    this.error.set(null);

    this.http.get<any>(`/api/tenants/${id}`).subscribe({
      next: (response) => {
        this.tenant.set(response.data);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load tenant');
        this.loading.set(false);
        console.error('Error loading tenant:', err);
      }
    });
  }

  loadStats(id: number): void {
    this.http.get<any>(`/api/tenants/${id}/stats`).subscribe({
      next: (response) => {
        this.stats.set(response.data);
      },
      error: (err) => {
        console.error('Error loading tenant stats:', err);
      }
    });
  }

  getUsagePercentage(): number {
    const t = this.tenant();
    if (!t || !t.max_users) return 0;
    return Math.round((t.user_count / t.max_users) * 100);
  }

  getUsageColor(): string {
    const usage = this.getUsagePercentage();
    if (usage >= 90) return 'text-red-600 dark:text-red-400';
    if (usage >= 75) return 'text-yellow-600 dark:text-yellow-400';
    return 'text-green-600 dark:text-green-400';
  }

  getUsageBarColor(): string {
    const usage = this.getUsagePercentage();
    if (usage >= 90) return 'bg-red-500';
    if (usage >= 75) return 'bg-yellow-500';
    return 'bg-green-500';
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400';
      case 'suspended':
        return 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400';
      case 'trial':
        return 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  }

  getPlanClass(plan: string): string {
    switch (plan) {
      case 'enterprise':
        return 'bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400';
      case 'professional':
        return 'bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400';
      case 'basic':
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
      default:
        return 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300';
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  }
}
