-- Migration: Inventory Location Updates
-- Date: 2025-11-29

ALTER TABLE inventory
ADD COLUMN IF NOT EXISTS additional_locations JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS location_details TEXT;

COMMENT ON COLUMN inventory.additional_locations IS 'Array of additional locations (warehouse, shelf, shelf_column)';
COMMENT ON COLUMN inventory.location_details IS 'Free text for extra location information';
