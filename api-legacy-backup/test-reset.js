const bcrypt = require('bcrypt');
const knex = require('knex')({
  client: 'pg',
  connection: {
    host: 'localhost',
    port: 5432,
    database: 'exits_saas_db',
    user: 'postgres',
    password: 'admin'
  }
});

async function resetPasswords() {
  try {
    console.log('Hashing new passwords...');
    
    const systemAdminHash = await bcrypt.hash('Admin@5678', 10);
    const tenantAdmin1Hash = await bcrypt.hash('TAdmin1@9999', 10);
    const tenantAdmin2Hash = await bcrypt.hash('TAdmin2@8888', 10);
    
    console.log('Updating passwords in database...');
    
    // Update system admin password
    await knex('users')
      .where('email', 'admin@exitsaas.com')
      .update({ password_hash: systemAdminHash });
    
    // Update tenant admin passwords  
    await knex('users')
      .where('email', 'admin-1@example.com')
      .update({ password_hash: tenantAdmin1Hash });
      
    await knex('users')
      .where('email', 'admin-2@example.com')
      .update({ password_hash: tenantAdmin2Hash });
    
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