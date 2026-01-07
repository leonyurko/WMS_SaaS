const express = require('express');
const router = express.Router();
const settingsController = require('../controllers/settingsController');
const { authenticateToken, requireRole } = require('../middleware/auth');

// All routes require authentication and Admin role
router.use(authenticateToken);
router.use(requireRole(['Admin']));

router.get('/', settingsController.getSettings);
router.put('/', settingsController.updateSettings);

module.exports = router;
