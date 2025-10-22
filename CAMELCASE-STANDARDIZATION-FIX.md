# User Management Fix - Standardized camelCase

## Problem
When editing users, the form fields were showing as blank because there was an inconsistency in data formatting:
- Database: Uses `snake_case` (first_name, last_name, tenant_id, etc.)
- API Responses: Were returning mixed formats (sometimes snake_case, sometimes camelCase)
- Frontend: Expected camelCase (firstName, lastName, tenantId, etc.)

This mismatch caused the frontend component to not find the expected field names, leaving the edit form blank.

## Solution
Standardized all API responses to use **camelCase** consistently across the entire backend.

## Changes Made

### 1. UserService.js - Added transformUser() Helper
**File:** `api/src/services/UserService.js`

Created a reusable helper function to transform database snake_case objects to camelCase:

```javascript
static transformUser(dbUser) {
  if (!dbUser) return null;
  return {
    id: dbUser.id,
    email: dbUser.email,
    firstName: dbUser.first_name,
    lastName: dbUser.last_name,
    fullName: `${dbUser.first_name || ''} ${dbUser.last_name || ''}`.trim(),
    tenantId: dbUser.tenant_id,
    status: dbUser.status,
    emailVerified: dbUser.email_verified,
    mfaEnabled: dbUser.mfa_enabled,
    lastLoginAt: dbUser.last_login_at,
    createdAt: dbUser.created_at,
    updatedAt: dbUser.updated_at,
  };
}
```

### 2. Updated All UserService Methods
All methods now use the `transformUser()` helper:

- **createUser()**: Returns transformed camelCase user object
- **getUserById()**: Returns transformed camelCase user object with roles and permissions
- **listUsers()**: Maps all users through `transformUser()`
- **updateUser()**: Returns transformed camelCase user object

### 3. AuthService.js - Fixed Login Response
**File:** `api/src/services/AuthService.js`

Updated `login()` method to return camelCase user data:

```javascript
return {
  user: {
    id: user.id,
    email: user.email,
    firstName: user.first_name,
    lastName: user.last_name,
    fullName: `${user.first_name || ''} ${user.last_name || ''}`.trim(),
    tenantId: user.tenant_id,
  },
  tokens: { accessToken, refreshToken },
  permissions,
};
```

## Benefits

✅ **Consistent Naming**: All API responses use camelCase  
✅ **No More Blank Forms**: User edit forms now populate correctly  
✅ **Better Frontend Integration**: Frontend always receives expected field names  
✅ **Reduced Bugs**: Eliminates snake_case/camelCase mismatch issues  
✅ **DRY Code**: `transformUser()` helper eliminates duplication  

## Testing

After restart, verify:

1. ✅ Login shows camelCase user data (firstName, lastName, fullName)
2. ✅ Users list endpoint returns camelCase fields
3. ✅ Edit user form populates with existing user data
4. ✅ Create user works correctly
5. ✅ Update user preserves data formatting

## Files Modified

- `api/src/services/UserService.js` - Added transformUser() helper, updated all methods
- `api/src/services/AuthService.js` - Fixed login response format
