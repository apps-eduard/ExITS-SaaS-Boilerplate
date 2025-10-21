# RBAC (Role-Based Access Control) Guide

Complete guide to the RBAC system in ExITS-SaaS-Boilerplate.

## Overview

The RBAC system is data-driven, meaning:
- No hardcoded permissions
- Permissions stored in database
- Roles can be created/modified at runtime
- Menus and actions are dynamically registered
- Permissions checked at every request

## Core Concepts

### 1. Modules (Menu Items)

A module represents a feature or page in the application.

```
Examples:
- Dashboard (top-level, no children)
- Loans (parent, has children)
  ├─ List Loans
  ├─ Create Loan
  ├─ Loan Details
  └─ Approve Loan
- Users (parent, has children)
  ├─ List Users
  └─ Create User
```

Each module has:
- `menu_key`: Unique identifier (e.g., 'loans')
- `display_name`: Label shown in UI (e.g., 'Loans')
- `parent_menu_key`: NULL for top-level, or reference to parent
- `icon`: Display icon
- `space`: 'system' or 'tenant'
- `action_keys`: Available actions (["view", "create", "edit", "delete", "approve"])

### 2. Roles

A role is a collection of permissions.

```
Examples:
- System Super Admin (all permissions)
- Loan Officer (specific permissions)
- Cashier (limited permissions)
- Viewer (read-only)
```

Each role has:
- `role_name`: Display name
- `space`: 'system' or 'tenant'
- `parent_role_id`: For inheritance (optional)

### 3. Permissions

A permission grants a user/role access to perform an action on a module.

```
Permission = Module + Action

Examples:
- loans:view (can view loans)
- loans:create (can create loans)
- loans:edit (can edit loans)
- loans:delete (can delete loans)
- loans:approve (can approve loans)
```

### 4. Users

Users have roles assigned, which grant them permissions.

```
User → Roles → Permissions → Access to features
```

## Permission Structure

### Menu Key Permission

Shows/hides a menu item in the sidebar.

```
menu_key: 'loans'

If user has permission for 'loans:view':
  - Show "Loans" menu item ✅
  
If user does NOT have permission:
  - Hide "Loans" menu item ❌
```

### Action Key Permission

Shows/hides/disables buttons in the UI.

```
action_key: 'create'

If user has permission for 'loans:create':
  - Show "Create Loan" button ✅
  - Button is ENABLED
  
If user does NOT have permission:
  - Hide "Create Loan" button ❌
  - Or disable with tooltip
```

## Permission Levels

### View Permission
User can see and read data.
```
Permission: module:view
Effect: Can access page, can see data, cannot make changes
```

### Create Permission
User can create new records.
```
Permission: module:create
Effect: "Create" button visible, can submit new record
```

### Edit Permission
User can modify existing records.
```
Permission: module:edit
Effect: "Edit" button visible, can modify record
```

### Delete Permission
User can remove records.
```
Permission: module:delete
Effect: "Delete" button visible, confirmation required
```

### Special Permissions
```
Permission: module:approve
Effect: "Approve" button visible, can approve record

Permission: module:export
Effect: "Export" button visible, can download data

Permission: module:delegate
Effect: Can delegate permissions to other users
```

## Permission Inheritance

Roles can inherit from parent roles.

```
Role Hierarchy:
┌─────────────────┐
│  Super Admin    │ (all permissions)
└────────┬────────┘
         │ inherits
┌────────▼────────┐
│  Admin          │ (subset of Super Admin)
└────────┬────────┘
         │ inherits
┌────────▼────────────┐
│  Loan Officer       │ (subset of Admin)
└─────────────────────┘

When checking permissions, system includes:
- Direct permissions
- Parent role permissions
- Grandparent role permissions (recursive)
```

## How RBAC Works

### Frontend (Angular)

**1. User Logs In**
```typescript
// Login service requests token
const response = await api.post('/auth/login', credentials);
// Response includes JWT with permissions
const jwt = response.access_token;

// Store token
localStorage.setItem('access_token', jwt);

// Extract permissions from JWT payload
const permissions = jwt.permissions;
// Example: ["dashboard:view", "loans:view", "loans:create", ...]

// Store permissions in service
this.permissionService.setPermissions(permissions);
```

