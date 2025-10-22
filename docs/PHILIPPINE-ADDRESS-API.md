# Philippine Address API Documentation

## Overview
Complete API for managing Philippine addresses with support for the Philippine address format (Region, Province, City/Municipality, Barangay, Street, etc.).

## Base URL
```
http://localhost:3000/api/addresses
```

## Authentication
All endpoints require authentication via JWT token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

---

## Endpoints

### 1. Get All Addresses
Retrieve all addresses for the authenticated user's tenant.

**GET** `/api/addresses`

**Query Parameters:**
- `type` (optional): Filter by address type (`home`, `work`, `billing`, `shipping`, `other`)
- `status` (optional): Filter by status (`active`, `inactive`, `deleted`)
- `is_primary` (optional): Filter by primary status (`true`, `false`)

**Response:**
```json
{
  "success": true,
  "count": 3,
  "data": [
    {
      "id": 1,
      "tenant_id": 1,
      "address_type": "home",
      "is_primary": true,
      "label": "Main Office",
      "unit_number": "Unit 15A",
      "house_number": "123",
      "street_name": "Ayala Avenue",
      "barangay": "Makati",
      "city_municipality": "Makati City",
      "province": "Metro Manila",
      "region": "NCR",
      "zip_code": "1226",
      "latitude": 14.5547,
      "longitude": 121.0244,
      "landmark": "Near Poblacion Park",
      "delivery_instructions": null,
      "contact_person": "Juan Dela Cruz",
      "contact_phone": "+63-917-123-4567",
      "status": "active",
      "is_verified": false,
      "verified_at": null,
      "verified_by": null,
      "created_by": 1,
      "updated_by": null,
      "created_at": "2025-10-22T12:00:00.000Z",
      "updated_at": "2025-10-22T12:00:00.000Z",
      "deleted_at": null,
      "formatted_address": "Unit 15A 123 Ayala Avenue, Makati, Makati City, Metro Manila, NCR, 1226"
    }
  ]
}
```

---

### 2. Get Address by ID
Retrieve a specific address by ID.

**GET** `/api/addresses/:id`

**Response:**
```json
{
  "success": true,
  "data": {
    "id": 1,
    "tenant_id": 1,
    "address_type": "home",
    ...
  }
}
```

**Error Response (404):**
```json
{
  "success": false,
  "message": "Address not found"
}
```

---

### 3. Create New Address
Create a new address.

**POST** `/api/addresses`

**Request Body:**
```json
{
  "address_type": "home",
  "is_primary": true,
  "label": "My Home",
  "unit_number": "Unit 5B",
  "house_number": "456",
  "street_name": "Rizal Street",
  "barangay": "Poblacion",
  "city_municipality": "Davao City",
  "province": "Davao del Sur",
  "region": "Region_XI",
  "zip_code": "8000",
  "latitude": 7.0731,
  "longitude": 125.6128,
  "landmark": "Near San Pedro Cathedral",
  "delivery_instructions": "Call when you arrive",
  "contact_person": "Maria Santos",
  "contact_phone": "+63-918-234-5678"
}
```

**Required Fields:**
- `barangay` (string)
- `city_municipality` (string)
- `province` (string)
- `region` (enum: see Philippine Regions below)

**Optional Fields:**
- `address_type` (enum: `home`, `work`, `billing`, `shipping`, `other`) - default: `home`
- `is_primary` (boolean) - default: `false`
- `label` (string)
- `unit_number` (string)
- `house_number` (string)
- `street_name` (string)
- `zip_code` (string)
- `latitude` (decimal)
- `longitude` (decimal)
- `landmark` (string)
- `delivery_instructions` (text)
- `contact_person` (string)
- `contact_phone` (string)

**Response (201):**
```json
{
  "success": true,
  "message": "Address created successfully",
  "data": {
    "id": 4,
    "tenant_id": 1,
    ...
  }
}
```

**Error Response (400):**
```json
{
  "success": false,
  "message": "Barangay, City/Municipality, Province, and Region are required"
}
```

---

### 4. Update Address
Update an existing address.

**PUT** `/api/addresses/:id`

**Request Body:**
```json
{
  "label": "Updated Home Address",
  "landmark": "Near new landmark",
  "status": "active"
}
```

