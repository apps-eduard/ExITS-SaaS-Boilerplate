-- Add New Menu Permissions for Products, Reports, Subscriptions, and Analytics
-- This script adds all missing permissions for the new sidebar menu items

-- ==================== SYSTEM ADMIN PERMISSIONS ====================

-- Products Management (System Level)
INSERT INTO permissions (permission_key, resource, action, description, space) VALUES
('products:create', 'products', 'create', 'Create new products', 'system'),
('products:read', 'products', 'read', 'View products', 'system'),
('products:update', 'products', 'update', 'Edit product details', 'system'),
('products:delete', 'products', 'delete', 'Delete products', 'system'),
('products:manage-catalog', 'products', 'manage-catalog', 'Manage product catalog', 'system'),
('products:manage-mapping', 'products', 'manage-mapping', 'Manage product mapping', 'system'),
('products:manage-settings', 'products', 'manage-settings', 'Manage product settings', 'system')
ON CONFLICT (permission_key) DO NOTHING;

-- Subscriptions Management (System Level)
INSERT INTO permissions (permission_key, resource, action, description, space) VALUES
('subscriptions:create', 'subscriptions', 'create', 'Create new subscriptions', 'system'),
('subscriptions:read', 'subscriptions', 'read', 'View subscriptions', 'system'),
('subscriptions:update', 'subscriptions', 'update', 'Edit subscription details', 'system'),
('subscriptions:delete', 'subscriptions', 'delete', 'Delete subscriptions', 'system'),
('subscriptions:manage-plans', 'subscriptions', 'manage-plans', 'Manage subscription plans', 'system'),
('subscriptions:manage-renewals', 'subscriptions', 'manage-renewals', 'Manage subscription renewals', 'system')
ON CONFLICT (permission_key) DO NOTHING;

-- Reports & Analytics (System Level)
INSERT INTO permissions (permission_key, resource, action, description, space) VALUES
('reports:view', 'reports', 'view', 'View system reports', 'system'),
('reports:export', 'reports', 'export', 'Export reports', 'system'),
('reports:tenant-usage', 'reports', 'tenant-usage', 'View tenant usage reports', 'system'),
('reports:revenue', 'reports', 'revenue', 'View revenue reports', 'system'),
('reports:product-adoption', 'reports', 'product-adoption', 'View product adoption reports', 'system'),
('reports:activity-logs', 'reports', 'activity-logs', 'View system activity logs', 'system'),
('analytics:view', 'analytics', 'view', 'View analytics dashboard', 'system')
ON CONFLICT (permission_key) DO NOTHING;

-- Recycle Bin (System Level)
INSERT INTO permissions (permission_key, resource, action, description, space) VALUES
('recycle-bin:view', 'recycle-bin', 'view', 'View recycle bin', 'system'),
('recycle-bin:restore', 'recycle-bin', 'restore', 'Restore deleted items', 'system'),
('recycle-bin:permanent-delete', 'recycle-bin', 'permanent-delete', 'Permanently delete items', 'system')
ON CONFLICT (permission_key) DO NOTHING;

-- ==================== TENANT PERMISSIONS ====================

-- Products (Tenant Level)
INSERT INTO permissions (permission_key, resource, action, description, space) VALUES
('tenant-products:read', 'tenant-products', 'read', 'View tenant product catalog', 'tenant'),
('tenant-products:configure', 'tenant-products', 'configure', 'Configure tenant products', 'tenant'),
('tenant-products:manage-settings', 'tenant-products', 'manage-settings', 'Manage product settings/features', 'tenant')
ON CONFLICT (permission_key) DO NOTHING;

-- Subscriptions & Billing (Tenant Level)
INSERT INTO permissions (permission_key, resource, action, description, space) VALUES
('tenant-billing:read', 'tenant-billing', 'read', 'View tenant billing information', 'tenant'),
('tenant-billing:view-subscriptions', 'tenant-billing', 'view-subscriptions', 'View tenant subscriptions', 'tenant'),
('tenant-billing:view-invoices', 'tenant-billing', 'view-invoices', 'View tenant invoices', 'tenant'),
('tenant-billing:manage-renewals', 'tenant-billing', 'manage-renewals', 'Manage subscription renewals', 'tenant'),
('tenant-billing:view-overview', 'tenant-billing', 'view-overview', 'View billing overview', 'tenant')
ON CONFLICT (permission_key) DO NOTHING;

