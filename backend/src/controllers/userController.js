const userService = require('../services/userService');

/**
 * Get all users
 * GET /api/users
 */
const getAllUsers = async (req, res, next) => {
  try {
    const users = await userService.getAllUsers();
    
    res.json({
      status: 'success',
      data: { users }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update user
 * PUT /api/users/:id
 */
const updateUser = async (req, res, next) => {
  try {
    const { id } = req.params;
    const updates = req.body;

    const user = await userService.updateUser(id, updates);

    res.json({
      status: 'success',
      data: { user }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete user
 * DELETE /api/users/:id
 */
const deleteUser = async (req, res, next) => {
  try {
    const { id } = req.params;

    await userService.deleteUser(id);

    res.json({
      status: 'success',
      message: 'User deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllUsers,
  updateUser,
  deleteUser
};
