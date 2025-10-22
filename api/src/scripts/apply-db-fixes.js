const db = require('../config/database');

(async () => {
  try {
    await db.query('ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS menu_key VARCHAR(100)');
    console.log('✓ Added menu_key column');
    
    await db.query('ALTER TABLE role_permissions DROP CONSTRAINT IF EXISTS unique_permission');
    console.log('✓ Dropped old constraint');
    
    await db.query("DELETE FROM role_permissions a USING role_permissions b WHERE a.id < b.id AND a.role_id = b.role_id AND COALESCE(a.menu_key, '') = COALESCE(b.menu_key, '') AND a.action_key = b.action_key");
    console.log('✓ Removed duplicates');
    
    await db.query("CREATE UNIQUE INDEX IF NOT EXISTS idx_role_permissions_unique ON role_permissions(role_id, COALESCE(menu_key, ''), action_key)");
    console.log('✓ Created new unique index');
    
    process.exit(0);
  } catch(err) {
    console.error('✗ Error:', err.message);
    process.exit(1);
  }
})();
