const fetch = require('node-fetch');

async function testUserAPI() {
  try {
    console.log('🧪 Testing User API Response...\n');
    
    // Test getting a user by ID
    const response = await fetch('http://localhost:3000/api/users/2');
    const data = await response.json();
    
    console.log('📥 Raw API Response:');
    console.log(JSON.stringify(data, null, 2));
    
    if (data.data) {
      console.log('\n📊 User Data Fields:');
      const user = data.data;
      console.log(`  - id: ${user.id}`);
      console.log(`  - email: ${user.email}`);
      console.log(`  - firstName: ${user.firstName || 'MISSING'}`);
      console.log(`  - lastName: ${user.lastName || 'MISSING'}`);
      console.log(`  - first_name: ${user.first_name || 'MISSING'}`);
      console.log(`  - last_name: ${user.last_name || 'MISSING'}`);
      console.log(`  - roles: ${user.roles ? user.roles.length + ' roles' : 'MISSING'}`);
      
      console.log('\n✅ Field Check:');
      console.log(`  - Has camelCase: ${!!(user.firstName && user.lastName)}`);
      console.log(`  - Has snake_case: ${!!(user.first_name && user.last_name)}`);
      console.log(`  - Has roles: ${!!(user.roles && user.roles.length > 0)}`);
    }
    
  } catch (error) {
    console.error('❌ Error:', error.message);
  }
}

testUserAPI();