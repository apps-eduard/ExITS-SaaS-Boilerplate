'use strict';

const path = require('path');
const Module = require('module');

// Allow legacy seed modules to resolve dependencies bundled with the NestJS API.
const additionalNodePaths = [
  path.join(__dirname, '../../../node_modules'),
  path.join(__dirname, '../../../../node_modules'),
];

const existingNodePath = process.env.NODE_PATH
  ? process.env.NODE_PATH.split(path.delimiter)
  : [];

const mergedNodePaths = [...existingNodePath];

for (const candidate of additionalNodePaths) {
  if (candidate && !mergedNodePaths.includes(candidate)) {
    mergedNodePaths.push(candidate);
  }
}

  if (mergedNodePaths.length !== existingNodePath.length) {
  process.env.NODE_PATH = mergedNodePaths.join(path.delimiter);
  Module._initPaths();
}

// Map legacy column names to the renamed columns introduced by the consolidated schema.
const legacyColumnRename = {
  employee_product_access: {
    product_type: 'platform_type',
  },
};

async function normalizeTenantAdminEmails(knexInstance) {
  const desiredMappings = [
    { tenantSubdomain: 'acme', desiredEmail: 'admin@acme.com' },
    { tenantSubdomain: 'techstart', desiredEmail: 'admin@techstart.com' },
  ];

  for (const mapping of desiredMappings) {
    const tenant = await knexInstance('tenants')
      .select('id')
      .where({ subdomain: mapping.tenantSubdomain })
      .first();

    if (!tenant) {
      continue;
    }

    const alreadyUpdated = await knexInstance('users')
      .where({ tenant_id: tenant.id, email: mapping.desiredEmail })
      .first();

    if (alreadyUpdated) {
      continue;
    }

    const placeholderAdmin = await knexInstance('users')
      .where({ tenant_id: tenant.id })
      .andWhere('email', 'like', 'admin-%@example.com')
      .orderBy('id')
      .first();

    if (!placeholderAdmin) {
      console.info(`Tenant admin placeholder not found for tenant '${mapping.tenantSubdomain}'.`);
      continue;
    }

    await knexInstance('users')
      .where({ id: placeholderAdmin.id })
      .update({
        email: mapping.desiredEmail,
        updated_at: knexInstance.fn.now(),
      });

    console.info(`Tenant admin email normalized for '${mapping.tenantSubdomain}' -> ${mapping.desiredEmail}`);
  }
}

async function ensureTenantTestUsers(knexInstance) {
  const tenantUsers = [
    { subdomain: 'acme', email: 'tenant.admin@acme.com', firstName: 'ACME', lastName: 'Admin' },
    { subdomain: 'techstart', email: 'tenant.admin@techstart.com', firstName: 'TechStart', lastName: 'Admin' },
  ];

  for (const userTemplate of tenantUsers) {
    const tenant = await knexInstance('tenants')
      .select('id')
      .where({ subdomain: userTemplate.subdomain })
      .first();

    if (!tenant) {
      continue;
    }

    const existingUser = await knexInstance('users')
      .where({ tenant_id: tenant.id, email: userTemplate.email })
      .first();

    const canonicalEmail = `admin@${userTemplate.subdomain}.com`;
    const aliasEmail = userTemplate.subdomain === 'acme' ? 'admin-1@example.com' : 'admin-2@example.com';

    const canonicalUser = await knexInstance('users')
      .where({ tenant_id: tenant.id, email: canonicalEmail })
      .first();

    const aliasUser = await knexInstance('users')
      .where({ tenant_id: tenant.id, email: aliasEmail })
      .first();

    const fallbackSystemAdmin = await knexInstance('users')
      .where({ email: 'admin@exitsaas.com' })
      .first();

    const resolvedPasswordHash = canonicalUser?.password_hash
      || aliasUser?.password_hash
      || fallbackSystemAdmin?.password_hash;

    if (!resolvedPasswordHash) {
      continue;
    }

    const basePayload = {
      tenant_id: tenant.id,
      email: userTemplate.email,
      password_hash: resolvedPasswordHash,
      first_name: userTemplate.firstName,
      last_name: userTemplate.lastName,
      status: 'active',
      email_verified: true,
      updated_at: knexInstance.fn.now(),
    };

    let userId = existingUser?.id;

    const upsertResult = await knexInstance('users')
      .insert(basePayload)
      .onConflict(['tenant_id', 'email'])
      .merge(basePayload)
      .returning(['id']);

    if (Array.isArray(upsertResult) && upsertResult.length > 0) {
      userId = upsertResult[0].id;
    }

    if (!userId) {
      const fetchedUser = await knexInstance('users')
        .where({ email: userTemplate.email })
        .first();
      userId = fetchedUser?.id;
    }

    if (!userId) {
      continue;
    }

    const tenantAdminRole = await knexInstance('roles')
      .select('id')
      .where({ tenant_id: tenant.id, name: 'Tenant Admin' })
      .first();

    if (tenantAdminRole) {
      const existingAssignment = await knexInstance('user_roles')
        .where({ user_id: userId, role_id: tenantAdminRole.id })
        .first();

      if (!existingAssignment) {
        await knexInstance('user_roles').insert({
          user_id: userId,
          role_id: tenantAdminRole.id,
        });
      }
    }

    if (!existingUser) {
      console.info(`Platform test user created: ${userTemplate.email}`);
    }
  }
}

