import { Component, signal, computed, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { ToastService } from '../../../../../core/services/toast.service';

interface QueryField {
  name: string;
  label: string;
  type: 'string' | 'number' | 'date' | 'boolean';
  table: string;
}

interface QueryCondition {
  field: string;
  operator: string;
  value: string;
}

interface SavedQuery {
  id: string;
  name: string;
  description: string;
  query: string;
  createdAt: string;
  lastRun: string;
  runCount: number;
}

interface QueryResult {
  columns: string[];
  rows: any[];
  rowCount: number;
  executionTime: number;
}

@Component({
  selector: 'app-reports-custom-queries',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 md:p-6">
      <!-- Compact Header -->
      <div class="mb-4">
        <div class="flex items-center justify-between mb-1">
          <div class="flex items-center gap-3">
            <div class="w-8 h-8 bg-indigo-500 rounded-lg flex items-center justify-center">
              <span class="text-lg">🔍</span>
            </div>
            <h1 class="text-xl font-bold text-gray-900 dark:text-white">Custom Queries</h1>
          </div>
          <div class="flex gap-2">
            <button
              (click)="showQueryBuilder = !showQueryBuilder"
              class="px-3 py-1.5 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors">
              {{ showQueryBuilder ? '📝 SQL Editor' : '🔧 Query Builder' }}
            </button>
          </div>
        </div>
        <p class="text-xs text-gray-600 dark:text-gray-400 ml-11">Build and run custom database queries</p>
      </div>

      <!-- Query Stats -->
      <div class="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
        <div class="bg-blue-50 dark:bg-blue-900/20 rounded-lg p-3 border border-blue-200 dark:border-blue-800">
          <p class="text-xs text-blue-600 dark:text-blue-400 mb-0.5">Saved Queries</p>
          <p class="text-xl font-bold text-blue-700 dark:text-blue-300">{{ savedQueries().length }}</p>
        </div>
        <div class="bg-green-50 dark:bg-green-900/20 rounded-lg p-3 border border-green-200 dark:border-green-800">
          <p class="text-xs text-green-600 dark:text-green-400 mb-0.5">This Month</p>
          <p class="text-xl font-bold text-green-700 dark:text-green-300">{{ monthlyExecutions() }}</p>
        </div>
        <div class="bg-purple-50 dark:bg-purple-900/20 rounded-lg p-3 border border-purple-200 dark:border-purple-800">
          <p class="text-xs text-purple-600 dark:text-purple-400 mb-0.5">Avg Exec Time</p>
          <p class="text-xl font-bold text-purple-700 dark:text-purple-300">{{ avgExecutionTime() }}ms</p>
        </div>
        <div class="bg-orange-50 dark:bg-orange-900/20 rounded-lg p-3 border border-orange-200 dark:border-orange-800">
          <p class="text-xs text-orange-600 dark:text-orange-400 mb-0.5">Last Query</p>
          <p class="text-sm font-bold text-orange-700 dark:text-orange-300">{{ lastQueryTime() }}</p>
        </div>
      </div>

      <div class="grid grid-cols-1 lg:grid-cols-4 gap-4">
        <!-- Query Editor/Builder Panel -->
        <div class="lg:col-span-3 space-y-4">
          @if (!showQueryBuilder) {
            <!-- SQL Editor Mode -->
            <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">💻 SQL Query Editor</h3>
              
              <textarea
                [(ngModel)]="sqlQuery"
                rows="8"
                placeholder="SELECT * FROM customers WHERE kycStatus = 'verified' LIMIT 100"
                class="w-full px-3 py-2 text-sm font-mono border border-gray-300 dark:border-gray-600 rounded-lg bg-gray-50 dark:bg-gray-900 text-gray-900 dark:text-white resize-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"></textarea>
              
              <div class="flex gap-2 mt-3">
                <button
                  (click)="executeQuery()"
                  [disabled]="executing() || !sqlQuery.trim()"
                  class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50">
                  {{ executing() ? '⏳ Executing...' : '▶️ Run Query' }}
                </button>
                <button
                  (click)="saveCurrentQuery()"
                  [disabled]="!sqlQuery.trim()"
                  class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50">
                  💾 Save Query
                </button>
                <button
                  (click)="clearQuery()"
                  class="px-4 py-2 text-sm font-medium text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 hover:bg-red-100 dark:hover:bg-red-900/30 rounded-lg transition-colors">
                  🗑️ Clear
                </button>
                <button
                  (click)="formatQuery()"
                  [disabled]="!sqlQuery.trim()"
                  class="ml-auto px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors disabled:opacity-50">
                  ✨ Format
                </button>
              </div>

              <div class="mt-3 p-2 bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded text-xs text-yellow-700 dark:text-yellow-400">
                ⚠️ <strong>Important:</strong> Only SELECT queries are allowed. Write operations are restricted.
              </div>
            </div>
          } @else {
            <!-- Visual Query Builder Mode -->
            <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
              <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">🔧 Visual Query Builder</h3>
              
              <!-- Table Selection -->
              <div class="mb-3">
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Select Table</label>
                <select
                  [(ngModel)]="selectedTable"
                  (ngModelChange)="onTableChange()"
                  class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                  <option value="customers">Customers</option>
                  <option value="loans">Loans</option>
                  <option value="payments">Payments</option>
                  <option value="schedules">Payment Schedules</option>
                  <option value="transactions">Transactions</option>
                </select>
              </div>

              <!-- Field Selection -->
              <div class="mb-3">
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Select Fields</label>
                <div class="grid grid-cols-3 gap-2 p-2 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700 max-h-32 overflow-y-auto">
                  @for (field of availableFields(); track field.name) {
                    <label class="flex items-center gap-2 text-xs text-gray-700 dark:text-gray-300 cursor-pointer hover:bg-gray-100 dark:hover:bg-gray-800 p-1 rounded">
                      <input
                        type="checkbox"
                        [(ngModel)]="field.selected"
                        class="w-3 h-3 text-blue-600 border-gray-300 rounded focus:ring-blue-500">
                      <span>{{ field.label }}</span>
                    </label>
                  }
                </div>
              </div>

              <!-- Conditions -->
              <div class="mb-3">
                <div class="flex justify-between items-center mb-2">
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300">Conditions (WHERE)</label>
                  <button
                    (click)="addCondition()"
                    class="text-xs text-blue-600 dark:text-blue-400 hover:underline">
                    + Add Condition
                  </button>
                </div>
                <div class="space-y-2">
                  @for (condition of queryConditions(); track $index) {
                    <div class="flex gap-2">
                      <select
                        [(ngModel)]="condition.field"
                        class="flex-1 px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                        @for (field of availableFields(); track field.name) {
                          <option [value]="field.name">{{ field.label }}</option>
                        }
                      </select>
                      <select
                        [(ngModel)]="condition.operator"
                        class="px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                        <option value="=">=</option>
                        <option value="!=">!=</option>
                        <option value=">">></option>
                        <option value="<"><</option>
                        <option value=">=">>=</option>
                        <option value="<="><=</option>
                        <option value="LIKE">LIKE</option>
                      </select>
                      <input
                        type="text"
                        [(ngModel)]="condition.value"
                        placeholder="Value"
                        class="flex-1 px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                      <button
                        (click)="removeCondition($index)"
                        class="px-2 py-1.5 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                        ✕
                      </button>
                    </div>
                  }
                </div>
              </div>

              <!-- Limit & Sort -->
              <div class="grid grid-cols-2 gap-3 mb-3">
                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Order By</label>
                  <select
                    [(ngModel)]="orderBy"
                    class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                    <option value="">None</option>
                    @for (field of availableFields(); track field.name) {
                      <option [value]="field.name">{{ field.label }}</option>
                    }
                  </select>
                </div>
                <div>
                  <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Limit</label>
                  <input
                    type="number"
                    [(ngModel)]="queryLimit"
                    min="1"
                    max="1000"
                    class="w-full px-2 py-1.5 text-xs border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-700 text-gray-900 dark:text-white">
                </div>
              </div>

              <!-- Generated SQL Preview -->
              <div class="mb-3">
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Generated SQL</label>
                <div class="p-2 bg-gray-50 dark:bg-gray-900 rounded border border-gray-200 dark:border-gray-700">
                  <code class="text-xs text-gray-900 dark:text-white font-mono">{{ generatedSQL() }}</code>
                </div>
              </div>

              <div class="flex gap-2">
                <button
                  (click)="executeBuiltQuery()"
                  [disabled]="executing()"
                  class="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-lg transition-colors disabled:opacity-50">
                  {{ executing() ? '⏳ Executing...' : '▶️ Run Query' }}
                </button>
                <button
                  (click)="saveBuiltQuery()"
                  class="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-300 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 rounded-lg transition-colors">
                  💾 Save Query
                </button>
              </div>
            </div>
          }

          <!-- Query Results -->
          @if (queryResult()) {
            <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
              <div class="p-3 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
                <div>
                  <h3 class="text-sm font-semibold text-gray-900 dark:text-white">📊 Query Results</h3>
                  <p class="text-xs text-gray-500 dark:text-gray-400">
                    {{ queryResult()!.rowCount }} rows • Executed in {{ queryResult()!.executionTime }}ms
                  </p>
                </div>
                <button
                  (click)="exportResults()"
                  class="px-3 py-1.5 text-xs font-medium text-white bg-green-600 hover:bg-green-700 rounded-lg transition-colors">
                  📥 Export Results
                </button>
              </div>
              <div class="overflow-x-auto max-h-96">
                <table class="w-full text-sm">
                  <thead class="bg-gray-50 dark:bg-gray-900 sticky top-0">
                    <tr>
                      @for (column of queryResult()!.columns; track column) {
                        <th class="px-3 py-2 text-left text-xs font-medium text-gray-600 dark:text-gray-400 uppercase">
                          {{ column }}
                        </th>
                      }
                    </tr>
                  </thead>
                  <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
                    @for (row of queryResult()!.rows; track $index) {
                      <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50">
                        @for (column of queryResult()!.columns; track column) {
                          <td class="px-3 py-2 text-gray-700 dark:text-gray-300">
                            {{ formatCellValue(row[column]) }}
                          </td>
                        }
                      </tr>
                    }
                  </tbody>
                </table>
              </div>
            </div>
          }
        </div>

        <!-- Sidebar: Saved Queries & Templates -->
        <div class="space-y-4">
          <!-- Saved Queries -->
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">📁 Saved Queries</h3>
            <div class="space-y-2 max-h-96 overflow-y-auto">
              @for (query of savedQueries(); track query.id) {
                <div class="p-2 bg-gray-50 dark:bg-gray-900 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div class="flex justify-between items-start mb-1">
                    <p class="text-xs font-medium text-gray-900 dark:text-white">{{ query.name }}</p>
                    <span class="px-1.5 py-0.5 text-xs bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400 rounded">
                      {{ query.runCount }}
                    </span>
                  </div>
                  <p class="text-xs text-gray-500 dark:text-gray-400 mb-2">{{ query.description }}</p>
                  <div class="flex gap-1">
                    <button
                      (click)="loadQuery(query)"
                      class="flex-1 px-2 py-1 text-xs text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/30 rounded">
                      Load
                    </button>
                    <button
                      (click)="deleteQuery(query.id)"
                      class="px-2 py-1 text-xs text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded">
                      🗑️
                    </button>
                  </div>
                </div>
              } @empty {
                <p class="text-xs text-gray-500 dark:text-gray-400 text-center py-4">No saved queries</p>
              }
            </div>
          </div>

          <!-- Query Templates -->
          <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
            <h3 class="text-sm font-semibold text-gray-900 dark:text-white mb-3">📋 Quick Templates</h3>
            <div class="space-y-2">
              <button
                (click)="loadTemplate('verified-customers')"
                class="w-full text-left px-2 py-2 text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors">
                <span class="font-medium">Verified Customers</span>
              </button>
              <button
                (click)="loadTemplate('active-loans')"
                class="w-full text-left px-2 py-2 text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors">
                <span class="font-medium">Active Loans</span>
              </button>
              <button
                (click)="loadTemplate('overdue-payments')"
                class="w-full text-left px-2 py-2 text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors">
                <span class="font-medium">Overdue Payments</span>
              </button>
              <button
                (click)="loadTemplate('monthly-collection')"
                class="w-full text-left px-2 py-2 text-xs text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 transition-colors">
                <span class="font-medium">Monthly Collection</span>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class ReportsCustomQueriesComponent {
  private http = inject(HttpClient);
  private toastService = inject(ToastService);

  showQueryBuilder = false;
  sqlQuery = '';
  executing = signal(false);
  queryResult = signal<QueryResult | null>(null);
  
  selectedTable = 'customers';
  orderBy = '';
  queryLimit = 100;
  
  monthlyExecutions = signal(156);
  avgExecutionTime = signal(245);
  lastQueryTime = signal('5 min ago');
  
  availableFields = signal<(QueryField & { selected?: boolean })[]>([]);
  queryConditions = signal<QueryCondition[]>([]);
  
  savedQueries = signal<SavedQuery[]>([
    {
      id: '1',
      name: 'KYC Verified Customers',
      description: 'All customers with verified KYC status',
      query: "SELECT * FROM customers WHERE kycStatus = 'verified'",
      createdAt: '2025-10-15',
      lastRun: '2 hours ago',
      runCount: 45
    },
    {
      id: '2',
      name: 'High Value Loans',
      description: 'Loans above ₱50,000',
      query: "SELECT * FROM loans WHERE amount > 50000",
      createdAt: '2025-10-10',
      lastRun: '1 day ago',
      runCount: 28
    }
  ]);

  generatedSQL = computed(() => {
    const fields = this.availableFields().filter(f => f.selected).map(f => f.name);
    const selectedFields = fields.length > 0 ? fields.join(', ') : '*';
    
    let sql = `SELECT ${selectedFields} FROM ${this.selectedTable}`;
    
    const conditions = this.queryConditions();
    if (conditions.length > 0) {
      const whereClause = conditions
        .filter(c => c.field && c.value)
        .map(c => `${c.field} ${c.operator} '${c.value}'`)
        .join(' AND ');
      if (whereClause) {
        sql += ` WHERE ${whereClause}`;
      }
    }
    
    if (this.orderBy) {
      sql += ` ORDER BY ${this.orderBy}`;
    }
    
    if (this.queryLimit > 0) {
      sql += ` LIMIT ${this.queryLimit}`;
    }
    
    return sql;
  });

  ngOnInit() {
    this.loadFieldsForTable();
  }

  onTableChange() {
    this.loadFieldsForTable();
  }

  loadFieldsForTable() {
    const fieldSets: Record<string, QueryField[]> = {
      customers: [
        { name: 'id', label: 'ID', type: 'number', table: 'customers' },
        { name: 'name', label: 'Name', type: 'string', table: 'customers' },
        { name: 'email', label: 'Email', type: 'string', table: 'customers' },
        { name: 'kycStatus', label: 'KYC Status', type: 'string', table: 'customers' },
        { name: 'createdAt', label: 'Created Date', type: 'date', table: 'customers' }
      ],
      loans: [
        { name: 'id', label: 'ID', type: 'number', table: 'loans' },
        { name: 'loanNumber', label: 'Loan Number', type: 'string', table: 'loans' },
        { name: 'amount', label: 'Amount', type: 'number', table: 'loans' },
        { name: 'status', label: 'Status', type: 'string', table: 'loans' },
        { name: 'disbursementDate', label: 'Disbursement Date', type: 'date', table: 'loans' }
      ],
      payments: [
        { name: 'id', label: 'ID', type: 'number', table: 'payments' },
        { name: 'amount', label: 'Amount', type: 'number', table: 'payments' },
        { name: 'paymentDate', label: 'Payment Date', type: 'date', table: 'payments' },
        { name: 'method', label: 'Method', type: 'string', table: 'payments' }
      ]
    };

    this.availableFields.set(
      (fieldSets[this.selectedTable] || fieldSets['customers']).map(f => ({ ...f, selected: true }))
    );
  }

  addCondition() {
    this.queryConditions.update(conditions => [
      ...conditions,
      { field: this.availableFields()[0]?.name || '', operator: '=', value: '' }
    ]);
  }

  removeCondition(index: number) {
    this.queryConditions.update(conditions => 
      conditions.filter((_, i) => i !== index)
    );
  }

  executeQuery() {
    if (!this.sqlQuery.trim()) return;
    
    this.executing.set(true);
    
    // Mock execution - Replace with actual API call
    setTimeout(() => {
      const mockResult: QueryResult = {
        columns: ['id', 'name', 'email', 'kycStatus'],
        rows: [
          { id: 1, name: 'John Doe', email: 'john@example.com', kycStatus: 'verified' },
          { id: 2, name: 'Jane Smith', email: 'jane@example.com', kycStatus: 'verified' },
          { id: 3, name: 'Bob Johnson', email: 'bob@example.com', kycStatus: 'pending' }
        ],
        rowCount: 3,
        executionTime: 125
      };
      
      this.queryResult.set(mockResult);
      this.executing.set(false);
      this.toastService.success('Query executed successfully');
      this.monthlyExecutions.update(n => n + 1);
    }, 1000);
  }

  executeBuiltQuery() {
    this.sqlQuery = this.generatedSQL();
    this.executeQuery();
  }

  saveCurrentQuery() {
    const name = prompt('Enter query name:');
    if (!name) return;
    
    const description = prompt('Enter query description (optional):') || '';
    
    const newQuery: SavedQuery = {
      id: Date.now().toString(),
      name,
      description,
      query: this.sqlQuery,
      createdAt: new Date().toISOString().split('T')[0],
      lastRun: 'Never',
      runCount: 0
    };
    
    this.savedQueries.update(queries => [...queries, newQuery]);
    this.toastService.success('Query saved successfully');
  }

  saveBuiltQuery() {
    this.sqlQuery = this.generatedSQL();
    this.saveCurrentQuery();
  }

  loadQuery(query: SavedQuery) {
    this.sqlQuery = query.query;
    this.showQueryBuilder = false;
    this.toastService.success(`Query "${query.name}" loaded`);
  }

  deleteQuery(id: string) {
    if (confirm('Are you sure you want to delete this query?')) {
      this.savedQueries.update(queries => queries.filter(q => q.id !== id));
      this.toastService.success('Query deleted');
    }
  }

  clearQuery() {
    this.sqlQuery = '';
    this.queryResult.set(null);
  }

  formatQuery() {
    // Simple SQL formatting
    this.sqlQuery = this.sqlQuery
      .replace(/\s+/g, ' ')
      .replace(/SELECT /gi, 'SELECT\n  ')
      .replace(/FROM /gi, '\nFROM\n  ')
      .replace(/WHERE /gi, '\nWHERE\n  ')
      .replace(/ORDER BY /gi, '\nORDER BY\n  ')
      .replace(/LIMIT /gi, '\nLIMIT ')
      .trim();
  }

  loadTemplate(template: string) {
    const templates: Record<string, string> = {
      'verified-customers': "SELECT id, name, email, phone, kycStatus\nFROM customers\nWHERE kycStatus = 'verified'\nORDER BY createdAt DESC\nLIMIT 100",
      'active-loans': "SELECT loanNumber, customerName, amount, status, disbursementDate\nFROM loans\nWHERE status = 'active'\nORDER BY disbursementDate DESC\nLIMIT 100",
      'overdue-payments': "SELECT customer, loanNumber, amount, dueDate, daysOverdue\nFROM payments\nWHERE daysOverdue > 0\nORDER BY daysOverdue DESC\nLIMIT 100",
      'monthly-collection': "SELECT DATE_FORMAT(paymentDate, '%Y-%m') as month, SUM(amount) as total\nFROM payments\nGROUP BY month\nORDER BY month DESC\nLIMIT 12"
    };
    
    this.sqlQuery = templates[template] || '';
    this.showQueryBuilder = false;
    this.toastService.info(`Template loaded: ${template}`);
  }

  exportResults() {
    this.toastService.info('Exporting query results...');
    // Implement export logic
  }

  formatCellValue(value: any): string {
    if (value === null || value === undefined) return '-';
    if (typeof value === 'boolean') return value ? 'Yes' : 'No';
    if (typeof value === 'number') return value.toLocaleString();
    return String(value);
  }
}
