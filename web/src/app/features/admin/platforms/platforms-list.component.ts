import { Component, signal, computed, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { HttpClient } from '@angular/common/http';

interface Platform {
  id: number;
  name: string;
  code: string;
  description: string;
  category: string;
  type: 'loan' | 'bnpl' | 'pawnshop' | 'other';
  status: 'active' | 'inactive' | 'draft';
  features: string[];
  pricing?: {
    baseRate?: number;
    currency?: string;
  };
  createdAt: string;
  updatedAt: string;
}

@Component({
  selector: 'app-platforms-list',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  template: `
    <div class="p-4 sm:p-6 space-y-4">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <span class="text-xl">📦</span>
            Product Catalog
          </h1>
          <p class="text-xs text-gray-500 dark:text-gray-400">
            Manage your product offerings and configurations
          </p>
        </div>
        <button
          routerLink="/admin/products/new"
          class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition shadow-sm"
        >
          <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Add Product
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Total Platforms</p>
              <p class="text-2xl font-bold text-gray-900 dark:text-white mt-1">{{ platforms().length }}</p>
            </div>
            <div class="w-10 h-10 rounded-lg bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center">
              <span class="text-xl">📦</span>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Active</p>
              <p class="text-2xl font-bold text-green-600 dark:text-green-400 mt-1">{{ getStatusCount('active') }}</p>
            </div>
            <div class="w-10 h-10 rounded-lg bg-green-50 dark:bg-green-900/20 flex items-center justify-center">
              <span class="text-xl">✅</span>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Inactive</p>
              <p class="text-2xl font-bold text-gray-600 dark:text-gray-400 mt-1">{{ getStatusCount('inactive') }}</p>
            </div>
            <div class="w-10 h-10 rounded-lg bg-gray-50 dark:bg-gray-900/20 flex items-center justify-center">
              <span class="text-xl">⏸️</span>
            </div>
          </div>
        </div>

        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
          <div class="flex items-center justify-between">
            <div>
              <p class="text-xs font-medium text-gray-500 dark:text-gray-400">Draft</p>
              <p class="text-2xl font-bold text-yellow-600 dark:text-yellow-400 mt-1">{{ getStatusCount('draft') }}</p>
            </div>
            <div class="w-10 h-10 rounded-lg bg-yellow-50 dark:bg-yellow-900/20 flex items-center justify-center">
              <span class="text-xl">📝</span>
            </div>
          </div>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <!-- Search -->
          <div class="lg:col-span-2">
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
            <div class="relative">
              <input
                type="text"
                [(ngModel)]="searchQuery"
                placeholder="Search products..."
                class="w-full pl-9 pr-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500 focus:border-transparent"
              />
              <svg class="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
            </div>
          </div>

          <!-- Type Filter -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Type</label>
            <select
              [(ngModel)]="typeFilter"
              class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Types</option>
              <option value="loan">💰 Loan</option>
              <option value="bnpl">💳 BNPL</option>
              <option value="pawnshop">💎 Pawnshop</option>
              <option value="other">📦 Other</option>
            </select>
          </div>

          <!-- Status Filter -->
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              [(ngModel)]="statusFilter"
              class="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="active">✅ Active</option>
              <option value="inactive">⏸️ Inactive</option>
              <option value="draft">📝 Draft</option>
            </select>
          </div>
        </div>
      </div>

      <!-- Products Grid/List -->
      @if (loading()) {
        <div class="flex items-center justify-center py-12">
          <div class="text-center">
            <div class="w-12 h-12 border-4 border-primary-600 border-t-transparent rounded-full animate-spin mx-auto mb-3"></div>
            <p class="text-sm text-gray-500 dark:text-gray-400">Loading platforms...</p>
          </div>
        </div>
      } @else if (filteredPlatforms().length === 0) {
        <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-12 text-center">
          <span class="text-5xl mb-4 block">📦</span>
          <h3 class="text-lg font-semibold text-gray-900 dark:text-white mb-2">No platforms found</h3>
          <p class="text-sm text-gray-500 dark:text-gray-400 mb-4">
            @if (searchQuery || typeFilter !== 'all' || statusFilter !== 'all') {
              Try adjusting your filters
            } @else {
              Get started by creating your first platform
            }
          </p>
          <button
            routerLink="/admin/platforms/new"
            class="inline-flex items-center gap-2 px-4 py-2 bg-primary-600 text-white text-sm font-medium rounded-lg hover:bg-primary-700 transition"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
            </svg>
            Add Your First Platform
          </button>
        </div>
      } @else {
        <div class="grid grid-cols-1 lg:grid-cols-2 xl:grid-cols-3 gap-4">
          @for (platform of filteredPlatforms(); track platform.id) {
            <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:shadow-lg transition group">
              <!-- Card Header -->
              <div class="p-4 border-b border-gray-200 dark:border-gray-700">
                <div class="flex items-start justify-between">
                  <div class="flex-1 min-w-0">
                    <div class="flex items-center gap-2 mb-1">
                      <span class="text-xl">{{ getPlatformIcon(platform.type) }}</span>
                      <h3 class="text-sm font-semibold text-gray-900 dark:text-white truncate">{{ platform.name }}</h3>
                    </div>
                    <p class="text-xs text-gray-500 dark:text-gray-400">{{ platform.code }}</p>
                  </div>
                  <span
                    class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium rounded-full"
                    [class]="getStatusClass(platform.status)"
                  >
                    {{ getStatusIcon(platform.status) }} {{ platform.status }}
                  </span>
                </div>
              </div>

              <!-- Card Body -->
              <div class="p-4 space-y-3">
                <p class="text-xs text-gray-600 dark:text-gray-400 line-clamp-2">
                  {{ platform.description || 'No description' }}
                </p>

                <div class="flex items-center gap-2 text-xs">
                  <span class="px-2 py-1 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-300 rounded">
                    {{ platform.category }}
                  </span>
                  <span class="px-2 py-1 bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded">
                    {{ platform.type }}
                  </span>
                </div>

                @if (platform.features && platform.features.length > 0) {
                  <div class="flex flex-wrap gap-1">
                    @for (feature of platform.features.slice(0, 3); track feature) {
                      <span class="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                        {{ feature }}
                      </span>
                    }
                    @if (platform.features.length > 3) {
                      <span class="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded">
                        +{{ platform.features.length - 3 }} more
                      </span>
                    }
                  </div>
                }
              </div>

              <!-- Card Footer -->
              <div class="p-4 border-t border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-900/50">
                <div class="flex items-center justify-between">
                  <span class="text-xs text-gray-500 dark:text-gray-400">
                    Updated {{ formatDate(platform.updatedAt) }}
                  </span>
                  <div class="flex items-center gap-2">
                    <button
                      class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition"
                    >
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"/>
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"/>
                      </svg>
                      View
                    </button>
                    <button
                      class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded transition"
                    >
                      <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"/>
                      </svg>
                      Edit
                    </button>
                  </div>
                </div>
              </div>
            </div>
          }
        </div>
      }
    </div>
  `
})
export class PlatformsListComponent implements OnInit {
  private http = inject(HttpClient);

  platforms = signal<Platform[]>([]);
  loading = signal(false);
  searchQuery = '';
  typeFilter = 'all';
  statusFilter = 'all';

  filteredPlatforms = computed(() => {
    let filtered = this.platforms();

    // Search filter
    if (this.searchQuery.trim()) {
      const query = this.searchQuery.toLowerCase();
      filtered = filtered.filter(p =>
        p.name.toLowerCase().includes(query) ||
        p.code.toLowerCase().includes(query) ||
        p.description?.toLowerCase().includes(query)
      );
    }

    // Type filter
    if (this.typeFilter !== 'all') {
      filtered = filtered.filter(p => p.type === this.typeFilter);
    }

    // Status filter
    if (this.statusFilter !== 'all') {
      filtered = filtered.filter(p => p.status === this.statusFilter);
    }

    return filtered;
  });

  ngOnInit() {
    this.loadPlatforms();
  }

  loadPlatforms() {
    this.loading.set(true);
    // Mock data for now
    setTimeout(() => {
      this.platforms.set([
        {
          id: 1,
          name: 'Personal Loan',
          code: 'LOAN-001',
          description: 'Standard personal loan product with flexible terms',
          category: 'Financial Services',
          type: 'loan',
          status: 'active',
          features: ['Flexible terms', 'Low interest', 'Quick approval'],
          pricing: { baseRate: 5.5, currency: 'USD' },
          createdAt: '2024-01-15T10:00:00Z',
          updatedAt: '2024-10-20T14:30:00Z'
        },
        {
          id: 2,
          name: 'Buy Now Pay Later',
          code: 'BNPL-001',
          description: 'Zero interest installment payment solution',
          category: 'Payment Solutions',
          type: 'bnpl',
          status: 'active',
          features: ['0% interest', 'Split payments', 'Instant approval'],
          createdAt: '2024-02-10T09:00:00Z',
          updatedAt: '2024-10-21T11:20:00Z'
        },
        {
          id: 3,
          name: 'Gold Pawn',
          code: 'PAWN-001',
          description: 'Collateral-based loan using gold jewelry',
          category: 'Pawnshop Services',
          type: 'pawnshop',
          status: 'active',
          features: ['Gold collateral', 'Quick cash', 'Flexible redemption'],
          createdAt: '2024-03-05T08:30:00Z',
          updatedAt: '2024-10-19T16:45:00Z'
        },
        {
          id: 4,
          name: 'Business Loan Plus',
          code: 'LOAN-002',
          description: 'Enhanced business loan for SMEs',
          category: 'Business Services',
          type: 'loan',
          status: 'draft',
          features: ['Higher limits', 'Longer terms', 'Business rates'],
          createdAt: '2024-10-01T10:00:00Z',
          updatedAt: '2024-10-22T09:15:00Z'
        },
        {
          id: 5,
          name: 'Electronics Pawn',
          code: 'PAWN-002',
          description: 'Pawn service for electronic devices',
          category: 'Pawnshop Services',
          type: 'pawnshop',
          status: 'inactive',
          features: ['Gadget collateral', 'Fair valuation', 'Safe storage'],
          createdAt: '2024-04-20T14:00:00Z',
          updatedAt: '2024-09-30T12:00:00Z'
        }
      ]);
      this.loading.set(false);
    }, 500);
  }

  getStatusCount(status: string): number {
    return this.platforms().filter((p: Platform) => p.status === status).length;
  }

  getPlatformIcon(type: string): string {
    const icons: Record<string, string> = {
      loan: '💰',
      bnpl: '💳',
      pawnshop: '💎',
      other: '📦'
    };
    return icons[type] || '📦';
  }

  getStatusIcon(status: string): string {
    const icons: Record<string, string> = {
      active: '✅',
      inactive: '⏸️',
      draft: '📝'
    };
    return icons[status] || '❓';
  }

  getStatusClass(status: string): string {
    const classes: Record<string, string> = {
      active: 'bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-300',
      inactive: 'bg-gray-50 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300',
      draft: 'bg-yellow-50 dark:bg-yellow-900/20 text-yellow-700 dark:text-yellow-300'
    };
    return classes[status] || '';
  }

  formatDate(date: string): string {
    const d = new Date(date);
    const now = new Date();
    const diffMs = now.getTime() - d.getTime();
    const diffDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));

    if (diffDays === 0) return 'today';
    if (diffDays === 1) return 'yesterday';
    if (diffDays < 7) return `${diffDays} days ago`;
    if (diffDays < 30) return `${Math.floor(diffDays / 7)} weeks ago`;
    return d.toLocaleDateString();
  }
}
