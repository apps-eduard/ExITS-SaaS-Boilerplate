# Table State Service Integration Guide

## Overview

This guide documents the professional implementation of table state management using `TableStateService` in the Users Management component. This pattern should be followed for all future table-based components.

## What is Table State Service?

`TableStateService` is a comprehensive Angular service that manages table state including:
- **Pagination**: Page number, page size, total records
- **Sorting**: Column, direction (asc/desc)
- **Filtering**: Multi-column filters with serialization
- **Searching**: Debounced full-text search
- **Loading States**: Loading, error, data signals
- **Request Management**: Automatic debouncing, request cancellation

## Implementation Example: Users Management

### 1. Service Setup

```typescript
import { TableStateService } from '../../../../shared/services/table-state.service';
import { User } from '../../../../core/services/user.service';

export class UsersManagementComponent implements OnInit, OnDestroy {
  private tableStateService = inject(TableStateService);

  // Create table manager with API mode
  tableManager = this.tableStateService.createTableManager<User>(
    {
      mode: 'api',                    // 'api' or 'local'
      defaultPageSize: 25,
      defaultSort: { column: 'createdAt', direction: 'desc' },
      debounceSearch: 300            // Debounce search by 300ms
    },
    '/api/users'                     // API endpoint
  );

  ngOnInit() {
    // Table manager automatically loads data
  }

  ngOnDestroy() {
    // Clean up (cancels pending requests)
    this.tableManager.destroy();
  }
}
```

### 2. Template Integration

#### Data Binding
```html
<!-- Access data -->
<tr *ngFor="let user of tableManager.data()">
  <td>{{ user.email }}</td>
</tr>

<!-- Loading state -->
<div *ngIf="tableManager.loading()">Loading...</div>

<!-- Error state -->
<div *ngIf="tableManager.error()">{{ tableManager.error() }}</div>

<!-- Pagination info -->
<span>{{ tableManager.pagination().page }} of {{ tableManager.pagination().totalPages }}</span>
```

#### Search
```html
<input
  type="text"
  [(ngModel)]="searchQuery"
  (ngModelChange)="onSearchChange($event)"
/>

<!-- Component method -->
onSearchChange(query: string) {
  this.tableManager.setSearch(query);  // Automatically debounced
}
```

#### Filters
```html
<select [(ngModel)]="statusFilter" (ngModelChange)="onStatusFilterChange($event)">
  <option value="">All</option>
  <option value="active">Active</option>
</select>

<!-- Component method -->
onStatusFilterChange(status: string) {
  if (status) {
    this.tableManager.setFilter('status', status);
  } else {
    this.tableManager.setFilter('status', null);
  }
}
```

#### Sorting
```html
<th (click)="toggleSort('email')">
  Email
  <span *ngIf="tableManager.state().sortColumn === 'email'">
    {{ tableManager.state().sortDirection === 'asc' ? '↑' : '↓' }}
  </span>
</th>

<!-- Component method -->
toggleSort(column: string) {
  const currentState = this.tableManager.state();
  const newDirection = 
    currentState.sortColumn === column && currentState.sortDirection === 'asc' 
      ? 'desc' 
      : 'asc';
  this.tableManager.setSort(column, newDirection);
}
```

#### Pagination
```html
<button
  (click)="tableManager.setPage(tableManager.pagination().page - 1)"
  [disabled]="tableManager.pagination().page === 1"
>
  Previous
</button>

<select
  [ngModel]="tableManager.state().pageSize"
  (ngModelChange)="tableManager.setPageSize($event)"
>
  <option [value]="10">10</option>
  <option [value]="25">25</option>
  <option [value]="50">50</option>
</select>
```

### 3. Managing UI-Specific State

Table State Service manages data, but UI-specific state like selection should be managed separately:

