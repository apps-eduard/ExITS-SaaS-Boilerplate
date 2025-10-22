# User Address Integration - Complete

## Overview
Added Philippine address form to the user creation workflow in the Angular web application.

## Files Created/Modified

### 1. Address Service (`web/src/app/core/services/address.service.ts`)
**Status:** ✅ Created

**Features:**
- Complete CRUD operations for addresses
- Integration with Philippine address API endpoints
- Region management and loading
- Signal-based state management
- Address formatting utilities

**Key Methods:**
- `loadRegions()` - Load all 17 Philippine regions
- `getAddressesByUserId(userId)` - Get all addresses for a user
- `createAddress(payload)` - Create new address
- `updateAddress(id, payload)` - Update existing address
- `deleteAddress(id)` - Delete address
- `setPrimaryAddress(id)` - Set address as primary
- `verifyAddress(id)` - Mark address as verified
- `formatAddress(address)` - Format address in Philippine standard

**Interfaces:**
```typescript
interface Address {
  id: string;
  userId: string;
  tenantId: string;
  addressType: 'home' | 'work' | 'billing' | 'shipping' | 'other';
  street: string;
  barangay: string;
  cityMunicipality: string;
  province: string;
  region: string;
  zipCode?: string;
  country: string;
  landmark?: string;
  isPrimary: boolean;
  isVerified: boolean;
  contactPhone?: string;
  contactName?: string;
  notes?: string;
  createdAt: string;
  updatedAt: string;
}

interface AddressCreatePayload {
  userId: string;
  addressType: 'home' | 'work' | 'billing' | 'shipping' | 'other';
  street: string;
  barangay: string;
  cityMunicipality: string;
  province: string;
  region: string;
  zipCode?: string;
  country?: string;
  landmark?: string;
  isPrimary?: boolean;
  contactPhone?: string;
  contactName?: string;
  notes?: string;
}

interface Region {
  code: string;
  name: string;
}
```

### 2. User Editor Component (`web/src/app/features/admin/users/user-editor.component.ts`)
**Status:** ✅ Modified

**Changes:**
1. **Imports:** Added `AddressService` and `AddressCreatePayload`
2. **Template:** Added complete address form section with:
   - Toggle checkbox to include/exclude address
   - Address type selector (home, work, billing, shipping, other)
   - Philippine region dropdown (dynamically loaded)
   - Province, City/Municipality, Barangay fields
   - Street address with optional landmark
   - Zip code (optional)
   - Contact name and phone
   - Notes/instructions field
   - Primary address checkbox
   - Helpful note about Philippine address format

3. **Component Properties:**
   ```typescript
   includeAddress = false;  // Toggle for address section
   addressData = {
     addressType: 'home',
     street: '',
     barangay: '',
     cityMunicipality: '',
     province: '',
     region: '',
     zipCode: '',
     landmark: '',
     isPrimary: true,
     contactPhone: '',
     contactName: '',
     notes: ''
   };
   ```

4. **Methods Added:**
   - `isAddressValid()` - Validates required address fields
   - Updated `save()` - Creates address after user creation if enabled

**Form Validation:**
- Required fields: Address Type, Region, Province, City/Municipality, Barangay, Street
- Optional fields: Zip Code, Landmark, Contact Name, Contact Phone, Notes
- Address creation is optional (checkbox toggle)
- If address creation fails, user is still created (non-blocking)

## Philippine Address Format

The form follows the official Philippine address structure:

```
Street Address
Barangay [Required]
City/Municipality [Required]
Province [Required]
Region [Required] (17 options)
Zip Code [Optional]
Landmark [Optional]
```

### Supported Regions (17)
1. NCR (National Capital Region)
2. CAR (Cordillera Administrative Region)
3. Region I (Ilocos Region)
4. Region II (Cagayan Valley)
5. Region III (Central Luzon)
6. Region IV-A (CALABARZON)
7. Region IV-B (MIMAROPA)
8. Region V (Bicol Region)
9. Region VI (Western Visayas)
10. Region VII (Central Visayas)
11. Region VIII (Eastern Visayas)
12. Region IX (Zamboanga Peninsula)
13. Region X (Northern Mindanao)
14. Region XI (Davao Region)
15. Region XII (SOCCSKSARGEN)
16. Region XIII (Caraga)
17. BARMM (Bangsamoro Autonomous Region in Muslim Mindanao)

