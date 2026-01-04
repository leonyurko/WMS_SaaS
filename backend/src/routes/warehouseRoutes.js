const express = require('express');
const router = express.Router();
const {
    getAllWarehouses,
    createWarehouse,
    updateWarehouse,
    deleteWarehouse
} = require('../controllers/warehouseController');
const { protect, authorize } = require('../middleware/auth');

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
