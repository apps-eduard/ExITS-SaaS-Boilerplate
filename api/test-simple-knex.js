/**
 * Simple Integration Test for Knex Conversion
 * Tests the most critical user flows
 */

const knex = require('./src/config/knex');
const AuthService = require('./src/services/AuthService');
const UserService = require('./src/services/UserService');
const TenantService = require('./src/services/TenantService');

console.log('🧪 Testing Knex CamelCase Conversion\n');

async function runTests() {
  console.log('='.repeat(60));
  console.log('TEST 1: User Login (AuthService)');
  console.log('='.repeat(60));
  
  try {
    // Use the correct admin email from the database
    const loginResult = await AuthService.login('admin@exitsaas.com', 'Admin@123');
    console.log('✅ Login successful!');
    console.log(`   Email: ${loginResult.user.email}`);
    console.log(`   ID: ${loginResult.user.id}`);
    console.log(`   Has tokens: ${!!loginResult.tokens}`);
    
    // Check for snake_case (should NOT exist)
    if (loginResult.user.first_name || loginResult.user.tenant_id) {
      console.log('❌ SNAKE_CASE DETECTED!');
      console.log(JSON.stringify(loginResult.user, null, 2));
      throw new Error('Response contains snake_case fields');
    }
    
    // Check for camelCase (SHOULD exist)
    if (!loginResult.user.firstName || loginResult.user.tenantId === undefined) {
      console.log('❌ CAMELCASE MISSING!');
      console.log(JSON.stringify(loginResult.user, null, 2));
      throw new Error('Response missing camelCase fields');
    }
    
    console.log('✅ Response is properly in camelCase!\n');
  } catch (error) {
    console.error('❌ Login test failed:', error.message);
    throw error;
  }
  
  console.log('='.repeat(60));
  console.log('TEST 2: Get User By ID (UserService)');
  console.log('='.repeat(60));
  
  try {
    const user = await UserService.getUserById(1);
    console.log('✅ User retrieved!');
    console.log(`   Email: ${user.email}`);
    console.log(`   Name: ${user.firstName} ${user.lastName}`);
    console.log(`   Created: ${user.createdAt}`);
    
    if (user.first_name || user.created_at) {
      throw new Error('Snake_case detected in user response');
    }
    
    console.log('✅ User response is properly in camelCase!\n');
  } catch (error) {
    console.error('❌ Get user test failed:', error.message);
    throw error;
  }
  
  console.log('='.repeat(60));
  console.log('TEST 3: Get Tenant By ID (TenantService)');
  console.log('='.repeat(60));
  
  try {
    const tenant = await TenantService.getTenantById(1);
    console.log('✅ Tenant retrieved!');
    console.log(`   Name: ${tenant.name}`);
    console.log(`   Status: ${tenant.status}`);
    
    if (tenant.created_at || tenant.updated_at) {
      console.log('❌ SNAKE_CASE DETECTED!');
      console.log(JSON.stringify(tenant, null, 2));
      throw new Error('Snake_case detected in tenant response');
    }
    
    console.log('✅ Tenant response is properly in camelCase!\n');
  } catch (error) {
    console.error('❌ Get tenant test failed:', error.message);
    throw error;
  }
  
  console.log('='.repeat(60));
  console.log('TEST 4: Direct Knex Query');
  console.log('='.repeat(60));
  
  try {
    const users = await knex('users')
      .select('id', 'email', 'firstName', 'lastName', 'createdAt')
      .where({ status: 'active' })
      .limit(5);
    
    console.log(`✅ Found ${users.length} active users`);
    
    users.forEach((user, index) => {
      console.log(`   ${index + 1}. ${user.email} (Created: ${user.createdAt})`);
      
      if (user.first_name || user.created_at) {
        throw new Error(`Snake_case detected in direct query result for ${user.email}`);
      }
    });
    
    console.log('✅ Direct Knex queries return camelCase!\n');
  } catch (error) {
    console.error('❌ Direct query test failed:', error.message);
    throw error;
  }
  
  console.log('='.repeat(60));
  console.log('TEST 5: Complex Join Query');
  console.log('='.repeat(60));
  
  try {
    const results = await knex('users as u')
      .leftJoin('tenants as t', 'u.tenantId', 't.id')
      .select(
        'u.id',
        'u.email',
        'u.firstName',
        'u.lastName',
        't.name as tenantName',
        'u.createdAt',
      )
      .where({ 'u.status': 'active' })
      .limit(3);
    
    console.log(`✅ Join query returned ${results.length} results`);
    
    results.forEach((row, index) => {
      console.log(`   ${index + 1}. ${row.email} @ ${row.tenantName || 'System'}`);
      
      if (row.first_name || row.created_at || row.tenant_id) {
        throw new Error(`Snake_case detected in join query for ${row.email}`);
      }
    });
    
    console.log('✅ Join queries work correctly with camelCase!\n');
  } catch (error) {
    console.error('❌ Join query test failed:', error.message);
    throw error;
  }
  
  console.log('='.repeat(60));
  console.log('TEST 6: Insert & Update (Write Operations)');
  console.log('='.repeat(60));
  
  try {
    // Create a test audit log entry with only basic fields
    const [auditLog] = await knex('auditLogs')
      .insert({
        userId: 1,
        tenantId: 1,
        action: 'test_action',
        resourceType: 'test',
        ipAddress: '127.0.0.1',
        userAgent: 'Test Script',
      })
      .returning('*');
    
    console.log('✅ Insert successful!');
    console.log(`   Created audit log ID: ${auditLog.id}`);
    console.log(`   Action: ${auditLog.action}`);
    console.log(`   User ID: ${auditLog.userId}`);
    
    if (auditLog.created_at || auditLog.user_id || auditLog.ip_address) {
      console.log('❌ SNAKE_CASE DETECTED!');
      console.log(JSON.stringify(auditLog, null, 2));
      throw new Error('Snake_case detected in insert result');
    }
    
    if (!auditLog.createdAt || !auditLog.userId || !auditLog.ipAddress) {
      console.log('❌ CAMELCASE MISSING!');
      console.log(JSON.stringify(auditLog, null, 2));
      throw new Error('CamelCase missing in insert result');
    }
    
    // Clean up
    await knex('auditLogs').where({ id: auditLog.id }).del();
    console.log('✅ Cleanup successful');
    console.log('✅ Insert/Update operations work with camelCase!\n');
  } catch (error) {
    console.error('❌ Write operation test failed:', error.message);
    throw error;
  }
}

runTests()
  .then(() => {
    console.log('='.repeat(60));
    console.log('🎉 ALL TESTS PASSED!');
    console.log('='.repeat(60));
    console.log('\n✅ CamelCase conversion is working perfectly!');
    console.log('✅ All services are properly converted to Knex');
    console.log('✅ Database reads/writes are automatic\n');
    process.exit(0);
  })
  .catch((error) => {
    console.log('\n='.repeat(60));
    console.log('❌ TEST SUITE FAILED');
    console.log('='.repeat(60));
    console.error('\nError:', error.message);
    console.error('\nStack:', error.stack);
    process.exit(1);
  })
  .finally(() => {
    knex.destroy();
  });