**2. Load Sidebar Menus**
```typescript
// Get all available modules for user's role
getMenus() {
  return this.permissionService.getMenus();
  // Returns only modules where user has permissions
}

// Example response:
[
  { menuKey: 'dashboard', label: 'Dashboard' },
  { menuKey: 'loans', label: 'Loans' },
  { menuKey: 'users', label: 'Users' }
]
```

**3. Show/Hide Menu Items**
```html
<!-- Show menu item if user has permission -->
<div *ngFor="let menu of menus">
  <a [routerLink]="menu.path">
    {{ menu.label }}
  </a>
</div>

<!-- Template will only include menus user has access to -->
```

**4. Show/Hide Buttons**
```html
<!-- Show button if user has permission -->
<button *appHasPermission="'loans:create'">
  Create Loan
</button>

<!-- Without permission: button is hidden -->
```

**5. Call API with Permission Check**
```typescript
// Frontend checks permission before making request
if (this.permissionService.hasPermission('loans:create')) {
  // Make API call
  this.loanService.create(loanData);
} else {
  // Show error message
  this.toast.error('You do not have permission to create loans');
}
```

### Backend (Express)

**1. Verify Token**
```javascript
// Authentication middleware
app.use((req, res, next) => {
  const token = req.headers.authorization.split(' ')[1];
  const decoded = jwt.verify(token, process.env.JWT_SECRET);
  req.user = decoded;
  // req.user = { id: 1, email: '...', permissions: [...] }
  next();
});
```

**2. Check Permission**
```javascript
// RBAC middleware
app.post('/api/loans', 
  requireAuth,
  requirePermission('loans:create'),
  loanController.create
);

// In middleware:
const requirePermission = (requiredPermission) => {
  return (req, res, next) => {
    if (!req.user.permissions.includes(requiredPermission)) {
      return res.status(403).json({ error: 'Permission denied' });
    }
    next();
  };
};
```

**3. Verify Tenant**
```javascript
// Tenant isolation middleware
app.use((req, res, next) => {
  const tenantId = req.user.tenant_id;
  req.tenantId = tenantId;
  
  // All queries automatically filtered by tenant_id
  next();
});

// In service:
const getLoansByTenant = (tenantId) => {
  return db.query(
    'SELECT * FROM loans WHERE tenant_id = $1',
    [tenantId]
  );
};
```

**4. Process Request**
```javascript
loanController.create = async (req, res) => {
  try {
    // User already verified to have 'loans:create' permission
    const loan = await loanService.create(req.body, req.tenantId);
    
    // Log to audit trail
    await auditService.log({
      userId: req.user.id,
      action: 'create',
      entity: 'loan',
      entityId: loan.id,
      tenantId: req.tenantId
    });
    
    // Return response
    res.status(201).json(loan);
  } catch (error) {
    res.status(400).json({ error: error.message });
  }
};
```

## Permission Scenarios

### Scenario 1: View Only

**User Role**: Viewer
**Permissions**: ["dashboard:view", "loans:view", "users:view"]

**What happens**:
- ✅ Can see Dashboard menu
- ✅ Can see Loans menu
- ✅ Can see Users menu
- ❌ Cannot see Create buttons
- ❌ Cannot see Edit buttons
- ❌ Cannot see Delete buttons
- ❌ API calls to POST, PUT, DELETE return 403

### Scenario 2: Create Only

**User Role**: Loan Officer
**Permissions**: ["loans:view", "loans:create", "customers:view", "customers:create"]

**What happens**:
- ✅ Can see Loans menu
- ✅ Can see Create Loan button
- ✅ Can create loans
- ❌ Cannot see Edit Loan button
- ❌ Cannot edit loans
- ❌ Cannot see Delete Loan button
- ❌ Cannot delete loans

### Scenario 3: Full Access

**User Role**: Tenant Admin
**Permissions**: All permissions for tenant space

