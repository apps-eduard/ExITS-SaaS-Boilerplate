-- Add missing permissions that are used in the role editor but not in the database

-- System Permissions (Permissions Management)
INSERT INTO permissions (permission_key, resource, action, description, space) VALUES
('permissions:view', 'permissions', 'view', 'View permissions', 'system'),
('permissions:assign', 'permissions', 'assign', 'Assign permissions', 'system')
ON CONFLICT (permission_key) DO NOTHING;

-- System Permissions (Monitoring)
INSERT INTO permissions (permission_key, resource, action, description, space) VALUES
('monitoring:view', 'monitoring', 'view', 'View system monitoring', 'system')
ON CONFLICT (permission_key) DO NOTHING;

-- Display all permissions for verification
SELECT permission_key, resource, action, space 
FROM permissions 
ORDER BY space, resource, action;
