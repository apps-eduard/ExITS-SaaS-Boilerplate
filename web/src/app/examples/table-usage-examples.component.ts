/**
 * Example: Using TableStateService with DataManagementPageComponent
 * Shows both Local and API modes
 */

import { Component, OnInit, effect, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TableStateService, TableStateManager } from '../shared/services/table-state.service';
import {
  DataManagementPageComponent,
  StatCard,
  FilterField,
  ColumnDefinition,
  ActionButton,
  BulkAction
} from '../shared/components/ui';

interface User {
  id: number;
  email: string;
  first_name: string;
  last_name: string;
  role: string;
  status: string;
  created_at: string;
}

@Component({
  selector: 'app-users-table-example',
  standalone: true,
  imports: [CommonModule, FormsModule, DataManagementPageComponent],
  template: `
    <app-data-management-page
      [pageIcon]="'👥'"
      [pageTitle]="'Users Management'"
      [pageDescription]="'Manage system users'"
      [statCards]="statCards"
      [filterFields]="filterFields"
      [filterValues]="filterValues"
      [columns]="columns"
      [data]="tableManager.data()"
      [loading]="tableManager.loading()"
      [selectable]="true"
      [showRowNumbers]="true"
      [selectedIds]="selectedIds()"
      [selectAll]="selectAll()"
      [sortColumn]="tableManager.state().sortColumn"
      [sortDirection]="tableManager.state().sortDirection"
      [rowActions]="rowActions"
      [bulkActions]="bulkActions"
      [currentPage]="tableManager.pagination().page"
      [pageSize]="tableManager.pagination().pageSize"
      [totalRecords]="tableManager.pagination().total"
      [totalPages]="tableManager.pagination().totalPages"
      (filterChange)="onFilterChange($event)"
      (clearFilters)="onClearFilters()"
      (sortChange)="onSortChange($event)"
      (pageSizeChange)="tableManager.setPageSize($event)"
      (previousPage)="tableManager.setPage(tableManager.pagination().page - 1)"
      (nextPage)="tableManager.setPage(tableManager.pagination().page + 1)"
    />
  `
})
export class UsersTableExampleComponent implements OnInit {
  // Table manager (API mode)
  tableManager!: TableStateManager<User>;

  // Selection state
  selectedIds = signal<Set<number>>(new Set());
  selectAll = signal(false);

  // Filter values
  filterValues: Record<string, any> = {};

  // Stats cards
  statCards: StatCard[] = [
    { label: 'Total Users', value: '0', icon: '👥', valueClass: 'text-blue-600', iconBgClass: 'bg-blue-100' },
    { label: 'Active', value: '0', icon: '✅', valueClass: 'text-green-600', iconBgClass: 'bg-green-100' },
    { label: 'Inactive', value: '0', icon: '⏸️', valueClass: 'text-gray-600', iconBgClass: 'bg-gray-100' }
  ];

  // Filter fields
  filterFields: FilterField[] = [
    {
      type: 'search',
      label: 'Search',
      modelKey: 'search',
      placeholder: 'Search by name or email...'
    },
    {
      type: 'select',
      label: 'Role',
      modelKey: 'role',
      placeholder: 'All Roles',
      options: [
        { value: 'admin', label: 'Admin' },
        { value: 'user', label: 'User' },
        { value: 'manager', label: 'Manager' }
      ]
    },
    {
      type: 'select',
      label: 'Status',
      modelKey: 'status',
      placeholder: 'All Statuses',
      options: [
        { value: 'active', label: 'Active' },
        { value: 'inactive', label: 'Inactive' }
      ]
    }
  ];

  // Column definitions
  columns: ColumnDefinition[] = [
    { key: 'id', label: 'ID', icon: '🔢', sortable: true, align: 'center' },
    { key: 'email', label: 'Email', icon: '📧', sortable: true },
    { key: 'first_name', label: 'First Name', icon: '👤', sortable: true },
    { key: 'last_name', label: 'Last Name', icon: '👤', sortable: true },
    { key: 'role', label: 'Role', icon: '🎭', sortable: true, type: 'badge' },
    { key: 'status', label: 'Status', icon: '🔘', sortable: true, type: 'badge' },
    { 
      key: 'created_at', 
      label: 'Created', 
      icon: '📅', 
      sortable: true, 
      format: (value: any) => value ? new Date(value).toLocaleDateString() : '-'
    },
    { key: 'actions', label: 'Actions', icon: '⚙️', sortable: false, type: 'actions', align: 'right' }
  ];

