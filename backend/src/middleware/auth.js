const { verifyToken } = require('../utils/auth');
const { findById } = require('../models/userModel');
const { hasPageAccess } = require('../models/permissionsModel');

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

/**
 * Middleware to check if user has access to a specific page
 * @param {string} pageKey - Key of the page to check
 */
const requirePageAccess = (pageKey) => {
  return async (req, res, next) => {
    try {
      if (!req.user) {
        return res.status(401).json({
          status: 'error',
          message: 'Authentication required'
        });
      }

      const hasAccess = await hasPageAccess(req.user.id, req.user.role, pageKey);

      if (!hasAccess) {
        return res.status(403).json({
          status: 'error',
          message: 'Insufficient permissions'
        });
      }

      next();
    } catch (error) {
      console.error('Permission check error:', error);
      return res.status(500).json({
        status: 'error',
        message: 'Internal server error'
      });
    }
  };
};

module.exports = {
  authenticateToken,
  requireRole,
  requireAdmin,
  requireAdmin,
  requireManagerOrAdmin,
  requirePageAccess
};
