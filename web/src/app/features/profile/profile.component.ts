import { Component, OnInit, signal, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService, User } from '../../core/services/auth.service';
import { HttpClient } from '@angular/common/http';
import { HeaderComponent } from '../../shared/components/header/header.component';
import { SidebarComponent } from '../../shared/components/sidebar/sidebar.component';

@Component({
  selector: 'app-profile',
  standalone: true,
  imports: [CommonModule, FormsModule, HeaderComponent, SidebarComponent],
  template: `
    <div class="flex h-screen bg-gray-50 dark:bg-gray-900">
      <app-sidebar #sidebar/>

      <div class="flex-1 flex flex-col overflow-hidden">
        <app-header (menuToggle)="toggleSidebar()"/>

        <main class="flex-1 overflow-y-auto p-4 lg:p-6">
          <div class="space-y-4 max-w-4xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">My Profile</h1>
          <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Manage your personal information</p>
        </div>
        <button
          (click)="goBack()"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 19l-7-7 7-7" />
          </svg>
          Back
        </button>
      </div>

      <!-- Profile Card -->
      <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 overflow-hidden">
        <!-- Profile Header -->
        <div class="px-4 py-3 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-500 to-blue-600">
          <div class="flex items-center gap-4">
            <div class="w-16 h-16 rounded-full bg-white flex items-center justify-center text-blue-600 text-2xl font-bold">
              {{ getUserInitials() }}
            </div>
            <div>
              <h2 class="text-lg font-bold text-white">{{ form.first_name }} {{ form.last_name }}</h2>
              <p class="text-sm text-blue-100">{{ user()?.email }}</p>
            </div>
          </div>
        </div>

        <!-- Tabs -->
        <div class="border-b border-gray-200 dark:border-gray-700">
          <nav class="flex -mb-px">
            <button
              type="button"
              (click)="activeTab.set('information')"
              [class]="activeTab() === 'information'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'"
              class="flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
              Information
            </button>
            <button
              type="button"
              (click)="activeTab.set('password')"
              [class]="activeTab() === 'password'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'"
              class="flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
              </svg>
              Change Password
            </button>
            <button
              type="button"
              (click)="activeTab.set('address')"
              [class]="activeTab() === 'address'
                ? 'border-blue-500 text-blue-600 dark:text-blue-400'
                : 'border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300 hover:border-gray-300'"
              class="flex items-center gap-2 px-6 py-3 border-b-2 font-medium text-sm transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Address
            </button>
          </nav>
        </div>

        <!-- Error/Success Messages -->
        <div *ngIf="errorMessage()" class="mx-4 mt-4 px-3 py-2 bg-red-50 dark:bg-red-900/20 border border-red-200 dark:border-red-800 rounded text-xs text-red-700 dark:text-red-300">
          {{ errorMessage() }}
        </div>
        <div *ngIf="successMessage()" class="mx-4 mt-4 px-3 py-2 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded text-xs text-green-700 dark:text-green-300">
          {{ successMessage() }}
        </div>

        <!-- Tab Content: Information -->
        <form *ngIf="activeTab() === 'information'" (ngSubmit)="saveProfile()" class="p-4 space-y-4">
          <!-- Personal Information -->
          <div class="space-y-3">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Personal Information</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  First Name <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  [(ngModel)]="form.first_name"
                  name="first_name"
                  required
                  class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Last Name <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  [(ngModel)]="form.last_name"
                  name="last_name"
                  required
                  class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                />
              </div>
              <div class="md:col-span-2">
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email
                </label>
                <input
                  type="email"
                  [value]="user()?.email"
                  disabled
                  class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
                <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Email cannot be changed</p>
              </div>
            </div>
          </div>

          <!-- Account Information -->
          <div class="space-y-3 pt-3 border-t border-gray-200 dark:border-gray-700">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">Account Information</h3>
            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  User Type
                </label>
                <input
                  type="text"
                  [value]="authService.isSystemAdmin() ? 'System Admin' : 'Tenant User'"
                  disabled
                  class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
              </div>
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Status
                </label>
                <input
                  type="text"
                  value="Active"
                  disabled
                  class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-gray-100 dark:bg-gray-600 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                />
              </div>
            </div>
          </div>

          <!-- Action Buttons -->
          <div class="flex items-center justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
            <button
              type="button"
              (click)="goBack()"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
              Cancel
            </button>
            <button
              type="submit"
              [disabled]="saving()"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg *ngIf="!saving()" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
              </svg>
              <span *ngIf="saving()" class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
              {{ saving() ? 'Saving...' : 'Save Changes' }}
            </button>
          </div>
        </form>

        <!-- Tab Content: Change Password -->
        <form *ngIf="activeTab() === 'password'" (ngSubmit)="changePassword()" class="p-4 space-y-3">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Current Password <span class="text-red-500">*</span>
            </label>
            <input
              type="password"
              [(ngModel)]="passwordForm.currentPassword"
              name="currentPassword"
              class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              New Password <span class="text-red-500">*</span>
            </label>
            <input
              type="password"
              [(ngModel)]="passwordForm.newPassword"
              name="newPassword"
              class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Minimum 8 characters</p>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Confirm New Password <span class="text-red-500">*</span>
            </label>
            <input
              type="password"
              [(ngModel)]="passwordForm.confirmPassword"
              name="confirmPassword"
              class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <button
            type="submit"
            [disabled]="savingPassword()"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <svg *ngIf="!savingPassword()" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z" />
            </svg>
            <span *ngIf="savingPassword()" class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
            {{ savingPassword() ? 'Updating...' : 'Update Password' }}
          </button>
        </form>

        <!-- Tab Content: Address -->
        <div *ngIf="activeTab() === 'address'" class="p-4 space-y-4">
          <!-- Address List -->
          <div class="flex items-center justify-between mb-4">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white">My Addresses</h3>
            <button
              type="button"
              (click)="showAddressForm.set(true); editingAddressId.set(null)"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4" />
              </svg>
              Add Address
            </button>
          </div>

          <!-- Address Form (Add/Edit) -->
          <form *ngIf="showAddressForm()" (ngSubmit)="saveAddress()" class="space-y-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800/50">
            <div class="flex items-center justify-between mb-2">
              <h4 class="text-xs font-semibold text-gray-900 dark:text-white">
                {{ editingAddressId() ? 'Edit Address' : 'New Address' }}
              </h4>
              <button
                type="button"
                (click)="showAddressForm.set(false); resetAddressForm()"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
              >
                <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
              <!-- Address Type -->
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Address Type <span class="text-red-500">*</span>
                </label>
                <select
                  [(ngModel)]="addressForm.address_type"
                  name="address_type"
                  required
                  class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="home">Home</option>
                  <option value="work">Work</option>
                  <option value="billing">Billing</option>
                  <option value="shipping">Shipping</option>
                  <option value="other">Other</option>
                </select>
              </div>

              <!-- Label -->
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Label
                </label>
                <input
                  type="text"
                  [(ngModel)]="addressForm.label"
                  name="label"
                  placeholder="e.g., Main Office"
                  class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <!-- Unit Number -->
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Unit Number
                </label>
                <input
                  type="text"
                  [(ngModel)]="addressForm.unit_number"
                  name="unit_number"
                  placeholder="e.g., Unit 15A"
                  class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <!-- House Number -->
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  House/Building Number
                </label>
                <input
                  type="text"
                  [(ngModel)]="addressForm.house_number"
                  name="house_number"
                  placeholder="e.g., 123"
                  class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <!-- Street Name -->
              <div class="md:col-span-2">
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Street Name
                </label>
                <input
                  type="text"
                  [(ngModel)]="addressForm.street_name"
                  name="street_name"
                  placeholder="e.g., Ayala Avenue"
                  class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <!-- Barangay -->
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Barangay <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  [(ngModel)]="addressForm.barangay"
                  name="barangay"
                  required
                  placeholder="e.g., Poblacion"
                  class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <!-- City/Municipality -->
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  City/Municipality <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  [(ngModel)]="addressForm.city_municipality"
                  name="city_municipality"
                  required
                  placeholder="e.g., Makati City"
                  class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <!-- Province -->
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Province <span class="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  [(ngModel)]="addressForm.province"
                  name="province"
                  required
                  placeholder="e.g., Metro Manila"
                  class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <!-- Region -->
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Region <span class="text-red-500">*</span>
                </label>
                <select
                  [(ngModel)]="addressForm.region"
                  name="region"
                  required
                  class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select Region</option>
                  <option value="NCR">NCR - National Capital Region</option>
                  <option value="CAR">CAR - Cordillera Administrative Region</option>
                  <option value="Region_I">Region I - Ilocos Region</option>
                  <option value="Region_II">Region II - Cagayan Valley</option>
                  <option value="Region_III">Region III - Central Luzon</option>
                  <option value="Region_IV_A">Region IV-A - CALABARZON</option>
                  <option value="Region_IV_B">Region IV-B - MIMAROPA</option>
                  <option value="Region_V">Region V - Bicol Region</option>
                  <option value="Region_VI">Region VI - Western Visayas</option>
                  <option value="Region_VII">Region VII - Central Visayas</option>
                  <option value="Region_VIII">Region VIII - Eastern Visayas</option>
                  <option value="Region_IX">Region IX - Zamboanga Peninsula</option>
                  <option value="Region_X">Region X - Northern Mindanao</option>
                  <option value="Region_XI">Region XI - Davao Region</option>
                  <option value="Region_XII">Region XII - SOCCSKSARGEN</option>
                  <option value="Region_XIII">Region XIII - Caraga</option>
                  <option value="BARMM">BARMM - Bangsamoro Autonomous Region</option>
                </select>
              </div>

              <!-- ZIP Code -->
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  ZIP Code
                </label>
                <input
                  type="text"
                  [(ngModel)]="addressForm.zip_code"
                  name="zip_code"
                  placeholder="e.g., 1226"
                  class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <!-- Landmark -->
              <div class="md:col-span-2">
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Landmark
                </label>
                <input
                  type="text"
                  [(ngModel)]="addressForm.landmark"
                  name="landmark"
                  placeholder="e.g., Near Poblacion Park"
                  class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <!-- Contact Person -->
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contact Person
                </label>
                <input
                  type="text"
                  [(ngModel)]="addressForm.contact_person"
                  name="contact_person"
                  placeholder="e.g., Juan Dela Cruz"
                  class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <!-- Contact Phone -->
              <div>
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Contact Phone
                </label>
                <input
                  type="text"
                  [(ngModel)]="addressForm.contact_phone"
                  name="contact_phone"
                  placeholder="e.g., +63-917-123-4567"
                  class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <!-- Is Primary -->
              <div class="flex items-center">
                <input
                  type="checkbox"
                  [(ngModel)]="addressForm.is_primary"
                  name="is_primary"
                  id="is_primary"
                  class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                />
                <label for="is_primary" class="ml-2 text-xs font-medium text-gray-700 dark:text-gray-300">
                  Set as primary address
                </label>
              </div>
            </div>

            <!-- Form Actions -->
            <div class="flex items-center justify-end gap-2 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                type="button"
                (click)="showAddressForm.set(false); resetAddressForm()"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 rounded transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                [disabled]="savingAddress()"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                <svg *ngIf="!savingAddress()" class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7" />
                </svg>
                <span *ngIf="savingAddress()" class="inline-block animate-spin rounded-full h-4 w-4 border-b-2 border-white"></span>
                {{ savingAddress() ? 'Saving...' : (editingAddressId() ? 'Update Address' : 'Save Address') }}
              </button>
            </div>
          </form>

          <!-- Addresses List -->
          <div class="space-y-3">
            <div *ngFor="let address of addresses()" class="border border-gray-200 dark:border-gray-700 rounded-lg p-4 hover:border-blue-500 dark:hover:border-blue-400 transition-colors">
              <div class="flex items-start justify-between">
                <div class="flex-1">
                  <div class="flex items-center gap-2 mb-2">
                    <span class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                      {{ address.address_type }}
                    </span>
                    <span *ngIf="address.is_primary" class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300">
                      Primary
                    </span>
                    <span *ngIf="address.label" class="text-xs font-medium text-gray-900 dark:text-white">
                      {{ address.label }}
                    </span>
                  </div>
                  <p class="text-sm text-gray-900 dark:text-white">
                    {{ formatAddress(address) }}
                  </p>
                  <div *ngIf="address.contact_person || address.contact_phone" class="mt-2 text-xs text-gray-600 dark:text-gray-400">
                    <span *ngIf="address.contact_person">{{ address.contact_person }}</span>
                    <span *ngIf="address.contact_person && address.contact_phone"> • </span>
                    <span *ngIf="address.contact_phone">{{ address.contact_phone }}</span>
                  </div>
                </div>
                <div class="flex items-center gap-2 ml-4">
                  <button
                    type="button"
                    (click)="editAddress(address)"
                    class="text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300"
                    title="Edit"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    type="button"
                    (click)="deleteAddress(address.id)"
                    class="text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300"
                    title="Delete"
                  >
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

            <div *ngIf="addresses().length === 0 && !showAddressForm()" class="text-center py-8 text-gray-500 dark:text-gray-400 text-sm">
              No addresses found. Click "Add Address" to create one.
            </div>
          </div>
        </div>
      </div>
    </div>
        </main>
      </div>
    </div>
  `
})
export class ProfileComponent implements OnInit {
  @ViewChild('sidebar') sidebar!: SidebarComponent;
  authService = inject(AuthService);
  http = inject(HttpClient);
  router = inject(Router);

