/**
 * Collector Management - Permission Seeds
 * 
 * Permission Naming Convention: {product}:{resource}:{action}
 * Collector-specific permissions for field operations
 */

const collectorPermissions = [
  // ============================================
  // 1. ASSIGNED CUSTOMERS (4 permissions)
  // ============================================
  {
    permission_key: 'money-loan:assigned-customers:read',
    resource: 'money-loan-assigned-customers',
    action: 'read',
    description: 'View customers assigned to collector',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:assigned-customers:view-details',
    resource: 'money-loan-assigned-customers',
    action: 'view-details',
    description: 'View detailed customer information for assigned customers',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:assigned-customers:view-loan-history',
    resource: 'money-loan-assigned-customers',
    action: 'view-loan-history',
    description: 'View loan history of assigned customers',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:assigned-customers:view-payment-history',
    resource: 'money-loan-assigned-customers',
    action: 'view-payment-history',
    description: 'View payment history of assigned customers',
    space: 'tenant'
  },

  // ============================================
  // 2. APPLICATION APPROVAL (5 permissions)
  // ============================================
  {
    permission_key: 'money-loan:assigned-applications:read',
    resource: 'money-loan-assigned-applications',
    action: 'read',
    description: 'View loan applications from assigned customers',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:assigned-applications:approve',
    resource: 'money-loan-assigned-applications',
    action: 'approve',
    description: 'Approve loan applications within collector limits',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:assigned-applications:reject',
    resource: 'money-loan-assigned-applications',
    action: 'reject',
    description: 'Reject loan applications with reason',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:assigned-applications:request-review',
    resource: 'money-loan-assigned-applications',
    action: 'request-review',
    description: 'Request manager review for applications above limit',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:assigned-applications:view-limits',
    resource: 'money-loan-assigned-applications',
    action: 'view-limits',
    description: 'View own approval limits and usage',
    space: 'tenant'
  },

  // ============================================
  // 3. LOAN DISBURSEMENT (5 permissions)
  // ============================================
  {
    permission_key: 'money-loan:assigned-loans:read',
    resource: 'money-loan-assigned-loans',
    action: 'read',
    description: 'View loans of assigned customers',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:assigned-loans:disburse',
    resource: 'money-loan-assigned-loans',
    action: 'disburse',
    description: 'Disburse approved loans within collector limits',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:assigned-loans:view-pending-disbursement',
    resource: 'money-loan-assigned-loans',
    action: 'view-pending-disbursement',
    description: 'View loans pending disbursement',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:assigned-loans:view-disbursement-limits',
    resource: 'money-loan-assigned-loans',
    action: 'view-disbursement-limits',
    description: 'View disbursement limits (daily/monthly)',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:assigned-loans:request-disbursement-approval',
    resource: 'money-loan-assigned-loans',
    action: 'request-disbursement-approval',
    description: 'Request manager approval for disbursements above limit',
    space: 'tenant'
  },

  // ============================================
  // 4. PAYMENT COLLECTION (6 permissions)
  // ============================================
  {
    permission_key: 'money-loan:assigned-payments:collect',
    resource: 'money-loan-assigned-payments',
    action: 'collect',
    description: 'Collect payments from assigned customers',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:assigned-payments:collect-cash',
    resource: 'money-loan-assigned-payments',
    action: 'collect-cash',
    description: 'Collect cash payments in the field',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:assigned-payments:collect-bank-transfer',
    resource: 'money-loan-assigned-payments',
    action: 'collect-bank-transfer',
    description: 'Record bank transfer payments',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:assigned-payments:view-schedule',
    resource: 'money-loan-assigned-payments',
    action: 'view-schedule',
    description: 'View repayment schedules of assigned customers',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:assigned-payments:view-overdue',
    resource: 'money-loan-assigned-payments',
    action: 'view-overdue',
    description: 'View overdue payments of assigned customers',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:assigned-payments:view-collection-summary',
    resource: 'money-loan-assigned-payments',
    action: 'view-collection-summary',
    description: 'View daily collection summary and totals',
    space: 'tenant'
  },

  // ============================================
  // 5. PENALTY WAIVER (6 permissions)
  // ============================================
  {
    permission_key: 'money-loan:penalties:view',
    resource: 'money-loan-penalties',
    action: 'view',
    description: 'View penalty charges for assigned customers',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:penalties:waive-partial',
    resource: 'money-loan-penalties',
    action: 'waive-partial',
    description: 'Waive penalties within collector limits (auto-approved)',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:penalties:waive-request',
    resource: 'money-loan-penalties',
    action: 'waive-request',
    description: 'Request penalty waiver above limit (needs manager approval)',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:penalties:view-waiver-history',
    resource: 'money-loan-penalties',
    action: 'view-waiver-history',
    description: 'View own penalty waiver history',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:penalties:view-waiver-limits',
    resource: 'money-loan-penalties',
    action: 'view-waiver-limits',
    description: 'View penalty waiver limits (amount/percentage)',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:penalties:approve-waiver',
    resource: 'money-loan-penalties',
    action: 'approve-waiver',
    description: 'Approve penalty waiver requests (manager only)',
    space: 'tenant'
  },

  // ============================================
  // 6. CUSTOMER VISITS & ROUTE (7 permissions)
  // ============================================
  {
    permission_key: 'money-loan:route:view',
    resource: 'money-loan-route',
    action: 'view',
    description: 'View daily collection route',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:route:check-in',
    resource: 'money-loan-route',
    action: 'check-in',
    description: 'Check-in at customer location with GPS',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:route:record-visit',
    resource: 'money-loan-route',
    action: 'record-visit',
    description: 'Record customer visit details and outcome',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:route:upload-photo',
    resource: 'money-loan-route',
    action: 'upload-photo',
    description: 'Upload photos during customer visits',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:route:capture-signature',
    resource: 'money-loan-route',
    action: 'capture-signature',
    description: 'Capture customer signature during visit',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:route:view-visit-history',
    resource: 'money-loan-route',
    action: 'view-visit-history',
    description: 'View customer visit history',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:route:optimize',
    resource: 'money-loan-route',
    action: 'optimize',
    description: 'View optimized route suggestions',
    space: 'tenant'
  },

  // ============================================
  // 7. COLLECTOR REPORTS (5 permissions)
  // ============================================
  {
    permission_key: 'money-loan:collector-reports:view-daily',
    resource: 'money-loan-collector-reports',
    action: 'view-daily',
    description: 'View own daily performance report',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:collector-reports:view-weekly',
    resource: 'money-loan-collector-reports',
    action: 'view-weekly',
    description: 'View own weekly performance report',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:collector-reports:view-monthly',
    resource: 'money-loan-collector-reports',
    action: 'view-monthly',
    description: 'View own monthly performance report',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:collector-reports:view-targets',
    resource: 'money-loan-collector-reports',
    action: 'view-targets',
    description: 'View collection targets and achievement',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:collector-reports:export',
    resource: 'money-loan-collector-reports',
    action: 'export',
    description: 'Export own performance reports',
    space: 'tenant'
  },

  // ============================================
  // 8. COLLECTION ACTIVITIES (4 permissions)
  // ============================================
  {
    permission_key: 'money-loan:collection-activities:create',
    resource: 'money-loan-collection-activities',
    action: 'create',
    description: 'Create collection activity notes',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:collection-activities:view',
    resource: 'money-loan-collection-activities',
    action: 'view',
    description: 'View collection activity history for assigned customers',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:collection-activities:follow-up',
    resource: 'money-loan-collection-activities',
    action: 'schedule-follow-up',
    description: 'Schedule follow-up activities',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:collection-activities:escalate',
    resource: 'money-loan-collection-activities',
    action: 'escalate',
    description: 'Escalate difficult cases to manager',
    space: 'tenant'
  },

  // ============================================
  // 9. COLLECTOR ADMIN (Manager/Admin only - 8 permissions)
  // ============================================
  {
    permission_key: 'money-loan:collector-management:read',
    resource: 'money-loan-collector-management',
    action: 'read',
    description: 'View all collectors and their performance',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:collector-management:assign-customers',
    resource: 'money-loan-collector-management',
    action: 'assign-customers',
    description: 'Assign/reassign customers to collectors',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:collector-management:set-limits',
    resource: 'money-loan-collector-management',
    action: 'set-limits',
    description: 'Set approval/disbursement/waiver limits for collectors',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:collector-management:set-targets',
    resource: 'money-loan-collector-management',
    action: 'set-targets',
    description: 'Set collection targets for collectors',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:collector-management:view-all-performance',
    resource: 'money-loan-collector-management',
    action: 'view-all-performance',
    description: 'View performance reports for all collectors',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:collector-management:view-action-logs',
    resource: 'money-loan-collector-management',
    action: 'view-action-logs',
    description: 'View audit logs of all collector actions',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:collector-management:view-gps-tracking',
    resource: 'money-loan-collector-management',
    action: 'view-gps-tracking',
    description: 'View real-time GPS tracking of collectors',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:collector-management:manage',
    resource: 'money-loan-collector-management',
    action: 'manage',
    description: 'Full collector management access (admin only)',
    space: 'tenant'
  },

  // ============================================
  // 10. NOTIFICATIONS (2 permissions)
  // ============================================
  {
    permission_key: 'money-loan:collector-notifications:view',
    resource: 'money-loan-collector-notifications',
    action: 'view',
    description: 'View collection reminders and alerts',
    space: 'tenant'
  },
  {
    permission_key: 'money-loan:collector-notifications:send-reminder',
    resource: 'money-loan-collector-notifications',
    action: 'send-reminder',
    description: 'Send payment reminders to customers',
    space: 'tenant'
  }
];

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  console.log('🌱 Seeding Collector Management permissions...\n');

  // Insert permissions (ignore duplicates)
  for (const perm of collectorPermissions) {
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

  console.log(`\n✅ Collector Management permissions seeded! Total: ${collectorPermissions.length} permissions`);
  
  // Summary by category
  console.log('\n📊 Permissions by category:');
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

// Export for reference
module.exports.collectorPermissions = collectorPermissions;
