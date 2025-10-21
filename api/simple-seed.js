/**
 * Simple Seed Script - Just creates users
 */

const { Pool } = require('pg');
const bcrypt = require('bcryptjs');
require('dotenv').config();

const pool = new Pool({
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  host: process.env.DB_HOST,
  port: process.env.DB_PORT,
  database: process.env.DB_NAME,
});

async function simpleSeed() {
  const client = await pool.connect();
  try {
    console.log('🌱 Starting simple seed...\n');

    // Create tenants
    console.log('1. Creating tenants...');
    await client.query(`
      INSERT INTO tenants (name, subdomain, plan, status, max_users)
      VALUES
      ('ACME Corporation', 'acme', 'pro', 'active', 100),
      ('TechStartup Inc', 'techstartup', 'basic', 'active', 50),
      ('Enterprise Corp', 'enterprise', 'enterprise', 'active', 500)
      ON CONFLICT (subdomain) DO NOTHING
    `);
    
    const tenantsRes = await client.query(`
      SELECT id, name FROM tenants 
      WHERE subdomain IN ('acme', 'techstartup', 'enterprise') 
      ORDER BY id
    `);
    console.log(`✅ ${tenantsRes.rows.length} tenants ready`);
    tenantsRes.rows.forEach(t => console.log(`   - ${t.name} (ID: ${t.id})`));

    // Create system admin
    console.log('\n2. Creating system admin...');
    const adminPassword = await bcrypt.hash('Admin@123456', 10);
    await client.query(`
      INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, status, email_verified)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      ON CONFLICT (tenant_id, email) DO UPDATE SET
        password_hash = EXCLUDED.password_hash
      RETURNING id, email
    `, [null, 'admin@exitsaas.com', adminPassword, 'System', 'Administrator', 'active', true]);
    console.log(`✅ System admin: admin@exitsaas.com`);

    // Create tenant admins
    console.log('\n3. Creating tenant admins...');
    const tenantPassword = await bcrypt.hash('TenantAdmin@123456', 10);
    const tenantIds = tenantsRes.rows.map(t => t.id);
    
    for (let i = 0; i < tenantIds.length; i++) {
      const email = `admin-${i+1}@example.com`;
      await client.query(`
        INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, status, email_verified)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (tenant_id, email) DO UPDATE SET
          password_hash = EXCLUDED.password_hash
        RETURNING id, email
      `, [tenantIds[i], email, tenantPassword, 'Tenant', 'Admin', 'active', true]);
      console.log(`✅ Tenant admin: ${email} (Tenant ID: ${tenantIds[i]})`);
    }

    // Verify users
    console.log('\n4. Verifying users...');
    const usersRes = await client.query(`
      SELECT id, email, tenant_id, status FROM users ORDER BY id
    `);
    console.log(`✅ Total users in database: ${usersRes.rows.length}`);
    usersRes.rows.forEach(u => {
      console.log(`   - ${u.email} | Tenant: ${u.tenant_id || 'System'} | Status: ${u.status}`);
    });

    console.log('\n✅ Seed completed successfully!');
    console.log('\n📝 Login Credentials:');
    console.log('   System Admin: admin@exitsaas.com / Admin@123456');
    console.log('   Tenant Admin 1: admin-1@example.com / TenantAdmin@123456');
    console.log('   Tenant Admin 2: admin-2@example.com / TenantAdmin@123456');
    console.log('   Tenant Admin 3: admin-3@example.com / TenantAdmin@123456\n');

    await client.release();
    await pool.end();
  } catch (err) {
    console.error('❌ Seed failed:', err.message);
    console.error(err.stack);
    await client.release();
    await pool.end();
    process.exit(1);
  }
}

simpleSeed();
