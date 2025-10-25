/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.up = async function(knex) {
  // Add tenant permissions for Billing, Reports, and Recycle Bin
  
  // Tenant Billing Permissions
  await knex('permissions').insert([
    {
      permission_key: 'tenant-billing:read',
      resource: 'tenant-billing',
      action: 'read',
      description: 'View tenant billing information',
      space: 'tenant'
    },
    {
      permission_key: 'tenant-billing:view-subscriptions',
      resource: 'tenant-billing',
      action: 'view-subscriptions',
      description: 'View tenant subscriptions',
      space: 'tenant'
    },
    {
      permission_key: 'tenant-billing:view-invoices',
      resource: 'tenant-billing',
      action: 'view-invoices',
      description: 'View tenant invoices',
      space: 'tenant'
    },
    {
      permission_key: 'tenant-billing:manage-renewals',
      resource: 'tenant-billing',
      action: 'manage-renewals',
      description: 'Manage subscription renewals',
      space: 'tenant'
    },
    {
      permission_key: 'tenant-billing:view-overview',
      resource: 'tenant-billing',
      action: 'view-overview',
      description: 'View billing overview',
      space: 'tenant'
    }
  ]).onConflict('permission_key').ignore();

  // Tenant Reports Permissions
  await knex('permissions').insert([
    {
      permission_key: 'tenant-reports:view',
      resource: 'tenant-reports',
      action: 'view',
      description: 'View tenant reports',
      space: 'tenant'
    },
    {
      permission_key: 'tenant-reports:product-usage',
      resource: 'tenant-reports',
      action: 'product-usage',
      description: 'View product usage reports',
      space: 'tenant'
    },
    {
      permission_key: 'tenant-reports:user-activity',
      resource: 'tenant-reports',
      action: 'user-activity',
      description: 'View user activity reports',
      space: 'tenant'
    },
    {
      permission_key: 'tenant-reports:billing-summary',
      resource: 'tenant-reports',
      action: 'billing-summary',
      description: 'View billing/payment summary',
      space: 'tenant'
    },
    {
      permission_key: 'tenant-reports:transactions',
      resource: 'tenant-reports',
      action: 'transactions',
      description: 'View transaction history',
      space: 'tenant'
    },
    {
      permission_key: 'tenant-reports:export',
      resource: 'tenant-reports',
      action: 'export',
      description: 'Export tenant reports',
      space: 'tenant'
    }
  ]).onConflict('permission_key').ignore();

  // Tenant Recycle Bin Permissions
  await knex('permissions').insert([
    {
      permission_key: 'tenant-recycle-bin:view',
      resource: 'tenant-recycle-bin',
      action: 'view',
      description: 'View tenant recycle bin',
      space: 'tenant'
    },
    {
      permission_key: 'tenant-recycle-bin:restore',
      resource: 'tenant-recycle-bin',
      action: 'restore',
      description: 'Restore deleted tenant items',
      space: 'tenant'
    },
    {
      permission_key: 'tenant-recycle-bin:view-history',
      resource: 'tenant-recycle-bin',
      action: 'view-history',
      description: 'View recovery history',
      space: 'tenant'
    }
  ]).onConflict('permission_key').ignore();

  // Assign permissions to Super Admin role
  const superAdminRole = await knex('roles')
    .where({ name: 'Super Admin', space: 'system' })
    .first();

  if (superAdminRole) {
    const tenantPermissions = await knex('permissions')
      .whereIn('permission_key', [
        'tenant-billing:read', 'tenant-billing:view-subscriptions', 'tenant-billing:view-invoices',
        'tenant-billing:manage-renewals', 'tenant-billing:view-overview',
        'tenant-reports:view', 'tenant-reports:product-usage', 'tenant-reports:user-activity',
        'tenant-reports:billing-summary', 'tenant-reports:transactions', 'tenant-reports:export',
        'tenant-recycle-bin:view', 'tenant-recycle-bin:restore', 'tenant-recycle-bin:view-history'
      ]);

    const rolePermissions = tenantPermissions.map(perm => ({
      role_id: superAdminRole.id,
      permission_id: perm.id
    }));

    await knex('role_permissions')
      .insert(rolePermissions)
      .onConflict(['role_id', 'permission_id'])
      .ignore();
  }

  // Assign permissions to all Tenant Admin roles
  const tenantAdminRoles = await knex('roles')
    .where({ name: 'Tenant Admin', space: 'tenant' });

  if (tenantAdminRoles.length > 0) {
    const tenantPermissions = await knex('permissions')
      .whereIn('permission_key', [
        'tenant-billing:read', 'tenant-billing:view-subscriptions', 'tenant-billing:view-invoices',
        'tenant-billing:manage-renewals', 'tenant-billing:view-overview',
        'tenant-reports:view', 'tenant-reports:product-usage', 'tenant-reports:user-activity',
        'tenant-reports:billing-summary', 'tenant-reports:transactions', 'tenant-reports:export',
        'tenant-recycle-bin:view', 'tenant-recycle-bin:restore', 'tenant-recycle-bin:view-history'
      ]);

    for (const role of tenantAdminRoles) {
      const rolePermissions = tenantPermissions.map(perm => ({
        role_id: role.id,
        permission_id: perm.id
      }));

      await knex('role_permissions')
        .insert(rolePermissions)
        .onConflict(['role_id', 'permission_id'])
        .ignore();
    }
  }
};

/**
 * @param { import("knex").Knex } knex
 * @returns { Promise<void> }
 */
exports.down = async function(knex) {
  // Remove role permissions first (due to foreign key constraints)
  const tenantPermissions = await knex('permissions')
    .whereIn('permission_key', [
      'tenant-billing:read', 'tenant-billing:view-subscriptions', 'tenant-billing:view-invoices',
      'tenant-billing:manage-renewals', 'tenant-billing:view-overview',
      'tenant-reports:view', 'tenant-reports:product-usage', 'tenant-reports:user-activity',
      'tenant-reports:billing-summary', 'tenant-reports:transactions', 'tenant-reports:export',
      'tenant-recycle-bin:view', 'tenant-recycle-bin:restore', 'tenant-recycle-bin:view-history'
    ]);

  const permissionIds = tenantPermissions.map(p => p.id);

  await knex('role_permissions')
    .whereIn('permission_id', permissionIds)
    .del();

  // Remove the permissions
  await knex('permissions')
    .whereIn('permission_key', [
      'tenant-billing:read', 'tenant-billing:view-subscriptions', 'tenant-billing:view-invoices',
      'tenant-billing:manage-renewals', 'tenant-billing:view-overview',
      'tenant-reports:view', 'tenant-reports:product-usage', 'tenant-reports:user-activity',
      'tenant-reports:billing-summary', 'tenant-reports:transactions', 'tenant-reports:export',
      'tenant-recycle-bin:view', 'tenant-recycle-bin:restore', 'tenant-recycle-bin:view-history'
    ])
    .del();
};
