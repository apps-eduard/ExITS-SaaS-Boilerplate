const db = require('./src/config/database');

async function checkUsersWithoutPermissions() {
  try {
    console.log('\n🔍 CHECKING USERS WITHOUT PERMISSIONS\n');

    // Find users without roles
    console.log('1️⃣ Users without any roles:');
    const noRolesResult = await db.query(`
      SELECT u.id, u.email, u.tenant_id, u.status
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      WHERE ur.user_id IS NULL
      ORDER BY u.id
    `);
    console.log(`Found: ${noRolesResult.rows.length}`);
    noRolesResult.rows.forEach(u => {
      console.log(`  - ID ${u.id}: ${u.email} (Tenant: ${u.tenant_id || 'System'}) - Status: ${u.status}`);
    });

    console.log('\n\n2️⃣ Users with roles but no permissions:');
    const noPermsResult = await db.query(`
      SELECT DISTINCT u.id, u.email, u.tenant_id, r.name as role_name
      FROM users u
      JOIN user_roles ur ON u.id = ur.user_id
      JOIN roles r ON ur.role_id = r.id
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      WHERE rp.role_id IS NULL
      ORDER BY u.id
    `);
    console.log(`Found: ${noPermsResult.rows.length}`);
    noPermsResult.rows.forEach(u => {
      console.log(`  - ID ${u.id}: ${u.email} (Role: ${u.role_name}, Tenant: ${u.tenant_id || 'System'})`);
    });

    console.log('\n\n3️⃣ All users and their permission count:');
    const allUsersResult = await db.query(`
      SELECT 
        u.id, 
        u.email, 
        u.tenant_id,
        COUNT(DISTINCT r.id) as role_count,
        COUNT(DISTINCT rp.id) as perm_count
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      LEFT JOIN role_permissions rp ON r.id = rp.role_id
      GROUP BY u.id, u.email, u.tenant_id
      ORDER BY u.id
    `);
    console.log('Summary:');
    allUsersResult.rows.forEach(u => {
      console.log(`  - ${u.email.padEnd(30)} | Tenant: ${String(u.tenant_id || 'System').padEnd(8)} | Roles: ${u.role_count} | Perms: ${u.perm_count}`);
    });

    console.log('\n\n4️⃣ Checking Tenant 1 users (from old seed.sql):');
    const tenant1Users = await db.query(`
      SELECT u.id, u.email, u.tenant_id, r.name as role_name
      FROM users u
      LEFT JOIN user_roles ur ON u.id = ur.user_id
      LEFT JOIN roles r ON ur.role_id = r.id
      WHERE u.tenant_id = 1
      ORDER BY u.id
    `);
    console.log(`Found ${tenant1Users.rows.length} users in Tenant 1:`);
    tenant1Users.rows.forEach(u => {
      console.log(`  - ID ${u.id}: ${u.email} (Role: ${u.role_name || 'NONE'})`);
    });

    console.log('\n');
    await db.end();
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

checkUsersWithoutPermissions();
