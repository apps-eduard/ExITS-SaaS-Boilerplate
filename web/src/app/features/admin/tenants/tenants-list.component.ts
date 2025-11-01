import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { FormsModule } from '@angular/forms';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';

interface Tenant {
  id: number;
  name: string;
  subdomain: string;
  plan: string;
  status: string;
  maxUsers: number;
  createdAt: string;
  moneyLoanEnabled?: boolean;
  bnplEnabled?: boolean;
  pawnshopEnabled?: boolean;
  user_count?: number;
  role_count?: number;
  subscriptions?: Array<{
    productType: string;
    planName: string;
    status: string;
    startedAt: string;
    expiresAt: string | null;
    price: string;
    billingCycle: string;
  }>;
}

interface Pagination {
  page: number;
  limit: number;
  total: number;
  pages: number;
}

@Component({
  selector: 'app-tenants-list',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
  <div class="p-6 space-y-4 w-full">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span class="text-xl">🏢</span>
            Tenant Management
          </h1>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Manage tenant organizations and subscriptions
          </p>
        </div>
        <button
          *ngIf="canCreateTenants()"
          routerLink="/admin/tenants/new"
          class="inline-flex items-center gap-1.5 rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 shadow-sm transition"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
          </svg>
          New Tenant
        </button>
      </div>

      <!-- Filters & Search -->
  <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 w-full">
        <div class="p-3">
          <div class="grid grid-cols-1 md:grid-cols-5 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                [(ngModel)]="filters.status"
                (ngModelChange)="resetToFirstPage(); loadTenants()"
                class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="trial">Trial</option>
                <option value="deleted">Deleted</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Plan</label>
              <select
                [(ngModel)]="filters.plan"
                (ngModelChange)="resetToFirstPage(); loadTenants()"
                class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Plans</option>
                <option *ngFor="let plan of availablePlans()" [value]="plan">{{ plan }}</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (input)="onSearch()"
                placeholder="Search by name or subdomain..."
                class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Page Size</label>
              <select
                [(ngModel)]="pageSize"
                (ngModelChange)="onPageSizeChange()"
                class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
              >
                <option [value]="10">10</option>
                <option [value]="25">25</option>
                <option [value]="50">50</option>
                <option [value]="100">100</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">&nbsp;</label>
              <button
                (click)="clearFilters()"
                [disabled]="!hasActiveFilters()"
                class="w-full px-2 py-1.5 text-xs font-medium rounded bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
  <div class="grid grid-cols-1 md:grid-cols-4 gap-3 w-full">
        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center flex-shrink-0">
              <span class="text-lg">🏢</span>
            </div>
            <div class="min-w-0">
              <p class="text-xs text-gray-600 dark:text-gray-400">Total</p>
              <p class="text-lg font-bold text-gray-900 dark:text-white">{{ pagination().total }}</p>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded bg-green-100 dark:bg-green-900/30 flex items-center justify-center flex-shrink-0">
              <span class="text-lg">✓</span>
            </div>
            <div class="min-w-0">
              <p class="text-xs text-gray-600 dark:text-gray-400">Active</p>
              <p class="text-lg font-bold text-gray-900 dark:text-white">{{ stats().active }}</p>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center flex-shrink-0">
              <span class="text-lg">⏳</span>
            </div>
            <div class="min-w-0">
              <p class="text-xs text-gray-600 dark:text-gray-400">Trial</p>
              <p class="text-lg font-bold text-gray-900 dark:text-white">{{ stats().trial }}</p>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-3">
          <div class="flex items-center gap-2">
            <div class="w-8 h-8 rounded bg-red-100 dark:bg-red-900/30 flex items-center justify-center flex-shrink-0">
              <span class="text-lg">⏸</span>
            </div>
            <div class="min-w-0">
              <p class="text-xs text-gray-600 dark:text-gray-400">Suspended</p>
              <p class="text-lg font-bold text-gray-900 dark:text-white">{{ stats().suspended }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      <div *ngIf="loading()" class="text-center py-8">
        <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">Loading tenants...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="error()" class="rounded border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/10 p-3">
        <p class="text-xs text-red-800 dark:text-red-200">{{ error() }}</p>
      </div>

      <!-- Tenants Table -->
  <div *ngIf="!loading() && !error()" class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden w-full">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <span class="inline-flex items-center gap-1">
                    <span class="w-3.5 h-3.5">🏢</span>
                    Tenant
                  </span>
                </th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <span class="inline-flex items-center gap-1">
                    <span class="w-3.5 h-3.5">🌐</span>
                    Subdomain
                  </span>
                </th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <span class="inline-flex items-center gap-1">
                    <span class="w-3.5 h-3.5">📦</span>
                    Products Enabled
                  </span>
                </th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <span class="inline-flex items-center gap-1">
                    <span class="w-3.5 h-3.5">📊</span>
                    Subscriptions
                  </span>
                </th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <span class="inline-flex items-center gap-1">
                    <span class="w-3.5 h-3.5">🔘</span>
                    Status
                  </span>
                </th>
                <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <span class="inline-flex items-center gap-1">
                    <span class="w-3.5 h-3.5">👥</span>
                    Users
                  </span>
                </th>
                <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <span class="inline-flex items-center gap-1">
                    <span class="w-3.5 h-3.5">⚙️</span>
                    Actions
                  </span>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              @for (tenant of tenants(); track tenant.id) {
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td class="px-3 py-2">
                    <div>
                      <p class="text-xs font-medium text-gray-900 dark:text-white">{{ tenant.name }}</p>
                      <p class="text-[10px] text-gray-500 dark:text-gray-400">ID: {{ tenant.id }}</p>
                    </div>
                  </td>
                  <td class="px-3 py-2">
                    <code class="text-xs text-blue-600 dark:text-blue-400">{{ tenant.subdomain }}</code>
                  </td>
                  <td class="px-3 py-2">
                    <div class="flex flex-wrap gap-1">
                      <span *ngIf="tenant.moneyLoanEnabled" class="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400">
                        💸 Money Loan
                      </span>
                      <span *ngIf="tenant.bnplEnabled" class="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-400">
                        🛒 BNPL
                      </span>
                      <span *ngIf="tenant.pawnshopEnabled" class="inline-flex items-center gap-1 px-1.5 py-0.5 text-[10px] font-semibold rounded bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-400">
                        💍 Pawnshop
                      </span>
                      <span *ngIf="!tenant.moneyLoanEnabled && !tenant.bnplEnabled && !tenant.pawnshopEnabled" class="text-xs text-gray-400 dark:text-gray-500 italic">
                        No products
                      </span>
                    </div>
                  </td>
                  <td class="px-3 py-2">
                    <div *ngIf="tenant.subscriptions && tenant.subscriptions.length > 0" class="space-y-1">
                      <div *ngFor="let sub of tenant.subscriptions" class="text-[10px]">
                        <div class="flex items-center gap-1">
                          <span class="font-medium text-gray-900 dark:text-white">{{ sub.planName }}</span>
                          <span class="inline-flex items-center px-1 py-0.5 rounded text-[9px] font-semibold" 
                                [ngClass]="sub.status === 'active' ? 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400' : 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400'">
                            {{ sub.status }}
                          </span>
                        </div>
                        <div class="text-gray-600 dark:text-gray-400">
                          <span>Started: {{ formatDate(sub.startedAt) }}</span>
                          <span *ngIf="sub.expiresAt" class="ml-2">• Expires: {{ formatDate(sub.expiresAt) }}</span>
                          <span *ngIf="!sub.expiresAt" class="ml-2 text-green-600 dark:text-green-400">• No expiration</span>
                        </div>
                      </div>
                    </div>
                    <span *ngIf="!tenant.subscriptions || tenant.subscriptions.length === 0" class="text-xs text-gray-400 dark:text-gray-500 italic">
                      No active subscriptions
                    </span>
                  </td>
                  <td class="px-3 py-2">
                    <span class="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded" [ngClass]="getStatusClass(tenant.status)">
                      {{ tenant.status.toUpperCase() }}
                    </span>
                  </td>
                  <td class="px-3 py-2 text-center">
                    <span class="text-xs text-gray-900 dark:text-white">{{ tenant.user_count || 0 }} / {{ tenant.maxUsers }}</span>
                  </td>
                  <td class="px-3 py-2">
                    <div class="flex items-center justify-center gap-1">
                      <a
                        [routerLink]="['/admin/tenants', tenant.id]"
                        class="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded shadow-sm hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
                        title="View details"
                      >
                        <span class="w-3.5 h-3.5">👁️</span>
                      </a>
                      <button
                        *ngIf="canUpdateTenants()"
                        [routerLink]="['/admin/tenants', tenant.id, 'edit']"
                        class="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-400 bg-gray-50 dark:bg-gray-900/20 rounded shadow-sm hover:bg-gray-100 dark:hover:bg-gray-900/30 transition"
                        title="Edit tenant"
                      >
                        <span class="w-3.5 h-3.5">✏️</span>
                      </button>
                      <button
                        *ngIf="canUpdateTenants()"
                        (click)="toggleTenantStatus(tenant)"
                        [class]="tenant.status === 'active'
                          ? 'inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 rounded shadow-sm hover:bg-orange-100 dark:hover:bg-orange-900/30 transition'
                          : 'inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded shadow-sm hover:bg-green-100 dark:hover:bg-green-900/30 transition'"
                        [title]="tenant.status === 'active' ? 'Suspend tenant' : 'Activate tenant'"
                      >
                        <span class="w-3.5 h-3.5">{{ tenant.status === 'active' ? '⏸️' : '▶️' }}</span>
                      </button>
                      <button
                        *ngIf="canDeleteTenants()"
                        (click)="deleteTenant(tenant)"
                        class="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded shadow-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                        title="Delete tenant"
                      >
                        <span class="w-3.5 h-3.5">🗑️</span>
                      </button>
                    </div>
                  </td>
                </tr>
              } @empty {
                <tr>
                  <td colspan="7" class="px-4 py-8 text-center">
                    <p class="text-xs text-gray-500 dark:text-gray-400">No tenants found</p>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div *ngIf="pagination().pages > 0" class="flex items-center justify-between px-3 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <div class="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
            <span>Show:</span>
            <select
              [(ngModel)]="pageSize"
              (ngModelChange)="onPageSizeChange()"
              class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option [value]="10">10</option>
              <option [value]="25">25</option>
              <option [value]="50">50</option>
              <option [value]="100">100</option>
            </select>
            <span>Showing {{ (pagination().page - 1) * pagination().limit + 1 }} to {{ Math.min(pagination().page * pagination().limit, pagination().total) }} of {{ pagination().total }}</span>
          </div>
          <div class="flex items-center gap-3">
            <button
              (click)="changePage(pagination().page - 1)"
              [disabled]="pagination().page === 1"
              class="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              ← Previous
            </button>
            <span class="text-xs text-gray-600 dark:text-gray-400">
              Page {{ pagination().page }} of {{ pagination().pages }}
            </span>
            <button
              (click)="changePage(pagination().page + 1)"
              [disabled]="pagination().page === pagination().pages"
              class="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              Next →
            </button>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class TenantsListComponent implements OnInit {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private confirmationService = inject(ConfirmationService);

  tenants = signal<Tenant[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  availablePlans = signal<string[]>([]);

  filters = {
    status: '',
    plan: ''
  };

  searchQuery = '';
  pageSize = 20;

  pagination = signal<Pagination>({
    page: 1,
    limit: 20,
    total: 0,
    pages: 0
  });

  stats = signal({
    active: 0,
    trial: 0,
    suspended: 0
  });

  Math = Math;

  // Permission checks
  canCreateTenants = computed(() => this.authService.hasPermission('tenants:create'));
  canUpdateTenants = computed(() => this.authService.hasPermission('tenants:update'));
  canDeleteTenants = computed(() => this.authService.hasPermission('tenants:delete'));

  ngOnInit(): void {
    console.log('🏢 TenantsListComponent initialized');
    this.loadPlans();
    this.loadTenants();
  }

  loadPlans(): void {
    // Load available subscription plans for the filter
    this.http.get<any>('/api/subscriptions/plans').subscribe({
      next: (response) => {
        const plans = response.data || response;
        // Extract unique plan names and filter out platform plans
        const uniquePlans = [...new Set(plans
          .filter((p: any) => p.product_type !== 'platform' && p.is_active)
          .map((p: any) => p.name)
        )] as string[];
        this.availablePlans.set(uniquePlans);
      },
      error: (err) => {
        console.error('Failed to load plans:', err);
        // Use fallback plans if API fails
        this.availablePlans.set(['Basic', 'Professional', 'Enterprise']);
      }
    });
  }

  loadTenants(): void {
    this.loading.set(true);
    this.error.set(null);

    const params: any = {
      page: this.pagination().page,
      limit: this.pagination().limit
    };

    if (this.filters.status) {
      params.status = this.filters.status;
    }

    if (this.filters.plan) {
      params.plan = this.filters.plan;
    }

    this.http.get<any>('/api/tenants', { params }).subscribe({
      next: (response) => {
        this.tenants.set(response.data || []);
        this.pagination.set(response.pagination);
        this.calculateStats(response.data || []);
        this.loading.set(false);
      },
      error: (err) => {
        this.error.set(err.error?.message || 'Failed to load tenants');
        this.loading.set(false);
        console.error('Error loading tenants:', err);
      }
    });
  }

  calculateStats(tenants: Tenant[]): void {
    this.stats.set({
      active: tenants.filter(t => t.status === 'active').length,
      trial: tenants.filter(t => t.status === 'trial').length,
      suspended: tenants.filter(t => t.status === 'suspended').length
    });
  }

  onSearch(): void {
    // Reset to first page when searching
    this.pagination.update(p => ({ ...p, page: 1 }));
    this.loadTenants();
  }

  hasActiveFilters(): boolean {
    return this.searchQuery.trim() !== '' || this.filters.status !== '' || this.filters.plan !== '';
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.filters.status = '';
    this.filters.plan = '';
    this.pagination.update(p => ({ ...p, page: 1 }));
    this.loadTenants();
  }

  resetToFirstPage(): void {
    this.pagination.update(p => ({ ...p, page: 1 }));
  }

  onPageSizeChange(): void {
    this.pagination.update(p => ({ ...p, limit: this.pageSize, page: 1 }));
    this.loadTenants();
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  changePage(page: number): void {
    this.pagination.update(p => ({ ...p, page }));
    this.loadTenants();
  }

  async toggleTenantStatus(tenant: Tenant): Promise<void> {
    const newStatus = tenant.status === 'active' ? 'suspended' : 'active';
    const action = newStatus === 'active' ? 'activate' : 'suspend';

    const confirmed = await this.confirmationService.confirm({
      title: `${action === 'activate' ? 'Activate' : 'Suspend'} Tenant`,
      message: `Are you sure you want to ${action} "${tenant.name}"?${
        action === 'suspend'
          ? ' Users will lose access to this tenant.'
          : ' Users will regain access to this tenant.'
      }`,
      confirmText: action === 'activate' ? 'Activate' : 'Suspend',
      cancelText: 'Cancel',
      type: action === 'activate' ? 'success' : 'warning',
      icon: action === 'activate' ? 'enable' : 'disable'
    });

    if (!confirmed) {
      return;
    }

    const endpoint = `/api/tenants/${tenant.id}/${action}`;

    this.http.put<any>(endpoint, { reason: `Manual ${action}` }).subscribe({
      next: () => {
        this.loadTenants();
      },
      error: (err) => {
        console.error(`Error ${action}ing tenant:`, err);
      }
    });
  }

  suspendTenant(tenant: Tenant): void {
    // Legacy method - redirect to toggleTenantStatus
    this.toggleTenantStatus(tenant);
  }

  async deleteTenant(tenant: Tenant): Promise<void> {
    const confirmed = await this.confirmationService.confirm({
      title: 'Delete Tenant',
      message: `Are you sure you want to delete "${tenant.name}"? This will mark the tenant and all associated data as deleted. This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      icon: 'trash'
    });

    if (!confirmed) return;

    try {
      await this.http.delete<any>(`/api/tenants/${tenant.id}`).toPromise();
      console.log(`✅ Tenant deleted: ${tenant.name}`);
      this.loadTenants();
    } catch (error) {
      console.error('❌ Error deleting tenant:', error);
      await this.confirmationService.confirm({
        title: 'Error',
        message: 'Failed to delete tenant. Please try again.',
        confirmText: 'OK',
        type: 'danger',
        icon: 'error'
      });
    }
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
}
