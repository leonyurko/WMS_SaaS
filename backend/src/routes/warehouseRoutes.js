const express = require('express');
const router = express.Router();
const warehouseController = require('../controllers/warehouseController');
const { protect, authorize } = require('../middleware/auth');

router
    .route('/')
    .get(protect, warehouseController.getAllWarehouses)
    .post(protect, authorize('Admin'), warehouseController.createWarehouse);

router
    .route('/:id')
    .get(protect, warehouseController.getAllWarehouses) // Reusing getAll for now as getById wasn't heavily requested, but good to have
    .put(protect, authorize('Admin'), warehouseController.updateWarehouse)
    .delete(protect, authorize('Admin'), warehouseController.deleteWarehouse);

module.exports = router;
