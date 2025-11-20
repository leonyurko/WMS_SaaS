const { findByUsername, create, countActiveUsers } = require('../models/userModel');
const { comparePassword, generateToken } = require('../utils/auth');

/**
 * Login user
 * POST /api/auth/login
 */
const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    // Find user by username
    const user = await findByUsername(username);
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid username or password'
      });
    }

    // Check if user is active
    if (!user.is_active) {
      return res.status(401).json({
        status: 'error',
        message: 'User account is inactive'
      });
    }

    // Compare password
    console.log(`Attempting login for user: ${username}`);
    console.log(`User found: ${user.username}, Hash: ${user.password_hash}`);
    const isPasswordValid = await comparePassword(password, user.password_hash);
    console.log(`Password valid: ${isPasswordValid}`);
    
    if (!isPasswordValid) {
      return res.status(401).json({
        status: 'error',
        message: 'Invalid username or password'
      });
    }

    // Generate JWT token
    const token = generateToken({
      id: user.id,
      username: user.username,
      role: user.role
    });

    // Return token and user info
    res.json({
      status: 'success',
      data: {
        token,
        user: {
          id: user.id,
          username: user.username,
          email: user.email,
          role: user.role
        }
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Register new user (Admin only)
 * POST /api/auth/register
 */
const register = async (req, res, next) => {
  try {
    const { username, email, password, role } = req.body;

    // Check if max users reached (10 users limit)
    const activeUserCount = await countActiveUsers();
    if (activeUserCount >= 10) {
      return res.status(400).json({
        status: 'error',
        message: 'Maximum number of users (10) reached'
      });
    }

    // Check if username already exists
    const existingUser = await findByUsername(username);
    if (existingUser) {
      return res.status(400).json({
        status: 'error',
        message: 'Username already exists'
      });
    }

    // Create new user
    const newUser = await create({
      username,
      email,
      password,
      role
    });

    res.status(201).json({
      status: 'success',
      data: {
        user: newUser
      }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get current user info
 * GET /api/auth/me
 */
const getCurrentUser = async (req, res, next) => {
  try {
    // User is already attached to req by authenticateToken middleware
    res.json({
      status: 'success',
      data: {
        user: req.user
      }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  login,
  register,
  getCurrentUser
};
