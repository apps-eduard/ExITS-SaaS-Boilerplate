const knex = require('knex')({
  client: 'postgresql',
  connection: {
    host: 'localhost',
    port: 5432,
    user: 'postgres',
    password: 'admin',
    database: 'exits_saas_db'
  }
});

async function checkProduct() {
  try {
    const product = await knex('money_loan_products').where({ id: 1 }).first();
    console.log('Product:', product);
  } catch (error) {
    console.error('Error:', error);
  } finally {
    await knex.destroy();
  }
}

checkProduct();