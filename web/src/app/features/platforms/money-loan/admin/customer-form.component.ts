import { Component, OnInit, signal, inject, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { AuthService } from '../../../../core/services/auth.service';
import { ToastService } from '../../../../core/services/toast.service';
import { CustomerService } from '../shared/services/customer.service';
import { LoanCustomer } from '../shared/models/loan.models';

@Component({
  selector: 'app-customer-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 md:p-6 space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">
            {{ isEditMode() ? 'Edit Customer' : 'Add New Customer' }}
          </h1>
          <p class="text-sm text-gray-600 dark:text-gray-400">
            {{ isEditMode() ? 'Update customer information and KYC details' : 'Register a new loan customer' }}
          </p>
        </div>
        <button
          (click)="goBack()"
          class="inline-flex items-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
          </svg>
          Back
        </button>
      </div>

      <!-- Tabs -->
      <div class="border-b border-gray-200 dark:border-gray-700">
        <nav class="-mb-px flex space-x-6" aria-label="Tabs">
          <button
            type="button"
            (click)="activeTab.set('basic')"
            [class.border-blue-500]="activeTab() === 'basic'"
            [class.text-blue-600]="activeTab() === 'basic'"
            [class.dark:text-blue-400]="activeTab() === 'basic'"
            [class.border-transparent]="activeTab() !== 'basic'"
            [class.text-gray-500]="activeTab() !== 'basic'"
            [class.dark:text-gray-400]="activeTab() !== 'basic'"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors">
            <span class="flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              Basic Information
            </span>
          </button>
          <button
            type="button"
            (click)="activeTab.set('employment')"
            [class.border-blue-500]="activeTab() === 'employment'"
            [class.text-blue-600]="activeTab() === 'employment'"
            [class.dark:text-blue-400]="activeTab() === 'employment'"
            [class.border-transparent]="activeTab() !== 'employment'"
            [class.text-gray-500]="activeTab() !== 'employment'"
            [class.dark:text-gray-400]="activeTab() !== 'employment'"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors">
            <span class="flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
              </svg>
              Employment Information
            </span>
          </button>
          <button
            type="button"
            (click)="activeTab.set('kyc')"
            [class.border-blue-500]="activeTab() === 'kyc'"
            [class.text-blue-600]="activeTab() === 'kyc'"
            [class.dark:text-blue-400]="activeTab() === 'kyc'"
            [class.border-transparent]="activeTab() !== 'kyc'"
            [class.text-gray-500]="activeTab() !== 'kyc'"
            [class.dark:text-gray-400]="activeTab() !== 'kyc'"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors">
            <span class="flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
              KYC Information
            </span>
          </button>
          <button
            type="button"
            (click)="activeTab.set('address')"
            [class.border-blue-500]="activeTab() === 'address'"
            [class.text-blue-600]="activeTab() === 'address'"
            [class.dark:text-blue-400]="activeTab() === 'address'"
            [class.border-transparent]="activeTab() !== 'address'"
            [class.text-gray-500]="activeTab() !== 'address'"
            [class.dark:text-gray-400]="activeTab() !== 'address'"
            class="whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors">
            <span class="flex items-center gap-2">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
              </svg>
              Address Information
            </span>
          </button>
        </nav>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <!-- Main Form - 2 columns -->
        <div class="lg:col-span-2">
          <form id="customerForm" (ngSubmit)="onSubmit()" class="space-y-6">

            <!-- Basic Information Tab -->
            @if (activeTab() === 'basic') {
              <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
                  </svg>
                  Personal Information
                </h2>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      First Name <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      [(ngModel)]="formData.firstName"
                      name="firstName"
                      required
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Last Name <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      [(ngModel)]="formData.lastName"
                      name="lastName"
                      required
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Date of Birth <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="date"
                      [(ngModel)]="formData.dateOfBirth"
                      name="dateOfBirth"
                      required
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Gender <span class="text-red-500">*</span>
                    </label>
                    <select
                      [(ngModel)]="formData.gender"
                      name="gender"
                      required
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select Gender</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Email <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="email"
                      [(ngModel)]="formData.email"
                      name="email"
                      required
                      placeholder="customer@example.com"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Phone <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="tel"
                      [(ngModel)]="formData.phone"
                      name="phone"
                      required
                      placeholder="+63"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  </div>

                  <div class="md:col-span-2">
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Tenant
                    </label>
                    <input
                      type="text"
                      [value]="getTenantDisplayName()"
                      disabled
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-900 text-gray-500 dark:text-gray-400">
                    @if (!isInTenantContext()) {
                      <p class="mt-1 text-xs text-gray-500 dark:text-gray-400">Tenant cannot be changed after customer creation</p>
                    }
                  </div>
                </div>
              </div>
            }

            <!-- Employment Information Tab -->
            @if (activeTab() === 'employment') {
              <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 13.255A23.931 23.931 0 0112 15c-3.183 0-6.22-.62-9-1.745M16 6V4a2 2 0 00-2-2h-4a2 2 0 00-2 2v2m4 6h.01M5 20h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"/>
                  </svg>
                  Employment Information
                </h2>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Employment Status
                    </label>
                    <select
                      [(ngModel)]="formData.employmentStatus"
                      name="employmentStatus"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select Status</option>
                      <option value="employed">Employed</option>
                      <option value="self-employed">Self-Employed</option>
                      <option value="unemployed">Unemployed</option>
                      <option value="retired">Retired</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Employer Name
                    </label>
                    <input
                      type="text"
                      [(ngModel)]="formData.employerName"
                      name="employerName"
                      placeholder="Company name"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Monthly Income
                    </label>
                    <input
                      type="number"
                      [(ngModel)]="formData.monthlyIncome"
                      name="monthlyIncome"
                      step="0.01"
                      placeholder="0.00"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Source of Income
                    </label>
                    <input
                      type="text"
                      [(ngModel)]="formData.sourceOfIncome"
                      name="sourceOfIncome"
                      placeholder="e.g., Salary, Business, Freelance"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  </div>
                </div>
              </div>
            }

            <!-- KYC Information Tab -->
            @if (activeTab() === 'kyc') {
              <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
                  </svg>
                  KYC Information
                </h2>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ID Type
                    </label>
                    <select
                      [(ngModel)]="formData.idType"
                      name="idType"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="">Select ID Type</option>
                      <option value="passport">Passport</option>
                      <option value="drivers_license">Driver's License</option>
                      <option value="national_id">National ID</option>
                      <option value="sss">SSS ID</option>
                      <option value="umid">UMID</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ID Number
                    </label>
                    <input
                      type="text"
                      [(ngModel)]="formData.idNumber"
                      name="idNumber"
                      placeholder="Enter ID number"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      KYC Status
                    </label>
                    <select
                      [(ngModel)]="formData.kycStatus"
                      name="kycStatus"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="pending">Pending</option>
                      <option value="verified">Verified</option>
                      <option value="rejected">Rejected</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Credit Score
                    </label>
                    <input
                      type="number"
                      [(ngModel)]="formData.creditScore"
                      name="creditScore"
                      min="0"
                      max="1000"
                      placeholder="650"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  </div>
                </div>
              </div>
            }

            <!-- Address Information Tab -->
            @if (activeTab() === 'address') {
              <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-6">
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center gap-2">
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  Address Information
                </h2>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Region <span class="text-red-500">*</span>
                    </label>
                    <select
                      [(ngModel)]="formData.region"
                      name="region"
                      required
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
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

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Province <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      [(ngModel)]="formData.province"
                      name="province"
                      required
                      placeholder="Province name"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      City/Municipality <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      [(ngModel)]="formData.cityMunicipality"
                      name="cityMunicipality"
                      required
                      placeholder="City or Municipality"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Barangay <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      [(ngModel)]="formData.barangay"
                      name="barangay"
                      required
                      placeholder="Barangay name"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      House/Building Number
                    </label>
                    <input
                      type="text"
                      [(ngModel)]="formData.houseNumber"
                      name="houseNumber"
                      placeholder="House or Building No."
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Street Name
                    </label>
                    <input
                      type="text"
                      [(ngModel)]="formData.streetName"
                      name="streetName"
                      placeholder="Street name"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Subdivision/Village
                    </label>
                    <input
                      type="text"
                      [(ngModel)]="formData.subdivision"
                      name="subdivision"
                      placeholder="Subdivision or Village"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      ZIP Code
                    </label>
                    <input
                      type="text"
                      [(ngModel)]="formData.zipCode"
                      name="zipCode"
                      placeholder="Postal Code"
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Address Type <span class="text-red-500">*</span>
                    </label>
                    <select
                      [(ngModel)]="formData.addressType"
                      name="addressType"
                      required
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                      <option value="home">Home</option>
                      <option value="work">Work</option>
                      <option value="billing">Billing</option>
                      <option value="shipping">Shipping</option>
                      <option value="business">Business</option>
                      <option value="other">Other</option>
                    </select>
                  </div>

                  <div>
                    <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                      Country <span class="text-red-500">*</span>
                    </label>
                    <input
                      type="text"
                      [(ngModel)]="formData.country"
                      name="country"
                      required
                      value="Philippines"
                      readonly
                      class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-100 dark:bg-gray-600 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                  </div>

                  <div class="md:col-span-2">
                    <label class="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        [(ngModel)]="formData.isPrimary"
                        name="isPrimary"
                        class="w-4 h-4 text-blue-600 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500">
                      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">Set as primary address</span>
                    </label>
                  </div>
                </div>
              </div>
            }
          </form>
        </div>

        <!-- Required Fields Checklist Sidebar - 1 column -->
        <div class="lg:col-span-1">
          <div class="bg-blue-50 dark:bg-blue-900/20 border-2 border-blue-200 dark:border-blue-800 rounded-lg p-5 sticky top-4">
            <div class="flex items-center gap-3 mb-4">
              <div class="w-10 h-10 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center">
                <svg class="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4"/>
                </svg>
              </div>
              <h3 class="text-lg font-bold text-blue-900 dark:text-blue-100">Required Fields Checklist</h3>
            </div>

            <!-- Basic Information -->
            <div class="mb-4">
              <div class="flex items-center gap-2 mb-2">
                @if (isFieldFilled(formData.email)) {
                  <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                } @else {
                  <svg class="w-5 h-5 text-gray-400 dark:text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-11a1 1 0 10-2 0v2H7a1 1 0 100 2h2v2a1 1 0 102 0v-2h2a1 1 0 100-2h-2V7z" clip-rule="evenodd"/>
                  </svg>
                }
                <span [class.text-gray-600]="!isFieldFilled(formData.email)" [class.dark:text-gray-400]="!isFieldFilled(formData.email)" [class.text-gray-900]="isFieldFilled(formData.email)" [class.dark:text-white]="isFieldFilled(formData.email)" class="text-sm font-medium">Email address</span>
              </div>
            </div>

            <div class="border-t border-blue-200 dark:border-blue-700 pt-3 mb-3"></div>

            <!-- Address Information -->
            <div class="space-y-2 mb-3">
              <h4 class="text-xs font-semibold text-blue-900 dark:text-blue-100 uppercase tracking-wide mb-2">Address Type</h4>

              <div class="flex items-center gap-2">
                @if (isFieldFilled(formData.region)) {
                  <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                } @else {
                  <svg class="w-5 h-5 text-gray-400 dark:text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 000 2h4a1 1 0 100-2H8z" clip-rule="evenodd"/>
                  </svg>
                }
                <span [class.text-gray-600]="!isFieldFilled(formData.region)" [class.dark:text-gray-400]="!isFieldFilled(formData.region)" [class.text-gray-900]="isFieldFilled(formData.region)" [class.dark:text-white]="isFieldFilled(formData.region)" class="text-sm">Region</span>
              </div>

              <div class="flex items-center gap-2">
                @if (isFieldFilled(formData.province)) {
                  <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                } @else {
                  <svg class="w-5 h-5 text-gray-400 dark:text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 000 2h4a1 1 0 100-2H8z" clip-rule="evenodd"/>
                  </svg>
                }
                <span [class.text-gray-600]="!isFieldFilled(formData.province)" [class.dark:text-gray-400]="!isFieldFilled(formData.province)" [class.text-gray-900]="isFieldFilled(formData.province)" [class.dark:text-white]="isFieldFilled(formData.province)" class="text-sm">Province</span>
              </div>

              <div class="flex items-center gap-2">
                @if (isFieldFilled(formData.cityMunicipality)) {
                  <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                } @else {
                  <svg class="w-5 h-5 text-gray-400 dark:text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 000 2h4a1 1 0 100-2H8z" clip-rule="evenodd"/>
                  </svg>
                }
                <span [class.text-gray-600]="!isFieldFilled(formData.cityMunicipality)" [class.dark:text-gray-400]="!isFieldFilled(formData.cityMunicipality)" [class.text-gray-900]="isFieldFilled(formData.cityMunicipality)" [class.dark:text-white]="isFieldFilled(formData.cityMunicipality)" class="text-sm">City/Municipality</span>
              </div>

              <div class="flex items-center gap-2">
                @if (isFieldFilled(formData.barangay)) {
                  <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                } @else {
                  <svg class="w-5 h-5 text-gray-400 dark:text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 000 2h4a1 1 0 100-2H8z" clip-rule="evenodd"/>
                  </svg>
                }
                <span [class.text-gray-600]="!isFieldFilled(formData.barangay)" [class.dark:text-gray-400]="!isFieldFilled(formData.barangay)" [class.text-gray-900]="isFieldFilled(formData.barangay)" [class.dark:text-white]="isFieldFilled(formData.barangay)" class="text-sm">Barangay</span>
              </div>

              <div class="flex items-center gap-2">
                @if (isFieldFilled(formData.streetName)) {
                  <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                  </svg>
                } @else {
                  <svg class="w-5 h-5 text-gray-400 dark:text-gray-600" fill="currentColor" viewBox="0 0 20 20">
                    <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 000 2h4a1 1 0 100-2H8z" clip-rule="evenodd"/>
                  </svg>
                }
                <span [class.text-gray-600]="!isFieldFilled(formData.streetName)" [class.dark:text-gray-400]="!isFieldFilled(formData.streetName)" [class.text-gray-900]="isFieldFilled(formData.streetName)" [class.dark:text-white]="isFieldFilled(formData.streetName)" class="text-sm">Street Name (optional)</span>
              </div>
            </div>

            <div class="border-t border-blue-200 dark:border-blue-700 pt-3 text-xs text-blue-800 dark:text-blue-200">
              <div class="flex items-start gap-2">
                <svg class="w-4 h-4 text-red-500 dark:text-red-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clip-rule="evenodd"/>
                </svg>
                <span><span class="text-red-500">*</span> Required to save</span>
              </div>
              <div class="flex items-start gap-2 mt-1">
                <svg class="w-4 h-4 text-green-600 dark:text-green-400 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                </svg>
                <span>Completed</span>
              </div>
              <div class="flex items-start gap-2 mt-1">
                <svg class="w-4 h-4 text-gray-400 dark:text-gray-600 mt-0.5" fill="currentColor" viewBox="0 0 20 20">
                  <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 000 2h4a1 1 0 100-2H8z" clip-rule="evenodd"/>
                </svg>
                <span>Optional (for address)</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <!-- Form Actions - Always Visible -->
      <div class="flex items-center justify-end gap-3 border-t border-gray-200 dark:border-gray-700 pt-4">
        <button
          type="button"
          (click)="goBack()"
          class="px-6 py-2.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
          Cancel
        </button>
        <button
          type="submit"
          form="customerForm"
          [disabled]="saving()"
          class="inline-flex items-center gap-2 px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-lg disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
          @if (saving()) {
            <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
            </svg>
          }
          <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
          </svg>
          {{ isEditMode() ? 'Update Customer' : 'Create Customer' }}
        </button>
      </div>
    </div>
  `
})
export class CustomerFormComponent implements OnInit {
  private customerService = inject(CustomerService);
  private http = inject(HttpClient);
  private router = inject(Router);
  private route = inject(ActivatedRoute);
  private cdr = inject(ChangeDetectorRef);
  private authService = inject(AuthService);
  private toastService = inject(ToastService);

  isEditMode = signal(false);
  saving = signal(false);
  activeTab = signal<'basic' | 'employment' | 'kyc' | 'address'>('basic');
  customerId: number | null = null;
  tenantName = signal<string>('');

  // Helper to check if we're in tenant context (public for template)
  isInTenantContext(): boolean {
    return this.router.url.includes('/tenant/customers');
  }

  // Get tenant display name (public for template)
  getTenantDisplayName(): string {
    if (this.isInTenantContext()) {
      // In tenant space, get from current user
      const user = this.authService.currentUser();
      return user?.tenantId ? this.tenantName() || 'Current Tenant' : 'No Tenant';
    }
    // In Money Loan platform, show from customer data
    return this.tenantName() || 'Loading...';
  }

  formData: any = {
    firstName: '',
    lastName: '',
    dateOfBirth: '',
    gender: '',
    email: '',
    phone: '',
    streetAddress: '',
    houseNumber: '',
    streetName: '',
    subdivision: '',
    barangay: '',
    cityMunicipality: '',
    province: '',
    region: '',
    zipCode: '',
    country: 'Philippines',
    addressType: 'home',
    isPrimary: true,
    employmentStatus: '',
    employerName: '',
    monthlyIncome: null,
    sourceOfIncome: '',
    idType: '',
    idNumber: '',
    kycStatus: 'pending',
    creditScore: 650,
    status: 'active'
  };

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id && id !== 'new') {
      this.customerId = parseInt(id);
      this.isEditMode.set(true);
      this.loadCustomer();
    } else {
      // Create mode: Load tenant name for Money Loan platform
      if (!this.isInTenantContext()) {
        this.loadCurrentUserTenantName();
      }
    }

    // Load tenant name if in tenant context
    if (this.isInTenantContext()) {
      this.loadTenantName();
    }

    // Log current route to debug
    console.log('🔍 Current route:', this.router.url);
  }

  loadCurrentUserTenantName() {
    // Get current user's tenant name for Money Loan platform
    this.http.get<any>('http://localhost:3000/api/tenants/current').subscribe({
      next: (response: any) => {
        if (response.success && response.data && response.data.name) {
          this.tenantName.set(response.data.name);
          console.log('✅ Tenant name loaded for create mode:', response.data.name);
        }
      },
      error: (error: any) => {
        console.error('Error loading tenant name:', error);
        this.tenantName.set('Current Tenant');
      }
    });
  }

  loadTenantName() {
    // Get tenant info from /api/tenants/current
    this.http.get<any>('http://localhost:3000/api/tenants/current').subscribe({
      next: (response: any) => {
        if (response.success && response.data) {
          this.tenantName.set(response.data.name || 'Unknown Tenant');
        }
      },
      error: (error: any) => {
        console.error('Error loading tenant name:', error);
        this.tenantName.set('Current Tenant');
      }
    });
  }

  loadCustomer() {
    if (!this.customerId) return;

    // Use different API endpoint based on context
    if (this.isInTenantContext()) {
      // Tenant space: use /api/customers/:id
      this.http.get<any>(`http://localhost:3000/api/customers/${this.customerId}`).subscribe({
        next: (response: any) => {
          if (response.success && response.data) {
            const customer = response.data;

            // Knex returns camelCase, so map directly
            // Use Object.assign to preserve object reference for ngModel binding
            Object.assign(this.formData, {
              firstName: customer.firstName || '',
              lastName: customer.lastName || '',
              dateOfBirth: customer.dateOfBirth ? customer.dateOfBirth.split('T')[0] : '',
              gender: customer.gender || '',
              email: customer.email || '',
              phone: customer.phone || '',
              streetAddress: customer.streetAddress || '',
              houseNumber: customer.houseNumber || '',
              streetName: customer.streetName || '',
              subdivision: customer.subdivision || '',
              barangay: customer.barangay || '',
              cityMunicipality: customer.cityMunicipality || '',
              province: customer.province || '',
              region: customer.region || '',
              zipCode: customer.zipCode || '',
              country: customer.country || 'Philippines',
              addressType: customer.addressType || 'home',
              isPrimary: customer.isPrimary !== undefined ? customer.isPrimary : true,
              employmentStatus: customer.employmentStatus || '',
              employerName: customer.employerName || '',
              monthlyIncome: customer.monthlyIncome || null,
              sourceOfIncome: customer.sourceOfIncome || '',
              idType: customer.idType || '',
              idNumber: customer.idNumber || '',
              kycStatus: customer.kycStatus || 'pending',
              creditScore: customer.creditScore || 650,
              status: customer.status || 'active'
            });

            console.log('✅ Tenant customer data loaded:', this.formData);
            this.cdr.detectChanges();
          }
        },
        error: (error: any) => {
          console.error('Error loading tenant customer:', error);
        }
      });
    } else {
      // Money Loan platform: use CustomerService
      this.customerService.getCustomerById(this.customerId).subscribe({
        next: (response: any) => {
          if (response.success && response.data) {
            const customer = response.data;
            Object.assign(this.formData, customer);

            // Set tenant name directly from customer data (no need for separate API call)
            if (customer.tenantName) {
              this.tenantName.set(customer.tenantName);
              console.log('✅ Tenant name from customer data:', customer.tenantName);
            } else if (customer.tenantId) {
              // Fallback: try to load by ID if tenantName not included
              this.loadTenantNameById(customer.tenantId);
            }

            console.log('✅ Money Loan customer data loaded:', this.formData);
            this.cdr.detectChanges();
          }
        },
        error: (error: any) => {
          console.error('Error loading Money Loan customer:', error);
        }
      });
    }
  }

  loadTenantNameById(tenantId: number) {
    // Get tenant info by ID for Money Loan platform
    this.http.get<any>(`http://localhost:3000/api/tenants/${tenantId}`).subscribe({
      next: (response: any) => {
        // Response format: { message: '...', data: { name: '...', ... } }
        if (response.data && response.data.name) {
          this.tenantName.set(response.data.name);
          console.log('✅ Loaded tenant name:', response.data.name);
        } else {
          this.tenantName.set('Unknown Tenant');
        }
      },
      error: (error: any) => {
        console.error('Error loading tenant name by ID:', error);
        this.tenantName.set('Tenant ID: ' + tenantId);
      }
    });
  }

  isFieldFilled(value: any): boolean {
    return value !== null && value !== undefined && value !== '';
  }

  validateForm(): string | null {
    // Validate required fields
    if (!this.formData.firstName?.trim()) return 'First name is required';
    if (!this.formData.lastName?.trim()) return 'Last name is required';
    if (!this.formData.email?.trim()) return 'Email is required';
    if (!this.formData.phone?.trim()) return 'Phone number is required';
    if (!this.formData.dateOfBirth) return 'Date of birth is required';
    if (!this.formData.gender) return 'Gender is required';

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(this.formData.email)) return 'Invalid email format';

    return null; // No errors
  }

  onSubmit() {
    // Validate form
    const validationError = this.validateForm();
    if (validationError) {
      alert(validationError);
      return;
    }

    this.saving.set(true);

    // Determine return path based on current route
    const currentUrl = this.router.url;
    const returnPath = currentUrl.includes('/tenant/customers')
      ? '/tenant/customers'
      : '/platforms/money-loan/dashboard/customers/all';

    if (this.isInTenantContext()) {
      // Tenant space: use /api/customers
      if (this.isEditMode() && this.customerId) {
        this.http.put<any>(`http://localhost:3000/api/customers/${this.customerId}`, this.formData).subscribe({
          next: () => {
            this.saving.set(false);
            this.toastService.success('Customer updated successfully');
            this.router.navigate([returnPath]);
          },
          error: (error: any) => {
            console.error('Error updating tenant customer:', error);
            this.toastService.error('Failed to update customer: ' + (error.error?.message || error.message));
            this.saving.set(false);
          }
        });
      } else {
        this.http.post<any>('http://localhost:3000/api/customers', this.formData).subscribe({
          next: () => {
            this.saving.set(false);
            this.toastService.success('Customer created successfully');
            this.router.navigate([returnPath]);
          },
          error: (error: any) => {
            console.error('Error creating tenant customer:', error);
            this.toastService.error('Failed to create customer: ' + (error.error?.message || error.message));
            this.saving.set(false);
          }
        });
      }
    } else {
      // Money Loan platform: use CustomerService
      if (this.isEditMode() && this.customerId) {
        this.customerService.updateCustomer(this.customerId, this.formData).subscribe({
          next: () => {
            this.saving.set(false);
            this.toastService.success('Customer updated successfully');
            this.router.navigate([returnPath]);
          },
          error: (error: any) => {
            console.error('Error updating Money Loan customer:', error);
            this.toastService.error('Failed to update customer: ' + (error.error?.message || error.message));
            this.saving.set(false);
          }
        });
      } else {
        this.customerService.createCustomer(this.formData).subscribe({
          next: () => {
            this.saving.set(false);
            this.toastService.success('Customer created successfully');
            this.router.navigate([returnPath]);
          },
          error: (error: any) => {
            console.error('Error creating Money Loan customer:', error);
            this.toastService.error('Failed to create customer: ' + (error.error?.message || error.message));
            this.saving.set(false);
          }
        });
      }
    }
  }

  goBack() {
    // Check if we're in tenant space or money-loan platform
    const currentUrl = this.router.url;
    if (currentUrl.includes('/tenant/customers')) {
      this.router.navigate(['/tenant/customers']);
    } else {
      this.router.navigate(['/platforms/money-loan/dashboard/customers/all']);
    }
  }
}
