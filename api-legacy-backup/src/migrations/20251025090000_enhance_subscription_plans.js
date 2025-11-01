/**
 * Migration: Enhance Subscription Plans
 * Adds trial_days, is_featured, custom_pricing, sort_order columns
 * Creates plan_features table for fine-grained feature control
 * Adds unique constraint to plan name
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  console.log('🔧 Enhancing subscription_plans table...');

  // 1. Check which columns exist
  const hasTrialDays = await knex.schema.hasColumn('subscription_plans', 'trial_days');
  const hasIsFeatured = await knex.schema.hasColumn('subscription_plans', 'is_featured');
  const hasCustomPricing = await knex.schema.hasColumn('subscription_plans', 'custom_pricing');
  const hasSortOrder = await knex.schema.hasColumn('subscription_plans', 'sort_order');

  // 2. Add new columns only if they don't exist
  if (!hasTrialDays || !hasIsFeatured || !hasCustomPricing || !hasSortOrder) {
    await knex.schema.table('subscription_plans', function(table) {
      if (!hasTrialDays) {
        table.integer('trial_days').defaultTo(0).comment('Number of free trial days (0 = no trial)');
      }
      if (!hasIsFeatured) {
        table.boolean('is_featured').defaultTo(false).comment('Highlight as recommended/most popular');
      }
      if (!hasCustomPricing) {
        table.boolean('custom_pricing').defaultTo(false).comment('Contact sales for pricing (Enterprise plans)');
      }
      if (!hasSortOrder) {
        table.integer('sort_order').defaultTo(0).comment('Display order (lower numbers appear first)');
      }
    });
    console.log('✅ Added missing columns to subscription_plans');
  } else {
    console.log('✓ All columns already exist in subscription_plans');
  }

  // 2. Add unique constraint to name if it doesn't exist
  const hasNameConstraint = await knex.raw(`
    SELECT constraint_name 
    FROM information_schema.table_constraints 
    WHERE table_name = 'subscription_plans' 
    AND constraint_type = 'UNIQUE'
    AND constraint_name = 'subscription_plans_name_unique'
  `);

  if (hasNameConstraint.rows.length === 0) {
    await knex.schema.table('subscription_plans', function(table) {
      table.unique('name', 'subscription_plans_name_unique');
    });
    console.log('✅ Added unique constraint to name column');
  } else {
    console.log('✓ Unique constraint already exists on name column');
  }

  // 3. Create indexes for performance
  const indexExists = await knex.raw(`
    SELECT indexname 
    FROM pg_indexes 
    WHERE tablename = 'subscription_plans' 
    AND indexname = 'idx_subscription_plans_featured'
  `);

  if (indexExists.rows.length === 0) {
    await knex.raw(`
      CREATE INDEX idx_subscription_plans_featured 
      ON subscription_plans(is_featured) 
      WHERE is_featured = true
    `);
    console.log('✅ Created index for featured plans');
  }

  const sortIndexExists = await knex.raw(`
    SELECT indexname 
    FROM pg_indexes 
    WHERE tablename = 'subscription_plans' 
    AND indexname = 'idx_subscription_plans_sort'
  `);

  if (sortIndexExists.rows.length === 0) {
    await knex.raw('CREATE INDEX idx_subscription_plans_sort ON subscription_plans(sort_order)');
    console.log('✅ Created index for sort_order');
  }

  // 4. Create plan_features table if it doesn't exist
  const tableExists = await knex.schema.hasTable('plan_features');
  
  if (!tableExists) {
    await knex.schema.createTable('plan_features', function(table) {
      table.bigIncrements('id').primary();
      table.bigInteger('plan_id').notNullable()
        .references('id').inTable('subscription_plans')
        .onDelete('CASCADE')
        .comment('Reference to subscription plan');
      table.string('feature_key', 100).notNullable().comment('Unique identifier (e.g., api_access, users_max)');
      table.string('feature_name', 255).notNullable().comment('Human-readable feature name');
      table.text('feature_value').comment('Feature configuration value (boolean, number, or string)');
      table.boolean('enabled').defaultTo(true).comment('Whether feature is enabled');
      table.timestamps(true, true);
      
      // Unique constraint: one feature key per plan
      table.unique(['plan_id', 'feature_key'], 'plan_features_plan_feature_unique');
    });
    
    // Create indexes
    await knex.raw('CREATE INDEX idx_plan_features_plan ON plan_features(plan_id)');
    await knex.raw('CREATE INDEX idx_plan_features_key ON plan_features(feature_key)');
    
    console.log('✅ Created plan_features table with indexes');
  } else {
    console.log('✓ plan_features table already exists');
  }

  // 5. Update existing plans with default values
  console.log('🔄 Updating existing plans with defaults...');
  
  await knex('subscription_plans')
    .where('name', 'ilike', '%trial%')
    .update({
      trial_days: 14,
      is_featured: false,
      custom_pricing: false,
      sort_order: 1
    });

  await knex('subscription_plans')
    .where('name', 'ilike', '%starter%')
    .update({
      trial_days: 0,
      is_featured: false,
      custom_pricing: false,
      sort_order: 2
    });

  await knex('subscription_plans')
    .where('name', 'ilike', '%pro%')
    .whereNull('product_type')
    .update({
      trial_days: 0,
      is_featured: true, // Professional is featured
      custom_pricing: false,
      sort_order: 3
    });

  await knex('subscription_plans')
    .where('name', 'ilike', '%enterprise%')
    .update({
      trial_days: 0,
      is_featured: false,
      custom_pricing: true, // Contact sales
      sort_order: 4
    });

  // Update product-specific plans
  await knex('subscription_plans')
    .whereNotNull('product_type')
    .where('name', 'like', '%Starter%')
    .update({ sort_order: 10 });

  await knex('subscription_plans')
    .whereNotNull('product_type')
    .where('name', 'like', '%Pro%')
    .update({ sort_order: 11, is_featured: true });

  await knex('subscription_plans')
    .whereNotNull('product_type')
    .where('name', 'like', '%Enterprise%')
    .update({ sort_order: 12, custom_pricing: true });

  console.log('✅ Updated existing plans with defaults');

  console.log('\n✨ Subscription schema enhancement completed successfully!');
  console.log('   - Added trial_days, is_featured, custom_pricing, sort_order columns');
  console.log('   - Created plan_features table for feature gating');
  console.log('   - Added indexes for performance');
  console.log('   - Updated existing plans with defaults');
};

/**
 * Rollback migration
 * 
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  console.log('⏮️  Rolling back subscription plan enhancements...');

  // Drop plan_features table
  await knex.schema.dropTableIfExists('plan_features');
  console.log('✅ Dropped plan_features table');

  // Drop indexes
  await knex.raw('DROP INDEX IF EXISTS idx_subscription_plans_featured');
  await knex.raw('DROP INDEX IF EXISTS idx_subscription_plans_sort');
  console.log('✅ Dropped indexes');

  // Remove unique constraint
  await knex.schema.table('subscription_plans', function(table) {
    table.dropUnique('name', 'subscription_plans_name_unique');
  });
  console.log('✅ Removed unique constraint');

  // Drop columns
  await knex.schema.table('subscription_plans', function(table) {
    table.dropColumn('trial_days');
    table.dropColumn('is_featured');
    table.dropColumn('custom_pricing');
    table.dropColumn('sort_order');
  });
  console.log('✅ Dropped new columns');

  console.log('✨ Rollback completed');
};
