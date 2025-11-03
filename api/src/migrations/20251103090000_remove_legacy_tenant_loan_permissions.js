/**
 * Remove deprecated tenant-level loan/payment permissions.
 */
exports.up = async function up(knex) {
  const legacyKeys = [
    'loans:read',
    'loans:create',
    'loans:update',
    'loans:delete',
    'loans:approve',
    'loans:disburse',
    'payments:read',
    'payments:create',
    'payments:update',
    'payments:delete',
  ];

  await knex.transaction(async trx => {
    const permissions = await trx('permissions')
      .select('id', 'permission_key')
      .whereIn('permission_key', legacyKeys);

    if (permissions.length === 0) {
      return;
    }

    const ids = permissions.map(p => p.id);

    await trx('role_permissions')
      .whereIn('permission_id', ids)
      .delete();

    await trx('permissions')
      .whereIn('id', ids)
      .delete();
  });
};

exports.down = async function down(knex) {
  const legacyPermissions = [
    { permission_key: 'loans:read', resource: 'loans', action: 'read', description: 'View loans', space: 'tenant' },
    { permission_key: 'loans:create', resource: 'loans', action: 'create', description: 'Create new loans', space: 'tenant' },
    { permission_key: 'loans:update', resource: 'loans', action: 'update', description: 'Update loan details', space: 'tenant' },
    { permission_key: 'loans:delete', resource: 'loans', action: 'delete', description: 'Delete loans', space: 'tenant' },
    { permission_key: 'loans:approve', resource: 'loans', action: 'approve', description: 'Approve or reject loans', space: 'tenant' },
    { permission_key: 'loans:disburse', resource: 'loans', action: 'disburse', description: 'Disburse approved loans', space: 'tenant' },
    { permission_key: 'payments:read', resource: 'payments', action: 'read', description: 'View payment information', space: 'tenant' },
    { permission_key: 'payments:create', resource: 'payments', action: 'create', description: 'Process payments', space: 'tenant' },
    { permission_key: 'payments:update', resource: 'payments', action: 'update', description: 'Update payment details', space: 'tenant' },
    { permission_key: 'payments:delete', resource: 'payments', action: 'delete', description: 'Delete payments', space: 'tenant' },
  ];

  await knex.transaction(async trx => {
    for (const perm of legacyPermissions) {
      const existing = await trx('permissions')
        .where('permission_key', perm.permission_key)
        .first();

      if (existing) {
        continue;
      }

      const [id] = await trx('permissions')
        .insert({
          ...perm,
          created_at: trx.fn.now(),
          updated_at: trx.fn.now(),
        })
        .returning('id');

      if (!id) {
        continue;
      }
    }
  });
};