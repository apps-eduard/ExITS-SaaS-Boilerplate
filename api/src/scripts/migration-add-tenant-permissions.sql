-- Migration: Add missing tenant permissions for Billing, Reports, and Recycle Bin
-- Date: 2025-10-24
-- Description: Adds the missing tenant-level permissions that were not included in the initial migration

-- ==================== ADD TENANT BILLING PERMISSIONS ====================
INSERT INTO permissions (permission_key, resource, action, description, space) VALUES
  ('tenant-billing:read', 'tenant-billing', 'read', 'View tenant billing information', 'tenant'),
  ('tenant-billing:view-subscriptions', 'tenant-billing', 'view-subscriptions', 'View tenant subscriptions', 'tenant'),
  ('tenant-billing:view-invoices', 'tenant-billing', 'view-invoices', 'View tenant invoices', 'tenant'),
  ('tenant-billing:manage-renewals', 'tenant-billing', 'manage-renewals', 'Manage subscription renewals', 'tenant'),
  ('tenant-billing:view-overview', 'tenant-billing', 'view-overview', 'View billing overview', 'tenant')
ON CONFLICT (permission_key) DO NOTHING;

-- ==================== ADD TENANT REPORTS PERMISSIONS ====================
INSERT INTO permissions (permission_key, resource, action, description, space) VALUES
  ('tenant-reports:view', 'tenant-reports', 'view', 'View tenant reports', 'tenant'),
  ('tenant-reports:product-usage', 'tenant-reports', 'product-usage', 'View product usage reports', 'tenant'),
  ('tenant-reports:user-activity', 'tenant-reports', 'user-activity', 'View user activity reports', 'tenant'),
  ('tenant-reports:billing-summary', 'tenant-reports', 'billing-summary', 'View billing/payment summary', 'tenant'),
  ('tenant-reports:transactions', 'tenant-reports', 'transactions', 'View transaction history', 'tenant'),
  ('tenant-reports:export', 'tenant-reports', 'export', 'Export tenant reports', 'tenant')
ON CONFLICT (permission_key) DO NOTHING;

-- ==================== ADD TENANT RECYCLE BIN PERMISSIONS ====================
INSERT INTO permissions (permission_key, resource, action, description, space) VALUES
  ('tenant-recycle-bin:view', 'tenant-recycle-bin', 'view', 'View tenant recycle bin', 'tenant'),
  ('tenant-recycle-bin:restore', 'tenant-recycle-bin', 'restore', 'Restore deleted tenant items', 'tenant'),
  ('tenant-recycle-bin:view-history', 'tenant-recycle-bin', 'view-history', 'View recovery history', 'tenant')
ON CONFLICT (permission_key) DO NOTHING;

-- ==================== ASSIGN PERMISSIONS TO SUPER ADMIN ====================
-- Assign all new tenant permissions to Super Admin role
INSERT INTO role_permissions_standard (role_id, permission_id)
SELECT 
  r.id as role_id,
  p.id as permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Super Admin' 
  AND r.space = 'system'
  AND p.space = 'tenant'
  AND (p.permission_key LIKE '%tenant-billing%' 
    OR p.permission_key LIKE '%tenant-reports%' 
    OR p.permission_key LIKE '%tenant-recycle%')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ==================== ASSIGN PERMISSIONS TO TENANT ADMIN ====================
-- Assign all new tenant permissions to all Tenant Admin roles
INSERT INTO role_permissions_standard (role_id, permission_id)
SELECT 
  r.id as role_id,
  p.id as permission_id
FROM roles r
CROSS JOIN permissions p
WHERE r.name = 'Tenant Admin' 
  AND r.space = 'tenant'
  AND p.space = 'tenant'
  AND (p.permission_key LIKE '%tenant-billing%' 
    OR p.permission_key LIKE '%tenant-reports%' 
    OR p.permission_key LIKE '%tenant-recycle%')
ON CONFLICT (role_id, permission_id) DO NOTHING;

-- ==================== VERIFICATION ====================
-- Verify the permissions were added correctly
SELECT 
  'Tenant Billing' as category,
  COUNT(*) as permission_count
FROM permissions 
WHERE permission_key LIKE '%tenant-billing%'

UNION ALL

SELECT 
  'Tenant Reports' as category,
  COUNT(*) as permission_count
FROM permissions 
WHERE permission_key LIKE '%tenant-reports%'

UNION ALL

SELECT 
  'Tenant Recycle Bin' as category,
  COUNT(*) as permission_count
FROM permissions 
WHERE permission_key LIKE '%tenant-recycle%';

-- Verify role assignments
SELECT 
  r.name as role_name,
  r.space,
  COUNT(rps.permission_id) as assigned_permissions
FROM roles r
LEFT JOIN role_permissions_standard rps ON r.id = rps.role_id
LEFT JOIN permissions p ON rps.permission_id = p.id
WHERE (r.name = 'Super Admin' OR r.name = 'Tenant Admin')
  AND p.permission_key IN (
    'tenant-billing:read', 'tenant-billing:view-subscriptions', 'tenant-billing:view-invoices',
    'tenant-billing:manage-renewals', 'tenant-billing:view-overview',
    'tenant-reports:view', 'tenant-reports:product-usage', 'tenant-reports:user-activity',
    'tenant-reports:billing-summary', 'tenant-reports:transactions', 'tenant-reports:export',
    'tenant-recycle-bin:view', 'tenant-recycle-bin:restore', 'tenant-recycle-bin:view-history'
  )
GROUP BY r.name, r.space
ORDER BY r.name;