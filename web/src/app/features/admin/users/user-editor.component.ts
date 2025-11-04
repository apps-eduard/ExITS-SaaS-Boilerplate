import { Component, OnInit, signal, ChangeDetectorRef, computed, ViewChild } from '@angular/core';
import { firstValueFrom } from 'rxjs';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { UserService, User, UserCreatePayload, UserUpdatePayload } from '../../../core/services/user.service';
import { RoleService, Role } from '../../../core/services/role.service';
import { AddressService, AddressCreatePayload } from '../../../core/services/address.service';
import { AuthService } from '../../../core/services/auth.service';
import { ProductSubscriptionService, PlatformSubscription } from '../../../core/services/product-subscription.service';
import { TenantService } from '../../../core/services/tenant.service';
import { ToastService } from '../../../core/services/toast.service';
import { ResetPasswordModalComponent } from '../../../shared/components/reset-password-modal/reset-password-modal.component';

interface Tenant {
  id: number;
  name: string;
  subdomain: string;
  status: string;
  moneyLoanEnabled?: boolean;
  bnplEnabled?: boolean;
  pawnshopEnabled?: boolean;
}

@Component({
  selector: 'app-user-editor',
  standalone: true,
  imports: [CommonModule, FormsModule, ResetPasswordModalComponent],
  template: `
    <div class="p-4 max-w-4xl mx-auto">
      <!-- Header -->
      <div class="mb-4">
        <div class="flex items-center justify-between mb-1">
          <div class="flex items-center gap-2">
            <button
              (click)="goBack()"
              class="p-1 rounded hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <svg class="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
              </svg>
            </button>
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">
              {{ isEditMode() ? 'Edit User' : 'Create New User' }}
            </h1>
          </div>

          <!-- Reset Password Button (only in edit mode) -->
          <button
            *ngIf="isEditMode()"
            (click)="openResetPasswordModal()"
            type="button"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-purple-600 rounded-lg hover:bg-purple-700 transition-all shadow-sm hover:shadow"
          >
            <span class="text-sm">🔑</span>
            Reset Password
          </button>
        </div>
        <p class="text-xs text-gray-500 dark:text-gray-400 ml-7">
          {{ isEditMode() ? 'Update user information and manage roles' : 'Add a new user to the system' }}
        </p>
      </div>

      <!-- Error Message -->
      <div *ngIf="errorMessage()" class="mb-3 rounded border border-red-200 bg-red-50 px-3 py-2 dark:border-red-900 dark:bg-red-900/20">
        <div class="flex items-start gap-2">
          <svg class="w-4 h-4 text-red-600 dark:text-red-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div>
            <p class="text-xs font-medium text-red-800 dark:text-red-300">{{ errorMessage() }}</p>
          </div>
        </div>
      </div>

      <!-- Form -->
      <div class="space-y-4">
        <!-- Main Tabs -->
        <div class="border-b border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 rounded-t-lg">
          <div class="flex gap-1 px-2 pt-2">
            <button
              type="button"
              (click)="activeTab.set('basic')"
              [class]="activeTab() === 'basic'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 bg-gray-50 dark:bg-gray-800'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'"
              class="flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors rounded-t"
            >
              <span class="text-base">👤</span>
              Basic Info
            </button>
            <button
              type="button"
              (click)="activeTab.set('roles')"
              [class]="activeTab() === 'roles'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 bg-gray-50 dark:bg-gray-800'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'"
              class="flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors rounded-t"
            >
              <span class="text-base">🔑</span>
              Roles
            </button>
            <button
              *ngIf="userType === 'tenant' || isTenantContext()"
              type="button"
              (click)="activeTab.set('platforms')"
              [class]="activeTab() === 'platforms'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 bg-gray-50 dark:bg-gray-800'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'"
              class="flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors rounded-t"
            >
              <span class="text-base">🚀</span>
              Platforms
            </button>
            <button
              type="button"
              (click)="activeTab.set('address')"
              [class]="activeTab() === 'address'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 bg-gray-50 dark:bg-gray-800'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'"
              class="flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors rounded-t"
            >
              <span class="text-base">📍</span>
              Address
            </button>
            <button
              type="button"
              (click)="activeTab.set('employee')"
              [class]="activeTab() === 'employee'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 bg-gray-50 dark:bg-gray-800'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'"
              class="flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors rounded-t"
            >
              <span class="text-base">👔</span>
              Employee Profile
            </button>
          </div>
        </div>

        <!-- Tab Content -->
        <div class="rounded-b-lg border border-t-0 border-gray-200 bg-white p-6 dark:border-gray-700 dark:bg-gray-900">

          <!-- Basic Information Tab -->
          <div *ngIf="activeTab() === 'basic'">
            <h2 class="text-sm font-semibold text-gray-900 dark:text-white mb-4">Basic Information</h2>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <!-- First Name -->
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                First Name
              </label>
              <input
                name="firstName"
                [(ngModel)]="formData.firstName"
                type="text"
                placeholder="John"
                class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">User's given name</p>
            </div>

            <!-- Last Name -->
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Last Name
              </label>
              <input

              name="lastName"
                [(ngModel)]="formData.lastName"
                type="text"
                placeholder="Doe"
                class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">User's family name or surname</p>
            </div>

            <!-- Email -->
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Email <span class="text-red-500">*</span>
              </label>
              <input
                name="email"
                [(ngModel)]="formData.email"
                (ngModelChange)="onEmailChange($event)"
                (blur)="onEmailBlur()"
                type="email"
                placeholder="john.doe@example.com"
                class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                required
              />
              <div class="mt-1 text-xs">
                <span *ngIf="emailCheckInProgress()" class="text-gray-500">Checking email...</span>
                <span *ngIf="emailExists()" class="text-red-600">This email is already registered</span>
                <span *ngIf="emailCheckError()" class="text-yellow-600">{{ emailCheckError() }}</span>
                <span *ngIf="!emailCheckInProgress() && !emailExists() && !emailCheckError()" class="text-gray-500">Required - Valid email address for login and notifications</span>
              </div>
            </div>

            <!-- Password (Create only) -->
            <div *ngIf="!isEditMode()">
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Password <span class="text-red-500">*</span>
              </label>
              <input
                name="password"
                [(ngModel)]="formData.password"
                type="password"
                placeholder="••••••••"
                class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                required
              />
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Required - Minimum 8 characters with letters and numbers</p>
            </div>

            <!-- Status (Edit only) -->
            <div *ngIf="isEditMode()">
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Status
              </label>
              <select
                name="status"
                [(ngModel)]="formData.status"
                class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              >
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="suspended">Suspended</option>
              </select>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Active users can login, inactive/suspended cannot</p>
            </div>

            <!-- User Type (only shown in system admin context) -->
            <div *ngIf="!isTenantContext()">
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                User Type
              </label>
              <select
                name="userType"
                [(ngModel)]="userType"
                (ngModelChange)="onUserTypeChange()"
                [disabled]="isEditMode()"
                class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none disabled:bg-gray-100 disabled:cursor-not-allowed dark:border-gray-600 dark:bg-gray-800 dark:text-white dark:disabled:bg-gray-700"
              >
                <option value="system">System Admin</option>
                <option value="tenant">Tenant User</option>
              </select>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">System admins manage platform, tenant users manage specific tenants</p>
            </div>

            <!-- Tenant Info (read-only for edit mode) -->
            <div *ngIf="userType === 'tenant' && isEditMode()">
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                Tenant
              </label>
              <div class="flex items-center gap-2 w-full rounded border border-gray-300 bg-gray-50 px-2 py-1.5 text-xs text-gray-700 dark:border-gray-600 dark:bg-gray-700 dark:text-gray-300">
                <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                <span class="font-medium">{{ getTenantName() }}</span>
              </div>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
                Tenant cannot be changed after user creation
              </p>
            </div>
          </div>

          <!-- Tenant Selection (shown only for tenant users in create mode in system admin context) -->
          <div *ngIf="userType === 'tenant' && !isEditMode() && !isTenantContext()" class="mt-3">
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Select Tenant <span class="text-red-500">*</span>
            </label>

            <div *ngIf="loadingTenants()" class="text-xs text-gray-500 dark:text-gray-400 py-2">
              Loading tenants...
            </div>

            <select
              *ngIf="!loadingTenants()"
              [(ngModel)]="formData.tenantId"
              class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
              required
            >
              <option [ngValue]="undefined">-- Select a tenant --</option>
              <option *ngFor="let tenant of tenants()" [ngValue]="tenant.id">
                {{ tenant.name }} ({{ tenant.subdomain }})
              </option>
            </select>

            <p class="text-xs text-blue-600 dark:text-blue-400 mt-1">
              💡 Required - Choose which organization this user belongs to
            </p>
          </div>
        </div>

          <!-- Roles Tab -->
          <div *ngIf="activeTab() === 'roles'">
            <h2 class="text-sm font-semibold text-gray-900 dark:text-white mb-4">Role Assignment</h2>

          <div *ngIf="roleService.loadingSignal()" class="text-center py-4">
            <p class="text-sm text-gray-500 dark:text-gray-400">Loading roles...</p>
          </div>

          <div *ngIf="!roleService.loadingSignal()" class="space-y-2">
            <p class="text-xs text-gray-500 dark:text-gray-400">
              Select a single role for this user. Choosing a different role will replace the current assignment.
            </p>
            <div *ngFor="let role of availableRoles()" class="flex items-center gap-2 p-2 rounded border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-800">
              <input
                type="checkbox"
                [checked]="isRoleSelected(role.id)"
                (change)="toggleRole(role.id)"
                [id]="'role-' + role.id"
                class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
              />
              <label [for]="'role-' + role.id" class="flex-1 cursor-pointer">
                <div class="flex items-center gap-2">
                  <span class="text-xs font-medium text-gray-900 dark:text-white">{{ role.name }}</span>
                  <span [class]="'px-1.5 py-0.5 rounded text-xs font-medium ' + (role.space === 'system' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300' : 'bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300')">
                    {{ role.space | uppercase }}
                  </span>
                </div>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{{ role.description || 'No description' }}</p>
              </label>
            </div>

            <div *ngIf="availableRoles().length === 0" class="text-center py-3 text-xs text-gray-500 dark:text-gray-400">
              No roles available for this user type
            </div>
          </div>
        </div>

          <!-- Platforms Tab (Tenant Users Only) -->
          <div *ngIf="activeTab() === 'platforms'">
            <div class="mb-3">
              <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Platform Access</h2>
              <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Assign user to one or more products</p>
            </div>

          <div class="space-y-3">
            <!-- Money Loan Product -->
            <div *ngIf="availablePlatforms().moneyLoan" class="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <label class="flex items-center gap-2 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  [(ngModel)]="productAccess.moneyLoan.enabled"
                  (ngModelChange)="autoSetPrimaryPlatform()"
                  class="w-4 h-4 text-amber-600 rounded focus:ring-amber-500"
                />
                <div class="flex items-center gap-2 flex-1">
                  <span class="text-2xl">💰</span>
                  <div>
                    <span class="text-xs font-semibold text-gray-900 dark:text-white">Money Loan</span>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Grant access to loan management system</p>
                  </div>
                </div>
              </label>

              <div *ngIf="productAccess.moneyLoan.enabled" class="ml-9 mt-2">
                <label class="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    [(ngModel)]="productAccess.moneyLoan.isPrimary"
                    (ngModelChange)="onPrimaryPlatformChange('moneyLoan')"
                    class="w-3.5 h-3.5 text-amber-600 rounded"
                  />
                  <span class="text-gray-700 dark:text-gray-300">Set as primary</span>
                </label>
              </div>
            </div>

            <!-- BNPL Product -->
            <div *ngIf="availablePlatforms().bnpl" class="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <label class="flex items-center gap-2 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  [(ngModel)]="productAccess.bnpl.enabled"
                  (ngModelChange)="autoSetPrimaryPlatform()"
                  class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <div class="flex items-center gap-2 flex-1">
                  <span class="text-2xl">🛒</span>
                  <div>
                    <span class="text-xs font-semibold text-gray-900 dark:text-white">Buy Now Pay Later (BNPL)</span>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Grant access to BNPL system</p>
                  </div>
                </div>
              </label>

              <div *ngIf="productAccess.bnpl.enabled" class="ml-9 mt-2 space-y-2">
                <label class="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    [(ngModel)]="productAccess.bnpl.isPrimary"
                    (ngModelChange)="onPrimaryPlatformChange('bnpl')"
                    class="w-3.5 h-3.5 text-blue-600 rounded"
                  />
                  <span class="text-gray-700 dark:text-gray-300">Set as primary</span>
                </label>
              </div>
            </div>

            <!-- Pawnshop Product -->
            <div *ngIf="availablePlatforms().pawnshop" class="border border-gray-200 dark:border-gray-700 rounded-lg p-3">
              <label class="flex items-center gap-2 cursor-pointer mb-2">
                <input
                  type="checkbox"
                  [(ngModel)]="productAccess.pawnshop.enabled"
                  (ngModelChange)="autoSetPrimaryPlatform()"
                  class="w-4 h-4 text-green-600 rounded focus:ring-green-500"
                />
                <div class="flex items-center gap-2 flex-1">
                  <span class="text-2xl">💎</span>
                  <div>
                    <span class="text-xs font-semibold text-gray-900 dark:text-white">Pawnshop</span>
                    <p class="text-xs text-gray-500 dark:text-gray-400">Grant access to pawnshop system</p>
                  </div>
                </div>
              </label>

              <div *ngIf="productAccess.pawnshop.enabled" class="ml-9 mt-2 space-y-2">
                <label class="flex items-center gap-2 cursor-pointer text-xs">
                  <input
                    type="checkbox"
                    [(ngModel)]="productAccess.pawnshop.isPrimary"
                    (ngModelChange)="onPrimaryPlatformChange('pawnshop')"
                    class="w-3.5 h-3.5 text-green-600 rounded"
                  />
                  <span class="text-gray-700 dark:text-gray-300">Set as primary</span>
                </label>
              </div>
            </div>

            <!-- No Platforms Available -->
            <div *ngIf="!availablePlatforms().moneyLoan && !availablePlatforms().bnpl && !availablePlatforms().pawnshop" class="p-3 bg-gray-50 dark:bg-gray-800 rounded border border-gray-200 dark:border-gray-700">
              <p class="text-xs text-gray-600 dark:text-gray-400 text-center">
                ℹ️ No platforms available for this tenant. Contact your administrator to enable platforms.
              </p>
            </div>

            <div class="p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
              <p class="text-xs text-blue-700 dark:text-blue-300">
                <strong>Note:</strong> Platform access is combined with role permissions for layered security. Users must have both platform access AND appropriate role permissions to perform actions.
              </p>
            </div>
          </div>
        </div>

          <!-- Address Tab -->
          <div *ngIf="activeTab() === 'address'">
            <div class="mb-4">
              <h2 class="text-sm font-semibold text-gray-900 dark:text-white">Address Information</h2>
            </div>

            <div *ngIf="isEditMode() && noAddressOnRecord" class="mb-3 rounded border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-700 dark:border-amber-800 dark:bg-amber-900/20 dark:text-amber-200">
              ⚠️ No saved address found for this user. Add a primary address so contact details stay up to date.
            </div>

          <div class="space-y-3">
            <!-- Tabs -->
            <div class="border-b border-gray-200 dark:border-gray-700">
              <div class="flex gap-1">
                <button
                  type="button"
                  (click)="activeAddressTab.set('location')"
                  [class]="activeAddressTab() === 'location'
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'"
                  class="flex items-center gap-2 px-4 py-2 text-xs font-medium transition-colors"
                >
                  <span class="text-base">📍</span>
                  Location
                </button>
                <button
                  type="button"
                  (click)="activeAddressTab.set('contact')"
                  [class]="activeAddressTab() === 'contact'
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'"
                  class="flex items-center gap-2 px-4 py-2 text-xs font-medium transition-colors"
                >
                  <span class="text-base">📞</span>
                  Contact
                </button>
                <button
                  type="button"
                  (click)="activeAddressTab.set('additional')"
                  [class]="activeAddressTab() === 'additional'
                    ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                    : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300'"
                  class="flex items-center gap-2 px-4 py-2 text-xs font-medium transition-colors"
                >
                  <span class="text-base">📝</span>
                  Additional
                </button>
              </div>
            </div>

            <!-- Location Tab -->
            <div *ngIf="activeAddressTab() === 'location'" class="space-y-3">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <!-- Address Type -->
                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Address Type <span class="text-red-500">*</span>
                  </label>
                  <select
                    [(ngModel)]="addressData.addressType"
                    class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    required
                  >
                    <option value="">Select type</option>
                    <option value="home">🏠 Home</option>
                    <option value="work">💼 Work</option>
                    <option value="billing">💳 Billing</option>
                    <option value="shipping">📦 Shipping</option>
                    <option value="other">📌 Other</option>
                  </select>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Required - Select address category</p>
                </div>

                <!-- Region -->
                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Region <span class="text-red-500">*</span>
                  </label>
                  <select
                    [(ngModel)]="addressData.region"
                    class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    required
                  >
                    <option value="">Select region</option>
                    <option *ngFor="let region of addressService.regionsSignal()" [value]="region.code">
                      {{ region.name }}
                    </option>
                  </select>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Required - Philippine region (e.g., NCR, Region IV-A)</p>
                </div>

                <!-- Province -->
                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Province <span class="text-red-500">*</span>
                  </label>
                  <input
                    [(ngModel)]="addressData.province"
                    type="text"
                    placeholder="e.g., Metro Manila"
                    class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    required
                  />
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Required - Province or special administrative region</p>
                </div>

                <!-- City/Municipality -->
                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    City/Municipality <span class="text-red-500">*</span>
                  </label>
                  <input
                    [(ngModel)]="addressData.cityMunicipality"
                    type="text"
                    placeholder="e.g., Quezon City"
                    class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    required
                  />
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Required - City or municipality name</p>
                </div>

                <!-- Barangay -->
                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Barangay <span class="text-red-500">*</span>
                  </label>
                  <input
                    [(ngModel)]="addressData.barangay"
                    type="text"
                    placeholder="e.g., Barangay Commonwealth"
                    class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    required
                  />
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Required - Smallest administrative division</p>
                </div>

                <!-- Zip Code -->
                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Zip Code
                  </label>
                  <input
                    [(ngModel)]="addressData.zipCode"
                    type="text"
                    placeholder="e.g., 1121"
                    class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Postal code (4 digits in the Philippines)</p>
                </div>

                <!-- Street -->
                <div class="md:col-span-2">
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Street Address <span class="text-red-500">*</span>
                  </label>
                  <input
                    [(ngModel)]="addressData.street"
                    type="text"
                    placeholder="e.g., 123 Main Street, Subdivision Name"
                    class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    required
                  />
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Required - House/building number, street name, subdivision</p>
                </div>
              </div>

              <div class="p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                <p class="text-xs text-blue-700 dark:text-blue-300">
                  📍 <strong>Philippine address format:</strong> Street → Barangay → City/Municipality → Province → Region
                </p>
              </div>
            </div>

            <!-- Contact Tab -->
            <div *ngIf="activeAddressTab() === 'contact'" class="space-y-3">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                <!-- Contact Name -->
                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Contact Name
                  </label>
                  <input
                    [(ngModel)]="addressData.contactName"
                    type="text"
                    placeholder="Contact person name"
                    class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <!-- Contact Phone -->
                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Contact Phone
                  </label>
                  <input
                    [(ngModel)]="addressData.contactPhone"
                    type="tel"
                    placeholder="e.g., +63 912 345 6789"
                    class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <div class="p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                <p class="text-xs text-blue-700 dark:text-blue-300">
                  📞 <strong>Optional:</strong> Add contact information for this address location
                </p>
              </div>
            </div>

            <!-- Additional Tab -->
            <div *ngIf="activeAddressTab() === 'additional'" class="space-y-3">
              <div class="grid grid-cols-1 gap-3">
                <!-- Landmark -->
                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Landmark (Optional)
                  </label>
                  <input
                    [(ngModel)]="addressData.landmark"
                    type="text"
                    placeholder="e.g., Near SM Mall, Across McDonald's"
                    class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <!-- Notes -->
                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notes (Optional)
                  </label>
                  <textarea
                    [(ngModel)]="addressData.notes"
                    rows="3"
                    placeholder="Additional delivery instructions or notes"
                    class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  ></textarea>
                </div>

                <!-- Set as Primary -->
                <div>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      [(ngModel)]="addressData.isPrimary"
                      class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                    />
                    <span class="text-xs font-medium text-gray-700 dark:text-gray-300">⭐ Set as primary address</span>
                  </label>
                </div>
              </div>

              <div class="p-2 bg-blue-50 dark:bg-blue-900/20 rounded border border-blue-200 dark:border-blue-800">
                <p class="text-xs text-blue-700 dark:text-blue-300">
                  📝 <strong>Helpful info:</strong> Add landmarks and notes to help with deliveries or navigation
                </p>
              </div>
            </div>
          </div>
          </div>

          <!-- Employee Profile Tab -->
          <div *ngIf="activeTab() === 'employee'">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h2 class="text-sm font-semibold text-gray-900 dark:text-white">👔 Employee Profile</h2>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Employee-specific information and details</p>
              </div>
            </div>

            <div *ngIf="!hasEmployeeProfile" class="mb-3 rounded border border-amber-200 bg-amber-50 p-3 text-xs text-amber-700 dark:border-amber-700 dark:bg-amber-900/20 dark:text-amber-200">
              ⚠️ No existing employee profile was found for this user. Fill in the form below to capture their employment details.
            </div>

            <div class="space-y-4">
              <!-- Employment Information -->
              <div>
                <h3 class="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">Employment Information</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <!-- Employee ID -->
                  <div>
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Employee ID
                      <span class="text-gray-500 text-xs ml-1">(Auto-generated)</span>
                    </label>
                    <input
                      name="employeeCode"
                      [value]="employeeProfileData.employeeCode || autoGeneratedEmployeeCode()"
                      type="text"
                      readonly
                      placeholder="Will be generated on save"
                      class="w-full rounded border border-gray-300 bg-gray-50 px-2 py-1.5 text-xs text-gray-600 cursor-not-allowed dark:border-gray-600 dark:bg-gray-700 dark:text-gray-400"
                      title="Employee ID is auto-generated and cannot be edited"
                    />
                  </div>

                  <!-- Job Title -->
                  <div>
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Job Title
                    </label>
                    <input
                      name="jobTitle"
                      [(ngModel)]="employeeProfileData.position"
                      type="text"
                      placeholder="Software Engineer"
                      class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <!-- Department -->
                  <div>
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Department
                    </label>
                    <select
                      name="department"
                      [(ngModel)]="employeeProfileData.department"
                      class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="">Select Department</option>
                      <option value="IT">IT</option>
                      <option value="Human Resources">Human Resources</option>
                      <option value="Finance">Finance</option>
                      <option value="Operations">Operations</option>
                      <option value="Sales">Sales</option>
                      <option value="Marketing">Marketing</option>
                      <option value="Collections">Collections</option>
                      <option value="Customer Success">Customer Success</option>
                    </select>
                  </div>

                  <!-- Employment Type -->
                  <div>
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Employment Type
                    </label>
                    <select
                      name="employmentType"
                      [(ngModel)]="employeeProfileData.employmentType"
                      class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="">Select Type</option>
                      <option value="full-time">Full-time</option>
                      <option value="part-time">Part-time</option>
                      <option value="contract">Contract</option>
                      <option value="probationary">Probationary</option>
                      <option value="intern">Intern</option>
                    </select>
                  </div>

                  <!-- Hire Date -->
                  <div>
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Hire Date
                    </label>
                    <input
                      name="hireDate"
                      [(ngModel)]="employeeProfileData.hireDate"
                      type="date"
                      class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <!-- Employment Status -->
                  <div>
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Employment Status
                    </label>
                    <select
                      name="employmentStatus"
                      [(ngModel)]="employeeProfileData.employmentStatus"
                      class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="">Select Status</option>
                      <option value="active">Active</option>
                      <option value="inactive">Inactive</option>
                      <option value="on_leave">On Leave</option>
                      <option value="suspended">Suspended</option>
                      <option value="terminated">Terminated</option>
                    </select>
                  </div>
                </div>
              </div>

              <!-- Contact Information -->
              <div>
                <h3 class="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">Contact Information</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <!-- Work Phone -->
                  <div>
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Work Phone
                    </label>
                    <input
                      name="workPhone"
                      [(ngModel)]="employeeProfileData.workPhone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <!-- Work Email Extension -->
                  <div>
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Extension
                    </label>
                    <input
                      name="phoneExtension"
                      [(ngModel)]="employeeProfileData.phoneExtension"
                      type="text"
                      placeholder="1234"
                      class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <!-- Emergency Contact Name -->
                  <div>
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Emergency Contact Name
                    </label>
                    <input
                      name="emergencyContactName"
                      [(ngModel)]="employeeProfileData.emergencyContactName"
                      type="text"
                      placeholder="Contact name"
                      class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <!-- Emergency Contact Phone -->
                  <div>
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Emergency Contact Phone
                    </label>
                    <input
                      name="emergencyContactPhone"
                      [(ngModel)]="employeeProfileData.emergencyContactPhone"
                      type="tel"
                      placeholder="+1 (555) 000-0000"
                      class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                  </div>
                </div>
              </div>

              <!-- Additional Information -->
              <div>
                <h3 class="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">Additional Information</h3>
                <div class="grid grid-cols-1 gap-3">
                  <!-- Notes -->
                  <div>
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Notes
                    </label>
                    <textarea
                      name="employeeNotes"
                      [(ngModel)]="employeeProfileData.notes"
                      rows="3"
                      placeholder="Additional employee notes..."
                      class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    ></textarea>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <!-- Required Fields Checklist -->
          <div class="mt-6 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/20 dark:to-indigo-900/20 rounded-lg border border-blue-200 dark:border-blue-800 p-4">
            <div class="flex items-start gap-3">
              <div class="flex-shrink-0 w-8 h-8 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center">
                <svg class="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
                </svg>
              </div>
              <div class="flex-1">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">Required Fields Checklist</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-2 text-xs">
                  <!-- Email -->
                  <div class="flex items-center gap-2">
                    <span [class]="formData.email && formData.email.includes('@') ? 'text-green-600 dark:text-green-400' : 'text-red-500'">
                      {{ formData.email && formData.email.includes('@') ? '✓' : '✱' }}
                    </span>
                    <span [class]="formData.email && formData.email.includes('@') ? 'text-gray-700 dark:text-gray-300 line-through' : 'text-gray-900 dark:text-white font-medium'">
                      Email address
                    </span>
                  </div>

                  <!-- Password (create mode only) -->
                  <div *ngIf="!isEditMode()" class="flex items-center gap-2">
                    <span [class]="formData.password && formData.password.length >= 8 ? 'text-green-600 dark:text-green-400' : 'text-red-500'">
                      {{ formData.password && formData.password.length >= 8 ? '✓' : '✱' }}
                    </span>
                    <span [class]="formData.password && formData.password.length >= 8 ? 'text-gray-700 dark:text-gray-300 line-through' : 'text-gray-900 dark:text-white font-medium'">
                      Password (min 8 chars)
                    </span>
                  </div>

                  <!-- Tenant Selection (for tenant users in system context) -->
                  <div *ngIf="userType === 'tenant' && !isEditMode() && !isTenantContext()" class="flex items-center gap-2">
                    <span [class]="formData.tenantId ? 'text-green-600 dark:text-green-400' : 'text-red-500'">
                      {{ formData.tenantId ? '✓' : '✱' }}
                    </span>
                    <span [class]="formData.tenantId ? 'text-gray-700 dark:text-gray-300 line-through' : 'text-gray-900 dark:text-white font-medium'">
                      Select Tenant
                    </span>
                  </div>

                  <!-- Address Type (if adding address) -->
                  <div class="flex items-center gap-2">
                    <span [class]="addressData.addressType ? 'text-green-600 dark:text-green-400' : 'text-gray-400'">
                      {{ addressData.addressType ? '✓' : '○' }}
                    </span>
                    <span [class]="addressData.addressType ? 'text-gray-700 dark:text-gray-300 line-through' : 'text-gray-700 dark:text-gray-400'">
                      Address Type
                    </span>
                  </div>

                  <!-- Region -->
                  <div class="flex items-center gap-2">
                    <span [class]="addressData.region ? 'text-green-600 dark:text-green-400' : 'text-gray-400'">
                      {{ addressData.region ? '✓' : '○' }}
                    </span>
                    <span [class]="addressData.region ? 'text-gray-700 dark:text-gray-300 line-through' : 'text-gray-700 dark:text-gray-400'">
                      Region
                    </span>
                  </div>

                  <!-- Province -->
                  <div class="flex items-center gap-2">
                    <span [class]="addressData.province ? 'text-green-600 dark:text-green-400' : 'text-gray-400'">
                      {{ addressData.province ? '✓' : '○' }}
                    </span>
                    <span [class]="addressData.province ? 'text-gray-700 dark:text-gray-300 line-through' : 'text-gray-700 dark:text-gray-400'">
                      Province
                    </span>
                  </div>

                  <!-- City/Municipality -->
                  <div class="flex items-center gap-2">
                    <span [class]="addressData.cityMunicipality ? 'text-green-600 dark:text-green-400' : 'text-gray-400'">
                      {{ addressData.cityMunicipality ? '✓' : '○' }}
                    </span>
                    <span [class]="addressData.cityMunicipality ? 'text-gray-700 dark:text-gray-300 line-through' : 'text-gray-700 dark:text-gray-400'">
                      City/Municipality
                    </span>
                  </div>

                  <!-- Barangay -->
                  <div class="flex items-center gap-2">
                    <span [class]="addressData.barangay ? 'text-green-600 dark:text-green-400' : 'text-gray-400'">
                      {{ addressData.barangay ? '✓' : '○' }}
                    </span>
                    <span [class]="addressData.barangay ? 'text-gray-700 dark:text-gray-300 line-through' : 'text-gray-700 dark:text-gray-400'">
                      Barangay
                    </span>
                  </div>

                  <!-- Street Address -->
                  <div class="flex items-center gap-2">
                    <span [class]="addressData.street ? 'text-green-600 dark:text-green-400' : 'text-gray-400'">
                      {{ addressData.street ? '✓' : '○' }}
                    </span>
                    <span [class]="addressData.street ? 'text-gray-700 dark:text-gray-300 line-through' : 'text-gray-700 dark:text-gray-400'">
                      Street Address
                    </span>
                  </div>
                </div>
                <div class="mt-3 pt-3 border-t border-blue-200 dark:border-blue-700">
                  <p class="text-xs text-gray-600 dark:text-gray-400">
                    <span class="text-red-500 font-semibold">✱</span> Required to save •
                    <span class="text-green-600 dark:text-green-400 font-semibold">✓</span> Completed •
                    <span class="text-gray-400 font-semibold">○</span> Optional (for address)
                  </p>
                </div>
              </div>
            </div>
          </div>

        </div>

        <!-- Actions -->
        <div class="flex items-center justify-end gap-2 mt-4">
          <button
            (click)="goBack()"
            type="button"
            class="inline-flex items-center gap-1.5 rounded-lg border border-gray-300 bg-white px-3 py-2 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-all shadow-sm hover:shadow"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Cancel
          </button>
          <button
            (click)="save()"
            [disabled]="saving() || !isFormValid()"
            class="inline-flex items-center gap-1.5 rounded-lg bg-gradient-to-r from-blue-600 to-indigo-600 px-3 py-2 text-xs font-medium text-white hover:from-blue-700 hover:to-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all shadow-md hover:shadow-lg"
          >
            <svg *ngIf="!saving()" class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
            </svg>
            <svg *ngIf="saving()" class="animate-spin w-3.5 h-3.5" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
            {{ saving() ? 'Saving...' : (isEditMode() ? 'Update User' : 'Create User') }}
          </button>
        </div>
      </div>
    </div>

    <!-- Reset Password Modal -->
    <app-reset-password-modal #resetPasswordModal />
  `,
  styles: []
})
export class UserEditorComponent implements OnInit {
  @ViewChild('resetPasswordModal') resetPasswordModal!: ResetPasswordModalComponent;

