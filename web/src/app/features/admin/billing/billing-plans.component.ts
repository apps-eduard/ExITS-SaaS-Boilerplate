import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { AuthService } from '../../../core/services/auth.service';

interface Plan {
  id: number;
  name: string;
  description: string;
  price: number;
  billing_cycle: string;
  features: string[];
  max_users: number | null;
  max_storage_gb: number | null;
  status: string;
}

@Component({
  selector: 'app-billing-plans',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="p-4 space-y-4 bg-gray-50 dark:bg-gray-900 min-h-screen">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">Subscription Plans</h1>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Manage pricing plans and features</p>
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
          @if (authService.hasPermission('billing:manage-plans')) {
            <button
              (click)="createPlan()"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Create Plan
            </button>
          }
        </div>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="flex items-center justify-center py-12">
          <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        </div>
      }

      <!-- Error State -->
      @if (errorMessage()) {
        <div class="rounded-lg border border-red-200 dark:border-red-900 bg-red-50 dark:bg-red-900/20 p-4">
          <div class="flex items-start gap-3">
            <svg class="w-5 h-5 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div class="flex-1">
              <p class="text-sm font-medium text-red-800 dark:text-red-300">{{ errorMessage() }}</p>
              <button
                (click)="loadPlans()"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-300 hover:text-red-800 dark:hover:text-red-200 mt-2"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                </svg>
                Retry
              </button>
            </div>
          </div>
        </div>
      }

      <!-- Plans Grid -->
      @if (!loading() && !errorMessage()) {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          @for (plan of plans(); track plan.id) {
            <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden hover:shadow-lg transition-shadow">
              <!-- Plan Header -->
              <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r"
                   [ngClass]="{
                     'from-blue-500 to-blue-600': plan.name === 'Free',
                     'from-green-500 to-green-600': plan.name === 'Starter',
                     'from-purple-500 to-purple-600': plan.name === 'Professional',
                     'from-orange-500 to-orange-600': plan.name === 'Enterprise'
                   }">
                <h3 class="text-base font-bold text-white">{{ plan.name }}</h3>
                <div class="flex items-baseline gap-1 mt-1">
                  <span class="text-2xl font-bold text-white">\${{ plan.price }}</span>
                  <span class="text-xs text-white/80">/{{ plan.billing_cycle }}</span>
                </div>
              </div>

              <!-- Plan Details -->
              <div class="p-4 space-y-3">
                <p class="text-xs text-gray-600 dark:text-gray-400">{{ plan.description }}</p>
                
                <!-- Features -->
                <div class="space-y-1.5">
                  @for (feature of plan.features; track feature) {
                    <div class="flex items-start gap-2">
                      <svg class="w-4 h-4 text-green-600 dark:text-green-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span class="text-xs text-gray-700 dark:text-gray-300">{{ feature }}</span>
                    </div>
                  }
                </div>

                <!-- Limits -->
                <div class="pt-3 border-t border-gray-200 dark:border-gray-700 space-y-1">
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-gray-500 dark:text-gray-400">Max Users:</span>
                    <span class="font-medium text-gray-900 dark:text-white">{{ plan.max_users || 'Unlimited' }}</span>
                  </div>
                  <div class="flex items-center justify-between text-xs">
                    <span class="text-gray-500 dark:text-gray-400">Storage:</span>
                    <span class="font-medium text-gray-900 dark:text-white">{{ plan.max_storage_gb }}GB</span>
                  </div>
                </div>

                <!-- Actions -->
                @if (authService.hasPermission('billing:manage-plans')) {
                  <div class="flex items-center gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
                    <button
                      (click)="editPlan(plan)"
                      class="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-900/30 hover:bg-blue-100 dark:hover:bg-blue-900/50 rounded transition-colors"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                      Edit
                    </button>
                    <button
                      (click)="deletePlan(plan.id)"
                      class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-red-700 dark:text-red-300 bg-red-50 dark:bg-red-900/30 hover:bg-red-100 dark:hover:bg-red-900/50 rounded transition-colors"
                    >
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                }
              </div>
            </div>
          }
        </div>

        <!-- Empty State -->
        @if (plans().length === 0) {
          <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-12 text-center">
            <svg class="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <h3 class="text-base font-semibold text-gray-900 dark:text-white mb-2">No Plans Found</h3>
            <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">Get started by creating your first subscription plan.</p>
            @if (authService.hasPermission('billing:manage-plans')) {
              <button
                (click)="createPlan()"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
                </svg>
                Create Plan
              </button>
            }
          </div>
        }
      }
    </div>
  `
})
export class BillingPlansComponent implements OnInit {
  http = inject(HttpClient);
  router = inject(Router);
  authService = inject(AuthService);

  plans = signal<Plan[]>([]);
  loading = signal(false);
  errorMessage = signal<string | null>(null);

  ngOnInit(): void {
    this.loadPlans();
  }

  loadPlans(): void {
    this.loading.set(true);
    this.errorMessage.set(null);

    this.http.get<any>('http://localhost:3000/api/billing/plans').subscribe({
      next: (response) => {
        this.plans.set(response.data || []);
        this.loading.set(false);
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || 'Failed to load plans');
        this.loading.set(false);
      }
    });
  }

  createPlan(): void {
    this.router.navigate(['/admin/billing/plans/new']);
  }

  editPlan(plan: Plan): void {
    this.router.navigate(['/admin/billing/plans', plan.id]);
  }

  deletePlan(id: number): void {
    if (!confirm('Are you sure you want to delete this plan?')) return;

    this.http.delete(`http://localhost:3000/api/billing/plans/${id}`).subscribe({
      next: () => {
        this.loadPlans();
      },
      error: (error) => {
        alert(error.error?.message || 'Failed to delete plan');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/admin']);
  }
}
