const pool = require('./src/config/database');

async function fixTenantAdminPermissions() {
    try {
        console.log('=== FIXING TENANT ADMIN PERMISSIONS ===\n');
        
        // Get all tenant admin roles
        const tenantRoles = await pool.query("SELECT * FROM roles WHERE name = 'Tenant Admin' AND space = 'tenant'");
        console.log(`Found ${tenantRoles.rows.length} Tenant Admin roles`);
        
        // Get all tenant permissions
        const tenantPermissions = await pool.query("SELECT * FROM permissions WHERE space = 'tenant'");
        console.log(`Found ${tenantPermissions.rows.length} tenant permissions`);
        
        for (const role of tenantRoles.rows) {
            console.log(`\nFixing permissions for Tenant Admin role ID: ${role.id}`);
            
            // Get current permissions for this role
            const currentPerms = await pool.query(
                'SELECT permission_id FROM role_permissions WHERE role_id = $1',
                [role.id]
            );
            const currentPermIds = new Set(currentPerms.rows.map(p => p.permission_id));
            console.log(`  Current permissions: ${currentPermIds.size}`);
            
            // Find missing permissions
            const missingPerms = tenantPermissions.rows.filter(p => !currentPermIds.has(p.id));
            console.log(`  Missing permissions: ${missingPerms.length}`);
            
            // Add missing permissions
            for (const perm of missingPerms) {
                await pool.query(
                    'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
                    [role.id, perm.id]
                );
                console.log(`    ✅ Added: ${perm.resource}:${perm.action}`);
            }
            
            // Verify final count
            const finalCount = await pool.query(
                'SELECT COUNT(*) as count FROM role_permissions WHERE role_id = $1',
                [role.id]
            );
            console.log(`  ✅ Final permission count: ${finalCount.rows[0].count}`);
        }
        
        console.log('\n🎉 Tenant Admin permissions fixed!');
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

fixTenantAdminPermissions();