  userId: string | null = null;
  isEditMode = signal(false);
  saving = signal(false);
  errorMessage = signal<string | null>(null);
  userType = 'system'; // 'system' or 'tenant' - default to system admin
  isTenantContext = signal(false); // Track if we're in tenant context
  loadedUser: any = null; // Store loaded user data including tenant info

  // Main tab navigation
  activeTab = signal<string>('basic'); // 'basic', 'roles', 'platforms', 'address', 'password'

  tenants = signal<Tenant[]>([]);
  loadingTenants = signal(false);
  // Email validation/check signals
  emailExists = signal(false);
  emailCheckInProgress = signal(false);
  emailCheckError = signal<string | null>(null);
  private _emailDebounceTimer: any = null;

  formData: any = {
    firstName: '',
    lastName: '',
    email: '',
    password: '',
    status: 'active',
    tenantId: null
  };

  selectedRoles = signal<Set<string>>(new Set());

  // Product Access fields
  productAccess = {
    moneyLoan: {
      enabled: false,
      accessLevel: 'view',
      isPrimary: false,
      canApproveLoans: false,
      canDisburseFunds: false,
      canViewReports: false
    },
    bnpl: {
      enabled: false,
      accessLevel: 'view',
      isPrimary: false
    },
    pawnshop: {
      enabled: false,
      accessLevel: 'view',
      isPrimary: false
    }
  };

  // Tenant data and platform subscriptions
  currentTenantData = signal<any>(null);
  tenantPlatformSubscriptions = signal<PlatformSubscription[]>([]);

  // Computed property to determine which platforms are available
  // Uses tenant's enabled flags (same logic as Platform Catalog)
  availablePlatforms = computed(() => {
    const tenant = this.currentTenantData();
    console.log('🔍 availablePlatforms computed called, tenant:', tenant);
    if (!tenant) {
      console.log('⚠️  No tenant data, returning all false');
      return {
        moneyLoan: false,
        bnpl: false,
        pawnshop: false
      };
    }
    const platforms = {
      moneyLoan: tenant.moneyLoanEnabled || false,
      bnpl: tenant.bnplEnabled || false,
      pawnshop: tenant.pawnshopEnabled || false
    };
    console.log('✅ Platform flags returned:', platforms);
    return platforms;
  });

  // Computed property for auto-generated employee code preview
  autoGeneratedEmployeeCode = computed(() => {
    const tenantId = this.formData.tenantId || this.loadedUser?.tenantId;
    const userId = this.userId || 'NEW';
    return tenantId ? `EMP-${tenantId}-${userId}` : '';
  });

  // Address fields
  includeAddress = false;
  activeAddressTab = signal<string>('location'); // 'location', 'contact', 'additional'
  userAddressId: string | null = null; // Track existing address ID for updates
  addressData: any = {
    addressType: 'home',
    street: '',
    barangay: '',
    cityMunicipality: '',
    province: '',
    region: '',
    zipCode: '',
    landmark: '',
    isPrimary: true,
    contactPhone: '',
    contactName: '',
    notes: ''
  };
  noAddressOnRecord = false;

