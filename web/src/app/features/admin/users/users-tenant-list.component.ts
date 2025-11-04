import { Component, OnInit, signal, computed, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { UserService, User } from '../../../core/services/user.service';
import { ToastService } from '../../../core/services/toast.service';
import { RBACService } from '../../../core/services/rbac.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { ResetPasswordModalComponent } from '../../../shared/components/reset-password-modal/reset-password-modal.component';

interface Tenant {
  id: number;
  name: string;
  subdomain: string;
  status: string;
}

@Component({
  selector: 'app-users-tenant-list',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule, ResetPasswordModalComponent],
  template: `
    <div class="p-6 space-y-4">
      <!-- Header -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span class="text-xl">👥</span>
            Tenant Users
          </h1>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Manage all tenant users and customers
          </p>
        </div>
        <button
          *ngIf="canCreateUsers()"
          [routerLink]="'/admin/users/new'"
          [queryParams]="{type: 'tenant'}"
          class="inline-flex items-center gap-1.5 rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 shadow-sm transition"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Create User
        </button>
      </div>

      <!-- Navigation Tabs -->
      <div class="border-b border-gray-200 dark:border-gray-700">
        <nav class="flex gap-6">
          <a
            routerLink="/admin/users/tenants"
            routerLinkActive="border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
            class="flex items-center gap-2 px-1 pb-3 border-b-2 border-transparent text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
            Tenant Users
          </a>
          <a
            routerLink="/admin/users/system"
            routerLinkActive="border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
            class="flex items-center gap-2 px-1 pb-3 border-b-2 border-transparent text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            System Users
          </a>
          <a
            routerLink="/admin/users/admins"
            routerLinkActive="border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
            class="flex items-center gap-2 px-1 pb-3 border-b-2 border-transparent text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            Admin Users
          </a>
        </nav>
      </div>

      <!-- Quick Filters -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-3">
          <!-- Search -->
          <div class="md:col-span-1">
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (input)="applyFilters()"
              placeholder="Search users..."
              class="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            />
          </div>

          <!-- User Type Filter -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">User Type</label>
            <select
              [(ngModel)]="userTypeFilter"
              (change)="applyFilters()"
              class="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Types</option>
              <option value="employee">Tenant Employees</option>
              <option value="customer">Customers</option>
            </select>
          </div>

          <!-- Tenant Filter -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tenant</label>
            <select
              [(ngModel)]="tenantFilter"
              (change)="applyFilters()"
              class="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Tenants</option>
              <option *ngFor="let tenant of tenants()" [value]="tenant.id">{{ tenant.name }}</option>
            </select>
          </div>

          <!-- Status Filter -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              [(ngModel)]="statusFilter"
              (change)="applyFilters()"
              class="w-full px-3 py-2 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="deleted">Deleted</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Stats Cards - Clickable -->
      <div class="grid grid-cols-5 gap-3">
        <!-- All Users Card -->
        <button
          (click)="filterByCard('all')"
          [class]="selectedCard() === 'all'
            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-600 shadow-lg ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900 transform scale-105'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md'"
          class="rounded-lg border p-4 text-left transition-all duration-200 cursor-pointer"
        >
          <div class="flex items-center justify-between">
            <div>
              <p [class]="selectedCard() === 'all' ? 'text-blue-100' : 'text-xs text-gray-500 dark:text-gray-400'"
                 class="text-xs font-medium">
                Total Users
              </p>
              <p [class]="selectedCard() === 'all' ? 'text-white' : 'text-gray-900 dark:text-white'"
                 class="text-2xl font-bold">
                {{ totalCount() }}
              </p>
            </div>
            <div [class]="selectedCard() === 'all'
                   ? 'bg-white/20'
                   : 'bg-blue-100 dark:bg-blue-900/30'"
                 class="w-10 h-10 rounded-full flex items-center justify-center">
              <span class="text-xl">👥</span>
            </div>
          </div>
        </button>

        <!-- Employees Card -->
        <button
          (click)="filterByCard('employees')"
          [class]="selectedCard() === 'employees'
            ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white border-purple-600 shadow-lg ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-gray-900 transform scale-105'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md'"
          class="rounded-lg border p-4 text-left transition-all duration-200 cursor-pointer"
        >
          <div class="flex items-center justify-between">
            <div>
              <p [class]="selectedCard() === 'employees' ? 'text-purple-100' : 'text-xs text-gray-500 dark:text-gray-400'"
                 class="text-xs font-medium">
                Employees
              </p>
              <p [class]="selectedCard() === 'employees' ? 'text-white' : 'text-purple-600 dark:text-purple-400'"
                 class="text-2xl font-bold">
                {{ employeeCount() }}
              </p>
            </div>
            <div [class]="selectedCard() === 'employees'
                   ? 'bg-white/20'
                   : 'bg-purple-100 dark:bg-purple-900/30'"
                 class="w-10 h-10 rounded-full flex items-center justify-center">
              <span class="text-xl">👔</span>
            </div>
          </div>
        </button>

        <!-- Customers Card -->
        <button
          (click)="filterByCard('customers')"
          [class]="selectedCard() === 'customers'
            ? 'bg-gradient-to-br from-green-500 to-green-600 text-white border-green-600 shadow-lg ring-2 ring-green-500 ring-offset-2 dark:ring-offset-gray-900 transform scale-105'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-green-300 dark:hover:border-green-600 hover:shadow-md'"
          class="rounded-lg border p-4 text-left transition-all duration-200 cursor-pointer"
        >
          <div class="flex items-center justify-between">
            <div>
              <p [class]="selectedCard() === 'customers' ? 'text-green-100' : 'text-xs text-gray-500 dark:text-gray-400'"
                 class="text-xs font-medium">
                Customers
              </p>
              <p [class]="selectedCard() === 'customers' ? 'text-white' : 'text-green-600 dark:text-green-400'"
                 class="text-2xl font-bold">
                {{ customerCount() }}
              </p>
            </div>
            <div [class]="selectedCard() === 'customers'
                   ? 'bg-white/20'
                   : 'bg-green-100 dark:bg-green-900/30'"
                 class="w-10 h-10 rounded-full flex items-center justify-center">
              <span class="text-xl">🛒</span>
            </div>
          </div>
        </button>

        <!-- Active Card -->
        <button
          (click)="filterByCard('active')"
          [class]="selectedCard() === 'active'
            ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-emerald-600 shadow-lg ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-gray-900 transform scale-105'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-md'"
          class="rounded-lg border p-4 text-left transition-all duration-200 cursor-pointer"
        >
          <div class="flex items-center justify-between">
            <div>
              <p [class]="selectedCard() === 'active' ? 'text-emerald-100' : 'text-xs text-gray-500 dark:text-gray-400'"
                 class="text-xs font-medium">
                Active
              </p>
              <p [class]="selectedCard() === 'active' ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'"
                 class="text-2xl font-bold">
                {{ activeCount() }}
              </p>
            </div>
            <div [class]="selectedCard() === 'active'
                   ? 'bg-white/20'
                   : 'bg-emerald-100 dark:bg-emerald-900/30'"
                 class="w-10 h-10 rounded-full flex items-center justify-center">
              <span class="text-xl">✓</span>
            </div>
          </div>
        </button>

        <!-- Tenants Card (Non-clickable, informational) -->
        <div class="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400">
                Tenants
              </p>
              <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">
                {{ tenantsCount() }}
              </p>
            </div>
            <div class="w-10 h-10 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center">
              <span class="text-xl">🏢</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Active Filter Indicator -->
      <div *ngIf="selectedCard() !== 'all'" class="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2">
        <div class="flex items-center gap-2">
          <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
          </svg>
          <span class="text-sm font-medium text-blue-900 dark:text-blue-100">
            Showing:
            <span class="font-bold">
              {{ selectedCard() === 'employees' ? 'Employees Only' : '' }}
              {{ selectedCard() === 'customers' ? 'Customers Only' : '' }}
              {{ selectedCard() === 'active' ? 'Active Users Only' : '' }}
            </span>
          </span>
        </div>
        <button
          (click)="filterByCard('all')"
          class="text-xs font-medium text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-200 underline"
        >
          Clear Filter
        </button>
      </div>

      <!-- Users Table -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">User</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Tenant</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Type</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Roles</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Status</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Last Login</th>
                <th class="px-4 py-3 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              @if (loading()) {
                <tr>
                  <td colspan="7" class="px-4 py-8 text-center">
                    <div class="flex flex-col items-center justify-center">
                      <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mb-2"></div>
                      <p class="text-sm text-gray-500">Loading users...</p>
                    </div>
                  </td>
                </tr>
              } @else if (filteredUsers().length === 0) {
                <tr>
                  <td colspan="7" class="px-4 py-8 text-center text-gray-500">
                    No users found
                  </td>
                </tr>
              } @else {
                @for (user of paginatedUsers(); track user.id) {
                  <tr class="hover:bg-gray-50 dark:hover:bg-gray-700">
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                          <span class="text-sm font-medium text-blue-600 dark:text-blue-400">
                            {{ getInitials(user) }}
                          </span>
                        </div>
                        <div>
                          <div class="text-sm font-medium text-gray-900 dark:text-white">
                            {{ user.fullName || user.firstName || 'N/A' }}
                          </div>
                          <div class="text-xs text-gray-500 dark:text-gray-400">{{ user.email }}</div>
                        </div>
                      </div>
                    </td>
                    <td class="px-4 py-3">
                      <span class="text-sm text-gray-900 dark:text-white">
                        {{ user.tenant?.name || 'N/A' }}
                      </span>
                    </td>
                    <td class="px-4 py-3">
                      <span [class]="getUserTypeClass(user)">
                        {{ getUserTypeLabel(user) }}
                      </span>
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex flex-wrap gap-1">
                        @for (role of user.roles; track role.id) {
                          <span class="px-2 py-0.5 text-xs rounded bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300">
                            {{ role.name }}
                          </span>
                        }
                      </div>
                    </td>
                    <td class="px-4 py-3">
                      <span [class]="getStatusClass(user.status)">
                        {{ user.status | titlecase }}
                      </span>
                    </td>
                    <td class="px-4 py-3 text-sm text-gray-500 dark:text-gray-400">
                      {{ user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never' }}
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex items-center justify-center gap-1">
                        <button
                          [routerLink]="'/admin/users/' + user.id + '/profile'"
                          class="p-1.5 text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded hover:bg-purple-100 dark:hover:bg-purple-900/30"
                          title="View Profile"
                        >
                          <span>👁️</span>
                        </button>
                        <button
                          *ngIf="canUpdateUsers()"
                          [routerLink]="'/admin/users/' + user.id"
                          class="p-1.5 text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded hover:bg-blue-100 dark:hover:bg-blue-900/30"
                          title="Edit"
                        >
                          <span>✏️</span>
                        </button>
                        <button
                          *ngIf="canUpdateUsers()"
                          (click)="resetPassword(user)"
                          class="p-1.5 text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded hover:bg-purple-100 dark:hover:bg-purple-900/30"
                          title="Reset Password"
                        >
                          <span>🔑</span>
                        </button>
                        <button
                          *ngIf="canDeleteUsers()"
                          (click)="deleteUser(user)"
                          class="p-1.5 text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded hover:bg-red-100 dark:hover:bg-red-900/30"
                          title="Delete"
                        >
                          <span>🗑️</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination Footer -->
        <div class="bg-gray-50 dark:bg-gray-900 px-4 py-3 border-t border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <!-- Left: Showing info -->
            <div class="flex items-center gap-4">
              <div class="text-sm text-gray-700 dark:text-gray-300">
                Showing
                <span class="font-medium">{{ (currentPage() - 1) * pageSize() + 1 }}</span>
                to
                <span class="font-medium">{{ Math.min(currentPage() * pageSize(), filteredUsers().length) }}</span>
                of
                <span class="font-medium">{{ filteredUsers().length }}</span>
                results
              </div>

              <!-- Page size selector -->
              <div class="flex items-center gap-2">
                <label class="text-sm text-gray-700 dark:text-gray-300">Per page:</label>
                <select
                  [(ngModel)]="pageSize"
                  (ngModelChange)="onPageSizeChange($event)"
                  class="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white"
                >
                  <option [ngValue]="10">10</option>
                  <option [ngValue]="25">25</option>
                  <option [ngValue]="50">50</option>
                  <option [ngValue]="100">100</option>
                </select>
              </div>
            </div>

            <!-- Right: Pagination controls -->
            <div class="flex items-center gap-2">
              <button
                (click)="goToPage(1)"
                [disabled]="currentPage() === 1"
                class="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title="First page"
              >
                «
              </button>
              <button
                (click)="goToPage(currentPage() - 1)"
                [disabled]="currentPage() === 1"
                class="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Previous page"
              >
                ‹
              </button>

              <span class="text-sm text-gray-700 dark:text-gray-300">
                Page {{ currentPage() }} of {{ totalPages() || 1 }}
              </span>

              <button
                (click)="goToPage(currentPage() + 1)"
                [disabled]="currentPage() >= totalPages()"
                class="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Next page"
              >
                ›
              </button>
              <button
                (click)="goToPage(totalPages())"
                [disabled]="currentPage() >= totalPages()"
                class="px-2 py-1 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed"
                title="Last page"
              >
                »
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- Reset Password Modal -->
    <app-reset-password-modal #resetPasswordModal />
  `,
  styles: []
})
export class UsersTenantListComponent implements OnInit {
  @ViewChild('resetPasswordModal') resetPasswordModal!: ResetPasswordModalComponent;

