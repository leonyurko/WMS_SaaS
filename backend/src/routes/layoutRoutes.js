const express = require('express');
const router = express.Router();
const layoutController = require('../controllers/layoutController');
const { authenticateToken, authorize } = require('../middleware/auth');

// Protect all routes
router.use(authenticateToken);

// Get all layouts
router.get('/', layoutController.getLayout);

// Get specific layout
router.get('/:name', layoutController.getLayout);

// Save layout (Admin/Manager only)
router.post('/', authorize(['Admin', 'Manager']), layoutController.saveLayout);

module.exports = router;
