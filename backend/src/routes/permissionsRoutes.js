const express = require('express');
const router = express.Router();
const permissionsController = require('../controllers/permissionsController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');

// All routes require authentication
router.use(authenticateToken);

// Get current user's permissions (accessible to all authenticated users)
router.get('/me', permissionsController.getMyPermissions);

// Get permissions for a specific user (Admin only)
router.get('/:userId', requireAdmin, permissionsController.getUserPermissions);

// Update permissions for a user (Admin only)
router.put('/:userId', requireAdmin, permissionsController.updateUserPermissions);

module.exports = router;
