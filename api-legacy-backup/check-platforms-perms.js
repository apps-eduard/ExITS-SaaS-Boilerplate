const pool = require('./src/config/database');

async function checkPermissions() {
  try {
    // Check platforms permissions
    const platforms = await pool.query(
      "SELECT permission_key FROM permissions WHERE permission_key LIKE 'platforms:%' ORDER BY permission_key"
    );
    console.log('📦 Platforms permissions:', platforms.rows.map(x => x.permission_key));
    
    // Check products permissions (old)
    const products = await pool.query(
      "SELECT permission_key FROM permissions WHERE permission_key LIKE 'products:%' ORDER BY permission_key"
    );
    console.log('🗑️  Products permissions (old):', products.rows.map(x => x.permission_key));
    
    process.exit(0);
  } catch (error) {
    console.error('Error:', error.message);
    process.exit(1);
  }
}

checkPermissions();
