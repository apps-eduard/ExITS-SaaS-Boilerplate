const pool = require('./src/config/database');

async function checkPermissionsTable() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'permissions' 
      ORDER BY ordinal_position
    `);
    
    console.log('Permissions table columns:');
    result.rows.forEach(col => console.log('- ' + col.column_name + ' (' + col.data_type + ')'));
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkPermissionsTable();