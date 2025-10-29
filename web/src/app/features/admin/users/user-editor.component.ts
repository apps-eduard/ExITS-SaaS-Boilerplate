import { Component, OnInit, signal, ChangeDetectorRef, computed } from '@angular/core';
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
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 max-w-4xl mx-auto">
      <!-- Header -->
      <div class="mb-4">
        <div class="flex items-center gap-2 mb-1">
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
              *ngIf="isEditMode()"
              type="button"
              (click)="activeTab.set('password')"
              [class]="activeTab() === 'password'
                ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400 bg-gray-50 dark:bg-gray-800'
                : 'text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800'"
              class="flex items-center gap-1.5 px-3 py-2 text-xs font-medium transition-colors rounded-t"
            >
              <span class="text-base">🔐</span>
              Password
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
                  <input type="checkbox" [(ngModel)]="productAccess.moneyLoan.isPrimary" class="w-3.5 h-3.5 text-amber-600 rounded" />
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
                  <input type="checkbox" [(ngModel)]="productAccess.bnpl.isPrimary" class="w-3.5 h-3.5 text-blue-600 rounded" />
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
                  <input type="checkbox" [(ngModel)]="productAccess.pawnshop.isPrimary" class="w-3.5 h-3.5 text-green-600 rounded" />
                  <span class="text-gray-700 dark:text-gray-300">Set as primary</span>
                </label>
              </div>
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

          <!-- Reset Password Tab (Edit mode only) -->
          <div *ngIf="activeTab() === 'password'">
            <div class="flex items-center justify-between mb-4">
              <div>
                <h2 class="text-sm font-semibold text-gray-900 dark:text-white">🔐 Reset Password</h2>
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Change user's password</p>
              </div>
            </div>

          <div class="space-y-3">
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <!-- New Password -->
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  New Password (optional)
                </label>
                <input
                  [(ngModel)]="resetPasswordData.newPassword"
                  type="password"
                  placeholder="Leave blank to keep current password"
                  class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Minimum 8 characters if changing</p>
              </div>

              <!-- Confirm Password -->
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Confirm Password
                </label>
                <input
                  [(ngModel)]="resetPasswordData.confirmPassword"
                  type="password"
                  placeholder="Confirm new password"
                  class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
                <p *ngIf="resetPasswordData.confirmPassword && resetPasswordData.newPassword !== resetPasswordData.confirmPassword"
                   class="text-xs text-red-500 dark:text-red-400 mt-0.5">
                  ⚠️ Passwords do not match
                </p>
                <p *ngIf="resetPasswordData.confirmPassword && resetPasswordData.newPassword === resetPasswordData.confirmPassword"
                   class="text-xs text-green-500 dark:text-green-400 mt-0.5">
                  ✓ Passwords match
                </p>
              </div>
            </div>

            <div *ngIf="resetPasswordData.newPassword" class="p-2 bg-amber-50 dark:bg-amber-900/20 rounded border border-amber-200 dark:border-amber-800">
              <p class="text-xs text-amber-700 dark:text-amber-300">
                <strong>⚠️ Warning:</strong> User will need to use this new password on their next login. Consider notifying them about the password change.
              </p>
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

            <div class="space-y-4">
              <!-- Employment Information -->
              <div>
                <h3 class="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-3">Employment Information</h3>
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
                  <!-- Employee ID -->
                  <div>
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Employee ID
                    </label>
                    <input
                      type="text"
                      placeholder="EMP-001"
                      class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <!-- Job Title -->
                  <div>
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Job Title
                    </label>
                    <input
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
                      class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="">Select Department</option>
                      <option value="it">IT</option>
                      <option value="hr">Human Resources</option>
                      <option value="finance">Finance</option>
                      <option value="operations">Operations</option>
                      <option value="sales">Sales</option>
                      <option value="marketing">Marketing</option>
                    </select>
                  </div>

                  <!-- Employment Type -->
                  <div>
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Employment Type
                    </label>
                    <select
                      class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="">Select Type</option>
                      <option value="full-time">Full-time</option>
                      <option value="part-time">Part-time</option>
                      <option value="contract">Contract</option>
                      <option value="intern">Intern</option>
                    </select>
                  </div>

                  <!-- Hire Date -->
                  <div>
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Hire Date
                    </label>
                    <input
                      type="date"
                      class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    />
                  </div>

                  <!-- Manager -->
                  <div>
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Reports To (Manager)
                    </label>
                    <select
                      class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                    >
                      <option value="">Select Manager</option>
                      <option value="1">John Doe</option>
                      <option value="2">Jane Smith</option>
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
  `,
  styles: []
})
export class UserEditorComponent implements OnInit {
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
      canViewReports: false,
      maxApprovalAmount: null
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
    if (!tenant) {
      return {
        moneyLoan: false,
        bnpl: false,
        pawnshop: false
      };
    }
    return {
      moneyLoan: tenant.moneyLoanEnabled || false,
      bnpl: tenant.bnplEnabled || false,
      pawnshop: tenant.pawnshopEnabled || false
    };
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

    // For tenant context, force user type to tenant and set tenant ID
    if (isTenantCtx) {
      this.userType = 'tenant';
      const currentTenantId = this.authService.getTenantId();
      if (currentTenantId) {
        this.formData.tenantId = currentTenantId;
        console.log('🏢 Tenant context detected, tenantId set to:', currentTenantId);
        // Load platform subscriptions for this tenant
        this.loadTenantPlatformSubscriptions(Number(currentTenantId));
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
          this.formData.tenantId = user.tenantId || null;

          console.log('📝 Form data set to:', this.formData);

          // Set user type
          this.userType = user.tenantId ? 'tenant' : 'system';

          // Set selected roles
          if (user.roles && Array.isArray(user.roles)) {
            const roleIds = user.roles.map(r => typeof r === 'object' ? r.id : r);
            this.selectedRoles.set(new Set(roleIds));
            console.log('👥 Selected roles:', Array.from(this.selectedRoles()));
          }

          // Load product access for tenant users
          if (user.tenantId) {
            // Load tenant's platform subscriptions to show available platforms
            this.loadTenantPlatformSubscriptions(Number(user.tenantId));
            // Load user's current product access
            await this.loadUserProducts(this.userId);
          }

          // Load user's address
          await this.loadUserAddress(this.userId);

          // Force change detection
          setTimeout(() => {
            this.cdr.detectChanges();
            console.log('🔄 Change detection triggered');
          }, 100);
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
    // First, load the tenant data to get enabled platform flags
    this.http.get<any>(`/api/tenants/${tenantId}`).subscribe({
      next: (response) => {
        if (response && response.data) {
          this.currentTenantData.set(response.data);
        }
      },
      error: (error) => {
        console.error('❌ Error loading tenant data:', error);
        this.currentTenantData.set(null);
      }
    });

    // Also load platform subscriptions
    this.productSubscriptionService.getTenantProductSubscriptions(tenantId).subscribe({
      next: (response) => {
        if (response.success && response.data) {
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

    // System users can only have system roles
    if (this.userType === 'system') {
      return roles.filter(r => r.space === 'system');
    }

    // Tenant users can only have tenant roles that belong to their tenant
    if (!this.formData.tenantId) {
      return [];
    }

    const tenantRoles = roles.filter(r => {
      return r.space === 'tenant' && r.tenantId == this.formData.tenantId; // Use == for loose comparison
    });

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

  isRoleSelected(roleId: string): boolean {
    return this.selectedRoles().has(roleId);
  }

  toggleRole(roleId: string) {
    const roles = new Set(this.selectedRoles());
    if (roles.has(roleId)) {
      roles.delete(roleId);
    } else {
      roles.add(roleId);
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

    this.emailCheckInProgress.set(true);
    try {
      const params: any = { email };
      if (this.userType === 'tenant' && this.formData.tenantId) params.tenantId = this.formData.tenantId;
      // Use public auth endpoint for email check
      const resp: any = await firstValueFrom(this.http.get('/api/auth/check-email', { params }));
      const exists = !!resp?.exists;
      this.emailExists.set(exists);
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
              this.productAccess.moneyLoan.maxApprovalAmount = product.maxApprovalAmount || null;
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

        // Populate address form
        this.addressData.addressType = address.addressType || 'home';
        this.addressData.street = address.street || '';
        this.addressData.barangay = address.barangay || '';
        this.addressData.cityMunicipality = address.cityMunicipality || '';
        this.addressData.province = address.province || '';
        this.addressData.region = address.region || '';
        this.addressData.zipCode = address.zipCode || '';
        this.addressData.landmark = address.landmark || '';
        this.addressData.isPrimary = address.isPrimary || false;
        this.addressData.contactPhone = address.contactPhone || '';
        this.addressData.contactName = address.contactName || '';
        this.addressData.notes = address.notes || '';

        // Store address ID for updates
        this.userAddressId = address.id?.toString() || null;

        // Enable address section if address exists
        this.includeAddress = true;

        console.log('📍 Loaded user address:', address.id);
      } else {
        console.log('📍 No address found for user');
      }
    } catch (error) {
      console.error('❌ Error loading user address:', error);
      // Don't throw - just log the error
    }
  }  /**
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
        canViewReports: false,
        maxApprovalAmount: null
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
        canViewReports: this.productAccess.moneyLoan.canViewReports,
        maxApprovalAmount: this.productAccess.moneyLoan.maxApprovalAmount
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

    return assignments;
  }

  /**
   * Assign product access to a user via API
   */
  async assignProductAccess(userId: string, assignments: any[]): Promise<void> {
    try {
      const response = await firstValueFrom(
        this.http.post(`/api/users/${userId}/products`, { products: assignments })
      );
      console.log('📦 Product access response:', response);
    } catch (error) {
      console.error('❌ Error assigning product access:', error);
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

      if (this.isEditMode() && this.userId) {
        // Update existing user
        const updatePayload: UserUpdatePayload = {
          firstName: this.formData.firstName,
          lastName: this.formData.lastName,
          email: this.formData.email,
          status: this.formData.status
        };
        user = await this.userService.updateUser(this.userId, updatePayload);
      } else {
        // Create new user
        const createPayload: UserCreatePayload = {
          email: this.formData.email,
          password: this.formData.password,
          firstName: this.formData.firstName,
          lastName: this.formData.lastName,
          // Use selected tenant ID or null for system admin
          tenantId: this.userType === 'system' ? null : this.formData.tenantId
        };

        console.log('👤 Creating user:', {
          userType: this.userType,
          tenantId: createPayload.tenantId,
          email: createPayload.email
        });

        user = await this.userService.createUser(createPayload);
      }

      if (user) {
        // Reset password if requested (edit mode only)
        // Reset password if provided
        if (this.isEditMode() && this.resetPasswordData.newPassword && this.isPasswordResetValid()) {
          try {
            await this.http.put(`/api/users/${user.id}/reset-password`, {
              newPassword: this.resetPasswordData.newPassword
            }).toPromise();
            this.toastService.success('Password reset successfully');
          } catch (passwordError) {
            console.error('⚠️ Password reset failed:', passwordError);
            this.errorMessage.set('User updated but password reset failed. Please try again.');
            this.saving.set(false);
            return;
          }
        }

        // Update roles (if editing)
        if (this.isEditMode() && this.userId) {
          // Get current roles from loaded user data
          const currentUser = await this.userService.getUser(this.userId);
          const currentRoleIds = new Set(currentUser?.roles?.map(r => r.id) || []);
          const selectedRoleIds = this.selectedRoles();

          console.log('🔄 Updating roles:', {
            current: Array.from(currentRoleIds),
            selected: Array.from(selectedRoleIds)
          });

          // Remove roles that are no longer selected
          for (const roleId of currentRoleIds) {
            if (!selectedRoleIds.has(roleId)) {
              console.log(`➖ Removing role ${roleId}`);
              await this.userService.removeRole(user.id, roleId);
            }
          }

          // Add newly selected roles
          for (const roleId of selectedRoleIds) {
            if (!currentRoleIds.has(roleId)) {
              console.log(`➕ Adding role ${roleId}`);
              await this.userService.assignRole(user.id, roleId);
            }
          }
        } else if (!this.isEditMode()) {
          // For new users, just assign selected roles
          if (this.selectedRoles().size > 0) {
            for (const roleId of this.selectedRoles()) {
              await this.userService.assignRole(user.id, roleId);
            }
          }
        }

        // Create or update address if included
        if (this.includeAddress && this.isAddressValid()) {
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
                userId: user.id,
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

        // Assign product access (for tenant users only)
        if (this.userType === 'tenant') {
          try {
            const productAssignments = this.buildProductAssignments();
            if (productAssignments.length > 0) {
              await this.assignProductAccess(user.id, productAssignments);
              console.log('✅ Product access assigned successfully');
            }
          } catch (productError) {
            console.error('⚠️ User created but product assignment failed:', productError);
            // Don't fail the whole operation if product assignment fails
          }
        }

        console.log('✅ User saved successfully');
        // Detect context and navigate accordingly
        const url = this.router.url;
        if (url.startsWith('/tenant/')) {
          this.router.navigate(['/tenant/users']);
        } else {
          this.router.navigate(['/admin/users']);
        }
      } else {
        this.errorMessage.set('Failed to save user. Please try again.');
      }
    } catch (error) {
      console.error('❌ Error saving user:', error);
      this.errorMessage.set(error instanceof Error ? error.message : 'An error occurred');
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
}
