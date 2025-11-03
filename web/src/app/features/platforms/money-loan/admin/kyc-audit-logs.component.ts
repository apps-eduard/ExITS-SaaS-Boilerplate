import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../../core/services/toast.service';

interface KYCAuditLog {
  id: number;
  customerId: number;
  customerName: string;
  customerCode: string;
  action: 'approved' | 'rejected' | 'revoked' | 'resubmission' | 'updated';
  previousStatus: string;
  newStatus: string;
  performedBy: string;
  performedByRole: string;
  notes: string;
  ipAddress: string;
  userAgent: string;
  createdAt: string;
}

@Component({
  selector: 'app-kyc-audit-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 md:p-6">
      <!-- Compact Header -->
      <div class="mb-4">
        <div class="flex items-center gap-3 mb-1">
          <div class="w-8 h-8 bg-blue-500 rounded-lg flex items-center justify-center">
            <span class="text-lg">📜</span>
          </div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">KYC Audit Logs</h1>
        </div>
        <p class="text-xs text-gray-600 dark:text-gray-400 ml-11">Complete history of all KYC verification actions</p>
      </div>

      <!-- Compact Stats -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
          <p class="text-xs text-green-600 dark:text-green-400 mb-0.5">Approvals</p>
          <p class="text-xl font-bold text-green-700 dark:text-green-300">{{ approvalCount() }}</p>
        </div>
        <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
          <p class="text-xs text-red-600 dark:text-red-400 mb-0.5">Rejections</p>
          <p class="text-xl font-bold text-red-700 dark:text-red-300">{{ rejectionCount() }}</p>
        </div>
        <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
          <p class="text-xs text-orange-600 dark:text-orange-400 mb-0.5">Revoked</p>
          <p class="text-xl font-bold text-orange-700 dark:text-orange-300">{{ revokedCount() }}</p>
        </div>
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
          <p class="text-xs text-blue-600 dark:text-blue-400 mb-0.5">Today</p>
          <p class="text-xl font-bold text-blue-700 dark:text-blue-300">{{ todayCount() }}</p>
        </div>
        <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
          <p class="text-xs text-purple-600 dark:text-purple-400 mb-0.5">Total Logs</p>
          <p class="text-xl font-bold text-purple-700 dark:text-purple-300">{{ logs().length }}</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 mb-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-2">
          <input
            type="text"
            [(ngModel)]="searchQuery"
            (ngModelChange)="onFilter()"
            placeholder="Search customer, user..."
            class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500">
          
          <select
            [(ngModel)]="filterAction"
            (ngModelChange)="onFilter()"
            class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option value="">All Actions</option>
            <option value="approved">Approved</option>
            <option value="rejected">Rejected</option>
            <option value="revoked">Revoked</option>
            <option value="resubmission">Resubmission</option>
          </select>

          <select
            [(ngModel)]="filterDateRange"
            (ngModelChange)="onFilter()"
            class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option value="all">All Time</option>
            <option value="today">Today</option>
            <option value="week">This Week</option>
            <option value="month">This Month</option>
          </select>

          <button
            (click)="exportLogs()"
            class="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
            📥 Export
          </button>
        </div>
      </div>

      <!-- Compact Table -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Date/Time</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Customer</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Action</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase hidden md:table-cell">Status Change</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase hidden lg:table-cell">Performed By</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase hidden xl:table-cell">Notes</th>
                <th class="px-3 py-2 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Details</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              @if (loading()) {
                <tr>
                  <td colspan="7" class="px-3 py-6 text-center text-gray-500 dark:text-gray-400">
                    <div class="flex items-center justify-center gap-2">
                      <svg class="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle class="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" stroke-width="4"></circle>
                        <path class="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Loading...
                    </div>
                  </td>
                </tr>
              } @else if (paginatedLogs().length === 0) {
                <tr>
                  <td colspan="7" class="px-3 py-6 text-center text-gray-500 dark:text-gray-400 text-sm">
                    No audit logs found
                  </td>
                </tr>
              } @else {
                @for (log of paginatedLogs(); track log.id) {
                  <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td class="px-3 py-2">
                      <div class="text-xs">
                        <p class="text-gray-900 dark:text-white font-medium">{{ formatDate(log.createdAt) }}</p>
                        <p class="text-gray-500 dark:text-gray-400">{{ formatTime(log.createdAt) }}</p>
                      </div>
                    </td>
                    <td class="px-3 py-2">
                      <div class="text-xs">
                        <p class="text-gray-900 dark:text-white font-medium">{{ log.customerName }}</p>
                        <p class="text-gray-500 dark:text-gray-400">{{ log.customerCode }}</p>
                      </div>
                    </td>
                    <td class="px-3 py-2">
                      <span [class]="getActionClass(log.action)" class="px-2 py-0.5 text-xs font-semibold rounded">
                        {{ getActionLabel(log.action) }}
                      </span>
                    </td>
                    <td class="px-3 py-2 hidden md:table-cell">
                      <div class="flex items-center gap-1 text-xs">
                        <span class="px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-700 dark:text-gray-300">
                          {{ log.previousStatus }}
                        </span>
                        <span class="text-gray-400">→</span>
                        <span [class]="getStatusClass(log.newStatus)" class="px-1.5 py-0.5 rounded">
                          {{ log.newStatus }}
                        </span>
                      </div>
                    </td>
                    <td class="px-3 py-2 hidden lg:table-cell">
                      <div class="text-xs">
                        <p class="text-gray-900 dark:text-white font-medium">{{ log.performedBy }}</p>
                        <p class="text-gray-500 dark:text-gray-400">{{ log.performedByRole }}</p>
                      </div>
                    </td>
                    <td class="px-3 py-2 hidden xl:table-cell">
                      <p class="text-xs text-gray-700 dark:text-gray-300 max-w-xs truncate">
                        {{ log.notes || '-' }}
                      </p>
                    </td>
                    <td class="px-3 py-2">
                      <button
                        (click)="viewLogDetails(log)"
                        class="px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors">
                        👁️
                      </button>
                    </td>
                  </tr>
                }
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        @if (totalPages() > 1) {
          <div class="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-3 py-2">
            <div class="flex items-center justify-between text-xs">
              <div class="text-gray-600 dark:text-gray-400">
                Showing {{ ((currentPage() - 1) * pageSize()) + 1 }} - {{ Math.min(currentPage() * pageSize(), filteredLogs().length) }} of {{ filteredLogs().length }}
              </div>
              <div class="flex gap-1">
                <button
                  (click)="previousPage()"
                  [disabled]="currentPage() === 1"
                  class="px-2 py-1 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50">
                  ‹
                </button>
                @for (page of getPageNumbers(); track page) {
                  <button
                    (click)="goToPage(page)"
                    [class]="page === currentPage() ? 'bg-blue-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'"
                    class="px-2 py-1 rounded">
                    {{ page }}
                  </button>
                }
                <button
                  (click)="nextPage()"
                  [disabled]="currentPage() === totalPages()"
                  class="px-2 py-1 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50">
                  ›
                </button>
              </div>
            </div>
          </div>
        }
      </div>
    </div>

    <!-- Log Details Modal -->
    @if (selectedLog()) {
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" (click)="closeModal()">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-2xl w-full" (click)="$event.stopPropagation()">
          <div class="p-6">
            <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-4">Audit Log Details</h3>
            
            <div class="space-y-3 text-sm">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-gray-500 dark:text-gray-400 mb-1">Customer</p>
                  <p class="text-gray-900 dark:text-white font-medium">{{ selectedLog()?.customerName }}</p>
                  <p class="text-xs text-gray-500">{{ selectedLog()?.customerCode }}</p>
                </div>
                <div>
                  <p class="text-gray-500 dark:text-gray-400 mb-1">Action</p>
                  <span [class]="getActionClass(selectedLog()!.action)" class="px-2 py-1 text-xs font-semibold rounded">
                    {{ getActionLabel(selectedLog()!.action) }}
                  </span>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-gray-500 dark:text-gray-400 mb-1">Previous Status</p>
                  <p class="text-gray-900 dark:text-white">{{ selectedLog()?.previousStatus }}</p>
                </div>
                <div>
                  <p class="text-gray-500 dark:text-gray-400 mb-1">New Status</p>
                  <span [class]="getStatusClass(selectedLog()!.newStatus)" class="px-2 py-1 text-xs font-semibold rounded">
                    {{ selectedLog()?.newStatus }}
                  </span>
                </div>
              </div>

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-gray-500 dark:text-gray-400 mb-1">Performed By</p>
                  <p class="text-gray-900 dark:text-white font-medium">{{ selectedLog()?.performedBy }}</p>
                  <p class="text-xs text-gray-500">{{ selectedLog()?.performedByRole }}</p>
                </div>
                <div>
                  <p class="text-gray-500 dark:text-gray-400 mb-1">Date & Time</p>
                  <p class="text-gray-900 dark:text-white">{{ formatDate(selectedLog()!.createdAt) }}</p>
                  <p class="text-xs text-gray-500">{{ formatTime(selectedLog()!.createdAt) }}</p>
                </div>
              </div>

              @if (selectedLog()?.notes) {
                <div>
                  <p class="text-gray-500 dark:text-gray-400 mb-1">Notes</p>
                  <p class="text-gray-900 dark:text-white">{{ selectedLog()?.notes }}</p>
                </div>
              }

              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-gray-500 dark:text-gray-400 mb-1">IP Address</p>
                  <p class="text-gray-900 dark:text-white font-mono text-xs">{{ selectedLog()?.ipAddress || 'N/A' }}</p>
                </div>
                <div>
                  <p class="text-gray-500 dark:text-gray-400 mb-1">User Agent</p>
                  <p class="text-gray-900 dark:text-white text-xs truncate">{{ selectedLog()?.userAgent || 'N/A' }}</p>
                </div>
              </div>
            </div>

            <div class="mt-6 flex justify-end">
              <button
                (click)="closeModal()"
                class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class KycAuditLogsComponent {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);

  logs = signal<KYCAuditLog[]>([]);
  loading = signal(true);
  searchQuery = '';
  filterAction = '';
  filterDateRange = 'all';
  currentPage = signal(1);
  pageSize = signal(25);
  selectedLog = signal<KYCAuditLog | null>(null);
  Math = Math;

  approvalCount = computed(() => this.logs().filter(l => l.action === 'approved').length);
  rejectionCount = computed(() => this.logs().filter(l => l.action === 'rejected').length);
  revokedCount = computed(() => this.logs().filter(l => l.action === 'revoked').length);
  
  todayCount = computed(() => {
    const today = new Date().toISOString().split('T')[0];
    return this.logs().filter(l => l.createdAt?.startsWith(today)).length;
  });

  filteredLogs = computed(() => {
    let filtered = [...this.logs()];
    
    // Search
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(l => 
        l.customerName?.toLowerCase().includes(query) ||
        l.customerCode?.toLowerCase().includes(query) ||
        l.performedBy?.toLowerCase().includes(query) ||
        l.notes?.toLowerCase().includes(query)
      );
    }
    
    // Action filter
    if (this.filterAction) {
      filtered = filtered.filter(l => l.action === this.filterAction);
    }
    
    // Date range filter
    const now = new Date();
    if (this.filterDateRange === 'today') {
      const today = now.toISOString().split('T')[0];
      filtered = filtered.filter(l => l.createdAt?.startsWith(today));
    } else if (this.filterDateRange === 'week') {
      const weekAgo = new Date(now.setDate(now.getDate() - 7));
      filtered = filtered.filter(l => new Date(l.createdAt) >= weekAgo);
    } else if (this.filterDateRange === 'month') {
      const monthAgo = new Date(now.setMonth(now.getMonth() - 1));
      filtered = filtered.filter(l => new Date(l.createdAt) >= monthAgo);
    }
    
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });

  totalPages = computed(() => Math.ceil(this.filteredLogs().length / this.pageSize()));
  
  paginatedLogs = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    const end = start + this.pageSize();
    return this.filteredLogs().slice(start, end);
  });

  ngOnInit() {
    this.loadAuditLogs();
  }

  loadAuditLogs() {
    this.loading.set(true);
    
    // Mock data - Replace with actual API call
    setTimeout(() => {
      const mockLogs: KYCAuditLog[] = [
        {
          id: 1,
          customerId: 101,
          customerName: 'John Doe',
          customerCode: 'CUST-001',
          action: 'approved',
          previousStatus: 'pending',
          newStatus: 'verified',
          performedBy: 'Admin User',
          performedByRole: 'KYC Specialist',
          notes: 'All documents verified successfully',
          ipAddress: '192.168.1.100',
          userAgent: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64)',
          createdAt: new Date().toISOString()
        },
        // Add more mock data...
      ];
      
      this.logs.set(mockLogs);
      this.loading.set(false);
    }, 500);
  }

  onFilter() {
    this.currentPage.set(1);
  }

  getActionClass(action: string): string {
    const classes = {
      'approved': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'rejected': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      'revoked': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      'resubmission': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'updated': 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400'
    };
    return classes[action as keyof typeof classes] || classes.updated;
  }

  getActionLabel(action: string): string {
    const labels = {
      'approved': 'Approved',
      'rejected': 'Rejected',
      'revoked': 'Revoked',
      'resubmission': 'Resubmission',
      'updated': 'Updated'
    };
    return labels[action as keyof typeof labels] || action;
  }

  getStatusClass(status: string): string {
    const classes = {
      'verified': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'rejected': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      'pending': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
    };
    return classes[status as keyof typeof classes] || 'bg-gray-100 text-gray-800 dark:bg-gray-900/30 dark:text-gray-400';
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

  formatTime(dateString: string): string {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  }

  viewLogDetails(log: KYCAuditLog) {
    this.selectedLog.set(log);
  }

  closeModal() {
    this.selectedLog.set(null);
  }

  exportLogs() {
    this.toastService.info('Export functionality - Coming soon');
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
    if (this.currentPage() > 1) this.currentPage.update(p => p - 1);
  }

  nextPage() {
    if (this.currentPage() < this.totalPages()) this.currentPage.update(p => p + 1);
  }

  goToPage(page: number) {
    if (page > 0 && page <= this.totalPages()) this.currentPage.set(page);
  }
}
