-- Migration: Add equipment signing tables
-- Date: 2025-12-16

-- Signing Forms Table (admin creates regulation forms)
CREATE TABLE IF NOT EXISTS signing_forms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  regulation_text TEXT NOT NULL,
  is_active BOOLEAN DEFAULT true,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Equipment Signatures Table (customer signatures)
CREATE TABLE IF NOT EXISTS equipment_signatures (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  form_id UUID NOT NULL REFERENCES signing_forms(id) ON DELETE CASCADE,
  customer_name VARCHAR(255) NOT NULL,
  customer_email VARCHAR(255),
  customer_phone VARCHAR(50),
  signature_data TEXT NOT NULL,
  signed_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  ip_address VARCHAR(50)
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_signing_forms_active ON signing_forms(is_active);
CREATE INDEX IF NOT EXISTS idx_signing_forms_created ON signing_forms(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_equipment_signatures_form ON equipment_signatures(form_id);
CREATE INDEX IF NOT EXISTS idx_equipment_signatures_signed ON equipment_signatures(signed_at DESC);

-- Triggers for updated_at
DROP TRIGGER IF EXISTS update_signing_forms_updated_at ON signing_forms;
CREATE TRIGGER update_signing_forms_updated_at 
  BEFORE UPDATE ON signing_forms
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Comments
COMMENT ON TABLE signing_forms IS 'Regulation forms that customers can sign';
COMMENT ON TABLE equipment_signatures IS 'Customer signatures on regulation forms';
COMMENT ON COLUMN equipment_signatures.signature_data IS 'Base64 encoded signature image data';
