const axios = require('axios');

const token = 'your-jwt-token'; // We'll test without auth for now

async function testUserFormat() {
  try {
    console.log('🧪 Testing User API Response Format\n');

    // First, get the list of users to find a user ID
    const listResponse = await axios.get('http://localhost:3000/api/users?page=1&limit=20');
    console.log('✅ List Users Response (first user):');
    if (listResponse.data.data && listResponse.data.data.length > 0) {
      const firstUser = listResponse.data.data[0];
      console.log(JSON.stringify(firstUser, null, 2));
      
      // Check if fields are in camelCase
      const hasCamelCase = (obj) => {
        return obj.hasOwnProperty('firstName') || obj.hasOwnProperty('lastName');
      };
      
      const hasSnakeCase = (obj) => {
        return obj.hasOwnProperty('first_name') || obj.hasOwnProperty('last_name');
      };
      
      console.log('\n📊 Format Check:');
      console.log(`  - Has camelCase fields: ${hasCamelCase(firstUser)}`);
      console.log(`  - Has snake_case fields: ${hasSnakeCase(firstUser)}`);
      
      if (hasCamelCase(firstUser)) {
        console.log('\n✅ PASS: API is returning camelCase fields');
      } else if (hasSnakeCase(firstUser)) {
        console.log('\n❌ FAIL: API is still returning snake_case fields');
      }
    }
  } catch (error) {
    console.error('❌ Error:', error.message);
    if (error.response) {
      console.error('Response:', error.response.data);
    }
  }
}

testUserFormat();
