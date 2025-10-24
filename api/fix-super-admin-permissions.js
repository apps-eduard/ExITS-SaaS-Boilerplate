const pool = require('./src/config/database');

async function checkSuperAdminPermissions() {
  try {
    console.log('=== CHECKING SUPER ADMIN PERMISSIONS ===\n');
    
    // 1. Find Super Admin role
    const superAdminRole = await pool.query("SELECT * FROM roles WHERE name = 'Super Admin'");
    console.log('Super Admin role:', superAdminRole.rows[0]);
    
    if (superAdminRole.rows.length === 0) {
      console.log('❌ Super Admin role not found!');
      return;
    }
    
    const roleId = superAdminRole.rows[0].id;
    
    // 2. Check current permissions
    const currentPerms = await pool.query(`
      SELECT p.permission_key, p.resource, p.action
      FROM role_permissions_standard rps
      JOIN permissions p ON rps.permission_id = p.id
      WHERE rps.role_id = $1
      ORDER BY p.permission_key
    `, [roleId]);
    
    console.log(`\n2. Super Admin currently has ${currentPerms.rows.length} permissions`);
    
    // 3. Check all permissions in database
    const allPerms = await pool.query('SELECT permission_key, resource, action FROM permissions ORDER BY permission_key');
    console.log(`3. Total permissions in database: ${allPerms.rows.length}`);
    
    // 4. Find missing permissions
    const currentPermKeys = currentPerms.rows.map(p => p.permission_key);
    const allPermKeys = allPerms.rows.map(p => p.permission_key);
    const missing = allPermKeys.filter(pk => !currentPermKeys.includes(pk));
    
    console.log(`\n4. Missing permissions for Super Admin: ${missing.length}`);
    if (missing.length > 0) {
      console.log('Missing permissions:');
      missing.forEach(p => console.log(`   - ${p}`));
      
      // 5. Add missing permissions
      console.log('\n5. Adding missing permissions to Super Admin...');
      
      for (const permKey of missing) {
        const perm = await pool.query('SELECT id FROM permissions WHERE permission_key = $1', [permKey]);
        if (perm.rows.length > 0) {
          // Check if assignment already exists
          const existing = await pool.query(
            'SELECT id FROM role_permissions_standard WHERE role_id = $1 AND permission_id = $2',
            [roleId, perm.rows[0].id]
          );
          
          if (existing.rows.length === 0) {
            await pool.query(
              'INSERT INTO role_permissions_standard (role_id, permission_id, created_at, updated_at) VALUES ($1, $2, NOW(), NOW())',
              [roleId, perm.rows[0].id]
            );
            console.log(`   ✅ Added: ${permKey}`);
          }
        }
      }
      
      console.log(`\n🎉 Added ${missing.length} missing permissions to Super Admin!`);
    } else {
      console.log('✅ Super Admin already has all permissions!');
    }
    
    await pool.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('Stack:', err.stack);
  }
}

checkSuperAdminPermissions();