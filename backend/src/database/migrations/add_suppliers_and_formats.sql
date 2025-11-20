-- Migration: Add suppliers and email formats tables
-- Date: 2025-11-20

-- Suppliers Table
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  contact_person VARCHAR(255),
  phone VARCHAR(50),
  email VARCHAR(255) NOT NULL,
  location VARCHAR(255),
  notes TEXT,
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Email Format Templates Table
CREATE TABLE IF NOT EXISTS email_formats (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  subject VARCHAR(500) NOT NULL,
  body TEXT NOT NULL,
  format_type VARCHAR(50) DEFAULT 'order',
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Supplier Orders Table (for tracking orders sent)
CREATE TABLE IF NOT EXISTS supplier_orders (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID NOT NULL REFERENCES suppliers(id) ON DELETE CASCADE,
  item_id UUID REFERENCES inventory(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  notes TEXT,
  status VARCHAR(50) DEFAULT 'sent',
  sent_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Add supplier_id to inventory table (optional - link items to preferred suppliers)
ALTER TABLE inventory 
ADD COLUMN IF NOT EXISTS supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL;

-- Indexes
CREATE INDEX IF NOT EXISTS idx_suppliers_email ON suppliers(email);
CREATE INDEX IF NOT EXISTS idx_suppliers_active ON suppliers(is_active);
CREATE INDEX IF NOT EXISTS idx_supplier_orders_supplier ON supplier_orders(supplier_id);
CREATE INDEX IF NOT EXISTS idx_supplier_orders_created ON supplier_orders(created_at DESC);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_suppliers_updated_at ON suppliers;
CREATE TRIGGER update_suppliers_updated_at 
  BEFORE UPDATE ON suppliers
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

DROP TRIGGER IF EXISTS update_email_formats_updated_at ON email_formats;
CREATE TRIGGER update_email_formats_updated_at 
  BEFORE UPDATE ON email_formats
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE suppliers IS 'Supplier contact information and details';
COMMENT ON TABLE email_formats IS 'Email templates for supplier communications';
COMMENT ON TABLE supplier_orders IS 'Order history sent to suppliers';
