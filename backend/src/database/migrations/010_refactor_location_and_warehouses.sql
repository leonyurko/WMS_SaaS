-- Migration: Refactor Inventory Location and Introduce Warehouses table

-- 0. Drop dependent views that use the 'shelf' or 'shelf_column'
DROP VIEW IF EXISTS v_low_stock_items;

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
INSERT INTO warehouses (name)
SELECT DISTINCT location FROM inventory
WHERE location IS NOT NULL AND location != ''
ON CONFLICT (name) DO NOTHING;

-- 4. Link inventory items to their new warehouse_id
UPDATE inventory i
SET warehouse_id = w.id
FROM warehouses w
WHERE i.location = w.name;

-- 5. Refactor inventory.location to be the "shelf + column" (actual physical location)
UPDATE inventory
SET location = TRIM(BOTH ' ' FROM CONCAT(COALESCE(shelf, ''), ' ', COALESCE(shelf_column, '')));

-- 6. Setup indexes
CREATE INDEX IF NOT EXISTS idx_inventory_warehouse_id ON inventory(warehouse_id);

-- 7. Drop old columns
ALTER TABLE inventory DROP COLUMN IF EXISTS shelf;
ALTER TABLE inventory DROP COLUMN IF EXISTS shelf_column;

-- 8. Re-create the view using the new schema (optional, but good practice if other tools use it)
-- v_low_stock_items usually selects * from inventory or specific columns.
-- If we recreate it, it will pick up the new columns and ignore the dropped ones.
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
