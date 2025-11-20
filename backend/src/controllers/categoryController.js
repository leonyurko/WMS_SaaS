const categoryService = require('../services/categoryService');

/**
 * Get all categories
 * GET /api/categories
 */
const getAllCategories = async (req, res, next) => {
  try {
    const hierarchical = req.query.hierarchical === 'true';

    const categories = hierarchical
      ? await categoryService.getCategoriesHierarchical()
      : await categoryService.getAllCategories();

    res.json({
      status: 'success',
      data: { categories }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Create category
 * POST /api/categories
 */
const createCategory = async (req, res, next) => {
  try {
    const category = await categoryService.createCategory(req.body);

    res.status(201).json({
      status: 'success',
      data: { category }
    });
  } catch (error) {
    next(error);
  }
};

module.exports = {
  getAllCategories,
  createCategory
};
