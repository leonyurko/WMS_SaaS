const userModel = require('../models/userModel');

/**
 * Get all users
 */
const getAllUsers = async () => {
  return await userModel.findAll();
};

/**
 * Get user by ID
 */
const getUserById = async (id) => {
  return await userModel.findById(id);
};

/**
 * Create new user
 */
const createUser = async (userData) => {
  // Check user limit
  const activeCount = await userModel.countActiveUsers();
  if (activeCount >= 10) {
    throw new Error('Maximum number of users (10) reached');
  }

  // Check if username exists
  const existing = await userModel.findByUsername(userData.username);
  if (existing) {
    throw new Error('Username already exists');
  }

  // Check if email exists
  const existingEmail = await userModel.findByEmail(userData.email);
  if (existingEmail) {
    throw new Error('Email already exists');
  }

  return await userModel.create(userData);
};

/**
 * Update user
 */
const updateUser = async (id, updates) => {
  const user = await userModel.findById(id);
  if (!user) {
    throw new Error('User not found');
  }

  return await userModel.update(id, updates);
};

/**
 * Delete user
 */
const deleteUser = async (id) => {
  const user = await userModel.findById(id);
  if (!user) {
    throw new Error('User not found');
  }

  return await userModel.deleteUser(id);
};

module.exports = {
  getAllUsers,
  getUserById,
  createUser,
  updateUser,
  deleteUser
};
