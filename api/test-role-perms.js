const pool = require('./src/config/database');

async function test() {
  try {
    const result = await pool.query(`
      SELECT 
        r.id, 
        r.name, 
        COUNT(DISTINCT rps.permission_id) as permission_count,
        json_agg(
          DISTINCT jsonb_build_object(
            'permissionKey', p.permission_key,
            'resource', p.resource,
            'action', p.action
          )
        ) FILTER (WHERE rps.permission_id IS NOT NULL) as permissions
      FROM roles r
      LEFT JOIN role_permissions rps ON r.id = rps.role_id
      LEFT JOIN permissions p ON rps.permission_id = p.id
      WHERE r.id = 4
      GROUP BY r.id, r.name
    `);
    
    console.log('Permission count:', result.rows[0].permission_count);
    console.log('Permissions array length:', result.rows[0].permissions ? result.rows[0].permissions.length : 0);
    console.log('\nFirst 5 permissions:', JSON.stringify(result.rows[0].permissions.slice(0, 5), null, 2));
    console.log('\nAll permissions:', JSON.stringify(result.rows[0].permissions, null, 2));
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

test();