**What happens**:
- ✅ Can see all menus (Users, Roles, Loans, Customers, etc.)
- ✅ Can see all action buttons (Create, Edit, Delete, Approve)
- ✅ Can perform all operations
- ✅ Can delegate permissions to other users

### Scenario 4: Permission Revoked

**Scenario**:
1. User has "loans:edit" permission
2. Admin revokes permission
3. User is still logged in

**What happens**:
- If WebSocket connected:
  - Real-time update
  - Edit button disappears immediately
  - Show info toast: "Your permissions have been updated"
  
- If WebSocket not connected:
  - Permission removed on next login
  - Or when next API call returns 403

## Permission Caching

Permissions are cached to improve performance.

```javascript
// Cache: permissions:{userId}
// Value: ["loans:view", "loans:create", ...]
// TTL: 1 hour

// When permission added/removed:
// 1. Update database
// 2. Invalidate cache
// 3. Send WebSocket event to user
// 4. User refreshes cache
```

## Permission Constraints (Advanced)

Optional: Add constraints to permissions.

```json
{
  "role_id": 1,
  "module_id": 5,
  "action_key": "edit",
  "constraints": {
    "max_amount": 50000,
    "business_hours_only": true,
    "requires_approval": true
  }
}
```

**Effect**:
- User can edit loans, but only up to $50,000
- Can only edit during business hours
- Changes require manager approval

## Permission Delegation

Temporarily grant permissions to another user.

```typescript
// Admin delegates approval permission to user
delegatePermission({
  delegated_to: userId,
  role_id: approverRoleId,
  expires_at: tomorrow,
  reason: "Cover for manager"
});

// User gets temporary permissions
// After expiration, permissions revoked automatically
```

## Audit Trail

All permission changes are logged.

```
Audit log example:
- Timestamp: 2025-10-21 14:30:00
- User: admin@template.local
- Action: assign_role
- Entity: User (john@example.com)
- Changes: Added role "Loan Officer"
- Status: success
```

## Best Practices

### 1. Principle of Least Privilege
Grant users only permissions they need.

```
❌ Don't: Give admin role to everyone
✅ Do: Give minimal required permissions
```

### 2. Role Inheritance
Use role inheritance to reduce duplication.

```
❌ Don't: Copy permissions to similar roles
✅ Do: Create role hierarchy with inheritance
```

### 3. Regular Audits
Review permissions regularly.

```
✅ Do: Audit user permissions quarterly
✅ Do: Remove unused roles
✅ Do: Update role descriptions
```

### 4. Clear Documentation
Document what each permission allows.

```
Permission: loans:approve
Effect: User can approve loans pending approval
Required Role: Approver or higher
Constraints: None
```

### 5. Delegation Records
Track who delegated permissions to whom.

```
✅ Do: Log delegation reason
✅ Do: Set expiration dates
✅ Do: Audit delegation usage
```

## Common Issues

### Issue: User Can't See Menu

**Causes**:
- User doesn't have menu_key:view permission
- Role not assigned to user
- Role doesn't have permission for module

**Solution**:
```sql
-- Check user's roles
SELECT * FROM user_roles WHERE user_id = 1;

-- Check role's permissions
SELECT * FROM role_permissions 
WHERE role_id = (SELECT role_id FROM user_roles WHERE user_id = 1);

-- Check if module exists
SELECT * FROM modules WHERE menu_key = 'loans';
```

### Issue: Button Shows But API Returns 403

**Causes**:
- Permission checked on frontend but not backend
- Token expired
- Permission cached incorrectly

**Solution**:
- Always verify permissions on backend
- Use middleware, not just route-level checks
- Invalidate permission cache when changed

### Issue: Real-Time Permission Update Not Working

**Causes**:
- WebSocket not connected
- Permission cache not invalidated
- User not subscribed to events

**Solution**:
- Implement fallback for next API call
- Clear cache on permission change
- Subscribe to user-specific events

---

For more information, see [Architecture Guide](./ARCHITECTURE.md) and [Database Schema](./DATABASE-SCHEMA.md)
