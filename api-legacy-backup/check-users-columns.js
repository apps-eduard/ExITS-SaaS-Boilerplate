const pool = require('./src/config/database');

async function checkColumns() {
  try {
    const result = await pool.query(`
      SELECT column_name 
      FROM information_schema.columns 
      WHERE table_name = 'users' 
      ORDER BY ordinal_position
    `);
    
    console.log('\n📋 Users table columns:');
    result.rows.forEach(row => {
      console.log('  -', row.column_name);
    });
    console.log('\n');
  } catch (error) {
    console.error('Error:', error);
  } finally {
    process.exit();
  }
}

checkColumns();
