const pool = require('./src/config/database');

async function checkPaymentHistoryColumns() {
  try {
    const result = await pool.query(
      `SELECT column_name, data_type 
       FROM information_schema.columns 
       WHERE table_name = 'payment_history' 
       AND column_name IN ('product_type', 'platform_type')
       ORDER BY column_name`
    );
    
    console.log('\n📊 Payment History Table Columns:');
    if (result.rows.length === 0) {
      console.log('   ❌ Neither product_type nor platform_type column found!');
    } else {
      result.rows.forEach(col => {
        console.log(`   ✓ ${col.column_name} (${col.data_type})`);
      });
    }
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkPaymentHistoryColumns();
