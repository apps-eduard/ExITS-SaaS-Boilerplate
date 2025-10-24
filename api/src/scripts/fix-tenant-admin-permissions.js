/**
 * Fix Tenant Admin Permissions
 * Grants all tenant-level permissions to existing Tenant Admin roles that don't have permissions
 */

const pool = require('../config/database');
require('dotenv').config();

async function fixTenantAdminPermissions() {
  const client = await pool.connect();
  
  try {
    console.log('🔧 Fixing Tenant Admin permissions...\n');
    
    // Find all Tenant Admin roles
    const rolesResult = await client.query(
      `SELECT id, tenant_id, name FROM roles WHERE name = 'Tenant Admin' AND space = 'tenant'`
    );
    
    console.log(`📋 Found ${rolesResult.rows.length} Tenant Admin roles\n`);
    
    if (rolesResult.rows.length === 0) {
      console.log('✅ No Tenant Admin roles found to fix');
      return;
    }
    
    // Get all tenant-level permissions
    const permissionsResult = await client.query(
      `SELECT id, permission_key FROM permissions WHERE space IN ('tenant', 'both') ORDER BY permission_key`
    );
    
    console.log(`🔑 Found ${permissionsResult.rows.length} tenant-level permissions:\n`);
    permissionsResult.rows.forEach(p => console.log(`   - ${p.permission_key}`));
    console.log('');
    
    // For each Tenant Admin role, grant all permissions
    for (const role of rolesResult.rows) {
      console.log(`⚙️  Processing role: ${role.name} (ID: ${role.id}, Tenant: ${role.tenant_id})`);
      
      // Check current permissions
      const currentPermsResult = await client.query(
        `SELECT COUNT(*) as count FROM role_permissions_standard WHERE role_id = $1`,
        [role.id]
      );
      
      const currentCount = parseInt(currentPermsResult.rows[0].count);
      console.log(`   Current permissions: ${currentCount}`);
      
      if (permissionsResult.rows.length > 0) {
        const permissionValues = permissionsResult.rows
          .map(p => `(${role.id}, ${p.id})`)
          .join(', ');
        
        await client.query(
          `INSERT INTO role_permissions_standard (role_id, permission_id) 
           VALUES ${permissionValues}
           ON CONFLICT (role_id, permission_id) DO NOTHING`
        );
        
        // Verify new count
        const newPermsResult = await client.query(
          `SELECT COUNT(*) as count FROM role_permissions_standard WHERE role_id = $1`,
          [role.id]
        );
        
        const newCount = parseInt(newPermsResult.rows[0].count);
        const added = newCount - currentCount;
        
        console.log(`   ✅ Granted permissions: ${newCount} total (${added} new)\n`);
      }
    }
    
    console.log('✅ All Tenant Admin roles updated successfully!');
    
  } catch (err) {
    console.error('❌ Error:', err.message);
    throw err;
  } finally {
    client.release();
    await pool.end();
  }
}

fixTenantAdminPermissions();
