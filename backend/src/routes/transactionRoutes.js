const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticateToken, requirePageAccess } = require('../middleware/auth');

// All routes require authentication and 'inventory-history' page access
router.use(authenticateToken);
router.use(requirePageAccess('inventory-history'));

// Get all transactions with filters
router.get('/', transactionController.getAllTransactions);

// Get transaction by ID
router.get('/:id', transactionController.getTransactionById);

module.exports = router;
