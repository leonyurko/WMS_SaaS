-- 017_restore_locations_from_warehouses.sql
-- Fix for migration 010 where locations were wrongly treated as warehouses

DO $$
DECLARE
    main_warehouse_id UUID;
    bad_warehouse RECORD;
BEGIN
    -- 1. Ensure 'Main Warehouse' exists to move items to
    INSERT INTO warehouses (name) VALUES ('Main Warehouse') 
    ON CONFLICT (name) DO UPDATE SET name = EXCLUDED.name -- idle update to get ID returning
    RETURNING id INTO main_warehouse_id;

    -- If we couldn't get ID (e.g. conflict and no returning), select it
    IF main_warehouse_id IS NULL THEN
        SELECT id INTO main_warehouse_id FROM warehouses WHERE name = 'Main Warehouse';
    END IF;

    -- 2. Loop through warehouses that look like locations
    -- Heuristic: Names containing digits, commas, or hyphens, AND NOT 'Main Warehouse'
    -- You can adjust the WHERE clause if needed. 
    -- We assume real warehouses don't usually fail this regex unless specifically named "Warehouse-1".
    -- But "A-001", "Row 1", "Shelf A" usually match.
    -- To be safer, we target names that were likely created by 010 (we can't know for sure, so we use pattern).
    
    FOR bad_warehouse IN 
        SELECT * FROM warehouses 
        WHERE id != main_warehouse_id
        AND (name ~ '[0-9]' OR name LIKE '%,%') -- Contains digits or commas
        AND name NOT ILIKE '%Warehouse%' -- Exclude names with "Warehouse" in them
    LOOP
        -- Update item_warehouses linked to this bad warehouse
        -- Move them to Main Warehouse
        -- Set 'location' to the bad warehouse's name (which was the original location)
        
        -- Note: We use ON CONFLICT DO UPDATE to handle case where item already has Main Warehouse entry
        -- But since we are cleaning up split data, it's likely unique per item.
        -- Actually, item_warehouses has unique constraint (inventory_id, warehouse_id).
        
        -- Approach: Update rows to point to main_warehouse_id.
        -- If conflict (item already in main warehouse), we add quantities and append locations.
        
        -- Simple case: Update where no conflict
        UPDATE item_warehouses
        SET warehouse_id = main_warehouse_id,
            location = bad_warehouse.name -- Restore original location string
        WHERE warehouse_id = bad_warehouse.id
        AND NOT EXISTS (
            SELECT 1 FROM item_warehouses iw2 
            WHERE iw2.inventory_id = item_warehouses.inventory_id 
            AND iw2.warehouse_id = main_warehouse_id
        );

        -- Complex case: Merge where conflict exists
        -- (Item is in both Bad Warehouse and Main Warehouse - rare if 010 ran cleanly but possible)
        UPDATE item_warehouses main
        SET quantity = main.quantity + sub.quantity,
            location = COALESCE(main.location, '') || ', ' || sub.name -- Append location info
        FROM (
            SELECT iw.inventory_id, iw.quantity, w.name
            FROM item_warehouses iw
            JOIN warehouses w ON iw.warehouse_id = w.id
            WHERE iw.warehouse_id = bad_warehouse.id
        ) sub
        WHERE main.inventory_id = sub.inventory_id
        AND main.warehouse_id = main_warehouse_id;

        -- Delete the bad item_warehouses rows that were merged (if any remained from complex case, though UPDATE above targets 'main')
        -- Actually the complex case UPDATE didn't delete the 'sub' rows.
        -- We can just delete all item_warehouses for bad_warehouse now, 
        -- assuming simple case moved them and complex case merged them.
        -- Wait, simple case CHANGED the warehouse_id, so they are gone from bad_warehouse group.
        -- Complex case updated MAIN, so bad_warehouse rows still exist. We must delete them.
        
        DELETE FROM item_warehouses WHERE warehouse_id = bad_warehouse.id;

        -- Finally, delete the bad warehouse
        DELETE FROM warehouses WHERE id = bad_warehouse.id;
        
        RAISE NOTICE 'Restored location from warehouse: %', bad_warehouse.name;
    END LOOP;
END $$;
