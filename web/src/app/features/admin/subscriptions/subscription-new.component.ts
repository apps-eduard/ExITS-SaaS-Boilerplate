import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface Customer {
  id: number;
  name: string;
  email: string;
}

interface Plan {
  id: number;
  name: string;
  description: string;
  price: number;
  currency: string;
  billingCycle: 'monthly' | 'quarterly' | 'yearly';
  trialDays: number;
  features: string[];
}

interface AddOn {
  id: number;
  name: string;
  price: number;
  description: string;
}

@Component({
  selector: 'app-subscription-new',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="p-4 sm:p-6 max-w-4xl mx-auto">
      <!-- Header -->
      <div class="mb-6">
        <div class="flex items-center gap-2 mb-2">
          <button
            routerLink="/admin/subscriptions"
            class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7"/>
            </svg>
            Back
          </button>
        </div>
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Create New Subscription</h1>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
          Set up a new subscription for a customer
        </p>
      </div>

      <!-- Form -->
      <div class="space-y-6">
        <!-- Step 1: Customer Selection -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center gap-2 mb-4">
            <span class="flex items-center justify-center w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-bold">1</span>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Select Customer</h2>
          </div>

          <div class="space-y-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Customer</label>
              <select
                [(ngModel)]="selectedCustomerId"
                class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              >
                <option [ngValue]="null">-- Select a customer --</option>
                @for (customer of customers(); track customer.id) {
                  <option [ngValue]="customer.id">{{ customer.name }} ({{ customer.email }})</option>
                }
              </select>
            </div>

            @if (selectedCustomer()) {
              <div class="p-3 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded">
                <p class="text-xs text-blue-700 dark:text-blue-300">
                  <strong>Selected:</strong> {{ selectedCustomer()!.name }} • {{ selectedCustomer()!.email }}
                </p>
              </div>
            }
          </div>
        </div>

        <!-- Step 2: Plan Selection -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center gap-2 mb-4">
            <span class="flex items-center justify-center w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-bold">2</span>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Choose Plan</h2>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
            @for (plan of plans(); track plan.id) {
              <div
                (click)="selectPlan(plan.id)"
                class="p-3 border-2 rounded-lg cursor-pointer transition"
                [class]="selectedPlanId === plan.id
                  ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'"
              >
                <div class="flex items-start justify-between mb-2">
                  <h3 class="font-semibold text-sm text-gray-900 dark:text-white">{{ plan.name }}</h3>
                  @if (selectedPlanId === plan.id) {
                    <span class="text-primary-600">✓</span>
                  }
                </div>
                <p class="text-xs text-gray-600 dark:text-gray-400 mb-2">{{ plan.description }}</p>
                <div class="flex items-baseline gap-1 mb-2">
                  <span class="text-xl font-bold text-gray-900 dark:text-white">{{ plan.currency }} {{ plan.price }}</span>
                  <span class="text-xs text-gray-500 dark:text-gray-400">/{{ plan.billingCycle }}</span>
                </div>
                @if (plan.trialDays > 0) {
                  <p class="text-xs text-green-600 dark:text-green-400 mb-2">{{ plan.trialDays }} days free trial</p>
                }
                <ul class="space-y-1">
                  @for (feature of plan.features; track $index) {
                    <li class="text-xs text-gray-600 dark:text-gray-400 flex items-start gap-1">
                      <svg class="w-3 h-3 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                      </svg>
                      {{ feature }}
                    </li>
                  }
                </ul>
              </div>
            }
          </div>
        </div>

        <!-- Step 3: Subscription Details -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center gap-2 mb-4">
            <span class="flex items-center justify-center w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-bold">3</span>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Subscription Details</h2>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
              <input
                type="date"
                [(ngModel)]="startDate"
                class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
              <input
                type="date"
                [(ngModel)]="endDate"
                class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
              />
            </div>
          </div>
        </div>

        <!-- Step 4: Payment Method -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center gap-2 mb-4">
            <span class="flex items-center justify-center w-6 h-6 rounded-full bg-primary-600 text-white text-xs font-bold">4</span>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Payment Method</h2>
          </div>

          <div class="grid grid-cols-1 md:grid-cols-3 gap-3">
            @for (method of paymentMethods; track method.value) {
              <div
                (click)="paymentMethod = method.value"
                class="p-3 border-2 rounded-lg cursor-pointer transition flex items-center gap-2"
                [class]="paymentMethod === method.value
                  ? 'border-primary-600 bg-primary-50 dark:bg-primary-900/20'
                  : 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600'"
              >
                <span class="text-2xl">{{ method.icon }}</span>
                <div class="flex-1">
                  <p class="font-semibold text-sm text-gray-900 dark:text-white">{{ method.label }}</p>
                  <p class="text-xs text-gray-500 dark:text-gray-400">{{ method.description }}</p>
                </div>
                @if (paymentMethod === method.value) {
                  <span class="text-primary-600">✓</span>
                }
              </div>
            }
          </div>
        </div>

        <!-- Step 5: Add-ons (Optional) -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center gap-2 mb-4">
            <span class="flex items-center justify-center w-6 h-6 rounded-full bg-gray-400 text-white text-xs font-bold">5</span>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Add-ons <span class="text-sm text-gray-500">(Optional)</span></h2>
          </div>

          <div class="space-y-2">
            @for (addon of addOns(); track addon.id) {
              <label class="flex items-start gap-3 p-3 border border-gray-200 dark:border-gray-700 rounded hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition">
                <input
                  type="checkbox"
                  [checked]="selectedAddOns().includes(addon.id)"
                  (change)="toggleAddOn(addon.id)"
                  class="mt-1"
                />
                <div class="flex-1">
                  <div class="flex items-center justify-between">
                    <span class="font-medium text-sm text-gray-900 dark:text-white">{{ addon.name }}</span>
                    <span class="font-semibold text-sm text-gray-900 dark:text-white">+{{ addon.price }}</span>
                  </div>
                  <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">{{ addon.description }}</p>
                </div>
              </label>
            }
          </div>
        </div>

        <!-- Step 6: Custom Pricing (Optional) -->
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center gap-2 mb-4">
            <span class="flex items-center justify-center w-6 h-6 rounded-full bg-gray-400 text-white text-xs font-bold">6</span>
            <h2 class="text-lg font-semibold text-gray-900 dark:text-white">Custom Pricing <span class="text-sm text-gray-500">(Optional)</span></h2>
          </div>

          <div class="space-y-3">
            <label class="flex items-center gap-2">
              <input
                type="checkbox"
                [(ngModel)]="useCustomPricing"
              />
              <span class="text-sm text-gray-700 dark:text-gray-300">Apply custom pricing for this subscription</span>
            </label>

            @if (useCustomPricing) {
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4 p-3 bg-gray-50 dark:bg-gray-900 rounded">
                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Custom Amount</label>
                  <input
                    type="number"
                    [(ngModel)]="customAmount"
                    step="0.01"
                    placeholder="0.00"
                    class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Discount (%)</label>
                  <input
                    type="number"
                    [(ngModel)]="discountPercent"
                    min="0"
                    max="100"
                    placeholder="0"
                    class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
                  />
                </div>
              </div>
            }
          </div>
        </div>

        <!-- Preview & Summary -->
        <div class="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
          <h3 class="font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
            <span>📋</span>
            Subscription Summary
          </h3>

          <div class="space-y-2 text-sm">
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Customer:</span>
              <span class="font-medium text-gray-900 dark:text-white">{{ selectedCustomer()?.name || 'Not selected' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Plan:</span>
              <span class="font-medium text-gray-900 dark:text-white">{{ selectedPlan()?.name || 'Not selected' }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Base Price:</span>
              <span class="font-medium text-gray-900 dark:text-white">{{ selectedPlan()?.currency || 'USD' }} {{ selectedPlan()?.price || 0 }}</span>
            </div>
            @if (selectedAddOns().length > 0) {
              <div class="flex justify-between">
                <span class="text-gray-600 dark:text-gray-400">Add-ons:</span>
                <span class="font-medium text-gray-900 dark:text-white">USD {{ calculateAddOnsTotal() }}</span>
              </div>
            }
            @if (useCustomPricing && discountPercent > 0) {
              <div class="flex justify-between text-green-600 dark:text-green-400">
                <span>Discount ({{ discountPercent }}%):</span>
                <span>USD {{ calculateDiscount() }}</span>
              </div>
            }
            <div class="pt-2 border-t border-blue-200 dark:border-blue-800 flex justify-between">
              <span class="font-semibold text-gray-900 dark:text-white">Total:</span>
              <span class="font-bold text-lg text-primary-600 dark:text-primary-400">{{ selectedPlan()?.currency || 'USD' }} {{ calculateTotal() }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Period:</span>
              <span class="font-medium text-gray-900 dark:text-white">{{ startDate }} to {{ endDate }}</span>
            </div>
            <div class="flex justify-between">
              <span class="text-gray-600 dark:text-gray-400">Payment:</span>
              <span class="font-medium text-gray-900 dark:text-white">{{ getPaymentMethodLabel() }}</span>
            </div>
          </div>
        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-3 pt-4 border-t border-gray-200 dark:border-gray-700">
          <button
            routerLink="/admin/subscriptions"
            class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition"
          >
            Cancel
          </button>
          <button
            (click)="createSubscription()"
            [disabled]="!canCreate()"
            class="inline-flex items-center gap-1.5 px-4 py-2 text-sm font-medium bg-primary-600 text-white rounded hover:bg-primary-700 disabled:opacity-50 disabled:cursor-not-allowed transition shadow-sm"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
            </svg>
            Create Subscription
          </button>
        </div>
      </div>
    </div>
  `
})
export class SubscriptionNewComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);

  customers = signal<Customer[]>([]);
  plans = signal<Plan[]>([]);
  addOns = signal<AddOn[]>([]);
  selectedAddOns = signal<number[]>([]);

  selectedCustomerId: number | null = null;
  selectedPlanId: number | null = null;
  startDate = new Date().toISOString().split('T')[0];
  endDate = new Date(Date.now() + 365 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
  paymentMethod = 'credit_card';
  useCustomPricing = false;
  customAmount: number | null = null;
  discountPercent = 0;

  paymentMethods = [
    { value: 'credit_card', label: 'Credit Card', icon: '💳', description: 'Visa, Mastercard, etc.' },
    { value: 'paypal', label: 'PayPal', icon: '🅿️', description: 'PayPal account' },
    { value: 'bank_transfer', label: 'Bank Transfer', icon: '🏦', description: 'Direct bank transfer' }
  ];

  selectedCustomer = computed(() =>
    this.customers().find(c => c.id === this.selectedCustomerId) || null
  );

  selectedPlan = computed(() =>
    this.plans().find(p => p.id === this.selectedPlanId) || null
  );

  ngOnInit() {
    this.loadCustomers();
    this.loadPlans();
    this.loadAddOns();
  }

  loadCustomers() {
    // Mock data
    this.customers.set([
      { id: 1, name: 'Acme Corporation', email: 'contact@acme.com' },
      { id: 2, name: 'TechStart Inc', email: 'billing@techstart.com' },
      { id: 3, name: 'Global Solutions', email: 'admin@globalsol.com' }
    ]);
  }

  loadPlans() {
    // Mock data
    this.plans.set([
      {
        id: 1,
        name: 'Starter',
        description: 'Perfect for small teams',
        price: 49.99,
        currency: 'USD',
        billingCycle: 'monthly',
        trialDays: 14,
        features: ['Up to 5 users', 'Basic support', '10GB storage']
      },
      {
        id: 2,
        name: 'Professional',
        description: 'For growing businesses',
        price: 149.99,
        currency: 'USD',
        billingCycle: 'monthly',
        trialDays: 14,
        features: ['Up to 25 users', 'Priority support', '100GB storage', 'Advanced analytics']
      },
      {
        id: 3,
        name: 'Enterprise',
        description: 'For large organizations',
        price: 299.99,
        currency: 'USD',
        billingCycle: 'monthly',
        trialDays: 30,
        features: ['Unlimited users', '24/7 support', '1TB storage', 'Custom integrations', 'SLA guarantee']
      }
    ]);
  }

  loadAddOns() {
    // Mock data
    this.addOns.set([
      { id: 1, name: 'Extra Storage (100GB)', price: 19.99, description: 'Additional 100GB cloud storage' },
      { id: 2, name: 'Advanced Analytics', price: 29.99, description: 'Real-time analytics and reporting' },
      { id: 3, name: 'API Access', price: 39.99, description: 'Full REST API access' },
      { id: 4, name: 'Dedicated Support', price: 99.99, description: 'Dedicated account manager' }
    ]);
  }

  selectPlan(planId: number) {
    this.selectedPlanId = planId;
  }

  toggleAddOn(addonId: number) {
    const current = this.selectedAddOns();
    if (current.includes(addonId)) {
      this.selectedAddOns.set(current.filter(id => id !== addonId));
    } else {
      this.selectedAddOns.set([...current, addonId]);
    }
  }

  calculateAddOnsTotal(): number {
    return this.selectedAddOns()
      .map(id => this.addOns().find(a => a.id === id)?.price || 0)
      .reduce((sum, price) => sum + price, 0);
  }

  calculateDiscount(): number {
    const plan = this.selectedPlan();
    if (!plan || this.discountPercent <= 0) return 0;
    const subtotal = plan.price + this.calculateAddOnsTotal();
    return (subtotal * this.discountPercent) / 100;
  }

  calculateTotal(): number {
    const plan = this.selectedPlan();
    if (!plan) return 0;

    if (this.useCustomPricing && this.customAmount !== null) {
      return this.customAmount;
    }

    const subtotal = plan.price + this.calculateAddOnsTotal();
    const discount = this.calculateDiscount();
    return subtotal - discount;
  }

  getPaymentMethodLabel(): string {
    return this.paymentMethods.find(m => m.value === this.paymentMethod)?.label || 'Unknown';
  }

  canCreate(): boolean {
    return !!(this.selectedCustomerId && this.selectedPlanId && this.startDate && this.endDate);
  }

  createSubscription() {
    if (!this.canCreate()) return;

    // Mock creation
    console.log('Creating subscription:', {
      customerId: this.selectedCustomerId,
      planId: this.selectedPlanId,
      startDate: this.startDate,
      endDate: this.endDate,
      paymentMethod: this.paymentMethod,
      addOns: this.selectedAddOns(),
      customPricing: this.useCustomPricing ? {
        amount: this.customAmount,
        discount: this.discountPercent
      } : null
    });

    alert('Subscription created successfully!');
    this.router.navigate(['/admin/subscriptions']);
  }
}
