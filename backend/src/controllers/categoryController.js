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

/**
 * Update category
 * PUT /api/categories/:id
 */
const updateCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const category = await categoryService.updateCategory(id, req.body);

    if (!category) {
      return res.status(404).json({
        status: 'error',
        message: 'Category not found'
      });
    }

    res.json({
      status: 'success',
      data: { category }
    });
  } catch (error) {
    next(error);
  }
};

/**
 * Delete category
 * DELETE /api/categories/:id
 */
const deleteCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    await categoryService.deleteCategory(id);

    res.json({
      status: 'success',
      message: 'Category deleted successfully'
    });
  } catch (error) {
    if (error.message.includes('subcategories')) {
      return res.status(400).json({
        status: 'error',
        message: error.message
      });
    }
    next(error);
  }
};

module.exports = {
  getAllCategories,
  createCategory,
  updateCategory,
  deleteCategory
};
