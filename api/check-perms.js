const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

async function checkPerms() {
  const result = await pool.query(`
    SELECT id, role_id, module_id, menu_key, action_key 
    FROM role_permissions 
    WHERE role_id = 2
    ORDER BY action_key
  `);
  
  console.log('Existing permissions for role_id = 2:');
  console.log(JSON.stringify(result.rows, null, 2));
  
  await pool.end();
}

checkPerms().catch(console.error);
