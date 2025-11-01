/**
 * Money Loan Product - Comprehensive Permission Seeds
 * Based on the complete Money Loan Dashboard menu structure
 * 
 * Permission Naming Convention: {product}:{resource}:{action}
 * Access Levels: view < create < edit < approve < manage < admin
 */

const moneyLoanPermissions = [
  // ============================================
  // 1. OVERVIEW DASHBOARD (6 permissions)
  // ============================================
  {
    permission_key: 'money-loan:overview:view',
    resource: 'money-loan-overview',
    action: 'view',
    description: 'View overview dashboard with metrics',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:overview:total-loans',
    resource: 'money-loan-overview',
    action: 'view-total-loans',
    description: 'View total loans disbursed metric',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:overview:collection-rate',
    resource: 'money-loan-overview',
    action: 'view-collection-rate',
    description: 'View collection rate metric',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:overview:overdue-percentage',
    resource: 'money-loan-overview',
    action: 'view-overdue-percentage',
    description: 'View overdue percentage metric',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:overview:outstanding-amount',
    resource: 'money-loan-overview',
    action: 'view-outstanding-amount',
    description: 'View outstanding amount metric',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:overview:default-rate',
    resource: 'money-loan-overview',
    action: 'view-default-rate',
    description: 'View default rate metric',
    space: 'tenant'
  },

  // ============================================
  // 2. CUSTOMERS (5 permissions)
  // ============================================
  {
    permission_key: 'money-loan:customers:read',
    resource: 'money-loan-customers',
    action: 'read',
    description: 'View all customers',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:customers:create',
    resource: 'money-loan-customers',
    action: 'create',
    description: 'Create new customers',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:customers:update',
    resource: 'money-loan-customers',
    action: 'update',
    description: 'Update customer information',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:customers:delete',
    resource: 'money-loan-customers',
    action: 'delete',
    description: 'Delete or deactivate customers',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:customers:view-high-risk',
    resource: 'money-loan-customers',
    action: 'view-high-risk',
    description: 'View high-risk flagged customers',
    space: 'tenant'
  },

  // ============================================
  // 3. LOANS (9 permissions)
  // ============================================
  {
    permission_key: 'money-loan:loans:read',
    resource: 'money-loan-loans',
    action: 'read',
    description: 'View all loans',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:loans:create',
    resource: 'money-loan-loans',
    action: 'create',
    description: 'Create new loan applications',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:loans:update',
    resource: 'money-loan-loans',
    action: 'update',
    description: 'Update loan details',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:loans:delete',
    resource: 'money-loan-loans',
    action: 'delete',
    description: 'Delete or cancel loans',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:loans:approve',
    resource: 'money-loan-loans',
    action: 'approve',
    description: 'Approve or reject loan applications',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:loans:disburse',
    resource: 'money-loan-loans',
    action: 'disburse',
    description: 'Disburse approved loans',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:loans:view-overdue',
    resource: 'money-loan-loans',
    action: 'view-overdue',
    description: 'View overdue loans',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:loans:close',
    resource: 'money-loan-loans',
    action: 'close',
    description: 'Close or mark loans as paid off',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:loans:use-calculator',
    resource: 'money-loan-loans',
    action: 'use-calculator',
    description: 'Use loan calculator tool',
    space: 'tenant'
  },

  // ============================================
  // 4. PAYMENTS (7 permissions)
  // ============================================
  {
    permission_key: 'money-loan:payments:read',
    resource: 'money-loan-payments',
    action: 'read',
    description: 'View payment history',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:payments:create',
    resource: 'money-loan-payments',
    action: 'create',
    description: 'Record new payments',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:payments:view-today',
    resource: 'money-loan-payments',
    action: 'view-today-collections',
    description: "View today's collections",
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:payments:bulk-import',
    resource: 'money-loan-payments',
    action: 'bulk-import',
    description: 'Import payments in bulk via CSV',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:payments:refund',
    resource: 'money-loan-payments',
    action: 'refund',
    description: 'Process refunds and waivers',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:payments:view-failed',
    resource: 'money-loan-payments',
    action: 'view-failed',
    description: 'View failed payment transactions',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:payments:configure-gateway',
    resource: 'money-loan-payments',
    action: 'configure-gateway',
    description: 'Configure payment gateway settings',
    space: 'tenant'
  },

  // ============================================
  // 5. INTEREST & RULES (5 permissions)
  // ============================================
  {
    permission_key: 'money-loan:interest:read',
    resource: 'money-loan-interest',
    action: 'read',
    description: 'View interest rates',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:interest:update',
    resource: 'money-loan-interest',
    action: 'update',
    description: 'Update interest rates',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:interest:manage-auto-rules',
    resource: 'money-loan-interest',
    action: 'manage-auto-rules',
    description: 'Manage automated interest rate rules',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:interest:manual-override',
    resource: 'money-loan-interest',
    action: 'manual-override',
    description: 'Manually override interest rates for specific loans',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:interest:use-calculator',
    resource: 'money-loan-interest',
    action: 'use-calculator',
    description: 'Use interest calculator',
    space: 'tenant'
  },

  // ============================================
  // 6. COLLECTIONS (5 permissions)
  // ============================================
  {
    permission_key: 'money-loan:collections:read',
    resource: 'money-loan-collections',
    action: 'read',
    description: 'View collection workflows',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:collections:manage-workflow',
    resource: 'money-loan-collections',
    action: 'manage-workflow',
    description: 'Manage overdue collection workflows',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:collections:manage-strategies',
    resource: 'money-loan-collections',
    action: 'manage-strategies',
    description: 'Manage collection strategies (calls, emails, etc.)',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:collections:legal-actions',
    resource: 'money-loan-collections',
    action: 'manage-legal-actions',
    description: 'Manage legal actions for defaulting customers',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:collections:view-recovery',
    resource: 'money-loan-collections',
    action: 'view-recovery',
    description: 'View recovery dashboard and status',
    space: 'tenant'
  },

  // ============================================
  // 7. KYC VERIFICATION (6 permissions)
  // ============================================
  {
    permission_key: 'money-loan:kyc:read',
    resource: 'money-loan-kyc',
    action: 'read',
    description: 'View KYC verification status',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:kyc:review',
    resource: 'money-loan-kyc',
    action: 'review',
    description: 'Review pending KYC submissions',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:kyc:approve',
    resource: 'money-loan-kyc',
    action: 'approve',
    description: 'Approve or reject KYC verifications',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:kyc:view-audit-logs',
    resource: 'money-loan-kyc',
    action: 'view-audit-logs',
    description: 'View KYC audit logs',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:kyc:view-webhook-logs',
    resource: 'money-loan-kyc',
    action: 'view-webhook-logs',
    description: 'View third-party KYC webhook logs (e.g., Onfido)',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:kyc:configure',
    resource: 'money-loan-kyc',
    action: 'configure',
    description: 'Configure KYC verification settings',
    space: 'tenant'
  },

  // ============================================
  // 8. REPORTS (5 permissions)
  // ============================================
  {
    permission_key: 'money-loan:reports:read',
    resource: 'money-loan-reports',
    action: 'read',
    description: 'View reports',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:reports:generate-periodic',
    resource: 'money-loan-reports',
    action: 'generate-periodic',
    description: 'Generate daily/weekly/monthly reports',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:reports:tax-summary',
    resource: 'money-loan-reports',
    action: 'generate-tax-summary',
    description: 'Generate tax summary reports',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:reports:export',
    resource: 'money-loan-reports',
    action: 'export',
    description: 'Export reports to CSV/PDF',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:reports:custom-queries',
    resource: 'money-loan-reports',
    action: 'run-custom-queries',
    description: 'Run custom queries and reports',
    space: 'tenant'
  },

  // ============================================
  // 9. SETTINGS (7 permissions)
  // ============================================
  {
    permission_key: 'money-loan:settings:read',
    resource: 'money-loan-settings',
    action: 'read',
    description: 'View settings',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:settings:manage-roles',
    resource: 'money-loan-settings',
    action: 'manage-roles-permissions',
    description: 'Manage roles and permissions',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:settings:manage-loan-products',
    resource: 'money-loan-settings',
    action: 'manage-loan-products',
    description: 'Manage loan product settings',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:settings:manage-templates',
    resource: 'money-loan-settings',
    action: 'manage-templates',
    description: 'Manage SMS/Email templates',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:settings:manage-branding',
    resource: 'money-loan-settings',
    action: 'manage-branding',
    description: 'Manage company branding',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:settings:manage-api-keys',
    resource: 'money-loan-settings',
    action: 'manage-api-keys',
    description: 'Manage API keys for integrations',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:settings:view-audit-log',
    resource: 'money-loan-settings',
    action: 'view-audit-log',
    description: 'View system audit log',
    space: 'tenant'
  },

  // ============================================
  // 10. AUDIT LOG (3 permissions)
  // ============================================
  {
    permission_key: 'money-loan:audit:read',
    resource: 'money-loan-audit',
    action: 'read',
    description: 'View system activity logs',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:audit:view-data-changes',
    resource: 'money-loan-audit',
    action: 'view-data-changes',
    description: 'Track changes to sensitive data',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:audit:export',
    resource: 'money-loan-audit',
    action: 'export',
    description: 'Export audit logs',
    space: 'tenant'
  },

  // ============================================
  // ADDITIONAL FEATURES (3 permissions)
  // ============================================
  {
    permission_key: 'money-loan:notifications:read',
    resource: 'money-loan-notifications',
    action: 'read',
    description: 'View notifications and alerts',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:user-management:manage',
    resource: 'money-loan-user-management',
    action: 'manage',
    description: 'Manage staff accounts and access',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:integrations:configure',
    resource: 'money-loan-integrations',
    action: 'configure',
    description: 'Configure external integrations',
    space: 'tenant'
  }
];

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  console.log('🌱 Seeding Money Loan permissions...\n');

  // Insert permissions (ignore duplicates)
  for (const perm of moneyLoanPermissions) {
    const exists = await knex('permissions')
      .where({ permission_key: perm.permission_key })
      .first();

    if (!exists) {
      await knex('permissions').insert(perm);
      console.log(`✓ Added: ${perm.permission_key}`);
    } else {
      console.log(`○ Exists: ${perm.permission_key}`);
    }
  }

  console.log(`\n✅ Money Loan permissions seeded! Total: ${moneyLoanPermissions.length} permissions`);
  
  // Summary by category
  console.log('\n📊 Permissions by category:');
  console.log('  • Overview: 6 permissions');
  console.log('  • Customers: 5 permissions');
  console.log('  • Loans: 9 permissions');
  console.log('  • Payments: 7 permissions');
  console.log('  • Interest & Rules: 5 permissions');
  console.log('  • Collections: 5 permissions');
  console.log('  • KYC Verification: 6 permissions');
  console.log('  • Reports: 5 permissions');
  console.log('  • Settings: 7 permissions');
  console.log('  • Audit Log: 3 permissions');
  console.log('  • Additional Features: 3 permissions');
};

// Export for reference
module.exports.moneyLoanPermissions = moneyLoanPermissions;
