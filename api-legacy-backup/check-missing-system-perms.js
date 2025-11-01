const pool = require('./src/config/database');

(async () => {
  try {
    // Resources that should be in system space but might not be
    const systemResources = ['users', 'roles', 'dashboard', 'audit', 'settings', 'loans', 'payments'];
    
    for (const resource of systemResources) {
      const res = await pool.query(
        "SELECT permission_key, space FROM permissions WHERE resource = $1 ORDER BY space, permission_key",
        [resource]
      );
      
      console.log(`\n${resource.toUpperCase()}:`);
      if (res.rows.length === 0) {
        console.log('  ❌ NO PERMISSIONS FOUND');
      } else {
        res.rows.forEach(r => {
          console.log(`  ${r.space}: ${r.permission_key}`);
        });
      }
    }
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
    process.exit(1);
  }
})();
