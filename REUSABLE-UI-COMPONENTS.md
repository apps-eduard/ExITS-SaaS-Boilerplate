# Reusable UI Components Guide

This guide explains how to use the reusable UI components created from the Transaction History page pattern.

## Components Overview

1. **PageHeaderComponent** - Consistent page headers with icon, title, and description
2. **StatCardComponent** - Stat/metric cards with icons and values
3. **FilterSectionComponent** - Comprehensive filter section with search, selects, dates, and pagination
4. **DataTableComponent** - Feature-rich data table with sorting, selection, loading states, and custom templates

---

## 1. PageHeaderComponent

### Basic Usage

```typescript
import { PageHeaderComponent } from '@app/shared/components/ui';

@Component({
  imports: [PageHeaderComponent],
  template: `
    <app-page-header
      icon="🧾"
      title="Transaction History"
      description="View all your subscription payments and transactions"
    />
  `
})
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `icon` | string | '📄' | Emoji or icon to display |
| `title` | string | '' | Main heading text |
| `description` | string | '' | Subtitle/description text |

---

## 2. StatCardComponent

### Basic Usage

```typescript
import { StatCardComponent } from '@app/shared/components/ui';

@Component({
  imports: [StatCardComponent],
  template: `
    <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
      <app-stat-card
        label="Total"
        [value]="totalCount"
        icon="📊"
        valueColorClass="text-gray-900 dark:text-white"
        iconBgClass="bg-blue-100 dark:bg-blue-900/30"
      />
      
      <app-stat-card
        label="Completed"
        [value]="completedCount"
        icon="✅"
        valueColorClass="text-green-600 dark:text-green-400"
        iconBgClass="bg-green-100 dark:bg-green-900/30"
      />
      
      <app-stat-card
        label="Pending"
        [value]="pendingCount"
        icon="⏳"
        valueColorClass="text-yellow-600 dark:text-yellow-400"
        iconBgClass="bg-yellow-100 dark:bg-yellow-900/30"
      />
      
      <app-stat-card
        label="Failed"
        [value]="failedCount"
        icon="❌"
        valueColorClass="text-red-600 dark:text-red-400"
        iconBgClass="bg-red-100 dark:bg-red-900/30"
      />
    </div>
  `
})
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `label` | string | '' | Card label/title |
| `value` | string \| number | 0 | Value to display |
| `icon` | string | '📊' | Emoji or icon |
| `valueColorClass` | string | 'text-gray-900 dark:text-white' | Tailwind classes for value color |
| `iconBgClass` | string | 'bg-blue-100 dark:bg-blue-900/30' | Tailwind classes for icon background |

---

## 3. FilterSectionComponent

### Basic Usage

```typescript
import { FilterSectionComponent, FilterConfig } from '@app/shared/components/ui';

export class MyComponent {
  filterConfig: FilterConfig[] = [
    {
      type: 'search',
      label: '🔍 Search',
      placeholder: 'Search transactions...',
      modelKey: 'search'
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
        { value: 'payment', label: 'Payment' }
      ]
    },
    {
      type: 'date',
      label: 'Date',
      modelKey: 'date'
    }
  ];

  currentPage = 1;
  totalPages = 10;
  pageSize = 10;

  onFilterChange(filters: any) {
    console.log('Filters changed:', filters);
    // Apply filters to your data
  }

  onClearFilters() {
    console.log('Filters cleared');
    // Reset your data
  }

  onPageSizeChange(size: number) {
    this.pageSize = size;
    // Reload data with new page size
  }

  onPageChange(page: number) {
    this.currentPage = page;
    // Load new page
  }
}

@Component({
  imports: [FilterSectionComponent],
  template: `
    <app-filter-section
      [filters]="filterConfig"
      [currentPage]="currentPage"
      [totalPages]="totalPages"
      [pageSize]="pageSize"
      [showPageSize]="true"
      [showPagination]="true"
      (filterChange)="onFilterChange($event)"
      (clearFilters)="onClearFilters()"
      (pageSizeChange)="onPageSizeChange($event)"
      (pageChange)="onPageChange($event)"
    />
  `
})
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `filters` | FilterConfig[] | [] | Array of filter configurations |
| `showPageSize` | boolean | true | Show page size selector |
| `showPagination` | boolean | true | Show pagination controls |
| `currentPage` | number | 1 | Current page number |
| `totalPages` | number | 1 | Total number of pages |
| `pageSize` | number | 10 | Items per page |
| `pageSizeOptions` | number[] | [10, 25, 50, 100] | Page size options |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `filterChange` | Object | Emitted when any filter changes |
| `clearFilters` | void | Emitted when clear filters is clicked |
| `pageSizeChange` | number | Emitted when page size changes |
| `pageChange` | number | Emitted when page changes |

---

## 4. DataTableComponent

### Basic Usage

```typescript
import { DataTableComponent, TableColumn } from '@app/shared/components/ui';