  // Make Math available in template
  Math = Math;

  private userService = inject(UserService);
  private http = inject(HttpClient);
  private toastService = inject(ToastService);
  private router = inject(Router);
  private rbacService = inject(RBACService);
  private confirmationService = inject(ConfirmationService);

  users = signal<User[]>([]);
  tenants = signal<Tenant[]>([]);
  filteredUsers = signal<User[]>([]);
  loading = signal(true);

  searchQuery = '';
  userTypeFilter = '';
  tenantFilter = '';
  statusFilter = '';
  selectedCard = signal<'all' | 'employees' | 'customers' | 'active'>('all'); // Track selected card

  canCreateUsers = computed(() => this.rbacService.canAny(['users:create', 'tenant-users:invite']));
  canUpdateUsers = computed(() => this.rbacService.canAny(['users:update', 'tenant-users:update']));
  canDeleteUsers = computed(() => this.rbacService.canAny(['users:delete', 'tenant-users:delete']));

  // Computed stats - Based on ALL users, not filtered
  totalCount = computed(() => this.users().length);

  employeeCount = computed(() => {
    return this.users().filter(u => {
      const hasTenantRole = u.roles?.some(r => r.space === 'tenant');
      const hasCustomerRole = u.roles?.some(r => r.space === 'customer');
      return hasTenantRole && !hasCustomerRole;
    }).length;
  });

