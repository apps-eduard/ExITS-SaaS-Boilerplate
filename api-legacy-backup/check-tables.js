const pool = require('./src/config/database');

async function checkTables() {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
      ORDER BY table_name
    `);
    
    console.log('Tables in database:');
    result.rows.forEach(table => console.log('- ' + table.table_name));
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
  }
}

checkTables();