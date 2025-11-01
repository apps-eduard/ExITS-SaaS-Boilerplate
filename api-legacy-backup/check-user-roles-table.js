const knexConfig = require('./knexfile');
const knex = require('knex')(knexConfig.development);

async function checkTable() {
  try {
    const result = await knex.raw(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'user_roles' 
      ORDER BY ordinal_position
    `);
    console.log('user_roles table structure:');
    console.log(JSON.stringify(result.rows, null, 2));
  } catch (err) {
    console.error('Error:', err.message);
  } finally {
    await knex.destroy();
    process.exit(0);
  }
}

checkTable();
