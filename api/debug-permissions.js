const pool = require('./src/config/database');

async function checkEnumAndTryInsert() {
  try {
    console.log('1. Checking space enum values...');
    const enumResult = await pool.query(`
      SELECT enumlabel 
      FROM pg_enum 
      WHERE enumtypid = (
        SELECT oid 
        FROM pg_type 
        WHERE typname = 'role_space'
      )
    `);
    
    console.log('Allowed space values:');
    enumResult.rows.forEach(row => console.log('- ' + row.enumlabel));
    
    console.log('\n2. Checking permissions table structure...');
    const structure = await pool.query(`
      SELECT column_name, data_type, is_nullable
      FROM information_schema.columns 
      WHERE table_name = 'permissions' 
      ORDER BY ordinal_position
    `);
    
    console.log('Permissions table columns:');
    structure.rows.forEach(col => console.log(`- ${col.column_name} (${col.data_type}, nullable: ${col.is_nullable})`));
    
    console.log('\n3. Testing manual insert of one permission...');
    try {
      const testInsert = await pool.query(`
        INSERT INTO permissions (permission_key, resource, action, description, space, created_at, updated_at)
        VALUES ($1, $2, $3, $4, $5, NOW(), NOW())
        RETURNING id, permission_key
      `, ['test-tenant-permission', 'test', 'test', 'Test permission', 'tenant']);
      
      console.log('✅ Test insert successful:', testInsert.rows[0]);
      
      // Clean up
      await pool.query('DELETE FROM permissions WHERE permission_key = $1', ['test-tenant-permission']);
      console.log('✅ Test permission cleaned up');
      
    } catch (insertErr) {
      console.log('❌ Test insert failed:', insertErr.message);
    }
    
    await pool.end();
  } catch (err) {
    console.error('❌ Error:', err.message);
  }
}

checkEnumAndTryInsert();