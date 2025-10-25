import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';

interface SubscriptionHistory {
  id: number;
  tenant_id: number;
  tenant_name: string;
  plan_id: number | null;
  plan_name: string | null;
  product_type: string;
  status: string;
  monthly_price: string;
  started_at: string;
  expires_at: string | null;
  cancelled_at?: string | null;
  cancellation_reason?: string | null;
  created_at: string;
  updated_at: string;
}

@Component({
  selector: 'app-subscription-history',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div>
      <!-- Filters -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
          <!-- Status Filter -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              [(ngModel)]="statusFilter"
              class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="cancelled">Cancelled</option>
              <option value="expired">Expired</option>
            </select>
          </div>

          <!-- Tenant Filter -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Tenant
            </label>
            <select
              [(ngModel)]="tenantIdFilter"
              class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Tenants</option>
              <option *ngFor="let tenant of uniqueTenants()" [value]="tenant.id">
                {{ tenant.name }}
              </option>
            </select>
          </div>

          <!-- Plan Filter -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Plan
            </label>
            <select
              [(ngModel)]="planIdFilter"
              class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Plans</option>
              <option *ngFor="let plan of uniquePlans()" [value]="plan.id">
                {{ plan.name }}
              </option>
            </select>
          </div>

          <!-- Date Range -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Date Range
            </label>
            <select
              [(ngModel)]="dateRangeFilter"
              class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option value="">All Time</option>
              <option value="30">Last 30 Days</option>
              <option value="90">Last 90 Days</option>
              <option value="365">Last Year</option>
            </select>
          </div>
        </div>

        <!-- Summary Stats -->
        <div class="grid grid-cols-2 sm:grid-cols-4 gap-3 mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
          <div class="text-center">
            <div class="text-lg font-semibold text-gray-900 dark:text-white">{{ stats().total }}</div>
            <div class="text-xs text-gray-600 dark:text-gray-400">Total</div>
          </div>
          <div class="text-center">
            <div class="text-lg font-semibold text-green-600 dark:text-green-400">{{ stats().active }}</div>
            <div class="text-xs text-gray-600 dark:text-gray-400">Active</div>
          </div>
          <div class="text-center">
            <div class="text-lg font-semibold text-red-600 dark:text-red-400">{{ stats().cancelled }}</div>
            <div class="text-xs text-gray-600 dark:text-gray-400">Cancelled</div>
          </div>
          <div class="text-center">
            <div class="text-lg font-semibold text-orange-600 dark:text-orange-400">{{ stats().expired }}</div>
            <div class="text-xs text-gray-600 dark:text-gray-400">Expired</div>
          </div>
        </div>
      </div>

      <!-- Table -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Tenant</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Plan</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Product Type</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Status</th>
                <th class="px-3 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">Price</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Started</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Expires</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Cancelled</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Reason</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr *ngIf="loading()" class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td colspan="9" class="px-3 py-4 text-center text-xs text-gray-500 dark:text-gray-400">
                  Loading subscriptions...
                </td>
              </tr>
              <tr *ngIf="!loading() && filteredSubscriptions().length === 0" class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                <td colspan="9" class="px-3 py-4 text-center text-xs text-gray-500 dark:text-gray-400">
                  No subscriptions found
                </td>
              </tr>
              <tr *ngFor="let sub of filteredSubscriptions()" class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                <td class="px-3 py-2 text-xs text-gray-900 dark:text-white">
                  {{ sub.tenant_name }}
                </td>
                <td class="px-3 py-2 text-xs text-gray-900 dark:text-white">
                  {{ sub.plan_name }}
                </td>
                <td class="px-3 py-2">
                  <span [ngClass]="{
                    'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400': sub.product_type === 'platform',
                    'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400': sub.product_type === 'money_loan',
                    'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-400': sub.product_type === 'bnpl',
                    'bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-400': sub.product_type === 'pawnshop'
                  }" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium">
                    {{ getProductTypeLabel(sub.product_type) }}
                  </span>
                </td>
                <td class="px-3 py-2">
                  <span [class]="getStatusClass(sub.status)" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium">
                    {{ sub.status }}
                  </span>
                </td>
                <td class="px-3 py-2 text-right text-xs text-gray-900 dark:text-white">
                  ₱{{ sub.monthly_price }}
                </td>
                <td class="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                  {{ formatDate(sub.started_at) }}
                </td>
                <td class="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                  {{ sub.expires_at ? formatDate(sub.expires_at) : '-' }}
                </td>
                <td class="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                  {{ sub.cancelled_at ? formatDate(sub.cancelled_at) : '-' }}
                </td>
                <td class="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">
                  {{ sub.cancellation_reason || '-' }}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      <!-- Export Button -->
      <div class="mt-4 flex justify-end">
        <button
          (click)="exportToCSV()"
          type="button"
          class="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded shadow-sm transition text-white bg-blue-600 hover:bg-blue-700"
        >
          <svg class="w-3.5 h-3.5 mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
          </svg>
          Export to CSV
        </button>
      </div>
    </div>
  `
})
export class SubscriptionHistoryComponent implements OnInit {
  private http = inject(HttpClient);

  subscriptions = signal<SubscriptionHistory[]>([]);
  loading = signal<boolean>(true);

  // Filters as signals so computed() can track changes
  statusFilter = signal<string>('');
  tenantIdFilter = signal<string>('');
  planIdFilter = signal<string>('');
  dateRangeFilter = signal<string>('');

  ngOnInit(): void {
    this.loadSubscriptions();
  }

  loadSubscriptions(): void {
    this.loading.set(true);
    this.http.get<{ success: boolean; data: SubscriptionHistory[] }>('/api/reports/subscription-history')
      .subscribe({
        next: (response: any) => {
          console.log('Loaded subscriptions:', response.data);
          this.subscriptions.set(response.data || []);
          this.loading.set(false);
        },
        error: (err: any) => {
          console.error('Error loading subscriptions:', err);
          this.loading.set(false);
        }
      });
  }

  filteredSubscriptions = computed(() => {
    let subs = this.subscriptions();

    // Filter by status
    const status = this.statusFilter();
    if (status) {
      subs = subs.filter(s => s.status === status);
    }

    // Filter by tenant
    const tenantId = this.tenantIdFilter();
    if (tenantId) {
      subs = subs.filter(s => s.tenant_id === Number(tenantId));
    }

    // Filter by plan
    const planId = this.planIdFilter();
    if (planId) {
      subs = subs.filter(s => s.plan_id === Number(planId));
    }

    // Filter by date range
    const dateRange = this.dateRangeFilter();
    if (dateRange) {
      const days = Number(dateRange);
      const cutoffDate = new Date();
      cutoffDate.setDate(cutoffDate.getDate() - days);
      subs = subs.filter(s => new Date(s.started_at) >= cutoffDate);
    }

    return subs;
  });

  uniqueTenants = computed(() => {
    const tenantsMap = new Map();
    this.subscriptions().forEach(sub => {
      if (!tenantsMap.has(sub.tenant_id)) {
        tenantsMap.set(sub.tenant_id, { id: sub.tenant_id, name: sub.tenant_name });
      }
    });
    return Array.from(tenantsMap.values());
  });

  uniquePlans = computed(() => {
    const plansMap = new Map();
    this.subscriptions().forEach(sub => {
      // Only add plans that have both id and name
      if (sub.plan_id && sub.plan_name && !plansMap.has(sub.plan_id)) {
        plansMap.set(sub.plan_id, { id: sub.plan_id, name: sub.plan_name });
      }
    });
    const plans = Array.from(plansMap.values()).sort((a, b) => a.name.localeCompare(b.name));
    console.log('Unique plans:', plans);
    return plans;
  });

  stats = computed(() => {
    const subs = this.filteredSubscriptions();
    return {
      total: subs.length,
      active: subs.filter(s => s.status === 'active').length,
      cancelled: subs.filter(s => s.status === 'cancelled').length,
      expired: subs.filter(s => s.status === 'expired').length
    };
  });

  getStatusClass(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
      case 'cancelled':
        return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
      case 'expired':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
      default:
        return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    }
  }

  getProductTypeLabel(productType: string): string {
    const labels: Record<string, string> = {
      platform: 'Platform',
      money_loan: 'Money Loan',
      bnpl: 'BNPL',
      pawnshop: 'Pawnshop',
    };
    return labels[productType] || productType;
  }

  formatDate(dateString: string): string {
    if (!dateString) return '-';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  exportToCSV(): void {
    const subs = this.filteredSubscriptions();
    const headers = ['Tenant', 'Plan', 'Product Type', 'Status', 'Price', 'Started', 'Expires', 'Cancelled', 'Reason'];
    const rows = subs.map(s => [
      s.tenant_name,
      s.plan_name,
      this.getProductTypeLabel(s.product_type),
      s.status,
      s.monthly_price,
      this.formatDate(s.started_at),
      s.expires_at ? this.formatDate(s.expires_at) : '',
      s.cancelled_at ? this.formatDate(s.cancelled_at) : '',
      s.cancellation_reason || ''
    ]);

    const csv = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csv], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `subscription-history-${new Date().toISOString().split('T')[0]}.csv`;
    a.click();
    window.URL.revokeObjectURL(url);
  }
}
