const express = require('express');
const router = express.Router();
const authController = require('../controllers/authController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');

// Public routes
router.post('/login', validateRequest(schemas.login), authController.login);

// Protected routes
router.get('/me', authenticateToken, authController.getCurrentUser);

// Admin only routes
router.post(
  '/register',
  authenticateToken,
  requireAdmin,
  validateRequest(schemas.register),
  authController.register
);

module.exports = router;
