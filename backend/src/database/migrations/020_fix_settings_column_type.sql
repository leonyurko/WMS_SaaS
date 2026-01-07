-- Fix system_settings.updated_by column type to UUID
-- Migration: 020_fix_settings_column_type.sql

DO $$ 
BEGIN
    -- Check if column is not uuid (it was created as integer in previous version)
    IF EXISTS (
        SELECT 1 
        FROM information_schema.columns 
        WHERE table_name = 'system_settings' 
        AND column_name = 'updated_by' 
        AND data_type != 'uuid'
    ) THEN
        -- Alter column to UUID. Since it's likely empty or null, simple cast matches.
        -- Using 'USING updated_by::text::uuid' handles potential casting if not null. 
        -- If it was integer, direct cast to uuid might fail without text intermediate if values existed? 
        -- But integer values (like 1, 2) aren't valid UUIDs anyway.
        -- Assuming column is NULL because inserting UUID into INTEGER would have failed.
        ALTER TABLE system_settings ALTER COLUMN updated_by TYPE UUID USING updated_by::text::uuid;
    END IF;
END $$;
