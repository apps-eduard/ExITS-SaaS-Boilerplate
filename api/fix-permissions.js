const db = require('./src/config/database');

async function fixRolePermissions() {
  try {
    console.log('🔧 Fixing role_permissions table...');
    
    // Drop old constraint
    await db.query('ALTER TABLE role_permissions DROP CONSTRAINT IF EXISTS unique_permission');
    console.log('✅ Dropped old constraint');
    
    // Delete duplicates
    await db.query(`
      DELETE FROM role_permissions a USING role_permissions b
      WHERE a.id < b.id 
        AND a.role_id = b.role_id 
        AND COALESCE(a.menu_key, '') = COALESCE(b.menu_key, '')
        AND a.action_key = b.action_key
    `);
    console.log('✅ Removed duplicates');
    
    // Create new unique index
    await db.query(`
      CREATE UNIQUE INDEX IF NOT EXISTS idx_role_permissions_unique 
        ON role_permissions(role_id, COALESCE(menu_key, ''), action_key)
    `);
    console.log('✅ Created new unique index');
    
    console.log('🎉 Done!');
    process.exit(0);
  } catch (error) {
    console.error('❌ Error:', error.message);
    process.exit(1);
  }
}

fixRolePermissions();
