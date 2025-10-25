const pool = require('./src/config/database');

async function checkActiveSubs() {
  try {
    const result = await pool.query(
      `SELECT tenant_id, product_type, status, subscription_plan_id 
       FROM product_subscriptions 
       WHERE status = 'active'`
    );
    
    console.log('Active Product Subscriptions:');
    console.table(result.rows);
    console.log('Total active:', result.rows.length);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkActiveSubs();
