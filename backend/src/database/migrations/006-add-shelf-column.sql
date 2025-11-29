-- Migration: Add Shelf Column
-- Date: 2025-11-29

ALTER TABLE inventory
ADD COLUMN IF NOT EXISTS shelf_column TEXT;

COMMENT ON COLUMN inventory.shelf_column IS 'Specific column on the shelf (e.g., "1", "1 To 5")';
