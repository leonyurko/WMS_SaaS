const express = require('express');
const router = express.Router();
const supplierController = require('../controllers/supplierController');
const { authenticateToken, requireManagerOrAdmin, requireAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get all suppliers (Manager/Admin)
router.get('/', requireManagerOrAdmin, supplierController.getAllSuppliers);

// Get supplier by ID (Manager/Admin)
router.get('/:id', requireManagerOrAdmin, supplierController.getSupplierById);

// Create supplier (Admin only)
router.post('/', requireAdmin, supplierController.createSupplier);

// Update supplier (Admin only)
router.put('/:id', requireAdmin, supplierController.updateSupplier);

// Delete supplier (Admin only)
router.delete('/:id', requireAdmin, supplierController.deleteSupplier);

// Send order email to supplier (Manager/Admin)
router.post('/:id/order', requireManagerOrAdmin, supplierController.sendOrderEmail);

// Get supplier orders (Manager/Admin)
router.get('/:id/orders', requireManagerOrAdmin, supplierController.getSupplierOrders);

module.exports = router;
