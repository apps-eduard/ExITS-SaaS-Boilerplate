const knex = require('knex')(require('./knexfile').development);

async function checkFeatures() {
  try {
    const plans = await knex('subscription_plans')
      .select('id', 'name', 'features')
      .orderBy('id');
    
    console.log('=== Subscription Plans Features ===\n');
    
    plans.forEach(plan => {
      console.log(`\n📦 ${plan.name}`);
      console.log(`Features:`, JSON.stringify(plan.features, null, 2));
    });
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error);
    process.exit(1);
  }
}

checkFeatures();
