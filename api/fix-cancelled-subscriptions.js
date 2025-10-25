const pool = require('./src/config/database');

async function fixCancelledSubscriptions() {
  try {
    console.log('Checking for cancelled subscriptions without cancelled_at timestamp...\n');

    // Find cancelled subscriptions without cancelled_at
    const check = await pool.query(`
      SELECT id, tenant_id, plan_id, status, cancelled_at, cancellation_reason
      FROM tenant_subscriptions
      WHERE status = 'cancelled' AND cancelled_at IS NULL
    `);

    console.log(`Found ${check.rows.length} cancelled subscriptions without timestamps:\n`);
    console.log(JSON.stringify(check.rows, null, 2));

    if (check.rows.length > 0) {
      console.log('\nFixing cancelled subscriptions...\n');

      // Update cancelled subscriptions to have cancelled_at timestamp
      const result = await pool.query(`
        UPDATE tenant_subscriptions
        SET cancelled_at = updated_at,
            cancellation_reason = COALESCE(cancellation_reason, 'Legacy cancellation')
        WHERE status = 'cancelled' AND cancelled_at IS NULL
        RETURNING id, tenant_id, status, cancelled_at, cancellation_reason
      `);

      console.log(`Fixed ${result.rows.length} subscriptions:\n`);
      console.log(JSON.stringify(result.rows, null, 2));
    }

    // Show all current subscriptions
    console.log('\n--- Current Subscription Status ---\n');
    const all = await pool.query(`
      SELECT 
        ts.id,
        t.name as tenant_name,
        sp.name as plan_name,
        ts.status,
        ts.started_at,
        ts.cancelled_at,
        ts.cancellation_reason
      FROM tenant_subscriptions ts
      JOIN tenants t ON ts.tenant_id = t.id
      JOIN subscription_plans sp ON ts.plan_id = sp.id
      ORDER BY ts.created_at DESC
    `);

    console.log('Total subscriptions:', all.rows.length);
    console.log('Active:', all.rows.filter(r => r.status === 'active').length);
    console.log('Cancelled:', all.rows.filter(r => r.status === 'cancelled').length);
    console.log('\nAll subscriptions:');
    console.log(JSON.stringify(all.rows, null, 2));

    await pool.end();
    console.log('\n✅ Done!');
  } catch (err) {
    console.error('Error:', err.message);
    await pool.end();
    process.exit(1);
  }
}

fixCancelledSubscriptions();
