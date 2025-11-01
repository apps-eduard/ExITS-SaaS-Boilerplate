/**
 * Query Helper Utility for Express + Knex
 * Provides reusable, DRY logic for:
 * - Sorting (ORDER BY with whitelist)
 * - Pagination (LIMIT/OFFSET)
 * - Filtering (WHERE clauses)
 * - Search (LIKE across multiple columns)
 * - Total count calculation
 */

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
  sortableColumns: string[];
  filterableColumns: string[];
  searchableColumns: string[];
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

/**
 * Apply pagination, sorting, filtering, and search to a Knex query
 * @param query - Base Knex query
 * @param params - Query parameters from request
 * @param config - Configuration for allowed columns and defaults
 * @returns Promise with paginated results
 */
export async function applyTableQuery<T>(
  query: Knex.QueryBuilder,
  params: TableQueryParams,
  config: TableQueryConfig
): Promise<TableQueryResult<T>> {
  const {
    sortableColumns,
    filterableColumns,
    searchableColumns,
    defaultSort = { column: 'id', direction: 'desc' },
    defaultPageSize = 10,
    maxPageSize = 100
  } = config;

  // Clone the base query for count
  const countQuery = query.clone();

  // 1. Apply Filters
  if (params.filters && Object.keys(params.filters).length > 0) {
    Object.entries(params.filters).forEach(([key, value]) => {
      if (filterableColumns.includes(key) && value !== undefined && value !== null && value !== '') {
        if (Array.isArray(value)) {
          query.whereIn(key, value);
        } else {
          query.where(key, value);
        }
      }
    });
  }

  // 2. Apply Search
  if (params.search && params.search.trim() !== '' && searchableColumns.length > 0) {
    const searchTerm = `%${params.search.trim()}%`;
    query.where((builder) => {
      searchableColumns.forEach((column, index) => {
        if (index === 0) {
          builder.where(column, 'LIKE', searchTerm);
        } else {
          builder.orWhere(column, 'LIKE', searchTerm);
        }
      });
    });
  }

  // 3. Get Total Count (before pagination)
  const [{ count }] = await countQuery
    .count('* as count')
    .then((result: any) => result);
  const total = parseInt(count as string, 10);

  // 4. Apply Sorting
  let sortColumn = defaultSort.column;
  let sortDirection: 'asc' | 'desc' = defaultSort.direction;

  if (params.sortBy && sortableColumns.includes(params.sortBy)) {
    sortColumn = params.sortBy;
    sortDirection = params.sortDir === 'asc' ? 'asc' : 'desc';
  }

  query.orderBy(sortColumn, sortDirection);

  // 5. Apply Pagination
  const page = Math.max(1, parseInt(String(params.page || 1), 10));
  const pageSize = Math.min(
    maxPageSize,
    Math.max(1, parseInt(String(params.pageSize || defaultPageSize), 10))
  );
  const offset = (page - 1) * pageSize;

  query.limit(pageSize).offset(offset);

  // 6. Execute Query
  const data = await query;

  // 7. Calculate Total Pages
  const totalPages = Math.ceil(total / pageSize);

  return {
    data: data as T[],
    pagination: {
      page,
      pageSize,
      total,
      totalPages
    },
    sort: {
      column: sortColumn,
      direction: sortDirection
    }
  };
}

/**
 * Simplified helper for basic table queries
 * @param db - Knex instance
 * @param table - Table name
 * @param params - Query parameters
 * @param config - Configuration
 * @returns Promise with paginated results
 */
export async function queryTable<T>(
  db: Knex,
  table: string,
  params: TableQueryParams,
  config: TableQueryConfig
): Promise<TableQueryResult<T>> {
  const query = db(table).select('*');
  return applyTableQuery<T>(query, params, config);
}

/**
 * Helper to build filter object from query parameters
 * Extracts filter_* parameters and returns a clean object
 */
export function extractFilters(queryParams: Record<string, any>): Record<string, any> {
  const filters: Record<string, any> = {};
  
  Object.entries(queryParams).forEach(([key, value]) => {
    if (key.startsWith('filter_')) {
      const filterKey = key.replace('filter_', '');
      filters[filterKey] = value;
    }
  });
  
  return filters;
}

/**
 * Helper to validate and sanitize table query parameters
 */
export function sanitizeTableParams(queryParams: Record<string, any>): TableQueryParams {
  return {
    page: queryParams.page ? parseInt(String(queryParams.page), 10) : undefined,
    pageSize: queryParams.pageSize ? parseInt(String(queryParams.pageSize), 10) : undefined,
    sortBy: queryParams.sortBy ? String(queryParams.sortBy) : undefined,
    sortDir: queryParams.sortDir === 'asc' || queryParams.sortDir === 'desc' 
      ? queryParams.sortDir 
      : undefined,
    search: queryParams.search ? String(queryParams.search) : undefined,
    filters: extractFilters(queryParams)
  };
}
