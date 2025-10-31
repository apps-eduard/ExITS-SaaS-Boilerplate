# 🧩 Reusable Table System - Complete Implementation Guide

## Overview

A complete, DRY (Don't Repeat Yourself) table implementation for Angular + Express + Knex + Tailwind CSS that provides:

- ✅ **Sorting** - Any column, asc/desc with visual indicators
- ✅ **Pagination** - Page number, page size, total count
- ✅ **Filtering** - Multi-column filtering with whitelisting
- ✅ **Search** - Cross-column text search
- ✅ **Dual Mode** - Client-side (local) or Server-side (API)
- ✅ **Type-Safe** - Full TypeScript support
- ✅ **Responsive** - Tailwind CSS with dark mode
- ✅ **Extendable** - Easy to add features like export, bulk actions

---

## Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                     FRONTEND (Angular)                       │
├─────────────────────────────────────────────────────────────┤
│  TableStateService                                          │
│  ├─ Local Mode (client-side sort/filter/page)              │
│  └─ API Mode (server-side with debouncing)                 │
│                                                             │
│  DataManagementPageComponent                               │
│  └─ Reusable UI with Tailwind CSS                         │
└─────────────────────────────────────────────────────────────┘
                            ↕ HTTP
┌─────────────────────────────────────────────────────────────┐
│                     BACKEND (Express)                        │
├─────────────────────────────────────────────────────────────┤
│  queryHelper Utility                                        │
│  ├─ Sorting (ORDER BY with whitelist)                      │
│  ├─ Pagination (LIMIT/OFFSET)                              │
│  ├─ Filtering (WHERE clauses)                              │
│  ├─ Search (LIKE across columns)                           │
│  └─ Total count (efficient single query)                   │
│                                                             │
│  Express Routes                                             │
│  └─ Standard response format                               │
└─────────────────────────────────────────────────────────────┘
```

---

## 📁 File Structure

```
project/
├── api/
│   └── src/
│       ├── utils/
│       │   └── queryHelper.ts              # Backend query utility
│       └── examples/
│           └── tableRouteExample.ts        # Backend usage examples
│
└── web/
    └── src/
        └── app/
            ├── shared/
            │   ├── models/
            │   │   └── table.interface.ts   # Shared types
            │   ├── services/
            │   │   └── table-state.service.ts # Frontend service
            │   └── components/
            │       └── ui/
            │           └── data-management-page.component.ts
            └── examples/
                └── table-usage-examples.component.ts
```

---

## 🔧 Backend Implementation

### 1. Query Helper Utility

**File:** `api/src/utils/queryHelper.ts`

```typescript
import { Knex } from 'knex';

export interface TableQueryParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
}

export interface TableQueryConfig {
  sortableColumns: string[];      // Whitelist sortable columns
  filterableColumns: string[];    // Whitelist filterable columns
  searchableColumns: string[];    // Columns to search
  defaultSort?: { column: string; direction: 'asc' | 'desc' };
  defaultPageSize?: number;
  maxPageSize?: number;
}

export interface TableQueryResult<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
  sort?: {
    column: string;
    direction: 'asc' | 'desc';
  };
}

export async function applyTableQuery<T>(
  query: Knex.QueryBuilder,
  params: TableQueryParams,
  config: TableQueryConfig
): Promise<TableQueryResult<T>> {
  // Implementation in queryHelper.ts
}
```

**Key Features:**
- ✅ Column whitelisting for security
- ✅ Efficient count query
- ✅ Safe SQL parameter handling
- ✅ Flexible filtering and search

### 2. Express Route Example

```typescript
import { Router } from 'express';
import { applyTableQuery, sanitizeTableParams } from '../utils/queryHelper';

