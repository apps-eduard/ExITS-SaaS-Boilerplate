const pool = require('./src/config/database');

async function checkPermissions() {
  try {
    console.log('=== CHECKING DATABASE PERMISSIONS ===\n');
    
    // 1. Total permissions count
    const total = await pool.query('SELECT COUNT(*) FROM permissions');
    console.log('1. Total permissions:', total.rows[0].count);
    
    // 2. Check our new permissions
    console.log('\n2. Checking our new permissions...');
    const newPerms = await pool.query(`
      SELECT permission_key, resource, action 
      FROM permissions 
      WHERE permission_key LIKE 'tenant-dashboard:%' 
         OR permission_key LIKE 'tenant-users:%'
         OR permission_key LIKE 'tenant-roles:%'
         OR permission_key LIKE 'tenant-settings:%'
         OR permission_key LIKE 'loans:%'
         OR permission_key LIKE 'payments:%'
      ORDER BY permission_key
    `);
    
    console.log(`Found ${newPerms.rows.length} new permissions:`);
    newPerms.rows.forEach(p => console.log(`   - ${p.permission_key}`));
    
    // 3. Check role assignments for Tenant Admin roles
    console.log('\n3. Checking role assignments...');
    const tenantAdminRoles = await pool.query(`
      SELECT id, name FROM roles WHERE name = 'Tenant Admin'
    `);
    
    for (const role of tenantAdminRoles.rows) {
      const rolePerms = await pool.query(`
        SELECT COUNT(*) as count
        FROM role_permissions rps
        JOIN permissions p ON rps.permission_id = p.id
        WHERE rps.role_id = $1
      `, [role.id]);
      console.log(`   Tenant Admin (role ${role.id}) has ${rolePerms.rows[0].count} permissions`);
    }
    
    // 4. Check specific assignments for new permissions
    console.log('\n4. Checking specific new permission assignments...');
    const specificAssignments = await pool.query(`
      SELECT p.permission_key, r.id as role_id, r.name as role_name
      FROM role_permissions rps
      JOIN permissions p ON rps.permission_id = p.id
      JOIN roles r ON rps.role_id = r.id
      WHERE r.name = 'Tenant Admin'
        AND (p.permission_key LIKE 'tenant-dashboard:%' 
             OR p.permission_key LIKE 'tenant-users:%'
             OR p.permission_key LIKE 'tenant-roles:%'
             OR p.permission_key LIKE 'tenant-settings:%'
             OR p.permission_key LIKE 'loans:%'
             OR p.permission_key LIKE 'payments:%')
      ORDER BY r.id, p.permission_key
    `);
    
    console.log(`   ${specificAssignments.rows.length} new permission assignments found:`);
    if (specificAssignments.rows.length > 0) {
      // Group by role
      const byRole = {};
      specificAssignments.rows.forEach(a => {
        if (!byRole[a.role_id]) byRole[a.role_id] = [];
        byRole[a.role_id].push(a.permission_key);
      });
      
      Object.keys(byRole).forEach(roleId => {
        console.log(`   Role ${roleId}: ${byRole[roleId].length} permissions`);
        byRole[roleId].forEach(perm => console.log(`     - ${perm}`));
      });
    }
    
    // 5. Check if any are missing
    const expectedPerms = [
      'tenant-dashboard:view',
      'tenant-users:read', 'tenant-users:create', 'tenant-users:update', 'tenant-users:delete', 'tenant-users:invite', 'tenant-users:assign-roles',
      'tenant-roles:read', 'tenant-roles:create', 'tenant-roles:update', 'tenant-roles:delete',
      'tenant-settings:read', 'tenant-settings:update',
      'loans:read', 'loans:create', 'loans:update', 'loans:delete', 'loans:approve', 'loans:disburse',
      'payments:read', 'payments:create', 'payments:update', 'payments:delete'
    ];
    
    const assignedPermKeys = specificAssignments.rows.map(r => r.permission_key);
    const missing = expectedPerms.filter(ep => !assignedPermKeys.includes(ep));
    
    console.log('\n5. Missing assignments:');
    if (missing.length > 0) {
      console.log('   ❌ Missing permissions:');
      missing.forEach(m => console.log(`   - ${m}`));
    } else {
      console.log('   ✅ All new permissions are properly assigned!');
    }
    
    await pool.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('Stack:', err.stack);
  }
}

checkPermissions();
