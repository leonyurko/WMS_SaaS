const Joi = require('joi');

/**
 * Middleware to validate request body against Joi schema
 * @param {Joi.Schema} schema - Joi validation schema
 */
const validateRequest = (schema) => {
  return (req, res, next) => {
    const { error, value } = schema.validate(req.body, {
      abortEarly: false, // Return all errors, not just the first one
      stripUnknown: true // Remove unknown fields
    });

    if (error) {
      const errors = error.details.map(detail => ({
        field: detail.path.join('.'),
        message: detail.message
      }));

      return res.status(400).json({
        status: 'error',
        message: 'Validation failed',
        errors
      });
    }

    // Replace req.body with validated and sanitized value
    req.body = value;
    next();
  };
};

/**
 * Validation schemas
 */
const schemas = {
  // Login validation
  login: Joi.object({
    username: Joi.string().required().min(3).max(50),
    password: Joi.string().required().min(6)
  }),

  // User registration validation
  register: Joi.object({
    username: Joi.string().required().min(3).max(50).pattern(/^[a-zA-Z0-9._-]+$/),
    email: Joi.string().required().email(),
    password: Joi.string().required().min(8).max(100),
    role: Joi.string().valid('Admin', 'Manager', 'Staff').required()
  }),

  // User update validation
  updateUser: Joi.object({
    role: Joi.string().valid('Admin', 'Manager', 'Staff'),
    isActive: Joi.boolean(),
    email: Joi.string().email(),
    username: Joi.string().min(3).max(50),
    password: Joi.string().min(6)
  }).min(1),

  // Inventory creation validation
  createInventory: Joi.object({
    name: Joi.string().required().min(1).max(255),
    location: Joi.string().required().min(1).max(100),
    categoryId: Joi.string().uuid().allow(null, ''),
    subCategoryId: Joi.string().uuid().allow(null, ''),
    shelf: Joi.string().max(50).allow(null, ''),
    shelfColumn: Joi.string().allow(null, ''),
    description: Joi.string().allow(null, ''),
    currentStock: Joi.number().integer().min(0).required(),
    minThreshold: Joi.number().integer().min(0).default(10),
    additionalLocations: Joi.alternatives().try(Joi.string(), Joi.array()).allow(null, ''),
    locationDetails: Joi.string().allow(null, '')
  }),

  // Inventory update validation
  updateInventory: Joi.object({
    name: Joi.string().min(1).max(255),
    location: Joi.string().min(1).max(100),
    categoryId: Joi.string().uuid().allow(null, ''),
    subCategoryId: Joi.string().uuid().allow(null, ''),
    shelf: Joi.string().max(50).allow(null, ''),
    shelfColumn: Joi.string().allow(null, ''),
    description: Joi.string().allow(null, ''),
    minThreshold: Joi.number().integer().min(0),
    imageUrl: Joi.string().uri().allow(null, ''),
    imageUrls: Joi.array().items(Joi.string().uri()).allow(null),
    additionalLocations: Joi.alternatives().try(Joi.string(), Joi.array()).allow(null, ''),
    locationDetails: Joi.string().allow(null, '')
  }).min(1),

  // Stock update validation
  updateStock: Joi.object({
    quantity: Joi.number().integer().required(),
    reason: Joi.string().required().min(1).max(500),
    type: Joi.string().valid('addition', 'deduction').required()
  }),

  // Category creation validation
  createCategory: Joi.object({
    name: Joi.string().required().min(1).max(100),
    description: Joi.string().allow(null, ''),
    parentId: Joi.string().uuid().allow(null, '')
  })
};

module.exports = {
  validateRequest,
  schemas
};
