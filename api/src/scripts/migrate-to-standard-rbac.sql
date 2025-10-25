-- Migration to Standard RBAC (resource:action format)
-- Run this migration to implement industry-standard RBAC

-- Step 1: Create permissions table
CREATE TABLE IF NOT EXISTS permissions (
  id SERIAL PRIMARY KEY,
  permission_key VARCHAR(100) NOT NULL UNIQUE, -- e.g., "users:create"
  resource VARCHAR(50) NOT NULL,               -- e.g., "users"
  action VARCHAR(50) NOT NULL,                 -- e.g., "create"
  description TEXT,
  space VARCHAR(20) DEFAULT 'system',          -- 'system', 'tenant', or 'both'
  created_at TIMESTAMP DEFAULT NOW()
);

-- Step 2: Create new role_permissions table (standard many-to-many)
CREATE TABLE IF NOT EXISTS role_permissions (
  role_id INT NOT NULL REFERENCES roles(id) ON DELETE CASCADE,
  permission_id INT NOT NULL REFERENCES permissions(id) ON DELETE CASCADE,
  created_at TIMESTAMP DEFAULT NOW(),
  PRIMARY KEY (role_id, permission_id)
);

-- Step 3: Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_permissions_key ON permissions(permission_key);
CREATE INDEX IF NOT EXISTS idx_permissions_resource ON permissions(resource);
CREATE INDEX IF NOT EXISTS idx_permissions_space ON permissions(space);
CREATE INDEX IF NOT EXISTS idx_role_permissions_std_role ON role_permissions(role_id);
CREATE INDEX IF NOT EXISTS idx_role_permissions_std_perm ON role_permissions(permission_id);

-- Step 4: Insert standard permissions

-- System Admin Permissions (Users)
INSERT INTO permissions (permission_key, resource, action, description, space) VALUES
('users:create', 'users', 'create', 'Create new users', 'system'),
('users:read', 'users', 'read', 'View users', 'system'),
('users:update', 'users', 'update', 'Edit user details', 'system'),
('users:delete', 'users', 'delete', 'Delete users', 'system'),
('users:invite', 'users', 'invite', 'Send user invitations', 'system'),
('users:assign-roles', 'users', 'assign-roles', 'Assign roles to users', 'system')
ON CONFLICT (permission_key) DO NOTHING;

-- System Admin Permissions (Tenants)
INSERT INTO permissions (permission_key, resource, action, description, space) VALUES
('tenants:create', 'tenants', 'create', 'Create new tenants', 'system'),
('tenants:read', 'tenants', 'read', 'View tenants', 'system'),
('tenants:update', 'tenants', 'update', 'Edit tenant details', 'system'),
('tenants:delete', 'tenants', 'delete', 'Delete tenants', 'system'),
('tenants:manage-subscriptions', 'tenants', 'manage-subscriptions', 'Manage tenant subscriptions', 'system')
ON CONFLICT (permission_key) DO NOTHING;

-- System & Tenant Permissions (Roles)
INSERT INTO permissions (permission_key, resource, action, description, space) VALUES
('roles:create', 'roles', 'create', 'Create new roles', 'both'),
('roles:read', 'roles', 'read', 'View roles', 'both'),
('roles:update', 'roles', 'update', 'Edit role details', 'both'),
('roles:delete', 'roles', 'delete', 'Delete roles', 'both'),
('roles:assign-permissions', 'roles', 'assign-permissions', 'Assign permissions to roles', 'both')
ON CONFLICT (permission_key) DO NOTHING;

-- System Permissions (Billing)
INSERT INTO permissions (permission_key, resource, action, description, space) VALUES
('billing:create', 'billing', 'create', 'Create billing plans', 'system'),
('billing:read', 'billing', 'read', 'View billing information', 'system'),
('billing:edit', 'billing', 'edit', 'Edit billing plans', 'system'),
('billing:delete', 'billing', 'delete', 'Delete billing plans', 'system'),
('billing:manage-plans', 'billing', 'manage-plans', 'Manage billing plans', 'system'),
('billing:view-invoices', 'billing', 'view-invoices', 'View invoices', 'system')
ON CONFLICT (permission_key) DO NOTHING;

-- System Permissions (System)
INSERT INTO permissions (permission_key, resource, action, description, space) VALUES
('system:create', 'system', 'create', 'Create system resources', 'system'),
('system:read', 'system', 'read', 'View system resources', 'system'),
('system:edit', 'system', 'edit', 'Edit system resources', 'system'),
('system:delete', 'system', 'delete', 'Delete system resources', 'system'),
('system:view-health', 'system', 'view-health', 'View system health', 'system'),
('system:view-performance', 'system', 'view-performance', 'View system performance', 'system'),
('system:manage-config', 'system', 'manage-config', 'Manage system configuration', 'system'),
('dashboard:view', 'dashboard', 'view', 'View system dashboard', 'system')
ON CONFLICT (permission_key) DO NOTHING;

