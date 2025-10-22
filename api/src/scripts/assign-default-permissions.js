/**
 * Assign default full permissions to all existing users
 * Creates a Super Admin role with all permissions and assigns it to all users
 */

const pool = require('../config/database');
const logger = require('../utils/logger');

async function assignDefaultPermissions() {
  const client = await pool.connect();
  
  try {
    await client.query('BEGIN');
    
    console.log('🚀 Starting default permissions assignment...\n');
    
    // Step 1: Create Super Admin role if it doesn't exist
    console.log('📝 Step 1: Creating Super Admin role...');
    
    // Check if role exists
    const existingRole = await client.query(`
      SELECT id, name FROM roles WHERE name = 'Super Admin' LIMIT 1
    `);
    
    let superAdminRoleId;
    if (existingRole.rows.length > 0) {
      superAdminRoleId = existingRole.rows[0].id;
      console.log(`✅ Super Admin role already exists (ID: ${superAdminRoleId})`);
    } else {
      const roleResult = await client.query(`
        INSERT INTO roles (name, description, space, status, created_at)
        VALUES ('Super Admin', 'Full system access with all permissions', 'system', 'active', NOW())
        RETURNING id, name
      `);
      superAdminRoleId = roleResult.rows[0].id;
      console.log(`✅ Super Admin role created (ID: ${superAdminRoleId})`);
    }
    console.log('');
    
    // Step 2: Get all permissions
    console.log('📦 Step 2: Fetching all permissions...');
    const permissionsResult = await client.query('SELECT id, permission_key FROM permissions ORDER BY id');
    console.log(`✅ Found ${permissionsResult.rows.length} permissions\n`);
    
    // Step 3: Assign ALL permissions to Super Admin role
    console.log('🔗 Step 3: Assigning permissions to Super Admin role...');
    let assignedCount = 0;
    for (const permission of permissionsResult.rows) {
      await client.query(`
        INSERT INTO role_permissions_standard (role_id, permission_id)
        VALUES ($1, $2)
        ON CONFLICT (role_id, permission_id) DO NOTHING
      `, [superAdminRoleId, permission.id]);
      assignedCount++;
    }
    console.log(`✅ Assigned ${assignedCount} permissions to Super Admin role\n`);
    
    // Step 4: Get all active users
    console.log('👥 Step 4: Fetching active users...');
    const usersResult = await client.query(`
      SELECT id, email, first_name, last_name 
      FROM users 
      WHERE status = 'active'
      ORDER BY id
    `);
    console.log(`✅ Found ${usersResult.rows.length} active users\n`);
    
    // Step 5: Assign Super Admin role to all users
    console.log('🔑 Step 5: Assigning Super Admin role to all users...');
    let userCount = 0;
    for (const user of usersResult.rows) {
      await client.query(`
        INSERT INTO user_roles (user_id, role_id)
        VALUES ($1, $2)
        ON CONFLICT (user_id, role_id) DO NOTHING
      `, [user.id, superAdminRoleId]);
      console.log(`   ✓ ${user.email} (${user.first_name} ${user.last_name})`);
      userCount++;
    }
    console.log(`✅ Assigned Super Admin role to ${userCount} users\n`);
    
    await client.query('COMMIT');
    
    // Step 6: Verify the assignment
    console.log('🔍 Step 6: Verifying assignments...\n');
    const verifyResult = await client.query(`
      SELECT 
        u.id,
        u.email,
        u.first_name || ' ' || u.last_name AS full_name,
        r.name AS role_name,
        COUNT(DISTINCT p.permission_key) AS permission_count
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      JOIN role_permissions_standard rps ON r.id = rps.role_id
      JOIN permissions p ON rps.permission_id = p.id
      WHERE u.status = 'active'
      GROUP BY u.id, u.email, u.first_name, u.last_name, r.name
      ORDER BY u.id
    `);
    
    console.log('📊 Verification Results:');
    console.log('========================');
    verifyResult.rows.forEach(row => {
      console.log(`User: ${row.email}`);
      console.log(`  Name: ${row.full_name}`);
      console.log(`  Role: ${row.role_name}`);
      console.log(`  Permissions: ${row.permission_count}`);
      console.log('');
    });
    
    // Show sample permissions
    const samplePermissions = await client.query(`
      SELECT DISTINCT p.permission_key, p.resource, p.action
      FROM permissions p
      JOIN role_permissions_standard rps ON p.id = rps.permission_id
      WHERE rps.role_id = $1
      ORDER BY p.resource, p.action
      LIMIT 10
    `, [superAdminRoleId]);
    
    console.log('🔐 Sample Permissions (first 10):');
    console.log('==================================');
    samplePermissions.rows.forEach(p => {
      console.log(`  ${p.permission_key} (${p.resource}:${p.action})`);
    });
    
    console.log('\n✨ Default permissions assignment completed successfully!\n');
    
  } catch (error) {
    await client.query('ROLLBACK');
    console.error('❌ Error assigning default permissions:', error);
    throw error;
  } finally {
    client.release();
    await pool.end();
  }
}

// Run the script
if (require.main === module) {
  assignDefaultPermissions()
    .then(() => {
      console.log('✅ Script completed');
      process.exit(0);
    })
    .catch((error) => {
      console.error('❌ Script failed:', error);
      process.exit(1);
    });
}

module.exports = assignDefaultPermissions;
