import { Component, Input, Output, EventEmitter, TemplateRef, ContentChild, computed, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface StatCard {
  label: string;
  value: number | string;
  icon: string;
  valueClass?: string;
  iconBgClass?: string;
}

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterField {
  type: 'search' | 'select' | 'daterange';
  label: string;
  modelKey: string;
  value?: string;
  placeholder?: string;
  options?: FilterOption[];
  showCustomDateInputs?: boolean;
}

export interface ColumnDefinition {
  key: string;
  label: string;
  icon?: string;
  sortable?: boolean;
  type?: 'text' | 'badge' | 'number' | 'date' | 'custom' | 'actions';
  width?: string;
  align?: 'left' | 'center' | 'right';
  getBadgeClass?: (value: any, row?: any) => string;
  format?: (value: any, row?: any) => string;
}

export interface ActionButton {
  icon: string;
  label: string;
  class?: string;
  action: (item: any) => void;
  show?: (item: any) => boolean;
}

export interface BulkAction {
  icon: string;
  label: string;
  class?: string;
  action: (selectedItems: any[]) => void;
}

@Component({
  selector: 'app-data-management-page',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="space-y-4 p-6">
      <!-- Page Header -->
      <div class="flex items-center gap-2">
        <span class="text-3xl">{{ pageIcon }}</span>
        <div>
          <h2 class="text-lg font-bold text-gray-900 dark:text-white">{{ pageTitle }}</h2>
          <p class="text-xs text-gray-500 dark:text-gray-400">{{ pageDescription }}</p>
        </div>
      </div>

      <!-- Summary Stats Cards -->
      <div *ngIf="statCards.length > 0" class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
        <div 
          *ngFor="let stat of statCards"
          [class]="'bg-gradient-to-br from-white to-gray-50 dark:from-gray-800 dark:to-gray-800/50 rounded-lg p-3 border border-gray-200 dark:border-gray-700 shadow-sm hover:shadow-md transition' + (stat.onClick ? ' cursor-pointer' : '')"
          (click)="stat.onClick ? stat.onClick() : null"
        >
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs text-gray-600 dark:text-gray-400">{{ stat.label }}</p>
              <p [class]="stat.valueClass || 'text-lg font-bold text-gray-900 dark:text-white'">{{ stat.value }}</p>
            </div>
            <div [class]="stat.iconBgClass || 'flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30'">
              <span class="text-base">{{ stat.icon }}</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-gray-800 rounded-lg p-3 border border-gray-200 dark:border-gray-700 shadow-sm">
        <div class="flex flex-col sm:flex-row items-start sm:items-end gap-3">
          <div [class]="'grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-' + filterFields.length + ' gap-3 flex-1 w-full sm:w-auto'">
            <div *ngFor="let filter of filterFields">
              <!-- Search -->
              <div *ngIf="filter.type === 'search'">
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {{ filter.label }}
                </label>
                <div class="relative">
                  <span class="absolute left-2 top-1/2 -translate-y-1/2 text-sm">🔍</span>
                  <input
                    type="text"
                    [ngModel]="getFilterValue(filter.modelKey)"
                    (ngModelChange)="onFilterChange(filter.modelKey, $event)"
                    [placeholder]="filter.placeholder || 'Search...'"
                    class="w-full pl-7 pr-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  />
                </div>
              </div>

              <!-- Select -->
              <div *ngIf="filter.type === 'select'">
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {{ filter.label }}
                </label>
                <select
                  [ngModel]="getFilterValue(filter.modelKey)"
                  (ngModelChange)="onFilterChange(filter.modelKey, $event)"
                  class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option *ngFor="let option of filter.options" [value]="option.value">{{ option.label }}</option>
                </select>
              </div>

              <!-- Date Range -->
              <div *ngIf="filter.type === 'daterange'">
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">
                  {{ filter.label }}
                </label>
                <select
                  [ngModel]="getFilterValue(filter.modelKey)"
                  (ngModelChange)="onFilterChange(filter.modelKey, $event)"
                  class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                >
                  <option *ngFor="let option of filter.options" [value]="option.value">{{ option.label }}</option>
                </select>
              </div>
            </div>
          </div>

          <!-- Clear Filters Button -->
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition"
              (click)="clearFilters.emit()"
            >
              <span class="w-3.5 h-3.5">🔄</span>
              <span>Clear</span>
            </button>
          </div>
        </div>

        <!-- Custom Date Range Inputs -->
        <div *ngIf="showCustomDateInputs" class="grid grid-cols-1 sm:grid-cols-2 gap-3 mt-3 pt-3 border-t border-gray-200 dark:border-gray-700">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">From Date</label>
            <input
              type="date"
              [ngModel]="customDateFrom"
              (ngModelChange)="customDateFromChange.emit($event)"
              class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">To Date</label>
            <input
              type="date"
              [ngModel]="customDateTo"
              (ngModelChange)="customDateToChange.emit($event)"
              class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </div>
      </div>

      <!-- Data Table -->
      <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 overflow-hidden">
        <!-- Bulk Actions Bar -->
        <div 
          *ngIf="selectable && selectedIds.size > 0" 
          class="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
        >
          <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
            {{ selectedIds.size }} item(s) selected
          </span>
          <div class="flex items-center gap-2 w-full sm:w-auto">
            <button
              type="button"
              class="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition"
              (click)="clearSelection.emit()"
              title="Clear Selection"
            >
              <span class="w-3.5 h-3.5">✖️</span>
              <span class="hidden sm:inline">Clear</span>
            </button>
            <button
              *ngFor="let action of bulkActions"
              (click)="action.action(getSelectedItems())"
              type="button"
              [class]="action.class || 'inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition'"
              [title]="action.label"
            >
              <span class="w-3.5 h-3.5">{{ action.icon }}</span>
              <span class="hidden sm:inline">{{ action.label }}</span>
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead class="bg-gray-50 dark:bg-gray-700">
              <tr>
                <!-- Checkbox Column -->
                <th *ngIf="selectable" class="px-3 py-2 text-left w-10">
                  <input
                    type="checkbox"
                    [checked]="selectAll"
                    (change)="selectAllChange.emit()"
                    class="w-4 h-4 accent-green-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-white cursor-pointer transition-transform hover:scale-110"
                  />
                </th>
                
                <!-- Row Number Column -->
                <th *ngIf="showRowNumbers" class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider w-16">
                  <div class="flex items-center justify-center gap-1 group">
                    <span class="w-3.5 h-3.5 transition-transform group-hover:scale-110">#</span>
                  </div>
                </th>

                <!-- Data Columns -->
                <th 
                  *ngFor="let column of columns" 
                  class="px-3 py-2 text-xs font-medium text-gray-500 dark:text-gray-300 uppercase tracking-wider"
                  [class.text-left]="column.align === 'left' || !column.align"
                  [class.text-center]="column.align === 'center'"
                  [class.text-right]="column.align === 'right'"
                  [style.width]="column.width"
                >
                  <button
                    *ngIf="column.sortable"
                    (click)="sortChange.emit(column.key)"
                    class="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-100 transition-all duration-200 hover:translate-x-0.5 group"
                    [class.justify-end]="column.align === 'right'"
                    [class.justify-center]="column.align === 'center'"
                    [class.w-full]="column.align === 'right'"
                    type="button"
                  >
                    <span *ngIf="column.icon" class="w-3.5 h-3.5 transition-transform group-hover:scale-110">
                      {{ column.icon }}
                    </span>
                    <span>{{ column.label }}</span>
                    <svg 
                      *ngIf="sortColumn === column.key" 
                      class="w-3 h-3 transition-transform duration-300" 
                      [class.rotate-180]="sortDirection === 'desc'"
                      fill="none" 
                      stroke="currentColor" 
                      viewBox="0 0 24 24"
                    >
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 15l7-7 7 7" />
                    </svg>
                  </button>
                  <div 
                    *ngIf="!column.sortable" 
                    class="flex items-center gap-1 group"
                    [class.justify-end]="column.align === 'right'"
                    [class.justify-center]="column.align === 'center'"
                  >
                    <span *ngIf="column.icon" class="w-3.5 h-3.5">{{ column.icon }}</span>
                    <span>{{ column.label }}</span>
                  </div>
                </th>
              </tr>
            </thead>

            <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              <!-- Loading Skeleton -->
              <ng-container *ngIf="loading">
                <tr *ngFor="let i of [1,2,3,4,5]" class="animate-pulse">
                  <td *ngIf="selectable" class="px-3 py-3">
                    <div class="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </td>
                  <td *ngIf="showRowNumbers" class="px-3 py-3">
                    <div class="h-4 w-8 bg-gray-200 dark:bg-gray-700 rounded mx-auto"></div>
                  </td>
                  <td *ngFor="let col of columns" class="px-3 py-3">
                    <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                  </td>
                </tr>
              </ng-container>

              <!-- Empty State -->
              <tr *ngIf="!loading && (!data || data.length === 0)">
                <td [attr.colspan]="columns.length + (selectable ? 1 : 0) + (showRowNumbers ? 1 : 0)" class="px-3 py-12 text-center">
                  <div class="flex flex-col items-center gap-3">
                    <div class="w-16 h-16 bg-gray-100 dark:bg-gray-700 rounded-full flex items-center justify-center">
                      <span class="text-4xl">{{ emptyIcon }}</span>
                    </div>
                    <div>
                      <p class="text-sm font-medium text-gray-900 dark:text-white">{{ emptyTitle }}</p>
                      <p class="text-xs text-gray-500 dark:text-gray-400 mt-1">{{ emptyMessage }}</p>
                    </div>
                    <ng-content select="[emptyActions]"></ng-content>
                  </div>
                </td>
              </tr>

              <!-- Data Rows -->
              <tr 
                *ngFor="let item of data; let i = index" 
                [class]="selectable && selectedIds.has(item[rowIdKey])
                  ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500 dark:border-l-blue-400' 
                  : 'hover:bg-gray-50 dark:hover:bg-gray-700'"
                class="transition-all duration-200"
              >
                <!-- Checkbox -->
                <td *ngIf="selectable" class="px-3 py-2">
                  <input
                    type="checkbox"
                    [checked]="selectedIds.has(item[rowIdKey])"
                    (change)="toggleSelection.emit(item[rowIdKey])"
                    class="w-4 h-4 accent-green-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-white"
                  />
                </td>

                <!-- Row Number -->
                <td *ngIf="showRowNumbers" class="px-3 py-2 text-center text-xs font-medium text-gray-500 dark:text-gray-400">
                  {{ (currentPage - 1) * pageSize + i + 1 }}
                </td>

                <!-- Data Cells -->
                <td 
                  *ngFor="let column of columns" 
                  class="px-3 py-2 text-xs"
                  [class.text-left]="column.align === 'left' || !column.align"
                  [class.text-center]="column.align === 'center'"
                  [class.text-right]="column.align === 'right'"
                >
                  <!-- Badge Type -->
                  <span 
                    *ngIf="column.type === 'badge' && column.getBadgeClass"
                    [class]="column.getBadgeClass(item[column.key], item)"
                    class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                  >
                    {{ column.format ? column.format(item[column.key], item) : item[column.key] }}
                  </span>

                  <!-- Actions Type -->
                  <div *ngIf="column.type === 'actions'" class="flex items-center justify-center gap-1">
                    <ng-container *ngFor="let action of rowActions">
                      <button
                        *ngIf="!action.show || action.show(item)"
                        (click)="action.action(item)"
                        type="button"
                        [class]="action.class || 'inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded shadow-sm hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200 hover:scale-105 hover:shadow-md group'"
                        [title]="action.label"
                      >
                        <span class="w-3.5 h-3.5 transition-transform group-hover:scale-110">{{ action.icon }}</span>
                      </button>
                    </ng-container>
                  </div>

                  <!-- Custom Template -->
                  <ng-container *ngIf="column.type === 'custom'">
                    <ng-container 
                      *ngTemplateOutlet="customCellTemplate; context: { $implicit: item, column: column }"
                    ></ng-container>
                  </ng-container>

                  <!-- Default Text -->
                  <span *ngIf="!column.type || column.type === 'text'" class="text-gray-900 dark:text-white">
                    {{ column.format ? column.format(item[column.key], item) : item[column.key] }}
                  </span>

                  <!-- Number Type -->
                  <span *ngIf="column.type === 'number'" class="font-semibold text-gray-900 dark:text-white">
                    {{ column.format ? column.format(item[column.key], item) : item[column.key] }}
                  </span>

                  <!-- Date Type -->
                  <span *ngIf="column.type === 'date'" class="text-gray-600 dark:text-gray-400">
                    {{ column.format ? column.format(item[column.key], item) : item[column.key] }}
                  </span>
                </td>
              </tr>
            </tbody>
          </table>
        </div>

        <!-- Pagination Controls -->
        <div class="px-3 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700 flex items-center justify-between">
          <!-- Left side: Page size selector and info -->
          <div class="flex items-center gap-3">
            <div class="flex items-center gap-2">
              <label class="text-xs text-gray-600 dark:text-gray-400">Show:</label>
              <select
                [ngModel]="pageSize"
                (ngModelChange)="pageSizeChange.emit($event)"
                class="px-2 py-1 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
              >
                <option *ngFor="let size of pageSizeOptions" [value]="size">{{ size }}</option>
              </select>
            </div>
            <div class="text-xs text-gray-600 dark:text-gray-400">
              Showing {{ (currentPage - 1) * pageSize + 1 }} to {{ Math.min(currentPage * pageSize, totalRecords) }} of {{ totalRecords }}
            </div>
          </div>

          <!-- Right side: Page navigation -->
          <div class="flex items-center gap-2">
            <button
              (click)="previousPage.emit()"
              [disabled]="currentPage === 1"
              class="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded transition disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              <span class="w-3.5 h-3.5">←</span>
              Previous
            </button>
            <div class="flex items-center gap-1">
              <span class="text-xs text-gray-600 dark:text-gray-400">
                Page {{ currentPage }} of {{ totalPages }}
              </span>
            </div>
            <button
              (click)="nextPage.emit()"
              [disabled]="currentPage >= totalPages"
              class="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium rounded transition disabled:opacity-50 disabled:cursor-not-allowed text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-600"
            >
              Next
              <span class="w-3.5 h-3.5">→</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class DataManagementPageComponent {
  // Page Header
  @Input() pageIcon: string = '📄';
  @Input() pageTitle: string = 'Data Management';
  @Input() pageDescription: string = 'Manage your data';

  // Stats Cards
  @Input() statCards: StatCard[] = [];

  // Filters
  @Input() filterFields: FilterField[] = [];
  @Input() filterValues: Record<string, any> = {};
  @Input() showCustomDateInputs: boolean = false;
  @Input() customDateFrom: string = '';
  @Input() customDateTo: string = '';

  // Table
  @Input() columns: ColumnDefinition[] = [];
  @Input() data: any[] = [];
  @Input() loading: boolean = false;
  @Input() selectable: boolean = false;
  @Input() showRowNumbers: boolean = true;
  @Input() rowIdKey: string = 'id';
  @Input() selectedIds: Set<any> = new Set();
  @Input() selectAll: boolean = false;
  @Input() sortColumn: string | null = null;
  @Input() sortDirection: 'asc' | 'desc' = 'desc';
  @Input() emptyIcon: string = '🔍';
  @Input() emptyTitle: string = 'No data found';
  @Input() emptyMessage: string = 'Try adjusting your filters';

  // Actions
  @Input() rowActions: ActionButton[] = [];
  @Input() bulkActions: BulkAction[] = [];

  // Pagination
  @Input() currentPage: number = 1;
  @Input() pageSize: number = 10;
  @Input() totalRecords: number = 0;
  @Input() totalPages: number = 1;
  @Input() pageSizeOptions: number[] = [10, 25, 50, 100];

  // Events
  @Output() filterChange = new EventEmitter<{ key: string; value: any }>();
  @Output() clearFilters = new EventEmitter<void>();
  @Output() customDateFromChange = new EventEmitter<string>();
  @Output() customDateToChange = new EventEmitter<string>();
  @Output() sortChange = new EventEmitter<string>();
  @Output() toggleSelection = new EventEmitter<any>();
  @Output() selectAllChange = new EventEmitter<void>();
  @Output() clearSelection = new EventEmitter<void>();
  @Output() pageSizeChange = new EventEmitter<number>();
  @Output() previousPage = new EventEmitter<void>();
  @Output() nextPage = new EventEmitter<void>();

  @ContentChild('customCell') customCellTemplate?: TemplateRef<any>;

  Math = Math;

  getFilterValue(key: string): any {
    return this.filterValues[key] || '';
  }

  onFilterChange(key: string, value: any): void {
    this.filterChange.emit({ key, value });
  }

  getSelectedItems(): any[] {
    return this.data.filter(item => this.selectedIds.has(item[this.rowIdKey]));
  }
}
