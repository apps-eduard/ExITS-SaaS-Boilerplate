/**
 * Migration: Rename product_type to platform_type in payment_history table
 * Part of the global Product → Platform terminology refactoring
 */

exports.up = async function(knex) {
  // Check if column exists before renaming
  const hasColumn = await knex.schema.hasColumn('payment_history', 'product_type');
  
  if (hasColumn) {
    // Drop the old index
    await knex.schema.raw('DROP INDEX IF EXISTS idx_payment_history_product_type');
    
    // Rename the column
    await knex.schema.raw('ALTER TABLE payment_history RENAME COLUMN product_type TO platform_type');
    
    // Create new index
    await knex.schema.raw('CREATE INDEX idx_payment_history_platform_type ON payment_history(platform_type)');
    
    console.log('✓ Renamed product_type to platform_type in payment_history table');
  }
};

exports.down = async function(knex) {
  // Check if column exists before renaming back
  const hasColumn = await knex.schema.hasColumn('payment_history', 'platform_type');
  
  if (hasColumn) {
    // Drop the new index
    await knex.schema.raw('DROP INDEX IF EXISTS idx_payment_history_platform_type');
    
    // Rename back
    await knex.schema.raw('ALTER TABLE payment_history RENAME COLUMN platform_type TO product_type');
    
    // Recreate old index
    await knex.schema.raw('CREATE INDEX idx_payment_history_product_type ON payment_history(product_type)');
    
    console.log('✓ Renamed platform_type back to product_type in payment_history table');
  }
};
