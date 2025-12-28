-- User Permissions Table for per-user page access control
-- Migration: 015-add-user-permissions.sql

CREATE TABLE IF NOT EXISTS user_permissions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
  page_key VARCHAR(50) NOT NULL,
  has_access BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  UNIQUE(user_id, page_key)
);

-- Create indexes for user_permissions table
CREATE INDEX IF NOT EXISTS idx_user_permissions_user_id ON user_permissions(user_id);
CREATE INDEX IF NOT EXISTS idx_user_permissions_page_key ON user_permissions(page_key);

-- Trigger to automatically update updated_at on user_permissions
DROP TRIGGER IF EXISTS update_user_permissions_updated_at ON user_permissions;
CREATE TRIGGER update_user_permissions_updated_at 
  BEFORE UPDATE ON user_permissions
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

COMMENT ON TABLE user_permissions IS 'Per-user page access permissions managed by admins';
