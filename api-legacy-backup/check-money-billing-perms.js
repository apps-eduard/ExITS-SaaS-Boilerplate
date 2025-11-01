const pool = require('./src/config/database');

(async () => {
  try {
    const res = await pool.query(`
      SELECT permission_key, space, resource 
      FROM permissions 
      WHERE permission_key LIKE 'money%' OR permission_key LIKE 'billing%'
      ORDER BY space, resource, permission_key
    `);
    
    console.log('\n=== MONEY-LOAN & BILLING PERMISSIONS IN DB ===\n');
    res.rows.forEach(r => console.log(`${r.space.padEnd(8)} | ${r.permission_key}`));
    console.log(`\nTotal: ${res.rows.length}`);
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    await pool.end();
    process.exit(1);
  }
})();
