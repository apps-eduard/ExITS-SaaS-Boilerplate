import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { RBACService } from '../../../core/services/rbac.service';
import { AuthService } from '../../../core/services/auth.service';
import { TenantService, Tenant } from '../../../core/services/tenant.service';
import { ProductSubscriptionService, PlatformSubscription } from '../../../core/services/product-subscription.service';

interface Platform {
  id: string;
  name: string;
  icon: string;
  description: string;
  enabled: boolean;
  status: 'active' | 'inactive';
  features: string[];
  lastUpdated?: string;
  subscription?: PlatformSubscription;
  platformType: 'money_loan' | 'bnpl' | 'pawnshop';
}

@Component({
  selector: 'app-tenant-platforms',
  standalone: true,
  imports: [CommonModule, RouterLink, FormsModule],
  template: `
    <div class="p-6 space-y-6">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">📦 My platform Catalog</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage your enabled platforms and features
          </p>
        </div>
        <button
          *ngIf="canConfigureplatforms()"
          routerLink="/tenant/platforms/settings"
          class="inline-flex items-center gap-2 rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 shadow-sm transition"
        >
          <span class="text-lg">⚙️</span>
          <span>Configure platforms</span>
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-3 gap-4">
        <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Total platforms</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {{ platforms().length }}
              </p>
            </div>
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <span class="text-2xl">📦</span>
            </div>
          </div>
        </div>

        <div class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Active platforms</p>
              <p class="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {{ activePlatforms() }}
              </p>
            </div>
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
              <span class="text-2xl">✅</span>
            </div>
          </div>
        </div>

        <div
          (click)="toggleinactivePlatforms()"
          role="button"
          tabindex="0"
          [attr.aria-label]="'Toggle inactive platforms visibility'"
          class="rounded-lg border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900 transition-all select-none cursor-pointer hover:shadow-md hover:border-blue-400 hover:bg-blue-50 dark:hover:bg-gray-800"
        >
          <div class="flex items-center justify-between">
            <div>
              <div class="flex items-center gap-2">
                <p class="text-sm font-medium text-gray-600 dark:text-gray-400">Inactive</p>
                <span
                  *ngIf="inactivePlatforms() > 0"
                  class="text-xs text-blue-600 dark:text-blue-400 font-medium"
                >
                  {{ showInactive() ? '👁️ Visible' : '🙈 Hidden' }}
                </span>
              </div>
              <p class="text-2xl font-bold text-gray-600 dark:text-gray-400 mt-1">
                {{ inactivePlatforms() }}
              </p>
            </div>
            <div class="flex h-12 w-12 items-center justify-center rounded-full bg-gray-100 dark:bg-gray-700">
              <span class="text-2xl">
                {{ showInactive() ? '👁️' : '🙈' }}
              </span>
            </div>
          </div>
          <p
            *ngIf="inactivePlatforms() > 0"
            class="text-xs text-gray-500 dark:text-gray-400 mt-2"
          >
            Click to {{ showInactive() ? 'hide' : 'show' }}
          </p>
        </div>
      </div>

      <!-- platforms Grid -->
      <div *ngIf="loading()" class="text-center py-12">
        <div class="inline-block animate-spin rounded-full h-12 w-12 border-4 border-gray-300 border-t-blue-600"></div>
        <p class="text-sm text-gray-500 dark:text-gray-400 mt-4">Loading platforms...</p>
      </div>

      <div *ngIf="!loading()" class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <div
          *ngFor="let platform of filteredplatforms()"
          class="group rounded-lg border border-gray-200 bg-white p-6 hover:shadow-lg transition-all dark:border-gray-700 dark:bg-gray-900"
          [class.opacity-60]="!platform.enabled"
        >
          <!-- platform Header -->
          <div class="flex items-start justify-between mb-4">
            <div class="flex items-center gap-3">
              <div class="flex h-12 w-12 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-purple-600 text-2xl">
                {{ platform.icon }}
              </div>
              <div>
                <h3 class="text-lg font-bold text-gray-900 dark:text-white">
                  {{ platform.name }}
                </h3>
                <div class="flex items-center gap-2 mt-1">
                  <span
                    [class]="getStatusClass(platform.status)"
                    class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
                  >
                    <span class="h-1.5 w-1.5 rounded-full" [class]="getStatusDotClass(platform.status)"></span>
                    {{ platform.status | titlecase }}
                  </span>
                  <span
                    *ngIf="platform.enabled"
                    class="inline-flex items-center gap-1 rounded-full bg-green-100 px-2 py-0.5 text-xs font-medium text-green-700 dark:bg-green-900/30 dark:text-green-400"
                  >
                    <span class="h-1.5 w-1.5 rounded-full bg-green-600"></span>
                    Enabled
                  </span>
                </div>
              </div>
            </div>

            <button
              *ngIf="canConfigureplatforms()"
              routerLink="/tenant/platforms/config"
              [queryParams]="{ platform: platform.id }"
              class="rounded-lg p-2 text-gray-400 hover:bg-gray-100 hover:text-gray-600 dark:hover:bg-gray-800 dark:hover:text-gray-300 transition"
              title="Configure"
            >
              <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>

          <!-- platform Description -->
          <p class="text-sm text-gray-600 dark:text-gray-400 mb-4">
            {{ platform.description }}
          </p>

          <!-- Features List -->
          <div class="space-y-2">
            <p class="text-xs font-semibold text-gray-700 dark:text-gray-300">Features:</p>
            <ul class="space-y-1">
              <li
                *ngFor="let feature of platform.features"
                class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400"
              >
                <svg class="h-4 w-4 text-green-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span>{{ feature }}</span>
              </li>
            </ul>
          </div>

          <!-- Subscription Info -->
          <div *ngIf="platform.subscription" class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
            <div class="flex items-center justify-between">
              <p class="text-xs font-semibold text-gray-700 dark:text-gray-300">Subscription:</p>
              <span
                [class]="getSubscriptionStatusClass(platform.subscription.status)"
                class="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium"
              >
                {{ platform.subscription.status | titlecase }}
              </span>
            </div>

            <div class="space-y-1 text-xs text-gray-600 dark:text-gray-400">
              <div class="flex justify-between">
                <span>Plan:</span>
                <span class="font-medium text-gray-900 dark:text-white">
                  {{ platform.subscription.subscriptionPlan?.name || 'N/A' }}
                </span>
              </div>
              <div class="flex justify-between">
                <span>Price:</span>
                <span class="font-medium text-gray-900 dark:text-white">
                  {{ '$' + platform.subscription.price + ' / ' + platform.subscription.billingCycle }}
                </span>
              </div>
              <div class="flex justify-between">
                <span>Started:</span>
                <span class="font-medium">
                  {{ formatDate(platform.subscription.startsAt) }}
                </span>
              </div>
              <div *ngIf="platform.subscription.expiresAt" class="flex justify-between">
                <span>Expires:</span>
                <span class="font-medium">
                  {{ formatDate(platform.subscription.expiresAt) }}
                </span>
              </div>
            </div>
          </div>

          <!-- No Subscription Warning -->
          <div *ngIf="!platform.subscription && platform.enabled" class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div class="flex items-center gap-2 text-xs text-amber-600 dark:text-amber-400">
              <svg class="h-4 w-4 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
              <span>No active subscription plan</span>
            </div>
          </div>

          <!-- platform Not Enabled - Request Trial CTA -->
          <div *ngIf="!platform.enabled" class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <div class="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20 rounded-lg p-4 border border-blue-200 dark:border-blue-800">
              <div class="flex items-start gap-3 mb-3">
                <div class="flex h-10 w-10 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/50 flex-shrink-0">
                  <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </div>
                <div>
                  <h4 class="text-sm font-bold text-gray-900 dark:text-white">platform Not Available</h4>
                  <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">
                    This platform is currently not enabled for your account. Start a free trial to explore all features!
                  </p>
                </div>
              </div>
              <button
                (click)="requestTrial(platform)"
                class="w-full inline-flex items-center justify-center gap-2 rounded-lg bg-gradient-to-r from-blue-600 to-purple-600 px-4 py-2.5 text-sm font-semibold text-white shadow-lg hover:shadow-xl hover:from-blue-700 hover:to-purple-700 transform hover:scale-105 transition-all duration-200"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 3v4M3 5h4M6 17v4m-2-2h4m5-16l2.286 6.857L21 12l-5.714 2.143L13 21l-2.286-6.857L5 12l5.714-2.143L13 3z" />
                </svg>
                <span>Request Free Trial</span>
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7" />
                </svg>
              </button>
              <p class="text-xs text-center text-gray-500 dark:text-gray-400 mt-2">
                ✨ 14-day free trial • No credit card required
              </p>
            </div>
          </div>

          <!-- Last Updated -->
          <div *ngIf="platform.lastUpdated && !platform.subscription" class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Last updated: {{ formatDate(platform.lastUpdated) }}
            </p>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div
        *ngIf="filteredplatforms().length === 0 && !loading()"
        class="rounded-lg border-2 border-dashed border-gray-300 p-12 text-center dark:border-gray-700"
      >
        <div class="text-6xl mb-4">📦</div>
        <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
          {{ activePlatforms() === 0 ? 'No platforms Available' : 'No Active platforms' }}
        </h3>
        <p class="text-sm text-gray-500 dark:text-gray-400 mb-6">
          {{ activePlatforms() === 0
            ? 'Contact your system administrator to enable platforms for your tenant.'
            : 'Click the Inactive card above to view inactive platforms.' }}
        </p>
      </div>
    </div>
  `,
  styles: []
})
export class TenantPlatformsComponent implements OnInit {
  private rbacService = inject(RBACService);
  private authService = inject(AuthService);
  private tenantService = inject(TenantService);
  private productSubscriptionService = inject(ProductSubscriptionService);