  user = this.authService.currentUser;
  activeTab = signal<'information' | 'password' | 'address'>('information');
  saving = signal(false);
  savingPassword = signal(false);
  savingAddress = signal(false);
  errorMessage = signal<string | null>(null);
  successMessage = signal<string | null>(null);

  // Address management
  addresses = signal<any[]>([]);
  showAddressForm = signal(false);
  editingAddressId = signal<number | null>(null);

  form = {
    first_name: '',
    last_name: ''
  };

  passwordForm = {
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  };

  addressForm: any = {
    address_type: 'home',
    label: '',
    unit_number: '',
    house_number: '',
    street_name: '',
    barangay: '',
    city_municipality: '',
    province: '',
    region: '',
    zip_code: '',
    landmark: '',
    contact_person: '',
    contact_phone: '',
    is_primary: false
  };

  ngOnInit(): void {
    const currentUser = this.user();
    if (currentUser) {
      this.form.first_name = currentUser.firstName || '';
      this.form.last_name = currentUser.lastName || '';
      this.loadAddresses();
    }
  }

  getUserInitials(): string {
    return `${this.form.first_name?.[0] || ''}${this.form.last_name?.[0] || ''}`.toUpperCase();
  }

  saveProfile(): void {
    this.saving.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.http.put(`http://localhost:3000/api/users/${this.user()?.id}`, this.form).subscribe({
      next: (response: any) => {
        this.saving.set(false);
        this.successMessage.set('Profile updated successfully!');

        // Update the user in AuthService
        const updatedUser = { ...this.user()!, ...this.form };
        this.authService.currentUser.set(updatedUser);
        localStorage.setItem('user', JSON.stringify(updatedUser));

        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (error) => {
        this.saving.set(false);
        this.errorMessage.set(error.error?.message || 'Failed to update profile');
      }
    });
  }

  changePassword(): void {
    if (this.passwordForm.newPassword !== this.passwordForm.confirmPassword) {
      this.errorMessage.set('New passwords do not match');
      return;
    }

    if (this.passwordForm.newPassword.length < 8) {
      this.errorMessage.set('Password must be at least 8 characters');
      return;
    }

    this.savingPassword.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    this.http.put(`http://localhost:3000/api/users/${this.user()?.id}/password`, {
      currentPassword: this.passwordForm.currentPassword,
      newPassword: this.passwordForm.newPassword
    }).subscribe({
      next: () => {
        this.savingPassword.set(false);
        this.successMessage.set('Password updated successfully!');
        this.passwordForm = { currentPassword: '', newPassword: '', confirmPassword: '' };
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (error) => {
        this.savingPassword.set(false);
        this.errorMessage.set(error.error?.message || 'Failed to update password');
      }
    });
  }

  goBack(): void {
    this.router.navigate(['/']);
  }

  toggleSidebar() {
    if (this.sidebar) {
      this.sidebar.isOpen.update(v => !v);
    }
  }

  // Address Management Methods
  loadAddresses(): void {
    this.http.get<any[]>(`http://localhost:3000/api/users/${this.user()?.id}/addresses`).subscribe({
      next: (addresses) => {
        this.addresses.set(addresses);
      },
      error: (error) => {
        console.error('Failed to load addresses:', error);
      }
    });
  }

  saveAddress(): void {
    this.savingAddress.set(true);
    this.errorMessage.set(null);
    this.successMessage.set(null);

    const url = this.editingAddressId()
      ? `http://localhost:3000/api/users/${this.user()?.id}/addresses/${this.editingAddressId()}`
      : `http://localhost:3000/api/users/${this.user()?.id}/addresses`;

    const method = this.editingAddressId() ? 'put' : 'post';

    this.http[method](url, this.addressForm).subscribe({
      next: () => {
        this.savingAddress.set(false);
        this.successMessage.set(this.editingAddressId() ? 'Address updated successfully!' : 'Address added successfully!');
        this.showAddressForm.set(false);
        this.resetAddressForm();
        this.loadAddresses();
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (error) => {
        this.savingAddress.set(false);
        this.errorMessage.set(error.error?.message || 'Failed to save address');
      }
    });
  }

  editAddress(address: any): void {
    this.editingAddressId.set(address.id);
    this.addressForm = { ...address };
    this.showAddressForm.set(true);
  }

  deleteAddress(addressId: number): void {
    if (!confirm('Are you sure you want to delete this address?')) {
      return;
    }

    this.http.delete(`http://localhost:3000/api/users/${this.user()?.id}/addresses/${addressId}`).subscribe({
      next: () => {
        this.successMessage.set('Address deleted successfully!');
        this.loadAddresses();
        setTimeout(() => this.successMessage.set(null), 3000);
      },
      error: (error) => {
        this.errorMessage.set(error.error?.message || 'Failed to delete address');
      }
    });
  }

  resetAddressForm(): void {
    this.editingAddressId.set(null);
    this.addressForm = {
      address_type: 'home',
      label: '',
      unit_number: '',
      house_number: '',
      street_name: '',
      barangay: '',
      city_municipality: '',
      province: '',
      region: '',
      zip_code: '',
      landmark: '',
      contact_person: '',
      contact_phone: '',
      is_primary: false
    };
  }

  formatAddress(address: any): string {
    const parts = [];

    if (address.unit_number) parts.push(`Unit ${address.unit_number}`);
    if (address.house_number) parts.push(address.house_number);
    if (address.street_name) parts.push(address.street_name);
    if (address.barangay) parts.push(address.barangay);
    if (address.city_municipality) parts.push(address.city_municipality);
    if (address.province) parts.push(address.province);
    if (address.region) parts.push(address.region);
    if (address.zip_code) parts.push(address.zip_code);

    return parts.join(', ');
  }
}
