# ✅ RBAC System - Menu & Permissions Fixed

## Summary of Changes

### Issue Found & Fixed
The system admin and tenant admin had NO menus showing because:

1. **Root Cause**: `simple-seed.js` was inserting role_permissions WITHOUT the `module_id` field
   - The RBACService query joins on `module_id`, so permissions without it returned ZERO rows
   - Result: All users appeared to have no permissions

2. **Secondary Issue**: Module space assignments weren't correct
   - Some menus were incorrectly marked as 'system' when they should be 'tenant'
   - System admin couldn't see all appropriate menus

### Fixes Applied

#### 1. Fixed simple-seed.js Permission Insertion ✅
**Before:**
```javascript
INSERT INTO role_permissions (role_id, menu_key, action_key, status)
VALUES ($1, $2, $3, $4)
```

**After:**
```javascript
INSERT INTO role_permissions (role_id, module_id, menu_key, action_key, status)
SELECT $1, m.id, m.menu_key, $2, 'active'
FROM modules m
WHERE m.menu_key = $3 AND m.status = 'active'
```

Now permissions are created WITH the correct `module_id`!

#### 2. Fixed seed.sql Module Space Assignments ✅
Updated module space values:
- `dashboard` → 'tenant' (was 'system')
- `users` → 'tenant' (was 'system')
- `roles` → 'tenant' (was 'system')
- `audit` → 'tenant' (was 'system')
- `settings` → 'tenant' (was 'system')
- `permissions` → 'system' ✓
- `tenants` → 'system' ✓
- `modules` → 'system' ✓

#### 3. Updated Permission Grants ✅
**System Administrator** now gets:
- All modules (system + tenant) with all actions
- Total: 40 permissions (8 modules × 5 actions)

**Tenant Administrator** now gets:
- Only tenant-space modules with full actions
- Modules: dashboard, users, roles, audit, settings
- Total: 20 permissions per tenant

### Current Database State

**Available Menus:**
- System Space: tenants, permissions, modules
- Tenant Space: dashboard, users, roles, audit, settings

**User Permissions:**

| User | Tenant | Role | Menus | Count |
|------|--------|------|-------|-------|
| admin@exitsaas.com | System | System Administrator | All 8 | 40+ |
| admin-1@example.com | ACME (ID: 2) | Tenant Administrator | 5 tenant menus | 20+ |
| admin-2@example.com | TechStartup (ID: 3) | Tenant Administrator | 5 tenant menus | 20+ |
| admin-3@example.com | Enterprise (ID: 4) | Tenant Administrator | 5 tenant menus | 20+ |

### Test with Updated Permissions

**System Admin Login:**
```
Email: admin@exitsaas.com
Password: Admin@123
Expected: See Dashboard, Users, Roles, Audit, Settings, Tenants, Permissions, Modules
```

**Tenant Admin Login:**
```
Email: admin-1@example.com
Password: Admin@123
Expected: See Dashboard, Users, Roles, Audit, Settings (not system menus)
```

### Files Modified

1. **api/src/scripts/seed.sql**
   - Fixed module space assignments
   - Updated permission grant queries

2. **api/simple-seed.js**
   - Fixed role_permissions insertion to include module_id
   - Now joins with modules table to get correct module_id

3. **setup.ps1**
   - Removed automatic server startup (manual start required)

### How to Run

```powershell
# Run complete setup with fresh database
.\setup.ps1 -ResetDb -SkipInstall

# Then manually start servers
cd api; npm start
# In another terminal:
cd web; npm start
```

### Verification Commands

```bash
# Check menu permissions in database
node api/check-menus.js

# Login and verify menus appear in UI
# Admin should see: Dashboard, Users, Roles, Settings, Audit, Tenants, Permissions
# Tenant should see: Dashboard, Users, Roles, Settings, Audit
```

## Result
✅ **All users now have menus showing correctly based on their role and tenant scope!**
