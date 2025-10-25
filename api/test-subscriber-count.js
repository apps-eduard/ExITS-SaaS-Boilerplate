const pool = require('./src/config/database');

async function testSubscriberCount() {
  try {
    console.log('=== Testing Subscriber Count Query ===\n');
    
    const result = await pool.query(`
      SELECT sp.id, sp.name, sp.product_type,
             (
               SELECT COUNT(*) 
               FROM tenant_subscriptions ts 
               WHERE ts.plan_id = sp.id AND ts.status = 'active'
             ) + (
               SELECT COUNT(*) 
               FROM product_subscriptions ps 
               WHERE ps.subscription_plan_id = sp.id AND ps.status::text = 'active'
             ) as subscriber_count
      FROM subscription_plans sp
      WHERE sp.status = 'active'
      ORDER BY sp.product_type, sp.name
    `);

    console.log('Plan Subscriber Counts:\n');
    
    const byType = result.rows.reduce((acc, plan) => {
      if (!acc[plan.product_type]) acc[plan.product_type] = [];
      acc[plan.product_type].push(plan);
      return acc;
    }, {});

    Object.entries(byType).forEach(([type, plans]) => {
      console.log(`${type.toUpperCase()}:`);
      plans.forEach(plan => {
        console.log(`  - ${plan.name}: ${plan.subscriber_count} active subscriber(s)`);
      });
      console.log('');
    });

    console.log('=== Verification ===\n');
    
    const tenantSubs = await pool.query(`
      SELECT sp.name, COUNT(*) as count
      FROM tenant_subscriptions ts
      JOIN subscription_plans sp ON ts.plan_id = sp.id
      WHERE ts.status = 'active'
      GROUP BY sp.name
    `);
    
    console.log('Active tenant_subscriptions:');
    tenantSubs.rows.forEach(row => {
      console.log(`  - ${row.name}: ${row.count}`);
    });

    const productSubs = await pool.query(`
      SELECT sp.name, COUNT(*) as count
      FROM product_subscriptions ps
      JOIN subscription_plans sp ON ps.subscription_plan_id = sp.id
      WHERE ps.status::text = 'active'
      GROUP BY sp.name
    `);
    
    console.log('\nActive product_subscriptions:');
    productSubs.rows.forEach(row => {
      console.log(`  - ${row.name}: ${row.count}`);
    });

    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    await pool.end();
    process.exit(1);
  }
}

testSubscriberCount();
