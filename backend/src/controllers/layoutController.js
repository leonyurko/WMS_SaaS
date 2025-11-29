const { query } = require('../config/database');

/**
 * Get layout for a specific warehouse or all layouts
 * GET /api/layouts
 * GET /api/layouts/:name
 */
const getLayout = async (req, res, next) => {
    try {
        const { name } = req.params;

        let result;
        if (name) {
            result = await query('SELECT * FROM warehouse_layouts WHERE warehouse_name = $1', [name]);
            if (result.rows.length === 0) {
                // Return default structure if not found
                return res.json({
                    status: 'success',
                    data: { warehouse_name: name, structure: [] }
                });
            }
            return res.json({
                status: 'success',
                data: result.rows[0]
            });
        } else {
            result = await query('SELECT * FROM warehouse_layouts ORDER BY warehouse_name');
            return res.json({
                status: 'success',
                data: result.rows
            });
        }
    } catch (error) {
        next(error);
    }
};

/**
 * Save/Update layout for a warehouse
 * POST /api/layouts
 */
const saveLayout = async (req, res, next) => {
    try {
        const { warehouseName, structure } = req.body;

        if (!warehouseName || !structure) {
            return res.status(400).json({
                status: 'error',
                message: 'Warehouse name and structure are required'
            });
        }

        // Check if exists
        const check = await query('SELECT id FROM warehouse_layouts WHERE warehouse_name = $1', [warehouseName]);

        let result;
        if (check.rows.length > 0) {
            // Update
            result = await query(
                'UPDATE warehouse_layouts SET structure = $1 WHERE warehouse_name = $2 RETURNING *',
                [JSON.stringify(structure), warehouseName]
            );
        } else {
            // Insert
            result = await query(
                'INSERT INTO warehouse_layouts (warehouse_name, structure) VALUES ($1, $2) RETURNING *',
                [warehouseName, JSON.stringify(structure)]
            );
        }

        res.json({
            status: 'success',
            data: result.rows[0]
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getLayout,
    saveLayout
};
