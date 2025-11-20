const emailFormatService = require('../services/emailFormatService');

/**
 * Get all email formats
 * GET /api/email-formats
 */
const getAllFormats = async (req, res, next) => {
  try {
    const formats = await emailFormatService.getAllFormats();

    res.json({
      status: 'success',
      data: { formats }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Get format by ID
 * GET /api/email-formats/:id
 */
const getFormatById = async (req, res, next) => {
  try {
    const { id } = req.params;
    const format = await emailFormatService.getFormatById(id);

    if (!format) {
      return res.status(404).json({
        status: 'error',
        message: 'Email format not found'
      });
    }

    res.json({
      status: 'success',
      data: { format }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create email format
 * POST /api/email-formats
 */
const createFormat = async (req, res, next) => {
  try {
    const userId = req.user.id;
    const format = await emailFormatService.createFormat({
      ...req.body,
      createdBy: userId
    });

    res.status(201).json({
      status: 'success',
      data: { format }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Update email format
 * PUT /api/email-formats/:id
 */
const updateFormat = async (req, res, next) => {
  try {
    const { id } = req.params;

    const existingFormat = await emailFormatService.getFormatById(id);
    if (!existingFormat) {
      return res.status(404).json({
        status: 'error',
        message: 'Email format not found'
      });
    }

    const format = await emailFormatService.updateFormat(id, req.body);

    res.json({
      status: 'success',
      data: { format }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete email format
 * DELETE /api/email-formats/:id
 */
const deleteFormat = async (req, res, next) => {
  try {
    const { id } = req.params;

    const deleted = await emailFormatService.deleteFormat(id);

    if (!deleted) {
      return res.status(404).json({
        status: 'error',
        message: 'Email format not found'
      });
    }

    res.json({
      status: 'success',
      message: 'Email format deleted successfully'
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllFormats,
  getFormatById,
  createFormat,
  updateFormat,
  deleteFormat
};
