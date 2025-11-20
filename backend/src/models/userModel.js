const { query } = require('../config/database');
const { hashPassword } = require('../utils/auth');

/**
 * Find user by username
 * @param {string} username
 * @returns {Promise<object|null>} User object or null
 */
const findByUsername = async (username) => {
  const result = await query(
    'SELECT * FROM users WHERE username = $1',
    [username]
  );
  return result.rows[0] || null;
};

/**
 * Find user by email
 * @param {string} email
 * @returns {Promise<object|null>} User object or null
 */
const findByEmail = async (email) => {
  const result = await query(
    'SELECT * FROM users WHERE email = $1',
    [email]
  );
  return result.rows[0] || null;
};

/**
 * Find user by ID
 * @param {string} id - User UUID
 * @returns {Promise<object|null>} User object or null
 */
const findById = async (id) => {
  const result = await query(
    'SELECT id, username, email, role, is_active, created_at, updated_at FROM users WHERE id = $1',
    [id]
  );
  return result.rows[0] || null;
};

/**
 * Get all users
 * @returns {Promise<Array>} Array of user objects
 */
const findAll = async () => {
  const result = await query(
    'SELECT id, username, email, role, is_active, created_at, updated_at FROM users ORDER BY created_at DESC'
  );
  return result.rows;
};

/**
 * Create a new user
 * @param {object} userData - User data
 * @returns {Promise<object>} Created user object
 */
const create = async (userData) => {
  const { username, email, password, role } = userData;
  
  // Hash password
  const passwordHash = await hashPassword(password);
  
  const result = await query(
    `INSERT INTO users (username, email, password_hash, role) 
     VALUES ($1, $2, $3, $4) 
     RETURNING id, username, email, role, is_active, created_at, updated_at`,
    [username, email, passwordHash, role]
  );
  
  return result.rows[0];
};

/**
 * Update user
 * @param {string} id - User UUID
 * @param {object} updates - Fields to update
 * @returns {Promise<object>} Updated user object
 */
const update = async (id, updates) => {
  const fields = [];
  const values = [];
  let paramCount = 1;

  // Build dynamic update query
  if (updates.role !== undefined) {
    fields.push(`role = $${paramCount++}`);
    values.push(updates.role);
  }
  if (updates.isActive !== undefined) {
    fields.push(`is_active = $${paramCount++}`);
    values.push(updates.isActive);
  }
  if (updates.email !== undefined) {
    fields.push(`email = $${paramCount++}`);
    values.push(updates.email);
  }

  if (fields.length === 0) {
    throw new Error('No fields to update');
  }

  values.push(id);
  
  const result = await query(
    `UPDATE users SET ${fields.join(', ')} 
     WHERE id = $${paramCount} 
     RETURNING id, username, email, role, is_active, created_at, updated_at`,
    values
  );
  
  return result.rows[0];
};

/**
 * Delete user
 * @param {string} id - User UUID
 * @returns {Promise<boolean>} True if deleted
 */
const deleteUser = async (id) => {
  const result = await query(
    'DELETE FROM users WHERE id = $1',
    [id]
  );
  return result.rowCount > 0;
};

/**
 * Count active users
 * @returns {Promise<number>} Number of active users
 */
const countActiveUsers = async () => {
  const result = await query(
    'SELECT COUNT(*) as count FROM users WHERE is_active = true'
  );
  return parseInt(result.rows[0].count);
};

module.exports = {
  findByUsername,
  findByEmail,
  findById,
  findAll,
  create,
  update,
  deleteUser,
  countActiveUsers
};
