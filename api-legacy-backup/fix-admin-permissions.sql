-- Fix System Administrator permissions
-- Delete existing and recreate all 23 permissions

BEGIN;

-- Delete all permissions for System Administrator role
DELETE FROM role_permissions WHERE role_id = 1;

-- Insert all permissions for System Administrator with both module_id and menu_key
INSERT INTO role_permissions (role_id, module_id, menu_key, action_key, status)
SELECT 1, m.id, m.menu_key, action, 'active'
FROM modules m
CROSS JOIN (
  SELECT unnest(ARRAY['view', 'create', 'edit', 'delete']) AS action
) actions
WHERE m.menu_key IN ('dashboard', 'users', 'roles', 'permissions', 'tenants', 'modules', 'audit', 'settings');

-- Verify
SELECT COUNT(*) as total_permissions FROM role_permissions WHERE role_id = 1;

COMMIT;
