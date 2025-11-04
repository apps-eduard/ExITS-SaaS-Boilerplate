import { Component, OnInit, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CustomerService } from '../shared/services/customer.service';
import { LoanCustomer } from '../shared/models/loan.models';
import { ComponentPathService } from '../../../../core/services/component-path.service';

@Component({
  selector: 'app-customers-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 md:p-6 space-y-4">
      <!-- Header -->
      <div class="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Customers</h1>
          <p class="text-sm text-gray-600 dark:text-gray-400">Manage loan customers and KYC verification</p>
        </div>
        <div class="flex items-center gap-2">
          <button
            (click)="navigateToAssignments()"
            class="inline-flex items-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
            </svg>
            Manage Assignments
          </button>
          <button
            (click)="addCustomer()"
            class="inline-flex items-center gap-2 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg transition-colors">
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Add Customer
          </button>
        </div>
      </div>

      <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400">Total Customers</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white">{{ stats()?.totalCustomers || 0 }}</p>
            </div>
            <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400">Active Customers</p>
              <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ stats()?.activeCustomers || 0 }}</p>
            </div>
            <div class="w-12 h-12 bg-green-100 dark:bg-green-900/30 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400">KYC Verified</p>
              <p class="text-2xl font-bold text-blue-600 dark:text-blue-400">{{ stats()?.verifiedCustomers || 0 }}</p>
            </div>
            <div class="w-12 h-12 bg-blue-100 dark:bg-blue-900/30 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z"/>
              </svg>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400">Pending KYC</p>
              <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">{{ stats()?.pendingKyc || 0 }}</p>
            </div>
            <div class="w-12 h-12 bg-orange-100 dark:bg-orange-900/30 rounded-lg flex items-center justify-center">
              <svg class="w-6 h-6 text-orange-600 dark:text-orange-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div class="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
            <input
              type="text"
              [(ngModel)]="searchTerm"
              (ngModelChange)="onSearchChange()"
              placeholder="Customer name, code, phone..."
              class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Assigned Employee</label>
            <select
              [(ngModel)]="filterEmployee"
              (ngModelChange)="onFilterChange()"
              class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Employees</option>
              <option value="unassigned">Unassigned</option>
              @for (employee of employees(); track employee.id) {
                <option [value]="employee.id">{{ employee.firstName }} {{ employee.lastName }}</option>
              }
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              [(ngModel)]="filterStatus"
              (ngModelChange)="onFilterChange()"
              class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="blocked">Blocked</option>
            </select>
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">KYC Status</label>
            <select
              [(ngModel)]="filterKyc"
              (ngModelChange)="onFilterChange()"
              class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">All KYC</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>
          </div>
          <div class="flex items-end">
            <button
              (click)="resetFilters()"
              class="w-full inline-flex items-center justify-center gap-2 px-4 py-2 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
              <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
              </svg>
              Reset
            </button>
          </div>
        </div>
      </div>

      <!-- Customers Table -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full">
            <thead class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">Customer</th>
                <th class="px-3 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">
                  <div class="flex items-center gap-1">
                    <span class="w-3.5 h-3.5">🔖</span>
                    Code
                  </div>
                </th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">Contact</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">Assigned Employee</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">KYC</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">Active Loans</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">Credit Score</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              @if (loading()) {
                <tr>
                  <td colspan="9" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    <div class="flex items-center justify-center gap-2">
                      <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading customers...
                    </div>
                  </td>
                </tr>
              } @else if (customers().length === 0) {
                <tr>
                  <td colspan="9" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    No customers found
                  </td>
                </tr>
              } @else {
                @for (customer of customers(); track customer.id) {
                  <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {{ getInitials(customer.firstName, customer.lastName) }}
                        </div>
                        <div>
                          <p class="text-sm font-medium text-gray-900 dark:text-white">{{ customer.firstName }} {{ customer.lastName }}</p>
                          <p class="text-xs text-gray-500 dark:text-gray-400">ID: {{ customer.id }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap">
                      <span class="text-xs font-mono text-gray-900 dark:text-white font-medium">
                        {{ customer.customerCode }}
                      </span>
                    </td>
                    <td class="px-4 py-3">
                      <div class="text-sm">
                        <p class="text-gray-900 dark:text-white">{{ customer.phone }}</p>
                        <p class="text-xs text-gray-500 dark:text-gray-400">{{ customer.email }}</p>
                      </div>
                    </td>
                    <td class="px-4 py-3">
                      @if (customer.assignedEmployeeName) {
                        <div class="flex items-center gap-2">
                          <div class="w-7 h-7 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white text-xs font-semibold">
                            {{ getEmployeeInitials(customer.assignedEmployeeName) }}
                          </div>
                          <span class="text-sm text-gray-900 dark:text-white">{{ customer.assignedEmployeeName }}</span>
                        </div>
                      } @else {
                        <span class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-500 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 rounded-full">
                          <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z"/>
                          </svg>
                          Unassigned
                        </span>
                      }
                    </td>
                    <td class="px-4 py-3">
                      <span [class]="getStatusClass(customer.status)">
                        {{ customer.status }}
                      </span>
                    </td>
                    <td class="px-4 py-3">
                      <span [class]="getKycClass(customer.kycStatus)">
                        {{ customer.kycStatus }}
                      </span>
                    </td>
                    <td class="px-4 py-3">
                      <span class="text-sm font-medium text-gray-900 dark:text-white">{{ customer.activeLoans || 0 }}</span>
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-2">
                        <div class="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            class="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                            [style.width.%]="(customer.creditScore || 0) / 10">
                          </div>
                        </div>
                        <span class="text-xs font-medium text-gray-700 dark:text-gray-300 w-8">{{ customer.creditScore || 0 }}</span>
                      </div>
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex items-center justify-end gap-2">
                        <button
                          (click)="navigateToAssignments()"
                          class="p-1.5 text-purple-600 hover:bg-purple-50 dark:hover:bg-purple-900/30 rounded transition-colors"
                          title="Manage Assignments">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z"/>
                          </svg>
                        </button>
                        <button
                          (click)="viewCustomer(customer.id)"
                          class="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                          title="View Details">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                          </svg>
                        </button>
                        <button
                          (click)="editCustomer(customer.id)"
                          class="p-1.5 text-green-600 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition-colors"
                          title="Edit">
                          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                          </svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="px-4 py-3 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div class="text-sm text-gray-600 dark:text-gray-400">
            Showing {{ (currentPage() - 1) * pageSize() + 1 }} to {{ Math.min(currentPage() * pageSize(), totalRecords()) }} of {{ totalRecords() }} customers
          </div>
          <div class="flex items-center gap-2">
            <button
              (click)="previousPage()"
              [disabled]="currentPage() === 1"
              class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              Previous
            </button>
            <span class="text-sm text-gray-600 dark:text-gray-400">
              Page {{ currentPage() }} of {{ totalPages() }}
            </span>
            <button
              (click)="nextPage()"
              [disabled]="currentPage() >= totalPages()"
              class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class CustomersListComponent implements OnInit {
  private customerService = inject(CustomerService);
  private router = inject(Router);
  private componentPathService = inject(ComponentPathService);
  private http = inject(HttpClient);

  customers = signal<LoanCustomer[]>([]);
  employees = signal<any[]>([]);
  stats = signal<any>(null);
  loading = signal(false);

  searchTerm = '';
  filterStatus = '';
  filterKyc = '';
  filterEmployee = '';
  currentPage = signal(1);
  pageSize = signal(10);
  totalRecords = signal(0);
  totalPages = signal(0);

  Math = Math;

  ngOnInit() {
    // Register component path for dev info
    this.componentPathService.setComponentPath({
      componentName: 'CustomersListComponent',
      moduleName: 'Money Loan - Customers',
      filePath: 'src/app/features/platforms/money-loan/admin/customers-list.component.ts',
      routePath: this.router.url
    });

    this.loadCustomers();
    this.loadStats();
    this.loadEmployees();
  }

  loadEmployees() {
    // Load employees for the filter dropdown
    // TODO: Replace with dedicated endpoint when backend is ready: /api/platforms/money-loan/employees
    // For now, use tenant users endpoint and filter for employees only
    this.http.get<any>('/api/users', {
      params: {
        userType: 'tenant',
        limit: '1000' // Get all users
      }
    }).subscribe({
      next: (response: any) => {
        // Filter for employees only (not customers)
        // Assuming employees have platformAccess.money_loan = true
        const users = response.data || response.users || [];
        const employees = users.filter((user: any) => {
          // Filter out customers (userType !== 'customer')
          // Include users with platform access or role-based employees
          return user.userType !== 'customer' && user.userType !== 'system';
        });

        // Map to employee format expected by modal
        const mappedEmployees = employees.map((user: any) => ({
          id: user.id,
          firstName: user.firstName || user.name?.split(' ')[0] || '',
          lastName: user.lastName || user.name?.split(' ')[1] || '',
          email: user.email,
          phone: user.phone || '',
          roleName: user.roleName || user.role?.name || 'No Role',
          roleId: user.roleId || user.role?.id,
          activeAssignments: 0 // Will be populated from assignments API later
        }));

        this.employees.set(mappedEmployees);
      },
      error: (error: any) => {
        console.error('Error loading employees:', error);
        // Set empty array on error to prevent UI issues
        this.employees.set([]);
      }
    });
  }

  loadCustomers() {
    this.loading.set(true);
    const filters: any = {
      page: this.currentPage(),
      limit: this.pageSize(),
      search: this.searchTerm,
      status: this.filterStatus,
      kycStatus: this.filterKyc,
      employeeId: this.filterEmployee
    };

    this.customerService.listCustomers(filters).subscribe({
      next: (response: any) => {
        this.customers.set(response.data);
        this.totalRecords.set(response.pagination?.total || 0);
        this.totalPages.set(response.pagination?.pages || 0);
        this.loading.set(false);
      },
      error: (error: any) => {
        console.error('Error loading customers:', error);
        this.loading.set(false);
      }
    });
  }

  loadStats() {
    // This would call a general stats endpoint
    // For now, we can derive from customer list or use a dedicated endpoint
  }

  onSearchChange() {
    this.currentPage.set(1);
    this.loadCustomers();
  }

  onFilterChange() {
    this.currentPage.set(1);
    this.loadCustomers();
  }

  resetFilters() {
    this.searchTerm = '';
    this.filterStatus = '';
    this.filterKyc = '';
    this.filterEmployee = '';
    this.currentPage.set(1);
    this.loadCustomers();
  }

  previousPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(page => page - 1);
      this.loadCustomers();
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(page => page + 1);
      this.loadCustomers();
    }
  }

  getInitials(firstName: string, lastName: string): string {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  }

  getStatusClass(status: string): string {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full';
    switch (status) {
      case 'active':
        return `${baseClasses} bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400`;
      case 'inactive':
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400`;
      case 'blocked':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400`;
    }
  }

  getKycClass(kycStatus: string): string {
    const baseClasses = 'px-2 py-1 text-xs font-medium rounded-full';
    switch (kycStatus) {
      case 'verified':
        return `${baseClasses} bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400`;
      case 'pending':
        return `${baseClasses} bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400`;
      case 'rejected':
        return `${baseClasses} bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400`;
    }
  }

  addCustomer() {
    this.router.navigate(['/platforms/money-loan/dashboard/customers/new']);
  }

  viewCustomer(id: number) {
    this.router.navigate(['/platforms/money-loan/dashboard/customers', id]);
  }

  editCustomer(id: number) {
    this.router.navigate(['/platforms/money-loan/admin/customers', id, 'edit']);
  }

  navigateToAssignments() {
    this.router.navigate(['/platforms/money-loan/dashboard/customers/assignments']);
  }

  deleteCustomer(id: number) {
  }

  getEmployeeInitials(fullName: string): string {
    const names = fullName.split(' ');
    if (names.length >= 2) {
      return `${names[0].charAt(0)}${names[names.length - 1].charAt(0)}`.toUpperCase();
    }
    return fullName.substring(0, 2).toUpperCase();
  }
}
