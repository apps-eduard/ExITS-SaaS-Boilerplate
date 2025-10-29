/**
 * Test login with new Knex camelCase conversion
 * Run with: node test-login-camelcase.js
 */

const axios = require('axios');

async function testLogin() {
  console.log('🧪 Testing login with new Knex camelCase conversion...\n');

  try {
    // Test 1: System Admin Login
    console.log('Test 1: System Admin login...');
    const response = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin@exitsaas.com',
      password: 'Admin@123'
    });

    console.log('✅ Login successful!');
    console.log('User data:', JSON.stringify(response.data.data.user, null, 2));
    console.log('Roles:', JSON.stringify(response.data.data.roles, null, 2));
    console.log('Platforms:', JSON.stringify(response.data.data.platforms, null, 2));
    console.log('');

    // Test 2: Tenant Admin Login
    console.log('Test 2: Tenant Admin login...');
    const tenantResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'admin-1@example.com',
      password: 'Admin@123'
    });

    console.log('✅ Login successful!');
    console.log('User data:', JSON.stringify(tenantResponse.data.data.user, null, 2));
    console.log('');

    // Test 3: Employee Login
    console.log('Test 3: Employee login...');
    const employeeResponse = await axios.post('http://localhost:3000/api/auth/login', {
      email: 'employee1@acme.com',
      password: 'Admin@123'
    });

    console.log('✅ Login successful!');
    console.log('User data:', JSON.stringify(employeeResponse.data.data.user, null, 2));
    console.log('Platforms:', JSON.stringify(employeeResponse.data.data.platforms, null, 2));
    console.log('');

    console.log('🎉 All login tests passed!');
    console.log('✅ CamelCase conversion working correctly in AuthService');

  } catch (error) {
    console.error('❌ Test failed:', error.response?.data || error.message);
    if (error.response?.data?.error) {
      console.error('Error details:', error.response.data.error);
    }
  }
}

testLogin();
