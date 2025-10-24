const pool = require('./src/config/database');

async function checkUserRoles() {
  try {
    console.log('Checking user roles for admin@exitsaas.com...');
    
    const result = await pool.query(`
      SELECT u.email, r.name as role_name, r.id as role_id
      FROM users u 
      LEFT JOIN user_roles ur ON u.id = ur.user_id 
      LEFT JOIN roles r ON ur.role_id = r.id 
      WHERE u.email = 'admin@exitsaas.com'
    `);
    
    console.log('User roles:', result.rows);
    
    // Also check all users and their roles
    const allUsers = await pool.query(`
      SELECT u.id, u.email, r.name as role_name
      FROM users u 
      LEFT JOIN user_roles ur ON u.id = ur.user_id 
      LEFT JOIN roles r ON ur.role_id = r.id 
      ORDER BY u.id
    `);
    
    console.log('\nAll users and roles:');
    allUsers.rows.forEach(user => {
      console.log(`- ${user.email} (ID: ${user.id}) -> ${user.role_name || 'No role'}`);
    });
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkUserRoles();