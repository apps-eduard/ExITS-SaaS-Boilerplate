import { Component, signal, computed } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface PlatformMapping {
  id: number;
  platformId: number;
  platformName: string;
  platformCode: string;
  tenantId: number;
  tenantName: string;
  branches: string[];
  assignedAt: string;
  assignedBy: string;
  status: 'active' | 'inactive';
}

@Component({
  selector: 'app-platform-mapping',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="p-4 sm:p-6 space-y-4">
      <!-- Header -->
      <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 class="text-2xl font-bold text-gray-900 dark:text-white">Platform Mapping</h1>
          <p class="text-sm text-gray-500 dark:text-gray-400 mt-1">
            Assign platforms to tenants, branches, or plans for multi-tenant access control
          </p>
        </div>
        <button
          (click)="openBulkMappingModal()"
          class="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium bg-primary-600 text-white rounded hover:bg-primary-700 transition shadow-sm"
        >
          <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"/>
          </svg>
          Bulk Mapping
        </button>
      </div>

      <!-- Stats Cards -->
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <div class="bg-gradient-to-br from-blue-50 to-blue-100 dark:from-blue-900/20 dark:to-blue-800/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-2xl">🔗</span>
            <span class="text-xs font-medium px-2 py-0.5 bg-blue-200 dark:bg-blue-800 text-blue-800 dark:text-blue-200 rounded-full">
              Total
            </span>
          </div>
          <p class="text-xs font-medium text-blue-700 dark:text-blue-300 mb-1">Total Mappings</p>
          <p class="text-2xl font-bold text-blue-900 dark:text-blue-100">{{ mappings().length }}</p>
        </div>

        <div class="bg-gradient-to-br from-green-50 to-green-100 dark:from-green-900/20 dark:to-green-800/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-2xl">✅</span>
            <span class="text-xs font-medium px-2 py-0.5 bg-green-200 dark:bg-green-800 text-green-800 dark:text-green-200 rounded-full">
              Active
            </span>
          </div>
          <p class="text-xs font-medium text-green-700 dark:text-green-300 mb-1">Active Mappings</p>
          <p class="text-2xl font-bold text-green-900 dark:text-green-100">{{ getActiveCount() }}</p>
        </div>

        <div class="bg-gradient-to-br from-purple-50 to-purple-100 dark:from-purple-900/20 dark:to-purple-800/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-2xl">🏢</span>
            <span class="text-xs font-medium px-2 py-0.5 bg-purple-200 dark:bg-purple-800 text-purple-800 dark:text-purple-200 rounded-full">
              Tenants
            </span>
          </div>
          <p class="text-xs font-medium text-purple-700 dark:text-purple-300 mb-1">Mapped Tenants</p>
          <p class="text-2xl font-bold text-purple-900 dark:text-purple-100">{{ getUniqueTenants() }}</p>
        </div>

        <div class="bg-gradient-to-br from-orange-50 to-orange-100 dark:from-orange-900/20 dark:to-orange-800/20 border border-orange-200 dark:border-orange-800 rounded-lg p-4">
          <div class="flex items-center justify-between mb-2">
            <span class="text-2xl">📦</span>
            <span class="text-xs font-medium px-2 py-0.5 bg-orange-200 dark:bg-orange-800 text-orange-800 dark:text-orange-200 rounded-full">
              Products
            </span>
          </div>
          <p class="text-xs font-medium text-orange-700 dark:text-orange-300 mb-1">Mapped Products</p>
          <p class="text-2xl font-bold text-orange-900 dark:text-orange-100">{{ getUniquePlatforms() }}</p>
        </div>
      </div>

      <!-- Filters -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 p-4">
        <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Search</label>
            <input
              type="text"
              [(ngModel)]="searchQuery"
              placeholder="Search products or tenants..."
              class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-gray-500 focus:ring-2 focus:ring-primary-500"
            />
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Tenant</label>
            <select
              [(ngModel)]="tenantFilter"
              class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Tenants</option>
              <option value="1">Acme Corporation</option>
              <option value="2">TechStart Inc</option>
              <option value="3">Global Solutions</option>
            </select>
          </div>

          <div>
            <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-1">Status</label>
            <select
              [(ngModel)]="statusFilter"
              class="w-full px-3 py-1.5 text-sm border border-gray-300 dark:border-gray-600 rounded bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:ring-2 focus:ring-primary-500"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="inactive">Inactive</option>
            </select>
          </div>

          <div class="flex items-end">
            <button
              (click)="clearFilters()"
              class="w-full px-3 py-1.5 text-xs font-medium bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded hover:bg-gray-200 dark:hover:bg-gray-600 transition"
            >
              Clear Filters
            </button>
          </div>
        </div>
      </div>

      <!-- Mappings Table -->
      <div class="bg-white dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 overflow-hidden">
        <div class="p-4 border-b border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <h3 class="font-semibold text-gray-900 dark:text-white flex items-center gap-2">
            <span>🔗</span>
            Product-Tenant Mappings
          </h3>
          <div class="flex items-center gap-2">
            <button
              (click)="exportMappings()"
              class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-gray-600 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white transition"
            >
              <svg class="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
              </svg>
              Export
            </button>
          </div>
        </div>

        <div class="overflow-x-auto">
          <table class="w-full text-sm">
            <thead class="bg-gray-50 dark:bg-gray-900 border-b border-gray-200 dark:border-gray-700">
              <tr>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">
                  <input type="checkbox" class="rounded border-gray-300 dark:border-gray-600" />
                </th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Product</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Product Code</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Tenant</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Branches</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Assigned By</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Assigned At</th>
                <th class="px-4 py-2 text-left text-xs font-medium text-gray-700 dark:text-gray-300">Status</th>
                <th class="px-4 py-2 text-right text-xs font-medium text-gray-700 dark:text-gray-300">Actions</th>
              </tr>
            </thead>
            <tbody class="divide-y divide-gray-200 dark:divide-gray-700">
              @for (mapping of mappings(); track mapping.id) {
                <tr class="hover:bg-gray-50 dark:hover:bg-gray-700/50 transition">
                  <td class="px-4 py-3">
                    <input type="checkbox" class="rounded border-gray-300 dark:border-gray-600" />
                  </td>
                  <td class="px-4 py-3">
                    <span class="text-xs font-medium text-gray-900 dark:text-white">{{ mapping.platformName }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="text-xs font-mono text-gray-600 dark:text-gray-400">{{ mapping.platformCode }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="text-xs text-gray-900 dark:text-white">{{ mapping.tenantName }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex flex-wrap gap-1">
                      @for (branch of mapping.branches; track branch) {
                        <span class="px-2 py-0.5 text-xs bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 rounded">
                          {{ branch }}
                        </span>
                      }
                    </div>
                  </td>
                  <td class="px-4 py-3">
                    <span class="text-xs text-gray-600 dark:text-gray-400">{{ mapping.assignedBy }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <span class="text-xs text-gray-600 dark:text-gray-400">{{ mapping.assignedAt }}</span>
                  </td>
                  <td class="px-4 py-3">
                    <span
                      class="inline-flex items-center px-2 py-0.5 text-xs font-medium rounded-full"
                      [class]="mapping.status === 'active'
                        ? 'bg-green-100 dark:bg-green-900/20 text-green-700 dark:text-green-300'
                        : 'bg-gray-100 dark:bg-gray-900/20 text-gray-700 dark:text-gray-300'"
                    >
                      {{ mapping.status === 'active' ? '✅' : '⏸️' }} {{ mapping.status }}
                    </span>
                  </td>
                  <td class="px-4 py-3">
                    <div class="flex items-center justify-end gap-1">
                      <button
                        (click)="viewAuditHistory(mapping)"
                        class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded transition"
                        title="View History"
                      >
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                        </svg>
                      </button>
                      <button
                        (click)="unmapPlatform(mapping)"
                        class="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 rounded transition"
                        title="Unmap"
                      >
                        <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              }
            </tbody>
          </table>
        </div>

        <!-- Pagination -->
        <div class="p-4 border-t border-gray-200 dark:border-gray-700 flex items-center justify-between">
          <div class="text-xs text-gray-600 dark:text-gray-400">
            Showing {{ mappings().length }} mappings
          </div>
          <div class="flex items-center gap-2">
            <button class="px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition disabled:opacity-50" disabled>
              Previous
            </button>
            <button class="px-3 py-1.5 text-xs font-medium bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 rounded hover:bg-gray-50 dark:hover:bg-gray-600 transition">
              Next
            </button>
          </div>
        </div>
      </div>
    </div>
  `
})
export class PlatformMappingComponent {
  searchQuery = '';
  tenantFilter = 'all';
  statusFilter = 'all';

  mappings = signal<PlatformMapping[]>([
    {
      id: 1,
      platformId: 1,
      platformName: 'Personal Loan Plus',
      platformCode: 'LOAN-001',
      tenantId: 1,
      tenantName: 'Acme Corporation',
      branches: ['Main Branch', 'North Branch'],
      assignedAt: '2024-10-15',
      assignedBy: 'admin@system.com',
      status: 'active'
    },
    {
      id: 2,
      platformId: 2,
      platformName: 'BNPL Express',
      platformCode: 'BNPL-002',
      tenantId: 2,
      tenantName: 'TechStart Inc',
      branches: ['HQ'],
      assignedAt: '2024-10-18',
      assignedBy: 'admin@system.com',
      status: 'active'
    },
    {
      id: 3,
      platformId: 3,
      platformName: 'Pawn Pro',
      platformCode: 'PAWN-003',
      tenantId: 3,
      tenantName: 'Global Solutions',
      branches: ['East Branch', 'West Branch', 'South Branch'],
      assignedAt: '2024-10-20',
      assignedBy: 'admin@system.com',
      status: 'active'
    },
    {
      id: 4,
      platformId: 1,
      platformName: 'Personal Loan Plus',
      platformCode: 'LOAN-001',
      tenantId: 2,
      tenantName: 'TechStart Inc',
      branches: ['HQ', 'Branch A'],
      assignedAt: '2024-10-22',
      assignedBy: 'admin@system.com',
      status: 'inactive'
    }
  ]);

  getActiveCount(): number {
    return this.mappings().filter(m => m.status === 'active').length;
  }

  getUniqueTenants(): number {
    return new Set(this.mappings().map(m => m.tenantId)).size;
  }

  getUniquePlatforms(): number {
    return new Set(this.mappings().map(m => m.platformId)).size;
  }

  clearFilters() {
    this.searchQuery = '';
    this.tenantFilter = 'all';
    this.statusFilter = 'all';
  }

  openBulkMappingModal() {
    alert('Bulk mapping modal would open here. This allows mapping multiple products to multiple tenants at once.');
  }

  viewAuditHistory(mapping: PlatformMapping) {
    alert(`Audit History for ${mapping.platformName} → ${mapping.tenantName}\n\nAssigned: ${mapping.assignedAt}\nBy: ${mapping.assignedBy}\nStatus: ${mapping.status}\nBranches: ${mapping.branches.join(', ')}`);
  }

  unmapPlatform(mapping: PlatformMapping) {
    if (confirm(`Are you sure you want to unmap "${mapping.platformName}" from "${mapping.tenantName}"?`)) {
      alert('Platform unmapped successfully! (Mock implementation)');
    }
  }

  exportMappings() {
    alert('Exporting platform mappings to CSV...');
  }
}
