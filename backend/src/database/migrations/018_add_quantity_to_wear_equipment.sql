-- Migration: Add quantity column to wear_equipment table
-- Date: 2026-01-08

ALTER TABLE wear_equipment 
ADD COLUMN IF NOT EXISTS quantity INTEGER DEFAULT 1 NOT NULL;

COMMENT ON COLUMN wear_equipment.quantity IS 'Quantity of the item reported as worn/damaged';
