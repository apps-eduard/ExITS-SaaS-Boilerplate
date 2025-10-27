import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface Subscription {
  id: number;
  tenantName: string;
  tenantId: number;
  planName: string;
  status: 'active' | 'cancelled' | 'expired' | 'suspended';
  startedAt: string;
  expiresAt: string;
  price: number;
  billingCycle: string;
  nextBillingDate?: string;
}

@Component({
  selector: 'app-subscriptions-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="p-4 sm:p-6 space-y-4">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span class="text-xl">📊</span>
            All Subscriptions
          </h1>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Manage and monitor all customer subscriptions
          </p>
        </div>
        <button
          routerLink="/admin/subscriptions/new"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-600 text-white rounded hover:bg-primary-700 transition shadow-sm"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          New Subscription
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Active</p>
              <p class="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{{ getStatusCount('active') }}</p>
            </div>
            <span class="text-2xl">✅</span>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Suspended</p>
              <p class="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{{ getStatusCount('suspended') }}</p>
            </div>
            <span class="text-2xl">⏸️</span>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Cancelled</p>
              <p class="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{{ getStatusCount('cancelled') }}</p>
            </div>
            <span class="text-2xl">❌</span>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Expired</p>
              <p class="text-2xl font-bold text-gray-600 dark:text-gray-400 mt-1">{{ getStatusCount('expired') }}</p>
            </div>
            <span class="text-2xl">⏱️</span>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          <!-- Search -->
          <div class="lg:col-span-2">
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
            <div class="relative">
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (ngModelChange)="resetPagination()"
                placeholder="Search by tenant or plan..."
                class="w-full pl-9 pr-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
          </div>

          <!-- Status Filter -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              [(ngModel)]="statusFilter"
              (ngModelChange)="resetPagination()"
              class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="active">✅ Active</option>
              <option value="suspended">⏸️ Suspended</option>
              <option value="cancelled">❌ Cancelled</option>
              <option value="expired">⏱️ Expired</option>
            </select>
          </div>

          <!-- Billing Cycle Filter -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Billing Cycle</label>
            <select
              [(ngModel)]="cycleFilter"
              (ngModelChange)="resetPagination()"
              class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Cycles</option>
              <option value="monthly">📅 Monthly</option>
              <option value="quarterly">📆 Quarterly</option>
              <option value="yearly">🗓️ Yearly</option>
            </select>
          </div>

          <!-- Clear Filters Button -->
          <div class="flex items-end">
            <button
              (click)="clearFilters()"
              [disabled]="!hasActiveFilters()"
              class="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <!-- Subscriptions Table -->
      @if (loading()) {
        <div class="flex items-center justify-center py-12">
          <div class="text-center">
            <div class="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Loading subscriptions...</p>
          </div>
        </div>
      } @else if (error()) {
        <div class="bg-red-50 dark:bg-red-900/10 border border-red-200 dark:border-red-900 rounded-lg p-4">
          <p class="text-sm text-red-800 dark:text-red-200">{{ error() }}</p>
        </div>
      } @else if (filteredSubscriptions().length === 0) {
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <span class="text-5xl mb-4 block">💳</span>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">No subscriptions found</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
            @if (hasActiveFilters()) {
              Try adjusting your filters
            } @else {
              No subscriptions have been created yet
            }
          </p>
          @if (hasActiveFilters()) {
            <button
              (click)="clearFilters()"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-600 text-white rounded hover:bg-primary-700 transition"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
              Clear Filters
            </button>
          }
        </div>
      } @else {
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
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
                      <span class="w-3.5 h-3.5">📋</span>
                      Plan
                    </span>
                  </th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <span class="inline-flex items-center gap-1">
                      <span class="w-3.5 h-3.5">🔘</span>
                      Status
                    </span>
                  </th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <span class="inline-flex items-center gap-1">
                      <span class="w-3.5 h-3.5">📅</span>
                      Started
                    </span>
                  </th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <span class="inline-flex items-center gap-1">
                      <span class="w-3.5 h-3.5">⏰</span>
                      Expires
                    </span>
                  </th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <span class="inline-flex items-center gap-1">
                      <span class="w-3.5 h-3.5">💰</span>
                      Amount
                    </span>
                  </th>
                  <th class="px-3 py-2 text-right text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                    <span class="inline-flex items-center gap-1">
                      <span class="w-3.5 h-3.5">⚙️</span>
                      Actions
                    </span>
                  </th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                @for (sub of paginatedSubscriptions(); track sub.id) {
                  <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <td class="px-3 py-2">
                      <span class="font-medium text-gray-900 dark:text-white text-xs">{{ sub.tenantName }}</span>
                    </td>
                    <td class="px-3 py-2">
                      <div class="flex flex-col">
                        <span class="font-medium text-gray-900 dark:text-white text-xs">{{ sub.planName }}</span>
                        <span class="text-xs text-gray-500 dark:text-gray-400">{{ getBillingCycleLabel(sub.billingCycle) }}</span>
                      </div>
                    </td>
                    <td class="px-3 py-2">
                      <span
                        class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full"
                        [class]="getStatusClass(sub.status)"
                      >
                        {{ getStatusIcon(sub.status) }} {{ sub.status }}
                      </span>
                    </td>
                    <td class="px-3 py-2 text-xs text-gray-900 dark:text-white">{{ formatDate(sub.startedAt) }}</td>
                    <td class="px-3 py-2 text-xs text-gray-900 dark:text-white">{{ formatDate(sub.expiresAt) }}</td>
                    <td class="px-3 py-2">
                      <span class="font-medium text-gray-900 dark:text-white text-xs">
                        {{ '$' + (sub.price || 0).toFixed(2) }}
                      </span>
                    </td>
                    <td class="px-3 py-2">
                      <div class="flex items-center justify-end gap-1">
                        <button
                          [routerLink]="['/admin/tenants', sub.tenantId]"
                          class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition"
                          title="View Tenant"
                        >
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                          </svg>
                        </button>
                        @if (sub.status === 'active') {
                          <button
                            (click)="suspendSubscription(sub.id)"
                            class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded transition"
                            title="Suspend"
                          >
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6"/>
                            </svg>
                          </button>
                        }
                        @if (sub.status === 'active' || sub.status === 'suspended') {
                          <button
                            (click)="cancelSubscription(sub.id)"
                            class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                            title="Cancel"
                          >
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          <div class="flex items-center justify-between px-3 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
            <div class="flex items-center gap-3 text-xs text-gray-600 dark:text-gray-400">
              <span>Show:</span>
              <select
                [(ngModel)]="pageSize"
                (ngModelChange)="onPageSizeChange()"
                class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              >
                <option [value]="10">10</option>
                <option [value]="25">25</option>
                <option [value]="50">50</option>
                <option [value]="100">100</option>
              </select>
              <span>Showing {{ getStartIndex() + 1 }} to {{ getEndIndex() }} of {{ filteredSubscriptions().length }}</span>
            </div>
            <div class="flex items-center gap-3">
              <button
                (click)="previousPage()"
                [disabled]="currentPage === 1"
                class="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                ← Previous
              </button>
              <span class="text-xs text-gray-600 dark:text-gray-400">
                Page {{ currentPage }} of {{ totalPages }}
              </span>
              <button
                (click)="nextPage()"
                [disabled]="currentPage === totalPages"
                class="px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                Next →
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class SubscriptionsListComponent implements OnInit {
  private http = inject(HttpClient);

  subscriptions = signal<Subscription[]>([]);
  loading = signal(false);
  error = signal<string | null>(null);
  searchQuery = '';
  statusFilter = 'all';
  cycleFilter = 'all';

  currentPage = 1;
  pageSize = 10;

  filteredSubscriptions = computed(() => {
    let filtered = this.subscriptions();

    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(s =>
        s.tenantName.toLowerCase().includes(query) ||
        s.planName.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(s => s.status === this.statusFilter);
    }

    // Cycle filter
    if (this.cycleFilter !== 'all') {
      filtered = filtered.filter(s => s.billingCycle === this.cycleFilter);
    }

    return filtered;
  });

  get totalPages(): number {
    return Math.ceil(this.filteredSubscriptions().length / this.pageSize) || 1;
  }

  paginatedSubscriptions = computed(() => {
    const start = (this.currentPage - 1) * this.pageSize;
    const end = start + this.pageSize;
    return this.filteredSubscriptions().slice(start, end);
  });

  ngOnInit() {
    this.loadSubscriptions();
  }

  loadSubscriptions() {
    this.loading.set(true);
    this.error.set(null);
    
    this.http.get<any>('/api/billing/subscriptions').subscribe({
      next: (response) => {
        const subscriptions = response.data || response;
        this.subscriptions.set(subscriptions.map((sub: any) => ({
          id: sub.id,
          tenantName: sub.tenant_name,
          tenantId: sub.tenant_id,
          planName: sub.plan_name,
          status: sub.status,
          startedAt: sub.started_at,
          expiresAt: sub.expires_at,
          price: parseFloat(sub.price || sub.plan_price || 0),
          billingCycle: sub.billing_cycle,
          nextBillingDate: sub.next_billing_date
        })));
        this.loading.set(false);
      },
      error: (err) => {
        console.error('Error loading subscriptions:', err);
        this.error.set(err.error?.message || 'Failed to load subscriptions');
        this.loading.set(false);
      }
    });
  }

  getStatusCount(status: string): number {
    return this.subscriptions().filter(s => s.status === status).length;
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      active: '✅',
      suspended: '⏸️',
      cancelled: '❌',
      expired: '⏱️'
    };
    return icons[status] || '❓';
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      active: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
      suspended: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300',
      cancelled: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300',
      expired: 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300'
    };
    return classes[status] || '';
  }

  getBillingCycleLabel(cycle: string): string {
    const labels: Record<string, string> = {
      monthly: '📅 Monthly',
      quarterly: '📆 Quarterly',
      yearly: '🗓️ Yearly',
      one_time: '⚡ One-time'
    };
    return labels[cycle] || cycle;
  }

  formatDate(date: string): string {
    if (!date) return '-';
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  getStartIndex(): number {
    return (this.currentPage - 1) * this.pageSize;
  }

  getEndIndex(): number {
    const end = this.currentPage * this.pageSize;
    return Math.min(end, this.filteredSubscriptions().length);
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages) {
      this.currentPage++;
    }
  }

  hasActiveFilters(): boolean {
    return this.searchQuery.trim() !== '' || this.statusFilter !== 'all' || this.cycleFilter !== 'all';
  }

  clearFilters() {
    this.searchQuery = '';
    this.statusFilter = 'all';
    this.cycleFilter = 'all';
    this.resetPagination();
  }

  resetPagination() {
    this.currentPage = 1;
  }

  onPageSizeChange() {
    this.resetPagination();
  }

  suspendSubscription(id: number) {
    if (!confirm('Are you sure you want to suspend this subscription?')) {
      return;
    }
    // TODO: Implement suspend API call
    console.log('Suspend subscription:', id);
  }

  cancelSubscription(id: number) {
    if (!confirm('Are you sure you want to cancel this subscription?')) {
      return;
    }
    
    this.http.post(`/api/billing/subscriptions/${id}/cancel`, {}).subscribe({
      next: () => {
        this.loadSubscriptions();
      },
      error: (err) => {
        alert(err.error?.message || 'Failed to cancel subscription');
      }
    });
  }
}
