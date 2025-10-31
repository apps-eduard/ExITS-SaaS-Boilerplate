# Data Management Page Component - Complete Guide

## Overview

The `DataManagementPageComponent` is a comprehensive, reusable page template that encapsulates the entire design pattern from the Transaction History page. It includes:

- **Page Header** with icon, title, and description
- **Summary Stats Cards** with customizable metrics
- **Filter Section** with search, selects, and date ranges
- **Data Table** with sorting, selection, pagination, and actions
- **Bulk Actions** for selected items
- **Row Actions** for individual items
- **Loading States** and empty states
- **Responsive Design** with dark mode support

## Installation

```typescript
import { 
  DataManagementPageComponent,
  StatCard,
  FilterField,
  ColumnDefinition,
  ActionButton,
  BulkAction
} from './shared/components/ui';
```

## Basic Usage Example

### 1. Import in Your Component

```typescript
import { Component, OnInit, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { 
  DataManagementPageComponent,
  StatCard,
  FilterField,
  ColumnDefinition,
  ActionButton,
  BulkAction
} from '../../../shared/components/ui';

@Component({
  selector: 'app-my-data-page',
  standalone: true,
  imports: [CommonModule, DataManagementPageComponent],
  template: `
    <app-data-management-page
      [pageIcon]="pageIcon"
      [pageTitle]="pageTitle"
      [pageDescription]="pageDescription"
      [statCards]="statCards"
      [filterFields]="filterFields"
      [filterValues]="filterValues"
      [columns]="columns"
      [data]="paginatedData()"
      [loading]="loading()"
      [selectable]="true"
      [showRowNumbers]="true"
      [selectedIds]="selectedIds()"
      [selectAll]="selectAll()"
      [sortColumn]="sortColumn()"
      [sortDirection]="sortDirection()"
      [rowActions]="rowActions"
      [bulkActions]="bulkActions"
      [currentPage]="currentPage()"
      [pageSize]="pageSize()"
      [totalRecords]="filteredData().length"
      [totalPages]="totalPages()"
      [showCustomDateInputs]="filterValues['dateRange'] === 'custom'"
      [customDateFrom]="customDateFrom()"
      [customDateTo]="customDateTo()"
      (filterChange)="onFilterChange($event)"
      (clearFilters)="onClearFilters()"
      (sortChange)="onSortChange($event)"
      (toggleSelection)="toggleSelection($event)"
      (selectAllChange)="toggleSelectAll()"
      (clearSelection)="clearSelection()"
      (pageSizeChange)="onPageSizeChange($event)"
      (previousPage)="previousPage()"
      (nextPage)="nextPage()"
      (customDateFromChange)="customDateFrom.set($event)"
      (customDateToChange)="customDateTo.set($event)"
    />
  `
})
export class MyDataPageComponent implements OnInit {
  // ... component logic
}
```

### 2. Configure Page Header

```typescript
pageIcon = '🧾';
pageTitle = 'Transaction History';
pageDescription = 'View all your subscription payments and transactions';
```

### 3. Configure Stats Cards

```typescript
statCards: StatCard[] = [
  {
    label: 'Total',
    value: this.allData().length,
    icon: '📊',
    valueClass: 'text-lg font-bold text-gray-900 dark:text-white',
    iconBgClass: 'flex h-8 w-8 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30'
  },
  {
    label: 'Completed',
    value: this.countByStatus('completed'),
    icon: '✅',
    valueClass: 'text-lg font-bold text-green-600 dark:text-green-400',
    iconBgClass: 'flex h-8 w-8 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30'
  },
  {
    label: 'Pending',
    value: this.countByStatus('pending'),
    icon: '⏳',
    valueClass: 'text-lg font-bold text-yellow-600 dark:text-yellow-400',
    iconBgClass: 'flex h-8 w-8 items-center justify-center rounded-full bg-yellow-100 dark:bg-yellow-900/30'
  },
  {
    label: 'Failed',
    value: this.countByStatus('failed'),
    icon: '❌',
    valueClass: 'text-lg font-bold text-red-600 dark:text-red-400',
    iconBgClass: 'flex h-8 w-8 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30'
  }
];
```

### 4. Configure Filter Fields

