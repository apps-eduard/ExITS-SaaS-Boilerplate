const pool = require('./src/config/database');

(async () => {
  try {
    // Get all permissions grouped by space
    const res = await pool.query(
      "SELECT permission_key, space, resource, action FROM permissions ORDER BY space, resource, action"
    );
    
    console.log('\n=== COMPLETE PERMISSION STRUCTURE ===\n');
    
    let currentSpace = '';
    let currentResource = '';
    let systemCount = 0;
    let tenantCount = 0;
    
    const bySpace = { system: [], tenant: [] };
    
    res.rows.forEach(r => {
      if (r.space === 'system') systemCount++;
      else tenantCount++;
      
      bySpace[r.space].push(r);
    });
    
    console.log('📊 SUMMARY:');
    console.log(`   System Permissions: ${systemCount}`);
    console.log(`   Tenant Permissions: ${tenantCount}`);
    console.log(`   Total: ${res.rows.length}\n`);
    
    console.log('=' .repeat(80));
    console.log('SYSTEM SPACE (Platform-wide management)');
    console.log('=' .repeat(80));
    
    currentResource = '';
    bySpace.system.forEach(r => {
      if (r.resource !== currentResource) {
        currentResource = r.resource;
        console.log(`\n📦 ${currentResource.toUpperCase()}`);
      }
      console.log(`   ✓ ${r.permission_key}`);
    });
    
    console.log('\n\n');
    console.log('=' .repeat(80));
    console.log('TENANT SPACE (Within tenant/product scope)');
    console.log('=' .repeat(80));
    
    currentResource = '';
    bySpace.tenant.forEach(r => {
      if (r.resource !== currentResource) {
        currentResource = r.resource;
        console.log(`\n📦 ${currentResource.toUpperCase()}`);
      }
      console.log(`   ✓ ${r.permission_key}`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
    process.exit(1);
  }
})();
