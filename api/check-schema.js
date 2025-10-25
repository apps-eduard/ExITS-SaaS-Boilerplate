const pool = require('./src/config/database');

async function checkSchema() {
  try {
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'tenant_subscriptions' 
      ORDER BY ordinal_position
    `);
    
    console.log('tenant_subscriptions columns:');
    console.table(result.rows);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkSchema();
