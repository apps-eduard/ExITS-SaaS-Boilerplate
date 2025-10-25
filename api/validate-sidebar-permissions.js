const pool = require('./src/config/database');

(async () => {
  try {
    // Permissions referenced in sidebar but might not exist in DB
    // Keep this list aligned with `web/src/app/shared/components/sidebar/sidebar.component.ts`
    const sidebarPermissions = [
      'dashboard:view',
      'tenants:read', 'tenants:create', 'tenants:update',
      'users:read', 'users:create', 'users:update', 'tenant-users:read', 'tenant-users:invite',
      'roles:read',
      'products:read', 'products:create', 'products:update',
      // Money Loan permissions (hyphenated as per DB)
      'money-loan:read', 'money-loan:overview:view', 'money-loan:customers:read', 'money-loan:loans:read',
      'money-loan:payments:create', 'money-loan:collections:read', 'money-loan:reports:read',
      // Billing / subscriptions
      'subscriptions:read', 'subscriptions:create', 'subscriptions:manage-plans',
      'tenant-billing:read', 'tenant-billing:view-invoices', 'tenant-billing:manage-renewals',
      // System settings and audit permissions
      'settings:read', 'settings:update', 'audit:read', 'audit:export',
      'reports:view',
      'analytics:view',
      'recycle-bin:view', 'recycle-bin:restore'
    ];
    
    console.log('\n=== SIDEBAR PERMISSION VALIDATION ===\n');
    
    for (const permKey of sidebarPermissions) {
      const res = await pool.query(
        "SELECT permission_key, space FROM permissions WHERE permission_key = $1",
        [permKey]
      );
      
      if (res.rows.length === 0) {
        console.log(`❌ MISSING: ${permKey}`);
      } else {
        console.log(`✅ EXISTS:  ${permKey} (${res.rows[0].space})`);
      }
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
    process.exit(1);
  }
})();
