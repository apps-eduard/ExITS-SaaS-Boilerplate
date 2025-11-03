import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../../core/services/toast.service';
import { RouterLink } from '@angular/router';

interface RejectedCustomer {
  id: number;
  customerCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  kycStatus: string;
  creditScore: number;
  idType: string;
  idNumber: string;
  rejectedDate: string;
  rejectedBy: string;
  rejectionReason: string;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-kyc-rejected',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="p-4 md:p-6">
      <!-- Compact Header -->
      <div class="mb-4">
        <div class="flex items-center gap-3 mb-1">
          <div class="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
            <span class="text-lg">❌</span>
          </div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">KYC Rejected Customers</h1>
        </div>
        <p class="text-xs text-gray-600 dark:text-gray-400 ml-11">Review rejected applications and manage resubmissions</p>
      </div>

      <!-- Compact Stats Row -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
          <p class="text-xs text-red-600 dark:text-red-400 mb-0.5">Total Rejected</p>
          <p class="text-xl font-bold text-red-700 dark:text-red-300">{{ totalRejected() }}</p>
        </div>
        <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
          <p class="text-xs text-orange-600 dark:text-orange-400 mb-0.5">This Month</p>
          <p class="text-xl font-bold text-orange-700 dark:text-orange-300">{{ rejectedThisMonth() }}</p>
        </div>
        <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800">
          <p class="text-xs text-yellow-600 dark:text-yellow-400 mb-0.5">Can Reapply</p>
          <p class="text-xl font-bold text-yellow-700 dark:text-yellow-300">{{ canReapply() }}</p>
        </div>
        <div class="bg-gray-50 dark:bg-gray-900/20 rounded-lg p-3 border border-gray-200 dark:border-gray-800">
          <p class="text-xs text-gray-600 dark:text-gray-400 mb-0.5">Avg Score</p>
          <p class="text-xl font-bold text-gray-700 dark:text-gray-300">{{ averageScore() }}</p>
        </div>
      </div>

      <!-- Compact Search & Filter -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 mb-4">
        <div class="flex flex-col sm:flex-row gap-2">
          <div class="flex-1">
            <input
              type="text"
              [(ngModel)]="searchQuery"
              (ngModelChange)="onSearch()"
              placeholder="Search rejected customers..."
              class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500 focus:border-transparent">
          </div>
          <select
            [(ngModel)]="sortBy"
            (ngModelChange)="onSort()"
            class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-red-500">
            <option value="recent">Recently Rejected</option>
            <option value="name">Name A-Z</option>
            <option value="score">Credit Score</option>
          </select>
        </div>
      </div>

