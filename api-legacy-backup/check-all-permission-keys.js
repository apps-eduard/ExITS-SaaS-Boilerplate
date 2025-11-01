const pool = require('./src/config/database');

(async () => {
  try {
    const res = await pool.query(`
      SELECT permission_key, space, resource 
      FROM permissions 
      ORDER BY space, resource, permission_key
    `);
    
    console.log('\n=== ALL PERMISSIONS BY SPACE ===\n');
    
    let currentSpace = '';
    res.rows.forEach(r => {
      if (r.space !== currentSpace) {
        currentSpace = r.space;
        console.log(`\n--- ${currentSpace.toUpperCase()} SPACE ---`);
      }
      console.log(`  ${r.permission_key}`);
    });
    
    console.log(`\n\nTotal permissions: ${res.rows.length}`);
    console.log(`System: ${res.rows.filter(r => r.space === 'system').length}`);
    console.log(`Tenant: ${res.rows.filter(r => r.space === 'tenant').length}`);
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    await pool.end();
    process.exit(1);
  }
})();
