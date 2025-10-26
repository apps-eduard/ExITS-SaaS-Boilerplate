const pool = require('./src/config/database');

async function checkUserPermissions() {
  try {
    // Get tenant admin user
    const user = await pool.query(
      "SELECT id, email, tenant_id FROM users WHERE email = 'admin-1@example.com' LIMIT 1"
    );
    
    if (user.rows.length === 0) {
      console.log('❌ User admin-1@example.com not found');
      process.exit(1);
    }
    
    const userId = user.rows[0].id;
    const tenantId = user.rows[0].tenant_id;
    console.log(`✅ Found user: ${user.rows[0].email} (ID: ${userId}, Tenant: ${tenantId})`);
    
    // Get user's roles
    const roles = await pool.query(
      `SELECT r.id, r.name, r.space
       FROM user_roles ur
       JOIN roles r ON r.id = ur.role_id
       WHERE ur.user_id = $1`,
      [userId]
    );
    
    console.log(`\n📋 User has ${roles.rows.length} role(s):`);
    roles.rows.forEach(r => console.log(`   ✓ ${r.name} (${r.space})`));
    
    // Get billing-related permissions
    const billingPerms = await pool.query(
      `SELECT DISTINCT p.permission_key, p.space
       FROM role_permissions rp
       JOIN permissions p ON p.id = rp.permission_id
       JOIN user_roles ur ON ur.role_id = rp.role_id
       WHERE ur.user_id = $1 
       AND p.permission_key LIKE '%billing%'
       ORDER BY p.permission_key`,
      [userId]
    );
    
    console.log(`\n💳 Billing-related permissions (${billingPerms.rows.length}):`);
    if (billingPerms.rows.length === 0) {
      console.log('   ❌ No billing permissions found!');
    } else {
      billingPerms.rows.forEach(p => console.log(`   ✓ ${p.permission_key} (${p.space})`));
    }
    
    // Check specifically for tenant-billing:read
    const hasRead = billingPerms.rows.some(p => p.permission_key === 'tenant-billing:read');
    console.log(`\n🔍 Has 'tenant-billing:read': ${hasRead ? '✅ YES' : '❌ NO'}`);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkUserPermissions();