  customerCount = computed(() => {
    return this.users().filter(u => {
      return u.roles?.some(r => r.space === 'customer');
    }).length;
  });

  activeCount = computed(() => {
    return this.users().filter(u => u.status === 'active').length;
  });

  tenantsCount = computed(() => {
    // Count unique tenants from users
    const uniqueTenantIds = new Set(
      this.users()
        .map(u => u.tenantId)
        .filter(id => id !== null && id !== undefined)
    );
    return uniqueTenantIds.size;
  });

  // Pagination
  currentPage = signal(1);
  pageSize = signal(10);

  paginatedUsers = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredUsers().slice(start, end);
  });

  totalPages = computed(() => {
    return Math.ceil(this.filteredUsers().length / this.pageSize());
  });

  ngOnInit() {
    this.loadData();
  }

  async loadData() {
    this.loading.set(true);
    try {
      // Load users - only tenant users (exclude system admins)
      await this.userService.loadUsers(1, 1000, '');
      const allUsers = this.userService.usersSignal();
      const tenantUsers = allUsers.filter(u => u.tenantId !== null);
      this.users.set(tenantUsers);
      this.filteredUsers.set(tenantUsers);

      // Load tenants for filter using HTTP client
      const response: any = await this.http.get('/api/tenants').toPromise();
      this.tenants.set(response.tenants || []);
    } catch (error) {
      console.error('Error loading data:', error);
      this.toastService.show('error', 'Failed to load users');
    } finally {
      this.loading.set(false);
    }
  }

  applyFilters() {
    let filtered = this.users();

    // Search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(u =>
        u.email?.toLowerCase().includes(query) ||
        u.firstName?.toLowerCase().includes(query) ||
        u.lastName?.toLowerCase().includes(query) ||
        u.fullName?.toLowerCase().includes(query)
      );
    }

    // User type filter
    if (this.userTypeFilter) {
      if (this.userTypeFilter === 'employee') {
        filtered = filtered.filter(u => {
          const hasTenantRole = u.roles?.some(r => r.space === 'tenant');
          const hasCustomerRole = u.roles?.some(r => r.space === 'customer');
          return hasTenantRole && !hasCustomerRole;
        });
      } else if (this.userTypeFilter === 'customer') {
        filtered = filtered.filter(u => u.roles?.some(r => r.space === 'customer'));
      }
    }

    // Tenant filter
    if (this.tenantFilter) {
      filtered = filtered.filter(u => u.tenantId === this.tenantFilter);
    }

    // Status filter
    if (this.statusFilter) {
      filtered = filtered.filter(u => u.status === this.statusFilter);
    }

    this.filteredUsers.set(filtered);
    this.currentPage.set(1); // Reset to first page when filters change
  }

  filterByCard(cardType: 'all' | 'employees' | 'customers' | 'active') {
    // Set the selected card
    this.selectedCard.set(cardType);

    // Clear manual filters
    this.searchQuery = '';
    this.tenantFilter = '';
    this.statusFilter = '';

    // Apply the card-specific filter
    let filtered = this.users();

    switch (cardType) {
      case 'all':
        // Show all tenant users (no additional filtering)
        this.userTypeFilter = '';
        break;

      case 'employees':
        // Show only employees (tenant roles, not customer roles)
        this.userTypeFilter = 'employee';
        filtered = filtered.filter(u => {
          const hasTenantRole = u.roles?.some(r => r.space === 'tenant');
          const hasCustomerRole = u.roles?.some(r => r.space === 'customer');
          return hasTenantRole && !hasCustomerRole;
        });
        break;

      case 'customers':
        // Show only customers
        this.userTypeFilter = 'customer';
        filtered = filtered.filter(u => u.roles?.some(r => r.space === 'customer'));
        break;

      case 'active':
        // Show only active users
        this.userTypeFilter = '';
        filtered = filtered.filter(u => u.status === 'active');
        break;
    }

    this.filteredUsers.set(filtered);
    this.currentPage.set(1); // Reset to first page when card filter changes
  }

  // Pagination methods
  goToPage(page: number) {
    if (page >= 1 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }

  onPageSizeChange(newSize: number) {
    this.pageSize.set(newSize);
    this.currentPage.set(1); // Reset to first page when changing page size
  }

  getInitials(user: User): string {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    return user.email?.[0]?.toUpperCase() || '?';
  }

  getUserTypeLabel(user: User): string {
    const hasCustomerRole = user.roles?.some(r => r.space === 'customer');
    if (hasCustomerRole) return 'Customer';

    const hasTenantRole = user.roles?.some(r => r.space === 'tenant');
    if (hasTenantRole) return 'Employee';

    return 'Unknown';
  }

  getUserTypeClass(user: User): string {
    const hasCustomerRole = user.roles?.some(r => r.space === 'customer');
    if (hasCustomerRole) {
      return 'px-2 py-0.5 text-xs font-semibold rounded-full bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    }
    return 'px-2 py-0.5 text-xs font-semibold rounded-full bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300';
  }

  getStatusClass(status: string): string {
    const baseClass = 'px-2 py-0.5 text-xs font-semibold rounded-full';
    switch (status) {
      case 'active':
        return `${baseClass} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300`;
      case 'suspended':
        return `${baseClass} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300`;
      case 'deleted':
        return `${baseClass} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300`;
      default:
        return `${baseClass} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`;
    }
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  }

  resetPassword(user: User) {
    this.resetPasswordModal.open({
      userId: user.id,
      userName: user.fullName || `${user.firstName} ${user.lastName}`,
      userEmail: user.email
    });
  }

  async deleteUser(user: User) {
    const confirmed = await this.confirmationService.confirm({
      title: 'Delete User',
      message: `Are you sure you want to delete ${user.fullName || user.email}?`,
      confirmText: 'Delete',
      type: 'danger'
    });

    if (!confirmed) return;

    try {
      const success = await this.userService.deleteUser(user.id);
      if (success) {
        this.toastService.show('success', 'User deleted successfully');
        this.loadData();
      }
    } catch (error) {
      console.error('Error deleting user:', error);
      this.toastService.show('error', 'Failed to delete user');
    }
  }
}
