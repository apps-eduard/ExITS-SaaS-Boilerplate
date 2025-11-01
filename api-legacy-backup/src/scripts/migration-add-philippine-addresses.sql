-- Migration: Add Philippine Addresses Table
-- Date: October 22, 2025
-- Description: Creates a comprehensive Philippine address table following Philippine address format

-- Create ENUM types for Philippine addresses
CREATE TYPE address_type AS ENUM ('home', 'work', 'billing', 'shipping', 'other');
CREATE TYPE philippine_region AS ENUM (
  'NCR', 'CAR', 'Region_I', 'Region_II', 'Region_III', 'Region_IV_A', 'Region_IV_B',
  'Region_V', 'Region_VI', 'Region_VII', 'Region_VIII', 'Region_IX', 'Region_X',
  'Region_XI', 'Region_XII', 'Region_XIII', 'BARMM'
);

-- Philippine Addresses table
CREATE TABLE IF NOT EXISTS philippine_addresses (
  id SERIAL PRIMARY KEY,
  tenant_id INT REFERENCES tenants(id) ON DELETE CASCADE,
  user_id INT REFERENCES users(id) ON DELETE CASCADE,

  -- Address Type and Ownership
  address_type address_type NOT NULL DEFAULT 'home',
  is_primary BOOLEAN DEFAULT FALSE,
  label VARCHAR(100), -- Custom label like "Home", "Office", "Mom's House"

  -- Philippine Address Components (following Philippine address format)
  unit_number VARCHAR(50), -- Unit/Room/Floor number
  house_number VARCHAR(50), -- House/Block/Lot number
  street_name VARCHAR(255), -- Street name, Purok, Sitio, Subdivision
  barangay VARCHAR(255) NOT NULL, -- Barangay (required)
  city_municipality VARCHAR(255) NOT NULL, -- City or Municipality (required)
  province VARCHAR(255) NOT NULL, -- Province (required)
  region philippine_region NOT NULL, -- Administrative Region (required)
  zip_code VARCHAR(10), -- ZIP/Postal Code

  -- Geographic coordinates (optional)
  latitude DECIMAL(10, 8),
  longitude DECIMAL(11, 8),

  -- Additional address details
  landmark VARCHAR(255), -- Nearby landmark for reference
  delivery_instructions TEXT, -- Special delivery notes

  -- Contact information (optional, for delivery purposes)
  contact_person VARCHAR(255),
  contact_phone VARCHAR(20),

  -- Status and metadata
  status VARCHAR(20) NOT NULL DEFAULT 'active', -- active, inactive, deleted
  is_verified BOOLEAN DEFAULT FALSE, -- Address verification status
  verified_at TIMESTAMP,
  verified_by INT REFERENCES users(id),

  -- Audit fields
  created_by INT REFERENCES users(id),
  updated_by INT REFERENCES users(id),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  deleted_at TIMESTAMP,

  -- Constraints
  CONSTRAINT valid_coordinates CHECK (
    (latitude IS NULL AND longitude IS NULL) OR
    (latitude BETWEEN -90 AND 90 AND longitude BETWEEN -180 AND 180)
  )
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_addresses_tenant_id ON philippine_addresses(tenant_id);
CREATE INDEX IF NOT EXISTS idx_addresses_user_id ON philippine_addresses(user_id);
CREATE INDEX IF NOT EXISTS idx_addresses_type ON philippine_addresses(address_type);
CREATE INDEX IF NOT EXISTS idx_addresses_primary ON philippine_addresses(is_primary) WHERE is_primary = TRUE;
CREATE INDEX IF NOT EXISTS idx_addresses_barangay ON philippine_addresses(barangay);
CREATE INDEX IF NOT EXISTS idx_addresses_city ON philippine_addresses(city_municipality);
CREATE INDEX IF NOT EXISTS idx_addresses_province ON philippine_addresses(province);
CREATE INDEX IF NOT EXISTS idx_addresses_region ON philippine_addresses(region);
CREATE INDEX IF NOT EXISTS idx_addresses_status ON philippine_addresses(status);
CREATE INDEX IF NOT EXISTS idx_addresses_created_by ON philippine_addresses(created_by);

-- Add comments for documentation
COMMENT ON TABLE philippine_addresses IS 'Philippine address table following Philippine address format';
COMMENT ON COLUMN philippine_addresses.unit_number IS 'Unit/Room/Floor number (e.g., "Unit 5B", "Room 101")';
COMMENT ON COLUMN philippine_addresses.house_number IS 'House/Block/Lot number (e.g., "123", "Block 5 Lot 10")';
COMMENT ON COLUMN philippine_addresses.street_name IS 'Street name, Purok, Sitio, or Subdivision name';
COMMENT ON COLUMN philippine_addresses.barangay IS 'Barangay name (required field)';
COMMENT ON COLUMN philippine_addresses.city_municipality IS 'City or Municipality name (required field)';
COMMENT ON COLUMN philippine_addresses.province IS 'Province name (required field)';
COMMENT ON COLUMN philippine_addresses.region IS 'Philippine administrative region (required field)';
COMMENT ON COLUMN philippine_addresses.zip_code IS 'ZIP or Postal Code';
COMMENT ON COLUMN philippine_addresses.landmark IS 'Nearby landmark for easier location identification';
COMMENT ON COLUMN philippine_addresses.delivery_instructions IS 'Special delivery or access instructions';

-- Create a view for formatted addresses (Philippine format)
CREATE OR REPLACE VIEW formatted_philippine_addresses AS
SELECT
  pa.*,
  CONCAT_WS(', ',
    NULLIF(CONCAT_WS(' ',
      NULLIF(pa.unit_number, ''),
      NULLIF(pa.house_number, ''),
      NULLIF(pa.street_name, '')
    ), ''),
    NULLIF(pa.barangay, ''),
    NULLIF(pa.city_municipality, ''),
    NULLIF(pa.province, ''),
    CASE
      WHEN pa.region = 'NCR' THEN 'Metro Manila'
      WHEN pa.region = 'CAR' THEN 'Cordillera Administrative Region'
      WHEN pa.region = 'Region_I' THEN 'Ilocos Region'
      WHEN pa.region = 'Region_II' THEN 'Cagayan Valley'
      WHEN pa.region = 'Region_III' THEN 'Central Luzon'
      WHEN pa.region = 'Region_IV_A' THEN 'CALABARZON'
      WHEN pa.region = 'Region_IV_B' THEN 'MIMAROPA'
      WHEN pa.region = 'Region_V' THEN 'Bicol Region'
      WHEN pa.region = 'Region_VI' THEN 'Western Visayas'
      WHEN pa.region = 'Region_VII' THEN 'Central Visayas'
      WHEN pa.region = 'Region_VIII' THEN 'Eastern Visayas'
      WHEN pa.region = 'Region_IX' THEN 'Zamboanga Peninsula'
      WHEN pa.region = 'Region_X' THEN 'Northern Mindanao'
      WHEN pa.region = 'Region_XI' THEN 'Davao Region'
      WHEN pa.region = 'Region_XII' THEN 'SOCCSKSARGEN'
      WHEN pa.region = 'Region_XIII' THEN 'Caraga'
      WHEN pa.region = 'BARMM' THEN 'Bangsamoro Autonomous Region'
      ELSE pa.region::TEXT
    END,
    NULLIF(pa.zip_code, '')
  ) AS formatted_address
FROM philippine_addresses pa
WHERE pa.status = 'active' AND pa.deleted_at IS NULL;

-- Sample address data is now in seed.sql to ensure proper tenant/user references

-- Grant permissions for the new table (if using Row Level Security)
-- ALTER TABLE philippine_addresses ENABLE ROW LEVEL SECURITY;

-- Create policy for tenant isolation (if using RLS)
-- CREATE POLICY tenant_isolation ON philippine_addresses
--   FOR ALL USING (tenant_id = current_setting('app.tenant_id')::INT);