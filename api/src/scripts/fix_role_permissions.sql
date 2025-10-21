-- Clean up duplicates and update constraints
ALTER TABLE role_permissions DROP CONSTRAINT IF EXISTS unique_permission;

-- Delete duplicate entries (keeping the most recent)
DELETE FROM role_permissions a USING role_permissions b
WHERE a.id < b.id 
  AND a.role_id = b.role_id 
  AND COALESCE(a.menu_key, '') = COALESCE(b.menu_key, '')
  AND a.action_key = b.action_key;

-- Create new unique index
CREATE UNIQUE INDEX IF NOT EXISTS idx_role_permissions_unique 
  ON role_permissions(role_id, COALESCE(menu_key, ''), action_key);
