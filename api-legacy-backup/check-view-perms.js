const { Pool } = require('pg');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

async function checkViewPerms() {
  const result = await pool.query(`
    SELECT * FROM role_permissions 
    WHERE role_id = 2 AND action_key = 'view' 
    ORDER BY module_id
  `);
  
  console.log('View permissions for role_id = 2:');
  console.log(JSON.stringify(result.rows, null, 2));
  
  // Also check if there are role_permissions without module_id but with menu_key
  const result2 = await pool.query(`
    SELECT * FROM role_permissions 
    WHERE role_id = 2 AND menu_key IS NOT NULL
  `);
  
  console.log('\nPermissions with menu_key set:');
  console.log(JSON.stringify(result2.rows, null, 2));
  
  await pool.end();
}

checkViewPerms().catch(console.error);
