import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';

interface LoanProduct {
  id: number;
  name: string;
  minAmount: number;
  maxAmount: number;
  minTerm: number;
  maxTerm: number;
  interestRate: number;
}

interface ApplicationData {
  // Personal Information
  firstName: string;
  middleName: string;
  lastName: string;
  birthDate: string;
  civilStatus: string;
  gender: string;
  email: string;
  mobile: string;
  address: string;
  city: string;
  province: string;
  zipCode: string;

  // Employment Information
  employmentStatus: string;
  employerName: string;
  position: string;
  monthlyIncome: number;
  yearsEmployed: number;
  employerAddress: string;
  employerPhone: string;

  // Loan Details
  loanProductId: number;
  loanAmount: number;
  loanTerm: number;
  purpose: string;

  // Co-Borrower (Optional)
  hasCoBorrower: boolean;
  coBorrowerFirstName: string;
  coBorrowerLastName: string;
  coBorrowerRelationship: string;
  coBorrowerMobile: string;

  // Documents
  documents: File[];
}

@Component({
  selector: 'app-loan-application-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="min-h-screen bg-gray-50 dark:bg-gray-900 py-6 px-4">
      <div class="max-w-4xl mx-auto">
        <!-- Header -->
        <div class="text-center mb-6">
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-2">Loan Application</h1>
          <p class="text-sm text-gray-600 dark:text-gray-400">Complete the form below to apply for a loan</p>
        </div>

        <!-- Progress Steps -->
        <div class="mb-6">
          <div class="flex items-center justify-between">
            @for (step of steps; track step.id; let i = $index) {
              <div class="flex items-center" [class.flex-1]="i < steps.length - 1">
                <div class="flex items-center gap-2">
                  <div [class]="getStepClass(step.id)" class="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium transition-colors">
                    @if (step.id < currentStep()) {
                      <svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clip-rule="evenodd"/>
                      </svg>
                    } @else {
                      {{ step.id }}
                    }
                  </div>
                  <span [class]="step.id === currentStep() ? 'text-blue-600 dark:text-blue-400 font-medium' : 'text-gray-500 dark:text-gray-400'" class="text-xs hidden sm:inline">
                    {{ step.title }}
                  </span>
                </div>
                @if (i < steps.length - 1) {
                  <div class="flex-1 h-0.5 mx-2" [class.bg-blue-600]="step.id < currentStep()" [class.dark:bg-blue-400]="step.id < currentStep()" [class.bg-gray-300]="step.id >= currentStep()" [class.dark:bg-gray-700]="step.id >= currentStep()"></div>
                }
              </div>
            }
          </div>
        </div>

        <!-- Form Card -->
        <div class="rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-6 shadow-sm">
          <form (ngSubmit)="handleNext()">
            <!-- Step 1: Personal Information -->
            @if (currentStep() === 1) {
              <div class="space-y-4">
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Personal Information</h2>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">First Name *</label>
                    <input type="text" [(ngModel)]="formData.firstName" name="firstName" required
                      class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"/>
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Middle Name</label>
                    <input type="text" [(ngModel)]="formData.middleName" name="middleName"
                      class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"/>
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name *</label>
                    <input type="text" [(ngModel)]="formData.lastName" name="lastName" required
                      class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"/>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Birth Date *</label>
                    <input type="date" [(ngModel)]="formData.birthDate" name="birthDate" required
                      class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"/>
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Civil Status *</label>
                    <select [(ngModel)]="formData.civilStatus" name="civilStatus" required
                      class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500">
                      <option value="">Select</option>
                      <option value="single">Single</option>
                      <option value="married">Married</option>
                      <option value="widowed">Widowed</option>
                      <option value="separated">Separated</option>
                    </select>
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Gender *</label>
                    <select [(ngModel)]="formData.gender" name="gender" required
                      class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500">
                      <option value="">Select</option>
                      <option value="male">Male</option>
                      <option value="female">Female</option>
                    </select>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Email *</label>
                    <input type="email" [(ngModel)]="formData.email" name="email" required
                      class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"/>
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mobile Number *</label>
                    <input type="tel" [(ngModel)]="formData.mobile" name="mobile" required placeholder="09XX-XXX-XXXX"
                      class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"/>
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Complete Address *</label>
                  <input type="text" [(ngModel)]="formData.address" name="address" required placeholder="Street, Barangay"
                    class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"/>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">City *</label>
                    <input type="text" [(ngModel)]="formData.city" name="city" required
                      class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"/>
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Province *</label>
                    <input type="text" [(ngModel)]="formData.province" name="province" required
                      class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"/>
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Zip Code *</label>
                    <input type="text" [(ngModel)]="formData.zipCode" name="zipCode" required
                      class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"/>
                  </div>
                </div>
              </div>
            }

            <!-- Step 2: Employment Information -->
            @if (currentStep() === 2) {
              <div class="space-y-4">
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Employment Information</h2>

                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Employment Status *</label>
                  <select [(ngModel)]="formData.employmentStatus" name="employmentStatus" required
                    class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500">
                    <option value="">Select</option>
                    <option value="employed">Employed</option>
                    <option value="self_employed">Self-Employed</option>
                    <option value="business_owner">Business Owner</option>
                  </select>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Employer/Business Name *</label>
                    <input type="text" [(ngModel)]="formData.employerName" name="employerName" required
                      class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"/>
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Position/Occupation *</label>
                    <input type="text" [(ngModel)]="formData.position" name="position" required
                      class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"/>
                  </div>
                </div>

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Monthly Income (₱) *</label>
                    <input type="number" [(ngModel)]="formData.monthlyIncome" name="monthlyIncome" required min="0" step="1000"
                      class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"/>
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Years Employed *</label>
                    <input type="number" [(ngModel)]="formData.yearsEmployed" name="yearsEmployed" required min="0" step="0.5"
                      class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"/>
                  </div>
                </div>

                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Employer Address *</label>
                  <input type="text" [(ngModel)]="formData.employerAddress" name="employerAddress" required
                    class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"/>
                </div>

                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Employer Contact Number *</label>
                  <input type="tel" [(ngModel)]="formData.employerPhone" name="employerPhone" required
                    class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"/>
                </div>
              </div>
            }

            <!-- Step 3: Loan Details -->
            @if (currentStep() === 3) {
              <div class="space-y-4">
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Loan Details</h2>

                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Loan Product *</label>
                  <select [(ngModel)]="formData.loanProductId" name="loanProductId" required (change)="onProductChange()"
                    class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500">
                    <option value="">Select a loan product</option>
                    @for (product of loanProducts(); track product.id) {
                      <option [value]="product.id">{{ product.name }} ({{ product.interestRate }}% interest)</option>
                    }
                  </select>
                </div>

                @if (selectedProduct()) {
                  <div class="p-3 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                    <p class="text-xs text-blue-900 dark:text-blue-200">
                      <strong>Loan Range:</strong> ₱{{ formatNumber(selectedProduct()!.minAmount) }} - ₱{{ formatNumber(selectedProduct()!.maxAmount) }}<br>
                      <strong>Term Range:</strong> {{ selectedProduct()!.minTerm }} - {{ selectedProduct()!.maxTerm }} months<br>
                      <strong>Interest Rate:</strong> {{ selectedProduct()!.interestRate }}% per annum
                    </p>
                  </div>
                }

                <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Loan Amount (₱) *</label>
                    <input type="number" [(ngModel)]="formData.loanAmount" name="loanAmount" required min="5000" step="1000" (input)="calculateMonthlyPayment()"
                      class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"/>
                  </div>
                  <div>
                    <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Loan Term (months) *</label>
                    <input type="number" [(ngModel)]="formData.loanTerm" name="loanTerm" required min="3" max="60" (input)="calculateMonthlyPayment()"
                      class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"/>
                  </div>
                </div>

                @if (monthlyPayment() > 0) {
                  <div class="p-4 rounded bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800">
                    <div class="grid grid-cols-2 gap-4">
                      <div>
                        <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Estimated Monthly Payment</p>
                        <p class="text-2xl font-bold text-green-600 dark:text-green-400">₱{{ formatNumber(monthlyPayment()) }}</p>
                      </div>
                      <div>
                        <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Amount to Pay</p>
                        <p class="text-lg font-bold text-gray-900 dark:text-white">₱{{ formatNumber(totalAmount()) }}</p>
                      </div>
                    </div>
                  </div>
                }

                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Loan Purpose *</label>
                  <textarea [(ngModel)]="formData.purpose" name="purpose" required rows="3"
                    class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"
                    placeholder="Describe how you plan to use the loan"></textarea>
                </div>
              </div>
            }

            <!-- Step 4: Co-Borrower (Optional) -->
            @if (currentStep() === 4) {
              <div class="space-y-4">
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Co-Borrower Information (Optional)</h2>

                <div class="flex items-center gap-2 mb-4">
                  <input type="checkbox" [(ngModel)]="formData.hasCoBorrower" name="hasCoBorrower" id="hasCoBorrower"
                    class="w-4 h-4 rounded border-gray-300 dark:border-gray-600 text-blue-600 focus:ring-1 focus:ring-blue-500"/>
                  <label for="hasCoBorrower" class="text-sm text-gray-700 dark:text-gray-300">I have a co-borrower</label>
                </div>

                @if (formData.hasCoBorrower) {
                  <div class="space-y-4 p-4 border border-gray-200 dark:border-gray-700 rounded">
                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">First Name *</label>
                        <input type="text" [(ngModel)]="formData.coBorrowerFirstName" name="coBorrowerFirstName" [required]="formData.hasCoBorrower"
                          class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"/>
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Last Name *</label>
                        <input type="text" [(ngModel)]="formData.coBorrowerLastName" name="coBorrowerLastName" [required]="formData.hasCoBorrower"
                          class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"/>
                      </div>
                    </div>

                    <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                      <div>
                        <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Relationship *</label>
                        <select [(ngModel)]="formData.coBorrowerRelationship" name="coBorrowerRelationship" [required]="formData.hasCoBorrower"
                          class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500">
                          <option value="">Select</option>
                          <option value="spouse">Spouse</option>
                          <option value="parent">Parent</option>
                          <option value="sibling">Sibling</option>
                          <option value="child">Child</option>
                          <option value="relative">Relative</option>
                          <option value="friend">Friend</option>
                        </select>
                      </div>
                      <div>
                        <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Mobile Number *</label>
                        <input type="tel" [(ngModel)]="formData.coBorrowerMobile" name="coBorrowerMobile" [required]="formData.hasCoBorrower"
                          class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-1 focus:ring-blue-500"/>
                      </div>
                    </div>
                  </div>
                }

                @if (!formData.hasCoBorrower) {
                  <div class="p-4 rounded bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 text-center">
                    <p class="text-sm text-gray-600 dark:text-gray-400">No co-borrower information required. Click Next to continue.</p>
                  </div>
                }
              </div>
            }

            <!-- Step 5: Document Upload -->
            @if (currentStep() === 5) {
              <div class="space-y-4">
                <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Required Documents</h2>

                <div class="p-4 rounded bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800">
                  <p class="text-xs text-blue-900 dark:text-blue-200 mb-2"><strong>Please upload the following:</strong></p>
                  <ul class="text-xs text-blue-800 dark:text-blue-300 space-y-1 list-disc list-inside">
                    <li>Valid Government ID (front and back)</li>
                    <li>Proof of Income (Pay slip, ITR, or Bank Statement)</li>
                    <li>Certificate of Employment or Business Permit</li>
                    <li>Proof of Billing (Utility bill not older than 3 months)</li>
                  </ul>
                </div>

                <div class="border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg p-6 text-center">
                  <input type="file" #fileInput (change)="onFileSelect($event)" multiple accept="image/*,.pdf" class="hidden"/>
                  <button type="button" (click)="fileInput.click()"
                    class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium rounded bg-blue-600 text-white hover:bg-blue-700 transition">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"/>
                    </svg>
                    Upload Documents
                  </button>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-2">Accepted formats: JPG, PNG, PDF (Max 5MB per file)</p>
                </div>

                @if (uploadedFiles().length > 0) {
                  <div class="space-y-2">
                    <p class="text-xs font-medium text-gray-700 dark:text-gray-300">Uploaded Files ({{ uploadedFiles().length }})</p>
                    @for (file of uploadedFiles(); track $index) {
                      <div class="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-700 border border-gray-200 dark:border-gray-600">
                        <div class="flex items-center gap-2">
                          <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                          </svg>
                          <span class="text-xs text-gray-900 dark:text-white">{{ file.name }}</span>
                          <span class="text-xs text-gray-500 dark:text-gray-400">({{ formatFileSize(file.size) }})</span>
                        </div>
                        <button type="button" (click)="removeFile($index)"
                          class="text-red-600 dark:text-red-400 hover:text-red-700 dark:hover:text-red-300">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                        </button>
                      </div>
                    }
                  </div>
                }
              </div>
            }

            <!-- Navigation Buttons -->
            <div class="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
              <button type="button" (click)="handlePrevious()" [disabled]="currentStep() === 1"
                class="px-4 py-2 text-sm rounded border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition disabled:opacity-50 disabled:cursor-not-allowed">
                Previous
              </button>

              @if (currentStep() < totalSteps) {
                <button type="submit"
                  class="px-4 py-2 text-sm font-medium rounded bg-blue-600 text-white hover:bg-blue-700 transition">
                  Next
                </button>
              } @else {
                <button type="button" (click)="submitApplication()" [disabled]="submitting()"
                  class="px-4 py-2 text-sm font-medium rounded bg-green-600 text-white hover:bg-green-700 transition disabled:opacity-50">
                  {{ submitting() ? 'Submitting...' : 'Submit Application' }}
                </button>
              }
            </div>
          </form>
        </div>
      </div>
    </div>
  `,
  styles: []
})
export class LoanApplicationFormComponent implements OnInit {
  private router = inject(Router);

  currentStep = signal(1);
  totalSteps = 5;
  submitting = signal(false);
  loanProducts = signal<LoanProduct[]>([]);
  uploadedFiles = signal<File[]>([]);

  steps = [
    { id: 1, title: 'Personal Info' },
    { id: 2, title: 'Employment' },
    { id: 3, title: 'Loan Details' },
    { id: 4, title: 'Co-Borrower' },
    { id: 5, title: 'Documents' }
  ];

  formData: ApplicationData = {
    firstName: '',
    middleName: '',
    lastName: '',
    birthDate: '',
    civilStatus: '',
    gender: '',
    email: '',
    mobile: '',
    address: '',
    city: '',
    province: '',
    zipCode: '',
    employmentStatus: '',
    employerName: '',
    position: '',
    monthlyIncome: 0,
    yearsEmployed: 0,
    employerAddress: '',
    employerPhone: '',
    loanProductId: 0,
    loanAmount: 0,
    loanTerm: 12,
    purpose: '',
    hasCoBorrower: false,
    coBorrowerFirstName: '',
    coBorrowerLastName: '',
    coBorrowerRelationship: '',
    coBorrowerMobile: '',
    documents: []
  };

  selectedProduct = computed(() => {
    return this.loanProducts().find(p => p.id === this.formData.loanProductId);
  });

  monthlyPayment = computed(() => {
    const product = this.selectedProduct();
    if (!product || !this.formData.loanAmount || !this.formData.loanTerm) return 0;

    const principal = this.formData.loanAmount;
    const monthlyRate = product.interestRate / 100 / 12;
    const term = this.formData.loanTerm;

    const payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, term)) / (Math.pow(1 + monthlyRate, term) - 1);
    return Math.round(payment * 100) / 100;
  });

  totalAmount = computed(() => {
    return this.monthlyPayment() * this.formData.loanTerm;
  });

  ngOnInit() {
    this.loadLoanProducts();
  }

  loadLoanProducts() {
    // TODO: Replace with actual API call
    this.loanProducts.set([
      { id: 1, name: 'Personal Loan', minAmount: 5000, maxAmount: 100000, minTerm: 3, maxTerm: 24, interestRate: 12 },
      { id: 2, name: 'Business Loan', minAmount: 10000, maxAmount: 500000, minTerm: 6, maxTerm: 36, interestRate: 10 },
      { id: 3, name: 'Emergency Loan', minAmount: 3000, maxAmount: 50000, minTerm: 3, maxTerm: 12, interestRate: 15 }
    ]);
  }

  handleNext() {
    if (this.currentStep() < this.totalSteps) {
      this.currentStep.set(this.currentStep() + 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  handlePrevious() {
    if (this.currentStep() > 1) {
      this.currentStep.set(this.currentStep() - 1);
      window.scrollTo({ top: 0, behavior: 'smooth' });
    }
  }

  onProductChange() {
    this.formData.loanAmount = 0;
  }

  calculateMonthlyPayment() {
    // Triggers computed signal update
  }

  onFileSelect(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files) {
      const newFiles = Array.from(input.files);
      this.uploadedFiles.set([...this.uploadedFiles(), ...newFiles]);
      this.formData.documents = this.uploadedFiles();
    }
  }

  removeFile(index: number) {
    const files = this.uploadedFiles();
    files.splice(index, 1);
    this.uploadedFiles.set([...files]);
    this.formData.documents = this.uploadedFiles();
  }

  submitApplication() {
    this.submitting.set(true);

    // TODO: Replace with actual API call
    setTimeout(() => {
      alert('Application submitted successfully! You will receive a confirmation email shortly.');
      this.submitting.set(false);
      this.router.navigate(['/platforms/money-loan/customer/my-loans']);
    }, 2000);
  }

  getStepClass(stepId: number): string {
    const current = this.currentStep();
    if (stepId < current) {
      return 'bg-green-600 dark:bg-green-500 text-white';
    } else if (stepId === current) {
      return 'bg-blue-600 dark:bg-blue-500 text-white';
    } else {
      return 'bg-gray-200 dark:bg-gray-700 text-gray-600 dark:text-gray-400';
    }
  }

  formatNumber(value: number): string {
    return value.toLocaleString('en-PH', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
  }
}
