-- Migration: Add borrowing tokens for one-time use links
-- Date: 2025-12-16

CREATE TABLE IF NOT EXISTS borrowing_tokens (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  regulation_id UUID NOT NULL REFERENCES borrowing_regulations(id) ON DELETE CASCADE,
  token VARCHAR(64) NOT NULL UNIQUE,
  customer_name VARCHAR(255),
  customer_phone VARCHAR(50),
  equipment_name VARCHAR(255),
  status VARCHAR(20) DEFAULT 'pending',  -- pending, used, expired
  ticket_id UUID REFERENCES equipment_borrowing(id) ON DELETE SET NULL,
  created_by UUID REFERENCES users(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  expires_at TIMESTAMP,
  used_at TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_borrowing_tokens_token ON borrowing_tokens(token);
CREATE INDEX IF NOT EXISTS idx_borrowing_tokens_regulation ON borrowing_tokens(regulation_id);
CREATE INDEX IF NOT EXISTS idx_borrowing_tokens_status ON borrowing_tokens(status);

COMMENT ON TABLE borrowing_tokens IS 'One-time use tokens for equipment borrowing forms';
COMMENT ON COLUMN borrowing_tokens.status IS 'pending = not yet used, used = form submitted, expired = manually expired';
