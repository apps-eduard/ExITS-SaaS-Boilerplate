const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'features', 'admin', 'roles', 'role-editor.component.ts');

let content = fs.readFileSync(filePath, 'utf-8');

// Find and replace the old filter section
const startMarker = '            <!-- Header -->';
const endMarker = '            <!-- Permission Grid -->';

const startIndex = content.indexOf(startMarker);
const endIndex = content.indexOf(endMarker);

if (startIndex === -1 || endIndex === -1) {
  console.error('Could not find filter section markers');
  process.exit(1);
}

const newFilterSection = `            <!-- Enhanced Filter Section -->
            <div class="border-b border-gray-200 bg-white px-4 py-4 dark:border-gray-700 dark:bg-gray-900">
              
              <!-- Header Row -->
              <div class="flex items-center justify-between mb-3">
                <h3 class="text-sm font-semibold text-gray-900 dark:text-white flex items-center gap-2">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.293A1 1 0 013 6.586V4z" />
                  </svg>
                  Filter Permissions
                </h3>
                <button 
                  *ngIf="activeFilters().length > 0"
                  (click)="clearAllFilters()"
                  class="text-xs text-blue-600 hover:text-blue-700 dark:text-blue-400 font-medium flex items-center gap-1 transition-colors"
                >
                  <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                  Clear All
                </button>
              </div>

              <!-- Space Tabs -->
              <div class="mb-3">
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Space
                </label>
                <div class="grid grid-cols-3 gap-2">
                  <button
                    (click)="setSpaceFilter('all')"
                    [disabled]="isReadOnlyMode()"
                    type="button"
                    [class]="filterState().space === 'all' 
                      ? 'px-4 py-3 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 border-b-4 border-blue-600 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                      : 'px-4 py-3 rounded-lg text-sm font-medium bg-gray-50 text-gray-700 hover:bg-gray-100 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed'"
                  >
                    <div class="flex flex-col items-center gap-1">
                      <span class="text-lg">📊</span>
                      <span>All</span>
                      <span class="text-xs opacity-75">({{ spaceTabCounts().all }})</span>
                    </div>
                  </button>

                  <button
                    (click)="setSpaceFilter('system')"
                    [disabled]="isReadOnlyMode() || isTenantContext()"
                    type="button"
                    [class]="filterState().space === 'system' 
                      ? 'px-4 py-3 rounded-lg text-sm font-medium bg-purple-100 text-purple-700 border-b-4 border-purple-600 dark:bg-purple-900/30 dark:text-purple-300 dark:border-purple-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                      : 'px-4 py-3 rounded-lg text-sm font-medium bg-gray-50 text-gray-700 hover:bg-purple-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed'"
                  >
                    <div class="flex flex-col items-center gap-1">
                      <span class="text-lg">⚡</span>
                      <span>System</span>
                      <span class="text-xs opacity-75">({{ spaceTabCounts().system }})</span>
                    </div>
                  </button>

                  <button
                    (click)="setSpaceFilter('tenant')"
                    [disabled]="isReadOnlyMode()"
                    type="button"
                    [class]="filterState().space === 'tenant' 
                      ? 'px-4 py-3 rounded-lg text-sm font-medium bg-blue-100 text-blue-700 border-b-4 border-blue-600 dark:bg-blue-900/30 dark:text-blue-300 dark:border-blue-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed'
                      : 'px-4 py-3 rounded-lg text-sm font-medium bg-gray-50 text-gray-700 hover:bg-blue-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 transition-all disabled:opacity-50 disabled:cursor-not-allowed'"
                  >
                    <div class="flex flex-col items-center gap-1">
                      <span class="text-lg">🏢</span>
                      <span>Tenant</span>
                      <span class="text-xs opacity-75">({{ spaceTabCounts().tenant }})</span>
                    </div>
                  </button>
                </div>
              </div>

              <!-- Product Tabs (only show for Tenant or All space) -->
              <div *ngIf="filterState().space === 'tenant' || filterState().space === 'all'" class="mb-3">
                <label class="block text-xs font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Products
                </label>
                <div class="grid grid-cols-5 gap-2">
                  <button
                    (click)="setProductFilter('all')"
                    [disabled]="isReadOnlyMode()"
                    type="button"
                    [class]="filterState().product === 'all' 
                      ? 'px-3 py-2 rounded text-xs font-medium bg-gray-200 text-gray-800 border-l-4 border-gray-600 dark:bg-gray-700 dark:text-gray-200 dark:border-gray-400 transition-all'
                      : 'px-3 py-2 rounded text-xs font-medium bg-white text-gray-700 border border-gray-300 hover:bg-gray-50 dark:bg-gray-800 dark:text-gray-300 dark:border-gray-600 dark:hover:bg-gray-700 transition-all'"
                  >
                    <div class="text-center">
                      <div class="text-base mb-0.5">📋</div>
                      <div>All</div>
                      <div class="text-xs opacity-75 mt-0.5">({{ productTabCounts().all }})</div>
                    </div>
                  </button>

                  <button
                    (click)="setProductFilter('core')"
                    [disabled]="isReadOnlyMode() || isProductDisabled('core')"
                    type="button"
                    [class]="filterState().product === 'core' 
                      ? 'px-3 py-2 rounded text-xs font-medium bg-green-100 text-green-700 border-l-4 border-green-600 dark:bg-green-900/30 dark:text-green-300 transition-all'
                      : 'px-3 py-2 rounded text-xs font-medium bg-white text-gray-700 border border-gray-300 hover:bg-green-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all'"
                  >
                    <div class="text-center">
                      <div class="text-base mb-0.5">🏠</div>
                      <div>Core</div>
                      <div class="text-xs opacity-75 mt-0.5">({{ productTabCounts().core }})</div>
                    </div>
                  </button>

                  <button
                    (click)="setProductFilter('money-loan')"
                    [disabled]="isReadOnlyMode() || isProductDisabled('money-loan')"
                    type="button"
                    [class]="filterState().product === 'money-loan' 
                      ? 'px-3 py-2 rounded text-xs font-medium bg-amber-100 text-amber-700 border-l-4 border-amber-600 dark:bg-amber-900/30 dark:text-amber-300 transition-all'
                      : 'px-3 py-2 rounded text-xs font-medium bg-white text-gray-700 border border-gray-300 hover:bg-amber-50 dark:bg-gray-800 dark:text-gray-300 dark:hover:bg-gray-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all'"
                  >
                    <div class="text-center">
                      <div class="text-base mb-0.5">💰</div>
                      <div class="truncate">Money</div>
                      <div class="text-xs opacity-75 mt-0.5">({{ productTabCounts()['money-loan'] }})</div>
                    </div>
                  </button>

                  <button
                    (click)="setProductFilter('bnpl')"
                    [disabled]="isReadOnlyMode() || isProductDisabled('bnpl')"
                    type="button"
                    [class]="filterState().product === 'bnpl' 
                      ? 'px-3 py-2 rounded text-xs font-medium bg-blue-100 text-blue-700 border-l-4 border-blue-600 transition-all'
                      : 'px-3 py-2 rounded text-xs font-medium bg-white text-gray-700 border border-gray-300 hover:bg-blue-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 transition-all'"
                  >
                    <div class="text-center">
                      <div class="text-base mb-0.5">🛒</div>
                      <div>BNPL</div>
                      <div class="text-xs opacity-75 mt-0.5">({{ productTabCounts().bnpl }}){{ isProductDisabled('bnpl') ? ' 🔒' : '' }}</div>
                    </div>
                  </button>

                  <button
                    (click)="setProductFilter('pawnshop')"
                    [disabled]="isReadOnlyMode() || isProductDisabled('pawnshop')"
                    type="button"
                    [class]="filterState().product === 'pawnshop' 
                      ? 'px-3 py-2 rounded text-xs font-medium bg-pink-100 text-pink-700 border-l-4 border-pink-600 transition-all'
                      : 'px-3 py-2 rounded text-xs font-medium bg-white text-gray-700 border border-gray-300 hover:bg-pink-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-gray-800 dark:text-gray-300 transition-all'"
                  >
                    <div class="text-center">
                      <div class="text-base mb-0.5">🪙</div>
                      <div>Pawn</div>
                      <div class="text-xs opacity-75 mt-0.5">({{ productTabCounts().pawnshop }}){{ isProductDisabled('pawnshop') ? ' 🔒' : '' }}</div>
                    </div>
                  </button>
                </div>
              </div>

              <!-- Active Filters Summary -->
              <div *ngIf="activeFilters().length > 0" class="flex items-center gap-2 p-2 rounded bg-blue-50 dark:bg-blue-900/20">
                <span class="text-xs font-medium text-blue-700 dark:text-blue-300">Active:</span>
                <div class="flex flex-wrap gap-1.5">
                  <button
                    *ngFor="let filter of activeFilters()"
                    (click)="removeFilter(filter.id as 'space' | 'product')"
                    type="button"
                    class="inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700 hover:bg-blue-200 dark:bg-blue-800 dark:text-blue-200 dark:hover:bg-blue-700 transition-colors"
                  >
                    <span>{{ filter.icon }}</span>
                    <span>{{ filter.label }}</span>
                    <svg class="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <span class="ml-auto text-xs text-blue-600 dark:text-blue-400 font-medium whitespace-nowrap">
                  {{ filteredPermissionCount() }} groups shown
                </span>
              </div>

              <!-- No Filters Message -->
              <div *ngIf="activeFilters().length === 0" class="flex items-center justify-between p-2 rounded bg-gray-50 dark:bg-gray-800">
                <span class="text-xs text-gray-500 dark:text-gray-400">
                  ✨ Showing all {{ filteredPermissionCount() }} permission groups
                </span>
              </div>

            </div>

            `;

content = content.substring(0, startIndex) + newFilterSection + content.substring(endIndex);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('✓ Enhanced filter section updated successfully');
