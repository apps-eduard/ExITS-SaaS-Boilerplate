/**
 * Migration: Add System Space Permissions
 * 
 * Purpose: Create proper separation between system-level and tenant-level permissions
 * 
 * SYSTEM SPACE: Platform administration (manage all tenants, users, platform settings)
 * TENANT SPACE: Tenant-scoped operations (manage within tenant boundary only)
 * 
 * This migration adds:
 * - users:* (system) - Manage ALL platform users
 * - roles:* (system) - Manage system roles
 * - dashboard:view (system) - System admin dashboard
 * - audit:* (system) - Platform-wide audit logs
 * - settings:* (system) - Platform configuration
 */

exports.up = async function(knex) {
  // Check which permissions already exist in tenant space
  // We need to UPDATE their space to 'system' rather than insert new ones
  
  const permissionsToMoveToSystem = [
    'users:read', 'users:create', 'users:update', 'users:delete', 'users:export',
    'roles:read', 'roles:create', 'roles:update', 'roles:delete',
    'dashboard:view',
    'audit:read', 'audit:export',
    'settings:read', 'settings:update'
  ];
  
  // Update existing tenant-space permissions to system-space
  const updateResult = await knex('permissions')
    .whereIn('permission_key', permissionsToMoveToSystem)
    .where('space', 'tenant')
    .update({
      space: 'system',
      description: knex.raw("CASE permission_key " +
        "WHEN 'users:read' THEN 'View all users across all tenants' " +
        "WHEN 'users:create' THEN 'Create new users in any tenant' " +
        "WHEN 'users:update' THEN 'Update any user across platform' " +
        "WHEN 'users:delete' THEN 'Delete any user from platform' " +
        "WHEN 'users:export' THEN 'Export all platform user data' " +
        "WHEN 'roles:read' THEN 'View all system roles' " +
        "WHEN 'roles:create' THEN 'Create new system roles' " +
        "WHEN 'roles:update' THEN 'Modify system role permissions' " +
        "WHEN 'roles:delete' THEN 'Remove system roles' " +
        "WHEN 'dashboard:view' THEN 'Access system admin dashboard with platform metrics' " +
        "WHEN 'audit:read' THEN 'View all platform activity logs' " +
        "WHEN 'audit:export' THEN 'Export platform audit data' " +
        "WHEN 'settings:read' THEN 'View platform configuration' " +
        "WHEN 'settings:update' THEN 'Modify platform settings' " +
        "ELSE description END"),
      updated_at: knex.fn.now()
    });

  console.log(`✅ Moved ${updateResult} permissions from tenant to system space`);
  
  // Get Super Admin role ID
  const superAdminRole = await knex('roles')
    .where({ name: 'Super Admin', space: 'system' })
    .first();

  if (superAdminRole) {
    // Get the permission IDs
    const permissions = await knex('permissions')
      .whereIn('permission_key', permissionsToMoveToSystem)
      .where('space', 'system')
      .select('id');

    // Check which permissions Super Admin doesn't already have
    const existingRolePerms = await knex('role_permissions')
      .where('role_id', superAdminRole.id)
      .whereIn('permission_id', permissions.map(p => p.id))
      .select('permission_id');

    const existingPermIds = new Set(existingRolePerms.map(rp => rp.permission_id));
    const newPermissions = permissions.filter(p => !existingPermIds.has(p.id));

    if (newPermissions.length > 0) {
      const rolePermissions = newPermissions.map(perm => ({
        role_id: superAdminRole.id,
        permission_id: perm.id,
        created_at: knex.fn.now(),
        updated_at: knex.fn.now()
      }));

      await knex('role_permissions').insert(rolePermissions);
      console.log(`✅ Granted ${rolePermissions.length} new permissions to Super Admin`);
    } else {
      console.log('✅ Super Admin already has all system permissions');
    }
  } else {
    console.log('⚠️  Super Admin role not found - permissions moved but not assigned');
  }
};

exports.down = async function(knex) {
  // Move the permissions back to tenant space
  const permissionsToRevert = [
    'users:read', 'users:create', 'users:update', 'users:delete', 'users:export',
    'roles:read', 'roles:create', 'roles:update', 'roles:delete',
    'dashboard:view',
    'audit:read', 'audit:export',
    'settings:read', 'settings:update'
  ];
  
  await knex('permissions')
    .whereIn('permission_key', permissionsToRevert)
    .where('space', 'system')
    .update({
      space: 'tenant',
      updated_at: knex.fn.now()
    });
  
  console.log('✅ Reverted permissions back to tenant space');
};
