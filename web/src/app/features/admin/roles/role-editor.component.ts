import { Component, OnInit, signal, computed, ChangeDetectorRef, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute, Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { RoleService, Role, Permission } from '../../../core/services/role.service';
import { AuthService } from '../../../core/services/auth.service';
import { ToastService } from '../../../core/services/toast.service';

interface ResourceGroup {
  resource: string;
  displayName: string;
  description: string;
  actions: string[];
  category: 'system' | 'tenant' | 'business' | 'customer';
  product?: 'core' | 'money-loan' | 'bnpl' | 'pawnshop' | 'customer'; // For tenant/customer grouping details
}

@Component({
  selector: 'app-role-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
  <div class="p-4 space-y-4 w-full">
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
        <p class="text-sm text-red-700 dark:text-red-400">âŒ {{ roleService.errorSignal() }}</p>
      </div>

      <!-- Read-Only Mode Banner -->
      <div *ngIf="isReadOnlyMode() && !roleService.loadingSignal()" class="rounded border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-700 dark:bg-amber-900/20">
        <div class="flex items-start gap-3">
          <svg class="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <div class="flex-1">
            <h3 class="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">VIEWING MODE - READ ONLY</h3>
            <p class="text-sm text-amber-700 dark:text-amber-400">{{ readOnlyReason() }}</p>
            <div class="flex gap-2 mt-3">
              <button [routerLink]="isTenantContext() ? '/tenant/roles' : '/admin/roles'" class="px-3 py-1.5 text-xs font-medium text-amber-700 bg-white border border-amber-300 rounded hover:bg-amber-50 dark:bg-gray-800 dark:text-amber-300 dark:border-amber-600 dark:hover:bg-gray-700">
                ⬅️ Go to Roles List
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Space Info Banner (for tenant roles being edited) -->
      <div *ngIf="roleSpace === 'tenant' && !isReadOnlyMode() && !roleService.loadingSignal()" class="rounded border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-900/20">
        <div class="flex items-start gap-3">
          <svg class="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="flex-1">
            <h3 class="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">Tenant Role Permissions</h3>
            <p class="text-xs text-blue-700 dark:text-blue-400">
              Tenant roles can only access tenant-space and product-specific permissions (Money Loan, BNPL, Pawnshop).
              System-level permissions are automatically filtered out for security.
            </p>
          </div>
        </div>
      </div>

      <!-- Form -->
  <div *ngIf="!roleService.loadingSignal()" class="grid w-full grid-cols-1 xl:grid-cols-4 gap-4">

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
                  [disabled]="isReadOnlyMode()"
                  placeholder="e.g., Manager"
                  class="w-full rounded border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:ring-1 focus:ring-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                />
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Description</label>
                <textarea
                  [(ngModel)]="roleDescription"
                  [disabled]="isReadOnlyMode()"
                  placeholder="Role purpose..."
                  rows="3"
                  class="w-full rounded border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white disabled:opacity-50 disabled:cursor-not-allowed"
                ></textarea>
              </div>

              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Space <span class="text-red-500">*</span>
                </label>
                <select
                  [(ngModel)]="roleSpace"
                  [disabled]="isEditing() || isReadOnlyMode() || isTenantContext()"
                  class="w-full rounded border border-gray-300 bg-white px-2.5 py-1.5 text-sm text-gray-900 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white disabled:opacity-50"
                >
                  <option value="system">System</option>
                  <option value="tenant">Tenant</option>
                </select>
                <p *ngIf="roleSpace === 'tenant'" class="mt-1 text-xs text-blue-600 dark:text-blue-400">
                  â„¹ï¸ Tenant roles can only access tenant and business permissions
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
              <div class="text-xs font-medium text-gray-700 dark:text-gray-300 mb-2 text-left">Quick Selection</div>

              <!-- Toggle System Only Button - Show if filter is 'all' or 'system' -->
              <button
                *ngIf="roleSpace !== 'customer' && (filterState().space === 'all' || filterState().space === 'system')"
                (click)="toggleSelectSystem()"
                [class]="areAllSystemSelected()
                  ? 'w-full text-left rounded bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 transition'
                  : 'w-full text-left rounded bg-purple-50 px-3 py-2 text-xs font-medium text-purple-700 hover:bg-purple-100 dark:bg-purple-900/20 dark:text-purple-300 transition'"
              >
                {{ areAllSystemSelected() ? '❌ Unselect System' : '⚡ Select System' }}
              </button>

              <!-- Toggle Tenant Only Button - Show if filter is 'all' or 'tenant' -->
              <button
                *ngIf="roleSpace !== 'customer' && (filterState().space === 'all' || filterState().space === 'tenant')"
                (click)="toggleSelectTenant()"
                [class]="areAllTenantSelected()
                  ? 'w-full text-left rounded bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 transition'
                  : 'w-full text-left rounded bg-green-50 px-3 py-2 text-xs font-medium text-green-700 hover:bg-green-100 dark:bg-green-900/20 dark:text-green-300 transition'"
              >
                {{ areAllTenantSelected() ? '❌ Unselect Tenant Core' : '🏠 Select Tenant Core' }}
              </button>

              <!-- Toggle Money Loan permissions -->
              <button
                *ngIf="roleSpace !== 'customer' && (filterState().space === 'all' || filterState().space === 'tenant')"
                (click)="toggleSelectProduct('money-loan')"
                [disabled]="isReadOnlyMode() || isProductDisabled('money-loan')"
                [class]="areAllProductSelected('money-loan')
                  ? 'w-full text-left rounded bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 transition'
                  : 'w-full text-left rounded bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300 transition disabled:opacity-50 disabled:cursor-not-allowed'"
              >
                {{ areAllProductSelected('money-loan') ? '❌ Unselect Money Loan' : '💰 Select Money Loan' }}
              </button>

              <!-- Toggle Collector permissions (subset of Money Loan) -->
              <button
                *ngIf="roleSpace !== 'customer' && (filterState().space === 'all' || filterState().space === 'tenant')"
                (click)="toggleSelectCollector()"
                [disabled]="isReadOnlyMode()"
                [class]="areAllCollectorSelected()
                  ? 'w-full text-left rounded bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 transition'
                  : 'w-full text-left rounded bg-indigo-50 px-3 py-2 text-xs font-medium text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/20 dark:text-indigo-300 transition disabled:opacity-50 disabled:cursor-not-allowed'"
              >
                {{ areAllCollectorSelected() ? '❌ Unselect Collector' : '📱 Select Collector' }}
              </button>

              <!-- Toggle BNPL permissions -->
              <button
                *ngIf="roleSpace !== 'customer' && (filterState().space === 'all' || filterState().space === 'tenant')"
                (click)="toggleSelectProduct('bnpl')"
                [disabled]="isReadOnlyMode() || isProductDisabled('bnpl')"
                [class]="areAllProductSelected('bnpl')
                  ? 'w-full text-left rounded bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 transition'
                  : 'w-full text-left rounded bg-blue-50 px-3 py-2 text-xs font-medium text-blue-700 hover:bg-blue-100 dark:bg-blue-900/20 dark:text-blue-300 transition disabled:opacity-50 disabled:cursor-not-allowed'"
              >
                {{ areAllProductSelected('bnpl') ? '❌ Unselect BNPL' : '🛒 Select BNPL' }}
              </button>

              <!-- Toggle Pawnshop permissions -->
              <button
                *ngIf="roleSpace !== 'customer' && (filterState().space === 'all' || filterState().space === 'tenant')"
                (click)="toggleSelectProduct('pawnshop')"
                [disabled]="isReadOnlyMode() || isProductDisabled('pawnshop')"
                [class]="areAllProductSelected('pawnshop')
                  ? 'w-full text-left rounded bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 transition'
                  : 'w-full text-left rounded bg-pink-50 px-3 py-2 text-xs font-medium text-pink-700 hover:bg-pink-100 dark:bg-pink-900/20 dark:text-pink-300 transition disabled:opacity-50 disabled:cursor-not-allowed'"
              >
                {{ areAllProductSelected('pawnshop') ? '❌ Unselect Pawnshop' : '🪙 Select Pawnshop' }}
              </button>

              <!-- Toggle Customer portal permissions -->
              <button
                *ngIf="spaceTabCounts().customer.permissions > 0"
                (click)="toggleSelectCustomer()"
                [disabled]="isReadOnlyMode()"
                [class]="areAllCustomerSelected()
                  ? 'w-full text-left rounded bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 transition'
                  : 'w-full text-left rounded bg-amber-50 px-3 py-2 text-xs font-medium text-amber-700 hover:bg-amber-100 dark:bg-amber-900/20 dark:text-amber-300 transition disabled:opacity-50 disabled:cursor-not-allowed'"
              >
                {{ areAllCustomerSelected() ? '❌ Unselect Customer Portal' : '👤 Select Customer Portal' }}
              </button>

              <!-- Clear All Permissions Button -->
            <button
              (click)="clearAllPermissions()"
              class="w-full text-left rounded bg-red-50 px-3 py-2 text-xs font-medium text-red-700 hover:bg-red-100 dark:bg-red-900/20 dark:text-red-300 transition"
            >
              🗑️ Clear All Permissions
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
                ❌ Cancel
              </button>
            </div>
          </div>
        </div>

        <!-- Permission Matrix (3 columns) -->
        <div class="xl:col-span-3">
          <div class="rounded border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900">

            <!-- Enhanced Filter Section -->
            <div class="border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-700 dark:bg-gray-900">

              <!-- Header Row -->
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filter Permissions
                </h3>
                <button
                  *ngIf="activeFilters().length > 0"
                  (click)="clearAllFilters()"
                  class="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium flex items-center gap-1 transition-colors"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  🗑️ Clear All
                </button>
              </div>

              <!-- Space Tabs -->
              <div class="mb-3">
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Space
                </label>
                <div class="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <button
                    (click)="setSpaceFilter('all')"
                    [disabled]="isReadOnlyMode()"
                    type="button"
                    [class]="filterState().space === 'all'
                      ? 'px-4 py-3 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 border-b-4 border-blue-600 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                      : 'px-4 py-3 rounded-lg text-sm font-medium bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed'"
                  >
                    <div class="flex flex-col items-center gap-1">
                      <span class="text-lg">📊</span>
                      <span>All</span>
                      <span class="text-xs opacity-75">{{ spaceTabCounts().all.groups }} groups · {{ spaceTabCounts().all.permissions }} perms</span>
                    </div>
                  </button>

                  <button
                    (click)="setSpaceFilter('system')"
                    [disabled]="isReadOnlyMode() || isTenantContext() || roleSpace === 'customer'"
                    type="button"
                    [class]="filterState().space === 'system'
                      ? 'px-4 py-3 rounded-lg text-sm font-medium bg-purple-100 text-purple-700 border-b-4 border-purple-600 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                      : 'px-4 py-3 rounded-lg text-sm font-medium bg-gray-50 text-gray-700 hover:bg-purple-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed'"
                  >
                    <div class="flex flex-col items-center gap-1">
                      <span class="text-lg">⚡</span>
                      <span>System</span>
                      <span class="text-xs opacity-75">{{ spaceTabCounts().system.groups }} groups · {{ spaceTabCounts().system.permissions }} perms</span>
                    </div>
                  </button>

                  <button
                    (click)="setSpaceFilter('tenant')"
                    [disabled]="isReadOnlyMode() || roleSpace === 'customer'"
                    type="button"
                    [class]="filterState().space === 'tenant'
                      ? 'px-4 py-3 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 border-b-4 border-blue-600 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                      : 'px-4 py-3 rounded-lg text-sm font-medium bg-gray-50 text-gray-700 hover:bg-blue-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed'"
                  >
                    <div class="flex flex-col items-center gap-1">
                      <span class="text-lg">🏢</span>
                      <span>Tenant</span>
                      <span class="text-xs opacity-75">{{ spaceTabCounts().tenant.groups }} groups · {{ spaceTabCounts().tenant.permissions }} perms</span>
                    </div>
                  </button>

                  <button
                    (click)="setSpaceFilter('customer')"
                    [disabled]="isReadOnlyMode()"
                    type="button"
                    [class]="filterState().space === 'customer'
                      ? 'px-4 py-3 rounded-lg text-sm font-medium bg-amber-100 text-amber-700 border-b-4 border-amber-600 dark:bg-amber-900/30 dark:text-amber-300 dark:border-amber-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                      : 'px-4 py-3 rounded-lg text-sm font-medium bg-gray-50 text-gray-700 hover:bg-amber-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed'"
                  >
                    <div class="flex flex-col items-center gap-1">
                      <span class="text-lg">👤</span>
                      <span>Customer</span>
                      <span class="text-xs opacity-75">{{ spaceTabCounts().customer.groups }} groups · {{ spaceTabCounts().customer.permissions }} perms</span>
                    </div>
                  </button>
                </div>
              </div>

              <!-- Platform Tabs (only show for Tenant or All space) -->
              <div *ngIf="filterState().space === 'tenant' || filterState().space === 'all'" class="mb-3">
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Platforms
                </label>
                <div class="grid grid-cols-5 gap-2">
                  <button
                    (click)="setProductFilter('all')"
                    [disabled]="isReadOnlyMode()"
                    type="button"
                    [class]="filterState().product === 'all'
                      ? 'px-3 py-2 rounded text-xs font-medium bg-gray-200 text-gray-800 border-l-4 border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-400 transition-all'
                      : 'px-3 py-2 rounded text-xs font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-all'"
                  >
                    <div class="text-center">
                      <div class="text-base mb-0.5">📋</div>
                      <div>All</div>
                      <div class="text-xs opacity-75 mt-0.5">{{ productTabCounts().all.groups }} groups · {{ productTabCounts().all.permissions }} perms</div>
                    </div>
                  </button>

                  <button
                    (click)="setProductFilter('core')"
                    [disabled]="isReadOnlyMode() || isProductDisabled('core')"
                    type="button"
                    [class]="filterState().product === 'core'
                      ? 'px-3 py-2 rounded text-xs font-medium bg-green-100 text-green-700 border-l-4 border-green-600 dark:bg-green-900/30 dark:text-green-300 transition-all'
                      : 'px-3 py-2 rounded text-xs font-medium bg-white text-gray-700 border border-gray-300 hover:bg-green-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all'"
                  >
                    <div class="text-center">
                      <div class="text-base mb-0.5">🏠</div>
                      <div>Core</div>
                      <div class="text-xs opacity-75 mt-0.5">{{ productTabCounts().core.groups }} groups · {{ productTabCounts().core.permissions }} perms</div>
                    </div>
                  </button>

                  <button
                    (click)="setProductFilter('money-loan')"
                    [disabled]="isReadOnlyMode() || isProductDisabled('money-loan')"
                    type="button"
                    [class]="filterState().product === 'money-loan'
                      ? 'px-3 py-2 rounded text-xs font-medium bg-amber-100 text-amber-700 border-l-4 border-amber-600 dark:bg-amber-900/30 dark:text-amber-300 transition-all'
                      : 'px-3 py-2 rounded text-xs font-medium bg-white text-gray-700 border border-gray-300 hover:bg-amber-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all'"
                  >
                    <div class="text-center">
                      <div class="text-base mb-0.5">💰</div>
                      <div class="truncate">Money</div>
                      <div class="text-xs opacity-75 mt-0.5">{{ productTabCounts()['money-loan'].groups }} groups · {{ productTabCounts()['money-loan'].permissions }} perms</div>
                    </div>
                  </button>

                  <button
                    (click)="setProductFilter('bnpl')"
                    [disabled]="isReadOnlyMode() || isProductDisabled('bnpl')"
                    type="button"
                    [class]="filterState().product === 'bnpl'
                      ? 'px-3 py-2 rounded text-xs font-medium bg-blue-100 text-blue-700 border-l-4 border-blue-600 transition-all'
                      : 'px-3 py-2 rounded text-xs font-medium bg-white text-gray-700 border border-gray-300 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 transition-all'"
                  >
                    <div class="text-center">
                      <div class="text-base mb-0.5">🛒</div>
                      <div>BNPL</div>
                      <div class="text-xs opacity-75 mt-0.5">{{ productTabCounts().bnpl.groups }} groups · {{ productTabCounts().bnpl.permissions }} perms{{ isProductDisabled('bnpl') ? ' 🔒' : '' }}</div>
                    </div>
                  </button>

                  <button
                    (click)="setProductFilter('pawnshop')"
                    [disabled]="isReadOnlyMode() || isProductDisabled('pawnshop')"
                    type="button"
                    [class]="filterState().product === 'pawnshop'
                      ? 'px-3 py-2 rounded text-xs font-medium bg-pink-100 text-pink-700 border-l-4 border-pink-600 transition-all'
                      : 'px-3 py-2 rounded text-xs font-medium bg-white text-gray-700 border border-gray-300 hover:bg-pink-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 transition-all'"
                  >
                    <div class="text-center">
                      <div class="text-base mb-0.5">🪙</div>
                      <div>Pawn</div>
                      <div class="text-xs opacity-75 mt-0.5">{{ productTabCounts().pawnshop.groups }} groups · {{ productTabCounts().pawnshop.permissions }} perms{{ isProductDisabled('pawnshop') ? ' 🔒' : '' }}</div>
                    </div>
                  </button>
                </div>
              </div>

              <!-- Active Filters Summary -->
              <div *ngIf="activeFilters().length > 0" class="flex items-center gap-2 p-2 rounded bg-blue-50 dark:bg-blue-900/20">
                <span class="text-xs font-medium text-blue-700 dark:text-blue-300">Active:</span>
                <div class="flex flex-wrap gap-1.5">
                  <button
                    *ngFor="let filter of activeFilters()"
                    (click)="removeFilter(filter.id)"
                    type="button"
                    class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-800 dark:text-blue-200 dark:hover:bg-blue-700 transition-colors"
                  >
                    <span>{{ filter.icon }}</span>
                    <span>{{ filter.label }}</span>
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <span class="ml-auto text-xs text-blue-600 dark:text-blue-400 font-medium whitespace-nowrap">
                  {{ filteredPermissionCount() }} groups shown
                </span>
              </div>

              <!-- No Filters Message -->
              <div *ngIf="activeFilters().length === 0" class="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-800">
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  ✨ Showing all {{ filteredPermissionCount() }} permission groups
                </span>
              </div>

            </div>

                        <!-- Permission Grid -->
            <div class="divide-y divide-gray-200 dark:divide-gray-700">

              <!-- Each Resource Group -->
              <div *ngFor="let group of filteredResourceGroups()" class="border-b border-gray-100 dark:border-gray-700 last:border-b-0">

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
                           [class]="'flex items-center gap-1.5 px-2 py-1.5 rounded transition text-xs ' + (isPermissionDisabled(group.resource, action) ? 'cursor-not-allowed opacity-60' : 'cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-700/50')"
                           [title]="getPermissionTooltip(group.resource, action)">
                      <input
                        type="checkbox"
                        [checked]="isPermissionSelected(group.resource, action)"
                        [disabled]="isPermissionDisabled(group.resource, action)"
                        (change)="togglePermission(group.resource, action)"
                        class="w-3.5 h-3.5 flex-shrink-0 rounded border-gray-300 text-blue-600 focus:ring-1 focus:ring-blue-500 dark:border-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
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
  roleSpace: 'system' | 'tenant' | 'customer' = 'system';
  selectedTenantId: number | null = null; // Used for editing (single tenant)
  selectedTenantIds = signal<number[]>([]); // Used for creating (multiple tenants)
  tenants = signal<any[]>([]);
  loadingTenants = signal(false);

  // Enhanced filter state with signals
  filterState = signal<{
    space: 'all' | 'system' | 'tenant' | 'customer';
    product: 'all' | 'core' | 'money-loan' | 'bnpl' | 'pawnshop';
  }>({
    space: 'all',
    product: 'all'
  });

  // Computed properties for filter counts
  spaceTabCounts = computed(() => {
    const summary = {
      all: { groups: 0, permissions: 0 },
      system: { groups: 0, permissions: 0 },
      tenant: { groups: 0, permissions: 0 },
      customer: { groups: 0, permissions: 0 }
    };

    for (const group of this.resourceGroups) {
      summary.all.groups += 1;
      summary.all.permissions += group.actions.length;

      if (group.category === 'system') {
        summary.system.groups += 1;
        summary.system.permissions += group.actions.length;
      } else if (group.category === 'customer') {
        summary.customer.groups += 1;
        summary.customer.permissions += group.actions.length;
      } else {
        summary.tenant.groups += 1;
        summary.tenant.permissions += group.actions.length;
      }
    }

    return summary;
  });

  productTabCounts = computed(() => {
    const summary: Record<'all' | 'core' | 'money-loan' | 'bnpl' | 'pawnshop', { groups: number; permissions: number }> = {
      all: { groups: 0, permissions: 0 },
      core: { groups: 0, permissions: 0 },
      'money-loan': { groups: 0, permissions: 0 },
      bnpl: { groups: 0, permissions: 0 },
      pawnshop: { groups: 0, permissions: 0 }
    };

    for (const group of this.resourceGroups) {
      const isTenantCategory = group.category === 'tenant' || group.category === 'business';
      if (!isTenantCategory) {
        continue;
      }

      summary.all.groups += 1;
      summary.all.permissions += group.actions.length;

      const productKey = (group.product ?? 'core') as 'core' | 'money-loan' | 'bnpl' | 'pawnshop';
      if (summary[productKey]) {
        summary[productKey].groups += 1;
        summary[productKey].permissions += group.actions.length;
      }
    }

    return summary;
  });

  activeFilters = computed(() => {
    const filters: Array<{id: string; label: string; icon: string}> = [];
    const state = this.filterState();

    if (state.space !== 'all') {
      const spaceLabels = {
        system: { label: 'System', icon: '⚡' },
        tenant: { label: 'Tenant', icon: '🏢' },
        customer: { label: 'Customer', icon: '👤' }
      } as const;
      filters.push({
        id: 'space',
        ...spaceLabels[state.space]
      });
    }

    if (state.product !== 'all') {
      const productLabels = {
        core: { label: 'Core', icon: '🏠' },
        'money-loan': { label: 'Money Loan', icon: '💰' },
        bnpl: { label: 'BNPL', icon: '🛒' },
        pawnshop: { label: 'Pawnshop', icon: '🪙' }
      };
      filters.push({
        id: 'product',
        ...productLabels[state.product]
      });
    }

    return filters;
  });

  filteredPermissionCount = computed(() => {
    return this.filteredResourceGroups().length;
  });

  // Resource groups with available permissions
  resourceGroups: ResourceGroup[] = [
    // System level
    { resource: 'dashboard', displayName: '📊 Dashboard', description: 'System dashboard access', actions: ['view'], category: 'system' },
    { resource: 'tenants', displayName: '🏢 Tenants', description: 'Manage tenant organizations', actions: ['read', 'create', 'update', 'delete', 'manage-subscriptions'], category: 'system' },
    { resource: 'users', displayName: '👥 Users', description: 'System-wide user management', actions: ['read', 'create', 'update', 'delete', 'export'], category: 'system' },
    { resource: 'roles', displayName: '🔐 Roles', description: 'System role management', actions: ['read', 'create', 'update', 'delete'], category: 'system' },
    { resource: 'modules', displayName: '🧩 Modules', description: 'System module management', actions: ['read', 'create', 'update', 'delete'], category: 'system' },
    { resource: 'permissions', displayName: '🔑 Permissions', description: 'Permission management', actions: ['read', 'create', 'update', 'delete'], category: 'system' },
    { resource: 'platforms', displayName: '📦 Platforms', description: 'Platform catalog and management', actions: ['read', 'create', 'update', 'delete', 'manage-catalog'], category: 'system' },
    { resource: 'subscriptions', displayName: '💳 Subscriptions', description: 'Subscription management', actions: ['read', 'create', 'update', 'delete', 'manage-plans'], category: 'system' },
    { resource: 'reports', displayName: '📈 Reports & Analytics', description: 'System reports and analytics', actions: ['view', 'export', 'tenant-usage', 'revenue'], category: 'system' },
    { resource: 'analytics', displayName: '📊 Analytics', description: 'Analytics dashboard', actions: ['view'], category: 'system' },
    { resource: 'recycle-bin', displayName: '🗑️ Recycle Bin', description: 'Deleted items recovery', actions: ['view', 'restore', 'permanent-delete'], category: 'system' },
    { resource: 'loans', displayName: '💵 Loans', description: 'System loan management', actions: ['read', 'create', 'update', 'delete', 'approve', 'disburse'], category: 'system' },
    { resource: 'payments', displayName: '💳 Payments', description: 'System payment management', actions: ['read', 'create', 'update', 'delete'], category: 'system' },
    { resource: 'audit', displayName: '📋 Audit', description: 'System audit logs', actions: ['read', 'export'], category: 'system' },
    { resource: 'settings', displayName: '⚙️ Settings', description: 'System settings', actions: ['read', 'update'], category: 'system' },
    { resource: 'system-logs', displayName: '📝 System Logs', description: 'System logging and monitoring', actions: ['view', 'export', 'delete', 'manage'], category: 'system' },
    { resource: 'audit-logs', displayName: '🔍 Audit Logs', description: 'Audit trail and user actions', actions: ['view', 'export', 'delete', 'manage'], category: 'system' },
    { resource: 'activity-dashboard', displayName: '📊 Activity Dashboard', description: 'System activity overview', actions: ['view', 'manage'], category: 'system' },
    { resource: 'backup', displayName: '💾 System Backup', description: 'Database backup and restore', actions: ['view', 'create', 'delete', 'restore'], category: 'system' },
    { resource: 'security-policy', displayName: '🔒 Security Policy', description: 'Security settings and policies', actions: ['view', 'update', 'manage'], category: 'system' },

    // Tenant level - keeping all UI structure but matching DB permission keys
    { resource: 'tenant-dashboard', displayName: '🏠 Tenant Dashboard', description: 'Tenant dashboard access', actions: ['view'], category: 'tenant', product: 'core' },
    { resource: 'tenant-users', displayName: '👤 Tenant Users', description: 'Manage users within tenant', actions: ['read', 'create', 'update', 'delete', 'assign-roles', 'invite'], category: 'tenant', product: 'core' },
    { resource: 'tenant-roles', displayName: '🎭 Tenant Roles', description: 'Manage tenant roles', actions: ['read', 'create', 'update', 'delete'], category: 'tenant', product: 'core' },
    { resource: 'tenant-platforms', displayName: '🎁 Tenant Platforms', description: 'Tenant platform catalog', actions: ['read', 'configure', 'manage-settings'], category: 'tenant', product: 'core' },
    { resource: 'tenant-billing', displayName: '💳 Tenant Billing', description: 'Tenant billing and subscriptions', actions: ['read', 'view-subscriptions', 'view-invoices', 'manage-renewals', 'view-overview', 'update'], category: 'tenant', product: 'core' },
    { resource: 'tenant-reports', displayName: '📋 Tenant Reports', description: 'Tenant reports and analytics', actions: ['view', 'platform-usage', 'user-activity', 'billing-summary', 'transactions', 'export'], category: 'tenant', product: 'core' },
    { resource: 'tenant-recycle-bin', displayName: '♻️ Tenant Recycle Bin', description: 'Tenant deleted items recovery', actions: ['view', 'restore', 'view-history'], category: 'tenant', product: 'core' },
  { resource: 'tenant-settings', displayName: '🔧 Tenant Settings', description: 'Tenant configuration', actions: ['read', 'update'], category: 'tenant', product: 'core' },
  { resource: 'tenant-customers', displayName: '🧾 Tenant Customers', description: 'Manage tenant customer records', actions: ['read', 'create', 'update', 'delete', 'export'], category: 'tenant', product: 'core' },

    // Business modules (treated as tenant-level)
    // Money Loan - Granular Permissions (61 permissions)
        // Business modules (treated as tenant-level)
    // Money Loan - Granular Permissions (matching DB structure with nested colons)
  { resource: 'money-loan:overview', displayName: '💰 Money Loan: Overview', description: 'Overview dashboard metrics', actions: ['view', 'total-loans', 'collection-rate', 'overdue-percentage', 'outstanding-amount', 'default-rate'], category: 'tenant', product: 'money-loan' },
  { resource: 'money-loan', displayName: '💰 Money Loan: Core', description: 'Base money loan module access', actions: ['read', 'create', 'update', 'approve', 'payments'], category: 'tenant', product: 'money-loan' },
  { resource: 'money-loan:customers', displayName: '💰 Money Loan: Customers', description: 'Customer management', actions: ['read', 'create', 'update', 'delete', 'view-high-risk'], category: 'tenant', product: 'money-loan' },
  { resource: 'money-loan:loans', displayName: '💰 Money Loan: Loans', description: 'Loan management', actions: ['read', 'create', 'update', 'delete', 'approve', 'disburse', 'view-overdue', 'close', 'use-calculator'], category: 'tenant', product: 'money-loan' },
  { resource: 'money-loan:payments', displayName: '💰 Money Loan: Payments', description: 'Payment processing', actions: ['read', 'create', 'view-today', 'bulk-import', 'refund', 'view-failed', 'configure-gateway'], category: 'tenant', product: 'money-loan' },
  { resource: 'money-loan:interest', displayName: '💰 Money Loan: Interest & Rules', description: 'Interest rate management', actions: ['read', 'update', 'manage-auto-rules', 'manual-override', 'use-calculator'], category: 'tenant', product: 'money-loan' },
  { resource: 'money-loan:collections', displayName: '💰 Money Loan: Collections', description: 'Collections management', actions: ['read', 'manage-workflow', 'manage-strategies', 'legal-actions', 'view-recovery'], category: 'tenant', product: 'money-loan' },
  { resource: 'money-loan:kyc', displayName: '💰 Money Loan: KYC', description: 'KYC verification', actions: ['read', 'review', 'approve', 'view-audit-logs', 'view-webhook-logs', 'configure'], category: 'tenant', product: 'money-loan' },
  { resource: 'money-loan:reports', displayName: '💰 Money Loan: Reports', description: 'Reporting and analytics', actions: ['read', 'generate-periodic', 'tax-summary', 'export', 'custom-queries'], category: 'tenant', product: 'money-loan' },
  { resource: 'money-loan:settings', displayName: '💰 Money Loan: Settings', description: 'Product settings', actions: ['read', 'manage-roles', 'manage-loan-products', 'manage-templates', 'manage-branding', 'manage-api-keys', 'view-audit-log'], category: 'tenant', product: 'money-loan' },
  { resource: 'money-loan:audit', displayName: '💰 Money Loan: Audit', description: 'Audit trail', actions: ['read', 'view-data-changes', 'export'], category: 'tenant', product: 'money-loan' },
  { resource: 'money-loan:notifications', displayName: '💰 Money Loan: Notifications', description: 'System notifications', actions: ['read'], category: 'tenant', product: 'money-loan' },
  { resource: 'money-loan:user-management', displayName: '💰 Money Loan: User Mgmt', description: 'Staff management', actions: ['manage'], category: 'tenant', product: 'money-loan' },
  { resource: 'money-loan:integrations', displayName: '💰 Money Loan: Integrations', description: 'External integrations', actions: ['configure'], category: 'tenant', product: 'money-loan' },

  // Money Loan - Collector Permissions (52 permissions)
  { resource: 'money-loan:assigned-customers', displayName: '💰 Collector: Assigned Customers', description: 'View and manage assigned customers', actions: ['read', 'view-details', 'view-loan-history', 'view-payment-history'], category: 'tenant', product: 'money-loan' },
  { resource: 'money-loan:assigned-applications', displayName: '💰 Collector: Applications', description: 'Approve/reject applications within limits', actions: ['read', 'approve', 'reject', 'request-review', 'view-limits'], category: 'tenant', product: 'money-loan' },
  { resource: 'money-loan:assigned-loans', displayName: '💰 Collector: Loan Disbursement', description: 'Disburse approved loans', actions: ['read', 'disburse', 'view-pending-disbursement', 'view-disbursement-limits', 'request-disbursement-approval'], category: 'tenant', product: 'money-loan' },
  { resource: 'money-loan:assigned-payments', displayName: '💰 Collector: Payment Collection', description: 'Collect payments from customers', actions: ['collect', 'collect-cash', 'collect-bank-transfer', 'view-schedule', 'view-overdue', 'view-collection-summary'], category: 'tenant', product: 'money-loan' },
  { resource: 'money-loan:penalties', displayName: '💰 Collector: Penalty Waiver', description: 'Waive penalties within limits', actions: ['view', 'waive-partial', 'waive-request', 'view-waiver-history', 'view-waiver-limits', 'approve-waiver'], category: 'tenant', product: 'money-loan' },
  { resource: 'money-loan:route', displayName: '💰 Collector: Customer Visits', description: 'GPS tracking and visit management', actions: ['view', 'check-in', 'record-visit', 'upload-photo', 'capture-signature', 'view-visit-history', 'optimize'], category: 'tenant', product: 'money-loan' },
  { resource: 'money-loan:collector-reports', displayName: '💰 Collector: Reports', description: 'Performance and collection reports', actions: ['view-daily', 'view-weekly', 'view-monthly', 'view-targets', 'export'], category: 'tenant', product: 'money-loan' },
  { resource: 'money-loan:collection-activities', displayName: '💰 Collector: Activities', description: 'Collection activity tracking', actions: ['create', 'view', 'follow-up', 'escalate'], category: 'tenant', product: 'money-loan' },
  { resource: 'money-loan:collector-management', displayName: '💰 Collector: Management', description: 'Manage collectors (Admin/Manager)', actions: ['read', 'assign-customers', 'set-limits', 'set-targets', 'view-all-performance', 'view-action-logs', 'view-gps-tracking', 'manage'], category: 'tenant', product: 'money-loan' },
  { resource: 'money-loan:collector-notifications', displayName: '💰 Collector: Notifications', description: 'Collector notifications', actions: ['view', 'send-reminder'], category: 'tenant', product: 'money-loan' },

    // BNPL & Pawnshop
    { resource: 'bnpl', displayName: 'ðŸ›’ Buy Now Pay Later', description: 'BNPL management', actions: ['read', 'create', 'update', 'manage'], category: 'tenant', product: 'bnpl' },
    { resource: 'pawnshop', displayName: 'ðŸª Pawnshop', description: 'Pawnshop operations', actions: ['read', 'create', 'update', 'manage'], category: 'tenant', product: 'pawnshop' },

    // Customer Portal permissions
    { resource: 'customer-dashboard', displayName: '👤 Customer Portal: Dashboard', description: 'Customer dashboard access', actions: ['view'], category: 'customer' },
    { resource: 'customer-profile', displayName: '👤 Customer Portal: Profile', description: 'Manage own customer profile', actions: ['read', 'update'], category: 'customer' },
    { resource: 'customer-loans', displayName: '👤 Customer Portal: Loans', description: 'Customer loan activities', actions: ['read', 'apply'], category: 'customer' },
    { resource: 'customer-payments', displayName: '👤 Customer Portal: Payments', description: 'Customer payment actions', actions: ['read', 'create'], category: 'customer' },
  ];

  // Selected permissions stored as Set<permissionKey> where permissionKey = 'resource:action'
  selectedPermissions = signal<Set<string>>(new Set());
  private readonly essentialTenantPermissions: string[] = ['tenant-dashboard:view', 'tenant-users:read'];

  private parsePermissionKey(permKey: string): { resource: string; action: string } {
    if (!permKey) {
      return { resource: '', action: '' };
    }
    const segments = permKey.split(':');
    if (segments.length < 2) {
      return { resource: permKey, action: '' };
    }
    const action = segments.pop()!;
    return { resource: segments.join(':'), action };
  }

  // Tenant context detection
  isTenantContext = signal(false);

  // Read-only mode detection
  isReadOnlyMode = signal(false);
  readOnlyReason = signal('');

  // Filtered resource groups based on selected space and space filter
  filteredResourceGroups = computed(() => {
    let groups = this.resourceGroups;
    const state = this.filterState();

    // Customer-space roles should only see customer permissions regardless of tab selection
    const effectiveSpace = this.roleSpace === 'customer' ? 'customer' : state.space;

    // Apply the effective space filter
    if (effectiveSpace === 'system') {
      groups = groups.filter(group => group.category === 'system');
    } else if (effectiveSpace === 'tenant') {
      groups = groups.filter(group => group.category === 'tenant');
    } else if (effectiveSpace === 'customer') {
      groups = groups.filter(group => group.category === 'customer');
    }
    // If 'all', show all available groups (already filtered by role space above)

    // Apply product filter (only for tenant category)
    if (state.product !== 'all') {
      groups = groups.filter(group => {
        // If it's not a tenant category, keep it
        if (group.category !== 'tenant') return true;
        // If it's tenant category, check if it matches the product filter
        return group.product === state.product;
      });
    }

    return groups;
  });

  getFilteredCount(): number {
    return this.filteredResourceGroups().length;
  }

  // Filter control methods
  setSpaceFilter(space: 'all' | 'system' | 'tenant' | 'customer'): void {
    this.filterState.update(state => ({
      ...state,
      space,
      // Reset product filter if switching away from tenant context
      product: space === 'tenant' || space === 'all' ? state.product : 'all'
    }));
  }

  setProductFilter(product: 'all' | 'core' | 'money-loan' | 'bnpl' | 'pawnshop'): void {
    this.filterState.update(state => ({
      ...state,
      product
    }));
  }

  removeFilter(filterId: string): void {
    if (filterId === 'space') {
      this.setSpaceFilter('all');
    } else if (filterId === 'product') {
      this.setProductFilter('all');
    }
  }

  clearAllFilters(): void {
    this.filterState.set({ space: 'all', product: 'all' });
  }

  isProductDisabled(product: string): boolean {
    const counts = this.productTabCounts();
    return counts[product as keyof typeof counts].permissions === 0;
  }

  constructor(
    public roleService: RoleService,
    private route: ActivatedRoute,
    private router: Router,
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    private authService: AuthService,
    private toastService: ToastService
  ) {}

  ngOnInit(): void {
    // Detect tenant context from URL
    const url = this.router.url;
    const isTenantCtx = url.startsWith('/tenant/');
    this.isTenantContext.set(isTenantCtx);

    // Auto-set space filter to tenant when in tenant context
    if (this.isTenantContext()) {
      this.setSpaceFilter('tenant');
      // Force roleSpace to tenant for tenant context
      this.roleSpace = 'tenant';
      // In tenant context, auto-set the tenant ID from current user
      const currentTenantId = this.authService.getTenantId();
      if (currentTenantId) {
        this.selectedTenantIds.set([Number(currentTenantId)]);
        console.log('ðŸ¢ Tenant context: Auto-selected tenant ID:', currentTenantId);
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
    console.log('ðŸ”„ Loading role ID:', this.roleId);

    const role = await this.roleService.getRole(this.roleId);
    console.log('ðŸ”„ Role data received:', role);

    if (role) {
      this.roleName = role.name;
      this.roleDescription = role.description || '';
      this.roleSpace = role.space;

      if (this.roleSpace === 'customer') {
        this.setSpaceFilter('customer');
      }

      // Load tenant ID if this is a tenant role
      if (role.tenantId) {
        this.selectedTenantId = role.tenantId;
        console.log('✅ Loaded tenant ID:', this.selectedTenantId);
      }

      // Detect read-only mode
      this.detectReadOnlyMode(role);

      console.log('📄 Role permissions array:', role.permissions);
      console.log('ðŸ”„ Permissions is array?', Array.isArray(role.permissions));
      console.log('ðŸ”„ Permissions length:', role.permissions?.length);

      // Load permissions into set
      const permSet = new Set<string>();
      if (role.permissions && Array.isArray(role.permissions)) {
        for (const perm of role.permissions) {
          console.log('ðŸ” Processing permission:', perm);
          const permKey = perm.permissionKey || `${perm.resource}:${perm.action}`;
          console.log('ðŸ” Permission key:', permKey);
          permSet.add(permKey);
        }
      } else {
        console.warn('âš ï¸ Permissions is not an array or is null:', role.permissions);
      }

  console.log('âœ… Loaded permissions set:', Array.from(permSet));
  console.log('âœ… Total permissions loaded:', permSet.size);
  this.ensureEssentialTenantPermissions(permSet);
  this.selectedPermissions.set(permSet);
      this.cdr.detectChanges();
      console.log('âœ… Selected permissions signal updated');
    } else {
      console.error('âŒ No role data returned');
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
  getPermissionCategory(permKey: string): 'system' | 'tenant' | 'customer' | null {
    const { resource, action } = this.parsePermissionKey(permKey);

    for (const group of this.resourceGroups) {
      if (group.resource === resource && action && group.actions.includes(action)) {
        if (group.category === 'business') {
          return 'tenant';
        }
        return group.category as 'system' | 'tenant' | 'customer';
      }
    }

    return null;
  }

  // Toggle methods for quick actions
  toggleSelectAll(): void {
    if (this.areAllSelected()) {
      // Unselect all
      const perms = new Set<string>();
      this.ensureEssentialTenantPermissions(perms);
      this.selectedPermissions.set(perms);
    } else {
      // Select all visible permissions
      const perms = new Set<string>();
      this.filteredResourceGroups().forEach((group: ResourceGroup) => {
        group.actions.forEach((action: string) => {
          perms.add(`${group.resource}:${action}`);
        });
      });
      this.ensureEssentialTenantPermissions(perms);
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

    this.ensureEssentialTenantPermissions(perms);
    this.selectedPermissions.set(perms);

    // Apply system filter to show what was just selected/unselected
    this.setSpaceFilter('system');
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

    this.ensureEssentialTenantPermissions(perms);
    this.selectedPermissions.set(perms);

    // Apply tenant filter with core product to show what was just selected/unselected
    this.setSpaceFilter('tenant');
    this.setProductFilter('core');
  }

  toggleSelectProduct(product: 'money-loan' | 'bnpl' | 'pawnshop'): void {
    const perms = new Set<string>();
    const targetGroups = this.resourceGroups.filter(group => group.product === product);
    const allSelected = this.areAllProductSelected(product);

    // Preserve permissions outside the selected product scope
    this.selectedPermissions().forEach(permKey => {
      const { resource } = this.parsePermissionKey(permKey);
      const group = resource ? this.resourceGroups.find(g => g.resource === resource) : undefined;
      if (!group || group.product !== product) {
        perms.add(permKey);
      }
    });

    if (!allSelected) {
      targetGroups.forEach(group => {
        group.actions.forEach(action => {
          perms.add(`${group.resource}:${action}`);
        });
      });
    }

    this.ensureEssentialTenantPermissions(perms);
    this.selectedPermissions.set(perms);

    // Focus filters on the selected product for immediate visibility
    this.setSpaceFilter('tenant');
    this.setProductFilter(product);
  }

  toggleSelectCollector(): void {
    const perms = new Set<string>();
    const collectorResources = [
      'money-loan:assigned-customers',
      'money-loan:assigned-applications',
      'money-loan:assigned-loans',
      'money-loan:assigned-payments',
      'money-loan:penalties',
      'money-loan:route',
      'money-loan:collector-reports',
      'money-loan:collection-activities',
      'money-loan:collector-management',
      'money-loan:collector-notifications'
    ];
    const targetGroups = this.resourceGroups.filter(group => 
      collectorResources.includes(group.resource)
    );
    const allSelected = this.areAllCollectorSelected();

    // Preserve all existing permissions
    this.selectedPermissions().forEach(permKey => {
      const { resource } = this.parsePermissionKey(permKey);
      if (!resource || !collectorResources.includes(resource)) {
        perms.add(permKey);
      }
    });

    // If not all selected, select all collector permissions
    if (!allSelected) {
      targetGroups.forEach(group => {
        group.actions.forEach(action => {
          perms.add(`${group.resource}:${action}`);
        });
      });
    }

    this.ensureEssentialTenantPermissions(perms);
    this.selectedPermissions.set(perms);

    // Focus filters on money-loan product for immediate visibility
    this.setSpaceFilter('tenant');
    this.setProductFilter('money-loan');
  }

  toggleSelectCustomer(): void {
    const perms = new Set<string>();

    if (this.areAllCustomerSelected()) {
      this.selectedPermissions().forEach(permKey => {
        const category = this.getPermissionCategory(permKey);
        if (category !== 'customer') {
          perms.add(permKey);
        }
      });
    } else {
      this.selectedPermissions().forEach(permKey => {
        const category = this.getPermissionCategory(permKey);
        if (category !== 'customer') {
          perms.add(permKey);
        }
      });

      this.resourceGroups.forEach(group => {
        if (group.category === 'customer') {
          group.actions.forEach(action => {
            perms.add(`${group.resource}:${action}`);
          });
        }
      });
    }

    this.ensureEssentialTenantPermissions(perms);
    this.selectedPermissions.set(perms);
    this.setSpaceFilter('customer');
  }

  // Check if all permissions are selected
  areAllSelected(): boolean {
    let totalAvailable = 0;
    this.filteredResourceGroups().forEach((group: ResourceGroup) => {
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

  // Check if all permissions for a specific product are selected
  areAllProductSelected(product: 'money-loan' | 'bnpl' | 'pawnshop'): boolean {
    let totalPerms = 0;
    let selectedPerms = 0;

    this.resourceGroups.forEach(group => {
      if (group.product === product) {
        totalPerms += group.actions.length;
        group.actions.forEach(action => {
          if (this.selectedPermissions().has(`${group.resource}:${action}`)) {
            selectedPerms++;
          }
        });
      }
    });

    return totalPerms > 0 && selectedPerms === totalPerms;
  }

  areAllCollectorSelected(): boolean {
    const collectorResources = [
      'money-loan:assigned-customers',
      'money-loan:assigned-applications',
      'money-loan:assigned-loans',
      'money-loan:assigned-payments',
      'money-loan:penalties',
      'money-loan:route',
      'money-loan:collector-reports',
      'money-loan:collection-activities',
      'money-loan:collector-management',
      'money-loan:collector-notifications'
    ];

    let totalPerms = 0;
    let selectedPerms = 0;

    this.resourceGroups.forEach(group => {
      if (collectorResources.includes(group.resource)) {
        totalPerms += group.actions.length;
        group.actions.forEach(action => {
          if (this.selectedPermissions().has(`${group.resource}:${action}`)) {
            selectedPerms++;
          }
        });
      }
    });

    return totalPerms > 0 && selectedPerms === totalPerms;
  }

  areAllCustomerSelected(): boolean {
    let totalCustomerPerms = 0;
    let selectedCustomerPerms = 0;

    this.resourceGroups.forEach(group => {
      if (group.category === 'customer') {
        totalCustomerPerms += group.actions.length;
        group.actions.forEach(action => {
          if (this.selectedPermissions().has(`${group.resource}:${action}`)) {
            selectedCustomerPerms++;
          }
        });
      }
    });

    return totalCustomerPerms > 0 && selectedCustomerPerms === totalCustomerPerms;
  }

  // Legacy methods (kept for compatibility)
  selectAll(): void {
    this.toggleSelectAll();
  }

  clearAllPermissions(): void {
    const perms = new Set<string>();
    this.ensureEssentialTenantPermissions(perms);
    this.selectedPermissions.set(perms);
  }

  private ensureEssentialTenantPermissions(perms: Set<string>): void {
    if (this.roleSpace !== 'tenant') {
      return;
    }

    this.essentialTenantPermissions.forEach(key => perms.add(key));
  }

  getTotalSelectedPermissions(): number {
    return this.selectedPermissions().size;
  }

  getTotalSelectedResources(): number {
    const resources = new Set<string>();
    this.selectedPermissions().forEach(permKey => {
      const { resource } = this.parsePermissionKey(permKey);
      if (resource) {
        resources.add(resource);
      }
    });
    return resources.size;
  }

  getActionCount(action: string): number {
    let count = 0;
    this.selectedPermissions().forEach(permKey => {
      const { action: permAction } = this.parsePermissionKey(permKey);
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
    // Cannot save in read-only mode
    if (this.isReadOnlyMode()) {
      return false;
    }

    const hasName = this.roleName.trim().length > 0;
    const hasPermissions = this.getTotalSelectedPermissions() > 0;

    // For editing: allow saving with 0 permissions (to clear all)
    // For creating: require at least one permission
    const hasPermissionsIfNeeded = this.isEditing() ? true : hasPermissions;

    // For editing: tenant roles already have tenant_id from DB
    // For creating: tenant roles need at least one tenant selected
    let hasTenantIfNeeded = true;
    if (this.roleSpace === 'tenant' && !this.isEditing()) {
      hasTenantIfNeeded = this.selectedTenantIds().length > 0;
    }

    return hasName && hasPermissionsIfNeeded && hasTenantIfNeeded;
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

    console.log('ðŸ”„ Starting role save...');

    try {
      // Convert permissions set to array of objects
      const permissionsArray = Array.from(this.selectedPermissions()).map(permKey => ({
        permissionKey: permKey
      }));

      console.log('ðŸ“‹ Permissions to save:', permissionsArray);

      if (this.isEditing() && this.roleId) {
        console.log('âœï¸ Updating existing role:', this.roleId);
        const updated = await this.roleService.updateRole(this.roleId, {
          name: this.roleName,
          description: this.roleDescription
        });
        if (updated) {
          console.log('âœ… Role updated, now assigning permissions...');
          const bulkResult = await this.roleService.bulkAssignPermissions(this.roleId, permissionsArray);
          console.log('âœ… Bulk assign returned:', bulkResult);

          if (bulkResult) {
            console.log('âœ… Permissions assigned successfully, navigating...');

            // Show success toast
            this.toastService.success(
              `✅ Role "${this.roleName}" updated successfully with ${permissionsArray.length} permissions`
            );

            this.router.navigate([this.isTenantContext() ? '/tenant/roles' : '/admin/roles']);
          } else {
            const errorMsg = this.roleService.errorSignal() || 'Failed to assign permissions';
            console.error('❌ Bulk assign failed:', errorMsg);
            this.toastService.error(`❌ ${errorMsg}`);
          }
        } else {
          const errorMsg = this.roleService.errorSignal() || 'Failed to update role';
          console.error('âŒ Update failed:', errorMsg);
          alert(errorMsg);
        }
      } else {
        console.log('âž• Creating new role...');

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

            console.log('ðŸ“¤ Creating role for tenant:', tenantId);
            const created = await this.roleService.createRole(payload);

            if (created) {
              console.log('âœ… Role created with ID:', created.id);
              await this.roleService.bulkAssignPermissions(created.id, permissionsArray);
              successCount++;
            } else {
              console.error('âŒ Failed to create role for tenant:', tenantId);
            }
          }

          if (successCount > 0) {
            console.log(`âœ… Successfully created ${successCount} role(s)`);
            this.toastService.success(
              `✅ Successfully created ${successCount} role(s) with ${permissionsArray.length} permissions each`
            );
            this.router.navigate([this.isTenantContext() ? '/tenant/roles' : '/admin/roles']);
          } else {
            this.toastService.error('❌ Failed to create roles for selected tenants');
          }
        } else {
          // System role - no tenant ID needed
          const payload: any = {
            name: this.roleName,
            description: this.roleDescription,
            space: this.roleSpace
          };

          console.log('ðŸ“¤ Payload:', payload);
          const created = await this.roleService.createRole(payload);

          if (created) {
            console.log('âœ… Role created with ID:', created.id);
            await this.roleService.bulkAssignPermissions(created.id, permissionsArray);
            this.toastService.success(
              `✅ Role "${this.roleName}" created successfully with ${permissionsArray.length} permissions`
            );
            this.router.navigate([this.isTenantContext() ? '/tenant/roles' : '/admin/roles']);
          } else {
            const errorMsg = this.roleService.errorSignal() || 'Failed to create role';
            console.error('âŒ Create failed:', errorMsg);
            alert(errorMsg);
          }
        }
      }
    } catch (error) {
      console.error('âŒ Exception in saveRole:', error);
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

  /**
   * Detect if current user can edit this role (read-only mode detection)
   */
  detectReadOnlyMode(role: any): void {
    const currentTenantId = this.authService.getTenantId();
    const isSuperAdmin = currentTenantId === null || currentTenantId === undefined;

    // Super Admin viewing tenant role = READ ONLY
    if (isSuperAdmin && role.space === 'tenant') {
      this.isReadOnlyMode.set(true);
      this.readOnlyReason.set(
        `🚫 You cannot modify tenant roles. This role "${role.name}" belongs to a tenant and must be managed by that tenant's administrators. You have read-only access for oversight purposes.`
      );
      console.log('🔒 READ-ONLY MODE: Super Admin viewing tenant role');
      return;
    }

    // Tenant user viewing system role = READ ONLY
    if (!isSuperAdmin && role.space === 'system') {
      this.isReadOnlyMode.set(true);
      this.readOnlyReason.set(
        `🚫 You cannot modify system roles. This role "${role.name}" is a system role and can only be managed by system administrators. You have read-only access to see system capabilities.`
      );
      console.log('🔒 READ-ONLY MODE: Tenant user viewing system role');
      return;
    }

    // Tenant user viewing another tenant's role = READ ONLY
    if (!isSuperAdmin && role.tenantId && role.tenantId !== Number(currentTenantId)) {
      this.isReadOnlyMode.set(true);
      this.readOnlyReason.set(
        `🚫 You cannot modify roles from other tenants. This role belongs to another tenant. You can only manage roles within your own tenant.`
      );
      console.log('🔒 READ-ONLY MODE: Cross-tenant access');
      return;
    }

    // Default: Editable
    this.isReadOnlyMode.set(false);
    this.readOnlyReason.set('');
    console.log('✅ EDITABLE MODE: User can modify this role');
  }

  /**
   * Check if a specific permission is disabled (should show locked state)
   */
  isPermissionDisabled(resource: string, action: string): boolean {
    // In read-only mode, all permissions are disabled
    if (this.isReadOnlyMode()) {
      return true;
    }

    // When creating/editing, check space compatibility
    const permKey = `${resource}:${action}`;
    const permCategory = this.getPermissionCategory(permKey);

    // If role is tenant space, system permissions should be disabled
    if (this.roleSpace === 'tenant' && permCategory === 'system') {
      return true;
    }

    if (this.roleSpace === 'customer' && permCategory !== 'customer') {
      return true;
    }

    // If role is system space, tenant permissions are allowed but flagged
    // (system admin can choose to assign tenant permissions if needed)
    // We don't disable them, just show visual indicator

    return false;
  }

  /**
   * Get tooltip message for disabled permission
   */
  getPermissionTooltip(resource: string, action: string): string {
    const permKey = `${resource}:${action}`;
    const permCategory = this.getPermissionCategory(permKey);

    // Read-only mode tooltips
    if (this.isReadOnlyMode()) {
      return this.readOnlyReason();
    }

    // Space mismatch tooltips
    if (this.roleSpace === 'tenant' && permCategory === 'system') {
      return `🚫 Permission Denied\n\nTenant roles cannot have system permissions.\n\nFor security reasons, tenant roles can only access tenant-space and product-specific permissions.\n\nSystem permissions like "${permKey}" are reserved for system administrators only.`;
    }

    if (this.roleSpace === 'customer' && permCategory !== 'customer') {
      return `🚫 Permission Denied\n\nCustomer roles only support customer portal permissions.\n\nPermissions like "${permKey}" belong to tenant or system spaces and are restricted to internal roles.`;
    }

    return '';
  }

  /**
   * Check if permission checkbox should be visible
   * (Used to hide incompatible permissions instead of just disabling them)
   */
  isPermissionVisible(resource: string, action: string): boolean {
    const permKey = `${resource}:${action}`;
    const permCategory = this.getPermissionCategory(permKey);

    // In tenant role creation/editing (not read-only), hide system permissions
    if (this.roleSpace === 'tenant' && permCategory === 'system' && !this.isReadOnlyMode()) {
      return false;
    }

    if (this.roleSpace === 'customer' && permCategory !== 'customer' && !this.isReadOnlyMode()) {
      return false;
    }

    return true;
  }
}




