const RBACService = require('./src/services/RBACService');

async function testGetModules() {
  try {
    console.log('Testing getAllModules...');
    const modules = await RBACService.getAllModules();
    console.log('✅ Success! Got', modules.length, 'modules');
    console.log('Modules:', JSON.stringify(modules, null, 2));
  } catch (err) {
    console.error('❌ Error:', err.message);
    console.error('Stack:', err.stack);
  }
}

testGetModules();