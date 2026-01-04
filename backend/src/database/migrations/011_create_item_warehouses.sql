-- Create item_warehouses table for per-location stock tracking
CREATE TABLE IF NOT EXISTS item_warehouses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
    warehouse_id UUID REFERENCES warehouses(id) ON DELETE SET NULL,
    quantity INTEGER NOT NULL DEFAULT 0 CHECK (quantity >= 0),
    location VARCHAR(100), -- Specific location in this warehouse (shelf/bin)
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    UNIQUE(inventory_id, warehouse_id) -- Prevent duplicate entries for same item+warehouse
);

-- Create index for performance
CREATE INDEX IF NOT EXISTS idx_item_warehouses_inventory ON item_warehouses(inventory_id);
CREATE INDEX IF NOT EXISTS idx_item_warehouses_warehouse ON item_warehouses(warehouse_id);

-- Migrate existing data from inventory table to item_warehouses
-- Only migrate if there is a warehouse_id set
INSERT INTO item_warehouses (inventory_id, warehouse_id, quantity, location)
SELECT id, warehouse_id, current_stock, location
FROM inventory
WHERE warehouse_id IS NOT NULL
ON CONFLICT (inventory_id, warehouse_id) DO UPDATE 
SET quantity = EXCLUDED.quantity, location = EXCLUDED.location;

-- Update items with no warehouse_id? 
-- We might want to create a "Default Warehouse" or leave them orphans?
-- For now, we only migrate linked items. Unlinked items will have 0 stock in specific warehouses but total stock remains.
-- Actually, the goal is for current_stock to be a SUM.
-- If we have items without warehouse_id, they can't be in item_warehouses (needs warehouse_id preferably).
-- Let's just migrate what we can.

-- Function to update inventory.current_stock based on item_warehouses sum
CREATE OR REPLACE FUNCTION update_inventory_total_stock()
RETURNS TRIGGER AS $$
BEGIN
    UPDATE inventory
    SET current_stock = (
        SELECT COALESCE(SUM(quantity), 0)
        FROM item_warehouses
        WHERE inventory_id = COALESCE(NEW.inventory_id, OLD.inventory_id)
    )
    WHERE id = COALESCE(NEW.inventory_id, OLD.inventory_id);
    
    RETURN NULL;
END;
$$ LANGUAGE plpgsql;

-- Trigger to keep inventory.current_stock in sync
DROP TRIGGER IF EXISTS trigger_update_inventory_stock ON item_warehouses;
CREATE TRIGGER trigger_update_inventory_stock
AFTER INSERT OR UPDATE OR DELETE ON item_warehouses
FOR EACH ROW
EXECUTE FUNCTION update_inventory_total_stock();

-- Also add updated_at trigger for the new table
DROP TRIGGER IF EXISTS update_item_warehouses_updated_at ON item_warehouses;
CREATE TRIGGER update_item_warehouses_updated_at 
BEFORE UPDATE ON item_warehouses
FOR EACH ROW 
EXECUTE FUNCTION update_updated_at_column();
