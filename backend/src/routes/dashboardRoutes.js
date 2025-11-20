const express = require('express');
const router = express.Router();
const dashboardController = require('../controllers/dashboardController');
const { authenticateToken } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get dashboard metrics
router.get('/metrics', dashboardController.getMetrics);

module.exports = router;
