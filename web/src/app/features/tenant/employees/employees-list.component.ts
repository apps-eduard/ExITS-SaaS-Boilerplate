import { Component, inject, OnInit, signal, ChangeDetectorRef, computed, ViewChild } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../core/services/toast.service';
import { ThemeService } from '../../../core/services/theme.service';
import { RBACService } from '../../../core/services/rbac.service';
import { ResetPasswordModalComponent } from '../../../shared/components/reset-password-modal/reset-password-modal.component';

interface Employee {
  id: number;
  userId?: number;  // camelCase from Knex
  tenantId: number;  // camelCase from Knex
  email: string;
  firstName: string;  // camelCase from Knex
  lastName: string;  // camelCase from Knex
  department?: string;
  position?: string;
  employmentType?: string;  // camelCase from Knex
  employmentStatus?: string;  // camelCase from Knex
  hireDate?: string;  // camelCase from Knex
  createdAt: string;  // camelCase from Knex
  updatedAt?: string;  // camelCase from Knex
  status: string;
  roles?: Array<{ id: number; name: string; space: string; description?: string }>;
  platforms?: string[]; // Array of platform types: ['money_loan', 'bnpl', 'pawnshop']
}

@Component({
  selector: 'app-employees-list',
  standalone: true,
  imports: [CommonModule, FormsModule, ResetPasswordModalComponent],
  template: `
    <div class="p-4">
      <!-- Header with Icon -->
      <div class="mb-4">
        <div class="flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xl">👤</span>
              <h1 class="text-lg font-bold text-gray-900 dark:text-white">
                All Employees
              </h1>
            </div>
            <p class="text-xs text-gray-600 dark:text-gray-400">
              Manage your employee accounts
            </p>
          </div>
          @if (canCreateEmployees()) {
            <button
              (click)="createEmployee()"
              class="inline-flex items-center gap-1.5 rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700"
            >
              <span class="w-3.5 h-3.5">➕</span>
              Add Employee
            </button>
          }
        </div>
      </div>

      <!-- Stats Cards - Clickable -->
      <div class="grid grid-cols-2 md:grid-cols-6 gap-3 mb-4">
        <!-- All Employees Card -->
        <button
          (click)="filterByCard('all')"
          [class]="selectedCard() === 'all'
            ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white border-blue-600 shadow-lg ring-2 ring-blue-500 ring-offset-2 dark:ring-offset-gray-900 transform scale-105'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-blue-300 dark:hover:border-blue-600 hover:shadow-md'"
          class="rounded-lg border p-3 text-left transition-all duration-200 cursor-pointer"
        >
          <div class="flex flex-col">
            <div class="flex items-center justify-between mb-1">
              <span class="text-lg">👥</span>
            </div>
            <p [class]="selectedCard() === 'all' ? 'text-blue-100' : 'text-xs text-gray-500 dark:text-gray-400'"
               class="text-xs font-medium">
              All Employees
            </p>
            <p [class]="selectedCard() === 'all' ? 'text-white' : 'text-gray-900 dark:text-white'"
               class="text-xl font-bold">
              {{ totalEmployeesCount() }}
            </p>
          </div>
        </button>

        <!-- Active Employees Card -->
        <button
          (click)="filterByCard('active')"
          [class]="selectedCard() === 'active'
            ? 'bg-gradient-to-br from-emerald-500 to-emerald-600 text-white border-emerald-600 shadow-lg ring-2 ring-emerald-500 ring-offset-2 dark:ring-offset-gray-900 transform scale-105'
            : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-emerald-300 dark:hover:border-emerald-600 hover:shadow-md'"
          class="rounded-lg border p-3 text-left transition-all duration-200 cursor-pointer"
        >
          <div class="flex flex-col">
            <div class="flex items-center justify-between mb-1">
              <span class="text-lg">✓</span>
            </div>
            <p [class]="selectedCard() === 'active' ? 'text-emerald-100' : 'text-xs text-gray-500 dark:text-gray-400'"
               class="text-xs font-medium">
              Active
            </p>
            <p [class]="selectedCard() === 'active' ? 'text-white' : 'text-emerald-600 dark:text-emerald-400'"
               class="text-xl font-bold">
              {{ activeEmployeesCount() }}
            </p>
          </div>
        </button>

        <!-- Money Loan Platform Card -->
        @if (hasMoneyLoanEnabled()) {
          <button
            (click)="filterByCard('money_loan')"
            [class]="selectedCard() === 'money_loan'
              ? 'bg-gradient-to-br from-purple-500 to-purple-600 text-white border-purple-600 shadow-lg ring-2 ring-purple-500 ring-offset-2 dark:ring-offset-gray-900 transform scale-105'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-purple-300 dark:hover:border-purple-600 hover:shadow-md'"
            class="rounded-lg border p-3 text-left transition-all duration-200 cursor-pointer"
          >
            <div class="flex flex-col">
              <div class="flex items-center justify-between mb-1">
                <span class="text-lg">💰</span>
              </div>
              <p [class]="selectedCard() === 'money_loan' ? 'text-purple-100' : 'text-xs text-gray-500 dark:text-gray-400'"
                 class="text-xs font-medium">
                Money Loan
              </p>
              <p [class]="selectedCard() === 'money_loan' ? 'text-white' : 'text-purple-600 dark:text-purple-400'"
                 class="text-xl font-bold">
                {{ moneyLoanEmployeesCount() }}
              </p>
            </div>
          </button>
        }

        <!-- BNPL Platform Card -->
        @if (hasBnplEnabled()) {
          <button
            (click)="filterByCard('bnpl')"
            [class]="selectedCard() === 'bnpl'
              ? 'bg-gradient-to-br from-indigo-500 to-indigo-600 text-white border-indigo-600 shadow-lg ring-2 ring-indigo-500 ring-offset-2 dark:ring-offset-gray-900 transform scale-105'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-indigo-300 dark:hover:border-indigo-600 hover:shadow-md'"
            class="rounded-lg border p-3 text-left transition-all duration-200 cursor-pointer"
          >
            <div class="flex flex-col">
              <div class="flex items-center justify-between mb-1">
                <span class="text-lg">🛒</span>
              </div>
              <p [class]="selectedCard() === 'bnpl' ? 'text-indigo-100' : 'text-xs text-gray-500 dark:text-gray-400'"
                 class="text-xs font-medium">
                BNPL
              </p>
              <p [class]="selectedCard() === 'bnpl' ? 'text-white' : 'text-indigo-600 dark:text-indigo-400'"
                 class="text-xl font-bold">
                {{ bnplEmployeesCount() }}
              </p>
            </div>
          </button>
        }

        <!-- Pawnshop Platform Card -->
        @if (hasPawnshopEnabled()) {
          <button
            (click)="filterByCard('pawnshop')"
            [class]="selectedCard() === 'pawnshop'
              ? 'bg-gradient-to-br from-amber-500 to-amber-600 text-white border-amber-600 shadow-lg ring-2 ring-amber-500 ring-offset-2 dark:ring-offset-gray-900 transform scale-105'
              : 'bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700 hover:border-amber-300 dark:hover:border-amber-600 hover:shadow-md'"
            class="rounded-lg border p-3 text-left transition-all duration-200 cursor-pointer"
          >
            <div class="flex flex-col">
              <div class="flex items-center justify-between mb-1">
                <span class="text-lg">💎</span>
              </div>
              <p [class]="selectedCard() === 'pawnshop' ? 'text-amber-100' : 'text-xs text-gray-500 dark:text-gray-400'"
                 class="text-xs font-medium">
                Pawnshop
              </p>
              <p [class]="selectedCard() === 'pawnshop' ? 'text-white' : 'text-amber-600 dark:text-amber-400'"
                 class="text-xl font-bold">
                {{ pawnshopEmployeesCount() }}
              </p>
            </div>
          </button>
        }
      </div>

      <!-- Active Filter Indicator -->
      @if (selectedCard() !== 'all') {
        <div class="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg px-4 py-2 mb-3">
          <div class="flex items-center gap-2">
            <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z"/>
            </svg>
            <span class="text-sm font-medium text-blue-900 dark:text-blue-100">
              Showing:
              <span class="font-bold">
                @if (selectedCard() === 'active') { Active Employees Only }
                @if (selectedCard() === 'money_loan') { Money Loan Platform Access }
                @if (selectedCard() === 'bnpl') { BNPL Platform Access }
                @if (selectedCard() === 'pawnshop') { Pawnshop Platform Access }
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
      }

      <!-- Filters Card -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-3 mb-3">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-2">
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
                (input)="onSearch()"
                placeholder="Search by name, email, or department..."
                class="w-full pl-7 pr-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-400 focus:border-blue-500 focus:outline-none"
              />
            </div>
          </div>

          <!-- Department Filter -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Department
            </label>
            <select
              [(ngModel)]="departmentFilter"
              (change)="onFilterChange()"
              class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Departments</option>
              <option value="IT">IT</option>
              <option value="HR">HR</option>
              <option value="Finance">Finance</option>
              <option value="Operations">Operations</option>
              <option value="Sales">Sales</option>
            </select>
          </div>

          <!-- Status Filter -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              Status
            </label>
            <select
              [(ngModel)]="statusFilter"
              (change)="onFilterChange()"
              class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="on_leave">On Leave</option>
              <option value="terminated">Terminated</option>
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

            @if (getSelectedCount() > 0) {
              <div class="flex items-center gap-2">
                <span class="text-xs text-blue-600 dark:text-blue-400 font-medium">
                  {{ getSelectedCount() }} selected
                </span>
                <button
                  (click)="clearSelection()"
                  class="text-xs text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-300"
                >
                  Clear
                </button>
              </div>
            }

            <select
              [(ngModel)]="pageSize"
              (change)="onPageSizeChange()"
              class="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
            >
              <option [value]="10">10 per page</option>
              <option [value]="25">25 per page</option>
              <option [value]="50">50 per page</option>
              <option [value]="100">100 per page</option>
            </select>
          </div>

          <div class="flex items-center gap-2">
            @if (getSelectedCount() > 0) {
              <button
                (click)="exportSelected()"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded shadow-sm hover:bg-green-100 dark:hover:bg-green-900/30 transition"
              >
                <span class="w-3.5 h-3.5">📥</span>
                Export Selected
              </button>
            }

            <button
              (click)="exportAll()"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded shadow-sm hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
            >
              <span class="w-3.5 h-3.5">📊</span>
              Export All
            </button>

            @if (canCreateEmployees()) {
              <button
                (click)="createEmployee()"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded shadow-sm hover:bg-blue-700 transition"
              >
                <span class="w-3.5 h-3.5">➕</span>
                Add Employee
              </button>
            }

            <span class="text-xs text-gray-600 dark:text-gray-400">
              Showing {{ paginatedEmployees().length }} of {{ filteredEmployees().length }}
            </span>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="flex items-center justify-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div class="text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p class="text-xs text-gray-600 dark:text-gray-400">Loading employees...</p>
          </div>
        </div>
      }

      <!-- Employees Table -->
      @if (!loading() && paginatedEmployees().length > 0) {
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
          <div class="overflow-x-auto">
            <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
              <thead class="bg-gray-50 dark:bg-gray-700">
                <tr>
                  <th class="px-3 py-2 text-left">
                    <input
                      type="checkbox"
                      [checked]="selectAll"
                      (change)="toggleSelectAll()"
                      class="w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                    />
                  </th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <div class="flex items-center gap-1">
                      <span class="w-3.5 h-3.5">👤</span>
                      Employee
                    </div>
                  </th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <div class="flex items-center gap-1">
                      <span class="w-3.5 h-3.5">📧</span>
                      Contact
                    </div>
                  </th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <div class="flex items-center gap-1">
                      <span class="w-3.5 h-3.5">🏢</span>
                      Department
                    </div>
                  </th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <div class="flex items-center gap-1">
                      <span class="w-3.5 h-3.5">🔑</span>
                      Role
                    </div>
                  </th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <div class="flex items-center gap-1">
                      <span class="w-3.5 h-3.5">🎯</span>
                      Platform Access
                    </div>
                  </th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <div class="flex items-center gap-1">
                      <span class="w-3.5 h-3.5">�</span>
                      Position
                    </div>
                  </th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <div class="flex items-center gap-1">
                      <span class="w-3.5 h-3.5">📅</span>
                      Type
                    </div>
                  </th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <div class="flex items-center gap-1">
                      <span class="w-3.5 h-3.5">🔘</span>
                      Status
                    </div>
                  </th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <div class="flex items-center gap-1">
                      <span class="w-3.5 h-3.5">⚙️</span>
                      Actions
                    </div>
                  </th>
                </tr>
              </thead>
              <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                @for (employee of paginatedEmployees(); track employee.id) {
                  <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <td class="px-3 py-2 whitespace-nowrap">
                      <input
                        type="checkbox"
                        [checked]="isSelected(employee.id)"
                        (change)="toggleEmployee(employee.id)"
                        class="w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="flex-shrink-0 h-8 w-8">
                          <div class="h-8 w-8 rounded-full bg-gradient-to-br from-purple-500 to-blue-600 flex items-center justify-center">
                            <span class="text-white font-medium text-xs">
                              {{ getInitials(employee.firstName, employee.lastName) }}
                            </span>
                          </div>
                        </div>
                        <div class="ml-2">
                          <div class="text-xs font-medium text-gray-900 dark:text-white">
                            {{ employee.firstName }} {{ employee.lastName }}
                          </div>
                          <div class="text-xs text-gray-500 dark:text-gray-400">
                            Hired: {{ employee.hireDate ? formatDate(employee.hireDate) : 'N/A' }}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap">
                      <div class="text-xs text-gray-900 dark:text-white">{{ employee.email }}</div>
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap">
                      <span class="px-2 py-0.5 text-xs font-semibold rounded bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300">
                        {{ employee.department || 'N/A' }}
                      </span>
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap">
                      <div class="flex flex-wrap gap-1">
                        @if (employee.roles && employee.roles.length > 0) {
                          @for (role of employee.roles; track role.id) {
                            <span class="px-2 py-0.5 text-xs font-semibold rounded bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300">
                              {{ role.name }}
                            </span>
                          }
                        } @else {
                          <span class="px-2 py-0.5 text-xs text-gray-400">No Role</span>
                        }
                      </div>
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap">
                      <div class="flex flex-wrap gap-1">
                        @if (employee.platforms && employee.platforms.length > 0) {
                          @for (platform of employee.platforms; track platform) {
                            <span class="px-2 py-0.5 text-xs font-semibold rounded bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300">
                              {{ getPlatformLabel(platform) }}
                            </span>
                          }
                        } @else {
                          <span class="px-2 py-0.5 text-xs text-gray-400">No Access</span>
                        }
                      </div>
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap">
                      <div class="text-xs text-gray-900 dark:text-white">
                        {{ employee.position || 'N/A' }}
                      </div>
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap">
                      <span [class]="getEmploymentTypeClass(employee.employmentType || '')">
                        {{ employee.employmentType || 'N/A' }}
                      </span>
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap">
                      <span [class]="getStatusClass(employee.employmentStatus || '')">
                        {{ employee.employmentStatus || 'N/A' }}
                      </span>
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap">
                      <div class="flex items-center gap-1">
                        <button
                          (click)="viewEmployee(employee.id)"
                          class="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded shadow-sm hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
                          title="View Details"
                        >
                          <span class="w-3.5 h-3.5">👁️</span>
                        </button>
                        <button
                          (click)="editEmployee(employee.id)"
                          class="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded shadow-sm hover:bg-green-100 dark:hover:bg-green-900/30 transition"
                          title="Edit Employee"
                        >
                          <span class="w-3.5 h-3.5">✏️</span>
                        </button>
                        <button
                          (click)="resetPassword(employee)"
                          class="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-purple-700 dark:text-purple-400 bg-purple-50 dark:bg-purple-900/20 rounded shadow-sm hover:bg-purple-100 dark:hover:bg-purple-900/30 transition"
                          title="Reset Password"
                        >
                          <span class="w-3.5 h-3.5">🔑</span>
                        </button>
                        <button
                          (click)="suspendEmployee(employee.id)"
                          class="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 rounded shadow-sm hover:bg-orange-100 dark:hover:bg-orange-900/30 transition"
                          title="Suspend Employee"
                        >
                          <span class="w-3.5 h-3.5">⏸️</span>
                        </button>
                        <button
                          (click)="deleteEmployee(employee.id)"
                          class="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded shadow-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                          title="Delete Employee"
                        >
                          <span class="w-3.5 h-3.5">🗑️</span>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              </tbody>
            </table>
          </div>

          <!-- Pagination -->
          @if (totalPages() > 1) {
            <div class="px-3 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex items-center justify-between">
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
                  Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ currentPage * pageSize > filteredEmployees().length ? filteredEmployees().length : currentPage * pageSize }} of {{ filteredEmployees().length }}
                </div>
              </div>

              <!-- Right side: Page navigation -->
              <div class="flex items-center gap-2">
                <button
                  (click)="previousPage()"
                  [disabled]="currentPage === 1"
                  class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  <span class="w-3.5 h-3.5">←</span>
                  Previous
                </button>

                <span class="text-xs text-gray-600 dark:text-gray-400">
                  Page {{ currentPage }} of {{ totalPages() }}
                </span>

                <button
                  (click)="nextPage()"
                  [disabled]="currentPage >= totalPages()"
                  class="inline-flex items-center gap-1 px-3 py-1.5 text-xs font-medium rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
                >
                  Next
                  <span class="w-3.5 h-3.5">→</span>
                </button>
              </div>
            </div>
          }
        </div>
      }

      <!-- Empty State -->
      @if (!loading() && paginatedEmployees().length === 0) {
        <div class="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <span class="text-4xl mb-3 block">👤</span>
          <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-1">No employees found</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
            {{ searchQuery || departmentFilter || statusFilter ? 'Try adjusting your filters' : 'Get started by adding your first employee' }}
          </p>
          @if (searchQuery || departmentFilter || statusFilter) {
            <button
              (click)="clearFilters()"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded shadow-sm hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <span class="w-3.5 h-3.5">🔄</span>
              Clear Filters
            </button>
          } @else if (canCreateEmployees()) {
            <button
              (click)="createEmployee()"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded shadow-sm hover:bg-blue-700 transition"
            >
              <span class="w-3.5 h-3.5">➕</span>
              Add Employee
            </button>
          }
        </div>
      }
    </div>

    <!-- Reset Password Modal -->
    <app-reset-password-modal #resetPasswordModal />
  `,
  styles: []
})
export class EmployeesListComponent implements OnInit {
  @ViewChild('resetPasswordModal') resetPasswordModal!: ResetPasswordModalComponent;