  loading = signal(false);
  tenant = signal<Tenant | null>(null);
  platformSubscriptions = signal<PlatformSubscription[]>([]);
  showInactive = signal<boolean>(false); // Toggle for showing/hiding inactive platforms

  // Build platforms list based on tenant settings
  platforms = computed(() => {
    const tenantData = this.tenant();
    const subscriptions = this.platformSubscriptions();
    if (!tenantData) return [];

    // Create a map of subscriptions by platform type
    const subscriptionMap = new Map<string, PlatformSubscription>();
    subscriptions.forEach(sub => {
      subscriptionMap.set(sub.platformType, sub);
    });

    const allPlatforms: Platform[] = [
      {
        id: 'money-loan',
        name: 'Money Loan',
        icon: '💸',
        platformType: 'money_loan',
        description: 'Comprehensive lending management system with loan applications, approvals, disbursements, and collections.',
        enabled: tenantData.moneyLoanEnabled || false,
        status: (tenantData.moneyLoanEnabled ? 'active' : 'inactive') as 'active' | 'inactive',
        features: [
          'Loan application processing',
          'Credit scoring and approval workflow',
          'Loan disbursement tracking',
          'Payment schedules and reminders',
          'Collection management'
        ],
        lastUpdated: tenantData.created_at,
        subscription: subscriptionMap.get('money_loan')
      },
      {
        id: 'pawnshop',
        name: 'Pawnshop',
        icon: '💍',
        platformType: 'pawnshop',
        description: 'Complete pawnshop operations including item appraisal, pawning, redemption, and inventory management.',
        enabled: tenantData.pawnshopEnabled || false,
        status: (tenantData.pawnshopEnabled ? 'active' : 'inactive') as 'active' | 'inactive',
        features: [
          'Item appraisal and valuation',
          'Pawn ticket generation',
          'Redemption tracking',
          'Inventory management',
          'Auction management'
        ],
        lastUpdated: tenantData.created_at,
        subscription: subscriptionMap.get('pawnshop')
      },
      {
        id: 'bnpl',
        name: 'Buy Now Pay Later',
        icon: '🛒',
        platformType: 'bnpl',
        description: 'BNPL solution for e-commerce integration with installment plans and payment processing.',
        enabled: tenantData.bnplEnabled || false,
        status: (tenantData.bnplEnabled ? 'active' : 'inactive') as 'active' | 'inactive',
        features: [
          'Installment plan management',
          'E-commerce integration',
          'Payment gateway integration',
          'Customer credit limits',
          'Late payment handling'
        ],
        lastUpdated: tenantData.created_at,
        subscription: subscriptionMap.get('bnpl')
      }
    ];

    // Return ALL platforms (enabled and disabled) so users can request trials
    return allPlatforms;
  });