export class MyComponent {
  columns: TableColumn[] = [
    {
      key: 'description',
      label: 'Description',
      icon: '📝',
      sortable: true,
      type: 'text'
    },
    {
      key: 'type',
      label: 'Type',
      icon: '🏷️',
      sortable: true,
      type: 'badge',
      getBadgeClass: (value) => 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-300'
    },
    {
      key: 'amount',
      label: 'Amount',
      icon: '💰',
      sortable: true,
      type: 'number',
      align: 'right',
      format: (value) => `₱${value.toFixed(2)}`
    },
    {
      key: 'status',
      label: 'Status',
      icon: '🔘',
      sortable: true,
      type: 'badge',
      getBadgeClass: (status) => {
        switch (status) {
          case 'completed':
            return 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400';
          case 'pending':
            return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400';
          case 'failed':
            return 'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400';
          default:
            return 'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300';
        }
      },
      format: (value) => value.charAt(0).toUpperCase() + value.slice(1)
    },
    {
      key: 'date',
      label: 'Date',
      icon: '📅',
      sortable: true,
      type: 'date',
      format: (date) => new Date(date).toLocaleDateString()
    }
  ];

  data = [
    { id: 1, description: 'Monthly subscription', type: 'subscription', amount: 999, status: 'completed', date: new Date() },
    { id: 2, description: 'Upgrade to Pro', type: 'upgrade', amount: 1999, status: 'pending', date: new Date() }
  ];

  selectedIds = new Set<number>();
  selectAll = false;
  loading = false;
  sortColumn = 'date';
  sortDirection: 'asc' | 'desc' = 'desc';

  onSelectionChange(ids: Set<number>) {
    this.selectedIds = ids;
  }

  onSelectAllChange(value: boolean) {
    this.selectAll = value;
    if (value) {
      this.selectedIds = new Set(this.data.map(item => item.id));
    } else {
      this.selectedIds = new Set();
    }
  }

  onSortChange(event: { column: string; direction: 'asc' | 'desc' }) {
    this.sortColumn = event.column;
    this.sortDirection = event.direction;
    // Apply sorting to your data
  }

  exportCSV() {
    console.log('Export selected:', Array.from(this.selectedIds));
  }
}

@Component({
  imports: [DataTableComponent],
  template: `
    <app-data-table
      [columns]="columns"
      [data]="data"
      [loading]="loading"
      [selectable]="true"
      [selectedIds]="selectedIds"
      [selectAll]="selectAll"
      [sortColumn]="sortColumn"
      [sortDirection]="sortDirection"
      rowIdKey="id"
      emptyIcon="🔍"
      emptyTitle="No transactions found"
      emptyMessage="Try adjusting your filters"
      (selectionChange)="onSelectionChange($event)"
      (selectAllChange)="onSelectAllChange($event)"
      (sortChange)="onSortChange($event)"
    >
      <!-- Bulk Actions -->
      <ng-container bulkActions>
        <button (click)="exportCSV()" class="inline-flex items-center gap-1 px-3 py-1 text-xs font-medium">
          <span>📊</span> Export CSV
        </button>
      </ng-container>

      <!-- Empty State Actions -->
      <ng-container emptyActions>
        <button class="px-4 py-2 text-xs bg-blue-50 rounded">
          Clear Filters
        </button>
      </ng-container>
    </app-data-table>
  `
})
```

### Props

| Prop | Type | Default | Description |
|------|------|---------|-------------|
| `columns` | TableColumn[] | [] | Column configurations |
| `data` | any[] | [] | Table data |
| `loading` | boolean | false | Show loading skeleton |
| `selectable` | boolean | false | Enable row selection |
| `rowIdKey` | string | 'id' | Property to use as row identifier |
| `selectedIds` | Set<any> | new Set() | Set of selected IDs |
| `selectAll` | boolean | false | Select all state |
| `sortColumn` | string \| null | null | Currently sorted column |
| `sortDirection` | 'asc' \| 'desc' | 'desc' | Sort direction |
| `emptyIcon` | string | '🔍' | Icon for empty state |
| `emptyTitle` | string | 'No data found' | Title for empty state |
| `emptyMessage` | string | 'Try adjusting your filters' | Message for empty state |
| `showFooter` | boolean | false | Show footer section |

### Events

| Event | Payload | Description |
|-------|---------|-------------|
| `selectionChange` | Set<any> | Emitted when selection changes |
| `selectAllChange` | boolean | Emitted when select all changes |
| `sortChange` | { column: string; direction: 'asc' \| 'desc' } | Emitted when sort changes |

### Content Projection

- `[bulkActions]` - Custom bulk action buttons
- `[emptyActions]` - Custom actions in empty state
- `[footer]` - Custom footer content

---

## Complete Example

Here's how to combine all components to create a page like Transaction History:

```typescript
import { Component, signal, computed } from '@angular/core';
import { 
  PageHeaderComponent, 
  StatCardComponent, 
  FilterSectionComponent, 
  DataTableComponent,
  FilterConfig,
  TableColumn 
} from '@app/shared/components/ui';

