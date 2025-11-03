import { Component, signal, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../../../core/services/toast.service';

interface ExportColumn {
  key: string;
  label: string;
  selected: boolean;
  category: string;
}

interface ExportTemplate {
  id: string;
  name: string;
  dataType: string;
  format: string;
  columns: string[];
}

@Component({
  selector: 'app-reports-export',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 md:p-6">
      <!-- Compact Header -->
      <div class="mb-4">
        <div class="flex items-center justify-between mb-1">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-green-500 rounded-lg flex items-center justify-center">
              <span class="text-lg">📥</span>
            </div>
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">Data Export</h1>
          </div>
        </div>
        <p class="text-xs text-gray-600 dark:text-gray-400 ml-11">Export data in CSV, Excel, or PDF formats</p>
      </div>

      <!-- Export Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
          <p class="text-xs text-blue-600 dark:text-blue-400 mb-0.5">Total Exports</p>
          <p class="text-xl font-bold text-blue-700 dark:text-blue-300">{{ totalExports() }}</p>
        </div>
        <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
          <p class="text-xs text-green-600 dark:text-green-400 mb-0.5">This Month</p>
          <p class="text-xl font-bold text-green-700 dark:text-green-300">{{ monthlyExports() }}</p>
        </div>
        <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
          <p class="text-xs text-purple-600 dark:text-purple-400 mb-0.5">Saved Templates</p>
          <p class="text-xl font-bold text-purple-700 dark:text-purple-300">{{ savedTemplates().length }}</p>
        </div>
        <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
          <p class="text-xs text-orange-600 dark:text-orange-400 mb-0.5">Last Export</p>
          <p class="text-sm font-bold text-orange-700 dark:text-orange-300">2 hours ago</p>
        </div>
      </div>

      <!-- Export Configuration -->
      <div class="grid grid-cols-1 lg:grid-cols-3 gap-4">
        <!-- Export Options Panel -->
        <div class="lg:col-span-2 bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">🎯 Export Configuration</h3>
          
          <!-- Data Type Selection -->
          <div class="mb-4">
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Data Type</label>
            <select
              [(ngModel)]="selectedDataType"
              (ngModelChange)="onDataTypeChange()"
              class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
              <option value="customers">Customers</option>
              <option value="loans">Loan Applications</option>
              <option value="payments">Payments & Collections</option>
              <option value="schedules">Payment Schedules</option>
              <option value="transactions">Transaction History</option>
              <option value="arrears">Arrears Report</option>
              <option value="tax">Tax Summary</option>
              <option value="financial">Financial Report</option>
            </select>
          </div>

          <!-- Export Format -->
          <div class="mb-4">
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Export Format</label>
            <div class="grid grid-cols-3 gap-2">
              <button
                (click)="selectedFormat = 'csv'"
                [class.bg-blue-600]="selectedFormat === 'csv'"
                [class.text-white]="selectedFormat === 'csv'"
                [class.bg-gray-100]="selectedFormat !== 'csv'"
                [class.text-gray-700]="selectedFormat !== 'csv'"
                class="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white transition-colors">
                📄 CSV
              </button>
              <button
                (click)="selectedFormat = 'excel'"
                [class.bg-blue-600]="selectedFormat === 'excel'"
                [class.text-white]="selectedFormat === 'excel'"
                [class.bg-gray-100]="selectedFormat !== 'excel'"
                [class.text-gray-700]="selectedFormat !== 'excel'"
                class="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white transition-colors">
                📊 Excel
              </button>
              <button
                (click)="selectedFormat = 'pdf'"
                [class.bg-blue-600]="selectedFormat === 'pdf'"
                [class.text-white]="selectedFormat === 'pdf'"
                [class.bg-gray-100]="selectedFormat !== 'pdf'"
                [class.text-gray-700]="selectedFormat !== 'pdf'"
                class="px-3 py-2 text-sm font-medium rounded-lg border border-gray-300 dark:border-gray-600 dark:bg-gray-700 dark:text-white transition-colors">
                📑 PDF
              </button>
            </div>
          </div>

          <!-- Date Range -->
          <div class="grid grid-cols-2 gap-3 mb-4">
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Start Date</label>
              <input
                type="date"
                [(ngModel)]="startDate"
                class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            </div>
            <div>
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">End Date</label>
              <input
                type="date"
                [(ngModel)]="endDate"
                class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
            </div>
          </div>

          <!-- Column Selection -->
          <div class="mb-4">
            <div class="flex justify-between items-center mb-2">
              <label class="block text-xs font-medium text-gray-700 dark:text-gray-300">Select Columns</label>
              <div class="flex gap-2">
                <button
                  (click)="selectAllColumns()"
                  class="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                  Select All
                </button>
                <button
                  (click)="deselectAllColumns()"
                  class="text-xs text-red-600 dark:text-red-400 hover:underline">
                  Clear All
                </button>
              </div>
            </div>
            
            <div class="grid grid-cols-2 sm:grid-cols-3 gap-2 max-h-64 overflow-y-auto p-2 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
              @for (column of availableColumns(); track column.key) {
                <label class="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-2 rounded">
                  <input
                    type="checkbox"
                    [(ngModel)]="column.selected"
                    class="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                  <span>{{ column.label }}</span>
                </label>
              }
            </div>
            <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">
              {{ getSelectedColumnsCount() }} of {{ availableColumns().length }} columns selected
            </p>
          </div>

          <!-- Export Options -->
          <div class="mb-4 space-y-2">
            <label class="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                [(ngModel)]="includeHeaders"
                class="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
              <span>Include column headers</span>
            </label>
            <label class="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                [(ngModel)]="includeTimestamp"
                class="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
              <span>Include export timestamp</span>
            </label>
            <label class="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer">
              <input
                type="checkbox"
                [(ngModel)]="compressFile"
                class="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
              <span>Compress file (ZIP)</span>
            </label>
          </div>

          <!-- Action Buttons -->
          <div class="flex gap-2">
            <button
              (click)="exportData()"
              [disabled]="exporting() || getSelectedColumnsCount() === 0"
              class="flex-1 px-4 py-2 text-sm font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
              {{ exporting() ? '⏳ Exporting...' : '📥 Export Now' }}
            </button>
            <button
              (click)="saveTemplate()"
              [disabled]="getSelectedColumnsCount() === 0"
              class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50">
              💾 Save Template
            </button>
          </div>
        </div>

        <!-- Templates & History Panel -->
        <div class="space-y-4">
          <!-- Saved Templates -->
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">📋 Saved Templates</h3>
            <div class="space-y-2">
              @for (template of savedTemplates(); track template.id) {
                <div class="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div class="flex-1 min-w-0">
                    <p class="text-xs font-medium text-gray-900 dark:text-white truncate">{{ template.name }}</p>
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ template.dataType }} • {{ template.format.toUpperCase() }}</p>
                  </div>
                  <div class="flex gap-1">
                    <button
                      (click)="loadTemplate(template)"
                      class="px-2 py-1 text-xs text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded"
                      title="Load Template">
                      📂
                    </button>
                    <button
                      (click)="deleteTemplate(template.id)"
                      class="px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded"
                      title="Delete Template">
                      🗑️
                    </button>
                  </div>
                </div>
              } @empty {
                <p class="text-xs text-gray-500 dark:text-gray-400 text-center py-4">No saved templates</p>
              }
            </div>
          </div>

          <!-- Quick Export Presets -->
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">⚡ Quick Export</h3>
            <div class="space-y-2">
              <button
                (click)="quickExport('all-customers')"
                class="w-full flex items-center gap-2 px-3 py-2 text-xs text-left text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors">
                <span>👥</span>
                <span>All Customers</span>
              </button>
              <button
                (click)="quickExport('active-loans')"
                class="w-full flex items-center gap-2 px-3 py-2 text-xs text-left text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors">
                <span>💰</span>
                <span>Active Loans</span>
              </button>
              <button
                (click)="quickExport('overdue-accounts')"
                class="w-full flex items-center gap-2 px-3 py-2 text-xs text-left text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors">
                <span>⚠️</span>
                <span>Overdue Accounts</span>
              </button>
              <button
                (click)="quickExport('monthly-summary')"
                class="w-full flex items-center gap-2 px-3 py-2 text-xs text-left text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors">
                <span>📊</span>
                <span>Monthly Summary</span>
              </button>
            </div>
          </div>

          <!-- Export History -->
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">🕐 Recent Exports</h3>
            <div class="space-y-2">
              @for (history of exportHistory(); track history.id) {
                <div class="p-2 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div class="flex justify-between items-start">
                    <div>
                      <p class="text-xs font-medium text-gray-900 dark:text-white">{{ history.type }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400">{{ history.timestamp }}</p>
                    </div>
                    <span class="px-2 py-0.5 text-xs font-semibold bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400 rounded">
                      {{ history.format }}
                    </span>
                  </div>
                </div>
              } @empty {
                <p class="text-xs text-gray-500 dark:text-gray-400 text-center py-4">No recent exports</p>
              }
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ReportsExportComponent {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);

  selectedDataType = 'customers';
  selectedFormat = 'csv';
  startDate = this.getDefaultStartDate();
  endDate = this.getDefaultEndDate();
  
  includeHeaders = true;
  includeTimestamp = true;
  compressFile = false;
  
  exporting = signal(false);
  totalExports = signal(247);
  monthlyExports = signal(38);
  
  availableColumns = signal<ExportColumn[]>([]);
  savedTemplates = signal<ExportTemplate[]>([
    {
      id: '1',
      name: 'Customer Full Details',
      dataType: 'customers',
      format: 'excel',
      columns: ['name', 'email', 'phone', 'kycStatus', 'accountStatus', 'joinDate']
    },
    {
      id: '2',
      name: 'Active Loans Report',
      dataType: 'loans',
      format: 'pdf',
      columns: ['loanNumber', 'customerName', 'amount', 'status', 'disbursementDate']
    },
    {
      id: '3',
      name: 'Monthly Collections',
      dataType: 'payments',
      format: 'csv',
      columns: ['date', 'customer', 'loanNumber', 'amount', 'method']
    }
  ]);
  
  exportHistory = signal([
    { id: '1', type: 'Customers Export', format: 'CSV', timestamp: '2 hours ago' },
    { id: '2', type: 'Loan Report', format: 'PDF', timestamp: '5 hours ago' },
    { id: '3', type: 'Payment History', format: 'Excel', timestamp: 'Yesterday' }
  ]);

  ngOnInit() {
    this.loadColumnsForDataType();
  }

  getDefaultStartDate(): string {
    const date = new Date();
    date.setMonth(date.getMonth() - 1);
    return date.toISOString().split('T')[0];
  }

  getDefaultEndDate(): string {
    return new Date().toISOString().split('T')[0];
  }

  onDataTypeChange() {
    this.loadColumnsForDataType();
  }

  loadColumnsForDataType() {
    const columnSets: Record<string, ExportColumn[]> = {
      customers: [
        { key: 'id', label: 'Customer ID', selected: true, category: 'basic' },
        { key: 'name', label: 'Full Name', selected: true, category: 'basic' },
        { key: 'email', label: 'Email', selected: true, category: 'basic' },
        { key: 'phone', label: 'Phone Number', selected: true, category: 'basic' },
        { key: 'kycStatus', label: 'KYC Status', selected: true, category: 'status' },
        { key: 'accountStatus', label: 'Account Status', selected: false, category: 'status' },
        { key: 'joinDate', label: 'Join Date', selected: false, category: 'dates' },
        { key: 'lastLogin', label: 'Last Login', selected: false, category: 'dates' },
        { key: 'address', label: 'Address', selected: false, category: 'details' },
        { key: 'city', label: 'City', selected: false, category: 'details' },
        { key: 'totalLoans', label: 'Total Loans', selected: false, category: 'stats' },
        { key: 'activeLoans', label: 'Active Loans', selected: false, category: 'stats' }
      ],
      loans: [
        { key: 'loanNumber', label: 'Loan Number', selected: true, category: 'basic' },
        { key: 'customerName', label: 'Customer Name', selected: true, category: 'basic' },
        { key: 'amount', label: 'Loan Amount', selected: true, category: 'financial' },
        { key: 'interestRate', label: 'Interest Rate', selected: true, category: 'financial' },
        { key: 'tenure', label: 'Tenure (months)', selected: true, category: 'terms' },
        { key: 'status', label: 'Status', selected: true, category: 'status' },
        { key: 'disbursementDate', label: 'Disbursement Date', selected: false, category: 'dates' },
        { key: 'dueDate', label: 'Due Date', selected: false, category: 'dates' },
        { key: 'outstanding', label: 'Outstanding', selected: false, category: 'financial' },
        { key: 'paid', label: 'Paid Amount', selected: false, category: 'financial' }
      ],
      payments: [
        { key: 'date', label: 'Payment Date', selected: true, category: 'basic' },
        { key: 'customer', label: 'Customer', selected: true, category: 'basic' },
        { key: 'loanNumber', label: 'Loan Number', selected: true, category: 'basic' },
        { key: 'amount', label: 'Amount', selected: true, category: 'financial' },
        { key: 'principal', label: 'Principal', selected: false, category: 'financial' },
        { key: 'interest', label: 'Interest', selected: false, category: 'financial' },
        { key: 'method', label: 'Payment Method', selected: true, category: 'details' },
        { key: 'reference', label: 'Reference Number', selected: false, category: 'details' }
      ]
    };

    this.availableColumns.set(columnSets[this.selectedDataType] || columnSets['customers']);
  }

  selectAllColumns() {
    this.availableColumns.update(columns => 
      columns.map(col => ({ ...col, selected: true }))
    );
  }

  deselectAllColumns() {
    this.availableColumns.update(columns => 
      columns.map(col => ({ ...col, selected: false }))
    );
  }

  getSelectedColumnsCount(): number {
    return this.availableColumns().filter(col => col.selected).length;
  }

  exportData() {
    const selectedColumns = this.availableColumns().filter(col => col.selected);
    
    if (selectedColumns.length === 0) {
      this.toastService.error('Please select at least one column to export');
      return;
    }

    this.exporting.set(true);
    
    // Simulate export process
    setTimeout(() => {
      this.toastService.success(`Export completed: ${this.selectedDataType}.${this.selectedFormat}`);
      this.exporting.set(false);
      this.monthlyExports.update(n => n + 1);
      this.totalExports.update(n => n + 1);
      
      // Add to history
      this.exportHistory.update(history => [
        { 
          id: Date.now().toString(), 
          type: `${this.selectedDataType} Export`, 
          format: this.selectedFormat.toUpperCase(), 
          timestamp: 'Just now' 
        },
        ...history.slice(0, 4)
      ]);
    }, 2000);
  }

  saveTemplate() {
    const selectedColumns = this.availableColumns()
      .filter(col => col.selected)
      .map(col => col.key);
    
    if (selectedColumns.length === 0) {
      this.toastService.error('Please select columns before saving template');
      return;
    }

    const templateName = prompt('Enter template name:');
    if (!templateName) return;

    const newTemplate: ExportTemplate = {
      id: Date.now().toString(),
      name: templateName,
      dataType: this.selectedDataType,
      format: this.selectedFormat,
      columns: selectedColumns
    };

    this.savedTemplates.update(templates => [...templates, newTemplate]);
    this.toastService.success('Template saved successfully');
  }

  loadTemplate(template: ExportTemplate) {
    this.selectedDataType = template.dataType;
    this.selectedFormat = template.format;
    this.loadColumnsForDataType();
    
    // Select columns from template
    setTimeout(() => {
      this.availableColumns.update(columns => 
        columns.map(col => ({
          ...col,
          selected: template.columns.includes(col.key)
        }))
      );
      this.toastService.success(`Template "${template.name}" loaded`);
    }, 100);
  }

  deleteTemplate(id: string) {
    if (confirm('Are you sure you want to delete this template?')) {
      this.savedTemplates.update(templates => 
        templates.filter(t => t.id !== id)
      );
      this.toastService.success('Template deleted');
    }
  }

  quickExport(preset: string) {
    this.toastService.info(`Quick export: ${preset}...`);
    // Implement quick export logic
  }
}
