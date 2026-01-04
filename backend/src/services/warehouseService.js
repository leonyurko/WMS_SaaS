const warehouseModel = require('../models/warehouseModel');

/**
 * Get all warehouses
 */
const getAllWarehouses = async () => {
    return await warehouseModel.getAll();
};

/**
 * Get warehouse by ID
 */
const getWarehouseById = async (id) => {
    return await warehouseModel.getById(id);
};

/**
 * Create warehouse
 */
const createWarehouse = async (name) => {
    if (!name) throw new Error('Warehouse name is required');
    return await warehouseModel.create(name);
};

/**
 * Update warehouse
 */
const updateWarehouse = async (id, name) => {
    if (!name) throw new Error('Warehouse name is required');
    return await warehouseModel.update(id, name);
};

/**
 * Delete warehouse
 */
const deleteWarehouse = async (id) => {
    return await warehouseModel.delete(id);
};

module.exports = {
    getAllWarehouses,
    getWarehouseById,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse
};
