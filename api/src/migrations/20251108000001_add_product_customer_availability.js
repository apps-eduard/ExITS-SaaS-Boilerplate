/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = function(knex) {
  return knex.schema
    .table('money_loan_products', (table) => {
      table.string('availability_type', 20).notNullable().defaultTo('all');
      // 'all' = available to all customers
      // 'selected' = available to selected customers only
    })
    .createTable('money_loan_product_customers', (table) => {
      table.increments('id').primary();
      table.integer('product_id').unsigned().notNullable();
      table.integer('customer_id').unsigned().notNullable();
      table.timestamp('assigned_at').defaultTo(knex.fn.now());
      
      table.foreign('product_id').references('id').inTable('money_loan_products').onDelete('CASCADE');
      table.foreign('customer_id').references('id').inTable('customers').onDelete('CASCADE');
      
      table.unique(['product_id', 'customer_id']);
      table.index('product_id');
      table.index('customer_id');
    });
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = function(knex) {
  return knex.schema
    .dropTableIfExists('money_loan_product_customers')
    .table('money_loan_products', (table) => {
      table.dropColumn('availability_type');
    });
};
