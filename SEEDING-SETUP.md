# Database Seeding Setup

## Overview
The ExITS-SaaS boilerplate now includes automatic database seeding that runs during `setup.ps1`. This ensures that the System Administrator account is created with all necessary roles and permissions.

## What Gets Seeded

### 1. **Tenant**
- Default tenant: `ExITS Platform` (subdomain: exits-platform)
- Plan: Enterprise
- Status: Active

### 2. **Modules** (8 system modules)
- Dashboard
- Users
- Roles
- Permissions
- Tenants
- Modules
- Audit Logs
- Settings

### 3. **Roles** (4 roles)
- **System Administrator** (system-level, no tenant)
  - Full access to all 8 modules
  - All 4 actions (view, create, edit, delete)
  - **Total: 32 permissions**
  
- **Tenant Admin** (tenant-level)
  - Access to: Dashboard, Users, Roles, Audit, Settings
  - All 4 actions for accessible modules
  - **Total: 20 permissions**
  
- **User Manager** (tenant-level)
  - Access to: Dashboard, Users, Roles
  - Actions: view, create, edit (no delete)
  - **Total: 9 permissions**
  
- **Viewer** (tenant-level)
  - Access to: Dashboard, Users, Audit
  - Actions: view only
  - **Total: 3 permissions**

### 4. **Default Admin User**
- **Email**: `admin@exitsaas.com`
- **Password**: `Admin@123`
- **Role**: System Administrator
- **Permissions**: All 32 system permissions
- **Status**: Active, email verified

## How It Works

### During setup.ps1
The seeding happens automatically in this order:
1. `schema.sql` - Creates all database tables and structures
2. `migration-add-philippine-addresses.sql` - Adds address data
3. **`seed.sql`** - Populates initial data (NEW!)

### Manual Seeding
You can also run seeding manually:

```powershell
# From the api directory
npm run seed
```

Or directly with psql:
```powershell
$env:PGPASSWORD='admin'
& 'C:\Program Files\PostgreSQL\18\bin\psql.exe' -U postgres -d exits_saas_db -f api/src/scripts/seed.sql
```

## Idempotency
All seed operations use `ON CONFLICT DO NOTHING` to ensure:
- Running seed multiple times is safe
- Existing data won't be overwritten
- No errors if data already exists

## Verification

After seeding, verify the setup:

```sql
-- Check System Administrator permissions count
SELECT COUNT(*) as total_permissions 
FROM role_permissions rp 
JOIN roles r ON rp.role_id = r.id 
WHERE r.name = 'System Administrator' 
AND r.space = 'system';
-- Should return: 32

-- Check admin user's role and permissions
SELECT u.email, r.name as role_name, r.space
FROM users u 
JOIN user_roles ur ON u.id = ur.user_id 
JOIN roles r ON ur.role_id = r.id 
WHERE u.email = 'admin@exitsaas.com';
-- Should return: admin@exitsaas.com | System Administrator | system
```

## Files Modified

### New Files
- `api/src/scripts/seed.sql` - SQL seeding script
- `api/src/scripts/seed.js` - Node.js seeding script wrapper
- `api/src/scripts/generate-hash.js` - Password hash generator utility

### Modified Files
- `api/src/scripts/migrate.js` - Now includes seed.sql in migration chain

## Testing Login

After running setup.ps1, you can immediately log in with:

1. Navigate to `http://localhost:4200`
2. Use credentials:
   - **Email**: `admin@exitsaas.com`
   - **Password**: `Admin@123`
3. You should see all 8 system menus in the sidebar
4. All actions (view, create, edit, delete) should be available

## Troubleshooting

### Issue: Admin has no menus after login
**Solution**: Re-run the seed script
```powershell
cd api
npm run seed
```

### Issue: Login fails with "Invalid credentials"
**Cause**: The password hash might be incorrect  
**Solution**: Regenerate the password hash
```powershell
cd api
node src/scripts/generate-hash.js
# Copy the hash and update seed.sql line 39
```

### Issue: Duplicate key errors during seeding
**Cause**: Data already exists  
**Solution**: This is normal and expected. The seed script handles this gracefully with ON CONFLICT clauses.

## Security Notes

⚠️ **Important**: Change the default admin password immediately after first login in production!

⚠️ **Important**: Update the JWT_SECRET in the .env file before deploying to production!

## Next Steps

After successful seeding:
1. Log in as admin@exitsaas.com
2. Change the default password
3. Create additional tenant-level roles as needed
4. Invite users and assign appropriate roles
5. Customize module permissions per role

## Password Reset During Setup

The setup.ps1 script now includes a **security prompt** at the end to change the default admin password.

### How It Works

After the servers start, you'll see:

```
⚠️  SECURITY REMINDER

The system is using default passwords!

For security reasons, it is HIGHLY RECOMMENDED to change the
admin password before using the application.

Would you like to change the admin password now? (y/n)
```

### Options

**Option 1: Change Password Now (Recommended)**
- Type `y` and press Enter
- Enter your new password (minimum 8 characters)
- Confirm the password
- The system will automatically update the database
- You can immediately login with your new password

**Option 2: Skip for Now**
- Type `n` and press Enter
- Remember to change the password after first login
- Default password remains: `Admin@123`

### Manual Password Change

If you skip the prompt or need to change the password later:

1. Login to the application
2. Go to Settings → Profile
3. Click "Change Password"
4. Enter old password and new password

Or update directly in database:

```powershell
cd api
node src/scripts/generate-hash.js  # Generate new hash
# Then update in database with the new hash
```

## Summary

✅ **Automatic seeding during setup.ps1**  
✅ **System Administrator gets all 32 permissions**  
✅ **5 test users with different roles**  
✅ **7 sample Philippine addresses**  
✅ **Password reset prompt for security**  
✅ **Idempotent - safe to run multiple times**  
✅ **Ready to use immediately after setup**  
✅ **Four default roles with different access levels**
