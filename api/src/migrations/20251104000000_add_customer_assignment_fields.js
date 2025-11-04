/**
 * Migration: Add employee assignment fields to customers table
 * Created: 2025-11-04
 * 
 * Adds fields to support customer-to-employee assignment for collection management
 */

exports.up = async function (knex) {
  const exists = await knex.schema.hasTable('customers');
  if (!exists) {
    console.warn('⚠️  customers table not found, skipping assignment fields migration');
    return;
  }

  const hasAssignedEmployee = await knex.schema.hasColumn('customers', 'assigned_employee_id');
  if (!hasAssignedEmployee) {
    await knex.schema.table('customers', (table) => {
      table.integer('assigned_employee_id')
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
        .comment('Employee (user) assigned to this customer for collections');
      
      table.integer('assigned_by')
        .references('id')
        .inTable('users')
        .onDelete('SET NULL')
        .comment('User who made the assignment');
      
      table.timestamp('assigned_at')
        .comment('When the assignment was made');
      
      table.text('assignment_notes')
        .comment('Optional notes about the assignment');
      
      table.index(['tenant_id', 'assigned_employee_id']);
      table.index(['assigned_at']);
    });
    
    console.log('✅ Added customer assignment fields to customers table');
  } else {
    console.log('ℹ️  Customer assignment fields already exist');
  }
};

exports.down = async function (knex) {
  const exists = await knex.schema.hasTable('customers');
  if (!exists) {
    return;
  }

  await knex.schema.table('customers', (table) => {
    table.dropColumn('assigned_employee_id');
    table.dropColumn('assigned_by');
    table.dropColumn('assigned_at');
    table.dropColumn('assignment_notes');
  });
  
  console.log('✅ Removed customer assignment fields from customers table');
};
