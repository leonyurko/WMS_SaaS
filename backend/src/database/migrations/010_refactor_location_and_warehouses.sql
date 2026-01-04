-- Migration: Refactor Inventory Location and Introduce Warehouses table

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
-- We insert distinct locations that look like warehouses (assuming 'location' was used for Warehouse Name)
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
-- We concatenate shelf and shelf_column. If they are null, we use an empty string or just keep it empty initially.
-- But wait, the user wants 'location' to be the NEW free text field.
-- The old 'location' column held the Warehouse Name. We have migrated that to 'warehouse_id'.
-- Now we repurpose 'location' column to hold the specific spot.
-- So we overwrite 'location' with the combined shelf info.

UPDATE inventory
SET location = TRIM(BOTH ' ' FROM CONCAT(COALESCE(shelf, ''), ' ', COALESCE(shelf_column, '')));

-- 6. Setup indexes
CREATE INDEX IF NOT EXISTS idx_inventory_warehouse_id ON inventory(warehouse_id);

-- 7. Drop old columns (Optional, but cleaner. We can keep them for safety if preferred, but plan said drop)
-- We will drop them to enforce the new schema.
ALTER TABLE inventory DROP COLUMN IF EXISTS shelf;
ALTER TABLE inventory DROP COLUMN IF EXISTS shelf_column;

-- Trigger for warehouses updated_at
DROP TRIGGER IF EXISTS update_warehouses_updated_at ON warehouses;
CREATE TRIGGER update_warehouses_updated_at 
  BEFORE UPDATE ON warehouses
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();
