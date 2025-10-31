/**
 * Shared Table Query/Response Interfaces
 * Used for consistent communication between Angular frontend and Express backend
 */

export interface TableQueryParams {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortDir?: 'asc' | 'desc';
  search?: string;
  filters?: Record<string, any>;
}

export interface PaginationInfo {
  page: number;
  pageSize: number;
  total: number;
  totalPages: number;
}

export interface SortInfo {
  column: string;
  direction: 'asc' | 'desc';
}

export interface TableResponse<T> {
  data: T[];
  pagination: PaginationInfo;
  sort?: SortInfo;
}

export interface TableState {
  page: number;
  pageSize: number;
  sortColumn: string | null;
  sortDirection: 'asc' | 'desc';
  search: string;
  filters: Record<string, any>;
}

/**
 * Custom comparator function for sorting
 * @param a First item to compare
 * @param b Second item to compare
 * @param direction Sort direction
 * @returns -1, 0, or 1 for sort order
 */
export type SortComparator<T> = (a: T, b: T, direction: 'asc' | 'desc') => number;

/**
 * Custom filter serializer for complex filter values
 * @param value Filter value (can be array, object, etc.)
 * @returns Serialized string for query parameter
 */
export type FilterSerializer = (value: any) => string;

/**
 * Column definition for custom sorting
 */
export interface ColumnSortConfig<T = any> {
  column: string;
  comparator: SortComparator<T>;
}

export interface TableConfig {
  defaultPageSize?: number;
  pageSizeOptions?: number[];
  defaultSort?: { column: string; direction: 'asc' | 'desc' };
  mode?: 'local' | 'api';
  
  // Advanced configurations
  customSortComparators?: Record<string, SortComparator<any>>;  // Column-specific sort functions
  filterSerializer?: FilterSerializer;  // Custom filter serialization
  arrayFilterFormat?: 'comma' | 'brackets' | 'repeat';  // How to serialize array filters
  debounceSearch?: number;  // Custom search debounce time (default: 300ms)
  debounceRefresh?: number;  // Custom refresh debounce time (default: 50ms)
}
