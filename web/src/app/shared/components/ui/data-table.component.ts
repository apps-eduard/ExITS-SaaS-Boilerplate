import { Component, Input, Output, EventEmitter, TemplateRef, ContentChild } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface TableColumn {
  key: string;
  label: string;
  icon?: string;
  sortable?: boolean;
  type?: 'text' | 'badge' | 'number' | 'date' | 'custom';
  width?: string;
  align?: 'left' | 'center' | 'right';
  getBadgeClass?: (value: any) => string;
  format?: (value: any) => string;
}

@Component({
  selector: 'app-data-table',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700">
      <!-- Bulk Actions Bar -->
      <div 
        *ngIf="selectable && selectedIds.size > 0" 
        class="px-4 py-2 bg-blue-50 dark:bg-blue-900/20 border-b border-gray-200 dark:border-gray-700 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2"
      >
        <span class="text-sm font-medium text-gray-700 dark:text-gray-300">
          {{ selectedIds.size }} item(s) selected
        </span>
        <div class="flex items-center gap-2">
          <ng-content select="[bulkActions]"></ng-content>
          <button
            (click)="onClearSelection()"
            type="button"
            class="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-300 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition"
          >
            <span class="w-3.5 h-3.5">✖️</span>
            <span>Clear</span>
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
                  (change)="onToggleSelectAll()"
                  class="w-4 h-4 text-green-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-white cursor-pointer transition-transform hover:scale-110"
                />
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
                  (click)="onSort(column.key)"
                  class="flex items-center gap-1 hover:text-gray-700 dark:hover:text-gray-100 transition-all duration-200 hover:translate-x-0.5 group"
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
                <div *ngIf="!column.sortable" class="flex items-center gap-1 group">
                  <span *ngIf="column.icon" class="w-3.5 h-3.5">{{ column.icon }}</span>
                  <span>{{ column.label }}</span>
                </div>
              </th>
            </tr>
          </thead>

          <tbody class="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
            <!-- Loading State -->
            <ng-container *ngIf="loading">
              <tr *ngFor="let i of [1,2,3,4,5]" class="animate-pulse">
                <td *ngIf="selectable" class="px-3 py-3">
                  <div class="h-4 w-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </td>
                <td *ngFor="let col of columns" class="px-3 py-3">
                  <div class="h-4 bg-gray-200 dark:bg-gray-700 rounded"></div>
                </td>
              </tr>
            </ng-container>

            <!-- Data Rows -->
            <tr 
              *ngFor="let row of data"
              [class]="selectable && selectedIds.has(row[rowIdKey])
                ? 'bg-blue-50 dark:bg-blue-900/20 border-l-4 border-l-blue-500 dark:border-l-blue-400' 
                : 'hover:bg-gray-50 dark:hover:bg-gray-700'"
              class="transition-all duration-200"
            >
              <!-- Checkbox -->
              <td *ngIf="selectable" class="px-3 py-2">
                <input
                  type="checkbox"
                  [checked]="selectedIds.has(row[rowIdKey])"
                  (change)="onToggleSelection(row[rowIdKey])"
                  class="w-4 h-4 text-green-600 bg-white dark:bg-gray-700 border-gray-300 dark:border-gray-600 rounded focus:ring-2 focus:ring-white"
                />
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
                  [class]="column.getBadgeClass(row[column.key])"
                  class="inline-flex items-center px-2 py-0.5 rounded text-xs font-medium"
                >
                  {{ column.format ? column.format(row[column.key]) : row[column.key] }}
                </span>

                <!-- Custom Template -->
                <ng-container *ngIf="column.type === 'custom'">
                  <ng-container 
                    *ngTemplateOutlet="customCellTemplate; context: { $implicit: row, column: column }"
                  ></ng-container>
                </ng-container>

                <!-- Default Text -->
                <span *ngIf="!column.type || column.type === 'text'" class="text-gray-900 dark:text-white">
                  {{ column.format ? column.format(row[column.key]) : row[column.key] }}
                </span>

                <!-- Number Type -->
                <span *ngIf="column.type === 'number'" class="font-semibold text-gray-900 dark:text-white">
                  {{ column.format ? column.format(row[column.key]) : row[column.key] }}
                </span>

                <!-- Date Type -->
                <span *ngIf="column.type === 'date'" class="text-gray-600 dark:text-gray-400">
                  {{ column.format ? column.format(row[column.key]) : row[column.key] }}
                </span>
              </td>
            </tr>

            <!-- Empty State -->
            <tr *ngIf="!loading && data.length === 0">
              <td [attr.colspan]="columns.length + (selectable ? 1 : 0)" class="px-3 py-12 text-center">
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
          </tbody>
        </table>
      </div>

      <!-- Footer -->
      <div *ngIf="showFooter" class="px-3 py-2 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-700">
        <ng-content select="[footer]"></ng-content>
      </div>
    </div>
  `
})
export class DataTableComponent {
  @Input() columns: TableColumn[] = [];
  @Input() data: any[] = [];
  @Input() loading: boolean = false;
  @Input() selectable: boolean = false;
  @Input() rowIdKey: string = 'id';
  @Input() selectedIds: Set<any> = new Set();
  @Input() selectAll: boolean = false;
  @Input() sortColumn: string | null = null;
  @Input() sortDirection: 'asc' | 'desc' = 'desc';
  @Input() emptyIcon: string = '🔍';
  @Input() emptyTitle: string = 'No data found';
  @Input() emptyMessage: string = 'Try adjusting your filters';
  @Input() showFooter: boolean = false;

  @Output() selectionChange = new EventEmitter<Set<any>>();
  @Output() selectAllChange = new EventEmitter<boolean>();
  @Output() sortChange = new EventEmitter<{ column: string; direction: 'asc' | 'desc' }>();

  @ContentChild('customCell') customCellTemplate?: TemplateRef<any>;

  onToggleSelectAll() {
    this.selectAll = !this.selectAll;
    this.selectAllChange.emit(this.selectAll);
  }

  onToggleSelection(id: any) {
    const selected = new Set(this.selectedIds);
    if (selected.has(id)) {
      selected.delete(id);
    } else {
      selected.add(id);
    }
    this.selectionChange.emit(selected);
  }

  onClearSelection() {
    this.selectionChange.emit(new Set());
  }

  onSort(column: string) {
    if (this.sortColumn === column) {
      this.sortDirection = this.sortDirection === 'asc' ? 'desc' : 'asc';
    } else {
      this.sortColumn = column;
      this.sortDirection = 'desc';
    }
    this.sortChange.emit({ column, direction: this.sortDirection });
  }
}
