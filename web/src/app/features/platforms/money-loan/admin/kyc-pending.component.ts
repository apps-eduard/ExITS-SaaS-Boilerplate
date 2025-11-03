import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../../core/services/toast.service';

interface KYCCustomer {
  id: number;
  customerCode: string;
  firstName: string;
  lastName: string;
  fullName: string;
  email: string;
  phone: string;
  kycStatus: 'pending' | 'verified' | 'rejected';
  creditScore: number;
  dateOfBirth: string;
  idType: string;
  idNumber: string;
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-kyc-pending',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 md:p-6">
      <!-- Compact Header -->
      <div class="mb-4">
        <div class="flex items-center gap-3 mb-1">
          <div class="w-8 h-8 bg-orange-500 rounded-lg flex items-center justify-center">
            <span class="text-lg">⏳</span>
          </div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">KYC Pending Review</h1>
        </div>
        <p class="text-xs text-gray-600 dark:text-gray-400 ml-11">Review and verify customer identity documents</p>
      </div>

      <!-- Compact Stats Cards -->
      <div class="grid grid-cols-2 md:grid-cols-3 gap-3 mb-4">
        <!-- Pending KYC -->
        <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
          <p class="text-xs text-orange-600 dark:text-orange-400 mb-0.5">Pending Review</p>
          <p class="text-2xl font-bold text-orange-600 dark:text-orange-400">{{ pendingCount() }}</p>
        </div>

        <!-- Verified Today -->
        <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
          <p class="text-xs text-green-600 dark:text-green-400 mb-0.5">Verified Today</p>
          <p class="text-2xl font-bold text-green-600 dark:text-green-400">{{ verifiedToday() }}</p>
        </div>

        <!-- Rejected -->
        <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
          <p class="text-xs text-red-600 dark:text-red-400 mb-0.5">Rejected</p>
          <p class="text-2xl font-bold text-red-600 dark:text-red-400">{{ rejectedCount() }}</p>
        </div>
      </div>

