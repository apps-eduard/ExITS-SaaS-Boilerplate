/**
 * Add New Menu Permissions for Products, Reports, Subscriptions, and Analytics
 * This script adds all missing permissions for the new sidebar menu items
 */

const pool = require('../config/database');
const logger = require('../utils/logger');

async function addNewMenuPermissions() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🚀 Starting new menu permissions setup...\n');
    
    // ==================== SYSTEM ADMIN PERMISSIONS ====================
    
    console.log('📦 Step 1: Adding System Admin Permissions...\n');
    
    // Products Management (System Level)
    console.log('  → Adding Products permissions...');
    await client.query(`
      INSERT INTO permissions (permission_key, resource, action, description, space) VALUES
      ('products:create', 'products', 'create', 'Create new products', 'system'),
      ('products:read', 'products', 'read', 'View products', 'system'),
      ('products:update', 'products', 'update', 'Edit product details', 'system'),
      ('products:delete', 'products', 'delete', 'Delete products', 'system'),
      ('products:manage-catalog', 'products', 'manage-catalog', 'Manage product catalog', 'system'),
      ('products:manage-mapping', 'products', 'manage-mapping', 'Manage product mapping', 'system'),
      ('products:manage-settings', 'products', 'manage-settings', 'Manage product settings', 'system')
      ON CONFLICT (permission_key) DO NOTHING
    `);
    console.log('    ✓ Products permissions added\n');
    
    // Subscriptions Management (System Level)
    console.log('  → Adding Subscriptions permissions...');
    await client.query(`
      INSERT INTO permissions (permission_key, resource, action, description, space) VALUES
      ('subscriptions:create', 'subscriptions', 'create', 'Create new subscriptions', 'system'),
      ('subscriptions:read', 'subscriptions', 'read', 'View subscriptions', 'system'),
      ('subscriptions:update', 'subscriptions', 'update', 'Edit subscription details', 'system'),
      ('subscriptions:delete', 'subscriptions', 'delete', 'Delete subscriptions', 'system'),
      ('subscriptions:manage-plans', 'subscriptions', 'manage-plans', 'Manage subscription plans', 'system'),
      ('subscriptions:manage-renewals', 'subscriptions', 'manage-renewals', 'Manage subscription renewals', 'system')
      ON CONFLICT (permission_key) DO NOTHING
    `);
    console.log('    ✓ Subscriptions permissions added\n');
    
    // Reports & Analytics (System Level)
    console.log('  → Adding Reports & Analytics permissions...');
    await client.query(`
      INSERT INTO permissions (permission_key, resource, action, description, space) VALUES
      ('reports:view', 'reports', 'view', 'View system reports', 'system'),
      ('reports:export', 'reports', 'export', 'Export reports', 'system'),
      ('reports:tenant-usage', 'reports', 'tenant-usage', 'View tenant usage reports', 'system'),
      ('reports:revenue', 'reports', 'revenue', 'View revenue reports', 'system'),
      ('reports:product-adoption', 'reports', 'product-adoption', 'View product adoption reports', 'system'),
      ('reports:activity-logs', 'reports', 'activity-logs', 'View system activity logs', 'system'),
      ('analytics:view', 'analytics', 'view', 'View analytics dashboard', 'system')
      ON CONFLICT (permission_key) DO NOTHING
    `);
    console.log('    ✓ Reports & Analytics permissions added\n');
    
    // Recycle Bin (System Level)
    console.log('  → Adding Recycle Bin permissions...');
    await client.query(`
      INSERT INTO permissions (permission_key, resource, action, description, space) VALUES
      ('recycle-bin:view', 'recycle-bin', 'view', 'View recycle bin', 'system'),
      ('recycle-bin:restore', 'recycle-bin', 'restore', 'Restore deleted items', 'system'),
      ('recycle-bin:permanent-delete', 'recycle-bin', 'permanent-delete', 'Permanently delete items', 'system')
      ON CONFLICT (permission_key) DO NOTHING
    `);
    console.log('    ✓ Recycle Bin permissions added\n');
    
    // ==================== TENANT PERMISSIONS ====================
    
    console.log('📦 Step 2: Adding Tenant Permissions...\n');
    
    // Products (Tenant Level)
    console.log('  → Adding Tenant Products permissions...');
    await client.query(`
      INSERT INTO permissions (permission_key, resource, action, description, space) VALUES
      ('tenant-products:read', 'tenant-products', 'read', 'View tenant product catalog', 'tenant'),
      ('tenant-products:configure', 'tenant-products', 'configure', 'Configure tenant products', 'tenant'),
      ('tenant-products:manage-settings', 'tenant-products', 'manage-settings', 'Manage product settings/features', 'tenant')
      ON CONFLICT (permission_key) DO NOTHING
    `);
    console.log('    ✓ Tenant Products permissions added\n');
    
    // Subscriptions & Billing (Tenant Level)
    console.log('  → Adding Tenant Billing permissions...');
    await client.query(`
      INSERT INTO permissions (permission_key, resource, action, description, space) VALUES
      ('tenant-billing:read', 'tenant-billing', 'read', 'View tenant billing information', 'tenant'),
      ('tenant-billing:view-subscriptions', 'tenant-billing', 'view-subscriptions', 'View tenant subscriptions', 'tenant'),
      ('tenant-billing:view-invoices', 'tenant-billing', 'view-invoices', 'View tenant invoices', 'tenant'),
      ('tenant-billing:manage-renewals', 'tenant-billing', 'manage-renewals', 'Manage subscription renewals', 'tenant'),
      ('tenant-billing:view-overview', 'tenant-billing', 'view-overview', 'View billing overview', 'tenant')
      ON CONFLICT (permission_key) DO NOTHING
    `);
    console.log('    ✓ Tenant Billing permissions added\n');
    
    // Reports (Tenant Level)
    console.log('  → Adding Tenant Reports permissions...');
    await client.query(`
      INSERT INTO permissions (permission_key, resource, action, description, space) VALUES
      ('tenant-reports:view', 'tenant-reports', 'view', 'View tenant reports', 'tenant'),
      ('tenant-reports:product-usage', 'tenant-reports', 'product-usage', 'View product usage reports', 'tenant'),
      ('tenant-reports:user-activity', 'tenant-reports', 'user-activity', 'View user activity reports', 'tenant'),
      ('tenant-reports:billing-summary', 'tenant-reports', 'billing-summary', 'View billing/payment summary', 'tenant'),
      ('tenant-reports:transactions', 'tenant-reports', 'transactions', 'View transaction history', 'tenant'),
      ('tenant-reports:export', 'tenant-reports', 'export', 'Export tenant reports', 'tenant')
      ON CONFLICT (permission_key) DO NOTHING
    `);
    console.log('    ✓ Tenant Reports permissions added\n');
    
    // Recycle Bin (Tenant Level)
    console.log('  → Adding Tenant Recycle Bin permissions...');
    await client.query(`
      INSERT INTO permissions (permission_key, resource, action, description, space) VALUES
      ('tenant-recycle-bin:view', 'tenant-recycle-bin', 'view', 'View tenant recycle bin', 'tenant'),
      ('tenant-recycle-bin:restore', 'tenant-recycle-bin', 'restore', 'Restore deleted tenant items', 'tenant'),
      ('tenant-recycle-bin:view-history', 'tenant-recycle-bin', 'view-history', 'View recovery history', 'tenant')
      ON CONFLICT (permission_key) DO NOTHING
    `);
    console.log('    ✓ Tenant Recycle Bin permissions added\n');
    
    // ==================== ASSIGN ALL PERMISSIONS TO SUPER ADMIN ====================
    
    console.log('🔑 Step 3: Assigning permissions to Super Admin role...\n');
    
    const permissionKeys = [
      // Products
      'products:create', 'products:read', 'products:update', 'products:delete',
      'products:manage-catalog', 'products:manage-mapping', 'products:manage-settings',
      // Subscriptions
      'subscriptions:create', 'subscriptions:read', 'subscriptions:update', 'subscriptions:delete',
      'subscriptions:manage-plans', 'subscriptions:manage-renewals',
      // Reports & Analytics
      'reports:view', 'reports:export', 'reports:tenant-usage', 'reports:revenue',
      'reports:product-adoption', 'reports:activity-logs', 'analytics:view',
      // Recycle Bin
      'recycle-bin:view', 'recycle-bin:restore', 'recycle-bin:permanent-delete',
      // Tenant Products
      'tenant-products:read', 'tenant-products:configure', 'tenant-products:manage-settings',
      // Tenant Billing
      'tenant-billing:read', 'tenant-billing:view-subscriptions', 'tenant-billing:view-invoices',
      'tenant-billing:manage-renewals', 'tenant-billing:view-overview',
      // Tenant Reports
      'tenant-reports:view', 'tenant-reports:product-usage', 'tenant-reports:user-activity',
      'tenant-reports:billing-summary', 'tenant-reports:transactions', 'tenant-reports:export',
      // Tenant Recycle Bin
      'tenant-recycle-bin:view', 'tenant-recycle-bin:restore', 'tenant-recycle-bin:view-history'
    ];
    
    let assignedCount = 0;
    for (const permKey of permissionKeys) {
      const result = await client.query(`
        INSERT INTO role_permissions_standard (role_id, permission_id)
        SELECT 
          r.id as role_id,
          p.id as permission_id
        FROM roles r
        CROSS JOIN permissions p
        WHERE r.name = 'Super Admin' 
          AND r.space = 'system'
          AND p.permission_key = $1
        ON CONFLICT (role_id, permission_id) DO NOTHING
      `, [permKey]);
      
      if (result.rowCount > 0) {
        assignedCount++;
        console.log(`    ✓ ${permKey}`);
      }
    }
    
    console.log(`\n✅ Assigned ${assignedCount} new permissions to Super Admin role\n`);
    
    await client.query('COMMIT');
    
    // ==================== VERIFICATION ====================
    
    console.log('🔍 Verification Results:\n');
    console.log('=' .repeat(60));
    
    // Count total permissions
    const stats = await client.query(`
      SELECT 
        'Total Permissions' as metric,
        COUNT(*) as count
      FROM permissions
      UNION ALL
      SELECT 
        'Super Admin Permissions' as metric,
        COUNT(*) as count
      FROM role_permissions_standard rps
      JOIN roles r ON rps.role_id = r.id
      WHERE r.name = 'Super Admin' AND r.space = 'system'
      UNION ALL
      SELECT 
        'System Permissions' as metric,
        COUNT(*) as count
      FROM permissions
      WHERE space = 'system'
      UNION ALL
      SELECT 
        'Tenant Permissions' as metric,
        COUNT(*) as count
      FROM permissions
      WHERE space = 'tenant'
    `);
    
    console.log('\n📊 Permission Statistics:');
    stats.rows.forEach(row => {
      console.log(`   ${row.metric}: ${row.count}`);
    });
    
    // Display new permissions
    const newPerms = await client.query(`
      SELECT 
        permission_key,
        resource,
        action,
        space,
        description
      FROM permissions
      WHERE permission_key LIKE '%products%'
         OR permission_key LIKE '%subscriptions%'
         OR permission_key LIKE '%reports%'
         OR permission_key LIKE '%analytics%'
         OR permission_key LIKE '%recycle-bin%'
      ORDER BY space, resource, action
    `);
    
    console.log('\n🔐 New Permissions Added:');
    console.log('=' .repeat(60));
    let currentSpace = '';
    newPerms.rows.forEach(p => {
      if (p.space !== currentSpace) {
        currentSpace = p.space;
        console.log(`\n[${p.space.toUpperCase()}]`);
      }
      console.log(`  ${p.permission_key.padEnd(40)} - ${p.description}`);
    });
    
    // Verify Super Admin
    const superAdminCheck = await client.query(`
      SELECT 
        r.name as role_name,
        COUNT(DISTINCT p.id) as permission_count,
        COUNT(DISTINCT p.resource) as resource_count
      FROM roles r
      JOIN role_permissions_standard rps ON r.id = rps.role_id
      JOIN permissions p ON rps.permission_id = p.id
      WHERE r.name = 'Super Admin' AND r.space = 'system'
      GROUP BY r.name
    `);
    
    if (superAdminCheck.rows.length > 0) {
      const admin = superAdminCheck.rows[0];
      console.log('\n✅ Super Admin Role Verification:');
      console.log('=' .repeat(60));
      console.log(`   Role: ${admin.role_name}`);
      console.log(`   Total Permissions: ${admin.permission_count}`);
      console.log(`   Resource Types: ${admin.resource_count}`);
    }
    
    console.log('\n' + '=' .repeat(60));
    console.log('✨ New menu permissions setup completed successfully!\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error adding new menu permissions:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  addNewMenuPermissions()
    .then(() => {
      console.log('✅ Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = addNewMenuPermissions;
