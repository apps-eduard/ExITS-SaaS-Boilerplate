import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { TenantService } from '../../../core/services/tenant.service';
import { ToastService } from '../../../core/services/toast.service';

interface PaymentPlan {
  id: number | string; // Allow both number (from database) and string (for compatibility)
  name: string;
  description?: string;
  icon: string;
  price: number;
  currency?: string;
  billingCycle: 'monthly' | 'yearly';
  features: string[];
  productType?: string;
}

type PaymentMethod = 'credit_card' | 'gcash' | null;

@Component({
  selector: 'app-payment-simulation',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 p-4">
      <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="mb-6">
          <button
            (click)="goBack()"
            class="inline-flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white mb-4"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
            Back to Subscriptions
          </button>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Payment Simulation</h1>
          <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
            This is a simulation environment for testing subscription payments
          </p>
        </div>

        <div class="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <!-- Left: Order Summary -->
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Order Summary</h2>
            
            <div *ngIf="selectedPlan()" class="space-y-4">
              <!-- Plan Details -->
              <div class="flex items-start gap-4 p-4 bg-gray-50 dark:bg-gray-900 rounded-lg">
                <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-2xl shadow-md">
                  {{ selectedPlan()!.icon }}
                </div>
                <div class="flex-1">
                  <h3 class="font-bold text-gray-900 dark:text-white">{{ selectedPlan()!.name }}</h3>
                  <p class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">{{ selectedPlan()!.description }}</p>
                  <div class="mt-2 inline-flex items-center gap-1 px-2 py-0.5 bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium rounded">
                    {{ selectedPlan()!.billingCycle === 'monthly' ? 'Monthly' : 'Yearly' }} Subscription
                  </div>
                </div>
              </div>

              <!-- Price Breakdown -->
              <div class="border-t border-gray-200 dark:border-gray-700 pt-4 space-y-2">
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600 dark:text-gray-400">Subtotal</span>
                  <span class="text-gray-900 dark:text-white font-medium">{{ formatPrice(selectedPlan()!.price) }}</span>
                </div>
                <div class="flex justify-between text-sm">
                  <span class="text-gray-600 dark:text-gray-400">Tax (12%)</span>
                  <span class="text-gray-900 dark:text-white font-medium">{{ formatPrice(selectedPlan()!.price * 0.12) }}</span>
                </div>
                <div class="flex justify-between text-base font-bold border-t border-gray-200 dark:border-gray-700 pt-2">
                  <span class="text-gray-900 dark:text-white">Total</span>
                  <span class="text-blue-600 dark:text-blue-400">{{ formatPrice(selectedPlan()!.price * 1.12) }}</span>
                </div>
              </div>

              <!-- Features Preview -->
              <div class="border-t border-gray-200 dark:border-gray-700 pt-4">
                <h4 class="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase">Included Features</h4>
                <ul class="space-y-1">
                  <li *ngFor="let feature of selectedPlan()!.features.slice(0, 5)" class="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                    <svg class="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                    </svg>
                    {{ feature }}
                  </li>
                </ul>
              </div>
            </div>
          </div>

          <!-- Right: Payment Method -->
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
            <h2 class="text-lg font-bold text-gray-900 dark:text-white mb-4">Payment Method</h2>
            
            <div class="space-y-3 mb-6">
              <!-- Credit Card Option -->
              <button
                (click)="selectPaymentMethod('credit_card')"
                class="w-full p-4 rounded-lg border-2 transition text-left"
                [class.border-blue-600]="paymentMethod() === 'credit_card'"
                [class.bg-blue-50]="paymentMethod() === 'credit_card'"
                [class.dark:bg-blue-900/20]="paymentMethod() === 'credit_card'"
                [class.border-gray-200]="paymentMethod() !== 'credit_card'"
                [class.dark:border-gray-700]="paymentMethod() !== 'credit_card'"
              >
                <div class="flex items-center gap-3">
                  <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-blue-600 text-xl">
                    💳
                  </div>
                  <div class="flex-1">
                    <h3 class="font-bold text-gray-900 dark:text-white">Credit Card</h3>
                    <p class="text-xs text-gray-600 dark:text-gray-400">Visa, Mastercard, AmEx</p>
                  </div>
                  <div
                    *ngIf="paymentMethod() === 'credit_card'"
                    class="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white"
                  >
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </button>

              <!-- GCash Option -->
              <button
                (click)="selectPaymentMethod('gcash')"
                class="w-full p-4 rounded-lg border-2 transition text-left"
                [class.border-blue-600]="paymentMethod() === 'gcash'"
                [class.bg-blue-50]="paymentMethod() === 'gcash'"
                [class.dark:bg-blue-900/20]="paymentMethod() === 'gcash'"
                [class.border-gray-200]="paymentMethod() !== 'gcash'"
                [class.dark:border-gray-700]="paymentMethod() !== 'gcash'"
              >
                <div class="flex items-center gap-3">
                  <div class="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-br from-blue-400 to-blue-500 text-xl">
                    📱
                  </div>
                  <div class="flex-1">
                    <h3 class="font-bold text-gray-900 dark:text-white">GCash</h3>
                    <p class="text-xs text-gray-600 dark:text-gray-400">E-Wallet Payment</p>
                  </div>
                  <div
                    *ngIf="paymentMethod() === 'gcash'"
                    class="flex h-5 w-5 items-center justify-center rounded-full bg-blue-600 text-white"
                  >
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="3" d="M5 13l4 4L19 7" />
                    </svg>
                  </div>
                </div>
              </button>
            </div>

            <!-- Simulation Controls -->
            <div *ngIf="paymentMethod()" class="border-t border-gray-200 dark:border-gray-700 pt-6">
              <div class="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-700 rounded-lg p-4 mb-4">
                <div class="flex items-start gap-2">
                  <svg class="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                  </svg>
                  <div class="flex-1">
                    <h4 class="text-sm font-bold text-yellow-800 dark:text-yellow-300">Simulation Mode</h4>
                    <p class="text-xs text-yellow-700 dark:text-yellow-400 mt-1">
                      Choose an outcome to simulate the payment result
                    </p>
                  </div>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-3">
                <button
                  (click)="simulatePayment('success')"
                  [disabled]="processing()"
                  class="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed bg-green-600 hover:bg-green-700 text-white"
                >
                  <svg *ngIf="!processing()" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                  </svg>
                  <div *ngIf="processing()" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Success</span>
                </button>

                <button
                  (click)="simulatePayment('failed')"
                  [disabled]="processing()"
                  class="inline-flex items-center justify-center gap-2 px-4 py-3 rounded-lg font-medium transition disabled:opacity-50 disabled:cursor-not-allowed bg-red-600 hover:bg-red-700 text-white"
                >
                  <svg *ngIf="!processing()" class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  <div *ngIf="processing()" class="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  <span>Failed</span>
                </button>
              </div>
            </div>

            <!-- Payment Method Required Message -->
            <div *ngIf="!paymentMethod()" class="text-center py-8">
              <svg class="w-12 h-12 mx-auto text-gray-400 dark:text-gray-600 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />
              </svg>
              <p class="text-sm text-gray-600 dark:text-gray-400">
                Please select a payment method above
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class PaymentSimulationComponent implements OnInit {
  private router = inject(Router);
  private tenantService = inject(TenantService);
  private toastService = inject(ToastService);

  selectedPlan = signal<PaymentPlan | null>(null);
  paymentMethod = signal<PaymentMethod>(null);
  processing = signal(false);

  ngOnInit(): void {
    // Get plan from navigation state
    const navigation = this.router.getCurrentNavigation();
    const state = history.state;
    
    if (state && state.plan) {
      this.selectedPlan.set(state.plan);
    } else {
      // No plan selected, redirect back
      this.router.navigate(['/tenant/subscriptions']);
    }
  }

  selectPaymentMethod(method: PaymentMethod): void {
    this.paymentMethod.set(method);
  }

  simulatePayment(outcome: 'success' | 'failed'): void {
    const plan = this.selectedPlan();
    const method = this.paymentMethod();

    if (!plan || !method) return;

    this.processing.set(true);

    // Simulate API call delay
    setTimeout(() => {
      this.processing.set(false);

      if (outcome === 'success') {
        // Call backend to create subscription
        this.createSubscription(plan);
      } else {
        // Show failure message
        this.toastService.error('Payment failed! Please try again.');
        this.paymentMethod.set(null); // Reset payment method
      }
    }, 1500);
  }

  createSubscription(plan: PaymentPlan): void {
    const method = this.paymentMethod();
    if (!method) return;

    // Call backend API to create/update subscription
    this.tenantService.createSubscription(
      Number(plan.id),
      plan.billingCycle,
      method
    ).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success(`Successfully subscribed to ${plan.name}!`);
          
          // Navigate back to subscriptions page after a short delay
          setTimeout(() => {
            this.router.navigate(['/tenant/subscriptions']);
          }, 1000);
        } else {
          this.toastService.error('Failed to create subscription');
        }
      },
      error: (error) => {
        console.error('Subscription error:', error);
        this.toastService.error(error.error?.message || 'Failed to create subscription');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/tenant/subscriptions']);
  }

  formatPrice(price: number): string {
    return new Intl.NumberFormat('en-PH', {
      style: 'currency',
      currency: 'PHP',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2
    }).format(price);
  }
}
