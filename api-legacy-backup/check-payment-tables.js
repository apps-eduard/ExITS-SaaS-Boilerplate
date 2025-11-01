const pool = require('./src/config/database');

async function checkTables() {
  try {
    const result = await pool.query(`
      SELECT table_name 
      FROM information_schema.tables 
      WHERE table_schema = 'public' 
        AND table_name LIKE '%payment%'
      ORDER BY table_name
    `);
    
    console.log('Payment-related tables:');
    result.rows.forEach(row => console.log('  -', row.table_name));
    
    // Check payment_methods table structure
    if (result.rows.some(r => r.table_name === 'payment_methods')) {
      const cols = await pool.query(`
        SELECT column_name, data_type 
        FROM information_schema.columns 
        WHERE table_name = 'payment_methods'
        ORDER BY ordinal_position
      `);
      
      console.log('\npayment_methods columns:');
      cols.rows.forEach(col => console.log(`  - ${col.column_name}: ${col.data_type}`));
      
      const data = await pool.query('SELECT * FROM payment_methods LIMIT 3');
      console.log('\nSample data:', data.rows);
    }
    
    pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    pool.end();
  }
}

checkTables();