-- Reports (Tenant Level)
INSERT INTO permissions (permission_key, resource, action, description, space) VALUES
('tenant-reports:view', 'tenant-reports', 'view', 'View tenant reports', 'tenant'),
('tenant-reports:product-usage', 'tenant-reports', 'product-usage', 'View product usage reports', 'tenant'),
('tenant-reports:user-activity', 'tenant-reports', 'user-activity', 'View user activity reports', 'tenant'),
('tenant-reports:billing-summary', 'tenant-reports', 'billing-summary', 'View billing/payment summary', 'tenant'),
('tenant-reports:transactions', 'tenant-reports', 'transactions', 'View transaction history', 'tenant'),
('tenant-reports:export', 'tenant-reports', 'export', 'Export tenant reports', 'tenant')
ON CONFLICT (permission_key) DO NOTHING;

-- Recycle Bin (Tenant Level)
INSERT INTO permissions (permission_key, resource, action, description, space) VALUES
('tenant-recycle-bin:view', 'tenant-recycle-bin', 'view', 'View tenant recycle bin', 'tenant'),
('tenant-recycle-bin:restore', 'tenant-recycle-bin', 'restore', 'Restore deleted tenant items', 'tenant'),
('tenant-recycle-bin:view-history', 'tenant-recycle-bin', 'view-history', 'View recovery history', 'tenant')
ON CONFLICT (permission_key) DO NOTHING;

-- ==================== ASSIGN ALL PERMISSIONS TO SUPER ADMIN ====================

-- Assign all new permissions to Super Admin role
INSERT INTO role_permissions_standard (role_id, permission_id)
SELECT 
  r.id as role_id,
  p.id as permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Super Admin' 
  AND r.space = 'system'
  AND p.permission_key IN (
    -- Products
    'products:create', 'products:read', 'products:update', 'products:delete',
    'products:manage-catalog', 'products:manage-mapping', 'products:manage-settings',
    -- Subscriptions
    'subscriptions:create', 'subscriptions:read', 'subscriptions:update', 'subscriptions:delete',
    'subscriptions:manage-plans', 'subscriptions:manage-renewals',
    -- Reports & Analytics
    'reports:view', 'reports:export', 'reports:tenant-usage', 'reports:revenue',
    'reports:product-adoption', 'reports:activity-logs', 'analytics:view',
    -- Recycle Bin
    'recycle-bin:view', 'recycle-bin:restore', 'recycle-bin:permanent-delete',
    -- Tenant Products
    'tenant-products:read', 'tenant-products:configure', 'tenant-products:manage-settings',
    -- Tenant Billing
    'tenant-billing:read', 'tenant-billing:view-subscriptions', 'tenant-billing:view-invoices',
    'tenant-billing:manage-renewals', 'tenant-billing:view-overview',
    -- Tenant Reports
    'tenant-reports:view', 'tenant-reports:product-usage', 'tenant-reports:user-activity',
    'tenant-reports:billing-summary', 'tenant-reports:transactions', 'tenant-reports:export',
    -- Tenant Recycle Bin
    'tenant-recycle-bin:view', 'tenant-recycle-bin:restore', 'tenant-recycle-bin:view-history'
  )
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ==================== VERIFICATION ====================

-- Count total permissions
SELECT 
  'Total Permissions' as metric,
  COUNT(*) as count
FROM permissions
UNION ALL
SELECT 
  'Super Admin Permissions' as metric,
  COUNT(*) as count
FROM role_permissions_standard rps
JOIN roles r ON rps.role_id = r.id
WHERE r.name = 'Super Admin' AND r.space = 'system'
UNION ALL
SELECT 
  'System Permissions' as metric,
  COUNT(*) as count
FROM permissions
WHERE space = 'system'
UNION ALL
SELECT 
  'Tenant Permissions' as metric,
  COUNT(*) as count
FROM permissions
WHERE space = 'tenant';

-- Display all new permissions
SELECT 
  permission_key,
  resource,
  action,
  space,
  description
FROM permissions
WHERE permission_key LIKE '%products%'
   OR permission_key LIKE '%subscriptions%'
   OR permission_key LIKE '%reports%'
   OR permission_key LIKE '%analytics%'
   OR permission_key LIKE '%recycle-bin%'
ORDER BY space, resource, action;

-- Verify Super Admin has all permissions
SELECT 
  r.name as role_name,
  COUNT(DISTINCT p.id) as permission_count,
  COUNT(DISTINCT p.resource) as resource_count
FROM roles r
JOIN role_permissions_standard rps ON r.id = rps.role_id
JOIN permissions p ON rps.permission_id = p.id
WHERE r.name = 'Super Admin' AND r.space = 'system'
GROUP BY r.name;