```typescript
filterFields: FilterField[] = [
  {
    type: 'search',
    label: 'Search',
    modelKey: 'search',
    placeholder: 'Search transactions...'
  },
  {
    type: 'select',
    label: 'Status',
    modelKey: 'status',
    options: [
      { value: 'all', label: 'All Status' },
      { value: 'completed', label: 'Completed' },
      { value: 'pending', label: 'Pending' },
      { value: 'failed', label: 'Failed' }
    ]
  },
  {
    type: 'select',
    label: 'Type',
    modelKey: 'type',
    options: [
      { value: 'all', label: 'All Types' },
      { value: 'subscription', label: 'Subscription' },
      { value: 'upgrade', label: 'Upgrade' },
      { value: 'payment', label: 'Payment' }
    ]
  },
  {
    type: 'daterange',
    label: 'Date Range',
    modelKey: 'dateRange',
    options: [
      { value: 'all', label: 'All Time' },
      { value: '7days', label: 'Last 7 Days' },
      { value: '30days', label: 'Last 30 Days' },
      { value: '90days', label: 'Last 90 Days' },
      { value: '1year', label: 'Last Year' },
      { value: 'custom', label: 'Custom Range' }
    ]
  }
];

filterValues: Record<string, any> = {
  search: '',
  status: 'all',
  type: 'all',
  dateRange: 'all'
};
```

### 5. Configure Table Columns

```typescript
columns: ColumnDefinition[] = [
  {
    key: 'description',
    label: 'Description',
    icon: '📝',
    sortable: true,
    type: 'text'
  },
  {
    key: 'invoiceId',
    label: 'Invoice',
    icon: '🔖',
    sortable: false,
    type: 'text',
    format: (value) => value || '-'
  },
  {
    key: 'type',
    label: 'Type',
    icon: '🏷️',
    sortable: true,
    type: 'badge',
    getBadgeClass: (value) => 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300',
    format: (value) => this.capitalizeFirst(value)
  },
  {
    key: 'paymentMethod',
    label: 'Payment',
    icon: '💳',
    sortable: false,
    type: 'badge',
    getBadgeClass: (value) => this.getPaymentMethodClass(value)
  },
  {
    key: 'amount',
    label: 'Amount',
    icon: '💰',
    sortable: true,
    type: 'number',
    align: 'right',
    format: (value) => this.formatPrice(value)
  },
  {
    key: 'status',
    label: 'Status',
    icon: '🔘',
    sortable: true,
    type: 'badge',
    align: 'center',
    getBadgeClass: (value) => this.getStatusClass(value),
    format: (value) => this.capitalizeFirst(value)
  },
  {
    key: 'date',
    label: 'Date',
    icon: '📅',
    sortable: true,
    type: 'date',
    format: (value) => this.formatDate(value)
  },
  {
    key: 'actions',
    label: 'Action',
    icon: '⚙️',
    sortable: false,
    type: 'actions',
    align: 'center'
  }
];
```

### 6. Configure Row Actions

```typescript
rowActions: ActionButton[] = [
  {
    icon: '👁️',
    label: 'View Details',
    class: 'inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-blue-700 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 rounded shadow-sm hover:bg-blue-100 dark:hover:bg-blue-900/30 transition-all duration-200 hover:scale-105 hover:shadow-md group',
    action: (item) => this.viewItem(item)
  },
  {
    icon: '🗑️',
    label: 'Delete',
    class: 'inline-flex items-center gap-1 px-2 py-1.5 text-xs font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded shadow-sm hover:bg-red-100 dark:hover:bg-red-900/30 transition-all duration-200 hover:scale-105 hover:shadow-md group',
    action: (item) => this.deleteItem(item)
  }
];
```

### 7. Configure Bulk Actions

```typescript
bulkActions: BulkAction[] = [
  {
    icon: '📊',
    label: 'Export CSV',
    class: 'inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition',
    action: (items) => this.exportSelected(items, 'csv')
  },
  {
    icon: '📗',
    label: 'Export Excel',
    class: 'inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition',
    action: (items) => this.exportSelected(items, 'excel')
  },
  {
    icon: '🗑️',
    label: 'Delete Selected',
    class: 'inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-red-700 dark:text-red-400 bg-red-50 dark:bg-red-900/20 rounded hover:bg-red-100 dark:hover:bg-red-900/30 transition',
    action: (items) => this.deleteMultiple(items)
  }
];
```

### 8. Implement Event Handlers

