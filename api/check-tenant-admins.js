const pool = require('./src/config/database');

async function checkTenantAdmins() {
    try {
        console.log('=== CHECKING TENANT ADMIN ROLES ===\n');
        
        // Get all tenant admin roles
        const roles = await pool.query("SELECT * FROM roles WHERE name LIKE '%Tenant%' ORDER BY id");
        
        console.log('Tenant Admin roles:');
        for (const role of roles.rows) {
            console.log(`  ID: ${role.id}, Name: "${role.name}", Space: ${role.space}, Status: ${role.status}`);
            
            // Get permission count for this role
            const permCount = await pool.query(
                'SELECT COUNT(*) as count FROM role_permissions_standard WHERE role_id = $1',
                [role.id]
            );
            console.log(`    Current permissions: ${permCount.rows[0].count}`);
        }
        
        // Check if we need to fix Tenant Admin permissions
        const tenantPermissions = await pool.query("SELECT COUNT(*) as count FROM permissions WHERE space = 'tenant'");
        console.log(`\nTotal tenant permissions available: ${tenantPermissions.rows[0].count}`);
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

checkTenantAdmins();