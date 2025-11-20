const { verifyToken } = require('../utils/auth');
const { findById } = require('../models/userModel');

/**
 * Middleware to authenticate JWT token
 * Extracts token from Authorization header and verifies it
 */
const authenticateToken = async (req, res, next) => {
  try {
    // Get token from Authorization header
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      return res.status(401).json({
        status: 'error',
        message: 'Access token is required'
      });
    }

    // Verify token
    const decoded = verifyToken(token);
    
    // Get user from database
    const user = await findById(decoded.userId);
    
    if (!user) {
      return res.status(401).json({
        status: 'error',
        message: 'User not found'
      });
    }

    if (!user.is_active) {
      return res.status(401).json({
        status: 'error',
        message: 'User account is inactive'
      });
    }

    // Attach user to request object
    req.user = {
      id: user.id,
      username: user.username,
      email: user.email,
      role: user.role
    };

    next();
  } catch (error) {
    return res.status(401).json({
      status: 'error',
      message: error.message || 'Invalid or expired token'
    });
  }
};

/**
 * Middleware to check if user has required role
 * @param {Array<string>} roles - Array of allowed roles
 */
const requireRole = (roles) => {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        status: 'error',
        message: 'Authentication required'
      });
    }

    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        status: 'error',
        message: 'Insufficient permissions. Required role: ' + roles.join(' or ')
      });
    }

    next();
  };
};

/**
 * Middleware for Admin-only routes
 */
const requireAdmin = requireRole(['Admin']);

/**
 * Middleware for Manager and Admin routes
 */
const requireManagerOrAdmin = requireRole(['Manager', 'Admin']);

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireManagerOrAdmin
};