router.get('/applications', async (req, res) => {
  const params = sanitizeTableParams(req.query);

  const config = {
    sortableColumns: ['application_number', 'created_at', 'status'],
    filterableColumns: ['status', 'product_id'],
    searchableColumns: ['application_number', 'customer_name'],
    defaultSort: { column: 'created_at', direction: 'desc' },
    defaultPageSize: 10,
    maxPageSize: 100
  };

  const query = db('loan_applications').where({ tenant_id });
  const result = await applyTableQuery(query, params, config);

  res.json(result);
});
```

**Response Format:**
```json
{
  "data": [...],
  "pagination": {
    "page": 1,
    "pageSize": 10,
    "total": 150,
    "totalPages": 15
  },
  "sort": {
    "column": "created_at",
    "direction": "desc"
  }
}
```

---

## 🎨 Frontend Implementation

### 1. Table State Service

**File:** `web/src/app/shared/services/table-state.service.ts`

```typescript
import { Injectable, signal, computed } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TableStateService {
  
  createTableManager<T>(
    config: TableConfig,
    dataSource: T[] | string  // Array for local, URL for API
  ): TableStateManager<T> {
    // Returns manager with signals and methods
  }
}
```

**Features:**
- ✅ Signal-based reactive state
- ✅ Local mode (client-side operations)
- ✅ API mode (server-side with debouncing)
- ✅ Automatic pagination recalculation
- ✅ Type-safe throughout

### 2. Usage in Component

```typescript
@Component({
  selector: 'app-users',
  template: `
    <app-data-management-page
      [columns]="columns"
      [data]="tableManager.data()"
      [loading]="tableManager.loading()"
      [currentPage]="tableManager.pagination().page"
      [totalRecords]="tableManager.pagination().total"
      (sortChange)="tableManager.setSort($event)"
      (pageSizeChange)="tableManager.setPageSize($event)"
    />
  `
})
export class UsersComponent implements OnInit {
  tableManager!: TableStateManager<User>;

  constructor(private tableStateService: TableStateService) {}

  ngOnInit() {
    // API Mode
    this.tableManager = this.tableStateService.createTableManager<User>(
      {
        defaultPageSize: 15,
        defaultSort: { column: 'created_at', direction: 'desc' },
        mode: 'api'
      },
      '/api/tenants/1/users'  // API endpoint
    );

    // OR Local Mode
    this.tableManager = this.tableStateService.createTableManager<User>(
      {
        defaultPageSize: 10,
        mode: 'local'
      },
      this.localData  // Array of data
    );
  }
}
```

---

## 🎯 Complete Example: Loan Applications

### Backend Route

```typescript
router.get('/applications', async (req: Request, res: Response) => {
  const params = sanitizeTableParams(req.query);

  const config: TableQueryConfig = {
    sortableColumns: [
      'application_number',
      'first_name',
      'last_name',
      'requested_amount',
      'requested_term_days',
      'status',
      'created_at'
    ],
    filterableColumns: ['status', 'loan_product_id'],
    searchableColumns: ['application_number', 'first_name', 'last_name'],
    defaultSort: { column: 'created_at', direction: 'desc' },
    defaultPageSize: 10,
    maxPageSize: 100
  };

  const query = db('loan_applications')
    .where({ tenant_id })
    .select('*');

  const result = await applyTableQuery(query, params, config);
  res.json(result);
});
```

### Frontend Component

```typescript
@Component({
  selector: 'app-loan-applications',
  template: `
    <app-data-management-page
      [pageIcon]="'📝'"
      [pageTitle]="'Loan Applications'"
      [statCards]="statCards"
      [filterFields]="filterFields"
      [columns]="columns"
      [data]="tableManager.data()"
      [loading]="tableManager.loading()"
      [selectable]="true"
      [showRowNumbers]="true"
      [sortColumn]="tableManager.state().sortColumn"
      [sortDirection]="tableManager.state().sortDirection"
      [currentPage]="tableManager.pagination().page"
      [pageSize]="tableManager.pagination().pageSize"
      [totalRecords]="tableManager.pagination().total"
      [totalPages]="tableManager.pagination().totalPages"
      (filterChange)="onFilterChange($event)"
      (sortChange)="tableManager.setSort($event)"
      (pageSizeChange)="tableManager.setPageSize($event)"
      (previousPage)="tableManager.setPage(tableManager.pagination().page - 1)"
      (nextPage)="tableManager.setPage(tableManager.pagination().page + 1)"
    />
  `
})
export class LoanApplicationsComponent implements OnInit {
  tableManager!: TableStateManager<LoanApplication>;

