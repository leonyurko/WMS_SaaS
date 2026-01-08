-- Migration: Refactor Inventory Location and Introduce Warehouses table
-- UPDATED: Skipped dropping columns to avoid dependency issues with Views/Functions.
-- UPDATED: Dropping view at start with CASCADE to ensure clean recreation.

-- 0. Drop the view first to avoid dependency issues during migration
DROP VIEW IF EXISTS v_low_stock_items CASCADE;

-- 1. Create warehouses table
CREATE TABLE IF NOT EXISTS warehouses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- 2. Add warehouse_id to inventory
ALTER TABLE inventory ADD COLUMN IF NOT EXISTS warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL;

-- 3. Migrate existing warehouse names from inventory.location to warehouses table
-- UPDATED: Only treat likely warehouse names as warehouses (containing "Warehouse" or no digits/commas)
INSERT INTO warehouses (name)
SELECT DISTINCT location FROM inventory
WHERE location IS NOT NULL AND location != ''
AND (location ILIKE '%Warehouse%' OR location NOT SIMILAR TO '%[0-9]%')
ON CONFLICT (name) DO NOTHING;

-- Ensure Main Warehouse exists for others
INSERT INTO warehouses (name) VALUES ('Main Warehouse') ON CONFLICT (name) DO NOTHING;

-- 4. Link inventory items to their new warehouse_id
UPDATE inventory i
SET warehouse_id = w.id
FROM warehouses w
WHERE i.location = w.name;

-- Assign orphans to Main Warehouse
UPDATE inventory
SET warehouse_id = (SELECT id FROM warehouses WHERE name = 'Main Warehouse')
WHERE warehouse_id IS NULL;

-- 5. Refactor inventory.location to be the "shelf + column" (actual physical location)
-- Only overwrite if shelf/column data exists, otherwise keep the original location string as the location
UPDATE inventory
SET location = TRIM(BOTH ' ' FROM CONCAT(COALESCE(shelf, ''), ' ', COALESCE(shelf_column, '')))
WHERE COALESCE(shelf, '') != '' OR COALESCE(shelf_column, '') != '';

-- 6. Setup indexes
CREATE INDEX IF NOT EXISTS idx_inventory_warehouse_id ON inventory(warehouse_id);

-- 7. [SKIPPED] Drop old columns - Keeping them to avoid 'cannot drop column' dependency errors
-- ALTER TABLE inventory DROP COLUMN IF EXISTS shelf;
-- ALTER TABLE inventory DROP COLUMN IF EXISTS shelf_column;

-- 8. Re-create/Update the view (Optional, ensuring it works with new schema if we wanted to default to it)
CREATE OR REPLACE VIEW v_low_stock_items AS
SELECT 
    i.id,
    i.name,
    i.location,
    w.name as warehouse_name,
    i.current_stock,
    i.min_threshold,
    c.name as category_name,
    sc.name as sub_category_name
FROM inventory i
LEFT JOIN categories c ON i.category_id = c.id
LEFT JOIN categories sc ON i.sub_category_id = sc.id
LEFT JOIN warehouses w ON i.warehouse_id = w.id
WHERE i.current_stock <= i.min_threshold;

-- Trigger for warehouses updated_at
DROP TRIGGER IF EXISTS update_warehouses_updated_at ON warehouses;
CREATE TRIGGER update_warehouses_updated_at 
  BEFORE UPDATE ON warehouses
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
