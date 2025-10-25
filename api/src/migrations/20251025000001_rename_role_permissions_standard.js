/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Rename role_permissions_standard to role_permissions
  await knex.raw('ALTER TABLE role_permissions_standard RENAME TO role_permissions');
  
  console.log('✓ Renamed role_permissions_standard to role_permissions');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Rename back
  await knex.raw('ALTER TABLE role_permissions RENAME TO role_permissions_standard');
  
  console.log('✓ Renamed role_permissions back to role_permissions_standard');
};
