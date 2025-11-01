const pool = require('./src/config/database');

async function checkModulesTable() {
  try {
    console.log('Checking modules table structure...');
    const structure = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'modules' 
      ORDER BY ordinal_position
    `);
    
    console.log('Modules table columns:');
    structure.rows.forEach(col => console.log('- ' + col.column_name + ' (' + col.data_type + ')'));
    
    console.log('\nChecking modules table data...');
    const data = await pool.query('SELECT * FROM modules LIMIT 5');
    console.log('Modules count:', data.rows.length);
    data.rows.forEach((module, i) => {
      console.log(`Module ${i + 1}:`, {
        id: module.id,
        menu_key: module.menu_key,
        display_name: module.display_name,
        space: module.space,
        status: module.status
      });
    });
    
    await pool.end();
  } catch (err) {
    console.error('Error:', err.message);
    console.error('Stack:', err.stack);
  }
}

checkModulesTable();