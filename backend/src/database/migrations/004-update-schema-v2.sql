-- Migration: Warehouse Layout and Supplier Updates
-- Date: 2025-11-29

-- Warehouse Layouts Table
CREATE TABLE IF NOT EXISTS warehouse_layouts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  warehouse_name VARCHAR(50) NOT NULL UNIQUE, -- 'Small' or 'Large'
  structure JSONB NOT NULL DEFAULT '[]'::jsonb, -- Array of rows with their columns
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Trigger for warehouse_layouts updated_at
DROP TRIGGER IF EXISTS update_warehouse_layouts_updated_at ON warehouse_layouts;
CREATE TRIGGER update_warehouse_layouts_updated_at 
  BEFORE UPDATE ON warehouse_layouts
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Update Inventory Table
ALTER TABLE inventory 
ADD COLUMN IF NOT EXISTS shelf_column VARCHAR(50);

-- Update Suppliers Table
ALTER TABLE suppliers 
ADD COLUMN IF NOT EXISTS operating_hours TEXT,
ADD COLUMN IF NOT EXISTS additional_phones JSONB DEFAULT '[]'::jsonb,
ADD COLUMN IF NOT EXISTS additional_emails JSONB DEFAULT '[]'::jsonb;

-- Comments
COMMENT ON TABLE warehouse_layouts IS 'Configuration for warehouse rows and columns';
COMMENT ON COLUMN inventory.shelf_column IS 'Specific column on the shelf/row';
