import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../../core/services/toast.service';

interface WebhookLog {
  id: number;
  eventType: 'kyc.verified' | 'kyc.rejected' | 'kyc.pending' | 'kyc.updated';
  customerId: number;
  customerName: string;
  customerCode: string;
  webhookUrl: string;
  requestMethod: string;
  requestHeaders: any;
  requestBody: any;
  responseStatus: number;
  responseBody: any;
  responseTime: number;
  success: boolean;
  retryCount: number;
  errorMessage: string;
  createdAt: string;
}

@Component({
  selector: 'app-kyc-webhook-logs',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 md:p-6">
      <!-- Compact Header -->
      <div class="mb-4">
        <div class="flex items-center gap-3 mb-1">
          <div class="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
            <span class="text-lg">🔗</span>
          </div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">KYC Webhook Logs</h1>
        </div>
        <p class="text-xs text-gray-600 dark:text-gray-400 ml-11">Monitor webhook deliveries and API integrations</p>
      </div>

      <!-- Compact Stats -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
          <p class="text-xs text-green-600 dark:text-green-400 mb-0.5">Successful</p>
          <p class="text-xl font-bold text-green-700 dark:text-green-300">{{ successCount() }}</p>
        </div>
        <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
          <p class="text-xs text-red-600 dark:text-red-400 mb-0.5">Failed</p>
          <p class="text-xl font-bold text-red-700 dark:text-red-300">{{ failedCount() }}</p>
        </div>
        <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
          <p class="text-xs text-orange-600 dark:text-orange-400 mb-0.5">Retried</p>
          <p class="text-xl font-bold text-orange-700 dark:text-orange-300">{{ retriedCount() }}</p>
        </div>
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
          <p class="text-xs text-blue-600 dark:text-blue-400 mb-0.5">Avg Response</p>
          <p class="text-xl font-bold text-blue-700 dark:text-blue-300">{{ avgResponseTime() }}ms</p>
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
            placeholder="Search webhooks..."
            class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-purple-500">
          
          <select
            [(ngModel)]="filterEvent"
            (ngModelChange)="onFilter()"
            class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option value="">All Events</option>
            <option value="kyc.verified">KYC Verified</option>
            <option value="kyc.rejected">KYC Rejected</option>
            <option value="kyc.pending">KYC Pending</option>
            <option value="kyc.updated">KYC Updated</option>
          </select>

          <select
            [(ngModel)]="filterStatus"
            (ngModelChange)="onFilter()"
            class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option value="">All Status</option>
            <option value="success">Success</option>
            <option value="failed">Failed</option>
          </select>

          <button
            (click)="refreshLogs()"
            class="px-3 py-1.5 text-sm font-medium text-white bg-purple-600 hover:bg-purple-700 rounded-lg transition-colors">
            🔄 Refresh
          </button>
        </div>
      </div>

      <!-- Compact Table -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Time</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Event</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase hidden md:table-cell">Customer</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase hidden lg:table-cell">Endpoint</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Status</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase hidden sm:table-cell">Response</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase hidden xl:table-cell">Retries</th>
                <th class="px-3 py-2 text-right text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Action</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              @if (loading()) {
                <tr>
                  <td colspan="8" class="px-3 py-6 text-center text-gray-500 dark:text-gray-400">
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
                  <td colspan="8" class="px-3 py-6 text-center text-gray-500 dark:text-gray-400 text-sm">
                    No webhook logs found
                  </td>
                </tr>
              } @else {
                @for (log of paginatedLogs(); track log.id) {
                  <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                    <td class="px-3 py-2">
                      <div class="text-xs">
                        <p class="text-gray-900 dark:text-white font-medium">{{ formatTime(log.createdAt) }}</p>
                        <p class="text-gray-500 dark:text-gray-400">{{ formatDate(log.createdAt) }}</p>
                      </div>
                    </td>
                    <td class="px-3 py-2">
                      <span [class]="getEventClass(log.eventType)" class="px-2 py-0.5 text-xs font-semibold rounded">
                        {{ formatEventType(log.eventType) }}
                      </span>
                    </td>
                    <td class="px-3 py-2 hidden md:table-cell">
                      <div class="text-xs">
                        <p class="text-gray-900 dark:text-white font-medium truncate max-w-xs">{{ log.customerName }}</p>
                        <p class="text-gray-500 dark:text-gray-400">{{ log.customerCode }}</p>
                      </div>
                    </td>
                    <td class="px-3 py-2 hidden lg:table-cell">
                      <p class="text-xs text-gray-700 dark:text-gray-300 font-mono truncate max-w-xs">
                        {{ log.webhookUrl }}
                      </p>
                    </td>
                    <td class="px-3 py-2">
                      <div class="flex items-center gap-1.5">
                        <span [class]="getStatusClass(log.success, log.responseStatus)">
                          {{ log.success ? '✓' : '✗' }}
                        </span>
                        <span class="text-xs text-gray-700 dark:text-gray-300">{{ log.responseStatus }}</span>
                      </div>
                    </td>
                    <td class="px-3 py-2 hidden sm:table-cell">
                      <span class="text-xs" [class]="log.responseTime < 500 ? 'text-green-600 dark:text-green-400' : log.responseTime < 1000 ? 'text-yellow-600 dark:text-yellow-400' : 'text-red-600 dark:text-red-400'">
                        {{ log.responseTime }}ms
                      </span>
                    </td>
                    <td class="px-3 py-2 hidden xl:table-cell">
                      <div class="flex items-center gap-1">
                        @if (log.retryCount > 0) {
                          <span class="px-1.5 py-0.5 text-xs bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400 rounded">
                            {{ log.retryCount }}x
                          </span>
                        } @else {
                          <span class="text-xs text-gray-400">-</span>
                        }
                      </div>
                    </td>
                    <td class="px-3 py-2">
                      <div class="flex items-center justify-end gap-1">
                        <button
                          (click)="viewDetails(log)"
                          class="px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/30 rounded transition-colors"
                          title="View Details">
                          👁️
                        </button>
                        @if (!log.success) {
                          <button
                            (click)="retryWebhook(log)"
                            class="px-2 py-1 text-xs font-medium text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/30 rounded transition-colors"
                            title="Retry Webhook">
                            🔄
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

        <!-- Pagination -->
        @if (totalPages() > 1) {
          <div class="bg-gray-50 dark:bg-gray-900 border-t border-gray-200 dark:border-gray-700 px-3 py-2">
            <div class="flex items-center justify-between text-xs">
              <div class="text-gray-600 dark:text-gray-400">
                Showing {{ ((currentPage() - 1) * pageSize()) + 1 }} - {{ Math.min(currentPage() * pageSize(), filteredLogs().length) }} of {{ filteredLogs().length }}
              </div>
              <div class="flex gap-1">
                <button (click)="previousPage()" [disabled]="currentPage() === 1" class="px-2 py-1 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50">‹</button>
                @for (page of getPageNumbers(); track page) {
                  <button (click)="goToPage(page)" [class]="page === currentPage() ? 'bg-purple-600 text-white' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-100 dark:hover:bg-gray-700'" class="px-2 py-1 rounded">{{ page }}</button>
                }
                <button (click)="nextPage()" [disabled]="currentPage() === totalPages()" class="px-2 py-1 text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-100 dark:hover:bg-gray-700 disabled:opacity-50">›</button>
              </div>
            </div>
          </div>
        }
      </div>
    </div>

    <!-- Details Modal -->
    @if (selectedLog()) {
      <div class="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4" (click)="closeModal()">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-xl max-w-4xl w-full max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
          <div class="p-6">
            <div class="flex items-center justify-between mb-4">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Webhook Details</h3>
              <button (click)="closeModal()" class="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">✕</button>
            </div>
            
            <div class="space-y-4 text-sm">
              <div class="grid grid-cols-2 gap-4">
                <div>
                  <p class="text-gray-500 dark:text-gray-400 mb-1">Event Type</p>
                  <span [class]="getEventClass(selectedLog()!.eventType)" class="px-2 py-1 text-xs font-semibold rounded">
                    {{ formatEventType(selectedLog()!.eventType) }}
                  </span>
                </div>
                <div>
                  <p class="text-gray-500 dark:text-gray-400 mb-1">Status</p>
                  <span [class]="getStatusClass(selectedLog()!.success, selectedLog()!.responseStatus)" class="px-2 py-1 text-xs font-semibold rounded">
                    {{ selectedLog()!.success ? 'Success' : 'Failed' }} ({{ selectedLog()!.responseStatus }})
                  </span>
                </div>
              </div>

              <div>
                <p class="text-gray-500 dark:text-gray-400 mb-1">Webhook URL</p>
                <p class="text-gray-900 dark:text-white font-mono text-xs break-all">{{ selectedLog()?.webhookUrl }}</p>
              </div>

              <div class="grid grid-cols-3 gap-4">
                <div>
                  <p class="text-gray-500 dark:text-gray-400 mb-1">Method</p>
                  <p class="text-gray-900 dark:text-white font-semibold">{{ selectedLog()?.requestMethod }}</p>
                </div>
                <div>
                  <p class="text-gray-500 dark:text-gray-400 mb-1">Response Time</p>
                  <p class="text-gray-900 dark:text-white">{{ selectedLog()?.responseTime }}ms</p>
                </div>
                <div>
                  <p class="text-gray-500 dark:text-gray-400 mb-1">Retry Count</p>
                  <p class="text-gray-900 dark:text-white">{{ selectedLog()?.retryCount || 0 }}</p>
                </div>
              </div>

              @if (selectedLog()?.errorMessage) {
                <div>
                  <p class="text-gray-500 dark:text-gray-400 mb-1">Error Message</p>
                  <p class="text-red-600 dark:text-red-400 text-xs">{{ selectedLog()?.errorMessage }}</p>
                </div>
              }

              <div>
                <p class="text-gray-500 dark:text-gray-400 mb-2">Request Body</p>
                <pre class="bg-gray-50 dark:bg-gray-900 p-3 rounded text-xs overflow-x-auto">{{ formatJSON(selectedLog()?.requestBody) }}</pre>
              </div>

              <div>
                <p class="text-gray-500 dark:text-gray-400 mb-2">Response Body</p>
                <pre class="bg-gray-50 dark:bg-gray-900 p-3 rounded text-xs overflow-x-auto">{{ formatJSON(selectedLog()?.responseBody) }}</pre>
              </div>
            </div>

            <div class="mt-6 flex justify-end gap-2">
              @if (!selectedLog()?.success) {
                <button (click)="retryWebhook(selectedLog()!); closeModal()" class="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg">
                  🔄 Retry
                </button>
              }
              <button (click)="closeModal()" class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-lg">
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    }
  `
})
export class KycWebhookLogsComponent {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);

  logs = signal<WebhookLog[]>([]);
  loading = signal(true);
  searchQuery = '';
  filterEvent = '';
  filterStatus = '';
  currentPage = signal(1);
  pageSize = signal(25);
  selectedLog = signal<WebhookLog | null>(null);
  Math = Math;

  successCount = computed(() => this.logs().filter(l => l.success).length);
  failedCount = computed(() => this.logs().filter(l => !l.success).length);
  retriedCount = computed(() => this.logs().filter(l => l.retryCount > 0).length);
  avgResponseTime = computed(() => {
    const times = this.logs().map(l => l.responseTime);
    if (times.length === 0) return 0;
    return Math.round(times.reduce((a, b) => a + b, 0) / times.length);
  });

  filteredLogs = computed(() => {
    let filtered = [...this.logs()];
    
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(l => 
        l.customerName?.toLowerCase().includes(query) ||
        l.customerCode?.toLowerCase().includes(query) ||
        l.webhookUrl?.toLowerCase().includes(query)
      );
    }
    
    if (this.filterEvent) {
      filtered = filtered.filter(l => l.eventType === this.filterEvent);
    }
    
    if (this.filterStatus === 'success') {
      filtered = filtered.filter(l => l.success);
    } else if (this.filterStatus === 'failed') {
      filtered = filtered.filter(l => !l.success);
    }
    
    return filtered.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
  });

  totalPages = computed(() => Math.ceil(this.filteredLogs().length / this.pageSize()));
  paginatedLogs = computed(() => {
    const start = (this.currentPage() - 1) * this.pageSize();
    return this.filteredLogs().slice(start, start + this.pageSize());
  });

  ngOnInit() {
    this.loadWebhookLogs();
  }

  loadWebhookLogs() {
    this.loading.set(true);
    setTimeout(() => {
      const mockLogs: WebhookLog[] = [
        {
          id: 1,
          eventType: 'kyc.verified',
          customerId: 101,
          customerName: 'John Doe',
          customerCode: 'CUST-001',
          webhookUrl: 'https://api.example.com/webhooks/kyc',
          requestMethod: 'POST',
          requestHeaders: { 'Content-Type': 'application/json' },
          requestBody: { event: 'kyc.verified', customerId: 101 },
          responseStatus: 200,
          responseBody: { success: true },
          responseTime: 245,
          success: true,
          retryCount: 0,
          errorMessage: '',
          createdAt: new Date().toISOString()
        }
      ];
      this.logs.set(mockLogs);
      this.loading.set(false);
    }, 500);
  }

  refreshLogs() {
    this.loadWebhookLogs();
    this.toastService.success('Logs refreshed');
  }

  onFilter() {
    this.currentPage.set(1);
  }

  getEventClass(event: string): string {
    const classes = {
      'kyc.verified': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'kyc.rejected': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      'kyc.pending': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      'kyc.updated': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400'
    };
    return classes[event as keyof typeof classes] || 'bg-gray-100 text-gray-800';
  }

  formatEventType(event: string): string {
    return event.replace('kyc.', 'KYC ').replace(/\b\w/g, l => l.toUpperCase());
  }

  getStatusClass(success: boolean, status: number): string {
    if (success && status >= 200 && status < 300) {
      return 'text-green-600 dark:text-green-400 font-semibold';
    }
    return 'text-red-600 dark:text-red-400 font-semibold';
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  }

  formatTime(dateString: string): string {
    return new Date(dateString).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
  }

  formatJSON(obj: any): string {
    return JSON.stringify(obj, null, 2);
  }

  viewDetails(log: WebhookLog) {
    this.selectedLog.set(log);
  }

  closeModal() {
    this.selectedLog.set(null);
  }

  retryWebhook(log: WebhookLog) {
    this.toastService.info('Retrying webhook...');
    // Implement retry logic
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
