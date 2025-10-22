-- Seed Script for ExITS-SaaS
-- This script seeds initial data including tenants, users, roles, modules, and permissions

-- ==================== SEED TENANTS ====================
INSERT INTO tenants (name, subdomain, plan, status, primary_color, secondary_color, max_users)
VALUES 
  ('ExITS Platform', 'exits-platform', 'enterprise', 'active', '#6366f1', '#8b5cf6', 1000)
ON CONFLICT (subdomain) DO NOTHING;

-- ==================== SEED MODULES ====================
INSERT INTO modules (menu_key, display_name, description, icon, route_path, parent_menu_key, menu_order, space, status)
VALUES 
  ('dashboard', 'Dashboard', 'Main dashboard and analytics', 'dashboard', '/dashboard', NULL, 1, 'tenant', 'active'),
  ('users', 'User Management', 'User management', 'people', '/admin/users', NULL, 2, 'tenant', 'active'),
  ('roles', 'Roles & Permissions', 'Role management', 'shield-check', '/admin/roles', NULL, 3, 'tenant', 'active'),
  ('tenants', 'Tenants', 'Tenant management', 'office-building', '/admin/tenants', NULL, 4, 'system', 'active'),
  ('permissions', 'Permissions', 'Permission management', 'key', '/admin/permissions', NULL, 5, 'system', 'active'),
  ('audit', 'Audit Logs', 'System audit logs', 'document-text', '/admin/audit-logs', NULL, 6, 'tenant', 'active'),
  ('settings', 'Settings', 'System settings', 'cog', '/settings', NULL, 7, 'tenant', 'active'),
  ('modules', 'Modules', 'Module management', 'puzzle', '/admin/modules', NULL, 8, 'system', 'active'),
  ('system', 'System', 'System management', 'cog', '/system', NULL, 9, 'system', 'active'),
  ('monitoring', 'Monitoring', 'System monitoring', 'chart-line', '/monitoring', NULL, 10, 'system', 'active'),
  ('config', 'Configuration', 'System configuration', 'sliders', '/config', NULL, 11, 'system', 'active'),
  ('billing', 'Billing', 'Billing management', 'credit-card', '/billing', NULL, 12, 'system', 'active')
ON CONFLICT (menu_key) DO NOTHING;

-- ==================== SEED ROLES ====================
-- System roles must have tenant_id = NULL
INSERT INTO roles (tenant_id, name, description, space, status)
VALUES 
  (NULL, 'Super Admin', 'Full system access with all permissions', 'system', 'active')
ON CONFLICT DO NOTHING;

-- Tenant roles must have tenant_id set
INSERT INTO roles (tenant_id, name, description, space, status)
VALUES 
  (1, 'Tenant Admin', 'Full access within tenant scope', 'tenant', 'active'),
  (1, 'User Manager', 'Can manage users and assign roles', 'tenant', 'active'),
  (1, 'Viewer', 'Read-only access to system', 'tenant', 'active')
ON CONFLICT DO NOTHING;

-- ==================== SEED USERS ====================
-- Password for all users: Admin@123
-- Only create admin user - other users will be created by simple-seed.js
INSERT INTO users (tenant_id, email, password_hash, first_name, last_name, status, email_verified)
VALUES 
  (NULL, 'admin@exitsaas.com', '$2a$10$K55jbLtC.XTZY9Th.z722umeqRoKFyZo5qgsYlX9H6j4L3haKFsCi', 'System', 'Administrator', 'active', true)
ON CONFLICT (tenant_id, email) DO NOTHING;

-- ==================== ASSIGN ROLES TO USERS ====================
-- Assign System Administrator role to admin
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id 
FROM users u, roles r 
WHERE u.email = 'admin@exitsaas.com' 
  AND r.name = 'Super Admin'
  AND r.space = 'system'
ON CONFLICT (user_id, role_id) DO NOTHING;