  filterFields: FilterField[] = [
    { type: 'search', label: 'Search', modelKey: 'search', placeholder: 'Search...' },
    { type: 'select', label: 'Status', modelKey: 'status', options: [...] }
  ];

  columns: ColumnDefinition[] = [
    { key: 'application_number', label: 'Application #', icon: '🔢', sortable: true },
    { key: 'customer_name', label: 'Customer', icon: '👤', sortable: true },
    { key: 'requested_amount', label: 'Amount', icon: '💰', sortable: true, format: 'currency' },
    { key: 'status', label: 'Status', icon: '🔘', sortable: true, type: 'badge' },
    { key: 'created_at', label: 'Created', icon: '📅', sortable: true, format: 'date' }
  ];

  constructor(private tableStateService: TableStateService) {}

  ngOnInit() {
    this.tableManager = this.tableStateService.createTableManager<LoanApplication>(
      {
        defaultPageSize: 10,
        defaultSort: { column: 'created_at', direction: 'desc' },
        mode: 'api'
      },
      '/api/tenants/1/platforms/moneyloan/loans/applications'
    );
  }

  onFilterChange(event: { key: string; value: any }) {
    if (event.key === 'search') {
      this.tableManager.setSearch(event.value);  // Debounced automatically
    } else {
      this.tableManager.setFilter(event.key, event.value);
    }
  }
}
```

---

## 🎨 Features

### Sorting
- Click column header to sort
- Click again to toggle asc/desc
- Visual indicators (↑↓)
- Whitelisted columns only

### Pagination
- Page size selector (10, 25, 50, 100)
- Next/Previous buttons
- Page info display
- Automatic total calculation

### Filtering
- Multiple filters simultaneously
- Type-safe filter definitions
- Automatic query building
- Clear all filters button

### Search
- Cross-column text search
- Debounced (300ms)
- Case-insensitive LIKE queries
- Configurable searchable columns

### Bulk Actions
- Checkbox selection
- Select all/deselect all
- Bulk action bar
- Export to CSV/Excel/PDF

---

## 🔒 Security Features

### Backend
- ✅ Column whitelisting (no SQL injection)
- ✅ Parameter sanitization
- ✅ Max page size enforcement
- ✅ Input validation

### Frontend
- ✅ Type-safe throughout
- ✅ XSS prevention (Angular sanitization)
- ✅ Request cancellation
- ✅ Error handling

---

## ⚡ Performance Optimizations

### Backend
- Single COUNT query (not per page)
- Indexed columns for sorting
- Efficient LIMIT/OFFSET
- Query builder reuse

### Frontend
- Signal-based reactivity (Angular 20)
- Debounced search (300ms)
- Request cancellation
- Computed pagination

---

## 🎨 UI/UX Features

- ✅ Responsive design (mobile-first)
- ✅ Dark mode support
- ✅ Loading skeletons
- ✅ Empty states
- ✅ Keyboard navigation
- ✅ Accessibility (ARIA labels)
- ✅ Tailwind CSS utilities

---

## 📦 API Query Format

### Request
```
GET /api/users?page=2&pageSize=25&sortBy=email&sortDir=asc&search=john&filter_status=active
```

### Response
```json
{
  "data": [
    { "id": 1, "email": "john@example.com", ... },
    { "id": 2, "email": "johnny@example.com", ... }
  ],
  "pagination": {
    "page": 2,
    "pageSize": 25,
    "total": 150,
    "totalPages": 6
  },
  "sort": {
    "column": "email",
    "direction": "asc"
  }
}
```

---

## 🔄 Migration Guide

### Step 1: Update Backend Route
```typescript
// Before
router.get('/users', async (req, res) => {
  const users = await db('users').select('*');
  res.json(users);
});

