-- Add contact person columns to tenants table

ALTER TABLE tenants 
ADD COLUMN IF NOT EXISTS contact_person VARCHAR(255),
ADD COLUMN IF NOT EXISTS contact_email VARCHAR(255),
ADD COLUMN IF NOT EXISTS contact_phone VARCHAR(50);

-- Verify the columns were added
SELECT column_name, data_type 
FROM information_schema.columns 
WHERE table_name = 'tenants' 
AND column_name IN ('contact_person', 'contact_email', 'contact_phone')
ORDER BY column_name;
