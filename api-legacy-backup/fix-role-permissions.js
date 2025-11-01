const { Pool } = require('pg');

const pool = new Pool({
  connectionString: 'postgresql://postgres:admin@localhost:5432/exits_saas_db'
});

async function fixRolePermissions() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🔍 Checking current state...\n');
    
    // Check Super Admin permissions
    const superAdminCheck = await client.query(`
      SELECT p.space, COUNT(*) as count
      FROM roles r
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE r.name = 'Super Admin' AND r.space = 'system'
      GROUP BY p.space
    `);
    console.log('Super Admin current permissions:');
    console.table(superAdminCheck.rows);
    
    // Check Tenant Admin permissions
    const tenantAdminCheck = await client.query(`
      SELECT p.space, COUNT(*) as count
      FROM roles r
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE r.name = 'Tenant Admin' AND r.space = 'tenant'
      GROUP BY p.space
    `);
    console.log('\nTenant Admin current permissions:');
    console.table(tenantAdminCheck.rows);
    
    console.log('\n🔧 Fixing Super Admin role...');
    
    // 1. Remove all TENANT permissions from Super Admin
    const removeSuperAdminTenant = await client.query(`
      DELETE FROM role_permissions
      WHERE role_id IN (SELECT id FROM roles WHERE name = 'Super Admin' AND space = 'system')
        AND permission_id IN (SELECT id FROM permissions WHERE space = 'tenant')
      RETURNING *
    `);
    console.log(`   ✅ Removed ${removeSuperAdminTenant.rowCount} tenant permissions from Super Admin`);
    
    // 2. Ensure Super Admin has ALL system permissions
    const grantSuperAdminSystem = await client.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id
      FROM roles r
      CROSS JOIN permissions p
      WHERE r.name = 'Super Admin' 
        AND r.space = 'system'
        AND p.space = 'system'
        AND NOT EXISTS (
          SELECT 1 FROM role_permissions rp2
          WHERE rp2.role_id = r.id AND rp2.permission_id = p.id
        )
      RETURNING *
    `);
    console.log(`   ✅ Granted ${grantSuperAdminSystem.rowCount} missing system permissions to Super Admin`);
    
    console.log('\n🔧 Fixing Tenant Admin role(s)...');
    
    // 3. Remove all SYSTEM permissions from Tenant Admin
    const removeTenantAdminSystem = await client.query(`
      DELETE FROM role_permissions
      WHERE role_id IN (SELECT id FROM roles WHERE name = 'Tenant Admin' AND space = 'tenant')
        AND permission_id IN (SELECT id FROM permissions WHERE space = 'system')
      RETURNING *
    `);
    console.log(`   ✅ Removed ${removeTenantAdminSystem.rowCount} system permissions from Tenant Admin role(s)`);
    
    // 4. Ensure Tenant Admin has ALL tenant permissions
    const grantTenantAdminTenant = await client.query(`
      INSERT INTO role_permissions (role_id, permission_id)
      SELECT r.id, p.id
      FROM roles r
      CROSS JOIN permissions p
      WHERE r.name = 'Tenant Admin' 
        AND r.space = 'tenant'
        AND p.space = 'tenant'
        AND NOT EXISTS (
          SELECT 1 FROM role_permissions rp2
          WHERE rp2.role_id = r.id AND rp2.permission_id = p.id
        )
      RETURNING *
    `);
    console.log(`   ✅ Granted ${grantTenantAdminTenant.rowCount} missing tenant permissions to Tenant Admin role(s)`);
    
    await client.query('COMMIT');
    
    console.log('\n✅ Transaction committed!\n');
    
    // Verify final state
    console.log('🎯 Final state verification:\n');
    
    const superAdminFinal = await client.query(`
      SELECT p.space, COUNT(*) as count
      FROM roles r
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE r.name = 'Super Admin' AND r.space = 'system'
      GROUP BY p.space
    `);
    console.log('Super Admin final permissions:');
    console.table(superAdminFinal.rows);
    
    const tenantAdminFinal = await client.query(`
      SELECT p.space, COUNT(*) as count
      FROM roles r
      JOIN role_permissions rp ON r.id = rp.role_id
      JOIN permissions p ON rp.permission_id = p.id
      WHERE r.name = 'Tenant Admin' AND r.space = 'tenant'
      GROUP BY p.space
    `);
    console.log('\nTenant Admin final permissions:');
    console.table(tenantAdminFinal.rows);
    
    // Show total permissions available
    const totals = await client.query(`
      SELECT space, COUNT(*) as total_available
      FROM permissions
      GROUP BY space
    `);
    console.log('\nTotal permissions available:');
    console.table(totals.rows);
    
    console.log('\n✅ ALL DONE! Roles now have correct permissions based on their space.');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error:', error.message);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

fixRolePermissions().catch(console.error);
