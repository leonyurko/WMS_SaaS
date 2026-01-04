const warehouseService = require('../services/warehouseService');

/**
 * Get all warehouses
 */
const getAllWarehouses = async (req, res, next) => {
    try {
        const warehouses = await warehouseService.getAllWarehouses();
        res.json({
            status: 'success',
            data: { warehouses }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Create warehouse
 */
const createWarehouse = async (req, res, next) => {
    try {
        const { name } = req.body;
        const warehouse = await warehouseService.createWarehouse(name);
        res.status(201).json({
            status: 'success',
            data: { warehouse }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Update warehouse
 */
const updateWarehouse = async (req, res, next) => {
    try {
        const { id } = req.params;
        const { name } = req.body;
        const warehouse = await warehouseService.updateWarehouse(id, name);
        res.json({
            status: 'success',
            data: { warehouse }
        });
    } catch (error) {
        next(error);
    }
};

/**
 * Delete warehouse
 */
const deleteWarehouse = async (req, res, next) => {
    try {
        const { id } = req.params;
        await warehouseService.deleteWarehouse(id);
        res.json({
            status: 'success',
            message: 'Warehouse deleted'
        });
    } catch (error) {
        next(error);
    }
};

module.exports = {
    getAllWarehouses,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse
};
