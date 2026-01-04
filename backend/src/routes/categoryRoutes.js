const express = require('express');
const router = express.Router();
const categoryController = require('../controllers/categoryController');
const { authenticateToken, requireManagerOrAdmin } = require('../middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');

// All routes require authentication
router.use(authenticateToken);

// Get all categories
router.get('/', categoryController.getAllCategories);

// Create category (Manager/Admin only)
router.post(
  '/',
  requireManagerOrAdmin,
  validateRequest(schemas.createCategory),
  categoryController.createCategory
);

// Update category (Manager/Admin only)
router.put(
  '/:id',
  requireManagerOrAdmin,
  // Schema validation optional or partial
  categoryController.updateCategory
);

// Delete category (Manager/Admin only)
router.delete(
  '/:id',
  requireManagerOrAdmin,
  categoryController.deleteCategory
);

module.exports = router;
