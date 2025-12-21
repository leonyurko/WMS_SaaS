-- Migration: Add wear equipment tracking table
-- Date: 2025-12-21

-- Wear Equipment Table (tracks wear/damage reports for inventory items)
CREATE TABLE IF NOT EXISTS wear_equipment (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  inventory_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  severity VARCHAR(20) NOT NULL CHECK (severity IN ('low', 'medium', 'high', 'critical')),
  description TEXT,
  media_urls JSONB DEFAULT '[]'::jsonb,
  reported_by UUID REFERENCES users(id) ON DELETE SET NULL,
  status VARCHAR(20) DEFAULT 'open' CHECK (status IN ('open', 'resolved', 'archived')),
  resolved_by UUID REFERENCES users(id) ON DELETE SET NULL,
  resolved_at TIMESTAMP,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Indexes for wear_equipment
CREATE INDEX IF NOT EXISTS idx_wear_equipment_inventory ON wear_equipment(inventory_id);
CREATE INDEX IF NOT EXISTS idx_wear_equipment_status ON wear_equipment(status);
CREATE INDEX IF NOT EXISTS idx_wear_equipment_severity ON wear_equipment(severity);
CREATE INDEX IF NOT EXISTS idx_wear_equipment_created ON wear_equipment(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_wear_equipment_reported_by ON wear_equipment(reported_by);

-- Trigger for updated_at
DROP TRIGGER IF EXISTS update_wear_equipment_updated_at ON wear_equipment;
CREATE TRIGGER update_wear_equipment_updated_at 
  BEFORE UPDATE ON wear_equipment
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE wear_equipment IS 'Tracks wear and damage reports for inventory items with media documentation';
COMMENT ON COLUMN wear_equipment.severity IS 'Wear severity level: low, medium, high, critical';
COMMENT ON COLUMN wear_equipment.media_urls IS 'JSON array of media file URLs (images) documenting the wear';
COMMENT ON COLUMN wear_equipment.status IS 'Report status: open, resolved, archived';
