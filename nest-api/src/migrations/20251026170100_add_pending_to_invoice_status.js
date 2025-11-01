/**
 * Add 'pending' to invoice_status enum
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Add 'pending' to invoice_status enum
  await knex.raw(`
    ALTER TYPE invoice_status ADD VALUE IF NOT EXISTS 'pending'
  `);
  console.log('✓ Added \'pending\' to invoice_status enum');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Cannot remove enum values in PostgreSQL without recreating the enum
  // This is intentionally left empty - rollback not supported
  console.log('⚠ Cannot remove enum values from invoice_status - rollback not supported');
};