async function ensureLegacyTenantAdminAliases(knexInstance) {
  const aliasMappings = [
    { canonicalEmail: 'admin@acme.com', aliasEmail: 'admin-1@example.com' },
    { canonicalEmail: 'admin@techstart.com', aliasEmail: 'admin-2@example.com' },
  ];

  for (const mapping of aliasMappings) {
    const canonicalUser = await knexInstance('users')
      .select('id', 'tenant_id', 'password_hash', 'first_name', 'last_name')
      .where({ email: mapping.canonicalEmail })
      .first();

    if (!canonicalUser || !canonicalUser.tenant_id) {
      continue;
    }

    const aliasUser = await knexInstance('users')
      .where({ email: mapping.aliasEmail })
      .first();

    if (!aliasUser) {
      const [createdAlias] = await knexInstance('users')
        .insert({
          tenant_id: canonicalUser.tenant_id,
          email: mapping.aliasEmail,
          password_hash: canonicalUser.password_hash,
          first_name: canonicalUser.first_name ?? 'Tenant',
          last_name: canonicalUser.last_name ?? 'Admin',
          status: 'active',
          email_verified: true,
        })
        .returning(['id']);

      const tenantAdminRole = await knexInstance('roles')
        .select('id')
        .where({ tenant_id: canonicalUser.tenant_id, name: 'Tenant Admin' })
        .first();

      if (tenantAdminRole) {
        await knexInstance('user_roles').insert({
          user_id: createdAlias.id,
          role_id: tenantAdminRole.id,
        });
      }

      console.info(`Legacy tenant admin alias restored: ${mapping.aliasEmail}`);
    } else if (aliasUser.status !== 'active') {
      await knexInstance('users')
        .where({ id: aliasUser.id })
        .update({ status: 'active', updated_at: knexInstance.fn.now() });
    }
  }
}

function transformLegacyPayload(tableName, payload) {
  const renameRules = legacyColumnRename[tableName];
  if (!renameRules) {
    return payload;
  }

  const applyRename = row => {
    if (!row || typeof row !== 'object') {
      return row;
    }

    const nextRow = { ...row };

    for (const [legacyColumn, columnName] of Object.entries(renameRules)) {
      if (Object.prototype.hasOwnProperty.call(nextRow, legacyColumn)) {
        if (!Object.prototype.hasOwnProperty.call(nextRow, columnName)) {
          nextRow[columnName] = nextRow[legacyColumn];
        }
        delete nextRow[legacyColumn];
      }
    }

    return nextRow;
  };

  if (Array.isArray(payload)) {
    return payload.map(applyRename);
  }

  return applyRename(payload);
}

function createLegacyCompatibleKnex(knexInstance) {
  const knexProxy = new Proxy(knexInstance, {
    apply(target, thisArg, args) {
      const tableName = args[0];
      const builder = Reflect.apply(target, thisArg, args);

      if (!tableName || !legacyColumnRename[tableName]) {
        return builder;
      }

      const originalInsert = builder.insert;
      builder.insert = function patchedInsert(payload, returning) {
        const transformed = transformLegacyPayload(tableName, payload);
        return originalInsert.call(this, transformed, returning);
      };

      return builder;
    },
    get(target, prop, receiver) {
      if (prop === 'batchInsert') {
        return function patchedBatchInsert(tableName, payload, chunkSize) {
          const transformed = transformLegacyPayload(tableName, payload);
          return knexInstance.batchInsert(tableName, transformed, chunkSize);
        };
      }

      const value = Reflect.get(target, prop, receiver);
      return typeof value === 'function' ? value.bind(target) : value;
    },
  });

  return knexProxy;
}

