const pool = require('./src/config/database');

(async () => {
  try {
    const res = await pool.query(
      "SELECT permission_key, space, resource FROM permissions WHERE resource LIKE '%user%' ORDER BY space, permission_key"
    );
    
    console.log('\n=== USER-RELATED PERMISSIONS (' + res.rows.length + ' total) ===\n');
    
    let currentSpace = '';
    res.rows.forEach(r => {
      if (r.space !== currentSpace) {
        currentSpace = r.space;
        console.log('\n' + currentSpace.toUpperCase() + ' SPACE:');
      }
      console.log('  ' + r.permission_key);
    });
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
    process.exit(1);
  }
})();