      <!-- Filter Tabs -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 mb-4">
        <div class="flex border-b border-gray-200 dark:border-gray-700">
          <button
            (click)="filterStatus.set('pending')"
            [class]="filterStatus() === 'pending' 
              ? 'border-b-2 border-orange-500 text-orange-600 dark:text-orange-400' 
              : 'text-gray-600 dark:text-gray-400'"
            class="px-4 py-2 text-sm font-medium transition-colors hover:text-orange-600 dark:hover:text-orange-400">
            Pending ({{ pendingCount() }})
          </button>
          <button
            (click)="filterStatus.set('verified')"
            [class]="filterStatus() === 'verified' 
              ? 'border-b-2 border-green-500 text-green-600 dark:text-green-400' 
              : 'text-gray-600 dark:text-gray-400'"
            class="px-4 py-2 text-sm font-medium transition-colors hover:text-green-600 dark:hover:text-green-400">
            Verified ({{ verifiedCount() }})
          </button>
          <button
            (click)="filterStatus.set('rejected')"
            [class]="filterStatus() === 'rejected' 
              ? 'border-b-2 border-red-500 text-red-600 dark:text-red-400' 
              : 'text-gray-600 dark:text-gray-400'"
            class="px-4 py-2 text-sm font-medium transition-colors hover:text-red-600 dark:hover:text-red-400">
            Rejected ({{ rejectedCount() }})
          </button>
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
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase hidden lg:table-cell">ID Info</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Score</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase hidden sm:table-cell">Status</th>
                <th class="px-3 py-2 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Actions</th>
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
                    No customers found with {{ filterStatus() }} KYC status
                  </td>
                </tr>
              } @else {
                @for (customer of filteredCustomers(); track customer.id) {
                  <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td class="px-3 py-2">
                      <div class="flex items-center gap-2">
                        <div class="w-8 h-8 bg-gradient-to-br from-blue-500 to-purple-600 rounded-full flex items-center justify-center text-white text-xs font-semibold flex-shrink-0">
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
                      <div class="text-xs">
                        <p class="text-gray-900 dark:text-white font-medium">{{ customer.idType?.toUpperCase() || 'N/A' }}</p>
                        <p class="text-gray-500 dark:text-gray-400 font-mono">{{ customer.idNumber || 'Not provided' }}</p>
                      </div>
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
                      <span [class]="getKycStatusClass(customer.kycStatus)" class="px-2 py-0.5 text-xs font-semibold rounded">
                        {{ customer.kycStatus }}
                      </span>
                    </td>
                    <td class="px-3 py-2">
                      <div class="flex items-center justify-end gap-1">
                        @if (customer.kycStatus === 'pending') {
                          <button
                            (click)="approveKYC(customer)"
                            class="px-2 py-1 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded transition-colors"
                            title="Approve">
                            ✓
                          </button>
                          <button
                            (click)="rejectKYC(customer)"
                            class="px-2 py-1 text-xs font-medium text-white bg-red-600 hover:bg-red-700 rounded transition-colors"
                            title="Reject">
                            ✗
                          </button>
                        } @else {
                          <button
                            (click)="viewCustomerDetails(customer)"
                            class="px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                            title="View">
                            👁️
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

    <!-- Compact Modal -->
    @if (selectedCustomer()) {
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" (click)="closeModal()">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-md w-full" (click)="$event.stopPropagation()">
          <div class="p-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">
              {{ modalAction() === 'approve' ? 'Approve KYC' : 'Reject KYC' }}
            </h3>
            
            <div class="mb-4">
              <p class="text-sm text-gray-600 dark:text-gray-400 mb-2">Customer:</p>
              <p class="text-sm font-medium text-gray-900 dark:text-white">
                {{ selectedCustomer()?.fullName }} ({{ selectedCustomer()?.customerCode }})
              </p>
            </div>

            <div class="mb-4">
              <label class="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Notes (Optional)
              </label>
              <textarea
                [(ngModel)]="kycNotes"
                rows="3"
                class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                placeholder="Add verification notes..."></textarea>
            </div>

            <div class="flex gap-2">
              <button
                (click)="closeModal()"
                class="flex-1 px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg transition-colors">
                Cancel
              </button>
              <button
                (click)="confirmAction()"
                [disabled]="processing()"
                [class]="modalAction() === 'approve' 
                  ? 'bg-green-600 hover:bg-green-700' 
                  : 'bg-red-600 hover:bg-red-700'"
                class="flex-1 px-4 py-2 text-sm font-medium text-white rounded-lg transition-colors disabled:opacity-50">
                @if (processing()) {
                  <span class="flex items-center justify-center gap-2">
                    <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                      <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                      <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    Processing...
                  </span>
                } @else {
                  {{ modalAction() === 'approve' ? 'Approve' : 'Reject' }}
                }
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class KycPendingComponent {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);

  customers = signal<KYCCustomer[]>([]);
  loading = signal(true);
  filterStatus = signal<'pending' | 'verified' | 'rejected'>('pending');
  selectedCustomer = signal<KYCCustomer | null>(null);
  modalAction = signal<'approve' | 'reject'>('approve');
  kycNotes = '';
  processing = signal(false);

  pendingCount = computed(() => this.customers().filter(c => c.kycStatus === 'pending').length);
  verifiedCount = computed(() => this.customers().filter(c => c.kycStatus === 'verified').length);
  rejectedCount = computed(() => this.customers().filter(c => c.kycStatus === 'rejected').length);
  
  verifiedToday = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.customers().filter(c => 
      c.kycStatus === 'verified' && 
      c.updatedAt?.startsWith(today)
    ).length;
  });

  filteredCustomers = computed(() => {
    return this.customers().filter(c => c.kycStatus === this.filterStatus());
  });

  ngOnInit() {
    this.loadCustomers();
  }

  loadCustomers() {
    this.loading.set(true);
    this.http.get<any>('http://localhost:3000/api/money-loan/customers', {
      params: { limit: '1000' } // Get all customers
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

  getInitials(firstName: string, lastName: string): string {
    return `${firstName?.charAt(0) || ''}${lastName?.charAt(0) || ''}`.toUpperCase();
  }

  getKycStatusClass(status: string): string {
    const classes = {
      'pending': 'px-2 py-1 text-xs font-semibold rounded bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      'verified': 'px-2 py-1 text-xs font-semibold rounded bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'rejected': 'px-2 py-1 text-xs font-semibold rounded bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    };
    return classes[status as keyof typeof classes] || classes.pending;
  }

  approveKYC(customer: KYCCustomer) {
    this.selectedCustomer.set(customer);
    this.modalAction.set('approve');
    this.kycNotes = '';
  }

  rejectKYC(customer: KYCCustomer) {
    this.selectedCustomer.set(customer);
    this.modalAction.set('reject');
    this.kycNotes = '';
  }

  closeModal() {
    this.selectedCustomer.set(null);
    this.kycNotes = '';
  }

  confirmAction() {
    const customer = this.selectedCustomer();
    if (!customer) return;

    this.processing.set(true);
    const newStatus = this.modalAction() === 'approve' ? 'verified' : 'rejected';

    this.http.put<any>(`http://localhost:3000/api/money-loan/customers/${customer.id}`, {
      kycStatus: newStatus
    }).subscribe({
      next: (response) => {
        if (response.success) {
          this.toastService.success(`KYC ${newStatus} successfully`);
          this.loadCustomers(); // Reload the list
          this.closeModal();
        }
        this.processing.set(false);
      },
      error: (error) => {
        console.error('Error updating KYC status:', error);
        this.toastService.error('Failed to update KYC status');
        this.processing.set(false);
      }
    });
  }

  viewCustomerDetails(customer: KYCCustomer) {
    // Navigate to customer details or open modal
    console.log('View customer:', customer);
    this.toastService.info('Customer details view - Coming soon');
  }
}