const legacyInitialSeed = require(path.join(__dirname, '../../../../api-legacy-backup/src/seeds/01_initial_data'));
const legacyPlanSeed = require(path.join(__dirname, '../../../../api-legacy-backup/src/seeds/02_subscription_plans_and_products'));
const legacyMoneyLoanSeed = require(path.join(__dirname, '../../../../api-legacy-backup/src/seeds/05_money_loan_seed'));
const legacyCustomerPortalSeed = require(path.join(__dirname, '../../../../api-legacy-backup/src/seeds/06_customer_portal_access'));
const legacyMoneyLoanPermissionSeed = require(path.join(__dirname, '../../../../api-legacy-backup/src/seeds/08_money_loan_permissions'));
const legacyPlanTemplatesSeed = require(path.join(__dirname, '../../../../api-legacy-backup/src/seeds/09_professional_plan_templates'));
const legacySystemActivitySeed = require(path.join(__dirname, '../../../../api-legacy-backup/src/seeds/10_system_activity_logs_permissions'));
const legacyBackupSecuritySeed = require(path.join(__dirname, '../../../../api-legacy-backup/src/seeds/11_backup_security_permissions'));
const legacyPlatformUsersSeed = require(path.join(__dirname, '../../../../api-legacy-backup/src/seeds/13_platform_users'));

function seedExists(tenant) {
  return Boolean(tenant);
}

async function runLegacySeed(seedModule, knex, label) {
  if (!seedModule || typeof seedModule.seed !== 'function') {
    console.info(`Skipping legacy seed '${label}': no seed export found.`);
    return;
  }

  console.info(`Running legacy seed: ${label}`);
  await seedModule.seed(knex);
}

exports.seed = async function seed(knex) {
  const legacyKnex = createLegacyCompatibleKnex(knex);

  const existingTenant = await knex('tenants').first();
  if (seedExists(existingTenant)) {
    console.info('Initial seed skipped: tenants already exist.');
    return;
  }

  console.info('Seeding baseline data set (tenants, users, permissions, plans, and money loan fixtures)...');

  await runLegacySeed(legacyInitialSeed, legacyKnex, '01_initial_data (core tenants/modules/users)');
  await runLegacySeed(legacyPlanSeed, legacyKnex, '02_subscription_plans_and_products');
  await runLegacySeed(legacyMoneyLoanSeed, legacyKnex, '05_money_loan_seed');
  await runLegacySeed(legacyCustomerPortalSeed, legacyKnex, '06_customer_portal_access');
  await runLegacySeed(legacyMoneyLoanPermissionSeed, legacyKnex, '08_money_loan_permissions');
  await runLegacySeed(legacyPlanTemplatesSeed, legacyKnex, '09_professional_plan_templates');
  await runLegacySeed(legacySystemActivitySeed, legacyKnex, '10_system_activity_logs_permissions');
  await runLegacySeed(legacyBackupSecuritySeed, legacyKnex, '11_backup_security_permissions');
  await runLegacySeed(legacyPlatformUsersSeed, legacyKnex, '13_platform_users');

  await normalizeTenantAdminEmails(knex);
  await ensureTenantTestUsers(knex);
  await ensureLegacyTenantAdminAliases(knex);

  console.info('Tenant admin login emails set to:');
  console.info(' - admin@acme.com / Admin@123');
  console.info(' - admin@techstart.com / Admin@123');
  console.info('Platform test accounts available:');
  console.info(' - tenant.admin@acme.com / Admin@123');
  console.info(' - tenant.admin@techstart.com / Admin@123');
  console.info('Legacy login aliases kept for compatibility:');
  console.info(' - admin-1@example.com / Admin@123');
  console.info(' - admin-2@example.com / Admin@123');

  console.info('Initial seed completed successfully.');
};
