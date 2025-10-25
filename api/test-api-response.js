const pool = require('./src/config/database');const fetch = require('node-fetch');



async function testApiQuery() {async function testUserAPI() {

  try {  try {

    const result = await pool.query(    console.log('🧪 Testing User API Response...\n');

      `SELECT sp.id, sp.name, sp.description, sp.price, sp.billing_cycle, sp.features,     

              sp.max_users, sp.max_storage_gb, sp.status, sp.product_type,     // Test getting a user by ID

              sp.trial_days, sp.is_featured, sp.custom_pricing,    const response = await fetch('http://localhost:3000/api/users/2');

              sp.created_at, sp.updated_at,    const data = await response.json();

              COUNT(ts.id) FILTER (WHERE ts.status = 'active') as subscriber_count    

       FROM subscription_plans sp    console.log('📥 Raw API Response:');

       LEFT JOIN tenant_subscriptions ts ON sp.id = ts.plan_id    console.log(JSON.stringify(data, null, 2));

       WHERE sp.status = 'active'    

       GROUP BY sp.id    if (data.data) {

       ORDER BY sp.price ASC`      console.log('\n📊 User Data Fields:');

    );      const user = data.data;

      console.log(`  - id: ${user.id}`);

    console.log('Number of plans:', result.rows.length);      console.log(`  - email: ${user.email}`);

    console.log('\nFirst plan data:');      console.log(`  - firstName: ${user.firstName || 'MISSING'}`);

    console.log(JSON.stringify(result.rows[0], null, 2));      console.log(`  - lastName: ${user.lastName || 'MISSING'}`);

          console.log(`  - first_name: ${user.first_name || 'MISSING'}`);

    console.log('\nSubscriber counts for all plans:');      console.log(`  - last_name: ${user.last_name || 'MISSING'}`);

    result.rows.forEach(plan => {      console.log(`  - roles: ${user.roles ? user.roles.length + ' roles' : 'MISSING'}`);

      console.log(`Plan ${plan.id} (${plan.name}): subscriber_count = ${plan.subscriber_count} (type: ${typeof plan.subscriber_count})`);      

    });      console.log('\n✅ Field Check:');

          console.log(`  - Has camelCase: ${!!(user.firstName && user.lastName)}`);

    process.exit(0);      console.log(`  - Has snake_case: ${!!(user.first_name && user.last_name)}`);

  } catch (error) {      console.log(`  - Has roles: ${!!(user.roles && user.roles.length > 0)}`);

    console.error('Error:', error);    }

    process.exit(1);    

  }  } catch (error) {

}    console.error('❌ Error:', error.message);

  }

testApiQuery();}


testUserAPI();