      <!-- Compact Table -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Customer</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase hidden md:table-cell">Contact</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase hidden lg:table-cell">Reason</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Score</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase hidden sm:table-cell">Rejected</th>
                <th class="px-3 py-2 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              @if (loading()) {
                <tr>
                  <td colspan="6" class="px-3 py-6 text-center text-gray-500 dark:text-gray-400">
                    <div class="flex items-center justify-center gap-2">
                      <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading...
                    </div>
                  </td>
                </tr>
              } @else if (filteredCustomers().length === 0) {
                <tr>
                  <td colspan="6" class="px-3 py-6 text-center text-gray-500 dark:text-gray-400 text-sm">
                    No rejected customers found
                  </td>
                </tr>
              } @else {
                @for (customer of paginatedCustomers(); track customer.id) {
                  <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td class="px-3 py-2">
                      <div class="flex items-center gap-2">
                        <div class="w-8 h-8 bg-gradient-to-br from-red-500 to-pink-600 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
                          {{ getInitials(customer.firstName, customer.lastName) }}
                        </div>
                        <div class="min-w-0">
                          <p class="text-sm font-medium text-gray-900 dark:text-white truncate">{{ customer.fullName }}</p>
                          <p class="text-xs text-gray-500 dark:text-gray-400">{{ customer.customerCode }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-3 py-2 hidden md:table-cell">
                      <div class="text-xs">
                        <p class="text-gray-900 dark:text-white truncate">{{ customer.email }}</p>
                        <p class="text-gray-500 dark:text-gray-400">{{ customer.phone }}</p>
                      </div>
                    </td>
                    <td class="px-3 py-2 hidden lg:table-cell">
                      <p class="text-xs text-gray-700 dark:text-gray-300 max-w-xs truncate">
                        {{ customer.rejectionReason || 'No reason provided' }}
                      </p>
                    </td>
                    <td class="px-3 py-2">
                      <div class="flex items-center gap-1.5">
                        <div class="w-12 h-1.5 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden">
                          <div
                            class="h-full bg-gradient-to-r from-red-500 via-yellow-500 to-green-500"
                            [style.width.%]="(customer.creditScore || 0) / 10">
                          </div>
                        </div>
                        <span class="text-xs font-semibold text-gray-700 dark:text-gray-300">{{ customer.creditScore || 0 }}</span>
                      </div>
                    </td>
                    <td class="px-3 py-2 hidden sm:table-cell">
                      <div class="text-xs">
                        <p class="text-gray-900 dark:text-white">{{ formatDate(customer.updatedAt) }}</p>
                        @if (customer.rejectedBy) {
                          <p class="text-gray-500 dark:text-gray-400">by {{ customer.rejectedBy }}</p>
                        }
                      </div>
                    </td>
                    <td class="px-3 py-2">
                      <div class="flex items-center justify-end gap-1">
                        <button
                          (click)="viewDetails(customer)"
                          class="px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                          title="View Details">
                          👁️
                        </button>
                        <button
                          (click)="allowResubmission(customer)"
                          class="px-2 py-1 text-xs font-medium text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/30 rounded transition-colors"
                          title="Allow Resubmission">
                          🔄
                        </button>
                        <button
                          (click)="deleteCustomer(customer)"
                          class="px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                          title="Delete Customer">
                          🗑️
                        </button>
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>

        <!-- Compact Pagination -->
        @if (totalPages() > 1) {
          <div class="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-3 py-2">
            <div class="flex items-center justify-between text-xs">
              <div class="text-gray-600 dark:text-gray-400">
                Showing {{ ((currentPage() - 1) * pageSize()) + 1 }} - {{ Math.min(currentPage() * pageSize(), filteredCustomers().length) }} of {{ filteredCustomers().length }}
              </div>
              <div class="flex gap-1">
                <button
                  (click)="previousPage()"
                  [disabled]="currentPage() === 1"
                  class="px-2 py-1 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                  ‹
                </button>
                @for (page of getPageNumbers(); track page) {
                  <button
                    (click)="goToPage(page)"
                    [class]="page === currentPage() 
                      ? 'bg-red-600 text-white' 
                      : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'"
                    class="px-2 py-1 rounded transition-colors">
                    {{ page }}
                  </button>
                }
                <button
                  (click)="nextPage()"
                  [disabled]="currentPage() === totalPages()"
                  class="px-2 py-1 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed">
                  ›
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    </div>
  `
})
export class KycRejectedComponent {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);

  customers = signal<RejectedCustomer[]>([]);
  loading = signal(true);
  searchQuery = '';
  sortBy = 'recent';
  currentPage = signal(1);
  pageSize = signal(20);
  Math = Math;

  totalRejected = computed(() => this.customers().length);
  
  rejectedThisMonth = computed(() => {
    const now = new Date();
    const firstDayOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    return this.customers().filter(c => 
      new Date(c.updatedAt) >= firstDayOfMonth
    ).length;
  });
  
  canReapply = computed(() => {
    // Customers who can reapply (rejected more than 30 days ago)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    return this.customers().filter(c => 
      new Date(c.updatedAt) < thirtyDaysAgo
    ).length;
  });
  
  averageScore = computed(() => {
    const scores = this.customers().map(c => c.creditScore || 0);
    if (scores.length === 0) return 0;
    return Math.round(scores.reduce((a, b) => a + b, 0) / scores.length);
  });

  filteredCustomers = computed(() => {
    let filtered = [...this.customers()];
    
    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(c => 
        c.fullName?.toLowerCase().includes(query) ||
        c.customerCode?.toLowerCase().includes(query) ||
        c.email?.toLowerCase().includes(query) ||
        c.phone?.includes(query) ||
        c.rejectionReason?.toLowerCase().includes(query)
      );
    }
    
    // Sort
    if (this.sortBy === 'recent') {
      filtered.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
    } else if (this.sortBy === 'name') {
      filtered.sort((a, b) => (a.fullName || '').localeCompare(b.fullName || ''));
    } else if (this.sortBy === 'score') {
      filtered.sort((a, b) => (b.creditScore || 0) - (a.creditScore || 0));
    }
    
    return filtered;
  });

  totalPages = computed(() => Math.ceil(this.filteredCustomers().length / this.pageSize()));
  
  paginatedCustomers = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredCustomers().slice(start, end);
  });

  ngOnInit() {
    this.loadCustomers();
  }

  loadCustomers() {
    this.loading.set(true);
    this.http.get<any>('http://localhost:3000/api/money-loan/customers', {
      params: { 
        limit: '1000',
        kycStatus: 'rejected'
      }
    }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.customers.set(response.data);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading rejected customers:', error);
        this.toastService.error('Failed to load rejected customers');
        this.loading.set(false);
      }
    });
  }

  onSearch() {
    this.currentPage.set(1);
  }

  onSort() {
    this.currentPage.set(1);
  }

  getInitials(firstName: string, lastName: string): string {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  }

  formatDate(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { 
      month: 'short', 
      day: 'numeric',
      year: 'numeric'
    });
  }

  viewDetails(customer: RejectedCustomer) {
    console.log('View customer:', customer);
    this.toastService.info('Customer details - Coming soon');
  }

  allowResubmission(customer: RejectedCustomer) {
    if (confirm(`Allow ${customer.fullName} to resubmit KYC documents?`)) {
      this.http.put<any>(`http://localhost:3000/api/money-loan/customers/${customer.id}`, {
        kycStatus: 'pending'
      }).subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success('Customer can now resubmit KYC');
            this.loadCustomers();
          }
        },
        error: (error) => {
          console.error('Error updating status:', error);
          this.toastService.error('Failed to update status');
        }
      });
    }
  }

  deleteCustomer(customer: RejectedCustomer) {
    if (confirm(`Permanently delete ${customer.fullName}? This action cannot be undone.`)) {
      this.http.delete<any>(`http://localhost:3000/api/money-loan/customers/${customer.id}`).subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success('Customer deleted successfully');
            this.loadCustomers();
          }
        },
        error: (error) => {
          console.error('Error deleting customer:', error);
          this.toastService.error('Failed to delete customer');
        }
      });
    }
  }

  getPageNumbers(): number[] {
    const total = this.totalPages();
    const current = this.currentPage();
    const pages: number[] = [];
    
    if (total <= 7) {
      for (let i = 1; i <= total; i++) pages.push(i);
    } else {
      if (current <= 4) {
        for (let i = 1; i <= 5; i++) pages.push(i);
        pages.push(-1, total);
      } else if (current >= total - 3) {
        pages.push(1, -1);
        for (let i = total - 4; i <= total; i++) pages.push(i);
      } else {
        pages.push(1, -1, current - 1, current, current + 1, -1, total);
      }
    }
    
    return pages;
  }

  previousPage() {
    if (this.currentPage() > 1) {
      this.currentPage.update(p => p - 1);
    }
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) {
      this.currentPage.update(p => p + 1);
    }
  }

  goToPage(page: number) {
    if (page > 0 && page <= this.totalPages()) {
      this.currentPage.set(page);
    }
  }
}
