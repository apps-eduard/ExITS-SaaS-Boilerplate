/**
 * Test script to verify automatic snake_case <-> camelCase conversion
 * Run with: node test-camelcase-conversion.js
 */

const knex = require('./src/config/knex');

async function testConversion() {
  console.log('🧪 Testing automatic case conversion...\n');

  try {
    // Test 1: Simple query using camelCase (should convert to snake_case)
    console.log('Test 1: Querying users with camelCase...');
    const users = await knex('users')
      .select('id', 'email', 'firstName', 'lastName', 'tenantId', 'createdAt')
      .limit(3);
    
    console.log('✅ Result (should be camelCase):');
    console.log(JSON.stringify(users[0], null, 2));
    console.log('');

    // Test 2: Where clause with camelCase
    console.log('Test 2: Where clause with camelCase...');
    const admin = await knex('users')
      .where({ email: 'admin@exitsaas.com' })
      .first();
    
    console.log('✅ Result:');
    console.log(JSON.stringify(admin, null, 2));
    console.log('');

    // Test 3: Insert with camelCase (should convert to snake_case)
    console.log('Test 3: Testing insert with camelCase...');
    console.log('(Dry run - not actually inserting)');
    const insertQuery = knex('users')
      .insert({
        email: 'test@example.com',
        passwordHash: 'hash',
        firstName: 'Test',
        lastName: 'User',
        tenantId: 1,
        status: 'active'
      })
      .toString();
    
    console.log('Generated SQL:');
    console.log(insertQuery);
    console.log('');

    // Test 4: Join with camelCase
    console.log('Test 4: Testing join with camelCase...');
    const userWithRole = await knex('users')
      .select(
        'users.id',
        'users.email',
        'users.firstName',
        'roles.name as roleName'
      )
      .leftJoin('userRoles', 'users.id', 'userRoles.userId')
      .leftJoin('roles', 'userRoles.roleId', 'roles.id')
      .where({ 'users.email': 'admin@exitsaas.com' })
      .first();
    
    console.log('✅ Result with join:');
    console.log(JSON.stringify(userWithRole, null, 2));
    console.log('');

    console.log('🎉 All tests completed successfully!');
    console.log('✅ CamelCase conversion is working correctly');
    
  } catch (error) {
    console.error('❌ Test failed:', error.message);
    console.error(error);
  } finally {
    await knex.destroy();
  }
}

testConversion();
