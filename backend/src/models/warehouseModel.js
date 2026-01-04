const { query } = require('../config/database');

/**
 * Get all warehouses
 */
const getAll = async () => {
    const result = await query('SELECT * FROM warehouses ORDER BY name ASC');
    return result.rows;
};

/**
 * Get warehouse by ID
 */
const getById = async (id) => {
    const result = await query('SELECT * FROM warehouses WHERE id = $1', [id]);
    return result.rows[0];
};

/**
 * Create new warehouse
 */
const create = async (name) => {
    const result = await query(
        'INSERT INTO warehouses (name) VALUES ($1) RETURNING *',
        [name]
    );
    return result.rows[0];
};

/**
 * Update warehouse
 */
const update = async (id, name) => {
    const result = await query(
        'UPDATE warehouses SET name = $1 WHERE id = $2 RETURNING *',
        [name, id]
    );
    return result.rows[0];
};

/**
 * Delete warehouse
 */
const deleteWarehouse = async (id) => {
    const result = await query('DELETE FROM warehouses WHERE id = $1', [id]);
    return result.rowCount > 0;
};

module.exports = {
    getAll,
    getById,
    create,
    update,
    delete: deleteWarehouse
};
