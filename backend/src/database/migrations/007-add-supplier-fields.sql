-- Migration: Add missing columns to suppliers table
-- Date: 2025-12-02

ALTER TABLE suppliers
ADD COLUMN IF NOT EXISTS operating_hours VARCHAR(100),
ADD COLUMN IF NOT EXISTS additional_phones JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS additional_emails JSONB DEFAULT '[]'::jsonb;

COMMENT ON COLUMN suppliers.operating_hours IS 'Operating hours of the supplier';
COMMENT ON COLUMN suppliers.additional_phones IS 'Additional phone numbers for the supplier';
COMMENT ON COLUMN suppliers.additional_emails IS 'Additional email addresses for the supplier';
