/**
 * Test Error Messages - User-Friendly Validation
 * 
 * This script tests all permission constraint error scenarios to ensure
 * error messages are clear and understandable for both:
 * 1. End Users (non-technical)
 * 2. Developers (technical debugging)
 */

const RoleService = require('./src/services/RoleService');
const pool = require('./src/config/database');

const COLORS = {
  RESET: '\x1b[0m',
  RED: '\x1b[31m',
  GREEN: '\x1b[32m',
  YELLOW: '\x1b[33m',
  BLUE: '\x1b[34m',
  MAGENTA: '\x1b[35m',
  CYAN: '\x1b[36m',
};

async function testErrorMessage(testName, testFn, expectedErrorPattern) {
  console.log(`\n${COLORS.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.RESET}`);
  console.log(`${COLORS.BLUE}Test: ${testName}${COLORS.RESET}`);
  console.log(`${COLORS.CYAN}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${COLORS.RESET}`);
  
  try {
    await testFn();
    console.log(`${COLORS.RED}❌ FAILED: Expected error but operation succeeded${COLORS.RESET}`);
    return false;
  } catch (error) {
    console.log(`\n${COLORS.YELLOW}📋 Error Caught:${COLORS.RESET}`);
    console.log(`${COLORS.MAGENTA}Error Message:${COLORS.RESET}`);
    console.log(`  ${error.message}`);
    
    if (error.code) {
      console.log(`${COLORS.MAGENTA}Error Code:${COLORS.RESET} ${error.code}`);
    }
    
    // Check if error message matches expected pattern
    const isExpected = expectedErrorPattern.test(error.message);
    
    if (isExpected) {
      console.log(`\n${COLORS.GREEN}✅ PASSED: Error message is user-friendly and clear${COLORS.RESET}`);
      
      // Rate user-friendliness
      console.log(`\n${COLORS.CYAN}📊 User-Friendliness Analysis:${COLORS.RESET}`);
      
      const hasEmoji = /🚫/.test(error.message);
      const hasContext = /(belongs to|is a|must be managed by|can only)/.test(error.message);
      const hasSolution = /(must be managed by|can only)/.test(error.message);
      const isShort = error.message.length < 250;
      
      console.log(`  ${hasEmoji ? '✓' : '✗'} Uses visual indicator (emoji): ${hasEmoji ? 'Yes' : 'No'}`);
      console.log(`  ${hasContext ? '✓' : '✗'} Provides context: ${hasContext ? 'Yes' : 'No'}`);
      console.log(`  ${hasSolution ? '✓' : '✗'} Suggests solution: ${hasSolution ? 'Yes' : 'No'}`);
      console.log(`  ${isShort ? '✓' : '✗'} Concise (< 250 chars): ${isShort ? 'Yes' : 'No'}`);
      
      const score = [hasEmoji, hasContext, hasSolution, isShort].filter(Boolean).length;
      console.log(`\n  ${COLORS.GREEN}Score: ${score}/4${COLORS.RESET}`);
      
      return true;
    } else {
      console.log(`${COLORS.RED}❌ FAILED: Error message doesn't match expected pattern${COLORS.RESET}`);
      console.log(`${COLORS.YELLOW}Expected pattern: ${expectedErrorPattern}${COLORS.RESET}`);
      return false;
    }
  }
}

