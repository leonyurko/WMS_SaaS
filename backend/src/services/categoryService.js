const { query } = require('../config/database');

/**
 * Get all categories
 */
const getAllCategories = async () => {
  const result = await query(
    `SELECT 
      c.*,
      p.name as parent_name
    FROM categories c
    LEFT JOIN categories p ON c.parent_id = p.id
    ORDER BY c.parent_id NULLS FIRST, c.name`
  );

  return result.rows;
};

/**
 * Get category by ID
 */
const getCategoryById = async (id) => {
  const result = await query(
    `SELECT 
      c.*,
      p.name as parent_name
    FROM categories c
    LEFT JOIN categories p ON c.parent_id = p.id
    WHERE c.id = $1`,
    [id]
  );

  return result.rows[0] || null;
};

/**
 * Create new category
 */
const createCategory = async (data) => {
  const { name, description, parentId } = data;

  const result = await query(
    `INSERT INTO categories (name, description, parent_id)
     VALUES ($1, $2, $3)
     RETURNING *`,
    [name, description || null, parentId || null]
  );

  return result.rows[0];
};

/**
 * Get categories with subcategories (hierarchical)
 */
const getCategoriesHierarchical = async () => {
  // Get all categories
  const allCategories = await getAllCategories();

  // Separate parent categories and subcategories
  const parents = allCategories.filter(cat => !cat.parent_id);
  const children = allCategories.filter(cat => cat.parent_id);

  // Build hierarchical structure
  const hierarchical = parents.map(parent => ({
    ...parent,
    subcategories: children.filter(child => child.parent_id === parent.id)
  }));

  return hierarchical;
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  getCategoriesHierarchical
};
