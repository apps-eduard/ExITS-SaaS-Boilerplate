import { Component, Output, EventEmitter, signal, computed, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../../core/services/toast.service';

interface Employee {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  activeAssignments?: number;
  avatar?: string;
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
  assignedEmployeeId?: number;
  assignedEmployeeName?: string;
}

@Component({
  selector: 'app-customer-assignment-modal',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    @if (isOpen()) {
      <!-- Modal Backdrop -->
      <div
        class="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
        (click)="onBackdropClick($event)">
        <!-- Modal Container -->
        <div
          class="bg-white dark:bg-gray-800 rounded-xl shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col"
          (click)="$event.stopPropagation()">

          <!-- Modal Header -->
          <div class="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
            <div>
              <h2 class="text-xl font-bold text-gray-900 dark:text-white flex items-center gap-2">
                <span class="text-2xl">👥</span>
                Assign Customers to Employee
              </h2>
              <p class="text-sm text-gray-600 dark:text-gray-400 mt-1">
                Select an employee and assign customers for collection management
              </p>
            </div>
            <button
              (click)="close()"
              class="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-lg transition-colors">
              <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          <!-- Modal Body -->
          <div class="flex-1 overflow-y-auto p-6">
            <div class="space-y-6">

              <!-- Step 1: Select Employee -->
              <div class="space-y-3">
                <div class="flex items-center gap-2">
                  <div class="w-8 h-8 rounded-full bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center text-blue-600 dark:text-blue-400 font-bold text-sm">
                    1
                  </div>
                  <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Select Employee</h3>
                </div>

                <!-- Employee Search -->
                <div class="relative">
                  <input
                    type="text"
                    [(ngModel)]="employeeSearchTerm"
                    (ngModelChange)="onEmployeeSearch()"
                    placeholder="Search employees by name, email..."
                    class="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500">
                  <svg class="absolute left-3 top-3 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                  </svg>
                </div>

                <!-- Role Filter -->
                <div class="flex items-center gap-2">
                  <select
                    [(ngModel)]="roleFilter"
                    (ngModelChange)="onEmployeeSearch()"
                    class="flex-1 px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-blue-500">
                    <option value="">All Roles</option>
                    @for (role of availableRoles(); track role) {
                      <option [value]="role">{{ role }}</option>
                    }
                  </select>
                  @if (roleFilter || employeeSearchTerm) {
                    <button
                      type="button"
                      (click)="clearEmployeeFilters()"
                      class="px-3 py-2.5 text-sm text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                      title="Clear filters">
                      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                      </svg>
                    </button>
                  }
                </div>

                <!-- Employee Grid -->
                <div class="grid grid-cols-1 md:grid-cols-2 gap-3 max-h-64 overflow-y-auto pr-2">
                  @if (loadingEmployees()) {
                    <div class="col-span-2 py-8 text-center">
                      <div class="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
                        <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                          <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                          <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        Loading employees...
                      </div>
                    </div>
                  } @else if (filteredEmployees().length === 0) {
                    <div class="col-span-2 py-8 text-center text-gray-500 dark:text-gray-400">
                      No employees found
                    </div>
                  } @else {
                    @for (employee of filteredEmployees(); track employee.id) {
                      <button
                        type="button"
                        (click)="selectEmployee(employee)"
                        [class]="getEmployeeCardClass(employee)"
                        class="p-4 border-2 rounded-lg transition-all duration-200 text-left hover:shadow-md">
                        <div class="flex items-center gap-3">
                          <div class="w-12 h-12 bg-gradient-to-br from-purple-500 to-pink-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                            {{ getInitials(employee.firstName, employee.lastName) }}
                          </div>
                          <div class="flex-1 min-w-0">
                            <p class="font-semibold text-gray-900 dark:text-white truncate">
                              {{ employee.firstName }} {{ employee.lastName }}
                            </p>
                            <p class="text-xs text-gray-600 dark:text-gray-400 truncate">{{ employee.email }}</p>
                            <div class="flex flex-wrap items-center gap-2 mt-1">
                              @if (employee.roleName) {
                                <span class="inline-flex items-center px-2 py-0.5 text-xs font-medium bg-indigo-100 dark:bg-indigo-900/30 text-indigo-800 dark:text-indigo-300 rounded-full">
                                  👔 {{ employee.roleName }}
                                </span>
                              }
                              @if (employee.phone) {
                                <span class="text-xs text-gray-500 dark:text-gray-500">📞 {{ employee.phone }}</span>
                              }
                              <span class="text-xs font-medium text-blue-600 dark:text-blue-400">
                                {{ employee.activeAssignments || 0 }} assigned
                              </span>
                            </div>
                          </div>
                          @if (selectedEmployee()?.id === employee.id) {
                            <div class="flex-shrink-0">
                              <svg class="w-6 h-6 text-blue-600" fill="currentColor" viewBox="0 0 24 24">
                                <path d="M9 16.17L4.83 12l-1.42 1.41L9 19 21 7l-1.41-1.41z"/>
                              </svg>
                            </div>
                          }
                        </div>
                      </button>
                    }
                  }
                </div>
              </div>

              <!-- Step 2: Select Customers -->
              @if (selectedEmployee()) {
                <div class="space-y-3 pt-4 border-t border-gray-200 dark:border-gray-700">
                  <div class="flex items-center justify-between">
                    <div class="flex items-center gap-2">
                      <div class="w-8 h-8 rounded-full bg-green-100 dark:bg-green-900/30 flex items-center justify-center text-green-600 dark:text-green-400 font-bold text-sm">
                        2
                      </div>
                      <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Select Customers</h3>
                    </div>
                    <div class="flex items-center gap-2">
                      <span class="text-sm text-gray-600 dark:text-gray-400">
                        {{ selectedCustomers().length }} selected
                      </span>
                      @if (selectedCustomers().length > 0) {
                        <button
                          type="button"
                          (click)="clearCustomerSelection()"
                          class="text-xs text-red-600 hover:text-red-700 dark:text-red-400 dark:hover:text-red-300 font-medium">
                          Clear All
                        </button>
                      }
                    </div>
                  </div>

                  <!-- Assigned To Notice -->
                  <div class="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <div class="flex items-start gap-3">
                      <span class="text-2xl">👤</span>
                      <div class="flex-1">
                        <p class="text-sm font-medium text-blue-900 dark:text-blue-300">
                          Assigning to: {{ selectedEmployee()!.firstName }} {{ selectedEmployee()!.lastName }}
                        </p>
                        <p class="text-xs text-blue-700 dark:text-blue-400 mt-1">
                          {{ selectedEmployee()!.email }}
                        </p>
                      </div>
                    </div>
                  </div>

                  <!-- Customer Search -->
                  <div class="flex items-center gap-2">
                    <div class="flex-1 relative">
                      <input
                        type="text"
                        [(ngModel)]="customerSearchTerm"
                        (ngModelChange)="onCustomerSearch()"
                        placeholder="Search customers by name, code, phone..."
                        class="w-full pl-10 pr-4 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-green-500">
                      <svg class="absolute left-3 top-3 h-5 w-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
                      </svg>
                    </div>
                    <select
                      [(ngModel)]="assignmentFilter"
                      (ngModelChange)="onCustomerSearch()"
                      class="px-3 py-2.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-green-500">
                      <option value="all">All Customers</option>
                      <option value="unassigned">Unassigned Only</option>
                      <option value="assigned">Already Assigned</option>
                    </select>
                  </div>

                  <!-- Quick Select Actions -->
                  <div class="flex items-center gap-2">
                    <button
                      type="button"
                      (click)="selectAllVisible()"
                      class="text-xs px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      Select All Visible
                    </button>
                    <button
                      type="button"
                      (click)="selectUnassigned()"
                      class="text-xs px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                      Select Unassigned
                    </button>
                  </div>

                  <!-- Customers List -->
                  <div class="border border-gray-200 dark:border-gray-700 rounded-lg max-h-96 overflow-y-auto">
                    @if (loadingCustomers()) {
                      <div class="py-12 text-center">
                        <div class="flex items-center justify-center gap-2 text-gray-500 dark:text-gray-400">
                          <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                            <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                            <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                          </svg>
                          Loading customers...
                        </div>
                      </div>
                    } @else if (filteredCustomers().length === 0) {
                      <div class="py-12 text-center text-gray-500 dark:text-gray-400">
                        No customers found
                      </div>
                    } @else {
                      <div class="divide-y divide-gray-200 dark:divide-gray-700">
                        @for (customer of filteredCustomers(); track customer.id) {
                          <label
                            class="flex items-center gap-4 p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 cursor-pointer transition-colors">
                            <input
                              type="checkbox"
                              [checked]="isCustomerSelected(customer.id)"
                              (change)="toggleCustomer(customer)"
                              class="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500 focus:ring-2">

                            <div class="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white font-semibold flex-shrink-0">
                              {{ getInitials(customer.firstName, customer.lastName) }}
                            </div>

                            <div class="flex-1 min-w-0">
                              <div class="flex items-center gap-2">
                                <p class="font-medium text-gray-900 dark:text-white">
                                  {{ customer.firstName }} {{ customer.lastName }}
                                </p>
                                <span class="text-xs font-mono font-medium text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded">
                                  {{ customer.customerCode }}
                                </span>
                              </div>
                              <div class="flex items-center gap-3 mt-1">
                                <span class="text-xs text-gray-600 dark:text-gray-400">📞 {{ customer.phone }}</span>
                                <span class="text-xs text-gray-600 dark:text-gray-400">✉️ {{ customer.email }}</span>
                              </div>
                              @if (customer.assignedEmployeeName) {
                                <div class="mt-1.5">
                                  <span class="text-xs bg-yellow-100 dark:bg-yellow-900/30 text-yellow-800 dark:text-yellow-400 px-2 py-0.5 rounded-full">
                                    Currently assigned to: {{ customer.assignedEmployeeName }}
                                  </span>
                                </div>
                              }
                            </div>
                          </label>
                        }
                      </div>
                    }
                  </div>
                </div>
              }
            </div>
          </div>

          <!-- Modal Footer -->
          <div class="flex items-center justify-between gap-4 p-6 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
            <div class="text-sm text-gray-600 dark:text-gray-400">
              @if (selectedEmployee() && selectedCustomers().length > 0) {
                <span class="font-medium">
                  Ready to assign {{ selectedCustomers().length }} customer(s) to {{ selectedEmployee()!.firstName }} {{ selectedEmployee()!.lastName }}
                </span>
              } @else if (selectedEmployee()) {
                <span>Select customers to assign to {{ selectedEmployee()!.firstName }}</span>
              } @else {
                <span>Select an employee to begin</span>
              }
            </div>

            <div class="flex items-center gap-3">
              <button
                type="button"
                (click)="close()"
                class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-lg hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors">
                Cancel
              </button>
              <button
                type="button"
                (click)="assignCustomers()"
                [disabled]="!canAssign()"
                class="px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2">
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
                  Assign Customers
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class CustomerAssignmentModalComponent implements OnInit {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);

  @Output() closed = new EventEmitter<void>();
  @Output() assigned = new EventEmitter<{ employeeId: number; customerIds: number[] }>();

  // Modal state
  isOpen = signal(false);
  saving = signal(false);

  // Employees
  employees = signal<Employee[]>([]);
  loadingEmployees = signal(false);
  employeeSearchTerm = '';
  roleFilter = '';
  selectedEmployee = signal<Employee | null>(null);

  // Customers
  customers = signal<Customer[]>([]);
  loadingCustomers = signal(false);
  customerSearchTerm = '';
  assignmentFilter = 'all'; // 'all' | 'unassigned' | 'assigned'
  selectedCustomerIds = signal<Set<number>>(new Set());

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
    if (this.roleFilter) {
      filtered = filtered.filter(emp => emp.roleName === this.roleFilter);
    }

    // Filter by search term
    const search = this.employeeSearchTerm.toLowerCase().trim();
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
    if (this.assignmentFilter === 'unassigned') {
      filtered = filtered.filter(c => !c.assignedEmployeeId);
    } else if (this.assignmentFilter === 'assigned') {
      filtered = filtered.filter(c => c.assignedEmployeeId);
    }

    // Filter by search term
    const search = this.customerSearchTerm.toLowerCase().trim();
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

  selectedCustomers = computed(() => {
    const ids = this.selectedCustomerIds();
    return this.customers().filter(c => ids.has(c.id));
  });

  ngOnInit() {
    // Load initial data
  }

  open() {
    this.isOpen.set(true);
    this.loadEmployees();
    this.loadCustomers();
  }

  close() {
    this.isOpen.set(false);
    this.reset();
    this.closed.emit();
  }

  private reset() {
    this.selectedEmployee.set(null);
    this.selectedCustomerIds.set(new Set());
    this.employeeSearchTerm = '';
    this.roleFilter = '';
    this.customerSearchTerm = '';
    this.assignmentFilter = 'all';
  }

  clearEmployeeFilters() {
    this.employeeSearchTerm = '';
    this.roleFilter = '';
  }

  loadEmployees() {
    this.loadingEmployees.set(true);

    // TODO: Replace with dedicated endpoint when backend is ready: /api/platforms/money-loan/employees
    // For now, use tenant users endpoint and filter for employees only
    this.http.get<any>('/api/users', {
      params: {
        userType: 'tenant',
        limit: '1000'
      }
    }).subscribe({
      next: (response) => {
        // Filter for employees only (not customers)
        const users = response.data || response.users || [];
        const employees = users.filter((user: any) => {
          return user.userType !== 'customer' && user.userType !== 'system';
        });

        // Map to employee format
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
        this.loadingEmployees.set(false);
      },
      error: (error) => {
        console.error('Error loading employees:', error);
        this.toastService.error('Failed to load employees');
        this.employees.set([]); // Set empty array to prevent UI issues
        this.loadingEmployees.set(false);
      }
    });
  }

  loadCustomers() {
    this.loadingCustomers.set(true);

    // API call to get all customers (using correct endpoint path)
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
        this.customers.set([]); // Set empty array to prevent UI issues
        this.loadingCustomers.set(false);
      }
    });
  }  selectEmployee(employee: Employee) {
    this.selectedEmployee.set(employee);
    // Clear customer selection when changing employee
    this.selectedCustomerIds.set(new Set());
  }

  toggleCustomer(customer: Customer) {
    const ids = new Set(this.selectedCustomerIds());
    if (ids.has(customer.id)) {
      ids.delete(customer.id);
    } else {
      ids.add(customer.id);
    }
    this.selectedCustomerIds.set(ids);
  }

  isCustomerSelected(customerId: number): boolean {
    return this.selectedCustomerIds().has(customerId);
  }

  clearCustomerSelection() {
    this.selectedCustomerIds.set(new Set());
  }

  selectAllVisible() {
    const ids = new Set(this.selectedCustomerIds());
    this.filteredCustomers().forEach(c => ids.add(c.id));
    this.selectedCustomerIds.set(ids);
  }

  selectUnassigned() {
    const ids = new Set(this.selectedCustomerIds());
    this.filteredCustomers()
      .filter(c => !c.assignedEmployeeId)
      .forEach(c => ids.add(c.id));
    this.selectedCustomerIds.set(ids);
  }

  onEmployeeSearch() {
    // Reactive filtering handled by computed
  }

  onCustomerSearch() {
    // Reactive filtering handled by computed
  }

  canAssign(): boolean {
    return !!this.selectedEmployee() && this.selectedCustomerIds().size > 0 && !this.saving();
  }

  assignCustomers() {
    if (!this.canAssign()) return;

    const employeeId = this.selectedEmployee()!.id;
    const customerIds = Array.from(this.selectedCustomerIds());

    this.saving.set(true);

    // TODO: Replace with dedicated endpoint when backend is ready: /api/platforms/money-loan/assignments
    // For now, use money-loan assignments endpoint
    this.http.post('/api/money-loan/assignments', {
      employeeId,
      customerIds
    }).subscribe({
      next: () => {
        this.toastService.success(
          `Successfully assigned ${customerIds.length} customer(s) to ${this.selectedEmployee()!.firstName} ${this.selectedEmployee()!.lastName}`
        );
        this.assigned.emit({ employeeId, customerIds });
        this.saving.set(false);
        this.close();
      },
      error: (error) => {
        console.error('Error assigning customers:', error);
        this.toastService.error('Failed to assign customers. Please try again.');
        this.saving.set(false);
      }
    });
  }

  getEmployeeCardClass(employee: Employee): string {
    const isSelected = this.selectedEmployee()?.id === employee.id;
    const baseClass = 'border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800';
    const selectedClass = 'border-blue-500 dark:border-blue-400 bg-blue-50 dark:bg-blue-900/20 ring-2 ring-blue-500 dark:ring-blue-400';
    return isSelected ? selectedClass : baseClass;
  }

  getInitials(firstName: string, lastName: string): string {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  }

  onBackdropClick(event: MouseEvent) {
    this.close();
  }
}
