/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Check if role_permissions_standard exists
  const hasOldTable = await knex.schema.hasTable('role_permissions_standard');
  const hasNewTable = await knex.schema.hasTable('role_permissions');
  
  if (!hasOldTable && hasNewTable) {
    console.log('⏭️  Table already renamed (role_permissions exists), skipping');
    return;
  }
  
  if (!hasOldTable && !hasNewTable) {
    console.log('⏭️  Neither table exists, skipping rename');
    return;
  }
  
  if (hasOldTable && hasNewTable) {
    console.log('⚠️  Both tables exist, manual intervention needed');
    return;
  }
  
  // Rename role_permissions_standard to role_permissions
  await knex.raw('ALTER TABLE role_permissions_standard RENAME TO role_permissions');
  
  console.log('✅ Renamed role_permissions_standard to role_permissions');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  const hasTable = await knex.schema.hasTable('role_permissions');
  
  if (!hasTable) {
    console.log('⏭️  role_permissions table does not exist, skipping');
    return;
  }
  
  // Rename back
  await knex.raw('ALTER TABLE role_permissions RENAME TO role_permissions_standard');
  
  console.log('✅ Renamed role_permissions back to role_permissions_standard');
};
