/**
 * Migration: Add Permission Space Constraints
 * 
 * CRITICAL SECURITY: Prevent tenant roles from EVER getting system permissions
 * 
 * This migration adds database-level CHECK constraints to enforce:
 * 1. System roles can ONLY have system-space permissions
 * 2. Tenant roles can ONLY have tenant-space permissions
 * 
 * This prevents accidental security breaches where tenant users
 * might gain access to system-level features.
 */

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  console.log('🔒 Adding permission space constraints for security...\n');

  // STEP 1: First, clean up any existing violations (just in case)
  console.log('1. Cleaning up any existing space violations...');
  
  // Remove system permissions from tenant roles
  const removedFromTenantRoles = await knex.raw(`
    DELETE FROM role_permissions
    WHERE role_id IN (SELECT id FROM roles WHERE space = 'tenant')
      AND permission_id IN (SELECT id FROM permissions WHERE space = 'system')
    RETURNING *
  `);
  console.log(`   ✓ Removed ${removedFromTenantRoles.rowCount} system permissions from tenant roles`);
  
  // Remove tenant permissions from system roles
  const removedFromSystemRoles = await knex.raw(`
    DELETE FROM role_permissions
    WHERE role_id IN (SELECT id FROM roles WHERE space = 'system')
      AND permission_id IN (SELECT id FROM permissions WHERE space = 'tenant')
    RETURNING *
  `);
  console.log(`   ✓ Removed ${removedFromSystemRoles.rowCount} tenant permissions from system roles`);

  // STEP 2: Create a trigger function to validate space matching
  console.log('\n2. Creating trigger function to validate permission space...');
  
  await knex.raw(`
    CREATE OR REPLACE FUNCTION validate_permission_space()
    RETURNS TRIGGER AS $$
    DECLARE
      role_space VARCHAR(20);
      perm_space VARCHAR(20);
    BEGIN
      -- Get the role's space
      SELECT space INTO role_space
      FROM roles
      WHERE id = NEW.role_id;

      -- Get the permission's space
      SELECT space INTO perm_space
      FROM permissions
      WHERE id = NEW.permission_id;

      -- Validate that spaces match
      IF role_space != perm_space THEN
        RAISE EXCEPTION 
          '🚫 SECURITY VIOLATION: Cannot assign %-space permission (ID: %) to %-space role (ID: %). Permission space must match role space.',
          perm_space, NEW.permission_id, role_space, NEW.role_id;
      END IF;

      RETURN NEW;
    END;
    $$ LANGUAGE plpgsql;
  `);
  console.log('   ✓ Created function: validate_permission_space()');

  // STEP 3: Create trigger to enforce the validation
  console.log('\n3. Creating trigger on role_permissions table...');
  
  await knex.raw(`
    DROP TRIGGER IF EXISTS trigger_validate_permission_space ON role_permissions;
    
    CREATE TRIGGER trigger_validate_permission_space
    BEFORE INSERT OR UPDATE ON role_permissions
    FOR EACH ROW
    EXECUTE FUNCTION validate_permission_space();
  `);
  console.log('   ✓ Created trigger: trigger_validate_permission_space');

  // STEP 4: Create an index to improve trigger performance
  console.log('\n4. Creating performance indexes...');
  await knex.schema.table('role_permissions', function(table) {
    table.index(['role_id'], 'idx_role_permissions_role_id');
    table.index(['permission_id'], 'idx_role_permissions_permission_id');
  });
  console.log('   ✓ Created indexes for better trigger performance');

  console.log('\n✅ Permission space constraints added successfully!');
  console.log('\n🛡️  Security Enforcement (DATABASE-LEVEL):');
  console.log('   • System roles → ONLY system permissions (enforced by trigger)');
  console.log('   • Tenant roles → ONLY tenant permissions (enforced by trigger)');
  console.log('   • Attempts to violate this will result in a database error');
  console.log('\n🔒 CRITICAL: This is enforced at the DATABASE level - no application');
  console.log('   code can bypass this security constraint!');
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  console.log('🔓 Removing permission space constraints...\n');

  // Remove the trigger
  await knex.raw(`
    DROP TRIGGER IF EXISTS trigger_validate_permission_space ON role_permissions;
  `);
  console.log('   ✓ Removed trigger: trigger_validate_permission_space');

  // Remove the trigger function
  await knex.raw(`
    DROP FUNCTION IF EXISTS validate_permission_space();
  `);
  console.log('   ✓ Removed function: validate_permission_space()');

  // Remove the indexes
  await knex.schema.table('role_permissions', function(table) {
    table.dropIndex(['role_id'], 'idx_role_permissions_role_id');
    table.dropIndex(['permission_id'], 'idx_role_permissions_permission_id');
  });
  console.log('   ✓ Removed indexes');

  console.log('\n✅ Permission space constraints removed');
};