-- ==================== SEED PERMISSIONS FOR SYSTEM ADMINISTRATOR ====================
-- Grant all permissions (view, create, edit, delete) for all modules to System Administrator role
INSERT INTO role_permissions (role_id, module_id, menu_key, action_key, status)
SELECT 
  r.id as role_id,
  m.id as module_id,
  m.menu_key as menu_key,
  action as action_key,
  'active' as status
FROM roles r
CROSS JOIN modules m
CROSS JOIN (
  SELECT 'view' as action
  UNION ALL SELECT 'create'
  UNION ALL SELECT 'edit'
  UNION ALL SELECT 'delete'
  UNION ALL SELECT 'export'
  UNION ALL SELECT 'approve'
) actions
WHERE r.name = 'Super Admin' 
  AND r.space = 'system'
  AND m.status = 'active'
ON CONFLICT (role_id, COALESCE(menu_key, ''), action_key) DO NOTHING;

-- ==================== SEED PERMISSIONS FOR TENANT ADMIN ====================
-- Grant most permissions except system-level modules
INSERT INTO role_permissions (role_id, module_id, menu_key, action_key, status)
SELECT 
  r.id as role_id,
  m.id as module_id,
  m.menu_key as menu_key,
  action as action_key,
  'active' as status
FROM roles r
CROSS JOIN modules m
CROSS JOIN (
  SELECT 'view' as action
  UNION ALL SELECT 'create'
  UNION ALL SELECT 'edit'
  UNION ALL SELECT 'delete'
  UNION ALL SELECT 'export'
) actions
WHERE r.name = 'Tenant Admin' 
  AND r.space = 'tenant'
  AND m.space = 'tenant'
  AND m.status = 'active'
ON CONFLICT (role_id, COALESCE(menu_key, ''), action_key) DO NOTHING;

-- ==================== SEED PHILIPPINE ADDRESSES ====================
-- Only add address for System Administrator
-- Other test users will be handled by simple-seed.js

-- Address for System Administrator (admin@exitsaas.com)
INSERT INTO philippine_addresses (
  tenant_id, user_id, address_type, is_primary, label,
  unit_number, house_number, street_name, barangay, city_municipality, province, region, zip_code,
  landmark, contact_person, contact_phone, status, is_verified
)
SELECT 
  NULL, u.id, 'home', true, 'Home Address',
  'Unit 1501', 'Tower A', 'BGC High Street', 'Fort Bonifacio', 'Taguig City', 'Metro Manila', 'NCR', '1634',
  'Near Bonifacio High Street Mall', 'Super Admin', '+63 917 123 4567', 'active', true
FROM users u WHERE u.email = 'admin@exitsaas.com'
ON CONFLICT DO NOTHING;

-- Office address for System Administrator
INSERT INTO philippine_addresses (
  tenant_id, user_id, address_type, is_primary, label,
  unit_number, house_number, street_name, barangay, city_municipality, province, region, zip_code,
  landmark, contact_person, contact_phone, status, is_verified
)
SELECT 
  NULL, u.id, 'work', false, 'Office',
  '15th Floor', 'One Corporate Center', 'Julia Vargas Avenue', 'Ortigas Center', 'Pasig City', 'Metro Manila', 'NCR', '1605',
  'Beside Metrobank', 'Super Admin', '+63 917 123 4567', 'active', true
FROM users u WHERE u.email = 'admin@exitsaas.com'
ON CONFLICT DO NOTHING;

-- ==================== VERIFICATION QUERIES ====================
-- These are just comments for manual verification
-- SELECT COUNT(*) FROM tenants;
-- SELECT COUNT(*) FROM modules;
-- SELECT COUNT(*) FROM roles;
-- SELECT COUNT(*) FROM users;
-- SELECT COUNT(*) FROM user_roles;
-- SELECT COUNT(*) FROM role_permissions WHERE role_id = (SELECT id FROM roles WHERE name = 'System Administrator' AND space = 'system');
-- SELECT COUNT(*) FROM philippine_addresses;
-- SELECT u.email, u.first_name, u.last_name, COUNT(pa.id) as address_count FROM users u LEFT JOIN philippine_addresses pa ON u.id = pa.user_id GROUP BY u.id, u.email, u.first_name, u.last_name;