**Note:** All fields are optional. Only provided fields will be updated.

**Response:**
```json
{
  "success": true,
  "message": "Address updated successfully",
  "data": {
    "id": 1,
    ...
  }
}
```

---

### 5. Delete Address
Soft delete an address.

**DELETE** `/api/addresses/:id`

**Response:**
```json
{
  "success": true,
  "message": "Address deleted successfully"
}
```

---

### 6. Set Address as Primary
Set an address as the primary address for its type.

**PATCH** `/api/addresses/:id/set-primary`

**Response:**
```json
{
  "success": true,
  "message": "Address set as primary",
  "data": {
    "id": 1,
    "is_primary": true,
    ...
  }
}
```

**Note:** This will automatically unset other addresses of the same type as non-primary.

---

### 7. Verify Address
Mark an address as verified.

**PATCH** `/api/addresses/:id/verify`

**Response:**
```json
{
  "success": true,
  "message": "Address verified successfully",
  "data": {
    "id": 1,
    "is_verified": true,
    "verified_at": "2025-10-22T12:30:00.000Z",
    "verified_by": 1,
    ...
  }
}
```

---

### 8. Get Philippine Regions List
Get a list of all Philippine administrative regions.

**GET** `/api/addresses/regions`

**Response:**
```json
{
  "success": true,
  "data": [
    { "code": "NCR", "name": "National Capital Region (Metro Manila)" },
    { "code": "CAR", "name": "Cordillera Administrative Region" },
    { "code": "Region_I", "name": "Region I - Ilocos Region" },
    { "code": "Region_II", "name": "Region II - Cagayan Valley" },
    { "code": "Region_III", "name": "Region III - Central Luzon" },
    { "code": "Region_IV_A", "name": "Region IV-A - CALABARZON" },
    { "code": "Region_IV_B", "name": "Region IV-B - MIMAROPA" },
    { "code": "Region_V", "name": "Region V - Bicol Region" },
    { "code": "Region_VI", "name": "Region VI - Western Visayas" },
    { "code": "Region_VII", "name": "Region VII - Central Visayas" },
    { "code": "Region_VIII", "name": "Region VIII - Eastern Visayas" },
    { "code": "Region_IX", "name": "Region IX - Zamboanga Peninsula" },
    { "code": "Region_X", "name": "Region X - Northern Mindanao" },
    { "code": "Region_XI", "name": "Region XI - Davao Region" },
    { "code": "Region_XII", "name": "Region XII - SOCCSKSARGEN" },
    { "code": "Region_XIII", "name": "Region XIII - Caraga" },
    { "code": "BARMM", "name": "Bangsamoro Autonomous Region in Muslim Mindanao" }
  ]
}
```

---

## Philippine Address Format

The API follows the official Philippine address format:

```
[Unit Number] [House/Building Number] [Street Name]
[Barangay]
[City/Municipality], [Province]
[Region], [ZIP Code]
```

### Example Addresses:

**Urban Address (Metro Manila):**
```
Unit 15A, 123 Ayala Avenue
Barangay Makati
Makati City, Metro Manila
NCR, 1226
```

**Provincial Address:**
```
456 Rizal Street
Barangay Poblacion
Davao City, Davao del Sur
Region XI, 8000
```

**Rural Address:**
```
Purok 3, Sitio Maligaya
Barangay San Isidro
Municipality of Tarlac, Tarlac
Region III, 2300
```

---

## Philippine Regions Reference

