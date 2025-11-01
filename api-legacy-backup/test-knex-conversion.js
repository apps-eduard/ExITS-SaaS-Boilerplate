/**
 * Comprehensive Test Suite for Knex Conversion
 * Tests all converted services to ensure camelCase conversion is working
 */

const knex = require('./src/config/knex');
const AuthService = require('./src/services/AuthService');
const UserService = require('./src/services/UserService');
const RoleService = require('./src/services/RoleService');
const PermissionService = require('./src/services/PermissionService');
const TenantService = require('./src/services/TenantService');
const AuditLogService = require('./src/services/AuditLogService');
const MFAService = require('./src/services/MFAService');
const BillingService = require('./src/services/BillingService');
const ProductSubscriptionService = require('./src/services/ProductSubscriptionService');
const SubscriptionPlanService = require('./src/services/SubscriptionPlanService');
const RBACService = require('./src/services/RBACService');

console.log('🧪 Starting Comprehensive Knex Conversion Test Suite\n');

async function testAllServices() {
  const results = {
    passed: 0,
    failed: 0,
    tests: [],
  };

  const test = async (name, fn) => {
    try {
      console.log(`\n🔍 Testing: ${name}`);
      await fn();
      console.log(`✅ PASSED: ${name}`);
      results.passed++;
      results.tests.push({ name, status: 'PASSED' });
    } catch (error) {
      console.error(`❌ FAILED: ${name}`);
      console.error(`   Error: ${error.message}`);
      results.failed++;
      results.tests.push({ name, status: 'FAILED', error: error.message });
    }
  };

  // Test 1: AuthService - Login
  await test('AuthService.login', async () => {
    const result = await AuthService.login('admin@system.com', 'Admin@123');
    if (!result.user) throw new Error('No user returned');
    if (!result.user.id) throw new Error('User ID missing');
    if (result.user.user_id) throw new Error('Snake case detected: user_id');
    console.log(`   User: ${result.user.email} (ID: ${result.user.id})`);
  });

  // Test 2: UserService - Get user by ID
  await test('UserService.getUserById', async () => {
    const user = await UserService.getUserById(1);
    if (!user) throw new Error('No user found');
    if (user.created_at) throw new Error('Snake case detected: created_at');
    if (!user.createdAt) throw new Error('CamelCase missing: createdAt');
    console.log(`   User: ${user.email}, Created: ${user.createdAt}`);
  });

  // Test 3: RoleService - Get all roles
  await test('RoleService.getRoles', async () => {
    const roles = await RoleService.getRoles();
    if (!roles || roles.length === 0) throw new Error('No roles found');
    if (roles[0].created_at) throw new Error('Snake case detected: created_at');
    if (!roles[0].createdAt) throw new Error('CamelCase missing: createdAt');
    console.log(`   Found ${roles.length} roles, first: ${roles[0].name}`);
  });

  // Test 4: PermissionService - Get all permissions
  await test('PermissionService.getAllPermissions', async () => {
    const permissions = await PermissionService.getAllPermissions();
    if (!permissions || permissions.length === 0) throw new Error('No permissions found');
    if (permissions[0].permission_key) throw new Error('Snake case detected: permission_key');
    if (!permissions[0].permissionKey) throw new Error('CamelCase missing: permissionKey');
    console.log(`   Found ${permissions.length} permissions`);
  });

  // Test 5: TenantService - Get all tenants
  await test('TenantService.getAllTenants', async () => {
    const tenants = await TenantService.getAllTenants();
    if (!tenants || tenants.length === 0) throw new Error('No tenants found');
    if (tenants[0].created_at) throw new Error('Snake case detected: created_at');
    if (!tenants[0].createdAt) throw new Error('CamelCase missing: createdAt');
    console.log(`   Found ${tenants.length} tenants, first: ${tenants[0].name}`);
  });

  // Test 6: AuditLogService - Get audit logs
  await test('AuditLogService.getAuditLogs', async () => {
    const logs = await AuditLogService.getAuditLogs({});
    if (!logs || !logs.data) throw new Error('No audit logs found');
    if (logs.data.length > 0) {
      if (logs.data[0].created_at) throw new Error('Snake case detected: created_at');
      if (!logs.data[0].createdAt) throw new Error('CamelCase missing: createdAt');
    }
    console.log(`   Found ${logs.data.length} audit logs`);
  });

  // Test 7: MFAService - Check MFA status
  await test('MFAService.isMFAEnabled', async () => {
    const enabled = await MFAService.isMFAEnabled(1);
    console.log(`   MFA enabled for user 1: ${enabled}`);
  });

  // Test 8: BillingService - Get plans
  await test('BillingService.getPlans', async () => {
    const plans = await BillingService.getPlans();
    if (!plans || plans.length === 0) throw new Error('No billing plans found');
    if (plans[0].billing_cycle) throw new Error('Snake case detected: billing_cycle');
    if (!plans[0].billingCycle) throw new Error('CamelCase missing: billingCycle');
    console.log(`   Found ${plans.length} billing plans, first: ${plans[0].name}`);
  });

  // Test 9: ProductSubscriptionService - Get tenant subscriptions
  await test('ProductSubscriptionService.getTenantProductSubscriptions', async () => {
    const subscriptions = await ProductSubscriptionService.getTenantProductSubscriptions(1);
    console.log(`   Found ${subscriptions.length} product subscriptions for tenant 1`);
    if (subscriptions.length > 0) {
      if (subscriptions[0].platform_type) throw new Error('Snake case detected: platform_type');
      if (!subscriptions[0].platformType) throw new Error('CamelCase missing: platformType');
    }
  });

  // Test 10: SubscriptionPlanService - Get all plans
  await test('SubscriptionPlanService.getAllPlans', async () => {
    const plans = await SubscriptionPlanService.getAllPlans();
    if (!plans || plans.length === 0) throw new Error('No subscription plans found');
    // transformPlan converts to camelCase manually, so check the output
    if (!plans[0].displayName) throw new Error('displayName missing from transformed plan');
    console.log(`   Found ${plans.length} subscription plans, first: ${plans[0].name}`);
  });

  // Test 11: RBACService - Get user permissions
  await test('RBACService.getUserPermissions', async () => {
    const permissions = await RBACService.getUserPermissions(1);
    console.log(`   Found ${Object.keys(permissions).length} menu permissions for user 1`);
    if (Object.keys(permissions).length > 0) {
      const firstPerm = permissions[Object.keys(permissions)[0]];
      if (firstPerm.menu_key) throw new Error('Snake case detected: menu_key');
      if (!firstPerm.menuKey) throw new Error('CamelCase missing: menuKey');
    }
  });

  // Test 12: RBACService - Get all modules
  await test('RBACService.getAllModules', async () => {
    const modules = await RBACService.getAllModules();
    if (!modules || modules.length === 0) throw new Error('No modules found');
    if (modules[0].menu_key) throw new Error('Snake case detected: menu_key');
    if (!modules[0].menuKey) throw new Error('CamelCase missing: menuKey');
    console.log(`   Found ${modules.length} modules, first: ${modules[0].displayName}`);
  });

  // Test 13: Direct Knex query - Verify automatic conversion
  await test('Direct Knex Query (users table)', async () => {
    const users = await knex('users').select('id', 'email', 'createdAt').limit(1);
    if (users.length === 0) throw new Error('No users found');
    if (users[0].created_at) throw new Error('Snake case detected in Knex result');
    if (!users[0].createdAt) throw new Error('CamelCase missing in Knex result');
    console.log(`   Direct query returned camelCase: ${users[0].email}, createdAt: ${users[0].createdAt}`);
  });

  // Test 14: Complex join query
  await test('Complex Join Query (users + roles)', async () => {
    const result = await knex('users as u')
      .join('userRoles as ur', 'u.id', 'ur.userId')
      .join('roles as r', 'ur.roleId', 'r.id')
      .select('u.id', 'u.email', 'r.name as roleName', 'ur.assignedAt')
      .limit(1)
      .first();
    
    if (!result) {
      console.log('   No user-role assignments found (this is OK for fresh install)');
      return;
    }
    
    if (result.assigned_at) throw new Error('Snake case detected: assigned_at');
    if (!result.assignedAt) throw new Error('CamelCase missing: assignedAt');
    console.log(`   Join query: ${result.email} has role ${result.roleName}`);
  });

  return results;
}

// Run tests
testAllServices()
  .then((results) => {
    console.log('\n' + '='.repeat(60));
    console.log('📊 TEST SUMMARY');
    console.log('='.repeat(60));
    console.log(`✅ Passed: ${results.passed}`);
    console.log(`❌ Failed: ${results.failed}`);
    console.log(`📈 Success Rate: ${((results.passed / (results.passed + results.failed)) * 100).toFixed(1)}%`);
    
    if (results.failed > 0) {
      console.log('\n❌ FAILED TESTS:');
      results.tests
        .filter(t => t.status === 'FAILED')
        .forEach(t => console.log(`   - ${t.name}: ${t.error}`));
    }
    
    console.log('\n' + '='.repeat(60));
    
    if (results.failed === 0) {
      console.log('\n🎉 ALL TESTS PASSED! CamelCase conversion is working perfectly!\n');
      process.exit(0);
    } else {
      console.log('\n⚠️  Some tests failed. Please review the errors above.\n');
      process.exit(1);
    }
  })
  .catch((error) => {
    console.error('\n💥 Fatal error running tests:', error);
    process.exit(1);
  })
  .finally(() => {
    knex.destroy();
  });
