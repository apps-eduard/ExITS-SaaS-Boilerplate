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
  max_users: number;
  created_at: string;
  user_count?: number;
  role_count?: number;
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
    <div class="p-6 space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">🏢 Tenant Management</h1>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
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
      <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800">
        <div class="p-3">
          <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
              <select
                [(ngModel)]="filters.status"
                (change)="loadTenants()"
                class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Status</option>
                <option value="active">Active</option>
                <option value="suspended">Suspended</option>
                <option value="trial">Trial</option>
              </select>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Plan</label>
              <select
                [(ngModel)]="filters.plan"
                (change)="loadTenants()"
                class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
              >
                <option value="">All Plans</option>
                <option value="basic">Basic</option>
                <option value="professional">Professional</option>
                <option value="enterprise">Enterprise</option>
              </select>
            </div>

            <div class="md:col-span-2">
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (input)="onSearch()"
                placeholder="Search by name or subdomain..."
                class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
              />
            </div>
          </div>
        </div>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
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
      <div *ngIf="!loading() && !error()" class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Tenant</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Subdomain</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Plan</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th class="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Users</th>
                <th class="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Created</th>
                <th class="px-4 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              @for (tenant of tenants(); track tenant.id) {
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                  <td class="px-4 py-2.5">
                    <div>
                      <p class="text-xs font-medium text-gray-900 dark:text-white">{{ tenant.name }}</p>
                      <p class="text-[10px] text-gray-500 dark:text-gray-400">ID: {{ tenant.id }}</p>
                    </div>
                  </td>
                  <td class="px-4 py-2.5">
                    <code class="text-xs text-blue-600 dark:text-blue-400">{{ tenant.subdomain }}</code>
                  </td>
                  <td class="px-4 py-2.5">
                    <span class="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded" [ngClass]="getPlanClass(tenant.plan)">
                      {{ tenant.plan.toUpperCase() }}
                    </span>
                  </td>
                  <td class="px-4 py-2.5">
                    <span class="inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded" [ngClass]="getStatusClass(tenant.status)">
                      {{ tenant.status.toUpperCase() }}
                    </span>
                  </td>
                  <td class="px-4 py-2.5">
                    <span class="text-xs text-gray-900 dark:text-white">{{ tenant.user_count || 0 }} / {{ tenant.max_users }}</span>
                  </td>
                  <td class="px-4 py-2.5">
                    <span class="text-xs text-gray-600 dark:text-gray-400">{{ formatDate(tenant.created_at) }}</span>
                  </td>
                  <td class="px-4 py-2.5">
                    <div class="flex items-center justify-center gap-2">
                      <a
                        [routerLink]="['/admin/tenants', tenant.id]"
                        class="inline-flex items-center gap-1 text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 text-xs font-medium"
                        title="View details"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                        </svg>
                        View
                      </a>
                      <button
                        *ngIf="canUpdateTenants()"
                        [routerLink]="['/admin/tenants', tenant.id, 'edit']"
                        class="inline-flex items-center gap-1 text-gray-600 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-300 text-xs font-medium"
                        title="Edit tenant"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                        Edit
                      </button>
                      <button
                        *ngIf="canUpdateTenants()"
                        (click)="toggleTenantStatus(tenant)"
                        [class]="tenant.status === 'active'
                          ? 'inline-flex items-center gap-1 text-orange-600 dark:text-orange-400 hover:text-orange-800 dark:hover:text-orange-300 text-xs font-medium'
                          : 'inline-flex items-center gap-1 text-green-600 dark:text-green-400 hover:text-green-800 dark:hover:text-green-300 text-xs font-medium'"
                        [title]="tenant.status === 'active' ? 'Suspend tenant' : 'Activate tenant'"
                      >
                        <svg *ngIf="tenant.status === 'active'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
                        </svg>
                        <svg *ngIf="tenant.status !== 'active'" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        {{ tenant.status === 'active' ? 'Suspend' : 'Activate' }}
                      </button>
                      <button
                        *ngIf="canDeleteTenants()"
                        (click)="deleteTenant(tenant)"
                        class="inline-flex items-center gap-1 text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 text-xs font-medium"
                        title="Delete tenant"
                      >
                        <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                        Delete
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
        <div *ngIf="pagination().pages > 1" class="px-4 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900">
          <div class="flex items-center justify-between">
            <p class="text-xs text-gray-600 dark:text-gray-400">
              Showing {{ (pagination().page - 1) * pagination().limit + 1 }} to {{ Math.min(pagination().page * pagination().limit, pagination().total) }} of {{ pagination().total }} results
            </p>
            <div class="flex items-center gap-2">
              <button
                (click)="changePage(pagination().page - 1)"
                [disabled]="pagination().page === 1"
                class="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
                </svg>
                Previous
              </button>
              <span class="text-xs text-gray-600 dark:text-gray-400">
                Page {{ pagination().page }} of {{ pagination().pages }}
              </span>
              <button
                (click)="changePage(pagination().page + 1)"
                [disabled]="pagination().page === pagination().pages"
                class="inline-flex items-center gap-1.5 px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Next
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
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

  filters = {
    status: '',
    plan: ''
  };

  searchQuery = '';

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
    this.loadTenants();
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
    // Implement search debouncing if needed
    this.loadTenants();
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

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }
}