| Code | Region Name | Key Cities/Provinces |
|------|-------------|---------------------|
| **NCR** | National Capital Region | Manila, Quezon City, Makati, Pasig |
| **CAR** | Cordillera Administrative Region | Baguio City, Benguet, Ifugao |
| **Region_I** | Ilocos Region | Ilocos Norte, Ilocos Sur, La Union, Pangasinan |
| **Region_II** | Cagayan Valley | Cagayan, Isabela, Nueva Vizcaya, Quirino |
| **Region_III** | Central Luzon | Bulacan, Pampanga, Tarlac, Nueva Ecija, Zambales |
| **Region_IV_A** | CALABARZON | Cavite, Laguna, Batangas, Rizal, Quezon |
| **Region_IV_B** | MIMAROPA | Occidental Mindoro, Oriental Mindoro, Marinduque, Romblon, Palawan |
| **Region_V** | Bicol Region | Albay, Camarines Sur, Camarines Norte, Sorsogon |
| **Region_VI** | Western Visayas | Iloilo, Negros Occidental, Aklan, Capiz, Antique |
| **Region_VII** | Central Visayas | Cebu, Bohol, Negros Oriental, Siquijor |
| **Region_VIII** | Eastern Visayas | Leyte, Samar, Eastern Samar, Northern Samar |
| **Region_IX** | Zamboanga Peninsula | Zamboanga del Norte, Zamboanga del Sur, Zamboanga Sibugay |
| **Region_X** | Northern Mindanao | Bukidnon, Misamis Oriental, Misamis Occidental |
| **Region_XI** | Davao Region | Davao City, Davao del Norte, Davao del Sur, Davao Oriental |
| **Region_XII** | SOCCSKSARGEN | South Cotabato, Cotabato, Sultan Kudarat, Sarangani, General Santos |
| **Region_XIII** | Caraga | Agusan del Norte, Agusan del Sur, Surigao del Norte, Surigao del Sur |
| **BARMM** | Bangsamoro Autonomous Region | Maguindanao, Lanao del Sur, Basilan, Sulu, Tawi-Tawi |

---

## Error Responses

All endpoints may return the following error responses:

**401 Unauthorized:**
```json
{
  "success": false,
  "message": "Authentication required"
}
```

**404 Not Found:**
```json
{
  "success": false,
  "message": "Address not found"
}
```

**500 Internal Server Error:**
```json
{
  "success": false,
  "message": "Failed to fetch/create/update/delete address",
  "error": "Error details"
}
```

---

## Usage Examples

### JavaScript/Fetch
```javascript
// Get all addresses
const response = await fetch('http://localhost:3000/api/addresses', {
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  }
});
const data = await response.json();

// Create new address
const newAddress = await fetch('http://localhost:3000/api/addresses', {
  method: 'POST',
  headers: {
    'Authorization': `Bearer ${token}`,
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    address_type: 'home',
    is_primary: true,
    barangay: 'Poblacion',
    city_municipality: 'Davao City',
    province: 'Davao del Sur',
    region: 'Region_XI',
    zip_code: '8000'
  })
});
```

### cURL
```bash
# Get all addresses
curl -X GET http://localhost:3000/api/addresses \
  -H "Authorization: Bearer YOUR_TOKEN"

# Create address
curl -X POST http://localhost:3000/api/addresses \
  -H "Authorization: Bearer YOUR_TOKEN" \
  -H "Content-Type: application/json" \
  -d '{
    "barangay": "Poblacion",
    "city_municipality": "Davao City",
    "province": "Davao del Sur",
    "region": "Region_XI",
    "zip_code": "8000"
  }'
```

---

## Database Schema

The `philippine_addresses` table structure:

```sql
CREATE TABLE philippine_addresses (
  id SERIAL PRIMARY KEY,
  tenant_id INT REFERENCES tenants(id),
  address_type address_type NOT NULL DEFAULT 'home',
  is_primary BOOLEAN DEFAULT FALSE,
  label VARCHAR(100),
  unit_number VARCHAR(50),
  house_number VARCHAR(50),
  street_name VARCHAR(255),
  barangay VARCHAR(255) NOT NULL,
  city_municipality VARCHAR(255) NOT NULL,
  province VARCHAR(255) NOT NULL,
  region philippine_region NOT NULL,
  zip_code VARCHAR(10),
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),
  landmark VARCHAR(255),
  delivery_instructions TEXT,
  contact_person VARCHAR(255),
  contact_phone VARCHAR(20),
  status VARCHAR(20) NOT NULL DEFAULT 'active',
  is_verified BOOLEAN DEFAULT FALSE,
  verified_at TIMESTAMP,
  verified_by INT REFERENCES users(id),
  created_by INT REFERENCES users(id),
  updated_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP
);
```

---

## Notes

- All addresses are tenant-scoped (multi-tenant support)
- Soft delete is implemented (records are marked as deleted, not physically removed)
- Only one primary address per address type is allowed
- Geographic coordinates are optional but useful for mapping features
- Address verification can be done by authorized users
- The `formatted_address` field in responses is automatically generated