  // Row actions
  rowActions: ActionButton[] = [
    { icon: '✏️', label: 'Edit', class: 'text-blue-600 hover:text-blue-800', action: (user) => this.editUser(user) },
    { icon: '🗑️', label: 'Delete', class: 'text-red-600 hover:text-red-800', action: (user) => this.deleteUser(user) }
  ];

  // Bulk actions
  bulkActions: BulkAction[] = [
    {
      icon: '📄',
      label: 'CSV',
      class: 'inline-flex items-center gap-1 px-3 py-1 text-xs font-medium text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition',
      action: (items) => this.exportToCSV(items)
    }
  ];

  constructor(private tableStateService: TableStateService) {}

  ngOnInit() {
    // Create table manager in API mode
    this.tableManager = this.tableStateService.createTableManager<User>(
      {
        defaultPageSize: 15,
        pageSizeOptions: [10, 15, 25, 50],
        defaultSort: { column: 'created_at', direction: 'desc' },
        mode: 'api'
      },
      '/api/tenants/1/users' // API endpoint
    );

    // Sync filter values with table state
    effect(() => {
      const state = this.tableManager.state();
      this.filterValues = {
        search: state.search,
        ...state.filters
      };
    });

    // Update stats when data changes
    effect(() => {
      const data = this.tableManager.data();
      const pagination = this.tableManager.pagination();
      
      this.statCards[0].value = pagination.total.toString();
      this.statCards[1].value = data.filter(u => u.status === 'active').length.toString();
      this.statCards[2].value = data.filter(u => u.status === 'inactive').length.toString();
    });
  }

  onFilterChange(event: { key: string; value: any }) {
    if (event.key === 'search') {
      this.tableManager.setSearch(event.value);
    } else {
      this.tableManager.setFilter(event.key, event.value);
    }
  }

  onClearFilters() {
    this.tableManager.clearFilters();
    this.filterValues = {};
  }

  onSortChange(column: string) {
    const state = this.tableManager.state();
    const direction = state.sortColumn === column && state.sortDirection === 'asc' ? 'desc' : 'asc';
    this.tableManager.setSort(column, direction);
  }

  editUser(user: User) {
    console.log('Edit user:', user);
  }

  deleteUser(user: User) {
    if (confirm(`Delete user ${user.email}?`)) {
      console.log('Delete user:', user);
    }
  }

  exportToCSV(users: User[]) {
    const headers = ['ID', 'Email', 'First Name', 'Last Name', 'Role', 'Status'];
    const rows = users.map(u => [u.id, u.email, u.first_name, u.last_name, u.role, u.status]);
    
    const csvContent = [
      headers.join(','),
      ...rows.map(row => row.join(','))
    ].join('\n');
    
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `users-${new Date().toISOString().split('T')[0]}.csv`;
    link.click();
  }
}


/**
 * Example 2: Local Mode (Client-Side Table)
 */
@Component({
  selector: 'app-local-table-example',
  standalone: true,
  imports: [CommonModule, FormsModule, DataManagementPageComponent],
  template: `
    <app-data-management-page
      [pageTitle]="'Local Data Table'"
      [columns]="columns"
      [data]="tableManager.data()"
      [currentPage]="tableManager.pagination().page"
      [pageSize]="tableManager.pagination().pageSize"
      [totalRecords]="tableManager.pagination().total"
      [totalPages]="tableManager.pagination().totalPages"
      (sortChange)="tableManager.setSort($event)"
      (pageSizeChange)="tableManager.setPageSize($event)"
      (previousPage)="tableManager.setPage(tableManager.pagination().page - 1)"
      (nextPage)="tableManager.setPage(tableManager.pagination().page + 1)"
    />
  `
})
export class LocalTableExampleComponent implements OnInit {
  tableManager!: TableStateManager<any>;

  columns: ColumnDefinition[] = [
    { key: 'id', label: 'ID', sortable: true },
    { key: 'name', label: 'Name', sortable: true },
    { key: 'email', label: 'Email', sortable: true }
  ];

  // Mock local data
  mockData = [
    { id: 1, name: 'John Doe', email: 'john@example.com' },
    { id: 2, name: 'Jane Smith', email: 'jane@example.com' },
    { id: 3, name: 'Bob Johnson', email: 'bob@example.com' },
    // ... more data
  ];

  constructor(private tableStateService: TableStateService) {}

  ngOnInit() {
    // Create table manager in LOCAL mode
    this.tableManager = this.tableStateService.createTableManager(
      {
        defaultPageSize: 10,
        mode: 'local'
      },
      this.mockData // Pass array for local mode
    );
  }
}