  private http = inject(HttpClient);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private cdr = inject(ChangeDetectorRef);
  themeService = inject(ThemeService);
  private rbacService = inject(RBACService);

  employees = signal<Employee[]>([]);
  filteredEmployees = signal<Employee[]>([]);
  paginatedEmployees = signal<Employee[]>([]);
  loading = signal(true);
  selectedCard = signal<'all' | 'active' | 'money_loan' | 'bnpl' | 'pawnshop'>('all');

  // Platform enabled flags (will be loaded from tenant config)
  platformsEnabled = signal<{
    money_loan: boolean;
    bnpl: boolean;
    pawnshop: boolean;
  }>({
    money_loan: false,
    bnpl: false,
    pawnshop: false
  });

  searchQuery = '';
  departmentFilter = '';
  statusFilter = '';
  pageSize = 25;
  currentPage = 1;
  totalPages = signal(1);

  canCreateEmployees = computed(() =>
    this.rbacService.canAny(['tenant-users:create', 'tenant-users:invite'])
  );

  // Stats computed properties - based on ALL employees, not filtered
  totalEmployeesCount = computed(() => this.employees().length);

  activeEmployeesCount = computed(() =>
    this.employees().filter(e => e.status === 'active').length
  );

  moneyLoanEmployeesCount = computed(() =>
    this.employees().filter(e => e.platforms?.includes('money_loan')).length
  );

