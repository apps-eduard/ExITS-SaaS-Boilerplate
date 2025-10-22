import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface Subscription {
  id: number;
  tenant_id: number;
  tenant_name: string;
  plan_id: number;
  plan_name: string;
  plan_price: number;
  billing_cycle: string;
  status: string;
  start_date: string;
  end_date: string | null;
  auto_renew: boolean;
}

@Component({
  selector: 'app-billing-subscriptions',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4 space-y-4 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">Tenant Subscriptions</h1>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Manage tenant subscription plans</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            (click)="goBack()"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back
          </button>
          <button
            (click)="refresh()"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            Refresh
          </button>
        </div>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }

      <!-- Table -->
      @if (!loading()) {
        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="w-full">
              <thead class="bg-gray-50 dark:bg-gray-700/50 border-b border-gray-200 dark:border-gray-700">
                <tr>
                  <th class="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Tenant</th>
                  <th class="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Plan</th>
                  <th class="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Price</th>
                  <th class="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Status</th>
                  <th class="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Start Date</th>
                  <th class="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">End Date</th>
                  <th class="px-3 py-2 text-left text-xs font-semibold text-gray-700 dark:text-gray-300">Auto Renew</th>
                  <th class="px-3 py-2 text-right text-xs font-semibold text-gray-700 dark:text-gray-300">Actions</th>
                </tr>
              </thead>
              <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                @for (sub of subscriptions(); track sub.id) {
                  <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/30 transition-colors">
                    <td class="px-3 py-2 text-xs text-gray-900 dark:text-white font-medium">{{ sub.tenant_name }}</td>
                    <td class="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">{{ sub.plan_name }}</td>
                    <td class="px-3 py-2 text-xs text-gray-900 dark:text-white font-medium">\${{ sub.plan_price }}/{{ sub.billing_cycle }}</td>
                    <td class="px-3 py-2">
                      <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                            [ngClass]="{
                              'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300': sub.status === 'active',
                              'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-300': sub.status === 'trial',
                              'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-300': sub.status === 'cancelled' || sub.status === 'expired',
                              'bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-gray-300': sub.status !== 'active' && sub.status !== 'trial' && sub.status !== 'cancelled' && sub.status !== 'expired'
                            }">
                        {{ sub.status }}
                      </span>
                    </td>
                    <td class="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">{{ formatDate(sub.start_date) }}</td>
                    <td class="px-3 py-2 text-xs text-gray-600 dark:text-gray-400">{{ sub.end_date ? formatDate(sub.end_date) : 'N/A' }}</td>
                    <td class="px-3 py-2">
                      @if (sub.auto_renew) {
                        <span class="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400">
                          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd" />
                          </svg>
                          Yes
                        </span>
                      } @else {
                        <span class="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400">
                          <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clip-rule="evenodd" />
                          </svg>
                          No
                        </span>
                      }
                    </td>
                    <td class="px-3 py-2">
                      <div class="flex items-center justify-end gap-1">
                        @if (sub.status === 'active') {
                          <button
                            (click)="cancelSubscription(sub.id)"
                            class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-700 dark:text-red-300 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                          >
                            <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                            </svg>
                            Cancel
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Empty State -->
          @if (subscriptions().length === 0) {
            <div class="p-12 text-center">
              <svg class="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-2">No Subscriptions Found</h3>
              <p class="text-sm text-gray-500 dark:text-gray-400">No tenant subscriptions are currently active.</p>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class BillingSubscriptionsComponent implements OnInit {
  http = inject(HttpClient);
  router = inject(Router);
  authService = inject(AuthService);

  subscriptions = signal<Subscription[]>([]);
  loading = signal(false);

  ngOnInit(): void {
    this.loadSubscriptions();
  }

  loadSubscriptions(): void {
    this.loading.set(true);

    this.http.get<any>('http://localhost:3000/api/billing/subscriptions').subscribe({
      next: (response) => {
        this.subscriptions.set(response.data || []);
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Failed to load subscriptions', error);
        this.loading.set(false);
      }
    });
  }

  cancelSubscription(id: number): void {
    if (!confirm('Are you sure you want to cancel this subscription?')) return;

    this.http.post(`http://localhost:3000/api/billing/subscriptions/${id}/cancel`, {}).subscribe({
      next: () => {
        this.loadSubscriptions();
      },
      error: (error) => {
        alert(error.error?.message || 'Failed to cancel subscription');
      }
    });
  }

  formatDate(date: string): string {
    return new Date(date).toLocaleDateString('en-US', { 
      year: 'numeric', 
      month: 'short', 
      day: 'numeric' 
    });
  }

  refresh(): void {
    this.loadSubscriptions();
  }

  goBack(): void {
    this.router.navigate(['/admin']);
  }
}
