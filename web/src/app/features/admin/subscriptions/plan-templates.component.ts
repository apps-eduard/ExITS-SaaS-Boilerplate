import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { firstValueFrom } from 'rxjs';
import { ToastService } from '../../../core/services/toast.service';

interface PlanTemplate {
  id: number;
  name: string;
  description: string;
  price: number;
  billing_cycle: string;
  features: string[];
  max_users: number | null;
  max_storage_gb: number | null;
  status: string;
  created_at: string;
  updated_at: string;
  subscriber_count?: number; // Optional, from API
}

@Component({
  selector: 'app-plan-templates',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 sm:p-6 space-y-4">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Plan Templates</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Manage subscription plans offered to customers
          </p>
        </div>
        <button
          (click)="showCreateModal = true"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-600 text-white rounded hover:bg-primary-700 transition shadow-sm"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Create Plan
        </button>
      </div>

      <!-- Plans Grid -->
      @if (plans().length === 0) {
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <span class="text-5xl mb-4 block">📆</span>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">No plan templates</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
            Create your first subscription plan template
          </p>
          <button
            (click)="showCreateModal = true"
            class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-600 text-white rounded hover:bg-primary-700 transition"
          >
            <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Create First Plan
          </button>
        </div>
      } @else {
        <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          @for (plan of plans(); track plan.id) {
            <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden hover:shadow-lg transition">
              <!-- Plan Header -->
              <div class="p-4 border-b border-gray-200 dark:border-gray-700">
                <div class="flex items-start justify-between mb-2">
                  <div class="flex-1">
                    <h3 class="text-lg font-bold text-gray-900 dark:text-white">{{ plan.name }}</h3>
                    <p class="text-xs text-gray-600 dark:text-gray-400 mt-1">{{ plan.description }}</p>

                    <!-- Product Type Badge -->
                    <div class="mt-2">
                      @if (plan.productType === 'money_loan') {
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300 rounded">
                          💰 Money Loan
                        </span>
                      } @else if (plan.productType === 'bnpl') {
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-blue-100 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded">
                          🛍️ Buy Now Pay Later
                        </span>
                      } @else if (plan.productType === 'pawnshop') {
                        <span class="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-100 dark:bg-amber-900/20 text-amber-700 dark:text-amber-300 rounded">
                          💎 Pawnshop
                        </span>
                      }
                    </div>
                  </div>
                  <span
                    class="px-2 py-0.5 text-xs font-medium rounded-full"
                    [class]="plan.isActive ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300' : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300'"
                  >
                    {{ plan.isActive ? '✓ Active' : 'Inactive' }}
                  </span>
                </div>

                <div class="flex items-baseline gap-1 mt-3">
                  <span class="text-3xl font-bold text-gray-900 dark:text-white">{{ plan.currency }} {{ plan.price }}</span>
                  <span class="text-sm text-gray-500 dark:text-gray-400">/{{ plan.billingCycle }}</span>
                </div>

                @if (plan.trialDays > 0) {
                  <div class="mt-2 inline-flex items-center gap-1 px-2 py-0.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 text-xs font-medium rounded">
                    🎁 {{ plan.trialDays }} days free trial
                  </div>
                }
              </div>

              <!-- Features -->
              <div class="p-4">
                <h4 class="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 uppercase">Features</h4>
                <ul class="space-y-1.5">
                  @for (feature of plan.features; track $index) {
                    <li class="flex items-start gap-2 text-xs text-gray-600 dark:text-gray-400">
                      <svg class="w-3.5 h-3.5 text-green-500 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                      </svg>
                      {{ feature }}
                    </li>
                  }
                </ul>
              </div>

              <!-- Stats -->
              <div class="px-4 py-3 bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700">
                <div class="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                  <span>{{ plan.subscriber_count || 0 }} active subscribers</span>
                </div>
              </div>

              <!-- Actions -->
              <div class="p-3 border-t border-gray-200 dark:border-gray-700 flex items-center gap-2">
                <button
                  (click)="editPlan(plan)"
                  class="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded transition"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                  </svg>
                  Edit
                </button>
                <button
                  (click)="duplicatePlan(plan)"
                  class="flex-1 inline-flex items-center justify-center gap-1 px-3 py-1.5 text-xs font-medium text-purple-600 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 hover:bg-purple-100 dark:hover:bg-purple-900/30 rounded transition"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"/>
                  </svg>
                  Copy
                </button>
                <button
                  (click)="deletePlan(plan.id)"
                  class="inline-flex items-center justify-center gap-1 px-2 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded transition"
                >
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"/>
                  </svg>
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Create/Edit Modal -->
      @if (showCreateModal || showEditModal) {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50">
          <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <!-- Modal Header -->
            <div class="sticky top-0 bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-between">
              <h2 class="flex items-center gap-2 text-lg font-bold text-gray-900 dark:text-white">
                <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                {{ showCreateModal ? 'Create Plan Template' : 'Edit Plan Template' }}
              </h2>
              <button
                (click)="closeModal()"
                class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
              >
                <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <!-- Modal Body -->
            <div class="p-6 space-y-4">
              <!-- Plan Name -->
              <div>
                <label class="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                  </svg>
                  Plan Name *
                </label>
                <input
                  type="text"
                  [(ngModel)]="formData.name"
                  placeholder="e.g., Professional Plan"
                  autofocus
                  class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                />
              </div>

              <!-- Billing Cycle & Product Type -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                    </svg>
                    Billing Cycle *
                  </label>
                  <select
                    [(ngModel)]="formData.billingCycle"
                    class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="monthly">📅 Monthly</option>
                    <option value="quarterly">📆 Quarterly</option>
                    <option value="yearly">🗓️ Yearly</option>
                  </select>
                </div>

                <div>
                  <label class="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"/>
                    </svg>
                    Product Type
                  </label>
                  <select
                    [(ngModel)]="formData.productType"
                    class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="money_loan">💰 Money Loan</option>
                    <option value="bnpl">🛍️ Buy Now Pay Later (BNPL)</option>
                    <option value="pawnshop">💎 Pawnshop</option>
                  </select>
                </div>
              </div>

              <!-- Description -->
              <div>
                <label class="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h7"/>
                  </svg>
                  Description
                </label>
                <textarea
                  [(ngModel)]="formData.description"
                  rows="2"
                  placeholder="Brief description of the plan"
                  class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                ></textarea>
              </div>

              <!-- Pricing -->
              <div class="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label class="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                    Currency
                  </label>
                  <select
                    [(ngModel)]="formData.currency"
                    class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  >
                    <option value="PHP">🇵🇭 PHP (Philippines)</option>
                    <option value="USD">🇺🇸 USD</option>
                    <option value="EUR">🇪🇺 EUR</option>
                    <option value="GBP">🇬🇧 GBP</option>
                  </select>
                </div>

                <div>
                  <label class="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                    </svg>
                    Price *
                  </label>
                  <input
                    type="number"
                    [(ngModel)]="formData.price"
                    step="0.01"
                    min="0"
                    placeholder="0.00"
                    class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                </div>

                <div>
                  <label class="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v13m0-13V6a2 2 0 112 2h-2zm0 0V5.5A2.5 2.5 0 109.5 8H12zm-7 4h14M5 12a2 2 0 110-4h14a2 2 0 110 4M5 12v7a2 2 0 002 2h10a2 2 0 002-2v-7"/>
                    </svg>
                    Trial Days
                  </label>
                  <input
                    type="number"
                    [(ngModel)]="formData.trialDays"
                    min="0"
                    placeholder="0"
                    class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                </div>
              </div>

              <!-- Limits -->
              <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label class="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z"/>
                    </svg>
                    Max Users
                  </label>
                  <input
                    type="number"
                    [(ngModel)]="formData.maxUsers"
                    min="1"
                    placeholder="Unlimited"
                    class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Leave empty for unlimited</p>
                </div>

                <div>
                  <label class="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 7v10c0 2.21 3.582 4 8 4s8-1.79 8-4V7M4 7c0 2.21 3.582 4 8 4s8-1.79 8-4M4 7c0-2.21 3.582-4 8-4s8 1.79 8 4m0 5c0 2.21-3.582 4-8 4s-8-1.79-8-4"/>
                    </svg>
                    Max Storage (GB)
                  </label>
                  <input
                    type="number"
                    [(ngModel)]="formData.maxStorageGb"
                    min="1"
                    placeholder="Unlimited"
                    class="w-full rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                  />
                  <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">Leave empty for unlimited</p>
                </div>
              </div>

              <!-- Predefined Features Categories -->
              <div>
                <label class="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  🌟 Features
                </label>

                <div class="max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-700 rounded p-3 bg-gray-50 dark:bg-gray-900/50 space-y-3">
                  @for (category of getCategoryKeys(); track category) {
                    <div class="bg-white dark:bg-gray-800 rounded p-2.5 border border-gray-200 dark:border-gray-700">
                      <div class="flex items-center justify-between mb-2">
                        <div class="font-medium text-sm text-gray-900 dark:text-white">
                          {{ getCategory(category).label }}
                        </div>
                        @if (getCategory(category).mutuallyExclusive) {
                          <span class="text-xs px-2 py-0.5 bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 rounded-full">Choose One</span>
                        } @else {
                          <span class="text-xs px-2 py-0.5 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-full">Multiple</span>
                        }
                      </div>

                      <div class="space-y-1.5">
                        @if (getCategory(category).mutuallyExclusive) {
                          <!-- Add "None" option for radio buttons -->
                          <label class="flex items-center gap-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 p-1.5 rounded cursor-pointer">
                            <input
                              type="radio"
                              [name]="'category_' + category"
                              [value]="''"
                              [checked]="!isCategorySelected(category)"
                              (change)="clearRadioCategory(category)"
                              class="w-4 h-4 text-gray-400 border-gray-300 dark:border-gray-600 focus:ring-gray-400"
                            />
                            <span class="text-gray-500 dark:text-gray-400 italic">None</span>
                          </label>
                        }

                        @for (feature of getCategory(category).options; track feature) {
                          <label class="flex items-center gap-2 text-sm hover:bg-gray-50 dark:hover:bg-gray-700/50 p-1.5 rounded cursor-pointer">
                            @if (getCategory(category).mutuallyExclusive) {
                              <input
                                type="radio"
                                [name]="'category_' + category"
                                [value]="feature"
                                [checked]="formData.features.includes(feature)"
                                (change)="selectRadioFeature(category, feature)"
                                class="w-4 h-4 text-primary-600 border-gray-300 dark:border-gray-600 focus:ring-primary-500"
                              />
                            } @else {
                              <input
                                type="checkbox"
                                [checked]="formData.features.includes(feature)"
                                (change)="toggleCheckboxFeature(feature, $event)"
                                class="w-4 h-4 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
                              />
                            }
                            <span class="text-gray-700 dark:text-gray-300">{{ feature }}</span>
                          </label>
                        }
                      </div>
                    </div>
                  }
                </div>
              </div>

              <!-- Custom Features (Manual Add) -->
              <div>
                <label class="flex items-center gap-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                  </svg>
                  Custom Features (Optional)
                </label>
                <div class="space-y-2">
                  @for (feature of formData.features; track $index; let i = $index) {
                    @if (!getAllPredefinedFeatures().includes(feature) && feature.trim() !== '') {
                      <div class="flex items-center gap-2">
                        <input
                          type="text"
                          [(ngModel)]="formData.features[i]"
                          placeholder="Custom feature description"
                          class="flex-1 rounded border border-gray-300 bg-white px-2 py-1.5 text-xs text-gray-900 focus:border-blue-500 focus:outline-none dark:border-gray-600 dark:bg-gray-800 dark:text-white"
                        />
                        <button
                          (click)="removeFeature(i)"
                          class="p-1.5 text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                        >
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                          </svg>
                        </button>
                      </div>
                    }
                  }
                  <button
                    (click)="addFeature()"
                    class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium text-primary-600 dark:text-primary-400 bg-primary-50 dark:bg-primary-900/20 hover:bg-primary-100 dark:hover:bg-primary-900/30 rounded transition"
                  >
                    <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
                    </svg>
                    Add Custom Feature
                  </button>
                </div>
              </div>

              <!-- Plan Options -->
              <div class="space-y-2 border-t border-gray-200 dark:border-gray-700 pt-4">
                <div>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      [(ngModel)]="formData.isFeatured"
                      class="w-4 h-4 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
                    />
                    <div class="flex items-center gap-1.5">
                      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">⭐ Featured Plan</span>
                      <span class="text-xs text-gray-500 dark:text-gray-400">(Highlight as recommended)</span>
                    </div>
                  </label>
                </div>

                <div>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      [(ngModel)]="formData.customPricing"
                      class="w-4 h-4 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
                    />
                    <div class="flex items-center gap-1.5">
                      <span class="text-sm font-medium text-gray-700 dark:text-gray-300">💼 Custom Pricing</span>
                      <span class="text-xs text-gray-500 dark:text-gray-400">(Contact sales instead of price)</span>
                    </div>
                  </label>
                </div>

                <div>
                  <label class="flex items-center gap-2 cursor-pointer">
                    <input
                      type="checkbox"
                      [(ngModel)]="formData.isActive"
                      class="w-4 h-4 text-primary-600 border-gray-300 dark:border-gray-600 rounded focus:ring-primary-500"
                    />
                    <span class="text-sm font-medium text-gray-700 dark:text-gray-300">✅ Make this plan available to customers</span>
                  </label>
                </div>
              </div>
            </div>

            <!-- Modal Footer -->
            <div class="sticky bottom-0 bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700 px-6 py-4 flex items-center justify-end gap-3">
              <button
                (click)="closeModal()"
                type="button"
                class="rounded border border-gray-300 bg-white px-3 py-1.5 text-xs font-medium text-gray-700 hover:bg-gray-50 dark:border-gray-600 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition"
              >
                <svg class="w-4 h-4 inline-block mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
                Cancel
              </button>
              <button
                (click)="savePlan()"
                type="button"
                class="rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 transition shadow-sm"
              >
                <svg class="w-4 h-4 inline-block mr-1.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                </svg>
                {{ showCreateModal ? 'Create Plan' : 'Save Changes' }}
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class PlanTemplatesComponent implements OnInit {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);
  private apiUrl = '/api/subscriptions';

  // Using enriched plans with template-compatible properties
  plans = signal<(PlanTemplate & {
    currency: string;
    billingCycle: string;
    trialDays: number;
    isActive: boolean;
    productType: string;
  })[]>([]);

  loading = signal<boolean>(false);
  error = signal<string | null>(null);

  showCreateModal = false;
  showEditModal = false;
  editingPlanId: number | null = null;

  // Predefined feature templates organized by category
  featureCategories = {
    dashboard: {
      label: '📊 Dashboard',
      mutuallyExclusive: true,
      options: [
        '📊 Basic Dashboard',
        '📊 Advanced Dashboard',
        '📊 Custom Dashboard'
      ]
    },
    analytics: {
      label: '📈 Analytics',
      mutuallyExclusive: true,
      options: [
        '📈 Basic Analytics',
        '📈 Advanced Analytics'
      ]
    },
    reports: {
      label: '📊 Reports',
      mutuallyExclusive: true,
      options: [
        '📊 Basic Reports',
        '📊 Advanced Reports',
        '📊 Custom Reports'
      ]
    },
    emailSupport: {
      label: '📧 Email Support',
      mutuallyExclusive: true,
      options: [
        '📧 Email Support (48h SLA)',
        '📧 Priority Email Support (24h SLA)',
        '📧 Priority Email Support (12h SLA)',
        '📧 Priority Support (4h SLA)'
      ]
    },
    security: {
      label: '🔒 Security',
      mutuallyExclusive: true,
      options: [
        '🔒 Security – SSL',
        '🔒 Security – SSL + 2FA',
        '🔒 Security – SSL + SSO',
        '🔒 Security – SSO + 2FA',
        '🔒 Advanced Security (SSL, SSO, 2FA)'
      ]
    },
    backups: {
      label: '🔄 Backups',
      mutuallyExclusive: true,
      options: [
        '🔄 Daily Backups',
        '🔄 Hourly Backups',
        '🔄 Real-time Backups'
      ]
    },
    communication: {
      label: '💬 Communication & Support',
      mutuallyExclusive: false,
      options: [
        '💬 Chat Support',
        '📞 Phone Support',
        '🎯 Dedicated Account Manager'
      ]
    },
    branding: {
      label: '🎨 Branding',
      mutuallyExclusive: false,
      options: [
        '🎨 Custom Branding',
        '🎨 White-label Options'
      ]
    },
    dataExport: {
      label: '📤 Data Management',
      mutuallyExclusive: false,
      options: [
        '📤 Data Export'
      ]
    },
    additional: {
      label: '✨ Additional Features',
      mutuallyExclusive: false,
      options: [
        '💾 Storage (Up to 1TB)',
        '📱 Mobile Access',
        '🎓 Priority Training & Onboarding',
        '🔔 Notifications',
        '🔌 API Access',
        '📇 Custom Integrations',
        '📄 Custom SLAs'
      ]
    }
  };

  formData = {
    name: '',
    description: '',
    price: 0,
    currency: 'PHP', // Default to Philippine Peso
    billingCycle: 'monthly' as 'monthly' | 'quarterly' | 'yearly',
    trialDays: 0,
    maxUsers: null as number | null,
    maxStorageGb: null as number | null,
    isFeatured: false,
    customPricing: false,
    productType: 'money_loan' as string | null,
    features: [] as string[],
    isActive: true
  };

  ngOnInit() {
    this.loadPlans();
  }

  async loadPlans() {
    try {
      this.loading.set(true);
      this.error.set(null);

      console.log('🔄 Loading plans from API...');

      // Load subscription plans
      const response = await firstValueFrom(
        this.http.get<{ success: boolean; data: PlanTemplate[] }>(`${this.apiUrl}/plans`)
      );

      console.log('📡 Full API Response:', response);

      const plans = response.data || [];

      console.log('📊 Raw plans from API:', plans);
      console.log('📊 Product types:', plans.map((p: any) => ({ id: p.id, name: p.name, product_type: p.product_type })));
      console.log('📊 Subscriber counts:', plans.map((p: any) => ({ id: p.id, name: p.name, subscriber_count: p.subscriber_count, type: typeof p.subscriber_count })));

      // Enrich plans with template-compatible properties
      const enrichedPlans = plans.map((plan: any) => {
        console.log(`🔍 Processing plan ${plan.id}:`, {
          name: plan.name,
          raw_product_type: plan.product_type,
          typeof_product_type: typeof plan.product_type,
          is_null: plan.product_type === null,
          is_undefined: plan.product_type === undefined,
          is_empty_string: plan.product_type === '',
          will_become: plan.product_type
        });

        return {
          ...plan,
          subscriber_count: parseInt(plan.subscriber_count || '0', 10), // Keep original property name for template
          subscriberCount: parseInt(plan.subscriber_count || '0', 10),  // Also keep camelCase version
          // Parse features if it's a JSON string
          features: typeof plan.features === 'string'
            ? JSON.parse(plan.features)
            : (Array.isArray(plan.features) ? plan.features : []),
          // Add template-compatible properties
          currency: 'PHP',
          billingCycle: plan.billing_cycle,
          trialDays: plan.trial_days || 0,
          isActive: plan.status === 'active',
          // Product type is now always a string
          productType: plan.product_type
        };
      });

      console.log('✨ Enriched plans:', enrichedPlans.map((p: any) => ({ id: p.id, name: p.name, productType: p.productType, raw: p.product_type })));

      this.plans.set(enrichedPlans);
      console.log('✅ Plans set in signal');
    } catch (error: any) {
      console.error('❌ Error loading plans:', error);
      this.error.set(error.message || 'Failed to load plans');
    } finally {
      this.loading.set(false);
    }
  }

  editPlan(plan: PlanTemplate) {
    this.editingPlanId = plan.id;
    this.formData = {
      name: plan.name,
      description: plan.description,
      price: plan.price,
      currency: 'PHP',
      billingCycle: plan.billing_cycle as 'monthly' | 'quarterly' | 'yearly',
      trialDays: (plan as any).trial_days || 0,
      maxUsers: plan.max_users,
      maxStorageGb: plan.max_storage_gb,
      isFeatured: (plan as any).is_featured || false,
      customPricing: (plan as any).custom_pricing || false,
      productType: (plan as any).productType || 'money_loan',
      features: typeof plan.features === 'string' ? JSON.parse(plan.features) : (Array.isArray(plan.features) ? [...plan.features] : []),
      isActive: plan.status === 'active'
    };
    this.showEditModal = true;
  }

  async duplicatePlan(plan: PlanTemplate) {
    const newPlanData = {
      name: `${plan.name} (Copy)`,
      description: plan.description,
      price: plan.price,
      billing_cycle: plan.billing_cycle,
      features: [...plan.features],
      max_users: plan.max_users,
      max_storage_gb: plan.max_storage_gb,
      status: 'active'
    };

    try {
      await firstValueFrom(
        this.http.post(`${this.apiUrl}/plans`, newPlanData)
      );
      await this.loadPlans();
      this.toastService.success('Plan duplicated successfully');
    } catch (error: any) {
      console.error('Error duplicating plan:', error);
      this.toastService.error(error.error?.message || 'Failed to duplicate plan');
    }
  }

  async deletePlan(id: number) {
    const plan = this.plans().find(p => p.id === id);
    if (!plan) return;

    if (!confirm(`Are you sure you want to delete "${plan.name}"? This action cannot be undone.`)) {
      return;
    }

    try {
      await firstValueFrom(
        this.http.delete(`${this.apiUrl}/plans/${id}`)
      );
      await this.loadPlans();
      this.toastService.success('Plan deleted successfully');
    } catch (error: any) {
      console.error('Error deleting plan:', error);
      this.toastService.error(error.error?.message || 'Failed to delete plan');
    }
  }

  addFeature() {
    this.formData.features.push('');
  }

  removeFeature(index: number) {
    this.formData.features.splice(index, 1);
  }

  // Helper methods for feature categories
  getCategoryKeys(): string[] {
    if (!this.featureCategories) return [];
    return Object.keys(this.featureCategories);
  }

  getCategory(categoryKey: string) {
    if (!this.featureCategories) return { label: '', mutuallyExclusive: false, options: [] };
    return this.featureCategories[categoryKey as keyof typeof this.featureCategories];
  }

  getAllPredefinedFeatures(): string[] {
    const allFeatures: string[] = [];
    const keys = this.getCategoryKeys();
    for (const category of keys) {
      const cat = this.getCategory(category);
      if (cat && cat.options) {
        allFeatures.push(...cat.options);
      }
    }
    return allFeatures;
  }

  // Check if any feature from a category is selected
  isCategorySelected(categoryKey: string): boolean {
    const category = this.getCategory(categoryKey);
    if (!category || !category.options) return false;
    return category.options.some((opt: string) => this.formData.features.includes(opt));
  }

  // Radio button handler (mutually exclusive categories)
  selectRadioFeature(categoryKey: string, feature: string) {
    const category = this.getCategory(categoryKey);

    // Remove all features from this category first
    category.options.forEach((opt: string) => {
      const index = this.formData.features.indexOf(opt);
      if (index > -1) {
        this.formData.features.splice(index, 1);
      }
    });

    // Add the selected feature
    this.formData.features.push(feature);
  }

  // Clear all selections from a radio category
  clearRadioCategory(categoryKey: string) {
    const category = this.getCategory(categoryKey);

    // Remove all features from this category
    category.options.forEach((opt: string) => {
      const index = this.formData.features.indexOf(opt);
      if (index > -1) {
        this.formData.features.splice(index, 1);
      }
    });
  }

  // Checkbox handler (multiple selection)
  toggleCheckboxFeature(feature: string, event: any) {
    const isChecked = event.target.checked;

    if (isChecked) {
      if (!this.formData.features.includes(feature)) {
        this.formData.features.push(feature);
      }
    } else {
      const index = this.formData.features.indexOf(feature);
      if (index > -1) {
        this.formData.features.splice(index, 1);
      }
    }
  }

  // Keep original toggleFeature for compatibility
  toggleFeature(categoryKey: string, feature: string, event: any) {
    const category = this.getCategory(categoryKey);

    if (category.mutuallyExclusive) {
      // For radio-style categories
      this.selectRadioFeature(categoryKey, feature);
    } else {
      // For checkbox-style categories
      this.toggleCheckboxFeature(feature, event);
    }
  }

  async savePlan() {
    const features = this.formData.features.filter(f => f.trim() !== '');

    if (!this.formData.name || !this.formData.description) {
      this.toastService.warning('Please fill in all required fields');
      return;
    }

    const planData = {
      name: this.formData.name,
      description: this.formData.description,
      price: this.formData.price,
      billing_cycle: this.formData.billingCycle,
      features,
      max_users: this.formData.maxUsers,
      max_storage_gb: this.formData.maxStorageGb,
      trial_days: this.formData.trialDays,
      is_featured: this.formData.isFeatured,
      custom_pricing: this.formData.customPricing,
      product_type: this.formData.productType,
      status: this.formData.isActive ? 'active' : 'inactive'
    };

    try {
      if (this.showEditModal && this.editingPlanId) {
        // Update existing plan
        await firstValueFrom(
          this.http.put(`${this.apiUrl}/plans/${this.editingPlanId}`, planData)
        );
        this.toastService.success('Plan updated successfully');
      } else {
        // Create new plan
        await firstValueFrom(
          this.http.post(`${this.apiUrl}/plans`, planData)
        );
        this.toastService.success('Plan created successfully');
      }

      this.closeModal();
      await this.loadPlans();
    } catch (error: any) {
      console.error('Error saving plan:', error);
      this.toastService.error(error.error?.message || 'Failed to save plan');
    }
  }

  closeModal() {
    this.showCreateModal = false;
    this.showEditModal = false;
    this.editingPlanId = null;
    this.formData = {
      name: '',
      description: '',
      price: 0,
      currency: 'PHP',
      billingCycle: 'monthly',
      trialDays: 0,
      maxUsers: null,
      maxStorageGb: null,
      isFeatured: false,
      customPricing: false,
      productType: 'platform',
      features: [],
      isActive: true
    };
  }
}
