cd api && node -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: 'postgresql://postgres:admin@localhost:5432/exits_saas_db' }); pool.query('SELECT u.id, u.email, u.first_name, u.last_name, t.name as tenant, r.name as role, r.space FROM users u LEFT JOIN tenants t ON u.tenant_id = t.id LEFT JOIN user_roles ur ON u.id = ur.user_id LEFT JOIN roles r ON ur.role_id = r.id ORDER BY u.id').then(r => { console.table(r.rows); pool.end(); })"


cd api && node -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: 'postgresql://postgres:admin@localhost:5432/exits_saas_db' }); pool.query('SELECT r.id, r.name, r.space, t.name as tenant_name, COUNT(rp.id) as perm_count FROM roles r LEFT JOIN tenants t ON r.tenant_id = t.id LEFT JOIN role_permissions rp ON r.id = rp.role_id WHERE r.name IN (\'Super Admin\', \'Tenant Admin\') GROUP BY r.id, r.name, r.space, t.name ORDER BY r.id').then(r => { console.table(r.rows); pool.end(); })"

cd api && node -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: 'postgresql://postgres:admin@localhost:5432/exits_saas_db' }); pool.query('SELECT space, COUNT(*) as total FROM permissions GROUP BY space').then(r => { console.table(r.rows); pool.end(); })"

cd api && node -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: 'postgresql://postgres:admin@localhost:5432/exits_saas_db' }); pool.query('SELECT p.space, COUNT(*) as count FROM roles r JOIN role_permissions rp ON r.id = rp.role_id JOIN permissions p ON rp.permission_id = p.id WHERE r.name = \'Tenant Admin\' AND r.space = \'tenant\' GROUP BY p.space').then(r => { console.table(r.rows); pool.end(); })"

cd api && node -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: 'postgresql://postgres:admin@localhost:5432/exits_saas_db' }); pool.query('SELECT p.space, COUNT(*) as count FROM roles r JOIN role_permissions rp ON r.id = rp.role_id JOIN permissions p ON rp.permission_id = p.id WHERE r.name = \'Super Admin\' AND r.space = \'system\' GROUP BY p.space').then(r => { console.table(r.rows); pool.end(); })"

cd api && node -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: 'postgresql://postgres:admin@localhost:5432/exits_saas_db' }); pool.query('SELECT r.name, r.space, COUNT(rp.id) as perm_count FROM roles r LEFT JOIN role_permissions rp ON r.id = rp.role_id WHERE r.name IN (\'Super Admin\', \'Tenant Admin\') GROUP BY r.id, r.name, r.space').then(r => { console.table(r.rows); pool.end(); })"


cd api && node -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: 'postgresql://postgres:admin@localhost:5432/exits_saas_db' }); pool.query('SELECT column_name, data_type FROM information_schema.columns WHERE table_name = \'role_permissions\' ORDER BY ordinal_position').then(r => { console.table(r.rows); pool.end(); })"


cd api && node -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: 'postgresql://postgres:admin@localhost:5432/exits_saas_db' }); pool.query('SELECT * FROM permissions LIMIT 5').then(r => { console.table(r.rows); pool.end(); })"


cd api && node -e "const { Pool } = require('pg'); const pool = new Pool({ connectionString: 'postgresql://postgres:postgres@localhost:5432/exitsaas' }); pool.query('SELECT * FROM permissions LIMIT 5').then(r => { console.table(r.rows); pool.end(); })"

node -e "const RoleService = require('./src/services/RoleService'); (async () => { try { const role = await RoleService.getRoleById(2, null); console.log('✅ SUCCESS: Super Admin can VIEW tenant role:'); console.log('   Role:', role.name, '| Space:', role.space, '| Permissions:', role.permissions?.length || 0); } catch (err) { console.log('❌ ERROR:', err.message); } })();"


node -e "const RoleService = require('./src/services/RoleService'); (async () => { try { const result = await RoleService.listRoles(null, 1, 10); console.log('✅ SUCCESS: Super Admin can VIEW all roles across all tenants:'); result.roles.forEach(r => console.log(`   - ${r.name} (${r.space}) | Tenant: ${r.tenantId || 'System'} | Perms: ${r.permissionCount}`)); } catch (err) { console.log('❌ ERROR:', err.message); } })();"


node -e "const RoleService = require('./src/services/RoleService'); (async () => { const result = await RoleService.listRoles(null, 1, 10); console.log('Super Admin can view all roles:'); result.roles.forEach(r => { console.log('  - ' + r.name + ' (' + r.space + ') Tenant: ' + (r.tenantId || 'System') + ' Perms: ' + r.permissionCount); }); })().catch(console.error);"


cd api && node -e "const pool = require('./src/config/database'); pool.query('SELECT column_name, data_type FROM information_schema.columns WHERE table_name = \'role_permissions\' ORDER BY ordinal_position').then(r => { console.log('role_permissions columns:'); r.rows.forEach(c => console.log('  -', c.column_name, '(' + c.data_type + ')')); process.exit(0); }).catch(console.error);"


node -e "const pool = require('./src/config/database'); pool.query('SELECT column_name, data_type FROM information_schema.columns WHERE table_name = \'role_permissions\' ORDER BY ordinal_position').then(r => { console.log('role_permissions columns:'); r.rows.forEach(c => console.log('  -', c.column_name, '(' + c.data_type + ')')); process.exit(0); }).catch(console.error);"

cd api && node -e "const knex = require('./knexfile'); const db = require('knex')(knex.development); db('subscription_plans').select('id', 'name', 'product_type').orderBy('id').then(rows => { console.log(JSON.stringify(rows, null, 2)); process.exit(); });"


node -e "const pool = require('./src/config/database'); pool.query('SELECT id, tenant_id, product_type, subscription_plan_id, status FROM product_subscriptions ORDER BY tenant_id, id').then(r => { console.log('Product Subscriptions:'); console.table(r.rows); process.exit(0); }).catch(e => { console.error(e); process.exit(1); });"