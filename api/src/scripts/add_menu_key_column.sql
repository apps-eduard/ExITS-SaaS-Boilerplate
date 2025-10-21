-- Add menu_key column and update constraints
ALTER TABLE role_permissions DROP CONSTRAINT IF EXISTS unique_permission;
ALTER TABLE role_permissions ADD COLUMN IF NOT EXISTS menu_key VARCHAR(100);
CREATE UNIQUE INDEX IF NOT EXISTS idx_role_permissions_unique 
  ON role_permissions(role_id, COALESCE(menu_key, ''), action_key);
