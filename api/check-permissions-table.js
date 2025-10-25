const pool = require('./src/config/database');

(async () => {
  try {
    const res = await pool.query(
      "SELECT column_name FROM information_schema.columns WHERE table_name = 'permissions' ORDER BY ordinal_position"
    );
    
    console.log('\n=== PERMISSIONS TABLE COLUMNS ===\n');
    res.rows.forEach(r => {
      console.log(`  ${r.column_name}`);
    });
    
    await pool.end();
  } catch (error) {
    console.error('Error:', error.message);
    await pool.end();
    process.exit(1);
  }
})();
