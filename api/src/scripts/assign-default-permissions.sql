-- Assign default full permissions to all existing users
-- This script creates a default "Super Admin" role with all permissions
-- and assigns it to all existing users

-- Step 1: Create Super Admin role if it doesn't exist
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM roles WHERE name = 'Super Admin') THEN
    INSERT INTO roles (name, description, space, status, created_at)
    VALUES ('Super Admin', 'Full system access with all permissions', 'system', 'active', NOW());
  END IF;
END $$;

-- Step 2: Get the Super Admin role ID
DO $$
DECLARE
  super_admin_role_id INT;
  permission_record RECORD;
  user_record RECORD;
BEGIN
  -- Get Super Admin role ID
  SELECT id INTO super_admin_role_id FROM roles WHERE name = 'Super Admin' LIMIT 1;
  
  IF super_admin_role_id IS NULL THEN
    RAISE EXCEPTION 'Super Admin role not found';
  END IF;
  
  RAISE NOTICE 'Super Admin role ID: %', super_admin_role_id;
  
  -- Assign ALL permissions to Super Admin role
  FOR permission_record IN 
    SELECT id FROM permissions
  LOOP
    INSERT INTO role_permissions_standard (role_id, permission_id)
    VALUES (super_admin_role_id, permission_record.id)
    ON CONFLICT (role_id, permission_id) DO NOTHING;
  END LOOP;
  
  -- Assign Super Admin role to ALL existing users
  FOR user_record IN 
    SELECT id FROM users WHERE status = 'active'
  LOOP
    INSERT INTO user_roles (user_id, role_id, created_at)
    VALUES (user_record.id, super_admin_role_id, NOW())
    ON CONFLICT (user_id, role_id) DO NOTHING;
  END LOOP;
  
  RAISE NOTICE 'Super Admin role created and assigned to all users with all permissions';
END $$;

-- Step 3: Verify the assignment
SELECT 
  u.id AS user_id,
  u.email,
  u.first_name,
  u.last_name,
  r.name AS role_name,
  COUNT(DISTINCT p.permission_key) AS permission_count
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
JOIN role_permissions_standard rps ON r.id = rps.role_id
JOIN permissions p ON rps.permission_id = p.id
WHERE u.status = 'active'
GROUP BY u.id, u.email, u.first_name, u.last_name, r.name
ORDER BY u.id;

-- Show sample permissions for first user
SELECT 
  u.email,
  p.permission_key,
  p.resource,
  p.action
FROM users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
JOIN role_permissions_standard rps ON r.id = rps.role_id
JOIN permissions p ON rps.permission_id = p.id
WHERE u.status = 'active'
ORDER BY u.id, p.resource, p.action
LIMIT 20;
