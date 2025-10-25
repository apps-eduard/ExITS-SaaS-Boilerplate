-- Check current user role assignments
SELECT 
    u.id as user_id,
    u.email,
    u.first_name,
    u.last_name,
    r.id as role_id,
    r.name as role_name,
    r.description,
    r.space,
    ur.assigned_at
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'e@mail.com'
ORDER BY ur.assigned_at DESC;

-- Check all available tenant roles
SELECT id, name, description, space, status
FROM roles
WHERE space = 'tenant' AND status = 'active'
ORDER BY name;

-- To remove the Tenant Admin role and assign Dashboard Only role:
-- (Don't run these yet - just for reference)

-- Step 1: Find the Dashboard Only role ID
-- SELECT id, name FROM roles WHERE name LIKE '%Dashboard%' AND space = 'tenant';

-- Step 2: Remove current role assignment (replace user_id and role_id)
-- DELETE FROM user_roles WHERE user_id = 8 AND role_id = 2;

-- Step 3: Assign new role (replace user_id and new_role_id)
-- INSERT INTO user_roles (user_id, role_id, assigned_at)
-- VALUES (8, [dashboard_only_role_id], CURRENT_TIMESTAMP);
