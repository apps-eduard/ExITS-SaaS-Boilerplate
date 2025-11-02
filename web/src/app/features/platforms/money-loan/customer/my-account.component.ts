import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface CustomerProfile {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address: string;
  city: string;
  country: string;
  dateOfBirth: string;
  idNumber: string;
  createdAt: string;
  kycStatus?: 'pending' | 'verified' | 'rejected' | 'not_submitted';
}

@Component({
  selector: 'app-my-account',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 space-y-3 max-w-4xl mx-auto">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span>👤</span> My Account
          </h1>
          <p class="text-xs text-gray-600 dark:text-gray-400 mt-0.5">Manage your profile and account settings</p>
        </div>
      </div>

      <!-- Profile Information -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div class="flex items-center justify-between mb-3">
          <h2 class="text-base font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
            </svg>
            Profile Information
          </h2>
          @if (!editing()) {
            <button
              (click)="startEdit()"
              class="px-3 py-1 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
              Edit Profile
            </button>
          }
        </div>

        @if (loading()) {
          <div class="text-center py-8">
            <div class="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
            <p class="mt-2 text-sm text-gray-600 dark:text-gray-400">Loading profile...</p>
          </div>
        } @else if (profile()) {
          <div class="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">First Name</label>
              @if (editing()) {
                <input
                  type="text"
                  [(ngModel)]="editForm.firstName"
                  class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              } @else {
                <p class="text-sm text-gray-900 dark:text-white">{{ profile()!.firstName }}</p>
              }
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name</label>
              @if (editing()) {
                <input
                  type="text"
                  [(ngModel)]="editForm.lastName"
                  class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              } @else {
                <p class="text-sm text-gray-900 dark:text-white">{{ profile()!.lastName }}</p>
              }
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email</label>
              <p class="text-sm text-gray-900 dark:text-white">{{ profile()!.email }}</p>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Phone</label>
              @if (editing()) {
                <input
                  type="tel"
                  [(ngModel)]="editForm.phone"
                  class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              } @else {
                <p class="text-sm text-gray-900 dark:text-white">{{ profile()!.phone }}</p>
              }
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Date of Birth</label>
              <p class="text-sm text-gray-900 dark:text-white">{{ formatDate(profile()!.dateOfBirth) }}</p>
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">ID Number</label>
              <p class="text-sm text-gray-900 dark:text-white">{{ profile()!.idNumber }}</p>
            </div>

            <div class="md:col-span-2">
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Address</label>
              @if (editing()) {
                <input
                  type="text"
                  [(ngModel)]="editForm.address"
                  class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              } @else {
                <p class="text-sm text-gray-900 dark:text-white">{{ profile()!.address }}</p>
              }
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">City</label>
              @if (editing()) {
                <input
                  type="text"
                  [(ngModel)]="editForm.city"
                  class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              } @else {
                <p class="text-sm text-gray-900 dark:text-white">{{ profile()!.city }}</p>
              }
            </div>

            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Country</label>
              @if (editing()) {
                <input
                  type="text"
                  [(ngModel)]="editForm.country"
                  class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              } @else {
                <p class="text-sm text-gray-900 dark:text-white">{{ profile()!.country }}</p>
              }
            </div>
          </div>

          @if (editing()) {
            <div class="flex items-center justify-end gap-2 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
              <button
                (click)="cancelEdit()"
                class="px-3 py-1.5 text-xs border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Cancel
              </button>
              <button
                (click)="saveProfile()"
                [disabled]="saving()"
                class="inline-flex items-center gap-1 px-3 py-1.5 text-xs bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 transition-colors">
                @if (saving()) {
                  <svg class="animate-spin h-3 w-3" fill="none" viewBox="0 0 24 24">
                    <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                    <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                }
                Save Changes
              </button>
            </div>
          }
        }
      </div>

      <!-- Account Stats -->
      <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-2">
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400">Member Since</p>
              <p class="text-sm font-bold text-gray-900 dark:text-white">{{ formatDate(profile()?.createdAt) }}</p>
            </div>
            <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400">Account Status</p>
              <p class="text-sm font-bold text-green-600 dark:text-green-400">Active</p>
            </div>
            <div class="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <svg class="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400">Email Verified</p>
              <p class="text-sm font-bold text-blue-600 dark:text-blue-400">Verified</p>
            </div>
            <div class="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400">KYC Status</p>
              @if (profile()?.kycStatus === 'verified') {
                <p class="text-sm font-bold text-green-600 dark:text-green-400">Verified</p>
              } @else if (profile()?.kycStatus === 'pending') {
                <p class="text-sm font-bold text-yellow-600 dark:text-yellow-400">Pending</p>
              } @else if (profile()?.kycStatus === 'rejected') {
                <p class="text-sm font-bold text-red-600 dark:text-red-400">Rejected</p>
              } @else {
                <p class="text-sm font-bold text-gray-600 dark:text-gray-400">Not Submitted</p>
              }
            </div>
            @if (profile()?.kycStatus === 'verified') {
              <div class="w-8 h-8 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
                <svg class="w-4 h-4 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                </svg>
              </div>
            } @else if (profile()?.kycStatus === 'pending') {
              <div class="w-8 h-8 bg-yellow-100 dark:bg-yellow-900/30 rounded-lg flex items-center justify-center">
                <svg class="w-4 h-4 text-yellow-600 dark:text-yellow-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
            } @else if (profile()?.kycStatus === 'rejected') {
              <div class="w-8 h-8 bg-red-100 dark:bg-red-900/30 rounded-lg flex items-center justify-center">
                <svg class="w-4 h-4 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </div>
            } @else {
              <div class="w-8 h-8 bg-gray-100 dark:bg-gray-900/30 rounded-lg flex items-center justify-center">
                <svg class="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
              </div>
            }
          </div>
        </div>
      </div>

      <!-- Security Section -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <h2 class="text-base font-semibold text-gray-900 dark:text-white mb-3 flex items-center gap-2">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/>
          </svg>
          Security Settings
        </h2>

        <div class="space-y-2">
          <button
            (click)="changePassword()"
            class="w-full flex items-center justify-between p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 7a2 2 0 012 2m4 0a6 6 0 01-7.743 5.743L11 17H9v2H7v2H4a1 1 0 01-1-1v-2.586a1 1 0 01.293-.707l5.964-5.964A6 6 0 1121 9z"/>
              </svg>
              <div class="text-left">
                <p class="text-xs font-medium text-gray-900 dark:text-white">Change Password</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">Update your account password</p>
              </div>
            </div>
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>

          <button
            class="w-full flex items-center justify-between p-2 border border-gray-200 dark:border-gray-700 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <div class="flex items-center gap-2">
              <svg class="w-4 h-4 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z"/>
              </svg>
              <div class="text-left">
                <p class="text-xs font-medium text-gray-900 dark:text-white">Two-Factor Authentication</p>
                <p class="text-xs text-gray-500 dark:text-gray-400">Add an extra layer of security</p>
              </div>
            </div>
            <svg class="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5l7 7-7 7"/>
            </svg>
          </button>
        </div>
      </div>

      <!-- Logout Button -->
      <div class="flex justify-center pt-2">
        <button
          (click)="logout()"
          class="inline-flex items-center gap-2 px-4 py-2 text-sm border border-red-300 dark:border-red-600 text-red-600 dark:text-red-400 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"/>
          </svg>
          Logout
        </button>
      </div>
    </div>
  `
})
export class MyAccountComponent implements OnInit {
  private router = inject(Router);

  profile = signal<CustomerProfile | null>(null);
  loading = signal(false);
  editing = signal(false);
  saving = signal(false);

  editForm: Partial<CustomerProfile> = {};

  ngOnInit() {
    this.loadProfile();
  }

  loadProfile() {
    this.loading.set(true);

    // Get customer data from localStorage
    const customerDataStr = localStorage.getItem('customerData');
    if (customerDataStr) {
      try {
        const customerData = JSON.parse(customerDataStr);
        const profile: CustomerProfile = {
          id: customerData.id || customerData.customerId,
          firstName: customerData.firstName || customerData.first_name || 'John',
          lastName: customerData.lastName || customerData.last_name || 'Doe',
          email: customerData.email || 'customer@example.com',
          phone: customerData.phone || customerData.phone_number || '+63 123 456 7890',
          address: customerData.address || '123 Main Street',
          city: customerData.city || 'Manila',
          country: customerData.country || 'Philippines',
          dateOfBirth: customerData.dateOfBirth || customerData.date_of_birth || '1990-01-01',
          idNumber: customerData.idNumber || customerData.id_number || 'ID-123456789',
          createdAt: customerData.createdAt || customerData.created_at || new Date().toISOString(),
          kycStatus: customerData.kycStatus || customerData.kyc_status || 'verified'
        };
        this.profile.set(profile);
      } catch (error) {
        console.error('Error parsing customer data:', error);
      }
    }

    this.loading.set(false);
  }

  startEdit() {
    this.editForm = { ...this.profile()! };
    this.editing.set(true);
  }

  cancelEdit() {
    this.editing.set(false);
    this.editForm = {};
  }

  saveProfile() {
    this.saving.set(true);

    // Simulate API call
    setTimeout(() => {
      if (this.profile()) {
        const updated = { ...this.profile()!, ...this.editForm };
        this.profile.set(updated);

        // Update localStorage
        const customerDataStr = localStorage.getItem('customerData');
        if (customerDataStr) {
          const customerData = JSON.parse(customerDataStr);
          const updatedData = {
            ...customerData,
            firstName: updated.firstName,
            lastName: updated.lastName,
            phone: updated.phone,
            address: updated.address,
            city: updated.city,
            country: updated.country
          };
          localStorage.setItem('customerData', JSON.stringify(updatedData));
        }
      }

      this.editing.set(false);
      this.saving.set(false);
      this.editForm = {};
    }, 1000);
  }

  formatDate(date: string | undefined | null): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString('en-PH', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  }

  changePassword() {
    // Navigate to change password page or open modal
    alert('Change password functionality coming soon!');
  }

  logout() {
    localStorage.removeItem('customerData');
    localStorage.removeItem('customerToken');
    this.router.navigate(['/customer/login']);
  }
}
