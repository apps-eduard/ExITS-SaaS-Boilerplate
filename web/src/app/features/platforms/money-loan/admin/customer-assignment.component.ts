/**
 * Customer Assignment Component
 *
 * Full-page component for managing customer-to-employee assignments in the Money Loan platform.
 *
 * Features:
 * - Employee selection with role-based filtering
 * - View assigned and unassigned customers for selected employee
 * - Real-time statistics (assigned count, available count, selected count)
 * - Multi-select customers for batch assignment
 * - Search and filter capabilities
 * - Dark mode support
 *
 * Layout:
 * - Left panel: Employee list with search and role filter
 * - Right panel: Customer list with assignment status and actions
 *
 * Route: /platforms/money-loan/admin/customers/assignments
 */

import { Component, OnInit, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastService } from '../../../../core/services/toast.service';
import { ComponentPathService } from '../../../../core/services/component-path.service';

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  activeAssignments?: number;
  roleName?: string;
  roleId?: number;
}

interface Customer {
  id: number;
  firstName: string;
  lastName: string;
  customerCode: string;
  phone: string;
  email: string;
  status: string;
  kycStatus: string;
  assignedEmployeeId?: number;
  assignedEmployeeName?: string;
  activeLoans?: number;
  creditScore?: number;
}

@Component({
  selector: 'app-customer-assignment',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="h-full flex flex-col bg-gray-50 dark:bg-gray-900">
      <!-- Header -->
      <div class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 px-6 py-4">
        <div class="flex items-center justify-between">
          <div>
            <h1 class="text-2xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
              <span class="text-3xl">👥</span>
              Customer Assignment Management
            </h1>
            <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
              Assign customers to employees for collection management
            </p>
          </div>
          <button
            (click)="goBack()"
            class="inline-flex items-center gap-2 px-4 py-2 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 19l-7-7m0 0l7-7m-7 7h18"/>
            </svg>
            Back to Customers
          </button>
        </div>
      </div>

      <!-- Main Content -->
      <div class="flex-1 overflow-hidden">
        <div class="h-full grid grid-cols-12 gap-6 p-6">

          <!-- Left Panel: Employee List -->
          <div class="col-span-4 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col">
            <div class="p-4 border-b border-gray-200 dark:border-gray-700">
              <h2 class="text-lg font-semibold text-gray-900 dark:text-white mb-3">
                Select Employee
              </h2>

              <!-- Search -->
              <div class="relative mb-3">
                <input
                  type="text"
                  [(ngModel)]="employeeSearchTerm"
                  placeholder="Search employees..."
                  class="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <svg class="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                </svg>
              </div>

              <!-- Role Filter -->
              <select
                [(ngModel)]="roleFilter"
                class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">All Roles</option>
                @for (role of availableRoles(); track role) {
                  <option [value]="role">{{ role }}</option>
                }
              </select>
            </div>

            <!-- Employee List -->
            <div class="flex-1 overflow-y-auto p-4">
              @if (loadingEmployees()) {
                <div class="flex items-center justify-center py-12">
                  <div class="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                    <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Loading employees...
                  </div>
                </div>
              } @else if (filteredEmployees().length === 0) {
                <div class="text-center py-12 text-gray-500 dark:text-gray-400">
                  <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                  No employees found
                </div>
              } @else {
                <div class="space-y-2">
                  @for (employee of filteredEmployees(); track employee.id) {
                    <button
                      type="button"
                      (click)="selectEmployee(employee)"
                      [class]="getEmployeeCardClass(employee)"
                      class="w-full p-3 border-2 rounded-lg transition-all duration-200 text-left">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold text-sm flex-shrink-0">
                          {{ getInitials(employee.firstName, employee.lastName) }}
                        </div>
                        <div class="flex-1 min-w-0">
                          <p class="font-semibold text-sm text-gray-900 dark:text-white truncate">
                            {{ employee.firstName }} {{ employee.lastName }}
                          </p>
                          <p class="text-xs text-gray-600 dark:text-gray-400 truncate">{{ employee.email }}</p>
                          @if (employee.roleName) {
                            <span class="inline-block mt-1 px-2 py-0.5 text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded-full">
                              {{ employee.roleName }}
                            </span>
                          }
                        </div>
                        @if (selectedEmployee()?.id === employee.id) {
                          <div class="flex-shrink-0">
                            <svg class="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                              <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                            </svg>
                          </div>
                        }
                      </div>
                    </button>
                  }
                </div>
              }
            </div>
          </div>

          <!-- Right Panel: Customer Assignment -->
          <div class="col-span-8 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 flex flex-col">
            @if (!selectedEmployee()) {
              <div class="flex-1 flex items-center justify-center">
                <div class="text-center">
                  <svg class="w-20 h-20 mx-auto mb-4 text-gray-300 dark:text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                  </svg>
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">
                    Select an Employee
                  </h3>
                  <p class="text-gray-600 dark:text-gray-400">
                    Choose an employee from the list to view and manage their customer assignments
                  </p>
                </div>
              </div>
            } @else {
              <!-- Employee Info Header -->
              <div class="p-4 border-b border-gray-200 dark:border-gray-700 bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-900/20 dark:to-purple-900/20">
                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-4">
                    <div class="w-16 h-16 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold text-xl">
                      {{ getInitials(selectedEmployee()!.firstName, selectedEmployee()!.lastName) }}
                    </div>
                    <div>
                      <h2 class="text-xl font-bold text-gray-900 dark:text-white">
                        {{ selectedEmployee()!.firstName }} {{ selectedEmployee()!.lastName }}
                      </h2>
                      <p class="text-sm text-gray-600 dark:text-gray-400">{{ selectedEmployee()!.email }}</p>
                      @if (selectedEmployee()!.roleName) {
                        <span class="inline-block mt-1 px-2 py-1 text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded-full">
                          👔 {{ selectedEmployee()!.roleName }}
                        </span>
                      }
                    </div>
                  </div>
                  <div class="text-right">
                    <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">
                      {{ assignedCustomersCount() }}
                    </p>
                    <p class="text-xs text-gray-600 dark:text-gray-400">Assigned Customers</p>
                  </div>
                </div>
              </div>

              <!-- Stats Cards -->
              <div class="grid grid-cols-3 gap-4 p-4 border-b border-gray-200 dark:border-gray-700">
                <button
                  type="button"
                  (click)="setAssignmentFilter('assigned')"
                  title="Click to filter: Already Assigned"
                  class="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border-2 transition-all duration-200 text-left hover:shadow-md hover:scale-105 cursor-pointer"
                  [class.border-green-500]="assignmentFilter() === 'assigned'"
                  [class.border-green-200]="assignmentFilter() !== 'assigned'"
                  [class.dark:border-green-500]="assignmentFilter() === 'assigned'"
                  [class.dark:border-green-800]="assignmentFilter() !== 'assigned'"
                  [class.ring-2]="assignmentFilter() === 'assigned'"
                  [class.ring-green-500]="assignmentFilter() === 'assigned'">
                  <div class="flex items-center justify-between">
                    <p class="text-xs text-green-700 dark:text-green-400 font-medium">Already Assigned</p>
                    @if (assignmentFilter() === 'assigned') {
                      <svg class="w-4 h-4 text-green-600 dark:text-green-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                      </svg>
                    } @else {
                      <svg class="w-4 h-4 text-green-400 dark:text-green-600 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      </svg>
                    }
                  </div>
                  <p class="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">
                    {{ assignedCustomersCount() }}
                  </p>
                </button>
                <button
                  type="button"
                  (click)="setAssignmentFilter('unassigned')"
                  title="Click to filter: Available to Assign"
                  class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border-2 transition-all duration-200 text-left hover:shadow-md hover:scale-105 cursor-pointer"
                  [class.border-blue-500]="assignmentFilter() === 'unassigned'"
                  [class.border-blue-200]="assignmentFilter() !== 'unassigned'"
                  [class.dark:border-blue-500]="assignmentFilter() === 'unassigned'"
                  [class.dark:border-blue-800]="assignmentFilter() !== 'unassigned'"
                  [class.ring-2]="assignmentFilter() === 'unassigned'"
                  [class.ring-blue-500]="assignmentFilter() === 'unassigned'">
                  <div class="flex items-center justify-between">
                    <p class="text-xs text-blue-700 dark:text-blue-400 font-medium">Available to Assign</p>
                    @if (assignmentFilter() === 'unassigned') {
                      <svg class="w-4 h-4 text-blue-600 dark:text-blue-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                      </svg>
                    } @else {
                      <svg class="w-4 h-4 text-blue-400 dark:text-blue-600 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      </svg>
                    }
                  </div>
                  <p class="text-2xl font-bold text-blue-600 dark:text-blue-400 mt-1">
                    {{ unassignedCustomersCount() }}
                  </p>
                </button>
                <button
                  type="button"
                  (click)="setAssignmentFilter('all')"
                  title="Click to show: All Customers"
                  class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border-2 transition-all duration-200 text-left hover:shadow-md hover:scale-105 cursor-pointer"
                  [class.border-purple-500]="assignmentFilter() === 'all'"
                  [class.border-purple-200]="assignmentFilter() !== 'all'"
                  [class.dark:border-purple-500]="assignmentFilter() === 'all'"
                  [class.dark:border-purple-800]="assignmentFilter() !== 'all'"
                  [class.ring-2]="assignmentFilter() === 'all'"
                  [class.ring-purple-500]="assignmentFilter() === 'all'">
                  <div class="flex items-center justify-between">
                    <p class="text-xs text-purple-700 dark:text-purple-400 font-medium">All Customers</p>
                    @if (assignmentFilter() === 'all') {
                      <svg class="w-4 h-4 text-purple-600 dark:text-purple-400" fill="currentColor" viewBox="0 0 20 20">
                        <path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"/>
                      </svg>
                    } @else {
                      <svg class="w-4 h-4 text-purple-400 dark:text-purple-600 opacity-40" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      </svg>
                    }
                  </div>
                  <p class="text-2xl font-bold text-purple-600 dark:text-purple-400 mt-1">
                    {{ customers().length }}
                  </p>
                </button>
              </div>

              <!-- Customer Filters -->
              <div class="p-4 border-b border-gray-200 dark:border-gray-700 space-y-3">
                <div class="flex items-center gap-2">
                  <div class="flex-1 relative">
                    <input
                      type="text"
                      [(ngModel)]="customerSearchTerm"
                      placeholder="Search customers by name, code, phone..."
                      class="w-full pl-10 pr-4 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <svg class="absolute left-3 top-2.5 h-4 w-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                    </svg>
                  </div>
                  <select
                    [(ngModel)]="assignmentFilter"
                    class="px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="all">All Customers</option>
                    <option value="assigned">Already Assigned</option>
                    <option value="unassigned">Available to Assign</option>
                  </select>
                </div>

                <div class="flex items-center justify-between">
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      (click)="selectAllVisible()"
                      class="px-3 py-1.5 text-xs font-medium text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/30 rounded hover:bg-blue-100 dark:hover:bg-blue-900/50 transition-colors">
                      Select All Visible
                    </button>
                    <button
                      type="button"
                      (click)="selectUnassigned()"
                      class="px-3 py-1.5 text-xs font-medium text-green-600 dark:text-green-400 bg-green-50 dark:bg-green-900/30 rounded hover:bg-green-100 dark:hover:bg-green-900/50 transition-colors">
                      Select Unassigned
                    </button>
                    <button
                      type="button"
                      (click)="selectAssigned()"
                      class="px-3 py-1.5 text-xs font-medium text-orange-600 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/30 rounded hover:bg-orange-100 dark:hover:bg-orange-900/50 transition-colors">
                      Select Assigned
                    </button>
                    @if (selectedCustomerIds().size > 0) {
                      <button
                        type="button"
                        (click)="clearSelection()"
                        class="px-3 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/30 rounded hover:bg-red-100 dark:hover:bg-red-900/50 transition-colors">
                        Clear Selection
                      </button>
                    }
                  </div>
                  @if (selectedCustomerIds().size > 0) {
                    <div class="flex items-center gap-2">
                      @if (hasUnassignedCustomersSelected()) {
                        <button
                          type="button"
                          (click)="assignCustomers()"
                          [disabled]="saving()"
                          class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                          @if (saving()) {
                            <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Assigning...
                          } @else {
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"/>
                            </svg>
                            Assign {{ selectedCustomerIds().size }} Customer(s)
                          }
                        </button>
                      }
                      @if (hasAssignedCustomersSelected()) {
                        <button
                          type="button"
                          (click)="unassignCustomers()"
                          [disabled]="saving()"
                          class="inline-flex items-center gap-2 px-4 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                          @if (saving()) {
                            <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                              <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                              <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                            </svg>
                            Unassigning...
                          } @else {
                            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                            </svg>
                            Unassign {{ selectedCustomerIds().size }} Customer(s)
                          }
                        </button>
                      }
                    </div>
                  }
                </div>
              </div>

              <!-- Customer List -->
              <div class="flex-1 overflow-y-auto p-4">
                @if (loadingCustomers()) {
                  <div class="flex items-center justify-center py-12">
                    <div class="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                      <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading customers...
                    </div>
                  </div>
                } @else if (filteredCustomers().length === 0) {
                  <div class="text-center py-12 text-gray-500 dark:text-gray-400">
                    <svg class="w-12 h-12 mx-auto mb-3 opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                    </svg>
                    No customers found
                  </div>
                } @else {
                  <div class="space-y-2">
                    @for (customer of filteredCustomers(); track customer.id) {
                      <label
                        class="flex items-center gap-4 p-4 border-2 rounded-lg transition-all duration-200"
                        [class]="getCustomerCardClass(customer)"
                        [class.cursor-pointer]="canSelectCustomer(customer)"
                        [class.cursor-not-allowed]="!canSelectCustomer(customer)"
                        [class.opacity-60]="!canSelectCustomer(customer)">
                        <input
                          type="checkbox"
                          [checked]="isCustomerSelected(customer.id)"
                          [disabled]="!canSelectCustomer(customer)"
                          (change)="toggleCustomer(customer)"
                          class="w-5 h-5 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2 disabled:opacity-50 disabled:cursor-not-allowed">

                        <div class="w-12 h-12 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                          {{ getInitials(customer.firstName, customer.lastName) }}
                        </div>

                        <div class="flex-1 min-w-0">
                          <div class="flex items-center gap-2">
                            <p class="font-semibold text-gray-900 dark:text-white">
                              {{ customer.firstName }} {{ customer.lastName }}
                            </p>
                            <span class="text-xs font-mono font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                              {{ customer.customerCode }}
                            </span>
                            @if (customer.assignedEmployeeId === selectedEmployee()!.id) {
                              <span class="text-xs font-medium bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-400 px-2 py-0.5 rounded-full">
                                ✓ Assigned
                              </span>
                            } @else if (customer.assignedEmployeeId) {
                              <span class="inline-flex items-center gap-1 text-xs font-medium bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 px-2 py-0.5 rounded-full">
                                <svg class="w-3 h-3" fill="currentColor" viewBox="0 0 20 20">
                                  <path fill-rule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clip-rule="evenodd"/>
                                </svg>
                                Assigned to: {{ customer.assignedEmployeeName }}
                              </span>
                            }
                          </div>
                          <div class="flex items-center gap-3 mt-1 text-xs text-gray-600 dark:text-gray-400">
                            <span>📞 {{ customer.phone }}</span>
                            <span>✉️ {{ customer.email }}</span>
                            @if (customer.activeLoans) {
                              <span class="font-medium text-blue-600 dark:text-blue-400">{{ customer.activeLoans }} active loan(s)</span>
                            }
                          </div>
                        </div>
                      </label>
                    }
                  </div>
                }
              </div>
            }
          </div>

        </div>
      </div>
    </div>
  `
})
export class CustomerAssignmentComponent implements OnInit {
  private http = inject(HttpClient);
  private router = inject(Router);
  private toastService = inject(ToastService);
  private componentPathService = inject(ComponentPathService);

  // Employees
  employees = signal<Employee[]>([]);
  loadingEmployees = signal(false);
  employeeSearchTerm = signal('');
  roleFilter = signal('');
  selectedEmployee = signal<Employee | null>(null);

  // Customers
  customers = signal<Customer[]>([]);
  loadingCustomers = signal(false);
  customerSearchTerm = signal('');
  assignmentFilter = signal('all'); // 'all' | 'assigned' | 'unassigned'
  selectedCustomerIds = signal<Set<number>>(new Set());
  saving = signal(false);

  // Computed
  availableRoles = computed(() => {
    const roles = new Set<string>();
    this.employees().forEach(emp => {
      if (emp.roleName) {
        roles.add(emp.roleName);
      }
    });
    return Array.from(roles).sort();
  });

  filteredEmployees = computed(() => {
    let filtered = this.employees();

    // Filter by role
    if (this.roleFilter()) {
      filtered = filtered.filter(emp => emp.roleName === this.roleFilter());
    }

    // Filter by search term
    const search = this.employeeSearchTerm().toLowerCase().trim();
    if (search) {
      filtered = filtered.filter(emp =>
        emp.firstName.toLowerCase().includes(search) ||
        emp.lastName.toLowerCase().includes(search) ||
        emp.email.toLowerCase().includes(search) ||
        emp.phone?.toLowerCase().includes(search) ||
        emp.roleName?.toLowerCase().includes(search)
      );
    }

    return filtered;
  });

  filteredCustomers = computed(() => {
    let filtered = this.customers();

    // Filter by assignment status
    if (this.assignmentFilter() === 'assigned') {
      filtered = filtered.filter(c => c.assignedEmployeeId === this.selectedEmployee()?.id);
    } else if (this.assignmentFilter() === 'unassigned') {
      filtered = filtered.filter(c => !c.assignedEmployeeId);
    }

    // Filter by search term
    const search = this.customerSearchTerm().toLowerCase().trim();
    if (search) {
      filtered = filtered.filter(c =>
        c.firstName.toLowerCase().includes(search) ||
        c.lastName.toLowerCase().includes(search) ||
        c.customerCode.toLowerCase().includes(search) ||
        c.phone.toLowerCase().includes(search) ||
        c.email.toLowerCase().includes(search)
      );
    }

    return filtered;
  });

  assignedCustomersCount = computed(() => {
    return this.customers().filter(c => c.assignedEmployeeId === this.selectedEmployee()?.id).length;
  });

  unassignedCustomersCount = computed(() => {
    return this.customers().filter(c => !c.assignedEmployeeId).length;
  });

  // Helper to check if selected customers are assigned to current employee
  hasAssignedCustomersSelected = computed(() => {
    const selected = Array.from(this.selectedCustomerIds());
    const customers = this.customers();
    const selectedEmployeeId = this.selectedEmployee()?.id;

    return selected.some(id => {
      const customer = customers.find(c => c.id === id);
      return customer?.assignedEmployeeId === selectedEmployeeId;
    });
  });

  // Helper to check if selected customers are unassigned
  hasUnassignedCustomersSelected = computed(() => {
    const selected = Array.from(this.selectedCustomerIds());
    const customers = this.customers();

    return selected.some(id => {
      const customer = customers.find(c => c.id === id);
      return !customer?.assignedEmployeeId;
    });
  });

  ngOnInit() {
    this.componentPathService.setComponentPath({
      componentName: 'CustomerAssignmentComponent',
      moduleName: 'Money Loan - Customer Assignment',
      filePath: 'src/app/features/platforms/money-loan/admin/customer-assignment.component.ts',
      routePath: this.router.url
    });

    this.loadEmployees();
    this.loadCustomers();
  }

  loadEmployees() {
    this.loadingEmployees.set(true);

    // Use the new collectors endpoint instead of generic users endpoint
    this.http.get<any>('/api/collectors').subscribe({
      next: (response) => {
        const collectors = response.data || response || [];
        console.log('Collectors from API:', collectors);

        const mappedEmployees = collectors.map((collector: any) => ({
          id: collector.id,
          firstName: collector.firstName || '',
          lastName: collector.lastName || '',
          email: collector.email,
          phone: collector.phone || '',
          roleName: collector.roleName || collector.role?.name || '',
          roleId: collector.roleId || collector.role?.id,
          activeAssignments: collector.activeAssignments || 0,
          employeeCode: collector.employeeCode,
          position: collector.position,
          department: collector.department
        }));

        console.log('Mapped collectors:', mappedEmployees);
        this.employees.set(mappedEmployees);
        this.loadingEmployees.set(false);
      },
      error: (error) => {
        console.error('Error loading collectors:', error);
        this.toastService.error('Failed to load collectors');
        this.employees.set([]);
        this.loadingEmployees.set(false);
      }
    });
  }

  loadCustomers() {
    this.loadingCustomers.set(true);

    this.http.get<any>('/api/money-loan/customers', {
      params: { limit: '1000' }
    }).subscribe({
      next: (response) => {
        this.customers.set(response.data || []);
        this.loadingCustomers.set(false);
      },
      error: (error) => {
        console.error('Error loading customers:', error);
        this.toastService.error('Failed to load customers');
        this.customers.set([]);
        this.loadingCustomers.set(false);
      }
    });
  }

  selectEmployee(employee: Employee) {
    this.selectedEmployee.set(employee);
    this.selectedCustomerIds.set(new Set());
    this.customerSearchTerm.set('');
    this.assignmentFilter.set('all');
  }

  toggleCustomer(customer: Customer) {
    // Don't allow toggling if customer is assigned to a different employee
    if (!this.canSelectCustomer(customer)) {
      return;
    }

    const ids = new Set(this.selectedCustomerIds());
    if (ids.has(customer.id)) {
      ids.delete(customer.id);
    } else {
      ids.add(customer.id);
    }
    this.selectedCustomerIds.set(ids);
  }

  /**
   * Check if a customer can be selected for assignment
   * Customers assigned to other employees cannot be selected
   * They must be unassigned first before reassignment
   */
  canSelectCustomer(customer: Customer): boolean {
    if (!this.selectedEmployee()) return false;

    // If customer is not assigned to anyone, they can be selected
    if (!customer.assignedEmployeeId) return true;

    // If customer is assigned to the currently selected employee, they can be selected (for unassignment)
    if (customer.assignedEmployeeId === this.selectedEmployee()!.id) return true;

    // Customer is assigned to someone else - cannot select
    return false;
  }

  isCustomerSelected(customerId: number): boolean {
    return this.selectedCustomerIds().has(customerId);
  }

  clearSelection() {
    this.selectedCustomerIds.set(new Set());
  }

  setAssignmentFilter(filter: 'all' | 'assigned' | 'unassigned') {
    this.assignmentFilter.set(filter);
    // Clear selection when changing filters to avoid confusion
    this.clearSelection();
  }

  selectAllVisible() {
    const ids = new Set(this.selectedCustomerIds());
    this.filteredCustomers()
      .filter(c => this.canSelectCustomer(c))
      .forEach(c => ids.add(c.id));
    this.selectedCustomerIds.set(ids);
  }

  selectUnassigned() {
    const ids = new Set(this.selectedCustomerIds());
    this.filteredCustomers()
      .filter(c => !c.assignedEmployeeId && this.canSelectCustomer(c))
      .forEach(c => ids.add(c.id));
    this.selectedCustomerIds.set(ids);
  }

  selectAssigned() {
    const ids = new Set(this.selectedCustomerIds());
    this.filteredCustomers()
      .filter(c => c.assignedEmployeeId === this.selectedEmployee()?.id && this.canSelectCustomer(c))
      .forEach(c => ids.add(c.id));
    this.selectedCustomerIds.set(ids);
  }

  assignCustomers() {
    if (!this.selectedEmployee() || this.selectedCustomerIds().size === 0) return;

    const employeeId = this.selectedEmployee()!.id;
    const customerIds = Array.from(this.selectedCustomerIds());

    this.saving.set(true);

    this.http.post('/api/money-loan/assignments', {
      employeeId,
      customerIds
    }).subscribe({
      next: () => {
        this.toastService.success(
          `Successfully assigned ${customerIds.length} customer(s) to ${this.selectedEmployee()!.firstName} ${this.selectedEmployee()!.lastName}`
        );
        this.selectedCustomerIds.set(new Set());
        this.loadCustomers(); // Reload to show updated assignments
        this.saving.set(false);
      },
      error: (error) => {
        console.error('Error assigning customers:', error);
        this.toastService.error('Failed to assign customers. Please try again.');
        this.saving.set(false);
      }
    });
  }

  unassignCustomers() {
    if (!this.selectedEmployee() || this.selectedCustomerIds().size === 0) return;

    const employeeId = this.selectedEmployee()!.id;
    const customerIds = Array.from(this.selectedCustomerIds());

    // Filter to only include customers actually assigned to this employee
    const customers = this.customers();
    const assignedCustomerIds = customerIds.filter(id => {
      const customer = customers.find(c => c.id === id);
      return customer?.assignedEmployeeId === employeeId;
    });

    if (assignedCustomerIds.length === 0) {
      this.toastService.warning('No assigned customers selected for unassignment.');
      return;
    }

    this.saving.set(true);

    this.http.post('/api/money-loan/unassignments', {
      customerIds: assignedCustomerIds
    }).subscribe({
      next: () => {
        this.toastService.success(
          `Successfully unassigned ${assignedCustomerIds.length} customer(s) from ${this.selectedEmployee()!.firstName} ${this.selectedEmployee()!.lastName}`
        );
        this.selectedCustomerIds.set(new Set());
        this.loadCustomers(); // Reload to show updated assignments
        this.saving.set(false);
      },
      error: (error) => {
        console.error('Error unassigning customers:', error);
        this.toastService.error('Failed to unassign customers. Please try again.');
        this.saving.set(false);
      }
    });
  }

  getEmployeeCardClass(employee: Employee): string {
    const isSelected = this.selectedEmployee()?.id === employee.id;
    if (isSelected) {
      return 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500 dark:ring-blue-400';
    }
    return 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 hover:border-gray-300 dark:hover:border-gray-600 hover:shadow-sm';
  }

  getCustomerCardClass(customer: Customer): string {
    const isSelected = this.isCustomerSelected(customer.id);
    const isAssignedToMe = customer.assignedEmployeeId === this.selectedEmployee()?.id;
    const isAssignedToOther = customer.assignedEmployeeId && customer.assignedEmployeeId !== this.selectedEmployee()?.id;

    if (isSelected) {
      return 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20';
    } else if (isAssignedToMe) {
      return 'border-green-300 dark:border-green-700 bg-green-50 dark:bg-green-900/20';
    } else if (isAssignedToOther) {
      // Customer assigned to another employee - show as disabled/locked
      return 'border-gray-300 dark:border-gray-600 bg-gray-100 dark:bg-gray-800';
    }
    return 'border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700/50';
  }

  getInitials(firstName: string, lastName: string): string {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  }

  goBack() {
    this.router.navigate(['/platforms/money-loan/dashboard/customers/all']);
  }
}
