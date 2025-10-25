const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'app', 'features', 'admin', 'roles', 'role-editor.component.ts');

let content = fs.readFileSync(filePath, 'utf-8');

// Check if banners already added
if (content.includes('<!-- Read-Only Mode Banner -->')) {
  console.log('✓ Banners already exist');
  process.exit(0);
}

// Find the pattern more precisely - looking for error div followed by blank line and form comment
const searchPattern = /(\s+<\/div>\s+<!-- Form -->)/;

if (!searchPattern.test(content)) {
  console.error('Could not find insertion point');
  process.exit(1);
}

const bannersHTML = `
      </div>

      <!-- Read-Only Mode Banner -->
      <div *ngIf="isReadOnlyMode() && !roleService.loadingSignal()" class="rounded border border-amber-300 bg-amber-50 px-4 py-3 dark:border-amber-700 dark:bg-amber-900/20">
        <div class="flex items-start gap-3">
          <svg class="w-5 h-5 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
          </svg>
          <div class="flex-1">
            <h3 class="text-sm font-semibold text-amber-800 dark:text-amber-300 mb-1">VIEWING MODE - READ ONLY</h3>
            <p class="text-sm text-amber-700 dark:text-amber-400">{{ readOnlyReason() }}</p>
            <div class="flex gap-2 mt-3">
              <button [routerLink]="isTenantContext() ? '/tenant/roles' : '/admin/roles'" class="px-3 py-1.5 text-xs font-medium text-amber-700 bg-white border border-amber-300 rounded hover:bg-amber-50 dark:bg-gray-800 dark:text-amber-300 dark:border-amber-600 dark:hover:bg-gray-700">
                Go to Roles List
              </button>
            </div>
          </div>
        </div>
      </div>

      <!-- Space Info Banner (for tenant roles being edited) -->
      <div *ngIf="roleSpace === 'tenant' && !isReadOnlyMode() && !roleService.loadingSignal()" class="rounded border border-blue-200 bg-blue-50 px-4 py-3 dark:border-blue-800 dark:bg-blue-900/20">
        <div class="flex items-start gap-3">
          <svg class="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          <div class="flex-1">
            <h3 class="text-sm font-semibold text-blue-800 dark:text-blue-300 mb-1">Tenant Role Permissions</h3>
            <p class="text-xs text-blue-700 dark:text-blue-400">
              Tenant roles can only access tenant-space and product-specific permissions (Money Loan, BNPL, Pawnshop). 
              System-level permissions are automatically filtered out for security.
            </p>
          </div>
        </div>
      </div>

      <!-- Form -->`;

content = content.replace(searchPattern, bannersHTML);

fs.writeFileSync(filePath, content, 'utf-8');
console.log('✓ Banners added successfully');
