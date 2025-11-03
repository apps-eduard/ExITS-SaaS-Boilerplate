import { Component, inject, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../core/services/toast.service';
import { ThemeService } from '../../../core/services/theme.service';
import { RBACService } from '../../../core/services/rbac.service';

interface Customer {
  id: number;
  tenantId: number;  // camelCase from Knex
  customerCode: string;  // camelCase from Knex
  email: string;
  phone: string;
  firstName: string;  // camelCase from Knex
  lastName: string;  // camelCase from Knex
  dateOfBirth: string;  // camelCase from Knex
  status: string;
  kycStatus: string;  // camelCase from Knex
  creditScore: number;  // camelCase from Knex
  createdAt: string;  // camelCase from Knex
  updatedAt: string;  // camelCase from Knex
}

@Component({
  selector: 'app-customers-list',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4">
      <!-- Header with Icon -->
      <div class="mb-4">
        <div class="flex items-center justify-between">
          <div>
            <div class="flex items-center gap-2 mb-1">
              <span class="text-xl">👥</span>
              <h1 class="text-lg font-bold text-gray-900 dark:text-white">
                All Customers
              </h1>
            </div>
            <p class="text-xs text-gray-600 dark:text-gray-400">
              Manage your customer accounts
            </p>
          </div>
          @if (canCreateCustomers()) {
            <button
              (click)="createCustomer()"
              class="inline-flex items-center gap-1.5 rounded bg-blue-600 px-3 py-1.5 text-xs font-medium text-white shadow-sm transition hover:bg-blue-700"
            >
              <span class="w-3.5 h-3.5">➕</span>
              Add Customer
            </button>
          }
        </div>
      </div>

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
                placeholder="Search by name, email, or code..."
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
              [(ngModel)]="statusFilter"
              (change)="onFilterChange()"
              class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
              <option value="suspended">Suspended</option>
            </select>
          </div>

          <!-- KYC Filter -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
              KYC Status
            </label>
            <select
              [(ngModel)]="kycFilter"
              (change)="onFilterChange()"
              class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:border-blue-500 focus:outline-none"
            >
              <option value="">All KYC</option>
              <option value="pending">Pending</option>
              <option value="verified">Verified</option>
              <option value="rejected">Rejected</option>
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

            @if (canCreateCustomers()) {
              <button
                (click)="createCustomer()"
                class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded shadow-sm hover:bg-blue-700 transition"
              >
                <span class="w-3.5 h-3.5">➕</span>
                Add Customer
              </button>
            }

            <span class="text-xs text-gray-600 dark:text-gray-400">
              Showing {{ paginatedCustomers().length }} of {{ filteredCustomers().length }}
            </span>
          </div>
        </div>
      </div>

      <!-- Loading State -->
      @if (loading()) {
        <div class="flex items-center justify-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div class="text-center">
            <div class="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p class="text-xs text-gray-600 dark:text-gray-400">Loading customers...</p>
          </div>
        </div>
      }

      <!-- Customers Table -->
      @if (!loading() && paginatedCustomers().length > 0) {
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
                      Customer
                    </div>
                  </th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <div class="flex items-center gap-1">
                      <span class="w-3.5 h-3.5">🔖</span>
                      Code
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
                      <span class="w-3.5 h-3.5">⭐</span>
                      Credit
                    </div>
                  </th>
                  <th class="px-3 py-2 text-left text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider">
                    <div class="flex items-center gap-1">
                      <span class="w-3.5 h-3.5">✅</span>
                      KYC
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
                @for (customer of paginatedCustomers(); track customer.id) {
                  <tr class="hover:bg-gray-50 dark:hover:bg-gray-700 transition">
                    <td class="px-3 py-2 whitespace-nowrap">
                      <input
                        type="checkbox"
                        [checked]="isSelected(customer.id)"
                        (change)="toggleCustomer(customer.id)"
                        class="w-4 h-4 text-blue-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-blue-500"
                      />
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap">
                      <div class="flex items-center">
                        <div class="flex-shrink-0 h-8 w-8">
                          <div class="h-8 w-8 rounded-full bg-gradient-to-br from-blue-500 to-purple-600 flex items-center justify-center">
                            <span class="text-white font-medium text-xs">
                              {{ getInitials(customer.firstName, customer.lastName) }}
                            </span>
                          </div>
                        </div>
                        <div class="ml-2">
                          <div class="text-xs font-medium text-gray-900 dark:text-white">
                            {{ customer.firstName }} {{ customer.lastName }}
                          </div>
                          <div class="text-xs text-gray-500 dark:text-gray-400">
                            {{ formatDate(customer.createdAt) }}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap">
                      <span class="text-xs font-mono text-gray-900 dark:text-white font-medium">
                        {{ customer.customerCode }}
                      </span>
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap">
                      <div class="text-xs text-gray-900 dark:text-white">{{ customer.email }}</div>
                      <div class="text-xs text-gray-500 dark:text-gray-400">{{ customer.phone }}</div>
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap">
                      <span [class]="getCreditScoreClass(customer.creditScore)" class="px-2 py-0.5 text-xs font-semibold rounded">
                        {{ customer.creditScore || 'N/A' }}
                      </span>
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap">
                      <span [class]="getKycStatusClass(customer.kycStatus)">
                        {{ customer.kycStatus }}
                      </span>
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap">
                      <span [class]="getStatusClass(customer.status)">
                        {{ customer.status }}
                      </span>
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap">
                      <div class="flex items-center gap-1">
                        <button
                          (click)="viewCustomer(customer.id)"
                          class="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded shadow-sm hover:bg-blue-100 dark:hover:bg-blue-900/30 transition"
                          title="View Details"
                        >
                          <span class="w-3.5 h-3.5">👁️</span>
                        </button>
                        <button
                          (click)="editCustomer(customer.id)"
                          class="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-green-700 dark:text-green-400 bg-green-50 dark:bg-green-900/20 rounded shadow-sm hover:bg-green-100 dark:hover:bg-green-900/30 transition"
                          title="Edit Customer"
                        >
                          <span class="w-3.5 h-3.5">✏️</span>
                        </button>
                        <button
                          (click)="suspendCustomer(customer.id)"
                          class="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-orange-700 dark:text-orange-400 bg-orange-50 dark:bg-orange-900/20 rounded shadow-sm hover:bg-orange-100 dark:hover:bg-orange-900/30 transition"
                          title="Suspend Customer"
                        >
                          <span class="w-3.5 h-3.5">⏸️</span>
                        </button>
                        <button
                          (click)="deleteCustomer(customer.id)"
                          class="inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded shadow-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition"
                          title="Delete Customer"
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
                  Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ currentPage * pageSize > filteredCustomers().length ? filteredCustomers().length : currentPage * pageSize }} of {{ filteredCustomers().length }}
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
                  [disabled]="currentPage === totalPages()"
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
      @if (!loading() && paginatedCustomers().length === 0) {
        <div class="text-center py-12 bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
          <div class="text-gray-400 dark:text-gray-500 text-5xl mb-3">👥</div>
          <h3 class="text-sm font-medium text-gray-900 dark:text-white mb-1">No customers found</h3>
          <p class="text-xs text-gray-500 dark:text-gray-400 mb-3">
            {{ searchQuery || statusFilter || kycFilter ? 'Try adjusting your filters' : 'Get started by adding your first customer' }}
          </p>
          @if (searchQuery || statusFilter || kycFilter) {
            <button
              (click)="clearFilters()"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded shadow-sm hover:bg-blue-700 transition"
            >
              <span class="w-3.5 h-3.5">🔄</span>
              Clear Filters
            </button>
          } @else if (canCreateCustomers()) {
            <button
              (click)="createCustomer()"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-white bg-blue-600 rounded shadow-sm hover:bg-blue-700 transition"
            >
              <span class="w-3.5 h-3.5">➕</span>
              Add Customer
            </button>
          }
        </div>
      }
    </div>
  `,
  styles: []
})
export class CustomersListComponent implements OnInit {
  private http: HttpClient;
  private toastService: ToastService;
  private router: Router;
  public themeService: ThemeService;
  private rbacService = inject(RBACService);

  customers = signal<Customer[]>([]);
  filteredCustomers = signal<Customer[]>([]);
  paginatedCustomers = signal<Customer[]>([]);
  loading = signal(true);

  searchQuery = '';
  statusFilter = '';
  kycFilter = '';
  pageSize = 25;
  currentPage = 1;
  totalPages = signal(1);

  canCreateCustomers = computed(() =>
    this.rbacService.canAny(['tenant-customers:create', 'money-loan:customers:create'])
  );

  // Selection state
  selectedCustomers = new Set<number>();
  selectAll = false;

  constructor() {
    this.http = inject(HttpClient);
    this.toastService = inject(ToastService);
    this.router = inject(Router);
    this.themeService = inject(ThemeService);
  }

  ngOnInit() {
    console.log('CustomersListComponent ngOnInit called');
    console.log('HttpClient instance:', this.http);
    this.loadCustomers();
  }

  createCustomer() {
    this.router.navigate(['/tenant/customers/new']);
  }

  loadCustomers() {
    console.log('loadCustomers called');
    console.log('HttpClient in loadCustomers:', this.http);
    console.log('🔑 Token in localStorage:', localStorage.getItem('access_token')?.substring(0, 20) + '...');
    console.log('🔑 All localStorage keys:', Object.keys(localStorage));
    this.loading.set(true);

    this.http.get<any>('http://localhost:3000/api/customers').subscribe({
      next: (response) => {
        if (response.success) {
          this.customers.set(response.data || []);
          this.filteredCustomers.set(response.data || []);
          this.updatePagination();
        } else {
          this.toastService.error('Failed to load customers');
          this.loadMockCustomers();
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading customers:', error);
        this.toastService.error('Error loading customers');
        this.loadMockCustomers();
        this.loading.set(false);
      }
    });
  }

  loadMockCustomers() {
    // Mock data from seed-platform-users.js
    const mockCustomers: Customer[] = [
      {
        id: 1,
        tenantId: 2,
        customerCode: 'CUST-2025-001',
        email: 'juan.delacruz@test.com',
        phone: '+63 917 123 4567',
        firstName: 'Juan',
        lastName: 'Dela Cruz',
        dateOfBirth: '1990-05-15',
        status: 'active',
        kycStatus: 'verified',
        creditScore: 720,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 2,
        tenantId: 2,
        customerCode: 'CUST-2025-002',
        email: 'maria.santos@test.com',
        phone: '+63 918 123 4567',
        firstName: 'Maria',
        lastName: 'Santos',
        dateOfBirth: '1985-08-22',
        status: 'active',
        kycStatus: 'verified',
        creditScore: 680,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      },
      {
        id: 3,
        tenantId: 2,
        customerCode: 'CUST-2025-003',
        email: 'pedro.gonzales@test.com',
        phone: '+63 919 123 4567',
        firstName: 'Pedro',
        lastName: 'Gonzales',
        dateOfBirth: '1995-03-10',
        status: 'active',
        kycStatus: 'pending',
        creditScore: 620,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      }
    ];

    this.customers.set(mockCustomers);
    this.filteredCustomers.set(mockCustomers);
    this.updatePagination();
  }

  onSearch() {
    this.applyFilters();
  }

  onFilterChange() {
    this.applyFilters();
  }

  applyFilters() {
    let filtered = this.customers();

    // Search filter
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(c =>
        c.firstName?.toLowerCase().includes(query) ||
        c.lastName?.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query) ||
        c.customerCode?.toLowerCase().includes(query)
      );
    }

    // Status filter
    if (this.statusFilter) {
      filtered = filtered.filter(c => c.status === this.statusFilter);
    }

    // KYC filter
    if (this.kycFilter) {
      filtered = filtered.filter(c => c.kycStatus === this.kycFilter);
    }

    this.filteredCustomers.set(filtered);
    this.currentPage = 1; // Reset to first page when filters change
    this.updatePagination();
  }

  clearFilters() {
    this.searchQuery = '';
    this.statusFilter = '';
    this.kycFilter = '';
    this.filteredCustomers.set(this.customers());
    this.currentPage = 1;
    this.updatePagination();
  }

  onPageSizeChange() {
    this.currentPage = 1;
    this.updatePagination();
  }

  updatePagination() {
    const filtered = this.filteredCustomers();
    const total = Math.ceil(filtered.length / this.pageSize);
    this.totalPages.set(total || 1);

    const startIndex = (this.currentPage - 1) * this.pageSize;
    const endIndex = startIndex + this.pageSize;
    this.paginatedCustomers.set(filtered.slice(startIndex, endIndex));
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

  getCreditScoreClass(score: number): string {
    if (!score) return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
    if (score >= 700) return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300';
    if (score >= 600) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300';
    return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300';
  }

  getKycStatusClass(status: string): string {
    const baseClass = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full';
    switch (status) {
      case 'approved':
        return `${baseClass} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300`;
      case 'pending':
        return `${baseClass} bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-300`;
      case 'rejected':
        return `${baseClass} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300`;
      default:
        return `${baseClass} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`;
    }
  }

  getStatusClass(status: string): string {
    const baseClass = 'px-2 inline-flex text-xs leading-5 font-semibold rounded-full';
    switch (status) {
      case 'active':
        return `${baseClass} bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-300`;
      case 'inactive':
        return `${baseClass} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`;
      case 'suspended':
        return `${baseClass} bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-300`;
      default:
        return `${baseClass} bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300`;
    }
  }

  viewCustomer(id: number) {
    this.router.navigate(['/tenant/customers', id]);
  }

  editCustomer(id: number) {
    this.router.navigate(['/tenant/customers', id, 'edit']);
  }

  suspendCustomer(id: number) {
    if (!confirm('Are you sure you want to suspend this customer?')) {
      return;
    }

    this.http.patch(`http://localhost:3000/api/customers/${id}`, { status: 'suspended' }).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.toastService.success('Customer suspended successfully');
          this.loadCustomers();
        } else {
          this.toastService.error('Failed to suspend customer');
        }
      },
      error: (error) => {
        console.error('Error suspending customer:', error);
        this.toastService.error('Error suspending customer');
      }
    });
  }

  deleteCustomer(id: number) {
    if (!confirm('Are you sure you want to delete this customer? This action cannot be undone.')) {
      return;
    }

    this.http.delete(`http://localhost:3000/api/customers/${id}`).subscribe({
      next: (response: any) => {
        if (response.success) {
          this.toastService.success('Customer deleted successfully');
          this.loadCustomers();
        } else {
          this.toastService.error('Failed to delete customer');
        }
      },
      error: (error) => {
        console.error('Error deleting customer:', error);
        this.toastService.error('Error deleting customer');
      }
    });
  }

  // Selection methods
  toggleSelectAll() {
    this.selectAll = !this.selectAll;
    if (this.selectAll) {
      this.paginatedCustomers().forEach(customer => {
        this.selectedCustomers.add(customer.id);
      });
    } else {
      this.selectedCustomers.clear();
    }
  }

  toggleCustomer(id: number) {
    if (this.selectedCustomers.has(id)) {
      this.selectedCustomers.delete(id);
      this.selectAll = false;
    } else {
      this.selectedCustomers.add(id);
      // Check if all visible items are selected
      const allSelected = this.paginatedCustomers().every(c => this.selectedCustomers.has(c.id));
      this.selectAll = allSelected;
    }
  }

  isSelected(id: number): boolean {
    return this.selectedCustomers.has(id);
  }

  getSelectedCount(): number {
    return this.selectedCustomers.size;
  }

  clearSelection() {
    this.selectedCustomers.clear();
    this.selectAll = false;
  }

  // Export methods
  exportSelected() {
    if (this.selectedCustomers.size === 0) {
      this.toastService.warning('Please select customers to export');
      return;
    }

    const selectedData = this.customers().filter(c => this.selectedCustomers.has(c.id));
    this.exportToCSV(selectedData, 'selected-customers.csv');
    this.toastService.success(`Exported ${selectedData.length} customers`);
  }

  exportAll() {
    const data = this.filteredCustomers();
    if (data.length === 0) {
      this.toastService.warning('No customers to export');
      return;
    }
    this.exportToCSV(data, 'all-customers.csv');
    this.toastService.success(`Exported ${data.length} customers`);
  }

  exportToCSV(data: Customer[], filename: string) {
    // CSV headers
    const headers = [
      'Customer Code',
      'First Name',
      'Last Name',
      'Email',
      'Phone',
      'Date of Birth',
      'Status',
      'KYC Status',
      'Credit Score',
      'Created At'
    ];

    // Convert data to CSV rows
    const csvRows = [
      headers.join(','),
      ...data.map(customer => [
        customer.customerCode,
        customer.firstName,
        customer.lastName,
        customer.email,
        customer.phone || '',
        customer.dateOfBirth || '',
        customer.status,
        customer.kycStatus,
        customer.creditScore || '',
        this.formatDate(customer.createdAt)
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
