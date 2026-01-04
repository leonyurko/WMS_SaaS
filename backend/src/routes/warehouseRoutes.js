const express = require('express');
const router = express.Router();
const {
    getAllWarehouses,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse
} = require('../controllers/warehouseController');

console.log('DEBUG: Imported warehouseController in routes:', require('../controllers/warehouseController'));

const { authenticateToken: protect, requireRole } = require('../middleware/auth');

// Helper to match the 'authorize' signature used in code (authorize('Admin')) 
// or update code to use requireRole(['Admin'])
// Looking at usage: authorize('Admin')
// requireRole expects array: requireRole(['Admin'])
// Let's create a compatibility wrapper locally or just update the usage.
// Updating usage is cleaner. createWarehouse uses authorize('Admin').
// Let's alias requireRole to authorize but we need to check if usage passes string or array.
// Usage is .post(..., authorize('Admin'), ...)
// requireRole expects an array.
// So we need a wrapper: const authorize = (...roles) => requireRole(roles);
const authorize = (...roles) => requireRole(roles);

router
    .route('/')
    .get(protect, getAllWarehouses)
    .post(protect, authorize('Admin'), createWarehouse);

router
    .route('/:id')
    .get(protect, getAllWarehouses)
    .put(protect, authorize('Admin'), updateWarehouse)
    .delete(protect, authorize('Admin'), deleteWarehouse);

module.exports = router;
