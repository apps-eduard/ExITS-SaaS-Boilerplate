import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

export interface FilterOption {
  value: string;
  label: string;
}

export interface FilterConfig {
  type: 'select' | 'search' | 'date' | 'daterange';
  label: string;
  placeholder?: string;
  options?: FilterOption[];
  value?: any;
  modelKey: string;
}

@Component({
  selector: 'app-filter-section',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 p-4">
      <!-- Filters Row -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 mb-3">
        <ng-container *ngFor="let filter of filters">
          <!-- Search Filter -->
          <div *ngIf="filter.type === 'search'" class="flex flex-col gap-1 w-full">
            <label class="text-xs font-medium text-gray-700 dark:text-gray-300">
              {{ filter.label }}
            </label>
            <div class="relative">
              <span class="absolute left-2 top-1/2 -translate-y-1/2 text-sm">🔍</span>
              <input
                type="text"
                [(ngModel)]="filterValues[filter.modelKey]"
                (ngModelChange)="onFilterChange()"
                [placeholder]="filter.placeholder || 'Search...'"
                class="w-full pl-7 pr-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              />
            </div>
          </div>

          <!-- Select Filter -->
          <div *ngIf="filter.type === 'select'" class="flex flex-col gap-1 w-full">
            <label class="text-xs font-medium text-gray-700 dark:text-gray-300">
              {{ filter.label }}
            </label>
            <select
              [(ngModel)]="filterValues[filter.modelKey]"
              (ngModelChange)="onFilterChange()"
              class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            >
              <option *ngFor="let opt of filter.options" [value]="opt.value">
                {{ opt.label }}
              </option>
            </select>
          </div>

          <!-- Date Filter -->
          <div *ngIf="filter.type === 'date'" class="flex flex-col gap-1 w-full">
            <label class="text-xs font-medium text-gray-700 dark:text-gray-300">
              {{ filter.label }}
            </label>
            <input
              type="date"
              [(ngModel)]="filterValues[filter.modelKey]"
              (ngModelChange)="onFilterChange()"
              class="w-full px-2 py-1.5 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>
        </ng-container>
      </div>

      <!-- Controls Row -->
      <div class="flex flex-wrap items-center gap-2 justify-end">
        <!-- Clear Filters Button -->
        <button
          (click)="onClearFilters()"
          type="button"
          class="h-[30px] px-2.5 text-xs font-medium rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 transition flex items-center justify-center"
          title="Clear Filters"
        >
          <span class="text-sm">🔄</span>
        </button>

        <!-- Page Size Selector -->
        <select
          *ngIf="showPageSize"
          [(ngModel)]="pageSize"
          (ngModelChange)="onPageSizeChange($event)"
          class="h-[30px] px-2 border border-gray-300 dark:border-gray-600 rounded text-xs bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500"
          title="Items per page"
        >
          <option *ngFor="let size of pageSizeOptions" [value]="size">{{ size }}</option>
        </select>

        <!-- Pagination Controls -->
        <div *ngIf="showPagination" class="flex items-center gap-2">
          <button
            (click)="onPreviousPage()"
            [disabled]="currentPage === 1"
            type="button"
            class="h-[30px] px-2.5 text-xs font-medium rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center"
            title="Previous Page"
          >
            <span class="text-sm">←</span>
          </button>

          <span class="text-xs text-gray-600 dark:text-gray-400 whitespace-nowrap">
            Page {{ currentPage }} of {{ totalPages || 1 }}
          </span>

          <button
            (click)="onNextPage()"
            [disabled]="currentPage === totalPages || totalPages === 0"
            type="button"
            class="h-[30px] px-2.5 text-xs font-medium rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed transition flex items-center justify-center"
            title="Next Page"
          >
            <span class="text-sm">→</span>
          </button>
        </div>
      </div>
    </div>
  `
})
export class FilterSectionComponent {
  @Input() filters: FilterConfig[] = [];
  @Input() showPageSize: boolean = true;
  @Input() showPagination: boolean = true;
  @Input() currentPage: number = 1;
  @Input() totalPages: number = 1;
  @Input() pageSize: number = 10;
  @Input() pageSizeOptions: number[] = [10, 25, 50, 100];

  @Output() filterChange = new EventEmitter<any>();
  @Output() clearFilters = new EventEmitter<void>();
  @Output() pageSizeChange = new EventEmitter<number>();
  @Output() pageChange = new EventEmitter<number>();

  filterValues: any = {};

  ngOnInit() {
    // Initialize filter values
    this.filters.forEach(filter => {
      this.filterValues[filter.modelKey] = filter.value || (filter.type === 'select' ? 'all' : '');
    });
  }

  onFilterChange() {
    this.filterChange.emit(this.filterValues);
  }

  onClearFilters() {
    this.filters.forEach(filter => {
      this.filterValues[filter.modelKey] = filter.type === 'select' ? 'all' : '';
    });
    this.clearFilters.emit();
  }

  onPageSizeChange(size: number) {
    this.pageSizeChange.emit(size);
  }

  onPreviousPage() {
    if (this.currentPage > 1) {
      this.pageChange.emit(this.currentPage - 1);
    }
  }

  onNextPage() {
    if (this.currentPage < this.totalPages) {
      this.pageChange.emit(this.currentPage + 1);
    }
  }
}