  activePlatforms = computed(() =>
    this.platforms().filter((p: Platform) => p.enabled && p.status === 'active').length
  );

  inactivePlatforms = computed(() =>
    this.platforms().filter((p: Platform) => !p.enabled || p.status === 'inactive').length
  );

  // Filter platforms based on showInactive toggle
  // When showInactive is true: show ALL platforms
  // When showInactive is false: hide inactive platforms (only show enabled/active)
  filteredplatforms = computed(() => {
    const allplatforms = this.platforms();

    if (this.showInactive()) {
      // Show all platforms
      return allplatforms;
    } else {
      // Hide inactive platforms - only show enabled ones
      return allplatforms.filter(p => p.enabled && p.status === 'active');
    }
  });

  canConfigureplatforms = computed(() =>
    this.rbacService.can('tenant-platforms:configure')
  );

  ngOnInit(): void {
    console.log('📦 TenantPlatformsComponent initialized');
    this.loadTenantplatforms();
  }

  loadTenantplatforms(): void {
    this.loading.set(true);

    // Load tenant data
    this.tenantService.getMyTenant().subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.tenant.set(response.data);
          console.log('✅ Loaded tenant platforms:', {
            moneyLoan: response.data.moneyLoanEnabled,
            pawnshop: response.data.pawnshopEnabled,
            bnpl: response.data.bnplEnabled
          });

          // Load platform subscriptions
          this.loadplatformSubscriptions(response.data.id);
        } else {
          this.loading.set(false);
        }
      },
      error: (error) => {
        console.error('❌ Failed to load tenant platforms:', error);
        this.loading.set(false);
      }
    });
  }

  loadplatformSubscriptions(tenantId: number): void {
    this.productSubscriptionService.getTenantProductSubscriptions(tenantId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.platformSubscriptions.set(response.data);
          console.log('✅ Loaded platform subscriptions:', response.data);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('❌ Failed to load platform subscriptions:', error);
        this.loading.set(false);
      }
    });
  }

  getStatusClass(status: string): string {
    return status === 'active'
      ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
      : 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
  }

  getStatusDotClass(status: string): string {
    return status === 'active' ? 'bg-green-600' : 'bg-gray-600';
  }

  getSubscriptionStatusClass(status: string): string {
    const statusClasses: { [key: string]: string } = {
      'active': 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400',
      'suspended': 'bg-yellow-100 text-yellow-700 dark:bg-yellow-900/30 dark:text-yellow-400',
      'cancelled': 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400',
      'expired': 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300'
    };
    return statusClasses[status] || statusClasses['expired'];
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      year: 'numeric'
    });
  }

  toggleinactivePlatforms(): void {
    console.log('🖱️ Inactive card clicked!');
    console.log('   Active platforms:', this.activePlatforms());
    console.log('   Inactive platforms:', this.inactivePlatforms());
    console.log('   Current showInactive:', this.showInactive());

    // Toggle visibility
    this.showInactive.set(!this.showInactive());
    console.log('   New showInactive:', this.showInactive());
  }

  requestTrial(platform: Platform): void {
    console.log('🎯 Trial requested for platform:', platform.name);

    // TODO: Implement trial request API call
    // For now, show a message
    alert(`Trial request for ${platform.name}\n\nA request has been sent to your system administrator to enable a 14-day free trial of ${platform.name}.\n\nYou will be notified once the trial is activated.`);

    // Future implementation:
    // - Create a trial request in the database
    // - Notify system admin
    // - Send email confirmation to user
    // - Optionally auto-enable trial if configured
  }
}
