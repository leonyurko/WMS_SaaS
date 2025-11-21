-- Fix image URLs that contain localhost:5000
-- This migration removes the localhost:5000 prefix from all image URLs
-- so they become relative paths that work with the nginx proxy

UPDATE inventory 
SET 
  image_url = REPLACE(image_url, 'http://localhost:5000', ''),
  image_urls = REPLACE(image_urls::text, 'http://localhost:5000', '')::jsonb,
  barcode_image_url = REPLACE(barcode_image_url, 'http://localhost:5000', ''),
  qr_image_url = REPLACE(qr_image_url, 'http://localhost:5000', '')
WHERE 
  image_url LIKE '%localhost:5000%' 
  OR image_urls::text LIKE '%localhost:5000%'
  OR barcode_image_url LIKE '%localhost:5000%'
  OR qr_image_url LIKE '%localhost:5000%';
