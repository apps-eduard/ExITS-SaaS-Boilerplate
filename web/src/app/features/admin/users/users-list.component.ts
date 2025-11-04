import { Component, OnInit, signal, computed, inject, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink, RouterLinkActive, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { UserService, User } from '../../../core/services/user.service';
import { RoleService } from '../../../core/services/role.service';
import { AuthService } from '../../../core/services/auth.service';
import { ConfirmationService } from '../../../core/services/confirmation.service';
import { RBACService } from '../../../core/services/rbac.service';
import { ResetPasswordModalComponent } from '../../../shared/components/reset-password-modal/reset-password-modal.component';

@Component({
  selector: 'app-users-list',
  standalone: true,
  imports: [CommonModule, RouterLink, RouterLinkActive, FormsModule, ResetPasswordModalComponent],
  template: `
    <div class="p-6 space-y-4">
      <!-- Header with Navigation Tabs -->
      <div class="flex items-center justify-between">
        <div>
          <h1 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span class="text-xl">👥</span>
            User Management
          </h1>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            {{ isTenantContext() ? 'Manage your tenant users' : 'Manage system and tenant users' }}
          </p>
        </div>
        <button
          *ngIf="canCreateUsers()"
          [routerLink]="isTenantContext() ? '/tenant/users/new' : '/admin/users/new'"
          class="inline-flex items-center gap-1.5 rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 shadow-sm transition"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
          </svg>
          Create User
        </button>
      </div>

      <!-- Navigation Tabs - Only show in system admin context -->
      <div *ngIf="!isTenantContext()" class="border-b border-gray-200 dark:border-gray-700">
        <nav class="flex gap-6">
          <a
            routerLink="/admin/users"
            routerLinkActive="border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
            [routerLinkActiveOptions]="{exact: true}"
            class="flex items-center gap-2 px-1 pb-3 border-b-2 border-transparent text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
            </svg>
            All Users
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
          <a
            routerLink="/admin/users/activity"
            routerLinkActive="border-blue-600 text-blue-600 dark:border-blue-400 dark:text-blue-400"
            class="flex items-center gap-2 px-1 pb-3 border-b-2 border-transparent text-sm font-medium text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200 transition"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
            User Activity
          </a>
        </nav>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-4 gap-3">
        <div class="group rounded-lg border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-4 dark:border-gray-700 dark:from-gray-800 dark:to-gray-900 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Total Users</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">
                {{ userService.userCountComputed() }}
              </p>
            </div>
            <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div class="group rounded-lg border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-4 dark:border-gray-700 dark:from-gray-800 dark:to-gray-900 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Active</p>
              <p class="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                {{ userService.activeUsersComputed().length }}
              </p>
            </div>
            <div class="w-10 h-10 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center">
              <svg class="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
          </div>
        </div>
        <div class="group rounded-lg border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-4 dark:border-gray-700 dark:from-gray-800 dark:to-gray-900 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Inactive</p>
              <p class="text-2xl font-bold text-gray-600 dark:text-gray-400 mt-1">
                {{ userService.inactiveUsersComputed().length }}
              </p>
            </div>
            <div class="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-700 flex items-center justify-center">
              <svg class="w-5 h-5 text-gray-600 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
              </svg>
            </div>
          </div>
        </div>
        <div class="group rounded-lg border border-gray-200 bg-gradient-to-br from-white to-gray-50 p-4 dark:border-gray-700 dark:from-gray-800 dark:to-gray-900 hover:shadow-md transition-shadow">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-600 dark:text-gray-400">Selected</p>
              <p class="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                {{ selectedUsers().size }}
              </p>
            </div>
            <div class="w-10 h-10 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
              <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters Card -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 mb-3">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-2">
          <!-- Search -->
          <div class="md:col-span-2">
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Search
            </label>
            <div class="relative">
              <span class="absolute left-2 top-1/2 -translate-y-1/2 text-gray-400">🔍</span>
              <input
                type="text"
                [(ngModel)]="searchQuery"
                (keyup.enter)="search()"
                placeholder="Search by email, name..."
                class="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <!-- Status Filter -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              [(ngModel)]="filterStatus"
              (change)="applyFilters()"
              class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
              <option value="deleted">Deleted</option>
            </select>
          </div>

          <!-- Type Filter -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Type
            </label>
            <select
              [(ngModel)]="filterType"
              (change)="applyFilters()"
              class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="">All</option>
              <option value="system">System Admin</option>
              <option value="tenant">Tenant User</option>
            </select>
          </div>

          <!-- Role Filter -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Role
            </label>
            <select
              [(ngModel)]="filterRole"
              (change)="applyFilters()"
              class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Roles</option>
              <option *ngFor="let role of uniqueRoles()" [value]="role.id">
                {{ role.name }}
              </option>
            </select>
          </div>
        </div>

        <!-- Action Buttons Row -->
        <div class="flex items-center justify-between mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div class="flex items-center gap-2">
            <button
              (click)="clearFilters()"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition"
            >
              <span class="w-3.5 h-3.5">🔄</span>
              Clear
            </button>
            <button
              (click)="exportSelected()"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition"
            >
              <span class="w-3.5 h-3.5">📥</span>
              Export CSV
            </button>
            <button
              (click)="exportPDF()"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600 transition"
            >
              <span class="w-3.5 h-3.5">📄</span>
              Export PDF
            </button>
          </div>
          <div class="flex items-center gap-2">
            <label class="text-xs text-gray-600 dark:text-gray-400">Show:</label>
            <select
              [(ngModel)]="pageSize"
              (ngModelChange)="onPageSizeChange()"
              class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
            >
              <option [value]="10">10</option>
              <option [value]="25">25</option>
              <option [value]="50">50</option>
              <option [value]="100">100</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Bulk Actions -->
      <div *ngIf="selectedUsers().size > 0" class="flex items-center gap-3 p-4 rounded-lg bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-900">
          <svg class="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
        <span class="text-sm font-medium text-blue-900 dark:text-blue-300">
          {{ selectedUsers().size }} user(s) selected
        </span>
        <div class="flex-1"></div>
        <button
          *ngIf="canDeleteUsers()"
          (click)="bulkDelete()"
          class="inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-xs font-medium text-red-700 bg-white hover:bg-red-50 dark:text-red-300 dark:bg-red-900/30 dark:hover:bg-red-900/50 transition shadow-sm"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
          Delete Selected
        </button>
      </div>      <!-- Loading State -->
      <div *ngIf="userService.loadingSignal()" class="text-center py-6">
        <p class="text-sm text-gray-500 dark:text-gray-400">Loading users...</p>
      </div>

      <!-- Error State -->
      <div *ngIf="userService.errorSignal()" class="rounded border border-yellow-200 bg-yellow-50 px-4 py-3 dark:border-yellow-900 dark:bg-yellow-900/20">
        <div class="flex items-start gap-3">
          <svg class="w-5 h-5 text-yellow-600 dark:text-yellow-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
          </svg>
          <div>
            <p class="text-sm font-medium text-yellow-800 dark:text-yellow-300 mb-1">Unable to load users</p>
            <p class="text-xs text-yellow-700 dark:text-yellow-400">{{ userService.errorSignal() }}</p>
            <button
              (click)="userService.loadUsers()"
              class="inline-flex items-center gap-1.5 mt-2 rounded bg-yellow-600 px-3 py-1 text-xs font-medium text-white hover:bg-yellow-700 transition"
            >
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Retry
            </button>
          </div>
        </div>
      </div>

      <!-- Users Table -->
      <div *ngIf="!userService.loadingSignal() && filteredUsers.length > 0" class="rounded border border-gray-200 bg-white dark:border-gray-700 dark:bg-gray-900 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider w-12">
                  <input
                    type="checkbox"
                    [checked]="selectAll()"
                    (change)="toggleSelectAll()"
                    class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <span class="inline-flex items-center gap-1">
                    <span class="w-3.5 h-3.5">👤</span>
                    User
                  </span>
                </th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <span class="inline-flex items-center gap-1">
                    <span class="w-3.5 h-3.5">📧</span>
                    Email
                  </span>
                </th>
                <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <span class="inline-flex items-center gap-1">
                    <span class="w-3.5 h-3.5">🏢</span>
                    Tenant
                  </span>
                </th>
                <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <span class="inline-flex items-center gap-1">
                    <span class="w-3.5 h-3.5">🎭</span>
                    Roles
                  </span>
                </th>
                <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <span class="inline-flex items-center gap-1">
                    <span class="w-3.5 h-3.5">🔘</span>
                    Status
                  </span>
                </th>
                <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <span class="inline-flex items-center gap-1">
                    <span class="w-3.5 h-3.5">🕐</span>
                    Last Login
                  </span>
                </th>
                <th class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-wider">
                  <span class="inline-flex items-center gap-1">
                    <span class="w-3.5 h-3.5">⚙️</span>
                    Actions
                  </span>
                </th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              <tr *ngFor="let user of filteredUsers" class="hover:bg-gray-50 dark:hover:bg-gray-800/50 transition">
                <td class="px-3 py-2 text-center">
                  <input
                    type="checkbox"
                    [checked]="isUserSelected(user.id)"
                    (change)="toggleUserSelection(user.id)"
                    class="w-4 h-4 text-blue-600 rounded focus:ring-blue-500"
                  />
                </td>
                <td class="px-3 py-2">
                  <div class="flex items-center gap-2">
                    <div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center">
                      <span class="text-sm font-medium text-blue-600 dark:text-blue-400">
                        {{ getInitials(user) }}
                      </span>
                    </div>
                    <div>
                      <div class="font-medium text-gray-900 dark:text-white">
                        {{ user.fullName || user.firstName || 'N/A' }}
                      </div>
                      <div class="text-xs text-gray-500 dark:text-gray-400">
                        ID: {{ user.id }}
                      </div>
                    </div>
                  </div>
                </td>
                <td class="px-3 py-2">
                  <div class="text-gray-900 dark:text-white">{{ user.email }}</div>
                </td>
                <td class="px-3 py-2 text-center">
                  <span *ngIf="!user.tenantId" class="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300">
                    System Admin
                  </span>
                  <span *ngIf="user.tenantId" class="inline-flex px-2.5 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300">
                    {{ user.tenant?.name || 'Tenant User' }}
                  </span>
                </td>
                <td class="px-3 py-2 text-center">
                  <div class="flex flex-wrap gap-1 justify-center">
                    <span *ngFor="let role of user.roles"
                          class="inline-flex px-2 py-0.5 rounded text-xs bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300">
                      {{ role.name }}
                    </span>
                    <span *ngIf="!user.roles || user.roles.length === 0" class="text-xs text-gray-400">
                      No roles
                    </span>
                  </div>
                </td>
                <td class="px-3 py-2 text-center">
                  <span [class]="'inline-flex px-2.5 py-1 rounded-full text-xs font-medium ' + getStatusClass(user.status)">
                    {{ user.status | titlecase }}
                  </span>
                </td>
                <td class="px-3 py-2 text-center">
                  <span class="text-xs text-gray-600 dark:text-gray-400">
                    {{ user.lastLoginAt ? formatDate(user.lastLoginAt) : 'Never' }}
                  </span>
                </td>
                <td class="px-3 py-2">
                  <div class="flex items-center justify-center gap-1">
                    <button
                      [routerLink]="(isTenantContext() ? '/tenant/users/' : '/admin/users/') + user.id + '/profile'"
                      class="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded shadow-sm hover:bg-purple-100 dark:hover:bg-purple-900/30 transition"
                      title="View Profile"
                    >
                      <span class="w-3.5 h-3.5">👁️</span>
                    </button>
                    <button
                      *ngIf="canUpdateUsers()"
                      [routerLink]="(isTenantContext() ? '/tenant/users/' : '/admin/users/') + user.id"
                      class="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded shadow-sm hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
                      title="Edit User"
                    >
                      <span class="w-3.5 h-3.5">✏️</span>
                    </button>
                    <button
                      *ngIf="canUpdateUsers()"
                      (click)="resetPassword(user)"
                      class="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded shadow-sm hover:bg-purple-100 dark:hover:bg-purple-900/30 transition"
                      title="Reset Password"
                    >
                      <span class="w-3.5 h-3.5">🔑</span>
                    </button>
                    <button
                      *ngIf="canUpdateUsers() && user.status !== 'deleted'"
                      (click)="toggleUserStatus(user)"
                      [class]="user.status === 'active'
                        ? 'inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 rounded shadow-sm hover:bg-orange-100 dark:hover:bg-orange-900/30 transition'
                        : 'inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded shadow-sm hover:bg-green-100 dark:hover:bg-green-900/30 transition'"
                      [title]="user.status === 'active' ? 'Suspend User' : 'Activate User'"
                    >
                      <span class="w-3.5 h-3.5">{{ user.status === 'active' ? '⏸️' : '▶️' }}</span>
                    </button>
                    <button
                      *ngIf="canDeleteUsers() && user.status !== 'deleted'"
                      (click)="deleteUser(user)"
                      class="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded shadow-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                      title="Delete User"
                    >
                      <span class="w-3.5 h-3.5">🗑️</span>
                    </button>
                  </div>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="flex items-center justify-between px-3 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
          <!-- Left side: Page size selector and info -->
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2">
              <label class="text-xs text-gray-600 dark:text-gray-400">Show:</label>
              <select
                [(ngModel)]="pageSize"
                (ngModelChange)="onPageSizeChange()"
                class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option [value]="10">10</option>
                <option [value]="25">25</option>
                <option [value]="50">50</option>
                <option [value]="100">100</option>
              </select>
            </div>
            <div class="text-xs text-gray-600 dark:text-gray-400">
              Showing {{ (userService.paginationSignal().page - 1) * userService.paginationSignal().limit + 1 }} to {{ Math.min(userService.paginationSignal().page * userService.paginationSignal().limit, userService.paginationSignal().total) }} of {{ userService.paginationSignal().total }}
            </div>
          </div>

          <!-- Right side: Page navigation -->
          <div class="flex items-center gap-2">
            <button
              (click)="previousPage()"
              [disabled]="userService.paginationSignal().page === 1"
              class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              <span class="w-3.5 h-3.5">←</span>
              Previous
            </button>

            <span class="text-xs text-gray-600 dark:text-gray-400">
              Page {{ userService.paginationSignal().page }} of {{ userService.paginationSignal().pages }}
            </span>

            <button
              (click)="nextPage()"
              [disabled]="userService.paginationSignal().page >= userService.paginationSignal().pages"
              class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
            >
              Next
              <span class="w-3.5 h-3.5">→</span>
            </button>
          </div>
        </div>
      </div>

      <!-- Empty State -->
      <div *ngIf="!userService.loadingSignal() && filteredUsers.length === 0" class="text-center py-12 rounded border border-gray-200 bg-gray-50 dark:border-gray-700 dark:bg-gray-900">
        <div class="max-w-sm mx-auto">
          <svg class="w-16 h-16 mx-auto text-gray-400 dark:text-gray-600 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="1.5" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />
          </svg>
          <p class="mb-2 text-sm font-medium text-gray-900 dark:text-white">No users found</p>
          <p class="mb-4 text-xs text-gray-500 dark:text-gray-400">
            {{ searchQuery ? 'Try a different search term' : 'Create your first user to get started' }}
          </p>
          <button
            *ngIf="!searchQuery && canCreateUsers()"
            routerLink="/admin/users/new"
            class="inline-flex items-center gap-1.5 rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white hover:bg-blue-700 shadow-sm transition"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
            </svg>
            Create User
          </button>
        </div>
      </div>
    </div>

    <!-- Reset Password Modal -->
    <app-reset-password-modal #resetPasswordModal />
  `,
  styles: []
})
export class UsersListComponent implements OnInit {
  @ViewChild('resetPasswordModal') resetPasswordModal!: ResetPasswordModalComponent;

  searchQuery = '';
  Math = Math;
  pageSize = 10; // Page size selector

  // Context detection
  isTenantContext = signal(false);
  private router = inject(Router);
  private rbacService = inject(RBACService);

  // Filters
  filterStatus = '';
  filterRole = '';
  filterType = ''; // 'system' or 'tenant'

  // Bulk operations
  selectedUsers = signal<Set<string>>(new Set());
  selectAll = signal(false);

  // Get unique roles (remove duplicates by both id and name)
  uniqueRoles = computed(() => {
    const roles = this.roleService.rolesSignal();
    const seenIds = new Set();
    const seenNames = new Set();
    const uniqueRoles: any[] = [];

    for (const role of roles) {
      // Skip if we've already seen this ID or name
      if (seenIds.has(role.id) || seenNames.has(role.name)) {
        continue;
      }

      seenIds.add(role.id);
      seenNames.add(role.name);
      uniqueRoles.push(role);
    }

    return uniqueRoles;
  });

  constructor(
    public userService: UserService,
    public roleService: RoleService,
    private authService: AuthService,
    private confirmationService: ConfirmationService
  ) {}

  // Permission check methods - adapt based on context
  canCreateUsers = computed(() => {
    if (this.isTenantContext()) {
      return this.rbacService.can('tenant-users:create');
    }
    return this.authService.hasPermission('users:create');
  });

  canUpdateUsers = computed(() => {
    if (this.isTenantContext()) {
      return this.rbacService.can('tenant-users:update');
    }
    return this.authService.hasPermission('users:update');
  });

  canDeleteUsers = computed(() => {
    if (this.isTenantContext()) {
      return this.rbacService.can('tenant-users:delete');
    }
    return this.authService.hasPermission('users:delete');
  });

  ngOnInit(): void {
    // Detect if we're in tenant context by checking the URL
    const url = this.router.url;
    this.isTenantContext.set(url.startsWith('/tenant/'));

    console.log('📋 UsersListComponent initialized - Tenant context:', this.isTenantContext());

    this.userService.loadUsers(1, this.pageSize);
    this.roleService.loadRoles(); // Load roles for user creation/editing
  }

  search(): void {
    this.userService.loadUsers(1, this.pageSize, this.searchQuery);
  }

  get filteredUsers() {
    let users = this.userService.usersSignal();

    // In tenant context, only show tenant users for the current tenant
    if (this.isTenantContext()) {
      const tenantId = this.authService.getTenantId();
      if (tenantId === null || tenantId === undefined) {
        users = [];
      } else {
        const tenantIdStr = String(tenantId);
        users = users.filter(u => u.tenantId !== null && u.tenantId !== undefined && String(u.tenantId) === tenantIdStr);
      }
    }

    // Filter by status
    if (this.filterStatus) {
      users = users.filter(u => u.status === this.filterStatus);
    } else {
      // By default, exclude deleted users (they will be shown in the Recycle Bin)
      users = users.filter(u => u.status !== 'deleted');
    }

    // Filter by type (system/tenant) - only in system admin context
    if (!this.isTenantContext() && this.filterType) {
      if (this.filterType === 'system') {
        users = users.filter(u => !u.tenantId);
      } else {
        users = users.filter(u => u.tenantId);
      }
    }

    // Filter by role
    if (this.filterRole) {
      // Convert both to strings for comparison since select values are strings
      users = users.filter(u => u.roles?.some(r => String(r.id) === String(this.filterRole)));
    }

    return users;
  }

  applyFilters(): void {
    // Trigger change detection by accessing the getter
    // The filteredUsers getter will automatically apply the filters
    console.log('🔍 Filters applied:', {
      status: this.filterStatus,
      type: this.filterType,
      role: this.filterRole,
      resultCount: this.filteredUsers.length
    });
  }

  clearFilters(): void {
    this.searchQuery = '';
    this.filterStatus = '';
    this.filterRole = '';
    this.filterType = '';
    this.userService.loadUsers();
  }

  // Bulk selection methods
  toggleUserSelection(userId: string): void {
    const selected = new Set(this.selectedUsers());
    if (selected.has(userId)) {
      selected.delete(userId);
    } else {
      selected.add(userId);
    }
    this.selectedUsers.set(selected);
    this.selectAll.set(selected.size === this.filteredUsers.length);
  }

  toggleSelectAll(): void {
    const newValue = !this.selectAll();
    this.selectAll.set(newValue);

    if (newValue) {
      const allIds = new Set(this.filteredUsers.map(u => u.id));
      this.selectedUsers.set(allIds);
    } else {
      this.selectedUsers.set(new Set());
    }
  }

  isUserSelected(userId: string): boolean {
    return this.selectedUsers().has(userId);
  }

  async bulkDelete(): Promise<void> {
    const count = this.selectedUsers().size;
    if (count === 0) return;

    const confirmed = confirm(
      `⚠️ Delete ${count} User${count > 1 ? 's' : ''}?\n\n` +
      `This will permanently remove ${count} user account${count > 1 ? 's' : ''}.\n` +
      `Are you sure you want to proceed?`
    );

    if (confirmed) {
      for (const userId of this.selectedUsers()) {
        await this.userService.deleteUser(userId);
      }
      this.selectedUsers.set(new Set());
      this.selectAll.set(false);
      this.userService.loadUsers();
    }
  }

  exportSelected(): void {
    const users = this.filteredUsers.filter(u => this.selectedUsers().has(u.id));

    if (users.length === 0) {
      alert('No users selected for export');
      return;
    }

    // Convert to CSV
    const headers = ['ID', 'Email', 'First Name', 'Last Name', 'Status', 'Type', 'Roles', 'Created At'];
    const rows = users.map(u => [
      u.id,
      u.email,
      u.firstName || '',
      u.lastName || '',
      u.status,
      u.tenantId ? 'Tenant' : 'System',
      u.roles?.map(r => r.name).join(';') || '',
      u.createdAt || ''
    ]);

    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    // Download file
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `users-export-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
    window.URL.revokeObjectURL(url);

    console.log(`✅ Exported ${users.length} users`);
  }

  exportPDF(): void {
    const users = this.filteredUsers.filter(u => this.selectedUsers().has(u.id));

    if (users.length === 0) {
      alert('No users selected for export');
      return;
    }

    // Create a simple HTML table for PDF generation
    let htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Users Export</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; font-size: 24px; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #4F46E5; color: white; padding: 10px; text-align: left; font-size: 12px; }
          td { padding: 8px; border-bottom: 1px solid #ddd; font-size: 11px; }
          tr:nth-child(even) { background-color: #f9fafb; }
          .footer { margin-top: 30px; font-size: 10px; color: #666; }
        </style>
      </head>
      <body>
        <h1>Users Export - ${new Date().toLocaleDateString()}</h1>
        <p>Total Users: ${users.length}</p>
        <table>
          <thead>
            <tr>
              <th>ID</th>
              <th>Email</th>
              <th>Name</th>
              <th>Status</th>
              <th>Type</th>
              <th>Roles</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            ${users.map(u => `
              <tr>
                <td>${u.id}</td>
                <td>${u.email}</td>
                <td>${u.firstName || ''} ${u.lastName || ''}</td>
                <td>${u.status}</td>
                <td>${u.tenantId ? 'Tenant' : 'System'}</td>
                <td>${u.roles?.map(r => r.name).join(', ') || 'N/A'}</td>
                <td>${u.createdAt ? new Date(u.createdAt).toLocaleDateString() : 'N/A'}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          <p>Generated on ${new Date().toLocaleString()}</p>
        </div>
      </body>
      </html>
    `;

    // Open in new window for printing to PDF
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(htmlContent);
      printWindow.document.close();
      printWindow.focus();

      // Trigger print dialog after content loads
      setTimeout(() => {
        printWindow.print();
      }, 250);
    }

    console.log(`✅ PDF export initiated for ${users.length} users`);
  }

  nextPage(): void {
    const nextPage = this.userService.paginationSignal().page + 1;
    if (nextPage <= this.userService.paginationSignal().pages) {
      this.userService.loadUsers(nextPage, this.pageSize, this.searchQuery);
    }
  }

  previousPage(): void {
    const prevPage = this.userService.paginationSignal().page - 1;
    if (prevPage >= 1) {
      this.userService.loadUsers(prevPage, this.pageSize, this.searchQuery);
    }
  }

  onPageSizeChange(): void {
    // Reset to page 1 when changing page size
    this.userService.loadUsers(1, this.pageSize, this.searchQuery);
  }

  getInitials(user: User): string {
    if (user.firstName && user.lastName) {
      return `${user.firstName[0]}${user.lastName[0]}`.toUpperCase();
    }
    if (user.fullName) {
      const parts = user.fullName.split(' ');
      if (parts.length >= 2) {
        return `${parts[0][0]}${parts[1][0]}`.toUpperCase();
      }
      return parts[0][0].toUpperCase();
    }
    return user.email[0].toUpperCase();
  }

  getStatusClass(status: string): string {
    switch (status) {
      case 'active':
        return 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-300';
      case 'inactive':
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
      case 'suspended':
        return 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300';
      default:
        return 'bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300';
    }
  }

  formatDate(date: string): string {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;

    return d.toLocaleDateString();
  }

  async toggleUserStatus(user: User): Promise<void> {
    const newStatus = user.status === 'active' ? 'suspended' : 'active';
    const action = newStatus === 'active' ? 'enable' : 'suspend';

    const confirmed = await this.confirmationService.confirm({
      title: `${action === 'enable' ? 'Enable' : 'Suspend'} User`,
      message: `Are you sure you want to ${action} ${user.email}? This will ${action} their account access.`,
      confirmText: action === 'enable' ? 'Enable' : 'Suspend',
      cancelText: 'Cancel',
      type: action === 'enable' ? 'success' : 'warning',
      icon: action === 'enable' ? 'check' : 'warning'
    });

    if (!confirmed) return;

    try {
      // Update user status via API
      await this.userService.updateUser(user.id, { status: newStatus });
      console.log(`✅ User ${user.email} ${action}ed successfully`);

      // Refresh the user list
      await this.userService.loadUsers();
    } catch (error) {
      console.error(`❌ Error ${action}ing user:`, error);
      await this.confirmationService.confirm({
        title: 'Error',
        message: `Failed to ${action} user. Please try again.`,
        confirmText: 'OK',
        type: 'danger',
        icon: 'error'
      });
    }
  }

  async deleteUser(user: User): Promise<void> {
    const confirmed = await this.confirmationService.confirm({
      title: 'Delete User',
      message: `Are you sure you want to delete ${user.email}? This action cannot be undone.`,
      confirmText: 'Delete',
      cancelText: 'Cancel',
      type: 'danger',
      icon: 'trash'
    });

    if (!confirmed) return;

    try {
      const success = await this.userService.deleteUser(user.id);
      if (success) {
        console.log(`✅ User deleted: ${user.email}`);
        // Reload the current page
        this.userService.loadUsers(
          this.userService.paginationSignal().page,
          20,
          this.searchQuery
        );
      }
    } catch (error) {
      console.error('❌ Error deleting user:', error);
      await this.confirmationService.confirm({
        title: 'Error',
        message: 'Failed to delete user. Please try again.',
        confirmText: 'OK',
        type: 'danger',
        icon: 'error'
      });
    }
  }

  resetPassword(user: User) {
    this.resetPasswordModal.open({
      userId: user.id,
      userName: user.fullName || `${user.firstName} ${user.lastName}`,
      userEmail: user.email
    });
  }
}
