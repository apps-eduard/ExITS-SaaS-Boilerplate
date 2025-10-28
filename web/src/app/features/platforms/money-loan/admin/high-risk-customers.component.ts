import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { Router } from '@angular/router';
import { ToastService } from '../../../../core/services/toast.service';

interface HighRiskCustomer {
  id: number;
  customerCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  kycStatus: 'pending' | 'verified' | 'rejected';
  creditScore: number;
  riskLevel: 'low' | 'medium' | 'high';
  status: 'active' | 'inactive' | 'suspended' | 'blacklisted';
  monthlyIncome: number;
  totalDebt?: number;
  activeLoans: number;
  createdAt: string;
}

@Component({
  selector: 'app-high-risk-customers',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-6">
      <!-- Header -->
      <div class="mb-6">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white">High Risk Customers</h1>
        <p class="text-sm text-gray-600 dark:text-gray-400">Monitor and manage customers with high credit risk</p>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        <!-- Total High Risk -->
        <div class="bg-gradient-to-br from-red-50 to-red-100 dark:from-red-900/20 dark:to-red-800/20 rounded-lg p-4 border border-red-200 dark:border-red-800">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-red-500 rounded-lg flex items-center justify-center">
              <span class="text-2xl">⚠️</span>
            </div>
            <div>
              <p class="text-xs text-red-600 dark:text-red-400">High Risk</p>
              <p class="text-2xl font-bold text-red-600 dark:text-red-400">{{ highRiskCount() }}</p>
            </div>
          </div>
        </div>

        <!-- Low Credit Score -->
        <div class="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 rounded-lg p-4 border border-orange-200 dark:border-orange-800">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-orange-500 rounded-lg flex items-center justify-center">
              <span class="text-2xl">📉</span>
            </div>
            <div>
              <p class="text-xs text-orange-600 dark:text-orange-400">Score &lt; 600</p>
              <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">{{ lowScoreCount() }}</p>
            </div>
          </div>
        </div>

        <!-- Active Loans -->
        <div class="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 rounded-lg p-4 border border-purple-200 dark:border-purple-800">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-purple-500 rounded-lg flex items-center justify-center">
              <span class="text-2xl">💰</span>
            </div>
            <div>
              <p class="text-xs text-purple-600 dark:text-purple-400">With Active Loans</p>
              <p class="text-2xl font-bold text-purple-600 dark:text-purple-400">{{ withActiveLoans() }}</p>
            </div>
          </div>
        </div>

        <!-- Suspended -->
        <div class="bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900/20 dark:to-gray-800/20 rounded-lg p-4 border border-gray-200 dark:border-gray-800">
          <div class="flex items-center gap-3">
            <div class="w-12 h-12 bg-gray-500 rounded-lg flex items-center justify-center">
              <span class="text-2xl">🚫</span>
            </div>
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400">Suspended</p>
              <p class="text-2xl font-bold text-gray-600 dark:text-gray-400">{{ suspendedCount() }}</p>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4 mb-6">
        <div class="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Risk Level</label>
            <select
              [(ngModel)]="filterRisk"
              (ngModelChange)="applyFilters()"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500">
              <option value="">All Risk Levels</option>
              <option value="high">High Risk Only</option>
              <option value="medium">Medium Risk</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Credit Score</label>
            <select
              [(ngModel)]="filterScore"
              (ngModelChange)="applyFilters()"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500">
              <option value="">All Scores</option>
              <option value="below-500">&lt; 500 (Critical)</option>
              <option value="500-600">500 - 600 (Poor)</option>
              <option value="600-650">600 - 650 (Fair)</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              [(ngModel)]="filterStatus"
              (ngModelChange)="applyFilters()"
              class="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white text-sm focus:ring-2 focus:ring-red-500">
              <option value="">All Status</option>
              <option value="active">Active</option>
              <option value="suspended">Suspended</option>
              <option value="blacklisted">Blacklisted</option>
            </select>
          </div>

          <div class="flex items-end">
            <button
              (click)="resetFilters()"
              class="w-full px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
              Reset Filters
            </button>
          </div>
        </div>
      </div>

      <!-- Customer Table -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700">
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
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">Risk Level</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">Credit Score</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">Active Loans</th>
                <th class="px-4 py-3 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">Status</th>
                <th class="px-4 py-3 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              @if (loading()) {
                <tr>
                  <td colspan="8" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    <div class="flex items-center justify-center gap-2">
                      <svg class="animate-spin h-5 w-5" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading customers...
                    </div>
                  </td>
                </tr>
              } @else if (filteredCustomers().length === 0) {
                <tr>
                  <td colspan="8" class="px-4 py-8 text-center text-gray-500 dark:text-gray-400">
                    No high-risk customers found with current filters
                  </td>
                </tr>
              } @else {
                @for (customer of filteredCustomers(); track customer.id) {
                  <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-3">
                        <div class="w-10 h-10 bg-gradient-to-br from-red-500 to-orange-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {{ getInitials(customer.firstName, customer.lastName) }}
                        </div>
                        <div>
                          <p class="text-sm font-medium text-gray-900 dark:text-white">{{ customer.fullName }}</p>
                          <p class="text-xs text-gray-500 dark:text-gray-400">{{ customer.email }}</p>
                        </div>
                      </div>
                    </td>
                    <td class="px-3 py-2 whitespace-nowrap">
                      <span class="text-xs font-mono text-gray-900 dark:text-white font-medium">
                        {{ customer.customerCode }}
                      </span>
                    </td>
                    <td class="px-4 py-3">
                      <p class="text-sm text-gray-900 dark:text-white">{{ customer.phone }}</p>
                    </td>
                    <td class="px-4 py-3">
                      <span [class]="getRiskLevelClass(customer.riskLevel)">
                        {{ customer.riskLevel }}
                      </span>
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex items-center gap-2">
                        <div class="flex-1 h-2 bg-gray-200 dark:bg-gray-700 rounded-full overflow-hidden w-20">
                          <div
                            [class]="getScoreBarClass(customer.creditScore)"
                            [style.width.%]="(customer.creditScore || 0) / 10">
                          </div>
                        </div>
                        <span class="text-xs font-medium text-gray-700 dark:text-gray-300">{{ customer.creditScore || 0 }}</span>
                      </div>
                    </td>
                    <td class="px-4 py-3">
                      <span class="text-sm font-medium text-gray-900 dark:text-white">{{ customer.activeLoans || 0 }}</span>
                    </td>
                    <td class="px-4 py-3">
                      <span [class]="getStatusClass(customer.status)">
                        {{ customer.status }}
                      </span>
                    </td>
                    <td class="px-4 py-3">
                      <div class="flex items-center justify-end gap-2">
                        <button
                          (click)="viewCustomer(customer.id)"
                          class="p-1.5 text-blue-600 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                          title="View Details">
                          👁️
                        </button>
                        @if (customer.status === 'active') {
                          <button
                            (click)="suspendCustomer(customer)"
                            class="p-1.5 text-orange-600 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded transition-colors"
                            title="Suspend Customer">
                            ⏸️
                          </button>
                        }
                        @if (customer.status !== 'blacklisted') {
                          <button
                            (click)="blacklistCustomer(customer)"
                            class="p-1.5 text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                            title="Blacklist Customer">
                            🚫
                          </button>
                        }
                      </div>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class HighRiskCustomersComponent {
  private http = inject(HttpClient);
  private router = inject(Router);
  private toastService = inject(ToastService);

  customers = signal<HighRiskCustomer[]>([]);
  loading = signal(true);
  filterRisk = 'high'; // Default to high risk only
  filterScore = '';
  filterStatus = '';

  highRiskCount = computed(() => this.customers().filter(c => c.riskLevel === 'high').length);
  lowScoreCount = computed(() => this.customers().filter(c => (c.creditScore || 0) < 600).length);
  withActiveLoans = computed(() => this.customers().filter(c => (c.activeLoans || 0) > 0).length);
  suspendedCount = computed(() => this.customers().filter(c => c.status === 'suspended').length);

  filteredCustomers = computed(() => {
    let result = this.customers();

    // Filter by risk level - include customers with low credit scores as high risk
    if (this.filterRisk === 'high') {
      result = result.filter(c => 
        c.riskLevel === 'high' || (c.creditScore || 0) < 600
      );
    } else if (this.filterRisk === 'medium') {
      result = result.filter(c => c.riskLevel === 'medium');
    } else if (this.filterRisk) {
      result = result.filter(c => c.riskLevel === this.filterRisk);
    }

    // Filter by credit score
    if (this.filterScore === 'below-500') {
      result = result.filter(c => (c.creditScore || 0) < 500);
    } else if (this.filterScore === '500-600') {
      result = result.filter(c => (c.creditScore || 0) >= 500 && (c.creditScore || 0) < 600);
    } else if (this.filterScore === '600-650') {
      result = result.filter(c => (c.creditScore || 0) >= 600 && (c.creditScore || 0) < 650);
    }

    // Filter by status
    if (this.filterStatus) {
      result = result.filter(c => c.status === this.filterStatus);
    }

    return result;
  });

  ngOnInit() {
    this.loadCustomers();
  }

  loadCustomers() {
    this.loading.set(true);
    this.http.get<any>('http://localhost:3000/api/money-loan/customers', {
      params: { limit: '1000' }
    }).subscribe({
      next: (response) => {
        if (response.success && response.data) {
          this.customers.set(response.data);
        }
        this.loading.set(false);
      },
      error: (error) => {
        console.error('Error loading customers:', error);
        this.toastService.error('Failed to load customers');
        this.loading.set(false);
      }
    });
  }

  applyFilters() {
    // Filters are reactive through computed signal
  }

  resetFilters() {
    this.filterRisk = 'high';
    this.filterScore = '';
    this.filterStatus = '';
  }

  getInitials(firstName: string, lastName: string): string {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  }

  getRiskLevelClass(risk: string): string {
    const classes = {
      'high': 'px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      'medium': 'px-2 py-1 text-xs font-semibold rounded bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      'low': 'px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400'
    };
    return classes[risk as keyof typeof classes] || classes.high;
  }

  getScoreBarClass(score: number): string {
    if (score < 500) return 'h-full bg-red-500';
    if (score < 600) return 'h-full bg-orange-500';
    if (score < 700) return 'h-full bg-yellow-500';
    return 'h-full bg-green-500';
  }

  getStatusClass(status: string): string {
    const classes = {
      'active': 'px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'inactive': 'px-2 py-1 text-xs font-semibold rounded bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400',
      'suspended': 'px-2 py-1 text-xs font-semibold rounded bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      'blacklisted': 'px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    };
    return classes[status as keyof typeof classes] || classes.active;
  }

  viewCustomer(id: number) {
    this.router.navigate(['/platforms/money-loan/dashboard/customers', id]);
  }

  suspendCustomer(customer: HighRiskCustomer) {
    if (confirm(`Are you sure you want to suspend ${customer.fullName}?`)) {
      this.http.put<any>(`http://localhost:3000/api/money-loan/customers/${customer.id}`, {
        status: 'suspended'
      }).subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success('Customer suspended successfully');
            this.loadCustomers();
          }
        },
        error: (error) => {
          console.error('Error suspending customer:', error);
          this.toastService.error('Failed to suspend customer');
        }
      });
    }
  }

  blacklistCustomer(customer: HighRiskCustomer) {
    if (confirm(`Are you sure you want to BLACKLIST ${customer.fullName}? This is a severe action.`)) {
      this.http.put<any>(`http://localhost:3000/api/money-loan/customers/${customer.id}`, {
        status: 'blacklisted'
      }).subscribe({
        next: (response) => {
          if (response.success) {
            this.toastService.success('Customer blacklisted');
            this.loadCustomers();
          }
        },
        error: (error) => {
          console.error('Error blacklisting customer:', error);
          this.toastService.error('Failed to blacklist customer');
        }
      });
    }
  }
}