// After
router.get('/users', async (req, res) => {
  const params = sanitizeTableParams(req.query);
  const config = {
    sortableColumns: ['email', 'created_at'],
    filterableColumns: ['status'],
    searchableColumns: ['email', 'first_name'],
    defaultSort: { column: 'created_at', direction: 'desc' }
  };
  
  const query = db('users').select('*');
  const result = await applyTableQuery(query, params, config);
  res.json(result);
});
```

### Step 2: Update Frontend Component
```typescript
// Before
ngOnInit() {
  this.http.get('/api/users').subscribe(data => {
    this.users = data;
  });
}

// After
ngOnInit() {
  this.tableManager = this.tableStateService.createTableManager(
    { defaultPageSize: 10, mode: 'api' },
    '/api/users'
  );
}
```

### Step 3: Update Template
```html
<!-- Before -->
<table>
  <tr *ngFor="let user of users">
    <td>{{ user.email }}</td>
  </tr>
</table>

<!-- After -->
<app-data-management-page
  [columns]="columns"
  [data]="tableManager.data()"
  [currentPage]="tableManager.pagination().page"
  (sortChange)="tableManager.setSort($event)"
/>
```

---

## 🎯 Best Practices

1. **Always whitelist columns** for sorting/filtering
2. **Use appropriate page sizes** (10-25 for most tables)
3. **Index database columns** used for sorting
4. **Debounce search inputs** (already built-in)
5. **Handle errors gracefully** (use error signal)
6. **Test with large datasets** (1000+ records)
7. **Use signals** for reactive state
8. **Keep API responses consistent**

---

## 📚 Files Created

1. ✅ `api/src/utils/queryHelper.ts` - Backend query utility
2. ✅ `api/src/examples/tableRouteExample.ts` - Backend examples
3. ✅ `web/src/app/shared/models/table.interface.ts` - Shared types
4. ✅ `web/src/app/shared/services/table-state.service.ts` - Frontend service
5. ✅ `web/src/app/examples/table-usage-examples.component.ts` - Usage examples
6. ✅ This documentation file

---

## 🚀 Quick Start

### Backend
```typescript
import { applyTableQuery, sanitizeTableParams } from './utils/queryHelper';

router.get('/data', async (req, res) => {
  const params = sanitizeTableParams(req.query);
  const config = {
    sortableColumns: ['id', 'name'],
    filterableColumns: ['status'],
    searchableColumns: ['name', 'email'],
    defaultSort: { column: 'id', direction: 'desc' }
  };
  
  const query = db('my_table').select('*');
  const result = await applyTableQuery(query, params, config);
  res.json(result);
});
```

### Frontend
```typescript
import { TableStateService } from './shared/services/table-state.service';

@Component({ /* ... */ })
export class MyComponent implements OnInit {
  tableManager!: TableStateManager<MyData>;

  constructor(private tableStateService: TableStateService) {}

  ngOnInit() {
    this.tableManager = this.tableStateService.createTableManager(
      { defaultPageSize: 15, mode: 'api' },
      '/api/data'
    );
  }
}
```

---

## ✨ Summary

You now have a **complete, production-ready table system** that:

- ✅ Eliminates code duplication across all tables
- ✅ Provides consistent UX everywhere
- ✅ Scales to large datasets (server-side)
- ✅ Works offline (client-side mode)
- ✅ Is type-safe and maintainable
- ✅ Follows Angular 20 best practices
- ✅ Uses modern Tailwind CSS styling

**All your tables can now use this system with minimal code!**