```typescript
// Selection is NOT part of table state
selectedUsers = signal<Set<string>>(new Set());

toggleUserSelection(userId: string) {
  const newSelection = new Set(this.selectedUsers());
  if (newSelection.has(userId)) {
    newSelection.delete(userId);
  } else {
    newSelection.add(userId);
  }
  this.selectedUsers.set(newSelection);
}

toggleSelectAll() {
  const users = this.tableManager.data();
  if (this.isAllSelected()) {
    this.selectedUsers.set(new Set());
  } else {
    this.selectedUsers.set(new Set(users.map(u => u.id)));
  }
}
```

## API Requirements

### Endpoint Structure

The API endpoint must accept and return specific formats:

#### Request (Query Parameters)
```
GET /api/users?page=1&pageSize=25&sortBy=createdAt&sortDir=desc&search=john&status=active
```

#### Response (JSON)
```json
{
  "data": [
    {
      "id": "1",
      "email": "john@example.com",
      "firstName": "John",
      "lastName": "Doe",
      "status": "active",
      "roles": [
        { "id": "1", "name": "Admin", "space": "tenant" }
      ],
      "createdAt": "2025-01-01T00:00:00Z",
      "lastLoginAt": "2025-01-15T10:30:00Z"
    }
  ],
  "pagination": {
    "page": 1,
    "pageSize": 25,
    "total": 150,
    "totalPages": 6
  },
  "sort": {
    "column": "createdAt",
    "direction": "desc"
  }
}
```

### Backend Implementation Example (Express/NestJS)

```typescript
// Controller
@Get('users')
async getUsers(
  @Query('page') page: number = 1,
  @Query('pageSize') pageSize: number = 25,
  @Query('sortBy') sortBy: string = 'createdAt',
  @Query('sortDir') sortDir: 'asc' | 'desc' = 'desc',
  @Query('search') search: string = '',
  @Query('status') status?: string
): Promise<TableResponse<User>> {
  // Build query with filters
  let query = this.userRepository.createQueryBuilder('user');

  // Apply search
  if (search) {
    query = query.where(
      'user.email ILIKE :search OR user.firstName ILIKE :search OR user.lastName ILIKE :search',
      { search: `%${search}%` }
    );
  }

  // Apply filters
  if (status) {
    query = query.andWhere('user.status = :status', { status });
  }

  // Apply sorting
  query = query.orderBy(`user.${sortBy}`, sortDir.toUpperCase() as 'ASC' | 'DESC');

  // Get total count
  const total = await query.getCount();

  // Apply pagination
  const offset = (page - 1) * pageSize;
  query = query.skip(offset).take(pageSize);

  // Execute query
  const users = await query.getMany();

  // Return response
  return {
    data: users,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize)
    },
    sort: {
      column: sortBy,
      direction: sortDir
    }
  };
}
```

## Local Mode (Client-Side)

For small datasets, use local mode:

```typescript
tableManager = this.tableStateService.createTableManager<User>(
  {
    mode: 'local',  // Client-side filtering/sorting
    defaultPageSize: 25
  },
  users  // Pass array directly
);
```

Local mode automatically handles:
- Client-side filtering
- Client-side sorting
- Client-side pagination
- No API calls

## Advanced Features

### Custom Sort Comparators

```typescript
tableManager = this.tableStateService.createTableManager<User>(
  {
    mode: 'local',
    customSortComparators: {
      fullName: (a, b, direction) => {
        const nameA = `${a.firstName} ${a.lastName}`;
        const nameB = `${b.firstName} ${b.lastName}`;
        return direction === 'asc' 
          ? nameA.localeCompare(nameB)
          : nameB.localeCompare(nameA);
      }
    }
  },
  users
);
```

### Filter Serialization

```typescript
// Array filters
tableManager.setFilter('roles', ['admin', 'manager']);

// Serialization options
{
  arrayFilterFormat: 'comma'      // ?roles=admin,manager
  arrayFilterFormat: 'brackets'   // ?roles[]=admin&roles[]=manager
  arrayFilterFormat: 'repeat'     // ?roles=admin&roles=manager
}
```

### Manual Refresh

