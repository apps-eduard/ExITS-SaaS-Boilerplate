import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface Subscription {
  id: number;
  subscriberName: string;
  subscriberEmail: string;
  planName: string;
  status: 'active' | 'canceled' | 'expired' | 'paused';
  startDate: string;
  endDate: string;
  paymentMethod: string;
  amount: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly' | 'quarterly';
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
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">All Subscriptions</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
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
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Paused</p>
              <p class="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{{ getStatusCount('paused') }}</p>
            </div>
            <span class="text-2xl">⏸️</span>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Canceled</p>
              <p class="text-2xl font-bold text-red-600 dark:text-red-400 mt-1">{{ getStatusCount('canceled') }}</p>
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
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Search -->
          <div class="lg:col-span-2">
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
            <div class="relative">
              <input
                type="text"
                [(ngModel)]="searchQuery"
                placeholder="Search by subscriber or plan..."
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
              class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="active">✅ Active</option>
              <option value="paused">⏸️ Paused</option>
              <option value="canceled">❌ Canceled</option>
              <option value="expired">⏱️ Expired</option>
            </select>
          </div>

          <!-- Billing Cycle Filter -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Billing Cycle</label>
            <select
              [(ngModel)]="cycleFilter"
              class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Cycles</option>
              <option value="monthly">📅 Monthly</option>
              <option value="quarterly">📆 Quarterly</option>
              <option value="yearly">🗓️ Yearly</option>
            </select>
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
      } @else if (filteredSubscriptions().length === 0) {
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <span class="text-5xl mb-4 block">💳</span>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">No subscriptions found</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
            @if (searchQuery || statusFilter !== 'all' || cycleFilter !== 'all') {
              Try adjusting your filters
            } @else {
              Get started by creating your first subscription
            }
          </p>
          <button
            routerLink="/admin/subscriptions/new"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-600 text-white rounded hover:bg-primary-700 transition"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Create First Subscription
          </button>
        </div>
      } @else {
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full text-sm">
              <thead class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Subscriber</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Plan</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Status</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Start Date</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">End Date</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Amount</th>
                  <th class="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Payment</th>
                  <th class="px-4 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                @for (sub of paginatedSubscriptions(); track sub.id) {
                  <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                    <td class="px-4 py-3">
                      <div class="flex flex-col">
                        <span class="font-medium text-gray-900 dark:text-white text-xs">{{ sub.subscriberName }}</span>
                        <span class="text-xs text-gray-500 dark:text-gray-400">{{ sub.subscriberEmail }}</span>
                      </div>
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex flex-col">
                        <span class="font-medium text-gray-900 dark:text-white text-xs">{{ sub.planName }}</span>
                        <span class="text-xs text-gray-500 dark:text-gray-400">{{ getBillingCycleLabel(sub.billingCycle) }}</span>
                      </div>
                    </td>
                    <td class="px-4 py-3">
                      <span
                        class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium rounded-full"
                        [class]="getStatusClass(sub.status)"
                      >
                        {{ getStatusIcon(sub.status) }} {{ sub.status }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-xs text-gray-900 dark:text-white">{{ formatDate(sub.startDate) }}</td>
                    <td class="px-4 py-3 text-xs text-gray-900 dark:text-white">{{ formatDate(sub.endDate) }}</td>
                    <td class="px-4 py-3">
                      <span class="font-medium text-gray-900 dark:text-white text-xs">
                        {{ sub.currency }} {{ sub.amount.toFixed(2) }}
                      </span>
                    </td>
                    <td class="px-4 py-3">
                      <span class="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                        {{ sub.paymentMethod }}
                      </span>
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex items-center justify-end gap-1">
                        <button
                          class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition"
                          title="View Details"
                        >
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                          </svg>
                        </button>
                        @if (sub.status === 'active') {
                          <button
                            class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-yellow-600 dark:text-yellow-400 hover:bg-yellow-50 dark:hover:bg-yellow-900/20 rounded transition"
                            title="Pause"
                          >
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 9v6m4-6v6"/>
                            </svg>
                          </button>
                          <button
                            class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded transition"
                            title="Upgrade"
                          >
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 10l7-7m0 0l7 7m-7-7v18"/>
                            </svg>
                          </button>
                        }
                        @if (sub.status === 'active' || sub.status === 'paused') {
                          <button
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
          <div class="border-t border-gray-200 dark:border-gray-700 px-4 py-3 bg-gray-50 dark:bg-gray-900">
            <div class="flex items-center justify-between">
              <div class="text-xs text-gray-500 dark:text-gray-400">
                Showing {{ getStartIndex() + 1 }} to {{ getEndIndex() }} of {{ filteredSubscriptions().length }} subscriptions
              </div>
              <div class="flex items-center gap-2">
                <button
                  (click)="previousPage()"
                  [disabled]="currentPage === 1"
                  class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
                  </svg>
                  Previous
                </button>
                <span class="text-xs text-gray-700 dark:text-gray-300">
                  Page {{ currentPage }} of {{ totalPages }}
                </span>
                <button
                  (click)="nextPage()"
                  [disabled]="currentPage === totalPages"
                  class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
                  </svg>
                </button>
              </div>
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
        s.subscriberName.toLowerCase().includes(query) ||
        s.subscriberEmail.toLowerCase().includes(query) ||
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
    return Math.ceil(this.filteredSubscriptions().length / this.pageSize);
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
    // Mock data
    setTimeout(() => {
      this.subscriptions.set([
        {
          id: 1,
          subscriberName: 'Acme Corporation',
          subscriberEmail: 'contact@acme.com',
          planName: 'Enterprise Plan',
          status: 'active',
          startDate: '2024-01-15',
          endDate: '2025-01-15',
          paymentMethod: 'Credit Card',
          amount: 299.99,
          currency: 'USD',
          billingCycle: 'monthly'
        },
        {
          id: 2,
          subscriberName: 'TechStart Inc',
          subscriberEmail: 'billing@techstart.com',
          planName: 'Professional Plan',
          status: 'active',
          startDate: '2024-03-01',
          endDate: '2025-03-01',
          paymentMethod: 'PayPal',
          amount: 149.99,
          currency: 'USD',
          billingCycle: 'monthly'
        },
        {
          id: 3,
          subscriberName: 'Global Solutions',
          subscriberEmail: 'admin@globalsol.com',
          planName: 'Business Plan',
          status: 'paused',
          startDate: '2024-02-10',
          endDate: '2025-02-10',
          paymentMethod: 'Bank Transfer',
          amount: 499.99,
          currency: 'USD',
          billingCycle: 'yearly'
        },
        {
          id: 4,
          subscriberName: 'Startup Hub',
          subscriberEmail: 'finance@startuphub.io',
          planName: 'Starter Plan',
          status: 'canceled',
          startDate: '2024-01-01',
          endDate: '2024-12-31',
          paymentMethod: 'Credit Card',
          amount: 49.99,
          currency: 'USD',
          billingCycle: 'monthly'
        },
        {
          id: 5,
          subscriberName: 'Digital Ventures',
          subscriberEmail: 'ops@digitalventures.com',
          planName: 'Premium Plan',
          status: 'expired',
          startDate: '2023-06-15',
          endDate: '2024-06-15',
          paymentMethod: 'Credit Card',
          amount: 199.99,
          currency: 'USD',
          billingCycle: 'quarterly'
        }
      ]);
      this.loading.set(false);
    }, 500);
  }

  getStatusCount(status: string): number {
    return this.subscriptions().filter(s => s.status === status).length;
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      active: '✅',
      paused: '⏸️',
      canceled: '❌',
      expired: '⏱️'
    };
    return icons[status] || '❓';
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      active: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
      paused: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300',
      canceled: 'bg-red-50 dark:bg-red-900/20 text-red-700 dark:text-red-300',
      expired: 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300'
    };
    return classes[status] || '';
  }

  getBillingCycleLabel(cycle: string): string {
    const labels: Record<string, string> = {
      monthly: '📅 Monthly',
      quarterly: '📆 Quarterly',
      yearly: '🗓️ Yearly'
    };
    return labels[cycle] || cycle;
  }

  formatDate(date: string): string {
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
}
