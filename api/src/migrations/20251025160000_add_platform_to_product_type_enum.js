/**
 * Add 'platform' value to product_type enum
 * This allows subscription plans to be assigned to all products
 */

exports.up = async function(knex) {
  // Add 'platform' to the product_type enum
  // Note: We need to commit the transaction before using the new enum value
  await knex.raw(`
    ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'platform';
  `);
  
  console.log('✅ Added "platform" value to product_type enum');
  
  // Commit the transaction by ending it and starting a new one
  // This is necessary because PostgreSQL requires enum changes to be committed
  // before the new value can be used
  await knex.raw('COMMIT');
  await knex.raw('BEGIN');
  
  // Update existing null values to 'platform'
  const result = await knex('subscription_plans')
    .whereNull('product_type')
    .update({ product_type: 'platform' });
  
  console.log(`✅ Updated ${result} existing null product_type values to "platform"`);
};

exports.down = async function(knex) {
  // Update platform values back to null before removing enum value
  await knex('subscription_plans')
    .where('product_type', 'platform')
    .update({ product_type: null });
  
  console.log('⏪ Reverted "platform" product_type values to null');
  
  // Note: PostgreSQL doesn't support removing enum values directly
  // You would need to recreate the enum type to remove a value
  console.log('⚠️  Note: PostgreSQL does not support removing enum values. Manual intervention required if rollback is needed.');
};