## User Flow

### Creating a User with Address
1. Navigate to **Admin → Users → Create New User**
2. Fill in basic user information (email, password, first name, last name)
3. Select user type (System Admin or Tenant User)
4. Assign roles
5. **Check "Add address"** checkbox in Address Information section
6. Fill in address fields:
   - Select address type
   - Select region from dropdown
   - Enter province, city/municipality, barangay
   - Enter street address
   - Optionally add zip code and landmark
   - Optionally add contact information
   - Check "Set as primary address" if desired
7. Click **Create User**
8. User and address are created automatically

### Features
- ✅ Optional address during user creation
- ✅ Philippine address format enforced
- ✅ Region dropdown dynamically loaded from API
- ✅ Primary address designation
- ✅ Multiple address types supported
- ✅ Contact information per address
- ✅ Delivery notes/instructions
- ✅ Responsive design with Tailwind CSS
- ✅ Dark mode support
- ✅ Form validation
- ✅ Error handling (address fails don't block user creation)

## API Integration

The address form connects to these API endpoints:

```
GET    /api/addresses/regions           - Load Philippine regions
POST   /api/addresses                   - Create new address
GET    /api/addresses?userId={id}       - Get user's addresses
PUT    /api/addresses/:id               - Update address
DELETE /api/addresses/:id               - Delete address
PATCH  /api/addresses/:id/set-primary   - Set as primary
PATCH  /api/addresses/:id/verify        - Verify address
```

## Testing

### Manual Testing Steps
1. Start the API server: `cd api && npm start` (Port 3000)
2. Start the web app: `cd web && npm start` (Port 4200)
3. Login as admin user
4. Navigate to Users → Create New User
5. Enable "Add address" checkbox
6. Fill in all required address fields
7. Submit form
8. Verify:
   - User is created successfully
   - Address appears in database (check `philippine_addresses` table)
   - Primary flag is set correctly
   - Address type is correct

### Database Verification
```sql
-- Check created addresses
SELECT 
  a.id,
  u.email as user_email,
  a.address_type,
  a.street,
  a.barangay,
  a.city_municipality,
  a.province,
  a.region,
  a.is_primary,
  a.created_at
FROM philippine_addresses a
JOIN users u ON a.user_id = u.id
ORDER BY a.created_at DESC;
```

## Future Enhancements

Potential improvements for later:
- [ ] Province dropdown based on selected region
- [ ] City/Municipality dropdown based on selected province
- [ ] Barangay dropdown based on selected city
- [ ] Address geocoding and map integration
- [ ] Address validation against official PSGC database
- [ ] Multiple addresses management in user profile
- [ ] Address search/autocomplete
- [ ] Export address labels
- [ ] Distance calculation between addresses

## Troubleshooting

### Region dropdown is empty
- **Cause:** API server not running or regions endpoint failing
- **Solution:** Start API server (`cd api && npm start`) and check console for errors

### Address not saving
- **Cause:** Missing required fields or API authentication issue
- **Solution:** Check browser console for errors, ensure all required fields are filled

### "Cannot read properties of undefined" error
- **Cause:** AddressService not properly injected
- **Solution:** Ensure `AddressService` is in `providedIn: 'root'` (already done)

## Summary

✅ **Complete Philippine address integration** into user creation workflow
✅ **All 17 regions** supported with dropdown
✅ **Optional address entry** - doesn't block user creation
✅ **Full CRUD service** ready for future address management
✅ **TypeScript interfaces** for type safety
✅ **Responsive design** with dark mode
✅ **Error handling** with non-blocking address creation

The user creation form now fully supports Philippine addresses with proper validation, formatting, and API integration.
