# API Field Name Compatibility Fix

## Problem
Frontend was sending user data in **camelCase** (`firstName`, `lastName`, `tenantId`) but the backend validator was expecting **snake_case** (`first_name`, `last_name`, `tenant_id`), causing validation errors:

```
"first_name" is required
```

## Solution
Updated both the validator and service layer to accept **both** naming conventions.

### Files Changed

#### 1. `api/src/utils/validators.js`
- Made `role_id` optional (roles are assigned separately via `/api/users/:id/roles`)
- Added support for both camelCase and snake_case field names
- Added `.or()` validation to require at least one naming format
- Made `tenantId/tenant_id` optional and nullable for system users

**Before:**
```javascript
first_name: Joi.string().required(),
last_name: Joi.string().required(),
role_id: Joi.number().required(),
```

**After:**
```javascript
firstName: Joi.string().optional(),
first_name: Joi.string().optional(),
lastName: Joi.string().optional(),
last_name: Joi.string().optional(),
role_id: Joi.number().optional(),
roleId: Joi.number().optional(),
tenantId: Joi.number().allow(null).optional(),
tenant_id: Joi.number().allow(null).optional(),
status: Joi.string().valid('active', 'inactive', 'suspended').optional(),
```

#### 2. `api/src/services/UserService.js`
- Extracts values from both naming conventions
- Handles `tenantId` from request body or falls back to authenticated user's tenant
- Supports both `roleId` and `role_id`

**Before:**
```javascript
userData.first_name, userData.last_name
```

**After:**
```javascript
const firstName = userData.firstName || userData.first_name || '';
const lastName = userData.lastName || userData.last_name || '';
const userTenantId = userData.tenantId !== undefined ? userData.tenantId : tenantId;
const roleId = userData.roleId || userData.role_id;
```

## Benefits
✅ Frontend can use JavaScript naming conventions (camelCase)  
✅ Backward compatible with snake_case if needed  
✅ Matches database column names (snake_case)  
✅ More flexible API design  

## Testing
Test user creation with:
```json
{
  "email": "test@example.com",
  "password": "Test@123456",
  "firstName": "John",
  "lastName": "Doe"
}
```

Or with snake_case:
```json
{
  "email": "test@example.com",
  "password": "Test@123456",
  "first_name": "John",
  "last_name": "Doe"
}
```

Both formats now work! 🎉
