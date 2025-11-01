/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Add product_type column to subscription_plans
  await knex.schema.table('subscription_plans', function (table) {
    table.specificType('product_type', 'product_type').nullable();
    table.index('product_type');
  });

  console.log('✓ Added product_type column to subscription_plans table');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  await knex.schema.table('subscription_plans', function (table) {
    table.dropColumn('product_type');
  });
};