-- Tenant Permissions (Users)
INSERT INTO permissions (permission_key, resource, action, description, space) VALUES
('tenant-users:create', 'tenant-users', 'create', 'Create tenant users', 'tenant'),
('tenant-users:read', 'tenant-users', 'read', 'View tenant users', 'tenant'),
('tenant-users:update', 'tenant-users', 'update', 'Edit tenant users', 'tenant'),
('tenant-users:delete', 'tenant-users', 'delete', 'Delete tenant users', 'tenant'),
('tenant-users:invite', 'tenant-users', 'invite', 'Invite tenant users', 'tenant'),
('tenant-users:assign-roles', 'tenant-users', 'assign-roles', 'Assign roles to tenant users', 'tenant')
ON CONFLICT (permission_key) DO NOTHING;

-- Tenant Permissions (Roles)
INSERT INTO permissions (permission_key, resource, action, description, space) VALUES
('tenant-roles:create', 'tenant-roles', 'create', 'Create tenant roles', 'tenant'),
('tenant-roles:read', 'tenant-roles', 'read', 'View tenant roles', 'tenant'),
('tenant-roles:update', 'tenant-roles', 'update', 'Edit tenant roles', 'tenant'),
('tenant-roles:delete', 'tenant-roles', 'delete', 'Delete tenant roles', 'tenant')
ON CONFLICT (permission_key) DO NOTHING;

-- Tenant Permissions (Dashboard)
INSERT INTO permissions (permission_key, resource, action, description, space) VALUES
('tenant-dashboard:view', 'tenant-dashboard', 'view', 'View tenant dashboard', 'tenant')
ON CONFLICT (permission_key) DO NOTHING;

-- Tenant Permissions (Loans - Example Module)
INSERT INTO permissions (permission_key, resource, action, description, space) VALUES
('loans:create', 'loans', 'create', 'Create loans', 'tenant'),
('loans:read', 'loans', 'read', 'View loans', 'tenant'),
('loans:update', 'loans', 'update', 'Edit loans', 'tenant'),
('loans:delete', 'loans', 'delete', 'Delete loans', 'tenant'),
('loans:approve', 'loans', 'approve', 'Approve loans', 'tenant'),
('loans:disburse', 'loans', 'disburse', 'Disburse loans', 'tenant')
ON CONFLICT (permission_key) DO NOTHING;

-- Tenant Permissions (Payments)
INSERT INTO permissions (permission_key, resource, action, description, space) VALUES
('payments:create', 'payments', 'create', 'Record payments', 'tenant'),
('payments:read', 'payments', 'read', 'View payments', 'tenant'),
('payments:update', 'payments', 'update', 'Edit payments', 'tenant'),
('payments:delete', 'payments', 'delete', 'Delete payments', 'tenant')
ON CONFLICT (permission_key) DO NOTHING;

-- Tenant Permissions (Reports)
INSERT INTO permissions (permission_key, resource, action, description, space) VALUES
('reports:read', 'reports', 'read', 'View reports', 'tenant'),
('reports:export', 'reports', 'export', 'Export reports', 'tenant'),
('reports:financial', 'reports', 'financial', 'View financial reports', 'tenant')
ON CONFLICT (permission_key) DO NOTHING;

-- Tenant Permissions (Settings)
INSERT INTO permissions (permission_key, resource, action, description, space) VALUES
('tenant-settings:read', 'tenant-settings', 'read', 'View tenant settings', 'tenant'),
('tenant-settings:update', 'tenant-settings', 'update', 'Update tenant settings', 'tenant')
ON CONFLICT (permission_key) DO NOTHING;

-- Step 5: Migrate existing role_permissions to new format
-- This maps old menu_key:action to new permission_key format
INSERT INTO role_permissions (role_id, permission_id)
SELECT DISTINCT 
  rp.role_id,
  p.id
FROM role_permissions rp
JOIN permissions p ON p.permission_key = rp.menu_key || ':' || rp.action_key
WHERE NOT EXISTS (
  SELECT 1 FROM role_permissions rps 
  WHERE rps.role_id = rp.role_id AND rps.permission_id = p.id
);

-- Step 6: Create view for backward compatibility (optional)
CREATE OR REPLACE VIEW v_user_permissions AS
SELECT 
  ur.user_id,
  p.permission_key,
  p.resource,
  p.action,
  p.description,
  p.space
FROM user_roles ur
JOIN role_permissions rps ON ur.role_id = rps.role_id
JOIN permissions p ON rps.permission_id = p.id;

-- Step 7: Add comments for documentation
COMMENT ON TABLE permissions IS 'Standard RBAC permissions using resource:action format';
COMMENT ON COLUMN permissions.permission_key IS 'Unique permission identifier in format resource:action (e.g., users:create)';
COMMENT ON COLUMN permissions.resource IS 'Resource being accessed (e.g., users, tenants, loans)';
COMMENT ON COLUMN permissions.action IS 'Action being performed (e.g., create, read, update, delete)';
COMMENT ON COLUMN permissions.space IS 'Permission scope: system, tenant, or both';

COMMENT ON TABLE role_permissions IS 'Standard many-to-many relationship between roles and permissions';

-- Migration complete!
-- Next steps:
-- 1. Update backend to use new permissions table
-- 2. Update frontend to check permissions with resource:action format
-- 3. Once verified working, can drop old role_permissions table: DROP TABLE role_permissions;
