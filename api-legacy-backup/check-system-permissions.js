const pool = require('./src/config/database');

(async () => {
  try {
    const res = await pool.query(
      "SELECT permission_key, space, resource, action FROM permissions WHERE space = 'system' ORDER BY permission_key"
    );
    
    console.log('\n=== SYSTEM PERMISSIONS (' + res.rows.length + ' total) ===\n');
    res.rows.forEach(r => {
      console.log(`  ${r.permission_key}`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
    process.exit(1);
  }
})();
