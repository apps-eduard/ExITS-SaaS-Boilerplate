/**
 * Seed: Backup and Security Policy Permissions
 * 
 * This seed adds permissions for:
 * - System Backup management
 * - Security Policy configuration
 * 
 * These permissions are system-space only and assigned to Super Admin role.
 */

exports.seed = async function (knex) {
  console.log('🔐 Seeding Backup and Security Policy permissions...');

  // Define new permissions
  const newPermissions = [
    // System Backup Permissions
    { permission_key: 'backup:view', resource: 'backup', action: 'view', description: 'View backup history and schedules', space: 'system' },
    { permission_key: 'backup:create', resource: 'backup', action: 'create', description: 'Create manual backups', space: 'system' },
    { permission_key: 'backup:delete', resource: 'backup', action: 'delete', description: 'Delete backup files', space: 'system' },
    { permission_key: 'backup:restore', resource: 'backup', action: 'restore', description: 'Restore from backups', space: 'system' },
    
    // Security Policy Permissions
    { permission_key: 'security-policy:view', resource: 'security-policy', action: 'view', description: 'View security policies', space: 'system' },
    { permission_key: 'security-policy:update', resource: 'security-policy', action: 'update', description: 'Update security policies', space: 'system' },
    { permission_key: 'security-policy:manage', resource: 'security-policy', action: 'manage', description: 'Manage IP whitelist/blacklist', space: 'system' },
  ];

  // Insert permissions (ignore duplicates)
  let insertedCount = 0;
  for (const permission of newPermissions) {
    const existing = await knex('permissions')
      .where('permission_key', permission.permission_key)
      .first();

    if (!existing) {
      await knex('permissions').insert(permission);
      insertedCount++;
      console.log(`   ✅ Added permission: ${permission.permission_key}`);
    } else {
      // Update space if different (fix for any incorrect space values)
      if (existing.space !== permission.space) {
        await knex('permissions')
          .where('permission_key', permission.permission_key)
          .update({ space: permission.space });
        console.log(`   🔄 Updated space for: ${permission.permission_key} (${existing.space} → ${permission.space})`);
      } else {
        console.log(`   ⏭️  Skipped (exists): ${permission.permission_key}`);
      }
    }
  }

  console.log(`\n📊 Summary: ${insertedCount} new permissions added, ${newPermissions.length - insertedCount} already existed\n`);

  // Auto-assign these permissions to Super Admin role
  console.log('👑 Assigning permissions to Super Admin role...');

  const superAdminRole = await knex('roles')
    .where({ name: 'Super Admin', space: 'system' })
    .first();

  if (!superAdminRole) {
    console.log('   ⚠️  Super Admin role not found. Skipping auto-assignment.');
    return;
  }

  // Get all backup and security-policy permissions
  const backupSecurityPermissions = await knex('permissions')
    .whereIn('resource', ['backup', 'security-policy'])
    .where('space', 'system')
    .select('id', 'permission_key');

  console.log(`   Found ${backupSecurityPermissions.length} backup/security permissions to assign`);

  // Clear existing role permissions for these resources to avoid duplicates
  await knex('role_permissions')
    .where('role_id', superAdminRole.id)
    .whereIn('permission_id', backupSecurityPermissions.map(p => p.id))
    .delete();

  // Insert role permissions
  const rolePermissions = backupSecurityPermissions.map(permission => ({
    role_id: superAdminRole.id,
    permission_id: permission.id
  }));

  if (rolePermissions.length > 0) {
    await knex('role_permissions').insert(rolePermissions);
    console.log(`   ✅ Assigned ${rolePermissions.length} permissions to Super Admin role`);
    
    // Display assigned permissions
    backupSecurityPermissions.forEach(p => {
      console.log(`      • ${p.permission_key}`);
    });
  }

  console.log('\n✅ Backup and Security Policy permissions seed completed!\n');
};
