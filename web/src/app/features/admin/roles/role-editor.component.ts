import { Component, OnInit, signal, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { RoleService, Role, Permission } from '../../../core/services/role.service';
import { AuthService } from '../../../core/services/auth.service';

interface ResourceGroup {
  resource: string;
  displayName: string;
  description: string;
  actions: string[];
  category: 'system' | 'tenant' | 'business';
  product?: 'core' | 'money-loan' | 'bnpl' | 'pawnshop'; // For tenant category, which product it belongs to
}

@Component({
  selector: 'app-role-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="p-4 space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div class="flex items-center gap-3">
          <button [routerLink]="isTenantContext() ? '/tenant/roles' : '/admin/roles'" class="rounded p-2 text-gray-600 hover:bg-gray-100 dark:text-gray-400 dark:hover:bg-gray-800 transition">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
            </svg>
          </button>
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
              {{ isEditing() ? 'Edit Role' : 'Create New Role' }}
            </h1>
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Select resources and assign permissions
            </p>
          </div>
        </div>

        <div *ngIf="getTotalSelectedPermissions() > 0" class="px-3 py-1 rounded bg-blue-50 dark:bg-blue-900/20">
          <span class="text-xs text-blue-600 dark:text-blue-400 font-medium">
            {{ getTotalSelectedPermissions() }} permissions on {{ getTotalSelectedResources() }} resources
          </span>
        </div>
      </div>

      <!-- Loading -->
      <div *ngIf="roleService.loadingSignal()" class="flex items-center justify-center py-12">
        <div class="text-center">
          <div class="w-12 h-12 border-4 border-blue-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
          <p class="text-sm text-gray-500 dark:text-gray-400">Loading...</p>
        </div>
      </div>

      <!-- Error -->
      <div *ngIf="roleService.errorSignal()" class="rounded border border-red-200 bg-red-50 px-4 py-3 dark:border-red-900 dark:bg-red-900/20">
        <p class="text-sm text-red-700 dark:text-red-400">❌ {{ roleService.errorSignal() }}</p>
      </div>

      <!-- Form -->
      <div *ngIf="!roleService.loadingSignal()" class="grid grid-cols-1 xl:grid-cols-4 gap-4">

        <!-- Role Info (1 column) -->
        <div class="xl:col-span-1">
          <div class="rounded border border-gray-200 bg-white p-4 dark:border-gray-700 dark:bg-gray-900 xl:sticky xl:top-4">
            <h2 class="mb-3 text-sm font-semibold text-gray-900 dark:text-white">Role Details</h2>

            <div class="space-y-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Name <span class="text-red-500">*</span>
                </label>
                <input
                  [(ngModel)]="roleName"
                  placeholder="e.g., Manager"
                  class="w-full rounded border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  [(ngModel)]="roleDescription"
                  placeholder="Role purpose..."
                  rows="3"
                  class="w-full rounded border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                ></textarea>
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Space <span class="text-red-500">*</span>
                </label>
                <select
                  [(ngModel)]="roleSpace"
                  [disabled]="isEditing()"
                  class="w-full rounded border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white disabled:opacity-50"
                >
                  <option value="system">System</option>
                  <option value="tenant">Tenant</option>
                </select>
                <p *ngIf="roleSpace === 'tenant'" class="mt-1 text-xs text-blue-600 dark:text-blue-400">
                  ℹ️ Tenant roles can only access tenant and business permissions
                </p>
              </div>

              <!-- Tenant Selector (for tenant roles) -->
              <div *ngIf="roleSpace === 'tenant' && !isTenantContext()">
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tenants <span class="text-red-500">*</span>
                </label>

                <!-- Multi-select for creating new tenant role -->
                <div *ngIf="!isEditing()" class="space-y-2">
                  <div class="max-h-40 overflow-y-auto border border-gray-300 dark:border-gray-600 rounded p-2 bg-white dark:bg-gray-800">
                    <label *ngFor="let tenant of tenants()" class="flex items-center gap-2 py-1 hover:bg-gray-50 dark:hover:bg-gray-700 px-2 rounded cursor-pointer">
                      <input
                        type="checkbox"
                        [checked]="selectedTenantIds().includes(tenant.id)"
                        (change)="toggleTenant(tenant.id)"
                        class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                      />
                      <span class="text-sm text-gray-900 dark:text-white">{{ tenant.name }}</span>
                    </label>
                  </div>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    Select one or more tenants to apply this role to
                  </p>
                </div>

                <!-- Read-only display for editing existing tenant role -->
                <div *ngIf="isEditing()">
                  <input
                    type="text"
                    [value]="getCurrentTenantName()"
                    disabled
                    class="w-full px-2.5 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-sm bg-gray-100 dark:bg-gray-700 text-gray-900 dark:text-white cursor-not-allowed"
                  />
                  <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">
                    Tenant assignment cannot be changed when editing
                  </p>
                </div>
              </div>
            </div>

            <!-- Quick Actions -->
            <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700 space-y-2">
              <div class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">Quick Selection</div>
              
              <!-- Toggle System Only Button - Show if filter is 'all' or 'system' -->
              <button
                *ngIf="spaceFilter === 'all' || spaceFilter === 'system'"
                (click)="toggleSelectSystem()"
                [class]="areAllSystemSelected() 
                  ? 'w-full rounded bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 transition'
                  : 'w-full rounded bg-purple-50 px-3 py-2 text-xs font-medium text-purple-700 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-300 transition'"
              >
                {{ areAllSystemSelected() ? '☐ Unselect System Only' : '☑ Select System Only' }}
              </button>
              
              <!-- Toggle Tenant Only Button - Show if filter is 'all' or 'tenant' -->
              <button
                *ngIf="spaceFilter === 'all' || spaceFilter === 'tenant'"
                (click)="toggleSelectTenant()"
                [class]="areAllTenantSelected() 
                  ? 'w-full rounded bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 transition'
                  : 'w-full rounded bg-green-50 px-3 py-2 text-xs font-medium text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300 transition'"
              >
                {{ areAllTenantSelected() ? '☐ Unselect Tenant Core' : '🏠 Select Tenant Core' }}
              </button>
              
              <!-- Toggle Money Loan Button - Show if filter is 'all' or 'tenant' -->
              <button
                *ngIf="spaceFilter === 'all' || spaceFilter === 'tenant'"
                (click)="toggleSelectMoneyLoan()"
                [class]="areAllMoneyLoanSelected() 
                  ? 'w-full rounded bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 transition'
                  : 'w-full rounded bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300 transition'"
              >
                {{ areAllMoneyLoanSelected() ? '☐ Unselect Money Loan' : '💰 Select Money Loan' }}
              </button>
            </div>

            <!-- Validation -->
            <div *ngIf="!canSave()" class="mt-4 rounded border border-yellow-200 bg-yellow-50 p-2 dark:border-yellow-900 dark:bg-yellow-900/20">
              <p class="text-xs font-medium text-yellow-800 dark:text-yellow-300 mb-1">Required:</p>
              <ul class="text-xs text-yellow-700 dark:text-yellow-400 space-y-0.5">
                <li *ngIf="!roleName.trim()">• Role name</li>
                <li *ngIf="roleSpace === 'tenant' && !isEditing() && selectedTenantIds().length === 0">• Select at least one tenant</li>
                <li *ngIf="getTotalSelectedPermissions() === 0">• At least 1 permission</li>
              </ul>
            </div>

            <!-- Save Button -->
            <div class="mt-4 pt-4 border-t border-gray-200 dark:border-gray-700">
              <button
                (click)="saveRole()"
                [disabled]="!canSave()"
                class="w-full rounded bg-blue-600 px-4 py-2 text-sm font-medium text-white hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm transition"
              >
                {{ isEditing() ? '💾 Update' : '✅ Create' }}
              </button>
              <button
                [routerLink]="isTenantContext() ? '/tenant/roles' : '/admin/roles'"
                class="w-full mt-2 rounded border border-gray-300 px-4 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:text-gray-300 dark:hover:bg-gray-800 transition"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>

        <!-- Permission Matrix (3 columns) -->
        <div class="xl:col-span-3">
          <div class="rounded border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">

            <!-- Header -->
            <div class="border-b border-gray-200 bg-gray-50 px-3 py-3 dark:border-gray-700 dark:bg-gray-800">
              <div class="space-y-3">
                <div class="flex items-center justify-between">
                  <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Permissions Matrix</h2>
                  <div class="text-xs text-gray-500 dark:text-gray-400">
                    {{ getFilteredCount() }} resources
                  </div>
                </div>
                
                <!-- Filters Row -->
                <div class="flex flex-wrap items-center gap-2">
                  <!-- Space Filter -->
                  <div class="flex items-center gap-1.5">
                    <label class="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Space:</label>
                    <select
                      [(ngModel)]="spaceFilter"
                      [disabled]="isTenantContext()"
                      class="text-xs rounded border border-gray-300 bg-white px-2 py-1 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <option value="all">All</option>
                      <option value="system">System</option>
                      <option value="tenant">Tenant</option>
                    </select>
                  </div>

                  <!-- Product Filter (for Tenant permissions) -->
                  <div *ngIf="spaceFilter === 'tenant' || spaceFilter === 'all'" class="flex items-center gap-1.5">
                    <label class="text-xs font-medium text-gray-700 dark:text-gray-300 whitespace-nowrap">Product:</label>
                    <select
                      [(ngModel)]="productFilter"
                      class="text-xs rounded border border-gray-300 bg-white px-2 py-1 text-gray-900 focus:outline-none focus:ring-1 focus:ring-blue-500 dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="all">All Products</option>
                      <option value="core">🏠 Core</option>
                      <option value="money-loan">💰 Money Loan</option>
                      <option value="bnpl">🛒 BNPL</option>
                      <option value="pawnshop">🏪 Pawnshop</option>
                    </select>
                  </div>
                </div>
              </div>
            </div>

            <!-- Permission Grid -->
            <div class="divide-y divide-gray-200 dark:divide-gray-700">

              <!-- Each Resource Group -->
              <div *ngFor="let group of filteredResourceGroups" class="border-b border-gray-100 dark:border-gray-700 last:border-b-0">

                <!-- Resource Header -->
                <div class="px-3 py-3">
                  <!-- Resource Info -->
                  <div class="mb-2">
                    <div class="flex items-center gap-2 mb-1 flex-wrap">
                      <span class="text-xs font-semibold text-gray-900 dark:text-white">{{ group.displayName }}</span>
                      <span class="text-xs px-1.5 py-0.5 rounded-full font-medium"
                            [class]="group.category === 'system' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : group.category === 'tenant' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300' : 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300'">
                        {{ group.category }}
                      </span>
                    </div>
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ group.description }}</p>
                  </div>

                  <!-- Action checkboxes (responsive grid) -->
                  <div class="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 xl:grid-cols-7 gap-2">
                    <label *ngFor="let action of group.actions" 
                           class="flex items-center gap-1.5 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50 px-2 py-1.5 rounded transition text-xs">
                      <input
                        type="checkbox"
                        [checked]="isPermissionSelected(group.resource, action)"
                        (change)="togglePermission(group.resource, action)"
                        class="w-3.5 h-3.5 flex-shrink-0 rounded border-gray-300 text-blue-600 focus:ring-1 focus:ring-blue-500 dark:border-gray-600"
                      />
                      <span class="font-medium truncate"
                            [class]="getActionColor(action)"
                            [title]="action">
                        {{ action }}
                      </span>
                    </label>
                  </div>
                </div>
              </div>
            </div>

            <!-- Summary Footer -->
            <div class="border-t border-gray-200 bg-gray-50 px-3 py-3 dark:border-gray-700 dark:bg-gray-800">
              <div class="grid grid-cols-3 sm:grid-cols-5 gap-3 text-center text-xs">
                <div class="p-2 rounded bg-white dark:bg-gray-900">
                  <p class="font-bold text-base text-gray-900 dark:text-white">{{ getTotalSelectedResources() }}</p>
                  <p class="text-gray-600 dark:text-gray-400">Resources</p>
                </div>
                <div class="p-2 rounded bg-white dark:bg-gray-900">
                  <p class="font-bold text-base text-gray-900 dark:text-white">{{ getTotalSelectedPermissions() }}</p>
                  <p class="text-gray-600 dark:text-gray-400">Total</p>
                </div>
                <div class="p-2 rounded bg-white dark:bg-gray-900">
                  <p class="font-bold text-base text-blue-600 dark:text-blue-400">{{ getActionCount('view') + getActionCount('read') }}</p>
                  <p class="text-gray-600 dark:text-gray-400">Read</p>
                </div>
                <div class="p-2 rounded bg-white dark:bg-gray-900">
                  <p class="font-bold text-base text-green-600 dark:text-green-400">{{ getActionCount('create') }}</p>
                  <p class="text-gray-600 dark:text-gray-400">Create</p>
                </div>
                <div class="p-2 rounded bg-white dark:bg-gray-900">
                  <p class="font-bold text-base text-red-600 dark:text-red-400">{{ getActionCount('delete') }}</p>
                  <p class="text-gray-600 dark:text-gray-400">Delete</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class RoleEditorComponent implements OnInit {
  isEditing = signal(false);
  roleId: string | null = null;
  roleName = '';
  roleDescription = '';
  roleSpace: 'system' | 'tenant' = 'system';
  selectedTenantId: number | null = null; // Used for editing (single tenant)
  selectedTenantIds = signal<number[]>([]); // Used for creating (multiple tenants)
  tenants = signal<any[]>([]);
  loadingTenants = signal(false);
  spaceFilter: 'all' | 'system' | 'tenant' = 'all'; // Filter for permission matrix
  productFilter: 'all' | 'core' | 'money-loan' | 'bnpl' | 'pawnshop' = 'all'; // Filter for tenant products

  // Resource groups with available permissions
  resourceGroups: ResourceGroup[] = [
    // System level
    { resource: 'dashboard', displayName: '📊 Dashboard', description: 'System dashboard access', actions: ['view'], category: 'system' },
    { resource: 'tenants', displayName: '🏢 Tenants', description: 'Manage tenant organizations', actions: ['read', 'create', 'update', 'delete', 'manage-subscriptions'], category: 'system' },
    { resource: 'users', displayName: '👥 Users', description: 'System-wide user management', actions: ['read', 'create', 'update', 'delete', 'export'], category: 'system' },
    { resource: 'roles', displayName: '🔑 Roles', description: 'System role management', actions: ['read', 'create', 'update', 'delete'], category: 'system' },
    { resource: 'modules', displayName: '🧩 Modules', description: 'System module management', actions: ['read', 'create', 'update', 'delete'], category: 'system' },
    { resource: 'permissions', displayName: '� Permissions', description: 'Permission management', actions: ['read', 'create', 'update', 'delete'], category: 'system' },
    { resource: 'products', displayName: '📦 Products', description: 'Product catalog and management', actions: ['read', 'create', 'update', 'delete', 'manage-catalog'], category: 'system' },
    { resource: 'subscriptions', displayName: '💳 Subscriptions', description: 'Subscription management', actions: ['read', 'create', 'update', 'delete', 'manage-plans'], category: 'system' },
    { resource: 'reports', displayName: '📈 Reports & Analytics', description: 'System reports and analytics', actions: ['view', 'export', 'tenant-usage', 'revenue'], category: 'system' },
    { resource: 'analytics', displayName: '📊 Analytics', description: 'Analytics dashboard', actions: ['view'], category: 'system' },
    { resource: 'recycle-bin', displayName: '🗑️ Recycle Bin', description: 'Deleted items recovery', actions: ['view', 'restore', 'permanent-delete'], category: 'system' },
    { resource: 'loans', displayName: '💵 Loans', description: 'System loan management', actions: ['read', 'create', 'update', 'delete', 'approve', 'disburse'], category: 'system' },
    { resource: 'payments', displayName: '💳 Payments', description: 'System payment management', actions: ['read', 'create', 'update', 'delete'], category: 'system' },
    { resource: 'audit', displayName: '📋 Audit', description: 'System audit logs', actions: ['read', 'export'], category: 'system' },
    { resource: 'settings', displayName: '⚙️ Settings', description: 'System settings', actions: ['read', 'update'], category: 'system' },

    // Tenant level - keeping all UI structure but matching DB permission keys
    { resource: 'tenant-dashboard', displayName: '🏠 Tenant Dashboard', description: 'Tenant dashboard access', actions: ['view'], category: 'tenant', product: 'core' },
    { resource: 'tenant-users', displayName: '👤 Tenant Users', description: 'Manage users within tenant', actions: ['read', 'create', 'update', 'delete', 'assign-roles', 'invite'], category: 'tenant', product: 'core' },
    { resource: 'tenant-roles', displayName: '🎭 Tenant Roles', description: 'Manage tenant roles', actions: ['read', 'create', 'update', 'delete'], category: 'tenant', product: 'core' },
    { resource: 'tenant-products', displayName: '🎁 Tenant Products', description: 'Tenant product catalog', actions: ['read', 'configure', 'manage-settings'], category: 'tenant', product: 'core' },
    { resource: 'tenant-billing', displayName: '💳 Tenant Billing', description: 'Tenant billing and subscriptions', actions: ['read', 'view-subscriptions', 'view-invoices', 'manage-renewals', 'view-overview'], category: 'tenant', product: 'core' },
    { resource: 'tenant-reports', displayName: '📋 Tenant Reports', description: 'Tenant reports and analytics', actions: ['view', 'product-usage', 'user-activity', 'billing-summary', 'transactions', 'export'], category: 'tenant', product: 'core' },
    { resource: 'tenant-recycle-bin', displayName: '♻️ Tenant Recycle Bin', description: 'Tenant deleted items recovery', actions: ['view', 'restore', 'view-history'], category: 'tenant', product: 'core' },
    { resource: 'tenant-settings', displayName: '🔧 Tenant Settings', description: 'Tenant configuration', actions: ['read', 'update'], category: 'tenant', product: 'core' },

    // Business modules (treated as tenant-level)
    // Money Loan - Granular Permissions (61 permissions)
    { resource: 'money-loan-overview', displayName: '💰 Money Loan: Overview', description: 'Overview dashboard metrics', actions: ['view', 'view-total-loans', 'view-collection-rate', 'view-overdue-percentage', 'view-outstanding-amount', 'view-default-rate'], category: 'tenant', product: 'money-loan' },
    { resource: 'money-loan-customers', displayName: '💰 Money Loan: Customers', description: 'Customer management', actions: ['read', 'create', 'update', 'delete', 'view-high-risk'], category: 'tenant', product: 'money-loan' },
    { resource: 'money-loan-loans', displayName: '💰 Money Loan: Loans', description: 'Loan management', actions: ['read', 'create', 'update', 'delete', 'approve', 'disburse', 'view-overdue', 'close', 'use-calculator'], category: 'tenant', product: 'money-loan' },
    { resource: 'money-loan-payments', displayName: '💰 Money Loan: Payments', description: 'Payment processing', actions: ['read', 'create', 'view-today-collections', 'bulk-import', 'refund', 'view-failed', 'configure-gateway'], category: 'tenant', product: 'money-loan' },
    { resource: 'money-loan-interest', displayName: '💰 Money Loan: Interest & Rules', description: 'Interest rate management', actions: ['read', 'update', 'manage-auto-rules', 'manual-override', 'use-calculator'], category: 'tenant', product: 'money-loan' },
    { resource: 'money-loan-collections', displayName: '💰 Money Loan: Collections', description: 'Collections management', actions: ['read', 'manage-workflow', 'manage-strategies', 'manage-legal-actions', 'view-recovery'], category: 'tenant', product: 'money-loan' },
    { resource: 'money-loan-kyc', displayName: '💰 Money Loan: KYC', description: 'KYC verification', actions: ['read', 'review', 'approve', 'view-audit-logs', 'view-webhook-logs', 'configure'], category: 'tenant', product: 'money-loan' },
    { resource: 'money-loan-reports', displayName: '💰 Money Loan: Reports', description: 'Reporting and analytics', actions: ['read', 'generate-periodic', 'generate-tax-summary', 'export', 'run-custom-queries'], category: 'tenant', product: 'money-loan' },
    { resource: 'money-loan-settings', displayName: '💰 Money Loan: Settings', description: 'Product settings', actions: ['read', 'manage-roles-permissions', 'manage-loan-products', 'manage-templates', 'manage-branding', 'manage-api-keys', 'view-audit-log'], category: 'tenant', product: 'money-loan' },
    { resource: 'money-loan-audit', displayName: '💰 Money Loan: Audit', description: 'Audit trail', actions: ['read', 'view-data-changes', 'export'], category: 'tenant', product: 'money-loan' },
    { resource: 'money-loan-notifications', displayName: '💰 Money Loan: Notifications', description: 'System notifications', actions: ['read'], category: 'tenant', product: 'money-loan' },
    { resource: 'money-loan-user-management', displayName: '💰 Money Loan: User Mgmt', description: 'Staff management', actions: ['manage'], category: 'tenant', product: 'money-loan' },
    { resource: 'money-loan-integrations', displayName: '💰 Money Loan: Integrations', description: 'External integrations', actions: ['configure'], category: 'tenant', product: 'money-loan' },
    
    // Legacy Money Loan (for backward compatibility - deprecated)
    { resource: 'money-loan', displayName: '💰 Money Loan (Legacy)', description: 'Deprecated - use granular permissions above', actions: ['read', 'create', 'update', 'approve', 'payments'], category: 'tenant', product: 'money-loan' },
    
    // BNPL & Pawnshop
    { resource: 'bnpl', displayName: '🛒 Buy Now Pay Later', description: 'BNPL management', actions: ['read', 'create', 'update', 'manage'], category: 'tenant', product: 'bnpl' },
    { resource: 'pawnshop', displayName: '🏪 Pawnshop', description: 'Pawnshop operations', actions: ['read', 'create', 'update', 'manage'], category: 'tenant', product: 'pawnshop' },
  ];

  // Selected permissions stored as Set<permissionKey> where permissionKey = 'resource:action'
  selectedPermissions = signal<Set<string>>(new Set());
  
  // Tenant context detection
  isTenantContext = signal(false);

  // Filtered resource groups based on selected space and space filter
  get filteredResourceGroups(): ResourceGroup[] {
    let groups = this.resourceGroups;

    // First filter by role space (tenant roles can't see system permissions)
    if (this.roleSpace === 'tenant') {
      groups = groups.filter(group => group.category !== 'system');
    }

    // Then apply the space filter
    if (this.spaceFilter === 'system') {
      groups = groups.filter(group => group.category === 'system');
    } else if (this.spaceFilter === 'tenant') {
      groups = groups.filter(group => group.category === 'tenant');
    }
    // If 'all', show all available groups (already filtered by role space above)

    // Apply product filter (only for tenant category)
    if (this.productFilter !== 'all') {
      groups = groups.filter(group => {
        // If it's not a tenant category, keep it
        if (group.category !== 'tenant') return true;
        // If it's tenant category, check if it matches the product filter
        return group.product === this.productFilter;
      });
    }

    return groups;
  }

  getFilteredCount(): number {
    return this.filteredResourceGroups.length;
  }

  constructor(
    public roleService: RoleService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    private authService: AuthService
  ) {}

  ngOnInit(): void {
    // Detect tenant context from URL
    const url = this.router.url;
    const isTenantCtx = url.startsWith('/tenant/');
    this.isTenantContext.set(isTenantCtx);
    
    // Auto-set space filter to tenant when in tenant context
    if (this.isTenantContext()) {
      this.spaceFilter = 'tenant';
      // In tenant context, auto-set the tenant ID from current user
      const currentTenantId = this.authService.getTenantId();
      if (currentTenantId) {
        this.selectedTenantIds.set([Number(currentTenantId)]);
        console.log('🏢 Tenant context: Auto-selected tenant ID:', currentTenantId);
      }
    } else {
      // Only load tenants list for system admin context
      this.loadTenants();
    }
    
    this.route.params.subscribe(params => {
      if (params['id'] && params['id'] !== 'new') {
        this.isEditing.set(true);
        this.roleId = params['id'];
        this.loadRole();
      }
    });
  }

  loadTenants(): void {
    this.loadingTenants.set(true);
    this.http.get<any>('/api/tenants', {
      params: { page: '1', limit: '100' }
    }).subscribe({
      next: (response) => {
        this.tenants.set(response.data || response);
        this.loadingTenants.set(false);
      },
      error: (error) => {
        console.error('Failed to load tenants:', error);
        this.loadingTenants.set(false);
      }
    });
  }

  async loadRole(): Promise<void> {
    if (!this.roleId) return;
    console.log('🔄 Loading role ID:', this.roleId);

    const role = await this.roleService.getRole(this.roleId);
    console.log('🔄 Role data received:', role);

    if (role) {
      this.roleName = role.name;
      this.roleDescription = role.description || '';
      this.roleSpace = role.space;

      // Load tenant ID if this is a tenant role
      if (role.tenantId) {
        this.selectedTenantId = role.tenantId;
        console.log('✅ Loaded tenant ID:', this.selectedTenantId);
      }

      console.log('🔄 Role permissions array:', role.permissions);
      console.log('🔄 Permissions is array?', Array.isArray(role.permissions));
      console.log('🔄 Permissions length:', role.permissions?.length);

      // Load permissions into set
      const permSet = new Set<string>();
      if (role.permissions && Array.isArray(role.permissions)) {
        for (const perm of role.permissions) {
          console.log('🔍 Processing permission:', perm);
          const permKey = perm.permissionKey || `${perm.resource}:${perm.action}`;
          console.log('🔍 Permission key:', permKey);
          permSet.add(permKey);
        }
      } else {
        console.warn('⚠️ Permissions is not an array or is null:', role.permissions);
      }

      console.log('✅ Loaded permissions set:', Array.from(permSet));
      console.log('✅ Total permissions loaded:', permSet.size);
      this.selectedPermissions.set(permSet);
      this.cdr.detectChanges();
      console.log('✅ Selected permissions signal updated');
    } else {
      console.error('❌ No role data returned');
    }
  }

  isPermissionSelected(resource: string, action: string): boolean {
    const permKey = `${resource}:${action}`;
    return this.selectedPermissions().has(permKey);
  }

  togglePermission(resource: string, action: string): void {
    const permKey = `${resource}:${action}`;
    const perms = new Set(this.selectedPermissions());

    if (perms.has(permKey)) {
      perms.delete(permKey);
    } else {
      perms.add(permKey);
    }

    this.selectedPermissions.set(perms);
  }

  // Helper method to get the category of a permission
  getPermissionCategory(permKey: string): 'system' | 'tenant' | null {
    const [resource, action] = permKey.split(':');
    
    // Find the group that matches both resource and action
    for (const group of this.resourceGroups) {
      if (group.resource === resource && group.actions.includes(action)) {
        // Business category is treated as tenant
        return group.category === 'business' ? 'tenant' : group.category;
      }
    }
    
    return null;
  }

  // Toggle methods for quick actions
  toggleSelectAll(): void {
    if (this.areAllSelected()) {
      // Unselect all
      this.selectedPermissions.set(new Set());
    } else {
      // Select all visible permissions
      const perms = new Set<string>();
      this.filteredResourceGroups.forEach(group => {
        group.actions.forEach(action => {
          perms.add(`${group.resource}:${action}`);
        });
      });
      this.selectedPermissions.set(perms);
    }
  }

  toggleSelectSystem(): void {
    const perms = new Set<string>();
    
    if (this.areAllSystemSelected()) {
      // Unselect all system permissions only, keep others
      this.selectedPermissions().forEach(permKey => {
        const category = this.getPermissionCategory(permKey);
        if (category !== 'system') {
          perms.add(permKey);
        }
      });
    } else {
      // Keep all current non-system permissions
      this.selectedPermissions().forEach(permKey => {
        const category = this.getPermissionCategory(permKey);
        if (category !== 'system') {
          perms.add(permKey);
        }
      });
      
      // Add all system permissions
      this.resourceGroups.forEach(group => {
        if (group.category === 'system') {
          group.actions.forEach(action => {
            perms.add(`${group.resource}:${action}`);
          });
        }
      });
    }
    
    this.selectedPermissions.set(perms);
  }

  toggleSelectTenant(): void {
    const perms = new Set<string>();
    
    if (this.areAllTenantSelected()) {
      // Unselect all tenant permissions only, keep others
      this.selectedPermissions().forEach(permKey => {
        const category = this.getPermissionCategory(permKey);
        if (category !== 'tenant') {
          perms.add(permKey);
        }
      });
    } else {
      // Keep all current non-tenant permissions
      this.selectedPermissions().forEach(permKey => {
        const category = this.getPermissionCategory(permKey);
        if (category !== 'tenant') {
          perms.add(permKey);
        }
      });
      
      // Add all tenant permissions EXCEPT Money Loan (only core tenant permissions)
      this.resourceGroups.forEach(group => {
        if (group.category === 'tenant' && group.product === 'core') {
          group.actions.forEach(action => {
            perms.add(`${group.resource}:${action}`);
          });
        }
      });
    }
    
    this.selectedPermissions.set(perms);
  }

  toggleSelectMoneyLoan(): void {
    const perms = new Set<string>();
    
    if (this.areAllMoneyLoanSelected()) {
      // Unselect all Money Loan permissions only, keep others
      this.selectedPermissions().forEach(permKey => {
        const [resource] = permKey.split(':');
        const group = this.resourceGroups.find(g => g.resource === resource);
        if (!group || group.product !== 'money-loan') {
          perms.add(permKey);
        }
      });
    } else {
      // Keep all current non-money-loan permissions
      this.selectedPermissions().forEach(permKey => {
        const [resource] = permKey.split(':');
        const group = this.resourceGroups.find(g => g.resource === resource);
        if (!group || group.product !== 'money-loan') {
          perms.add(permKey);
        }
      });
      
      // Add all Money Loan permissions
      this.resourceGroups.forEach(group => {
        if (group.product === 'money-loan') {
          group.actions.forEach(action => {
            perms.add(`${group.resource}:${action}`);
          });
        }
      });
    }
    
    this.selectedPermissions.set(perms);
  }

  // Check if all permissions are selected
  areAllSelected(): boolean {
    let totalAvailable = 0;
    this.filteredResourceGroups.forEach(group => {
      totalAvailable += group.actions.length;
    });
    return totalAvailable > 0 && this.selectedPermissions().size === totalAvailable;
  }

  // Check if all system permissions are selected
  areAllSystemSelected(): boolean {
    let totalSystemPerms = 0;
    let selectedSystemPerms = 0;
    
    this.resourceGroups.forEach(group => {
      if (group.category === 'system') {
        totalSystemPerms += group.actions.length;
        group.actions.forEach(action => {
          if (this.selectedPermissions().has(`${group.resource}:${action}`)) {
            selectedSystemPerms++;
          }
        });
      }
    });
    
    return totalSystemPerms > 0 && selectedSystemPerms === totalSystemPerms;
  }

  // Check if all tenant permissions are selected
  areAllTenantSelected(): boolean {
    let totalTenantPerms = 0;
    let selectedTenantPerms = 0;
    
    this.resourceGroups.forEach(group => {
      // Only count core tenant permissions, not Money Loan
      if (group.category === 'tenant' && group.product === 'core') {
        totalTenantPerms += group.actions.length;
        group.actions.forEach(action => {
          if (this.selectedPermissions().has(`${group.resource}:${action}`)) {
            selectedTenantPerms++;
          }
        });
      }
    });
    
    return totalTenantPerms > 0 && selectedTenantPerms === totalTenantPerms;
  }

  // Check if all Money Loan permissions are selected
  areAllMoneyLoanSelected(): boolean {
    let totalMoneyLoanPerms = 0;
    let selectedMoneyLoanPerms = 0;
    
    this.resourceGroups.forEach(group => {
      if (group.product === 'money-loan') {
        totalMoneyLoanPerms += group.actions.length;
        group.actions.forEach(action => {
          if (this.selectedPermissions().has(`${group.resource}:${action}`)) {
            selectedMoneyLoanPerms++;
          }
        });
      }
    });
    
    return totalMoneyLoanPerms > 0 && selectedMoneyLoanPerms === totalMoneyLoanPerms;
  }

  // Legacy methods (kept for compatibility)
  selectAll(): void {
    this.toggleSelectAll();
  }

  clearAll(): void {
    this.selectedPermissions.set(new Set());
  }

  getTotalSelectedPermissions(): number {
    return this.selectedPermissions().size;
  }

  getTotalSelectedResources(): number {
    const resources = new Set<string>();
    this.selectedPermissions().forEach(permKey => {
      const [resource] = permKey.split(':');
      resources.add(resource);
    });
    return resources.size;
  }

  getActionCount(action: string): number {
    let count = 0;
    this.selectedPermissions().forEach(permKey => {
      const [, permAction] = permKey.split(':');
      if (permAction === action) count++;
    });
    return count;
  }

  getActionColor(action: string): string {
    const colors: Record<string, string> = {
      'view': 'text-blue-600 dark:text-blue-400',
      'read': 'text-blue-600 dark:text-blue-400',
      'create': 'text-green-600 dark:text-green-400',
      'update': 'text-orange-600 dark:text-orange-400',
      'edit': 'text-orange-600 dark:text-orange-400',
      'delete': 'text-red-600 dark:text-red-400',
      'manage': 'text-purple-600 dark:text-purple-400',
      'assign': 'text-indigo-600 dark:text-indigo-400',
      'approve': 'text-teal-600 dark:text-teal-400',
      'disburse': 'text-pink-600 dark:text-pink-400',
    };
    return colors[action] || 'text-gray-600 dark:text-gray-400';
  }

  canSave(): boolean {
    const hasName = this.roleName.trim().length > 0;
    const hasPermissions = this.getTotalSelectedPermissions() > 0;

    // For editing: tenant roles already have tenant_id from DB
    // For creating: tenant roles need at least one tenant selected
    let hasTenantIfNeeded = true;
    if (this.roleSpace === 'tenant' && !this.isEditing()) {
      hasTenantIfNeeded = this.selectedTenantIds().length > 0;
    }

    return hasName && hasPermissions && hasTenantIfNeeded;
  }

  async saveRole(): Promise<void> {
    if (!this.canSave()) {
      let message = 'Please provide: ';
      const missing = [];
      if (!this.roleName.trim()) missing.push('role name');
      if (this.getTotalSelectedPermissions() === 0) missing.push('at least one permission');
      if (this.roleSpace === 'tenant' && !this.isEditing() && this.selectedTenantIds().length === 0) {
        missing.push('at least one tenant');
      }
      message += missing.join(', ');
      alert(message);
      return;
    }

    console.log('🔄 Starting role save...');

    try {
      // Convert permissions set to array of objects
      const permissionsArray = Array.from(this.selectedPermissions()).map(permKey => ({
        permissionKey: permKey
      }));

      console.log('📋 Permissions to save:', permissionsArray);

      if (this.isEditing() && this.roleId) {
        console.log('✏️ Updating existing role:', this.roleId);
        const updated = await this.roleService.updateRole(this.roleId, {
          name: this.roleName,
          description: this.roleDescription
        });
        if (updated) {
          console.log('✅ Role updated, now assigning permissions...');
          await this.roleService.bulkAssignPermissions(this.roleId, permissionsArray);
          console.log('✅ Permissions assigned, navigating...');
          this.router.navigate([this.isTenantContext() ? '/tenant/roles' : '/admin/roles']);
        } else {
          const errorMsg = this.roleService.errorSignal() || 'Failed to update role';
          console.error('❌ Update failed:', errorMsg);
          alert(errorMsg);
        }
      } else {
        console.log('➕ Creating new role...');

        // For tenant roles with multiple tenants selected, create a role for each tenant
        if (this.roleSpace === 'tenant' && this.selectedTenantIds().length > 0) {
          let successCount = 0;

          for (const tenantId of this.selectedTenantIds()) {
            const payload: any = {
              name: this.roleName,
              description: this.roleDescription,
              space: this.roleSpace,
              tenant_id: tenantId
            };

            console.log('📤 Creating role for tenant:', tenantId);
            const created = await this.roleService.createRole(payload);

            if (created) {
              console.log('✅ Role created with ID:', created.id);
              await this.roleService.bulkAssignPermissions(created.id, permissionsArray);
              successCount++;
            } else {
              console.error('❌ Failed to create role for tenant:', tenantId);
            }
          }

          if (successCount > 0) {
            console.log(`✅ Successfully created ${successCount} role(s)`);
            this.router.navigate([this.isTenantContext() ? '/tenant/roles' : '/admin/roles']);
          } else {
            alert('Failed to create roles for selected tenants');
          }
        } else {
          // System role - no tenant ID needed
          const payload: any = {
            name: this.roleName,
            description: this.roleDescription,
            space: this.roleSpace
          };

          console.log('📤 Payload:', payload);
          const created = await this.roleService.createRole(payload);

          if (created) {
            console.log('✅ Role created with ID:', created.id);
            await this.roleService.bulkAssignPermissions(created.id, permissionsArray);
            this.router.navigate([this.isTenantContext() ? '/tenant/roles' : '/admin/roles']);
          } else {
            const errorMsg = this.roleService.errorSignal() || 'Failed to create role';
            console.error('❌ Create failed:', errorMsg);
            alert(errorMsg);
          }
        }
      }
    } catch (error) {
      console.error('❌ Exception in saveRole:', error);
      alert('Error saving role: ' + (error instanceof Error ? error.message : 'Unknown error'));
    }
  }

  // Toggle tenant selection (for multi-select)
  toggleTenant(tenantId: number): void {
    const current = this.selectedTenantIds();
    if (current.includes(tenantId)) {
      this.selectedTenantIds.set(current.filter(id => id !== tenantId));
    } else {
      this.selectedTenantIds.set([...current, tenantId]);
    }
  }

  // Get tenant name for read-only display during edit
  getCurrentTenantName(): string {
    if (!this.selectedTenantId) return 'No tenant assigned';
    const tenant = this.tenants().find(t => t.id === this.selectedTenantId);
    return tenant ? tenant.name : `Tenant ID: ${this.selectedTenantId}`;
  }
}


