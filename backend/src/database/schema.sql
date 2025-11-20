-- Warehouse Management System Database Schema

-- Enable UUID extension
CREATE EXTENSION IF NOT EXISTS "pgcrypto";

-- Users Table
CREATE TABLE IF NOT EXISTS users (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  username VARCHAR(50) UNIQUE NOT NULL,
  email VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  role VARCHAR(20) NOT NULL CHECK (role IN ('Admin', 'Manager', 'Staff')),
  is_active BOOLEAN DEFAULT true,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for users table
CREATE INDEX IF NOT EXISTS idx_users_username ON users(username);
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Categories Table
CREATE TABLE IF NOT EXISTS categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(100) UNIQUE NOT NULL,
  description TEXT,
  parent_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create index for categories
CREATE INDEX IF NOT EXISTS idx_categories_parent ON categories(parent_id);
CREATE INDEX IF NOT EXISTS idx_categories_name ON categories(name);

-- Inventory Table
CREATE TABLE IF NOT EXISTS inventory (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) NOT NULL,
  location VARCHAR(100) NOT NULL,
  category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  sub_category_id UUID REFERENCES categories(id) ON DELETE SET NULL,
  shelf VARCHAR(50),
  description TEXT,
  image_url VARCHAR(500),
  image_urls JSONB DEFAULT '[]'::jsonb,
  barcode VARCHAR(100) UNIQUE NOT NULL,
  barcode_image_url VARCHAR(500),
  qr_image_url VARCHAR(500),
  current_stock INTEGER NOT NULL DEFAULT 0 CHECK (current_stock >= 0),
  min_threshold INTEGER NOT NULL DEFAULT 10 CHECK (min_threshold >= 0),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for inventory table
CREATE INDEX IF NOT EXISTS idx_inventory_barcode ON inventory(barcode);
CREATE INDEX IF NOT EXISTS idx_inventory_category ON inventory(category_id);
CREATE INDEX IF NOT EXISTS idx_inventory_name ON inventory(name);
CREATE INDEX IF NOT EXISTS idx_inventory_stock ON inventory(current_stock);
CREATE INDEX IF NOT EXISTS idx_inventory_location ON inventory(location);

-- Transactions Table
CREATE TABLE IF NOT EXISTS transactions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  item_id UUID NOT NULL REFERENCES inventory(id) ON DELETE CASCADE,
  user_id UUID NOT NULL REFERENCES users(id) ON DELETE SET NULL,
  quantity INTEGER NOT NULL,
  reason TEXT NOT NULL,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('addition', 'deduction')),
  created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for transactions table
CREATE INDEX IF NOT EXISTS idx_transactions_item ON transactions(item_id);
CREATE INDEX IF NOT EXISTS idx_transactions_user ON transactions(user_id);
CREATE INDEX IF NOT EXISTS idx_transactions_created ON transactions(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);

-- Database View for Low Stock Items
CREATE OR REPLACE VIEW v_low_stock_items AS
SELECT 
  i.id,
  i.name,
  i.location,
  i.shelf,
  i.current_stock,
  i.min_threshold,
  c.name as category_name,
  sc.name as sub_category_name
FROM inventory i
LEFT JOIN categories c ON i.category_id = c.id
LEFT JOIN categories sc ON i.sub_category_id = sc.id
WHERE i.current_stock <= i.min_threshold
ORDER BY i.current_stock ASC;

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Trigger to automatically update updated_at on inventory
DROP TRIGGER IF EXISTS update_inventory_updated_at ON inventory;
CREATE TRIGGER update_inventory_updated_at 
  BEFORE UPDATE ON inventory
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Trigger to automatically update updated_at on users
DROP TRIGGER IF EXISTS update_users_updated_at ON users;
CREATE TRIGGER update_users_updated_at 
  BEFORE UPDATE ON users
  FOR EACH ROW 
  EXECUTE FUNCTION update_updated_at_column();

-- Comments for documentation
COMMENT ON TABLE users IS 'Stores user accounts with role-based access control';
COMMENT ON TABLE categories IS 'Hierarchical product categories and subcategories';
COMMENT ON TABLE inventory IS 'Main inventory items with stock levels and metadata';
COMMENT ON TABLE transactions IS 'Audit log of all inventory stock changes';
COMMENT ON VIEW v_low_stock_items IS 'View of items at or below minimum threshold';
