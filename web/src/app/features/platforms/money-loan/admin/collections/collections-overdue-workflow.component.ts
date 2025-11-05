import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../../../core/services/toast.service';

interface OverdueAccount {
  id: string;
  customerName: string;
  loanNumber: string;
  principalDue: number;
  interestDue: number;
  penaltyFees: number;
  totalDue: number;
  daysOverdue: number;
  lastPaymentDate: string;
  nextPaymentDue: string;
  contactAttempts: number;
  lastContactDate: string;
  escalationStage: 'reminder' | 'warning' | 'pre-legal' | 'legal';
  assignedCollector: string;
  phoneNumber: string;
  email: string;
}

interface ContactLog {
  id: string;
  date: string;
  type: 'call' | 'sms' | 'email' | 'visit';
  outcome: 'answered' | 'no-answer' | 'promise-to-pay' | 'dispute' | 'partial-payment';
  notes: string;
  nextAction: string;
  agentName: string;
}

interface PaymentPlan {
  id: string;
  customerName: string;
  totalAmount: number;
  installments: number;
  frequency: 'weekly' | 'bi-weekly' | 'monthly';
  startDate: string;
  status: 'active' | 'completed' | 'defaulted';
  paidInstallments: number;
}

@Component({
  selector: 'app-collections-overdue-workflow',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="p-4 md:p-6">
      <!-- Compact Header -->
      <div class="mb-4">
        <div class="flex items-center justify-between mb-1">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-red-500 rounded-lg flex items-center justify-center">
              <span class="text-lg">📈</span>
            </div>
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">Overdue Workflow</h1>
          </div>
          <div class="flex gap-2">
            <button
              (click)="exportOverdueReport()"
              class="px-3 py-1.5 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors">
              📥 Export
            </button>
            <button
              (click)="bulkContactOverdue()"
              class="px-3 py-1.5 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg transition-colors">
              📞 Bulk Contact
            </button>
          </div>
        </div>
        <p class="text-xs text-gray-600 dark:text-gray-400 ml-11">Manage overdue accounts and collection workflow</p>
      </div>

      <!-- Escalation Stats -->
      <div class="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <div class="bg-yellow-50 dark:bg-yellow-900/20 rounded-lg p-3 border border-yellow-200 dark:border-yellow-800">
          <p class="text-xs text-yellow-600 dark:text-yellow-400 mb-0.5">Reminder Stage</p>
          <p class="text-xl font-bold text-yellow-700 dark:text-yellow-300">{{ reminderStage() }}</p>
        </div>
        <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
          <p class="text-xs text-orange-600 dark:text-orange-400 mb-0.5">Warning Stage</p>
          <p class="text-xl font-bold text-orange-700 dark:text-orange-300">{{ warningStage() }}</p>
        </div>
        <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
          <p class="text-xs text-red-600 dark:text-red-400 mb-0.5">Pre-Legal</p>
          <p class="text-xl font-bold text-red-700 dark:text-red-300">{{ preLegalStage() }}</p>
        </div>
        <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
          <p class="text-xs text-purple-600 dark:text-purple-400 mb-0.5">Legal Stage</p>
          <p class="text-xl font-bold text-purple-700 dark:text-purple-300">{{ legalStage() }}</p>
        </div>
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
          <p class="text-xs text-blue-600 dark:text-blue-400 mb-0.5">Total Overdue</p>
          <p class="text-xl font-bold text-blue-700 dark:text-blue-300">₱{{ formatCurrency(totalOverdueAmount()) }}</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-3 mb-4">
        <div class="grid grid-cols-1 sm:grid-cols-4 gap-2">
          <select
            [(ngModel)]="filterStage"
            (ngModelChange)="onFilterChange()"
            class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option value="all">All Stages</option>
            <option value="reminder">Reminder</option>
            <option value="warning">Warning</option>
            <option value="pre-legal">Pre-Legal</option>
            <option value="legal">Legal</option>
          </select>

          <select
            [(ngModel)]="filterDays"
            (ngModelChange)="onFilterChange()"
            class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option value="all">All Days</option>
            <option value="1-30">1-30 days</option>
            <option value="31-60">31-60 days</option>
            <option value="61-90">61-90 days</option>
            <option value="90+">90+ days</option>
          </select>

          <select
            [(ngModel)]="filterCollector"
            (ngModelChange)="onFilterChange()"
            class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            <option value="all">All Collectors</option>
            @for (collector of collectors(); track collector.id) {
              <option [value]="collector.id">{{ collector.name }}</option>
            }
          </select>

          <input
            type="search"
            [(ngModel)]="searchQuery"
            (ngModelChange)="onFilterChange()"
            placeholder="Search customer, loan..."
            class="px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
        </div>
      </div>

      <!-- Overdue Accounts Table -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden mb-4">
        <div class="p-3 border-b border-gray-200 dark:border-gray-700">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">⚠️ Overdue Accounts</h3>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Customer</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Loan #</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Total Due</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Days</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Stage</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase hidden lg:table-cell">Collector</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase hidden xl:table-cell">Last Contact</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              @for (account of filteredAccounts(); track account.id) {
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td class="px-3 py-2">
                    <div>
                      <p class="text-gray-900 dark:text-white font-medium">{{ account.customerName }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">{{ account.phoneNumber }}</p>
                    </div>
                  </td>
                  <td class="px-3 py-2 text-gray-700 dark:text-gray-300 font-mono text-xs">{{ account.loanNumber }}</td>
                  <td class="px-3 py-2">
                    <div>
                      <p class="text-red-600 dark:text-red-400 font-semibold">₱{{ formatCurrency(account.totalDue) }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">{{ account.contactAttempts }} attempts</p>
                    </div>
                  </td>
                  <td class="px-3 py-2">
                    <span [class]="getDaysOverdueClass(account.daysOverdue)" class="px-2 py-0.5 text-xs font-semibold rounded">
                      {{ account.daysOverdue }}d
                    </span>
                  </td>
                  <td class="px-3 py-2">
                    <span [class]="getStageClass(account.escalationStage)" class="px-2 py-0.5 text-xs font-semibold rounded">
                      {{ getStageLabel(account.escalationStage) }}
                    </span>
                  </td>
                  <td class="px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hidden lg:table-cell">
                    {{ account.assignedCollector }}
                  </td>
                  <td class="px-3 py-2 text-xs text-gray-500 dark:text-gray-400 hidden xl:table-cell">
                    {{ account.lastContactDate }}
                  </td>
                  <td class="px-3 py-2">
                    <div class="flex gap-1">
                      <button
                        (click)="viewAccountDetails(account)"
                        class="px-2 py-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                        title="View Details">
                        👁️
                      </button>
                      <button
                        (click)="logContact(account)"
                        class="px-2 py-1 text-xs text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded"
                        title="Log Contact">
                        📞
                      </button>
                      <button
                        (click)="createPaymentPlan(account)"
                        class="px-2 py-1 text-xs text-purple-600 dark:text-purple-400 hover:bg-purple-50 dark:hover:bg-purple-900/20 rounded"
                        title="Payment Plan">
                        📅
                      </button>
                      <button
                        (click)="escalateAccount(account)"
                        class="px-2 py-1 text-xs text-orange-600 dark:text-orange-400 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded"
                        title="Escalate">
                        ⬆️
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>

      <!-- Account Details Modal -->
      @if (selectedAccount()) {
        <div class="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50" (click)="closeModal()">
          <div class="bg-white dark:bg-gray-800 rounded-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto" (click)="$event.stopPropagation()">
            <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
              <h3 class="text-lg font-semibold text-gray-900 dark:text-white">Account Details: {{ selectedAccount()!.customerName }}</h3>
              <button (click)="closeModal()" class="text-gray-500 hover:text-gray-700 dark:hover:text-gray-300">✕</button>
            </div>
            
            <div class="p-4">
              <!-- Account Summary -->
              <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Principal Due</p>
                  <p class="text-base font-bold text-gray-900 dark:text-white">₱{{ formatCurrency(selectedAccount()!.principalDue) }}</p>
                </div>
                <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Interest Due</p>
                  <p class="text-base font-bold text-gray-900 dark:text-white">₱{{ formatCurrency(selectedAccount()!.interestDue) }}</p>
                </div>
                <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Penalty Fees</p>
                  <p class="text-base font-bold text-red-600 dark:text-red-400">₱{{ formatCurrency(selectedAccount()!.penaltyFees) }}</p>
                </div>
                <div class="bg-gray-50 dark:bg-gray-900 rounded-lg p-3 border border-gray-200 dark:border-gray-700">
                  <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">Total Due</p>
                  <p class="text-base font-bold text-red-600 dark:text-red-400">₱{{ formatCurrency(selectedAccount()!.totalDue) }}</p>
                </div>
              </div>

              <!-- Contact History -->
              <div class="mb-4">
                <h4 class="text-sm font-semibold text-gray-900 dark:text-white mb-2">📞 Contact History</h4>
                <div class="space-y-2">
                  @for (log of contactLogs(); track log.id) {
                    <div class="flex gap-3 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                      <div class="flex-shrink-0">
                        <span [class]="getContactTypeClass(log.type)" class="w-8 h-8 rounded-full flex items-center justify-center text-xs">
                          {{ getContactTypeIcon(log.type) }}
                        </span>
                      </div>
                      <div class="flex-1">
                        <div class="flex justify-between items-start mb-1">
                          <p class="text-xs font-medium text-gray-900 dark:text-white">{{ log.type.toUpperCase() }} - {{ log.outcome }}</p>
                          <span class="text-xs text-gray-500 dark:text-gray-400">{{ log.date }}</span>
                        </div>
                        <p class="text-xs text-gray-600 dark:text-gray-400 mb-1">{{ log.notes }}</p>
                        <div class="flex justify-between items-center">
                          <p class="text-xs text-gray-500 dark:text-gray-400">Agent: {{ log.agentName }}</p>
                          <p class="text-xs text-blue-600 dark:text-blue-400">Next: {{ log.nextAction }}</p>
                        </div>
                      </div>
                    </div>
                  } @empty {
                    <p class="text-xs text-gray-500 dark:text-gray-400 text-center py-4">No contact history</p>
                  }
                </div>
              </div>

              <!-- Action Buttons -->
              <div class="flex gap-2">
                <button
                  (click)="logContact(selectedAccount()!)"
                  class="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg">
                  📞 Log New Contact
                </button>
                <button
                  (click)="createPaymentPlan(selectedAccount()!)"
                  class="flex-1 px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg">
                  📅 Create Payment Plan
                </button>
                <button
                  (click)="escalateAccount(selectedAccount()!)"
                  class="px-4 py-2 text-sm font-medium text-white bg-orange-600 hover:bg-orange-700 rounded-lg">
                  ⬆️ Escalate
                </button>
              </div>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class CollectionsOverdueWorkflowComponent {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);

  filterStage = 'all';
  filterDays = 'all';
  filterCollector = 'all';
  searchQuery = '';

  overdueAccounts = signal<OverdueAccount[]>([]);
  collectors = signal<Array<{id: string, name: string}>>([]);
  selectedAccount = signal<OverdueAccount | null>(null);
  contactLogs = signal<ContactLog[]>([]);

  reminderStage = computed(() => this.overdueAccounts().filter(a => a.escalationStage === 'reminder').length);
  warningStage = computed(() => this.overdueAccounts().filter(a => a.escalationStage === 'warning').length);
  preLegalStage = computed(() => this.overdueAccounts().filter(a => a.escalationStage === 'pre-legal').length);
  legalStage = computed(() => this.overdueAccounts().filter(a => a.escalationStage === 'legal').length);
  totalOverdueAmount = computed(() => this.overdueAccounts().reduce((sum, a) => sum + a.totalDue, 0));

  filteredAccounts = computed(() => {
    let accounts = this.overdueAccounts();
    
    if (this.filterStage !== 'all') {
      accounts = accounts.filter(a => a.escalationStage === this.filterStage);
    }
    
    if (this.filterDays !== 'all') {
      const [min, max] = this.filterDays.includes('+') 
        ? [90, 9999] 
        : this.filterDays.split('-').map(Number);
      accounts = accounts.filter(a => a.daysOverdue >= min && a.daysOverdue <= (max || 9999));
    }
    
    if (this.filterCollector !== 'all') {
      accounts = accounts.filter(a => a.assignedCollector.toLowerCase().includes(this.filterCollector));
    }
    
    if (this.searchQuery) {
      const query = this.searchQuery.toLowerCase();
      accounts = accounts.filter(a => 
        a.customerName.toLowerCase().includes(query) || 
        a.loanNumber.toLowerCase().includes(query)
      );
    }
    
    return accounts;
  });

  ngOnInit() {
    this.loadCollectors();
    this.loadOverdueAccounts();
  }

  loadCollectors() {
    this.http.get<any>('/api/collectors').subscribe({
      next: (response) => {
        const data = response.data || response || [];
        this.collectors.set(data.map((c: any) => ({
          id: c.id.toString(),
          name: `${c.firstName} ${c.lastName}`
        })));
      },
      error: (error) => {
        console.error('Error loading collectors:', error);
      }
    });
  }

  loadOverdueAccounts() {
    // Mock data - Replace with actual API call
    const mockData: OverdueAccount[] = [
      {
        id: '1',
        customerName: 'John Doe',
        loanNumber: 'LN-2024-001',
        principalDue: 25000,
        interestDue: 1875,
        penaltyFees: 500,
        totalDue: 27375,
        daysOverdue: 45,
        lastPaymentDate: '2024-09-15',
        nextPaymentDue: '2024-10-01',
        contactAttempts: 5,
        lastContactDate: '2024-10-28',
        escalationStage: 'warning',
        assignedCollector: 'John Collector',
        phoneNumber: '+63 917 123 4567',
        email: 'john@example.com'
      },
      {
        id: '2',
        customerName: 'Jane Smith',
        loanNumber: 'LN-2024-015',
        principalDue: 50000,
        interestDue: 3750,
        penaltyFees: 1500,
        totalDue: 55250,
        daysOverdue: 75,
        lastPaymentDate: '2024-08-20',
        nextPaymentDue: '2024-09-15',
        contactAttempts: 8,
        lastContactDate: '2024-11-01',
        escalationStage: 'pre-legal',
        assignedCollector: 'Jane Collector',
        phoneNumber: '+63 917 234 5678',
        email: 'jane@example.com'
      },
      {
        id: '3',
        customerName: 'Bob Johnson',
        loanNumber: 'LN-2024-023',
        principalDue: 15000,
        interestDue: 1125,
        penaltyFees: 200,
        totalDue: 16325,
        daysOverdue: 25,
        lastPaymentDate: '2024-10-05',
        nextPaymentDue: '2024-10-20',
        contactAttempts: 2,
        lastContactDate: '2024-10-30',
        escalationStage: 'reminder',
        assignedCollector: 'Mike Collector',
        phoneNumber: '+63 917 345 6789',
        email: 'bob@example.com'
      }
    ];
    
    this.overdueAccounts.set(mockData);
  }

  onFilterChange() {
    // Filters are computed automatically
  }

  viewAccountDetails(account: OverdueAccount) {
    this.selectedAccount.set(account);
    this.loadContactHistory(account.id);
  }

  loadContactHistory(accountId: string) {
    // Mock data
    const mockLogs: ContactLog[] = [
      {
        id: '1',
        date: '2024-10-28',
        type: 'call',
        outcome: 'promise-to-pay',
        notes: 'Customer promised to pay 50% by Nov 5th',
        nextAction: 'Follow up on Nov 6th',
        agentName: 'John Collector'
      },
      {
        id: '2',
        date: '2024-10-25',
        type: 'sms',
        outcome: 'no-answer',
        notes: 'SMS sent reminder',
        nextAction: 'Call on Oct 28th',
        agentName: 'System'
      }
    ];
    
    this.contactLogs.set(mockLogs);
  }

  logContact(account: OverdueAccount) {
    this.toastService.info('Opening contact log form...');
    // Implement contact logging modal
  }

  createPaymentPlan(account: OverdueAccount) {
    this.toastService.info('Opening payment plan form...');
    // Implement payment plan creation modal
  }

  escalateAccount(account: OverdueAccount) {
    if (confirm(`Escalate ${account.customerName} to next stage?`)) {
      this.toastService.success('Account escalated successfully');
      // Implement escalation logic
    }
  }

  bulkContactOverdue() {
    this.toastService.info('Starting bulk contact campaign...');
  }

  exportOverdueReport() {
    this.toastService.info('Generating overdue report...');
  }

  closeModal() {
    this.selectedAccount.set(null);
    this.contactLogs.set([]);
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  getDaysOverdueClass(days: number): string {
    if (days <= 30) return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
    if (days <= 60) return 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400';
    return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
  }

  getStageClass(stage: string): string {
    const classes: Record<string, string> = {
      reminder: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      warning: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      'pre-legal': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400',
      legal: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400'
    };
    return classes[stage] || '';
  }

  getStageLabel(stage: string): string {
    const labels: Record<string, string> = {
      reminder: 'Reminder',
      warning: 'Warning',
      'pre-legal': 'Pre-Legal',
      legal: 'Legal'
    };
    return labels[stage] || stage;
  }

  getContactTypeClass(type: string): string {
    const classes: Record<string, string> = {
      call: 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      sms: 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      email: 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      visit: 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400'
    };
    return classes[type] || '';
  }

  getContactTypeIcon(type: string): string {
    const icons: Record<string, string> = {
      call: '📞',
      sms: '💬',
      email: '📧',
      visit: '🏠'
    };
    return icons[type] || '📝';
  }
}
