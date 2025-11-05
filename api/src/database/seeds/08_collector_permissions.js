/**
 * Seed: Collector Management Permissions
 * 
 * Adds comprehensive permissions for:
 * - Collectors (field agents)
 * - Collection Managers
 * - Admin oversight
 */

exports.seed = async function(knex) {
  console.log('🌱 Seeding Money Loan Collector permissions...\n');

  const collectorPermissions = [
    // ====================================
    // ASSIGNED CUSTOMERS
    // ====================================
    {
      permission_key: 'money-loan:assigned-customers:read',
      resource: 'money-loan',
      action: 'assigned-customers:read',
      description: 'View assigned customers only',
      space: 'tenant'
    },
    {
      permission_key: 'money-loan:assigned-customers:view-details',
      resource: 'money-loan',
      action: 'assigned-customers:view-details',
      description: 'View detailed customer information',
      space: 'tenant'
    },
    {
      permission_key: 'money-loan:assigned-customers:view-loan-history',
      resource: 'money-loan',
      action: 'assigned-customers:view-loan-history',
      description: 'View customer loan history',
      space: 'tenant'
    },
    {
      permission_key: 'money-loan:assigned-customers:view-payment-history',
      resource: 'money-loan',
      action: 'assigned-customers:view-payment-history',
      description: 'View customer payment history',
      space: 'tenant'
    },

    // ====================================
    // APPLICATION APPROVAL
    // ====================================
    {
      permission_key: 'money-loan:assigned-applications:read',
      resource: 'money-loan',
      action: 'assigned-applications:read',
      description: 'View loan applications from assigned customers',
      space: 'tenant'
    },
    {
      permission_key: 'money-loan:assigned-applications:approve',
      resource: 'money-loan',
      action: 'assigned-applications:approve',
      description: 'Approve applications within assigned limit',
      space: 'tenant'
    },
    {
      permission_key: 'money-loan:assigned-applications:reject',
      resource: 'money-loan',
      action: 'assigned-applications:reject',
      description: 'Reject loan applications',
      space: 'tenant'
    },
    {
      permission_key: 'money-loan:assigned-applications:request-review',
      resource: 'money-loan',
      action: 'assigned-applications:request-review',
      description: 'Request manager review for applications above limit',
      space: 'tenant'
    },
    {
      permission_key: 'money-loan:assigned-applications:view-limits',
      resource: 'money-loan',
      action: 'assigned-applications:view-limits',
      description: 'View own approval limits',
      space: 'tenant'
    },

    // ====================================
    // LOAN DISBURSEMENT
    // ====================================
    {
      permission_key: 'money-loan:assigned-loans:read',
      resource: 'money-loan',
      action: 'assigned-loans:read',
      description: 'View loans of assigned customers',
      space: 'tenant'
    },
    {
      permission_key: 'money-loan:assigned-loans:disburse',
      resource: 'money-loan',
      action: 'assigned-loans:disburse',
      description: 'Disburse approved loans within limit',
      space: 'tenant'
    },
    {
      permission_key: 'money-loan:assigned-loans:view-pending-disbursement',
      resource: 'money-loan',
      action: 'assigned-loans:view-pending-disbursement',
      description: 'View loans pending disbursement',
      space: 'tenant'
    },
    {
      permission_key: 'money-loan:assigned-loans:view-disbursement-limits',
      resource: 'money-loan',
      action: 'assigned-loans:view-disbursement-limits',
      description: 'View own disbursement limits',
      space: 'tenant'
    },
    {
      permission_key: 'money-loan:assigned-loans:request-disbursement-approval',
      resource: 'money-loan',
      action: 'assigned-loans:request-disbursement-approval',
      description: 'Request approval for disbursements above limit',
      space: 'tenant'
    },

    // ====================================
    // PAYMENT COLLECTION
    // ====================================
    {
      permission_key: 'money-loan:assigned-payments:collect',
      resource: 'money-loan',
      action: 'assigned-payments:collect',
      description: 'Collect payments from assigned customers',
      space: 'tenant'
    },
    {
      permission_key: 'money-loan:assigned-payments:collect-cash',
      resource: 'money-loan',
      action: 'assigned-payments:collect-cash',
      description: 'Collect cash payments',
      space: 'tenant'
    },
    {
      permission_key: 'money-loan:assigned-payments:collect-bank-transfer',
      resource: 'money-loan',
      action: 'assigned-payments:collect-bank-transfer',
      description: 'Record bank transfer payments',
      space: 'tenant'
    },
    {
      permission_key: 'money-loan:assigned-payments:view-schedule',
      resource: 'money-loan',
      action: 'assigned-payments:view-schedule',
      description: 'View payment schedules',
      space: 'tenant'
    },
    {
      permission_key: 'money-loan:assigned-payments:view-overdue',
      resource: 'money-loan',
      action: 'assigned-payments:view-overdue',
      description: 'View overdue payments',
      space: 'tenant'
    },
    {
      permission_key: 'money-loan:assigned-payments:view-collection-summary',
      resource: 'money-loan',
      action: 'assigned-payments:view-collection-summary',
      description: 'View collection summary',
      space: 'tenant'
    },

    // ====================================
    // PENALTY WAIVER
    // ====================================
    {
      permission_key: 'money-loan:penalties:view',
      resource: 'money-loan',
      action: 'penalties:view',
      description: 'View penalty charges',
      space: 'tenant'
    },
    {
      permission_key: 'money-loan:penalties:waive-partial',
      resource: 'money-loan',
      action: 'penalties:waive-partial',
      description: 'Waive penalties within assigned limit',
      space: 'tenant'
    },
    {
      permission_key: 'money-loan:penalties:waive-request',
      resource: 'money-loan',
      action: 'penalties:waive-request',
      description: 'Request penalty waiver above limit',
      space: 'tenant'
    },
    {
      permission_key: 'money-loan:penalties:view-waiver-history',
      resource: 'money-loan',
      action: 'penalties:view-waiver-history',
      description: 'View penalty waiver history',
      space: 'tenant'
    },
    {
      permission_key: 'money-loan:penalties:view-waiver-limits',
      resource: 'money-loan',
      action: 'penalties:view-waiver-limits',
      description: 'View penalty waiver limits',
      space: 'tenant'
    },
    {
      permission_key: 'money-loan:penalties:approve-waiver',
      resource: 'money-loan',
      action: 'penalties:approve-waiver',
      description: 'Approve penalty waiver requests (Manager)',
      space: 'tenant'
    },

    // ====================================
    // CUSTOMER VISITS & ROUTE
    // ====================================
    {
      permission_key: 'money-loan:route:view',
      resource: 'money-loan',
      action: 'route:view',
      description: 'View daily collection route',
      space: 'tenant'
    },
    {
      permission_key: 'money-loan:route:check-in',
      resource: 'money-loan',
      action: 'route:check-in',
      description: 'GPS check-in at customer location',
      space: 'tenant'
    },
    {
      permission_key: 'money-loan:route:record-visit',
      resource: 'money-loan',
      action: 'route:record-visit',
      description: 'Record customer visit details',
      space: 'tenant'
    },
    {
      permission_key: 'money-loan:route:upload-photo',
      resource: 'money-loan',
      action: 'route:upload-photo',
      description: 'Upload visit photos',
      space: 'tenant'
    },
    {
      permission_key: 'money-loan:route:capture-signature',
      resource: 'money-loan',
      action: 'route:capture-signature',
      description: 'Capture customer signature',
      space: 'tenant'
    },
    {
      permission_key: 'money-loan:route:view-visit-history',
      resource: 'money-loan',
      action: 'route:view-visit-history',
      description: 'View past customer visits',
      space: 'tenant'
    },
    {
      permission_key: 'money-loan:route:optimize',
      resource: 'money-loan',
      action: 'route:optimize',
      description: 'Optimize collection route',
      space: 'tenant'
    },

    // ====================================
    // COLLECTOR REPORTS
    // ====================================
    {
      permission_key: 'money-loan:collector-reports:view-daily',
      resource: 'money-loan',
      action: 'collector-reports:view-daily',
      description: 'View daily performance report',
      space: 'tenant'
    },
    {
      permission_key: 'money-loan:collector-reports:view-weekly',
      resource: 'money-loan',
      action: 'collector-reports:view-weekly',
      description: 'View weekly performance report',
      space: 'tenant'
    },
    {
      permission_key: 'money-loan:collector-reports:view-monthly',
      resource: 'money-loan',
      action: 'collector-reports:view-monthly',
      description: 'View monthly performance report',
      space: 'tenant'
    },
    {
      permission_key: 'money-loan:collector-reports:view-targets',
      resource: 'money-loan',
      action: 'collector-reports:view-targets',
      description: 'View collection targets',
      space: 'tenant'
    },
    {
      permission_key: 'money-loan:collector-reports:export',
      resource: 'money-loan',
      action: 'collector-reports:export',
      description: 'Export performance reports',
      space: 'tenant'
    },

    // ====================================
    // COLLECTION ACTIVITIES
    // ====================================
    {
      permission_key: 'money-loan:collection-activities:create',
      resource: 'money-loan',
      action: 'collection-activities:create',
      description: 'Create collection activity notes',
      space: 'tenant'
    },
    {
      permission_key: 'money-loan:collection-activities:view',
      resource: 'money-loan',
      action: 'collection-activities:view',
      description: 'View collection activity history',
      space: 'tenant'
    },
    {
      permission_key: 'money-loan:collection-activities:follow-up',
      resource: 'money-loan',
      action: 'collection-activities:follow-up',
      description: 'Schedule follow-up actions',
      space: 'tenant'
    },
    {
      permission_key: 'money-loan:collection-activities:escalate',
      resource: 'money-loan',
      action: 'collection-activities:escalate',
      description: 'Escalate cases to manager',
      space: 'tenant'
    },

    // ====================================
    // COLLECTOR MANAGEMENT (Admin/Manager)
    // ====================================
    {
      permission_key: 'money-loan:collector-management:read',
      resource: 'money-loan',
      action: 'collector-management:read',
      description: 'View all collectors (Manager)',
      space: 'tenant'
    },
    {
      permission_key: 'money-loan:collector-management:assign-customers',
      resource: 'money-loan',
      action: 'collector-management:assign-customers',
      description: 'Assign customers to collectors (Manager)',
      space: 'tenant'
    },
    {
      permission_key: 'money-loan:collector-management:set-limits',
      resource: 'money-loan',
      action: 'collector-management:set-limits',
      description: 'Set collector limits (Manager)',
      space: 'tenant'
    },
    {
      permission_key: 'money-loan:collector-management:set-targets',
      resource: 'money-loan',
      action: 'collector-management:set-targets',
      description: 'Set collection targets (Manager)',
      space: 'tenant'
    },
    {
      permission_key: 'money-loan:collector-management:view-all-performance',
      resource: 'money-loan',
      action: 'collector-management:view-all-performance',
      description: 'View all collector performance (Manager)',
      space: 'tenant'
    },
    {
      permission_key: 'money-loan:collector-management:view-action-logs',
      resource: 'money-loan',
      action: 'collector-management:view-action-logs',
      description: 'View collector action audit logs (Manager)',
      space: 'tenant'
    },
    {
      permission_key: 'money-loan:collector-management:view-gps-tracking',
      resource: 'money-loan',
      action: 'collector-management:view-gps-tracking',
      description: 'View collector GPS tracking (Manager)',
      space: 'tenant'
    },
    {
      permission_key: 'money-loan:collector-management:manage',
      resource: 'money-loan',
      action: 'collector-management:manage',
      description: 'Full collector management access (Admin)',
      space: 'tenant'
    },

    // ====================================
    // COLLECTOR NOTIFICATIONS
    // ====================================
    {
      permission_key: 'money-loan:collector-notifications:view',
      resource: 'money-loan',
      action: 'collector-notifications:view',
      description: 'View collector notifications',
      space: 'tenant'
    },
    {
      permission_key: 'money-loan:collector-notifications:send-reminder',
      resource: 'money-loan',
      action: 'collector-notifications:send-reminder',
      description: 'Send payment reminders to customers',
      space: 'tenant'
    }
  ];

  // Get existing permissions to avoid duplicates
  const existingPermissions = await knex('permissions')
    .whereIn('permission_key', collectorPermissions.map(p => p.permission_key))
    .select('permission_key');
  
  const existingKeys = new Set(existingPermissions.map(p => p.permission_key || p.permissionKey));

  // Filter out existing permissions
  const newPermissions = collectorPermissions.filter(p => !existingKeys.has(p.permission_key));

  if (newPermissions.length > 0) {
    await knex('permissions').insert(newPermissions);
    console.log(`✔️ Added: ${newPermissions.length} new permissions`);
  } else {
    console.log('ℹ️ All collector permissions already exist');
  }

  console.log(`\n✅ Collector Management permissions seeded! Total: ${collectorPermissions.length} permissions\n`);

  // Display summary by category
  console.log('📊 Permissions by category:');
  console.log('  • Assigned Customers: 4 permissions');
  console.log('  • Application Approval: 5 permissions');
  console.log('  • Loan Disbursement: 5 permissions');
  console.log('  • Payment Collection: 6 permissions');
  console.log('  • Penalty Waiver: 6 permissions');
  console.log('  • Customer Visits & Route: 7 permissions');
  console.log('  • Collector Reports: 5 permissions');
  console.log('  • Collection Activities: 4 permissions');
  console.log('  • Collector Admin (Manager/Admin): 8 permissions');
  console.log('  • Notifications: 2 permissions');
};