```typescript
// Refresh data from API
tableManager.refresh();

// After CRUD operations
async deleteUser(user: User) {
  await this.userService.deleteUser(user.id);
  this.tableManager.refresh();  // Reload table data
}
```

## Benefits

### Performance
- **Debouncing**: Search inputs debounced (300ms default)
- **Request Cancellation**: Previous requests cancelled automatically
- **Memoization**: Sorting/filtering memoized in local mode

### Developer Experience
- **Type Safety**: Full TypeScript support with generics
- **Signals**: Reactive state with Angular signals
- **Simple API**: Clean, declarative interface
- **Error Handling**: Built-in error state management

### Maintainability
- **Separation of Concerns**: Table state separate from UI state
- **Reusability**: Same pattern across all tables
- **Testability**: Easy to mock and test

## Migration from Manual State

### Before (Manual State)
```typescript
currentPage = signal(1);
pageSize = 10;
searchQuery = '';
statusFilter = '';
loading = signal(false);
users = signal<User[]>([]);

async loadUsers() {
  this.loading.set(true);
  try {
    const response = await this.http.get('/api/users', {
      params: {
        page: this.currentPage(),
        pageSize: this.pageSize,
        search: this.searchQuery,
        status: this.statusFilter
      }
    });
    this.users.set(response.data);
  } catch (error) {
    // Handle error
  } finally {
    this.loading.set(false);
  }
}
```

### After (Table State Service)
```typescript
tableManager = this.tableStateService.createTableManager<User>(
  {
    mode: 'api',
    defaultPageSize: 10,
  },
  '/api/users'
);

// All state management is automatic!
// Access via:
// - tableManager.data()
// - tableManager.loading()
// - tableManager.error()
// - tableManager.pagination()
```

## Best Practices

### 1. Always Destroy on Component Cleanup
```typescript
ngOnDestroy() {
  this.tableManager.destroy();  // Prevents memory leaks
}
```

### 2. Use Correct Mode
- **API Mode**: For server-side pagination (large datasets)
- **Local Mode**: For client-side pagination (small datasets <1000 records)

### 3. Separate UI State
- Keep selection, modals, etc. separate from table state
- Table state = data management only

### 4. Handle Permissions
```typescript
<button
  *ngIf="canEditUser(user)"
  (click)="editUser(user)"
>
  Edit
</button>

canEditUser(user: User): boolean {
  return this.authService.hasPermission('users.update');
}
```

### 5. Use Helper Methods
```typescript
// Don't access complex fields directly in template
getDisplayName(user: User): string {
  if (user.fullName) return user.fullName;
  if (user.firstName && user.lastName) {
    return `${user.firstName} ${user.lastName}`;
  }
  return user.email;
}

// Template
<td>{{ getDisplayName(user) }}</td>
```

## Troubleshooting

### Issue: Table doesn't load data
- Check API endpoint returns correct format
- Verify `TableResponse<T>` structure
- Check browser network tab for errors

### Issue: Search doesn't work
- Ensure backend implements search parameter
- Check debounce time (default 300ms)
- Verify search field mapping

### Issue: Pagination shows wrong total
- Backend must return correct `pagination.total`
- Check SQL COUNT query
- Verify filters applied to count query

### Issue: Memory leak warnings
- Always call `tableManager.destroy()` in `ngOnDestroy()`
- Unsubscribe from any custom observables

## Summary

The Table State Service provides a professional, performant, and maintainable solution for table state management. By following this pattern:

1. **Create** table manager with config and data source
2. **Bind** template to signals (data, loading, error, pagination)
3. **Handle** user interactions (search, filter, sort, page)
4. **Manage** UI state (selection) separately
5. **Clean up** on destroy

This approach eliminates boilerplate, improves performance, and ensures consistency across the application.

---

**Reference Implementation**: `web/src/app/features/platforms/money-loan/admin/users-management.component.ts`

**Service**: `web/src/app/shared/services/table-state.service.ts`

**Interfaces**: `web/src/app/shared/models/table.interface.ts`
