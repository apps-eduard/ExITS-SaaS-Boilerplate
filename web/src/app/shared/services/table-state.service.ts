/**
 * Table State Service
 * Manages table state (sorting, pagination, filtering, search) for reusable data tables
 * Supports both local (client-side) and API (server-side) modes
 *
 * Optimizations:
 * - Proper RxJS debouncing with switchMap
 * - Single refresh trigger to avoid duplicate API calls
 * - AbortController for request cancellation
 * - Computed totalPages on client-side
 * - Memoized sorting/filtering for performance
 */

import { Injectable, signal, computed, Signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { Subject, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap } from 'rxjs/operators';
import {
  TableQueryParams,
  TableResponse,
  TableState,
  TableConfig,
  PaginationInfo,
  SortComparator,
  FilterSerializer
} from '../models/table.interface';

export interface TableStateManager<T> {
  // State signals
  data: Signal<T[]>;
  loading: Signal<boolean>;
  error: Signal<string | null>;
  state: Signal<TableState>;
  pagination: Signal<PaginationInfo>;

  // Actions
  setPage(page: number): void;
  setPageSize(size: number): void;
  setSort(column: string, direction?: 'asc' | 'desc'): void;
  setSearch(term: string): void;
  setFilter(key: string, value: any): void;
  setFilters(filters: Record<string, any>): void;
  clearFilters(): void;
  refresh(): void;

  // Lifecycle
  destroy(): void;  // Cleanup subscriptions
}

@Injectable({
  providedIn: 'root'
})
export class TableStateService {
  private http = inject(HttpClient);

  constructor() {}

  /**
   * Create a new table state manager
   * @param config Configuration for the table
   * @param dataSource Data source (array for local mode, URL for API mode)
   * @returns TableStateManager instance
   */
  createTableManager<T>(
    config: TableConfig,
    dataSource: T[] | string
  ): TableStateManager<T> {
    const mode = config.mode || (typeof dataSource === 'string' ? 'api' : 'local');

    if (mode === 'local') {
      return this.createLocalTableManager(config, dataSource as T[]);
    } else {
      return this.createApiTableManager(config, dataSource as string);
    }
  }

  /**
   * Create a local (client-side) table manager
   * Optimized with memoization for large datasets
   */
  private createLocalTableManager<T>(
    config: TableConfig,
    sourceData: T[]
  ): TableStateManager<T> {
    // State signals
    const loading = signal(false);
    const error = signal<string | null>(null);
    const allData = signal<T[]>(sourceData);

    const state = signal<TableState>({
      page: 1,
      pageSize: config.defaultPageSize || 10,
      sortColumn: config.defaultSort?.column || null,
      sortDirection: config.defaultSort?.direction || 'desc',
      search: '',
      filters: {}
    });

    // Memoization cache for performance
    let cachedFilteredData: T[] | null = null;
    let cachedFilterKey = '';

    // Get custom comparator for a column
    const getComparator = (column: string): SortComparator<T> | null => {
      return config.customSortComparators?.[column] || null;
    };

    // Default sorting logic
    const defaultSort = (a: T, b: T, column: string, direction: 'asc' | 'desc'): number => {
      const aVal = (a as any)[column];
      const bVal = (b as any)[column];
      const modifier = direction === 'asc' ? 1 : -1;

      // Handle null/undefined values
      if (aVal == null && bVal == null) return 0;
      if (aVal == null) return 1 * modifier;
      if (bVal == null) return -1 * modifier;

      // Handle different types
      if (typeof aVal === 'string' && typeof bVal === 'string') {
        return aVal.localeCompare(bVal) * modifier;
      }

      // Handle dates
      if (aVal instanceof Date && bVal instanceof Date) {
        return (aVal.getTime() - bVal.getTime()) * modifier;
      }

      if (aVal < bVal) return -1 * modifier;
      if (aVal > bVal) return 1 * modifier;
      return 0;
    };

    // Computed filtered and sorted data with memoization
    const processedData = computed(() => {
      let result = [...allData()];
      const currentState = state();

      // Generate cache key for filters and search
      const filterKey = JSON.stringify({
        filters: currentState.filters,
        search: currentState.search
      });

      // Apply filters with memoization
      if (Object.keys(currentState.filters).length > 0 || currentState.search) {
        // Check if we can use cached filtered data
        if (cachedFilteredData && cachedFilterKey === filterKey) {
          result = cachedFilteredData;
        } else {
          // Apply filters
          if (Object.keys(currentState.filters).length > 0) {
            result = result.filter(item => {
              return Object.entries(currentState.filters).every(([key, value]) => {
                if (value === null || value === undefined || value === '') return true;
                const itemValue = (item as any)[key];

                // Support array filters (multi-select)
                if (Array.isArray(value)) {
                  return value.includes(itemValue);
                }
                return itemValue === value;
              });
            });
          }

          // Apply search
          if (currentState.search) {
            const searchLower = currentState.search.toLowerCase();
            result = result.filter(item => {
              return Object.values(item as any).some(val =>
                String(val).toLowerCase().includes(searchLower)
              );
            });
          }

          // Cache the filtered result
          cachedFilteredData = result;
          cachedFilterKey = filterKey;
        }
      }

      // Apply sorting (always applied fresh to allow sort direction changes)
      if (currentState.sortColumn) {
        const customComparator = getComparator(currentState.sortColumn);

        result = [...result].sort((a, b) => {
          // Use custom comparator if provided
          if (customComparator) {
            return customComparator(a, b, currentState.sortDirection);
          }

          // Use default sorting logic
          return defaultSort(a, b, currentState.sortColumn!, currentState.sortDirection);
        });
      }

      return result;
    });

    // Computed pagination info
    const pagination = computed(() => {
      const currentState = state();
      const total = processedData().length;
      const totalPages = Math.ceil(total / currentState.pageSize) || 1;

      // Ensure current page is within bounds
      const validPage = Math.min(currentState.page, totalPages);

      return {
        page: validPage,
        pageSize: currentState.pageSize,
        total,
        totalPages
      };
    });

    // Computed paginated data
    const data = computed(() => {
      const currentState = state();
      const validPage = pagination().page;
      const start = (validPage - 1) * currentState.pageSize;
      const end = start + currentState.pageSize;
      return processedData().slice(start, end);
    });

    return {
      data,
      loading,
      error,
      state,
      pagination,

      setPage(page: number) {
        const maxPage = pagination().totalPages;
        const validPage = Math.max(1, Math.min(page, maxPage));
        state.update(s => ({ ...s, page: validPage }));
      },

      setPageSize(size: number) {
        state.update(s => ({ ...s, pageSize: size, page: 1 }));
      },

      setSort(column: string, direction?: 'asc' | 'desc') {
        state.update(s => {
          const newDirection = direction || (s.sortColumn === column && s.sortDirection === 'desc' ? 'asc' : 'desc');
          return { ...s, sortColumn: column, sortDirection: newDirection };
        });
      },

      setSearch(term: string) {
        // Clear filter cache when search changes
        cachedFilteredData = null;
        cachedFilterKey = '';
        state.update(s => ({ ...s, search: term, page: 1 }));
      },

      setFilter(key: string, value: any) {
        // Clear filter cache when filters change
        cachedFilteredData = null;
        cachedFilterKey = '';
        state.update(s => ({
          ...s,
          filters: { ...s.filters, [key]: value },
          page: 1
        }));
      },

      setFilters(filters: Record<string, any>) {
        // Clear filter cache when filters change
        cachedFilteredData = null;
        cachedFilterKey = '';
        state.update(s => ({ ...s, filters, page: 1 }));
      },

      clearFilters() {
        // Clear filter cache
        cachedFilteredData = null;
        cachedFilterKey = '';
        state.update(s => ({ ...s, filters: {}, search: '', page: 1 }));
      },

      refresh() {
        // In local mode, refresh resets to source data and clears cache
        cachedFilteredData = null;
        cachedFilterKey = '';
        allData.set([...sourceData]);
      },

      destroy() {
        // Local mode has no subscriptions to clean up
        // Clear cache to free memory
        cachedFilteredData = null;
        cachedFilterKey = '';
      }
    };
  }

  /**
   * Create an API (server-side) table manager
   */
  private createApiTableManager<T>(
    config: TableConfig,
    apiUrl: string
  ): TableStateManager<T> {
    // State signals
    const loading = signal(false);
    const error = signal<string | null>(null);
    const data = signal<T[]>([]);

    const state = signal<TableState>({
      page: 1,
      pageSize: config.defaultPageSize || 10,
      sortColumn: config.defaultSort?.column || null,
      sortDirection: config.defaultSort?.direction || 'desc',
      search: '',
      filters: {}
    });

    const pagination = signal<PaginationInfo>({
      page: 1,
      pageSize: config.defaultPageSize || 10,
      total: 0,
      totalPages: 0
    });

    // Subject for triggering API calls - centralized refresh trigger
    const refresh$ = new Subject<void>();

    // Subject for debounced search
    const search$ = new Subject<string>();

    // AbortController for request cancellation
    let abortController: AbortController | null = null;

    // Subscription tracking for cleanup
    const subscriptions: Subscription[] = [];

    // Configurable debounce times
    const searchDebounce = config.debounceSearch ?? 300;
    const refreshDebounce = config.debounceRefresh ?? 50;

    // Get custom filter serializer or use default
    const getFilterSerializer = (): FilterSerializer => {
      return config.filterSerializer || ((value: any) => String(value));
    };

    // Get array filter format
    const getArrayFilterFormat = (): 'comma' | 'brackets' | 'repeat' => {
      return config.arrayFilterFormat || 'comma';
    };

    // Build query params from current state
    const buildQueryParams = (currentState: TableState): string => {
      let params = new HttpParams();

      params = params.set('page', currentState.page.toString());
      params = params.set('pageSize', currentState.pageSize.toString());

      if (currentState.sortColumn) {
        params = params.set('sortBy', currentState.sortColumn);
        params = params.set('sortDir', currentState.sortDirection);
      }

      if (currentState.search) {
        params = params.set('search', currentState.search);
      }

      // Apply custom filter serialization
      const serializer = getFilterSerializer();
      const arrayFormat = getArrayFilterFormat();

      Object.entries(currentState.filters).forEach(([key, value]) => {
        if (value !== null && value !== undefined && value !== '') {
          // Handle array values based on format
          if (Array.isArray(value)) {
            const serializedValues = value.map(v => serializer(v));
            switch (arrayFormat) {
              case 'comma':
                params = params.set(`filter_${key}`, serializedValues.join(','));
                break;
              case 'brackets':
                // Use append for multiple values with same key
                serializedValues.forEach(v => {
                  params = params.append(`filter_${key}[]`, v);
                });
                break;
              case 'repeat':
                // Repeat the parameter for each value
                serializedValues.forEach(v => {
                  params = params.append(`filter_${key}`, v);
                });
                break;
            }
          } else {
            params = params.set(`filter_${key}`, serializer(value));
          }
        }
      });

      return params.toString();
    };

    // Fetch data from API
    const fetchData = async () => {
      // Cancel previous request if still pending
      if (abortController) {
        abortController.abort();
      }

      abortController = new AbortController();
      loading.set(true);
      error.set(null);

      try {
        const currentState = state();
        const queryString = buildQueryParams(currentState);

        // Use HttpClient instead of fetch to go through interceptors
        const result: TableResponse<T> = await new Promise((resolve, reject) => {
          const params = new HttpParams({ fromString: queryString });
          const subscription = this.http.get<TableResponse<T>>(apiUrl, { params })
            .subscribe({
              next: (response) => resolve(response),
              error: (err) => reject(err)
            });

          // Store subscription for cleanup
          subscriptions.push(subscription);
        });

        data.set(result.data);

        // Compute totalPages on client to avoid backend redundancy
        const totalPages = Math.ceil(result.pagination.total / result.pagination.pageSize);

        pagination.set({
          ...result.pagination,
          totalPages
        });
      } catch (err) {
        // Ignore aborted requests
        if (err instanceof Error && err.name === 'AbortError') {
          return;
        }

        error.set(err instanceof Error ? err.message : 'Unknown error occurred');
        data.set([]);
      } finally {
        loading.set(false);
        abortController = null;
      }
    };

    // Setup debounced search
    subscriptions.push(
      search$
        .pipe(
          debounceTime(searchDebounce),
          distinctUntilChanged()
        )
        .subscribe(() => {
          fetchData();
        })
    );

    // Setup centralized refresh trigger with debouncing
    subscriptions.push(
      refresh$
        .pipe(
          debounceTime(refreshDebounce), // Small debounce to batch rapid state changes
          distinctUntilChanged()
        )
        .subscribe(() => {
          fetchData();
        })
    );

    // Initial fetch
    fetchData();

    // Trigger refresh (debounced)
    const triggerRefresh = () => {
      refresh$.next();
    };

    return {
      data,
      loading,
      error,
      state,
      pagination,

      setPage(page: number) {
        state.update(s => ({ ...s, page }));
        triggerRefresh();
      },

      setPageSize(size: number) {
        state.update(s => ({ ...s, pageSize: size, page: 1 }));
        triggerRefresh();
      },

      setSort(column: string, direction?: 'asc' | 'desc') {
        state.update(s => {
          const newDirection = direction || (s.sortColumn === column && s.sortDirection === 'desc' ? 'asc' : 'desc');
          return { ...s, sortColumn: column, sortDirection: newDirection };
        });
        triggerRefresh();
      },

      setSearch(term: string) {
        state.update(s => ({ ...s, search: term, page: 1 }));
        // Use debounced search subject
        search$.next(term);
      },

      setFilter(key: string, value: any) {
        state.update(s => ({
          ...s,
          filters: { ...s.filters, [key]: value },
          page: 1
        }));
        triggerRefresh();
      },

      setFilters(filters: Record<string, any>) {
        state.update(s => ({ ...s, filters, page: 1 }));
        triggerRefresh();
      },

      clearFilters() {
        state.update(s => ({ ...s, filters: {}, search: '', page: 1 }));
        triggerRefresh();
      },

      refresh() {
        triggerRefresh();
      },

      destroy() {
        // Unsubscribe all subscriptions
        subscriptions.forEach(sub => sub.unsubscribe());

        // Complete subjects
        search$.complete();
        refresh$.complete();

        // Cancel pending request
        if (abortController) {
          abortController.abort();
          abortController = null;
        }
      }
    };
  }
}