@Component({
  selector: 'app-my-page',
  standalone: true,
  imports: [
    PageHeaderComponent,
    StatCardComponent,
    FilterSectionComponent,
    DataTableComponent
  ],
  template: `
    <div class="space-y-4 p-6">
      <!-- Header -->
      <app-page-header
        icon="🧾"
        title="My Data Page"
        description="Manage your data efficiently"
      />

      <!-- Stats -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
        <app-stat-card
          label="Total"
          [value]="stats.total"
          icon="📊"
        />
        <app-stat-card
          label="Active"
          [value]="stats.active"
          icon="✅"
          valueColorClass="text-green-600 dark:text-green-400"
          iconBgClass="bg-green-100 dark:bg-green-900/30"
        />
      </div>

      <!-- Filters -->
      <app-filter-section
        [filters]="filterConfig"
        [currentPage]="currentPage"
        [totalPages]="totalPages"
        [pageSize]="pageSize"
        (filterChange)="onFilterChange($event)"
        (clearFilters)="onClearFilters()"
        (pageSizeChange)="onPageSizeChange($event)"
        (pageChange)="onPageChange($event)"
      />

      <!-- Table -->
      <app-data-table
        [columns]="columns"
        [data]="paginatedData"
        [loading]="loading"
        [selectable]="true"
        [selectedIds]="selectedIds"
        [selectAll]="selectAll"
        [sortColumn]="sortColumn"
        [sortDirection]="sortDirection"
        (selectionChange)="onSelectionChange($event)"
        (selectAllChange)="onSelectAllChange($event)"
        (sortChange)="onSortChange($event)"
      >
        <ng-container bulkActions>
          <button (click)="exportSelected()">Export</button>
        </ng-container>
      </app-data-table>
    </div>
  `
})
export class MyPageComponent {
  // Component logic here
}
```

---

## Styling Customization

All components use Tailwind CSS and support dark mode. You can customize:

1. **Colors**: Modify the color classes in props
2. **Spacing**: Adjust padding/margin in parent containers
3. **Borders**: Override border classes
4. **Shadows**: Change shadow utilities

Example:

```html
<app-stat-card
  valueColorClass="text-purple-600 dark:text-purple-400"
  iconBgClass="bg-purple-100 dark:bg-purple-900/30"
/>
```

---

## Best Practices

1. **Use signals** for reactive state management
2. **Keep data fetching** in parent components
3. **Use computed signals** for derived state (filtering, sorting)
4. **Leverage content projection** for custom content
5. **Follow the established patterns** for consistency

---

## Migration Tips

To migrate an existing page:

1. Replace custom header HTML with `<app-page-header>`
2. Convert stat cards to `<app-stat-card>` components
3. Extract filter logic to use `<app-filter-section>`
4. Migrate table to `<app-data-table>` with column configs
5. Move sorting/filtering to parent component logic
6. Use signals for reactive state

This ensures a consistent, maintainable UI across your application!
