const express = require('express');
const router = express.Router();
const userController = require('../controllers/userController');
const { authenticateToken, requireAdmin } = require('../middleware/auth');
const { validateRequest, schemas } = require('../middleware/validation');

// All routes require authentication and Admin role
router.use(authenticateToken);
router.use(requireAdmin);

// Get all users
// Get all users
router.get('/', userController.getAllUsers);

// Create user
router.post('/', validateRequest(schemas.register), userController.createUser);

// Update user
router.put('/:id', validateRequest(schemas.updateUser), userController.updateUser);

// Delete user
router.delete('/:id', userController.deleteUser);

module.exports = router;
