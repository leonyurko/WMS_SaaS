const express = require('express');
const router = express.Router();
const transactionController = require('../controllers/transactionController');
const { authenticateToken, requireManagerOrAdmin } = require('../middleware/auth');

// All routes require authentication and Manager/Admin role
router.use(authenticateToken);
router.use(requireManagerOrAdmin);

// Get all transactions with filters
router.get('/', transactionController.getAllTransactions);

// Get transaction by ID
router.get('/:id', transactionController.getTransactionById);

module.exports = router;
