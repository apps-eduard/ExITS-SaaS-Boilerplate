/**
 * Migration: Remove embedded address fields from customers table
 * These fields have been moved to the unified addresses table
 */

exports.up = async function(knex) {
  // Check if customers table exists
  const hasTable = await knex.schema.hasTable('customers');
  if (!hasTable) {
    console.log('⏭️  Customers table does not exist, skipping migration');
    return;
  }

  // Check which columns exist and only drop those that do
  const columnsToCheck = ['address', 'barangay', 'city', 'province', 'postal_code', 'country'];
  const columnsToRemove = [];

  for (const column of columnsToCheck) {
    const hasColumn = await knex.schema.hasColumn('customers', column);
    if (hasColumn) {
      columnsToRemove.push(column);
    }
  }

  if (columnsToRemove.length === 0) {
    console.log('⏭️  No address columns to remove from customers table');
    return;
  }

  console.log(`🗑️  Removing columns from customers: ${columnsToRemove.join(', ')}`);
  
  return knex.schema.table('customers', (table) => {
    columnsToRemove.forEach(column => {
      table.dropColumn(column);
    });
  });
};

exports.down = function(knex) {
  return knex.schema.table('customers', (table) => {
    // Restore address fields if rollback is needed
    table.text('address');
    table.string('barangay', 100);
    table.string('city', 100);
    table.string('province', 100);
    table.string('postal_code', 20);
    table.string('country', 100).defaultTo('Philippines');
  });
};
