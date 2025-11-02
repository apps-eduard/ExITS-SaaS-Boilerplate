const Knex = require('knex');

const knex = Knex({
  client: 'pg',
  connection: {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'admin',
    database: 'exits_saas_db'
  }
});

knex.raw("SELECT column_name FROM information_schema.columns WHERE table_name = 'customers' ORDER BY ordinal_position")
  .then(r => {
    console.log('All columns in customers table:');
    r.rows.forEach(row => console.log('  -', row.column_name));
    
    const hasRole = r.rows.some(row => row.column_name === 'role');
    console.log('\nHas role column?', hasRole);
    
    process.exit(0);
  })
  .catch(e => {
    console.error('Error:', e.message);
    process.exit(1);
  });
