const pool = require('./src/config/database');

async function verifyPermissions() {
    try {
        console.log('=== PERMISSION VERIFICATION ===\n');
        
        // Get total permissions
        const totalPerms = await pool.query('SELECT COUNT(*) as count FROM permissions');
        const totalCount = parseInt(totalPerms.rows[0].count);
        console.log(`Total permissions in database: ${totalCount}`);
        
        // Get role permission counts
        const roleCounts = await pool.query(`
            SELECT r.name, COUNT(rp.permission_id) as permission_count
            FROM roles r
            LEFT JOIN role_permissions_standard rp ON r.id = rp.role_id
            WHERE r.name IN ('Super Admin', 'Admin', 'Tenant Admin')
            GROUP BY r.id, r.name
            ORDER BY r.id
        `);
            
        console.log('\nRole Permission Counts:');
        roleCounts.rows.forEach(role => {
            const count = parseInt(role.permission_count);
            let expectedCount, status;
            
            if (role.name === 'Super Admin') {
                expectedCount = totalCount; // Should have all permissions
                status = count === expectedCount ? '✅' : '❌';
            } else if (role.name === 'Tenant Admin') {
                expectedCount = 67; // Should have all tenant permissions
                status = count === expectedCount ? '✅' : '❌';
            } else {
                expectedCount = 'Unknown';
                status = '❓';
            }
            
            console.log(`  ${status} ${role.name}: ${count} permissions ${expectedCount !== 'Unknown' ? `(expected: ${expectedCount})` : ''}`);
        });
        
        console.log('\n🎉 Permission verification complete!');
        
    } catch (error) {
        console.error('Error:', error);
    } finally {
        await pool.end();
    }
}

verifyPermissions();