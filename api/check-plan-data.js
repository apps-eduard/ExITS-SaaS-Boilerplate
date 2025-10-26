const pool = require('./src/config/database');

async function checkPlanData() {
  try {
    console.log('=== Checking Platform Subscriptions ===\n');
    
    const platformSubs = await pool.query(`
      SELECT 
        ps.id,
        ps.tenant_id,
        t.name as tenant_name,
        ps.subscription_plan_id,
        sp.id as actual_plan_id,
        sp.name as plan_name,
        ps.platform_type
      FROM platform_subscriptions ps
      JOIN tenants t ON ps.tenant_id = t.id
      LEFT JOIN subscription_plans sp ON ps.subscription_plan_id = sp.id
      ORDER BY ps.created_at DESC
    `);

    console.log(`Found ${platformSubs.rows.length} platform subscriptions:`);
    platformSubs.rows.forEach(row => {
      console.log(`  - ${row.tenant_name}: ${row.plan_name || 'NO PLAN NAME'} (plan_id: ${row.subscription_plan_id || 'NULL'}, platform: ${row.platform_type})`);
    });

    console.log('\n=== Checking All Subscription Plans ===\n');
    
    const allPlans = await pool.query(`
      SELECT id, name, platform_type
      FROM subscription_plans
      ORDER BY platform_type, name
    `);

    console.log(`Found ${allPlans.rows.length} total plans:`);
    const byType = allPlans.rows.reduce((acc, plan) => {
      if (!acc[plan.platform_type]) acc[plan.platform_type] = [];
      acc[plan.platform_type].push(plan);
      return acc;
    }, {});

    Object.entries(byType).forEach(([type, plans]) => {
      console.log(`\n${type.toUpperCase()}:`);
      plans.forEach(plan => {
        console.log(`  - ID ${plan.id}: ${plan.name}`);
      });
    });

    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    await pool.end();
    process.exit(1);
  }
}

checkPlanData();
