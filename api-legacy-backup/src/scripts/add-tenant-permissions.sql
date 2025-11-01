-- Add missing tenant permissions to the permissions table

-- Tenant Products Permissions
INSERT INTO permissions (permission_key, resource, action, description) VALUES
('tenant-products:read', 'tenant-products', 'read', 'View tenant products'),
('tenant-products:configure', 'tenant-products', 'configure', 'Configure tenant products'),
('tenant-products:manage-settings', 'tenant-products', 'manage-settings', 'Manage tenant product settings')
ON CONFLICT (permission_key) DO NOTHING;

-- Tenant Billing Permissions
INSERT INTO permissions (permission_key, resource, action, description) VALUES
('tenant-billing:read', 'tenant-billing', 'read', 'View tenant billing information'),
('tenant-billing:view-subscriptions', 'tenant-billing', 'view-subscriptions', 'View tenant subscriptions'),
('tenant-billing:view-invoices', 'tenant-billing', 'view-invoices', 'View tenant invoices'),
('tenant-billing:manage-renewals', 'tenant-billing', 'manage-renewals', 'Manage subscription renewals'),
('tenant-billing:view-overview', 'tenant-billing', 'view-overview', 'View billing overview')
ON CONFLICT (permission_key) DO NOTHING;

-- Tenant Reports Permissions
INSERT INTO permissions (permission_key, resource, action, description) VALUES
('tenant-reports:view', 'tenant-reports', 'view', 'View tenant reports'),
('tenant-reports:product-usage', 'tenant-reports', 'product-usage', 'View product usage reports'),
('tenant-reports:user-activity', 'tenant-reports', 'user-activity', 'View user activity reports'),
('tenant-reports:billing-summary', 'tenant-reports', 'billing-summary', 'View billing summary reports'),
('tenant-reports:transactions', 'tenant-reports', 'transactions', 'View transaction reports'),
('tenant-reports:export', 'tenant-reports', 'export', 'Export tenant reports')
ON CONFLICT (permission_key) DO NOTHING;

-- Tenant Recycle Bin Permissions
INSERT INTO permissions (permission_key, resource, action, description) VALUES
('tenant-recycle-bin:view', 'tenant-recycle-bin', 'view', 'View deleted items in tenant recycle bin'),
('tenant-recycle-bin:restore', 'tenant-recycle-bin', 'restore', 'Restore deleted items from tenant recycle bin'),
('tenant-recycle-bin:view-history', 'tenant-recycle-bin', 'view-history', 'View tenant recycle bin history')
ON CONFLICT (permission_key) DO NOTHING;

-- Verify the insertions
SELECT permission_key, resource, action, description 
FROM permissions 
WHERE permission_key LIKE 'tenant-%' 
  AND permission_key NOT LIKE 'tenant-dashboard%' 
  AND permission_key NOT LIKE 'tenant-roles%'
  AND permission_key NOT LIKE 'tenant-settings%'
  AND permission_key NOT LIKE 'tenant-users%'
ORDER BY resource, action;
