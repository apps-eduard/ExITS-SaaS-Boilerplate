const pool = require('./src/config/database');

async function cancelTenantSubscriptions() {
  try {
    // Cancel ALL active tenant subscriptions
    const result = await pool.query(
      `UPDATE tenant_subscriptions 
       SET status = 'cancelled' 
       WHERE status = 'active'
       RETURNING id`
    );
    
    console.log(`✅ Cancelled ${result.rows.length} active tenant subscriptions`);
    
    const allSubs = await pool.query(
      'SELECT id, tenant_id, plan_id, status FROM tenant_subscriptions ORDER BY id'
    );
    
    console.log('\nAll Tenant Subscriptions:');
    console.table(allSubs.rows);
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

cancelTenantSubscriptions();
