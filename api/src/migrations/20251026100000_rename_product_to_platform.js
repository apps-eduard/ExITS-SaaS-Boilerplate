/**
 * Rename product_subscriptions to platform_subscriptions
 * and update product_type enum to platform_type
 * 
 * This migration reflects the correct terminology:
 * - "Platform" = the service/module offered (Money Loan, BNPL, Pawnshop)
 * - Not "Product" which implies physical/digital goods
 */

exports.up = async function(knex) {
  console.log('🔄 Starting Product → Platform terminology migration...');

  // Step 1: Rename product_subscriptions table to platform_subscriptions
  await knex.schema.renameTable('product_subscriptions', 'platform_subscriptions');
  console.log('✅ Renamed table: product_subscriptions → platform_subscriptions');

  // Step 2: Rename product_type enum to platform_type
  await knex.raw(`ALTER TYPE product_type RENAME TO platform_type`);
  console.log('✅ Renamed enum: product_type → platform_type');

  // Step 3: Rename product_subscription_status enum to platform_subscription_status
  await knex.raw(`ALTER TYPE product_subscription_status RENAME TO platform_subscription_status`);
  console.log('✅ Renamed enum: product_subscription_status → platform_subscription_status');

  // Step 4: Rename columns in platform_subscriptions table
  await knex.schema.alterTable('platform_subscriptions', function(table) {
    table.renameColumn('product_type', 'platform_type');
  });
  console.log('✅ Renamed column: product_type → platform_type in platform_subscriptions');

  // Step 5: Rename product_type column in subscription_plans table
  await knex.schema.alterTable('subscription_plans', function(table) {
    table.renameColumn('product_type', 'platform_type');
  });
  console.log('✅ Renamed column: product_type → platform_type in subscription_plans');

  // Step 6: Update unique constraint
  await knex.raw(`
    ALTER TABLE platform_subscriptions 
    DROP CONSTRAINT IF EXISTS product_subscriptions_tenant_id_product_type_unique;
  `);
  
  await knex.raw(`
    ALTER TABLE platform_subscriptions 
    ADD CONSTRAINT platform_subscriptions_tenant_id_platform_type_unique 
    UNIQUE (tenant_id, platform_type);
  `);
  console.log('✅ Updated unique constraint with new naming');

  // Step 7: Update check constraints if any exist
  await knex.raw(`
    DO $$
    BEGIN
      IF EXISTS (
        SELECT 1 FROM information_schema.table_constraints 
        WHERE constraint_name LIKE '%product%'
      ) THEN
        -- Update any product-related constraints
        ALTER TABLE platform_subscriptions 
        DROP CONSTRAINT IF EXISTS product_subscriptions_pkey CASCADE;
        
        ALTER TABLE platform_subscriptions 
        ADD CONSTRAINT platform_subscriptions_pkey PRIMARY KEY (id);
      END IF;
    END $$;
  `);
  console.log('✅ Updated constraints');

  console.log('✨ Product → Platform migration completed successfully!');
};

exports.down = async function(knex) {
  console.log('🔄 Rolling back Platform → Product terminology migration...');

  // Reverse Step 5
  await knex.schema.alterTable('subscription_plans', function(table) {
    table.renameColumn('platform_type', 'product_type');
  });

  // Reverse Step 4
  await knex.schema.alterTable('platform_subscriptions', function(table) {
    table.renameColumn('platform_type', 'product_type');
  });

  // Reverse Step 3
  await knex.raw(`ALTER TYPE platform_subscription_status RENAME TO product_subscription_status`);

  // Reverse Step 2
  await knex.raw(`ALTER TYPE platform_type RENAME TO product_type`);

  // Reverse Step 1
  await knex.schema.renameTable('platform_subscriptions', 'product_subscriptions');

  // Reverse Step 6
  await knex.raw(`
    ALTER TABLE product_subscriptions 
    DROP CONSTRAINT IF EXISTS platform_subscriptions_tenant_id_platform_type_unique;
  `);
  
  await knex.raw(`
    ALTER TABLE product_subscriptions 
    ADD CONSTRAINT product_subscriptions_tenant_id_product_type_unique 
    UNIQUE (tenant_id, product_type);
  `);

  console.log('✅ Rolled back to Product terminology');
};
