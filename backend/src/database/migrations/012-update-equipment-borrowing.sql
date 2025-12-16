-- Migration: Update equipment signatures to full Equipment Borrowing feature
-- Date: 2025-12-16

-- Rename table from equipment_signatures to equipment_borrowing
ALTER TABLE equipment_signatures RENAME TO equipment_borrowing;

-- Add new columns for expanded form
ALTER TABLE equipment_borrowing
ADD COLUMN IF NOT EXISTS first_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS last_name VARCHAR(100),
ADD COLUMN IF NOT EXISTS company_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS phone VARCHAR(50),
ADD COLUMN IF NOT EXISTS id_number VARCHAR(50),
ADD COLUMN IF NOT EXISTS id_photo_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS equipment_name VARCHAR(255),
ADD COLUMN IF NOT EXISTS equipment_photo_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS status VARCHAR(20) DEFAULT 'open',
ADD COLUMN IF NOT EXISTS closed_by UUID REFERENCES users(id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS closed_at TIMESTAMP;

-- Migrate existing data: split customer_name into first_name/last_name
UPDATE equipment_borrowing 
SET first_name = SPLIT_PART(customer_name, ' ', 1),
    last_name = SUBSTRING(customer_name FROM POSITION(' ' IN customer_name) + 1)
WHERE customer_name IS NOT NULL AND first_name IS NULL;

-- Create indexes
CREATE INDEX IF NOT EXISTS idx_equipment_borrowing_status ON equipment_borrowing(status);
CREATE INDEX IF NOT EXISTS idx_equipment_borrowing_closed_by ON equipment_borrowing(closed_by);

-- Update foreign key reference in signing_forms to point to new table name
-- (The CASCADE should still work, but let's add a comment)
COMMENT ON TABLE equipment_borrowing IS 'Equipment borrowing tickets with customer info, equipment details, and signature';
COMMENT ON COLUMN equipment_borrowing.status IS 'Ticket status: open or archived';
COMMENT ON COLUMN equipment_borrowing.closed_by IS 'User who archived/closed the ticket';
COMMENT ON COLUMN equipment_borrowing.closed_at IS 'Timestamp when ticket was archived';

-- Rename signing_forms to borrowing_regulations for clarity
ALTER TABLE signing_forms RENAME TO borrowing_regulations;

COMMENT ON TABLE borrowing_regulations IS 'Regulation forms for equipment borrowing';
