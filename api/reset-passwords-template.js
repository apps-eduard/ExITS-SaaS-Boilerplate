const bcrypt = require('bcrypt');
const knex = require('knex')({
  client: 'pg',
  connection: {
    host: 'localhost',
    port: 5432,
    database: 'exits_saas_db',
    user: 'postgres',
    password: 'REPLACE_DB_PASSWORD'
  }
});

async function resetPasswords() {
  try {
    console.log('Hashing new passwords...');
    
    const systemAdminHash = await bcrypt.hash('REPLACE_SYSTEM_PASSWORD', 10);
    const tenantAdmin1Hash = await bcrypt.hash('REPLACE_TENANT1_PASSWORD', 10);
    const tenantAdmin2Hash = await bcrypt.hash('REPLACE_TENANT2_PASSWORD', 10);
    
    console.log('Updating passwords in database...');
    
    await knex('users').where('email', 'admin@exitsaas.com').update({ password_hash: systemAdminHash });
    await knex('users').where('email', 'admin-1@example.com').update({ password_hash: tenantAdmin1Hash });
    await knex('users').where('email', 'admin-2@example.com').update({ password_hash: tenantAdmin2Hash });
    
    console.log('✅ All user passwords updated successfully');
    await knex.destroy();
    process.exit(0);
  } catch (error) {
    console.error('❌ Error updating passwords:', error.message);
    await knex.destroy();
    process.exit(1);
  }
}

resetPasswords();