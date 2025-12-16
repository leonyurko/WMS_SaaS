-- Migration: Add delivery notes table for tracking delivery documentation
-- Date: 2025-12-16

-- Delivery Notes Table
CREATE TABLE IF NOT EXISTS delivery_notes (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  supplier_id UUID REFERENCES suppliers(id) ON DELETE SET NULL,
  received_by UUID NOT NULL REFERENCES users(id),
  delivery_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  notes TEXT,
  media_urls JSONB DEFAULT '[]'::jsonb,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for delivery_notes
CREATE INDEX IF NOT EXISTS idx_delivery_notes_supplier ON delivery_notes(supplier_id);
CREATE INDEX IF NOT EXISTS idx_delivery_notes_received_by ON delivery_notes(received_by);
CREATE INDEX IF NOT EXISTS idx_delivery_notes_date ON delivery_notes(delivery_date DESC);
CREATE INDEX IF NOT EXISTS idx_delivery_notes_created ON delivery_notes(created_at DESC);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_delivery_notes_updated_at ON delivery_notes;
CREATE TRIGGER update_delivery_notes_updated_at 
  BEFORE UPDATE ON delivery_notes
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE delivery_notes IS 'Delivery notes documentation with media storage';
COMMENT ON COLUMN delivery_notes.supplier_id IS 'Optional reference to supplier (can be NULL for one-time deliveries)';
COMMENT ON COLUMN delivery_notes.received_by IS 'User/employee who received the delivery';
COMMENT ON COLUMN delivery_notes.media_urls IS 'JSON array of media file URLs (images, PDFs)';
