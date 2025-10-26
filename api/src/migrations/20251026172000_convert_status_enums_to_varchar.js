/**
 * Change status columns from ENUM to VARCHAR for flexibility
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  console.log('🔄 Converting enum columns to VARCHAR for flexibility...');
  
  // Convert platform_subscriptions.status from enum to varchar
  await knex.raw(`
    ALTER TABLE platform_subscriptions 
    ALTER COLUMN status TYPE VARCHAR(50)
  `);
  console.log('✓ Converted platform_subscriptions.status to VARCHAR(50)');
  
  // Convert tenant_subscriptions.status from enum to varchar
  await knex.raw(`
    ALTER TABLE tenant_subscriptions 
    ALTER COLUMN status TYPE VARCHAR(50)
  `);
  console.log('✓ Converted tenant_subscriptions.status to VARCHAR(50)');
  
  // Convert invoices.status from enum to varchar
  await knex.raw(`
    ALTER TABLE invoices 
    ALTER COLUMN status TYPE VARCHAR(50)
  `);
  console.log('✓ Converted invoices.status to VARCHAR(50)');
  
  // Convert payment_history.status from enum to varchar
  await knex.raw(`
    ALTER TABLE payment_history 
    ALTER COLUMN status TYPE VARCHAR(50)
  `);
  console.log('✓ Converted payment_history.status to VARCHAR(50)');
  
  console.log('✅ All status columns converted to VARCHAR for maximum flexibility');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  console.log('⚠ Rollback not implemented - would need to recreate enums with all possible values');
};