  bnplEmployeesCount = computed(() =>
    this.employees().filter(e => e.platforms?.includes('bnpl')).length
  );

  pawnshopEmployeesCount = computed(() =>
    this.employees().filter(e => e.platforms?.includes('pawnshop')).length
  );

  // Platform enabled checks
  hasMoneyLoanEnabled = computed(() => this.platformsEnabled().money_loan);
  hasBnplEnabled = computed(() => this.platformsEnabled().bnpl);
  hasPawnshopEnabled = computed(() => this.platformsEnabled().pawnshop);

  // Selection state
  selectedEmployees = new Set<number>();
  selectAll = false;

  ngOnInit() {
    this.loadPlatformConfig();
    this.loadEmployees();
  }

  loadPlatformConfig() {
    // Load platform configuration from API
    this.http.get<any>('/api/tenant/platform-config').subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.platformsEnabled.set({
            money_loan: response.data.moneyLoanEnabled || false,
            bnpl: response.data.bnplEnabled || false,
            pawnshop: response.data.pawnshopEnabled || false
          });
        }
      },
      error: (error) => {
        console.error('Failed to load platform config:', error);
        // Default to all enabled if config fails
        this.platformsEnabled.set({
          money_loan: true,
          bnpl: true,
          pawnshop: true
        });
      }
    });
  }

  filterByCard(cardType: 'all' | 'active' | 'money_loan' | 'bnpl' | 'pawnshop') {
    this.selectedCard.set(cardType);

    // Clear other filters
    this.searchQuery = '';
    this.departmentFilter = '';
    this.statusFilter = '';

    let filtered = this.employees();

    switch (cardType) {
      case 'all':
        // Show all employees
        break;
      case 'active':
        filtered = filtered.filter(e => e.status === 'active');
        break;
      case 'money_loan':
        filtered = filtered.filter(e => e.platforms?.includes('money_loan'));
        break;
      case 'bnpl':
        filtered = filtered.filter(e => e.platforms?.includes('bnpl'));
        break;
      case 'pawnshop':
        filtered = filtered.filter(e => e.platforms?.includes('pawnshop'));
        break;
    }

    this.filteredEmployees.set(filtered);
    this.currentPage = 1;
    this.updatePagination();
  }

  createEmployee() {
    this.router.navigate(['/tenant/users/new']);
  }

  loadEmployees() {
    this.loading.set(true);

  const params = { page: '1', limit: '250' };
  this.http.get<any>('/api/users', { params }).subscribe({
      next: (response) => {
        if (response.success || response.data) {
          const users = response.data || [];
          // Filter to show only tenant employees (exclude system admins and customers)
          const tenantEmployees = users.filter((u: any) => {
            // Must have tenantId (not system admin)
            if (u.tenantId === null || u.tenantId === undefined) return false;

            // Check if user has roles
            if (!u.roles || u.roles.length === 0) {
              // No roles = likely a customer, exclude
              return false;
            }

            // Must NOT have customer space roles
            const hasCustomerRole = u.roles.some((r: any) =>
              r.space === 'customer' ||
              r.name?.toLowerCase().includes('customer')
            );

            // Must have tenant space roles (Tenant Admin or Employee roles)
            const hasTenantRole = u.roles.some((r: any) =>
              r.space === 'tenant'
            );

            return !hasCustomerRole && hasTenantRole;
          });

          // console.log('Total users:', users.length);
          // console.log('Filtered employees:', tenantEmployees.length);
          // console.log('Employees:', tenantEmployees);
          // console.log('First employee platforms:', tenantEmployees[0]?.platforms);
          // console.log('Sample employee data:', JSON.stringify(tenantEmployees[0], null, 2));

          this.employees.set(tenantEmployees);
          this.filteredEmployees.set(tenantEmployees);
          this.updatePagination();
          this.cdr.detectChanges(); // Force change detection
        } else {
          this.toastService.error('Failed to load employees');
          this.loadMockEmployees();
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading employees:', error);
        this.toastService.error('Error loading employees');
        this.loadMockEmployees();
        this.loading.set(false);
      }
    });
  }

  loadMockEmployees() {
    // Mock data
    const mockEmployees: Employee[] = [
      {
        id: 1,
        userId: 10,
        tenantId: 2,
        email: 'employee1@tenant1.com',
        firstName: 'John',
        lastName: 'Smith',
        department: 'IT',
        position: 'Software Engineer',
        employmentType: 'full_time',
        employmentStatus: 'active',
        hireDate: '2024-01-15',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active',
        roles: [{ id: 1, name: 'Employee', space: 'tenant' }],
        platforms: ['money_loan', 'bnpl']
      },
      {
        id: 2,
        userId: 11,
        tenantId: 2,
        email: 'employee2@tenant1.com',
        firstName: 'Jane',
        lastName: 'Doe',
        department: 'Finance',
        position: 'Financial Analyst',
        employmentType: 'full_time',
        employmentStatus: 'active',
        hireDate: '2024-02-20',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        status: 'active',
        roles: [{ id: 2, name: 'Tenant Admin', space: 'tenant' }],
        platforms: ['money_loan']
      }
    ];

    this.employees.set(mockEmployees);
    this.filteredEmployees.set(mockEmployees);
    this.updatePagination();
  }

  onSearch() {
    this.applyFilters();
  }

  onFilterChange() {
    this.applyFilters();
  }

  applyFilters() {
    let filtered = this.employees();

    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(emp =>
        emp.firstName?.toLowerCase().includes(query) ||
        emp.lastName?.toLowerCase().includes(query) ||
        emp.email?.toLowerCase().includes(query) ||
        emp.department?.toLowerCase().includes(query) ||
        emp.position?.toLowerCase().includes(query)
      );
    }

    if (this.departmentFilter) {
      filtered = filtered.filter(emp => emp.department === this.departmentFilter);
    }

    if (this.statusFilter) {
      filtered = filtered.filter(emp => emp.employmentStatus === this.statusFilter);
    }

    this.filteredEmployees.set(filtered);
    this.currentPage = 1;
    this.updatePagination();
    this.cdr.detectChanges(); // Force change detection
  }

  clearFilters() {
    this.searchQuery = '';
    this.departmentFilter = '';
    this.statusFilter = '';
    this.filteredEmployees.set(this.employees());
    this.currentPage = 1;
    this.updatePagination();
    this.cdr.detectChanges(); // Force change detection
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination() {
    const filtered = this.filteredEmployees();
    const total = Math.ceil(filtered.length / this.pageSize);
    this.totalPages.set(total || 1);

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedEmployees.set(filtered.slice(startIndex, endIndex));
    this.cdr.detectChanges(); // Force change detection after pagination update
  }

  previousPage() {
    if (this.currentPage > 1) {
      this.currentPage--;
      this.updatePagination();
    }
  }

  nextPage() {
    if (this.currentPage < this.totalPages()) {
      this.currentPage++;
      this.updatePagination();
    }
  }

  getInitials(firstName: string, lastName: string): string {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  }

  getEmploymentTypeClass(type: string): string {
    const baseClass = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full';
    switch (type) {
      case 'full_time':
        return `${baseClass} bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-300`;
      case 'part_time':
        return `${baseClass} bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-300`;
      case 'contract':
        return `${baseClass} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300`;
      default:
        return `${baseClass} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`;
    }
  }

  getStatusClass(status: string): string {
    const baseClass = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full';
    switch (status) {
      case 'active':
        return `${baseClass} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300`;
      case 'on_leave':
        return `${baseClass} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300`;
      case 'terminated':
        return `${baseClass} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300`;
      default:
        return `${baseClass} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`;
    }
  }

  getPlatformLabel(platform: string): string {
    const platformLabels: Record<string, string> = {
      'money_loan': 'Money Loan',
      'bnpl': 'BNPL',
      'pawnshop': 'Pawnshop'
    };
    return platformLabels[platform] || platform;
  }

  viewEmployee(id: number) {
    this.router.navigate(['/tenant/users', id]);
  }

  editEmployee(id: number) {
    this.router.navigate(['/tenant/users', id]);
  }

  resetPassword(employee: Employee) {
    // Use employee.id which is the user ID from the users table
    const userId = employee.userId || employee.id;

    console.log('Reset Password - Employee data:', {
      id: employee.id,
      userId: employee.userId,
      selectedUserId: userId,
      email: employee.email
    });

    this.resetPasswordModal.open({
      userId: userId,
      userName: `${employee.firstName} ${employee.lastName}`,
      userEmail: employee.email
    });
  }

  suspendEmployee(id: number) {
    if (!confirm('Are you sure you want to suspend this employee?')) {
      return;
    }

  this.http.patch(`/api/employees/${id}`, { employmentStatus: 'on_leave' }).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.toastService.success('Employee suspended successfully');
          this.loadEmployees();
        } else {
          this.toastService.error('Failed to suspend employee');
        }
      },
      error: (error) => {
        console.error('Error suspending employee:', error);
        this.toastService.error('Error suspending employee');
      }
    });
  }

  deleteEmployee(id: number) {
    if (!confirm('Are you sure you want to delete this employee? This action cannot be undone.')) {
      return;
    }

  this.http.delete(`/api/employees/${id}`).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.toastService.success('Employee deleted successfully');
          this.loadEmployees();
        } else {
          this.toastService.error('Failed to delete employee');
        }
      },
      error: (error) => {
        console.error('Error deleting employee:', error);
        this.toastService.error('Error deleting employee');
      }
    });
  }

  // Selection methods
  toggleSelectAll() {
    this.selectAll = !this.selectAll;
    if (this.selectAll) {
      this.paginatedEmployees().forEach(employee => {
        this.selectedEmployees.add(employee.id);
      });
    } else {
      this.selectedEmployees.clear();
    }
  }

  toggleEmployee(id: number) {
    if (this.selectedEmployees.has(id)) {
      this.selectedEmployees.delete(id);
      this.selectAll = false;
    } else {
      this.selectedEmployees.add(id);
      const allSelected = this.paginatedEmployees().every(e => this.selectedEmployees.has(e.id));
      this.selectAll = allSelected;
    }
  }

  isSelected(id: number): boolean {
    return this.selectedEmployees.has(id);
  }

  getSelectedCount(): number {
    return this.selectedEmployees.size;
  }

  clearSelection() {
    this.selectedEmployees.clear();
    this.selectAll = false;
  }

  // Export methods
  exportSelected() {
    if (this.selectedEmployees.size === 0) {
      this.toastService.warning('Please select employees to export');
      return;
    }

    const selectedData = this.employees().filter(e => this.selectedEmployees.has(e.id));
    this.exportToCSV(selectedData, 'selected-employees.csv');
    this.toastService.success(`Exported ${selectedData.length} employees`);
  }

  exportAll() {
    const data = this.filteredEmployees();
    if (data.length === 0) {
      this.toastService.warning('No employees to export');
      return;
    }
    this.exportToCSV(data, 'all-employees.csv');
    this.toastService.success(`Exported ${data.length} employees`);
  }

  exportToCSV(data: Employee[], filename: string) {
    // CSV headers
    const headers = [
      'First Name',
      'Last Name',
      'Email',
      'Department',
      'Position',
      'Employment Type',
      'Status',
      'Hire Date',
      'Created At'
    ];

    // Convert data to CSV rows
    const csvRows = [
      headers.join(','),
      ...data.map(employee => [
        employee.firstName,
        employee.lastName,
        employee.email,
        employee.department || '',
        employee.position || '',
        employee.employmentType,
        employee.employmentStatus,
        employee.hireDate || '',
        this.formatDate(employee.createdAt)
      ].map(field => `"${field}"`).join(','))
    ];

    // Create and download file
    const csvContent = csvRows.join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);

    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
}
