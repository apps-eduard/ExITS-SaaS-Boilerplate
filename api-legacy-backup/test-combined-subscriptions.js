const pool = require('./src/config/database');

async function testCombinedQuery() {
  try {
    const result = await pool.query(`
      -- Platform subscriptions (tenant_subscriptions)
      SELECT 
        ts.id,
        ts.tenant_id,
        t.name as tenant_name,
        ts.plan_id,
        sp.name as plan_name,
        sp.product_type::text as product_type,
        ts.status::text as status,
        ts.monthly_price,
        ts.started_at,
        ts.expires_at,
        ts.cancelled_at,
        ts.cancellation_reason,
        ts.created_at,
        ts.updated_at
      FROM tenant_subscriptions ts
      JOIN tenants t ON ts.tenant_id = t.id
      JOIN subscription_plans sp ON ts.plan_id = sp.id
      
      UNION ALL
      
      -- Product subscriptions (product_subscriptions: Money Loan, BNPL, Pawnshop)
      SELECT 
        ps.id,
        ps.tenant_id,
        t.name as tenant_name,
        ps.subscription_plan_id as plan_id,
        sp.name as plan_name,
        ps.product_type::text as product_type,
        ps.status::text as status,
        ps.price as monthly_price,
        ps.started_at,
        ps.expires_at,
        NULL as cancelled_at,
        NULL as cancellation_reason,
        ps.created_at,
        ps.updated_at
      FROM product_subscriptions ps
      JOIN tenants t ON ps.tenant_id = t.id
      LEFT JOIN subscription_plans sp ON ps.subscription_plan_id = sp.id
      
      ORDER BY created_at DESC
    `);

    console.log(`\nFound ${result.rows.length} total subscriptions:\n`);
    
    const byType = result.rows.reduce((acc, row) => {
      acc[row.product_type] = (acc[row.product_type] || 0) + 1;
      return acc;
    }, {});
    
    console.log('By Product Type:');
    Object.entries(byType).forEach(([type, count]) => {
      console.log(`  ${type}: ${count}`);
    });
    
    const byStatus = result.rows.reduce((acc, row) => {
      acc[row.status] = (acc[row.status] || 0) + 1;
      return acc;
    }, {});
    
    console.log('\nBy Status:');
    Object.entries(byStatus).forEach(([status, count]) => {
      console.log(`  ${status}: ${count}`);
    });
    
    console.log('\nAll subscriptions:');
    console.log(JSON.stringify(result.rows, null, 2));

    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    await pool.end();
    process.exit(1);
  }
}

testCombinedQuery();
