import type { Knex } from "knex";


export async function up(knex: Knex): Promise<void> {
  // Add contact information fields to employee_profiles table only if they don't exist
  const hasWorkPhone = await knex.schema.hasColumn('employee_profiles', 'work_phone');
  
  if (!hasWorkPhone) {
    await knex.schema.alterTable('employee_profiles', (table) => {
      table.string('work_phone', 50);
      table.string('work_email', 255);
      table.string('phone_extension', 20);
      table.string('emergency_contact_name', 255);
      table.string('emergency_contact_phone', 50);
    });
  }
}


export async function down(knex: Knex): Promise<void> {
  // Remove contact information fields from employee_profiles table
  await knex.schema.alterTable('employee_profiles', (table) => {
    table.dropColumn('work_phone');
    table.dropColumn('work_email');
    table.dropColumn('phone_extension');
    table.dropColumn('emergency_contact_name');
    table.dropColumn('emergency_contact_phone');
  });
}