  // Employee profile fields
  hasEmployeeProfile = false;
  employeeProfileData: any = this.createDefaultEmployeeProfile();

  // Reset Password fields
  resetPasswordData = {
    newPassword: '',
    confirmPassword: ''
  };

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private cdr: ChangeDetectorRef,
    private http: HttpClient,
    public userService: UserService,
    public roleService: RoleService,
    public addressService: AddressService,
    private authService: AuthService,
    private productSubscriptionService: ProductSubscriptionService,
    private tenantService: TenantService,
    private toastService: ToastService
  ) {}

  async ngOnInit() {
    // Detect context from route (admin vs tenant)
    const url = this.router.url;
    const isTenantCtx = url.startsWith('/tenant/');
    this.isTenantContext.set(isTenantCtx);

    // Check for query parameter to set default user type
    const typeParam = this.route.snapshot.queryParamMap.get('type');
    if (typeParam === 'system' || typeParam === 'tenant') {
      this.userType = typeParam;
      console.log('🔧 User type set from query param:', typeParam);
    }

    // For tenant context, force user type to tenant and set tenant ID
    if (isTenantCtx) {
      this.userType = 'tenant';
      const currentTenantId = this.normalizeTenantId(this.authService.getTenantId());
      if (currentTenantId !== null) {
        this.formData.tenantId = currentTenantId;
        console.log('🏢 Tenant context detected, tenantId set to:', currentTenantId);
        // Load platform subscriptions for this tenant
        this.loadTenantPlatformSubscriptions(currentTenantId);
      }
    }

    this.userId = this.route.snapshot.paramMap.get('id');
    this.isEditMode.set(this.userId !== null && this.userId !== 'new');

    // Load roles and tenants
    console.log('📋 Loading roles...');
    await this.roleService.loadRoles();
    console.log('✅ Roles loaded:', this.roleService.rolesSignal());
    if (!isTenantCtx) {
      // Only load tenants dropdown for system admin context
      this.loadTenants();
    }

    // Load user if editing
    if (this.isEditMode() && this.userId) {
      console.log('🔍 Loading user ID:', this.userId);
      try {
        const user = await this.userService.getUser(this.userId);
        console.log('📦 User data received:', user);

        if (user) {
          // Store the complete user data including tenant info
          this.loadedUser = user;

          console.log('✅ User data found:', {
            firstName: user.firstName,
            lastName: user.lastName,
            email: user.email,
            status: user.status,
            tenantId: user.tenantId,
            tenant: user.tenant,
            roles: user.roles
          });

          // Update form data directly (not creating new object)
          this.formData.firstName = user.firstName || '';
          this.formData.lastName = user.lastName || '';
          this.formData.email = user.email || '';
          this.formData.password = '';
          this.formData.status = user.status || 'active';
          this.formData.tenantId = this.normalizeTenantId(user.tenantId);

          console.log('📝 Form data set to:', this.formData);

          // Set user type
          this.userType = user.tenantId ? 'tenant' : 'system';

          // Set selected roles
          if (user.roles && Array.isArray(user.roles)) {
            const roleIds = user.roles
              .map(r => typeof r === 'object' ? r?.id : r)
              .filter(id => id !== null && id !== undefined)
              .map(id => String(id));
            this.selectedRoles.set(new Set(roleIds));
            console.log('👥 Selected roles:', Array.from(this.selectedRoles()));
          }

          // Load product access for tenant users
          if (user.tenantId) {
            // Load tenant's platform subscriptions to show available platforms
            const tenantIdForLoad = this.normalizeTenantId(user.tenantId);
            if (tenantIdForLoad !== null) {
              this.loadTenantPlatformSubscriptions(tenantIdForLoad);
            }
            // Load user's current product access
            await this.loadUserProducts(this.userId);
          }

          // Populate employee profile tab
          this.populateEmployeeProfile(user.employeeProfile);

          // Populate address tab from user payload if available
          this.populateAddressFromUser(user.addresses as any[] | undefined);

          // Load user's address
          await this.loadUserAddress(this.userId);

          // Mark for check instead of detectChanges to avoid ExpressionChangedAfterItHasBeenCheckedError
          this.cdr.markForCheck();
          console.log('🔄 Marked for check');
        } else {
          console.error('❌ No user data returned from API');
          this.errorMessage.set('Failed to load user data');
        }
      } catch (error) {
        console.error('❌ Error loading user:', error);
        this.errorMessage.set('Failed to load user: ' + (error instanceof Error ? error.message : 'Unknown error'));
      }
    }
  }

  async loadTenants() {
    this.loadingTenants.set(true);
    try {
      this.http.get<any>('/api/tenants', {
        params: { page: '1', limit: '100' }
      }).subscribe({
        next: (response) => {
          if (response && response.data) {
            this.tenants.set(response.data);
            console.log('🏢 Loaded tenants:', response.data.length);
          }
          this.loadingTenants.set(false);
        },
        error: (error) => {
          console.error('❌ Error loading tenants:', error);
          this.loadingTenants.set(false);
        }
      });
    } catch (error) {
      console.error('❌ Error loading tenants:', error);
      this.loadingTenants.set(false);
    }
  }

  loadTenantPlatformSubscriptions(tenantId: number) {
    console.log('📞 loadTenantPlatformSubscriptions called with tenantId:', tenantId);

    if (!tenantId) {
      console.warn('⚠️ No tenantId provided, skipping platform subscription load');
      return;
    }

    // First, load the tenant data to get enabled platform flags
    const tenantUrl = `/api/tenants/${tenantId}`;
    console.log('📡 Fetching from:', tenantUrl);

    this.http.get<any>(tenantUrl).subscribe({
      next: (response) => {
        console.log('✅ HTTP Response received:', response);
        if (response && response.data) {
          console.log('🏢 Tenant data loaded:', response.data);
          this.currentTenantData.set(response.data);
          console.log('📊 Available platforms:', {
            moneyLoan: response.data.moneyLoanEnabled,
            bnpl: response.data.bnplEnabled,
            pawnshop: response.data.pawnshopEnabled
          });
        } else {
          console.warn('⚠️ Response received but no data field:', response);
        }
      },
      error: (error) => {
        console.error('❌ Error loading tenant data:', error);
        console.error('Error details:', {
          status: error?.status,
          statusText: error?.statusText,
          message: error?.message,
          error: error?.error
        });
        this.currentTenantData.set(null);
      }
    });

    // Also load platform subscriptions
    this.productSubscriptionService.getTenantProductSubscriptions(tenantId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          console.log('📋 Platform subscriptions loaded:', response.data);
          this.tenantPlatformSubscriptions.set(response.data);
        }
      },
      error: (error) => {
        console.error('❌ Error loading platform subscriptions:', error);
        this.tenantPlatformSubscriptions.set([]);
      }
    });
  }

  availableRoles() {
    const roles = this.roleService.rolesSignal() || [];
    const tenantId = this.formData.tenantId || this.loadedUser?.tenantId;

    console.log('🔍 availableRoles() called -', {
      userType: this.userType,
      formDataTenantId: this.formData.tenantId,
      loadedUserTenantId: this.loadedUser?.tenantId,
      effectiveTenantId: tenantId,
      totalRolesInSystem: roles.length
    });

    console.log('📋 All roles from API:', roles.map(r => ({
      id: r.id,
      name: r.name,
      space: r.space,
      tenantId: r.tenantId,
      status: r.status
    })));

    // System users can only have system roles
    if (this.userType === 'system') {
      const systemRoles = roles.filter(r => r.space === 'system');
      console.log('👤 System roles found:', systemRoles.length, systemRoles.map(r => r.name));
      return systemRoles;
    }

    // Tenant users: if no tenant ID, return all tenant roles (for flexibility)
    if (!tenantId) {
      console.warn('⚠️ No tenant ID found for tenant user, returning all tenant roles');
      const tenantRoles = roles.filter(r => r.space === 'tenant');
      console.log('🏢 All tenant roles found:', tenantRoles.length, tenantRoles.map(r => `${r.name} (tenant_id: ${r.tenantId})`));
      return tenantRoles;
    }

    // Filter by specific tenant ID
    const tenantRoles = roles.filter(r => {
      const matches = r.space === 'tenant' && (r.tenantId == tenantId || Number(r.tenantId) === Number(tenantId));
      if (!matches) {
        console.log(`  ❌ Role ${r.name}: space=${r.space}, tenantId=${r.tenantId}, matches=${matches}`);
      }
      return matches;
    });

    console.log('🏢 Tenant roles found for tenantId:', tenantId, '-', tenantRoles.length, tenantRoles.map(r => r.name));
    return tenantRoles;
  }

  getTenantName(): string {
    if (!this.formData.tenantId) {
      return 'No tenant assigned';
    }

    // First check if we have tenant info from currentTenantData (loaded for platforms)
    const currentTenant = this.currentTenantData();
    if (currentTenant && currentTenant.id === this.formData.tenantId) {
      return `${currentTenant.name} (${currentTenant.subdomain})`;
    }

    // Then check if we have tenant info from loaded user
    if (this.loadedUser && this.loadedUser.tenant) {
      return `${this.loadedUser.tenant.name} (${this.loadedUser.tenant.subdomain})`;
    }

    // Otherwise check tenants list (for system admin context)
    const tenant = this.tenants().find(t => t.id === this.formData.tenantId);
    if (tenant) {
      return `${tenant.name} (${tenant.subdomain})`;
    }

    return 'Loading...';
  }

  isRoleSelected(roleId: string | number | null | undefined): boolean {
    if (roleId === null || roleId === undefined) {
      return false;
    }
    return this.selectedRoles().has(roleId.toString());
  }

  toggleRole(roleId: string | number | null | undefined) {
    if (roleId === null || roleId === undefined) {
      return;
    }
    const key = roleId.toString();
    const roles = new Set(this.selectedRoles());
    if (roles.has(key)) {
      roles.delete(key);
    } else {
      // Backend currently accepts a single role; enforce single selection at UI level
      roles.clear();
      roles.add(key);
    }
    this.selectedRoles.set(roles);
  }

  onUserTypeChange() {
    // Clear selected roles when user type changes
    this.selectedRoles.set(new Set());

    // Reset tenantId based on user type
    if (this.userType === 'system') {
      this.formData.tenantId = null;
    } else {
      // For tenant users, clear the selection so user must choose
      this.formData.tenantId = undefined;
    }
  }

  // Called when the email input changes (debounced)
  onEmailChange(value: string) {
    // If editing and email equals original, clear checks
    if (this.isEditMode() && this.formData.email && value && value.toLowerCase() === this.formData.email.toLowerCase()) {
      this.emailExists.set(false);
      this.emailCheckError.set(null);
      return;
    }

    // debounce
    if (this._emailDebounceTimer) clearTimeout(this._emailDebounceTimer);
    this._emailDebounceTimer = setTimeout(() => this.performEmailCheck(value), 450);
  }

  onEmailBlur() {
    if (this._emailDebounceTimer) {
      clearTimeout(this._emailDebounceTimer);
      this._emailDebounceTimer = null;
    }
    // immediate check on blur
    this.performEmailCheck(this.formData.email || '');
  }

  private async performEmailCheck(email: string) {
    this.emailCheckError.set(null);
    this.emailCheckInProgress.set(false);
    if (!email || email.trim().length === 0) {
      this.emailExists.set(false);
      return;
    }

    // Check if email already exists
    this.emailCheckInProgress.set(true);
    try {
      const params: any = { email };
      // If editing existing user, exclude their ID from the check
      if (this.userId) {
        params.userId = this.userId;
      }

      const resp: any = await firstValueFrom(this.http.get('/api/auth/check-email', { params }));
      const exists = !!resp?.data?.exists;
      this.emailExists.set(exists);

      if (exists && !this.userId) {
        // Show error if email exists (only for new users)
        this.toastService.show('error', 'Email address already in use');
      }
    } catch (err: any) {
      console.error('Email check failed', err);
      this.emailCheckError.set(err?.message || 'Failed to validate email');
      this.emailExists.set(false);
    } finally {
      this.emailCheckInProgress.set(false);
      this.cdr.detectChanges();
    }
  }

  /**
   * Auto-set primary platform if only one is enabled
   */
  autoSetPrimaryPlatform() {
    const enabledPlatforms = [
      { key: 'moneyLoan', enabled: this.productAccess.moneyLoan.enabled },
      { key: 'bnpl', enabled: this.productAccess.bnpl.enabled },
      { key: 'pawnshop', enabled: this.productAccess.pawnshop.enabled }
    ].filter(p => p.enabled);

    // If only one platform is enabled, make it primary
    if (enabledPlatforms.length === 1) {
      const platform = enabledPlatforms[0].key;
      this.productAccess.moneyLoan.isPrimary = platform === 'moneyLoan';
      this.productAccess.bnpl.isPrimary = platform === 'bnpl';
      this.productAccess.pawnshop.isPrimary = platform === 'pawnshop';
    }
  }

  /**
   * Handle primary platform selection - ensure only one platform can be primary
   */
  onPrimaryPlatformChange(platform: 'moneyLoan' | 'bnpl' | 'pawnshop'): void {
    // If this platform was just checked as primary, uncheck all others
    if (this.productAccess[platform].isPrimary) {
      if (platform !== 'moneyLoan') this.productAccess.moneyLoan.isPrimary = false;
      if (platform !== 'bnpl') this.productAccess.bnpl.isPrimary = false;
      if (platform !== 'pawnshop') this.productAccess.pawnshop.isPrimary = false;
    }
  }

  /**
   * Load user product access from API
   */
  async loadUserProducts(userId: string): Promise<void> {
    try {
      const response: any = await firstValueFrom(
        this.http.get(`/api/users/${userId}/products`)
      );

      if (response && response.data) {
        const products = response.data;

        // Reset product access
        this.resetProductAccess();

        // Map API response to UI state
        products.forEach((product: any) => {
          switch (product.productType) {
            case 'money_loan':
              this.productAccess.moneyLoan.enabled = true;
              this.productAccess.moneyLoan.accessLevel = product.accessLevel || 'view';
              this.productAccess.moneyLoan.isPrimary = product.isPrimary || false;
              this.productAccess.moneyLoan.canApproveLoans = product.canApproveLoans || false;
              this.productAccess.moneyLoan.canDisburseFunds = product.canDisburseFunds || false;
              this.productAccess.moneyLoan.canViewReports = product.canViewReports || false;
              break;
            case 'bnpl':
              this.productAccess.bnpl.enabled = true;
              this.productAccess.bnpl.accessLevel = product.accessLevel || 'view';
              this.productAccess.bnpl.isPrimary = product.isPrimary || false;
              break;
            case 'pawnshop':
              this.productAccess.pawnshop.enabled = true;
              this.productAccess.pawnshop.accessLevel = product.accessLevel || 'view';
              this.productAccess.pawnshop.isPrimary = product.isPrimary || false;
              break;
          }
        });

        console.log('📦 Loaded product access:', products.length, 'products');
        this.cdr.markForCheck();
      }
    } catch (error) {
      console.error('❌ Error loading user products:', error);
      // Don't throw - just log the error
    }
  }

  /**
   * Load user address from API
   */
  async loadUserAddress(userId: string): Promise<void> {
    try {
      const addresses = await this.addressService.getAddressesByUserId(userId);

      if (addresses && addresses.length > 0) {
        // Get the primary address or first address
        const address = addresses.find((a: any) => a.isPrimary) || addresses[0];

        this.applyAddressToForm(address, { isSingle: addresses.length === 1 });
        console.log('📍 Loaded user address:', address.id);
      } else {
        console.log('📍 No address found for user');
        this.includeAddress = false;
        this.noAddressOnRecord = true;
      }
    } catch (error) {
      console.error('❌ Error loading user address:', error);
      // Don't throw - just log the error
    }
  }

  private populateAddressFromUser(addresses: any[] | undefined): void {
    if (!Array.isArray(addresses) || addresses.length === 0) {
      this.includeAddress = false;
      this.noAddressOnRecord = true;
      return;
    }

    const address = addresses.find(addressRecord => addressRecord?.isPrimary) || addresses[0];
    if (!address) {
      this.includeAddress = false;
      this.noAddressOnRecord = true;
      return;
    }

    this.applyAddressToForm(address, { isSingle: addresses.length === 1 });
  }

  private applyAddressToForm(address: any, options: { isSingle?: boolean } = {}): void {
    if (!address) {
      return;
    }

    this.addressData.addressType = address.addressType || 'home';
    this.addressData.street = address.street || address.streetAddress || '';
    this.addressData.barangay = address.barangay || '';
    this.addressData.cityMunicipality = address.cityMunicipality || '';
    this.addressData.province = address.province || '';
    this.addressData.region = address.region || '';
    this.addressData.zipCode = address.zipCode || '';
    this.addressData.landmark = address.landmark || '';
    const forcedPrimary = options.isSingle ? true : undefined;
    this.addressData.isPrimary = forcedPrimary ?? (address.isPrimary ?? true);
    this.addressData.contactPhone = address.contactPhone || '';
    this.addressData.contactName = address.contactName || '';
    this.addressData.notes = address.notes || '';

    this.userAddressId = address.id ? String(address.id) : null;
    this.includeAddress = true;
    this.noAddressOnRecord = false;
  }

  /**
   * Reset product access to default state
   */
  resetProductAccess(): void {
    this.productAccess = {
      moneyLoan: {
        enabled: false,
        accessLevel: 'view',
        isPrimary: false,
        canApproveLoans: false,
        canDisburseFunds: false,
        canViewReports: false
      },
      bnpl: {
        enabled: false,
        accessLevel: 'view',
        isPrimary: false
      },
      pawnshop: {
        enabled: false,
        accessLevel: 'view',
        isPrimary: false
      }
    };
  }

  private createDefaultEmployeeProfile() {
    // Get today's date in YYYY-MM-DD format
    const today = new Date().toISOString().split('T')[0];

    return {
      employeeCode: '', // Will be auto-generated by backend
      position: '',
      department: '',
      employmentType: 'full-time', // Default to full-time
      employmentStatus: 'active', // Default to active
      hireDate: today, // Default to today
      managerName: '',
      supervisorName: '',
      workEmail: '',
      workPhone: '',
      phoneExtension: '',
      emergencyContactName: '',
      emergencyContactPhone: '',
      notes: ''
    };
  }

  private populateEmployeeProfile(profile: any): void {
    if (!profile) {
      this.hasEmployeeProfile = false;
      this.employeeProfileData = this.createDefaultEmployeeProfile();
      return;
    }

    const data = this.createDefaultEmployeeProfile();
    this.hasEmployeeProfile = true;

    data.employeeCode = profile.employeeCode || profile.employeeId || '';
    data.position = profile.position || '';
    data.department = profile.department || '';
    data.employmentType = profile.employmentType || '';
    data.employmentStatus = profile.employmentStatus || profile.status || '';
    data.hireDate = this.formatDateForInput(profile.hireDate);
    data.workPhone = profile.workPhone || '';
    data.workEmail = profile.workEmail || '';
    data.phoneExtension = profile.phoneExtension || '';
    data.emergencyContactName = profile.emergencyContactName || '';
    data.emergencyContactPhone = profile.emergencyContactPhone || '';
    data.notes = profile.notes || profile.remarks || '';

    this.employeeProfileData = data;
  }

  private formatDateForInput(value: string | Date | null | undefined): string {
    if (!value) {
      return '';
    }

    if (typeof value === 'string') {
      if (/^\d{4}-\d{2}-\d{2}$/.test(value)) {
        return value;
      }
      const [datePart] = value.split('T');
      if (datePart && /^\d{4}-\d{2}-\d{2}$/.test(datePart)) {
        return datePart;
      }
      const parsed = new Date(value);
      if (Number.isFinite(parsed.getTime())) {
        return parsed.toISOString().split('T')[0];
      }
      return '';
    }

    const parsed = value instanceof Date ? value : new Date(value);
    if (!Number.isFinite(parsed.getTime())) {
      return '';
    }
    return parsed.toISOString().split('T')[0];
  }

  isFormValid(): boolean {
    if (!this.formData.email) return false;
    if (!this.isEditMode() && !this.formData.password) return false;
    if (!this.isEditMode() && this.formData.password.length < 8) return false;

    // If creating a tenant user, tenant must be selected
    if (!this.isEditMode() && this.userType === 'tenant' && !this.formData.tenantId) {
      return false;
    }

    // If password fields are filled in edit mode, validate them
    if (this.isEditMode() && !this.isPasswordResetValid()) {
      return false;
    }

    return true;
  }

  /**
   * Check if employee profile has any meaningful data
   */
  hasEmployeeProfileData(): boolean {
    return !!(
      this.employeeProfileData.position ||
      this.employeeProfileData.department ||
      this.employeeProfileData.employmentType ||
      this.employeeProfileData.employmentStatus ||
      this.employeeProfileData.hireDate ||
      this.employeeProfileData.workPhone ||
      this.employeeProfileData.workEmail ||
      this.employeeProfileData.phoneExtension ||
      this.employeeProfileData.emergencyContactName ||
      this.employeeProfileData.emergencyContactPhone ||
      this.employeeProfileData.notes
    );
  }

  /**
   * Build product assignment payload from productAccess state
   */
  buildProductAssignments(): any[] {
    const assignments: any[] = [];

    if (this.productAccess.moneyLoan.enabled) {
      assignments.push({
        productType: 'money_loan',
        accessLevel: this.productAccess.moneyLoan.accessLevel,
        isPrimary: this.productAccess.moneyLoan.isPrimary,
        canApproveLoans: this.productAccess.moneyLoan.canApproveLoans,
        canDisburseFunds: this.productAccess.moneyLoan.canDisburseFunds,
        canViewReports: this.productAccess.moneyLoan.canViewReports
      });
    }

    if (this.productAccess.bnpl.enabled) {
      assignments.push({
        productType: 'bnpl',
        accessLevel: this.productAccess.bnpl.accessLevel,
        isPrimary: this.productAccess.bnpl.isPrimary
      });
    }

    if (this.productAccess.pawnshop.enabled) {
      assignments.push({
        productType: 'pawnshop',
        accessLevel: this.productAccess.pawnshop.accessLevel,
        isPrimary: this.productAccess.pawnshop.isPrimary
      });
    }

    console.log('📋 Built platform assignments:', assignments);
    return assignments;
  }

  /**
   * Assign product access to a user via API
   */
  async assignProductAccess(userId: string, assignments: any[]): Promise<void> {
    try {
      console.log('📦 Assigning platform access:', { userId, assignments });
      const response = await firstValueFrom(
        this.http.post(`/api/users/${userId}/products`, { products: assignments })
      );
      console.log('✅ Platform access response:', response);
    } catch (error) {
      console.error('❌ Error assigning platform access:', error);
      throw error;
    }
  }

  async save() {
    if (!this.isFormValid() || this.saving()) return;

    // Prevent creating a user if email already exists
    if (!this.isEditMode() && this.emailExists()) {
      this.errorMessage.set('Email already exists. Please use a different email.');
      return;
    }

    this.saving.set(true);
    this.errorMessage.set(null);

    try {
      let user: User | null = null;
      const selectedRoleId = this.getSelectedRoleId();

      if (this.isEditMode() && this.userId) {
        // Update existing user
        const updatePayload: UserUpdatePayload = {
          firstName: this.formData.firstName,
          lastName: this.formData.lastName,
          email: this.formData.email,
          status: this.formData.status,
          roleId: selectedRoleId ?? null
        };

        // Include employee profile data if it has values
        if (this.hasEmployeeProfileData()) {
          updatePayload.position = this.employeeProfileData.position || undefined;
          updatePayload.department = this.employeeProfileData.department || undefined;
          updatePayload.employmentType = this.employeeProfileData.employmentType || undefined;
          updatePayload.employmentStatus = this.employeeProfileData.employmentStatus || undefined;
          updatePayload.hireDate = this.employeeProfileData.hireDate || undefined;
          updatePayload.workPhone = this.employeeProfileData.workPhone || undefined;
          updatePayload.workEmail = this.employeeProfileData.workEmail || undefined;
          updatePayload.phoneExtension = this.employeeProfileData.phoneExtension || undefined;
          updatePayload.emergencyContactName = this.employeeProfileData.emergencyContactName || undefined;
          updatePayload.emergencyContactPhone = this.employeeProfileData.emergencyContactPhone || undefined;
          updatePayload.notes = this.employeeProfileData.notes || undefined;
        }

        user = await this.userService.updateUser(this.userId, updatePayload);
      } else {
        // Create new user
        const tenantIdValue = this.userType === 'system'
          ? null
          : this.normalizeTenantId(this.formData.tenantId);
        const createPayload: UserCreatePayload = {
          email: this.formData.email,
          password: this.formData.password,
          firstName: this.formData.firstName,
          lastName: this.formData.lastName,
          // Use selected tenant ID or null for system admin
          tenantId: tenantIdValue ?? undefined,
          roleId: selectedRoleId ?? undefined
        };

        // Include employee profile data if it has values
        if (this.hasEmployeeProfileData()) {
          createPayload.position = this.employeeProfileData.position || undefined;
          createPayload.department = this.employeeProfileData.department || undefined;
          createPayload.employmentType = this.employeeProfileData.employmentType || undefined;
          createPayload.employmentStatus = this.employeeProfileData.employmentStatus || undefined;
          createPayload.hireDate = this.employeeProfileData.hireDate || undefined;
          createPayload.workPhone = this.employeeProfileData.workPhone || undefined;
          createPayload.workEmail = this.employeeProfileData.workEmail || undefined;
          createPayload.phoneExtension = this.employeeProfileData.phoneExtension || undefined;
          createPayload.emergencyContactName = this.employeeProfileData.emergencyContactName || undefined;
          createPayload.emergencyContactPhone = this.employeeProfileData.emergencyContactPhone || undefined;
          createPayload.notes = this.employeeProfileData.notes || undefined;
        }

        console.log('👤 Creating user:', {
          userType: this.userType,
          tenantId: createPayload.tenantId,
          email: createPayload.email
        });

        user = await this.userService.createUser(createPayload);
      }

      if (user) {
        const isUpdate = this.isEditMode();

        // Create or update address if it has meaningful data
        if (this.isAddressValid()) {
          try {
            if (this.userAddressId) {
              // Update existing address
              const updatePayload = {
                addressType: this.addressData.addressType,
                street: this.addressData.street,
                barangay: this.addressData.barangay,
                cityMunicipality: this.addressData.cityMunicipality,
                province: this.addressData.province,
                region: this.addressData.region,
                zipCode: this.addressData.zipCode || undefined,
                country: 'Philippines',
                landmark: this.addressData.landmark || undefined,
                isPrimary: this.addressData.isPrimary,
                contactPhone: this.addressData.contactPhone || undefined,
                contactName: this.addressData.contactName || undefined,
                notes: this.addressData.notes || undefined
              };
              await this.addressService.updateAddress(this.userAddressId, updatePayload);
              console.log('✅ Address updated successfully');
            } else {
              // Create new address
              const addressPayload: AddressCreatePayload = {
                userId: Number(user.id), // Convert string ID to number
                addressType: this.addressData.addressType,
                street: this.addressData.street,
                barangay: this.addressData.barangay,
                cityMunicipality: this.addressData.cityMunicipality,
                province: this.addressData.province,
                region: this.addressData.region,
                zipCode: this.addressData.zipCode || undefined,
                country: 'Philippines',
                landmark: this.addressData.landmark || undefined,
                isPrimary: this.addressData.isPrimary,
                contactPhone: this.addressData.contactPhone || undefined,
                contactName: this.addressData.contactName || undefined,
                notes: this.addressData.notes || undefined
              };
              const newAddress = await this.addressService.createAddress(addressPayload);
              if (newAddress) {
                this.userAddressId = newAddress.id.toString();
              }
              console.log('✅ Address created successfully');
            }
          } catch (addressError) {
            console.error('⚠️ Address save failed:', addressError);
            // Don't fail the whole operation if address creation/update fails
          }
        }

        // Assign platform access (for tenant users only)
        if (this.userType === 'tenant') {
          try {
            const productAssignments = this.buildProductAssignments();
            console.log('🔄 Attempting to assign platforms...', {
              userId: user.id,
              platformCount: productAssignments.length,
              platforms: productAssignments
            });
            // Always call the API to update/remove platform access
            await this.assignProductAccess(user.id, productAssignments);
            console.log('✅ Platform access updated successfully');
          } catch (productError: any) {
            console.error('⚠️ User saved but platform assignment failed:', productError);
            console.error('Error details:', {
              message: productError?.message,
              status: productError?.status,
              error: productError?.error
            });
            this.toastService.error('User saved, but platform access could not be updated. Please try again.');
            // Don't fail the whole operation if platform assignment fails
          }
        }

        console.log('✅ User saved successfully');
        this.toastService.success(isUpdate ? 'User updated successfully' : 'User created successfully');
        // Detect context and navigate accordingly
        const url = this.router.url;
        if (url.startsWith('/tenant/')) {
          this.router.navigate(['/tenant/users']);
        } else {
          this.router.navigate(['/admin/users']);
        }
      } else {
        this.errorMessage.set('Failed to save user. Please try again.');
        this.toastService.error('Failed to save user. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error saving user:', error);
      this.errorMessage.set(error instanceof Error ? error.message : 'An error occurred');
      this.toastService.error('Something went wrong while saving. Please try again.');
    } finally {
      this.saving.set(false);
    }
  }

  isAddressValid(): boolean {
    if (!this.includeAddress) return true;

    return !!(
      this.addressData.addressType &&
      this.addressData.street &&
      this.addressData.barangay &&
      this.addressData.cityMunicipality &&
      this.addressData.province &&
      this.addressData.region
    );
  }

  private normalizeTenantId(value: unknown): number | null {
    if (value === null || value === undefined) {
      return null;
    }

    const numeric = Number(value);
    return Number.isFinite(numeric) ? numeric : null;
  }

  private getSelectedRoleId(): number | null {
    const [first] = Array.from(this.selectedRoles());
    if (first === undefined) {
      return null;
    }

    const numeric = Number(first);
    return Number.isFinite(numeric) ? numeric : null;
  }

  isPasswordResetValid(): boolean {
    // If no password entered, it's valid (password is optional)
    if (!this.resetPasswordData.newPassword && !this.resetPasswordData.confirmPassword) {
      return true;
    }

    // If password entered, validate it
    return !!(
      this.resetPasswordData.newPassword &&
      this.resetPasswordData.confirmPassword &&
      this.resetPasswordData.newPassword === this.resetPasswordData.confirmPassword &&
      this.resetPasswordData.newPassword.length >= 8
    );
  }

  goBack() {
    // Detect context from route and navigate accordingly
    const url = this.router.url;
    if (url.startsWith('/tenant/')) {
      this.router.navigate(['/tenant/users']);
    } else {
      this.router.navigate(['/admin/users']);
    }
  }

  openResetPasswordModal() {
    if (!this.userId || !this.loadedUser) {
      this.toastService.show('error', 'User data not loaded');
      return;
    }

    this.resetPasswordModal.open({
      userId: this.userId,
      userName: `${this.formData.firstName} ${this.formData.lastName}`,
      userEmail: this.formData.email
    });
  }
}
