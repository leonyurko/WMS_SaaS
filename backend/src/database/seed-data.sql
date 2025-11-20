-- Seed Data for Warehouse Management System
-- This script populates the database with initial data for testing

-- Insert default categories
INSERT INTO categories (id, name, description, parent_id) VALUES
  ('11111111-1111-1111-1111-111111111111', 'Electronics', 'Electronic devices and components', NULL),
  ('22222222-2222-2222-2222-222222222222', 'Office Supplies', 'Office equipment and supplies', NULL),
  ('33333333-3333-3333-3333-333333333333', 'Furniture', 'Office and warehouse furniture', NULL),
  ('44444444-4444-4444-4444-444444444444', 'Tools', 'Hand tools and power tools', NULL),
  ('55555555-5555-5555-5555-555555555555', 'Safety Equipment', 'Personal protective equipment', NULL)
ON CONFLICT (id) DO NOTHING;

-- Insert subcategories
INSERT INTO categories (id, name, description, parent_id) VALUES
  ('11111111-1111-1111-1111-111111111112', 'Computers', 'Desktop and laptop computers', '11111111-1111-1111-1111-111111111111'),
  ('11111111-1111-1111-1111-111111111113', 'Peripherals', 'Computer accessories', '11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222223', 'Stationery', 'Pens, paper, and writing supplies', '22222222-2222-2222-2222-222222222222'),
  ('44444444-4444-4444-4444-444444444445', 'Hand Tools', 'Manual hand tools', '44444444-4444-4444-4444-444444444444'),
  ('44444444-4444-4444-4444-444444444446', 'Power Tools', 'Electric and battery powered tools', '44444444-4444-4444-4444-444444444444')
ON CONFLICT (id) DO NOTHING;

-- Insert default users (password is 'password123' hashed with bcrypt)
-- Hash generated with: bcrypt.hashSync('password123', 10)
INSERT INTO users (id, username, email, password_hash, role, is_active) VALUES
  ('aaaaaaaa-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'admin', 'admin@wms.com', '$2b$10$QL.M4XMkrhNvpytl4KkkOusiWmLJSJQfgNzi5hYrQC.6zafN.d0JO', 'Admin', true),
  ('bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 'john.doe', 'john.doe@wms.com', '$2b$10$QL.M4XMkrhNvpytl4KkkOusiWmLJSJQfgNzi5hYrQC.6zafN.d0JO', 'Manager', true),
  ('cccccccc-cccc-cccc-cccc-cccccccccccc', 'jane.smith', 'jane.smith@wms.com', '$2b$10$QL.M4XMkrhNvpytl4KkkOusiWmLJSJQfgNzi5hYrQC.6zafN.d0JO', 'Staff', true),
  ('dddddddd-dddd-dddd-dddd-dddddddddddd', 'mike.wilson', 'mike.wilson@wms.com', '$2b$10$QL.M4XMkrhNvpytl4KkkOusiWmLJSJQfgNzi5hYrQC.6zafN.d0JO', 'Staff', true)
ON CONFLICT (id) DO UPDATE SET password_hash = EXCLUDED.password_hash;

-- Insert sample inventory items
INSERT INTO inventory (id, name, location, category_id, sub_category_id, shelf, description, barcode, current_stock, min_threshold) VALUES
  ('10000000-0000-0000-0000-000000000001', 'Wireless Mouse', 'Warehouse A', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111113', 'A-001', 'Ergonomic wireless mouse with USB receiver', 'WMS-A-001', 152, 20),
  ('10000000-0000-0000-0000-000000000002', 'Mechanical Keyboard', 'Warehouse A', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111113', 'A-002', 'RGB mechanical gaming keyboard', 'WMS-A-002', 12, 15),
  ('10000000-0000-0000-0000-000000000003', 'HD Webcam', 'Warehouse A', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111113', 'A-003', '1080p HD webcam with built-in microphone', 'WMS-A-003', 88, 25),
  ('10000000-0000-0000-0000-000000000004', 'USB-C Dock', 'Warehouse A', '11111111-1111-1111-1111-111111111111', '11111111-1111-1111-1111-111111111113', 'A-004', 'Multi-port USB-C docking station', 'WMS-A-004', 0, 10),
  ('10000000-0000-0000-0000-000000000005', 'Laptop Stand', 'Warehouse B', '22222222-2222-2222-2222-222222222222', NULL, 'B-001', 'Adjustable aluminum laptop stand', 'WMS-B-001', 45, 15),
  ('10000000-0000-0000-0000-000000000006', 'Office Chair', 'Warehouse C', '33333333-3333-3333-3333-333333333333', NULL, 'C-001', 'Ergonomic office chair with lumbar support', 'WMS-C-001', 8, 10),
  ('10000000-0000-0000-0000-000000000007', 'Desk Lamp', 'Warehouse B', '22222222-2222-2222-2222-222222222222', NULL, 'B-002', 'LED desk lamp with adjustable brightness', 'WMS-B-002', 67, 20),
  ('10000000-0000-0000-0000-000000000008', 'Cordless Drill', 'Warehouse D', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444446', 'D-001', '20V cordless drill with battery', 'WMS-D-001', 23, 10),
  ('10000000-0000-0000-0000-000000000009', 'Safety Goggles', 'Warehouse E', '55555555-5555-5555-5555-555555555555', NULL, 'E-001', 'Impact-resistant safety goggles', 'WMS-E-001', 5, 30),
  ('10000000-0000-0000-0000-000000000010', 'Measuring Tape', 'Warehouse D', '44444444-4444-4444-4444-444444444444', '44444444-4444-4444-4444-444444444445', 'D-002', '25ft measuring tape with lock', 'WMS-D-002', 34, 15)
ON CONFLICT (id) DO NOTHING;

-- Insert sample transactions
INSERT INTO transactions (item_id, user_id, quantity, reason, transaction_type, created_at) VALUES
  ('10000000-0000-0000-0000-000000000001', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 50, 'Initial stock', 'addition', NOW() - INTERVAL '7 days'),
  ('10000000-0000-0000-0000-000000000001', 'cccccccc-cccc-cccc-cccc-cccccccccccc', -10, 'Order fulfillment', 'deduction', NOW() - INTERVAL '5 days'),
  ('10000000-0000-0000-0000-000000000002', 'bbbbbbbb-bbbb-bbbb-bbbb-bbbbbbbbbbbb', 30, 'Restock', 'addition', NOW() - INTERVAL '3 days'),
  ('10000000-0000-0000-0000-000000000003', 'dddddddd-dddd-dddd-dddd-dddddddddddd', -5, 'Customer order', 'deduction', NOW() - INTERVAL '2 days'),
  ('10000000-0000-0000-0000-000000000004', 'cccccccc-cccc-cccc-cccc-cccccccccccc', -10, 'Sold out', 'deduction', NOW() - INTERVAL '1 day')
ON CONFLICT DO NOTHING;

-- Display summary
DO $$
BEGIN
  RAISE NOTICE 'Seed data inserted successfully!';
  RAISE NOTICE 'Default users created:';
  RAISE NOTICE '  - admin / password123 (Admin)';
  RAISE NOTICE '  - john.doe / password123 (Manager)';
  RAISE NOTICE '  - jane.smith / password123 (Staff)';
  RAISE NOTICE '  - mike.wilson / password123 (Staff)';
END $$;
