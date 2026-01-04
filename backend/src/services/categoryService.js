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

/**
 * Update category
 */
const updateCategory = async (id, data) => {
  const { name, description, parentId } = data;
  let fields = [];
  let values = [];
  let paramCount = 1;

  if (name !== undefined) {
    fields.push(`name = $${paramCount++}`);
    values.push(name);
  }
  if (description !== undefined) {
    fields.push(`description = $${paramCount++}`);
    values.push(description);
  }
  if (parentId !== undefined) {
    fields.push(`parent_id = $${paramCount++}`);
    values.push(parentId || null);
  }

  values.push(id);

  const result = await query(
    `UPDATE categories SET ${fields.join(', ')} WHERE id = $${paramCount} RETURNING *`,
    values
  );

  return result.rows[0];
};

/**
 * Delete category
 */
const deleteCategory = async (id) => {
  // First check if there are subcategories
  const childrenCheck = await query('SELECT count(*) FROM categories WHERE parent_id = $1', [id]);
  if (parseInt(childrenCheck.rows[0].count) > 0) {
    throw new Error('Cannot delete category with subcategories');
  }

  // Check if there are items
  // Note: Schema says ON DELETE SET NULL, so items won't break, but maybe we want to warn?
  // For now, allow deletion.

  const result = await query('DELETE FROM categories WHERE id = $1', [id]);
  return result.rowCount > 0;
};

module.exports = {
  getAllCategories,
  getCategoryById,
  createCategory,
  updateCategory,
  deleteCategory,
  getCategoriesHierarchical
};