```typescript
// Signals
allData = signal<any[]>([]);
loading = signal(false);
selectedIds = signal<Set<number>>(new Set());
selectAll = signal(false);
sortColumn = signal<string | null>(null);
sortDirection = signal<'asc' | 'desc'>('desc');
currentPage = signal(1);
pageSize = signal(10);
customDateFrom = signal('');
customDateTo = signal('');

// Computed values
filteredData = computed(() => {
  let filtered = this.allData();
  
  // Apply filters based on filterValues
  if (this.filterValues['status'] !== 'all') {
    filtered = filtered.filter(item => item.status === this.filterValues['status']);
  }
  
  if (this.filterValues['type'] !== 'all') {
    filtered = filtered.filter(item => item.type === this.filterValues['type']);
  }
  
  if (this.filterValues['search']) {
    const query = this.filterValues['search'].toLowerCase();
    filtered = filtered.filter(item => 
      item.description?.toLowerCase().includes(query) ||
      item.invoiceId?.toLowerCase().includes(query)
    );
  }
  
  // Apply sorting
  if (this.sortColumn()) {
    filtered = [...filtered].sort((a, b) => {
      const aVal = a[this.sortColumn()!];
      const bVal = b[this.sortColumn()!];
      const modifier = this.sortDirection() === 'asc' ? 1 : -1;
      return aVal > bVal ? modifier : -modifier;
    });
  }
  
  return filtered;
});

paginatedData = computed(() => {
  const start = (this.currentPage() - 1) * this.pageSize();
  const end = start + this.pageSize();
  return this.filteredData().slice(start, end);
});

totalPages = computed(() => Math.ceil(this.filteredData().length / this.pageSize()));

// Event handlers
onFilterChange(event: { key: string; value: any }): void {
  this.filterValues[event.key] = event.value;
  this.currentPage.set(1);
  // Trigger re-computation by updating a signal if needed
}

onClearFilters(): void {
  this.filterValues = {
    search: '',
    status: 'all',
    type: 'all',
    dateRange: 'all'
  };
  this.customDateFrom.set('');
  this.customDateTo.set('');
  this.currentPage.set(1);
}

onSortChange(column: string): void {
  if (this.sortColumn() === column) {
    this.sortDirection.set(this.sortDirection() === 'asc' ? 'desc' : 'asc');
  } else {
    this.sortColumn.set(column);
    this.sortDirection.set('desc');
  }
}

toggleSelection(id: number): void {
  const selected = new Set(this.selectedIds());
  if (selected.has(id)) {
    selected.delete(id);
  } else {
    selected.add(id);
  }
  this.selectedIds.set(selected);
}

toggleSelectAll(): void {
  if (this.selectAll()) {
    this.selectedIds.set(new Set());
    this.selectAll.set(false);
  } else {
    const allIds = new Set(this.paginatedData().map(item => item.id));
    this.selectedIds.set(allIds);
    this.selectAll.set(true);
  }
}

clearSelection(): void {
  this.selectedIds.set(new Set());
  this.selectAll.set(false);
}

onPageSizeChange(size: number): void {
  this.pageSize.set(size);
  this.currentPage.set(1);
}

previousPage(): void {
  if (this.currentPage() > 1) {
    this.currentPage.set(this.currentPage() - 1);
  }
}

nextPage(): void {
  if (this.currentPage() < this.totalPages()) {
    this.currentPage.set(this.currentPage() + 1);
  }
}

// Action methods
viewItem(item: any): void {
  console.log('View:', item);
  // Navigate or show modal
}

deleteItem(item: any): void {
  if (confirm(`Delete ${item.description}?`)) {
    this.allData.update(data => data.filter(d => d.id !== item.id));
  }
}

exportSelected(items: any[], format: string): void {
  console.log(`Export ${items.length} items as ${format}`);
  // Implement export logic
}

deleteMultiple(items: any[]): void {
  if (confirm(`Delete ${items.length} items?`)) {
    const ids = new Set(items.map(i => i.id));
    this.allData.update(data => data.filter(d => !ids.has(d.id)));
    this.clearSelection();
  }
}
```

## Complete Working Example

See `transaction-history.component.ts` for a full implementation reference.

## Features

✅ **Fully Responsive** - Works on mobile, tablet, and desktop
✅ **Dark Mode Support** - Automatic theme switching
✅ **Signal-Based** - Uses Angular signals for reactivity
✅ **Type-Safe** - Full TypeScript support with interfaces
✅ **Customizable** - Every aspect can be configured
✅ **Accessible** - Semantic HTML and ARIA labels
✅ **Performant** - Optimized rendering with OnPush strategy
✅ **Production Ready** - Battle-tested design patterns

## Benefits

1. **Consistency** - Same look and feel across all data pages
2. **Speed** - Implement new pages in minutes instead of hours
3. **Maintainability** - Fix bugs once, applies everywhere
4. **Flexibility** - Highly configurable while maintaining design consistency
5. **DRY Principle** - Don't Repeat Yourself - write once, use many times

## Use Cases

- Transaction History
- User Management
- Order Management
- Product Listings
- Report Tables
- Audit Logs
- Any data table with filters and actions