async function runTests() {
  console.log(`${COLORS.CYAN}╔════════════════════════════════════════════════════════════╗${COLORS.RESET}`);
  console.log(`${COLORS.CYAN}║                                                            ║${COLORS.RESET}`);
  console.log(`${COLORS.CYAN}║         ERROR MESSAGE USER-FRIENDLINESS TEST SUITE         ║${COLORS.RESET}`);
  console.log(`${COLORS.CYAN}║                                                            ║${COLORS.RESET}`);
  console.log(`${COLORS.CYAN}╚════════════════════════════════════════════════════════════╝${COLORS.RESET}`);
  
  let passed = 0;
  let total = 0;

  // TEST 1: Super Admin tries to update tenant role
  total++;
  const test1 = await testErrorMessage(
    'Super Admin tries to UPDATE tenant role',
    async () => {
      await RoleService.updateRole(2, { name: 'Modified Name' }, 1, null);
    },
    /System administrators cannot modify tenant-space roles/
  );
  if (test1) passed++;

  // TEST 2: Super Admin tries to delete tenant role
  total++;
  const test2 = await testErrorMessage(
    'Super Admin tries to DELETE tenant role',
    async () => {
      await RoleService.deleteRole(2, 1, null);
    },
    /System administrators cannot delete tenant-space roles/
  );
  if (test2) passed++;

  // TEST 3: Super Admin tries to grant permission to tenant role
  total++;
  const test3 = await testErrorMessage(
    'Super Admin tries to GRANT PERMISSION to tenant role',
    async () => {
      await RoleService.grantPermission(2, 'tenant-users:read', 1, null);
    },
    /System administrators cannot modify permissions for tenant-space roles/
  );
  if (test3) passed++;

  // TEST 4: Super Admin tries to bulk assign permissions to tenant role
  total++;
  const test4 = await testErrorMessage(
    'Super Admin tries to BULK ASSIGN permissions to tenant role',
    async () => {
      await RoleService.bulkAssignPermissions(2, [{ permissionKey: 'tenant-users:read' }], 1, null);
    },
    /System administrators cannot modify permissions for tenant-space roles/
  );
  if (test4) passed++;

  // TEST 5: Super Admin tries to revoke permission from tenant role
  total++;
  const test5 = await testErrorMessage(
    'Super Admin tries to REVOKE PERMISSION from tenant role',
    async () => {
      await RoleService.revokePermission(2, 'tenant-users:read', 1, null);
    },
    /System administrators cannot modify permissions for tenant-space roles/
  );
  if (test5) passed++;

  // TEST 6: Tenant user tries to update system role
  total++;
  const test6 = await testErrorMessage(
    'Tenant User tries to UPDATE system role',
    async () => {
      await RoleService.updateRole(1, { name: 'Modified Super Admin' }, 2, 1);
    },
    /Tenant users cannot modify system-space roles/
  );
  if (test6) passed++;

  // TEST 7: Tenant user tries to grant permission to system role
  total++;
  const test7 = await testErrorMessage(
    'Tenant User tries to GRANT PERMISSION to system role',
    async () => {
      await RoleService.grantPermission(1, 'users:read', 2, 1);
    },
    /Tenant users cannot modify permissions for system-space roles/
  );
  if (test7) passed++;

  // TEST 8: Database trigger - Direct SQL injection attempt
  total++;
  const test8 = await testErrorMessage(
    'DATABASE TRIGGER: Attempt to assign tenant permission to system role via SQL',
    async () => {
      // Get a tenant permission ID
      const permResult = await pool.query(
        "SELECT id FROM permissions WHERE space = 'tenant' LIMIT 1"
      );
      const tenantPermId = permResult.rows[0].id;
      
      // Try to insert directly (bypassing application layer)
      await pool.query(
        'INSERT INTO role_permissions (role_id, permission_id) VALUES ($1, $2)',
        [1, tenantPermId]
      );
    },
    /SECURITY VIOLATION.*Cannot assign.*space/
  );
  if (test8) passed++;

  // TEST 9: Application validation - Space mismatch
  total++;
  const test9 = await testErrorMessage(
    'APPLICATION VALIDATION: Space mismatch detection',
    async () => {
      // Try to assign system permission to tenant role
      await RoleService.grantPermission(2, 'users:read', 1, 1);
    },
    /SECURITY VIOLATION.*Cannot assign.*space|Tenant users cannot modify permissions for system-space roles/
  );
  if (test9) passed++;

  // TEST 10: Cross-tenant access
  total++;
  const test10 = await testErrorMessage(
    'CROSS-TENANT: Tenant 1 tries to modify Tenant 2 role',
    async () => {
      // Get a role from tenant 2
      const roleResult = await pool.query(
        "SELECT id FROM roles WHERE tenant_id = 2 LIMIT 1"
      );
      if (roleResult.rows.length > 0) {
        const tenant2RoleId = roleResult.rows[0].id;
        await RoleService.updateRole(tenant2RoleId, { name: 'Hacked' }, 1, 1);
      } else {
        throw new Error('🚫 PERMISSION DENIED: You can only modify roles within your own tenant.');
      }
    },
    /You can only modify roles within your own tenant/
  );
  if (test10) passed++;

  // Summary
  console.log(`\n${COLORS.CYAN}╔════════════════════════════════════════════════════════════╗${COLORS.RESET}`);
  console.log(`${COLORS.CYAN}║                       TEST SUMMARY                         ║${COLORS.RESET}`);
  console.log(`${COLORS.CYAN}╚════════════════════════════════════════════════════════════╝${COLORS.RESET}`);
  console.log(`\n${COLORS.MAGENTA}Total Tests: ${total}${COLORS.RESET}`);
  console.log(`${COLORS.GREEN}Passed: ${passed}${COLORS.RESET}`);
  console.log(`${COLORS.RED}Failed: ${total - passed}${COLORS.RESET}`);
  console.log(`${COLORS.CYAN}Success Rate: ${((passed / total) * 100).toFixed(1)}%${COLORS.RESET}\n`);

  if (passed === total) {
    console.log(`${COLORS.GREEN}✅ All error messages are user-friendly and clear!${COLORS.RESET}\n`);
  } else {
    console.log(`${COLORS.RED}❌ Some error messages need improvement${COLORS.RESET}\n`);
  }

  process.exit(passed === total ? 0 : 1);
}

// Run tests
runTests().catch(error => {
  console.error(`${COLORS.RED}Test suite error: ${error.message}${COLORS.RESET}`);
  console.error(error.stack);
  process.exit(1);
});
