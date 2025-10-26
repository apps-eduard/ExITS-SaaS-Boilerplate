/**
 * System Activity Logs - Permission Seeds
 * Permissions for system logs and audit logs features
 * 
 * Permission Naming Convention: {resource}:{action}
 * Access Levels: view < export < manage < admin
 */

const systemActivityLogsPermissions = [
  // ============================================
  // SYSTEM LOGS (4 permissions)
  // ============================================
  {
    permission_key: 'system-logs:view',
    resource: 'system-logs',
    action: 'view',
    description: 'View system logs and error tracking',
    space: 'system',
  },
  {
    permission_key: 'system-logs:export',
    resource: 'system-logs',
    action: 'export',
    description: 'Export system logs to CSV/PDF',
    space: 'system',
  },
  {
    permission_key: 'system-logs:delete',
    resource: 'system-logs',
    action: 'delete',
    description: 'Delete system logs',
    space: 'system',
  },
  {
    permission_key: 'system-logs:manage',
    resource: 'system-logs',
    action: 'manage',
    description: 'Full management of system logs including cleanup and retention policies',
    space: 'system',
  },

  // ============================================
  // AUDIT LOGS (4 permissions)
  // ============================================
  {
    permission_key: 'audit-logs:view',
    resource: 'audit-logs',
    action: 'view',
    description: 'View audit trail and user activity logs',
    space: 'system',
  },
  {
    permission_key: 'audit-logs:export',
    resource: 'audit-logs',
    action: 'export',
    description: 'Export audit logs to CSV/PDF',
    space: 'system',
  },
  {
    permission_key: 'audit-logs:delete',
    resource: 'audit-logs',
    action: 'delete',
    description: 'Delete audit logs',
    space: 'system',
  },
  {
    permission_key: 'audit-logs:manage',
    resource: 'audit-logs',
    action: 'manage',
    description: 'Full management of audit logs including compliance reports',
    space: 'system',
  },

  // ============================================
  // ACTIVITY DASHBOARD (2 permissions)
  // ============================================
  {
    permission_key: 'activity-dashboard:view',
    resource: 'activity-dashboard',
    action: 'view',
    description: 'View system activity dashboard with statistics',
    space: 'system',
  },
  {
    permission_key: 'activity-dashboard:manage',
    resource: 'activity-dashboard',
    action: 'manage',
    description: 'Manage dashboard settings and time range filters',
    space: 'system',
  },
];

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.seed = async function(knex) {
  // eslint-disable-next-line no-console
  console.log('🌱 Seeding System Activity Logs permissions...\n');

  // Insert or update permissions
  let addedCount = 0;
  let updatedCount = 0;
  let existsCount = 0;

  for (const perm of systemActivityLogsPermissions) {
    const exists = await knex('permissions')
      .where({ permission_key: perm.permission_key })
      .first();

    if (!exists) {
      await knex('permissions').insert(perm);
      // eslint-disable-next-line no-console
      console.log(`✓ Added: ${perm.permission_key}`);
      addedCount++;
    } else if (exists.space !== perm.space) {
      // Update space if different
      await knex('permissions')
        .where({ permission_key: perm.permission_key })
        .update({ space: perm.space });
      // eslint-disable-next-line no-console
      console.log(`↻ Updated space to 'system': ${perm.permission_key}`);
      updatedCount++;
    } else {
      // eslint-disable-next-line no-console
      console.log(`○ Exists: ${perm.permission_key}`);
      existsCount++;
    }
  }

  // eslint-disable-next-line no-console
  console.log('\n✅ System Activity Logs permissions seeded!');
  // eslint-disable-next-line no-console
  console.log(`   Total: ${systemActivityLogsPermissions.length} permissions`);
  // eslint-disable-next-line no-console
  console.log(`   Added: ${addedCount} new`);
  // eslint-disable-next-line no-console
  console.log(`   Updated: ${updatedCount} space changes`);
  // eslint-disable-next-line no-console
  console.log(`   Existed: ${existsCount} already in database`);
  
  // Summary by category
  // eslint-disable-next-line no-console
  console.log('\n📊 Permissions by category:');
  // eslint-disable-next-line no-console
  console.log('  • System Logs: 4 permissions (view, export, delete, manage)');
  // eslint-disable-next-line no-console
  console.log('  • Audit Logs: 4 permissions (view, export, delete, manage)');
  // eslint-disable-next-line no-console
  console.log('  • Activity Dashboard: 2 permissions (view, manage)');

  // Assign all permissions to Super Admin role
  // eslint-disable-next-line no-console
  console.log('\n👑 Assigning permissions to Super Admin role...\n');

  const superAdminRole = await knex('roles')
    .where({ name: 'Super Admin', space: 'system' })
    .whereNull('tenant_id')
    .first();

  if (superAdminRole) {
    let assignedCount = 0;

    for (const perm of systemActivityLogsPermissions) {
      const permission = await knex('permissions')
        .where({ permission_key: perm.permission_key })
        .first();

      if (permission) {
        const rolePermExists = await knex('role_permissions')
          .where({
            role_id: superAdminRole.id,
            permission_id: permission.id,
          })
          .first();

        if (!rolePermExists) {
          await knex('role_permissions').insert({
            role_id: superAdminRole.id,
            permission_id: permission.id,
          });
          // eslint-disable-next-line no-console
          console.log(`✓ Assigned to Super Admin: ${perm.permission_key}`);
          assignedCount++;
        } else {
          // eslint-disable-next-line no-console
          console.log(`○ Already assigned: ${perm.permission_key}`);
        }
      }
    }

    // eslint-disable-next-line no-console
    console.log('\n✅ Super Admin role updated!');
    // eslint-disable-next-line no-console
    console.log(`   Assigned: ${assignedCount} new permissions`);
  } else {
    // eslint-disable-next-line no-console
    console.log('⚠️  Super Admin role not found. Permissions created but not assigned.');
  }

  // eslint-disable-next-line no-console
  console.log('\n🎉 System Activity Logs seeding complete!\n');
};

// Export for reference
module.exports.systemActivityLogsPermissions = systemActivityLogsPermissions;
