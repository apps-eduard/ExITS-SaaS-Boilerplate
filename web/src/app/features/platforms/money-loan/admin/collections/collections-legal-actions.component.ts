import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../../../core/services/toast.service';

interface LegalCase {
  id: string;
  caseNumber: string;
  customerName: string;
  loanNumber: string;
  amountClaimed: number;
  filingDate: string;
  courtName: string;
  nextHearingDate: string;
  status: 'filed' | 'pending' | 'in-progress' | 'settled' | 'won' | 'lost';
  attorney: string;
  notes: string;
}

@Component({
  selector: 'app-collections-legal-actions',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 md:p-6">
      <div class="mb-4">
        <div class="flex items-center gap-3 mb-1">
          <div class="w-8 h-8 bg-purple-500 rounded-lg flex items-center justify-center">
            <span class="text-lg">⚖️</span>
          </div>
          <h1 class="text-xl font-bold text-gray-900 dark:text-white">Legal Actions</h1>
        </div>
        <p class="text-xs text-gray-600 dark:text-gray-400 ml-11">Case management and legal proceedings tracker</p>
      </div>

      <div class="grid grid-cols-2 md:grid-cols-5 gap-3 mb-4">
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
          <p class="text-xs text-blue-600 dark:text-blue-400 mb-0.5">Filed Cases</p>
          <p class="text-xl font-bold text-blue-700 dark:text-blue-300">{{ filedCases() }}</p>
        </div>
        <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
          <p class="text-xs text-orange-600 dark:text-orange-400 mb-0.5">In Progress</p>
          <p class="text-xl font-bold text-orange-700 dark:text-orange-300">{{ inProgressCases() }}</p>
        </div>
        <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
          <p class="text-xs text-green-600 dark:text-green-400 mb-0.5">Won Cases</p>
          <p class="text-xl font-bold text-green-700 dark:text-green-300">{{ wonCases() }}</p>
        </div>
        <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
          <p class="text-xs text-purple-600 dark:text-purple-400 mb-0.5">Settled</p>
          <p class="text-xl font-bold text-purple-700 dark:text-purple-300">{{ settledCases() }}</p>
        </div>
        <div class="bg-red-50 dark:bg-red-900/20 rounded-lg p-3 border border-red-200 dark:border-red-800">
          <p class="text-xs text-red-600 dark:text-red-400 mb-0.5">Total Claimed</p>
          <p class="text-lg font-bold text-red-700 dark:text-red-300">₱{{ formatCurrency(totalClaimed()) }}</p>
        </div>
      </div>

      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white">📋 Legal Cases</h3>
          <button (click)="createNewCase()" class="text-xs text-blue-600 dark:text-blue-400 hover:underline">+ New Case</button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-900">
              <tr>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Case #</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Customer</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Amount</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Status</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase hidden lg:table-cell">Next Hearing</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase hidden xl:table-cell">Attorney</th>
                <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              @for (legalCase of legalCases(); track legalCase.id) {
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                  <td class="px-3 py-2 text-gray-900 dark:text-white font-mono text-xs">{{ legalCase.caseNumber }}</td>
                  <td class="px-3 py-2">
                    <p class="text-gray-900 dark:text-white font-medium">{{ legalCase.customerName }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ legalCase.loanNumber }}</p>
                  </td>
                  <td class="px-3 py-2 text-red-600 dark:text-red-400 font-semibold">₱{{ formatCurrency(legalCase.amountClaimed) }}</td>
                  <td class="px-3 py-2">
                    <span [class]="getStatusClass(legalCase.status)" class="px-2 py-0.5 text-xs font-semibold rounded">
                      {{ legalCase.status }}
                    </span>
                  </td>
                  <td class="px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hidden lg:table-cell">{{ legalCase.nextHearingDate }}</td>
                  <td class="px-3 py-2 text-xs text-gray-700 dark:text-gray-300 hidden xl:table-cell">{{ legalCase.attorney }}</td>
                  <td class="px-3 py-2">
                    <div class="flex gap-1">
                      <button (click)="viewCaseDetails(legalCase)" class="px-2 py-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded" title="View">👁️</button>
                      <button (click)="updateCase(legalCase)" class="px-2 py-1 text-xs text-green-600 dark:text-green-400 hover:bg-green-50 dark:hover:bg-green-900/20 rounded" title="Update">✏️</button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>
      </div>
    </div>
  `
})
export class CollectionsLegalActionsComponent {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);

  legalCases = signal<LegalCase[]>([
    {
      id: '1',
      caseNumber: 'CASE-2024-001',
      customerName: 'John Doe',
      loanNumber: 'LN-2024-001',
      amountClaimed: 75000,
      filingDate: '2024-09-15',
      courtName: 'Metro Manila Trial Court',
      nextHearingDate: '2024-11-15',
      status: 'in-progress',
      attorney: 'Atty. Juan dela Cruz',
      notes: 'Customer failed to respond to demand letters'
    }
  ]);

  filedCases = computed(() => this.legalCases().filter(c => c.status === 'filed').length);
  inProgressCases = computed(() => this.legalCases().filter(c => c.status === 'in-progress').length);
  wonCases = computed(() => this.legalCases().filter(c => c.status === 'won').length);
  settledCases = computed(() => this.legalCases().filter(c => c.status === 'settled').length);
  totalClaimed = computed(() => this.legalCases().reduce((sum, c) => sum + c.amountClaimed, 0));

  createNewCase() {
    this.toastService.info('Opening new case form...');
  }

  viewCaseDetails(legalCase: LegalCase) {
    this.toastService.info(`Viewing case: ${legalCase.caseNumber}`);
  }

  updateCase(legalCase: LegalCase) {
    this.toastService.info(`Updating case: ${legalCase.caseNumber}`);
  }

  formatCurrency(amount: number): string {
    return amount.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 0 });
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      'filed': 'bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400',
      'pending': 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400',
      'in-progress': 'bg-orange-100 text-orange-800 dark:bg-orange-900/30 dark:text-orange-400',
      'settled': 'bg-purple-100 text-purple-800 dark:bg-purple-900/30 dark:text-purple-400',
      'won': 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400',
      'lost': 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
    };
    return classes[status] || '';
  }
}
