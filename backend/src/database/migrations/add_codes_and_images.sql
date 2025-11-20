-- Migration: Add barcode/QR code images and multiple image support
-- Date: 2025-11-20

-- Add new columns to inventory table
ALTER TABLE inventory 
ADD COLUMN IF NOT EXISTS image_urls JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS barcode_image_url VARCHAR(500),
ADD COLUMN IF NOT EXISTS qr_image_url VARCHAR(500);

-- Add comment for documentation
COMMENT ON COLUMN inventory.image_urls IS 'Array of image URLs (up to 5 images per item)';
COMMENT ON COLUMN inventory.barcode_image_url IS 'Generated barcode image URL';
COMMENT ON COLUMN inventory.qr_image_url IS 'Generated QR code image URL';
