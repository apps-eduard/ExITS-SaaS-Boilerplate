const pool = require('./src/config/database');

async function testRolePermissions() {
    try {
        console.log('=== TESTING ROLE PERMISSIONS ISSUE ===\n');
        
        // 1. Get Super Admin role
        const roleResult = await pool.query("SELECT * FROM roles WHERE name = 'Super Admin' LIMIT 1");
        if (roleResult.rows.length === 0) {
            console.log('❌ Super Admin role not found');
            return;
        }
        
        const superAdminRole = roleResult.rows[0];
        console.log(`1. Super Admin Role:`, superAdminRole);
        
        // 2. Count permissions assigned to Super Admin
        const permCountResult = await pool.query(
            'SELECT COUNT(*) as count FROM role_permissions_standard WHERE role_id = $1',
            [superAdminRole.id]
        );
        console.log(`\n2. Permissions assigned to Super Admin: ${permCountResult.rows[0].count}`);
        
        // 3. Get sample permissions assigned to Super Admin
        const samplePermsResult = await pool.query(`
            SELECT p.permission_key, p.resource, p.action, p.space
            FROM role_permissions_standard rps
            JOIN permissions p ON rps.permission_id = p.id
            WHERE rps.role_id = $1
            ORDER BY p.resource, p.action
            LIMIT 10
        `, [superAdminRole.id]);
        
        console.log(`\n3. Sample permissions (first 10):`);
        samplePermsResult.rows.forEach((perm, i) => {
            console.log(`   ${i+1}. ${perm.permission_key} (${perm.space})`);
        });
        
        // 4. Test what the API endpoint returns (simulate the API call)
        console.log(`\n4. Testing API response format...`);
        
        const apiQuery = `
            SELECT 
              p.id,
              p.permission_key,
              p.resource,
              p.action,
              p.description,
              p.space
            FROM role_permissions_standard rps
            JOIN permissions p ON rps.permission_id = p.id
            WHERE rps.role_id = $1
            ORDER BY p.resource, p.action
        `;
        
        const apiResult = await pool.query(apiQuery, [superAdminRole.id]);
        
        // Transform to match API format
        const permissions = apiResult.rows.map(row => ({
            id: row.id,
            permissionKey: row.permission_key,
            resource: row.resource,
            action: row.action,
            description: row.description,
            space: row.space
        }));
        
        console.log(`   API would return ${permissions.length} permissions`);
        console.log(`   Sample API response (first 3):`);
        permissions.slice(0, 3).forEach((perm, i) => {
            console.log(`     ${i+1}. ${JSON.stringify(perm)}`);
        });
        
        // 5. Check for specific permissions that might be missing
        console.log(`\n5. Checking for specific system permissions...`);
        const systemPermissionsCheck = await pool.query(`
            SELECT COUNT(*) as count 
            FROM role_permissions_standard rps
            JOIN permissions p ON rps.permission_id = p.id
            WHERE rps.role_id = $1 AND p.space = 'system'
        `, [superAdminRole.id]);
        
        const tenantPermissionsCheck = await pool.query(`
            SELECT COUNT(*) as count 
            FROM role_permissions_standard rps
            JOIN permissions p ON rps.permission_id = p.id
            WHERE rps.role_id = $1 AND p.space = 'tenant'
        `, [superAdminRole.id]);
        
        console.log(`   System permissions: ${systemPermissionsCheck.rows[0].count}`);
        console.log(`   Tenant permissions: ${tenantPermissionsCheck.rows[0].count}`);
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

testRolePermissions();