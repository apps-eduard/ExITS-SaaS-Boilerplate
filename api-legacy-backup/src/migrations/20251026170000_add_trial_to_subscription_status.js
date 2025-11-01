/**
 * Add 'trial' to subscription_status enum
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Add 'trial' to subscription_status enum
  await knex.raw(`
    ALTER TYPE subscription_status ADD VALUE IF NOT EXISTS 'trial'
  `);
  console.log('✓ Added \'trial\' to subscription_status enum');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Cannot remove enum values in PostgreSQL without recreating the enum
  // This is intentionally left empty - rollback not supported
  console.log('⚠ Cannot remove enum values from subscription_status - rollback not supported');
};
