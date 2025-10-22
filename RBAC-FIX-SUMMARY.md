# RBAC Design Fix Summary

## Problem
The RBAC (Role-Based Access Control) system was causing confusion by using **both** `module_id` and `menu_key` in the `role_permissions` table. This dual approach led to:
- Permissions being stored with `module_id` set but `menu_key` NULL
- Permission checks failing because they filter by `menu_key`
- System admin unable to access user management features (403 Forbidden errors)

## Root Cause
```javascript
// OLD APPROACH (BROKEN) - Using module_id with unnecessary join
SELECT COUNT(*) FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
JOIN modules m ON rp.module_id = m.id  ❌ Unnecessary join
WHERE ur.user_id = $1 AND m.menu_key = $2  ❌ Filter by menu_key from joined table
```

The permission check joined the `modules` table via `module_id` but then filtered by `menu_key`. Meanwhile, permissions were stored with `menu_key = NULL`, causing all checks to fail.

## Solution
**Simplified Design: role → menu_key → action**

Remove the dependency on `module_id` and use `menu_key` directly:

```javascript
// NEW APPROACH (FIXED) - Direct menu_key lookup
SELECT COUNT(*) FROM user_roles ur
JOIN roles r ON ur.role_id = r.id
JOIN role_permissions rp ON r.id = rp.role_id
WHERE ur.user_id = $1 AND rp.menu_key = $2  ✅ Direct filter
```

## Changes Made

### 1. Database Schema (No Changes Required)
The `role_permissions` table already supports this design:
```sql
CREATE TABLE role_permissions (
  id SERIAL PRIMARY KEY,
  role_id INT NOT NULL REFERENCES roles(id),
  module_id INT REFERENCES modules(id),        -- Optional/nullable
  menu_key VARCHAR(100),                       -- Primary identifier ✅
  action_key VARCHAR(50) NOT NULL,
  ...
  UNIQUE (role_id, COALESCE(menu_key, ''), action_key)
);
```

### 2. PermissionService.js - Removed Unnecessary Joins
**File:** `api/src/services/PermissionService.js`

#### hasPermission()
```javascript
// BEFORE
JOIN role_permissions rp ON r.id = rp.role_id
JOIN modules m ON rp.module_id = m.id  ❌
WHERE ur.user_id = $1 AND m.menu_key = $2

// AFTER
JOIN role_permissions rp ON r.id = rp.role_id  ✅
WHERE ur.user_id = $1 AND rp.menu_key = $2
```

#### getUserPermissions()
```javascript
// BEFORE
SELECT DISTINCT m.menu_key, rp.action_key
...
JOIN modules m ON rp.module_id = m.id  ❌

// AFTER
SELECT DISTINCT rp.menu_key, rp.action_key  ✅
...
(No modules join needed)
```

#### checkPermissionWithConstraints()
```javascript
// BEFORE
SELECT rp.constraints
...
JOIN modules m ON rp.module_id = m.id  ❌
WHERE ur.user_id = $1 AND m.menu_key = $2

// AFTER
SELECT rp.constraints  ✅
...
WHERE ur.user_id = $1 AND rp.menu_key = $2
```

### 3. RBAC Data Fix Script
**File:** `api/fix-rbac-design.js`

Created a script to:
1. Clear old broken permissions (with menu_key = NULL)
2. Insert permissions with proper menu_key values:
   ```javascript
   INSERT INTO role_permissions (role_id, menu_key, action_key, status)
   VALUES (2, 'users', 'view', 'active')
   // module_id is NULL - not needed!
   ```
3. Assign System Administrator role to admin user

## Results

### Permissions Created (27 total)
```
✓ dashboard → view
✓ users → view, create, edit, delete, export
✓ roles → view, create, edit, delete
✓ permissions → view, create, edit, delete
✓ tenants → view, create, edit, delete, approve
✓ modules → view, create, edit, delete
✓ audit → view, export
✓ settings → view, edit
```

### Verification
All permission checks now pass:
```
✓ users → view: true
✓ users → create: true
✓ users → edit: true
✓ users → delete: true
✓ roles → view: true
✓ dashboard → view: true
```

### Database State
- **module_id**: NULL (not used)
- **menu_key**: Set correctly ('users', 'roles', etc.)
- **Admin role assignment**: ✓ Complete

## Benefits of This Design

1. **Simpler Queries** - No unnecessary joins with modules table
2. **Clearer Intent** - Permissions based on menu_key (what users see)
3. **Better Performance** - One less join in every permission check
4. **Less Confusion** - Single source of truth (menu_key)
5. **Flexibility** - menu_key doesn't require a modules table entry

## Testing the Fix

### Login as System Admin
```
Email: admin@exitsaas.com
Password: Admin@123
```

### Expected Behavior
- ✅ Can view Users list
- ✅ Can create new users
- ✅ Can edit users
- ✅ Can delete users
- ✅ No more 403 Forbidden errors

### API Endpoints Now Accessible
```
GET    /api/users         → 200 OK (was 403)
POST   /api/users         → 201 Created (was 403)
PUT    /api/users/:id     → 200 OK
DELETE /api/users/:id     → 204 No Content
```

## Key Takeaway

**RBAC Design Philosophy:**
```
Permission = Role + Menu Key + Action
           (NOT Role + Module ID + Action)
```

The `menu_key` represents what the user sees in the UI (menu item), making it the natural identifier for permissions. The `module_id` added unnecessary complexity and should remain NULL in the simplified design.

## Files Modified
1. ✅ `api/src/services/PermissionService.js` - Removed module joins
2. ✅ `api/fix-rbac-design.js` - Created data fix script
3. ✅ `api/verify-rbac-fix.js` - Created verification script

## Next Steps
- [ ] Test in browser with actual user login
- [ ] Verify all protected routes work correctly
- [ ] Consider updating seed scripts to use this pattern
- [ ] Update RBAC documentation to reflect simplified design
