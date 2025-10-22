# 🔧 Logout Session Status Fix

## Problem
When clicking logout, the API was returning:
```
❌ invalid input value for enum session_status: "inactive"
```

## Root Cause
The `AuthService.logout()` method was trying to set session status to `'inactive'`, but the database schema only allows:
- `'active'`
- `'revoked'`
- `'expired'`

**File**: `api/src/services/AuthService.js` line 157

## Solution
Changed the logout session update from:
```javascript
['inactive', userId, 'active']
```

To:
```javascript
['revoked', userId, 'active']
```

This properly marks the session as revoked instead of using an invalid enum value.

## Database Schema Reference
```sql
CREATE TYPE session_status AS ENUM ('active', 'revoked', 'expired');
```

## Testing the Fix

1. Restart API server:
```powershell
cd api
# Ctrl+C to stop current process
npm start
```

2. Login normally:
   - Email: `admin@exitsaas.com`
   - Password: `Admin@123`

3. Navigate to Users: `/admin/users`

4. **Try logout** - Should work without error now

5. Check API logs - Should show:
```
✓ POST /api/auth/logout 200 (15ms)
✓ Audit log created for logout
```

## Files Modified
- ✅ `api/src/services/AuthService.js` - Line 157: Changed status to 'revoked'

## Status
✅ **FIXED** - Logout now uses valid session_status enum value
