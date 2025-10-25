const pool = require('./src/config/database');

async function testQuery() {
  try {
    const result = await pool.query(`
      SELECT 
        ts.id,
        ts.tenant_id,
        t.name as tenant_name,
        ts.plan_id,
        sp.name as plan_name,
        sp.product_type,
        ts.status,
        ts.monthly_price,
        ts.started_at,
        ts.expires_at,
        ts.cancelled_at,
        ts.cancellation_reason
      FROM tenant_subscriptions ts
      JOIN tenants t ON ts.tenant_id = t.id
      JOIN subscription_plans sp ON ts.plan_id = sp.id
      ORDER BY ts.created_at DESC
      LIMIT 10
    `);

    console.log('Found', result.rows.length, 'subscriptions:');
    console.log(JSON.stringify(result.rows, null, 2));
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    await pool.end();
    process.exit(1);
  }
}

testQuery();
