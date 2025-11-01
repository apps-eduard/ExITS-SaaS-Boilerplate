-- Verify and fix superadmin permissions
-- Run this to check and assign System Administrator role to admin@system.com

-- 1. Check if admin user exists
SELECT id, email, status FROM users WHERE email = 'admin@system.com';

-- 2. Check System Administrator role
SELECT id, name, space, status FROM roles WHERE name = 'System Administrator' AND space = 'system';

-- 3. Check if admin has System Administrator role assigned
SELECT 
  u.email,
  r.name as role_name,
  ur.assigned_at
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'admin@system.com';

-- 4. Check permissions count for System Administrator role
SELECT 
  r.name as role_name,
  COUNT(rp.id) as permission_count
FROM roles r
LEFT JOIN role_permissions rp ON r.id = rp.role_id
WHERE r.name = 'System Administrator' AND r.space = 'system'
GROUP BY r.id, r.name;

-- 5. If admin doesn't have role, assign it:
-- INSERT INTO user_roles (user_id, role_id)
-- SELECT 
--   (SELECT id FROM users WHERE email = 'admin@system.com'),
--   (SELECT id FROM roles WHERE name = 'System Administrator' AND space = 'system' LIMIT 1)
-- ON CONFLICT (user_id, role_id) DO NOTHING;

-- 6. Verify admin's permissions
SELECT 
  m.menu_key,
  rp.action_key,
  m.display_name
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN modules m ON rp.module_id = m.id
WHERE u.email = 'admin@system.com'
ORDER BY m.menu_key, rp.action_key;
